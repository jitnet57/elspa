"""
SSS 선지급/보류 옵션 스키마 및 검증

파일: app/schemas/sss_option.py
목적: Pydantic 모델로 SSS 옵션 선택 및 급여 영향도 데이터 정의
작성일: 2026-06-02

규칙:
  - Prepaid (선지급): 정부 인보이스 기준 고정액, 근무 현황 무관
  - Hold (보류): 실제 근무일 기준 유동액, 공정한 정산 방식
"""

from typing import Optional, Literal
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, validator


# ─── SSS 옵션 정의 ────────────────────────────────────────────────────

class SSSOptionEnum(str):
    """SSS 옵션 enum"""
    PREPAID = "prepaid"  # 정부 인보이스 선지급
    HOLD = "hold"        # 실제 정산 보류


# ─── 급여 영향도 데이터 모델 ────────────────────────────────────────────

class PayrollImpactResponse(BaseModel):
    """
    SSS 옵션 선택에 따른 급여 영향도 정보

    Prepaid vs Hold 선택에 따른 금액 비교 및 세금 영향도 포함
    """
    gross_salary: Decimal = Field(..., description="총 급여 (Gross Salary)")
    sss_contribution: Decimal = Field(..., description="SSS 기여금 (Employee + Employer)")
    prepaid_amount: Decimal = Field(..., description="선지급액 (정부 인보이스 기준)")
    hold_amount: Decimal = Field(..., description="보류액 (실제 근무 기준)")
    tax_implications: str = Field(..., description="세금 영향도 설명")
    settlement_date: date = Field(..., description="정산 예정일 (매월 25일)")

    class Config:
        json_schema_extra = {
            "example": {
                "gross_salary": 50000.00,
                "sss_contribution": 2025.00,
                "prepaid_amount": 2025.00,
                "hold_amount": 1840.00,
                "tax_implications": "선지급(Prepaid): ₱2025.00 — 정부 인보이스 기준...",
                "settlement_date": "2024-09-25"
            }
        }


class MonthlySummaryResponse(BaseModel):
    """
    직원 월별 급여 요약 (SSS 옵션 선택용)

    SSS 옵션 선택 시 필요한 모든 급여 관련 데이터
    """
    employee_id: int
    employee_name: str
    current_month: str  # 예: "September 2024"

    # 급여 기본
    gross_salary: Decimal

    # SSS 관련
    sss_contribution: Decimal          # Employee + Employer 합계
    government_invoice_amount: Decimal # 정부 인보이스 기준액

    # 근무일
    workdays_in_month: int             # 해당 월 전체 근무일 수
    actual_workdays_worked: int        # 실제 근무한 일 수

    # 현재 선택
    current_sss_option: Literal["prepaid", "hold"]

    # 영향도
    payroll_impact: PayrollImpactResponse

    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": 1,
                "employee_name": "Juan Dela Cruz",
                "current_month": "September 2024",
                "gross_salary": 50000.00,
                "sss_contribution": 2025.00,
                "government_invoice_amount": 2025.00,
                "workdays_in_month": 22,
                "actual_workdays_worked": 20,
                "current_sss_option": "prepaid",
                "payroll_impact": {}
            }
        }


# ─── SSS 옵션 변경 요청 ────────────────────────────────────────────────

class SSSOptionUpdateRequest(BaseModel):
    """
    SSS 옵션 변경 요청

    예:
    {
        "option": "hold",
        "month": "September 2024",
        "notes": "유동적 정산 선호" (선택)
    }
    """
    option: Literal["prepaid", "hold"] = Field(
        ...,
        description="선택할 옵션: 'prepaid' (정부 인보이스) 또는 'hold' (실제 정산)"
    )
    month: str = Field(..., description="정산 월 (예: 'September 2024')")
    notes: Optional[str] = Field(None, description="선택 사유 메모 (감사 목적)")

    @validator("option")
    def validate_option(cls, v):
        """옵션 유효성 검증"""
        if v not in ["prepaid", "hold"]:
            raise ValueError("옵션은 'prepaid' 또는 'hold'여야 합니다")
        return v


class SSSOptionUpdateResponse(BaseModel):
    """
    SSS 옵션 변경 응답
    """
    employee_id: int
    month: str
    previous_option: Literal["prepaid", "hold"]
    updated_option: Literal["prepaid", "hold"]
    updated_at: datetime
    payroll_impact: PayrollImpactResponse

    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": 1,
                "month": "September 2024",
                "previous_option": "prepaid",
                "updated_option": "hold",
                "updated_at": "2024-09-15T10:30:00",
                "payroll_impact": {}
            }
        }


# ─── 월별 SSS 기록 ────────────────────────────────────────────────────

class MonthlySSSRecord(BaseModel):
    """
    월별 SSS 기여금 기록

    정부 인보이스에서 OCR로 추출한 데이터
    """
    employee_id: Optional[int] = None
    employee_name: str
    ss_number: Optional[str]      # Philippine SS Number (XX-XXXXXXX-X)
    ss_amount: Decimal            # Employee contribution
    ec_amount: Decimal            # Employer contribution
    total_amount: Decimal
    month: str                    # 예: "September 2024"
    invoice_no: Optional[str]
    company: Optional[str]
    applicable_date: Optional[date]


# ─── 감사 로그 ────────────────────────────────────────────────────────

class SSSAuditLog(BaseModel):
    """
    SSS 옵션 변경 감사 로그

    언제, 누가, 어떤 옵션을 선택했는지 기록
    """
    audit_id: int
    employee_id: int
    month: str
    previous_option: Literal["prepaid", "hold"]
    selected_option: Literal["prepaid", "hold"]
    changed_by_user_id: str
    changed_at: datetime
    reason: Optional[str]
    ip_address: Optional[str]

    class Config:
        json_schema_extra = {
            "example": {
                "audit_id": 1001,
                "employee_id": 1,
                "month": "September 2024",
                "previous_option": "prepaid",
                "selected_option": "hold",
                "changed_by_user_id": "admin-001",
                "changed_at": "2024-09-15T10:30:00",
                "reason": "유동적 정산 선호",
                "ip_address": "192.168.1.100"
            }
        }


# ─── 유효성 검증 헬퍼 함수 ────────────────────────────────────────────

def validate_sss_option_change(
    current_option: str,
    new_option: str,
    current_month: str,
    days_remaining_in_month: int
) -> tuple[bool, str]:
    """
    SSS 옵션 변경 가능 여부 검증

    Args:
        current_option: 현재 선택된 옵션
        new_option: 변경하려는 옵션
        current_month: 현재 정산 월
        days_remaining_in_month: 해당 월 남은 일 수

    Returns:
        (가능 여부, 메시지)

    규칙:
        1. 동일 옵션 선택 불가
        2. 월 25일 이후 변경 불가 (정산 마감)
        3. 이전 월 변경 불가
    """
    # Rule 1: 동일 옵션 선택 체크
    if current_option == new_option:
        return False, "현재와 동일한 옵션을 선택했습니다"

    # Rule 2: 월 25일 이후 변경 불가
    if days_remaining_in_month < 0:
        return False, "정산 기한(25일)이 지났습니다. 이월에 변경 가능합니다"

    # Rule 3: 이전 월 변경 불가 (현재 구현상 API에서 체크)

    return True, "옵션 변경 가능"


def calculate_sss_difference(
    prepaid_amount: Decimal,
    hold_amount: Decimal,
    gross_salary: Decimal
) -> dict:
    """
    Prepaid vs Hold 차액 계산

    Returns:
        {
            "difference": 차액,
            "percentage": 비율 (%),
            "recommendation": 권장사항
        }
    """
    difference = abs(prepaid_amount - hold_amount)
    percentage = (difference / gross_salary * 100) if gross_salary > 0 else 0

    recommendation = (
        "보류(Hold) 선택 권장 — 실제 근무에 따른 정확한 정산"
        if prepaid_amount > hold_amount
        else "선지급(Prepaid) 선택 권장 — 고정액 보장"
    )

    return {
        "difference": float(difference),
        "percentage": float(percentage),
        "recommendation": recommendation
    }
