# ELSPA NeonDB PostgreSQL 스키마 종합 가이드

## 📋 목차

1. [개요](#개요)
2. [테이블 설계](#테이블-설계)
3. [데이터 흐름](#데이터-흐름)
4. [정산 로직](#정산-로직)
5. [성능 최적화](#성능-최적화)
6. [마이그레이션 실행](#마이그레이션-실행)
7. [NeonDB 배포 체크리스트](#neondb-배포-체크리스트)
8. [쿼리 예시](#쿼리-예시)

---

## 개요

### 핵심 요구사항
- **일일 고객**: 약 1,000명
- **테라피스트**: 90명 (신인 30명, 중급 35명, 경력 25명)
- **침대**: 86개 (일반 60개, VIP 16개, 커플 10개)
- **서비스**: 8가지 마사지 서비스
- **정산**: 일일 자동 정산, 테라피스트별 정산, 전체 손익 계산

### 비즈니스 모델
```
고객 결제액 = 100%
├─ 테라피스트 커미션 = 40~50%
└─ 플랫폼 순이익 = 50~60%
```

---

## 테이블 설계

### 1. THERAPISTS (테라피스트)

**목적**: 테라피스트 프로필 및 실시간 상태 관리

**구조**:
```sql
therapist_id     SERIAL PRIMARY KEY       -- 테라피스트 고유 ID
name             VARCHAR(100)             -- 이름
email            VARCHAR(100) UNIQUE      -- 이메일 (로그인용)
phone            VARCHAR(20)              -- 연락처
specialty        VARCHAR(100)             -- 전문분야 (스웨디시, 타이마사지 등)
rating           DECIMAL(3,1)             -- 평점 (0~5.0)
total_sessions   INTEGER                  -- 누적 세션 수 (통계용)
commission_rate  DECIMAL(3,2) NOT NULL    -- 수수료율 (0.40, 0.45, 0.50)
seniority        VARCHAR(20)              -- 경력 (novice, intermediate, experienced)
status           VARCHAR(20)              -- 실시간 상태
  - idle         -- 대기 중 (신규 예약 매칭 가능)
  - in_service   -- 시술 중 (예약 불가)
  - resting      -- 휴식 중 (예약 가능)
  - checked_out  -- 퇴근 (예약 불가)
  - off_duty     -- 휴무
checked_in_at    TIMESTAMPTZ              -- 출근 시간
checked_out_at   TIMESTAMPTZ              -- 퇴근 시간
daily_sessions   INTEGER                  -- 오늘 시술 세션 수
daily_revenue    DECIMAL(15,2)            -- 오늘 매출
created_at       TIMESTAMPTZ              -- 생성일
updated_at       TIMESTAMPTZ              -- 수정일
```

**특징**:
- `status` 필드로 실시간 상태 추적 → 매칭 알고리즘에 사용
- `commission_rate` 고정값 저장 (정산 시 변동 방지)
- `daily_sessions`, `daily_revenue`는 실시간 갱신

---

### 2. BEDS (침대)

**목적**: 마사지룸 침대 리소스 관리

**구조**:
```sql
bed_id        SERIAL PRIMARY KEY      -- 침대 고유 ID
bed_number    INTEGER NOT NULL        -- 침대 번호 (1~86)
room_zone     VARCHAR(20) NOT NULL    -- 마사지룸1, 마사지룸2, VIP룸, 커플룸
status        VARCHAR(20)             -- 침대 상태
  - available  -- 사용 가능
  - reserved   -- 예약됨
  - in_service -- 시술 중
  - cleaning   -- 청소 중
capacity      INTEGER (1 or 2)        -- 수용 인원 (1=개인, 2=커플)
features      TEXT[]                  -- 특징 배열 ['방음', '개인욕실', '핸드워머']
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

**특징**:
- `capacity=2`인 침대는 커플마사지 전용
- `features` 배열로 침대 특성 검색 가능 (필터링)

---

### 3. SERVICES (서비스 카탈로그)

**목적**: 제공 가능한 서비스 정보 관리

**구조**:
```sql
service_id       SERIAL PRIMARY KEY
name             VARCHAR(100) UNIQUE     -- "스웨디시 60분"
service_type     VARCHAR(50)             -- swedish|thai|hot_stone|foot|aromatherapy|couple
duration_minutes INTEGER NOT NULL        -- 예: 60, 90
base_price       DECIMAL(10,2) NOT NULL  -- 기본 가격 (원)
description      TEXT
active           BOOLEAN DEFAULT true    -- 서비스 활성화 여부
created_at       TIMESTAMPTZ
```

**제공 서비스**:
- 스웨디시 60분 (80,000원)
- 스웨디시 90분 (110,000원)
- 타이마사지 60분 (80,000원)
- 핫스톤 마사지 60분 (100,000원)
- 발 마사지 30분 (50,000원)
- 아로마테라피 60분 (90,000원)
- 커플 마사지 60분 (150,000원)
- 호텔식 스파 90분 (150,000원)

---

### 4. CUSTOMERS (고객)

**목적**: 고객 정보 및 충성도 관리

**구조**:
```sql
customer_id         SERIAL PRIMARY KEY
name                VARCHAR(100) NOT NULL
email               VARCHAR(100) UNIQUE
phone               VARCHAR(20)
total_visits        INTEGER DEFAULT 0      -- 누적 방문 횟수
total_spent         DECIMAL(15,2) DEFAULT 0 -- 누적 지출액
points              INTEGER DEFAULT 0      -- 포인트 (결제액의 5%)
preferred_therapist_id INTEGER FK          -- 선호 테라피스트
phone_verified      BOOLEAN DEFAULT false
notes               TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**특징**:
- `points` = `total_spent * 0.05` (5% 적립)
- `total_visits` = COMPLETED bookings 수
- 포인트는 다음 예약 시 할인(discount_amount)으로 사용

---

### 5. BOOKINGS (예약)

**목적**: 고객 예약 및 시술 진행 관리 (핵심 테이블)

**구조**:
```sql
booking_id           SERIAL PRIMARY KEY
customer_id          INTEGER FK NOT NULL    -- 고객
service_id           INTEGER FK NOT NULL    -- 서비스 타입
therapist_id         INTEGER FK             -- 테라피스트 (매칭 후 채움)
bed_id               INTEGER FK             -- 침대 (예약 후 할당)

-- 상태 관리
status               VARCHAR(20) DEFAULT 'requested'
  - requested   -- 예약 요청 (매칭 대기)
  - matched     -- 테라피스트 매칭됨
  - confirmed   -- 고객 확정
  - in_progress -- 시술 중
  - completed   -- 완료
  - cancelled   -- 취소

-- 시간 정보
requested_at         TIMESTAMPTZ            -- 예약 요청 시간
scheduled_at         TIMESTAMPTZ            -- 예약 시간
started_at           TIMESTAMPTZ            -- 시술 시작
ended_at             TIMESTAMPTZ            -- 시술 종료

-- 가격 정산
service_price        DECIMAL(10,2)          -- 서비스 기본 가격
discount_amount      DECIMAL(10,2)          -- 할인액 (포인트 사용)
paid_amount          DECIMAL(10,2)          -- 실제 결제액 = service_price - discount_amount
therapist_commission DECIMAL(10,2)          -- 테라피스트 커미션

notes                TEXT
cancellation_reason  VARCHAR(200)
created_at           TIMESTAMPTZ
updated_at           TIMESTAMPTZ
```

**상태 흐름**:
```
requested → matched → confirmed → in_progress → completed
                                               ↓
                                             (정산 대상)

또는 cancelled (언제든 가능)
```

---

### 6. THERAPIST_ATTENDANCE (테라피스트 근무 기록)

**목적**: 테라피스트의 일일 근무 기록 및 정산

**구조**:
```sql
attendance_id    SERIAL PRIMARY KEY
therapist_id     INTEGER FK NOT NULL
attendance_date  DATE DEFAULT CURRENT_DATE

checked_in_at    TIMESTAMPTZ              -- 출근 시간
checked_out_at   TIMESTAMPTZ              -- 퇴근 시간

-- 일일 통계 (자동 계산)
total_sessions   INTEGER DEFAULT 0        -- 완료된 세션 수
total_revenue    DECIMAL(15,2) DEFAULT 0  -- 일일 매출
total_commission DECIMAL(15,2) DEFAULT 0  -- 일일 커미션

status           VARCHAR(20) DEFAULT 'pending'
  - pending      -- 정산 대기
  - settled      -- 정산 완료
  - disputed     -- 분쟁

settled_at       TIMESTAMPTZ
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ

UNIQUE(therapist_id, attendance_date)
```

**자동 계산**:
```sql
-- attendance 작성 시마다 갱신
total_revenue = SUM(bookings.paid_amount) 
                WHERE therapist_id = ? AND DATE(completed_at) = ?

total_commission = total_revenue * commission_rate
```

---

### 7. DAILY_SETTLEMENTS (일일 전체 정산)

**목적**: 플랫폼 전체의 일일 정산 현황

**구조**:
```sql
settlement_id      SERIAL PRIMARY KEY
settlement_date    DATE DEFAULT CURRENT_DATE

-- 금액
total_revenue      DECIMAL(15,2)          -- 전체 매출
total_commission   DECIMAL(15,2)          -- 테라피스트 지급액
net_profit         DECIMAL(15,2)          -- 순이익

-- 통계
session_count      INTEGER                -- 완료된 세션 수
completed_bookings INTEGER                -- 완료된 예약 수
avg_transaction_value DECIMAL(10,2)       -- 평균 거래액
customer_count     INTEGER                -- 서빙한 고객 수
therapist_count    INTEGER                -- 근무한 테라피스트 수

status             VARCHAR(20) DEFAULT 'pending'
  - pending        -- 정산 대기
  - finalized      -- 확정
  - settled        -- 완료

finalized_at       TIMESTAMPTZ
settled_at         TIMESTAMPTZ
created_at         TIMESTAMPTZ
updated_at         TIMESTAMPTZ

UNIQUE(settlement_date)
```

**계산 공식**:
```
total_revenue = SUM(bookings.paid_amount) WHERE DATE(ended_at) = settlement_date
total_commission = SUM(bookings.therapist_commission) WHERE DATE(ended_at) = settlement_date
net_profit = total_revenue - total_commission

avg_transaction_value = total_revenue / completed_bookings
```

---

### 8. THERAPIST_SETTLEMENTS (테라피스트별 정산)

**목적**: 테라피스트별 일일 정산 내역

**구조**:
```sql
therapist_settlement_id SERIAL PRIMARY KEY
therapist_id            INTEGER FK NOT NULL
settlement_date         DATE DEFAULT CURRENT_DATE

session_count           INTEGER              -- 완료 세션 수
total_revenue           DECIMAL(15,2)        -- 일일 매출
commission_rate         DECIMAL(3,2)         -- 당시 수수료율 (변동 방지)
commission_earned       DECIMAL(15,2)        -- 실제 지급액

status                  VARCHAR(20) DEFAULT 'pending'
settled_at              TIMESTAMPTZ
notes                   TEXT
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ

UNIQUE(therapist_id, settlement_date)
```

---

### 9. PAYMENTS (결제 기록)

**목적**: 고객 결제 이력 및 환불 관리

**구조**:
```sql
payment_id      SERIAL PRIMARY KEY
booking_id      INTEGER FK NOT NULL
customer_id     INTEGER FK NOT NULL

amount          DECIMAL(10,2) NOT NULL
payment_method  VARCHAR(50)  -- cash|card|point
status          VARCHAR(20)  -- pending|completed|failed|refunded

refund_amount   DECIMAL(10,2) DEFAULT 0
refund_reason   VARCHAR(200)
refunded_at     TIMESTAMPTZ

created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

### 10. REVIEWS (고객 리뷰)

**목적**: 서비스 평가 및 테라피스트 평점

**구조**:
```sql
review_id       SERIAL PRIMARY KEY
booking_id      INTEGER FK NOT NULL      -- 어떤 예약에 대한 리뷰인지
customer_id     INTEGER FK NOT NULL      -- 리뷰 작성자
therapist_id    INTEGER FK NOT NULL      -- 평가 대상 테라피스트

rating          INTEGER NOT NULL (1~5)   -- 별점
comment         TEXT                     -- 코멘트

created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**활용**:
- `therapists.rating` = AVG(reviews.rating WHERE therapist_id = ?)
- 추천 테라피스트 선택에 사용

---

### 11. MATCHING_LOGS (매칭 알고리즘 이력)

**목적**: 테라피스트-고객 매칭 과정 추적

**구조**:
```sql
matching_log_id       SERIAL PRIMARY KEY
booking_id            INTEGER FK NOT NULL

algorithm_mode        VARCHAR(50)           -- balanced|fairness|new_boost|hybrid
candidate_therapists  JSONB                 -- [{id, name, score, reason}, ...]
selected_therapist_id INTEGER FK
score_breakdown       JSONB                 -- {expertise: X, availability: Y, rating: Z}

created_at            TIMESTAMPTZ
```

**JSONB 예시**:
```json
{
  "candidate_therapists": [
    {"id": 1, "name": "김민준", "score": 95, "reason": "expertise_match"},
    {"id": 5, "name": "이수진", "score": 87, "reason": "high_rating"}
  ],
  "score_breakdown": {
    "expertise": 30,
    "availability": 25,
    "rating": 20,
    "fairness": 15,
    "specialization": 5
  }
}
```

---

## 데이터 흐름

### Booking 생명 주기

```
1. 고객이 예약 요청 (POST /bookings)
   ├─ status = 'requested'
   ├─ customer_id, service_id 입력
   └─ therapist_id 비어 있음

2. 매칭 알고리즘 실행 (matching_logs 기록)
   ├─ 이용 가능한 테라피스트 후보 선정
   ├─ 점수 계산 (전문성, 가용성, 평점, 공정성)
   └─ 최고 점수 테라피스트 자동 매칭

3. status = 'matched' (therapist_id 할당됨)

4. 고객 확정 (또는 다른 테라피스트 재요청)
   └─ status = 'confirmed'

5. 시술 시작 (scheduled_at 시간에)
   └─ status = 'in_progress'
   ├─ started_at 기록
   └─ beds.status = 'in_service' (침대 점유)

6. 시술 완료 (ended_at 기록)
   ├─ status = 'completed'
   ├─ therapist_commission 계산
   │  = paid_amount * commission_rate
   ├─ beds.status = 'available' (침대 해제)
   └─ therapist_attendance 자동 갱신

7. 정산 처리 (daily_settlements, therapist_settlements)
   ├─ SCHEDULED JOB (매일 자정)
   └─ 일일 요약 생성
```

### 정산 자동화 흐름

```
매일 자정 (00:00) 정산 JOB 실행:

1. 전일 완료된 bookings 조회 (status = 'completed')

2. therapist_attendance 업데이트
   FOR EACH therapist:
     total_sessions = COUNT(completed bookings)
     total_revenue = SUM(paid_amount)
     total_commission = total_revenue * commission_rate
     status = 'settled'

3. therapist_settlements 생성
   FOR EACH therapist:
     복사 therapist_attendance 값
     UNIQUE(therapist_id, settlement_date) 보장

4. daily_settlements 생성
   total_revenue = SUM(therapist_settlements.total_revenue)
   total_commission = SUM(therapist_settlements.commission_earned)
   net_profit = total_revenue - total_commission
   status = 'settled'

5. 로그 기록 & 알림
   - 정산 완료 이메일/SMS
   - 대시보드 업데이트
```

---

## 정산 로직

### 수수료 계산

**테라피스트 그룹별**:
- **신인 (novice)**: commission_rate = 50%
  - 예: 80,000원 서비스 → 40,000원 커미션
  
- **중급 (intermediate)**: commission_rate = 45%
  - 예: 80,000원 서비스 → 36,000원 커미션
  
- **경력 (experienced)**: commission_rate = 40%
  - 예: 80,000원 서비스 → 32,000원 커미션

### 플랫폼 순이익

```
예시: 하루 100개 세션 완료, 평균 가격 80,000원

total_revenue = 100 × 80,000 = 8,000,000원

commission:
- 신인 30명 × 4세션 × 40,000 = 4,800,000
- 중급 35명 × 3세션 × 36,000 = 3,780,000
- 경력 25명 × 2세션 × 32,000 = 1,600,000
- 총 커미션 = 약 5,000,000원

net_profit = 8,000,000 - 5,000,000 = 3,000,000원 (37.5%)
```

### 포인트 시스템

**적립 규칙**:
- 결제액의 5% 자동 적립
- 예: 80,000원 결제 → 4,000 포인트

**사용 규칙**:
- 1 포인트 = 1원
- 다음 예약 시 discount_amount로 차감
- 예: 80,000원 예약, 4,000 포인트 사용 → paid_amount = 76,000원

**쿼리**:
```sql
-- 적립
UPDATE customers
SET points = points + (paid_amount * 0.05)
WHERE id = customer_id;

-- 사용
UPDATE bookings
SET discount_amount = requested_points,
    paid_amount = service_price - discount_amount
WHERE id = booking_id;
```

---

## 성능 최적화

### 인덱스 전략

**핵심 인덱스** (쿼리 성능 10배~100배 향상):

```sql
-- Bookings (가장 자주 조회)
idx_bookings_customer              -- 고객별 예약 조회
idx_bookings_therapist             -- 테라피스트 일정
idx_bookings_status                -- 상태별 필터링
idx_bookings_scheduled_at          -- 시간 범위 조회
idx_bookings_status_scheduled      -- 복합: 상태 + 일정

-- Therapists
idx_therapists_status              -- 실시간 매칭
idx_therapists_rating              -- 우수 테라피스트
idx_therapists_commission_rate     -- 정산 통계

-- Attendance & Settlement
idx_attendance_therapist_date      -- 일일 기록 (가장 중요)
idx_settlement_date                -- 일일 정산

-- Beds
idx_beds_status                    -- 가용 침대 찾기
idx_beds_room_zone                 -- 존별 조회
```

### 쿼리 최적화 팁

1. **복합 인덱스 활용**
   ```sql
   -- 비효율적
   SELECT * FROM bookings WHERE status = 'confirmed' AND scheduled_at > NOW();
   
   -- 효율적 (idx_bookings_status_scheduled 사용)
   CREATE INDEX idx_bookings_status_scheduled ON bookings(status, scheduled_at);
   ```

2. **EXPLAIN 분석**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM bookings WHERE status = 'completed' AND customer_id = 123;
   ```

3. **배치 처리**
   ```sql
   -- 매일 자정에 정산 JOB 실행
   -- 업데이트 대량 작업은 트랜잭션으로 관리
   BEGIN;
   UPDATE therapist_attendance SET status = 'settled';
   INSERT INTO daily_settlements ...;
   COMMIT;
   ```

---

## 마이그레이션 실행

### 순서

```bash
# 1. 스키마 생성
psql -h ep-project-xxx.us-east-1.neon.tech -U user -d elspa -f migrations/001_initial_schema.sql

# 2. 인덱스 추가
psql -h ep-project-xxx.us-east-1.neon.tech -U user -d elspa -f migrations/002_add_indexes.sql

# 3. Mock 데이터 삽입
psql -h ep-project-xxx.us-east-1.neon.tech -U user -d elspa -f migrations/003_seed_initial_data.sql

# 또는 한 번에 실행
cat migrations/*.sql | psql -h ep-project-xxx.us-east-1.neon.tech -U user -d elspa
```

### 환경 변수 설정

**.env 파일**:
```
DATABASE_URL=postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require
```

**Python 앱 (FastAPI/SQLAlchemy)**:
```python
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL")
# postgresql://... 를 postgresql+asyncpg://... 로 변환
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
```

---

## NeonDB 배포 체크리스트

### 프로덕션 배포 전 필수 확인사항

- [ ] NeonDB 프로젝트 생성 (https://console.neon.tech)
- [ ] 데이터베이스명 설정 (elspa_prod)
- [ ] 사용자 생성 (읽기용, 쓰기용 분리 권장)
- [ ] SSL 인증서 다운로드 (필요시)
- [ ] 연결 문자열 복사

### 보안

- [ ] DATABASE_URL을 .env 파일에만 저장 (Git 제외)
- [ ] `.gitignore`에 `.env` 추가
- [ ] 프로덕션 암호 정기적 변경 (월 1회)
- [ ] 읽기용 계정 생성 (분석용 대시보드 등)
- [ ] VPC 또는 IP 화이트리스트 설정 (가능시)

### 성능 모니터링

- [ ] 느린 쿼리 로그 설정
  ```sql
  SET log_min_duration_statement = 1000; -- 1초 이상 쿼리 로그
  ```
- [ ] 연결 풀 모니터링 (Vercel Postgres 사용시)
- [ ] 인덱스 통계 정기 업데이트
  ```sql
  ANALYZE; -- 매주 실행
  ```

### 백업 & 복구

- [ ] NeonDB 자동 백업 활성화 (기본: 7일 보관)
- [ ] 백업 복구 계획 수립
- [ ] 정기 복구 테스트 (월 1회)

### 모니터링

- [ ] 연결 수 모니터링 (이상 탐지)
- [ ] 디스크 사용량 모니터링
- [ ] 쿼리 성능 모니터링
- [ ] 에러 로그 모니터링 (Sentry/LogRocket)

---

## 쿼리 예시

### 1. 실시간 예약 매칭

```sql
-- 현재 이용 가능한 테라피스트 찾기
SELECT id, name, rating, commission_rate
FROM therapists
WHERE status IN ('idle', 'resting')  -- 예약 가능 상태
  AND specialty LIKE '%스웨디시%'     -- 전문분야 필터
ORDER BY rating DESC, total_sessions ASC  -- 평점 높고, 경력 낮은 순
LIMIT 5;
```

### 2. 일일 테라피스트 정산

```sql
-- 특정 테라피스트의 하루 매출 계산
SELECT
  t.name,
  COUNT(b.id) as sessions,
  SUM(b.paid_amount) as total_revenue,
  SUM(b.paid_amount) * t.commission_rate as commission
FROM therapists t
LEFT JOIN bookings b ON t.id = b.therapist_id
  AND b.status = 'completed'
  AND DATE(b.ended_at) = CURRENT_DATE
WHERE t.id = 1
GROUP BY t.id, t.name, t.commission_rate;
```

### 3. 전체 일일 정산

```sql
-- 플랫폼 전체 일일 정산
INSERT INTO daily_settlements (settlement_date, total_revenue, total_commission, net_profit, session_count)
SELECT
  CURRENT_DATE - INTERVAL '1 day',
  SUM(b.paid_amount),
  SUM(b.therapist_commission),
  SUM(b.paid_amount) - SUM(b.therapist_commission),
  COUNT(b.id)
FROM bookings b
WHERE DATE(b.ended_at) = CURRENT_DATE - INTERVAL '1 day'
  AND b.status = 'completed';
```

### 4. 테라피스트 출근 현황

```sql
-- 오늘 출근한 테라피스트 목록
SELECT
  t.id,
  t.name,
  t.status,
  ta.checked_in_at,
  COUNT(b.id) as sessions_today,
  SUM(b.paid_amount) as revenue_today
FROM therapists t
JOIN therapist_attendance ta ON t.id = ta.therapist_id
  AND ta.attendance_date = CURRENT_DATE
LEFT JOIN bookings b ON t.id = b.therapist_id
  AND b.status = 'completed'
  AND DATE(b.ended_at) = CURRENT_DATE
GROUP BY t.id, t.name, t.status, ta.checked_in_at
ORDER BY t.status, ta.checked_in_at DESC;
```

### 5. 고객 충성도 통계

```sql
-- VIP 고객 (총 방문 10회 이상)
SELECT
  c.id,
  c.name,
  c.total_visits,
  c.total_spent,
  c.points,
  c.preferred_therapist_id
FROM customers c
WHERE c.total_visits >= 10
ORDER BY c.total_spent DESC;
```

### 6. 침대 가용성 확인

```sql
-- 현재 시간 (14:00) 가용한 침대
SELECT
  b.id,
  b.bed_number,
  b.room_zone,
  b.capacity
FROM beds b
WHERE b.status = 'available'
  AND b.room_zone = '마사지룸1'
ORDER BY b.bed_number;
```

### 7. 예약 상태별 현황

```sql
-- 예약 상태별 건수
SELECT
  status,
  COUNT(*) as count
FROM bookings
WHERE scheduled_at >= CURRENT_DATE
GROUP BY status;
```

---

## 참고사항

### NeonDB vs 다른 PostgreSQL 호스팅

| 항목 | NeonDB | AWS RDS | Supabase |
|-----|--------|---------|----------|
| 자동 확장 | O | X | O |
| 연결 풀 | PgBouncer | 별도 | Built-in |
| 비용 | 저 ($50/월) | 중 ($150+) | 저 ($25+) |
| 성능 | 빠름 | 매우 빠름 | 빠름 |
| 관리 용이성 | 매우 높음 | 중간 | 매우 높음 |

### 마이그레이션 도구

**Alembic (Python)**:
```bash
# 초기 마이그레이션 파일 생성
alembic init migrations

# 마이그레이션 자동 생성
alembic revision --autogenerate -m "add therapist_attendance"

# 마이그레이션 적용
alembic upgrade head
```

### 백업 전략

**NeonDB 기본 백업**:
- 자동 백업: 7일 보관
- 수동 백업: 필요시 콘솔에서 생성 가능

**추가 권장사항**:
- 주 1회 전체 데이터베이스 덤프
- 월 1회 오프라인 백업 (보관)

---

## 문제 해결

### 느린 쿼리

1. `EXPLAIN ANALYZE` 실행
2. 인덱스 추가 또는 쿼리 최적화
3. 통계 업데이트 (`ANALYZE;`)

### 연결 풀 고갈

1. 연결 타임아웃 설정 확인
2. 장시간 연결 사용 중인 쿼리 찾기
3. 연결 풀 크기 조정

### 트랜잭션 충돌

```sql
-- 트랜잭션 격리 수준 설정
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 또는 SERIALIZABLE (강력한 격리)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## 다음 단계

1. **API 개발**
   - FastAPI 라우터 작성 (bookings, customers, therapists)
   - 매칭 알고리즘 구현

2. **프론트엔드 통합**
   - Next.js 컴포넌트 개발
   - 실시간 예약 시스템 (WebSocket)

3. **정산 자동화**
   - 일일 정산 JOB (Celery/APScheduler)
   - 테라피스트 급여 관리

4. **모니터링 & 알림**
   - 실시간 대시보드
   - 이상 탐지 알림

---

## 참고 링크

- **NeonDB 공식 문서**: https://neon.tech/docs
- **PostgreSQL 공식 문서**: https://www.postgresql.org/docs
- **FastAPI ORM**: https://sqlalchemy.org/
- **마이그레이션 도구**: https://alembic.sqlalchemy.org/

---

**마지막 업데이트**: 2026-05-13  
**팀**: Team E (데이터베이스 설계)
