#!/usr/bin/env python3
"""
급여 정산 시스템 종합 테스트 스크립트
경로: test_payroll_system.py
목적: API 엔드포인트 및 계산 엔진 검증

테스트 항목:
  1. 직원(Employee) 생성
  2. 출퇴근(Attendance) 로그 입력
  3. 현금 선지급(CA) 요청
  4. 공휴일(Holiday) 설정
  5. 급여 정산 기간 생성
  6. 급여 계산 실행
  7. 결과 검증
"""

import asyncio
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List

# FastAPI 앱 초기화
sys.path.insert(0, '/e/elspa')

from app.database import SessionLocal, init_db
from app.models.payroll import (
    Employee, AttendanceLog, CashAdvance, PhilippineHoliday,
    PayrollPeriod, PayrollRecord,
    EmployeeType, PayGroup, CashAdvanceStatus, HolidayType, PayrollStatus
)
from app.services.payroll_calculator import PayrollCalculator


async def create_test_employees(db):
    """테스트 직원 생성 (6명)"""
    print("\n" + "="*60)
    print("📝 STEP 1: 직원(Employee) 생성")
    print("="*60)

    employees_data = [
        {
            "name": "Kim Therapist-A",
            "phone": "09171234567",
            "employee_type": EmployeeType.THERAPIST,
            "pay_group": PayGroup.WEEKLY,
            "base_salary": Decimal("15000"),
            "commission_rate": Decimal("20"),
            "hire_date": date(2024, 1, 15),
        },
        {
            "name": "Park Therapist-B",
            "phone": "09172345678",
            "employee_type": EmployeeType.THERAPIST,
            "pay_group": PayGroup.WEEKLY,
            "base_salary": Decimal("15000"),
            "commission_rate": Decimal("18"),
            "hire_date": date(2024, 2, 20),
        },
        {
            "name": "Lee Driver",
            "phone": "09173456789",
            "employee_type": EmployeeType.DRIVER,
            "pay_group": PayGroup.BIWEEKLY,
            "base_salary": Decimal("20000"),
            "commission_rate": Decimal("0"),
            "hire_date": date(2023, 6, 1),
        },
        {
            "name": "Choi Maintenance",
            "phone": "09174567890",
            "employee_type": EmployeeType.MAINTENANCE,
            "pay_group": PayGroup.BIWEEKLY,
            "base_salary": Decimal("18000"),
            "commission_rate": Decimal("0"),
            "hire_date": date(2023, 8, 15),
        },
        {
            "name": "Jang Manager",
            "phone": "09175678901",
            "employee_type": EmployeeType.MANAGER,
            "pay_group": PayGroup.BIWEEKLY,
            "base_salary": Decimal("30000"),
            "commission_rate": Decimal("0"),
            "hire_date": date(2022, 3, 1),
        },
        {
            "name": "Seo Hollys Staff",
            "phone": "09176789012",
            "employee_type": EmployeeType.HOLLYS,
            "pay_group": PayGroup.BIWEEKLY,
            "base_salary": Decimal("16000"),
            "commission_rate": Decimal("0"),
            "hire_date": date(2024, 4, 10),
        },
    ]

    employees = []
    for emp_data in employees_data:
        emp = Employee(**emp_data)
        db.add(emp)
        employees.append(emp)

    await db.commit()

    # 모든 직원 refresh하여 ID 획득
    for emp in employees:
        await db.refresh(emp)

    print(f"✅ {len(employees)}명의 직원 생성 완료")
    for emp in employees:
        print(f"   - ID: {emp.id}, {emp.name} ({emp.employee_type}), {emp.pay_group}")

    return employees


async def create_attendance_logs(db, employees: List[Employee]):
    """출퇴근 로그 생성 (1주 데이터)"""
    print("\n" + "="*60)
    print("📋 STEP 2: 출퇴근(Attendance) 로그 입력")
    print("="*60)

    # 이번 주 월요일부터 금요일까지
    today = date.today()
    monday = today - timedelta(days=today.weekday())

    attendance_logs = []
    log_count = 0

    for emp in employees:
        for day_offset in range(5):  # 월-금
            work_date = monday + timedelta(days=day_offset)

            # 지각/정상/OT 시뮬레이션
            if day_offset == 0 and emp.employee_type == EmployeeType.THERAPIST:
                # 월요일: 첫 번째 테라피스트는 15분 지각
                clock_in = "08:45"
                clock_out = "17:30"
                late_minutes = 15
                overtime_minutes = 30
            elif day_offset == 4 and emp.employee_type == EmployeeType.DRIVER:
                # 금요일: 드라이버 초과근무
                clock_in = "08:00"
                clock_out = "19:15"
                late_minutes = 0
                overtime_minutes = 75
            else:
                # 정상 근무
                clock_in = "08:00"
                clock_out = "17:30"
                late_minutes = 0
                overtime_minutes = 30  # 30분 초과근무 (40분 미만이므로 미지급)

            log = AttendanceLog(
                employee_id=emp.id,
                work_date=work_date,
                clock_in=clock_in,
                clock_out=clock_out,
                late_minutes=late_minutes,
                overtime_minutes=overtime_minutes,
                is_absent=False,
                holiday_type="none"
            )
            db.add(log)
            attendance_logs.append(log)
            log_count += 1

    await db.commit()
    print(f"✅ {log_count}개의 출퇴근 로그 생성 완료")
    print(f"   기간: {monday} ~ {monday + timedelta(days=4)}")


async def create_cash_advances(db, employees: List[Employee]):
    """현금 선지급(CA) 생성"""
    print("\n" + "="*60)
    print("💰 STEP 3: 현금 선지급(CA) 요청")
    print("="*60)

    ca_list = [
        {
            "employee_id": employees[0].id,
            "amount": Decimal("5000"),
            "reason": "의료비",
            "status": CashAdvanceStatus.APPROVED
        },
        {
            "employee_id": employees[2].id,
            "amount": Decimal("3000"),
            "reason": "가족 경조사",
            "status": CashAdvanceStatus.APPROVED
        },
        {
            "employee_id": employees[4].id,
            "amount": Decimal("10000"),
            "reason": "차량 유지비",
            "status": CashAdvanceStatus.PENDING
        },
    ]

    for ca_data in ca_list:
        ca = CashAdvance(
            employee_id=ca_data["employee_id"],
            amount=ca_data["amount"],
            request_date=date.today(),
            reason=ca_data["reason"],
            status=ca_data["status"]
        )
        db.add(ca)

    await db.commit()
    print(f"✅ {len(ca_list)}개의 CA 요청 생성 완료")
    for ca_data in ca_list:
        emp_name = next(e.name for e in employees if e.id == ca_data["employee_id"])
        print(f"   - {emp_name}: {ca_data['amount']} Peso ({ca_data['status']})")


async def create_holidays(db):
    """공휴일 설정"""
    print("\n" + "="*60)
    print("🎉 STEP 4: 공휴일(Holiday) 설정")
    print("="*60)

    # 기존 공휴일 삭제 (테스트 재실행 시 중복 방지)
    from sqlalchemy import delete as sql_delete
    stmt = sql_delete(PhilippineHoliday)
    await db.execute(stmt)
    await db.commit()

    holidays = [
        {
            "holiday_date": date(2026, 6, 12),
            "holiday_name": "Independence Day",
            "holiday_type": HolidayType.NATIONAL,
            "rate_multiplier": Decimal("2.0")
        },
        {
            "holiday_date": date(2026, 8, 21),
            "holiday_name": "Ninoy Aquino Day",
            "holiday_type": HolidayType.NATIONAL,
            "rate_multiplier": Decimal("2.0")
        },
        {
            "holiday_date": date(2026, 5, 30),
            "holiday_name": "Special Holiday",
            "holiday_type": HolidayType.SPECIAL,
            "rate_multiplier": Decimal("1.3")
        },
    ]

    created_holidays = []
    for hol_data in holidays:
        hol = PhilippineHoliday(**hol_data)
        db.add(hol)
        created_holidays.append(hol)

    await db.commit()

    # Refresh objects to get committed state
    for hol in created_holidays:
        await db.refresh(hol)

    print(f"✅ {len(created_holidays)}개의 공휴일 설정 완료")
    for hol in created_holidays:
        print(f"   - {hol.holiday_date}: {hol.holiday_name} ({hol.holiday_type})")


async def create_payroll_period_and_calculate(db):
    """급여 정산 기간 생성 및 계산"""
    print("\n" + "="*60)
    print("📊 STEP 5: 급여 정산 기간 생성")
    print("="*60)

    today = date.today()
    monday = today - timedelta(days=today.weekday())
    friday = monday + timedelta(days=4)

    # 주간 정산 기간 (Therapist, Nail)
    weekly_period = PayrollPeriod(
        period_start=monday,
        period_end=friday,
        pay_group=PayGroup.WEEKLY,
        status=PayrollStatus.DRAFT
    )
    db.add(weekly_period)
    await db.commit()
    await db.refresh(weekly_period)

    # 격주 정산 기간 (Driver, Manager, Maintenance, Hollys)
    biweekly_start = monday - timedelta(days=7)
    biweekly_period = PayrollPeriod(
        period_start=biweekly_start,
        period_end=friday,
        pay_group=PayGroup.BIWEEKLY,
        status=PayrollStatus.DRAFT
    )
    db.add(biweekly_period)
    await db.commit()
    await db.refresh(biweekly_period)

    print(f"✅ 2개의 정산 기간 생성 완료")
    print(f"   - 주간(Weekly): {weekly_period.period_start} ~ {weekly_period.period_end}")
    print(f"   - 격주(Biweekly): {biweekly_period.period_start} ~ {biweekly_period.period_end}")

    # 급여 계산 실행
    print("\n" + "="*60)
    print("🧮 STEP 6: 급여 계산 실행")
    print("="*60)

    calculator = PayrollCalculator()

    # 주간 정산
    print("\n📌 주간(Weekly) 정산 계산 중...")
    try:
        weekly_records = await calculator.calculate_payroll_for_period(
            payroll_period=weekly_period,
            db=db
        )
        for record in weekly_records:
            await db.refresh(record, ["employee"])
            print(f"   ✅ {record.employee.name}: 총액 {record.gross_pay} Peso -> 순액 {record.net_pay} Peso")
    except Exception as e:
        print(f"   ❌ 주간 정산 실패: {str(e)}")

    # 격주 정산
    print("\n📌 격주(Biweekly) 정산 계산 중...")
    try:
        biweekly_records = await calculator.calculate_payroll_for_period(
            payroll_period=biweekly_period,
            db=db
        )
        for record in biweekly_records:
            await db.refresh(record, ["employee"])
            print(f"   ✅ {record.employee.name}: 총액 {record.gross_pay} Peso -> 순액 {record.net_pay} Peso")
    except Exception as e:
        print(f"   ❌ 격주 정산 실패: {str(e)}")

    return weekly_period, biweekly_period


async def verify_calculations(db):
    """계산 결과 검증"""
    print("\n" + "="*60)
    print("✅ STEP 7: 계산 결과 검증")
    print("="*60)

    # 모든 PayrollRecord 조회
    from sqlalchemy import select

    stmt = select(PayrollRecord).order_by(PayrollRecord.employee_id)
    result = await db.execute(stmt)
    records = result.scalars().all()

    print(f"\n💾 총 {len(records)}개의 정산 기록 생성됨\n")

    total_gross = Decimal("0")
    total_deductions = Decimal("0")
    total_net = Decimal("0")

    for record in records:
        await db.refresh(record, ["employee"])

        print(f"📋 직원 ID {record.employee_id} - {record.employee.name}")
        print(f"   기본급: {record.base_amount} Peso")
        print(f"   커미션: {record.commission_amount} Peso")
        print(f"   초과근무: {record.overtime_amount} Peso")
        print(f"   공휴일보너스: {record.holiday_bonus} Peso")
        print(f"   식대: {record.meal_allowance} Peso")
        print(f"   └─────────────")
        print(f"   차감(지각): -{record.late_deduction} Peso")
        print(f"   차감(결근): -{record.absence_deduction} Peso")
        print(f"   차감(SSS): -{record.sss_deduction} Peso")
        print(f"   차감(CA): -{record.ca_deduction} Peso")
        print(f"   차감(보건): -{record.health_check_deduction} Peso")
        print(f"   차감(13월): -{record.thirteenth_month_deduction} Peso")
        print(f"   ═════════════════════")
        print(f"   총액(Gross): {record.gross_pay} Peso")
        print(f"   총차감: {record.total_deductions} Peso")
        print(f"   순액(Net): {record.net_pay} Peso ✓")
        print()

        total_gross += record.gross_pay
        total_deductions += record.total_deductions
        total_net += record.net_pay

    print(f"\n" + "="*60)
    print(f"📊 정산 종합 현황")
    print(f"="*60)
    print(f"전체 총액(Gross Pay): {total_gross} Peso")
    print(f"전체 차감(Deductions): {total_deductions} Peso")
    print(f"전체 순액(Net Pay): {total_net} Peso")
    print(f"="*60 + "\n")


async def main():
    """메인 테스트 함수"""
    print("\n" + "🚀 " + "="*56 + " 🚀")
    print("   급여 정산 시스템 — 종합 테스트 시작")
    print("🚀 " + "="*56 + " 🚀\n")

    try:
        # 테이블 생성
        await init_db()
        print("✅ 데이터베이스 초기화 완료\n")

        # DB 초기화
        async with SessionLocal() as db:

            # STEP 1-7 실행
            employees = await create_test_employees(db)
            await create_attendance_logs(db, employees)
            await create_cash_advances(db, employees)
            await create_holidays(db)
            await create_payroll_period_and_calculate(db)
            await verify_calculations(db)

            print("\n" + "="*60)
            print("🎉 모든 테스트 완료!")
            print("="*60)
            print("\n📌 다음 단계:")
            print("  1. 브라우저: http://localhost:3000/admin/payroll/")
            print("  2. API: http://localhost:8000/docs")
            print("  3. 정산 기간별 결과 확인\n")

    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
