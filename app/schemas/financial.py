"""Pydantic schemas for financial API endpoints"""

from pydantic import BaseModel, Field, validator
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
    category_id: int = Field(..., gt=0, description="유효한 카테고리 ID")
    amount: float = Field(..., gt=0, description="지출 금액 (0 초과)")
    expense_date: datetime = Field(..., description="지출 날짜")
    description: Optional[str] = Field(None, max_length=500, description="설명 (최대 500자)")
    receipt_url: Optional[str] = Field(None, max_length=2000, description="영수증 URL")
    created_by: Optional[str] = Field(None, max_length=255, description="작성자")

    @validator("amount")
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("금액은 0보다 커야 합니다")
        if v > 999999999:
            raise ValueError("금액이 너무 큽니다 (최대 999,999,999)")
        return round(v, 2)

    @validator("expense_date")
    def validate_expense_date(cls, v):
        now = datetime.now()
        if v > now:
            raise ValueError("지출 날짜는 현재 시간 이후일 수 없습니다")
        return v


class ExpenseUpdate(BaseModel):
    """Update expense"""
    category_id: Optional[int] = Field(None, gt=0)
    amount: Optional[float] = Field(None, gt=0)
    expense_date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=500)
    receipt_url: Optional[str] = Field(None, max_length=2000)

    @validator("amount", pre=True, always=True)
    def validate_amount(cls, v):
        if v is None:
            return None
        if v <= 0:
            raise ValueError("금액은 0보다 커야 합니다")
        if v > 999999999:
            raise ValueError("금액이 너무 큽니다")
        return round(v, 2)

    @validator("expense_date", pre=True, always=True)
    def validate_expense_date(cls, v):
        if v is None:
            return None
        now = datetime.now()
        if v > now:
            raise ValueError("지출 날짜는 현재 시간 이후일 수 없습니다")
        return v


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
    year: int = Field(..., ge=2000, le=2100, description="연도")
    month: int = Field(..., ge=1, le=12, description="월")
    target_revenue: float = Field(..., ge=0, description="목표 매출")
    expense_limit: float = Field(..., ge=0, description="지출 한도")
    salary_budget: Optional[float] = Field(None, ge=0, description="급여 예산")
    indirect_costs_budget: Optional[float] = Field(None, ge=0, description="간접비 예산")
    benefits_budget: Optional[float] = Field(None, ge=0, description="복리후생 예산")
    other_budget: Optional[float] = Field(None, ge=0, description="기타 예산")
    notes: Optional[str] = Field(None, max_length=1000, description="메모")

    @validator("target_revenue", "expense_limit", "salary_budget",
               "indirect_costs_budget", "benefits_budget", "other_budget",
               pre=True, always=True)
    def validate_amount_fields(cls, v):
        if v is None:
            return None
        if v < 0:
            raise ValueError("예산 금액은 0 이상이어야 합니다")
        if v > 999999999:
            raise ValueError("금액이 너무 큽니다")
        return round(v, 2)

    @validator("month")
    def validate_month(cls, v):
        if not (1 <= v <= 12):
            raise ValueError("월은 1~12 사이여야 합니다")
        return v

    @validator("year")
    def validate_year(cls, v):
        if v < 2000:
            raise ValueError("연도는 2000 이상이어야 합니다")
        return v


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
