# 결제 시스템 마이그레이션 - 전체 가이드 인덱스

**생성일:** 2026-06-02  
**상태:** ✅ 프로덕션 준비 완료  
**총 파일:** 8개 (코드 5개, 문서 3개)

---

## 🚀 빠른 시작 (3단계)

### 1. 백업
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Dry-run (검증)
```bash
python migrations/run_payment_migration.py --dry-run
```

### 3. 마이그레이션 실행
```bash
python migrations/run_payment_migration.py
```

**예상 소요 시간:** 5-10분

---

## 📚 문서 가이드

### 1. **QUICK_START.md** ⭐ (추천 시작점)
- 3단계 빠른 마이그레이션
- 검증 명령어
- FAQ
- 소요 시간: 5분

**👉 처음 시작하는 경우 이 문서를 읽으세요**

### 2. **PAYMENT_MIGRATION_README.md** (상세 가이드)
- 마이그레이션 개요
- 생성되는 항목 상세 설명
- 실행 방법 (3가지)
- 검증 및 롤백
- 주의사항
- 문제 해결

**👉 상세한 설명이 필요할 때 이 문서를 참고하세요**

### 3. **MIGRATION_FILES_SUMMARY.md** (파일 목록)
- 모든 파일 상세 설명
- 파일별 구조 및 내용
- 생성되는 데이터베이스 객체
- 실행 순서

**👉 파일 구조를 이해하고 싶을 때 이 문서를 보세요**

### 4. **INDEX.md** (본 문서)
- 전체 가이드 인덱스
- 파일별 역할
- 빠른 참조

---

## 💻 마이그레이션 파일 (5개)

### 코드 실행 파일

#### 1. `run_payment_migration.py` ⭐ (메인 실행 파일)
```bash
python migrations/run_payment_migration.py [옵션]
```

**역할:** 전체 마이그레이션 자동 관리
- 파일 검증
- 스키마 생성
- 데이터 초기화
- 검증 및 리포트

**옵션:**
- `--dry-run`: 검증만 (실제 변경 없음)
- `--skip-data`: 스키마만 생성
- `--with-commission`: 수수료 기록 자동 생성
- `--rollback`: 대신 롤백 실행

**시간:** 1-3분

---

#### 2. `data_migration_007_payment_defaults.py` (데이터 초기화)
```bash
python migrations/data_migration_007_payment_defaults.py
```

**역할:** 기존 데이터에 기본값 설정
- payment_status 초기화 (completed→paid, 나머지→pending)
- 결제 수단 5가지 입력
- 선택사항: 테라피스트 수수료 기록 생성

**특징:**
- 독립 실행 가능
- 트랜잭션 기반 안전성
- 상세한 로깅

**시간:** 10초-1분

---

#### 3. `rollback_payment_system.py` (롤백)
```bash
python migrations/rollback_payment_system.py [옵션]
```

**역할:** 안전한 롤백
- 데이터 백업 (JSON)
- 컬럼 제거
- 테이블 삭제
- 롤백 검증

**옵션:**
- `--full`: 테이블까지 삭제
- `--backup`: 사전 백업
- `--force`: 확인 없이 실행

**생성 파일:**
```
./migration_backups/
└── payment_system_backup_YYYYMMDD_HHMMSS.json
```

**시간:** 10초-1분

---

#### 4. `006_payment_system.py` (Alembic 마이그레이션)
**역할:** Alembic 형식의 스키마 마이그레이션

**실행 방법:**
```bash
# Alembic 설정이 있는 경우
alembic upgrade 006
```

**포함 내용:**
- Booking 테이블 4개 컬럼 추가
- 3개 새 테이블 생성
- 4개 인덱스 생성
- 업그레이드/다운그레이드 함수

---

### 모델 파일

#### 5. `api/app/models/payment.py` (SQLAlchemy 모델)
**위치:** `/Users/kwangseobpark/elspa/api/app/models/payment.py`

**포함 모델:**
- `PaymentRecord` - 결제 이력
- `TherapistCommissionLedger` - 수수료 기록
- `PaymentMethodSetting` - 결제 수단 설정

**포함 Enum:**
- PaymentStatusEnum
- PaymentTypeEnum
- TransactionStatusEnum
- CommissionStatusEnum
- 등 7개

---

## 📊 생성되는 데이터베이스 객체

### 테이블 (3개)

| 테이블명 | 용도 | 행 수 |
|---------|------|------|
| payment_records | 결제 이력 추적 | ~0 (이후 추가) |
| therapist_commission_ledger | 수수료 관리 | 0-N |
| payment_method_settings | 결제 수단 설정 | 5 |

### Booking 테이블 확장 (4개 컬럼)

| 컬럼명 | 타입 | 용도 |
|--------|------|------|
| payment_status | String(50) | 결제 상태 |
| payment_details | JSON | 상세 정보 |
| paid_at | DateTime | 결제 완료 시간 |
| payment_gateway | String(50) | 게이트웨이 |

### 인덱스 (4개)

- `ix_payment_records_booking_therapist`
- `ix_payment_records_transaction`
- `ix_therapist_commission_ledger_period`
- `ix_therapist_commission_ledger_status`

---

## 🔄 마이그레이션 실행 흐름

```
1. 준비
   ├─ 데이터베이스 백업
   ├─ 환경 변수 확인
   └─ 팀 공지 (운영 환경)

2. Dry-run (검증)
   ├─ 마이그레이션 파일 검증
   ├─ 데이터베이스 연결 확인
   └─ 예상 변경사항 확인

3. 마이그레이션 실행
   ├─ 스키마 생성 (테이블, 컬럼, 인덱스)
   ├─ 데이터 초기화
   │  ├─ payment_status 설정
   │  ├─ 결제 수단 입력
   │  └─ 수수료 기록 (선택)
   └─ 검증 & 리포트

4. 사후 검증
   ├─ 테이블 생성 확인
   ├─ 데이터 확인
   ├─ 애플리케이션 테스트
   └─ 완료 보고
```

---

## ✅ 체크리스트

### 마이그레이션 전
```
☐ 데이터베이스 백업
☐ DATABASE_URL 환경 변수 확인
☐ QUICK_START.md 읽기
☐ --dry-run 실행으로 사전 검증
```

### 마이그레이션 실행
```
☐ python migrations/run_payment_migration.py 실행
☐ 마이그레이션 로그 확인
☐ 검증 통과 확인
```

### 마이그레이션 후
```
☐ 테이블 생성 확인
☐ 데이터 확인
☐ 애플리케이션 재시작
☐ 기능 테스트
☐ 완료 보고
```

---

## 🚨 문제 발생 시

### 마이그레이션 중 에러

```bash
# 1. 롤백
python migrations/run_payment_migration.py --rollback

# 2. 백업에서 복원 (필요 시)
psql $DATABASE_URL < backup_*.sql

# 3. 다시 실행
python migrations/run_payment_migration.py
```

### 부분 실패

```bash
# 1. 현재 상태 확인
python migrations/rollback_payment_system.py  # 검증만

# 2. 로그 확인
grep "ERROR\|FAILED" migration_*.log

# 3. 전체 롤백 후 재실행
python migrations/rollback_payment_system.py --full --backup
python migrations/run_payment_migration.py
```

---

## 📖 읽기 순서 (권장)

### 처음 시작할 때
1. **INDEX.md** (본 문서) - 전체 개요 파악
2. **QUICK_START.md** - 3단계로 실행
3. 마이그레이션 실행

### 상세 이해가 필요할 때
1. **MIGRATION_FILES_SUMMARY.md** - 파일별 설명
2. **PAYMENT_MIGRATION_README.md** - 상세 가이드
3. 코드 파일 직접 검토

### 문제 해결 시
1. **QUICK_START.md** - FAQ 섹션
2. **PAYMENT_MIGRATION_README.md** - 문제 해결 섹션
3. 롤백 실행

---

## 🔗 관련 문서

### 프로젝트 문서
- `/Users/kwangseobpark/elspa/CLAUDE.md` - 프로젝트 가이드
- `/Users/kwangseobpark/elspa/README.md` - 프로젝트 개요

### 데이터베이스
- `api/app/database.py` - 데이터베이스 설정
- `api/app/models/` - SQLAlchemy 모델들

### 기존 마이그레이션
- `migrations/001_create_tables.sql`
- `migrations/002_add_payroll_record_fields.sql`
- 등등

---

## 📞 지원 및 피드백

마이그레이션 관련 문제:

1. **QUICK_START.md의 FAQ** 확인
2. **PAYMENT_MIGRATION_README.md의 문제 해결** 섹션 확인
3. 백업 파일로 복원 후 재시도

---

## 💡 팁

### 작업 시간 추정

| 작업 | 시간 | 난이도 |
|------|------|--------|
| 백업 | 1-5분 | ⭐ |
| Dry-run | 30초 | ⭐ |
| 마이그레이션 | 1-3분 | ⭐⭐ |
| 검증 | 10초 | ⭐ |
| **총합** | **5-10분** | **⭐⭐** |

### 로깅 설정

```bash
# 마이그레이션 로그 저장
python migrations/run_payment_migration.py 2>&1 | tee migration_$(date +%Y%m%d_%H%M%S).log
```

### 여러 환경에서 실행

```bash
# 개발 환경
export DATABASE_URL="postgresql://user:pass@localhost:5432/elspa_dev"
python migrations/run_payment_migration.py --dry-run

# 스테이징
export DATABASE_URL="postgresql://user:pass@staging:5432/elspa_staging"
python migrations/run_payment_migration.py

# 프로덕션
export DATABASE_URL="postgresql://user:pass@production:5432/elspa_prod"
python migrations/run_payment_migration.py
```

---

## 📈 마이그레이션 후 다음 단계

1. **API 엔드포인트 구현**
   - POST `/payments` - 결제 생성
   - GET `/payments/{id}` - 결제 조회
   - POST `/payments/{id}/refund` - 환불

2. **결제 웹훅 처리**
   - Stripe, PayPal, PayMongo 웹훅
   - 결제 상태 업데이트

3. **프론트엔드 결제 폼**
   - 결제 수단 선택
   - 결제 처리 UI
   - 환불 요청 UI

4. **테스트**
   - 단위 테스트
   - 통합 테스트
   - 시스템 테스트

---

**최종 업데이트:** 2026-06-02  
**상태:** ✅ 프로덕션 준비 완료  
**검수:** 필요 시 지원 가능
