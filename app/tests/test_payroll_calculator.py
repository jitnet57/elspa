"""
급여 계산 엔진 단위 테스트
경로: app/tests/test_payroll_calculator.py
작성일: 2026-05-21

테스트 커버리지:
- 지각 차감 계산 (late_minutes)
- 초과근무 수당 계산 (overtime_minutes)
- 공휴일 가산 (국가 2.0x, 특정 1.3x)
- 결근 차감
- 커미션 계산 (therapist, nail)
- CA 조회 및 차감

총 25개 테스트 케이스
"""

import pytest
from decimal import Decimal
from datetime import date

from app.services.payroll_calculator import PayrollCalculator
from app.models.payroll import EmployeeType


class TestLateDeduction:
    """지각 차감 계산 테스트"""

    def test_no_late_zero_minutes(self):
        """0분 지각: 0 Peso"""
        result = PayrollCalculator.calculate_late_deduction(0)
        assert result == Decimal(0)

    def test_no_late_five_minutes(self):
        """5분 지각 (임계값 이하): 0 Peso"""
        result = PayrollCalculator.calculate_late_deduction(5)
        assert result == Decimal(0)

    def test_no_late_nine_minutes(self):
        """9분 지각 (임계값): 0 Peso"""
        result = PayrollCalculator.calculate_late_deduction(9)
        assert result == Decimal(0)

    def test_late_ten_minutes(self):
        """10분 지각 (임계값 초과): 10 Peso (1분 * 10)"""
        result = PayrollCalculator.calculate_late_deduction(10)
        assert result == Decimal(10)

    def test_late_fifteen_minutes(self):
        """15분 지각: 60 Peso (6분 * 10)"""
        result = PayrollCalculator.calculate_late_deduction(15)
        assert result == Decimal(60)

    def test_late_thirty_minutes(self):
        """30분 지각: 210 Peso (21분 * 10)"""
        result = PayrollCalculator.calculate_late_deduction(30)
        assert result == Decimal(210)

    def test_late_one_hour(self):
        """60분 지각: 510 Peso (51분 * 10)"""
        result = PayrollCalculator.calculate_late_deduction(60)
        assert result == Decimal(510)

    def test_late_large_value(self):
        """120분 지각: 1110 Peso (111분 * 10)"""
        result = PayrollCalculator.calculate_late_deduction(120)
        assert result == Decimal(1110)

    @pytest.mark.parametrize("minutes,expected", [
        (0, Decimal(0)),
        (9, Decimal(0)),
        (10, Decimal(10)),
        (20, Decimal(110)),
        (45, Decimal(360)),
    ])
    def test_late_parametrized(self, minutes, expected):
        """파라미터화된 지각 차감 테스트"""
        result = PayrollCalculator.calculate_late_deduction(minutes)
        assert result == expected


class TestOvertimeCalculation:
    """초과근무 수당 계산 테스트"""

    def test_no_overtime_zero_minutes(self):
        """0분 OT: 0 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(0)
        assert result == Decimal(0)

    def test_no_overtime_twenty_minutes(self):
        """20분 OT (임계값 이하): 0 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(20)
        assert result == Decimal(0)

    def test_no_overtime_thirty_nine_minutes(self):
        """39분 OT (임계값 이하): 0 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(39)
        assert result == Decimal(0)

    def test_overtime_forty_minutes(self):
        """40분 OT (임계값): 1시간 = 70 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(40)
        assert result == Decimal(70)

    def test_overtime_forty_five_minutes(self):
        """45분 OT: 올림하여 1시간 = 70 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(45)
        assert result == Decimal(70)

    def test_overtime_sixty_minutes(self):
        """60분 OT: 1시간 = 70 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(60)
        assert result == Decimal(70)

    def test_overtime_sixty_one_minutes(self):
        """61분 OT: 올림하여 2시간 = 140 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(61)
        assert result == Decimal(140)

    def test_overtime_ninety_minutes(self):
        """90분 OT: 1.5시간 올림하여 2시간 = 140 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(90)
        assert result == Decimal(140)

    def test_overtime_one_hundred_twenty_minutes(self):
        """120분 OT: 2시간 = 140 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(120)
        assert result == Decimal(140)

    def test_overtime_one_hundred_fifty_minutes(self):
        """150분 OT: 2.5시간 올림하여 3시간 = 210 Peso"""
        result = PayrollCalculator.calculate_overtime_amount(150)
        assert result == Decimal(210)

    @pytest.mark.parametrize("minutes,expected", [
        (0, Decimal(0)),
        (39, Decimal(0)),
        (40, Decimal(70)),
        (45, Decimal(70)),
        (60, Decimal(70)),
        (61, Decimal(140)),
        (120, Decimal(140)),
        (121, Decimal(210)),
    ])
    def test_overtime_parametrized(self, minutes, expected):
        """파라미터화된 OT 계산 테스트"""
        result = PayrollCalculator.calculate_overtime_amount(minutes)
        assert result == expected


class TestHolidayBonus:
    """공휴일 가산 테스트"""

    def test_no_holiday(self):
        """공휴일 아님: 0 Peso"""
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("5000.00"),
            "none"
        )
        assert result == Decimal(0)

    def test_national_holiday_single_day(self):
        """국가 공휴일 1일: daily_rate * 2.0"""
        # daily_rate = 5000 / 15 = 333.33...
        # bonus = 333.33 * 2 = 666.66
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("5000.00"),
            "national",
            days_worked=1
        )
        expected = (Decimal("5000.00") / Decimal("15")) * Decimal("2")
        assert result == expected

    def test_special_holiday_single_day(self):
        """특정 공휴일 1일: daily_rate * 1.3"""
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("5000.00"),
            "special",
            days_worked=1
        )
        expected = (Decimal("5000.00") / Decimal("15")) * Decimal("1.3")
        assert result == expected

    def test_national_holiday_multiple_days(self):
        """국가 공휴일 3일: daily_rate * 2.0 * 3"""
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("6000.00"),
            "national",
            days_worked=3
        )
        expected = (Decimal("6000.00") / Decimal("15")) * Decimal("2") * Decimal("3")
        assert result == expected

    def test_special_holiday_multiple_days(self):
        """특정 공휴일 2일: daily_rate * 1.3 * 2"""
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("8000.00"),
            "special",
            days_worked=2
        )
        expected = (Decimal("8000.00") / Decimal("15")) * Decimal("1.3") * Decimal("2")
        assert result == expected

    def test_holiday_with_zero_salary(self):
        """기본급 0일 때: 0 Peso"""
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("0.00"),
            "national"
        )
        assert result == Decimal(0)

    def test_holiday_with_large_salary(self):
        """큰 금액: 정확한 계산"""
        result = PayrollCalculator.calculate_holiday_bonus(
            Decimal("15000.00"),
            "national"
        )
        expected = (Decimal("15000.00") / Decimal("15")) * Decimal("2")
        assert result == expected
        # 15000 / 15 = 1000, 1000 * 2 = 2000
        assert result == Decimal("2000")

    @pytest.mark.parametrize("salary,holiday_type,days,expected", [
        (Decimal("5000"), "none", 1, Decimal(0)),
        (Decimal("5000"), "national", 1, Decimal("5000") / Decimal("15") * Decimal("2")),
        (Decimal("5000"), "special", 1, Decimal("5000") / Decimal("15") * Decimal("1.3")),
        (Decimal("6000"), "national", 2, Decimal("6000") / Decimal("15") * Decimal("2") * Decimal("2")),
    ])
    def test_holiday_parametrized(self, salary, holiday_type, days, expected):
        """파라미터화된 공휴일 가산 테스트"""
        result = PayrollCalculator.calculate_holiday_bonus(salary, holiday_type, days)
        assert result == expected


class TestAbsenceDeduction:
    """결근 차감 테스트"""

    def test_no_absence(self):
        """결근 0일: 0 Peso"""
        result = PayrollCalculator.calculate_absence_deduction(
            Decimal("5000.00"),
            0
        )
        assert result == Decimal(0)

    def test_absence_negative_days(self):
        """음수 결근일: 0 Peso"""
        result = PayrollCalculator.calculate_absence_deduction(
            Decimal("5000.00"),
            -1
        )
        assert result == Decimal(0)

    def test_absence_one_day(self):
        """1일 결근: daily_rate * 1"""
        result = PayrollCalculator.calculate_absence_deduction(
            Decimal("5000.00"),
            1
        )
        expected = Decimal("5000.00") / Decimal("15")
        assert result == expected

    def test_absence_five_days(self):
        """5일 결근: daily_rate * 5"""
        result = PayrollCalculator.calculate_absence_deduction(
            Decimal("6000.00"),
            5
        )
        expected = (Decimal("6000.00") / Decimal("15")) * Decimal("5")
        assert result == expected

    def test_absence_with_zero_salary(self):
        """기본급 0: 0 Peso"""
        result = PayrollCalculator.calculate_absence_deduction(
            Decimal("0.00"),
            3
        )
        assert result == Decimal(0)

    @pytest.mark.parametrize("salary,days,expected", [
        (Decimal("5000"), 0, Decimal(0)),
        (Decimal("5000"), 1, Decimal("5000") / Decimal("15")),
        (Decimal("6000"), 5, Decimal("6000") / Decimal("15") * Decimal("5")),
        (Decimal("8000"), 3, Decimal("8000") / Decimal("15") * Decimal("3")),
    ])
    def test_absence_parametrized(self, salary, days, expected):
        """파라미터화된 결근 차감 테스트"""
        result = PayrollCalculator.calculate_absence_deduction(salary, days)
        assert result == expected


class TestCommissionCalculation:
    """커미션 계산 테스트"""

    def test_therapist_zero_sessions(self):
        """테라피스트 0 세션: 0 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.THERAPIST,
            0
        )
        assert result == Decimal(0)

    def test_therapist_one_session(self):
        """테라피스트 1 세션: 100 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.THERAPIST,
            1
        )
        assert result == Decimal(100)

    def test_therapist_five_sessions(self):
        """테라피스트 5 세션: 500 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.THERAPIST,
            5
        )
        assert result == Decimal(500)

    def test_nail_zero_sessions(self):
        """네일 0 세션: 0 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.NAIL,
            0
        )
        assert result == Decimal(0)

    def test_nail_ten_sessions(self):
        """네일 10 세션: 1000 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.NAIL,
            10
        )
        assert result == Decimal(1000)

    def test_driver_no_commission(self):
        """드라이버: 커미션 없음 0 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.DRIVER,
            5
        )
        assert result == Decimal(0)

    def test_manager_no_commission(self):
        """매니저: 커미션 없음 0 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.MANAGER,
            3
        )
        assert result == Decimal(0)

    def test_maintenance_no_commission(self):
        """유지보수: 커미션 없음 0 Peso"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.MAINTENANCE,
            7
        )
        assert result == Decimal(0)

    def test_custom_session_price(self):
        """커스텀 세션 가격: 150 Peso/session"""
        result = PayrollCalculator.calculate_commission(
            EmployeeType.THERAPIST,
            5,
            session_price=Decimal("150")
        )
        assert result == Decimal(750)

    @pytest.mark.parametrize("emp_type,sessions,expected", [
        (EmployeeType.THERAPIST, 0, Decimal(0)),
        (EmployeeType.THERAPIST, 1, Decimal(100)),
        (EmployeeType.THERAPIST, 10, Decimal(1000)),
        (EmployeeType.NAIL, 5, Decimal(500)),
        (EmployeeType.DRIVER, 5, Decimal(0)),
        (EmployeeType.MANAGER, 3, Decimal(0)),
    ])
    def test_commission_parametrized(self, emp_type, sessions, expected):
        """파라미터화된 커미션 계산 테스트"""
        result = PayrollCalculator.calculate_commission(emp_type, sessions)
        assert result == expected


@pytest.mark.asyncio
class TestApprovedCAAmount:
    """승인된 CA 조회 테스트"""

    async def test_no_ca(self, db_session, sample_therapist):
        """CA 없음: 0 Peso"""
        result = await PayrollCalculator.get_approved_ca_amount(
            sample_therapist.id,
            db_session
        )
        assert result == Decimal(0)

    async def test_single_approved_ca(self, db_session, sample_approved_ca):
        """승인된 CA 1개: 2000 Peso"""
        result = await PayrollCalculator.get_approved_ca_amount(
            sample_approved_ca.employee_id,
            db_session
        )
        assert result == Decimal("2000.00")

    async def test_multiple_approved_cas(self, db_session, sample_multiple_approved_cas):
        """여러 승인된 CA: 합계 1500 Peso"""
        employee_id = sample_multiple_approved_cas[0].employee_id
        result = await PayrollCalculator.get_approved_ca_amount(
            employee_id,
            db_session
        )
        # 500 + 750 + 250 = 1500
        assert result == Decimal("1500.00")

    async def test_pending_ca_not_counted(self, db_session, sample_pending_ca):
        """대기중인 CA는 계산 안 됨: 0 Peso"""
        result = await PayrollCalculator.get_approved_ca_amount(
            sample_pending_ca.employee_id,
            db_session
        )
        assert result == Decimal(0)

    async def test_rejected_ca_not_counted(self, db_session, sample_rejected_ca):
        """거부된 CA는 계산 안 됨: 0 Peso"""
        result = await PayrollCalculator.get_approved_ca_amount(
            sample_rejected_ca.employee_id,
            db_session
        )
        assert result == Decimal(0)


@pytest.mark.asyncio
class TestIsHoliday:
    """공휴일 판별 테스트"""

    async def test_normal_day_no_holiday(self, db_session):
        """일반 날짜: None 반환"""
        result = await PayrollCalculator.is_holiday(
            date(2026, 5, 20),
            db_session
        )
        assert result is None

    async def test_national_holiday(self, db_session, sample_national_holiday):
        """국가 공휴일: 'national' 반환"""
        result = await PayrollCalculator.is_holiday(
            date(2026, 6, 12),
            db_session
        )
        assert result == "national"

    async def test_special_holiday(self, db_session, sample_special_holiday):
        """특정 공휴일: 'special' 반환"""
        result = await PayrollCalculator.is_holiday(
            date(2026, 5, 25),
            db_session
        )
        assert result == "special"

    async def test_multiple_holidays(self, db_session, sample_multiple_holidays):
        """여러 공휴일 중: 정확한 날짜만 인식"""
        # First holiday
        result1 = await PayrollCalculator.is_holiday(
            date(2026, 1, 1),
            db_session
        )
        assert result1 == "national"

        # Second holiday
        result2 = await PayrollCalculator.is_holiday(
            date(2026, 4, 9),
            db_session
        )
        assert result2 == "national"

        # Third holiday
        result3 = await PayrollCalculator.is_holiday(
            date(2026, 11, 1),
            db_session
        )
        assert result3 == "special"
