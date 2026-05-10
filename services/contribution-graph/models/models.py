from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class ContributionScore(Base):
    __tablename__ = 'contribution_scores'
    id = Column(Integer, primary_key=True, autoincrement=True)
    period = Column(String(20), nullable=False, index=True)
    member_id = Column(String(100), nullable=False, index=True)
    member_name = Column(String(200), nullable=False)
    total_score = Column(Float, default=0)
    dimension_scores = Column(JSON, default=dict)
    weekly_trend = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CollaborationEdge(Base):
    __tablename__ = 'collaboration_edges'
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_member_id = Column(String(100), nullable=False, index=True)
    target_member_id = Column(String(100), nullable=False, index=True)
    edge_type = Column(String(50), default='reviewed')
    weight = Column(Float, default=0)
    period = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
