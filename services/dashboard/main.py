from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from typing import Optional, List
from pydantic import BaseModel

from models.models import OverviewMetric, MemberMetric, Base
from core.database import engine, get_db

app = FastAPI(title="Autonomy Dashboard Service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[object] = None
    error: Optional[str] = None


class IngestOverviewInput(BaseModel):
    team_id: str = 'default'
    week_start: str
    team_health_score: float
    okr_completion_rate: float
    task_completion_rate: float
    active_members: int
    collaboration_density: float
    ai_insight: Optional[str] = None


class IngestMemberInput(BaseModel):
    member_id: str
    week_start: str
    okr_progress: Optional[float] = None
    task_completion_rate: Optional[float] = None
    doc_contributions: Optional[int] = None
    code_contributions: Optional[int] = None
    collaboration_score: Optional[float] = None


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)


@app.get("/api/v1/dashboard/overview")
async def get_overview(db: Session = Depends(get_db)):
    latest = db.query(OverviewMetric).order_by(
        OverviewMetric.week_start.desc()).first()
    if not latest:
        return ApiResponse(data={
            "team_health_score": 0,
            "okr_completion_rate": 0,
            "task_completion_rate": 0,
            "active_members": 0,
            "collaboration_density": 0,
            "ai_insight": None,
            "weekly_trends": { "okr": [], "task": [], "doc": [], "collaboration": [] },
        })

    trends = db.query(OverviewMetric).order_by(
        OverviewMetric.week_start.asc()).limit(14).all()

    def trend(field):
        return [
            {"time": t.week_start.isoformat(),
             "value": round(getattr(t, field) or 0, 2)}
            for t in trends
        ]

    return ApiResponse(data={
        "team_health_score": latest.team_health_score or 0,
        "okr_completion_rate": latest.okr_completion_rate or 0,
        "task_completion_rate": latest.task_completion_rate or 0,
        "active_members": latest.active_members or 0,
        "collaboration_density": latest.collaboration_density or 0,
        "ai_insight": latest.ai_insight,
        "weekly_trends": {
            "okr": trend("okr_completion_rate"),
            "task": trend("task_completion_rate"),
            "doc": trend("collaboration_density"),
            "collaboration": trend("collaboration_density"),
        }
    })


@app.get("/api/v1/dashboard/team/{team_id}")
async def get_team_dashboard(team_id: str, db: Session = Depends(get_db)):
    latest = db.query(OverviewMetric).filter(
        OverviewMetric.team_id == team_id
    ).order_by(OverviewMetric.week_start.desc()).first()

    history = db.query(OverviewMetric).filter(
        OverviewMetric.team_id == team_id
    ).order_by(OverviewMetric.week_start.asc()).limit(30).all()

    return ApiResponse(data={
        "team_id": team_id,
        "team_name": f"团队 {team_id[:8]}",
        "metrics": {
            "okr_completion_rate": latest.okr_completion_rate if latest else 0,
            "task_completion_rate": latest.task_completion_rate if latest else 0,
            "doc_activity": latest.active_members if latest else 0,
            "code_commits": 0,
            "meeting_hours_per_person": 0,
        },
        "history": {
            "okr": [{"time": h.week_start.isoformat(), "value": h.okr_completion_rate or 0} for h in history]
        }
    })


@app.get("/api/v1/dashboard/me")
async def get_my_dashboard(db: Session = Depends(get_db)):
    latest = db.query(MemberMetric).filter(
        MemberMetric.member_id == 'current-user'
    ).order_by(MemberMetric.week_start.desc()).first()

    trends = db.query(MemberMetric).filter(
        MemberMetric.member_id == 'current-user'
    ).order_by(MemberMetric.week_start.asc()).limit(14).all()

    return ApiResponse(data={
        "member_id": "current-user",
        "member_name": "当前用户",
        "okr_progress": latest.okr_progress if latest else 0,
        "task_completion_rate": latest.task_completion_rate if latest else 0,
        "doc_contributions": latest.doc_contributions if latest else 0,
        "code_contributions": latest.code_contributions if latest else 0,
        "collaboration_score": latest.collaboration_score if latest else 0,
        "trends": {
            "task_completion": [{"time": t.week_start.isoformat(), "value": t.task_completion_rate or 0} for t in trends],
            "doc_contributions": [{"time": t.week_start.isoformat(), "value": t.doc_contributions or 0} for t in trends],
        }
    })


@app.post("/api/v1/dashboard/ingest/overview")
async def ingest_overview(input: IngestOverviewInput, db: Session = Depends(get_db)):
    m = OverviewMetric(
        team_id=input.team_id,
        week_start=datetime.strptime(input.week_start, "%Y-%m-%d").date(),
        team_health_score=input.team_health_score,
        okr_completion_rate=input.okr_completion_rate,
        task_completion_rate=input.task_completion_rate,
        active_members=input.active_members,
        collaboration_density=input.collaboration_density,
        ai_insight=input.ai_insight,
    )
    db.add(m)
    db.commit()
    return ApiResponse(data={"id": m.id})


@app.post("/api/v1/dashboard/ingest/member")
async def ingest_member(input: IngestMemberInput, db: Session = Depends(get_db)):
    m = MemberMetric(
        member_id=input.member_id,
        week_start=datetime.strptime(input.week_start, "%Y-%m-%d").date(),
        okr_progress=input.okr_progress,
        task_completion_rate=input.task_completion_rate,
        doc_contributions=input.doc_contributions,
        code_contributions=input.code_contributions,
        collaboration_score=input.collaboration_score,
    )
    db.add(m)
    db.commit()
    return ApiResponse(data={"id": m.id})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
