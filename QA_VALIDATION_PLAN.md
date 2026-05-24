# ElSpa 급여 정산 시스템 - QA 종합 검증 계획

**문서 작성 일시**: 2026-05-24  
**QA 엔지니어**: Claude Code QA 검증 에이전트  
**검증 범위**: 전체 급여 정산 시스템 (모델, 계산, API, 통합)  
**예상 검증 기간**: 3-5일 (병렬 실행 가능)

---

## 📊 검증 개요

### 1. 검증 목표
- 데이터베이스 무결성 확인
- 파트별 계산 로직 정확성 검증
- 엣지 케이스 및 경계값 테스트
- 상태 전환 및 워크플로우 검증
- 성능 및 보안 검증

### 2. 검증 대상 시스템
```
급여 정산 시스템 (Phase 1-10 완성)
├── Backend (FastAPI + SQLAlchemy)
│   ├── 6개 데이터 모델
│   ├── 40+ API 엔드포인트
│   ├── 7개 계산 함수
│   ├── 150+ 단위 테스트
│   └── 감사 로그 시스템
├── Frontend (React 19 + Next.js 16)
│   ├── 15개 페이지
│   ├── 6개 차트/대시보드
│   └── API 클라이언트
└── 데이터베이스 (PostgreSQL/Supabase)
    ├── 6개 테이블
    ├── 제약조건 & 인덱스
    └── 트리거 & 뷰
```

---

## Phase 1: Database Integrity Audit

### 1.1 테이블 구조 검증

| 테이블명 | 행 수 | 주요 필드 | 검증 항목 |
|---------|------|----------|---------|
| employees | 6 | id, name, employee_type, pay_group | PK/FK 정합성, UNIQUE 제약 |
| attendance_logs | 30+ | employee_id, work_date, late_minutes | 복합 UNIQUE (employee_id, work_date) |
| cash_advances | 3 | employee_id, amount, status | status enum 검증 |
| payroll_periods | 2 | period_start, period_end, pay_group | 겹치는 기간 없음 |
| payroll_records | 6+ | payroll_period_id, employee_id, amounts | Numeric 정밀도 (10,2) |
| philippine_holidays | 3+ | holiday_date, holiday_type | 중복 날짜 없음 |

**검증 쿼리**:
```sql
-- 1. 테이블 행 수 확인
SELECT table_name, row_count FROM pg_stat_user_tables 
WHERE relname IN ('employees', 'attendance_logs', 'cash_advances', ...);

-- 2. 외래키 검증
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('cash_advances', 'attendance_logs', ...);

-- 3. CHECK 제약 검증
SELECT constraint_name, check_clause 
FROM information_schema.table_constraints 
WHERE constraint_type = 'CHECK';

-- 4. UNIQUE 제약 검증
SELECT constraint_name, column_name 
FROM information_schema.key_column_usage 
WHERE constraint_type = 'UNIQUE';
```

### 1.2 데이터 타입 & 정밀도 검증

**Numeric 필드 검증** (급여는 정확한 계산 필수):
```python
def test_decimal_precision():
    """모든 급여 필드가 Numeric(10,2) 정밀도 유지"""
    fields = [
        'base_amount', 'commission_amount', 'overtime_amount',
        'holiday_bonus', 'meal_allowance',  # 수입
        'late_deduction', 'absence_deduction', 'sss_deduction',
        'ca_deduction', 'health_check_deduction',  # 차감
        'gross_pay', 'total_deductions', 'net_pay'  # 최종
    ]
    for record in db.session.query(PayrollRecord).all():
        for field in fields:
            value = getattr(record, field)
            assert len(str(value).split('.')[1]) <= 2, \
                f"{field}에서 소수점 2자리 초과: {value}"
```

### 1.3 제약 조건 검증

**CHECK 제약**:
```python
def test_check_constraints():
    """모든 CHECK 제약 조건 검증"""
    # Employee.base_salary >= 0
    assert not any(e.base_salary < 0 for e in db.query(Employee).all())
    
    # PayrollRecord.gross_pay >= 0
    assert not any(r.gross_pay < 0 for r in db.query(PayrollRecord).all())
    
    # CashAdvance.amount >= 0
    assert not any(ca.amount < 0 for ca in db.query(CashAdvance).all())
```

**UNIQUE 제약**:
```python
def test_unique_constraints():
    """UNIQUE 제약 조건 검증"""
    # AttendanceLog: (employee_id, work_date) 유니크
    from sqlalchemy import func
    duplicates = db.query(
        AttendanceLog.employee_id,
        AttendanceLog.work_date,
        func.count('*')
    ).group_by(
        AttendanceLog.employee_id,
        AttendanceLog.work_date
    ).having(func.count('*') > 1).all()
    
    assert len(duplicates) == 0, f"중복 기록: {duplicates}"
    
    # PhilippineHoliday: holiday_date 유니크
    assert not db.query(
        PhilippineHoliday.holiday_date,
        func.count('*')
    ).group_by(PhilippineHoliday.holiday_date) \
     .having(func.count('*') > 1).all()
```

---

## Phase 2: Data Consistency Check

### 2.1 직원 데이터 정합성

**Sample Data** (6명 직원):
```python
EMPLOYEES = {
    1: ("Juan Dela Cruz", "therapist", "weekly", 5000, 100),      # Therapist
    2: ("Maria Santos", "therapist", "weekly", 5000, 100),         # Therapist
    3: ("Carlos Rodriguez", "driver", "weekly", 6000, 0),          # Driver
    4: ("Ana Garcia", "manager", "biweekly", 8000, 0),             # Manager
    5: ("Miguel Luna", "maintenance", "weekly", 3500, 0),          # Maintenance
    6: ("Rosa Perez", "hollys", "weekly", 4000, 0),                # Hollys
}
```

**검증 항목**:
```python
def test_employee_data_consistency():
    """직원 마스터 데이터 정합성"""
    employees = db.query(Employee).all()
    
    # 1. 6명 직원 존재
    assert len(employees) == 6, f"기대: 6명, 실제: {len(employees)}"
    
    # 2. 직원 유형별 분류
    types = {
        'therapist': 2,
        'driver': 1,
        'manager': 1,
        'maintenance': 1,
        'hollys': 1
    }
    for type_name, count in types.items():
        actual = len([e for e in employees if e.employee_type == type_name])
        assert actual == count, \
            f"{type_name}: 기대 {count}, 실제 {actual}"
    
    # 3. 급여 지급 주기 검증
    for emp in employees:
        assert emp.pay_group in ['weekly', 'biweekly']
    
    # 4. 기본급 검증 (0 이상)
    for emp in employees:
        assert emp.base_salary >= 0
        assert emp.commission_rate >= 0
    
    # 5. Therapist만 commission_rate > 0
    therapists = [e for e in employees if e.employee_type == 'therapist']
    for t in therapists:
        assert t.commission_rate > 0, \
            f"{t.name}의 커미션율이 0: {t.commission_rate}"
    
    # 6. 활성화 상태
    assert all(e.is_active for e in employees), "비활성화 직원 존재"
```

### 2.2 출퇴근 기록 정합성

**Sample Data** (30개 기록):
```python
# 주간 정산 (2026-05-18 ~ 2026-05-24, 7일)
ATTENDANCE = [
    # Juan (Therapist) - 5일 정상 근무
    (1, "2026-05-18", "09:00", "17:00", 0, 0, False, "none"),
    (1, "2026-05-19", "09:00", "17:00", 0, 0, False, "none"),
    ...
    # Maria (Therapist) - 4일 정상 + 1일 지각
    (2, "2026-05-18", "09:30", "17:00", 30, 0, False, "none"),
    ...
    # Carlos (Driver) - 5일 정상 + 초과근무
    (3, "2026-05-20", "08:00", "18:50", 0, 50, False, "none"),
    ...
]
```

**검증 항목**:
```python
def test_attendance_consistency():
    """출퇴근 기록 정합성"""
    logs = db.query(AttendanceLog).all()
    
    # 1. 30개 기록 존재
    assert len(logs) == 30, f"기대: 30개, 실제: {len(logs)}"
    
    # 2. (employee_id, work_date) 유니크
    seen = set()
    for log in logs:
        key = (log.employee_id, log.work_date)
        assert key not in seen, f"중복 기록: {key}"
        seen.add(key)
    
    # 3. late_minutes >= 0
    assert all(log.late_minutes >= 0 for log in logs)
    
    # 4. overtime_minutes >= 0
    assert all(log.overtime_minutes >= 0 for log in logs)
    
    # 5. clock_in/clock_out 형식 (HH:MM)
    import re
    time_pattern = re.compile(r'^\d{2}:\d{2}$')
    for log in logs:
        if log.clock_in:
            assert time_pattern.match(log.clock_in)
        if log.clock_out:
            assert time_pattern.match(log.clock_out)
    
    # 6. is_absent가 True면 clock_in/clock_out은 None
    for log in logs:
        if log.is_absent:
            assert log.clock_in is None and log.clock_out is None
    
    # 7. holiday_type 검증
    for log in logs:
        assert log.holiday_type in ['none', 'national', 'special']
```

### 2.3 CA (선지급) 추적 검증

**Sample Data** (3개 CA 요청):
```python
CA_REQUESTS = [
    (1, 1000, "2026-05-15", "pending", "Personal emergency"),    # Juan - 대기
    (2, 1500, "2026-05-14", "approved", "Medical expense"),      # Maria - 승인
    (3, 500, "2026-05-16", "rejected", "Insufficient funds"),    # Carlos - 거절
]
```

**검증 항목**:
```python
def test_cash_advance_consistency():
    """CA 정합성 및 상태 추적"""
    cas = db.query(CashAdvance).all()
    
    # 1. 3개 CA 존재
    assert len(cas) == 3
    
    # 2. 직원 FK 검증
    emp_ids = {e.id for e in db.query(Employee).all()}
    for ca in cas:
        assert ca.employee_id in emp_ids, \
            f"존재하지 않는 직원 ID: {ca.employee_id}"
    
    # 3. 상태 값 검증
    for ca in cas:
        assert ca.status in ['pending', 'approved', 'rejected', 'settled']
    
    # 4. 금액 > 0
    assert all(ca.amount > 0 for ca in cas)
    
    # 5. settled_payroll_id: approved/settled CA만 설정
    for ca in cas:
        if ca.status == 'settled':
            assert ca.settled_payroll_id is not None, \
                f"CA {ca.id}이 settled 상태인데 payroll_id가 None"
        elif ca.status in ['pending', 'rejected']:
            assert ca.settled_payroll_id is None, \
                f"CA {ca.id}이 {ca.status} 상태인데 payroll_id가 설정됨"
```

### 2.4 정산 기간 정합성

**Sample Data** (2개 기간):
```python
PERIODS = [
    ("2026-05-18", "2026-05-24", "weekly"),    # 일주일
    ("2026-05-11", "2026-05-24", "biweekly"),  # 2주
]
```

**검증 항목**:
```python
def test_payroll_period_consistency():
    """정산 기간 정합성"""
    periods = db.query(PayrollPeriod).all()
    
    # 1. 2개 기간 존재
    assert len(periods) == 2
    
    # 2. period_start < period_end
    for period in periods:
        assert period.period_start < period.period_end, \
            f"Period {period.id}: start >= end"
    
    # 3. pay_group 검증
    for period in periods:
        assert period.pay_group in ['weekly', 'biweekly']
    
    # 4. 겹치는 기간 없음 (같은 pay_group 내에서)
    for p1 in periods:
        for p2 in periods:
            if p1.id != p2.id and p1.pay_group == p2.pay_group:
                # p1과 p2가 겹치면 안됨
                assert not (p1.period_start <= p2.period_end and \
                           p2.period_start <= p1.period_end), \
                    f"기간 겹침: {p1.id} vs {p2.id}"
    
    # 5. status 검증
    for period in periods:
        assert period.status in ['draft', 'approved', 'paid']
```

### 2.5 공휴일 정합성

**Sample Data** (3개 공휴일):
```python
HOLIDAYS = [
    ("2026-06-12", "Independence Day", "national", 2.0),      # 200%
    ("2026-11-01", "All Saints Day", "national", 2.0),        # 200%
    ("2026-12-08", "Feast of Immaculate Conception", "special", 1.3),  # 130%
]
```

**검증 항목**:
```python
def test_holiday_consistency():
    """공휴일 정합성"""
    holidays = db.query(PhilippineHoliday).all()
    
    # 1. 3개 이상 공휴일
    assert len(holidays) >= 3
    
    # 2. 중복 날짜 없음
    dates = [h.holiday_date for h in holidays]
    assert len(dates) == len(set(dates)), "중복 공휴일 존재"
    
    # 3. holiday_type 검증
    for h in holidays:
        assert h.holiday_type in ['national', 'special']
    
    # 4. rate_multiplier와 type 매칭
    for h in holidays:
        if h.holiday_type == 'national':
            assert h.rate_multiplier == 2.0, \
                f"국가공휴일 {h.id}: rate_multiplier = {h.rate_multiplier}"
        elif h.holiday_type == 'special':
            assert h.rate_multiplier == 1.3, \
                f"특정공휴일 {h.id}: rate_multiplier = {h.rate_multiplier}"
```

---

## Phase 3: Payroll Calculation Validation

### 3.1 계산 함수 단위 검증

#### 3.1.1 지각 차감 (Late Deduction)

**규칙**: 10분 초과부터 1분당 10 Peso

```python
def test_late_deduction_calculations():
    """지각 차감 정확도"""
    test_cases = [
        (0, Decimal(0)),           # 지각 없음
        (5, Decimal(0)),           # 5분 (경계값 이하)
        (9, Decimal(0)),           # 9분 (임계값)
        (10, Decimal(10)),         # 10분 (초과) → 1분 * 10
        (15, Decimal(60)),         # 15분 → 6분 * 10
        (30, Decimal(210)),        # 30분 → 21분 * 10
        (60, Decimal(510)),        # 60분 → 51분 * 10
        (120, Decimal(1110)),      # 120분 → 111분 * 10
    ]
    
    for minutes, expected in test_cases:
        result = PayrollCalculator.calculate_late_deduction(minutes)
        assert result == expected, \
            f"지각 {minutes}분: 기대 {expected}, 실제 {result}"
```

#### 3.1.2 초과근무 수당 (Overtime Amount)

**규칙**: 40분 이상 시 1시간당 70 Peso (올림)

```python
def test_overtime_calculations():
    """초과근무 수당 정확도"""
    test_cases = [
        (0, Decimal(0)),           # OT 없음
        (39, Decimal(0)),          # 39분 (경계값 이하)
        (40, Decimal(70)),         # 40분 → 1시간
        (45, Decimal(70)),         # 45분 (올림) → 1시간
        (60, Decimal(70)),         # 60분 → 1시간
        (61, Decimal(140)),        # 61분 (올림) → 2시간
        (90, Decimal(140)),        # 90분 (올림) → 2시간
        (100, Decimal(140)),       # 100분 → 1.67시간 (올림) → 2시간
        (120, Decimal(140)),       # 120분 → 2시간
        (121, Decimal(210)),       # 121분 (올림) → 3시간
    ]
    
    for minutes, expected in test_cases:
        result = PayrollCalculator.calculate_overtime_amount(minutes)
        assert result == expected, \
            f"OT {minutes}분: 기대 {expected}, 실제 {result}"
```

**세부 검증**:
```python
# 올림 로직 검증
def test_overtime_rounding():
    """OT 올림 로직 검증"""
    # (minutes + 59) // 60
    test_cases = [
        (40, (40 + 59) // 60 == 1),      # 99 // 60 = 1 ✓
        (45, (45 + 59) // 60 == 1),      # 104 // 60 = 1 ✓
        (61, (61 + 59) // 60 == 2),      # 120 // 60 = 2 ✓
        (100, (100 + 59) // 60 == 2),    # 159 // 60 = 2 ✓
        (121, (121 + 59) // 60 == 3),    # 180 // 60 = 3 ✓
    ]
    
    for minutes, assertion in test_cases:
        assert assertion, f"OT {minutes}분 올림 계산 오류"
```

#### 3.1.3 공휴일 가산 (Holiday Bonus)

**규칙**: 국가공휴일 200%, 특정공휴일 130%

```python
def test_holiday_bonus_calculations():
    """공휴일 가산 정확도"""
    base_salary = Decimal(5000)  # 월 5,000 Peso
    daily_rate = base_salary / Decimal(15)  # 월 15일 기준
    
    test_cases = [
        ("national", 1, daily_rate * Decimal(2) * 1),      # 국가 200%
        ("special", 1, daily_rate * Decimal("1.3") * 1),   # 특정 130%
        ("national", 2, daily_rate * Decimal(2) * 2),      # 다중 날짜
        ("none", 1, Decimal(0)),                            # 공휴일 아님
    ]
    
    for holiday_type, days, expected in test_cases:
        result = PayrollCalculator.calculate_holiday_bonus(
            base_salary, holiday_type, days
        )
        assert result == expected, \
            f"공휴일({holiday_type}, {days}일): 기대 {expected}, 실제 {result}"
```

#### 3.1.4 13개월 보너스 (Thirteenth Month)

**규칙**: 월 기본급 × 입사 개월 수

```python
def test_thirteenth_month_calculations():
    """13개월 보너스 정확도"""
    base_salary = Decimal(12000)
    hire_date = date(2025, 1, 15)
    
    test_cases = [
        # reference_date, months, expected
        (date(2025, 1, 31), 1, base_salary / 12 * 1),    # 1월 내 입사
        (date(2025, 5, 22), 5, base_salary / 12 * 5),    # 1월~5월
        (date(2026, 1, 15), 13, base_salary / 12 * 13),  # 1년 근무
    ]
    
    for ref_date, months_expected, expected_amount in test_cases:
        months = PayrollCalculator.calculate_months_employed(hire_date, ref_date)
        assert months == months_expected, \
            f"개월 수: 기대 {months_expected}, 실제 {months}"
        
        result = PayrollCalculator.calculate_thirteenth_month_deduction(
            base_salary, hire_date, ref_date
        )
        assert result == expected_amount, \
            f"13개월 보너스: 기대 {expected_amount}, 실제 {result}"
```

#### 3.1.5 보건소 검사비 (Health Check Deduction)

**규칙**: Therapist만, 분기 말(3/6/9/12월) 500 Peso

```python
def test_health_check_deduction():
    """보건소 검사비 차감"""
    # 분기 판정
    test_cases = [
        # (month, is_quarter_end, expected)
        (1, False, Decimal(0)),      # 1월 (분기 중)
        (3, True, Decimal(500)),     # 3월 (Q1 말)
        (4, False, Decimal(0)),      # 4월 (분기 중)
        (6, True, Decimal(500)),     # 6월 (Q2 말)
        (9, True, Decimal(500)),     # 9월 (Q3 말)
        (12, True, Decimal(500)),    # 12월 (Q4 말)
    ]
    
    for month, is_quarter_end, expected in test_cases:
        # 임시 PayrollPeriod 생성
        period = PayrollPeriod(
            period_start=date(2026, month, 1),
            period_end=date(2026, month, 15),
            pay_group='weekly',
            status='draft'
        )
        
        result = PayrollCalculator.calculate_health_check_deduction(
            EmployeeType.THERAPIST, period
        )
        assert result == expected, \
            f"{month}월: 기대 {expected}, 실제 {result}"
```

### 3.2 종합 급여 계산 검증 (통합 테스트)

#### Case 1: Therapist (Juan Dela Cruz) - Weekly

**직원 정보**:
```
이름: Juan Dela Cruz (ID: 1)
직종: Therapist
급여주기: Weekly (주간)
기본급: 5,000 Peso
커미션율: 100 Peso/세션
입사일: 2025-01-15
```

**정산 기간**: 2026-05-18 ~ 2026-05-24 (7일)

**출퇴근 기록**:
```
2026-05-18: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-19: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-20: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-21: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-22: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
(결근 2일, 금토요일)
```

**계산 과정**:

| 항목 | 계산식 | 값 |
|------|--------|-----|
| **수입** |
| 기본급 (Pro-rata 5일/7일) | 5,000 × 5/7 | 3,571.43 |
| 커미션 (5 세션) | 100 × 5 | 500.00 |
| 초과근무 | 0분 < 40분 → 0 | 0.00 |
| 공휴일 가산 | 공휴일 없음 | 0.00 |
| 식대 수당 | Therapist 불해당 | 0.00 |
| **소계 (Gross Pay)** | | **4,071.43** |
| **차감** |
| 지각 차감 | 0분 < 10분 → 0 | 0.00 |
| 결근 차감 | 2일 × (5,000/15) | 666.67 |
| SSS 선지급 | 별도 설정 없음 | 0.00 |
| CA 차감 | 승인된 CA 없음 | 0.00 |
| 보건소 검사비 | 5월 (분기 중) → 0 | 0.00 |
| 13개월 보너스 | 월 금액 × 개월 | 416.67 |
| **소계 (Deductions)** | | **1,083.34** |
| **순지급액 (Net Pay)** | 4,071.43 - 1,083.34 | **2,988.09** |

**검증 쿼리**:
```python
def test_therapist_payroll_juan():
    """Case 1: Therapist Juan - Weekly payroll"""
    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.pay_group == 'weekly',
        PayrollPeriod.period_start == date(2026, 5, 18)
    ).first()
    
    record = db.query(PayrollRecord).filter(
        PayrollRecord.payroll_period_id == period.id,
        PayrollRecord.employee_id == 1  # Juan
    ).first()
    
    assert record is not None, "PayrollRecord 없음"
    assert record.base_amount == Decimal("3571.43"), \
        f"기본급: {record.base_amount}"
    assert record.commission_amount == Decimal("500.00"), \
        f"커미션: {record.commission_amount}"
    assert record.absence_deduction == Decimal("666.67"), \
        f"결근차감: {record.absence_deduction}"
    assert record.thirteenth_month_deduction == Decimal("416.67"), \
        f"13개월: {record.thirteenth_month_deduction}"
    assert record.gross_pay == Decimal("4071.43"), \
        f"Gross Pay: {record.gross_pay}"
    assert record.net_pay == Decimal("2988.09"), \
        f"Net Pay: {record.net_pay}"
```

#### Case 2: Driver (Carlos Rodriguez) - Weekly with OT & Meal Allowance

**직원 정보**:
```
이름: Carlos Rodriguez (ID: 3)
직종: Driver
급여주기: Weekly (주간)
기본급: 6,000 Peso
커미션율: 0 (N/A)
입사일: 2025-03-01
```

**정산 기간**: 2026-05-18 ~ 2026-05-24 (7일)

**출퇴근 기록**:
```
2026-05-18: 08:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-19: 08:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-20: 08:00 ~ 18:50, 지각 0분, OT 50분, 출근 ✓
2026-05-21: 08:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-22: 08:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
(결근 2일, 금토요일)
```

**계산 과정**:

| 항목 | 계산식 | 값 |
|------|--------|-----|
| **수입** |
| 기본급 (Pro-rata 5일/7일) | 6,000 × 5/7 | 4,285.71 |
| 초과근무 | 50분 (올림 1시간) | 70.00 |
| 식대 수당 | Driver 전용, 고정 | 200.00 |
| **소계 (Gross Pay)** | | **4,555.71** |
| **차감** |
| 결근 차감 | 2일 × (6,000/15) | 800.00 |
| **순지급액 (Net Pay)** | 4,555.71 - 800.00 | **3,755.71** |

**검증 쿼리**:
```python
def test_driver_payroll_carlos():
    """Case 2: Driver Carlos - Weekly with OT"""
    # ... 유사하게 검증
```

#### Case 3: Manager (Ana Garcia) - Biweekly with Late & Absence

**직원 정보**:
```
이름: Ana Garcia (ID: 4)
직종: Manager
급여주기: Biweekly (격주)
기본급: 8,000 Peso
입사일: 2025-02-01
```

**정산 기간**: 2026-05-11 ~ 2026-05-24 (14일)

**출퇴근 기록**:
```
2026-05-11: 09:30 ~ 17:00, 지각 30분, OT 0분, 출근 (지각)
2026-05-12: (결근 - 병가)
2026-05-13: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-14: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-15: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-16: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-17: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-18: (주말)
2026-05-19: (주말)
2026-05-20: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-21: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-22: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-23: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
2026-05-24: 09:00 ~ 17:00, 지각 0분, OT 0분, 출근 ✓
```

**계산 과정**:

| 항목 | 계산식 | 값 |
|------|--------|-----|
| **수입** |
| 기본급 | 8,000 | 8,000.00 |
| **소계 (Gross Pay)** | | **8,000.00** |
| **차감** |
| 지각 차감 | (30 - 9) × 10 = 21분 × 10 | 210.00 |
| 결근 차감 | 1일 × (8,000/15) | 533.33 |
| **소계 (Deductions)** | | **743.33** |
| **순지급액 (Net Pay)** | 8,000 - 743.33 | **7,256.67** |

---

## Phase 4: Edge Case & Boundary Testing

### 4.1 경계값 테스트

#### 4.1.1 지각 경계값

```python
def test_late_boundary():
    """지각 차감 경계값"""
    test_cases = [
        (9, Decimal(0)),       # 정확히 9분 (임계값)
        (10, Decimal(10)),     # 정확히 10분 (초과)
    ]
    for minutes, expected in test_cases:
        result = PayrollCalculator.calculate_late_deduction(minutes)
        assert result == expected
```

#### 4.1.2 초과근무 경계값

```python
def test_overtime_boundary():
    """OT 경계값 (40분)"""
    test_cases = [
        (39, Decimal(0)),      # 1분 부족
        (40, Decimal(70)),     # 정확히 40분
        (100, Decimal(140)),   # 1시간 40분 (올림 → 2시간)
        (101, Decimal(210)),   # 올림 → 3시간
    ]
    for minutes, expected in test_cases:
        result = PayrollCalculator.calculate_overtime_amount(minutes)
        assert result == expected
```

#### 4.1.3 공휴일 분기 경계값

```python
def test_quarter_boundary():
    """분기 말 경계값 (3/6/9/12월)"""
    test_cases = [
        (2, Decimal(0)),       # 분기 중
        (3, Decimal(500)),     # Q1 말
        (4, Decimal(0)),       # 분기 중
        (6, Decimal(500)),     # Q2 말
    ]
    for month, expected in test_cases:
        period = PayrollPeriod(
            period_start=date(2026, month, 1),
            period_end=date(2026, month, 15),
            pay_group='weekly'
        )
        result = PayrollCalculator.calculate_health_check_deduction(
            EmployeeType.THERAPIST, period
        )
        assert result == expected
```

### 4.2 0값 테스트

```python
def test_zero_values():
    """0값 처리"""
    # 지각 0분
    assert PayrollCalculator.calculate_late_deduction(0) == Decimal(0)
    
    # OT 0분
    assert PayrollCalculator.calculate_overtime_amount(0) == Decimal(0)
    
    # 기본급 0
    assert PayrollCalculator.calculate_thirteenth_month_deduction(
        Decimal(0), date(2025, 1, 1), date(2025, 12, 31)
    ) == Decimal(0)
    
    # 결근 0일
    assert PayrollCalculator.calculate_absence_deduction(
        Decimal(8000), 0
    ) == Decimal(0)
```

### 4.3 음수 입력 테스트

```python
def test_negative_inputs():
    """음수 입력 검증 (에러 처리)"""
    # 음수 입사일: hire_date > reference_date
    months = PayrollCalculator.calculate_months_employed(
        date(2026, 5, 1), date(2026, 4, 1)
    )
    assert months == 0  # 또는 에러 발생
    
    # 음수 기본급: CHECK 제약으로 DB에서 차단
    try:
        emp = Employee(
            name="Test",
            phone="123456",
            employee_type="therapist",
            pay_group="weekly",
            base_salary=-5000,  # 음수!
            hire_date=date(2025, 1, 1)
        )
        db.session.add(emp)
        db.session.commit()
        assert False, "음수 기본급이 저장됨"
    except IntegrityError:
        pass  # 예상된 에러
```

---

## Phase 5: API & Workflow Integration Testing

### 5.1 API 엔드포인트 검증

```python
@pytest.mark.asyncio
async def test_payroll_api_workflow():
    """급여 정산 API 워크플로우"""
    
    # 1. 정산 기간 생성
    period_response = await client.post("/api/payroll/periods", json={
        "period_start": "2026-05-18",
        "period_end": "2026-05-24",
        "pay_group": "weekly"
    })
    assert period_response.status_code == 201
    period_id = period_response.json()["id"]
    
    # 2. 급여 계산 실행
    calc_response = await client.post(
        f"/api/payroll/periods/{period_id}/calculate"
    )
    assert calc_response.status_code == 200
    records = calc_response.json()
    assert len(records) == 6  # 6명 직원
    
    # 3. 정산 기간 승인
    approve_response = await client.post(
        f"/api/payroll/periods/{period_id}/approve"
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"
    
    # 4. 정산 기간 지급 완료
    paid_response = await client.post(
        f"/api/payroll/periods/{period_id}/approve"
    )
    assert paid_response.status_code == 200
    assert paid_response.json()["status"] == "paid"
```

### 5.2 상태 전환 검증

```python
@pytest.mark.asyncio
async def test_status_transitions():
    """정산 상태 전환 (draft → approved → paid)"""
    
    # draft → approved ✓
    period = ... # 생성
    await client.post(f"/api/payroll/periods/{period.id}/approve")
    assert period.status == "approved"
    
    # approved → paid ✓
    await client.post(f"/api/payroll/periods/{period.id}/approve")
    assert period.status == "paid"
    
    # paid → ??? (에러)
    try:
        await client.post(f"/api/payroll/periods/{period.id}/approve")
        assert False, "paid 상태에서 전환 가능 (에러)"
    except HTTPException as e:
        assert e.status_code == 409
```

### 5.3 CA 정산 추적 검증

```python
@pytest.mark.asyncio
async def test_ca_settlement_tracking():
    """CA 정산 추적 (BUG FIX #2)"""
    
    # 1. CA 생성 (승인 상태)
    ca_response = await client.post("/api/payroll/cash-advance", json={
        "employee_id": 1,
        "amount": "1000.00",
        "request_date": "2026-05-15",
        "status": "approved"
    })
    ca_id = ca_response.json()["id"]
    
    # 2. 급여 계산 실행
    calc_response = await client.post(
        f"/api/payroll/periods/{period_id}/calculate"
    )
    
    # 3. CA 상태 확인 (settled로 변경되어야 함)
    ca_get = await client.get(f"/api/payroll/cash-advance/{ca_id}")
    assert ca_get.json()["status"] == "settled"
    assert ca_get.json()["settled_payroll_id"] is not None
```

---

## Phase 6: Performance & Security Testing

### 6.1 성능 테스트

```python
@pytest.mark.performance
async def test_payroll_calculation_performance():
    """대규모 데이터 성능"""
    import time
    
    # 1,000명 직원 시뮬레이션
    period = ... # 생성
    
    start = time.time()
    records = await PayrollCalculator.calculate_payroll_for_period(
        period, db
    )
    elapsed = time.time() - start
    
    # 목표: 1,000명 < 5초
    assert elapsed < 5.0, f"계산 시간: {elapsed:.2f}초"
    assert len(records) == 1000
```

### 6.2 보안 테스트

```python
@pytest.mark.security
async def test_payroll_authorization():
    """권한 검증"""
    
    # 비인증 사용자: 404
    response = await client.get("/api/payroll/employees")
    assert response.status_code == 401
    
    # 일반 사용자: 403 (admin 전용)
    response = await client.post(
        "/api/payroll/employees",
        headers={"Authorization": "Bearer USER_TOKEN"}
    )
    assert response.status_code == 403
```

---

## Phase 7: Final Report & Completion

### 7.1 결함 보고 템플릿

```markdown
## 결함 #1: [Issue Title]

**심각도**: Critical / High / Medium / Low
**상태**: Open / In Progress / Fixed / Closed

**설명**:
- 재현 방법
- 예상 결과
- 실제 결과

**영향 범위**:
- 영향받는 직원
- 영향받는 금액

**해결 방법**:
- 권장 수정

**테스트 완료**:
- 테스트 날짜
- 테스트 환경
```

### 7.2 완료 체크리스트

- [ ] Phase 1: Database Integrity 100% 통과
- [ ] Phase 2: Data Consistency 100% 통과
- [ ] Phase 3: Calculation Validation 100% 통과
- [ ] Phase 4: Edge Case Testing 100% 통과
- [ ] Phase 5: API Integration 100% 통과
- [ ] Phase 6: Performance & Security 100% 통과
- [ ] 모든 결함 해결 또는 문서화
- [ ] 최종 보고서 작성

### 7.3 최종 검증 의견

**프로덕션 준비 여부**:
- ✅ GO: 모든 검증 통과, 결함 0건
- ⚠️ CONDITIONAL GO: 경미한 결함 < 3건 (중요도 Low)
- ❌ NO GO: 심각한 결함 또는 계산 오류 발견

---

## 참고 자료

- 모델 정의: `app/models/payroll.py` (369줄)
- 계산 로직: `app/services/payroll_calculator.py` (200+줄)
- API 라우터: `app/routers/payroll.py` (997줄)
- 단위 테스트: `app/tests/test_payroll_*.py` (500+줄)

---

**QA 검증 계획 작성 완료**  
**Document Version**: 1.0  
**Last Updated**: 2026-05-24
