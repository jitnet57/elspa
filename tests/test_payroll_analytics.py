"""
급여 정산 분석 API 테스트
경로: tests/test_payroll_analytics.py
작성일: 2026-05-22

테스트 항목:
  - 월별 추이 API
  - 직원별 분포 API
  - 차감 분석 API
  - 대시보드 요약 API
  - 직원별 상세 API
"""

import pytest
from httpx import AsyncClient
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.payroll import (
    Employee, PayrollPeriod, PayrollRecord, EmployeeType
)
from app.database import get_db


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
async def test_employee(db: AsyncSession):
    """테스트 직원 생성"""
    employee = Employee(
        name="Test Employee",
        phone="09123456789",
        employee_type=EmployeeType.THERAPIST.value,
        pay_group="weekly",
        base_salary=Decimal("50000.00"),
        commission_rate=Decimal("10.00"),
        hire_date=date(2026, 1, 1),
        is_active=True,
    )
    db.add(employee)
    await db.flush()
    return employee


@pytest.fixture
async def test_payroll_period(db: AsyncSession):
    """테스트 정산 기간 생성"""
    period = PayrollPeriod(
        period_start=date(2026, 5, 1),
        period_end=date(2026, 5, 7),
        pay_group="weekly",
        status="draft",
    )
    db.add(period)
    await db.flush()
    return period


@pytest.fixture
async def test_payroll_record(db: AsyncSession, test_employee, test_payroll_period):
    """테스트 정산 기록 생성"""
    record = PayrollRecord(
        payroll_period_id=test_payroll_period.id,
        employee_id=test_employee.id,
        base_amount=Decimal("50000.00"),
        commission_amount=Decimal("5000.00"),
        overtime_amount=Decimal("0.00"),
        holiday_bonus=Decimal("0.00"),
        meal_allowance=Decimal("0.00"),
        late_deduction=Decimal("1000.00"),
        absence_deduction=Decimal("0.00"),
        sss_deduction=Decimal("0.00"),
        ca_deduction=Decimal("5000.00"),
        health_check_deduction=Decimal("500.00"),
        thirteenth_month_deduction=Decimal("2000.00"),
        gross_pay=Decimal("55000.00"),
        total_deductions=Decimal("8500.00"),
        net_pay=Decimal("46500.00"),
        status="draft",
    )
    db.add(record)
    await db.flush()
    return record


# ============================================================
# 테스트
# ============================================================

@pytest.mark.asyncio
async def test_monthly_trend_api(client: AsyncClient):
    """월별 추이 API 테스트"""
    response = await client.get(
        "/api/payroll/analytics/monthly-trend?year=2026",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()

    # 응답 형식 검증
    assert "months" in data
    assert "total_payroll" in data
    assert "average_pay" in data
    assert "deductions" in data

    # 데이터 길이 검증
    assert len(data["months"]) == 12
    assert len(data["total_payroll"]) == 12
    assert len(data["average_pay"]) == 12
    assert len(data["deductions"]) == 12

    # 데이터 타입 검증
    assert all(isinstance(m, str) for m in data["months"])
    assert all(isinstance(v, (int, float)) for v in data["total_payroll"])


@pytest.mark.asyncio
async def test_employee_distribution_api(client: AsyncClient, test_payroll_period: PayrollPeriod):
    """직원별 분포 API 테스트"""
    response = await client.get(
        f"/api/payroll/analytics/employee-distribution?period_id={test_payroll_period.id}",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()

    # 응답 형식 검증
    assert "employees" in data
    assert "net_pay" in data
    assert "gross_pay" in data

    # 데이터 길이 일치 검증
    assert len(data["employees"]) == len(data["net_pay"])
    assert len(data["employees"]) == len(data["gross_pay"])


@pytest.mark.asyncio
async def test_deduction_breakdown_api(client: AsyncClient, test_payroll_period: PayrollPeriod):
    """차감 분석 API 테스트"""
    response = await client.get(
        f"/api/payroll/analytics/deduction-breakdown?period_id={test_payroll_period.id}",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()

    # 응답 형식 검증
    assert "labels" in data
    assert "values" in data
    assert "percentages" in data

    # 차감 항목 검증
    assert len(data["labels"]) == 5
    assert set(data["labels"]) == {"CA", "지각", "13개월", "보건소", "SSS"}

    # 데이터 일치 검증
    assert len(data["values"]) == 5
    assert len(data["percentages"]) == 5


@pytest.mark.asyncio
async def test_payroll_summary_api(client: AsyncClient, test_payroll_period: PayrollPeriod):
    """대시보드 요약 API 테스트"""
    response = await client.get(
        f"/api/payroll/analytics/summary?period_id={test_payroll_period.id}",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()

    # 응답 형식 검증
    assert "total_employees" in data
    assert "total_payroll" in data
    assert "average_gross" in data
    assert "average_net" in data
    assert "top_earner" in data
    assert "lowest_earner" in data

    # 데이터 타입 검증
    assert isinstance(data["total_employees"], int)
    assert isinstance(data["total_payroll"], (int, float))
    assert isinstance(data["average_gross"], (int, float))
    assert isinstance(data["average_net"], (int, float))


@pytest.mark.asyncio
async def test_employee_details_api(client: AsyncClient, test_payroll_period: PayrollPeriod):
    """직원별 상세 API 테스트"""
    response = await client.get(
        f"/api/payroll/analytics/employee-details?period_id={test_payroll_period.id}&skip=0&limit=50",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()

    # 응답 형식 검증
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)

    # 항목 형식 검증
    if data["items"]:
        item = data["items"][0]
        assert "employee_id" in item
        assert "name" in item
        assert "employee_type" in item
        assert "gross_pay" in item
        assert "total_deductions" in item
        assert "net_pay" in item
        assert "top_deduction" in item

        # 최대 차감 항목 검증
        top_ded = item["top_deduction"]
        assert "type" in top_ded
        assert "amount" in top_ded


@pytest.mark.asyncio
async def test_invalid_period_id(client: AsyncClient):
    """존재하지 않는 정산 기간 조회 테스트"""
    response = await client.get(
        "/api/payroll/analytics/employee-distribution?period_id=999999",
        headers={"Authorization": "Bearer test_token"}
    )
    # 빈 결과 반환 (에러 아님)
    assert response.status_code == 200
    data = response.json()
    assert data["employees"] == []


@pytest.mark.asyncio
async def test_missing_period_parameter(client: AsyncClient):
    """필수 파라미터 누락 테스트"""
    response = await client.get(
        "/api/payroll/analytics/employee-distribution",
        headers={"Authorization": "Bearer test_token"}
    )
    # 필수 파라미터 누락 시 400 에러
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """인증되지 않은 접근 테스트"""
    response = await client.get(
        "/api/payroll/analytics/monthly-trend?year=2026"
    )
    # 인증 없이 관리자 엔드포인트 접근 불가
    assert response.status_code == 401 or response.status_code == 403
