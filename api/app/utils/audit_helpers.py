"""
📌 Audit Integration Helpers
📋 목적: 재무 API에 감사 로그 통합하기 위한 헬퍼 함수
🔧 포함: 로그 생성 래퍼, 변경 추적 유틸리티
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditActionEnum
from app.services.audit_service import AuditService
from app.models.financial import Expense, Budget, ExpenseCategory


def log_expense_created(
    db: Session,
    expense: Expense,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """지출 생성 로그"""
    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EXPENSE_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="expense",
        entity_id=expense.id,
        new_value={
            "category_id": expense.category_id,
            "amount": float(expense.amount),
            "expense_date": expense.expense_date.isoformat(),
            "description": expense.description,
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_expense_updated(
    db: Session,
    old_expense: Expense,
    new_expense: Expense,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """지출 수정 로그"""
    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EXPENSE_UPDATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="expense",
        entity_id=old_expense.id,
        old_value={
            "category_id": old_expense.category_id,
            "amount": float(old_expense.amount),
            "expense_date": old_expense.expense_date.isoformat(),
            "description": old_expense.description,
        },
        new_value={
            "category_id": new_expense.category_id,
            "amount": float(new_expense.amount),
            "expense_date": new_expense.expense_date.isoformat(),
            "description": new_expense.description,
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_expense_deleted(
    db: Session,
    expense: Expense,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """지출 삭제 로그"""
    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EXPENSE_DELETED,
        user_id=user_id,
        user_email=user_email,
        entity_type="expense",
        entity_id=expense.id,
        old_value={
            "category_id": expense.category_id,
            "amount": float(expense.amount),
            "expense_date": expense.expense_date.isoformat(),
            "description": expense.description,
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_budget_set(
    db: Session,
    budget: Budget,
    user_id: str,
    user_email: Optional[str] = None,
    is_update: bool = False,
    old_budget: Optional[Budget] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """예산 설정/수정 로그"""
    action = AuditActionEnum.BUDGET_UPDATED if is_update else AuditActionEnum.BUDGET_SET

    old_value = None
    if old_budget:
        old_value = {
            "target_revenue": float(old_budget.target_revenue),
            "expense_limit": float(old_budget.expense_limit),
            "salary_budget": float(old_budget.salary_budget) if old_budget.salary_budget else None,
            "indirect_costs_budget": float(old_budget.indirect_costs_budget) if old_budget.indirect_costs_budget else None,
            "benefits_budget": float(old_budget.benefits_budget) if old_budget.benefits_budget else None,
            "other_budget": float(old_budget.other_budget) if old_budget.other_budget else None,
        }

    AuditService.log_action(
        db=db,
        action=action,
        user_id=user_id,
        user_email=user_email,
        entity_type="budget",
        entity_id=budget.id,
        old_value=old_value,
        new_value={
            "year": budget.year,
            "month": budget.month,
            "target_revenue": float(budget.target_revenue),
            "expense_limit": float(budget.expense_limit),
            "salary_budget": float(budget.salary_budget) if budget.salary_budget else None,
            "indirect_costs_budget": float(budget.indirect_costs_budget) if budget.indirect_costs_budget else None,
            "benefits_budget": float(budget.benefits_budget) if budget.benefits_budget else None,
            "other_budget": float(budget.other_budget) if budget.other_budget else None,
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_category_created(
    db: Session,
    category: ExpenseCategory,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """카테고리 생성 로그"""
    AuditService.log_action(
        db=db,
        action=AuditActionEnum.CATEGORY_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="category",
        entity_id=category.id,
        new_value={
            "name": category.name,
            "category_type": category.category_type.value,
            "description": category.description,
            "is_active": category.is_active,
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_revenue_recorded(
    db: Session,
    year: int,
    month: int,
    total_revenue: float,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """수익 기록 로그"""
    AuditService.log_action(
        db=db,
        action=AuditActionEnum.REVENUE_RECORDED,
        user_id=user_id,
        user_email=user_email,
        entity_type="revenue",
        entity_id=None,
        new_value={
            "year": year,
            "month": month,
            "total_revenue": total_revenue,
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_export_generated(
    db: Session,
    export_format: str,  # 'csv' or 'xlsx'
    row_count: int,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """내보내기 로그"""
    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EXPORT_GENERATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="export",
        entity_id=None,
        new_value={
            "format": export_format,
            "row_count": row_count,
            "timestamp": str(db.func.now()),
        },
        ip_address=ip_address,
        user_agent=user_agent,
    )


# 사용 예시:
"""
# API 엔드포인트에서 사용
@router.post("/expenses")
async def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = Expense(**expense.dict())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    # 감사 로그 기록
    log_expense_created(
        db=db,
        expense=new_expense,
        user_id="user123",  # 실제로는 JWT 토큰에서 추출
        user_email="user@example.com",
        ip_address=request.client.host,
        user_agent=request.headers.get("User-Agent")
    )

    return new_expense
"""
