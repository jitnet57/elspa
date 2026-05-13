# ElSpa 마이크로서비스 아키텍처 (고도화)
**Phase 3: Microservices Architecture | Date: 2026-05-05**

---

## 1. 아키텍처 진화: 모놀리식 → 마이크로서비스

### 1.1 기존 (모놀리식) vs 새로운 (마이크로서비스)

```
기존 (Web + Staff 통합):
┌─────────────────────────────┐
│  Admin Frontend              │
├─────────────────────────────┤
│  User Frontend               │
├─────────────────────────────┤
│  Staff Frontend              │
├─────────────────────────────┤
│  Backend (모놀리식)          │
│  - Auth                     │
│  - Chat                     │
│  - Booking                  │
│  - Schedule                 │
│  - Finance                  │
│  - Employee                 │
│  - Driver                   │
└─────────────────────────────┘

문제: API 느림, 스케일링 어려움, 배포 위험


새로운 (마이크로서비스):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Admin Web    │  │ User Web     │  │ Staff App    │
│ (Next.js)    │  │ (Next.js)    │  │ (React Native)│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │ API Gateway
                         ▼
       ┌────────────────────────────────┐
       │  API Gateway (Express)         │
       │  - 라우팅, 인증, 로깅          │
       └─────┬───────────────┬──────────┘
             │               │
    ┌────────▼────┐  ┌──────▼──────────────────┐
    │ Auth        │  │ 비즈니스 서비스들        │
    │ Service     │  │                         │
    │ (JWT)       │  ├─ Chat Service          │
    └─────────────┘  ├─ Booking Service       │
                     ├─ Schedule Service      │
                     ├─ Finance Service       │
                     ├─ Employee Service      │
                     ├─ Driver Service        │
                     └─ Notification Service  │
                     │
                     ▼ (각 서비스는 독립적 DB)
            ┌─────────────────┐
            │ PostgreSQL (샤딩)│
            │ 또는 DynamoDB    │
            └─────────────────┘
```

### 1.2 마이크로서비스 이점 vs 복잡도

| 이점 | 비용 |
|------|------|
| ✅ 독립 배포 (Chat 수정 → 자동 배포, Admin 배포 무영향) | ⚠️ 서비스 간 통신 복잡 (네트워크 지연) |
| ✅ 독립 스케일링 (Chat 많음 → Chat만 스케일) | ⚠️ 데이터 일관성 (분산 트랜잭션) |
| ✅ 팀별 독립 개발 (Chat팀 ≠ Booking팀) | ⚠️ 모니터링/디버깅 어려움 |
| ✅ 장애 격리 (Chat 다운 ≠ Booking 영향 X) | ⚠️ 초기 구축 시간 (3-5개월) |

**추천: Phase 1 (모놀리식) → Phase 2 (마이크로서비스)**

---

## 2. 마이크로서비스 구성 (7가지 서비스)

### 2.1 서비스 분류

```
┌─ Auth Service (인증/권한)
├─ Chat Service (메신저/카톡/전화 + AI)
├─ Booking Service (예약 관리)
├─ Schedule Service (스케줄 + 칼닷컴 동기)
├─ Finance Service (정산 + 자동화)
├─ Employee Service (직원 관리)
├─ Driver Service (드라이버 + 픽드랍)
└─ Notification Service (푸시/이메일/SMS)
```

### 2.2 각 서비스 상세 설계

#### Auth Service
```
책임: JWT 발급, 권한 검증, OAuth (Google/Kakao)
DB: PostgreSQL (user, role, permission)
API:
  POST /auth/register
  POST /auth/login
  POST /auth/refresh
  GET /auth/verify
  POST /auth/oauth/google
  
외부 연동: Google OAuth, Kakao OAuth

특징: 모든 다른 서비스가 의존 (중요!)
```

#### Chat Service
```
책임: 메신저/카톡/전화 메시지 수집, AI 상담, 예약 자동생성
DB: PostgreSQL (chat_message, channel, ai_log)
API:
  POST /webhooks/messenger
  POST /webhooks/kakao
  POST /webhooks/elevenlabs (전화 음성→텍스트)
  GET /chats
  POST /chats/:id/reply
  POST /chats/:id/booking (AI 예약 승인)

외부 연동:
  - Facebook Messenger API (수신)
  - Kakao API (수신)
  - ElevenLabs API (STT/TTS)
  - LangGraph (상담 에이전트)
  - Booking Service (예약 생성)

특징: 높은 요청 빈도 (독립 스케일 필요)
```

#### Booking Service
```
책임: 예약 생성/수정/취소, 중복 방지
DB: PostgreSQL (booking, customer, service)
API:
  POST /bookings
  GET /bookings
  GET /bookings/:id
  PUT /bookings/:id
  DELETE /bookings/:id
  GET /availability (가능 시간대)

외부 연동:
  - Schedule Service (룸/테라피스트 가용성)
  - Chat Service (AI 예약 생성)
  - Notification Service (고객 알림)
  - Caldotcom API (양방향 동기)

특징: 트랜잭션 중요 (중복 예약 방지)
```

#### Schedule Service
```
책임: 룸/테라피스트 스케줄 관리, 칼닷컴/구글캘린더 동기
DB: PostgreSQL (schedule, room, staff_unavailability)
API:
  GET /schedule (통합 뷰)
  GET /availability (가능 시간)
  POST /schedule/conflict-check
  PUT /schedule/bookings/:id (재스케줄링)
  POST /sync/caldotcom (칼닷컴 동기화)
  POST /sync/google-calendar (구글캘린더 동기화)

외부 연동:
  - Caldotcom API (양방향)
  - Google Calendar API (양방향)
  - Google Maps (거리 계산)

특징: 실시간 성능 중요 (캐싱 필수)
```

#### Finance Service
```
책임: 거래 기록, 자동 정산, 비용 관리, 보고서
DB: PostgreSQL (transaction, settlement, expense)
백그라운드: Bull (Redis) - 정산 배치 (매일 1:00)
API:
  POST /transactions
  GET /transactions
  POST /settlements (수동 정산)
  GET /settlements
  GET /reports/summary
  GET /reports/detailed

외부 연동:
  - Google Sheets API (정산 기록 업로드)
  - Booking Service (거래 조회)
  - Email Service (정산 알림)

특징: 배치 처리 (Bull 큐)
```

#### Employee Service
```
책임: 직원 관리, 기록(경고/상벌), 성과 추적
DB: PostgreSQL (staff, discipline_record, performance)
API:
  GET /staff
  GET /staff/:id
  POST /staff/:id/records (기록 추가)
  GET /staff/:id/performance
  PUT /staff/:id (정보 수정)

특징: 접근 제어 엄격 (민감정보)
```

#### Driver Service
```
책임: 드라이버 관리, 픽드랍 배정, 위치 추적
DB: PostgreSQL (driver, pickup, location_history)
WebSocket: 실시간 위치 업데이트
API:
  GET /pickups
  POST /pickups (새 요청)
  POST /pickups/:id/accept
  GET /pickups/:id/location (실시간)
  PUT /drivers/:id/location (GPS 업데이트)

외부 연동:
  - Google Maps API (거리, 경로)
  - Firebase Cloud Messaging (드라이버 알림)

특징: 실시간 위치 (WebSocket 필수)
```

#### Notification Service
```
책임: 푸시/이메일/SMS 발송
DB: PostgreSQL (notification_log)
API:
  POST /notifications/push
  POST /notifications/email
  POST /notifications/sms

외부 연동:
  - Firebase Cloud Messaging (푸시)
  - SendGrid (이메일)
  - Twilio (SMS)

특징: 비동기 처리 (메시지 큐)
```

---

## 3. 서비스 간 통신

### 3.1 동기식 (REST/gRPC)

```
Booking Service가 예약 생성할 때:
┌─────────────────────────┐
│ Booking Service         │
│ POST /bookings          │
├─────────────────────────┤
│ 1. 고객 정보 검증        │
│ 2. 룸 가용성 확인        │
│    → Schedule Service    │
│    GET /availability    │
│ 3. 예약 생성            │
│ 4. 고객 알림 요청       │
│    → Notification Svc   │
│    POST /notifications  │
└─────────────────────────┘
```

### 3.2 비동기식 (메시지 큐)

```
정산 배치 (Finance Service):
┌──────────────────┐
│ Bull Queue       │
│ (Redis 기반)     │
├──────────────────┤
│ cron: 매일 1:00  │
│ job: settlement  │
└──────────┬───────┘
           │ 발행
           ▼
┌──────────────────────────┐
│ Finance Service          │
│ (정산 계산)              │
└──────────┬───────────────┘
           │ 완료 후 이벤트
           ▼
┌──────────────────────────┐
│ Notification Service     │
│ (오너 이메일 발송)       │
└──────────────────────────┘
```

### 3.3 실시간 (WebSocket)

```
드라이버 위치 업데이트:
┌──────────────────┐
│ Driver App       │
│ GPS: 37.4 N,    │
│      127.1 E     │
└────────┬─────────┘
         │ WebSocket
         ▼
┌──────────────────────┐
│ Driver Service       │
│ (위치 저장 + 브로드캐스트)│
└──────────┬───────────┘
           │ WebSocket
           ▼
┌──────────────────────┐
│ User App             │
│ 실시간 픽드랍 추적  │
└──────────────────────┘
```

---

## 4. 데이터 관리 전략

### 4.1 각 서비스별 DB

```
Auth Service        → users, roles, permissions (1개 테이블)
Chat Service        → chat_messages, channels, ai_logs
Booking Service     → bookings, customers, services
Schedule Service    → schedules, rooms, staff_availability
Finance Service     → transactions, settlements, expenses
Employee Service    → staff, discipline_records, performance
Driver Service      → drivers, pickups, locations

장점: 각 팀이 독립적으로 DB 관리
단점: 데이터 일관성 유지 어려움
```

### 4.2 데이터 일관성 (분산 트랜잭션)

```
문제: Booking Service가 예약을 생성했는데,
     Schedule Service가 가용성 업데이트에 실패

해결 (Saga 패턴):

1. Booking Service: 예약 생성 (status: pending)
2. Schedule Service: 가용성 업데이트 (status: scheduled)
   └─ 실패 시: Booking Service에 rollback 요청
3. Notification Service: 고객 알림 (status: notified)
   └─ 실패 시: 재시도 (최대 3회)
```

---

## 5. 배포 & 운영 전략

### 5.1 독립 배포 (CI/CD)

```
각 서비스:
├─ Git 저장소 (monorepo에서 각 폴더)
├─ GitHub Actions (테스트 → 빌드 → 배포)
├─ Docker 이미지 (ECR에 푸시)
├─ Kubernetes Pod (또는 ECS)
└─ 롤링 업데이트 (무중단)

예:
Chat Service만 수정
→ Chat Service만 빌드 & 배포
→ 다른 서비스 무영향
```

### 5.2 모니터링 & 로깅

```
Distributed Tracing (모든 서비스 요청 추적):
┌─────────────────────────────┐
│ User 예약 (request_id: abc)  │
├─────────────────────────────┤
│ 1. Booking Service (100ms)  │
│ 2. → Schedule Service (50ms)│
│ 3. → Notification Svc (30ms)│
│ Total: 180ms                │
└─────────────────────────────┘

도구: Jaeger, Datadog
```

---

## 6. 마이크로서비스 vs 모놀리식 (최종 결정)

### 6.1 조건별 추천

```
✅ 마이크로서비스 추천:
- 팀이 5명 이상 (독립 개발)
- 서비스 복잡도 높음 (Chat, Scheduling 등)
- 장기 프로젝트 (1년 이상)
- 확장성 중시

❌ 모놀리식 추천 (ElSpa 초기):
- 팀이 3-4명 (통합 개발)
- 빠른 출시 필요 (1-2개월)
- 비용 절감 (인프라 단순)
- 현재 요구사항 명확함
```

### 6.2 최종 추천

```
ElSpa Phase 1: 모놀리식 (Week 1-4)
- 빠른 개발 (프로토타입)
- 요구사항 검증
- 사용자 피드백 수집

ElSpa Phase 2: 마이크로서비스로 리팩토링 (Week 5-12)
- Chat, Schedule 서비스 분리
- 성능 최적화
- 팀 확대
```

---

## 7. 기술 스택 (마이크로서비스)

```
API Gateway:  Express.js + Fastify
Services:     Node.js + TypeScript + Express
DB:           PostgreSQL (각 서비스) + Redis (캐시)
메시지 큐:     Bull (Redis 기반)
실시간:        Socket.io + Redis Pub/Sub
배포:          Docker + Kubernetes (또는 ECS)
모니터링:      Prometheus + Grafana + Jaeger
로깅:          ELK Stack (Elasticsearch, Logstash, Kibana)

비용: 모놀리식 → 마이크로서비스 (3배, $600/월 → $1,800/월)
```

---

## 다음 단계

1. **최종 Epic/Stories 작성** (마이크로서비스 기반)
2. **팀 리뷰 & 최종 승인**
3. **개발 시작** (Phase 4)

