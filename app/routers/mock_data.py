"""
Mock Data 생성 API
목적: 테스트를 위한 목데이터를 쉽게 생성하고 관리

엔드포인트:
- POST /api/mock/create-sample - 샘플 데이터 생성
- POST /api/mock/create-large - 대규모 데이터 생성
- DELETE /api/mock/clear - 모든 데이터 삭제
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import delete as sql_delete
import random

from app.database import get_db
from app.models.payroll import (
    Employee, AttendanceLog, CashAdvance, PhilippineHoliday,
    PayrollPeriod, PayrollRecord,
    EmployeeType, PayGroup, CashAdvanceStatus, HolidayType, PayrollStatus
)
from app.services.payroll_calculator import PayrollCalculator

router = APIRouter(prefix="/api/mock", tags=["mock-data"])


@router.post("/create-sample")
async def create_sample_data(db: AsyncSession = Depends(get_db)):
    """
    샘플 mock data 생성 (소규모 - 테스트용)
    각 직종별 1-2명 + 1개월 출퇴근 + 공휴일 + 정산
    """
    try:
        # 기존 데이터 삭제
        await db.execute(sql_delete(PayrollRecord))
        await db.execute(sql_delete(PayrollPeriod))
        await db.execute(sql_delete(CashAdvance))
        await db.execute(sql_delete(AttendanceLog))
        await db.execute(sql_delete(PhilippineHoliday))
        await db.execute(sql_delete(Employee))
        await db.commit()

        # 샘플 직원 생성
        employees = []
        sample_data = [
            ("Therapist-001", "09170000001", EmployeeType.THERAPIST, PayGroup.WEEKLY, 15000, 20),
            ("Therapist-002", "09170000002", EmployeeType.THERAPIST, PayGroup.WEEKLY, 15000, 20),
            ("Nail-001", "09171000001", EmployeeType.NAIL, PayGroup.WEEKLY, 12000, 15),
            ("Hollys-001", "09172000001", EmployeeType.HOLLYS, PayGroup.BIWEEKLY, 16000, 0),
            ("Driver-001", "09173000001", EmployeeType.DRIVER, PayGroup.BIWEEKLY, 20000, 0),
            ("Maintenance-001", "09174000001", EmployeeType.MAINTENANCE, PayGroup.BIWEEKLY, 18000, 0),
            ("Manager-001", "09175000001", EmployeeType.MANAGER, PayGroup.BIWEEKLY, 30000, 0),
        ]

        for name, phone, emp_type, pay_group, base, commission in sample_data:
            emp = Employee(
                name=name,
                phone=phone,
                employee_type=emp_type,
                pay_group=pay_group,
                base_salary=Decimal(str(base)),
                commission_rate=Decimal(str(commission)),
                hire_date=date(2023, 1, 1),
                is_active=True
            )
            db.add(emp)
            employees.append(emp)

        await db.commit()
        for emp in employees:
            await db.refresh(emp)

        # 출퇴근 기록 생성 (1개월)
        today = date.today()
        month_start = date(today.year, today.month, 1)
        if today.month == 12:
            month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)

        log_count = 0
        for emp in employees:
            current = month_start
            while current <= month_end:
                if current.weekday() < 5:  # 월-금
                    if random.random() < 0.95:  # 95% 정상 출근
                        log = AttendanceLog(
                            employee_id=emp.id,
                            work_date=current,
                            clock_in="08:00",
                            clock_out="17:30",
                            late_minutes=random.choice([0, 0, 0, 15]),
                            overtime_minutes=random.randint(0, 90),
                            is_absent=False,
                            holiday_type="none"
                        )
                        db.add(log)
                        log_count += 1

                current += timedelta(days=1)

        await db.commit()

        # 현금 선지급 생성 (30% 확률)
        ca_count = 0
        for emp in employees:
            if random.random() < 0.30:
                ca = CashAdvance(
                    employee_id=emp.id,
                    amount=Decimal(random.choice([3000, 5000, 8000])),
                    request_date=date.today(),
                    reason=random.choice(["의료비", "가족경조사", "생활비"]),
                    status=random.choice([CashAdvanceStatus.APPROVED, CashAdvanceStatus.PENDING])
                )
                db.add(ca)
                ca_count += 1

        await db.commit()

        # 공휴일 설정
        holidays = [
            ("2026-05-30", "Special Holiday", HolidayType.SPECIAL, 1.3),
            ("2026-06-12", "Independence Day", HolidayType.NATIONAL, 2.0),
        ]

        for date_str, name, hol_type, multiplier in holidays:
            year, month, day = map(int, date_str.split("-"))
            hol = PhilippineHoliday(
                holiday_date=date(year, month, day),
                holiday_name=name,
                holiday_type=hol_type,
                rate_multiplier=Decimal(str(multiplier))
            )
            db.add(hol)

        await db.commit()

        # 정산 기간 생성 및 계산
        weekly_period = PayrollPeriod(
            period_start=month_start,
            period_end=month_end,
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        db.add(weekly_period)
        await db.commit()
        await db.refresh(weekly_period)

        biweekly_period = PayrollPeriod(
            period_start=month_start,
            period_end=month_end,
            pay_group=PayGroup.BIWEEKLY,
            status=PayrollStatus.DRAFT
        )
        db.add(biweekly_period)
        await db.commit()
        await db.refresh(biweekly_period)

        # 급여 계산
        calculator = PayrollCalculator()

        weekly_records = await calculator.calculate_payroll_for_period(weekly_period, db)
        for record in weekly_records:
            db.add(record)
        await db.commit()

        biweekly_records = await calculator.calculate_payroll_for_period(biweekly_period, db)
        for record in biweekly_records:
            db.add(record)
        await db.commit()

        return {
            "status": "success",
            "message": "Sample mock data created successfully",
            "data": {
                "employees": len(employees),
                "attendance_logs": log_count,
                "cash_advances": ca_count,
                "holidays": len(holidays),
                "payroll_records": len(weekly_records) + len(biweekly_records)
            }
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-large")
async def create_large_data(db: AsyncSession = Depends(get_db)):
    """
    대규모 mock data 생성 (89명 직원)
    테라피스트 60, 네일샵 6, 할리스커피 10, 드라이버 5, 유지보수 3, 정직원 5명
    """
    try:
        # 기존 데이터 삭제
        await db.execute(sql_delete(PayrollRecord))
        await db.execute(sql_delete(PayrollPeriod))
        await db.execute(sql_delete(CashAdvance))
        await db.execute(sql_delete(AttendanceLog))
        await db.execute(sql_delete(PhilippineHoliday))
        await db.execute(sql_delete(Employee))
        await db.commit()

        # 직원 데이터 생성
        employees = []
        employee_configs = [
            (EmployeeType.THERAPIST, "Therapist", 60, 15000, 20, PayGroup.WEEKLY),
            (EmployeeType.NAIL, "Nail", 6, 12000, 15, PayGroup.WEEKLY),
            (EmployeeType.HOLLYS, "Hollys", 10, 16000, 0, PayGroup.BIWEEKLY),
            (EmployeeType.DRIVER, "Driver", 5, 20000, 0, PayGroup.BIWEEKLY),
            (EmployeeType.MAINTENANCE, "Maintenance", 3, 18000, 0, PayGroup.BIWEEKLY),
            (EmployeeType.MANAGER, "Manager", 5, 30000, 0, PayGroup.BIWEEKLY),
        ]

        for emp_type, prefix, count, base, commission, pay_group in employee_configs:
            for i in range(1, count + 1):
                emp = Employee(
                    name=f"{prefix}-{i:03d}",
                    phone=f"0917{i:06d}"[-10:],
                    employee_type=emp_type,
                    pay_group=pay_group,
                    base_salary=Decimal(str(base)),
                    commission_rate=Decimal(str(commission)),
                    hire_date=date(2023, 1, 1),
                    is_active=True
                )
                db.add(emp)
                employees.append(emp)

        await db.commit()
        for emp in employees:
            await db.refresh(emp)

        # 출퇴근 기록 생성
        today = date.today()
        month_start = date(today.year, today.month, 1)
        if today.month == 12:
            month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)

        log_count = 0
        for emp in employees:
            current = month_start
            while current <= month_end:
                if current.weekday() < 5:
                    if random.random() < 0.97:
                        log = AttendanceLog(
                            employee_id=emp.id,
                            work_date=current,
                            clock_in="08:00",
                            clock_out="17:30",
                            late_minutes=random.choice([0, 0, 0, 0, 15, 30]),
                            overtime_minutes=random.randint(0, 120),
                            is_absent=False,
                            holiday_type="none"
                        )
                        db.add(log)
                        log_count += 1

                current += timedelta(days=1)

        await db.commit()

        # 현금 선지급 생성
        ca_count = 0
        for emp in employees:
            if random.random() < 0.25:
                ca = CashAdvance(
                    employee_id=emp.id,
                    amount=Decimal(random.choice([3000, 5000, 8000, 10000])),
                    request_date=date.today(),
                    reason=random.choice(["의료비", "가족경조사", "생활비", "교육비"]),
                    status=random.choice([CashAdvanceStatus.APPROVED, CashAdvanceStatus.PENDING])
                )
                db.add(ca)
                ca_count += 1

        await db.commit()

        # 공휴일 설정
        holidays = [
            ("2026-05-30", "Special Holiday", HolidayType.SPECIAL, 1.3),
            ("2026-06-12", "Independence Day", HolidayType.NATIONAL, 2.0),
            ("2026-08-21", "Ninoy Aquino Day", HolidayType.NATIONAL, 2.0),
            ("2026-11-01", "All Saints' Day", HolidayType.NATIONAL, 2.0),
            ("2026-12-25", "Christmas Day", HolidayType.NATIONAL, 2.0),
        ]

        for date_str, name, hol_type, multiplier in holidays:
            year, month, day = map(int, date_str.split("-"))
            hol = PhilippineHoliday(
                holiday_date=date(year, month, day),
                holiday_name=name,
                holiday_type=hol_type,
                rate_multiplier=Decimal(str(multiplier))
            )
            db.add(hol)

        await db.commit()

        # 정산 기간 및 계산
        weekly_period = PayrollPeriod(
            period_start=month_start,
            period_end=month_end,
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        db.add(weekly_period)
        await db.commit()
        await db.refresh(weekly_period)

        biweekly_period = PayrollPeriod(
            period_start=month_start,
            period_end=month_end,
            pay_group=PayGroup.BIWEEKLY,
            status=PayrollStatus.DRAFT
        )
        db.add(biweekly_period)
        await db.commit()
        await db.refresh(biweekly_period)

        calculator = PayrollCalculator()

        weekly_records = await calculator.calculate_payroll_for_period(weekly_period, db)
        for record in weekly_records:
            db.add(record)
        await db.commit()

        biweekly_records = await calculator.calculate_payroll_for_period(biweekly_period, db)
        for record in biweekly_records:
            db.add(record)
        await db.commit()

        return {
            "status": "success",
            "message": "Large mock data created successfully (89 employees)",
            "data": {
                "employees": len(employees),
                "attendance_logs": log_count,
                "cash_advances": ca_count,
                "holidays": len(holidays),
                "payroll_records": len(weekly_records) + len(biweekly_records)
            }
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear")
async def clear_all_data(db: AsyncSession = Depends(get_db)):
    """모든 데이터 삭제"""
    try:
        await db.execute(sql_delete(PayrollRecord))
        await db.execute(sql_delete(PayrollPeriod))
        await db.execute(sql_delete(CashAdvance))
        await db.execute(sql_delete(AttendanceLog))
        await db.execute(sql_delete(PhilippineHoliday))
        await db.execute(sql_delete(Employee))
        await db.commit()

        return {
            "status": "success",
            "message": "All mock data cleared"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
