"""
Financial models for expense tracking and budget management.
Includes: ExpenseCategory, Expense, Budget, MonthlyRevenue
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.config import Base


class ExpenseCategoryEnum(str, enum.Enum):
    """Predefined expense categories"""
    SALARY = "salary"
    INDIRECT_COSTS = "indirect_costs"  # rent, electricity, water
    MISCELLANEOUS = "miscellaneous"
    BENEFITS = "benefits"
    FUEL = "fuel"
    BANK_INTEREST = "bank_interest"
    TAXES = "taxes"
    OTHER = "other"


class ExpenseCategory(Base):
    """Expense category master data"""
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    category_type = Column(Enum(ExpenseCategoryEnum), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    expenses = relationship("Expense", back_populates="category")

    def __repr__(self):
        return f"<ExpenseCategory {self.name}>"


class Expense(Base):
    """Individual expense transactions"""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("ExpenseCategory", back_populates="expenses")

    def __repr__(self):
        return f"<Expense {self.amount} on {self.expense_date}>"


class Budget(Base):
    """Monthly budget targets and limits"""
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    target_revenue = Column(Float, nullable=False)
    expense_limit = Column(Float, nullable=False)
    salary_budget = Column(Float, nullable=True)
    indirect_costs_budget = Column(Float, nullable=True)
    benefits_budget = Column(Float, nullable=True)
    other_budget = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Budget {self.year}-{self.month}>"


class MonthlyRevenue(Base):
    """Aggregated monthly revenue data"""
    __tablename__ = "monthly_revenues"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    total_revenue = Column(Float, nullable=False, default=0)
    therapist_commission = Column(Float, nullable=False, default=0)
    company_commission = Column(Float, nullable=False, default=0)
    walkup_revenue = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<MonthlyRevenue {self.year}-{self.month}: {self.total_revenue}>"
