# CompanySettlement 논리 설계서

**작성일:** 2026-06-02  
**목적:** ElSpa 플랫폼의 업체(회사) 정산 시스템 설계  
**버전:** 1.0

---

## 📋 목차

1. [개요](#개요)
2. [정산 규칙 (Settlement Rules)](#정산-규칙-settlement-rules)
3. [데이터 모델 (Data Models)](#데이터-모델-data-models)
4. [정산 워크플로우](#정산-워크플로우)
5. [계산 공식 (Formulas)](#계산-공식-formulas)
6. [ER 다이어그램](#er-다이어그램)
7. [정산 시나리오](#정산-시나리오)
8. [구현 로드맵](#구현-로드맵)

---

## 개요

ElSpa 플랫폼에서 업체(Company/Location)의 월정산을 자동화하기 위한 시스템입니다.

### 핵심 원칙

| 고객 유형 | 정산 상태 | 설명 |
|----------|---------|------|
| **Guest (비회원)** | SETTLE | 즉시 정산 - 현금 결제로 간주 |
| **Company (업체)** | WAIVE | 정산 유보 - 회사 내부 회계로 처리 |
| **Credit (외상)** | PENDING | 정산 대기 - 추후 결제 필요 |

---

## 정산 규칙 (Settlement Rules)

### Rule 1: Guest Payment (비회원 결제)
```
조건: booking.customer_id = NULL 또는 customer.type = "guest"
작동:
  ✅ 즉시 정산 상태 (SETTLED)
  ✅ 예약 완료 시 자동 반영
  ✅ 회수율: 100%
예시: 드롭인 고객 (현장 결제)
```

### Rule 2: Company Credit (업체 외상)
```
조건: booking.payment_method = "company_credit" 또는 customer.company_id IS NOT NULL
작동:
  ⏳ 정산 대기 상태 (PENDING)
  ⏳ 월말 일괄 정산
  ⏳ 회수율: 시간에 따라 변동 (수기 갱신)
예시: 업체 고객의 크레딧/회원권 사용
```

### Rule 3: Waived Company Transaction (정산 제외)
```
조건: transaction.settlement_type = "waived"
작동:
  ✘ 정산에서 제외
  ✘ 내부 회계에서만 기록
  ✘ 회수율: 0% (정산 불가)
예시: 프로모션, 인센티브, 직원 이용권
```

---

## 데이터 모델 (Data Models)

### 1. company_settlements 테이블 (신규 생성)

```sql
CREATE TABLE company_settlements (
  -- 기본 정보
  id SERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL UNIQUE,
  settlement_period_year INTEGER NOT NULL,
  settlement_period_month INTEGER NOT NULL,
  
  -- 정산 금액 (단위: PHP, Decimal)
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,       -- 총 수입
  guest_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,       -- 비회원 수입 (100% 회수)
  credit_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,      -- 외상 수입 (회수율 적용)
  waived_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,      -- 제외 수입 (0% 회수)
  
  recovery_rate NUMERIC(5, 2) NOT NULL DEFAULT 100,      -- 외상 회수율 (%) - 관리자 수기 갱신
  recovered_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- 실제 회수액 = credit_revenue * recovery_rate / 100
  
  platform_fee_rate NUMERIC(5, 2) NOT NULL DEFAULT 25,   -- 플랫폼 수수료율 (%)
  platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,        -- 플랫폼 수수료 = (total_revenue - waived_revenue) * rate / 100
  
  -- 차감 항목
  refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,       -- 환불액
  dispute_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 분쟁으로 인한 차감
  other_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,     -- 기타 차감
  total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- 총 차감액
  
  -- 최종 정산액
  net_settlement NUMERIC(12, 2) NOT NULL DEFAULT 0,      -- 순정산액
  
  -- 상태
  status VARCHAR(50) NOT NULL DEFAULT 'draft',           -- draft, approved, settled, rejected
  settlement_date DATE,                                   -- 정산 완료일
  payment_method VARCHAR(50),                             -- bank_transfer, check, cash, gcash
  payment_date DATE,                                      -- 실제 지급일
  
  -- 메모
  notes TEXT,
  dispute_notes TEXT,
  
  -- 추적 정보
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  paid_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 제약 조건
  UNIQUE (company_id, settlement_period_year, settlement_period_month),
  CONSTRAINT ck_recovery_rate CHECK (recovery_rate >= 0 AND recovery_rate <= 100),
  CONSTRAINT ck_platform_fee_rate CHECK (platform_fee_rate >= 0 AND platform_fee_rate <= 100),
  CONSTRAINT ck_total_revenue_positive CHECK (total_revenue >= 0),
  CONSTRAINT ck_net_settlement_calc CHECK (net_settlement >= 0),
  
  -- 인덱스
  INDEX idx_company_period (company_id, settlement_period_year, settlement_period_month),
  INDEX idx_status (status),
  INDEX idx_payment_date (payment_date),
  INDEX idx_created_at (created_at)
);
```

### 2. settlement_transactions 테이블 (거래 추적)

```sql
CREATE TABLE settlement_transactions (
  -- 기본 정보
  id BIGSERIAL PRIMARY KEY,
  company_settlement_id INTEGER NOT NULL,
  booking_id BIGINT,
  customer_id BIGINT,
  
  -- 거래 정보
  transaction_type VARCHAR(50) NOT NULL,                 -- booking, refund, dispute, adjustment
  settlement_category VARCHAR(50) NOT NULL,              -- guest, credit, waived
  
  amount NUMERIC(12, 2) NOT NULL,
  recovery_rate NUMERIC(5, 2) DEFAULT 100,              -- 회수율 (%)
  recovered_amount NUMERIC(12, 2) NOT NULL,             -- 실제 회수액
  
  transaction_date DATE NOT NULL,
  
  -- 추적
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 외래키
  CONSTRAINT fk_company_settlement FOREIGN KEY (company_settlement_id)
    REFERENCES company_settlements(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking FOREIGN KEY (booking_id)
    REFERENCES bookings(id) ON DELETE SET NULL,
  CONSTRAINT fk_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE SET NULL,
  
  -- 인덱스
  INDEX idx_company_settlement (company_settlement_id),
  INDEX idx_booking (booking_id),
  INDEX idx_transaction_type (transaction_type)
);
```

### 3. settlement_rules 테이블 (규칙 관리)

```sql
CREATE TABLE settlement_rules (
  -- 기본 정보
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- 규칙 조건
  customer_type VARCHAR(50),                            -- guest, company, credit
  payment_method VARCHAR(50),
  
  -- 규칙 설정
  settlement_status VARCHAR(50) NOT NULL,               -- settled, pending, waived
  recovery_rate NUMERIC(5, 2) DEFAULT 100,
  platform_fee_rate NUMERIC(5, 2) DEFAULT 25,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 인덱스
  INDEX idx_customer_type_payment (customer_type, payment_method)
);
```

### 4. 기존 테이블 수정 (bookings)

```sql
-- bookings 테이블에 추가 컬럼
ALTER TABLE bookings ADD COLUMN settlement_type VARCHAR(50) DEFAULT 'settled'
  COMMENT '정산 유형: settled (즉시), pending (대기), waived (제외)';
ALTER TABLE bookings ADD COLUMN settlement_id INTEGER
  COMMENT '해당 정산 기록 ID (FK to company_settlements)';
ALTER TABLE bookings ADD COLUMN recovery_rate NUMERIC(5, 2) DEFAULT 100
  COMMENT '회수율 (%)';
ALTER TABLE bookings ADD INDEX idx_settlement_type (settlement_type);
```

---

## 정산 워크플로우

### Phase 1: 데이터 수집 (Collection)
```
[월초] → 지난달 예약 데이터 수집
         ↓
         booking + customer + transaction 통합
         ↓
         settlement_type별 분류
         ├─ guest (비회원 → SETTLED)
         ├─ credit (외상 → PENDING)
         └─ waived (제외 → EXCLUDED)
```

### Phase 2: 정산 계산 (Calculation)
```
[월중] → 자동 계산
         ↓
         [For Each Company]
         ├─ total_revenue = 모든 예약 금액 합계
         ├─ guest_revenue = settlement_type='settled' 합계
         ├─ credit_revenue = settlement_type='pending' 합계
         ├─ waived_revenue = settlement_type='waived' 합계
         ├─ recovered_amount = credit_revenue * recovery_rate / 100
         ├─ platform_fee = (total_revenue - waived_revenue) * rate / 100
         └─ net_settlement = (guest_revenue + recovered_amount) - platform_fee - deductions
         
         상태: DRAFT
```

### Phase 3: 검증 및 승인 (Approval)
```
[월중/월말] → 관리자 검토
             ↓
             ☐ 외상 회수율 수기 갱신 (recovery_rate)
             ☐ 분쟁/환불 항목 확인
             ☐ 수수료율 재확인
             ↓
             상태: APPROVED
```

### Phase 4: 지급 (Payment)
```
[월말/익월초] → 자동/수동 지급
               ↓
               payment_method별 처리
               ├─ Bank Transfer: 은행 API 호출
               ├─ GCash: GCash API 호출
               └─ Manual: 수기 기록
               ↓
               상태: SETTLED
```

### Phase 5: 확인 (Reconciliation)
```
[익월초] → 은행 거래내역 확인
          ↓
          settlement_date 기록
          ↓
          상태: CONFIRMED
```

---

## 계산 공식 (Formulas)

### Formula 1: 매출 분류
```
total_revenue = Σ booking.total_price (기간 내 완료)

guest_revenue = Σ(booking.total_price) WHERE settlement_type = 'settled'
                (회수율: 100%)

credit_revenue = Σ(booking.total_price) WHERE settlement_type = 'pending'
                 (회수율: variable, 관리자 갱신)

waived_revenue = Σ(booking.total_price) WHERE settlement_type = 'waived'
                 (회수율: 0%)

검증: total_revenue = guest_revenue + credit_revenue + waived_revenue
```

### Formula 2: 외상 회수액
```
recovered_amount = credit_revenue × (recovery_rate / 100)

예시:
  - credit_revenue = 50,000 PHP
  - recovery_rate = 80% (수기 입력)
  - recovered_amount = 50,000 × 0.80 = 40,000 PHP
```

### Formula 3: 플랫폼 수수료
```
base_amount = total_revenue - waived_revenue
            = guest_revenue + credit_revenue
  (제외된 매출은 수수료 대상 제외)

platform_fee = base_amount × (platform_fee_rate / 100)

예시:
  - total_revenue = 150,000 PHP
  - waived_revenue = 10,000 PHP
  - base_amount = 140,000 PHP
  - platform_fee_rate = 25%
  - platform_fee = 140,000 × 0.25 = 35,000 PHP
```

### Formula 4: 차감액 합계
```
total_deductions = refund_amount 
                 + dispute_deduction
                 + other_deduction
```

### Formula 5: 순정산액 (최종)
```
net_settlement = (guest_revenue + recovered_amount) 
               - platform_fee
               - total_deductions

부호화:
  - Positive: 업체가 받을 금액
  - Negative: 업체가 납부할 금액

예시:
  - guest_revenue = 90,000 PHP
  - recovered_amount = 40,000 PHP
  - platform_fee = 35,000 PHP
  - total_deductions = 2,000 PHP
  
  net_settlement = (90,000 + 40,000) - 35,000 - 2,000
                 = 130,000 - 37,000
                 = 93,000 PHP ✓
```

---

## ER 다이어그램

```
┌─────────────────────────────────┐
│         bookings                │
├─────────────────────────────────┤
│ id (PK)                         │
│ customer_id (FK)                │
│ therapist_id (FK)               │
│ service_id (FK)                 │
│ total_price                     │
│ status                          │
│ booking_date                    │
│ settlement_type (NEW)           │ ──────┐
│ settlement_id (NEW)             │       │
│ recovery_rate (NEW)             │       │
│ payment_method                  │       │
│ created_at                      │       │
└─────────────────────────────────┘       │
                                          │
                                          │
                                    ┌─────▼──────────────────────────┐
                                    │  company_settlements (NEW)      │
                                    ├─────────────────────────────────┤
                                    │ id (PK)                         │
                                    │ company_id (FK)                 │
                                    │ settlement_period_year          │
                                    │ settlement_period_month         │
                                    │ total_revenue                   │
                                    │ guest_revenue                   │
                                    │ credit_revenue                  │
                                    │ waived_revenue                  │
                                    │ recovery_rate                   │
                                    │ recovered_amount                │
                                    │ platform_fee_rate               │
                                    │ platform_fee                    │
                                    │ refund_amount                   │
                                    │ dispute_deduction               │
                                    │ other_deduction                 │
                                    │ total_deductions                │
                                    │ net_settlement                  │
                                    │ status (draft→approved→settled) │
                                    │ settlement_date                 │
                                    │ payment_method                  │
                                    │ payment_date                    │
                                    │ notes, dispute_notes            │
                                    │ created_by, approved_by, paid_by│
                                    │ created_at, updated_at          │
                                    └──────────┬──────────────────────┘
                                               │
                                               │ 1:N
                                               │
                                    ┌──────────▼──────────────────┐
                                    │ settlement_transactions     │
                                    ├─────────────────────────────┤
                                    │ id (PK)                     │
                                    │ company_settlement_id (FK)  │
                                    │ booking_id (FK)             │
                                    │ customer_id (FK)            │
                                    │ transaction_type            │
                                    │ settlement_category         │
                                    │ amount                      │
                                    │ recovery_rate               │
                                    │ recovered_amount            │
                                    │ transaction_date            │
                                    │ notes                       │
                                    │ created_at                  │
                                    └─────────────────────────────┘

┌─────────────────────────────────┐
│      settlement_rules (NEW)     │
├─────────────────────────────────┤
│ id (PK)                         │
│ rule_name                       │
│ description                     │
│ customer_type                   │
│ payment_method                  │
│ settlement_status               │
│ recovery_rate                   │
│ platform_fee_rate               │
│ is_active                       │
│ created_at, updated_at          │
└─────────────────────────────────┘
```

---

## 정산 시나리오

### Scenario 1: 비회원 고객 (Guest) - 즉시 정산
```
상황:
  - 드롭인 고객 (비회원)
  - 마사지 1시간 = 2,000 PHP
  - 현장 현금 결제

워크플로우:
  booking.customer_id = NULL
  ↓
  booking.settlement_type = 'settled'
  ↓
  company_settlement.guest_revenue += 2,000
  ↓
  recovery_rate = 100%
  ↓
  recovered_amount = 2,000

결과:
  ✅ 즉시 정산액에 반영
  ✅ 다음달 지급액에 포함
```

### Scenario 2: 업체 크레딧 (Company Credit) - 외상 대기
```
상황:
  - 코퍼레이트 클라이언트 (ABC Corp)
  - 직원 웰니스 이용권 (월간)
  - 예약: 5건 × 2,000 PHP = 10,000 PHP
  - 월말 청구서로 결제 예정

워크플로우:
  booking.customer_id = <ABC Corp ID>
  ↓
  booking.settlement_type = 'pending'
  ↓
  company_settlement.credit_revenue += 10,000
  ↓
  관리자 검토 (월말): 80% 회수 예상
  ↓
  recovery_rate = 80% (수기 입력)
  ↓
  recovered_amount = 10,000 × 0.80 = 8,000

결과:
  ⏳ 외상액: 10,000 PHP
  ⏳ 예상 회수: 8,000 PHP
  ⏳ 실제 지급액에 8,000만 반영
  
모니터링:
  - 추후 실제 회수 시 recovery_rate 갱신
  - 예: 9,000 회수 → recovery_rate = 90% 변경
```

### Scenario 3: 제외 정산 (Waived) - 프로모션
```
상황:
  - 신규 고객 이벤트: 무료 마사지 제공
  - 예약: 1,500 PHP (프로모션)
  - 내부 마케팅 비용으로 기록

워크플로우:
  booking.settlement_type = 'waived'
  ↓
  booking.payment_method = 'promotion'
  ↓
  company_settlement.waived_revenue += 1,500
  ↓
  recovery_rate = 0%
  ↓
  recovered_amount = 0

결과:
  ✘ 정산액에서 제외
  ✘ 플랫폼 수수료도 부과하지 않음
  ✘ 내부 회계에만 기록

계산 예시:
  total_revenue = 10,000 (guest 8,000 + waived 2,000)
  platform_fee = (10,000 - 2,000) × 25% = 2,000
  net_settlement에는 2,000만 차감
```

### Scenario 4: 분쟁 및 환불
```
상황:
  - 고객 불만으로 인한 환불: 500 PHP
  - 서비스 분쟁 적립금: 200 PHP

워크플로우:
  settlement.refund_amount += 500
  ↓
  settlement.dispute_deduction += 200
  ↓
  total_deductions = 700

최종 계산:
  (guest_revenue + recovered_amount) - platform_fee - 700
  = net_settlement
```

### Scenario 5: 월간 종합 정산 사례

```
Company: "Makati Spa Center"
Period: 2026-05-01 ~ 2026-05-31

데이터 수집:
┌─────────────────────────────────────────┐
│ 예약 정리                                 │
├─────────────────────────────────────────┤
│ 총 예약: 150건                            │
│ 총 매출: 300,000 PHP                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 매출 분류                                 │
├─────────────────────────────────────────┤
│ Guest (비회원): 100건 × 1,500 = 150,000  │
│ Credit (외상): 40건 × 2,500 = 100,000    │
│ Waived (제외): 10건 × 1,500 = 15,000     │
│ ─────────────────────────────────────   │
│ Total: 265,000 PHP ✓                    │
│ (차이: 35,000 = 시스템 오류 또는 재계산) │
└─────────────────────────────────────────┘

[실제로 total_revenue = 300,000 기준]

매출 분류 (재조정):
  - guest_revenue = 150,000 PHP (recovery = 100%)
  - credit_revenue = 100,000 PHP (recovery = 70%)
  - waived_revenue = 50,000 PHP (recovery = 0%)

외상 회수액:
  recovered_amount = 100,000 × 0.70 = 70,000 PHP

플랫폼 수수료:
  base_amount = 300,000 - 50,000 = 250,000 PHP
  platform_fee = 250,000 × 25% = 62,500 PHP

차감액:
  refund_amount = 5,000 PHP
  dispute_deduction = 2,000 PHP
  other_deduction = 1,000 PHP
  ─────────────────────────
  total_deductions = 8,000 PHP

순정산액:
  net_settlement = (150,000 + 70,000) - 62,500 - 8,000
                 = 220,000 - 70,500
                 = 149,500 PHP

지급 정보:
  status: approved (관리자 확인)
  payment_method: bank_transfer
  settlement_date: 2026-06-05
  payment_date: 2026-06-05

결과:
  ✅ Makati Spa Center가 받을 금액: 149,500 PHP
  ✅ 우발채무 (미회수 외상): 30,000 PHP
```

---

## 구현 로드맵

### Phase 1: 데이터베이스 구조 (1주)
- [ ] `company_settlements` 테이블 생성
- [ ] `settlement_transactions` 테이블 생성
- [ ] `settlement_rules` 테이블 생성
- [ ] `bookings` 테이블 마이그레이션 (settlement_type, recovery_rate)
- [ ] 인덱스 및 제약 조건 추가

### Phase 2: 백엔드 로직 (2주)
- [ ] FastAPI 엔드포인트 개발
  - [ ] `POST /api/settlements/calculate` (정산 계산)
  - [ ] `GET /api/settlements/company/{company_id}` (정산 조회)
  - [ ] `PATCH /api/settlements/{id}/approve` (승인)
  - [ ] `PATCH /api/settlements/{id}/settle` (지급)
- [ ] 정산 계산 엔진 (Python)
- [ ] 규칙 엔진 (settlement_type 판정)
- [ ] 외상 회수율 관리 API

### Phase 3: 프론트엔드 UI (2주)
- [ ] 관리자 정산 대시보드
- [ ] 정산 승인 화면
- [ ] 정산 상세 조회
- [ ] 지급 관리 (은행 이체, GCash)
- [ ] 분쟁/환불 관리

### Phase 4: 자동화 & 통합 (1주)
- [ ] 월초 자동 정산 계산 (Cron Job)
- [ ] 월말 자동 승인 알림
- [ ] 은행/GCash API 연동
- [ ] 메시지 알림 (WhatsApp, 카카오톡)

### Phase 5: 테스트 & QA (1주)
- [ ] 단위 테스트 (계산 공식)
- [ ] 통합 테스트 (워크플로우)
- [ ] 데이터 마이그레이션 테스트
- [ ] 성능 테스트

---

## 주요 고려사항

### 1. 거래 추적성
```
✅ settlement_transactions 테이블로 모든 거래 기록
✅ 감사(Audit) 목적으로 과거 데이터 유지
✅ 분쟁 해결 시 근거 자료 제공
```

### 2. 유연성
```
✅ settlement_rules로 정산 규칙 관리
✅ recovery_rate 수기 갱신 가능
✅ 차감액(deduction) 항목별 추적
```

### 3. 정확성
```
✅ Numeric(12, 2) 사용으로 금융 정밀도 보장
✅ CHECK 제약 조건으로 음수 방지
✅ 자동 계산 + 수기 검증 병행
```

### 4. 확장성
```
✅ settlement_type 확장 가능 (pending, settled, waived, ...)
✅ payment_method 추가 용이 (새로운 결제 수단)
✅ platform_fee_rate 동적 조정 가능
```

### 5. 보안
```
✅ created_by, approved_by, paid_by로 책임 추적
✅ status 상태 전이만 허용 (draft → approved → settled)
✅ 과거 정산 데이터는 읽기 전용
```

---

## SQL 쿼리 예시

### 쿼리 1: 월간 정산액 조회
```sql
SELECT 
  id,
  company_id,
  settlement_period_month,
  total_revenue,
  guest_revenue,
  credit_revenue,
  waived_revenue,
  recovered_amount,
  platform_fee,
  net_settlement,
  status,
  payment_date
FROM company_settlements
WHERE settlement_period_year = 2026
  AND settlement_period_month = 5
  AND status IN ('approved', 'settled')
ORDER BY net_settlement DESC;
```

### 쿼리 2: 외상 미회수액 조회
```sql
SELECT 
  company_id,
  SUM(credit_revenue) as total_credit,
  SUM(recovered_amount) as recovered,
  SUM(credit_revenue) - SUM(recovered_amount) as unreovered_amount,
  AVG(recovery_rate) as avg_recovery_rate
FROM company_settlements
WHERE status = 'settled'
GROUP BY company_id
ORDER BY unreovered_amount DESC;
```

### 쿼리 3: 정산 거래 내역 조회
```sql
SELECT 
  st.transaction_type,
  st.settlement_category,
  COUNT(*) as count,
  SUM(st.amount) as total_amount,
  SUM(st.recovered_amount) as total_recovered
FROM settlement_transactions st
WHERE st.company_settlement_id = ?
GROUP BY st.transaction_type, st.settlement_category;
```

---

## 문서 버전

| 버전 | 작성자 | 작성일 | 변경 사항 |
|------|--------|--------|----------|
| 1.0 | jitnet-gif | 2026-06-02 | 초안 작성 |

---

**최종 검수:** 대기 중  
**배포 예정:** 2026-06-30

