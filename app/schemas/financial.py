"""Pydantic schemas for financial API endpoints"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.financial import ExpenseCategoryEnum


class ExpenseCategoryResponse(BaseModel):
    """Expense category response schema"""
    id: Optional[int] = None
    name: str
    category_type: ExpenseCategoryEnum
    description: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    """Create new expense"""
    category_id: int
    amount: float
    expense_date: datetime
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    created_by: Optional[str] = None


class ExpenseUpdate(BaseModel):
    """Update expense"""
    category_id: Optional[int] = None
    amount: Optional[float] = None
    expense_date: Optional[datetime] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None


class ExpenseResponse(BaseModel):
    """Expense response schema"""
    id: int
    category_id: int
    amount: float
    expense_date: datetime
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[ExpenseCategoryResponse] = None

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    """Create or update budget"""
    year: int
    month: int
    target_revenue: float
    expense_limit: float
    salary_budget: Optional[float] = None
    indirect_costs_budget: Optional[float] = None
    benefits_budget: Optional[float] = None
    other_budget: Optional[float] = None
    notes: Optional[str] = None


class BudgetResponse(BaseModel):
    """Budget response schema"""
    id: int
    year: int
    month: int
    target_revenue: float
    expense_limit: float
    salary_budget: Optional[float] = None
    indirect_costs_budget: Optional[float] = None
    benefits_budget: Optional[float] = None
    other_budget: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MonthlyRevenueResponse(BaseModel):
    """Monthly revenue response schema"""
    id: int
    year: int
    month: int
    total_revenue: float
    therapist_commission: float
    company_commission: float
    walkup_revenue: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
