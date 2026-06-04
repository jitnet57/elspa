"""
📌 Financial Error Handlers
📋 목적: 표준화된 에러 응답 포맷
🔧 포함: 커스텀 예외, 에러 응답 모델
"""

from fastapi import HTTPException, status
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """표준화된 에러 응답"""
    error_code: str
    error_message: str
    detail: Optional[str] = None
    field_errors: Optional[Dict[str, str]] = None
    timestamp: Optional[str] = None


class FinancialValidationError(HTTPException):
    """재무 데이터 검증 에러"""
    def __init__(
        self,
        error_code: str,
        error_message: str,
        detail: Optional[str] = None,
        field_errors: Optional[Dict[str, str]] = None
    ):
        self.error_code = error_code
        self.error_message = error_message
        self.detail = detail
        self.field_errors = field_errors

        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": error_code,
                "error_message": error_message,
                "detail": detail,
                "field_errors": field_errors
            }
        )


class InsufficientPermissionError(HTTPException):
    """권한 부족 에러"""
    def __init__(self, action: str, role: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "PERMISSION_DENIED",
                "error_message": f"권한 없음: {action}을(를) 수행할 수 없습니다",
                "detail": f"역할 '{role}'은(는) '{action}' 권한이 없습니다",
                "required_role": "admin or manager"
            }
        )


class ResourceNotFoundError(HTTPException):
    """리소스 미존재 에러"""
    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "RESOURCE_NOT_FOUND",
                "error_message": f"{resource_type} 찾을 수 없음",
                "detail": f"{resource_type} ID: {resource_id}",
            }
        )


class InvalidDateRangeError(HTTPException):
    """날짜 범위 에러"""
    def __init__(self, start_date: str, end_date: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_DATE_RANGE",
                "error_message": "시작 날짜가 종료 날짜보다 늦습니다",
                "detail": f"시작: {start_date}, 종료: {end_date}",
            }
        )


class BudgetExceededError(HTTPException):
    """예산 초과 에러 (경고)"""
    def __init__(self, actual: float, limit: float, over_amount: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "BUDGET_EXCEEDED",
                "error_message": "예산을 초과했습니다",
                "detail": f"예산: ₱{limit:,.2f}, 실제: ₱{actual:,.2f}, 초과액: ₱{over_amount:,.2f}",
            }
        )


class InvalidMonthError(HTTPException):
    """유효하지 않은 월 에러"""
    def __init__(self, month: int):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_MONTH",
                "error_message": f"유효하지 않은 월: {month}",
                "detail": "월은 1~12 사이여야 합니다",
            }
        )


class InvalidYearError(HTTPException):
    """유효하지 않은 연도 에러"""
    def __init__(self, year: int):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_YEAR",
                "error_message": f"유효하지 않은 연도: {year}",
                "detail": "연도는 2000 이상이어야 합니다",
            }
        )
