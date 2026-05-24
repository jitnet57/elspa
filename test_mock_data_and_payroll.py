#!/usr/bin/env python3
"""
Mock Data 생성 및 급여/수수료 계산 테스트
테라피스트, 드라이버, 정직원 등의 급여와 수수료 계산 검증
"""

import asyncio
from datetime import date, timedelta
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
from sqlalchemy import delete as sql_delete, select


async def setup_sample_data(db):
    """샘플 mock data 생성"""
    print("\n" + "="*80)
    print("📝 STEP 1: Mock Data 생성 (테라피스트, 드라이버, 정직원)")
    print("="*80)

    # 기존 데이터 삭제
    await db.execute(sql_delete(PayrollRecord))
    await db.execute(sql_delete(PayrollPeriod))
    await db.execute(sql_delete(CashAdvance))
    await db.execute(sql_delete(AttendanceLog))
    await db.execute(sql_delete(PhilippineHoliday))
    await db.execute(sql_delete(Employee))
    await db.commit()

    # 샘플 직원 생성
    employees = [
        # 테라피스트 2명 (주간급, 수수료 20%)
        Employee(
            name="Kim Therapist (경력자)",
            phone="09170001001",
            employee_type=EmployeeType.THERAPIST,
            pay_group=PayGroup.WEEKLY,
            base_salary=Decimal("15000"),
            commission_rate=Decimal("20"),
            hire_date=date(2022, 1, 1),
            is_active=True
        ),
        Employee(
            name="Park Therapist (신입)",
            phone="09170001002",
            employee_type=EmployeeType.THERAPIST,
            pay_group=PayGroup.WEEKLY,
            base_salary=Decimal("12000"),
            commission_rate=Decimal("15"),
            hire_date=date(2024, 6, 1),
            is_active=True
        ),
        # 드라이버 1명 (격주급, 식대 200 Peso/2주)
        Employee(
            name="Lee Driver",
            phone="09173001001",
            employee_type=EmployeeType.DRIVER,
            pay_group=PayGroup.BIWEEKLY,
            base_salary=Decimal("20000"),
            commission_rate=Decimal("0"),
            hire_date=date(2022, 6, 1),
            is_active=True
        ),
        # 정직원 1명 (격주급)
        Employee(
            name="Choi Manager",
            phone="09175001001",
            employee_type=EmployeeType.MANAGER,
            pay_group=PayGroup.BIWEEKLY,
            base_salary=Decimal("30000"),
            commission_rate=Decimal("0"),
            hire_date=date(2020, 1, 1),
            is_active=True
        ),
    ]

    for emp in employees:
        db.add(emp)

    await db.commit()
    for emp in employees:
        await db.refresh(emp)

    print(f"✅ {len(employees)}명의 직원 생성 완료")
    for emp in employees:
        print(f"   - {emp.name} ({emp.employee_type}): 기본급 {emp.base_salary} Peso, 수수료 {emp.commission_rate}%")

    return employees


async def create_attendance_and_ca(db, employees):
    """출퇴근 및 CA 데이터 생성"""
    print("\n" + "="*80)
    print("📋 STEP 2: 출퇴근 기록 및 현금선지급(CA) 생성")
    print("="*80)

    # 1개월 기간 설정
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
            if current.weekday() < 5:  # 월-금 (평일)
                # 테라피스트: 커미션 계산용으로 세션 카운트 필요
                if emp.employee_type == EmployeeType.THERAPIST:
                    # 정상 출근 (세션 1-2개 = 수수료 발생)
                    log = AttendanceLog(
                        employee_id=emp.id,
                        work_date=current,
                        clock_in="08:00",
                        clock_out="17:30",
                        late_minutes=0,
                        overtime_minutes=30,
                        is_absent=False,
                        holiday_type="none"
                    )
                else:
                    # 정직원/드라이버: 초과근무
                    log = AttendanceLog(
                        employee_id=emp.id,
                        work_date=current,
                        clock_in="08:00",
                        clock_out="18:00",
                        late_minutes=0,
                        overtime_minutes=50,
                        is_absent=False,
                        holiday_type="none"
                    )

                db.add(log)
                log_count += 1

            current += timedelta(days=1)

    await db.commit()

    # CA 생성
    ca_list = [
        (employees[0], Decimal("5000"), "의료비"),  # 테라피스트 1
        (employees[2], Decimal("3000"), "생활비"),  # 드라이버
    ]

    ca_count = 0
    for emp, amount, reason in ca_list:
        ca = CashAdvance(
            employee_id=emp.id,
            amount=amount,
            request_date=date.today(),
            reason=reason,
            status=CashAdvanceStatus.APPROVED
        )
        db.add(ca)
        ca_count += 1

    await db.commit()

    print(f"✅ {log_count}개의 출퇴근 기록 생성 완료 ({month_start} ~ {month_end})")
    print(f"✅ {ca_count}개의 현금선지급(CA) 생성 완료")


async def setup_holidays(db):
    """공휴일 설정"""
    print("\n" + "="*80)
    print("🎉 STEP 3: 공휴일 설정")
    print("="*80)

    await db.execute(sql_delete(PhilippineHoliday))
    await db.commit()

    holidays = [
        PhilippineHoliday(
            holiday_date=date(2026, 6, 12),
            holiday_name="Independence Day",
            holiday_type=HolidayType.NATIONAL,
            rate_multiplier=Decimal("2.0")
        ),
        PhilippineHoliday(
            holiday_date=date(2026, 8, 21),
            holiday_name="Ninoy Aquino Day",
            holiday_type=HolidayType.NATIONAL,
            rate_multiplier=Decimal("2.0")
        ),
    ]

    for hol in holidays:
        db.add(hol)

    await db.commit()
    print(f"✅ {len(holidays)}개의 공휴일 설정 완료")


async def calculate_payroll(db):
    """급여 계산"""
    print("\n" + "="*80)
    print("🧮 STEP 4: 급여 및 수수료 계산")
    print("="*80)

    today = date.today()
    month_start = date(today.year, today.month, 1)
    if today.month == 12:
        month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)

    # 주간 정산 기간 (테라피스트, 네일샵)
    weekly_period = PayrollPeriod(
        period_start=month_start,
        period_end=month_end,
        pay_group=PayGroup.WEEKLY,
        status=PayrollStatus.DRAFT
    )
    db.add(weekly_period)
    await db.commit()
    await db.refresh(weekly_period)

    # 격주 정산 기간 (정직원, 드라이버 등)
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

    # 주간 정산
    print("\n📌 [주간급] 테라피스트 급여 계산 중...")
    weekly_records = await calculator.calculate_payroll_for_period(weekly_period, db)
    for record in weekly_records:
        db.add(record)
    await db.commit()

    for record in weekly_records:
        await db.refresh(record, ["employee"])

    # 격주 정산
    print("📌 [격주급] 정직원 & 드라이버 급여 계산 중...")
    biweekly_records = await calculator.calculate_payroll_for_period(biweekly_period, db)
    for record in biweekly_records:
        db.add(record)
    await db.commit()

    for record in biweekly_records:
        await db.refresh(record, ["employee"])

    return weekly_records + biweekly_records


async def display_results(db, records):
    """결과 출력"""
    print("\n" + "="*80)
    print("✅ STEP 5: 정산 결과 분석")
    print("="*80)

    print(f"\n💾 총 {len(records)}개의 정산 기록\n")

    total_gross = Decimal("0")
    total_deductions = Decimal("0")
    total_net = Decimal("0")
    total_commission = Decimal("0")

    print(f"{'직원명':<20} {'직종':<15} {'기본급':>12} {'수수료':>12} {'차감':>12} {'순액':>12}")
    print("-" * 85)

    for record in records:
        await db.refresh(record, ["employee"])
        emp = record.employee

        print(f"{emp.name:<20} {emp.employee_type:<15} {record.base_amount:>12,.0f} "
              f"{record.commission_amount:>12,.0f} {record.total_deductions:>12,.0f} {record.net_pay:>12,.0f}")

        total_gross += record.gross_pay
        total_deductions += record.total_deductions
        total_net += record.net_pay
        total_commission += record.commission_amount

    print("-" * 85)
    print(f"{'합계':<20} {'':<15} {total_gross - total_commission:>12,.0f} "
          f"{total_commission:>12,.0f} {total_deductions:>12,.0f} {total_net:>12,.0f}")

    print("\n" + "="*80)
    print("📊 상세 분석")
    print("="*80)

    for record in records:
        await db.refresh(record, ["employee"])
        emp = record.employee

        print(f"\n👤 {emp.name} ({emp.employee_type})")
        print(f"   {'='*70}")
        print(f"   💰 수입 항목:")
        print(f"      기본급: {record.base_amount:>12,.0f} Peso")
        print(f"      수수료: {record.commission_amount:>12,.0f} Peso  (커미션율: {emp.commission_rate}%)")
        print(f"      초과근무: {record.overtime_amount:>12,.0f} Peso  (분 → 시간 x 70)")
        print(f"      공휴일보너스: {record.holiday_bonus:>12,.0f} Peso")
        print(f"      식대: {record.meal_allowance:>12,.0f} Peso")
        print(f"      {'─'*65}")
        print(f"      소계(Gross): {record.gross_pay:>12,.0f} Peso")

        if record.total_deductions > 0:
            print(f"   \n💔 차감 항목:")
            if record.late_deduction > 0:
                print(f"      지각: {record.late_deduction:>12,.0f} Peso")
            if record.absence_deduction > 0:
                print(f"      결근: {record.absence_deduction:>12,.0f} Peso")
            if record.ca_deduction > 0:
                print(f"      CA차감: {record.ca_deduction:>12,.0f} Peso")
            if record.health_check_deduction > 0:
                print(f"      보건검사: {record.health_check_deduction:>12,.0f} Peso")
            if record.thirteenth_month_deduction > 0:
                print(f"      13월보너스: {record.thirteenth_month_deduction:>12,.0f} Peso")
            print(f"      {'─'*65}")
            print(f"      소계: {record.total_deductions:>12,.0f} Peso")

        print(f"   \n✅ 최종 순액(Net Pay): {record.net_pay:>12,.0f} Peso ✓\n")

    print("\n" + "="*80)
    print("📈 전체 통계")
    print("="*80)
    print(f"   전체 기본급 합계: {total_gross - total_commission:>12,.0f} Peso")
    print(f"   전체 수수료 합계: {total_commission:>12,.0f} Peso")
    print(f"   전체 차감 합계: {total_deductions:>12,.0f} Peso")
    print(f"   전체 순액 합계: {total_net:>12,.0f} Peso")
    print()


async def main():
    """메인 함수"""
    print("\n" + "🚀 " + "="*74 + " 🚀")
    print("   Mock Data 생성 및 급여/수수료 계산 테스트")
    print("   테라피스트, 드라이버, 정직원의 급여 정산 검증")
    print("🚀 " + "="*74 + " 🚀")

    try:
        await init_db()
        print("✅ 데이터베이스 초기화 완료")

        async with SessionLocal() as db:
            employees = await setup_sample_data(db)
            await create_attendance_and_ca(db, employees)
            await setup_holidays(db)
            records = await calculate_payroll(db)
            await display_results(db, records)

            print("\n" + "="*80)
            print("🎉 급여 정산 테스트 완료!")
            print("="*80)

    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
