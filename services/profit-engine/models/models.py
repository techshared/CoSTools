from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import create_engine, Column, String, Text, Numeric, DateTime, Date, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
import uuid

Base = declarative_base()


class Project(Base):
    __tablename__ = 'projects'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default='active')
    total_revenue = Column(Numeric(12, 2), default=0)
    total_cost = Column(Numeric(12, 2), default=0)
    reserved_ratio = Column(Numeric(3, 2), default=Decimal('0.20'))
    profit_share_ratio = Column(Numeric(3, 2), default=Decimal('0.30'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProjectMember(Base):
    __tablename__ = 'project_members'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    member_id = Column(String(100), nullable=False)
    member_name = Column(String(200), nullable=False)
    role = Column(String(50))
    role_coefficient = Column(Numeric(3, 2), default=Decimal('1.0'))
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime)


class Revenue(Base):
    __tablename__ = 'revenues'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    amount = Column(Numeric(12, 2), nullable=False)
    received_at = Column(Date, nullable=False)
    milestone = Column(String(255))


class Cost(Base):
    __tablename__ = 'costs'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    category = Column(String(100))
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text)
    incurred_at = Column(Date)


class Distribution(Base):
    __tablename__ = 'distributions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'))
    total_profit = Column(Numeric(12, 2))
    total_pool = Column(Numeric(12, 2))
    calculated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='pending')
    approved_by = Column(String(100))
    paid_at = Column(DateTime)


class DistributionItem(Base):
    __tablename__ = 'distribution_items'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    distribution_id = Column(UUID(as_uuid=True), ForeignKey('distributions.id'))
    member_id = Column(String(100), nullable=False)
    member_name = Column(String(200))
    weight = Column(Numeric(5, 2))
    weight_detail = Column(JSON)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default='pending')
