# ElSpa Backend 개발 대화 기록

**날짜**: 2026-05-06  
**주제**: Supabase 연결, API 라우터, AI 아키텍처 이해

---

## 📋 대화 내용

### 1️⃣ Supabase 데이터베이스 연결

**요청**: 데이타베이스 연결하자

**작업 완료**:
- ✅ requirements.txt 생성 (FastAPI, SQLAlchemy, Supabase 클라이언트)
- ✅ .env 파일 설정 (Supabase 연결 정보)
- ✅ app/config.py (설정 관리)
- ✅ app/database.py (PostgreSQL 비동기 연결)
- ✅ main.py (FastAPI 앱 초기화)
- ✅ test_supabase.py (연결 테스트 스크립트)
- ✅ docker-compose.yml (Redis 개발환경)
- ✅ QUICK_START.md, SUPABASE_SETUP.md (가이드 문서)

**Supabase 정보**:
```
Project URL: https://xmdjtkvauhngofsckrwa.supabase.co
Publishable Key: <SUPABASE_PUBLISHABLE_KEY>  # ⚠️ 마스킹됨 (재발급 필요)
Secret Key: <SUPABASE_SECRET_KEY>  # ⚠️ 마스킹됨 (재발급 필요)
JWT (anon): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT (service_role): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2️⃣ SQLAlchemy 모델 및 API 라우터

**요청**: 알아서

**작업 완료**:

#### 📊 데이터 모델 (6개)
```
├── Customer (id, name, phone, email, memo)
├── Service (id, name, price, duration_minutes, description)
├── Booking (id, customer_id, service_id, booking_date, time_slot, status)
├── Staff (id, name, phone, position, is_active)
├── Transaction (id, booking_id, customer_id, amount, payment_method, status)
└── Chat (id, customer_id, message, sender, channel, ai_response, status)
```

#### 🔌 API 라우터 (4개)
```
GET    /api/customers              # 고객 목록
POST   /api/customers              # 고객 등록
PUT    /api/customers/{id}         # 고객 수정
DELETE /api/customers/{id}         # 고객 삭제

GET    /api/services               # 서비스 목록
POST   /api/services               # 서비스 등록
PUT    /api/services/{id}          # 서비스 수정

GET    /api/bookings               # 예약 목록
POST   /api/bookings               # 예약 생성
PUT    /api/bookings/{id}          # 예약 수정
DELETE /api/bookings/{id}          # 예약 취소

GET    /api/chats                  # 채팅 목록
POST   /api/chats                  # 채팅 생성
PUT    /api/chats/{id}             # 채팅 수정
```

#### 📋 Pydantic 스키마
```
- CustomerCreate, CustomerUpdate, CustomerResponse
- ServiceCreate, ServiceUpdate, ServiceResponse
- BookingCreate, BookingUpdate, BookingResponse
- ChatCreate, ChatUpdate, ChatResponse
```

**Git 커밋**: `69a6d08` - SQLAlchemy 모델 및 API 라우터 구현

---

### 3️⃣ LangGraph가 AI의 역할을 대신하는가?

**질문**: 2.langgraph가 ai의 역활을 대신하는가?

**답변**: **아니요**

#### 역할 비교

| 항목 | LangGraph | Claude API |
|------|-----------|-----------|
| **역할** | 워크플로우 관리 (지휘자) | AI 추론 (악사) |
| **처리** | 단계별 실행 흐름 | 자연어 이해/생성 |
| **예시** | "1단계→2단계→3단계" | "한국어로 친절하게 답변" |
| **AI 역할 수행?** | ❌ 불가능 | ✅ 가능 |

#### ElSpa 예시 (상담 에이전트)

```
사용자: "내일 10시 스웨디시 가능한가요?"
      ↓
LangGraph [단계 1: 의도 파악]
  └→ Claude Haiku 호출 (서비스 추출)
      ↓
LangGraph [단계 2: 정보 조회]
  └→ DB에서 스케줄 조회
      ↓
LangGraph [단계 3: AI 응답 생성]
  └→ Claude Sonnet 호출 (자연스러운 한국어)
      ↓
LangGraph [단계 4: 예약 생성]
  └→ DB에 저장
      ↓
고객에게 응답 전달
```

#### 비유
```
LangGraph = 지휘자 🎼
Claude API = 악사 🎺

지휘자는 악사에게 언제 연주할지, 어떤 악보를 연주할지 지시하지만,
실제 음악을 만드는 건 악사입니다.
```

---

### 4️⃣ LangGraph는 MCP인가?

**질문**: langgraph는 mcp인가?

**답변**: **아니요**

#### 개념 비교

| 항목 | LangGraph | MCP |
|------|-----------|-----|
| **정의** | Python 라이브러리 | 프로토콜 (통신 약속) |
| **용도** | 워크플로우 구성 | 모델↔도구 통신 |
| **설치** | `pip install langgraph` | 환경 설정 필요 |
| **언어** | Python | 언어 무관 |

#### 역할

**LangGraph**: 
```python
from langgraph.graph import StateGraph

graph = StateGraph(AgentState)
graph.add_node("step1", extraction_node)
graph.add_node("step2", validation_node)
```

**MCP** (Claude Code 환경):
```
Claude ←MCP→ [도구들]
            ├─ 파일 읽기
            ├─ 터미널 실행
            ├─ Gmail 접근
            └─ 등등...
```

#### ElSpa에서의 위치
```
Claude Code (MCP 사용) ← 개발 중
    ↓
ElSpa Backend (FastAPI)
    ↓
LangGraph (상담 에이전트) ← 우리가 만드는 것
    ↓
Claude API (실제 추론)
```

---

### 5️⃣ BMAD는?

**질문**: bmad는?

**답변**: **다중 에이전트 AI 개발 방법론**

#### BMAD 역할 분담

```
Analyst      → 비즈니스 분석 (요구사항, 시장 분석)
  ↓
PM           → 제품 기획 (기능 정의, 우선순위)
  ↓
UX/Architect → 설계 (기술 스택, 아키텍처)
  ↓
Developer    → 구현 (코드 작성)
  ↓
QA           → 테스트 (품질 보증)
```

#### ElSpa BMAD 진행도

```
✅ Analysis (완료)
   - 프로젝트 브리프
   - 고급 분석
   - 비용 분석

✅ Planning (완료)
   - PRD
   - UX 스펙
   - 로드맵

✅ Solutioning (완료)
   - 아키텍처
   - 에픽 & 스토리
   - 마이크로서비스 설계

🔄 Development (진행 중)
   - FastAPI + SQLAlchemy
   - LangGraph 에이전트
   - API 라우터

⏳ QA (예정)
   - 테스트
   - 성능 최적화
```

---

## 🎯 주요 개념 정리

### 아키텍처 계층

```
presentation (사용자 인터페이스)
    ↓
API Layer (FastAPI 라우터)
    ↓
Business Logic (LangGraph 에이전트)
    ↓
AI Layer (Claude API)
    ↓
Data Layer (Supabase PostgreSQL)
```

### AI 역할 정의

```
LangGraph     = 관리자 👔 (무엇을 할지 결정)
Claude API    = 뇌 🧠 (어떻게 할지 결정)
FastAPI       = 통신원 📞 (누구와 연락할지)
Supabase      = 데이터베이스 💾 (정보 저장)
```

---

## 📁 생성된 파일

### 프로젝트 구조
```
elspa/
├── main.py                              # FastAPI 앱
├── requirements.txt                     # 패키지 의존성
├── .env                                 # 환경 변수
├── test_supabase.py                     # 연결 테스트
├── docker-compose.yml                   # Redis
├── QUICK_START.md                       # 빠른 시작
├── SUPABASE_SETUP.md                    # 상세 가이드
├── CONVERSATION_2026-05-06.md           # 이 파일
│
└── app/
    ├── config.py                        # 설정
    ├── database.py                      # DB 연결
    ├── models/
    │   ├── customer.py
    │   ├── service.py
    │   ├── booking.py
    │   ├── staff.py
    │   ├── transaction.py
    │   └── chat.py
    ├── schemas/
    │   ├── customer.py
    │   ├── service.py
    │   ├── booking.py
    │   └── chat.py
    └── routers/
        ├── customers.py
        ├── services.py
        ├── bookings.py
        └── chats.py
```

---

## ✨ 다음 단계

### 우선순위 순서

1. **마이그레이션 스크립트** (Alembic)
   - 테이블 자동 생성
   
2. **LangGraph 에이전트** 
   - consultation_agent.py (상담)
   - scheduling_agent.py (스케줄)
   - settlement_agent.py (정산)

3. **네트워크 복원력**
   - Retry + Exponential Backoff
   - Circuit Breaker

4. **실시간 기능**
   - WebSocket (스케줄 업데이트)
   - 배치 처리 (Bull)

5. **테스트 & 최적화**
   - Unit 테스트
   - 성능 테스트
   - Prompt Caching

---

**작성**: Claude Code (AI)  
**상태**: 🟢 Ready for Next Phase  
**커밋**: 69a6d08 (SQLAlchemy + API)
