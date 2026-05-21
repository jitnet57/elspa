"""
13개월 보너스 계산 엔진 테스트
경로: tests/test_thirteenth_month_bonus.py
작성일: 2026-05-22

테스트 케이스:
1. 기본급 계산
2. 개월 수에 따른 비례 계산
3. 중도 입사자 (hire_date 고려)
4. 여러 급여 기간에 걸친 누적
5. 엣지 케이스 (0 기본급, 장기 근무자 등)
"""

import pytest
from datetime import date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import Employee, PayrollPeriod, PayrollRecord, EmployeeType, PayGroup
from app.services.payroll_calculator import PayrollCalculator


class TestThirteenthMonthBonusCalculation:
    """13개월 보너스 계산 테스트"""

    def test_calculate_months_employed_full_years(self):
        """
        테스트 1: 전체 연도 계산
        - 2025-01-15 입사
        - 2025-12-31 기준
        - 예상: 11개월 (1월~11월)
        """
        hire_date = date(2025, 1, 15)
        reference_date = date(2025, 12, 31)

        months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)

        assert months == 11, f"Expected 11 months, got {months}"

    def test_calculate_months_employed_same_day(self):
        """
        테스트 2: 같은 날짜
        - 2025-01-15 입사
        - 2025-01-15 기준
        - 예상: 1개월
        """
        hire_date = date(2025, 1, 15)
        reference_date = date(2025, 1, 15)

        months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)

        assert months == 1, f"Expected 1 month, got {months}"

    def test_calculate_months_employed_before_day(self):
        """
        테스트 3: 기준일이 입사일보다 이른 날짜
        - 2025-05-15 입사
        - 2025-05-14 기준
        - 예상: 0개월 (입사 전)
        """
        hire_date = date(2025, 5, 15)
        reference_date = date(2025, 5, 14)

        months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)

        assert months == 0, f"Expected 0 months, got {months}"

    def test_calculate_months_employed_next_day(self):
        """
        테스트 4: 다음 날짜
        - 2025-01-15 입사
        - 2025-01-16 기준
        - 예상: 1개월
        """
        hire_date = date(2025, 1, 15)
        reference_date = date(2025, 1, 16)

        months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)

        assert months == 1, f"Expected 1 month, got {months}"

    def test_calculate_months_employed_multiple_years(self):
        """
        테스트 5: 여러 연도
        - 2024-03-20 입사
        - 2026-05-22 기준
        - 예상: 26개월 (2024년 3월~2026년 4월 = 26개월)
        """
        hire_date = date(2024, 3, 20)
        reference_date = date(2026, 5, 22)

        months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)

        assert months == 26, f"Expected 26 months, got {months}"

    def test_thirteenth_month_deduction_base_case(self):
        """
        테스트 6: 기본 케이스
        - 기본급: 12,000 Peso
        - 입사: 2025-01-01
        - 기준: 2025-05-31 (5개월)
        - 월 금액: 12,000 / 12 = 1,000
        - 누적액: 1,000 × 5 = 5,000
        """
        base_salary = Decimal(12000)
        hire_date = date(2025, 1, 1)
        reference_date = date(2025, 5, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        assert deduction == Decimal(5000), f"Expected 5000, got {deduction}"

    def test_thirteenth_month_deduction_mid_hire(self):
        """
        테스트 7: 중도 입사자
        - 기본급: 15,000 Peso
        - 입사: 2025-02-15
        - 기준: 2025-05-22
        - 개월: 3개월 (2월, 3월, 4월)
        - 월 금액: 15,000 / 12 = 1,250
        - 누적액: 1,250 × 3 = 3,750
        """
        base_salary = Decimal(15000)
        hire_date = date(2025, 2, 15)
        reference_date = date(2025, 5, 22)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        assert deduction == Decimal(3750), f"Expected 3750, got {deduction}"

    def test_thirteenth_month_deduction_one_month(self):
        """
        테스트 8: 1개월 근무
        - 기본급: 20,000 Peso
        - 입사: 2025-05-01
        - 기준: 2025-05-31
        - 개월: 1개월
        - 월 금액: 20,000 / 12 = 1,666.67
        - 누적액: 1,666.67 × 1 = 1,666.67
        """
        base_salary = Decimal(20000)
        hire_date = date(2025, 5, 1)
        reference_date = date(2025, 5, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        expected = (Decimal(20000) / Decimal(12)) * Decimal(1)
        assert deduction == expected, f"Expected {expected}, got {deduction}"

    def test_thirteenth_month_deduction_long_term(self):
        """
        테스트 9: 장기 근무자 (2년 이상)
        - 기본급: 25,000 Peso
        - 입사: 2024-01-01
        - 기준: 2026-05-31
        - 개월: 29개월
        - 월 금액: 25,000 / 12 = 2,083.33
        - 누적액: 2,083.33 × 29 = 60,416.67
        """
        base_salary = Decimal(25000)
        hire_date = date(2024, 1, 1)
        reference_date = date(2026, 5, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)
        expected = (Decimal(25000) / Decimal(12)) * Decimal(months)
        assert deduction == expected, f"Expected {expected}, got {deduction}"

    def test_thirteenth_month_deduction_zero_salary(self):
        """
        테스트 10: 0 기본급 (엣지 케이스)
        - 기본급: 0 Peso
        - 입사: 2025-01-01
        - 기준: 2025-05-31
        - 예상: 0
        """
        base_salary = Decimal(0)
        hire_date = date(2025, 1, 1)
        reference_date = date(2025, 5, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        assert deduction == Decimal(0), f"Expected 0, got {deduction}"

    def test_thirteenth_month_deduction_negative_salary(self):
        """
        테스트 11: 음수 기본급 (엣지 케이스)
        - 기본급: -1,000 Peso (유효하지 않음)
        - 입사: 2025-01-01
        - 기준: 2025-05-31
        - 예상: 0
        """
        base_salary = Decimal(-1000)
        hire_date = date(2025, 1, 1)
        reference_date = date(2025, 5, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        assert deduction == Decimal(0), f"Expected 0, got {deduction}"

    def test_thirteenth_month_deduction_decimal_precision(self):
        """
        테스트 12: 소수점 정확도
        - 기본급: 10,000 Peso
        - 입사: 2025-01-01
        - 기준: 2025-01-31
        - 월 금액: 10,000 / 12 = 833.33...
        - 누적액: 833.33... × 1 = 833.33...
        """
        base_salary = Decimal(10000)
        hire_date = date(2025, 1, 1)
        reference_date = date(2025, 1, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        expected = (Decimal(10000) / Decimal(12)).quantize(Decimal('0.01'))
        assert deduction == expected, f"Expected {expected}, got {deduction}"

    def test_thirteenth_month_deduction_full_year(self):
        """
        테스트 13: 전체 1년
        - 기본급: 12,000 Peso
        - 입사: 2025-01-01
        - 기준: 2025-12-31
        - 개월: 12개월
        - 월 금액: 12,000 / 12 = 1,000
        - 누적액: 1,000 × 12 = 12,000
        """
        base_salary = Decimal(12000)
        hire_date = date(2025, 1, 1)
        reference_date = date(2025, 12, 31)

        deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, reference_date
        )

        assert deduction == Decimal(12000), f"Expected 12000, got {deduction}"


class TestThirteenthMonthBonusIntegration:
    """13개월 보너스 통합 테스트 (실제 PayrollRecord 생성)"""

    @pytest.mark.asyncio
    async def test_payroll_record_includes_thirteenth_month(self, async_session: AsyncSession):
        """
        테스트 14: PayrollRecord에 13개월 보너스 포함
        - 직원 생성
        - 정산 기간 생성
        - 급여 계산 실행
        - 13개월 보너스 필드 확인
        """
        # 직원 생성
        employee = Employee(
            name="Test Employee",
            phone="555-1234",
            employee_type=EmployeeType.DRIVER,
            pay_group=PayGroup.WEEKLY,
            base_salary=Decimal(12000),
            hire_date=date(2025, 1, 1),
            is_active=True
        )
        async_session.add(employee)
        await async_session.flush()

        # 정산 기간 생성
        period = PayrollPeriod(
            period_start=date(2025, 5, 1),
            period_end=date(2025, 5, 31),
            pay_group=PayGroup.WEEKLY,
            status="draft"
        )
        async_session.add(period)
        await async_session.flush()

        # 급여 계산
        records = await PayrollCalculator.calculate_payroll_for_period(period, async_session)

        assert len(records) == 1
        record = records[0]

        # 13개월 보너스 확인
        assert record.thirteenth_month_deduction == Decimal(5000)
        assert record.thirteenth_month_accrual == Decimal(5000)

    @pytest.mark.asyncio
    async def test_thirteenth_month_accumulation_multiple_periods(
        self, async_session: AsyncSession
    ):
        """
        테스트 15: 여러 정산 기간에 걸친 누적
        - 직원: 기본급 12,000 Peso, 1월 1일 입사
        - 기간 1: 1월 (1개월) → 1,000
        - 기간 2: 2월 (2개월) → 2,000
        - 기간 3: 3월 (3개월) → 3,000
        - 누적: 6,000
        """
        # 직원 생성
        employee = Employee(
            name="Accumulation Test",
            phone="555-5555",
            employee_type=EmployeeType.THERAPIST,
            pay_group=PayGroup.WEEKLY,
            base_salary=Decimal(12000),
            hire_date=date(2025, 1, 1),
            is_active=True
        )
        async_session.add(employee)
        await async_session.flush()

        # 기간 1: 1월
        period1 = PayrollPeriod(
            period_start=date(2025, 1, 1),
            period_end=date(2025, 1, 31),
            pay_group=PayGroup.WEEKLY,
            status="draft"
        )
        async_session.add(period1)
        await async_session.flush()

        records1 = await PayrollCalculator.calculate_payroll_for_period(period1, async_session)
        async_session.add_all(records1)
        await async_session.flush()

        # 기간 2: 2월
        period2 = PayrollPeriod(
            period_start=date(2025, 2, 1),
            period_end=date(2025, 2, 28),
            pay_group=PayGroup.WEEKLY,
            status="draft"
        )
        async_session.add(period2)
        await async_session.flush()

        records2 = await PayrollCalculator.calculate_payroll_for_period(period2, async_session)
        async_session.add_all(records2)
        await async_session.flush()

        # 기간 3: 3월
        period3 = PayrollPeriod(
            period_start=date(2025, 3, 1),
            period_end=date(2025, 3, 31),
            pay_group=PayGroup.WEEKLY,
            status="draft"
        )
        async_session.add(period3)
        await async_session.flush()

        records3 = await PayrollCalculator.calculate_payroll_for_period(period3, async_session)
        async_session.add_all(records3)
        await async_session.flush()

        # 각 기간의 13개월 보너스 확인
        assert records1[0].thirteenth_month_deduction == Decimal(1000)
        assert records2[0].thirteenth_month_deduction == Decimal(2000)
        assert records3[0].thirteenth_month_deduction == Decimal(3000)

        # 누적액 확인
        total = sum(
            r.thirteenth_month_deduction for records in [records1, records2, records3] for r in records
        )
        assert total == Decimal(6000)
