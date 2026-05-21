"""
📌 Financial Validation Utilities
📋 목적: 공유 검증 함수들
🔧 포함: 날짜, 금액, 월/연도 검증
"""

from datetime import datetime
from typing import Dict, Optional
from app.utils.errors import (
    InvalidDateRangeError, InvalidMonthError, InvalidYearError,
    BudgetExceededError
)


def validate_date_range(start_date: datetime, end_date: Optional[datetime]) -> None:
    """날짜 범위 검증"""
    if end_date and start_date > end_date:
        raise InvalidDateRangeError(
            start_date.isoformat(),
            end_date.isoformat()
        )


def validate_month(month: int) -> None:
    """월 검증 (1-12)"""
    if not (1 <= month <= 12):
        raise InvalidMonthError(month)


def validate_year(year: int) -> None:
    """연도 검증 (최소 2000)"""
    if year < 2000:
        raise InvalidYearError(year)


def validate_amount(amount: float, field_name: str = "amount") -> None:
    """금액 검증 (양수)"""
    if amount <= 0:
        raise ValueError(f"{field_name}은(는) 0보다 커야 합니다 (입력: {amount})")


def validate_budget_limit(actual_expenses: float, budget_limit: float) -> None:
    """예산 한계 검증"""
    if actual_expenses > budget_limit:
        over_amount = actual_expenses - budget_limit
        raise BudgetExceededError(actual_expenses, budget_limit, over_amount)


def validate_year_month_period(year: int, month: int) -> None:
    """연도-월 기간 검증"""
    validate_year(year)
    validate_month(month)


def format_field_errors(field_errors: Dict[str, str]) -> str:
    """필드 에러 포맷팅"""
    if not field_errors:
        return ""

    errors = [f"  • {field}: {msg}" for field, msg in field_errors.items()]
    return "\n".join(errors)


def validate_budget_period(
    year: int,
    month: int,
    current_date: datetime = None
) -> None:
    """예산 기간 검증 (미래 기간은 제한)"""
    validate_year_month_period(year, month)

    if current_date is None:
        current_date = datetime.now()

    # 최대 6개월 미래까지만 예산 설정 가능
    from dateutil.relativedelta import relativedelta
    max_future = current_date + relativedelta(months=6)

    budget_date = datetime(year, month, 1)
    if budget_date > max_future:
        raise ValueError(
            f"예산은 최대 6개월 미래까지만 설정 가능합니다 (입력: {year}-{month:02d})"
        )
