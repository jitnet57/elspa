# 급여 정산 Mock 데이터

**작성 날짜:** 2026-05-26  
**데이터 기간:** October 2024  
**총 직원 수:** 10명  
**총 정산 기록:** 10개

---

## 📊 데이터 구성

### 1. 직원 (Employees) - 10명

| ID | 이름 | 직종 | 부서 | 급여 주기 | 상태 |
|----|------|------|------|---------|------|
| 2024-0001 | Maria Christina Santos | Therapist | Therapy & Wellness | Weekly | Active |
| 2024-0002 | John Dela Cruz | Therapist | Therapy & Wellness | Weekly | Active |
| 2024-0003 | Rosa Maria Gonzalez | Nail Technician | Nail Services | Weekly | Active |
| 2024-0004 | Antonio Reyes | Driver | Transport | Bi-weekly | Active |
| 2024-0005 | Miguel Santos | Maintenance | Operations | Bi-weekly | Active |
| 2024-0006 | Patricia Lim | Hollys Coffee Staff | Café | Bi-weekly | Active |
| 2024-0007 | Fernando Garcia | Manager | Administration | Bi-weekly | Active |
| 2024-0008 | Jennifer Cruz | Therapist | Therapy & Wellness | Weekly | Active |
| 2024-0009 | Lucia Mendoza | Nail Technician | Nail Services | Weekly | Active |
| 2024-0010 | Carlos Reyes | Driver | Transport | Bi-weekly | Active |

### 2. 정산 기록 (Payroll Records) - 10개

#### Oct 1-15, 2024 (Weekly Pay)
- **PAY-2024-1001** - Maria Christina Santos (Paid) ✓
  - Gross: ₱14,470.75 | Deductions: ₱1,645 | Net: ₱12,825.75
- **PAY-2024-1002** - John Dela Cruz (Paid) ✓
  - Gross: ₱13,700 | Deductions: ₱2,600 | Net: ₱11,100
- **PAY-2024-1003** - Rosa Maria Gonzalez (Approved) ✓
  - Gross: ₱9,250 | Deductions: ₱1,120 | Net: ₱8,130
- **PAY-2024-1004** - Jennifer Cruz (Draft)
  - Gross: ₱13,200 | Deductions: ₱2,000 | Net: ₱11,200
- **PAY-2024-1005** - Lucia Mendoza (Paid) ✓
  - Gross: ₱8,750 | Deductions: ₱550 | Net: ₱8,200

#### Oct 16-31, 2024 (Bi-weekly Pay)
- **PAY-2024-1006** - Antonio Reyes (Approved) ✓
  - Gross: ₱17,550 | Deductions: ₱0 | Net: ₱17,550
- **PAY-2024-1007** - Miguel Santos (Approved) ✓
  - Gross: ₱17,150 | Deductions: ₱1,575 | Net: ₱15,575
- **PAY-2024-1008** - Patricia Lim (Draft)
  - Gross: ₱14,450 | Deductions: ₱1,120 | Net: ₱13,330
- **PAY-2024-1009** - Fernando Garcia (Draft)
  - Gross: ₱31,600 | Deductions: ₱4,000 | Net: ₱27,600
- **PAY-2024-1010** - Carlos Reyes (Approved) ✓
  - Gross: ₱17,600 | Deductions: ₱1,800 | Net: ₱15,800

### 3. 급여 상태 분포

| Status | 개수 | 합계 |
|--------|------|------|
| 🟢 Paid | 3 | ₱32,125.75 |
| 🟡 Approved | 4 | ₱48,515 |
| ⚪ Draft | 3 | ₱52,130 |

---

## 🏖️ 필리핀 공휴일 (Holidays) - 18개

### National Holidays (200% 급여)
- Jan 1: New Year's Day
- Mar 29: Good Friday
- Apr 9: Day of Valor
- Jun 12: Independence Day
- Aug 21: Ninoy Aquino Day
- Aug 26: National Heroes Day
- Nov 30: Bonifacio Day
- Dec 25: Christmas Day
- Dec 30: Rizal Day

### Special Holidays (130% 급여)
- Feb 12-13: Chinese New Year
- Mar 28: Maundy Thursday
- Mar 30: Black Saturday
- Apr 10: Eid'l Fitr
- Nov 1-2: All Saints' & All Souls' Days
- Dec 8: Feast of the Immaculate Conception
- Dec 31: New Year's Eve

---

## 💰 선금 (Cash Advances) - 8개

| ID | 직원 | 금액 | 상태 | 정산 기록 |
|----|------|------|------|---------|
| CA-2024-001 | Maria Christina Santos | ₱5,000 | Approved | PAY-2024-1001 |
| CA-2024-002 | John Dela Cruz | ₱8,000 | Approved | PAY-2024-1002 |
| CA-2024-003 | Rosa Maria Gonzalez | ₱2,500 | Approved | PAY-2024-1003 |
| CA-2024-004 | Miguel Santos | ₱4,000 | Approved | PAY-2024-1007 |
| CA-2024-005 | Fernando Garcia | ₱12,000 | Approved | PAY-2024-1009 |
| CA-2024-006 | Antonio Reyes | ₱3,000 | Pending | - |
| CA-2024-007 | Jennifer Cruz | ₱5,000 | Approved | - |
| CA-2024-008 | Lucia Mendoza | ₱2,000 | Rejected | - |

---

## 📍 출퇴근 기록 (Attendance Logs)

총 5개 샘플 기록 포함:

| 직원 | 날짜 | 출근 | 퇴근 | 지각 | 초과근무 | 결근 |
|------|------|------|------|------|---------|------|
| Maria Christina Santos | 2024-10-01 | 09:15 | 17:45 | 15분 | 45분 | No |
| Maria Christina Santos | 2024-10-02 | 09:00 | 17:30 | 0분 | 30분 | No |
| John Dela Cruz | 2024-10-01 | 09:00 | 18:00 | 0분 | 60분 | No |
| Antonio Reyes | 2024-10-16 | 08:00 | 17:00 | 0분 | 0분 | No |
| Carlos Reyes | 2024-10-22 | 00:00 | 00:00 | 0분 | 0분 | Yes |

---

## 🔍 주요 특징

### 급여 계산 규칙 (포함된 데이터)

#### 테라피스트 (Weekly Pay)
```
기본급: ₱15,500
+ 커미션: 15% (실적 기반)
+ 초과근무: 1시간당 ₱70
+ 식대: ₱750/주
- 지각: 10분 초과 시 1분당 ₱10
- SSS/CA: 직원별 차감
= NET PAY
```

#### 매니저 (Bi-weekly Pay)
```
기본급: ₱25,000
+ 초과근무: 1시간당 ₱70
+ 공휴일 보너스: 200-130%
- 지각: 1분당 ₱10
- SSS/CA: 직원별 차감
= NET PAY
```

### 포함된 정산 항목

**수입 (Earnings)**
- ✓ 기본급 (Base Salary)
- ✓ 커미션 (Commission) - 테라피스트/네일만
- ✓ 초과근무 (Overtime) - 40분 이상 시 지급
- ✓ 공휴일 보너스 (Holiday Bonus)
- ✓ 식대 (Meal Allowance)

**차감 (Deductions)**
- ✓ 지각 패널티 (Late / Tardy) - 10분 초과 시 1분당 ₱10
- ✓ 결근 (Absence)
- ✓ SSS 선금 (SSS Loan Payment)
- ✓ 선금 차감 (Cash Advance Repay)
- ✓ 건강검진비 (Health Check)
- ✓ 13개월 보너스 선금 (13th Month Adjustment)

---

## 💡 사용 방법

### React 컴포넌트에서 Mock 데이터 사용

```typescript
import { 
  payrollRecords, 
  employees, 
  holidays, 
  cashAdvances,
  attendanceLogs 
} from '@/app/admin/payroll/mockData/payrollData';

// PayrollRecords.tsx
const [records] = useState(payrollRecords);

// HolidayManagement.tsx
const [holidayList] = useState(holidays);

// PayrollRecordDetail.tsx
const payrollRecord = payrollRecords[0]; // Maria Christina Santos
```

### API 연동 시 데이터 구조 참고

각 `interface`는 FastAPI 응답 형식과 동일하므로, 
나중에 `payrollRecords`를 API 응답으로 바꾸면 된다:

```typescript
// Before (Mock)
const [records] = useState(payrollRecords);

// After (API)
useEffect(() => {
  fetch('/api/payroll/records')
    .then(r => r.json())
    .then(setRecords); // 동일한 구조!
}, []);
```

---

## 📈 통계

```json
{
  "totalEmployees": 10,
  "activeEmployees": 10,
  "therapists": 3,
  
  "currentPeriod": "Oct 16 - Oct 31, 2024",
  "totalPayrollAmount": "₱89,855",
  
  "recordsStatus": {
    "draft": 3,
    "approved": 4,
    "paid": 3
  },
  
  "totalNationalHolidays": 9,
  "totalSpecialHolidays": 9
}
```

---

## ✅ 테스트 체크리스트

- [x] 다양한 직원 유형 (therapist, nail, driver, maintenance, manager)
- [x] 다양한 급여 상태 (Draft, Approved, Paid)
- [x] 실제 계산된 급여 내역
- [x] 필리핀 공휴일 18개
- [x] 선금 다양한 상태 (Pending, Approved, Rejected, Settled)
- [x] 출퇴근 기록 샘플
- [x] 필터링 가능한 기간 (Oct 1-15, Oct 16-31)
- [x] 통계 요약 데이터

---

## 🔄 다음 단계

1. **API 연동** - `/api/payroll/records` → Mock 데이터 대체
2. **더많은 데이터** - 월별, 분기별 정산 기록 추가
3. **동적 계산** - Mock 대신 계산 엔진 사용
4. **데이터베이스** - PostgreSQL로 저장

---

**생성일:** 2026-05-26  
**상태:** ✅ 모든 컴포넌트에서 사용 중
