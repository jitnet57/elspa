"""
Financial dashboard API endpoints for expense tracking and revenue management.
Handles: revenue queries, expense tracking, budget management, expense categories
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
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
from app.utils.validation import (
    validate_date_range, validate_month, validate_year,
    validate_amount, validate_year_month_period
)
from app.utils.errors import (
    FinancialValidationError, ResourceNotFoundError,
    InvalidDateRangeError, InvalidMonthError, InvalidYearError
)

router = APIRouter(prefix="/api/admin/financial", tags=["financial"])


# ============================================================
# 📌 Revenue Endpoints
# ============================================================

@router.get("/revenue", response_model=list[MonthlyRevenueResponse])
async def get_monthly_revenue(
    year: int = Query(2026, ge=2000, le=2100),
    month: int = Query(None, ge=1, le=12),
    db: Session = Depends(get_db)
):
    """Get monthly revenue data for specified period"""
    try:
        validate_year(year)
        if month:
            validate_month(month)

        query = db.query(MonthlyRevenue).filter(MonthlyRevenue.year == year)

        if month:
            query = query.filter(MonthlyRevenue.month == month)

        return query.order_by(MonthlyRevenue.month).all()
    except (InvalidYearError, InvalidMonthError) as e:
        raise e
    except Exception as e:
        raise FinancialValidationError(
            error_code="QUERY_FAILED",
            error_message="수익 데이터 조회 실패",
            detail=str(e)
        )


@router.get("/revenue/summary")
async def get_revenue_summary(
    year: int = Query(2026, ge=2000, le=2100),
    db: Session = Depends(get_db)
):
    """Get annual revenue summary"""
    try:
        validate_year(year)

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
    except InvalidYearError as e:
        raise e
    except Exception as e:
        raise FinancialValidationError(
            error_code="SUMMARY_FAILED",
            error_message="연간 요약 조회 실패",
            detail=str(e)
        )


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
    try:
        # Verify category exists
        category = db.query(ExpenseCategory).filter(
            ExpenseCategory.id == expense.category_id
        ).first()

        if not category:
            raise ResourceNotFoundError("ExpenseCategory", expense.category_id)

        # Validate amount
        validate_amount(expense.amount, "amount")

        new_expense = Expense(**expense.dict())
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)
        return new_expense
    except (ResourceNotFoundError, ValueError) as e:
        raise e
    except Exception as e:
        db.rollback()
        raise FinancialValidationError(
            error_code="EXPENSE_CREATE_FAILED",
            error_message="지출 생성 실패",
            detail=str(e)
        )


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db)
):
    """Update existing expense"""
    try:
        db_expense = db.query(Expense).filter(Expense.id == expense_id).first()

        if not db_expense:
            raise ResourceNotFoundError("Expense", expense_id)

        # Validate category if provided
        if expense.category_id:
            category = db.query(ExpenseCategory).filter(
                ExpenseCategory.id == expense.category_id
            ).first()
            if not category:
                raise ResourceNotFoundError("ExpenseCategory", expense.category_id)

        # Validate amount if provided
        if expense.amount:
            validate_amount(expense.amount, "amount")

        for field, value in expense.dict(exclude_unset=True).items():
            setattr(db_expense, field, value)

        db.commit()
        db.refresh(db_expense)
        return db_expense
    except (ResourceNotFoundError, ValueError) as e:
        raise e
    except Exception as e:
        db.rollback()
        raise FinancialValidationError(
            error_code="EXPENSE_UPDATE_FAILED",
            error_message="지출 수정 실패",
            detail=str(e)
        )


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete expense transaction"""
    try:
        db_expense = db.query(Expense).filter(Expense.id == expense_id).first()

        if not db_expense:
            raise ResourceNotFoundError("Expense", expense_id)

        db.delete(db_expense)
        db.commit()
        return {"deleted": True, "id": expense_id}
    except ResourceNotFoundError as e:
        raise e
    except Exception as e:
        db.rollback()
        raise FinancialValidationError(
            error_code="EXPENSE_DELETE_FAILED",
            error_message="지출 삭제 실패",
            detail=str(e)
        )


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
    try:
        validate_year_month_period(budget.year, budget.month)

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
    except (InvalidYearError, InvalidMonthError) as e:
        raise e
    except Exception as e:
        db.rollback()
        raise FinancialValidationError(
            error_code="BUDGET_SET_FAILED",
            error_message="예산 설정 실패",
            detail=str(e)
        )


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
