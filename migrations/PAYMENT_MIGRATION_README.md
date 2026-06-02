# 결제 시스템 마이그레이션 가이드

ElSpa 결제 시스템 도입을 위한 데이터베이스 마이그레이션 가이드입니다.

---

## 📋 개요

### 추가되는 항목

#### 1. **Booking 테이블 확장**
```sql
- payment_status: 결제 상태 (pending/paid/failed/refunded/partial)
- payment_details: 결제 상세 정보 (JSON)
- paid_at: 실제 결제 완료 시간
- payment_gateway: 결제 게이트웨이 (stripe/paypal/paymongo/cash/bank_transfer)
```

#### 2. **새로운 테이블**

##### `payment_records` 테이블
결제 거래의 완전한 이력 추적
```
- id: 기본 키
- booking_id: 예약 ID (FK)
- therapist_id: 테라피스트 ID (FK)
- amount: 결제 금액
- payment_type: 거래 유형 (booking/deposit/refund/adjustment)
- status: 거래 상태 (pending/completed/failed/cancelled)
- gateway: 결제 게이트웨이 (stripe/paypal/paymongo/cash/bank_transfer)
- transaction_id: 외부 거래 ID (unique)
- reference_code: 내부 참조 코드
- method: 결제 수단 (card/cash/kakaopay/bank_transfer)
- metadata: 추가 정보 (JSON - 승인번호, 카드마지막4자리 등)
```

##### `therapist_commission_ledger` 테이블
테라피스트 수수료 관리 및 월별 정산
```
- id: 기본 키
- therapist_id: 테라피스트 ID (FK)
- booking_id: 예약 ID (FK, nullable)
- commission_amount: 수수료 금액
- commission_rate: 수수료율 (%)
- base_amount: 계산 기준 금액
- transaction_type: 거래 유형 (booking_service/referral/adjustment/bonus)
- status: 수수료 상태 (pending/approved/paid/cancelled)
- period: 월정산 기준 (YYYY-MM)
- notes: 메모
```

##### `payment_method_settings` 테이블
사용 가능한 결제 수단 설정
```
- id: 기본 키
- method_name: 결제 수단 코드 (unique - card/cash/kakaopay/bank_transfer/paymongo)
- display_name: 사용자에게 표시할 이름
- gateway: 외부 게이트웨이 (stripe/paypal/paymongo)
- is_enabled: 활성화 여부
- is_online: 온라인 결제 여부
- fee_percentage: 수수료율 (%)
- description: 설명
```

### 생성되는 인덱스

```sql
- ix_payment_records_booking_therapist: (booking_id, therapist_id)
- ix_payment_records_transaction: (transaction_id)
- ix_therapist_commission_ledger_period: (therapist_id, period)
- ix_therapist_commission_ledger_status: (status, period)
```

---

## 🚀 마이그레이션 실행

### 준비 사항

1. **데이터베이스 백업**
   ```bash
   # PostgreSQL 백업
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **환경 변수 확인**
   ```bash
   # .env 파일에 DATABASE_URL 설정 확인
   echo $DATABASE_URL
   ```

### 방법 1: 자동 마이그레이션 러너 (권장)

#### 기본 실행
```bash
cd /Users/kwangseobpark/elspa
python migrations/run_payment_migration.py
```

#### 옵션
```bash
# 데이터 마이그레이션 스킵 (스키마만 생성)
python migrations/run_payment_migration.py --skip-data

# 기존 예약에 수수료 기록 자동 생성
python migrations/run_payment_migration.py --with-commission

# 실제 변경 없이 검증만 수행 (dry-run)
python migrations/run_payment_migration.py --dry-run

# 롤백 실행
python migrations/run_payment_migration.py --rollback
```

### 방법 2: 데이터 마이그레이션만 실행

스키마가 이미 생성된 경우:

```bash
python migrations/data_migration_007_payment_defaults.py
```

**수행 내용:**
- 기존 예약의 `payment_status` 초기화
  - `status='completed'` → `payment_status='paid'`
  - 나머지 → `payment_status='pending'`
- 결제 수단 기본값 입력 (5가지)

**옵션:**
```python
# Python 스크립트 내부에서 수정
result = migration.run_migration(create_commission_ledger=True)  # 수수료 기록도 자동 생성
```

### 방법 3: 수동 SQL 실행

Alembic 설정이 완료된 경우:

```bash
# 마이그레이션 적용
alembic upgrade 006

# 데이터 마이그레이션
python migrations/data_migration_007_payment_defaults.py
```

---

## 🔄 마이그레이션 검증

### 자동 검증

마이그레이션 러너가 자동으로 검증합니다:
```bash
python migrations/run_payment_migration.py
```

### 수동 검증

```bash
# 1. 테이블 확인
psql $DATABASE_URL -c "\dt payment_* therapist_commission_ledger"

# 2. Booking 테이블 컬럼 확인
psql $DATABASE_URL -c "\d bookings" | grep payment

# 3. 데이터 확인
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payment_method_settings;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payment_records;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM therapist_commission_ledger;"

# 4. Payment status 확인
psql $DATABASE_URL -c "SELECT payment_status, COUNT(*) FROM bookings GROUP BY payment_status;"
```

---

## ⚙️ 마이그레이션 파일

### 1. `006_payment_system.py` (Alembic 마이그레이션)
스키마 변경사항 정의
- Booking 테이블에 4개 컬럼 추가
- 3개 새 테이블 생성
- 인덱스 생성
- 업그레이드/다운그레이드 함수 포함

### 2. `data_migration_007_payment_defaults.py` (데이터 마이그레이션)
기존 데이터에 기본값 설정
- `PaymentDataMigration` 클래스
  - `migrate_payment_statuses()`: payment_status 초기화
  - `initialize_payment_method_settings()`: 결제 수단 기본값 입력
  - `create_initial_commission_ledger()`: 선택사항 - 수수료 기록 생성

### 3. `rollback_payment_system.py` (롤백)
안전한 롤백 기능 제공
- 데이터 백업
- 컬럼 제거
- 테이블 삭제
- 롤백 검증

### 4. `run_payment_migration.py` (마이그레이션 러너)
전체 마이그레이션 자동 실행
- 파일 검증
- 순차 실행
- 검증
- 요약 리포트

### 5. `payment.py` (SQLAlchemy 모델)
PaymentRecord, TherapistCommissionLedger, PaymentMethodSetting 모델 정의

---

## 🔙 롤백 방법

### 전체 롤백 (권장)

```bash
# 데이터 백업 포함
python migrations/rollback_payment_system.py --full --backup

# 또는 마이그레이션 러너 사용
python migrations/run_payment_migration.py --rollback
```

### 부분 롤백 (컬럼만 제거)

```bash
python migrations/rollback_payment_system.py --backup
```

### 수동 롤백

```bash
# 1. 컬럼 제거
psql $DATABASE_URL << EOF
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_gateway CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS paid_at CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_details CASCADE;
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_status CASCADE;
EOF

# 2. 테이블 삭제
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS payment_method_settings CASCADE;
DROP TABLE IF EXISTS therapist_commission_ledger CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
EOF
```

---

## 📊 마이그레이션 결과

성공적인 마이그레이션 후:

```
✅ Payment_status 마이그레이션 완료 (총 X개)
✅ Payment_method_settings 초기화 완료 (5개)
✅ 마이그레이션 검증 완료: 모든 테이블이 생성되었습니다

생성되는 항목:
1. payment_records 테이블
   - 결제 이력 추적
   - 트랜잭션 기록 저장

2. therapist_commission_ledger 테이블
   - 테라피스트 수수료 기록
   - 월정산 데이터 관리

3. payment_method_settings 테이블
   - 결제 수단별 설정
   - 수수료율 관리

4. bookings 테이블 확장
   - payment_status: 결제 상태
   - payment_details: 상세 정보
   - paid_at: 결제 완료 시간
   - payment_gateway: 결제 게이트웨이
```

---

## ⚠️ 주의사항

### 운영 환경 (프로덕션)

1. **반드시 사전 백업**
   ```bash
   pg_dump $DATABASE_URL > production_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **점검 시간(유휴 시간) 실행**
   - 야간 또는 이른 아침 사용자 적게 있을 때

3. **롤백 계획 준비**
   - 백업 파일 확인
   - 롤백 스크립트 사전 테스트

### 개발 환경

```bash
# 테스트 환경에서 먼저 실행
python migrations/run_payment_migration.py --dry-run

# 검증 통과 후 실행
python migrations/run_payment_migration.py
```

---

## 🐛 문제 해결

### 문제: `DATABASE_URL not found`

**해결:**
```bash
# .env 파일 확인
cat /Users/kwangseobpark/elspa/.env | grep DATABASE_URL

# 또는 환경 변수 직접 설정
export DATABASE_URL="postgresql://user:pass@host:port/database"
python migrations/run_payment_migration.py
```

### 문제: `Foreign key constraint violation`

**해결:**
```bash
# 1. 외래 키 제약 일시 비활성화
psql $DATABASE_URL -c "ALTER TABLE bookings DISABLE TRIGGER ALL;"

# 2. 마이그레이션 재실행
python migrations/run_payment_migration.py

# 3. 트리거 재활성화
psql $DATABASE_URL -c "ALTER TABLE bookings ENABLE TRIGGER ALL;"
```

### 문제: 부분 마이그레이션 상태

**해결:**
```bash
# 1. 현재 상태 확인
python migrations/rollback_payment_system.py (검증만)

# 2. 롤백 후 재실행
python migrations/run_payment_migration.py --rollback
python migrations/run_payment_migration.py
```

---

## 📝 마이그레이션 로그

모든 마이그레이션 실행은 다음과 같은 로그를 생성합니다:

```
2026-06-02 21:15:35,123 - INFO - ============================================================
2026-06-02 21:15:35,124 - INFO - 🚀 결제 시스템 마이그레이션 시작
2026-06-02 21:15:35,125 - INFO - ============================================================
2026-06-02 21:15:35,126 - INFO - 🔍 마이그레이션 파일 검증...
2026-06-02 21:15:35,127 - INFO -   ✅ 006_payment_system.py
2026-06-02 21:15:35,128 - INFO -   ✅ data_migration_007_payment_defaults.py
2026-06-02 21:15:35,129 - INFO - ✅ 모든 마이그레이션 파일 검증 완료
2026-06-02 21:15:35,130 - INFO - 🔄 스키마 마이그레이션 시작...
...
2026-06-02 21:15:50,200 - INFO - ✅ 마이그레이션 완료!
2026-06-02 21:15:50,201 - INFO - ============================================================
```

---

## 📚 참고 자료

### 모델 정의
- `/Users/kwangseobpark/elspa/api/app/models/payment.py`

### SQLAlchemy 문서
- https://docs.sqlalchemy.org/en/20/

### PostgreSQL 마이그레이션
- https://www.postgresql.org/docs/current/sql-altertable.html

### Alembic 문서
- https://alembic.sqlalchemy.org/

---

## ✅ 체크리스트

### 마이그레이션 전
- [ ] 데이터베이스 백업 완료
- [ ] 환경 변수 확인
- [ ] 운영 환경 점검 시간 확인
- [ ] 팀 공지 완료

### 마이그레이션 실행
- [ ] dry-run 으로 사전 검증
- [ ] 마이그레이션 실행
- [ ] 마이그레이션 로그 확인
- [ ] 검증 통과 확인

### 마이그레이션 후
- [ ] 테이블 생성 확인
- [ ] 데이터 확인
- [ ] 인덱스 생성 확인
- [ ] 애플리케이션 테스트
- [ ] 롤백 계획 저장

---

**마지막 업데이트:** 2026-06-02  
**문서 버전:** 1.0  
**상태:** ✅ 프로덕션 준비 완료
