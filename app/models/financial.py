"""
Financial models: ExpenseCategory, Expense, Budget, MonthlyRevenue
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    ForeignKey, Enum, Boolean, Index
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class ExpenseCategoryEnum(str, enum.Enum):
    SALARY         = "salary"
    INDIRECT_COSTS = "indirect_costs"
    MISCELLANEOUS  = "miscellaneous"
    BENEFITS       = "benefits"
    FUEL           = "fuel"
    BANK_INTEREST  = "bank_interest"
    TAXES          = "taxes"
    OTHER          = "other"


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id            = Column(Integer, primary_key=True)
    name          = Column(String(100), nullable=False, unique=True)
    category_type = Column(Enum(ExpenseCategoryEnum), nullable=False)
    description   = Column(Text, nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    expenses = relationship("Expense", back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id            = Column(Integer, primary_key=True, autoincrement=True)

    # 일일 지출 보고서용
    vendor        = Column(String(200), nullable=True)
    category_name = Column(String(50),  default="other", index=True)  # food, transport…
    report_date   = Column(String(20),  nullable=True,   index=True)  # "2026-05-21"
    items_json    = Column(Text,        nullable=True)                # JSON 문자열 배열
    currency      = Column(String(10),  default="PHP")

    # 공통
    amount        = Column(Float, nullable=False, default=0)
    expense_date  = Column(DateTime, nullable=False, default=datetime.utcnow)
    description   = Column(Text,    nullable=True)
    receipt_url   = Column(String(500), nullable=True)

    # 재무 모듈 연동 (선택)
    category_id   = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    created_by    = Column(String(100), nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("ExpenseCategory", back_populates="expenses")

    __table_args__ = (
        Index("ix_expenses_report_date_cat", "report_date", "category_name"),
    )


class Budget(Base):
    __tablename__ = "budgets"

    id                    = Column(Integer, primary_key=True)
    year                  = Column(Integer, nullable=False)
    month                 = Column(Integer, nullable=False)
    target_revenue        = Column(Float, nullable=False)
    expense_limit         = Column(Float, nullable=False)
    salary_budget         = Column(Float, nullable=True)
    indirect_costs_budget = Column(Float, nullable=True)
    benefits_budget       = Column(Float, nullable=True)
    other_budget          = Column(Float, nullable=True)
    notes                 = Column(Text,  nullable=True)
    created_at            = Column(DateTime, default=datetime.utcnow)
    updated_at            = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MonthlyRevenue(Base):
    __tablename__ = "monthly_revenues"

    id                   = Column(Integer, primary_key=True)
    year                 = Column(Integer, nullable=False)
    month                = Column(Integer, nullable=False)
    total_revenue        = Column(Float, nullable=False, default=0)
    therapist_commission = Column(Float, nullable=False, default=0)
    company_commission   = Column(Float, nullable=False, default=0)
    walkup_revenue       = Column(Float, nullable=False, default=0)
    created_at           = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
