"""
급여 계산 엔진
경로: app/services/payroll_calculator.py
작성일: 2026-05-21
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.payroll import (
    Employee, AttendanceLog, PayrollRecord, PayrollPeriod,
    CashAdvance, PhilippineHoliday, CashAdvanceStatus, EmployeeType
)


class PayrollCalculator:
    """급여 정산 엔진"""

    @staticmethod
    def calculate_late_deduction(late_minutes: int) -> Decimal:
        """
        지각 차감 계산
        규칙: 10분 초과부터 1분당 10 Peso
        예: 15분 지각 → (15-9) * 10 = 60 Peso
        """
        if late_minutes <= 9:
            return Decimal(0)
        return Decimal((late_minutes - 9) * 10)

    @staticmethod
    def calculate_overtime_amount(overtime_minutes: int) -> Decimal:
        """
        초과근무 수당 계산 (정직원만)
        규칙: 40분 이상 시 1시간당 70 Peso (올림 처리)
        예: 45분 OT → 1시간으로 계산 → 70 Peso
        """
        if overtime_minutes < 40:
            return Decimal(0)
        # 올림 처리 (분 → 시간)
        hours = (overtime_minutes + 59) // 60
        return Decimal(hours * 70)

    @staticmethod
    def calculate_holiday_bonus(
        base_salary: Decimal,
        holiday_type: str,
        days_worked: int = 1
    ) -> Decimal:
        """
        공휴일 가산 계산
        규칙:
        - 국가 공휴일: 기본급의 200% (= 기본급 × 1배 추가)
        - 특정 공휴일: 기본급의 130% (= 기본급 × 0.3배 추가)

        실제 계산:
        - 국가: 일급 × 200% = 일급 × 2.0
        - 특정: 일급 × 130% = 일급 × 1.3
        """
        daily_rate = base_salary / Decimal(15)  # 월 15일 기준

        if holiday_type == "national":
            return daily_rate * Decimal(2.0) * days_worked
        elif holiday_type == "special":
            return daily_rate * Decimal(1.3) * days_worked
        return Decimal(0)

    @staticmethod
    def calculate_absence_deduction(base_salary: Decimal, days_absent: int) -> Decimal:
        """
        결근 차감 (Manager만)
        규칙: 급여 / 15 = 1일 급여액
        예: 20,000 / 15 = 1,333.33 Peso/day
        """
        if days_absent <= 0:
            return Decimal(0)
        daily_rate = base_salary / Decimal(15)
        return daily_rate * days_absent

    @staticmethod
    def get_approved_ca_amount(employee_id: int, db: Session) -> Decimal:
        """승인된 CA 합계 조회"""
        total = db.query(func.sum(CashAdvance.amount)).filter(
            CashAdvance.employee_id == employee_id,
            CashAdvance.status == CashAdvanceStatus.APPROVED
        ).scalar()
        return Decimal(total) if total else Decimal(0)

    @staticmethod
    def is_holiday(check_date: date, db: Session) -> Optional[str]:
        """
        특정 날짜가 공휴일인지 확인
        반환: None (일반일), "national" (국가), "special" (특정)
        """
        holiday = db.query(PhilippineHoliday).filter(
            PhilippineHoliday.holiday_date == check_date
        ).first()

        if holiday:
            return holiday.holiday_type
        return None

    @staticmethod
    def calculate_commission(
        employee_type: str,
        session_count: int,
        session_price: Decimal = Decimal(100)
    ) -> Decimal:
        """
        커미션 계산 (Therapist/Nail 전용)
        규칙: 세션 수 × 세션당 가격
        (추후 성과/로열티 보너스 추가 가능)
        """
        if employee_type not in [EmployeeType.THERAPIST, EmployeeType.NAIL]:
            return Decimal(0)
        return Decimal(session_count * session_price)

    @staticmethod
    def calculate_payroll_for_period(
        payroll_period: PayrollPeriod,
        db: Session
    ) -> List[PayrollRecord]:
        """
        정산 기간에 해당하는 모든 직원의 급여 계산

        단계:
        1. 정산 기간의 직원 조회 (pay_group 매칭)
        2. 각 직원별 데이터 수집
        3. 급여 계산
        4. PayrollRecord 생성 (draft 상태)
        """
        # 1. 해당 pay_group의 모든 활성 직원 조회
        employees = db.query(Employee).filter(
            Employee.pay_group == payroll_period.pay_group,
            Employee.is_active == True
        ).all()

        payroll_records = []

        for employee in employees:
            # 2. 출퇴근 기록 수집 (정산 기간)
            attendance_logs = db.query(AttendanceLog).filter(
                AttendanceLog.employee_id == employee.id,
                AttendanceLog.work_date >= payroll_period.period_start,
                AttendanceLog.work_date <= payroll_period.period_end
            ).all()

            # 3. 급여 계산
            record = PayrollCalculator._calculate_employee_payroll(
                employee=employee,
                attendance_logs=attendance_logs,
                payroll_period=payroll_period,
                db=db
            )

            payroll_records.append(record)

        return payroll_records

    @staticmethod
    def _calculate_employee_payroll(
        employee: Employee,
        attendance_logs: List[AttendanceLog],
        payroll_period: PayrollPeriod,
        db: Session
    ) -> PayrollRecord:
        """
        개인별 급여 계산
        """
        calc = PayrollCalculator

        # 초기값
        base_amount = Decimal(employee.base_salary)
        commission_amount = Decimal(0)
        overtime_amount = Decimal(0)
        holiday_bonus = Decimal(0)
        meal_allowance = Decimal(0)
        late_deduction = Decimal(0)
        absence_deduction = Decimal(0)

        # ============================================================
        # 수입 계산
        # ============================================================

        # 1. 커미션 (Therapist/Nail)
        if employee.employee_type in [EmployeeType.THERAPIST, EmployeeType.NAIL]:
            # 세션 수 = 해당 기간 근무일 수 (임시)
            session_count = len([log for log in attendance_logs if not log.is_absent])
            commission_amount = calc.calculate_commission(
                employee.employee_type,
                session_count,
                session_price=Decimal(100)  # 기본값
            )

        # 2. 초과근무 (정직원만: Manager, Maintenance, Driver, Hollys)
        if employee.employee_type in [
            EmployeeType.MANAGER,
            EmployeeType.MAINTENANCE,
            EmployeeType.DRIVER,
            EmployeeType.HOLLYS
        ]:
            total_ot_minutes = sum(log.overtime_minutes for log in attendance_logs)
            overtime_amount = calc.calculate_overtime_amount(total_ot_minutes)

        # 3. 공휴일 가산
        for log in attendance_logs:
            if log.holiday_type in ["national", "special"]:
                bonus = calc.calculate_holiday_bonus(base_amount, log.holiday_type)
                holiday_bonus += bonus

        # 4. 식대 (Driver만, 2주당 200 Peso)
        if employee.employee_type == EmployeeType.DRIVER:
            meal_allowance = Decimal(200)

        # 총 수입
        gross_pay = base_amount + commission_amount + overtime_amount + holiday_bonus + meal_allowance

        # ============================================================
        # 차감 계산
        # ============================================================

        # 1. 지각 차감
        for log in attendance_logs:
            late_deduction += calc.calculate_late_deduction(log.late_minutes)

        # 2. 결근 차감 (Manager만)
        if employee.employee_type == EmployeeType.MANAGER:
            absent_count = sum(1 for log in attendance_logs if log.is_absent)
            absence_deduction = calc.calculate_absence_deduction(base_amount, absent_count)

        # 3. SSS 선지급 (고정값, 일단 0 처리)
        sss_deduction = Decimal(0)

        # 4. CA 차감
        ca_deduction = calc.get_approved_ca_amount(employee.id, db)

        # 5. 13개월 보너스 선지급 (고정값, 일단 0 처리)
        thirteenth_month_deduction = Decimal(0)

        # 6. 보건소 검사비 (Therapist 분기별, 일단 0 처리)
        health_check_deduction = Decimal(0)

        # 총 차감
        total_deductions = (
            late_deduction +
            absence_deduction +
            sss_deduction +
            ca_deduction +
            thirteenth_month_deduction +
            health_check_deduction
        )

        # ============================================================
        # 순지급액
        # ============================================================
        net_pay = gross_pay - total_deductions
        if net_pay < Decimal(0):
            net_pay = Decimal(0)

        # PayrollRecord 생성
        record = PayrollRecord(
            payroll_period_id=payroll_period.id,
            employee_id=employee.id,
            base_amount=base_amount,
            commission_amount=commission_amount,
            overtime_amount=overtime_amount,
            holiday_bonus=holiday_bonus,
            meal_allowance=meal_allowance,
            late_deduction=late_deduction,
            absence_deduction=absence_deduction,
            sss_deduction=sss_deduction,
            ca_deduction=ca_deduction,
            health_check_deduction=health_check_deduction,
            thirteenth_month_deduction=thirteenth_month_deduction,
            gross_pay=gross_pay,
            total_deductions=total_deductions,
            net_pay=net_pay,
            status="draft"
        )

        return record
