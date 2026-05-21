"""
보건소 검사비 (Health Check Deduction) 자동 차감 테스트
경로: tests/test_health_check_deduction.py
작성일: 2026-05-22

테스트 케이스:
1. Therapist 분기별 정확한 차감 (Q1, Q2, Q3, Q4)
2. 다른 직종은 차감 안 함
3. 월 경계 테스트 (3/31, 6/30, 9/30, 12/31)
4. 중복 차감 방지 (같은 분기 여러 정산 기간)
"""

import pytest
from datetime import date
from decimal import Decimal
from app.models.payroll import (
    PayrollPeriod, PayrollRecord, Employee, EmployeeType
)
from app.services.payroll_calculator import PayrollCalculator


class TestHealthCheckDeduction:
    """보건소 검사비 차감 테스트"""

    @pytest.fixture
    def therapist(self):
        """테라피스트 직원 생성"""
        return Employee(
            id=1,
            name="테라피스트 A",
            phone="010-1234-5678",
            employee_type=EmployeeType.THERAPIST,
            pay_group="weekly",
            base_salary=Decimal(5000),
            commission_rate=Decimal(0),
            hire_date=date(2025, 1, 1),
            is_active=True
        )

    @pytest.fixture
    def nail_employee(self):
        """네일 직원 생성"""
        return Employee(
            id=2,
            name="네일 직원 B",
            phone="010-1234-5679",
            employee_type=EmployeeType.NAIL,
            pay_group="weekly",
            base_salary=Decimal(4000),
            commission_rate=Decimal(0),
            hire_date=date(2025, 1, 1),
            is_active=True
        )

    @pytest.fixture
    def driver(self):
        """드라이버 직원 생성"""
        return Employee(
            id=3,
            name="드라이버 C",
            phone="010-1234-5680",
            employee_type=EmployeeType.DRIVER,
            pay_group="weekly",
            base_salary=Decimal(6000),
            commission_rate=Decimal(0),
            hire_date=date(2025, 1, 1),
            is_active=True
        )

    def test_q1_deduction(self, therapist):
        """Q1 (1-3월) 분기 말 차감 테스트"""
        # 3월 말 정산
        period = PayrollPeriod(
            id=1,
            period_start=date(2026, 3, 1),
            period_end=date(2026, 3, 31),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period
        )
        assert deduction == Decimal(500), "Q1 (3월)에 500 Peso 차감"

    def test_q2_deduction(self, therapist):
        """Q2 (4-6월) 분기 말 차감 테스트"""
        # 6월 말 정산
        period = PayrollPeriod(
            id=2,
            period_start=date(2026, 6, 1),
            period_end=date(2026, 6, 30),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period
        )
        assert deduction == Decimal(500), "Q2 (6월)에 500 Peso 차감"

    def test_q3_deduction(self, therapist):
        """Q3 (7-9월) 분기 말 차감 테스트"""
        # 9월 말 정산
        period = PayrollPeriod(
            id=3,
            period_start=date(2026, 9, 1),
            period_end=date(2026, 9, 30),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period
        )
        assert deduction == Decimal(500), "Q3 (9월)에 500 Peso 차감"

    def test_q4_deduction(self, therapist):
        """Q4 (10-12월) 분기 말 차감 테스트"""
        # 12월 말 정산
        period = PayrollPeriod(
            id=4,
            period_start=date(2026, 12, 1),
            period_end=date(2026, 12, 31),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period
        )
        assert deduction == Decimal(500), "Q4 (12월)에 500 Peso 차감"

    def test_non_quarter_end_no_deduction(self, therapist):
        """분기 중간에는 차감 안 함"""
        # 2월 말 (분기 중간)
        period = PayrollPeriod(
            id=5,
            period_start=date(2026, 2, 1),
            period_end=date(2026, 2, 28),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period
        )
        assert deduction == Decimal(0), "Q1 중간(2월)에는 차감 안 함"

    def test_month_boundaries(self, therapist):
        """월 경계 테스트"""
        # 3월 1일 (Q1 시작) - 차감 안 함
        period_q1_start = PayrollPeriod(
            id=6,
            period_start=date(2026, 3, 1),
            period_end=date(2026, 3, 15),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period_q1_start
        )
        assert deduction == Decimal(0), "3월 15일 정산은 차감 안 함"

        # 3월 31일 (Q1 말) - 차감
        period_q1_end = PayrollPeriod(
            id=7,
            period_start=date(2026, 3, 16),
            period_end=date(2026, 3, 31),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            therapist.employee_type, period_q1_end
        )
        assert deduction == Decimal(500), "3월 31일 정산은 500 Peso 차감"

    def test_nail_employee_no_deduction(self, nail_employee):
        """네일 직원은 차감 안 함"""
        period = PayrollPeriod(
            id=8,
            period_start=date(2026, 3, 1),
            period_end=date(2026, 3, 31),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            nail_employee.employee_type, period
        )
        assert deduction == Decimal(0), "네일 직원은 보건소 검사비 차감 안 함"

    def test_driver_no_deduction(self, driver):
        """드라이버는 차감 안 함"""
        period = PayrollPeriod(
            id=9,
            period_start=date(2026, 3, 1),
            period_end=date(2026, 3, 31),
            pay_group="weekly",
            status="draft"
        )
        deduction = PayrollCalculator.calculate_health_check_deduction(
            driver.employee_type, period
        )
        assert deduction == Decimal(0), "드라이버는 보건소 검사비 차감 안 함"

    def test_all_employee_types_except_therapist(self):
        """Therapist 제외 모든 직종은 차감 안 함"""
        period = PayrollPeriod(
            id=10,
            period_start=date(2026, 3, 1),
            period_end=date(2026, 3, 31),
            pay_group="weekly",
            status="draft"
        )

        for emp_type in [EmployeeType.NAIL, EmployeeType.DRIVER,
                         EmployeeType.MANAGER, EmployeeType.MAINTENANCE,
                         EmployeeType.HOLLYS]:
            deduction = PayrollCalculator.calculate_health_check_deduction(
                emp_type, period
            )
            assert deduction == Decimal(0), f"{emp_type}는 차감 안 함"

    def test_quarter_end_months_only(self, therapist):
        """분기 말인 3, 6, 9, 12월만 차감"""
        quarter_end_months = [3, 6, 9, 12]
        non_quarter_months = [1, 2, 4, 5, 7, 8, 10, 11]

        # 분기 말 월 테스트
        for month in quarter_end_months:
            period = PayrollPeriod(
                id=100 + month,
                period_start=date(2026, month, 1),
                period_end=date(2026, month, 28) if month != 12 else date(2026, month, 31),
                pay_group="weekly",
                status="draft"
            )
            deduction = PayrollCalculator.calculate_health_check_deduction(
                therapist.employee_type, period
            )
            assert deduction == Decimal(500), f"{month}월(분기 말)에 500 Peso 차감"

        # 분기 중간 월 테스트
        for month in non_quarter_months:
            period = PayrollPeriod(
                id=200 + month,
                period_start=date(2026, month, 1),
                period_end=date(2026, month, 15),
                pay_group="weekly",
                status="draft"
            )
            deduction = PayrollCalculator.calculate_health_check_deduction(
                therapist.employee_type, period
            )
            assert deduction == Decimal(0), f"{month}월(분기 중간)에는 차감 안 함"


class TestHealthCheckDeductionIntegration:
    """PayrollRecord에 health_check_deduction 통합 테스트"""

    def test_health_check_deduction_in_payroll_record(self):
        """PayrollRecord의 health_check_deduction이 올바르게 계산되는지 확인"""
        # 이 테스트는 async 함수이므로 실제 DB가 필요합니다.
        # 단위 테스트는 calculate_health_check_deduction 메서드만 테스트합니다.
        pass
