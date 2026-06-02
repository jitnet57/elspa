# 결제 시스템 마이그레이션 (Payment System Migration)

**작성일:** 2026-06-02  
**버전:** 1.0  
**담당자:** jitnet57 (kang jichul)

---

## 📋 개요

ElSpa 결제 시스템 구현을 위한 데이터베이스 마이그레이션입니다.

### 🎯 목표
1. **bookings 테이블 확장** — 결제 정보 및 정산 상태 추적
2. **company_settlements 테이블 생성** — 업체별 월간 정산 관리
3. **settlement_transactions 테이블 생성** — 거래별 상세 기록
4. **성능 최적화** — 정산 추적용 인덱스 생성

---

## 📂 마이그레이션 파일

### 1. Python 마이그레이션 (추천)
```
파일명: /app/migrations/20260602_payment_system_migration.py
특징:
  - SQLAlchemy를 사용한 프로그래밍 방식
  - 단계별 실행 (ENUM → ALTER → INDEX → FK)
  - 검증 및 로깅 포함
  - 기존 컬럼 자동 감지 (중복 생성 방지)

실행:
  python app/migrations/20260602_payment_system_migration.py
```

### 2. SQL 마이그레이션 (대체)
```
파일명: /app/migrations/20260602_payment_system_migration.sql
특징:
  - 순수 SQL 스크립트
  - PostgreSQL 기본 문법
  - DBeaver, psql, Supabase SQL 에디터 사용 가능

실행:
  # DBeaver: 파일 열기 → 실행
  # psql: psql -U postgres < 20260602_payment_system_migration.sql
  # Supabase: SQL 에디터에 붙여넣기 → 실행
```

---

## 🗂️ 마이그레이션 단계

### [1️⃣] ENUM 타입 생성

```sql
CREATE TYPE sss_status_enum AS ENUM (
    'pending',      -- 대기 중
    'approved',     -- 승인됨
    'confirmed',    -- 확정됨
    'cancelled'     -- 취소됨
);

CREATE TYPE payment_from_enum AS ENUM (
    'customer',         -- 고객 결제
    'company_credit',   -- 업체 외상
    'referral'          -- 추천 수수료
);

CREATE TYPE settlement_status_enum AS ENUM (
    'pending',      -- 정산 대기
    'approved',     -- 정산 승인
    'settled',      -- 정산 완료
    'rejected',     -- 정산 거부
    'confirmed'     -- 정산 확정
);
```

**용도:**
- ENUM으로 데이터 무결성 보장
- 타입 안정성 (문자열 대신 열거형 사용)
- 쿼리 성능 최적화 (인덱싱 용이)

---

### [2️⃣] bookings 테이블 ALTER

#### 추가되는 컬럼

| 컬럼명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `payment_methods` | JSON | `[]` | 결제수단 배열 |
| `sss_status` | ENUM | `pending` | SSS 상태 |
| `payment_from` | ENUM | `customer` | 결제 주체 |
| `settlement_status` | ENUM | `pending` | 정산 상태 |

#### payment_methods JSON 구조

```json
[
  {
    "type": "card",                    // card, cash, kakaopay
    "amount": 3000.00,
    "payment_method": "credit_card",   // 선택사항
    "gateway": "stripe",               // 선택사항
    "transaction_id": "ch_123456",     // 선택사항
    "status": "completed",             // pending, completed, failed, refunded
    "paid_at": "2026-06-02T10:30:00Z"  // ISO 8601
  }
]
```

#### 상태 전이 (State Transitions)

```
sss_status 상태 머신:
  pending → approved → confirmed
  pending → cancelled
  confirmed → cancelled (환불 시)

settlement_status 상태 머신:
  pending → approved (관리자 승인)
  approved → settled (지급 완료)
  settled → confirmed (은행 확인)
  pending/approved → rejected (거부)
```

---

### [3️⃣] 인덱스 생성

#### bookings 테이블 인덱스

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| `idx_bookings_payment_settlement` | (payment_from, settlement_status) | 정산 추적 |
| `idx_bookings_sss_status` | (sss_status) | SSS 필터링 |
| `idx_bookings_settlement_status` | (settlement_status) | 정산 상태 조회 |
| `idx_bookings_status_settlement` | (status, settlement_status) WHERE status='completed' | 완료된 예약 정산 |

#### company_settlements 테이블 인덱스

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| `idx_company_settlement_company_id` | (company_id) | 업체별 조회 |
| `idx_company_settlement_status` | (status) | 상태별 필터 |
| `idx_company_settlement_payment_date` | (payment_date) | 날짜 범위 조회 |
| `idx_company_settlement_period` | (company_id, year, month) | 월간 정산 조회 |

---

### [4️⃣] company_settlements 테이블

#### 구조

```
┌─────────────────────────────────────────┐
│     company_settlements (월간 정산)     │
├──────────────────┬──────────────────────┤
│ 기본정보         │ id, company_id, year │
│                  │ month                │
├──────────────────┼──────────────────────┤
│ 매출분류         │ total, guest, credit │
│                  │ waived               │
├──────────────────┼──────────────────────┤
│ 회수             │ recovery_rate        │
│                  │ recovered_amount     │
├──────────────────┼──────────────────────┤
│ 수수료           │ platform_fee_rate    │
│                  │ platform_fee         │
├──────────────────┼──────────────────────┤
│ 차감             │ refund, dispute,     │
│                  │ other, total_ded     │
├──────────────────┼──────────────────────┤
│ 정산액           │ net_settlement       │
├──────────────────┼──────────────────────┤
│ 상태             │ status, settlement_  │
│                  │ date, payment_date   │
├──────────────────┼──────────────────────┤
│ 감시정보         │ created_by,          │
│                  │ approved_by, paid_by │
└──────────────────┴──────────────────────┘
```

#### 상태 플로우

```
draft (초안)
  ├─[자동 계산]→ approved (승인 준비)
  └─[거부]→ rejected (거부됨)

approved (승인됨)
  ├─[지급]→ settled (정산 완료)
  └─[거부]→ rejected (거부됨)

settled (정산 완료)
  └─[은행 확인]→ confirmed (확정됨)
```

#### 금액 계산식

```
정산액 = (guest_revenue + recovered_amount) - platform_fee - total_deductions

where:
  guest_revenue       = 비회원 매출 (회수율 100%)
  recovered_amount    = credit_revenue × recovery_rate / 100
  platform_fee        = (total_revenue - waived_revenue) × platform_fee_rate / 100
  total_deductions    = refund_amount + dispute_deduction + other_deduction
```

---

### [5️⃣] settlement_transactions 테이블

#### 용도
- 정산 상세 거래 기록
- company_settlements의 구성 항목
- 감사(Audit) 증거 유지

#### 거래 유형 (transaction_type)

| 타입 | 설명 | 금액 |
|------|------|------|
| `booking` | 예약 매출 | +매출액 |
| `refund` | 환불 | -환불액 |
| `dispute` | 분쟁 차감 | -차감액 |
| `adjustment` | 조정 | ±조정액 |

#### 분류 (settlement_category)

| 분류 | 설명 | 회수율 |
|------|------|--------|
| `guest` | 비회원 | 100% |
| `credit` | 외상 | 변동 |
| `waived` | 제외 | 0% |

---

### [6️⃣] settlement_rules 테이블

#### 용도
- 정산 규칙 자동 판정
- 고객 유형별 설정
- 지급 방법별 수수료율

#### 예시 규칙

```python
Rule 1:
  customer_type = 'walk_in'
  settlement_status = 'settled'
  recovery_rate = 100%

Rule 2:
  payment_method = 'company_credit'
  settlement_status = 'pending'
  recovery_rate = 80%

Rule 3:
  customer_type = 'promotion'
  settlement_status = 'waived'
  recovery_rate = 0%
```

---

## ▶️ 실행 방법

### 방법 1: Python 스크립트 (권장)

```bash
# 프로젝트 루트에서
cd /Users/kwangseobpark/elspa

# 마이그레이션 실행
python app/migrations/20260602_payment_system_migration.py
```

**출력 예시:**
```
============================================================
🚀 결제 시스템 마이그레이션 시작
============================================================

[1/5] ENUM 타입 생성...
✅ sss_status_enum ENUM 타입이 생성되었습니다.
✅ payment_from_enum ENUM 타입이 생성되었습니다.
✅ settlement_status_enum ENUM 타입이 생성되었습니다.

[2/5] bookings 테이블 필드 추가...
✅ payment_methods 컬럼이 추가되었습니다.
✅ sss_status 컬럼이 추가되었습니다.
✅ payment_from 컬럼이 추가되었습니다.
✅ settlement_status 컬럼이 추가되었습니다.

[3/5] 성능 인덱스 추가...
✅ idx_bookings_payment_settlement 인덱스가 생성되었습니다.
✅ idx_bookings_sss_status 인덱스가 생성되었습니다.
✅ idx_bookings_settlement_status 인덱스가 생성되었습니다.
✅ idx_bookings_status_settlement 인덱스가 생성되었습니다.

[4/5] 외래 키 제약 추가...
✅ company_settlements.company_id FK가 추가되었습니다.
✅ settlement_transactions.booking_id FK가 추가되었습니다.

[5/5] 마이그레이션 검증...

📊 bookings 테이블 컬럼 확인:
  ✓ payment_from: payment_from_enum (nullable: NO)
  ✓ payment_methods: json (nullable: YES)
  ✓ settlement_status: settlement_status_enum (nullable: NO)
  ✓ sss_status: sss_status_enum (nullable: NO)

📊 bookings 테이블 인덱스 확인:
  ✓ idx_bookings_payment_settlement
  ✓ idx_bookings_settlement_status
  ✓ idx_bookings_sss_status
  ✓ idx_bookings_status_settlement

📊 company_settlements 테이블: ✓ 존재
📊 settlement_transactions 테이블: ✓ 존재

============================================================
✅ 결제 시스템 마이그레이션 완료!
============================================================
```

### 방법 2: SQL 스크립트 직접 실행

#### DBeaver 사용
```
1. SQL 에디터 열기
2. 파일 열기: app/migrations/20260602_payment_system_migration.sql
3. Ctrl+Enter 또는 ▶️ 버튼 클릭
```

#### psql 명령줄 사용
```bash
psql -U postgres -d elspa < app/migrations/20260602_payment_system_migration.sql
```

#### Supabase SQL 에디터 사용
```
1. Supabase 대시보드 열기
2. SQL 에디터 선택
3. SQL 파일 내용 복사 & 붙여넣기
4. Run 버튼 클릭
```

---

## ✅ 검증 쿼리

### 1. ENUM 타입 확인

```sql
SELECT typname FROM pg_type 
WHERE typtype = 'e' 
AND typname LIKE '%enum'
ORDER BY typname;
```

**예상 결과:**
```
payment_from_enum
settlement_status_enum
sss_status_enum
```

### 2. bookings 테이블 컬럼 확인

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN (
    'payment_methods', 
    'sss_status', 
    'payment_from', 
    'settlement_status'
  )
ORDER BY column_name;
```

**예상 결과:**
```
payment_from         | payment_from_enum       | NO
payment_methods      | json                    | YES
settlement_status    | settlement_status_enum  | NO
sss_status           | sss_status_enum         | NO
```

### 3. 인덱스 확인

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('bookings', 'company_settlements', 'settlement_transactions')
ORDER BY tablename, indexname;
```

### 4. 외래 키 확인

```sql
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('bookings', 'company_settlements', 'settlement_transactions')
  AND constraint_name LIKE 'fk_%'
ORDER BY table_name;
```

### 5. company_settlements 테이블 구조

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'company_settlements'
ORDER BY ordinal_position;
```

---

## 🔧 트러블슈팅

### ❌ 오류: "ENUM 타입이 이미 존재합니다"

**원인:** 마이그레이션이 여러 번 실행됨

**해결책:**
```python
# Python 스크립트는 자동으로 처리
# IF NOT EXISTS 절 때문에 안전함

# SQL 스크립트는 수동으로 확인
SELECT typname FROM pg_type WHERE typname LIKE '%enum';
```

### ❌ 오류: "컬럼이 이미 존재합니다"

**원인:** bookings 테이블에 컬럼이 이미 있음

**해결책:**
```sql
-- 기존 컬럼 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('payment_methods', 'sss_status', 'payment_from', 'settlement_status');

-- 기존 컬럼 제거 (주의!)
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_methods;
```

### ❌ 오류: "외래 키 제약 오류"

**원인:** companies 또는 customers 테이블이 없음

**해결책:**
```bash
# 테이블 존재 확인
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('companies', 'customers', 'bookings');

# 필요한 테이블 먼저 생성
# (기존 프로젝트이므로 이미 존재해야 함)
```

### ❌ 오류: "데이터베이스 연결 실패"

**원인:** DATABASE_URL이 잘못되었거나 네트워크 문제

**해결책:**
```python
# app/database.py 확인
import os
print(os.getenv("DATABASE_URL"))

# 또는 환경 변수 설정
export DATABASE_URL="postgresql://user:password@localhost:5432/elspa"
python app/migrations/20260602_payment_system_migration.py
```

---

## 📊 데이터베이스 다이어그램

```
┌──────────────┐
│   bookings   │
├──────────────┤
│ id (PK)      │
│ customer_id  │──┐
│ therapist_id │  │
│ ...          │  │
│              │  │
│ [NEW]        │  │
│ payment_methods │──→ JSON: 결제수단
│ sss_status   │──→ ENUM: pending, approved, ...
│ payment_from │──→ ENUM: customer, company_credit, ...
│ settlement_  │──→ ENUM: pending, approved, settled, ...
│   status     │
└──────────────┘
        │
        └───────────┐
                    │
        ┌─────────────────────────────┐
        │ settlement_transactions      │
        ├─────────────────────────────┤
        │ id (PK)                     │
        │ booking_id (FK) ────────────┼───→ bookings.id
        │ company_settlement_id (FK)──┼───→ company_settlements.id
        │ transaction_type            │
        │ settlement_category         │
        │ amount                      │
        │ recovery_rate               │
        │ recovered_amount            │
        └─────────────────────────────┘
                    │
                    │ 많은 거래
                    │
        ┌─────────────────────────────┐
        │ company_settlements         │
        ├─────────────────────────────┤
        │ id (PK)                     │
        │ company_id (FK)             │
        │ settlement_period_year      │
        │ settlement_period_month     │
        │ total_revenue               │
        │ guest_revenue               │
        │ credit_revenue              │
        │ recovered_amount            │
        │ platform_fee                │
        │ total_deductions            │
        │ net_settlement              │
        │ status                      │
        │ settlement_date             │
        │ payment_date                │
        └─────────────────────────────┘
```

---

## 📌 주요 포인트

### ✅ 설계 원칙

1. **정규화** — 거래 상세는 settlement_transactions로 분리
2. **감시 추적** — 정산 상태 변경 기록 (created_by, approved_by, paid_by)
3. **유연성** — JSON payment_methods로 다중 결제 지원
4. **성능** — 자주 쿼리되는 필드에 인덱스
5. **데이터 무결성** — CHECK 제약 + FOREIGN KEY + ENUM

### ✅ 다음 단계

1. **API 구현** — Settlement 라우터 추가
   - GET /settlements — 월간 정산 조회
   - POST /settlements — 정산 생성
   - PATCH /settlements/{id} — 상태 변경

2. **서비스 로직** — 정산 계산 서비스
   - SettlementService.calculate_monthly()
   - SettlementService.approve()
   - SettlementService.settle()

3. **테스트** — 마이그레이션 및 API 테스트
   - 거래별 금액 검증
   - 상태 전이 검증
   - 인덱스 성능 테스트

---

## 📚 참고 자료

- [PostgreSQL ENUM](https://www.postgresql.org/docs/current/datatype-enum.html)
- [SQLAlchemy Relationships](https://docs.sqlalchemy.org/en/20/orm/relationships.html)
- [Database Indexes](https://use-the-index-luke.com/)

---

**마지막 업데이트:** 2026-06-02  
**상태:** ✅ 준비 완료
