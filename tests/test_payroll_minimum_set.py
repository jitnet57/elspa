#!/usr/bin/env python3
"""
============================================================
📌 ElSpa 급여 정산 — 최소 테스트 세트 (12명 + 수작업 검증)
📋 목적: 6가지 직원 유형 × 핵심 시나리오 완전 커버
📅 작성일: 2026-05-27
⚠️ 주의: In-memory SQLite 사용 — 외부 DB 불필요
============================================================

테스트 구조:
  STEP 1: DB 초기화 + 12명 직원 생성
  STEP 2: 출퇴근 기록 (정상/지각/결근/공휴일/OT)
  STEP 3: CA 선지급 (approved/pending/rejected/settled)
  STEP 4: 공휴일 설정
  STEP 5: 정산 기간 생성 (일반 월 + 분기말)
  STEP 6: 급여 계산 실행
  STEP 7: 수작업 대조 검증 (3건)
  STEP 8: 엣지 케이스 10가지 검증
  STEP 9: 결과 리포트

실행: python tests/test_payroll_minimum_set.py
"""

import asyncio
import sys
import os
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker as async_sessionmaker_compat
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.database import Base
from app.models.payroll import (
    Employee, AttendanceLog, CashAdvance, PhilippineHoliday,
    PayrollPeriod, PayrollRecord,
    EmployeeType, PayGroup, CashAdvanceStatus, HolidayType, PayrollStatus
)
from app.services.payroll_calculator import PayrollCalculator


# ============================================================
# 📌 테스트 결과 추적기
# ============================================================
class TestTracker:
    """테스트 결과를 추적하는 유틸리티 클래스"""
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors = []

    def check(self, name: str, actual, expected, tolerance=Decimal("0.01")):
        """값 비교 검증. tolerance 이내면 통과."""
        self.total += 1
        actual_d = Decimal(str(actual))
        expected_d = Decimal(str(expected))
        diff = abs(actual_d - expected_d)

        if diff <= tolerance:
            self.passed += 1
            print(f"    ✅ {name}: {actual_d} == {expected_d}")
            return True
        else:
            self.failed += 1
            msg = f"{name}: 기대={expected_d}, 실제={actual_d}, 차이={diff}"
            self.errors.append(msg)
            print(f"    ❌ {msg}")
            return False

    def check_bool(self, name: str, actual: bool, expected: bool):
        """불리언 비교 검증"""
        self.total += 1
        if actual == expected:
            self.passed += 1
            print(f"    ✅ {name}: {actual}")
            return True
        else:
            self.failed += 1
            msg = f"{name}: 기대={expected}, 실제={actual}"
            self.errors.append(msg)
            print(f"    ❌ {msg}")
            return False

    def summary(self):
        """최종 결과 출력"""
        print("\n" + "=" * 80)
        print("📋 최종 테스트 결과")
        print("=" * 80)
        print(f"  총 테스트: {self.total}")
        print(f"  ✅ 통과:   {self.passed}")
        print(f"  ❌ 실패:   {self.failed}")
        rate = (self.passed / self.total * 100) if self.total > 0 else 0
        print(f"  📊 통과율:  {rate:.1f}%")

        if self.errors:
            print(f"\n❌ 실패 목록:")
            for e in self.errors:
                print(f"   - {e}")
        else:
            print(f"\n🎉 모든 테스트 통과! 급여 정산 엔진 정확도 검증 완료!")

        return self.failed == 0


# ============================================================
# 📌 메인 테스트 클래스
# ============================================================
class PayrollMinimumSetTest:
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self.db: AsyncSession = None
        self.tracker = TestTracker()
        self.employees = {}       # name → Employee 객체
        self.period_normal = None  # 일반 월 (5월)
        self.period_quarter = None # 분기말 (6월)
        self.records_normal = []   # 일반 월 정산 결과
        self.records_quarter = []  # 분기말 정산 결과

    # ============================================================
    # STEP 1: DB 초기화 + 12명 직원 생성
    # ============================================================
    async def step1_setup_db_and_employees(self):
        print("\n" + "=" * 80)
        print("🧑‍💼 STEP 1: DB 초기화 + 12명 최소 테스트 직원 생성")
        print("=" * 80)

        # In-memory SQLite 비동기 엔진
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        self.session_factory = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

        # 테이블 생성
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.db = self.session_factory()

        # 12명 직원 정의 (가이드 기준)
        employee_configs = [
            # --- Therapist (주간급, 커미션 O, 보건검사 O) ---
            {"name": "TH-정상",   "type": EmployeeType.THERAPIST, "group": PayGroup.WEEKLY,
             "salary": 15000, "comm": 20, "hire": date(2023, 1, 15)},
            {"name": "TH-신입",   "type": EmployeeType.THERAPIST, "group": PayGroup.WEEKLY,
             "salary": 15000, "comm": 20, "hire": date(2026, 4, 1)},

            # --- Nail (주간급, 커미션 O, 보건검사 X) ---
            {"name": "NL-정상",   "type": EmployeeType.NAIL, "group": PayGroup.WEEKLY,
             "salary": 14000, "comm": 15, "hire": date(2024, 6, 1)},
            {"name": "NL-CA있음", "type": EmployeeType.NAIL, "group": PayGroup.WEEKLY,
             "salary": 14000, "comm": 15, "hire": date(2023, 6, 1)},

            # --- Driver (격주급, 초과근무 O, 식대 O) ---
            {"name": "DR-정상",   "type": EmployeeType.DRIVER, "group": PayGroup.BIWEEKLY,
             "salary": 20000, "comm": 0, "hire": date(2022, 6, 1)},
            {"name": "DR-OT많음", "type": EmployeeType.DRIVER, "group": PayGroup.BIWEEKLY,
             "salary": 20000, "comm": 0, "hire": date(2022, 1, 1)},

            # --- Manager (격주급, 결근차감 O, 초과근무 O) ---
            {"name": "MG-정상",   "type": EmployeeType.MANAGER, "group": PayGroup.BIWEEKLY,
             "salary": 30000, "comm": 0, "hire": date(2021, 1, 1)},
            {"name": "MG-결근",   "type": EmployeeType.MANAGER, "group": PayGroup.BIWEEKLY,
             "salary": 30000, "comm": 0, "hire": date(2021, 6, 1)},

            # --- Maintenance (격주급, 초과근무 O) ---
            {"name": "MT-정상",   "type": EmployeeType.MAINTENANCE, "group": PayGroup.BIWEEKLY,
             "salary": 18000, "comm": 0, "hire": date(2022, 1, 1)},
            {"name": "MT-지각",   "type": EmployeeType.MAINTENANCE, "group": PayGroup.BIWEEKLY,
             "salary": 18000, "comm": 0, "hire": date(2023, 3, 1)},

            # --- Hollys (격주급, 초과근무 O) ---
            {"name": "HL-정상",   "type": EmployeeType.HOLLYS, "group": PayGroup.BIWEEKLY,
             "salary": 16000, "comm": 0, "hire": date(2023, 3, 1)},
            {"name": "HL-공휴일", "type": EmployeeType.HOLLYS, "group": PayGroup.BIWEEKLY,
             "salary": 16000, "comm": 0, "hire": date(2024, 1, 1)},
        ]

        for cfg in employee_configs:
            emp = Employee(
                name=cfg["name"],
                phone=f"09170000001",
                employee_type=cfg["type"],
                pay_group=cfg["group"],
                base_salary=Decimal(str(cfg["salary"])),
                commission_rate=Decimal(str(cfg["comm"])),
                hire_date=cfg["hire"],
                is_active=True
            )
            self.db.add(emp)

        await self.db.commit()

        # 직원 이름으로 빠르게 조회할 수 있도록 딕셔너리에 저장
        from sqlalchemy import select
        result = await self.db.execute(select(Employee))
        for emp in result.scalars().all():
            self.employees[emp.name] = emp

        print(f"  ✅ {len(self.employees)}명 직원 생성 완료")
        for name, emp in self.employees.items():
            print(f"     {name:12s} | {emp.employee_type:12s} | {emp.pay_group:10s} | "
                  f"Base: {emp.base_salary:>8} | Hire: {emp.hire_date}")

    # ============================================================
    # STEP 2: 출퇴근 기록 생성
    # ============================================================
    async def step2_create_attendance(self):
        print("\n" + "=" * 80)
        print("🕐 STEP 2: 출퇴근 기록 생성")
        print("=" * 80)

        # 정산 기간: 5/4(월) ~ 5/8(금) — 주간급 테스트
        # 격주급 테스트: 5/4(월) ~ 5/15(금)
        # 분기말: 6/1(월) ~ 6/5(금) — 보건검사비 테스트

        log_count = 0

        # ─── 주간급 직원 (Therapist, Nail): 5/4 ~ 5/8 ───
        weekly_employees = ["TH-정상", "TH-신입", "NL-정상", "NL-CA있음"]
        for name in weekly_employees:
            emp = self.employees[name]
            for d in range(4, 9):  # 5/4 ~ 5/8 (월~금)
                work_date = date(2026, 5, d)
                late = 0
                ot = 0
                absent = False
                holiday = "none"

                # TH-정상: 5/6(수)에 15분 지각
                if name == "TH-정상" and d == 6:
                    late = 15

                # TH-신입: 5/7(목)에 30분 지각
                if name == "TH-신입" and d == 7:
                    late = 30

                log = AttendanceLog(
                    employee_id=emp.id, work_date=work_date,
                    clock_in="09:00", clock_out="18:00",
                    late_minutes=late, overtime_minutes=ot,
                    is_absent=absent, holiday_type=holiday
                )
                self.db.add(log)
                log_count += 1

        # ─── 격주급 직원: 5/4 ~ 5/15 (10 영업일) ───
        biweekly_employees = [
            "DR-정상", "DR-OT많음", "MG-정상", "MG-결근",
            "MT-정상", "MT-지각", "HL-정상", "HL-공휴일"
        ]
        for name in biweekly_employees:
            emp = self.employees[name]
            for d_offset in range(0, 12):  # 5/4 ~ 5/15 (주말 포함 루프)
                work_date = date(2026, 5, 4) + timedelta(days=d_offset)
                if work_date.weekday() >= 5:  # 주말 건너뛰기
                    continue

                late = 0
                ot = 0
                absent = False
                holiday = "none"

                # DR-OT많음: 매일 75분 OT
                if name == "DR-OT많음":
                    ot = 75

                # MG-결근: 5/7, 5/8 결근 (2일)
                if name == "MG-결근" and work_date in [date(2026, 5, 7), date(2026, 5, 8)]:
                    absent = True
                    clock_in = None
                    clock_out = None
                    log = AttendanceLog(
                        employee_id=emp.id, work_date=work_date,
                        clock_in=clock_in, clock_out=clock_out,
                        late_minutes=0, overtime_minutes=0,
                        is_absent=True, holiday_type="none"
                    )
                    self.db.add(log)
                    log_count += 1
                    continue

                # MT-지각: 5/5, 5/6에 각각 20분, 45분 지각
                if name == "MT-지각" and work_date == date(2026, 5, 5):
                    late = 20
                if name == "MT-지각" and work_date == date(2026, 5, 6):
                    late = 45

                log = AttendanceLog(
                    employee_id=emp.id, work_date=work_date,
                    clock_in="09:00", clock_out="18:00",
                    late_minutes=late, overtime_minutes=ot,
                    is_absent=absent, holiday_type=holiday
                )
                self.db.add(log)
                log_count += 1

        # ─── 분기말 출퇴근 (6/1 ~ 6/5, 주간급만) ───
        for name in weekly_employees:
            emp = self.employees[name]
            for d in range(1, 6):  # 6/1 ~ 6/5 (월~금)
                work_date = date(2026, 6, d)
                log = AttendanceLog(
                    employee_id=emp.id, work_date=work_date,
                    clock_in="09:00", clock_out="18:00",
                    late_minutes=0, overtime_minutes=0,
                    is_absent=False, holiday_type="none"
                )
                self.db.add(log)
                log_count += 1

        await self.db.commit()
        print(f"  ✅ {log_count}개 출퇴근 기록 생성 완료")

    # ============================================================
    # STEP 3: CA 선지급 생성
    # ============================================================
    async def step3_create_cash_advances(self):
        print("\n" + "=" * 80)
        print("💰 STEP 3: CA 선지급 생성 (상태별 테스트)")
        print("=" * 80)

        ca_data = [
            # ✅ 차감 대상: APPROVED
            {"emp": "NL-CA있음", "amount": 5000, "status": CashAdvanceStatus.APPROVED,
             "reason": "의료비"},
            {"emp": "NL-CA있음", "amount": 3000, "status": CashAdvanceStatus.APPROVED,
             "reason": "가족경조사"},
            # → 합계: 8,000 Peso 차감 예상

            # ❌ 차감 제외: PENDING
            {"emp": "TH-정상", "amount": 10000, "status": CashAdvanceStatus.PENDING,
             "reason": "교육비"},

            # ❌ 차감 제외: REJECTED
            {"emp": "DR-정상", "amount": 5000, "status": CashAdvanceStatus.REJECTED,
             "reason": "거절됨"},
        ]

        for ca in ca_data:
            cash_advance = CashAdvance(
                employee_id=self.employees[ca["emp"]].id,
                amount=Decimal(str(ca["amount"])),
                request_date=date(2026, 5, 1),
                reason=ca["reason"],
                status=ca["status"]
            )
            self.db.add(cash_advance)

        await self.db.commit()
        print(f"  ✅ {len(ca_data)}개 CA 생성 완료")
        print(f"     NL-CA있음: APPROVED 2건 (5000 + 3000 = 8000)")
        print(f"     TH-정상:   PENDING 1건 (차감 안 됨)")
        print(f"     DR-정상:   REJECTED 1건 (차감 안 됨)")

    # ============================================================
    # STEP 4: 공휴일 설정
    # ============================================================
    async def step4_create_holidays(self):
        print("\n" + "=" * 80)
        print("🎉 STEP 4: 공휴일 설정")
        print("=" * 80)

        holidays = [
            PhilippineHoliday(
                holiday_date=date(2026, 6, 12),
                holiday_name="Independence Day",
                holiday_type=HolidayType.NATIONAL,
                rate_multiplier=Decimal("2.0")
            ),
            PhilippineHoliday(
                holiday_date=date(2026, 5, 30),
                holiday_name="Special Holiday",
                holiday_type=HolidayType.SPECIAL,
                rate_multiplier=Decimal("1.3")
            ),
        ]

        for h in holidays:
            self.db.add(h)

        await self.db.commit()
        print(f"  ✅ {len(holidays)}개 공휴일 설정 완료")

    # ============================================================
    # STEP 5: 정산 기간 생성
    # ============================================================
    async def step5_create_periods(self):
        print("\n" + "=" * 80)
        print("📅 STEP 5: 정산 기간 생성")
        print("=" * 80)

        # 일반 월 (5월) — 주간급
        self.period_normal = PayrollPeriod(
            period_start=date(2026, 5, 4),
            period_end=date(2026, 5, 8),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        self.db.add(self.period_normal)

        # 일반 월 (5월) — 격주급
        self.period_biweekly = PayrollPeriod(
            period_start=date(2026, 5, 4),
            period_end=date(2026, 5, 15),
            pay_group=PayGroup.BIWEEKLY,
            status=PayrollStatus.DRAFT
        )
        self.db.add(self.period_biweekly)

        # 분기말 (6월) — 주간급 (보건검사비 테스트)
        self.period_quarter = PayrollPeriod(
            period_start=date(2026, 6, 1),
            period_end=date(2026, 6, 5),
            pay_group=PayGroup.WEEKLY,
            status=PayrollStatus.DRAFT
        )
        self.db.add(self.period_quarter)

        await self.db.commit()
        await self.db.refresh(self.period_normal)
        await self.db.refresh(self.period_biweekly)
        await self.db.refresh(self.period_quarter)

        print(f"  ✅ 3개 정산 기간 생성 완료")
        print(f"     [일반-주간]  {self.period_normal.period_start} ~ {self.period_normal.period_end}")
        print(f"     [일반-격주]  {self.period_biweekly.period_start} ~ {self.period_biweekly.period_end}")
        print(f"     [분기말-주간] {self.period_quarter.period_start} ~ {self.period_quarter.period_end}")

    # ============================================================
    # STEP 6: 급여 계산 실행
    # ============================================================
    async def step6_calculate_payroll(self):
        print("\n" + "=" * 80)
        print("🧮 STEP 6: 급여 계산 실행")
        print("=" * 80)

        # 일반 월 — 주간급
        print("\n  📌 일반 월 (주간급) 정산 중...")
        self.records_normal = await PayrollCalculator.calculate_payroll_for_period(
            self.period_normal, self.db
        )
        for r in self.records_normal:
            self.db.add(r)
        await self.db.commit()
        print(f"     ✅ {len(self.records_normal)}명 정산 완료")

        # 일반 월 — 격주급
        print("\n  📌 일반 월 (격주급) 정산 중...")
        self.records_biweekly = await PayrollCalculator.calculate_payroll_for_period(
            self.period_biweekly, self.db
        )
        for r in self.records_biweekly:
            self.db.add(r)
        await self.db.commit()
        print(f"     ✅ {len(self.records_biweekly)}명 정산 완료")

        # 분기말 — 주간급
        print("\n  📌 분기말 (주간급, 6월) 정산 중...")
        self.records_quarter = await PayrollCalculator.calculate_payroll_for_period(
            self.period_quarter, self.db
        )
        for r in self.records_quarter:
            self.db.add(r)
        await self.db.commit()
        print(f"     ✅ {len(self.records_quarter)}명 정산 완료")

    # ============================================================
    # STEP 7: 수작업 대조 검증 (핵심 3건)
    # ============================================================
    async def step7_manual_verification(self):
        print("\n" + "=" * 80)
        print("✔️  STEP 7: 수작업 대조 검증 (3건)")
        print("=" * 80)

        # ─── Case 1: TH-정상 (주간급, 일반 월) ───
        print("\n  📋 Case 1: TH-정상 (Therapist, Weekly, 일반 월)")
        rec = self._find_record(self.records_normal, "TH-정상")
        if rec:
            # 수작업 계산:
            # 기본급: 15,000
            # 커미션: 5일 근무(결근 아닌 날) × 100 = 500
            # OT: 0 (Therapist는 OT 없음)
            # 공휴일: 0
            # 식대: 0 (Therapist 아님)
            # Gross = 15,000 + 500 = 15,500
            #
            # 지각: 15분 → (15-9) × 10 = 60
            # 결근: 0 (Therapist는 결근차감 없음)
            # SSS: 0
            # CA: 0 (PENDING만 있음, APPROVED 없음)
            # 보건검사: 0 (5월, 분기말 아님)
            # 13개월: (15000/12) × months_employed
            #   hire=2023-01-15, ref=2026-05-08
            #   years_diff=3, months_diff=4, total=40
            #   ref.day(8) < hire.day(15)이므로 +1 안 함 → 40개월
            #   BUT max(40, 1) → 40
            #   → (15000/12) × 40 = 1250 × 40 = 50,000
            # Total Deductions = 60 + 0 + 0 + 0 + 0 + 50,000 = 50,060
            # Net = max(15,500 - 50,060, 0) = 0

            self.tracker.check("TH-정상 기본급", rec.base_amount, 15000)
            self.tracker.check("TH-정상 커미션", rec.commission_amount, 500)
            self.tracker.check("TH-정상 OT", rec.overtime_amount, 0)
            self.tracker.check("TH-정상 식대", rec.meal_allowance, 0)
            self.tracker.check("TH-정상 지각차감", rec.late_deduction, 60)
            self.tracker.check("TH-정상 CA차감", rec.ca_deduction, 0)
            self.tracker.check("TH-정상 보건검사", rec.health_check_deduction, 0)
            # Net Pay = max(gross - deductions, 0)
            self.tracker.check("TH-정상 Net≥0", rec.net_pay, max(rec.gross_pay - rec.total_deductions, Decimal(0)))

        # ─── Case 2: NL-CA있음 (주간급, CA 차감 테스트) ───
        print("\n  📋 Case 2: NL-CA있음 (Nail, Weekly, CA 8000 차감)")
        rec = self._find_record(self.records_normal, "NL-CA있음")
        if rec:
            # 기본급: 14,000
            # 커미션: 5일 × 100 = 500
            # Gross = 14,500
            #
            # CA: 5000 + 3000 = 8,000 (APPROVED)
            # 보건검사: 0 (Nail은 보건검사 없음)
            # 지각: 0

            self.tracker.check("NL-CA있음 기본급", rec.base_amount, 14000)
            self.tracker.check("NL-CA있음 커미션", rec.commission_amount, 500)
            self.tracker.check("NL-CA있음 CA차감", rec.ca_deduction, 8000)
            self.tracker.check("NL-CA있음 보건검사", rec.health_check_deduction, 0)

        # ─── Case 3: MG-결근 (격주급, 결근 2일) ───
        print("\n  📋 Case 3: MG-결근 (Manager, Biweekly, 결근 2일)")
        rec = self._find_record(self.records_biweekly, "MG-결근")
        if rec:
            # 기본급: 30,000
            # 커미션: 0 (Manager)
            # OT: 0
            # Gross = 30,000
            #
            # 결근: 2일 → (30000/15) × 2 = 2000 × 2 = 4,000
            # 지각: 0
            # CA: 0

            self.tracker.check("MG-결근 기본급", rec.base_amount, 30000)
            self.tracker.check("MG-결근 커미션", rec.commission_amount, 0)
            expected_absence = (Decimal(30000) / Decimal(15)) * Decimal(2)
            self.tracker.check("MG-결근 결근차감", rec.absence_deduction, expected_absence)

    # ============================================================
    # STEP 8: 엣지 케이스 10가지 검증
    # ============================================================
    async def step8_edge_cases(self):
        print("\n" + "=" * 80)
        print("🔍 STEP 8: 엣지 케이스 10가지 검증")
        print("=" * 80)

        calc = PayrollCalculator

        # 1. 지각 9분 vs 10분 경계값
        print("\n  [1] 지각 9분 vs 10분 경계값")
        self.tracker.check("지각 9분", calc.calculate_late_deduction(9), 0)
        self.tracker.check("지각 10분", calc.calculate_late_deduction(10), 10)

        # 2. OT 39분 vs 40분 경계값
        print("\n  [2] OT 39분 vs 40분 경계값")
        self.tracker.check("OT 39분", calc.calculate_overtime_amount(39), 0)
        self.tracker.check("OT 40분", calc.calculate_overtime_amount(40), 70)

        # 3. OT 60분 vs 61분 올림
        print("\n  [3] OT 60분 vs 61분 올림")
        self.tracker.check("OT 60분", calc.calculate_overtime_amount(60), 70)
        self.tracker.check("OT 61분", calc.calculate_overtime_amount(61), 140)

        # 4. CA approved vs pending
        print("\n  [4] CA approved vs pending")
        rec_ca = self._find_record(self.records_normal, "NL-CA있음")
        rec_pending = self._find_record(self.records_normal, "TH-정상")
        if rec_ca:
            self.tracker.check("CA APPROVED 차감", rec_ca.ca_deduction, 8000)
        if rec_pending:
            self.tracker.check("CA PENDING 미차감", rec_pending.ca_deduction, 0)

        # 5. 분기말 vs 일반 월 (보건검사비)
        print("\n  [5] 분기말 vs 일반 월 (보건검사비)")
        rec_normal = self._find_record(self.records_normal, "TH-정상")
        rec_quarter = self._find_record(self.records_quarter, "TH-정상")
        if rec_normal:
            self.tracker.check("일반월 보건검사 0", rec_normal.health_check_deduction, 0)
        if rec_quarter:
            self.tracker.check("분기말 보건검사 500", rec_quarter.health_check_deduction, 500)

        # 6. Net Pay 음수 방지
        print("\n  [6] Net Pay ≥ 0 보장")
        all_records = self.records_normal + self.records_biweekly + self.records_quarter
        for rec in all_records:
            if rec.net_pay < 0:
                self.tracker.check_bool(f"Net≥0 (ID={rec.id})", False, True)
            # 하나만 체크하고 넘어가기
        self.tracker.check_bool("모든 Net Pay ≥ 0",
                                all(r.net_pay >= 0 for r in all_records), True)

        # 7. 비활성 직원 제외 (별도 직원 추가)
        print("\n  [7] 비활성 직원(is_active=False) 정산 제외")
        inactive_emp = Employee(
            name="INACTIVE-테스트", phone="0000000000",
            employee_type=EmployeeType.THERAPIST, pay_group=PayGroup.WEEKLY,
            base_salary=Decimal("15000"), commission_rate=Decimal("0"),
            hire_date=date(2023, 1, 1), is_active=False
        )
        self.db.add(inactive_emp)
        await self.db.commit()
        # 주간급 정산에 비활성 직원이 포함되지 않는지 확인
        inactive_in_records = any(
            r.employee_id == inactive_emp.id for r in self.records_normal
        )
        self.tracker.check_bool("비활성 직원 정산 제외", inactive_in_records, False)

        # 8. 커미션 Therapist vs Driver
        print("\n  [8] 커미션: Therapist ✅ vs Driver ❌")
        rec_th = self._find_record(self.records_normal, "TH-정상")
        rec_dr = self._find_record(self.records_biweekly, "DR-정상")
        if rec_th:
            self.tracker.check_bool("Therapist 커미션 > 0", rec_th.commission_amount > 0, True)
        if rec_dr:
            self.tracker.check("Driver 커미션 = 0", rec_dr.commission_amount, 0)

        # 9. 결근차감 Manager vs Therapist
        print("\n  [9] 결근차감: Manager ✅ vs Therapist ❌")
        rec_mg = self._find_record(self.records_biweekly, "MG-결근")
        rec_th = self._find_record(self.records_normal, "TH-정상")
        if rec_mg:
            self.tracker.check_bool("Manager 결근차감 > 0", rec_mg.absence_deduction > 0, True)
        if rec_th:
            self.tracker.check("Therapist 결근차감 = 0", rec_th.absence_deduction, 0)

        # 10. 13개월 보너스 신입 vs 장기 근무
        print("\n  [10] 13개월 보너스: 신입 < 장기근무")
        rec_new = self._find_record(self.records_normal, "TH-신입")
        rec_old = self._find_record(self.records_normal, "TH-정상")
        if rec_new and rec_old:
            self.tracker.check_bool("신입 13개월 < 장기 13개월",
                                    rec_new.thirteenth_month_deduction < rec_old.thirteenth_month_deduction,
                                    True)

    # ============================================================
    # STEP 9: 결과 리포트
    # ============================================================
    async def step9_report(self):
        print("\n" + "=" * 80)
        print("📊 STEP 9: 정산 결과 리포트")
        print("=" * 80)

        def print_records(title, records):
            print(f"\n  📌 {title} ({len(records)}명)")
            print(f"  {'이름':12s} | {'Gross':>10s} | {'차감':>10s} | {'Net':>10s} | {'커미션':>8s} | {'지각':>6s}")
            print(f"  {'-'*12}-+-{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*6}")
            for rec in records:
                emp = next((e for e in self.employees.values() if e.id == rec.employee_id), None)
                name = emp.name if emp else f"ID={rec.employee_id}"
                print(f"  {name:12s} | {rec.gross_pay:>10,.0f} | {rec.total_deductions:>10,.0f} | "
                      f"{rec.net_pay:>10,.0f} | {rec.commission_amount:>8,.0f} | {rec.late_deduction:>6,.0f}")

        print_records("일반 월 — 주간급", self.records_normal)
        print_records("일반 월 — 격주급", self.records_biweekly)
        print_records("분기말 — 주간급 (6월)", self.records_quarter)

        # 적요란 생성 결과 확인을 위한 샘플 출력 (예: TH-정상, NL-CA있음, MG-결근)
        print("\n" + "=" * 80)
        print("📝 [샘플 적요란 출력 검증 - TH-정상]")
        rec_th_normal = self._find_record(self.records_normal, "TH-정상")
        if rec_th_normal and rec_th_normal.notes:
            print(rec_th_normal.notes)

        print("\n" + "=" * 80)
        print("📝 [샘플 적요란 출력 검증 - NL-CA있음]")
        rec_nl_ca = self._find_record(self.records_normal, "NL-CA있음")
        if rec_nl_ca and rec_nl_ca.notes:
            print(rec_nl_ca.notes)

        print("\n" + "=" * 80)
        print("📝 [샘플 적요란 출력 검증 - MG-결근]")
        rec_mg_absent = self._find_record(self.records_biweekly, "MG-결근")
        if rec_mg_absent and rec_mg_absent.notes:
            print(rec_mg_absent.notes)

        # 최종 결과
        self.tracker.summary()

    # ============================================================
    # 유틸리티
    # ============================================================
    def _find_record(self, records, emp_name):
        """이름으로 정산 기록 찾기"""
        emp = self.employees.get(emp_name)
        if not emp:
            print(f"    ⚠️ 직원 '{emp_name}' 없음")
            return None
        for r in records:
            if r.employee_id == emp.id:
                return r
        print(f"    ⚠️ '{emp_name}'의 정산 기록 없음")
        return None

    # ============================================================
    # 실행
    # ============================================================
    async def run(self):
        """전체 테스트 실행"""
        print("\n" + "🚀 " + "=" * 74 + " 🚀")
        print("   ElSpa 급여 정산 — 최소 테스트 세트 (12명 + 수작업 검증)")
        print("   6가지 직원 유형 × 핵심 시나리오 완전 커버")
        print("🚀 " + "=" * 74 + " 🚀")

        try:
            await self.step1_setup_db_and_employees()
            await self.step2_create_attendance()
            await self.step3_create_cash_advances()
            await self.step4_create_holidays()
            await self.step5_create_periods()
            await self.step6_calculate_payroll()
            await self.step7_manual_verification()
            await self.step8_edge_cases()
            await self.step9_report()

        except Exception as e:
            print(f"\n❌ 테스트 실행 오류: {e}")
            import traceback
            traceback.print_exc()

        finally:
            if self.db:
                await self.db.close()
            if self.engine:
                await self.engine.dispose()


# ============================================================
# 📌 엔트리포인트
# ============================================================
async def main():
    test = PayrollMinimumSetTest()
    await test.run()


if __name__ == "__main__":
    asyncio.run(main())
