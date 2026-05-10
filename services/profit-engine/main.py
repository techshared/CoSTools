from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, date
import uuid

from models.schemas import ProjectCreate, RevenueCreate, CostCreate, ApiResponse
from models.models import Project, ProjectMember, Revenue, Cost, Distribution, DistributionItem, Base
from core.calculator import ProfitCalculator
from core.database import engine, get_db

app = FastAPI(title="Profit Sharing Engine", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

calculator = ProfitCalculator()


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)


@app.get("/api/v1/projects")
async def list_projects(db: Session = Depends(get_db)):
    items = db.query(Project).all()
    return ApiResponse(data=[{
        "id": str(p.id), "name": p.name, "description": p.description,
        "status": p.status, "total_revenue": float(p.total_revenue or 0),
        "total_cost": float(p.total_cost or 0),
        "reserved_ratio": float(p.reserved_ratio),
        "profit_share_ratio": float(p.profit_share_ratio),
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    } for p in items])


@app.post("/api/v1/projects")
async def create_project(input: ProjectCreate, db: Session = Depends(get_db)):
    p = Project(id=uuid.uuid4(), name=input.name, description=input.description,
                reserved_ratio=input.reserved_ratio,
                profit_share_ratio=input.profit_share_ratio)
    db.add(p)
    db.commit()
    return ApiResponse(data={"id": str(p.id), "name": p.name})


@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return ApiResponse(data={
        "id": str(p.id), "name": p.name, "description": p.description,
        "status": p.status, "total_revenue": float(p.total_revenue or 0),
        "total_cost": float(p.total_cost or 0),
        "reserved_ratio": float(p.reserved_ratio),
        "profit_share_ratio": float(p.profit_share_ratio),
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    })


@app.post("/api/v1/revenues")
async def add_revenue(input: RevenueCreate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == input.project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    r = Revenue(id=uuid.uuid4(), project_id=input.project_id,
                amount=input.amount,
                received_at=datetime.strptime(input.received_at, "%Y-%m-%d").date(),
                milestone=input.milestone)
    p.total_revenue = (p.total_revenue or 0) + input.amount
    db.add(r)
    db.commit()
    return ApiResponse(data={"id": str(r.id), "amount": float(r.amount)})


@app.post("/api/v1/costs")
async def add_cost(input: CostCreate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == input.project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    c = Cost(id=uuid.uuid4(), project_id=input.project_id,
             category=input.category, amount=input.amount,
             description=input.description,
             incurred_at=datetime.strptime(input.incurred_at, "%Y-%m-%d").date())
    p.total_cost = (p.total_cost or 0) + input.amount
    db.add(c)
    db.commit()
    return ApiResponse(data={"id": str(c.id), "amount": float(c.amount)})


@app.post("/api/v1/projects/{project_id}/distribute")
async def distribute(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    pool = calculator.calculate_pool(p.total_revenue or 0, p.total_cost or 0,
                                     p.reserved_ratio, p.profit_share_ratio)
    project_members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id).all()

    d_scores = {str(m.member_id): 0.6 for m in project_members}
    p_scores = {str(m.member_id): 0.5 for m in project_members}
    hrs = {str(m.member_id): 1.0 for m in project_members}

    weights, total_weight = calculator.calculate_weights(project_members, d_scores, p_scores, hrs)
    items = calculator.distribute(pool, weights, total_weight)

    dist = Distribution(id=uuid.uuid4(), project_id=project_id,
                        total_profit=pool, total_pool=pool,
                        calculated_at=datetime.utcnow(), status='pending')
    db.add(dist)
    db.flush()

    for item in items:
        di = DistributionItem(id=uuid.uuid4(), distribution_id=dist.id,
                              member_id=item['member_id'],
                              member_name=next((m.member_name for m in project_members if str(m.member_id) == item['member_id']), ''),
                              weight=item['weight'],
                              weight_detail=item.get('weight_detail', {}),
                              amount=item['amount'], status='pending')
        db.add(di)

    db.commit()
    return ApiResponse(data={
        "distribution_id": str(dist.id),
        "total_pool": float(pool),
        "items": [{"member_id": i['member_id'], "amount": i['amount'], "weight": i['weight']} for i in items]
    })


@app.get("/api/v1/projects/{project_id}/distributions")
async def get_distributions(project_id: str, db: Session = Depends(get_db)):
    dists = db.query(Distribution).filter(Distribution.project_id == project_id).all()
    result = []
    for d in dists:
        items = db.query(DistributionItem).filter(
            DistributionItem.distribution_id == d.id).all()
        result.append({
            "id": str(d.id), "total_profit": float(d.total_profit or 0),
            "total_pool": float(d.total_pool or 0), "status": d.status,
            "calculated_at": d.calculated_at.isoformat() if d.calculated_at else None,
            "items": [{"member_id": i.member_id, "member_name": i.member_name,
                       "amount": float(i.amount or 0), "status": i.status} for i in items]
        })
    return ApiResponse(data=result)


@app.get("/api/v1/members/{member_id}/earnings")
async def get_earnings(member_id: str, db: Session = Depends(get_db)):
    items = db.query(DistributionItem).filter(
        DistributionItem.member_id == member_id).all()
    return ApiResponse(data=[{
        "id": str(i.id), "distribution_id": str(i.distribution_id),
        "amount": float(i.amount or 0), "status": i.status,
        "weight_detail": i.weight_detail
    } for i in items])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
