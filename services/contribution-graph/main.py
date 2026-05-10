from fastapi import FastAPI, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid

from models.models import ContributionScore, CollaborationEdge, Base
from core.database import engine, get_db

app = FastAPI(title="Contribution Graph Service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[object] = None
    error: Optional[str] = None


class IngestScoresInput(BaseModel):
    period: str
    members: list


class IngestEdgeInput(BaseModel):
    source_member_id: str
    target_member_id: str
    edge_type: str = 'reviewed'
    weight: float = 1.0
    period: Optional[str] = None


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)


def scores_to_dict(s: ContributionScore):
    return {
        "contributorId": s.member_id,
        "contributorName": s.member_name,
        "total_score": s.total_score,
        "dimension_scores": s.dimension_scores or {},
        "period": s.period,
        "weekly_trend": s.weekly_trend or [],
    }


def node_to_dict(s: ContributionScore):
    return {
        "id": s.member_id,
        "contributorId": s.member_id,
        "nodeType": "member",
        "sourcePlatform": "internal",
        "sourceId": s.member_id,
        "title": s.member_name,
        "weight": s.total_score,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
    }


@app.get("/api/v1/contributions/overview")
async def get_overview(db: Session = Depends(get_db)):
    latest_period = db.query(ContributionScore.period).order_by(
        ContributionScore.period.desc()).first()
    if not latest_period:
        return ApiResponse(data=[])
    scores = db.query(ContributionScore).filter(
        ContributionScore.period == latest_period[0]
    ).order_by(ContributionScore.total_score.desc()).all()
    return ApiResponse(data=[scores_to_dict(s) for s in scores])


@app.get("/api/v1/contributions/me")
async def get_my_contributions(db: Session = Depends(get_db)):
    score = db.query(ContributionScore).filter(
        ContributionScore.member_id == 'current-user'
    ).order_by(ContributionScore.period.desc()).first()
    if not score:
        return ApiResponse(data={
            "contributorId": "current-user",
            "contributorName": "当前用户",
            "total_score": 0,
            "dimension_scores": {},
            "weekly_trend": [],
        })
    return ApiResponse(data=scores_to_dict(score))


@app.get("/api/v1/contributions/graph")
async def get_graph(project_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    latest_period = db.query(ContributionScore.period).order_by(
        ContributionScore.period.desc()).first()
    period = latest_period[0] if latest_period else None

    scores = db.query(ContributionScore).all()
    nodes = [node_to_dict(s) for s in scores]

    q = db.query(CollaborationEdge)
    if period:
        q = q.filter(CollaborationEdge.period == period)
    edges = q.all()

    return ApiResponse(data={
        "nodes": nodes,
        "edges": [{
            "id": str(e.id),
            "sourceNodeId": e.source_member_id,
            "targetNodeId": e.target_member_id,
            "edgeType": e.edge_type,
            "weight": e.weight,
        } for e in edges],
        "scores": [scores_to_dict(s) for s in scores],
    })


@app.get("/api/v1/contributions/score/{member_id}")
async def get_member_score(member_id: str, project_id: Optional[str] = Query(None),
                           period: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(ContributionScore).filter(ContributionScore.member_id == member_id)
    if period:
        q = q.filter(ContributionScore.period == period)
    s = q.order_by(ContributionScore.period.desc()).first()

    return ApiResponse(data={
        "memberId": member_id,
        "projectId": project_id,
        "period": s.period if s else (period or datetime.utcnow().strftime("%Y-%m-%d")),
        "score": s.total_score if s else 0,
        "dimensions": s.dimension_scores if s else {},
    })


@app.post("/api/v1/contributions/ingest/scores")
async def ingest_scores(input: IngestScoresInput, db: Session = Depends(get_db)):
    created = []
    for m in input.members:
        existing = db.query(ContributionScore).filter(
            ContributionScore.period == input.period,
            ContributionScore.member_id == m.get("member_id"),
        ).first()
        if existing:
            existing.member_name = m.get("member_name", existing.member_name)
            existing.total_score = m.get("total_score", existing.total_score)
            existing.dimension_scores = m.get("dimension_scores", existing.dimension_scores)
            existing.weekly_trend = m.get("weekly_trend", existing.weekly_trend)
            existing.updated_at = datetime.utcnow()
            created.append(existing.id)
        else:
            s = ContributionScore(
                period=input.period,
                member_id=m["member_id"],
                member_name=m.get("member_name", ""),
                total_score=m.get("total_score", 0),
                dimension_scores=m.get("dimension_scores", {}),
                weekly_trend=m.get("weekly_trend", []),
            )
            db.add(s)
            db.flush()
            created.append(s.id)
    db.commit()
    return ApiResponse(data={"created": len(created)})


@app.post("/api/v1/contributions/ingest/edge")
async def ingest_edge(input: IngestEdgeInput, db: Session = Depends(get_db)):
    e = CollaborationEdge(
        source_member_id=input.source_member_id,
        target_member_id=input.target_member_id,
        edge_type=input.edge_type,
        weight=input.weight,
        period=input.period,
    )
    db.add(e)
    db.commit()
    return ApiResponse(data={"id": e.id})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
