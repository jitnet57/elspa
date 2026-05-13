# 마사지/스파 통합 플랫폼 - 기술 아키텍처
**Phase 3: Architecture Design | Date: 2026-05-05**

---

## 1. 아키텍처 개요

### 1.1 시스템 전체 구성

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Layer (Frontend)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Web App      │  │ Mobile App   │  │ Driver App   │       │
│  │ (React)      │  │ (React Native)   │ (React Native)│       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                 │                │
└─────────┼──────────────────┼─────────────────┼────────────────┘
          │                  │                 │
          └──────────────────┼─────────────────┘
                            │ HTTPS/WebSocket
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Express.js / Next.js API Routes                      │   │
│  │ - 인증/권한 검증                                      │   │
│  │ - 요청 로깅/레이트 리미팅                            │   │
│  │ - 에러 처리 & 표준화                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ External API Integrations                            │   │
│  │ - Facebook/Instagram Messenger API                   │   │
│  │ - Kakao API (카톡)                                   │   │
│  │ - Google Sheets API                                  │   │
│  │ - Google Maps Distance Matrix API                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LangGraph Agent Orchestration                        │   │
│  │ - 상담 자동화 에이전트 (Claude API)                   │   │
│  │ - 스케줄 최적화 에이전트                              │   │
│  │ - 정산 자동화 에이전트                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
          │
          │ Internal APIs
          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Auth Service│  │ Chat Service│  │ Scheduling Service   │ │
│  ├─────────────┤  ├─────────────┤  ├──────────────────────┤ │
│  │ JWT/Session │  │ Message     │  │ Calendar Management  │ │
│  │ RBAC        │  │ Parser      │  │ Room/Staff Conflicts │ │
│  │ 2FA/OAuth   │  │ History     │  │ Optimization         │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Booking Svc │  │ Finance Svc │  │ Driver Service       │ │
│  ├─────────────┤  ├─────────────┤  ├──────────────────────┤ │
│  │ Create/Upd  │  │ Transaction │  │ Geolocation          │ │
│  │ Conflict Chk│  │ Settlement  │  │ Route Optimization   │ │
│  │ Confirm     │  │ Reporting   │  │ Assignment Logic     │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Employee Service        │ Notification Service       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Profile Management      │ Push/SMS/Email             │   │
│  │ Performance Tracking    │ Real-time WebSocket        │   │
│  │ Discipline Records      │                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
          │
          │ SQL/Cache queries
          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Data Layer                                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ PostgreSQL       │  │ Redis Cache      │                  │
│  │ (Primary DB)     │  │ (Session/Rate)   │                  │
│  ├──────────────────┤  ├──────────────────┤                  │
│  │ - Bookings       │  │ - Auth tokens    │                  │
│  │ - Customers      │  │ - Schedule cache │                  │
│  │ - Staff          │  │ - Hot data       │                  │
│  │ - Transactions   │  │                  │                  │
│  │ - Rooms          │  │ TTL: 1h-24h      │                  │
│  │ - Services       │                                        │
│  │ - Audit Logs     │                                        │
│  └──────────────────┘                                        │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ File Storage     │  │ Message Queue    │                  │
│  │ (S3/MinIO)       │  │ (Redis/Bull)     │                  │
│  ├──────────────────┤  ├──────────────────┤                  │
│  │ - Documents      │  │ - Chat messages  │                  │
│  │ - Photos         │  │ - Notifications  │                  │
│  │ - Reports        │  │ - Async tasks    │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                              │
│  ┌────────────────────────────────────────┐                  │
│  │ Data Warehouse (Analytics)  [v2.0+]    │                  │
│  │ - BigQuery / Snowflake                 │                  │
│  │ - Daily ETL from PostgreSQL            │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Monitoring & Observability
  │ APM, Logging, Error Tracking, Performance Monitoring
  ├─ DataDog / New Relic
  ├─ ELK Stack (Elasticsearch, Logstash, Kibana)
  └─ Sentry (Error Tracking)
```

---

## 2. 기술 스택 선택

### 2.1 Backend (Node.js)

#### 프레임워크
- **Express.js** (REST API) + **Next.js** API routes (SSR용)
- 이유: 라우팅 간단, 미들웨어 풍부, Node.js 커뮤니티 활발

#### ORM/Query Builder
- **Prisma** (TypeScript 친화, 마이그레이션 자동화, 타입안전)
- 대안: TypeORM

#### 실시간 통신
- **Socket.io** (WebSocket wrapper, 폴백지원)
- 사용: 스케줄 실시간 업데이트, 알림 푸시

#### AI/Agent 통합
- **LangChain** + **LangGraph** (Agent orchestration)
- **Anthropic SDK** (Claude API, 상담 자동화)
- 이유: 구조적 에이전트 관리, Prompt caching 지원, 비용 절감

#### 데이터 검증
- **Zod** (TypeScript-first 스키마 검증)
- 이유: 런타임 타입 안전성, API 응답 검증

#### 로깅 & 모니터링
- **Winston** (로깅)
- **Prometheus** + **Grafana** (메트릭)
- **Sentry** (에러 추적)

### 2.2 Frontend (Web)

#### 프레임워크
- **React 18** + **Next.js 14** (App Router)
- 이유: SSR, 정적 생성, API 라우트, 성능 최적화

#### 상태관리
- **TanStack Query** (데이터 캐싱, 동기화)
- **Zustand** (가벼운 상태, 로컬스토리지 퍼시스트)
- 이유: Redux 대비 가볍고, 비동기 데이터 관리 우수

#### UI 라이브러리
- **shadcn/ui** + **Tailwind CSS** (컴포넌트 기반, 커스터마이징 용이)
- **Recharts** (차트/그래프)
- **react-big-calendar** (스케줄 캘린더)

#### 실시간 클라이언트
- **Socket.io-client** (서버 WebSocket 구독)

#### 폼 관리
- **react-hook-form** + **Zod** (검증)
- 이유: 성능, 최소 리렌더링

#### 번들러/빌드
- **Webpack** (Next.js 기본)
- **SWC** (번들 컴파일, Rust 기반 고속)

### 2.3 Frontend (Mobile)

#### 프레임워크
- **React Native** + **Expo**
- 이유: iOS/Android 동시 지원, 빠른 개발

#### 네비게이션
- **React Navigation** (Stack, Tab, Drawer)

#### 지도/위치
- **react-native-maps** + **react-native-geolocation**

#### 상태관리
- **Redux Toolkit** (또는 Zustand)

### 2.4 데이터베이스

#### Primary
- **PostgreSQL 15+**
  - 이유: ACID, JSONB, 확장성, 오픈소스
  - 특징: UUID, 타임존 지원, 범위 쿼리

#### Cache
- **Redis 7+**
  - 사용: 세션, 레이트리밋, 실시간 데이터

#### Message Queue
- **Bull** (Redis-backed job queue)
- 사용: 비동기 정산, 알림, 보고서 생성

### 2.5 외부 통합

| 서비스 | 용도 | API 타입 |
|--------|------|---------|
| **Facebook Graph API** | Messenger 상담 수집 | REST |
| **Kakao Talk API** | 카톡 연동 | Webhook |
| **Google Sheets API** | 정산 데이터 동기화 | REST |
| **Google Maps API** | 거리 계산, 경로 최적화 | REST |
| **Stripe** | 결제 게이트웨이 (v1.5+) | REST, Webhook |
| **SendGrid** | 이메일 발송 | REST |
| **Twilio** | SMS 발송 | REST |
| **Anthropic (Claude)** | AI 상담 | REST |

---

## 3. 아키텍처 패턴

### 3.1 마이크로서비스? 모놀리식?

**결정: 모놀리식 (Monolithic) + 모듈화 구조**

이유:
- MVP 규모 (팀 2-3명, 1-2개월) → 마이크로서비스는 과장
- 모든 모듈이 동일 데이터베이스 사용
- 향후 이벤트 기반 아키텍처로 분리 가능 (Event Sourcing)

구조:
```
backend/
├── services/
│   ├── auth/
│   ├── chat/
│   ├── booking/
│   ├── schedule/
│   ├── finance/
│   ├── employee/
│   ├── driver/
│   └── notification/
├── agents/
│   ├── consultation-agent.ts (LangGraph)
│   ├── scheduling-agent.ts
│   └── settlement-agent.ts
├── db/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── middleware/
    ├── auth.ts
    ├── validation.ts
    ├── error-handling.ts
    └── logging.ts
```

### 3.2 API 설계

#### RESTful Endpoints 예시

```
# 상담 관련
POST   /api/chats              # 메시지 수신 (웹훅)
GET    /api/chats             # 상담함 조회
GET    /api/chats/:id         # 상담 상세
POST   /api/chats/:id/reply   # 상담 회신

# 예약 관련
POST   /api/bookings          # 예약 생성
GET    /api/bookings          # 예약 조회
GET    /api/bookings/:id      # 예약 상세
PUT    /api/bookings/:id      # 예약 수정
DELETE /api/bookings/:id      # 예약 취소
GET    /api/availability      # 시간대 가용성 조회

# 스케줄 관련
GET    /api/schedule          # 통합 스케줄 조회 (룸+스태프)
GET    /api/schedule/rooms    # 룸별 스케줄
GET    /api/schedule/staff/:id # 스태프별 스케줄
POST   /api/schedule/conflict-check # 충돌 체크

# 정산 관련
GET    /api/finance/transactions    # 거래 조회
GET    /api/finance/settlement      # 정산 조회
POST   /api/finance/settlement      # 정산 생성 (수동)
GET    /api/finance/reports         # 보고서 조회

# 픽드랍 관련
POST   /api/pickups           # 픽드랍 요청
GET    /api/pickups/:id       # 상세조회
PUT    /api/pickups/:id       # 상태 업데이트
GET    /api/drivers/location  # 드라이버 위치
```

#### WebSocket Events (Real-time)

```
// Client → Server
socket.emit('schedule:watch', { roomId: 'ROOM_A' })
socket.emit('chat:typing', { chatId: 'xxx' })

// Server → Client
socket.on('schedule:updated', (data) => { /* 스케줄 변경 */ })
socket.on('notification:push', (data) => { /* 알림 */ })
socket.on('booking:confirmed', (data) => { /* 예약 확정 */ })
socket.on('settlement:completed', (data) => { /* 정산 완료 */ })
```

### 3.3 LangGraph Agent 설계

#### Consultation Agent Flow

```python
from langgraph.graph import StateGraph
from langchain_anthropic import ChatAnthropic

class ConsultationState(TypedDict):
    message: str
    customer_id: str
    extracted_service: str
    available_slots: List[str]
    selected_slot: Optional[str]
    booking_id: Optional[str]
    status: str  # "waiting_service", "waiting_time", "confirming", "done"

def consultation_agent(state: ConsultationState) -> ConsultationState:
    """
    고객 상담 자동화
    - 서비스 종류 파악 (스웨디시, 핫스톤, 타이 등)
    - 선호 시간대 파악
    - 가능한 시간대 제시
    - 예약 자동 생성
    """
    llm = ChatAnthropic(model="claude-opus-4-7", temperature=0.2)
    
    # 1단계: 서비스 추출
    service = extract_service(state['message'], llm)
    
    # 2단계: 시간대 조회
    available_slots = query_available_slots(service, next_day=True)
    
    # 3단계: 고객에게 제시
    response = llm.invoke(
        f"""고객: {state['message']}
        추출된 서비스: {service}
        가능한 시간: {available_slots}
        
        자연스러운 응답을 한국어로 제시하세요."""
    )
    
    return {
        **state,
        'extracted_service': service,
        'available_slots': available_slots,
        'status': 'waiting_time'
    }

def booking_agent(state: ConsultationState) -> ConsultationState:
    """확정된 예약 생성"""
    booking = create_booking(
        customer_id=state['customer_id'],
        service=state['extracted_service'],
        slot=state['selected_slot']
    )
    
    return {
        **state,
        'booking_id': booking['id'],
        'status': 'done'
    }

# 그래프 구성
graph = StateGraph(ConsultationState)
graph.add_node("consultation", consultation_agent)
graph.add_node("booking", booking_agent)
graph.add_edge("consultation", "booking")
graph.set_entry_point("consultation")
graph.set_finish_point("booking")
```

---

## 4. 데이터 모델

### 4.1 핵심 테이블 (Prisma Schema)

```prisma
// 고객
model Customer {
  id        String    @id @default(uuid())
  name      String
  phone     String    @unique
  email     String?
  channels  Channel[] @relation("CustomerChannels")
  bookings  Booking[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// 예약
model Booking {
  id              String   @id @default(uuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  serviceId       String
  service         Service  @relation(fields: [serviceId], references: [id])
  roomId          String
  room            Room     @relation(fields: [roomId], references: [id])
  staffId         String
  staff           Staff    @relation(fields: [staffId], references: [id])
  startTime       DateTime
  endTime         DateTime
  status          String   @default("pending") // pending, confirmed, completed, cancelled
  notes           String?
  chatHistory     Chat[]   @relation("BookingChats")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([roomId, startTime, endTime]) // 룸 시간 중복 방지
  @@unique([staffId, startTime, endTime]) // 스태프 시간 중복 방지
  @@index([customerId])
  @@index([startTime])
}

// 상담/채팅
model Chat {
  id        String    @id @default(uuid())
  customerId String
  channel   String    // "messenger", "kakao", "email", "phone"
  message   String
  direction String    // "inbound", "outbound"
  sender    String?   // "customer", "staff", "ai"
  bookingId String?
  booking   Booking?  @relation("BookingChats", fields: [bookingId], references: [id])
  metadata  Json?     // 채널별 메타데이터
  createdAt DateTime  @default(now())
  
  @@index([customerId])
  @@index([bookingId])
}

// 거래/결제
model Transaction {
  id        String   @id @default(uuid())
  bookingId String
  booking   Booking  @relation(fields: [bookingId], references: [id])
  amount    Decimal
  currency  String   @default("KRW")
  method    String   // "cash", "card", "account_transfer"
  status    String   @default("completed") // pending, completed, refunded
  metadata  Json?    // Stripe 정보 등
  createdAt DateTime @default(now())
  
  @@index([bookingId])
}

// 직원
model Staff {
  id            String    @id @default(uuid())
  name          String
  phone         String    @unique
  email         String?   @unique
  role          String    // "therapist", "receptionist", "manager", "owner"
  hireDate      DateTime
  salary        Decimal
  skills        String[]  // ["swedish", "hotstone", "thai"]
  status        String    @default("active") // active, inactive, on_leave
  bookings      Booking[]
  disciplineRecords DisciplineRecord[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// 직원 기록 (경고, 상벌, 교육)
model DisciplineRecord {
  id        String   @id @default(uuid())
  staffId   String
  staff     Staff    @relation(fields: [staffId], references: [id])
  type      String   // "warning", "commendation", "training"
  reason    String
  date      DateTime
  notes     String?
  createdAt DateTime @default(now())
}

// 룸
model Room {
  id       String    @id @default(uuid())
  name     String
  capacity Int       // 몇 명이 이용할 수 있나
  amenities String[] // ["shower", "locker", "towel"]
  bookings Booking[]
}

// 서비스
model Service {
  id       String   @id @default(uuid())
  name     String   // "스웨디시", "핫스톤" 등
  duration Int      // 분 단위
  price    Decimal
  bookings Booking[]
}

// 채널 (메신저, 카톡 등)
model Channel {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation("CustomerChannels", fields: [customerId], references: [id])
  type        String   // "messenger", "kakao", "email", "phone"
  identifier  String   // Messenger ID, Kakao ID 등
  @@unique([type, identifier])
}

// 픽드랍
model Pickup {
  id              String   @id @default(uuid())
  bookingId       String
  bookingId       String
  pickupLocation  String   // 주소
  pickupLat       Float
  pickupLng       Float
  driverId        String?
  driver          Driver?  @relation(fields: [driverId], references: [id])
  status          String   @default("pending") // pending, assigned, in_progress, completed
  estimatedTime   Int      // 분 단위
  actualTime      Int?
  createdAt       DateTime @default(now())
}

// 드라이버
model Driver {
  id        String   @id @default(uuid())
  name      String
  phone     String   @unique
  vehicle   String
  status    String   @default("active") // active, inactive
  lat       Float?
  lng       Float?
  pickups   Pickup[]
  lastSeenAt DateTime?
}

// 정산
model Settlement {
  id              String   @id @default(uuid())
  date            DateTime
  totalRevenue    Decimal
  totalExpense    Decimal
  netProfit       Decimal
  staffPayments   Json     // { staffId: amount }
  createdAt       DateTime @default(now())
  createdBy       String   // User ID who created
  
  @@unique([date])
}
```

---

## 5. 배포 & DevOps

### 5.1 개발 환경

```
Local Development
├── Docker Compose
│   ├── PostgreSQL
│   ├── Redis
│   └─ Node.js dev server
├── .env.local (비공개 키, DB 주소)
└── npm run dev
```

### 5.2 스테이징/프로덕션

```
├── GitHub Actions (CI/CD)
│   ├── PR 검증 (linting, testing)
│   ├── 자동 배포 (staging)
│   └─ 수동 배포 (production)
│
├── Docker 이미지 빌드
│   ├── Node.js 기본 이미지
│   ├── multi-stage build (최소화)
│   └─ ECR/Docker Hub 푸시
│
├── Kubernetes (EKS) 또는 Docker Swarm
│   ├── Pod/Container 자동 스케일
│   ├─ Health checks
│   └─ Rolling updates
│
├── RDS (PostgreSQL)
├── ElastiCache (Redis)
└─ S3 (파일 스토리지)
```

### 5.3 모니터링

```
Prometheus → Grafana (메트릭)
ELK Stack (로그)
Sentry (에러)
DataDog (APM)
```

---

## 6. 보안 & 규정

### 6.1 인증/인증

- **JWT** (토큰 기반, 만료 15분)
- **Refresh Token** (7일)
- **OAuth 2.0** (Google, Kakao 로그인, v2.0+)
- **RBAC** (Role-Based Access Control)
  - Owner: 모든 기능
  - Manager: 스케줄, 정산, 직원 관리
  - Therapist: 자신의 예약만
  - Receptionist: 상담, 예약, 정산 조회
  - Driver: 픽드랍만

### 6.2 데이터 보호

- **HTTPS** (TLS 1.3)
- **고객정보 암호화** (AES-256, DB에서)
- **패스워드 해싱** (bcrypt, salt rounds 12)
- **SQL Injection 방지** (Prisma ORM 사용)
- **CSRF** (CSRF 토큰, SameSite Cookie)

### 6.3 규정 준수

- **GDPR**: 고객 데이터 우회권, 삭제권
- **개인정보보호법**: 암호화, 접근제어, 감시로그
- **신용카드 PCI-DSS** (v1.5+ 결제시)

---

## 7. 성능 최적화

### 7.1 데이터베이스

```sql
-- 자주 조회하는 조건 인덱싱
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_chats_customer ON chats(customer_id);

-- 복합 인덱싱 (예약 조회)
CREATE INDEX idx_bookings_status_date 
  ON bookings(status, start_time DESC);

-- Partial 인덱싱 (활성 예약만)
CREATE INDEX idx_bookings_active 
  ON bookings(start_time) 
  WHERE status IN ('pending', 'confirmed');
```

### 7.2 캐싱 전략

```
Redis Cache:
├── 세션 (user:{userId} → JWT payload)
├─ 스케줄 (schedule:{date}:{roomId} → 예약 목록)
├─ 가용성 (availability:{serviceId}:{date} → 시간대 목록)
└─ 직원정보 (staff:{staffId} → 상세정보)

TTL:
- 세션: 15분 (JWT 만료와 동일)
- 스케줄: 5분 (자주 변경)
- 가용성: 10분
- 직원정보: 24시간 (거의 변경 없음)
```

### 7.3 API 응답 최적화

```
- GraphQL? No → REST API로 충분
- Pagination: 페이지당 50개 (스케줄 조회는 30일 단위)
- 필드 선택: 고객 목록 조회 시 이름/번호만, 상세시 풀 정보
- Gzip 압축: 모든 응답
- 이미지 최적화: WebP, lazy loading
```

---

## 8. 확장성 고려사항 (Future)

### Phase 2.0 (3개월 후)
- 결제 게이트웨이 (Stripe, Toss)
- 마케팅 자동화 (Google Ads, Facebook Ads 연동)
- 고급 분석 (예측 모델, 추천)
- 모바일 앱 (React Native)
- 다국어 지원

### Phase 3.0 (6개월 후)
- 이벤트 기반 아키텍처 (마이크로서비스로 분리)
- 실시간 분석 (Kafka, BigQuery)
- 기계학습 (수요 예측, 가격 최적화)
- B2B (다중 매장 관리)

---

## 9. 개발 로드맵 (4주)

| 주차 | Backend | Frontend | Agent | Deploy |
|------|---------|----------|-------|--------|
| **W1** | Auth, DB schema | 로그인/대시보드 | - | Dev env |
| **W2** | Chat API, Booking API | 스케줄 뷰, 상담함 | Consultation | Staging |
| **W3** | Finance API, Driver API | 정산, 직원관리 | Settlement | - |
| **W4** | 통합 테스트, 최적화 | 통합 테스트, UX 개선 | Optimization | Production |

---

## Next Steps
1. **Epic & Stories 작성** (Phase 3)
2. **개발팀과 아키텍처 리뷰**
3. **로컬 개발환경 세팅 (Docker Compose)**
4. **Phase 4: Implementation 시작**

