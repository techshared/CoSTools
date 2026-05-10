from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    reserved_ratio: Optional[float] = 0.20
    profit_share_ratio: Optional[float] = 0.30


class RevenueCreate(BaseModel):
    project_id: str
    amount: float
    received_at: str
    milestone: str


class CostCreate(BaseModel):
    project_id: str
    category: str
    amount: float
    description: str
    incurred_at: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    total_revenue: float
    total_cost: float
    reserved_ratio: float
    profit_share_ratio: float
    created_at: str
    updated_at: str


class DistributionResponse(BaseModel):
    id: str
    project_id: str
    total_profit: float
    total_pool: float
    calculated_at: str
    status: str


class DistributionItemResponse(BaseModel):
    id: str
    distribution_id: str
    member_id: str
    member_name: str
    weight: float
    weight_detail: dict
    amount: float
    status: str


class ProjectMemberCreate(BaseModel):
    member_id: str
    member_name: str
    role: str
    role_coefficient: float = 1.0


class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[object] = None
    error: Optional[str] = None
