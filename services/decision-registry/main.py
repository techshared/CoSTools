from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
import uuid

from models.models import Decision, Comment, Base
from core.database import engine, get_db

app = FastAPI(title="Decision Registry", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

serial_counter = 0

TYPE_PREFIX = {
    'tech_selection': 'TS', 'product': 'PD', 'hiring': 'HR',
    'process': 'PC', 'strategy': 'SG', 'other': 'OT'
}


class OptionSchema(BaseModel):
    name: str
    pros: str = ''
    cons: str = ''


class CreateDecisionInput(BaseModel):
    title: str
    type: str = 'other'
    background: Optional[str] = None
    options: Optional[List[OptionSchema]] = None
    tags: Optional[List[str]] = None


class AddCommentInput(BaseModel):
    content: str
    parent_id: Optional[str] = None


class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[object] = None
    error: Optional[str] = None


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)
    global serial_counter
    from sqlalchemy import func
    max_serial = db_query_max_serial()
    if max_serial:
        serial_counter = max_serial


def db_query_max_serial():
    try:
        db = next(get_db())
        result = db.query(Decision.serial_no).order_by(Decision.serial_no.desc()).first()
        db.close()
        if result:
            parts = result[0].split('-')
            return int(parts[1])
    except:
        pass
    return 0


def get_db_dep():
    db = SessionLocal = __import__('sqlalchemy.orm').orm.sessionmaker(bind=engine)()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/v1/decisions")
async def create_decision(input: CreateDecisionInput, db: Session = Depends(get_db)):
    global serial_counter
    serial_counter += 1
    prefix = TYPE_PREFIX.get(input.type, 'OT')
    serial = f"{prefix}-{serial_counter:03d}"

    d = Decision(
        id=str(uuid.uuid4()),
        serial_no=serial,
        title=input.title,
        type=input.type,
        status='draft',
        background=input.background,
        options=[o.model_dump() for o in (input.options or [])] if input.options else [],
        decision=None,
        rationale=None,
        tags=input.tags or [],
        comment_count=0,
        created_by='current-user',
        created_by_name='当前用户',
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(d)
    db.commit()
    return ApiResponse(data=decision_to_dict(d))


def decision_to_dict(d: Decision):
    return {
        "id": d.id, "serial_no": d.serial_no, "title": d.title,
        "type": d.type, "status": d.status, "background": d.background,
        "options": d.options or [], "decision": d.decision,
        "rationale": d.rationale, "tags": d.tags or [],
        "comment_count": d.comment_count,
        "created_by": d.created_by, "created_by_name": d.created_by_name,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


def comment_to_dict(c: Comment):
    return {
        "id": c.id, "decision_id": c.decision_id,
        "author_id": c.author_id, "author_name": c.author_name,
        "content": c.content, "parent_id": c.parent_id,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@app.get("/api/v1/decisions")
async def list_decisions(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    total = db.query(Decision).count()
    items = db.query(Decision).order_by(Decision.created_at.desc()).offset(
        (page - 1) * page_size).limit(page_size).all()
    return ApiResponse(data={
        "items": [decision_to_dict(d) for d in items],
        "pagination": {"page": page, "page_size": page_size, "total": total}
    })


@app.get("/api/v1/decisions/search")
async def search_decisions(q: str, db: Session = Depends(get_db)):
    ql = f"%{q}%"
    items = db.query(Decision).filter(
        Decision.title.ilike(ql) | Decision.background.ilike(ql)
    ).order_by(Decision.created_at.desc()).all()
    return ApiResponse(data=[decision_to_dict(d) for d in items])


@app.get("/api/v1/decisions/{decision_id}")
async def get_decision(decision_id: str, db: Session = Depends(get_db)):
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return ApiResponse(data=decision_to_dict(d))


@app.patch("/api/v1/decisions/{decision_id}/status")
async def update_status(decision_id: str, status: str, db: Session = Depends(get_db)):
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404)
    valid = ['draft', 'proposal', 'voting', 'decided', 'implementing', 'closed']
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    d.status = status
    d.updated_at = datetime.utcnow()
    db.commit()
    return ApiResponse(data=decision_to_dict(d))


@app.post("/api/v1/decisions/{decision_id}/comments")
async def add_comment(decision_id: str, input: AddCommentInput, db: Session = Depends(get_db)):
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404)
    c = Comment(
        id=str(uuid.uuid4()),
        decision_id=decision_id,
        author_id='current-user',
        author_name='当前用户',
        content=input.content,
        parent_id=input.parent_id,
        created_at=datetime.utcnow(),
    )
    db.add(c)
    d.comment_count = (d.comment_count or 0) + 1
    db.commit()
    return ApiResponse(data=comment_to_dict(c))


@app.get("/api/v1/decisions/{decision_id}/comments")
async def get_comments(decision_id: str, db: Session = Depends(get_db)):
    items = db.query(Comment).filter(
        Comment.decision_id == decision_id
    ).order_by(Comment.created_at.asc()).all()
    return ApiResponse(data=[comment_to_dict(c) for c in items])


class BotDecisionInput(BaseModel):
    message: str


@app.post("/api/v1/bot/create-decision")
async def bot_create_decision(input: BotDecisionInput, db: Session = Depends(get_db)):
    global serial_counter
    msg = input.message.strip()
    if '：' in msg:
        parts = msg.split('：', 1)
    elif ':' in msg:
        parts = msg.split(':', 1)
    else:
        return ApiResponse(success=False, error='格式：记录决策：标题')

    title = parts[1].strip()
    serial_counter += 1
    serial = f"OT-{serial_counter:03d}"

    d = Decision(
        id=str(uuid.uuid4()),
        serial_no=serial,
        title=title,
        type='other',
        status='draft',
        background=None,
        options=[],
        decision=None,
        rationale=None,
        tags=[],
        comment_count=0,
        created_by='bot',
        created_by_name='Bot',
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(d)
    db.commit()
    return ApiResponse(data=decision_to_dict(d))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
