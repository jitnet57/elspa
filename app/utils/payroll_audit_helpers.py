"""
📌 Payroll Audit Logging Helpers
📋 목적: 급여 정산 시스템의 모든 변경사항 감사 로그에 기록
🔧 포함: Employee, PayrollRecord, CashAdvance, AttendanceLog, PayrollPeriod 로깅
작성일: 2026-05-22
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog, AuditActionEnum
from app.services.audit_service import AuditService
from app.models.payroll import (
    Employee, PayrollRecord, CashAdvance,
    AttendanceLog, PayrollPeriod, PhilippineHoliday
)
import json
from decimal import Decimal


# ============================================================
# Helper: 값을 JSON-직렬화 가능한 형태로 변환
# ============================================================
def _serialize_value(value: Any) -> Any:
    """값을 JSON 직렬화 가능한 형태로 변환"""
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, 'isoformat'):  # datetime, date
        return value.isoformat()
    if hasattr(value, 'value'):  # Enum
        return value.value
    return value


def _serialize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """딕셔너리의 모든 값을 JSON 직렬화 가능한 형태로 변환"""
    if not data:
        return None
    return {k: _serialize_value(v) for k, v in data.items()}


# ============================================================
# Employee (직원) 감사 로깅
# ============================================================

def log_employee_created(
    db: AsyncSession,
    employee: Employee,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """직원 생성 로그"""
    new_value = {
        "name": employee.name,
        "phone": employee.phone,
        "employee_type": str(employee.employee_type),
        "pay_group": str(employee.pay_group),
        "base_salary": float(employee.base_salary),
        "commission_rate": float(employee.commission_rate),
        "hire_date": employee.hire_date.isoformat(),
        "is_active": employee.is_active,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EMPLOYEE_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="employee",
        entity_id=employee.id,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_employee_updated(
    db: AsyncSession,
    old_employee_data: Dict[str, Any],
    new_employee: Employee,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """직원 정보 수정 로그"""
    new_value = {
        "name": new_employee.name,
        "phone": new_employee.phone,
        "employee_type": str(new_employee.employee_type),
        "pay_group": str(new_employee.pay_group),
        "base_salary": float(new_employee.base_salary),
        "commission_rate": float(new_employee.commission_rate),
        "hire_date": new_employee.hire_date.isoformat(),
        "is_active": new_employee.is_active,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EMPLOYEE_UPDATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="employee",
        entity_id=new_employee.id,
        old_value=old_employee_data,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_employee_deleted(
    db: AsyncSession,
    employee: Employee,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """직원 삭제 로그 (is_active = False)"""
    old_value = {
        "is_active": True,
    }
    new_value = {
        "is_active": False,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.EMPLOYEE_DELETED,
        user_id=user_id,
        user_email=user_email,
        entity_type="employee",
        entity_id=employee.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ============================================================
# CashAdvance (선지급) 감사 로깅
# ============================================================

def log_cash_advance_created(
    db: AsyncSession,
    ca: CashAdvance,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """CA 요청 생성 로그"""
    new_value = {
        "employee_id": ca.employee_id,
        "amount": float(ca.amount),
        "request_date": ca.request_date.isoformat(),
        "reason": ca.reason,
        "status": ca.status,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.CASH_ADVANCE_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="cash_advance",
        entity_id=ca.id,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_cash_advance_approved(
    db: AsyncSession,
    ca: CashAdvance,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """CA 승인 로그"""
    old_value = {"status": "pending"}
    new_value = {"status": "approved"}

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.CASH_ADVANCE_APPROVED,
        user_id=user_id,
        user_email=user_email,
        entity_type="cash_advance",
        entity_id=ca.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_cash_advance_rejected(
    db: AsyncSession,
    ca: CashAdvance,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """CA 거절 로그"""
    old_value = {"status": "pending"}
    new_value = {"status": "rejected"}

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.CASH_ADVANCE_REJECTED,
        user_id=user_id,
        user_email=user_email,
        entity_type="cash_advance",
        entity_id=ca.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_cash_advance_settled(
    db: AsyncSession,
    ca: CashAdvance,
    payroll_record_id: int,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """CA 정산 로그"""
    old_value = {"status": "approved", "settled_payroll_id": None}
    new_value = {"status": "settled", "settled_payroll_id": payroll_record_id}

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.CASH_ADVANCE_SETTLED,
        user_id=user_id,
        user_email=user_email,
        entity_type="cash_advance",
        entity_id=ca.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ============================================================
# AttendanceLog (출퇴근) 감사 로깅
# ============================================================

def log_attendance_created(
    db: AsyncSession,
    attendance: AttendanceLog,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """출퇴근 기록 생성 로그"""
    new_value = {
        "employee_id": attendance.employee_id,
        "work_date": attendance.work_date.isoformat(),
        "status": attendance.status,
        "hours_worked": float(attendance.hours_worked) if attendance.hours_worked else None,
        "overtime_hours": float(attendance.overtime_hours) if attendance.overtime_hours else None,
        "is_late": attendance.is_late,
        "notes": attendance.notes,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.ATTENDANCE_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="attendance_log",
        entity_id=attendance.id,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_attendance_updated(
    db: AsyncSession,
    old_attendance_data: Dict[str, Any],
    new_attendance: AttendanceLog,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """출퇴근 기록 수정 로그"""
    new_value = {
        "work_date": new_attendance.work_date.isoformat(),
        "status": new_attendance.status,
        "hours_worked": float(new_attendance.hours_worked) if new_attendance.hours_worked else None,
        "overtime_hours": float(new_attendance.overtime_hours) if new_attendance.overtime_hours else None,
        "is_late": new_attendance.is_late,
        "notes": new_attendance.notes,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.ATTENDANCE_UPDATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="attendance_log",
        entity_id=new_attendance.id,
        old_value=old_attendance_data,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ============================================================
# PayrollPeriod (정산 기간) 감사 로깅
# ============================================================

def log_payroll_period_created(
    db: AsyncSession,
    period: PayrollPeriod,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """정산 기간 생성 로그"""
    new_value = {
        "year": period.year,
        "month": period.month,
        "pay_group": str(period.pay_group),
        "start_date": period.start_date.isoformat(),
        "end_date": period.end_date.isoformat(),
        "status": period.status,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.PAYROLL_PERIOD_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="payroll_period",
        entity_id=period.id,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_payroll_period_approved(
    db: AsyncSession,
    period: PayrollPeriod,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """정산 기간 승인 로그"""
    old_value = {"status": "draft"}
    new_value = {"status": "approved"}

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.PAYROLL_PERIOD_APPROVED,
        user_id=user_id,
        user_email=user_email,
        entity_type="payroll_period",
        entity_id=period.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_payroll_period_paid(
    db: AsyncSession,
    period: PayrollPeriod,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """정산 기간 지급 완료 로그"""
    old_value = {"status": "approved"}
    new_value = {"status": "paid"}

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.PAYROLL_PERIOD_PAID,
        user_id=user_id,
        user_email=user_email,
        entity_type="payroll_period",
        entity_id=period.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ============================================================
# PayrollRecord (개인별 정산) 감사 로깅
# ============================================================

def log_payroll_record_calculated(
    db: AsyncSession,
    record: PayrollRecord,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """급여 정산 계산 로그"""
    new_value = {
        "payroll_period_id": record.payroll_period_id,
        "employee_id": record.employee_id,
        "base_amount": float(record.base_amount),
        "commission_amount": float(record.commission_amount),
        "overtime_amount": float(record.overtime_amount),
        "holiday_bonus": float(record.holiday_bonus),
        "meal_allowance": float(record.meal_allowance),
        "gross_pay": float(record.gross_pay),
        "total_deductions": float(record.total_deductions),
        "net_pay": float(record.net_pay),
        "status": record.status,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.PAYROLL_RECORD_CALCULATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="payroll_record",
        entity_id=record.id,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_payroll_record_updated(
    db: AsyncSession,
    old_record_data: Dict[str, Any],
    new_record: PayrollRecord,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """급여 정산 수정 로그"""
    new_value = {
        "base_amount": float(new_record.base_amount),
        "commission_amount": float(new_record.commission_amount),
        "overtime_amount": float(new_record.overtime_amount),
        "holiday_bonus": float(new_record.holiday_bonus),
        "meal_allowance": float(new_record.meal_allowance),
        "late_deduction": float(new_record.late_deduction),
        "absence_deduction": float(new_record.absence_deduction),
        "sss_deduction": float(new_record.sss_deduction),
        "ca_deduction": float(new_record.ca_deduction),
        "gross_pay": float(new_record.gross_pay),
        "total_deductions": float(new_record.total_deductions),
        "net_pay": float(new_record.net_pay),
        "notes": new_record.notes,
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.PAYROLL_RECORD_UPDATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="payroll_record",
        entity_id=new_record.id,
        old_value=old_record_data,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_payroll_record_approved(
    db: AsyncSession,
    record: PayrollRecord,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """급여 정산 승인 로그"""
    old_value = {"status": "draft"}
    new_value = {"status": "approved"}

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.PAYROLL_RECORD_APPROVED,
        user_id=user_id,
        user_email=user_email,
        entity_type="payroll_record",
        entity_id=record.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


# ============================================================
# PhilippineHoliday (공휴일) 감사 로깅
# ============================================================

def log_holiday_created(
    db: AsyncSession,
    holiday: PhilippineHoliday,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """공휴일 생성 로그"""
    new_value = {
        "holiday_date": holiday.holiday_date.isoformat(),
        "holiday_name": holiday.holiday_name,
        "holiday_type": str(holiday.holiday_type),
        "rate_multiplier": float(holiday.rate_multiplier),
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.HOLIDAY_CREATED,
        user_id=user_id,
        user_email=user_email,
        entity_type="holiday",
        entity_id=holiday.id,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_holiday_deleted(
    db: AsyncSession,
    holiday: PhilippineHoliday,
    user_id: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """공휴일 삭제 로그"""
    old_value = {
        "holiday_date": holiday.holiday_date.isoformat(),
        "holiday_name": holiday.holiday_name,
        "holiday_type": str(holiday.holiday_type),
        "rate_multiplier": float(holiday.rate_multiplier),
    }

    AuditService.log_action(
        db=db,
        action=AuditActionEnum.HOLIDAY_DELETED,
        user_id=user_id,
        user_email=user_email,
        entity_type="holiday",
        entity_id=holiday.id,
        old_value=old_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )
