"""
Financial dashboard API endpoints for expense tracking and revenue management.
Handles: revenue queries, expense tracking, budget management, expense categories
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.config import get_db
from app.models.financial import (
    Expense, ExpenseCategory, Budget, MonthlyRevenue, ExpenseCategoryEnum
)
from app.schemas.financial import (
    ExpenseCreate, ExpenseUpdate, BudgetCreate, ExpenseCategoryResponse,
    ExpenseResponse, BudgetResponse, MonthlyRevenueResponse
)

router = APIRouter(prefix="/api/admin/financial", tags=["financial"])


# ============================================================
# 📌 Revenue Endpoints
# ============================================================

@router.get("/revenue", response_model=list[MonthlyRevenueResponse])
async def get_monthly_revenue(
    year: int = Query(2026),
    month: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get monthly revenue data for specified period"""
    query = db.query(MonthlyRevenue).filter(MonthlyRevenue.year == year)

    if month:
        query = query.filter(MonthlyRevenue.month == month)

    return query.order_by(MonthlyRevenue.month).all()


@router.get("/revenue/summary")
async def get_revenue_summary(
    year: int = Query(2026),
    db: Session = Depends(get_db)
):
    """Get annual revenue summary"""
    revenues = db.query(MonthlyRevenue).filter(
        MonthlyRevenue.year == year
    ).all()

    total = sum(r.total_revenue for r in revenues)
    avg_monthly = total / 12 if revenues else 0

    return {
        "year": year,
        "total_annual_revenue": total,
        "average_monthly_revenue": avg_monthly,
        "month_count": len(revenues)
    }


# ============================================================
# 📌 Expense Category Endpoints
# ============================================================

@router.get("/categories", response_model=list[ExpenseCategoryResponse])
async def get_expense_categories(
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get all expense categories"""
    query = db.query(ExpenseCategory)

    if active_only:
        query = query.filter(ExpenseCategory.is_active == True)

    return query.order_by(ExpenseCategory.name).all()


@router.post("/categories", response_model=ExpenseCategoryResponse)
async def create_expense_category(
    category: ExpenseCategoryResponse,
    db: Session = Depends(get_db)
):
    """Create new custom expense category"""
    new_category = ExpenseCategory(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category


# ============================================================
# 📌 Expense Endpoints
# ============================================================

@router.get("/expenses", response_model=list[ExpenseResponse])
async def get_expenses(
    year: int = Query(2026),
    month: int = Query(None),
    category_id: int = Query(None),
    limit: int = Query(100),
    skip: int = Query(0),
    db: Session = Depends(get_db)
):
    """Get expense transactions with filters"""
    query = db.query(Expense)

    # Year-Month filter
    if month:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        query = query.filter(
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        )
    else:
        start_date = datetime(year, 1, 1)
        end_date = datetime(year + 1, 1, 1)
        query = query.filter(
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        )

    # Category filter
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    return query.order_by(Expense.expense_date.desc()).offset(skip).limit(limit).all()


@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db)
):
    """Add new expense transaction"""
    # Verify category exists
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == expense.category_id
    ).first()

    if not category:
        raise ValueError(f"Category {expense.category_id} not found")

    new_expense = Expense(**expense.dict())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    """Update existing expense"""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not db_expense:
        raise ValueError(f"Expense {expense_id} not found")

    for field, value in expense.dict(exclude_unset=True).items():
        setattr(db_expense, field, value)

    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete expense transaction"""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not db_expense:
        raise ValueError(f"Expense {expense_id} not found")

    db.delete(db_expense)
    db.commit()
    return {"deleted": True, "id": expense_id}


# ============================================================
# 📌 Budget Endpoints
# ============================================================

@router.get("/budget", response_model=list[BudgetResponse])
async def get_budgets(
    year: int = Query(2026),
    month: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get budget targets"""
    query = db.query(Budget).filter(Budget.year == year)

    if month:
        query = query.filter(Budget.month == month)

    return query.order_by(Budget.month).all()


@router.post("/budget", response_model=BudgetResponse)
async def set_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db)
):
    """Create or update monthly budget"""
    existing = db.query(Budget).filter(
        Budget.year == budget.year,
        Budget.month == budget.month
    ).first()

    if existing:
        for field, value in budget.dict().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    new_budget = Budget(**budget.dict())
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


# ============================================================
# 📌 Trends & Analytics
# ============================================================

@router.get("/trends/expenses-by-category")
async def get_expense_trends_by_category(
    year: int = Query(2026),
    month: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get expense breakdown by category"""
    query = db.query(
        ExpenseCategory.name,
        Expense.category_id
    ).join(Expense, ExpenseCategory.id == Expense.category_id)

    # Build date filter
    if month:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
    else:
        start_date = datetime(year, 1, 1)
        end_date = datetime(year + 1, 1, 1)

    query = query.filter(
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    )

    results = db.query(
        ExpenseCategory.name,
        db.func.sum(Expense.amount).label("total")
    ).join(Expense, ExpenseCategory.id == Expense.category_id).filter(
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).group_by(ExpenseCategory.id, ExpenseCategory.name).all()

    return [{"category": r[0], "amount": float(r[1] or 0)} for r in results]


@router.get("/comparison")
async def get_budget_vs_actual(
    year: int = Query(2026),
    month: int = Query(None),
    db: Session = Depends(get_db)
):
    """Compare budget targets vs actual expenses"""
    if not month:
        month = datetime.now().month

    budget = db.query(Budget).filter(
        Budget.year == year,
        Budget.month == month
    ).first()

    # Calculate actual expenses for the month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    actual_expenses = db.query(
        db.func.sum(Expense.amount)
    ).filter(
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).scalar() or 0

    return {
        "year": year,
        "month": month,
        "budget_limit": budget.expense_limit if budget else 0,
        "actual_expenses": float(actual_expenses),
        "remaining": (budget.expense_limit - actual_expenses) if budget else 0,
        "percentage": ((actual_expenses / budget.expense_limit) * 100) if budget and budget.expense_limit > 0 else 0
    }
