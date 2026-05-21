"""
급여 정산 시스템 — SQLAlchemy 모델 (6개)
경로: app/models/payroll.py
작성일: 2026-05-21
"""

from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum


class EmployeeType(str, enum.Enum):
    """직원 유형"""
    THERAPIST = "therapist"
    NAIL = "nail"
    DRIVER = "driver"
    MAINTENANCE = "maintenance"
    HOLLYS = "hollys"
    MANAGER = "manager"


class PayGroup(str, enum.Enum):
    """급여 지급 주기"""
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"


class CashAdvanceStatus(str, enum.Enum):
    """CA 상태"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SETTLED = "settled"


class HolidayType(str, enum.Enum):
    """공휴일 유형"""
    NATIONAL = "national"  # 국가 공휴일 (200%)
    SPECIAL = "special"    # 특정 공휴일 (130%)


class PayrollStatus(str, enum.Enum):
    """정산 상태"""
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"


# ============================================================
# 모델 1: Employee (직원 마스터)
# ============================================================
class Employee(Base):
    """
    직원 마스터 데이터
    기존 Staff + Therapist 통합
    """
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    employee_type = Column(String(50), nullable=False)  # therapist, driver, manager 등
    pay_group = Column(String(50), nullable=False)  # weekly or biweekly
    base_salary = Column(Numeric(10, 2), nullable=False, default=0)
    commission_rate = Column(Numeric(5, 2), default=0)  # therapist/nail용 커미션율 (%)
    hire_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    cash_advances = relationship("CashAdvance", back_populates="employee")
    attendance_logs = relationship("AttendanceLog", back_populates="employee")
    payroll_records = relationship("PayrollRecord", back_populates="employee")


# ============================================================
# 모델 2: CashAdvance (CA 선지급)
# ============================================================
class CashAdvance(Base):
    """
    직원 선지급 (CA) 관리
    정산 시 자동 차감 대상
    """
    __tablename__ = "cash_advances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    request_date = Column(Date, nullable=False)
    reason = Column(String(500))
    status = Column(String(50), nullable=False, default="pending")  # pending, approved, rejected, settled
    settled_payroll_id = Column(Integer, ForeignKey("payroll_records.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    employee = relationship("Employee", back_populates="cash_advances")


# ============================================================
# 모델 3: AttendanceLog (출퇴근 기록)
# ============================================================
class AttendanceLog(Base):
    """
    출퇴근 기록 및 근태 관리
    지각, OT 자동 계산
    """
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    work_date = Column(Date, nullable=False)
    clock_in = Column(String(5))  # HH:MM 형식
    clock_out = Column(String(5))  # HH:MM 형식
    late_minutes = Column(Integer, default=0)  # 지각 분 (10분 초과 시 1분당 10Peso 차감)
    overtime_minutes = Column(Integer, default=0)  # 초과근무 분 (40분 이상 시 계산)
    is_absent = Column(Boolean, default=False)  # 결근 여부
    holiday_type = Column(String(50), default="none")  # none, national, special
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    employee = relationship("Employee", back_populates="attendance_logs")


# ============================================================
# 모델 4: PayrollPeriod (정산 기간)
# ============================================================
class PayrollPeriod(Base):
    """
    급여 정산 기간 (주간/격주)
    한 번에 여러 직원의 급여 계산 대상
    """
    __tablename__ = "payroll_periods"

    id = Column(Integer, primary_key=True, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    pay_group = Column(String(50), nullable=False)  # weekly or biweekly
    status = Column(String(50), nullable=False, default="draft")  # draft, approved, paid
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    payroll_records = relationship("PayrollRecord", back_populates="payroll_period")


# ============================================================
# 모델 5: PayrollRecord (개인별 정산 결과)
# ============================================================
class PayrollRecord(Base):
    """
    개인별 정산 결과
    모든 수입, 차감 항목 포함한 최종 급여
    """
    __tablename__ = "payroll_records"

    id = Column(Integer, primary_key=True, index=True)
    payroll_period_id = Column(Integer, ForeignKey("payroll_periods.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    # 수입 항목
    base_amount = Column(Numeric(10, 2), default=0)  # 기본급
    commission_amount = Column(Numeric(10, 2), default=0)  # 커미션
    overtime_amount = Column(Numeric(10, 2), default=0)  # 초과근무 수당
    holiday_bonus = Column(Numeric(10, 2), default=0)  # 공휴일 가산
    meal_allowance = Column(Numeric(10, 2), default=0)  # 식대 (드라이버용)

    # 차감 항목
    late_deduction = Column(Numeric(10, 2), default=0)  # 지각 차감
    absence_deduction = Column(Numeric(10, 2), default=0)  # 결근 차감
    sss_deduction = Column(Numeric(10, 2), default=0)  # SSS 선지급
    ca_deduction = Column(Numeric(10, 2), default=0)  # CA 차감
    health_check_deduction = Column(Numeric(10, 2), default=0)  # 보건소 검사비
    thirteenth_month_deduction = Column(Numeric(10, 2), default=0)  # 13개월 보너스 선지급

    # 최종 금액
    gross_pay = Column(Numeric(10, 2), default=0)  # 총 수입
    total_deductions = Column(Numeric(10, 2), default=0)  # 총 차감
    net_pay = Column(Numeric(10, 2), default=0)  # 순지급액

    status = Column(String(50), nullable=False, default="draft")  # draft, approved, paid
    notes = Column(String(1000))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    payroll_period = relationship("PayrollPeriod", back_populates="payroll_records")
    employee = relationship("Employee", back_populates="payroll_records")


# ============================================================
# 모델 6: PhilippineHoliday (공휴일)
# ============================================================
class PhilippineHoliday(Base):
    """
    필리핀 공휴일 관리
    국가 공휴일: 200% 지급
    특정 공휴일: 130% 지급
    """
    __tablename__ = "philippine_holidays"

    id = Column(Integer, primary_key=True, index=True)
    holiday_date = Column(Date, nullable=False, unique=True)
    holiday_name = Column(String(255), nullable=False)
    holiday_type = Column(String(50), nullable=False)  # national (200%) or special (130%)
    rate_multiplier = Column(Numeric(3, 2), nullable=False)  # 2.0 or 1.3
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
