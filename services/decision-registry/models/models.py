from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Decision(Base):
    __tablename__ = 'decisions'
    id = Column(String(36), primary_key=True)
    serial_no = Column(String(20), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    type = Column(String(50), default='other')
    status = Column(String(20), default='draft')
    background = Column(Text, nullable=True)
    options = Column(JSON, default=list)
    decision = Column(Text, nullable=True)
    rationale = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    comment_count = Column(Integer, default=0)
    created_by = Column(String(100), default='current-user')
    created_by_name = Column(String(200), default='当前用户')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Comment(Base):
    __tablename__ = 'comments'
    id = Column(String(36), primary_key=True)
    decision_id = Column(String(36), nullable=False)
    author_id = Column(String(100), default='current-user')
    author_name = Column(String(200), default='当前用户')
    content = Column(Text, nullable=False)
    parent_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
