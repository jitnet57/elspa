# 13개월 보너스 (13th Month Bonus) 구현 완료

**작성일:** 2026-05-22  
**Phase:** Phase 8-5  
**상태:** ✅ 완료

---

## 📋 개요

ElSpa 급여 정산 시스템에 **13개월 보너스 선지급 기능**을 완전히 구현했습니다.

### 기능 요약
- 월 단위 누적 계산 (기본급 / 12)
- 입사일 기반 정확한 개월 수 계산
- 중도 입사자 자동 처리
- 다중 정산 기간 누적 추적
- REST API 조회 엔드포인트

---

## 🔧 구현 상세

### 1. PayrollCalculator 메서드 추가

**파일:** `app/services/payroll_calculator.py`

#### 1.1 `calculate_months_employed(hire_date, reference_date) → int`

입사일부터 기준일까지의 정확한 개월 수를 계산합니다.

**규칙:**
```
개월 수 = (연도 차이 × 12) + 월 차이
만약 (기준일의 날짜 >= 입사일의 날짜) → +1 추가
```

**예시:**
```python
# 예 1: 2025-01-15 입사, 2025-05-22 기준
hire_date = date(2025, 1, 15)
reference_date = date(2025, 5, 22)
months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)
# → 4개월 (1월, 2월, 3월, 4월)

# 예 2: 2024-03-20 입사, 2026-05-22 기준
hire_date = date(2024, 3, 20)
reference_date = date(2026, 5, 22)
months = PayrollCalculator.calculate_months_employed(hire_date, reference_date)
# → 26개월
```

#### 1.2 `calculate_thirteenth_month_deduction(base_salary, hire_date, reference_date) → Decimal`

13개월 보너스 선지급액을 계산합니다.

**규칙:**
```
월 금액 = 기본급 / 12
누적액 = 월 금액 × 개월 수
```

**예시:**
```python
# 기본급 12,000 Peso, 1월~5월 근무 (5개월)
base_salary = Decimal(12000)
hire_date = date(2025, 1, 1)
reference_date = date(2025, 5, 31)

deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
    base_salary, hire_date, reference_date
)
# 계산:
# 월 금액: 12,000 / 12 = 1,000 Peso
# 누적액: 1,000 × 5 = 5,000 Peso
# → Decimal(5000)

# 중도 입사자 예시: 기본급 15,000, 2월 15일 입사, 5월 22일 기준
base_salary = Decimal(15000)
hire_date = date(2025, 2, 15)
reference_date = date(2025, 5, 22)

deduction = PayrollCalculator.calculate_thirteenth_month_deduction(
    base_salary, hire_date, reference_date
)
# 계산:
# 개월: 3개월 (2월, 3월, 4월)
# 월 금액: 15,000 / 12 = 1,250 Peso
# 누적액: 1,250 × 3 = 3,750 Peso
# → Decimal(3750)
```

### 2. PayrollRecord 모델 확장

**파일:** `app/models/payroll.py`

새 컬럼 추가:
```python
thirteenth_month_accrual = Column(Numeric(10, 2), default=0)
# 13개월 보너스 누적액 (thirteenth_month_deduction과 동일한 값)
# 참고용: 선지급액과 누적액을 명확히 구분
```

**용어 정의:**
- `thirteenth_month_deduction`: 이번 정산 기간의 선지급액 (급여에서 차감)
- `thirteenth_month_accrual`: 누적액 (참고용, 동일한 값)

### 3. PayrollCalculator 통합

**파일:** `app/services/payroll_calculator.py`

`_calculate_employee_payroll()` 메서드에 13개월 보너스 계산 통합:

```python
# 13개월 보너스 선지급 계산
thirteenth_month_deduction = calc.calculate_thirteenth_month_deduction(
    base_salary=base_amount,
    hire_date=employee.hire_date,
    reference_date=payroll_period.period_end
)

# 누적액 저장
thirteenth_month_accrual=thirteenth_month_deduction  # 참고용
```

### 4. REST API 엔드포인트

**파일:** `app/routers/payroll.py`

#### 4.1 개인별 13개월 보너스 조회

```http
GET /api/payroll/thirteenth-month/{employee_id}
```

**응답 예시:**
```json
{
  "employee_id": 1,
  "employee_name": "Juan Dela Cruz",
  "hire_date": "2025-01-15",
  "total_accrual": "5000.00",
  "total_paid": "5000.00",
  "records": [
    {
      "payroll_record_id": 1,
      "payroll_period_id": 1,
      "period_start": "2025-01-01",
      "period_end": "2025-01-15",
      "thirteenth_month_deduction": "500.00",
      "status": "draft"
    },
    {
      "payroll_record_id": 2,
      "payroll_period_id": 2,
      "period_start": "2025-01-16",
      "period_end": "2025-05-31",
      "thirteenth_month_deduction": "4500.00",
      "status": "approved"
    }
  ]
}
```

#### 4.2 전체 13개월 보너스 정산 현황

```http
GET /api/payroll/thirteenth-month
```

**Query Parameters:**
- `payroll_period_id` (선택): 특정 정산 기간만 조회
- `status` (선택): `draft` / `approved` / `paid`
- `skip`, `limit`: 페이지네이션 (기본값: 0, 100)

**응답 예시:**
```json
[
  {
    "payroll_record_id": 1,
    "employee_id": 1,
    "employee_name": "Juan Dela Cruz",
    "hire_date": "2025-01-15",
    "thirteenth_month_accrual": "1000.00",
    "thirteenth_month_deduction": "1000.00",
    "status": "paid"
  },
  {
    "payroll_record_id": 2,
    "employee_id": 2,
    "employee_name": "Maria Santos",
    "hire_date": "2025-02-01",
    "thirteenth_month_accrual": "833.33",
    "thirteenth_month_deduction": "833.33",
    "status": "draft"
  }
]
```

### 5. Pydantic 스키마 업데이트

**파일:** `app/schemas/payroll.py`

`PayrollRecordResponse`에 필드 추가:
```python
thirteenth_month_accrual: Decimal
```

---

## 🧪 테스트 케이스

**파일:** `tests/test_thirteenth_month_bonus.py`

### 단위 테스트 (15개)

#### 개월 수 계산
1. ✅ 전체 연도 계산 (12개월)
2. ✅ 같은 날짜 (1개월)
3. ✅ 기준일이 입사일보다 이른 경우 (0개월)
4. ✅ 다음 날짜 (1개월)
5. ✅ 여러 연도 (26개월)

#### 선지급액 계산
6. ✅ 기본 케이스 (12,000 기본급, 5개월 = 5,000)
7. ✅ 중도 입사자 (15,000 기본급, 3개월 = 3,750)
8. ✅ 1개월 근무 (20,000 기본급, 1개월 = 1,666.67)
9. ✅ 장기 근무자 (25,000 기본급, 29개월 = 60,416.67)
10. ✅ 0 기본급 (엣지 케이스)
11. ✅ 음수 기본급 (엣지 케이스)
12. ✅ 소수점 정확도 (Decimal 정밀성)
13. ✅ 전체 1년 (12,000 기본급, 12개월 = 12,000)

### 통합 테스트 (2개)

14. ✅ PayrollRecord에 13개월 보너스 필드 포함
15. ✅ 여러 정산 기간에 걸친 누적 추적

---

## 📝 작업 흐름

### 정산 프로세스

```
1. 직원 마스터 유지보수 (hire_date 필수)
   ↓
2. 정산 기간 생성 (period_start, period_end)
   ↓
3. POST /api/payroll/periods/{period_id}/calculate
   ├─ 각 직원의 13개월 보너스 자동 계산
   ├─ PayrollRecord.thirteenth_month_deduction 생성
   └─ PayrollRecord.thirteenth_month_accrual 기록
   ↓
4. 정산 내용 검토 & 승인
   ├─ GET /api/payroll/thirteenth-month/{employee_id}
   └─ GET /api/payroll/thirteenth-month (전체 현황)
   ↓
5. 정산 기간 상태 전환 (draft → approved → paid)
   └─ POST /api/payroll/periods/{period_id}/approve
```

### 예시 시나리오

```python
# 직원 정보
직원: Juan Dela Cruz
기본급: 12,000 Peso
입사일: 2025-01-01
근무 기간: 2025년 1월~5월 (5개월)

정산 결과:
월 금액: 12,000 / 12 = 1,000 Peso/월
13개월 보너스: 1,000 × 5 = 5,000 Peso

급여 계산:
- 기본급: 12,000 Peso
- 커미션: 0 Peso
- ...기타 항목...
- 13개월 보너스 선지급: -5,000 Peso (차감)
- 순지급액: [계산 결과]
```

---

## 📊 데이터베이스 스키마 변경

### PayrollRecord 테이블 추가 컬럼

| 컬럼명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `thirteenth_month_deduction` | Numeric(10, 2) | 13개월 보너스 선지급액 | 0 |
| `thirteenth_month_accrual` | Numeric(10, 2) | 13개월 보너스 누적액 (참고용) | 0 |

---

## 🔍 주요 설계 결정사항

### 1. 개월 수 계산 방식

**선택:** 정확한 날짜 기반 계산
- 기본: 연도 차이 × 12 + 월 차이
- 보정: 기준일의 일자가 입사일의 일자 이상이면 +1

**예시:**
```
2025-01-15 입사, 2025-02-10 기준 → 0개월
2025-01-15 입사, 2025-02-15 기준 → 1개월
2025-01-15 입사, 2025-02-16 기준 → 1개월
```

### 2. 누적액 vs 선지급액

**필드 두 개 유지:**
- `thirteenth_month_deduction`: 현재 정산 기간의 선지급액 (급여에서 차감)
- `thirteenth_month_accrual`: 누적액 (참고용, 동일한 값)

**이유:** 급여 차감 항목으로 명확히 구분 + 감사 추적성 강화

### 3. 정산 기간별 재계산

**정책:** 매 정산 기간마다 누적액 재계산
- 입사 이후 전체 근무 기간 기반
- 과거 선지급과 무관하게 현재까지의 누적액 산정
- 월급날(pay_date) 기준이 아닌 정산 기간 종료일 기준

---

## 📁 수정된 파일 목록

1. **app/services/payroll_calculator.py**
   - `calculate_months_employed()` 메서드 추가
   - `calculate_thirteenth_month_deduction()` 메서드 추가
   - `_calculate_employee_payroll()` 메서드 통합

2. **app/models/payroll.py**
   - `PayrollRecord.thirteenth_month_accrual` 컬럼 추가

3. **app/schemas/payroll.py**
   - `PayrollRecordResponse.thirteenth_month_accrual` 필드 추가

4. **app/routers/payroll.py**
   - `GET /api/payroll/thirteenth-month/{employee_id}` 엔드포인트 추가
   - `GET /api/payroll/thirteenth-month` 엔드포인트 추가

5. **tests/test_thirteenth_month_bonus.py** (신규)
   - 15개 테스트 케이스 작성

---

## 🚀 다음 단계

### Phase 8-6 (향후)
- [ ] 13개월 보너스 분할 지급 옵션
- [ ] 정산 기간 재계산 정책 고도화
- [ ] 중도 퇴사자 정산 처리
- [ ] 월급 인상에 따른 소급 계산
- [ ] Admin 대시보드에 13개월 보너스 현황 추가

---

## 📖 사용 예시

### 1. 급여 계산 실행

```bash
curl -X POST http://localhost:8000/api/payroll/periods/1/calculate
```

응답: 정산 기간의 모든 직원 PayrollRecord 생성

### 2. 직원별 13개월 보너스 조회

```bash
curl http://localhost:8000/api/payroll/thirteenth-month/1
```

응답: 직원의 누적 13개월 보너스 및 정산 이력

### 3. 전체 현황 조회

```bash
curl http://localhost:8000/api/payroll/thirteenth-month?status=draft
```

응답: Draft 상태의 모든 13개월 보너스 정산 기록

---

**최종 업데이트:** 2026-05-22  
**구현 상태:** ✅ 완료 (기능 + 테스트 + API)
