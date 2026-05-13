# 🚀 ElSpa Manager - 빠른 시작 가이드

## ✅ 현재 상태

| 항목 | 상태 |
|------|------|
| Supabase 연결 정보 | ✅ 완료 |
| FastAPI 프로젝트 | ✅ 초기화됨 |
| 환경 변수 설정 | ✅ 거의 완료 |
| Docker 개발환경 | ✅ 준비됨 |

---

## ⚠️ 남은 작업 (필수 1가지)

### 🔐 DATABASE_URL 비밀번호 추가

`.env` 파일의 다음 줄을 수정:

```bash
# 현재 상태 (수정 필요):
DATABASE_URL=postgresql://postgres:password@<YOUR_PROJECT_ID>.supabase.co:5432/postgres

# 수정 후:
DATABASE_URL=postgresql://postgres:{YOUR_PASSWORD}@<YOUR_PROJECT_ID>.supabase.co:5432/postgres
```

**비밀번호 찾는 방법:**
1. https://app.supabase.com/project/<YOUR_PROJECT_ID>/settings/database 접속
2. **Connection string** 섹션에서 `[YOUR_PASSWORD]` 확인
3. 위의 `{YOUR_PASSWORD}` 자리에 복사 붙여넣기

---

## 🚀 실행 명령어

### 1️⃣ 패키지 설치
```bash
pip install -r requirements.txt
```

### 2️⃣ Redis 시작 (선택사항)
```bash
docker-compose up -d
```

### 3️⃣ API 서버 시작
```bash
# 방법 1: 직접 실행
python main.py

# 방법 2: Uvicorn (hot reload 포함)
uvicorn main:app --reload --port 8000
```

### 4️⃣ 헬스 체크
```bash
curl http://localhost:8000/health
```

응답 예시:
```json
{
  "status": "🟢 Healthy",
  "api_version": "0.1.0",
  "database": "✅ Connected",
  "supabase": "https://<YOUR_PROJECT_ID>.supabase.co"
}
```

---

## 🧪 연결 테스트

```bash
python test_supabase.py
```

출력 예시:
```
============================================================
🧪 Supabase 연결 통합 테스트
============================================================

🔍 Supabase 연결 테스트 시작...

📋 환경 변수 상태:
  DATABASE_URL: ✅ 설정됨
  SUPABASE_URL: ✅ 설정됨
  SUPABASE_KEY: ✅ 설정됨
  SUPABASE_SECRET_KEY: ✅ 설정됨

🎉 모든 테스트 통과!
```

---

## 📚 Supabase 토큰 정보

| 토큰 | 역할 | 사용처 |
|------|------|--------|
| **Publishable Key** | 프론트엔드 클라이언트 | React/Next.js 앱 |
| **Secret Key** | 백엔드 관리 | API 서버 (보안) |
| **JWT (anon)** | 익명 사용자 | 공개 API 호출 |
| **JWT (service_role)** | 서버 권한 | 관리 작업 |

---

## 📁 프로젝트 구조

```
elspa/
├── main.py                    # ⭐ FastAPI 앱 시작점
├── requirements.txt           # 패키지 의존성
├── .env                       # 🔐 환경 변수 (비공개)
├── .env.example               # 📋 템플릿
├── test_supabase.py          # 🧪 연결 테스트
├── docker-compose.yml         # 🐳 Redis 개발환경
│
├── app/
│   ├── config.py             # 설정 관리
│   ├── database.py           # ✅ Supabase 연결
│   ├── models/               # SQLAlchemy ORM 모델
│   │   ├── customer.py       # (예정)
│   │   ├── booking.py        # (예정)
│   │   └── ...
│   ├── routers/              # API 엔드포인트
│   │   ├── chats.py         # (예정)
│   │   ├── bookings.py      # (예정)
│   │   └── ...
│   ├── services/             # 비즈니스 로직
│   ├── agents/               # LangGraph 에이전트
│   └── utils/                # 유틸리티 함수
│
└── SUPABASE_SETUP.md         # 📖 상세 가이드
```

---

## 🔄 API 엔드포인트 (예정)

```bash
# 헬스 체크
GET /health

# 채팅
POST /api/chats
GET /api/chats/{id}

# 예약
GET /api/bookings
POST /api/bookings
PUT /api/bookings/{id}
DELETE /api/bookings/{id}

# 스케줄
GET /api/schedule
WS /ws/schedule

# 정산
GET /api/finance
```

---

## 📋 다음 단계 (체크리스트)

### Week 1: Setup
- [ ] DATABASE_URL 비밀번호 추가
- [ ] 연결 테스트 (`python test_supabase.py`)
- [ ] SQLAlchemy 모델 정의 (Customer, Service, Booking, Staff, Transaction)
- [ ] Alembic 마이그레이션 스크립트

### Week 2: Core Features
- [ ] Chat API (메신저/카톡 통합)
- [ ] LangGraph Consultation Agent
- [ ] Booking API (CRUD)
- [ ] Retry + Circuit Breaker 구현

### Week 3: Advanced
- [ ] WebSocket Schedule API
- [ ] Finance API (정산 자동화)
- [ ] Bull 배치 처리
- [ ] Prompt Caching 최적화

### Week 4: Resilience
- [ ] 오프라인 모드 (Frontend)
- [ ] 경량 모델 자동 선택
- [ ] 모니터링 & 로깅
- [ ] 성능 테스트

---

## 🐛 문제 해결

### "Database connection refused"
```
원인: DATABASE_URL의 비밀번호가 틀림
해결: Supabase 대시보드에서 올바른 비밀번호 확인
```

### "Module not found: sqlalchemy"
```
원인: requirements.txt 설치 안 됨
해결: pip install -r requirements.txt
```

### "ANTHROPIC_API_KEY not set"
```
원인: Claude API 키 미설정
해결: .env 파일에 ANTHROPIC_API_KEY 추가
```

---

## 🔗 유용한 링크

- 🔐 Supabase 대시보드: https://app.supabase.com/project/<YOUR_PROJECT_ID>
- 📖 FastAPI 공식 문서: https://fastapi.tiangolo.com
- 🔗 LangChain 공식 문서: https://python.langchain.com
- 📚 Supabase Python 문서: https://supabase.com/docs/reference/python/introduction

---

## ✨ 완료!

모든 준비가 완료되었습니다. 이제:

```bash
# 1. 비밀번호 추가
# (.env 파일 수정)

# 2. 테스트 실행
python test_supabase.py

# 3. API 시작
python main.py

# 4. 브라우저에서 확인
# http://localhost:8000/health
```

**날짜**: 2026-05-06  
**상태**: 🟢 Ready for Development
