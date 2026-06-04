"""
공통 fixture 및 테스트 DB 설정
경로: app/tests/conftest.py
작성일: 2026-05-21

pytest fixture를 사용하여 테스트 데이터 및 데이터베이스 세션 제공
"""

import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Generator, AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.payroll import (
    Employee, PayrollPeriod, PayrollRecord, CashAdvance,
    AttendanceLog, PhilippineHoliday, EmployeeType, PayGroup,
    CashAdvanceStatus, HolidayType, PayrollStatus
)


# ============================================================
# 데이터베이스 설정 (메모리 SQLite)
# ============================================================

@pytest.fixture(scope="session")
def event_loop():
    """비동기 이벤트 루프 fixture"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """테스트용 비동기 엔진 (메모리 DB)"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        connect_args={"check_same_thread": False}
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture(scope="session")
async def test_session_factory(test_engine):
    """테스트용 세션 팩토리"""
    SessionLocal = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    return SessionLocal


@pytest.fixture
async def db_session(test_session_factory):
    """각 테스트마다 새로운 세션 (자동 롤백)"""
    async with test_session_factory() as session:
        async with session.begin():
            yield session
            # 테스트 후 자동 롤백
            await session.rollback()


# ============================================================
# Employee Fixture (직원 데이터)
# ============================================================

@pytest.fixture
async def sample_therapist(db_session: AsyncSession) -> Employee:
    """테라피스트 직원"""
    employee = Employee(
        name="Anna Therapist",
        phone="09171234567",
        employee_type=EmployeeType.THERAPIST,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("5000.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2025, 1, 1),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


@pytest.fixture
async def sample_nail_tech(db_session: AsyncSession) -> Employee:
    """네일 기술자"""
    employee = Employee(
        name="Maria Nail",
        phone="09172345678",
        employee_type=EmployeeType.NAIL,
        pay_group=PayGroup.BIWEEKLY,
        base_salary=Decimal("4500.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2025, 1, 15),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


@pytest.fixture
async def sample_driver(db_session: AsyncSession) -> Employee:
    """드라이버"""
    employee = Employee(
        name="John Driver",
        phone="09173456789",
        employee_type=EmployeeType.DRIVER,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("6000.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2024, 6, 1),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


@pytest.fixture
async def sample_manager(db_session: AsyncSession) -> Employee:
    """매니저"""
    employee = Employee(
        name="Boss Manager",
        phone="09174567890",
        employee_type=EmployeeType.MANAGER,
        pay_group=PayGroup.BIWEEKLY,
        base_salary=Decimal("8000.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2023, 1, 1),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


@pytest.fixture
async def sample_maintenance(db_session: AsyncSession) -> Employee:
    """유지보수 담당"""
    employee = Employee(
        name="Tech Maintenance",
        phone="09175678901",
        employee_type=EmployeeType.MAINTENANCE,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("5500.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2024, 3, 15),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


@pytest.fixture
async def sample_hollys(db_session: AsyncSession) -> Employee:
    """할리스 카페 직원"""
    employee = Employee(
        name="Barista Hollys",
        phone="09176789012",
        employee_type=EmployeeType.HOLLYS,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("4800.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2024, 5, 1),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


@pytest.fixture
async def sample_employee_with_zero_salary(db_session: AsyncSession) -> Employee:
    """기본급이 0인 직원"""
    employee = Employee(
        name="Zero Salary Employee",
        phone="09177890123",
        employee_type=EmployeeType.THERAPIST,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("0.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2025, 5, 1),
        is_active=True
    )
    db_session.add(employee)
    await db_session.flush()
    return employee


# ============================================================
# PayrollPeriod Fixture (정산 기간)
# ============================================================

@pytest.fixture
async def sample_weekly_period(db_session: AsyncSession) -> PayrollPeriod:
    """주간 정산 기간 (월-일)"""
    period = PayrollPeriod(
        period_start=date(2026, 5, 18),  # Monday
        period_end=date(2026, 5, 24),    # Sunday
        pay_group=PayGroup.WEEKLY,
        status=PayrollStatus.DRAFT
    )
    db_session.add(period)
    await db_session.flush()
    return period


@pytest.fixture
async def sample_biweekly_period(db_session: AsyncSession) -> PayrollPeriod:
    """격주 정산 기간"""
    period = PayrollPeriod(
        period_start=date(2026, 5, 11),
        period_end=date(2026, 5, 24),
        pay_group=PayGroup.BIWEEKLY,
        status=PayrollStatus.DRAFT
    )
    db_session.add(period)
    await db_session.flush()
    return period


@pytest.fixture
async def sample_approved_period(db_session: AsyncSession) -> PayrollPeriod:
    """승인된 정산 기간"""
    period = PayrollPeriod(
        period_start=date(2026, 5, 11),
        period_end=date(2026, 5, 17),
        pay_group=PayGroup.WEEKLY,
        status=PayrollStatus.APPROVED
    )
    db_session.add(period)
    await db_session.flush()
    return period


# ============================================================
# AttendanceLog Fixture (출퇴근 기록)
# ============================================================

@pytest.fixture
async def sample_normal_attendance(
    db_session: AsyncSession,
    sample_therapist: Employee
) -> AttendanceLog:
    """정상 출근"""
    log = AttendanceLog(
        employee_id=sample_therapist.id,
        work_date=date(2026, 5, 18),
        clock_in="09:00",
        clock_out="17:00",
        late_minutes=0,
        overtime_minutes=0,
        is_absent=False,
        holiday_type="none"
    )
    db_session.add(log)
    await db_session.flush()
    return log


@pytest.fixture
async def sample_late_attendance(
    db_session: AsyncSession,
    sample_therapist: Employee
) -> AttendanceLog:
    """지각 기록"""
    log = AttendanceLog(
        employee_id=sample_therapist.id,
        work_date=date(2026, 5, 19),
        clock_in="09:10",
        clock_out="17:00",
        late_minutes=10,
        overtime_minutes=0,
        is_absent=False,
        holiday_type="none"
    )
    db_session.add(log)
    await db_session.flush()
    return log


@pytest.fixture
async def sample_overtime_attendance(
    db_session: AsyncSession,
    sample_driver: Employee
) -> AttendanceLog:
    """초과근무 기록"""
    log = AttendanceLog(
        employee_id=sample_driver.id,
        work_date=date(2026, 5, 20),
        clock_in="08:00",
        clock_out="18:50",  # 10시간 50분
        late_minutes=0,
        overtime_minutes=50,  # 50분 OT
        is_absent=False,
        holiday_type="none"
    )
    db_session.add(log)
    await db_session.flush()
    return log


@pytest.fixture
async def sample_absent_attendance(
    db_session: AsyncSession,
    sample_manager: Employee
) -> AttendanceLog:
    """결근 기록"""
    log = AttendanceLog(
        employee_id=sample_manager.id,
        work_date=date(2026, 5, 21),
        clock_in=None,
        clock_out=None,
        late_minutes=0,
        overtime_minutes=0,
        is_absent=True,
        holiday_type="none"
    )
    db_session.add(log)
    await db_session.flush()
    return log


@pytest.fixture
async def sample_holiday_attendance_national(
    db_session: AsyncSession,
    sample_therapist: Employee
) -> AttendanceLog:
    """국가공휴일 출근 기록"""
    log = AttendanceLog(
        employee_id=sample_therapist.id,
        work_date=date(2026, 5, 25),
        clock_in="09:00",
        clock_out="17:00",
        late_minutes=0,
        overtime_minutes=0,
        is_absent=False,
        holiday_type=HolidayType.NATIONAL
    )
    db_session.add(log)
    await db_session.flush()
    return log


@pytest.fixture
async def sample_holiday_attendance_special(
    db_session: AsyncSession,
    sample_nail_tech: Employee
) -> AttendanceLog:
    """특정공휴일 출근 기록"""
    log = AttendanceLog(
        employee_id=sample_nail_tech.id,
        work_date=date(2026, 5, 26),
        clock_in="10:00",
        clock_out="18:00",
        late_minutes=0,
        overtime_minutes=0,
        is_absent=False,
        holiday_type=HolidayType.SPECIAL
    )
    db_session.add(log)
    await db_session.flush()
    return log


# ============================================================
# CashAdvance Fixture (CA)
# ============================================================

@pytest.fixture
async def sample_pending_ca(
    db_session: AsyncSession,
    sample_therapist: Employee
) -> CashAdvance:
    """대기중인 CA"""
    ca = CashAdvance(
        employee_id=sample_therapist.id,
        amount=Decimal("1000.00"),
        request_date=date(2026, 5, 15),
        reason="Medical emergency",
        status=CashAdvanceStatus.PENDING
    )
    db_session.add(ca)
    await db_session.flush()
    return ca


@pytest.fixture
async def sample_approved_ca(
    db_session: AsyncSession,
    sample_therapist: Employee
) -> CashAdvance:
    """승인된 CA"""
    ca = CashAdvance(
        employee_id=sample_therapist.id,
        amount=Decimal("2000.00"),
        request_date=date(2026, 5, 10),
        reason="Living expenses",
        status=CashAdvanceStatus.APPROVED
    )
    db_session.add(ca)
    await db_session.flush()
    return ca


@pytest.fixture
async def sample_multiple_approved_cas(
    db_session: AsyncSession,
    sample_driver: Employee
) -> list:
    """여러 개의 승인된 CA"""
    cas = [
        CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("500.00"),
            request_date=date(2026, 5, 1),
            reason="CA #1",
            status=CashAdvanceStatus.APPROVED
        ),
        CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("750.00"),
            request_date=date(2026, 5, 5),
            reason="CA #2",
            status=CashAdvanceStatus.APPROVED
        ),
        CashAdvance(
            employee_id=sample_driver.id,
            amount=Decimal("250.00"),
            request_date=date(2026, 5, 10),
            reason="CA #3",
            status=CashAdvanceStatus.APPROVED
        ),
    ]
    for ca in cas:
        db_session.add(ca)
    await db_session.flush()
    return cas


@pytest.fixture
async def sample_rejected_ca(
    db_session: AsyncSession,
    sample_manager: Employee
) -> CashAdvance:
    """거부된 CA"""
    ca = CashAdvance(
        employee_id=sample_manager.id,
        amount=Decimal("5000.00"),
        request_date=date(2026, 5, 12),
        reason="Luxury items",
        status=CashAdvanceStatus.REJECTED
    )
    db_session.add(ca)
    await db_session.flush()
    return ca


# ============================================================
# PhilippineHoliday Fixture (공휴일)
# ============================================================

@pytest.fixture
async def sample_national_holiday(db_session: AsyncSession) -> PhilippineHoliday:
    """국가 공휴일 (200%)"""
    holiday = PhilippineHoliday(
        holiday_date=date(2026, 6, 12),
        holiday_name="Independence Day",
        holiday_type=HolidayType.NATIONAL,
        rate_multiplier=Decimal("2.0")
    )
    db_session.add(holiday)
    await db_session.flush()
    return holiday


@pytest.fixture
async def sample_special_holiday(db_session: AsyncSession) -> PhilippineHoliday:
    """특정 공휴일 (130%)"""
    holiday = PhilippineHoliday(
        holiday_date=date(2026, 5, 25),
        holiday_name="EDSA Revolution Anniversary",
        holiday_type=HolidayType.SPECIAL,
        rate_multiplier=Decimal("1.3")
    )
    db_session.add(holiday)
    await db_session.flush()
    return holiday


@pytest.fixture
async def sample_multiple_holidays(db_session: AsyncSession) -> list:
    """여러 개의 공휴일"""
    holidays = [
        PhilippineHoliday(
            holiday_date=date(2026, 1, 1),
            holiday_name="New Year",
            holiday_type=HolidayType.NATIONAL,
            rate_multiplier=Decimal("2.0")
        ),
        PhilippineHoliday(
            holiday_date=date(2026, 4, 9),
            holiday_name="Araw ng Kagitingan",
            holiday_type=HolidayType.NATIONAL,
            rate_multiplier=Decimal("2.0")
        ),
        PhilippineHoliday(
            holiday_date=date(2026, 11, 1),
            holiday_name="All Saints' Day",
            holiday_type=HolidayType.SPECIAL,
            rate_multiplier=Decimal("1.3")
        ),
    ]
    for holiday in holidays:
        db_session.add(holiday)
    await db_session.flush()
    return holidays


# ============================================================
# PayrollRecord Fixture (정산 결과)
# ============================================================

@pytest.fixture
async def sample_payroll_record(
    db_session: AsyncSession,
    sample_weekly_period: PayrollPeriod,
    sample_therapist: Employee
) -> PayrollRecord:
    """샘플 정산 결과"""
    record = PayrollRecord(
        payroll_period_id=sample_weekly_period.id,
        employee_id=sample_therapist.id,
        base_amount=Decimal("5000.00"),
        commission_amount=Decimal("500.00"),
        overtime_amount=Decimal("0.00"),
        holiday_bonus=Decimal("0.00"),
        meal_allowance=Decimal("0.00"),
        late_deduction=Decimal("0.00"),
        absence_deduction=Decimal("0.00"),
        sss_deduction=Decimal("0.00"),
        ca_deduction=Decimal("0.00"),
        health_check_deduction=Decimal("0.00"),
        thirteenth_month_deduction=Decimal("0.00"),
        gross_pay=Decimal("5500.00"),
        total_deductions=Decimal("0.00"),
        net_pay=Decimal("5500.00"),
        status=PayrollStatus.DRAFT
    )
    db_session.add(record)
    await db_session.flush()
    return record


# ============================================================
# Bulk Fixture (대량 데이터)
# ============================================================

@pytest.fixture
async def bulk_employees(db_session: AsyncSession) -> list:
    """여러 직원 생성"""
    employee_types = [
        (EmployeeType.THERAPIST, PayGroup.WEEKLY, 5000),
        (EmployeeType.NAIL, PayGroup.BIWEEKLY, 4500),
        (EmployeeType.DRIVER, PayGroup.WEEKLY, 6000),
        (EmployeeType.MANAGER, PayGroup.BIWEEKLY, 8000),
        (EmployeeType.MAINTENANCE, PayGroup.WEEKLY, 5500),
    ]

    employees = []
    for idx, (emp_type, pay_group, salary) in enumerate(employee_types):
        emp = Employee(
            name=f"Employee_{idx+1}_{emp_type}",
            phone=f"0917{1000000+idx}",
            employee_type=emp_type,
            pay_group=pay_group,
            base_salary=Decimal(str(salary)),
            commission_rate=Decimal("0.00"),
            hire_date=date(2024, 1, 1),
            is_active=True
        )
        db_session.add(emp)
        employees.append(emp)

    await db_session.flush()
    return employees


@pytest.fixture
async def bulk_attendance_logs(
    db_session: AsyncSession,
    sample_therapist: Employee
) -> list:
    """한 주의 출퇴근 기록"""
    logs = []
    for day_offset in range(7):
        work_date = date(2026, 5, 18) + timedelta(days=day_offset)
        log = AttendanceLog(
            employee_id=sample_therapist.id,
            work_date=work_date,
            clock_in="09:00",
            clock_out="17:00",
            late_minutes=0,
            overtime_minutes=0,
            is_absent=False,
            holiday_type="none"
        )
        db_session.add(log)
        logs.append(log)

    await db_session.flush()
    return logs
