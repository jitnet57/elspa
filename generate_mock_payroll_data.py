#!/usr/bin/env python3
"""
대규모 급여 정산 시스템 목데이터 생성 및 계산
목적: 89명 직원의 1개월 급여 정산 계산

직원 구성:
- 테라피스트: 60명 (주간급)
- 할리스커피: 10명 (격주급)
- 드라이버: 5명 (격주급)
- 유지보수: 3명 (격주급)
- 정직원(Manager): 5명 (격주급)
- 네일샵: 6명 (주간급)
총 89명
"""

import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
import sys

sys.path.insert(0, '/e/elspa')

from app.database import SessionLocal, init_db
from app.models.payroll import (
    Employee, AttendanceLog, CashAdvance, PhilippineHoliday,
    PayrollPeriod, PayrollRecord,
    EmployeeType, PayGroup, CashAdvanceStatus, HolidayType, PayrollStatus
)
from app.services.payroll_calculator import PayrollCalculator


async def create_mock_employees(db):
    """목데이터 직원 생성 (89명)"""
    print("\n" + "="*70)
    print("📝 STEP 1: 대규모 직원 데이터 생성 (89명)")
    print("="*70)

    employees = []

    # 1. 테라피스트 60명
    for i in range(1, 61):
        emp = Employee(
            name=f"Therapist-{i:03d}",
            phone=f"09170000{i:03d}"[-10:],
            employee_type=EmployeeType.THERAPIST,
            pay_group=PayGroup.WEEKLY,
            base_salary=Decimal("15000"),
            commission_rate=Decimal("20"),
            hire_date=date(2023, 1, 1) if i <= 30 else date(2024, 1, 1),
            is_active=True
        )
        db.add(emp)
        employees.append(emp)

    # 2. 네일샵 6명
    for i in range(1, 7):
        emp = Employee(
            name=f"Nail-{i:02d}",
            phone=f"09171000{i:02d}"[-10:],
            employee_type=EmployeeType.NAIL,
            pay_group=PayGroup.WEEKLY,
            base_salary=Decimal("12000"),
            commission_rate=Decimal("15"),
            hire_date=date(2023, 6, 1),
            is_active=True
        )
        db.add(emp)
        employees.append(emp)

    # 3. 할리스커피 10명
    for i in range(1, 11):
        emp = Employee(
            name=f"Hollys-{i:02d}",
            phone=f"09172000{i:02d}"[-10:],
            employee_type=EmployeeType.HOLLYS,
            pay_group=PayGroup.BIWEEKLY,
            base_salary=Decimal("16000"),
            commission_rate=Decimal("0"),
            hire_date=date(2023, 3, 1),
            is_active=True
        )
        db.add(emp)
        employees.append(emp)

    # 4. 드라이버 5명
    for i in range(1, 6):
        emp = Employee(
            name=f"Driver-{i:02d}",
            phone=f"09173000{i:02d}"[-10:],
            employee_type=EmployeeType.DRIVER,
            pay_group=PayGroup.BIWEEKLY,
            base_salary=Decimal("20000"),
            commission_rate=Decimal("0"),
            hire_date=date(2022, 6, 1),
            is_active=True
        )
        db.add(emp)
        employees.append(emp)

    # 5. 유지보수 3명
    for i in range(1, 4):
        emp = Employee(
            name=f"Maintenance-{i}",
            phone=f"09174000{i}"[-10:],
            employee_type=EmployeeType.MAINTENANCE,
            pay_group=PayGroup.BIWEEKLY,
            base_salary=Decimal("18000"),
            commission_rate=Decimal("0"),
            hire_date=date(2022, 1, 1),
            is_active=True
        )
        db.add(emp)
        employees.append(emp)

    # 6. 정직원(Manager) 5명
    for i in range(1, 6):
        emp = Employee(
            name=f"Manager-{i}",
            phone=f"09175000{i}"[-10:],
            employee_type=EmployeeType.MANAGER,
            pay_group=PayGroup.BIWEEKLY,
            base_salary=Decimal("30000"),
            commission_rate=Decimal("0"),
            hire_date=date(2021, 1, 1),
            is_active=True
        )
        db.add(emp)
        employees.append(emp)

    await db.commit()
    for emp in employees:
        await db.refresh(emp)

    print(f"✅ {len(employees)}명의 직원 생성 완료")
    print(f"   - 테라피스트: 60명 (주간급)")
    print(f"   - 네일샵: 6명 (주간급)")
    print(f"   - 할리스커피: 10명 (격주급)")
    print(f"   - 드라이버: 5명 (격주급)")
    print(f"   - 유지보수: 3명 (격주급)")
    print(f"   - 정직원: 5명 (격주급)")

    return employees


async def create_mock_attendance(db, employees):
    """목데이터 출퇴근 기록 생성 (1개월)"""
    print("\n" + "="*70)
    print("📋 STEP 2: 출퇴근 데이터 생성 (1개월 = 20 업무일)")
    print("="*70)

    # 이번 달 1일부터 말일까지
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
            # 주말 제외 (토요일=5, 일요일=6)
            if current.weekday() < 5:
                # 확률: 98% 정상 출근, 2% 결근
                import random
                if random.random() < 0.98:
                    clock_in = "08:00"
                    clock_out = "17:30"
                    late_minutes = random.choice([0, 0, 0, 0, 15, 30])  # 대부분 정상, 가끔 지각
                    overtime_minutes = random.randint(0, 120)  # 0~120분 초과근무
                    is_absent = False
                else:
                    clock_in = None
                    clock_out = None
                    late_minutes = 0
                    overtime_minutes = 0
                    is_absent = True

                log = AttendanceLog(
                    employee_id=emp.id,
                    work_date=current,
                    clock_in=clock_in,
                    clock_out=clock_out,
                    late_minutes=late_minutes,
                    overtime_minutes=overtime_minutes,
                    is_absent=is_absent,
                    holiday_type="none"
                )
                db.add(log)
                log_count += 1

            current += timedelta(days=1)

    await db.commit()
    print(f"✅ {log_count}개의 출퇴근 기록 생성 완료")
    print(f"   기간: {month_start} ~ {month_end}")


async def create_mock_cash_advances(db, employees):
    """목데이터 현금 선지급(CA) 생성"""
    print("\n" + "="*70)
    print("💰 STEP 3: 현금 선지급(CA) 데이터 생성")
    print("="*70)

    import random
    ca_count = 0

    # 약 30% 직원에게 CA 부여
    for emp in employees:
        if random.random() < 0.30:
            amount = Decimal(random.choice([3000, 5000, 8000, 10000]))
            status = random.choice([CashAdvanceStatus.APPROVED, CashAdvanceStatus.PENDING])

            ca = CashAdvance(
                employee_id=emp.id,
                amount=amount,
                request_date=date.today(),
                reason=random.choice(["의료비", "가족경조사", "차량유지", "교육비", "생활비"]),
                status=status
            )
            db.add(ca)
            ca_count += 1

    await db.commit()
    print(f"✅ {ca_count}개의 CA 생성 완료 (약 {ca_count/len(employees)*100:.1f}%)")


async def create_mock_holidays(db):
    """필리핀 공휴일 설정"""
    print("\n" + "="*70)
    print("🎉 STEP 4: 공휴일(Holiday) 설정")
    print("="*70)

    from sqlalchemy import delete as sql_delete
    stmt = sql_delete(PhilippineHoliday)
    await db.execute(stmt)
    await db.commit()

    holidays = [
        {
            "holiday_date": date(2026, 5, 30),
            "holiday_name": "Special Holiday",
            "holiday_type": HolidayType.SPECIAL,
            "rate_multiplier": Decimal("1.3")
        },
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
            "holiday_date": date(2026, 11, 1),
            "holiday_name": "All Saints' Day",
            "holiday_type": HolidayType.NATIONAL,
            "rate_multiplier": Decimal("2.0")
        },
        {
            "holiday_date": date(2026, 12, 25),
            "holiday_name": "Christmas Day",
            "holiday_type": HolidayType.NATIONAL,
            "rate_multiplier": Decimal("2.0")
        },
    ]

    for hol_data in holidays:
        hol = PhilippineHoliday(**hol_data)
        db.add(hol)

    await db.commit()
    print(f"✅ {len(holidays)}개의 공휴일 설정 완료")


async def create_payroll_periods_and_calculate(db):
    """급여 정산 기간 생성 및 계산"""
    print("\n" + "="*70)
    print("📊 STEP 5: 급여 정산 기간 생성 및 계산")
    print("="*70)

    today = date.today()
    # 이번 달 1일 ~ 말일
    month_start = date(today.year, today.month, 1)
    if today.month == 12:
        month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)

    # 주간 정산 기간 (매주)
    weekly_period = PayrollPeriod(
        period_start=month_start,
        period_end=month_end,
        pay_group=PayGroup.WEEKLY,
        status=PayrollStatus.DRAFT
    )
    db.add(weekly_period)
    await db.commit()
    await db.refresh(weekly_period)

    # 격주 정산 기간
    biweekly_period = PayrollPeriod(
        period_start=month_start,
        period_end=month_end,
        pay_group=PayGroup.BIWEEKLY,
        status=PayrollStatus.DRAFT
    )
    db.add(biweekly_period)
    await db.commit()
    await db.refresh(biweekly_period)

    print(f"✅ 2개의 정산 기간 생성 완료")
    print(f"   - 주간(Weekly): {weekly_period.period_start} ~ {weekly_period.period_end}")
    print(f"   - 격주(Biweekly): {biweekly_period.period_start} ~ {biweekly_period.period_end}")

    # 급여 계산
    print("\n" + "="*70)
    print("🧮 STEP 6: 급여 계산 실행")
    print("="*70)

    calculator = PayrollCalculator()

    # 주간 정산
    print("\n📌 주간(Weekly) 정산 계산 중...")
    try:
        weekly_records = await calculator.calculate_payroll_for_period(
            payroll_period=weekly_period,
            db=db
        )
        for record in weekly_records:
            db.add(record)
        await db.commit()

        for record in weekly_records:
            await db.refresh(record, ["employee"])

        print(f"   ✅ {len(weekly_records)}명의 정산 완료")
    except Exception as e:
        print(f"   ❌ 주간 정산 실패: {str(e)}")
        weekly_records = []

    # 격주 정산
    print("\n📌 격주(Biweekly) 정산 계산 중...")
    try:
        biweekly_records = await calculator.calculate_payroll_for_period(
            payroll_period=biweekly_period,
            db=db
        )
        for record in biweekly_records:
            db.add(record)
        await db.commit()

        for record in biweekly_records:
            await db.refresh(record, ["employee"])

        print(f"   ✅ {len(biweekly_records)}명의 정산 완료")
    except Exception as e:
        print(f"   ❌ 격주 정산 실패: {str(e)}")
        biweekly_records = []

    return weekly_records, biweekly_records


async def analyze_results(db):
    """정산 결과 분석"""
    print("\n" + "="*70)
    print("✅ STEP 7: 정산 결과 분석")
    print("="*70)

    from sqlalchemy import select

    stmt = select(PayrollRecord).order_by(PayrollRecord.employee_id)
    result = await db.execute(stmt)
    records = result.scalars().all()

    if not records:
        print("❌ 정산 결과가 없습니다.")
        return

    print(f"\n💾 총 {len(records)}개의 정산 기록 생성됨\n")

    total_gross = Decimal("0")
    total_deductions = Decimal("0")
    total_net = Decimal("0")
    total_commission = Decimal("0")

    # 직원 타입별 분석
    by_type = {}

    for record in records:
        await db.refresh(record, ["employee"])

        emp_type = record.employee.employee_type
        if emp_type not in by_type:
            by_type[emp_type] = {
                "count": 0,
                "gross": Decimal("0"),
                "deductions": Decimal("0"),
                "net": Decimal("0"),
                "commission": Decimal("0"),
            }

        by_type[emp_type]["count"] += 1
        by_type[emp_type]["gross"] += record.gross_pay
        by_type[emp_type]["deductions"] += record.total_deductions
        by_type[emp_type]["net"] += record.net_pay
        by_type[emp_type]["commission"] += record.commission_amount

        total_gross += record.gross_pay
        total_deductions += record.total_deductions
        total_net += record.net_pay
        total_commission += record.commission_amount

    # 직원 타입별 요약
    print("=" * 70)
    print("📊 직원 타입별 정산 요약")
    print("=" * 70)
    print(f"{'직종':<20} {'인원':>6} {'평균급여':>12} {'평균차감':>12} {'평균순급':>12} {'총수수료':>12}")
    print("-" * 70)

    for emp_type, data in sorted(by_type.items()):
        avg_gross = data["gross"] / data["count"]
        avg_deductions = data["deductions"] / data["count"]
        avg_net = data["net"] / data["count"]

        print(f"{emp_type:<20} {data['count']:>6} {avg_gross:>12,.0f} {avg_deductions:>12,.0f} {avg_net:>12,.0f} {data['commission']:>12,.0f}")

    print("-" * 70)
    avg_gross = total_gross / len(records) if records else 0
    avg_deductions = total_deductions / len(records) if records else 0
    avg_net = total_net / len(records) if records else 0

    print(f"{'합계':<20} {len(records):>6} {avg_gross:>12,.0f} {avg_deductions:>12,.0f} {avg_net:>12,.0f} {total_commission:>12,.0f}")
    print("=" * 70)

    print(f"\n📈 전체 통계")
    print(f"   전체 총액(Gross): {total_gross:,.0f} Peso")
    print(f"   전체 차감(Deductions): {total_deductions:,.0f} Peso")
    print(f"   전체 순액(Net): {total_net:,.0f} Peso")
    print(f"   전체 수수료: {total_commission:,.0f} Peso")
    print(f"   평균 급여: {avg_gross:,.0f} Peso")
    print(f"   평균 순액: {avg_net:,.0f} Peso")


async def main():
    """메인 함수"""
    print("\n" + "🚀 " + "="*66 + " 🚀")
    print("   ElSpa 대규모 목데이터 급여 정산 시스템")
    print("   89명 직원 × 1개월 = 실제 정산 시뮬레이션")
    print("🚀 " + "="*66 + " 🚀\n")

    try:
        await init_db()
        print("✅ 데이터베이스 초기화 완료\n")

        async with SessionLocal() as db:
            employees = await create_mock_employees(db)
            await create_mock_attendance(db, employees)
            await create_mock_cash_advances(db, employees)
            await create_mock_holidays(db)
            await create_payroll_periods_and_calculate(db)
            await analyze_results(db)

            print("\n" + "="*70)
            print("🎉 대규모 목데이터 정산 완료!")
            print("="*70)
            print("\n📌 다음 단계:")
            print("  1. 브라우저: http://localhost:3000/admin/payroll/")
            print("  2. API: http://localhost:8000/docs")
            print("  3. 89명의 정산 결과 조회 및 분석\n")

    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
