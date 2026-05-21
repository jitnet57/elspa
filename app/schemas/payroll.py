"""
급여 정산 시스템 — Pydantic 스키마
경로: app/schemas/payroll.py
작성일: 2026-05-21
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


# ============================================================
# Employee (직원)
# ============================================================

class EmployeeCreate(BaseModel):
    """직원 생성/수정"""
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=20)
    employee_type: str = Field(...)  # therapist, driver, manager 등
    pay_group: str = Field(...)  # weekly or biweekly
    base_salary: Decimal = Field(...)
    commission_rate: Optional[Decimal] = 0
    hire_date: date = Field(...)


class EmployeeResponse(EmployeeCreate):
    """직원 응답"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# CashAdvance (CA)
# ============================================================

class CashAdvanceCreate(BaseModel):
    """CA 신청"""
    employee_id: int
    amount: Decimal = Field(..., gt=0)
    request_date: date
    reason: Optional[str] = None


class CashAdvanceResponse(CashAdvanceCreate):
    """CA 응답"""
    id: int
    status: str  # pending, approved, rejected, settled
    settled_payroll_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# AttendanceLog (출퇴근)
# ============================================================

class AttendanceLogCreate(BaseModel):
    """출퇴근 기록"""
    employee_id: int
    work_date: date
    clock_in: Optional[str] = None  # HH:MM
    clock_out: Optional[str] = None  # HH:MM
    late_minutes: int = 0
    overtime_minutes: int = 0
    is_absent: bool = False
    holiday_type: str = "none"  # none, national, special


class AttendanceLogResponse(AttendanceLogCreate):
    """출퇴근 응답"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# PhilippineHoliday (공휴일)
# ============================================================

class PhilippineHolidayCreate(BaseModel):
    """공휴일"""
    holiday_date: date
    holiday_name: str = Field(..., min_length=1, max_length=255)
    holiday_type: str = Field(...)  # national (200%) or special (130%)
    rate_multiplier: Decimal = Field(...)  # 2.0 or 1.3


class PhilippineHolidayResponse(PhilippineHolidayCreate):
    """공휴일 응답"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# PayrollPeriod (정산 기간)
# ============================================================

class PayrollPeriodCreate(BaseModel):
    """정산 기간"""
    period_start: date
    period_end: date
    pay_group: str  # weekly or biweekly


class PayrollPeriodResponse(PayrollPeriodCreate):
    """정산 기간 응답"""
    id: int
    status: str  # draft, approved, paid
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# PayrollRecord (개인별 정산 결과)
# ============================================================

class PayrollRecordCreate(BaseModel):
    """정산 결과 (생성용, 실제로는 자동 생성)"""
    payroll_period_id: int
    employee_id: int


class PayrollRecordResponse(BaseModel):
    """정산 결과 응답"""
    id: int
    payroll_period_id: int
    employee_id: int

    # 수입 항목
    base_amount: Decimal
    commission_amount: Decimal
    overtime_amount: Decimal
    holiday_bonus: Decimal
    meal_allowance: Decimal

    # 차감 항목
    late_deduction: Decimal
    absence_deduction: Decimal
    sss_deduction: Decimal
    ca_deduction: Decimal
    health_check_deduction: Decimal
    thirteenth_month_deduction: Decimal

    # 최종
    gross_pay: Decimal
    total_deductions: Decimal
    net_pay: Decimal

    status: str  # draft, approved, paid
    notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayrollRecordDetailResponse(PayrollRecordResponse):
    """정산 상세 (직원 정보 포함)"""
    employee: Optional[EmployeeResponse] = None
    payroll_period: Optional[PayrollPeriodResponse] = None
