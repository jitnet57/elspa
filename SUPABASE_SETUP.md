# Supabase 데이터베이스 연결 가이드

## ✅ 설정 완료 사항

### 1. 프로젝트 구조
```
elspa/
├── main.py              # FastAPI 진입점
├── requirements.txt     # 의존성 설치
├── .env                 # 환경 변수 (Supabase 연결 정보 포함)
├── .env.example         # 템플릿
├── docker-compose.yml   # Redis 개발 환경
└── app/
    ├── __init__.py
    ├── config.py        # 설정 관리
    ├── database.py      # PostgreSQL 연결
    ├── models/          # ORM 모델
    ├── routers/         # API 엔드포인트
    ├── services/        # 비즈니스 로직
    ├── agents/          # LangGraph 에이전트
    └── utils/           # 유틸리티
```

### 2. Supabase 연결 정보
```
Project URL: https://<YOUR_PROJECT_ID>.supabase.co
Publishable Key: <YOUR_PUBLISHABLE_KEY>
Database: postgresql://
```

---

## 🚀 시작하기

### Step 1: 패키지 설치
```bash
pip install -r requirements.txt
```

### Step 2: Redis 시작 (선택사항)
```bash
docker-compose up -d
```

### Step 3: 환경 변수 수정
`.env` 파일에서 **Supabase 비밀번호** 추가:

```bash
# Supabase Dashboard에서 Database 비밀번호 확인
# https://app.supabase.com/project/<YOUR_PROJECT_ID>/settings/database

DATABASE_URL=postgresql://postgres:{YOUR_PASSWORD}@<YOUR_PROJECT_ID>.supabase.co:5432/postgres
```

### Step 4: API 시작
```bash
python main.py
# 또는
uvicorn main:app --reload
```

### Step 5: 헬스 체크
```bash
curl http://localhost:8000/health
```

응답:
```json
{
  "status": "🟢 Healthy",
  "api_version": "0.1.0",
  "database": "✅ Connected",
  "supabase": "https://<YOUR_PROJECT_ID>.supabase.co"
}
```

---

## 📊 Supabase 대시보드 접근

### SQL Editor
1. https://app.supabase.com 접속
2. 프로젝트 선택: `<YOUR_PROJECT_ID>`
3. **SQL Editor** 탭에서 쿼리 실행

### 테이블 생성 예시
```sql
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  service_id BIGINT REFERENCES services(id),
  booking_date DATE,
  time_slot VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 SQLAlchemy 모델 작성 예시

### `app/models/customer.py`
```python
from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

### `app/models/service.py`
```python
from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2))
    duration_minutes = Column(Integer)
    description = Column(String)
    created_at = Column(DateTime, default=func.now())
```

---

## 🧪 데이터베이스 연결 테스트

### `test_db.py`
```python
import asyncio
from app.database import async_engine, Base


async def test_connection():
    """Supabase 연결 테스트"""
    try:
        async with async_engine.connect() as conn:
            result = await conn.execute(("SELECT 1"))
            print("✅ Supabase 데이터베이스 연결 성공!")
            return True
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    exit(0 if success else 1)
```

실행:
```bash
python test_db.py
```

---

## 🔐 보안 주의사항

### ⚠️ 환경 변수 보안
- `.env` 파일은 Git에 커밋하지 않기
- `.gitignore` 추가:
  ```
  .env
  .env.local
  ```

### ⚠️ Supabase 키 관리
- Publishable Key는 공개 가능 (프론트엔드용)
- Secret Key는 절대 공개하지 말 것 (백엔드용만)
- 키 로테이션: https://app.supabase.com/project/<YOUR_PROJECT_ID>/settings/api

---

## 📝 다음 단계

1. **SQLAlchemy 모델 정의**
   - Customer, Service, Booking, Staff, Transaction

2. **API 라우터 작성**
   - POST /api/chats
   - CRUD /api/bookings
   - GET /api/schedule
   - GET /api/finance

3. **LangGraph 에이전트 구현**
   - consultation_agent.py
   - scheduling_agent.py
   - settlement_agent.py

4. **네트워크 복원력**
   - Retry + Exponential Backoff
   - Circuit Breaker 구현

---

**최종 수정**: 2026-05-06  
**상태**: 🟢 Ready for Database Operations
