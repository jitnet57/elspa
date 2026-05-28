# ELSPA 자동화 시스템 - 아키텍처 다이어그램

> 전체 시스템 흐름과 컴포넌트 구조를 시각화한 문서  
> **작성일**: 2026-05-29  
> **형식**: ASCII 다이어그램 + 상세 설명

---

## 1️⃣ 전체 시스템 아키텍처

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         ELSPA Automation Platform                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    User Interface Layer (Frontend)                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │   Schedule   │  │    Payroll   │  │   Customer   │            │   │
│  │  │  Dashboard   │  │  Prediction  │  │   Insights   │            │   │
│  │  │   (React)    │  │   (React)    │  │   (React)    │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │   Reports    │  │  Real-time   │  │    Admin     │            │   │
│  │  │     Page     │  │   Alerts     │  │  Dashboard   │            │   │
│  │  │   (React)    │  │   (WebSocket)│  │   (React)    │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                    HTTP/REST/WebSocket (json)                              │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway Layer (FastAPI)                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  POST /api/schedule/recommend        GET /api/payroll/predict      │   │
│  │  POST /api/customer/analyze          GET /api/reports/daily        │   │
│  │  WS /api/events/realtime             POST /api/incidents/resolve   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                          Python Async (asyncio)                            │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  Orchestration Layer (LangGraph)                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │           Supervisor Graph (Router & Dispatcher)             │  │   │
│  │  ├──────────────────────────────────────────────────────────────┤  │   │
│  │  │  request_type → schedule | payroll | customer | alert        │  │   │
│  │  └───────┬──────────────────────┬─────────────────┬─────────────┘  │   │
│  │          │                      │                 │                │   │
│  │  ┌───────▼──────────┐  ┌────────▼──────────┐  ┌──▼──────────────┐ │   │
│  │  │ Schedule Opt.    │  │ Payroll Predict.  │  │ Customer        │ │   │
│  │  │ Graph (5 nodes)  │  │ Graph (4 nodes)   │  │ Analytics (4)   │ │   │
│  │  ├──────────────────┤  ├───────────────────┤  ├─────────────────┤ │   │
│  │  │1. load_data      │  │1. load_employee  │  │1. load_customer │ │   │
│  │  │2. check_conflicts│  │2. forecast_earn. │  │2. analyze_churn │ │   │
│  │  │3. gen_options(AI)│  │3. calc_deductions│  │3. segment       │ │   │
│  │  │4. rank_options   │  │4. gen_recommend. │  │4. gen_actions   │ │   │
│  │  │5. format_response│  │                   │  │                 │ │   │
│  │  └───────┬──────────┘  └────────┬──────────┘  └──┬───────────────┘ │   │
│  │          │                      │                │                │   │
│  │          └──────────────────────┼────────────────┘                │   │
│  │                                 │                                  │   │
│  │                        ┌────────▼──────────┐                      │   │
│  │                        │ Real-time Events  │                      │   │
│  │                        │ (Event Handler)   │                      │   │
│  │                        └────────┬──────────┘                      │   │
│  │                                 │                                  │   │
│  │                        ┌────────▼──────────┐                      │   │
│  │                        │ Action Executor   │                      │   │
│  │                        │ (Result Handler)  │                      │   │
│  │                        └───────────────────┘                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                          LangGraph State                                    │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                AI & Tools Layer (Claude API)                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  Claude 3.5 Sonnet                                                 │   │
│  │  ├─ Text Generation (추천, 예측, 분석)                             │   │
│  │  ├─ Tool Use (DB Query, API Call)                                 │   │
│  │  ├─ Structured Output (JSON Schema)                               │   │
│  │  └─ Prompt Caching (50% 비용 절감)                                │   │
│  │                                                                     │   │
│  │  Custom Tools:                                                      │   │
│  │  ├─ query_therapist_availability()                                │   │
│  │  ├─ get_customer_preferences()                                    │   │
│  │  ├─ calculate_payroll_metrics()                                   │   │
│  │  └─ analyze_customer_history()                                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                          API Requests (async)                              │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │               Data & Integration Layer                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ PostgreSQL   │  │ Redis        │  │ Google       │            │   │
│  │  │ (Main DB)    │  │ (Event Queue)│  │ Sheets/Cal   │            │   │
│  │  │              │  │              │  │              │            │   │
│  │  │ Booking      │  │ Event Pub/Sub│  │ - Reports    │            │   │
│  │  │ Therapist    │  │ - no-show    │  │ - Sync       │            │   │
│  │  │ Customer     │  │ - late       │  │              │            │   │
│  │  │ Payroll      │  │ - complaint  │  │              │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ Kakao Talk   │  │ Bank API     │  │ SMS/Email    │            │   │
│  │  │ Channel      │  │ (BDO,        │  │ Services     │            │   │
│  │  │              │  │  Metrobank)  │  │              │            │   │
│  │  │ - Alerts     │  │              │  │ - Alerts     │            │   │
│  │  │ - Offers     │  │ - Auto       │  │ - Reminders  │            │   │
│  │  │ - Reports    │  │   Transfer   │  │ - Reports    │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ LangGraph 상태 흐름도

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Request Entry Point                                  │
│              (HTTP POST or WebSocket Message)                           │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────┐
    │  ElspaAgentState (TypedDict)           │
    │  ├─ request_id: str                    │
    │  ├─ request_type: enum                 │
    │  ├─ user_id: int                       │
    │  ├─ timestamp: datetime                │
    │  ├─ input_data: dict                   │
    │  └─ [more fields]                      │
    └─────────────────────┬──────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │           SUPERVISOR NODE (Router)                              │
    │  Analyze request_type and route to appropriate sub-graph        │
    └──────┬──────────────────┬─────────────────┬────────────────────┘
           │                  │                 │
       schedule          payroll           customer
           │                  │                 │
    ┌──────▼──────┐  ┌────────▼───────┐  ┌─────▼──────────┐
    │ Schedule    │  │ Payroll        │  │ Customer       │
    │ Optimizer   │  │ Predictor      │  │ Analytics      │
    │ Sub-Graph   │  │ Sub-Graph      │  │ Sub-Graph      │
    └──────┬──────┘  └────────┬───────┘  └─────┬──────────┘
           │                  │                │
           │  ┌───────────────┼────────────────┤
           │  │               │                │
           ▼  ▼               ▼                ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │         ACTION EXECUTOR NODE                                    │
    │  Merge results from all sub-graphs and execute actions:         │
    │  ├─ Save to database                                            │
    │  ├─ Send notifications (SMS, Kakao, Email)                      │
    │  ├─ Create scheduler jobs                                       │
    │  └─ Publish events to event queue                               │
    └──────┬───────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │         RESPONSE STATE                                          │
    │  ├─ schedule_result: dict                                       │
    │  ├─ payroll_result: dict                                        │
    │  ├─ customer_result: dict                                       │
    │  ├─ executed_actions: list                                      │
    │  ├─ errors: list                                                │
    │  └─ execution_time_ms: float                                    │
    └──────┬───────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │         RESPONSE to Client                                      │
    │  HTTP 200 + JSON | WebSocket Message                            │
    └─────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Schedule Optimizer 상세 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/schedule/recommend                                           │
│  {                                                                      │
│    "booking_id": 123,                                                   │
│    "customer_id": 456,                                                  │
│    "preferred_time": "2026-05-30 14:00"                                │
│  }                                                                      │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │  NODE 1: load_data                                                 │
    │  ├─ Query: Booking + Customer + Service                           │
    │  ├─ Fetch: Customer preferences (preferred therapist, times)      │
    │  ├─ List: All active therapists + skills                          │
    │  └─ Calculate: Availability (no conflicts)                        │
    │                                                                    │
    │  State Update:                                                     │
    │  ├─ customer_preferences: {pref_therapist, pref_times}           │
    │  ├─ therapist_list: [{id, name, skills, rating, available}]     │
    │  └─ availability: {therapist_id: [occupied_slots]}               │
    └────────────────────┬─────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │  NODE 2: check_conflicts                                           │
    │  ├─ Check preferred_time against availability                      │
    │  ├─ Identify conflicting therapists                                │
    │  ├─ List alternative time slots                                    │
    │  └─ Calculate time_to_resolve                                      │
    │                                                                    │
    │  State Update:                                                     │
    │  └─ conflicts: [{therapist_id, time_slot, reason}]               │
    └────────────────────┬─────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │  NODE 3: generate_options (Claude API)                             │
    │                                                                    │
    │  Prompt (with Caching):                                            │
    │  ─────────────────────────────────────────────────────            │
    │  System (cached, ~500 tokens):                                     │
    │  "You are a schedule optimization AI for a spa..."                │
    │  [Therapist list, customer profiles, services]                    │
    │                                                                    │
    │  User:                                                             │
    │  "Optimize for booking #123, preferred 14:00"                     │
    │  "Conflicts: [list]"                                              │
    │  "Suggest 3 best alternatives"                                    │
    │                                                                    │
    │  Response (JSON):                                                 │
    │  {                                                                 │
    │    "options": [                                                    │
    │      {                                                             │
    │        "therapist_id": 10,                                         │
    │        "suggested_time": "14:30",                                  │
    │        "reasoning": "5 min later, preferred therapist",           │
    │        "score": 92                                                 │
    │      },                                                            │
    │      ...3 total options                                           │
    │    ]                                                               │
    │  }                                                                 │
    │                                                                    │
    │  Caching Impact:                                                   │
    │  ├─ First call: 200 input tokens (standard rate)                  │
    │  ├─ Cache hit: 50 tokens (75% cheaper)                            │
    │  └─ Savings: $0.003 per call (1,000 calls = $1.50 monthly)       │
    │                                                                    │
    │  State Update:                                                     │
    │  ├─ recommendation.options: [...]                                 │
    │  └─ recommendation.usage: {tokens, cache_hit}                     │
    └────────────────────┬─────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │  NODE 4: rank_options                                              │
    │  ├─ Sort options by score (descending)                             │
    │  ├─ Pick top option                                                │
    │  ├─ Calculate confidence (0-100)                                   │
    │  └─ Validate against constraints                                   │
    │                                                                    │
    │  State Update:                                                     │
    │  ├─ recommendation.top_option: {...}                              │
    │  └─ confidence_score: 92                                           │
    └────────────────────┬─────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │  NODE 5: format_response                                           │
    │  ├─ Format top option (human-readable)                             │
    │  ├─ Add reasoning (자연어)                                         │
    │  ├─ Include alternatives (fallback)                                │
    │  └─ Calculate response time                                        │
    │                                                                    │
    │  Final Response:                                                   │
    │  {                                                                 │
    │    "success": true,                                                │
    │    "recommendation": {                                             │
    │      "therapist_id": 10,                                           │
    │      "therapist_name": "Luna Park",                                │
    │      "suggested_time": "14:30",                                    │
    │      "confidence": 92,                                             │
    │      "reasoning": "5분 늦게 시작하지만 고객이 선호하는 테라피스트이며, 5성 평점으로 만족도 높음",
    │      "alternatives": [...]                                        │
    │    },                                                              │
    │    "execution_time_ms": 1847,                                      │
    │    "cache_hit": true                                               │
    │  }                                                                 │
    └────────────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ Real-time Event Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Real-time Event Pipeline                             │
└──────────────────────────────────────────────────────────────────────────┘

Event Source 1: No-show Detection
────────────────────────────────
  Booking scheduled_time = 14:00
  Current time = 14:15
  Therapist at location, customer NOT found
  
  ├─ Event Triggered: "no_show_detected"
  │  {
  │    "event_type": "no_show",
  │    "booking_id": 123,
  │    "therapist_id": 10,
  │    "customer_id": 456,
  │    "timestamp": "2026-05-30T14:15:00Z"
  │  }
  │
  └─> Redis Pub/Sub Channel: "events:bookings"
      

Event Source 2: Therapist Late Detection
──────────────────────────────────────────
  WebSocket Location Update:
  {
    "therapist_id": 10,
    "location": {lat: 14.5890, lng: 121.0197},
    "timestamp": "2026-05-30T13:50:00Z"
  }
  
  Distance to next booking location = 8km
  Time to booking = 10 minutes
  Estimated arrival = 14:08 (8 min late)
  
  ├─ Event Triggered: "therapist_late"
  │  {
  │    "event_type": "therapist_late",
  │    "therapist_id": 10,
  │    "estimated_delay_minutes": 8,
  │    "booking_ids": [123, 124],
  │    "timestamp": "2026-05-30T13:50:00Z"
  │  }
  │
  └─> Redis Pub/Sub Channel: "events:location"


Event Source 3: Customer Complaint
──────────────────────────────────
  POST /api/complaints
  {
    "booking_id": 123,
    "complaint_type": "service_quality",
    "description": "마사지가 너무 세게 했어요",
    "severity": "medium"
  }
  
  ├─ Event Triggered: "customer_complaint"
  │  {
  │    "event_type": "complaint",
  │    "booking_id": 123,
  │    "customer_id": 456,
  │    "severity": "medium",
  │    "timestamp": "2026-05-30T15:30:00Z"
  │  }
  │
  └─> Redis Pub/Sub Channel: "events:complaints"


┌──────────────────────────────────────────────────────────────────────────┐
│                    Redis Event Queue (Buffer)                            │
├──────────────────────────────────────────────────────────────────────────┤
│  Channel: "events:bookings" (45 messages)                                │
│  Channel: "events:location" (120 messages)                               │
│  Channel: "events:complaints" (12 messages)                              │
└──────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Real-time Decision Agent (LangGraph)                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  For each event:                                                         │
│                                                                          │
│  1. Analyze event context:                                              │
│     └─> Claude API: "What is the situation? Is it urgent?"              │
│                                                                          │
│  2. Generate action options:                                            │
│     ├─ no_show:      [auto_rebooking, offer_discount, notify_admin]    │
│     ├─ therapist_late: [notify_customer, auto_reschedule, alert_admin] │
│     └─ complaint:     [auto_refund, escalate, collect_feedback]        │
│                                                                          │
│  3. Select best action (confidence-based):                              │
│     └─> "confidence > 80% → auto_execute | else → notify_admin"        │
│                                                                          │
│  4. Execute action:                                                     │
│     ├─ Database Update (Booking status)                                │
│     ├─ Notification (SMS, Kakao, WebSocket)                            │
│     ├─ Schedule Job (if reschedule needed)                             │
│     └─ Log Action (audit trail)                                        │
│                                                                          │
└──────────────────┬───────────────────────────────────────────────────────┘
                   │
       ┌───────────┼───────────┬──────────────┐
       │           │           │              │
       ▼           ▼           ▼              ▼
    ┌─────┐   ┌────────┐  ┌─────────┐   ┌──────────┐
    │ SMS │   │ Kakao  │  │ Email   │   │ WebSocket│
    │     │   │ Talk   │  │         │   │ (UI)     │
    └─────┘   └────────┘  └─────────┘   └──────────┘
       │           │           │              │
       └───────────┴───────────┴──────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │ User Action Triggered  │
        │ (Acknowledge/Approve)  │
        └────────────────────────┘
```

---

## 5️⃣ Data Flow: Payment Automation

```
월말 자동 급여 지급 플로우
═══════════════════════════════════════════════════════════════════

Time: 2026-05-31 17:00 (Scheduled Job)

┌──────────────────────────────────────────────────────────────────┐
│ Step 1: 급여 조회 & 최종 계산                                    │
├──────────────────────────────────────────────────────────────────┤
│  Query: SELECT * FROM payroll_records WHERE period_month = 5     │
│                                                                  │
│  For each employee:                                              │
│    gross = base_salary + overtime_pay + commission               │
│    - tax = gross * 0.12                                          │
│    - sss = gross * 0.045                                         │
│    - pagibig = min(gross * 0.02, 100)                            │
│    - health_insurance = 50                                       │
│    net = gross - tax - sss - pagibig - health_insurance          │
│                                                                  │
│  Result: [                                                       │
│    {employee_id: 1, name: "Maria", net: 15,234.50},             │
│    {employee_id: 2, name: "Rosa", net: 12,890.25},              │
│    ...                                                           │
│  ]                                                               │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 2: 직원 승인 요청                                           │
├──────────────────────────────────────────────────────────────────┤
│  Send Kakao Talk Message to all employees:                       │
│  ───────────────────────────────────────────                     │
│  "5월 급여 정산 완료. 내역:"                                      │
│  "기본급: ₱15,000"                                               │
│  "초과근무: ₱2,000"                                              │
│  "총액: ₱17,000"                                                 │
│  "공제: ₱2,765.50"                                               │
│  "수령액: ₱14,234.50"                                            │
│  "[승인] [거절] [상담]"  (Interactive buttons)                   │
│                                                                  │
│  Wait for confirmation:                                          │
│  ├─ [승인] (90% of employees)                                   │
│  ├─ [거절] (5% - dispute)                                       │
│  └─ No response (5% timeout → admin escalation)                 │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 3: 은행 API 호출 (자동 이체)                               │
├──────────────────────────────────────────────────────────────────┤
│  For approved employees:                                         │
│                                                                  │
│  BDO API Request:                                                │
│  ──────────────────                                              │
│  POST /v1/accounts/transfer                                      │
│  {                                                               │
│    "from_account": "elspa_main_123456",                          │
│    "to_account": "maria_bdo_789012",                             │
│    "amount": 14234.50,                                           │
│    "currency": "PHP",                                            │
│    "reference": "MAY_2026_PAYROLL_001",                          │
│    "description": "May 2026 Salary"                              │
│  }                                                               │
│                                                                  │
│  Response:                                                       │
│  ────────                                                        │
│  {                                                               │
│    "transaction_id": "TXN_20260531_001",                         │
│    "status": "success",                                          │
│    "timestamp": "2026-05-31T17:05:30Z"                           │
│  }                                                               │
│                                                                  │
│  For rejected/disputed:                                          │
│  └─> Send to admin queue for manual review                      │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 4: 완료 알림 & 기록                                         │
├──────────────────────────────────────────────────────────────────┤
│  For each transfer:                                              │
│                                                                  │
│  1. Update Database:                                             │
│     UPDATE payroll_records                                       │
│     SET status = 'paid',                                         │
│         paid_date = NOW(),                                       │
│         bank_transaction_id = 'TXN_20260531_001'                │
│                                                                  │
│  2. Log Audit Trail:                                             │
│     INSERT INTO audit_logs (                                     │
│       action = 'payroll_transfer',                               │
│       employee_id = 1,                                           │
│       amount = 14234.50,                                         │
│       timestamp = NOW(),                                         │
│       approved_by = 'system'                                     │
│     )                                                            │
│                                                                  │
│  3. Send Confirmation to Employee:                               │
│     Kakao Talk Message:                                          │
│     "✅ 급여가 정상 지급되었습니다."                             │
│     "금액: ₱14,234.50"                                          │
│     "계좌: **** 7890"                                            │
│     "거래번호: TXN_20260531_001"                                 │
│     "시간: 2026-05-31 17:05:30"                                  │
│                                                                  │
│  4. Send Report to Admin:                                        │
│     Email: payroll_completion_report.pdf                        │
│     "총 직원: 45명"                                              │
│     "성공: 44명 (₱630,524.75)"                                  │
│     "실패/대기: 1명"                                             │
│     "처리율: 97.8%"                                              │
└────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 5: 에러 처리 및 재시도                                      │
├──────────────────────────────────────────────────────────────────┤
│  If bank transfer fails:                                         │
│                                                                  │
│  1. Auto-retry (max 3 times):                                   │
│     ├─ Retry 1: 5 minutes later                                 │
│     ├─ Retry 2: 30 minutes later                                │
│     └─ Retry 3: 2 hours later                                   │
│                                                                  │
│  2. If all retries fail:                                        │
│     ├─ Alert admin (urgent notification)                        │
│     ├─ Hold payment (status = 'failed')                         │
│     ├─ Log detailed error                                       │
│     └─ Await manual intervention                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ System Components Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Component Dependency Graph                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Frontend (React)    │
│  ├─ ScheduleUI       │
│  ├─ PayrollUI        │
│  ├─ CustomerUI       │
│  └─ DashboardUI      │
└──────┬───────────────┘
       │ (HTTP/WS)
       ▼
┌──────────────────────────────────────┐
│  FastAPI Server                      │
│  ├─ @router.post("/api/schedule")    │
│  ├─ @router.post("/api/payroll")     │
│  ├─ @router.post("/api/customer")    │
│  └─ @router.websocket("/api/events") │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  LangGraph Orchestrator              │
│  ├─ SupervisorGraph                  │
│  ├─ ScheduleOptimizerGraph           │
│  ├─ PayrollPredictorGraph            │
│  ├─ CustomerAnalyticsGraph           │
│  └─ RealtimeDecisionGraph            │
└──────┬───────────────────────────────┘
       │
   ┌───┴──────────────┬─────────────────┬─────────────────┐
   │                  │                 │                 │
   ▼                  ▼                 ▼                 ▼
┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│PostgreSQL  │ │Redis         │ │Claude API    │ │External APIs │
│(Main DB)   │ │(Event Queue) │ │(AI Engine)   │ │(Bank, Kakao) │
├────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤
│- Booking   │ │- Pub/Sub     │ │- Schedule    │ │- BDO Bank    │
│- Therapist │ │- Event Store │ │  Optimizer   │ │- KakaoTalk   │
│- Customer  │ │- Queue       │ │- Payroll     │ │- Google APIs │
│- Payroll   │ │              │ │  Predictor   │ │- SMS Service │
│- Audit Log │ │              │ │- Customer    │ │              │
└────────────┘ └──────────────┘ │  Analytics   │ └──────────────┘
                                 │- Real-time   │
                                 │  Decision    │
                                 └──────────────┘

Schedule Flow:
  Frontend → FastAPI → SupervisorGraph → ScheduleOptimizerGraph
           ↓
    Claude API (Tools: query_therapist, get_preferences)
           ↓
    PostgreSQL (read booking, therapist, customer)
           ↓
    Response → Frontend (WebSocket)

Payroll Flow:
  Scheduled Job (APScheduler) → PayrollPredictorGraph
           ↓
    Claude API (forecast_earnings, calculate_deductions)
           ↓
    PostgreSQL (read employee, payroll records)
           ↓
    BDO Bank API (transfer funds)
           ↓
    Kakao Talk API (notify employees)
           ↓
    PostgreSQL (update payroll status, log audit)

Event Flow:
  Event Source → Redis Pub/Sub
           ↓
    RealtimeDecisionGraph (poll Redis)
           ↓
    Claude API (analyze incident, select action)
           ↓
    Action Executor (SMS, Kakao, Notification, DB)
           ↓
    WebSocket → Frontend (real-time UI update)
```

---

## 7️⃣ Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Production Deployment Stack                           │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────────┐
                         │   Cloudflare Pages (CDN)    │
                         │   - Frontend Static Files   │
                         │   - Global Caching          │
                         └──────────────┬──────────────┘
                                        │
                                        │ HTTPS
                                        ▼
                         ┌──────────────────────────────┐
                         │  API Gateway / Load Balancer │
                         │  - Route traffic             │
                         │  - SSL/TLS termination       │
                         │  - Rate limiting             │
                         └──────────────┬───────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │  FastAPI Pod 1   │ │ FastAPI Pod 2    │ │ FastAPI Pod 3    │
        │  (Kubernetes)    │ │ (Kubernetes)     │ │ (Kubernetes)     │
        │                  │ │                  │ │                  │
        │ ├─ Uvicorn       │ │ ├─ Uvicorn       │ │ ├─ Uvicorn       │
        │ ├─ LangGraph     │ │ ├─ LangGraph     │ │ ├─ LangGraph     │
        │ └─ Routes        │ │ └─ Routes        │ │ └─ Routes        │
        └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                 │                    │                    │
                 └────────────────────┼────────────────────┘
                                      │
                    ┌─────────────────┴────────────────────┐
                    │                                      │
                    ▼                                      ▼
        ┌──────────────────────────┐        ┌──────────────────────────┐
        │ PostgreSQL Replication   │        │ Redis Cluster            │
        │                          │        │                          │
        │ Primary + 2 Replicas     │        │ 6 nodes (High Avail.)   │
        │ - Booking data           │        │ - Event queue            │
        │ - Therapist data         │        │ - Session cache          │
        │ - Customer data          │        │ - Rate limiting          │
        │ - Payroll records        │        │                          │
        │ - Audit logs             │        │                          │
        │                          │        │                          │
        │ Backup: Daily snapshots  │        │ Backup: RDB + AOF        │
        └──────────────────────────┘        └──────────────────────────┘
                    │                                      │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │ Monitoring Stack     │      │ External Services    │
        │                      │      │                      │
        │ ├─ Prometheus        │      │ ├─ Claude API        │
        │ ├─ Grafana           │      │ ├─ BDO Bank API      │
        │ ├─ Sentry (Errors)   │      │ ├─ Kakao Talk API    │
        │ ├─ CloudWatch        │      │ ├─ Google APIs       │
        │ └─ AlertManager      │      │ ├─ Twilio (SMS)      │
        │    (PagerDuty)       │      │ └─ SendGrid (Email)  │
        │                      │      │                      │
        │ Alerts:             │      │ All services use:    │
        │ - High latency       │      │ - API key management │
        │ - Error rate > 1%    │      │ - Retry logic        │
        │ - CPU > 80%          │      │ - Circuit breaker    │
        │ - Memory > 85%       │      │ - Rate limiting      │
        └──────────────────────┘      └──────────────────────┘

Kubernetes Deployment:
  ├─ Namespace: elspa-prod
  ├─ FastAPI Deployment (3 replicas, HPA enabled)
  ├─ Celery Worker (2 replicas for background jobs)
  ├─ Redis StatefulSet (6 nodes)
  ├─ PostgreSQL StatefulSet (1 primary + 2 replicas)
  ├─ ConfigMaps (environment variables)
  ├─ Secrets (API keys, DB credentials)
  ├─ PersistentVolumes (database storage)
  ├─ Services (LoadBalancer for API, ClusterIP for databases)
  └─ Ingress (routing rules)

CI/CD Pipeline (GitHub Actions):
  1. Push to main
  2. Run tests (Pytest + Cypress)
  3. Type check (mypy)
  4. Build Docker image
  5. Push to registry (Docker Hub / ECR)
  6. Deploy to Kubernetes (helm chart)
  7. Run smoke tests
  8. Monitor for 1 hour
  9. Auto-rollback if issues
```

---

**문서 작성자**: jitnet57  
**최종 검토**: 2026-05-29  
**버전**: 1.0
