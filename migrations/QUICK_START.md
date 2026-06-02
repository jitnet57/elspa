# 빠른 시작 가이드 - 결제 시스템 마이그레이션

## 📌 3단계로 마이그레이션 실행

### 1단계: 백업 (필수)

```bash
# PostgreSQL 백업 생성
pg_dump $DATABASE_URL > payment_migration_backup_$(date +%Y%m%d_%H%M%S).sql

# 또는 모든 백업 디렉토리에 저장
mkdir -p ./migration_backups
pg_dump $DATABASE_URL > ./migration_backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**확인:**
```bash
# 백업 파일이 생성되었는지 확인
ls -lh payment_migration_backup_*.sql
```

### 2단계: 사전 검증 (권장)

```bash
# Dry-run으로 변경사항 미리 확인
python migrations/run_payment_migration.py --dry-run
```

**예상 출력:**
```
✅ Payment_status 마이그레이션 준비 완료
✅ Payment_method_settings 초기화 준비 완료
✅ 마이그레이션 검증 준비 완료
```

### 3단계: 마이그레이션 실행

```bash
# 마이그레이션 실행
python migrations/run_payment_migration.py
```

**예상 결과:**
```
============================================================
🚀 결제 시스템 마이그레이션 시작
============================================================
✅ 모든 마이그레이션 파일 검증 완료
✅ 스키마 마이그레이션 준비 완료
✅ 데이터 마이그레이션 완료
✅ 마이그레이션 검증 완료: 모든 테이블이 생성되었습니다

생성되는 항목:
1. payment_records 테이블
2. therapist_commission_ledger 테이블
3. payment_method_settings 테이블
4. bookings 테이블 확장 (4개 컬럼 추가)

============================================================
✅ 마이그레이션 완료!
============================================================
```

---

## 🔍 마이그레이션 후 검증

### 테이블 생성 확인

```bash
# 모든 결제 관련 테이블 확인
psql $DATABASE_URL -c "\dt payment_* therapist_commission_ledger"
```

**예상 출력:**
```
                    List of relations
 Schema |              Name              | Type  | Owner
--------+--------------------------------+-------+-------
 public | payment_method_settings        | table | postgres
 public | payment_records                | table | postgres
 public | therapist_commission_ledger    | table | postgres
```

### Booking 테이블 확장 확인

```bash
# payment 관련 컬럼 확인
psql $DATABASE_URL -c "\d bookings" | grep payment
```

**예상 출력:**
```
 payment_status       | character varying(50)
 payment_details      | json
 paid_at              | timestamp without time zone
 payment_gateway      | character varying(50)
```

### 데이터 확인

```bash
# Payment method 기본값 확인 (5개 입력되어야 함)
psql $DATABASE_URL -c "SELECT method_name, display_name, is_enabled FROM payment_method_settings ORDER BY id;"
```

**예상 출력:**
```
    method_name    |    display_name     | is_enabled
-------------------+---------------------+------------
 cash              | 현금                | t
 card              | 신용/체크카드       | t
 kakaopay          | 카카오페이          | t
 bank_transfer     | 계좌이체            | t
 paymongo          | PayMongo            | t
```

### Payment Status 초기화 확인

```bash
# 결제 상태 분포 확인
psql $DATABASE_URL -c "SELECT payment_status, COUNT(*) as cnt FROM bookings GROUP BY payment_status ORDER BY payment_status;"
```

**예상 출력:**
```
 payment_status | cnt
----------------+-----
 paid           | 123
 pending        | 45
```

---

## 🚨 문제 발생 시 롤백

### 전체 롤백

```bash
# 데이터 백업과 함께 롤백
python migrations/rollback_payment_system.py --full --backup
```

### 부분 롤백 (컬럼만 제거)

```bash
# 테이블은 유지하고 컬럼만 제거
python migrations/rollback_payment_system.py --backup
```

### 백업에서 복원

```bash
# 완전한 복원
psql $DATABASE_URL < payment_migration_backup_YYYYMMDD_HHMMSS.sql
```

---

## 💡 고급 옵션

### 기존 예약에 수수료 기록 자동 생성

완료된 모든 예약에 대해 테라피스트 수수료 기록 자동 생성:

```bash
python migrations/run_payment_migration.py --with-commission
```

**동작:**
- 모든 `status='completed'` 예약 조회
- 테라피스트별 수수료율 적용하여 계산
- `therapist_commission_ledger` 기록 생성

**예상 결과:**
```
✅ Therapist_commission_ledger 초기화 완료 (X개)
```

### 데이터 마이그레이션만 스킵

스키마가 이미 생성된 경우:

```bash
python migrations/run_payment_migration.py --skip-data
```

---

## ⏱️ 소요 시간

| 단계 | 예상 시간 | 설명 |
|------|---------|------|
| 백업 | 1-5분 | 데이터베이스 크기에 따라 다름 |
| Dry-run | 10-30초 | 검증만 수행 |
| 마이그레이션 | 1-3분 | 스키마 생성 및 데이터 초기화 |
| 검증 | 10-30초 | 생성된 객체 확인 |
| **총합** | **5-10분** | - |

---

## 📋 체크리스트

```
마이그레이션 전:
☐ 데이터베이스 백업 완료
☐ DATABASE_URL 환경 변수 확인
☐ 팀에 공지 (운영 환경의 경우)
☐ 롤백 계획 검토

마이그레이션:
☐ python migrations/run_payment_migration.py --dry-run 실행
☐ 검증 결과 확인
☐ python migrations/run_payment_migration.py 실행
☐ 마이그레이션 로그 저장

마이그레이션 후:
☐ 테이블 생성 확인
☐ 데이터 확인
☐ 애플리케이션 재시작
☐ 기능 테스트 (결제 관련)
☐ 완료 보고
```

---

## 🆘 FAQ

### Q: 마이그레이션 중간에 실패했어요

**A:** 롤백을 실행하고 다시 시도하세요
```bash
# 전체 롤백
python migrations/rollback_payment_system.py --full --backup

# 다시 실행
python migrations/run_payment_migration.py
```

### Q: 데이터가 손실되었어요

**A:** 백업에서 복원하세요
```bash
# 백업 파일 확인
ls -lh ./migration_backups/

# 복원
psql $DATABASE_URL < ./migration_backups/backup_YYYYMMDD_HHMMSS.sql
```

### Q: Dry-run 통과했는데 실제 실행이 실패해요

**A:** 다음을 확인하세요
```bash
# 1. 데이터베이스 연결 상태 확인
psql $DATABASE_URL -c "SELECT 1;"

# 2. 필요한 권한 확인 (테이블 생성, 컬럼 수정)
psql $DATABASE_URL -c "SELECT * FROM information_schema.role_table_grants WHERE table_name='bookings';"

# 3. 디스크 공간 확인
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Q: 마이그레이션 로그는 어디에 저장되나요

**A:** 콘솔 출력을 파일로 저장하세요
```bash
python migrations/run_payment_migration.py 2>&1 | tee migration_$(date +%Y%m%d_%H%M%S).log
```

---

## 📞 지원

문제 발생 시:

1. **로그 확인**: 마이그레이션 로그의 에러 메시지 확인
2. **백업 확인**: 백업 파일이 정상인지 확인
3. **롤백**: 필요시 롤백 실행
4. **재실행**: 문제 해결 후 재실행

---

**마지막 업데이트:** 2026-06-02  
**소요 시간:** 5-10분  
**난이도:** ⭐ 초급 (자동화됨)
