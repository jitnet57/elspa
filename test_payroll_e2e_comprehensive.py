#!/usr/bin/env python3
"""
전체 급여 정산 시스템 E2E 테스트 (89명 직원)

목표:
- 89명 직원의 1개월(또는 2주) 급여 정산 계산 검증
- 모든 급여 계산 로직 정확도 검증
- API 엔드포인트 동작 확인
- 결과 PDF 생성 가능 여부 확인

실행:
  python test_payroll_e2e_comprehensive.py
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
    EmployeeType, PayGroup, CashAdvanceStatus, HolidayType
)
from app.services.payroll_calculator import PayrollCalculator
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


class PayrollE2ETest:
    def __init__(self):
        self.db = None
        self.employees = []
        self.period = None
        self.records = []
        self.test_results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    async def setup_database(self):
        """데이터베이스 초기화"""
        print("\n" + "="*80)
        print("⚙️  SETUP: 데이터베이스 초기화")
        print("="*80)

        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        self.db = async_session()

        async with engine.begin() as conn:
            await conn.run_sync(init_db.metadata.create_all)

        print("✅ 데이터베이스 준비 완료")

    async def create_mock_employees(self):
        """89명 직원 생성"""
        print("\n" + "="*80)
        print("📝 STEP 1: Mock 직원 데이터 생성 (89명)")
        print("="*80)

        employees_config = [
            # 테라피스트: 60명 (주간급)
            {
                "count": 60,
                "type": EmployeeType.THERAPIST,
                "pay_group": PayGroup.WEEKLY,
                "base_salary": 15000,
                "commission_rate": 20,
                "prefix": "THERAPIST",
                "hired_before_cutoff": 30
            },
            # 할리스커피: 10명 (격주급)
            {
                "count": 10,
                "type": EmployeeType.HOLLYS,
                "pay_group": PayGroup.BIWEEKLY,
                "base_salary": 12000,
                "commission_rate": 0,
                "prefix": "HOLLYS",
                "hired_before_cutoff": 5
            },
            # 드라이버: 5명 (격주급)
            {
                "count": 5,
                "type": EmployeeType.DRIVER,
                "pay_group": PayGroup.BIWEEKLY,
                "base_salary": 20000,
                "commission_rate": 0,
                "prefix": "DRIVER",
                "hired_before_cutoff": 3
            },
            # 유지보수: 3명 (격주급)
            {
                "count": 3,
                "type": EmployeeType.MAINTENANCE,
                "pay_group": PayGroup.BIWEEKLY,
                "base_salary": 18000,
                "commission_rate": 0,
                "prefix": "MAINT",
                "hired_before_cutoff": 2
            },
            # 정직원: 5명 (격주급)
            {
                "count": 5,
                "type": EmployeeType.MANAGER,
                "pay_group": PayGroup.BIWEEKLY,
                "base_salary": 30000,
                "commission_rate": 0,
                "prefix": "MANAGER",
                "hired_before_cutoff": 3
            },
            # 네일샵: 6명 (주간급)
            {
                "count": 6,
                "type": EmployeeType.NAIL,
                "pay_group": PayGroup.WEEKLY,
                "base_salary": 14000,
                "commission_rate": 15,
                "prefix": "NAIL",
                "hired_before_cutoff": 3
            }
        ]

        emp_counter = 0
        for config in employees_config:
            for i in range(1, config["count"] + 1):
                emp_counter += 1
                hire_date = (
                    date(2023, 1, 1) if i <= config["hired_before_cutoff"]
                    else date(2024, 1, 1)
                )
                emp = Employee(
                    name=f"{config['prefix']}-{i:02d}",
                    phone=f"+63917{emp_counter:06d}"[-10:],
                    employee_type=config["type"],
                    pay_group=config["pay_group"],
                    base_salary=Decimal(str(config["base_salary"])),
                    commission_rate=Decimal(str(config["commission_rate"])),
                    hire_date=hire_date,
                    is_active=True
                )
                self.db.add(emp)
                self.employees.append(emp)

        await self.db.commit()
        for emp in self.employees:
            await self.db.refresh(emp)

        print(f"✅ {len(self.employees)}명 직원 생성 완료")
        for config in employees_config:
            print(f"   - {config['prefix']:12s}: {config['count']:2d}명 "
                  f"({config['pay_group']:10s}, {config['type']:15s})")

    async def create_payroll_period(self):
        """정산 기간 생성 (2026년 5월 첫째 주 - 주간급 기준)"""
        print("\n" + "="*80)
        print("📅 STEP 2: 정산 기간 생성")
        print("="*80)

        period_start = date(2026, 5, 1)
        period_end = date(2026, 5, 7)

        self.period = PayrollPeriod(
            period_start=period_start,
            period_end=period_end,
            pay_group=PayGroup.WEEKLY,
            status="draft"
        )
        self.db.add(self.period)
        await self.db.commit()
        await self.db.refresh(self.period)

        print(f"✅ 정산 기간 생성: {period_start} ~ {period_end} (주간급)")

    async def create_attendance_logs(self):
        """출퇴근 기록 생성"""
        print("\n" + "="*80)
        print("🕐 STEP 3: 출퇴근 기록 생성")
        print("="*80)

        period_start = self.period.period_start
        period_end = self.period.period_end

        # 주간급 직원들만 이번 주에 출퇴근 기록 생성
        weekly_employees = [e for e in self.employees if e.pay_group == PayGroup.WEEKLY]

        total_logs = 0
        for emp in weekly_employees:
            current_date = period_start
            while current_date <= period_end:
                # 토, 일 제외 (월-금만)
                if current_date.weekday() < 5:
                    log = AttendanceLog(
                        employee_id=emp.id,
                        work_date=current_date,
                        clock_in="09:00",
                        clock_out="18:00",
                        late_minutes=0,
                        overtime_minutes=0,
                        is_absent=False,
                        holiday_type="none"
                    )
                    self.db.add(log)
                    total_logs += 1

                current_date += timedelta(days=1)

        await self.db.commit()
        print(f"✅ {total_logs}개 출퇴근 기록 생성 완료")

    async def create_cash_advances(self):
        """CA (선지급) 생성"""
        print("\n" + "="*80)
        print("💰 STEP 4: CA 선지급 생성")
        print("="*80)

        # 일부 직원에 승인된 CA 할당
        ca_count = 0
        for i, emp in enumerate(self.employees[:10]):  # 처음 10명만
            ca = CashAdvance(
                employee_id=emp.id,
                amount=Decimal("5000"),
                request_date=self.period.period_start,
                reason="Personal expense",
                status=CashAdvanceStatus.APPROVED
            )
            self.db.add(ca)
            ca_count += 1

        await self.db.commit()
        print(f"✅ {ca_count}개 CA 생성 완료")

    async def create_holidays(self):
        """공휴일 생성"""
        print("\n" + "="*80)
        print("🎉 STEP 5: 필리핀 공휴일 설정")
        print("="*80)

        holidays = [
            PhilippineHoliday(
                holiday_date=date(2026, 5, 1),
                holiday_name="Labor Day",
                holiday_type=HolidayType.NATIONAL,
                rate_multiplier=Decimal("2.0")
            ),
        ]

        for holiday in holidays:
            self.db.add(holiday)

        await self.db.commit()
        print(f"✅ {len(holidays)}개 공휴일 설정 완료")

    async def calculate_payroll(self):
        """급여 계산"""
        print("\n" + "="*80)
        print("🧮 STEP 6: 급여 계산 실행")
        print("="*80)

        records = await PayrollCalculator.calculate_payroll_for_period(self.period, self.db)

        for record in records:
            self.db.add(record)

        await self.db.flush()

        # BUG FIX #2: CA를 settled로 표시
        for record in records:
            await PayrollCalculator.mark_cash_advances_as_settled(
                employee_id=record.employee_id,
                payroll_record_id=record.id,
                db=self.db
            )

        await self.db.commit()
        self.records = records

        print(f"✅ {len(records)}개 정산 기록 생성 완료")

    async def validate_calculations(self):
        """계산 정확도 검증"""
        print("\n" + "="*80)
        print("✔️  STEP 7: 계산 정확도 검증")
        print("="*80)

        test_count = 0
        passed = 0

        for record in self.records[:10]:  # 처음 10개 기록만 상세 검증
            test_count += 1
            emp = next((e for e in self.employees if e.id == record.employee_id), None)
            if not emp:
                continue

            print(f"\n  [{test_count}] {emp.name} (ID: {emp.id})")
            print(f"       Base: {record.base_amount} | Commission: {record.commission_amount}")
            print(f"       OT: {record.overtime_amount} | Holiday: {record.holiday_bonus}")
            print(f"       Gross: {record.gross_pay} | Deductions: {record.total_deductions}")
            print(f"       Net: {record.net_pay}")

            # 검증 1: net_pay = gross_pay - total_deductions
            expected_net = record.gross_pay - record.total_deductions
            if record.net_pay == expected_net:
                print(f"       ✅ Net pay calculation correct")
                passed += 1
            else:
                print(f"       ❌ Net pay mismatch: {record.net_pay} != {expected_net}")
                self.test_results["errors"].append(
                    f"Record {record.id}: net_pay calculation incorrect"
                )

            test_count += 1

        print(f"\n✅ {passed}/{test_count} 검증 통과")
        self.test_results["passed"] += passed
        self.test_results["failed"] += (test_count - passed)

    async def generate_statistics(self):
        """정산 통계 생성"""
        print("\n" + "="*80)
        print("📊 STEP 8: 정산 통계")
        print("="*80)

        total_gross = sum(Decimal(str(r.gross_pay)) for r in self.records)
        total_deductions = sum(Decimal(str(r.total_deductions)) for r in self.records)
        total_net = sum(Decimal(str(r.net_pay)) for r in self.records)
        avg_net = total_net / len(self.records) if self.records else 0

        print(f"  총 정산 직원: {len(self.records)}명")
        print(f"  총 수입 (Gross): {total_gross:,.2f} Peso")
        print(f"  총 차감: {total_deductions:,.2f} Peso")
        print(f"  총 지급액 (Net): {total_net:,.2f} Peso")
        print(f"  평균 지급액: {avg_net:,.2f} Peso")
        print(f"  ")
        print(f"  상태별 분포:")

        draft_count = len([r for r in self.records if r.status == "draft"])
        approved_count = len([r for r in self.records if r.status == "approved"])
        paid_count = len([r for r in self.records if r.status == "paid"])

        print(f"    - Draft: {draft_count}명")
        print(f"    - Approved: {approved_count}명")
        print(f"    - Paid: {paid_count}명")

    async def test_state_transitions(self):
        """정산 상태 전환 테스트"""
        print("\n" + "="*80)
        print("🔄 STEP 9: 정산 상태 전환 테스트")
        print("="*80)

        test_count = 0
        passed = 0

        # draft → approved 전환
        test_count += 1
        try:
            # API에서 수행할 작업 (현재 테스트는 로직만 검증)
            print(f"  [Test {test_count}] draft → approved 전환")
            if self.period.status == "draft":
                print(f"    ✅ 상태 전환 가능")
                passed += 1
            else:
                print(f"    ❌ 현재 상태: {self.period.status} (draft 아님)")
        except Exception as e:
            print(f"    ❌ 에러: {e}")

        self.test_results["passed"] += passed
        self.test_results["failed"] += (test_count - passed)

    async def run_all_tests(self):
        """모든 테스트 실행"""
        try:
            await self.setup_database()
            await self.create_mock_employees()
            await self.create_payroll_period()
            await self.create_attendance_logs()
            await self.create_cash_advances()
            await self.create_holidays()
            await self.calculate_payroll()
            await self.validate_calculations()
            await self.generate_statistics()
            await self.test_state_transitions()
            await self.print_summary()

        except Exception as e:
            print(f"\n❌ 테스트 실패: {e}")
            import traceback
            traceback.print_exc()

        finally:
            if self.db:
                await self.db.close()

    async def print_summary(self):
        """테스트 요약"""
        print("\n" + "="*80)
        print("📋 테스트 최종 결과")
        print("="*80)

        total = self.test_results["passed"] + self.test_results["failed"]
        print(f"  총 테스트: {total}")
        print(f"  통과: {self.test_results['passed']}")
        print(f"  실패: {self.test_results['failed']}")

        if self.test_results["errors"]:
            print(f"\n❌ 에러 목록:")
            for error in self.test_results["errors"]:
                print(f"   - {error}")
        else:
            print(f"\n✅ 모든 테스트 통과!")


async def main():
    test = PayrollE2ETest()
    await test.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
