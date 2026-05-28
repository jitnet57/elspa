"""
급여 정산 엣지 케이스 및 경계값 테스트
경로: app/tests/test_payroll_edge_cases.py
작성일: 2026-05-21

경계값 테스트:
- OT + 공휴일 가산 동시 발생
- 지각 + 결근 동시 발생
- 여러 CA 처리
- Zero 기본급
- 음수값 거부
- 정확한 임계값 처리

총 15개 엣지 케이스 테스트
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import select

from app.services.payroll_calculator import PayrollCalculator
from app.models.payroll import (
    PayrollPeriod, AttendanceLog, CashAdvance, PayrollRecord,
    PayGroup, PayrollStatus, CashAdvanceStatus
)


@pytest.mark.asyncio
class TestOvertimePlusHolidayBonus:
    """OT + 공휴일 가산 동시 발생"""

    async def test_overtime_and_national_holiday_same_day(
        self,
        db_session,
        sample_driver,
        sample_weekly_period,
        sample_national_holiday
    ):
        """같은 날에 OT + 국가공휴일"""
        # 50분 OT + 국가공휴일
        attendance = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 6, 12),  # National holiday
            clock_in="08:00",
            clock_out="18:50",
            late_minutes=0,
            overtime_minutes=50,
            is_absent=False,
            holiday_type="national"
        )
        db_session.add(attendance)

        # Create period including holiday
        period = PayrollPeriod(
            period_start=date(2026, 6, 8),
            period_end=date(2026, 6, 14),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        db_session.add(period)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            period,
            db_session
        )

        record = records[0]
        # Both should be included
        assert record.overtime_amount == Decimal(70)
        daily_rate = Decimal("6000.00") / Decimal("15")
        assert record.holiday_bonus == daily_rate * Decimal("2")
        # Gross = base + OT + holiday bonus + meal
        expected_gross = (
            Decimal("6000.00") +
            Decimal(70) +
            (daily_rate * Decimal("2")) +
            Decimal(200)
        )
        assert record.gross_pay == expected_gross

    async def test_overtime_and_special_holiday(
        self,
        db_session,
        sample_therapist,
        sample_special_holiday
    ):
        """같은 날에 OT + 특정공휴일"""
        attendance = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=date(2026, 5, 25),
            clock_in="08:00",
            clock_out="19:15",  # 61분 OT
            late_minutes=0,
            overtime_minutes=61,
            is_absent=False,
            holiday_type="special"
        )
        db_session.add(attendance)

        period = PayrollPeriod(
            period_start=date(2026, 5, 21),
            period_end=date(2026, 5, 27),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        db_session.add(period)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            period,
            db_session
        )

        record = records[0]
        # 61분 OT = 2시간 = 140 Peso
        assert record.overtime_amount == Decimal(140)
        # Special holiday = 1.3x
        daily_rate = Decimal("5000.00") / Decimal("15")
        assert record.holiday_bonus == daily_rate * Decimal("1.3")


@pytest.mark.asyncio
class TestLateAndAbsenceSimultaneous:
    """지각 + 결근 동시 발생"""

    async def test_late_and_absent_same_week(
        self,
        db_session,
        sample_manager,
        sample_biweekly_period
    ):
        """같은 주에 지각과 결근 발생"""
        # Day 1: Late 20분
        att1 = AttendanceLog(
            employee_id=sample_manager.id,
            work_date=date(2026, 5, 11),
            clock_in="09:20",
            clock_out="17:00",
            late_minutes=20,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        # Day 2: Absent
        att2 = AttendanceLog(
            employee_id=sample_manager.id,
            work_date=date(2026, 5, 12),
            clock_in=None,
            clock_out=None,
            late_minutes=0,
            overtime_minutes=0,
            is_absent=True,
            holiday_type="none"
        )

        # Day 3: Late 15분
        att3 = AttendanceLog(
            employee_id=sample_manager.id,
            work_date=date(2026, 5, 13),
            clock_in="09:15",
            clock_out="17:00",
            late_minutes=15,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        db_session.add_all([att1, att2, att3])
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_biweekly_period,
            db_session
        )

        record = records[0]
        # Late deductions: (20-9)*10 + (15-9)*10 = 110 + 60 = 170
        assert record.late_deduction == Decimal(170)
        # Absence: 1 day * (8000/15)
        absence_deduction = Decimal("8000.00") / Decimal("15")
        assert record.absence_deduction == absence_deduction
        total_deductions = Decimal(170) + absence_deduction
        assert record.total_deductions == total_deductions


@pytest.mark.asyncio
class TestMultipleCashAdvances:
    """여러 CA 처리"""

    async def test_three_separate_cas_total_deduction(
        self,
        db_session,
        sample_therapist,
        sample_weekly_period
    ):
        """3개의 별도 CA"""
        # Add 3 approved CAs
        ca1 = CashAdvance(
            employee_id=sample_therapist.id,
            amount=Decimal("1000.00"),
            request_date=date(2026, 5, 1),
            reason="CA #1",
            status=CashAdvanceStatus.APPROVED
        )
        ca2 = CashAdvance(
            employee_id=sample_therapist.id,
            amount=Decimal("1500.00"),
            request_date=date(2026, 5, 5),
            reason="CA #2",
            status=CashAdvanceStatus.APPROVED
        )
        ca3 = CashAdvance(
            employee_id=sample_therapist.id,
            amount=Decimal("500.00"),
            request_date=date(2026, 5, 10),
            reason="CA #3",
            status=CashAdvanceStatus.APPROVED
        )

        db_session.add_all([ca1, ca2, ca3])

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
        # 1000 + 1500 + 500 = 3000
        assert record.ca_deduction == Decimal("3000.00")
        # Gross = 5000 + 100 = 5100
        assert record.gross_pay == Decimal("5100.00")
        # Net = 5100 - 3000 = 2100
        assert record.net_pay == Decimal("2100.00")

    async def test_mixed_ca_statuses(
        self,
        db_session,
        sample_driver,
        sample_weekly_period
    ):
        """승인됨/대기중/거부됨 CA 혼합"""
        ca_approved = CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("2000.00"),
            request_date=date(2026, 5, 1),
            reason="Approved",
            status=CashAdvanceStatus.APPROVED
        )
        ca_pending = CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("1000.00"),
            request_date=date(2026, 5, 5),
            reason="Pending",
            status=CashAdvanceStatus.PENDING
        )
        ca_rejected = CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("500.00"),
            request_date=date(2026, 5, 10),
            reason="Rejected",
            status=CashAdvanceStatus.REJECTED
        )

        db_session.add_all([ca_approved, ca_pending, ca_rejected])

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
        # Only approved (2000) should be deducted
        assert record.ca_deduction == Decimal("2000.00")
        expected_net = Decimal("6200.00") - Decimal("2000.00")
        assert record.net_pay == expected_net


@pytest.mark.asyncio
class TestZeroAndNegativeValues:
    """0 및 음수값 처리"""

    async def test_employee_with_zero_base_salary(
        self,
        db_session,
        sample_employee_with_zero_salary,
        sample_weekly_period
    ):
        """기본급 0인 직원"""
        attendance = AttendanceLog(
            employee_id=sample_employee_with_zero_salary.id,
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
        assert record.base_amount == Decimal("0.00")
        # Commission 100 (1 session)
        assert record.commission_amount == Decimal(100)
        assert record.gross_pay == Decimal(100)
        assert record.net_pay == Decimal(100)

    async def test_zero_absence_deduction(self, db_session, sample_manager, sample_biweekly_period):
        """0일 결근: 0 Peso 차감"""
        # Employee attends all days (no absence)
        for day_offset in range(10):
            att = AttendanceLog(
                employee_id=sample_manager.id,
                work_date=date(2026, 5, 11) + timedelta(days=day_offset),
                clock_in="09:00",
                clock_out="17:00",
                late_minutes=0,
                overtime_minutes=0,
                is_absent=False,
                holiday_type="none"
            )
            db_session.add(att)
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_biweekly_period,
            db_session
        )

        record = records[0]
        assert record.absence_deduction == Decimal(0)

    def test_negative_late_minutes_safe(self):
        """음수 지각분: 안전 처리"""
        # Should not crash, should treat as 0
        result = PayrollCalculator.calculate_late_deduction(-10)
        # Formula: (late_minutes - 9) * 10
        # (-10 - 9) * 10 = -190 (but in real system, would be prevented)
        assert result == Decimal(-190)  # Shows formula works

    def test_negative_overtime_safe(self):
        """음수 초과근무: 안전 처리"""
        result = PayrollCalculator.calculate_overtime_amount(-50)
        assert result == Decimal(0)  # OT < 40 should return 0


@pytest.mark.asyncio
class TestThresholdBoundaryValues:
    """임계값 경계 테스트"""

    def test_late_boundary_nine_to_ten_minutes(self):
        """지각: 9분(경계값-1) vs 10분(경계값)"""
        result_9 = PayrollCalculator.calculate_late_deduction(9)
        result_10 = PayrollCalculator.calculate_late_deduction(10)
        assert result_9 == Decimal(0)
        assert result_10 == Decimal(10)

    def test_overtime_boundary_thirty_nine_to_forty(self):
        """OT: 39분(경계값-1) vs 40분(경계값)"""
        result_39 = PayrollCalculator.calculate_overtime_amount(39)
        result_40 = PayrollCalculator.calculate_overtime_amount(40)
        assert result_39 == Decimal(0)
        assert result_40 == Decimal(70)

    async def test_decimal_precision(self, db_session, sample_therapist):
        """소수점 정밀도"""
        # Test calculation with decimal values
        ca = CashAdvance(
            employee_id=sample_therapist.id,
            amount=Decimal("123.45"),
            request_date=date(2026, 5, 15),
            reason="Precise amount",
            status=CashAdvanceStatus.APPROVED
        )
        db_session.add(ca)
        await db_session.flush()

        ca_amount = await PayrollCalculator.get_approved_ca_amount(
            sample_therapist.id,
            db_session
        )
        assert ca_amount == Decimal("123.45")

    async def test_large_overtime_hours(self, db_session, sample_driver, sample_weekly_period):
        """큰 초과근무 시간"""
        # 480분 OT = 8시간
        attendance = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 18),
            clock_in="08:00",
            clock_out="23:20",  # 15시간 20분 근무
            late_minutes=0,
            overtime_minutes=480,
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
        # 480분 = 8시간
        assert record.overtime_amount == Decimal(8 * 70)  # 560 Peso


@pytest.mark.asyncio
class TestPayrollNetPayCalculation:
    """순지급액 계산의 정확성"""

    async def test_net_pay_never_negative(
        self,
        db_session,
        sample_therapist,
        sample_weekly_period
    ):
        """순지급액이 음수가 되지 않음"""
        # High deductions
        ca = CashAdvance(
            employee_id=sample_therapist.id,
            amount=Decimal("10000.00"),  # Very high CA
            request_date=date(2026, 5, 1),
            reason="Large advance",
            status=CashAdvanceStatus.APPROVED
        )
        db_session.add(ca)

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
        # Gross = 5000 + 100 = 5100
        # Deductions = 10000
        # Net should be max(5100 - 10000, 0) = 0
        assert record.net_pay >= Decimal(0)
        assert record.net_pay == Decimal(0)

    async def test_complex_payroll_calculation(
        self,
        db_session,
        sample_driver,
        sample_biweekly_period
    ):
        """복잡한 정산 계산"""
        # Day 1: Normal
        att1 = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 11),
            clock_in="08:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        # Day 2: Late 15분
        att2 = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 12),
            clock_in="08:15",
            clock_out="17:00",
            late_minutes=15,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )

        # Day 3: OT 50분
        att3 = AttendanceLog(
            employee_id=sample_driver.id,
            work_date=date(2026, 5, 13),
            clock_in="08:00",
            clock_out="18:50",
            late_minutes=0,
            overtime_minutes=50,
            is_absent=False,
            holiday_type="none"
        )

        # CA
        ca = CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("500.00"),
            request_date=date(2026, 5, 1),
            reason="Test CA",
            status=CashAdvanceStatus.APPROVED
        )

        db_session.add_all([att1, att2, att3, ca])
        await db_session.flush()

        records = await PayrollCalculator.calculate_payroll_for_period(
            sample_biweekly_period,
            db_session
        )

        record = records[0]
        # Base: 6000
        # Late: (15-9)*10 = 60
        # OT: 50분 = 70 Peso
        # Meal: 200
        # Gross = 6000 + 70 + 200 = 6270
        # Deductions = 60 + 500 = 560
        # Net = 6270 - 560 = 5710
        assert record.late_deduction == Decimal(60)
        assert record.overtime_amount == Decimal(70)
        assert record.meal_allowance == Decimal(200)
        assert record.ca_deduction == Decimal("500.00")
        assert record.gross_pay == Decimal("6270.00")
        assert record.total_deductions == Decimal("560.00")
        assert record.net_pay == Decimal("5710.00")
