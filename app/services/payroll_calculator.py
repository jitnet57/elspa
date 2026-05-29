"""
급여 계산 엔진
경로: app/services/payroll_calculator.py
작성일: 2026-05-21

BUG FIX #2: mark_cash_advances_as_settled() 메서드 추가
- 정산 계산 후 사용된 CA를 settled 상태로 변경
- settled_payroll_id에 PayrollRecord.id 기록

Phase 8-5: 13개월 보너스 기능 추가
- calculate_months_employed(): 입사일부터 기준일까지 개월 수 계산
- calculate_thirteenth_month_deduction(): 13개월 보너스 선지급액 계산
"""

from decimal import Decimal
from typing import List, Optional
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.models.payroll import (
    Employee, AttendanceLog, PayrollRecord, PayrollPeriod,
    CashAdvance, PhilippineHoliday, CashAdvanceStatus, EmployeeType
)


class PayrollCalculator:

    @staticmethod
    def calculate_late_deduction(late_minutes: int) -> Decimal:
        """지각 차감: 10분 초과부터 1분당 10 Peso"""
        if late_minutes <= 9:
            return Decimal(0)
        return Decimal((late_minutes - 9) * 10)

    @staticmethod
    def calculate_overtime_amount(overtime_minutes: int) -> Decimal:
        """초과근무 수당: 40분 이상 시 1시간당 70 Peso (올림)"""
        if overtime_minutes < 40:
            return Decimal(0)
        hours = (overtime_minutes + 59) // 60
        return Decimal(hours * 70)

    @staticmethod
    def calculate_holiday_bonus(base_salary: Decimal, holiday_type: str, days_worked: int = 1) -> Decimal:
        """
        공휴일 가산

        필리핀 표준:
        - 일급 = 월급 / 20 (주5일, 4주 기준)
        - 국가 공휴일: 일급 × 200% × 일수 (기본급의 2배)
        - 특정 공휴일: 일급 × 130% × 일수 (기본급의 1.3배)
        """
        daily_rate = base_salary / Decimal(20)
        if holiday_type == "national":
            return daily_rate * Decimal(2) * days_worked
        elif holiday_type == "special":
            return daily_rate * Decimal("1.3") * days_worked
        return Decimal(0)

    @staticmethod
    def calculate_absence_deduction(base_salary: Decimal, days_absent: int) -> Decimal:
        """
        결근 차감 (Manager만)

        필리핀 표준: 월급 / 20 (주5일, 4주 기준)
        일급 = 월급 / 20
        """
        if days_absent <= 0:
            return Decimal(0)
        return (base_salary / Decimal(20)) * days_absent

    @staticmethod
    def calculate_commission(employee_type: str, session_count: int, session_price: Decimal = Decimal(100)) -> Decimal:
        """
        커미션 (Therapist/Nail 전용) - 레거시 호환성용

        주의: 이 메서드는 레거시 호환성만 제공합니다.
        실제 커미션 계산은 calculate_therapist_commission_from_bookings()를 사용하세요.
        """
        if employee_type not in [EmployeeType.THERAPIST, EmployeeType.NAIL]:
            return Decimal(0)
        return Decimal(session_count) * session_price

    @staticmethod
    async def calculate_therapist_commission_from_bookings(
        employee_id: int,
        period_start: date,
        period_end: date,
        db: AsyncSession
    ) -> Decimal:
        """
        마사지 예약 기반 테라피스트 커미션 계산

        - 정산 기간 내 완료된(status='completed') 마사지 예약의 service_price 합산
        - 각 예약의 실제 가격을 반영

        Args:
            employee_id: 직원 ID
            period_start: 정산 기간 시작일
            period_end: 정산 기간 종료일
            db: AsyncSession

        Returns:
            커미션 총액 (Decimal)
        """
        from app.models.massage_booking import MassageBooking

        result = await db.execute(
            select(func.sum(MassageBooking.service_price)).where(
                MassageBooking.therapist_id == employee_id,
                MassageBooking.date >= period_start,
                MassageBooking.date <= period_end,
                MassageBooking.status == "completed"
            )
        )
        total = result.scalar()
        return Decimal(str(total)) if total else Decimal(0)

    @staticmethod
    def calculate_health_check_deduction(employee_type: str, payroll_period: PayrollPeriod) -> Decimal:
        """
        보건소 검사비 차감 (분기별 1회)
        - Therapist만 적용
        - 금액: 500 Peso (필리핀 기준)
        - 차감 시점: 분기 말 정산 (Q1=3월, Q2=6월, Q3=9월, Q4=12월)

        분기 판정:
          - 1-3월 → Q1
          - 4-6월 → Q2
          - 7-9월 → Q3
          - 10-12월 → Q4

        Args:
            employee_type: 직원 유형
            payroll_period: 정산 기간

        Returns:
            차감액 (500 Peso 또는 0)
        """
        # Therapist만 적용
        if employee_type != EmployeeType.THERAPIST:
            return Decimal(0)

        # 분기 판정 (payroll_period.period_end의 월 기반)
        month = payroll_period.period_end.month

        # 분기 말인지 확인
        is_quarter_end = month in [3, 6, 9, 12]

        if is_quarter_end:
            return Decimal(500)  # 500 Peso
        return Decimal(0)

    @staticmethod
    async def get_approved_ca_amount(employee_id: int, db: AsyncSession) -> Decimal:
        """승인된 CA 합계"""
        result = await db.execute(
            select(func.sum(CashAdvance.amount)).where(
                CashAdvance.employee_id == employee_id,
                CashAdvance.status == CashAdvanceStatus.APPROVED
            )
        )
        total = result.scalar()
        return Decimal(str(total)) if total else Decimal(0)

    @staticmethod
    async def is_holiday(check_date, db: AsyncSession) -> Optional[str]:
        """특정 날짜가 공휴일인지 확인. None / 'national' / 'special'"""
        result = await db.execute(
            select(PhilippineHoliday).where(PhilippineHoliday.holiday_date == check_date)
        )
        holiday = result.scalar_one_or_none()
        return holiday.holiday_type if holiday else None

    @staticmethod
    def calculate_months_employed(hire_date: date, reference_date: date) -> int:
        """
        입사일부터 기준일까지의 개월 수 계산

        규칙:
        - 정확한 개월 수 계산 (년/월 기반)
        - 기간 내 첫 번째 일자 = 기여도 시작
        - 예: 2025-01-15 입사, 2025-05-22 기준 = 4개월 (1월, 2월, 3월, 4월)

        Args:
            hire_date: 입사일
            reference_date: 기준일 (정산 기간 종료일)

        Returns:
            개월 수 (최소 1개월)
        """
        if hire_date > reference_date:
            return 0

        # 년도 차이 * 12 + 월 차이
        years_diff = reference_date.year - hire_date.year
        months_diff = reference_date.month - hire_date.month
        total_months = years_diff * 12 + months_diff

        # 기준일이 입사일보다 늦은 날짜면 1개월 추가
        if reference_date.day >= hire_date.day:
            total_months += 1

        return max(total_months, 1)  # 최소 1개월

    @staticmethod
    def calculate_thirteenth_month_deduction(
        base_salary: Decimal,
        hire_date: date,
        reference_date: date
    ) -> Decimal:
        """
        13개월 보너스 선지급액 계산

        규칙:
        - 월 금액 = 연간 기본급 / 12
        - 누적액 = 월 금액 × (입사일부터 현재까지의 개월 수)

        예시:
        - 기본급: 12,000 Peso
        - 월 금액: 12,000 / 12 = 1,000 Peso
        - 1월 ~ 5월 근무 (5개월): 1,000 × 5 = 5,000 Peso

        중도 입사자 처리:
        - 입사일이 해당 월에 포함되면 1개월로 계산
        - 정확한 일자 기반 개월 계산 (hire_date와 reference_date 비교)

        Args:
            base_salary: 월 기본급 (Decimal)
            hire_date: 입사일
            reference_date: 기준일 (정산 기간 종료일)

        Returns:
            13개월 보너스 선지급액 (Decimal)
        """
        if base_salary <= 0:
            return Decimal(0)

        # 개월 수 계산
        months_employed = PayrollCalculator.calculate_months_employed(hire_date, reference_date)

        # 월 금액 = 기본급 / 12
        monthly_amount = base_salary / Decimal(12)

        # 누적액 = 월 금액 × 개월 수
        accrual = monthly_amount * Decimal(months_employed)

        return accrual

    @staticmethod
    async def calculate_payroll_for_period(
        payroll_period: PayrollPeriod,
        db: AsyncSession
    ) -> List[PayrollRecord]:
        """정산 기간 내 모든 직원 급여 계산"""
        result = await db.execute(
            select(Employee).where(
                Employee.pay_group == payroll_period.pay_group,
                Employee.is_active == True
            )
        )
        employees = result.scalars().all()

        payroll_records = []
        for employee in employees:
            att_result = await db.execute(
                select(AttendanceLog).where(
                    AttendanceLog.employee_id == employee.id,
                    AttendanceLog.work_date >= payroll_period.period_start,
                    AttendanceLog.work_date <= payroll_period.period_end
                )
            )
            attendance_logs = att_result.scalars().all()

            record = await PayrollCalculator._calculate_employee_payroll(
                employee=employee,
                attendance_logs=attendance_logs,
                payroll_period=payroll_period,
                db=db
            )
            payroll_records.append(record)

        return payroll_records

    @staticmethod
    async def _calculate_employee_payroll(
        employee: Employee,
        attendance_logs: List[AttendanceLog],
        payroll_period: PayrollPeriod,
        db: AsyncSession
    ) -> PayrollRecord:
        # ============================================================
        # 📌 함수명: _calculate_employee_payroll
        # 📋 목적: 한 직원의 개별 급여 정보를 계산하고 상세 명세(적요)를 생성합니다.
        # 🔧 매개변수: employee (Employee) - 직원 객체
        #             attendance_logs (List[AttendanceLog]) - 근태 기록 리스트
        #             payroll_period (PayrollPeriod) - 정산 기간
        #             db (AsyncSession) - DB 세션
        # 📤 반환값: 계산 및 적요 작성이 완료된 PayrollRecord 객체
        # 📅 작성일: 2026-05-27
        # ============================================================
        calc = PayrollCalculator

        base_amount = Decimal(str(employee.base_salary))
        commission_amount = Decimal(0)
        overtime_amount = Decimal(0)
        holiday_bonus = Decimal(0)
        meal_allowance = Decimal(0)
        late_deduction = Decimal(0)
        absence_deduction = Decimal(0)

        # 근태 관련 통계값 초기화
        session_count = 0
        total_ot = 0
        absent_count = 0

        # 커미션 (Therapist/Nail)
        # 마사지 예약 기반 실제 가격으로 계산
        if employee.employee_type in [EmployeeType.THERAPIST, EmployeeType.NAIL]:
            commission_amount = await calc.calculate_therapist_commission_from_bookings(
                employee_id=employee.id,
                period_start=payroll_period.period_start,
                period_end=payroll_period.period_end,
                db=db
            )

        # 초과근무 (정직원)
        if employee.employee_type in [
            EmployeeType.MANAGER, EmployeeType.MAINTENANCE,
            EmployeeType.DRIVER, EmployeeType.HOLLYS
        ]:
            total_ot = sum(log.overtime_minutes for log in attendance_logs)
            overtime_amount = calc.calculate_overtime_amount(total_ot)

        # 공휴일 가산
        for log in attendance_logs:
            if log.holiday_type in ["national", "special"]:
                holiday_bonus += calc.calculate_holiday_bonus(base_amount, log.holiday_type)

        # 식대 (Driver만, 2주당 200 Peso)
        if employee.employee_type == EmployeeType.DRIVER:
            meal_allowance = Decimal(200)

        gross_pay = base_amount + commission_amount + overtime_amount + holiday_bonus + meal_allowance

        # 지각 차감
        for log in attendance_logs:
            late_deduction += calc.calculate_late_deduction(log.late_minutes)

        # 결근 차감 (Manager만)
        if employee.employee_type == EmployeeType.MANAGER:
            absent_count = sum(1 for log in attendance_logs if log.is_absent)
            absence_deduction = calc.calculate_absence_deduction(base_amount, absent_count)

        sss_deduction = Decimal(0)
        ca_deduction = await calc.get_approved_ca_amount(employee.id, db)

        # 13개월 보너스 누적액 및 선지급 계산
        thirteenth_month_accrual = calc.calculate_thirteenth_month_deduction(
            base_salary=base_amount,
            hire_date=employee.hire_date,
            reference_date=payroll_period.period_end
        )
        # 선지급액은 누적액과 동일 (매 정산 시 누적액을 차감)
        thirteenth_month_deduction = thirteenth_month_accrual

        # 보건소 검사비 차감 (Therapist, 분기별 1회)
        health_check_deduction = calc.calculate_health_check_deduction(
            employee.employee_type, payroll_period
        )

        total_deductions = (
            late_deduction + absence_deduction + sss_deduction +
            ca_deduction + thirteenth_month_deduction + health_check_deduction
        )

        net_pay = max(gross_pay - total_deductions, Decimal(0))

        # 정산체계 요약 및 세부 내역을 적요(notes)에 상세히 기록 (한국어)
        note_lines = []
        note_lines.append("=" * 60)
        note_lines.append(f"📌 ElSpa 급여 정산 명세서 (적요) - {employee.name} ({employee.employee_type.upper()})")
        note_lines.append(f"📅 정산 기간: {payroll_period.period_start} ~ {payroll_period.period_end}")
        note_lines.append("=" * 60)
        note_lines.append(f"1. 수입 항목 (Gross Pay): {gross_pay:,.2f} PHP")
        note_lines.append(f"   • 기본급 (Base Salary): {base_amount:,.2f} PHP")

        if employee.employee_type in [EmployeeType.THERAPIST, EmployeeType.NAIL]:
            note_lines.append(f"   • 커미션 (Commission): {commission_amount:,.2f} PHP")
            note_lines.append(f"     [정산체계: Therapist/Nail 전용 - 완료된 마사지 예약의 서비스 가격 합계]")
        else:
            if overtime_amount > 0 or total_ot > 0:
                note_lines.append(f"   • 초과근무 수당 (Overtime): {overtime_amount:,.2f} PHP")
                note_lines.append(f"     [정산체계: 정직원 전용 - 총 {total_ot}분 초과근무, 40분 이상 시 1시간 단위 70 PHP 올림 계산]")
            if holiday_bonus > 0:
                note_lines.append(f"   • 공휴일 가산 수당 (Holiday): {holiday_bonus:,.2f} PHP")
                note_lines.append("     [정산체계: 국가 공휴일 200%, 특정 공휴일 130% 지급]")
            if meal_allowance > 0:
                note_lines.append(f"   • 식대 지원금 (Meal Allowance): {meal_allowance:,.2f} PHP")
                note_lines.append("     [정산체계: Driver 전용 - 2주당 200 PHP 정액 지급]")

        note_lines.append("")
        note_lines.append(f"2. 차감 항목 (Total Deductions): {total_deductions:,.2f} PHP")

        if late_deduction > 0:
            total_late_mins = sum(log.late_minutes for log in attendance_logs)
            note_lines.append(f"   • 지각 차감 (Late Deduction): -{late_deduction:,.2f} PHP")
            note_lines.append(f"     [정산체계: 총 {total_late_mins}분 지각, 10분 이상 지각 시 9분 제외 후 1분당 10 PHP 차감]")

        if absence_deduction > 0 or absent_count > 0:
            note_lines.append(f"   • 결근 차감 (Absence Deduction): -{absence_deduction:,.2f} PHP")
            note_lines.append(f"     [정산체계: Manager 전용 - 결근 {absent_count}일, 1일당 기본급의 1/15 차감]")

        if ca_deduction > 0:
            note_lines.append(f"   • 선지급금 차감 (Cash Advance): -{ca_deduction:,.2f} PHP")
            note_lines.append("     [정산체계: APPROVED 상태의 CA 전액 차감]")

        if health_check_deduction > 0:
            note_lines.append(f"   • 보건소 검사비 (Health Check): -{health_check_deduction:,.2f} PHP")
            note_lines.append("     [정산체계: Therapist 전용 - 분기말(3, 6, 9, 12월) 정산 시 500 PHP 일괄 차감]")

        if thirteenth_month_deduction > 0:
            months_employed = calc.calculate_months_employed(employee.hire_date, payroll_period.period_end)
            note_lines.append(f"   • 13개월 보너스 선지급 (13th Month): -{thirteenth_month_deduction:,.2f} PHP")
            note_lines.append(f"     [정산체계: 기본급의 1/12 × 입사 후 누적 근무 {months_employed}개월 누적액 차감]")

        note_lines.append("")
        note_lines.append(f"3. 최종 실지급액 (Net Pay): {net_pay:,.2f} PHP")
        note_lines.append("   • 실지급액은 수입(Gross Pay)에서 차감(Deductions)을 제하며,")
        note_lines.append("     음수 지급 방지를 위한 안전장치(Minimum 0 PHP)가 적용되었습니다.")
        note_lines.append("=" * 60)

        notes = "\n".join(note_lines)

        return PayrollRecord(
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
            thirteenth_month_accrual=thirteenth_month_accrual,
            thirteenth_month_deduction=thirteenth_month_deduction,
            gross_pay=gross_pay,
            total_deductions=total_deductions,
            net_pay=net_pay,
            notes=notes,
            status="draft",
            is_obsolete=False
        )

    @staticmethod
    async def mark_cash_advances_as_settled(
        employee_id: int,
        payroll_record_id: int,
        db: AsyncSession
    ) -> int:
        """
        BUG FIX #2: 직원의 모든 승인된 CA를 settled로 표시

        정산 계산 후 호출되어야 함. CA 중복 차감 방지.

        Args:
            employee_id: 직원 ID
            payroll_record_id: 정산 결과 ID (settled_payroll_id로 저장)
            db: AsyncSession

        Returns:
            업데이트된 CA 레코드 수

        예:
            # 급여 계산 후
            record = await calculate_payroll_for_period(period, db)
            db.add(record)
            await db.flush()  # record.id 생성

            updated_count = await mark_cash_advances_as_settled(
                employee_id,
                record.id,
                db
            )
        """
        # 해당 직원의 approved 상태 CA를 모두 settled로 변경
        stmt = (
            update(CashAdvance)
            .where(
                CashAdvance.employee_id == employee_id,
                CashAdvance.status == CashAdvanceStatus.APPROVED
            )
            .values(
                status=CashAdvanceStatus.SETTLED,
                settled_payroll_id=payroll_record_id
            )
        )
        result = await db.execute(stmt)
        return result.rowcount
