"""
급여 정산 통합 테스트
경로: app/tests/test_payroll_integration.py
작성일: 2026-05-21

엔드투엔드 정산 흐름:
1. 정산 기간 생성
2. 직원별 출퇴근 기록 추가
3. 급여 계산
4. CA 정산 추적
5. 상태 전환 (draft → approved → paid)

총 15개 통합 테스트
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import select

from app.services.payroll_calculator import PayrollCalculator
from app.models.payroll import (
    PayrollPeriod, PayrollRecord, AttendanceLog, CashAdvance,
    CashAdvanceStatus, PayrollStatus, EmployeeType, PayGroup
)


@pytest.mark.asyncio
class TestEndToEndPayrollCalculation:
    """엔드투엔드 급여 정산 플로우"""

    async def test_simple_employee_payroll(self, db_session, sample_therapist, sample_weekly_period):
        """간단한 직원 정산: 기본급만"""
        # Attendance setup
        attendance = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=date(2026, 5, 18),
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        db_session.add(attendance)
        await db_session.flush()

        # Calculate
        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_weekly_period,
            db_session
        )

        # Verify
        assert len(records) == 1
        record = records[0]
        assert record.employee_id == sample_therapist.id
        assert record.base_amount == Decimal("5000.00")
        assert record.late_deduction == Decimal(0)
        assert record.commission_amount == Decimal(100)  # 1 session * 100
        assert record.gross_pay == Decimal("5100.00")
        assert record.net_pay == Decimal("5100.00")

    async def test_therapist_with_commission(self, db_session, sample_therapist, sample_weekly_period):
        """테라피스트: 기본급 + 커미션"""
        # 5 sessions = 500 Peso commission
        for day_offset in range(5):
            attendance = AttendanceLog(
                employee_id=sample_therapist.id,
                work_date=date(2026, 5, 18) + timedelta(days=day_offset),
                clock_in="09:00",
                clock_out="17:00",
                late_minutes=0,
                overtime_minutes=0,
                is_absent=False,
                holiday_type="none"
            )
            db_session.add(attendance)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_weekly_period,
            db_session
        )

        record = records[0]
        assert record.commission_amount == Decimal(500)
        assert record.gross_pay == Decimal("5500.00")

    async def test_driver_with_overtime_and_meal_allowance(
        self,
        db_session,
        sample_driver,
        sample_weekly_period
    ):
        """드라이버: 기본급 + 초과근무 + 식대"""
        # 50분 OT = 70 Peso
        attendance = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 18),
            clock_in="08:00",
            clock_out="18:50",
            late_minutes=0,
            overtime_minutes=50,
            is_absent=False,
            holiday_type="none"
        )
        db_session.add(attendance)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_weekly_period,
            db_session
        )

        record = records[0]
        assert record.base_amount == Decimal("6000.00")
        assert record.overtime_amount == Decimal(70)
        assert record.meal_allowance == Decimal(200)
        assert record.gross_pay == Decimal("6270.00")

    async def test_manager_with_late_and_absence(
        self,
        db_session,
        sample_manager,
        sample_biweekly_period
    ):
        """매니저: 기본급 - 지각차감 - 결근차감"""
        # Day 1: 30분 지각 = 210 Peso 차감
        attendance1 = AttendanceLog(
            employee_id=sample_manager.id,
            work_date=date(2026, 5, 11),
            clock_in="09:30",
            clock_out="17:00",
            late_minutes=30,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        # Day 2: 결근
        attendance2 = AttendanceLog(
            employee_id=sample_manager.id,
            work_date=date(2026, 5, 12),
            clock_in=None,
            clock_out=None,
            late_minutes=0,
            overtime_minutes=0,
            is_absent=True,
            holiday_type="none"
        )
        db_session.add(attendance1)
        db_session.add(attendance2)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_biweekly_period,
            db_session
        )

        record = records[0]
        assert record.base_amount == Decimal("8000.00")
        assert record.late_deduction == Decimal(210)
        absence_deduction = Decimal("8000.00") / Decimal("15")  # ~533.33
        assert record.absence_deduction == absence_deduction
        assert record.total_deductions == Decimal(210) + absence_deduction
        assert record.net_pay > Decimal(0)

    async def test_employee_with_national_holiday_bonus(
        self,
        db_session,
        sample_therapist,
        sample_weekly_period,
        sample_national_holiday
    ):
        """직원: 국가공휴일 가산 (2.0x)"""
        attendance = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=date(2026, 6, 12),  # National holiday
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="national"
        )
        db_session.add(attendance)
        await db_session.flush()

        # Create period that includes the holiday
        holiday_period = PayrollPeriod(
            period_start=date(2026, 6, 8),
            period_end=date(2026, 6, 14),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        db_session.add(holiday_period)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            holiday_period,
            db_session
        )

        record = records[0]
        daily_rate = Decimal("5000.00") / Decimal("15")
        expected_bonus = daily_rate * Decimal("2")
        assert record.holiday_bonus == expected_bonus
        assert record.gross_pay == Decimal("5000.00") + expected_bonus + Decimal(100)

    async def test_employee_with_special_holiday_bonus(
        self,
        db_session,
        sample_nail_tech,
        sample_biweekly_period,
        sample_special_holiday
    ):
        """직원: 특정공휴일 가산 (1.3x)"""
        attendance = AttendanceLog(
            employee_id=sample_nail_tech.id,
            work_date=date(2026, 5, 25),
            clock_in="10:00",
            clock_out="18:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="special"
        )
        db_session.add(attendance)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_biweekly_period,
            db_session
        )

        record = records[0]
        daily_rate = Decimal("4500.00") / Decimal("15")
        expected_bonus = daily_rate * Decimal("1.3")
        assert record.holiday_bonus == expected_bonus
        assert record.gross_pay > Decimal("4500.00")  # Includes holiday bonus


@pytest.mark.asyncio
class TestMultiEmployeePayroll:
    """다중 직원 정산"""

    async def test_payroll_period_with_multiple_employees(
        self,
        db_session,
        sample_therapist,
        sample_driver,
        sample_manager,
        sample_weekly_period
    ):
        """한 정산 기간에 여러 직원"""
        # Therapist
        att1 = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=date(2026, 5, 18),
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        # Driver
        att2 = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 18),
            clock_in="08:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        # Manager
        att3 = AttendanceLog(
            employee_id=sample_manager.id,
            work_date=date(2026, 5, 18),
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        db_session.add_all([att1, att2, att3])
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_weekly_period,
            db_session
        )

        assert len(records) == 3
        employee_ids = {r.employee_id for r in records}
        assert sample_therapist.id in employee_ids
        assert sample_driver.id in employee_ids
        assert sample_manager.id in employee_ids

    async def test_different_pay_groups(self, db_session, sample_therapist, sample_nail_tech):
        """다른 급여 지급 주기"""
        weekly_period = PayrollPeriod(
            period_start=date(2026, 5, 18),
            period_end=date(2026, 5, 24),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        biweekly_period = PayrollPeriod(
            period_start=date(2026, 5, 11),
            period_end=date(2026, 5, 24),
            pay_group=PayGroup.BIWEEKLY,
            status=PayrollStatus.DRAFT
        )

        db_session.add_all([weekly_period, biweekly_period])
        await db_session.flush()

        # Add attendance
        att1 = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=date(2026, 5, 18),
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        att2 = AttendanceLog(
            employee_id=sample_nail_tech.id,
            work_date=date(2026, 5, 18),
            clock_in="10:00",
            clock_out="18:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        db_session.add_all([att1, att2])
        await db_session.flush()

        # Weekly should have therapist only
        weekly_records = await PayrollCalculator.calculate_payroll_for_period(
            weekly_period,
            db_session
        )
        assert len(weekly_records) == 1
        assert weekly_records[0].employee_id == sample_therapist.id

        # Biweekly should have nail tech only
        biweekly_records = await PayrollCalculator.calculate_payroll_for_period(
            biweekly_period,
            db_session
        )
        assert len(biweekly_records) == 1
        assert biweekly_records[0].employee_id == sample_nail_tech.id


@pytest.mark.asyncio
class TestCACashAdvanceSettlement:
    """CA 정산 추적"""

    async def test_ca_deduction_in_payroll(
        self,
        db_session,
        sample_therapist,
        sample_approved_ca,
        sample_weekly_period
    ):
        """정산에 CA 차감 포함"""
        attendance = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=date(2026, 5, 18),
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        db_session.add(attendance)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_weekly_period,
            db_session
        )

        record = records[0]
        assert record.ca_deduction == Decimal("2000.00")
        expected_net = Decimal("5100.00") - Decimal("2000.00")
        assert record.net_pay == expected_net

    async def test_multiple_cas_deduction(
        self,
        db_session,
        sample_driver,
        sample_multiple_approved_cas,
        sample_weekly_period
    ):
        """여러 CA 합계 차감"""
        attendance = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 18),
            clock_in="08:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        db_session.add(attendance)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_weekly_period,
            db_session
        )

        record = records[0]
        # 500 + 750 + 250 = 1500
        assert record.ca_deduction == Decimal("1500.00")
        assert record.net_pay == record.gross_pay - Decimal("1500.00")

    async def test_mark_cash_advances_as_settled(
        self,
        db_session,
        sample_therapist,
        sample_approved_ca
    ):
        """CA를 settled로 표시"""
        period = PayrollPeriod(
            period_start=date(2026, 5, 18),
            period_end=date(2026, 5, 24),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        db_session.add(period)
        await db_session.flush()

        record = PayrollRecord(
            payroll_period_id=period.id,
            employee_id=sample_therapist.id,
            base_amount=Decimal("5000.00"),
            commission_amount=Decimal(0),
            overtime_amount=Decimal(0),
            holiday_bonus=Decimal(0),
            meal_allowance=Decimal(0),
            late_deduction=Decimal(0),
            absence_deduction=Decimal(0),
            sss_deduction=Decimal(0),
            ca_deduction=Decimal("2000.00"),
            health_check_deduction=Decimal(0),
            thirteenth_month_deduction=Decimal(0),
            gross_pay=Decimal("5000.00"),
            total_deductions=Decimal("2000.00"),
            net_pay=Decimal("3000.00"),
            status=PayrollStatus.DRAFT
        )
        db_session.add(record)
        await db_session.flush()

        # Mark CA as settled
        updated_count = await PayrollCalculator.mark_cash_advances_as_settled(
            sample_therapist.id,
            record.id,
            db_session
        )

        assert updated_count == 1

        # Verify CA is now settled
        result = await db_session.execute(
            select(CashAdvance).where(CashAdvance.id == sample_approved_ca.id)
        )
        ca = result.scalar_one()
        assert ca.status == CashAdvanceStatus.SETTLED
        assert ca.settled_payroll_id == record.id


@pytest.mark.asyncio
class TestPayrollStatusTransition:
    """정산 상태 전환"""

    async def test_draft_to_approved(self, db_session, sample_weekly_period):
        """Draft → Approved 전환"""
        assert sample_weekly_period.status == PayrollStatus.DRAFT

        sample_weekly_period.status = PayrollStatus.APPROVED
        await db_session.flush()

        result = await db_session.execute(
            select(PayrollPeriod).where(PayrollPeriod.id == sample_weekly_period.id)
        )
        period = result.scalar_one()
        assert period.status == PayrollStatus.APPROVED

    async def test_approved_to_paid(self, db_session, sample_approved_period):
        """Approved → Paid 전환"""
        assert sample_approved_period.status == PayrollStatus.APPROVED

        sample_approved_period.status = PayrollStatus.PAID
        await db_session.flush()

        result = await db_session.execute(
            select(PayrollPeriod).where(PayrollPeriod.id == sample_approved_period.id)
        )
        period = result.scalar_one()
        assert period.status == PayrollStatus.PAID

    async def test_payroll_record_status_lifecycle(
        self,
        db_session,
        sample_payroll_record
    ):
        """정산 기록 상태 순환"""
        assert sample_payroll_record.status == PayrollStatus.DRAFT

        sample_payroll_record.status = PayrollStatus.APPROVED
        await db_session.flush()

        result = await db_session.execute(
            select(PayrollRecord).where(PayrollRecord.id == sample_payroll_record.id)
        )
        record = result.scalar_one()
        assert record.status == PayrollStatus.APPROVED

        record.status = PayrollStatus.PAID
        await db_session.flush()

        result = await db_session.execute(
            select(PayrollRecord).where(PayrollRecord.id == sample_payroll_record.id)
        )
        record = result.scalar_one()
        assert record.status == PayrollStatus.PAID
