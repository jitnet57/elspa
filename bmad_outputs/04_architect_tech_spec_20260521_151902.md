# ElSpa 급여 정산 시스템 — 기술 설계 & DB 스키마

## 1. 아키텍처 개요

```
FastAPI 백엔드
├── app/
│   ├── models/
│   │   ├── employee.py
│   │   ├── cash_advance.py
│   │   ├── attendance_log.py
│   │   ├── payroll_period.py
│   │   ├── payroll_record.py
│   │   └── philippine_holiday.py
│   ├── routers/
│   │   └── payroll.py
│   ├── schemas/
│   │   └── payroll.py
│   └── services/
│       └── payroll_calculator.py

Next.js 프론트엔드
├── app/admin/payroll/
│   ├── page.tsx           (메인 대시보드)
│   ├── employees/page.tsx (직원 관리)
│   ├── cash-advance/page.tsx
│   ├── attendance/page.tsx
│   ├── holidays/page.tsx
│   └── records/page.tsx
├── components/payroll/
│   ├── PayrollDashboard.tsx
│   ├── EmployeeForm.tsx
│   ├── AttendanceInput.tsx
│   └── PayrollRecordDetail.tsx
└── lib/payroll.ts        (API 호출 유틸)
```

---

## 2. SQLAlchemy 모델 설계

### 2-1. Employee (직원 마스터)

필드:
- id: Integer, PK
- name: String(255), NOT NULL
- phone: String(20), NOT NULL
- employee_type: String(50), 값: therapist|nail|driver|maintenance|hollys|manager
- pay_group: String(50), 값: weekly|biweekly
- base_salary: Numeric(10,2), NOT NULL
- commission_rate: Numeric(5,2), DEFAULT 0 (therapist/nail용)
- hire_date: Date, NOT NULL
- is_active: Boolean, DEFAULT True
- created_at: DateTime, DEFAULT now()
- updated_at: DateTime, DEFAULT now()

관계:
- cash_advances (1:N)
- attendance_logs (1:N)
- payroll_records (1:N)

---

### 2-2. CashAdvance (CA 선지급)

필드:
- id: Integer, PK
- employee_id: Integer, FK(Employee.id)
- amount: Numeric(10,2), NOT NULL
- request_date: Date, NOT NULL
- reason: String(500)
- status: String(50), 값: pending|approved|rejected
- settled_payroll_id: Integer, FK(PayrollRecord.id), nullable
- created_at: DateTime
- updated_at: DateTime

---

### 2-3. AttendanceLog (출퇴근 기록)

필드:
- id: Integer, PK
- employee_id: Integer, FK(Employee.id)
- work_date: Date, NOT NULL
- clock_in: Time
- clock_out: Time
- late_minutes: Integer, DEFAULT 0 (자동 계산)
- overtime_minutes: Integer, DEFAULT 0 (자동 계산)
- is_absent: Boolean, DEFAULT False
- holiday_type: String(50), 값: none|national|special
- created_at: DateTime
- updated_at: DateTime

---

### 2-4. PayrollPeriod (정산 기간)

필드:
- id: Integer, PK
- period_start: Date, NOT NULL
- period_end: Date, NOT NULL
- pay_group: String(50), 값: weekly|biweekly
- status: String(50), 값: draft|approved|paid
- created_at: DateTime
- updated_at: DateTime

관계:
- payroll_records (1:N)

---

### 2-5. PayrollRecord (개인별 정산 결과)

필드:
- id: Integer, PK
- payroll_period_id: Integer, FK(PayrollPeriod.id)
- employee_id: Integer, FK(Employee.id)
- base_amount: Numeric(10,2)
- commission_amount: Numeric(10,2), DEFAULT 0
- overtime_amount: Numeric(10,2), DEFAULT 0
- holiday_bonus: Numeric(10,2), DEFAULT 0
- meal_allowance: Numeric(10,2), DEFAULT 0 (driver용)
- late_deduction: Numeric(10,2), DEFAULT 0
- absence_deduction: Numeric(10,2), DEFAULT 0
- sss_deduction: Numeric(10,2), DEFAULT 0
- ca_deduction: Numeric(10,2), DEFAULT 0
- health_check_deduction: Numeric(10,2), DEFAULT 0
- thirteenth_month_deduction: Numeric(10,2), DEFAULT 0
- gross_pay: Numeric(10,2) (계산 필드)
- total_deductions: Numeric(10,2) (계산 필드)
- net_pay: Numeric(10,2) (계산 필드)
- status: String(50), 값: draft|approved|paid
- notes: String(1000)
- created_at: DateTime
- updated_at: DateTime

---

### 2-6. PhilippineHoliday (공휴일)

필드:
- id: Integer, PK
- holiday_date: Date, NOT NULL, UNIQUE
- holiday_name: String(255), NOT NULL
- holiday_type: String(50), 값: national(200%)|special(130%)
- rate_multiplier: Numeric(3,2), 기본값: 2.0 또는 1.3
- created_at: DateTime
- updated_at: DateTime

---

## 3. 급여 계산 엔진 (calculate_payroll 함수)

```python
async def calculate_payroll(payroll_period_id: int) -> List[PayrollRecord]:
    """
    정산 기간에 해당하는 모든 직원의 급여 계산

    단계:
    1. PayrollPeriod 조회
    2. 해당 기간의 모든 직원 조회 (pay_group 매칭)
    3. 각 직원별 계산:
       - base_amount = 기본급
       - commission_amount = 세션 수 × 세션 단가 (therapist/nail만)
       - overtime_amount = OT 분 계산
       - holiday_bonus = 공휴일 근무 시 계산
       - meal_allowance = driver 일괄 지급
       - 모든 차감 항목 계산
       - gross_pay = 모든 수입 합
       - total_deductions = 모든 차감 합
       - net_pay = gross_pay - total_deductions (최소 0)
    4. PayrollRecord 생성 (draft 상태)
    """
    pass

def calculate_late_deduction(late_minutes: int) -> float:
    """지각 차감 계산 (10분 초과부터 1분당 10 Peso)"""
    if late_minutes <= 9:
        return 0.0
    return (late_minutes - 9) * 10

def calculate_overtime_amount(overtime_minutes: int) -> float:
    """OT 계산 (40분 이상 시 1시간당 70 Peso, 올림)"""
    if overtime_minutes < 40:
        return 0.0
    hours = (overtime_minutes + 59) // 60  # 올림
    return hours * 70

def calculate_holiday_bonus(
    employee_type: str,
    base_salary: float,
    work_date: date,
    holiday_type: str
) -> float:
    """공휴일 가산 계산 (기본급 × 배수)"""
    if holiday_type == "none":
        return 0.0
    daily_rate = base_salary / 15
    multiplier = 2.0 if holiday_type == "national" else 1.3
    return daily_rate * multiplier
```

---

## 4. API 라우터 구조 (payroll.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

# PayrollPeriod
@router.post("/periods")
async def create_payroll_period(payload: PayrollPeriodCreate, db: Session = Depends(get_db)):
    pass

@router.get("/periods")
async def list_payroll_periods(db: Session = Depends(get_db)):
    pass

@router.post("/periods/{period_id}/calculate")
async def calculate_payroll(period_id: int, db: Session = Depends(get_db)):
    pass

@router.post("/periods/{period_id}/approve")
async def approve_payroll(period_id: int, db: Session = Depends(get_db)):
    pass

# Employee
@router.post("/employees")
@router.get("/employees")
@router.get("/employees/{employee_id}")
@router.put("/employees/{employee_id}")
@router.delete("/employees/{employee_id}")
async def employee_crud(...):
    pass

# CashAdvance
@router.post("/cash-advance")
@router.get("/cash-advance")
@router.put("/cash-advance/{ca_id}")
async def ca_crud(...):
    pass

# AttendanceLog
@router.post("/attendance")
@router.get("/attendance")
@router.put("/attendance/{log_id}")
async def attendance_crud(...):
    pass

# PhilippineHoliday
@router.post("/holidays")
@router.get("/holidays")
@router.delete("/holidays/{holiday_id}")
async def holiday_crud(...):
    pass

# PayrollRecord
@router.get("/records")
@router.get("/records/{record_id}")
@router.get("/records/{record_id}/export")  # PDF 내보내기
async def record_read(...):
    pass
```

---

## 5. 기존 모델과의 연동

| 기존 모델 | 연동 방식 |
|---------|---------|
| `Staff` | Employee FK로 연결 또는 `employee_id` 추가 |
| `Therapist` | Employee로 통합 (중복 제거) |
| `Attendance` | AttendanceLog로 확장 (late_minutes, overtime_minutes 추가) |
| `SssContribution` | PayrollRecord.sss_deduction 참조 |

---

## 6. 데이터베이스 마이그레이션 전략

### 단계 1: 신규 테이블 생성
- Employee (신규)
- CashAdvance (신규)
- AttendanceLog (신규)
- PayrollPeriod (신규)
- PayrollRecord (신규)
- PhilippineHoliday (신규)

### 단계 2: 기존 데이터 마이그레이션
```python
# Staff → Employee 마이그레이션
INSERT INTO employees (name, phone, employee_type, base_salary, hire_date)
SELECT name, phone, 'therapist', 5000, NOW() FROM staffs;
```

### 단계 3: 기존 라우터 업데이트
- `settlements.py` → `/api/payroll/records` 호출로 교체
- Mock 데이터 제거

---

## 7. 성능 최적화

- **DB 인덱스**:
  - Employee: (employee_type, is_active)
  - AttendanceLog: (employee_id, work_date)
  - PayrollRecord: (payroll_period_id, employee_id)
  - PhilippineHoliday: (holiday_date)

- **캐싱**:
  - 공휴일 목록 (한 번 로드 후 메모리 캐시)
  - Employee 기본급 (정산 기간 중 변경 금지)

- **배치 처리**:
  - calculate_payroll은 비동기 작업으로 별도 처리

---

## 8. 보안 & 검증

- **입력 검증**:
  - amount >= 0
  - clock_in < clock_out
  - period_start < period_end

- **접근 제어**:
  - /api/payroll/* 엔드포인트는 admin 권한만 접근

- **감사 로그**:
  - 모든 PayrollRecord 변경사항 기록
  - 사용자, 타임스탬프, 변경 전후 값 저장
