# 🛠️ ElSpa Manager - 개발팀 기술 제안서

**프로젝트명**: ElSpa Manager (마사지/스파 통합 자동화 플랫폼)  
**대상**: 개발팀, 아키텍트, QA 리더  
**작성일**: 2026-05-06  
**프로젝트 기간**: 2026-05-12 ~ 2026-08-31 (4개월)

---

## 📋 Executive Summary (개발자 관점)

### 프로젝트 개요
```
The ElSpa platform automates the entire spa/massage business workflow
with AI-powered chatbot (Claude API + LangGraph), real-time scheduling,
automatic settlement, and multi-tenant infrastructure.

기술 스택:
├─ Backend: FastAPI + LangGraph + Claude API
├─ Frontend: React 18 + Next.js 14
├─ Database: PostgreSQL + Redis
├─ Infrastructure: Cloudflare Workers + Supabase
├─ CI/CD: GitHub Actions
└─ Monitoring: Sentry + DataDog
```

### 개발 팀 구성 & 책임
```
Team: 6명 (4개월 프로젝트)

역할별 책임:
├─ Analyst (1명)
│  ├─ 비즈니스 요구사항 분석
│  ├─ 사용자 스토리 작성
│  └─ 성공 지표 정의
│
├─ PM/Scrum Master (1명)
│  ├─ 스프린트 계획 & 실행
│  ├─ 이해관계자 소통
│  └─ 위험 관리
│
├─ Architect (1명)
│  ├─ 시스템 설계 (API, DB, 배포)
│  ├─ 기술 선택 & 정당화
│  └─ 성능 & 보안 설계
│
├─ Backend Dev (2명)
│  ├─ API 개발 (FastAPI)
│  ├─ LangGraph 에이전트 구현
│  ├─ 데이터베이스 설계 & 마이그레이션
│  └─ 통합 테스트
│
├─ Frontend Dev (1명)
│  ├─ React 컴포넌트 개발
│  ├─ Next.js 페이지 라우팅
│  ├─ 상태 관리 (Zustand/React Query)
│  └─ 반응형 디자인
│
└─ QA Lead (1명)
   ├─ 테스트 계획 & 케이스 작성
   ├─ 자동화 테스트 (Jest, Cypress)
   ├─ 성능 테스트
   └─ 배포 전 검증
```

---

## 🏗️ 기술 아키텍처

### 1. 시스템 다이어그램
```
┌─────────────────────────────────────────────────────┐
│ Client Layer                                        │
├─────────────────────────────────────────────────────┤
│ ├─ Web (React + Next.js)     [Desktop/Tablet]      │
│ ├─ Mobile (React Native?)     [iOS/Android]        │
│ └─ Admin (Dashboard)          [Reporting/Analytics]│
└─────────────────────────────────────────────────────┘
                     │ REST API / WebSocket
                     ▼
┌─────────────────────────────────────────────────────┐
│ API Gateway Layer                                   │
├─────────────────────────────────────────────────────┤
│ ├─ Express.js / Hono Middleware                    │
│ ├─ JWT Auth + RBAC                                 │
│ ├─ Rate Limiting & DDoS Protection                 │
│ └─ Error Handling & Logging                        │
└─────────────────────────────────────────────────────┘
                     │ Internal APIs
                     ▼
┌─────────────────────────────────────────────────────┐
│ Business Logic Layer                                │
├─────────────────────────────────────────────────────┤
│ ├─ Chat Service (Message aggregation)              │
│ ├─ Booking Service (Conflict detection)            │
│ ├─ Finance Service (Auto settlement)               │
│ ├─ Employee Service (Performance tracking)         │
│ ├─ Driver Service (Route optimization)             │
│ ├─ Notification Service (Push/SMS/Email)           │
│ └─ Analytics Service (BI & Reporting)              │
└─────────────────────────────────────────────────────┘
                     │ Queries / Events
                     ▼
┌─────────────────────────────────────────────────────┐
│ Data Layer                                          │
├─────────────────────────────────────────────────────┤
│ ├─ PostgreSQL (Primary database)                   │
│ ├─ Redis (Cache + Session store)                   │
│ ├─ S3/MinIO (File storage)                         │
│ └─ Message Queue (Async jobs)                      │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ External APIs                                       │
├─────────────────────────────────────────────────────┤
│ ├─ Claude API (AI Chatbot)                        │
│ ├─ Kakao/Facebook Messenger (Channel integration)  │
│ ├─ Google Maps (Route optimization)                │
│ ├─ Twilio (SMS/Voice)                             │
│ └─ Stripe (Payment processing)                     │
└─────────────────────────────────────────────────────┘
```

### 2. 코어 모듈: LangGraph Chatbot

#### 2.1 아키텍처
```
graph TD
    A[고객 메시지] -->|메신저/카톡| B[Message Aggregator]
    B -->|통합 메시지| C[LangGraph Agent]
    
    C -->|1. Extract Services| D["서비스 추출 (Claude)"]
    D -->|2. Check Availability| E["DB 쿼리"]
    E -->|3. Generate Response| F["자연스러운 한국어 생성"]
    F -->|4. Create Booking| G["예약 생성"]
    G -->|5. Human Review| H["담당자 검증"]
    H -->|확인/수정| I["최종 예약 확정"]
    I -->|6. Notification| J["고객 알림 + 기록"]
```

#### 2.2 LangGraph 워크플로우 (의사코드)
```python
from langgraph.graph import StateGraph
from anthropic import Anthropic

class ElSpaAgent:
    def __init__(self):
        self.client = Anthropic()
        self.graph = StateGraph(State)
    
    def extract_services(self, message: str) -> dict:
        """Claude API로 서비스 추출"""
        response = self.client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            system="""당신은 마사지/스파 상담 전문가입니다.
            고객의 메시지에서 다음을 추출하세요:
            1. 원하는 서비스 (스웨디시, 오일마사지, 타이마사지 등)
            2. 선호하는 시간대
            3. 특이사항 (첫방문, 정확한 증상 등)
            """,
            messages=[{"role": "user", "content": message}]
        )
        return self.parse_response(response)
    
    def check_availability(self, services: list, time: str) -> list:
        """데이터베이스에서 가용 시간 확인"""
        query = """
        SELECT room_id, staff_id, available_time
        FROM availability
        WHERE service IN (:services)
        AND available_time = :time
        AND is_available = true
        """
        return db.execute(query, services=services, time=time)
    
    def generate_response(self, available: list) -> str:
        """자연스러운 한국어 응답 생성"""
        response = self.client.messages.create(
            model="claude-opus-4-5",
            max_tokens=500,
            system="""당신은 친절한 마사지 샵 상담원입니다.
            고객이 편하도록 자연스럽고 따뜻한 한국어로 응답하세요.
            선택지는 구체적으로 제시하세요.
            """,
            messages=[{
                "role": "user",
                "content": f"""가용 시간: {available}
                고객에게 친근하게 제시해주세요."""
            }]
        )
        return response.content[0].text
    
    def create_booking(self, booking_data: dict) -> str:
        """예약 생성 (Human-in-the-loop 전)"""
        booking = Booking(
            customer_id=booking_data["customer_id"],
            service=booking_data["service"],
            time=booking_data["time"],
            staff_id=booking_data["staff_id"],
            status="pending_approval"  # 담당자 검증 필요
        )
        db.session.add(booking)
        db.session.commit()
        return booking.id
```

---

## 📊 데이터베이스 스키마 (핵심)

### Core Tables
```sql
-- 고객 (Customers)
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    channels JSON,  -- {"kakao": "...", "messenger": "..."}
    preferences JSON,
    created_at TIMESTAMP
);

-- 예약 (Bookings)
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    service_id UUID REFERENCES services(id),
    staff_id UUID REFERENCES staff(id),
    room_id UUID REFERENCES rooms(id),
    booking_time TIMESTAMP,
    duration_minutes INT,
    price DECIMAL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    created_at TIMESTAMP,
    UNIQUE(room_id, booking_time, duration_minutes)  -- 중복 예약 방지
);

-- 서비스 (Services)
CREATE TABLE services (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    duration_minutes INT,
    price DECIMAL,
    category VARCHAR(50),
    is_active BOOLEAN
);

-- 직원 (Staff)
CREATE TABLE staff (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('therapist', 'driver', 'manager'),
    specializations JSON,
    hourly_rate DECIMAL,
    monthly_fixed_salary DECIMAL,
    commission_rate DECIMAL,
    created_at TIMESTAMP
);

-- 정산 (Transactions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    staff_id UUID REFERENCES staff(id),
    amount DECIMAL,
    commission DECIMAL,
    transaction_date TIMESTAMP,
    settlement_month DATE,
    status ENUM('pending', 'settled', 'paid')
);

-- 채팅 메시지 (Messages)
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    channel VARCHAR(20),  -- 'kakao', 'messenger', 'sms'
    content TEXT,
    is_from_ai BOOLEAN,
    booking_id UUID REFERENCES bookings(id),
    created_at TIMESTAMP
);
```

---

## 🔄 API 스펙 (주요 엔드포인트)

### 1. 채팅 API
```
POST /api/chat/send
├─ Body:
│  ├─ customer_id: UUID
│  ├─ message: string
│  ├─ channel: 'kakao' | 'messenger' | 'sms'
│  └─ context?: object
├─ Response:
│  ├─ message_id: UUID
│  ├─ ai_response: string
│  ├─ booking?: {
│  │  ├─ booking_id: UUID
│  │  ├─ service: string
│  │  ├─ time: datetime
│  │  └─ status: 'pending_approval'
│  │  }
│  └─ requires_human_review: boolean

POST /api/chat/approve-booking
├─ Body:
│  ├─ booking_id: UUID
│  ├─ staff_id: UUID (검증자)
│  ├─ notes?: string
│  └─ changes?: object
├─ Response:
│  ├─ status: 'confirmed'
│  ├─ notification_sent: boolean
│  └─ updated_at: datetime
```

### 2. 예약 API
```
GET /api/bookings/availability
├─ Query:
│  ├─ service_id: UUID
│  ├─ date: YYYY-MM-DD
│  ├─ time_from: HH:mm
│  ├─ time_to: HH:mm
│  └─ duration_minutes: int
├─ Response:
│  ├─ available_slots: [{time, staff_id, room_id}]
│  └─ booking_instructions: string

POST /api/bookings
├─ Body: {booking_data}
├─ Response:
│  ├─ booking_id: UUID
│  ├─ confirmation_token: string
│  └─ status: 'confirmed' | 'pending_approval'

PUT /api/bookings/{booking_id}
├─ Body: {updated_data}
├─ Response: updated_booking

DELETE /api/bookings/{booking_id}
├─ Response: {cancelled_at, refund_status}
```

### 3. 정산 API
```
GET /api/settlements/monthly/{year}/{month}
├─ Response:
│  ├─ period: '2026-05'
│  ├─ staff_settlements: [{
│  │  ├─ staff_id: UUID
│  │  ├─ name: string
│  │  ├─ basic_salary: decimal
│  │  ├─ commissions: decimal
│  │  ├─ bonuses: decimal
│  │  ├─ total: decimal
│  │  └─ payment_date: date
│  │  }]
│  └─ total_payout: decimal

POST /api/settlements/approve
├─ Body: {settlement_id, approver_id}
├─ Response: {approved_at, payment_scheduled}
```

### 4. 분석 대시보드 API
```
GET /api/analytics/dashboard
├─ Query: {date_from, date_to, group_by: 'day'|'week'|'month'}
├─ Response:
│  ├─ total_revenue: decimal
│  ├─ total_bookings: int
│  ├─ customer_count: int
│  ├─ average_satisfaction: float (0-5)
│  ├─ top_services: [{service, count, revenue}]
│  ├─ top_staff: [{staff, revenue, rating}]
│  └─ trends: {daily_revenue_trend}

GET /api/analytics/customer/{customer_id}
├─ Response:
│  ├─ visit_count: int
│  ├─ total_spent: decimal
│  ├─ favorite_service: string
│  ├─ preferred_time: string
│  ├─ last_visit: datetime
│  └─ churn_risk: float (0-1)
```

---

## 🧪 테스트 전략

### 1. 단위 테스트 (Jest)
```javascript
// services/chatbot.test.ts
describe('ChatbotService', () => {
    describe('extractServices', () => {
        it('should extract service and time from message', async () => {
            const message = "내일 오후 3시에 스웨디시 받고 싶어요";
            const result = await chatbot.extractServices(message);
            
            expect(result.service).toBe('스웨디시');
            expect(result.preferredTime).toBe('15:00');
        });
        
        it('should handle missing preferences', async () => {
            const message = "예약 가능한가요?";
            const result = await chatbot.extractServices(message);
            
            expect(result.service).toBeNull();
            expect(result.requiresFollowUp).toBe(true);
        });
    });
    
    describe('checkConflicts', () => {
        it('should prevent double-booking', async () => {
            const booking1 = await db.createBooking({...});
            
            expect(async () => {
                await db.createBooking({...same_time...});
            }).rejects.toThrow('Booking conflict');
        });
    });
});
```

### 2. 통합 테스트 (Supertest)
```javascript
describe('Booking API', () => {
    it('should create booking with AI response', async () => {
        const response = await request(app)
            .post('/api/chat/send')
            .send({
                customer_id: '...',
                message: '내일 오후 3시 스웨디시',
                channel: 'kakao'
            });
        
        expect(response.status).toBe(201);
        expect(response.body.booking.status).toBe('pending_approval');
        expect(response.body.ai_response).toContain('확인하겠습니다');
    });
});
```

### 3. E2E 테스트 (Cypress)
```javascript
describe('Customer Journey', () => {
    it('should complete booking from message to confirmation', () => {
        cy.visit('https://elspa.example.com');
        cy.get('[data-cy=chat-input]').type('내일 오후 3시 스웨디시');
        cy.get('[data-cy=send-button]').click();
        
        cy.get('[data-cy=ai-response]').should('contain', '시간 확인');
        cy.get('[data-cy=time-option]').first().click();
        cy.get('[data-cy=confirm-button]').click();
        
        cy.get('[data-cy=success-message]').should('be.visible');
    });
});
```

### 4. 성능 테스트 (k6)
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    vus: 100,  // 100 concurrent users
    duration: '30s'
};

export default function () {
    let response = http.post(
        'https://api.elspa.example.com/api/chat/send',
        JSON.stringify({
            customer_id: __VU,
            message: '내일 오후 3시 스웨디시',
            channel: 'kakao'
        })
    );
    
    check(response, {
        'status is 201': (r) => r.status === 201,
        'response time < 500ms': (r) => r.timings.duration < 500
    });
}
```

---

## 🚀 배포 전략

### Phase 1: MVP (7월)
```
배포 대상: Cloudflare Workers + Supabase

단계:
1. Backend: FastAPI + LangGraph
   ├─ 채팅 에이전트
   ├─ 예약 생성/관리
   └─ 기본 정산

2. Frontend: React Web
   ├─ 고객 예약 인터페이스
   ├─ 직원 대시보드
   └─ 관리자 콘솔

3. Infrastructure:
   ├─ PostgreSQL (Supabase)
   ├─ Redis Cache
   ├─ GitHub Actions CI/CD
   └─ Sentry 모니터링

성공 기준:
- 99.5% 가용성
- <3초 응답 시간
- 초기 사용자 만족도 >4.0/5.0
```

### Phase 2: v1.5 (8월)
```
추가 기능:

1. 마케팅 자동화
   ├─ SNS 자동 포스팅
   ├─ 고객 재방문 알림
   └─ 프로모션 자동 전송

2. 분석 강화
   ├─ 실시간 대시보드
   ├─ 고객 분석
   └─ 직원 성과 추적

3. 성능 최적화
   ├─ CDN 캐싱
   ├─ 데이터베이스 인덱싱
   └─ 이미지 최적화

4. 보안 강화
   ├─ 데이터 암호화
   ├─ 정기 보안 감사
   └─ GDPR 준수
```

---

## 📈 프로젝트 일정 (Gantt)

```
5월:
├─ [====] 분석 & 설계 (20일)
├─ [====] 개발 환경 준비 (15일)
└─ [==] Kickoff 미팅 (5일)

6월:
├─ [========] 상세 설계 (20일)
├─ [========] Backend 구현 (25일)
├─ [======] Frontend 기본 (15일)
└─ [===] 테스트 기본 설계 (10일)

7월:
├─ [==========] MVP 완성 (25일)
├─ [=========] 통합 테스트 (20일)
├─ [====] Cloudflare 배포 (15일)
└─ [====] 초기 사용자 테스트 (10일)

8월:
├─ [==========] v1.5 개발 (25일)
├─ [====] 성능 최적화 (10일)
├─ [===] 최종 QA (10일)
└─ [===] Go-Live 준비 (5일)
```

---

## ⚠️ 기술 리스크 & 완화 방안

| 리스크 | 확률 | 심각도 | 완화 방안 |
|------|------|--------|---------|
| **Claude API 비용 초과** | 중간 | 중간 | Rate limiting + Caching |
| **LangGraph 학습곡선** | 중간 | 중간 | 문서 작성 + 워크숍 |
| **데이터베이스 성능** | 낮음 | 높음 | 인덱싱 + 쿼리 최적화 |
| **AI 응답 오류** | 낮음 | 높음 | Human-in-the-loop + 검증 |
| **배포 장애** | 낮음 | 높음 | Blue-green 배포 + Rollback |

---

## 📚 개발 리소스

### 문서
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [LangGraph 가이드](https://langchain-ai.github.io/langgraph/)
- [Claude API 레퍼런스](https://docs.anthropic.com/)
- [PostgreSQL 최적화](https://www.postgresql.org/docs/)

### 도구
```
IDE: VS Code + Python Extension
Debugger: pdb + VS Code Debugger
Database: pgAdmin4 + DBeaver
API Testing: Postman / Insomnia
Version Control: Git + GitHub
CI/CD: GitHub Actions
Monitoring: Sentry + New Relic
```

### 학습
- LangGraph 튜토리얼 완료 (3일)
- Claude API integration 워크숍 (2일)
- 시스템 아키텍처 리뷰 (1일)
- 코드 리뷰 프로세스 정립 (1일)

---

## 🎯 성공 지표

### 개발 KPIs
```
✅ 코드 커버리지: >80%
✅ 버그 밀도: <1 bug / 100 LOC
✅ 빌드 성공률: 99.5%+
✅ 배포 실패율: <5%
✅ 평균 버그 수정 시간: <4시간
```

### 성능 KPIs
```
✅ API 응답 시간: <200ms (p99)
✅ 채팅 응답: <3초
✅ 예약 정확도: >99.9%
✅ 가용성: >99.5%
✅ 정산 자동화율: >99%
```

### 품질 KPIs
```
✅ 사용자 만족도: >4.0/5.0
✅ 오류율: <0.1%
✅ 재방문율: >75%
✅ 직원 만족도: >4.0/5.0
```

---

## 💡 베스트 프랙티스

### 코딩 컨벤션
```python
# 파일 구조
app/
├─ api/
│  ├─ routes/
│  │  ├─ chat.py      # 채팅 관련
│  │  ├─ bookings.py  # 예약 관련
│  │  └─ ...
│  ├─ schemas/        # Pydantic models
│  └─ dependencies.py
├─ services/
│  ├─ chatbot.py
│  ├─ booking.py
│  └─ ...
├─ models/           # SQLAlchemy ORM
├─ core/
│  ├─ config.py
│  ├─ security.py
│  └─ logging.py
└─ main.py

# 네이밍
- classes: PascalCase (ChatbotService)
- functions: snake_case (extract_services)
- constants: UPPER_SNAKE_CASE (MAX_RETRIES)
- private: _snake_case (_internal_method)

# 타입 힌트 필수
def extract_services(message: str) -> dict[str, Any]:
    pass

# 에러 처리
try:
    result = await process_booking(...)
except BookingConflictError as e:
    logger.error(f"Booking conflict: {e}")
    raise HTTPException(status_code=409, detail=str(e))
```

### Git Workflow
```
Branch naming:
├─ main            (프로덕션)
├─ develop         (개발 베이스)
├─ feature/***     (기능)
├─ bugfix/***      (버그 수정)
└─ hotfix/***      (긴급 수정)

Commit messages:
├─ feat: 새 기능
├─ fix: 버그 수정
├─ refactor: 코드 정리
├─ test: 테스트 추가
├─ docs: 문서 수정
└─ chore: 설정 변경

예: 
git commit -m "feat: add AI chatbot for booking automation"
git commit -m "fix: prevent double-booking race condition"
```

### Code Review
```
Pull Request 체크리스트:
- [ ] 테스트 작성 (단위 + 통합)
- [ ] 타입 체크 통과 (mypy)
- [ ] Linting 통과 (flake8)
- [ ] 성능 영향 없음
- [ ] 보안 취약점 없음
- [ ] 문서/주석 업데이트
- [ ] CHANGELOG 업데이트
```

---

## 📞 커뮤니케이션

### 일일 스탠드업 (09:30, 30분)
```
각 팀원이 공유:
1. 어제 완료한 것
2. 오늘 할 것
3. 블로커/이슈
```

### 주간 기술 토론 (수요일 14:00, 1시간)
```
1. 아키텍처 리뷰
2. 기술 문제 해결
3. 베스트 프랙티스 공유
```

### 월간 회고 (마지막 금요일, 1시간)
```
1. 스프린트 성과 평가
2. 학습한 점 공유
3. 다음달 개선사항
```

---

## ✅ 개발팀 체크리스트

### 프로젝트 시작 (5월 12일)
- [ ] GitHub 리포지토리 생성
- [ ] 개발 환경 설정
- [ ] 데이터베이스 스키마 생성
- [ ] CI/CD 파이프라인 구축
- [ ] 코딩 컨벤션 정의
- [ ] 첫 API 엔드포인트 구현

### MVP 완성 (7월 31일)
- [ ] 모든 핵심 기능 구현
- [ ] 테스트 커버리지 >80%
- [ ] 성능 테스트 통과
- [ ] 보안 감사 완료
- [ ] 배포 매뉴얼 작성
- [ ] 운영팀 교육 완료

### v1.5 완성 (8월 31일)
- [ ] 마케팅 자동화 구현
- [ ] 분석 대시보드 완성
- [ ] 성능 최적화 완료
- [ ] 최종 QA 통과
- [ ] 프로덕션 배포

---

**작성**: Kenneth (kangjichul@hanmail.net)  
**아키텍트**: (확보 예정)  
**버전**: 1.0 (Technical Specification)  
**다음 검토**: 2026-05-20
