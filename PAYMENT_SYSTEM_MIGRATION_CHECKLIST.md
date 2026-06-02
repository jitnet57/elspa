# 결제 시스템 마이그레이션 체크리스트

**작성일:** 2026-06-02  
**상태:** ✅ 준비 완료

---

## 🚀 빠른 시작 (Quick Start)

### 실행 (3가지 방법)

#### 방법 1: Python 스크립트 (권장) ⭐
```bash
cd /Users/kwangseobpark/elspa
python app/migrations/20260602_payment_system_migration.py
```

#### 방법 2: SQL 직접 실행
```bash
# DBeaver 또는 Supabase SQL 에디터에서
# /app/migrations/20260602_payment_system_migration.sql 실행
```

#### 방법 3: psql 명령줄
```bash
psql -U postgres -d elspa < app/migrations/20260602_payment_system_migration.sql
```

---

## 📋 마이그레이션 내용

### ✅ 생성되는 것

#### 1. ENUM 타입 (3개)
- [ ] `sss_status_enum` — SSS 상태
- [ ] `payment_from_enum` — 결제 주체
- [ ] `settlement_status_enum` — 정산 상태

#### 2. bookings 테이블 필드 (4개)
- [ ] `payment_methods` (JSON) — 결제수단 배열
- [ ] `sss_status` (ENUM) — SSS 상태
- [ ] `payment_from` (ENUM) — 결제 주체
- [ ] `settlement_status` (ENUM) — 정산 상태

#### 3. 인덱스 (4개 + 3개 + 3개)
**bookings 테이블:**
- [ ] `idx_bookings_payment_settlement`
- [ ] `idx_bookings_sss_status`
- [ ] `idx_bookings_settlement_status`
- [ ] `idx_bookings_status_settlement`

**company_settlements 테이블:**
- [ ] `idx_company_settlement_company_id`
- [ ] `idx_company_settlement_status`
- [ ] `idx_company_settlement_payment_date`
- [ ] `idx_company_settlement_period`

**settlement_transactions 테이블:**
- [ ] `idx_settlement_transaction_company_id`
- [ ] `idx_settlement_transaction_booking_id`
- [ ] `idx_settlement_transaction_type`

#### 4. 새 테이블 (3개)
- [ ] `company_settlements` — 월간 정산 기록
- [ ] `settlement_transactions` — 거래 상세 기록
- [ ] `settlement_rules` — 정산 규칙

---

## 📊 테이블 구조

### bookings (기존 + 신규)
```
기존 컬럼: id, customer_id, therapist_id, service_id, 
         booking_date, booking_time, duration_minutes, 
         location, status, total_price, payment_method, 
         notes, created_at, updated_at

+ 신규 컬럼:
  - payment_methods (JSON[]) — 결제수단
  - sss_status (ENUM) — SSS 상태
  - payment_from (ENUM) — 결제 주체
  - settlement_status (ENUM) — 정산 상태
```

### company_settlements (신규)
```
필드 분류:
  기본: id, company_id, settlement_period_year/month
  매출: total, guest, credit, waived
  회수: recovery_rate, recovered_amount
  수수료: platform_fee_rate, platform_fee
  차감: refund, dispute, other, total_deductions
  정산: net_settlement, status, settlement_date, payment_date
  감시: created_by, approved_by, paid_by
  시간: created_at, updated_at
```

### settlement_transactions (신규)
```
기본: id, company_settlement_id, booking_id
거래: transaction_type, settlement_category
금액: amount, recovery_rate, recovered_amount
날짜: transaction_date
메모: notes
```

### settlement_rules (신규)
```
기본: id, rule_name, description, is_active
조건: customer_type, payment_method
설정: settlement_status, recovery_rate, platform_fee_rate
시간: created_at, updated_at
```

---

## 🔍 검증 (Verification)

마이그레이션 후 아래 쿼리로 검증하세요:

### 1️⃣ ENUM 타입 확인
```sql
SELECT typname FROM pg_type 
WHERE typtype = 'e' AND typname LIKE '%enum'
ORDER BY typname;
```
**예상:** 3개 타입 (payment_from_enum, settlement_status_enum, sss_status_enum)

### 2️⃣ bookings 컬럼 확인
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'bookings' 
AND column_name IN ('payment_methods', 'sss_status', 'payment_from', 'settlement_status')
ORDER BY column_name;
```
**예상:** 4개 컬럼

### 3️⃣ 테이블 존재 확인
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('company_settlements', 'settlement_transactions', 'settlement_rules');
```
**예상:** 3개 테이블

### 4️⃣ 인덱스 확인
```sql
SELECT COUNT(*) as total_indexes FROM pg_indexes
WHERE tablename IN ('bookings', 'company_settlements', 'settlement_transactions');
```
**예상:** 10개 이상 인덱스

---

## ⚠️ 주의사항

### ✅ 안전성
- [x] IF NOT EXISTS로 중복 생성 방지
- [x] 기존 데이터 보존 (ALTER TABLE ADD COLUMN)
- [x] DEFAULT 값 설정 (마이그레이션 후 기존 행도 안전)
- [x] CHECK 제약으로 데이터 무결성 보장

### ✅ 성능
- [x] 자주 쿼리되는 필드에 인덱스 추가
- [x] 복합 인덱스로 WHERE 조건 최적화
- [x] ENUM 타입으로 저장 공간 절약

### ❌ 주의
- 마이그레이션은 비파괴적 (기존 데이터 손상 없음)
- 롤백이 필요하면 ENUM 타입 삭제 필요 (외래키 때문에 복잡)
- 프로덕션 DB에는 백업 후 실행

---

## 📝 다음 단계 (Next Steps)

### 1. API 라우터 구현 (app/routers/settlements.py)
```python
@router.get("/settlements")  # 월간 정산 조회
@router.post("/settlements")  # 정산 생성
@router.patch("/settlements/{id}")  # 상태 변경
@router.get("/settlements/{id}/transactions")  # 거래 상세
```

### 2. 서비스 로직 (app/services/settlement_service.py)
```python
class SettlementService:
    def calculate_monthly()  # 정산액 자동 계산
    def approve()  # 정산 승인
    def settle()  # 정산 지급
    def get_booking_settlement_status()  # 예약 정산 상태
```

### 3. Pydantic 스키마 (app/schemas/settlement.py)
```python
class CompanySettlementCreate
class CompanySettlementUpdate
class SettlementTransactionRead
class SettlementRuleCreate
```

### 4. 데이터베이스 모델 매핑
```python
# app/models/company_settlement.py 이미 작성됨
# 마이그레이션과 동일한 구조
```

### 5. 테스트 (tests/test_settlements.py)
```python
def test_create_settlement()
def test_calculate_net_settlement()
def test_update_settlement_status()
def test_settlement_transactions()
```

---

## 📂 파일 위치

```
/Users/kwangseobpark/elspa/
├── app/migrations/
│   ├── 20260602_payment_system_migration.py       ⭐ Python 마이그레이션
│   ├── 20260602_payment_system_migration.sql      ⭐ SQL 마이그레이션
│   └── PAYMENT_MIGRATION_README.md                📖 상세 가이드
├── app/models/
│   └── company_settlement.py                      ✅ 이미 작성됨
├── PAYMENT_SYSTEM_MIGRATION_CHECKLIST.md          📋 이 파일
└── main.py                                        🔧 마이그레이션 실행 지점
```

---

## 🎯 핵심 정리

| 항목 | 내용 |
|------|------|
| **작성자** | jitnet57 (kang jichul) |
| **작성일** | 2026-06-02 |
| **파일 개수** | 2개 (Python + SQL) |
| **테이블 수** | 3개 신규 생성 + 1개 ALTER |
| **ENUM 타입** | 3개 |
| **인덱스** | 10개 |
| **실행 시간** | ~2-5초 |
| **백업 필요** | 예 (프로덕션) |

---

## ✅ 체크리스트

실행 전:
- [ ] 데이터베이스 백업 완료 (프로덕션인 경우)
- [ ] DATABASE_URL 확인
- [ ] PostgreSQL 버전 확인 (9.6+)

실행 중:
- [ ] 마이그레이션 스크립트 실행
- [ ] 진행 상황 로그 확인

실행 후:
- [ ] 위의 4가지 검증 쿼리 실행
- [ ] 모든 테이블/인덱스 생성 확인
- [ ] ENUM 값 정상 작동 확인

---

## 📞 트러블슈팅

**Q: "ENUM이 이미 존재합니다" 오류**  
A: 이미 마이그레이션을 실행했습니다. `CREATE TYPE IF NOT EXISTS`를 사용하므로 안전합니다.

**Q: "컬럼이 이미 존재합니다" 오류**  
A: `ADD COLUMN IF NOT EXISTS`를 사용하므로 안전합니다. 스크립트를 다시 실행해도 됩니다.

**Q: 마이그레이션을 롤백하고 싶습니다**  
A: 외래키 때문에 복잡합니다. 별도 스크립트가 필요합니다.

---

**상태:** ✅ 마이그레이션 준비 완료  
**다음:** API 라우터 구현 시작
