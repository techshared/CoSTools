from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class OverviewMetric(Base):
    __tablename__ = 'dashboard_overview'
    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String(100), default='default', index=True)
    week_start = Column(Date, nullable=False)
    team_health_score = Column(Float)
    okr_completion_rate = Column(Float)
    task_completion_rate = Column(Float)
    active_members = Column(Integer)
    collaboration_density = Column(Float)
    ai_insight = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MemberMetric(Base):
    __tablename__ = 'dashboard_member_metrics'
    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(String(100), nullable=False, index=True)
    week_start = Column(Date, nullable=False)
    okr_progress = Column(Float)
    task_completion_rate = Column(Float)
    doc_contributions = Column(Integer, default=0)
    code_contributions = Column(Integer, default=0)
    collaboration_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
