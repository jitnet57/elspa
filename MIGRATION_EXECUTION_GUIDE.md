# ELSPA NeonDB 마이그레이션 실행 가이드

## 📋 마이그레이션 파일 목록

```
migrations/
├── 001_initial_schema.sql       # 테이블 생성 (11개 테이블)
├── 002_add_indexes.sql          # 인덱스 추가 (성능 최적화)
└── 003_seed_initial_data.sql    # Mock 데이터 삽입 (테스트용)
```

---

## 1단계: NeonDB 프로젝트 생성

### 1.1 NeonDB 회원가입 및 프로젝트 생성

1. **NeonDB 콘솔 접속**: https://console.neon.tech
2. **새 프로젝트 생성**:
   - 프로젝트명: `elspa-massage-booking`
   - 지역: `US East (동부 미국)` 또는 한국 지역 선택
   - PostgreSQL 버전: 16 (최신)
3. **데이터베이스 생성**:
   - 데이터베이스명: `elspa_dev` (개발 환경)
   - 또는 `elspa_prod` (프로덕션)

### 1.2 연결 문자열 복사

NeonDB 콘솔에서 **Connection String** 복사:

```
postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require
```

---

## 2단계: 환경 설정

### 2.1 `.env` 파일 생성

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env
DATABASE_URL=postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require

# 선택사항
ENVIRONMENT=development
AUTO_MIGRATE=true
LOG_LEVEL=INFO
```

**보안 주의**:
- `.env` 파일을 `.gitignore`에 추가
- GitHub에 커밋하지 않기

```bash
# .gitignore 추가
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### 2.2 `.env.neondb` 파일 참조

프로젝트에 포함된 `.env.neondb` 템플릿 참조:

```bash
cat .env.neondb
```

---

## 3단계: 마이그레이션 실행

### 방법 A: psql CLI (권장)

**psql 설치 확인**:

```bash
# Windows (PowerShell)
psql --version

# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

**마이그레이션 실행**:

```bash
# 한 번에 실행 (모든 마이그레이션)
cat migrations/001_initial_schema.sql migrations/002_add_indexes.sql migrations/003_seed_initial_data.sql | \
  psql "postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require"
```

또는 **개별 실행**:

```bash
# 1단계: 테이블 생성
psql "postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require" \
  -f migrations/001_initial_schema.sql

# 2단계: 인덱스 추가
psql "postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require" \
  -f migrations/002_add_indexes.sql

# 3단계: Mock 데이터 삽입
psql "postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require" \
  -f migrations/003_seed_initial_data.sql
```

### 방법 B: Python + SQLAlchemy (자동 마이그레이션)

**Alembic 설정** (권장):

```bash
# Alembic 초기화 (처음 한 번)
alembic init alembic

# 마이그레이션 파일 자동 생성
alembic revision --autogenerate -m "initial schema"

# 마이그레이션 적용
alembic upgrade head
```

**FastAPI 앱에서 자동 실행**:

```python
# app/main.py
from app.database import init_db
import asyncio

@app.on_event("startup")
async def startup_event():
    # 앱 시작 시 자동으로 테이블 생성
    if os.getenv("AUTO_MIGRATE") == "true":
        await init_db()
```

### 방법 C: Python script (수동)

**마이그레이션 스크립트 작성**:

```python
# scripts/migrate.py
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async def run_migrations():
    async_engine = create_async_engine(ASYNC_DATABASE_URL)
    
    async with async_engine.begin() as conn:
        # SQL 파일 읽기 및 실행
        with open("migrations/001_initial_schema.sql") as f:
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql(f.read()))
        
        with open("migrations/002_add_indexes.sql") as f:
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql(f.read()))
        
        with open("migrations/003_seed_initial_data.sql") as f:
            await conn.run_sync(lambda sync_conn: sync_conn.exec_driver_sql(f.read()))
    
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migrations())
```

**실행**:

```bash
python scripts/migrate.py
```

---

## 4단계: 마이그레이션 검증

### 4.1 테이블 확인

```bash
# NeonDB 콘솔 또는 psql에서
psql "postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require"

# 테이블 목록 확인
\dt

# 테이블 구조 확인
\d therapists
\d bookings
\d daily_settlements
```

### 4.2 데이터 확인

```sql
-- 생성된 데이터 건수 확인
SELECT 'therapists' as table_name, COUNT(*) as row_count FROM therapists
UNION ALL
SELECT 'beds', COUNT(*) FROM beds
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings;
```

**예상 결과**:
```
table_name          row_count
─────────────────────────────
therapists          90
beds                86
services            8
customers           100
bookings            50
```

### 4.3 인덱스 확인

```sql
-- 생성된 인덱스 목록
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 4.4 정산 데이터 확인

```sql
-- 일일 정산 확인
SELECT settlement_date, total_revenue, total_commission, net_profit
FROM daily_settlements
ORDER BY settlement_date DESC;

-- 테라피스트 정산 확인
SELECT therapist_id, settlement_date, total_revenue, commission_earned
FROM therapist_settlements
LIMIT 10;
```

---

## 5단계: 성능 최적화

### 5.1 통계 업데이트

마이그레이션 후 쿼리 플래너 최적화:

```bash
# psql에서 실행
psql "postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_dev?sslmode=require" \
  -c "ANALYZE;"
```

### 5.2 쿼리 성능 테스트

```sql
-- 느린 쿼리 로깅 활성화 (1초 이상)
SET log_min_duration_statement = 1000;

-- 인덱스 활용 확인
EXPLAIN ANALYZE
SELECT * FROM bookings 
WHERE status = 'completed' AND DATE(ended_at) = CURRENT_DATE;
```

**결과 해석**:
- `Seq Scan` → 전체 테이블 스캔 (느림)
- `Index Scan` → 인덱스 사용 (빠름) ✓

---

## 6단계: FastAPI 통합

### 6.1 데이터베이스 연결 설정

**`app/database.py` 수정**:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# NeonDB 연결
DATABASE_URL = os.getenv("DATABASE_URL")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# 비동기 엔진
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,  # SQL 로깅 (디버깅 시 True)
    pool_pre_ping=True,  # 연결 상태 확인
    pool_size=10,  # 연결 풀 크기
    max_overflow=0  # 초과 연결 비허용
)

# 세션 팩토리
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# ORM Base
Base = declarative_base()

async def get_db():
    """데이터베이스 세션 디펜던시"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """데이터베이스 초기화 (테이블 생성)"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def close_db():
    """데이터베이스 연결 종료"""
    await async_engine.dispose()
```

### 6.2 FastAPI 앱 초기화

**`app/main.py` 수정**:

```python
from fastapi import FastAPI
from app.database import init_db, close_db
import os

app = FastAPI(title="ELSPA Massage Booking System")

@app.on_event("startup")
async def startup_event():
    # 앱 시작 시 데이터베이스 초기화
    if os.getenv("AUTO_MIGRATE", "false").lower() == "true":
        print("🔄 Initializing database...")
        await init_db()
        print("✅ Database initialization complete")

@app.on_event("shutdown")
async def shutdown_event():
    # 앱 종료 시 데이터베이스 연결 종료
    print("🔌 Closing database connections...")
    await close_db()
    print("✅ Database connections closed")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

### 6.3 테스트

```bash
# FastAPI 앱 실행
uvicorn app.main:app --reload

# 헬스 체크
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## 7단계: 프로덕션 배포

### 7.1 프로덕션 데이터베이스 생성

1. NeonDB 콘솔에서 새 데이터베이스 생성:
   - 데이터베이스명: `elspa_prod`

2. 프로덕션 `.env` 설정:
   ```
   DATABASE_URL=postgresql://user:password@ep-project-xxx.us-east-1.neon.tech/elspa_prod?sslmode=require
   ENVIRONMENT=production
   AUTO_MIGRATE=false  # 프로덕션에서는 수동 마이그레이션
   ```

3. 프로덕션 마이그레이션 실행:
   ```bash
   # 프로덕션 환경에서만 실행 (신중히!)
   psql "postgresql://user:password@...../elspa_prod?sslmode=require" -f migrations/001_initial_schema.sql
   ```

### 7.2 보안 설정

**IP 화이트리스트** (선택사항):

NeonDB 콘솔에서 접근 가능한 IP 주소 제한:
- API 서버 IP
- 관리자 IP

**암호 변경**:

```bash
# NeonDB 콘솔에서 사용자 암호 변경
# Security → Roles → 사용자명 → Reset Password
```

### 7.3 모니터링 설정

**느린 쿼리 로그**:

```sql
-- NeonDB 콘솔에서 실행
SET log_min_duration_statement = 1000;
```

**연결 상태 모니터링**:

```sql
-- 활성 연결 확인
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

---

## 8단계: 정산 JOB 자동화

### 8.1 일일 정산 JOB

**APScheduler 사용**:

```python
# app/tasks/settlement.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text
from app.database import AsyncSessionLocal
import asyncio

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=0, minute=0)  # 매일 자정
async def daily_settlement_job():
    """매일 자정에 일일 정산 실행"""
    async with AsyncSessionLocal() as session:
        try:
            # 1단계: therapist_attendance 업데이트
            await session.execute(text("""
                UPDATE therapist_attendance
                SET status = 'settled', settled_at = NOW()
                WHERE attendance_date = CURRENT_DATE - INTERVAL '1 day'
                  AND status = 'pending';
            """))
            
            # 2단계: daily_settlements 생성
            await session.execute(text("""
                INSERT INTO daily_settlements (settlement_date, total_revenue, total_commission, net_profit, session_count, status)
                SELECT
                  CURRENT_DATE - INTERVAL '1 day',
                  COALESCE(SUM(paid_amount), 0),
                  COALESCE(SUM(therapist_commission), 0),
                  COALESCE(SUM(paid_amount) - SUM(therapist_commission), 0),
                  COUNT(*),
                  'settled'
                FROM bookings
                WHERE DATE(ended_at) = CURRENT_DATE - INTERVAL '1 day'
                  AND status = 'completed'
                ON CONFLICT (settlement_date) DO NOTHING;
            """))
            
            await session.commit()
            print("✅ Daily settlement completed")
        except Exception as e:
            print(f"❌ Settlement error: {e}")
            await session.rollback()

# 앱 시작 시 스케줄러 시작
async def start_scheduler():
    scheduler.start()
```

**FastAPI에 통합**:

```python
# app/main.py
from app.tasks.settlement import start_scheduler

@app.on_event("startup")
async def startup_event():
    await start_scheduler()
```

### 8.2 Celery 사용 (고급)

**Celery 설정**:

```python
# app/celery_app.py
from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    'elspa',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.beat_schedule = {
    'daily-settlement': {
        'task': 'app.tasks.settlement.daily_settlement_task',
        'schedule': crontab(hour=0, minute=0),  # 매일 자정
    },
}

@celery_app.task
async def daily_settlement_task():
    """일일 정산 작업"""
    # 위의 daily_settlement_job 코드 참조
    pass
```

---

## 9단계: 모니터링 및 유지보수

### 9.1 정기 백업 확인

NeonDB는 자동으로 7일 보관 백업을 제공합니다.

```bash
# 수동 백업 생성 (NeonDB 콘솔)
# Backups → Create Backup
```

### 9.2 인덱스 성능 모니터링

```sql
-- 인덱스 사용 통계
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 9.3 테이블 크기 확인

```sql
-- 테이블 크기 확인
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 트러블슈팅

### 문제: "Connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**해결**:
1. DATABASE_URL이 올바른지 확인
2. 네트워크 연결 확인
3. NeonDB 프로젝트 활성화 확인

### 문제: SSL 오류

```
SSL error: certificate verify failed
```

**해결**:
```python
# SQLAlchemy 엔진 옵션
create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": "require"},  # SSL 강제
)
```

### 문제: 느린 쿼리

```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM bookings WHERE therapist_id = 1;
```

**해결**: 인덱스 추가 또는 쿼리 최적화

### 문제: 연결 풀 고갈

```
QueuePool limit exceeded
```

**해결**:
```python
# 연결 풀 크기 증가
async_engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,  # 증가
    max_overflow=10,  # 초과 연결 허용
)
```

---

## 체크리스트

```
마이그레이션 실행 전
☐ NeonDB 프로젝트 생성
☐ 데이터베이스명 설정 (elspa_dev)
☐ 연결 문자열 복사
☐ .env 파일 생성 및 DATABASE_URL 설정
☐ .gitignore에 .env 추가

마이그레이션 실행
☐ 001_initial_schema.sql 실행 (테이블 생성)
☐ 002_add_indexes.sql 실행 (인덱스 추가)
☐ 003_seed_initial_data.sql 실행 (Mock 데이터)
☐ ANALYZE 실행 (통계 업데이트)

검증
☐ 테이블 개수 확인 (11개)
☐ 인덱스 개수 확인 (30+개)
☐ Mock 데이터 건수 확인 (therapists 90명, beds 86개 등)
☐ 정산 데이터 확인 (daily_settlements 7일)

프로덕션 배포
☐ 프로덕션 데이터베이스 생성 (elspa_prod)
☐ 프로덕션 마이그레이션 실행
☐ IP 화이트리스트 설정 (선택사항)
☐ 백업 정책 수립
☐ 모니터링 설정
☐ 정산 JOB 자동화

```

---

## 다음 단계

1. **API 개발**: FastAPI 라우터 작성
2. **프론트엔드 통합**: Next.js와 연동
3. **실시간 기능**: WebSocket 추가
4. **모니터링**: Sentry, DataDog 통합
5. **성능 최적화**: 캐싱, 읽기 복제본 설정

---

**문의사항**: team-e@elspa.local  
**마지막 업데이트**: 2026-05-13
