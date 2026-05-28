# ELSPA 업무자동화 & 지능형 오케스트레이션 전략

> ElSpa Manager의 업무자동화, 지능형 스케줄링, 실시간 의사결정을 위한 종합 기술 전략  
> **작성일**: 2026-05-29  
> **버전**: 1.0

---

## 📊 Executive Summary

ELSPA는 이미 **급여정산 자동화 (BMAD Phase 1-10 완료)**를 통해 엔터프라이즈급 오케스트레이션 능력을 입증했습니다. 
이를 바탕으로 **6개 영역의 자동화**를 3개월(병렬 처리)에 구현하여, 
**의사결정 자동화 → 실시간 대응 → 데이터 기반 경영**의 3단계 진화를 도모합니다.

| 단계 | 초점 | 기술 | 기간 |
|------|------|------|------|
| **Phase 1** | 스케줄 최적화 | LangGraph + Claude API | 4주 |
| **Phase 2** | 고객/비용 자동화 | Multi-agent + Parallel | 4주 |
| **Phase 3** | 실시간 의사결정 | Real-time 알림 + Auto-response | 2주 |

---

## 🎯 자동화 6대 영역

### 1️⃣ 급여정산 자동화 (이미 완료 → 고도화)

**현황**
- ✅ 급여 계산 자동화 (지각, OT, 공휴일, 커미션)
- ✅ 13개월 보너스, 보건소 검사비 자동화
- ✅ PDF 정산서 자동 생성
- ✅ 메시지 발송 (카카오톡, WhatsApp)
- ✅ 감사 로그 (17개 헬퍼, 조회 페이지)

**목표 (Phase 1-2)**
```
Level 1: 자동 계산 ✓ (완료)
  └─ 직원별 급여 실시간 계산

Level 2: 예측 & 제안
  └─ "이번달 급여 $1,200 예상" (실시간)
  └─ "월급 부족 가능성 인지" + 자동 차입 제안

Level 3: 자동 지급
  └─ 은행 API 연동 (BDO, Metrobank)
  └─ 월말 자동 계좌이체
  └─ 이체 전 직원 승인 요청
```

**기술 스택**
- Backend: FastAPI + SQLAlchemy (기존 payroll 모델 확장)
- LLM: Claude 3.5 Sonnet (예측/분석)
- Orchestration: LangGraph (State machine)
- Integration: Bank API + Web3 (USDC 자동 지급 옵션)

**주요 파일**
- `app/services/payroll_orchestrator.py` (기존)
- `app/agents/payroll_predictor.py` (신규)
- `app/routers/payroll_auto_transfer.py` (신규)

---

### 2️⃣ 스케줄 최적화 (LangGraph 중심)

**현황**
- ✅ 테라피스트 일일 스케줄 UI (Timeline 뷰)
- ✅ Table 뷰 (Therapist Schedule Table View)
- ❌ 자동 배치 알고리즘 없음
- ❌ 충돌 감지/해결 없음

**목표 (Phase 1, 높은 영향도)**
```
Level 1: 스마트 제안 (4주)
  ├─ 고객 선호도 + 테라피스트 능력 기반 추천
  ├─ 예약 충돌 자동 감지
  └─ 대기 시간 최소화 제안

Level 2: 자동 재배치 (2주)
  ├─ 테라피스트 지각 → 자동 대체 배치
  ├─ 고객 변경 → 최적 시간대 자동 제안
  └─ 예약 취소 → 빈 슬롯 자동 충전

Level 3: 실시간 최적화 (2주)
  ├─ 새 예약 즉시 최적 배치
  ├─ 소비자 만족도 기반 학습
  └─ 주간/월간 패턴 인식
```

**기술 스택**
```
┌─────────────────────────────────────┐
│   Claude API (Sonnet 3.5)           │ ← 추천/최적화 AI
│   - Prompt Caching (비용 50% 절감)  │
│   - Tool Use (SQL 쿼리 생성)        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   LangGraph (Orchestration)         │
│   ├─ State: {schedule, conflicts,   │
│   │           capacity, preferences}│
│   ├─ Node 1: Data Loader            │
│   ├─ Node 2: AI Recommendation      │
│   ├─ Node 3: Conflict Detection     │
│   ├─ Node 4: Auto-Resolution        │
│   └─ Node 5: Notification           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   Backend (FastAPI)                 │
│   ├─ GET /schedule/recommend        │
│   ├─ POST /schedule/auto-assign      │
│   ├─ POST /schedule/resolve-conflict │
│   └─ WebSocket /schedule/realtime    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   Frontend (React)                  │
│   ├─ Recommendation Panel           │
│   ├─ Conflict Alert                 │
│   ├─ Auto-assign Toggle             │
│   └─ Real-time Update               │
└─────────────────────────────────────┘
```

**핵심 알고리즘**
```python
# 예: 최적 배치 점수 계산
score = (
    0.4 * customer_preference_match +    # 고객이 원하는 테라피스트
    0.3 * therapist_availability +       # 테라피스트 여유 시간
    0.2 * skill_match +                  # 서비스 필요 기술
    0.1 * travel_time_minimization       # 대기 시간 최소화
)
# Claude API가 이 로직을 자동 최적화
```

**주요 파일**
- `app/agents/schedule_optimizer.py` (신규, 500줄)
- `app/routers/schedule_api.py` (신규, 300줄)
- `frontend/src/components/ScheduleRecommendation.tsx` (신규)
- `frontend/src/hooks/useScheduleOptimizer.ts` (신규)

**KPI**
- 배치 시간: 10분 → 1초 (AI 추천)
- 충돌 해결율: 95% (자동)
- 고객 만족도: +15% (맞춤형 배치)

---

### 3️⃣ 고객 관리 자동화

**현황**
- ✅ 고객 DB + 예약 히스토리
- ✅ 리뷰/평점 시스템
- ❌ 재방문 예측
- ❌ 자동 리마인더
- ❌ 세분화 & 타겟팅

**목표 (Phase 2, 4주)**
```
Level 1: 재방문 예측 (2주)
  ├─ "고객 ABC는 30일마다 방문 경향"
  ├─ "이번주 방문 확률 75%"
  └─ 낮은 확률 고객 자동 할인 오퍼

Level 2: 자동 리마인더 (1주)
  ├─ SMS/카카오톡 자동 예약 확인
  ├─ "내일 14:00 예약입니다" (24시간 전)
  └─ no-show 방지 (25% → 5%)

Level 3: 타겟 마케팅 (1주)
  ├─ 고객 세분화 (VIP, Regular, At-risk)
  ├─ VIP: 프리미엄 서비스 오퍼
  ├─ At-risk: 맞춤 할인 & 개인화 메시지
  └─ 자동 캠페인 (Google Sheets 연동)
```

**기술 스택**
```
Data Pipeline:
  Booking Data → Claude API (예측) → Supabase (저장)
  
Analytics:
  - 예약 빈도 분석
  - 고객 생애 주기 (LTV) 계산
  - Churn risk 스코어 (0-100)

Automation:
  - Messaging Service (SMS/카카오톡)
  - Google Sheets API (캠페인)
  - Scheduled Jobs (Celery/APScheduler)
```

**주요 파일**
- `app/agents/customer_analytics.py` (신규)
- `app/services/churn_prediction.py` (신규)
- `app/routers/marketing_automation.py` (신규)
- `frontend/src/app/admin/customer-insights/page.tsx` (신규)

**KPI**
- No-show 감소: 25% → 5%
- 재방문율: 45% → 65%
- 평균 LTV: +30%

---

### 4️⃣ 보고서 자동 생성

**현황**
- ✅ 대시보드 (실시간 통계)
- ✅ PDF 급여 정산서
- ❌ 자동화된 일일/주간/월간 리포트
- ❌ 경영진 대시보드

**목표 (Phase 2, 3주)**
```
자동 생성 보고서:
  1. 일일 리포트 (오전 06:00)
     └─ 어제 매출, 예약 현황, 테라피스트 실적

  2. 주간 리포트 (매주 월요일)
     └─ 주간 트렌드, TOP 3 테라피스트, 고객 만족도

  3. 월간 리포트 (매월 1일)
     └─ 매출/비용, 급여, 세금, 현금 흐름

  4. 경영진 대시보드
     └─ 실시간 KPI (매출, 가동률, 고객 수, 직원 만족도)
```

**기술 스택**
```
Report Generation:
  Data → Claude API (자연어 리포트 작성) → Google Sheets → Email

Tools:
  - python-pptx (PowerPoint)
  - pandas (데이터 처리)
  - reportlab (PDF)
  - google-sheets-api (Google Sheets)
  - schedule (스케줄링)
```

**주요 파일**
- `app/services/report_generator.py` (신규)
- `app/routers/reports_api.py` (신규)
- `app/jobs/scheduled_reports.py` (신규)
- `frontend/src/app/admin/executive-dashboard/page.tsx` (신규)

---

### 5️⃣ 실시간 알림 & 대응

**현황**
- ✅ WebSocket 기본 구조
- ✅ 예약 변경 메시지
- ❌ 자동 대응 (AI 기반)
- ❌ SOS 상황 대응

**목표 (Phase 3, 2주)**
```
이벤트 → 자동 판단 → 즉시 대응

예: No-show
  고객이 나타나지 않음 (예약 시간 + 15분)
  ↓
  AI 판단: "이전 3회 중 2회 no-show, 재방문율 낮음"
  ↓
  자동 액션:
  1. 테라피스트에게 즉시 알림
  2. 빈 슬롯에 예약 대기 고객 자동 배치
  3. 고객에게 "취소 감지, 다음 무료 서비스 오퍼"

예: 테라피스트 지각
  예약 15분 전에 테라피스트 위치 확인
  ↓
  GPS: 아직 5km 떨어짐 → 지각 확정
  ↓
  자동 액션:
  1. 관리자에게 즉시 알림
  2. 대체 테라피스트 자동 추천 (LangGraph)
  3. 고객에게 "예약 변경 제안" 메시지

예: 클레임/트러블
  고객이 앱에서 "불만" 버튼 클릭
  ↓
  AI가 이유 파악 (음성/텍스트 분석)
  ↓
  자동 처리:
  - 경미함: 자동 환불 + 고객 만족도 측정
  - 심각함: 관리자에게 에스컬레이션 + 추천 해결책
```

**기술 스택**
```
Real-time Event Pipeline:
  Event Source (WebSocket)
  ↓
  Event Stream (Kafka/Redis)
  ↓
  LangGraph Agent (의사결정)
  ↓
  Action Executor (Notification, API, DB)

Tools:
  - WebSocket (FastAPI)
  - Redis (Event queue)
  - Claude API (의사결정)
  - Twilio (SMS)
  - Kakao Talk API (메시지)
  - Google Maps API (위치)
```

**주요 파일**
- `app/agents/realtime_decision_agent.py` (신규)
- `app/routers/websocket_realtime.py` (신규)
- `app/services/incident_handler.py` (신규)
- `frontend/src/components/RealTimeAlerts.tsx` (신규)

---

### 6️⃣ API 통합 자동화

**현황**
- ✅ 카카오톡 메시지 발송
- ✅ WhatsApp 통합
- ❌ 카톡 채널 연동
- ❌ 은행 API 자동 이체
- ❌ 공휴일 자동 업데이트

**목표 (Phase 2-3, 3주)**
```
1. 카카오톡 채널 (고객/직원 소통)
   └─ 예약 알림, 급여 지급, 프로모션

2. 은행 API (자동 정산금 이체)
   └─ BDO, Metrobank, GCash 연동

3. 공휴일 자동 반영
   └─ 통계청 API → DB 자동 업데이트

4. Google Calendar 동기화
   └─ 예약 → Google Calendar 자동 추가

5. Slack/Discord 통합 (관리자)
   └─ 일일 리포트, 긴급 알림
```

**기술 스택**
```
API Gateway:
  - FastAPI (라우터)
  - API Key 관리 (암호화)
  - Rate limiting

Integrations:
  - Kakao Talk Channel API
  - Bank APIs (PH)
  - Statistics Bureau API
  - Google Calendar API
  - Slack/Discord API

Queue & Scheduling:
  - Celery (비동기 작업)
  - APScheduler (정기 작업)
```

**주요 파일**
- `app/routers/kakao_channel.py` (신규)
- `app/services/bank_integration.py` (신규)
- `app/jobs/holiday_sync.py` (신규)
- `app/routers/calendar_sync.py` (신규)

---

## 🏗️ LangGraph 아키텍처

### 전체 흐름도

```
┌────────────────────────────────────────────────────────────┐
│              ELSPA Multi-Agent Orchestration               │
└────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────┐
         │   Supervisor Node               │
         │ (의사결정 & 라우팅)             │
         └──────────────┬──────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │Schedule │    │Payroll   │    │Customer  │
   │Optimizer│    │Predictor │    │Analytics │
   └────┬────┘    └────┬─────┘    └────┬─────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
            ┌──────────▼──────────┐
            │  Real-time Action   │
            │  Executor           │
            └─────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Notification  API Call       DB Update
    (SMS, Email)  (Bank, Calendar)
```

### 각 Agent 상세 구조

#### Agent 1: Schedule Optimizer (4주)
```python
class ScheduleOptimizerState(BaseModel):
    booking_id: int
    customer_preferences: dict
    therapist_availability: list
    conflicts: list
    recommendation: dict
    
class ScheduleOptimizer(BaseAgent):
    nodes = {
        "load_data": load_booking_and_therapists,
        "check_conflicts": detect_conflicts,
        "generate_recommendations": claude_recommend,  # Claude API
        "resolve_conflicts": auto_resolve,
        "notify_user": send_notification,
    }
```

**Key Features**
- Prompt Caching: 테라피스트 프로필 (~500 tokens) 캐시
- Tool Use: SQL 쿼리 (자동 최적화)
- Streaming: 추천 과정 실시간 표시

#### Agent 2: Payroll Predictor (2주)
```python
class PayrollPredictionState(BaseModel):
    employee_id: int
    ytd_earnings: float
    upcoming_events: list
    prediction: dict
    
class PayrollPredictor(BaseAgent):
    nodes = {
        "load_employee_data": fetch_ytd,
        "predict_earnings": claude_forecast,
        "calculate_cash_advance": auto_suggest_ca,
        "alert_management": notify_cfo,
    }
```

**Key Features**
- Time-series prediction (3개월 선행)
- 현금 부족 예측 & 자동 대출 제안
- 세금/보험료 실시간 계산

#### Agent 3: Customer Analytics (2주)
```python
class CustomerAnalyticsState(BaseModel):
    customer_id: int
    booking_history: list
    churn_score: float
    segment: str  # VIP, Regular, At-risk
    actions: list
    
class CustomerAnalytics(BaseAgent):
    nodes = {
        "load_history": fetch_bookings,
        "calculate_ltv": compute_lifetime_value,
        "predict_churn": claude_analyze,
        "generate_offers": auto_suggest_promotions,
        "send_campaign": execute_marketing,
    }
```

---

## 📅 3개월 구현 로드맵 (병렬 처리)

### Week 1-4: Phase 1 - 기초 자동화

```
┌─────────────────────────────────────────┐
│ Week 1-2: Architecture & Setup          │
├─────────────────────────────────────────┤
│ ✓ LangGraph 환경 설정                    │
│ ✓ Claude API 통합 (Prompt Caching)      │
│ ✓ PostgreSQL + Supabase 준비            │
│ ✓ WebSocket 기본 구조 (기존 확장)       │
│ Files: config.py, graph_setup.py        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Week 2-4: Agent 1 - Schedule Optimizer  │
├─────────────────────────────────────────┤
│ ✓ State 정의                            │
│ ✓ 5개 Node 구현                         │
│ ✓ Claude API 통합 (추천)                │
│ ✓ Conflict detection                   │
│ ✓ Frontend UI (Recommendation Panel)    │
│ Files: schedule_optimizer.py (500줄)    │
│        schedule_api.py (300줄)          │
│        ScheduleRecommendation.tsx       │
└─────────────────────────────────────────┘

│ Parallel: Payroll Enhancement           │
├─────────────────────────────────────────┤
│ ✓ 기존 payroll 모델 확장                 │
│ ✓ Claude API로 예측 기능 추가           │
│ ✓ 자동 차입 제안                        │
│ Files: payroll_predictor.py             │
└─────────────────────────────────────────┘

결과: Schedule Optimizer 완성 (60% KPI 달성)
```

### Week 5-8: Phase 2 - 고급 자동화

```
┌─────────────────────────────────────────┐
│ Week 5-6: Agent 2 & 3 - 병렬 개발       │
├─────────────────────────────────────────┤
│ LEFT TRACK: Customer Analytics          │
│ ✓ 재방문 예측 모델                      │
│ ✓ Churn risk 스코어                     │
│ ✓ 자동 리마인더 (SMS/카톡)              │
│ Files: customer_analytics.py            │
│        marketing_automation.py          │
│                                         │
│ RIGHT TRACK: Reports & Integration      │
│ ✓ 자동 리포트 생성                      │
│ ✓ 은행 API 통합                         │
│ ✓ Google Sheets 연동                    │
│ Files: report_generator.py              │
│        bank_integration.py              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Week 7-8: System Integration            │
├─────────────────────────────────────────┤
│ ✓ 3개 Agent 통합 (Supervisor)           │
│ ✓ 상태 동기화                           │
│ ✓ E2E 테스트 (Pytest)                   │
│ ✓ 성능 최적화 (API 응답 < 100ms)        │
│ Files: supervisor_orchestrator.py       │
│        tests/test_integration.py        │
└─────────────────────────────────────────┘

결과: 4개 자동화 영역 완성 (80% KPI 달성)
```

### Week 9-12: Phase 3 - 실시간 의사결정

```
┌─────────────────────────────────────────┐
│ Week 9-10: Real-time Decision Engine    │
├─────────────────────────────────────────┤
│ ✓ Event-driven architecture             │
│ ✓ Redis event queue                     │
│ ✓ Auto-resolution (no-show, 지각, 클레임)│
│ ✓ SOS 상황 대응                         │
│ Files: realtime_decision_agent.py       │
│        incident_handler.py              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Week 11-12: API Integration & Monitoring│
├─────────────────────────────────────────┤
│ ✓ Kakao Channel API                     │
│ ✓ Bank API (자동 이체)                  │
│ ✓ Google Calendar 동기화                │
│ ✓ Slack/Discord 통합                    │
│ ✓ 모니터링 & 로깅                       │
│ Files: kakao_channel.py                 │
│        bank_integration.py              │
│        calendar_sync.py                 │
└─────────────────────────────────────────┘

결과: 전사 자동화 플랫폼 완성 (100% KPI)
```

---

## 💻 기술 스택 상세

### Backend Extensions
```python
# 새로운 의존성
langgraph==0.0.30+
anthropic==0.28.0+
redis==5.0+
celery==5.3+
python-dotenv==1.0+
google-cloud-sheets==1.10+
twilio==9.0+
```

### Frontend Extensions
```typescript
// 새로운 라이브러리
@langchain/core==0.1+
zustand==4.4+
react-query==3.39+
recharts==2.10+  // 리포트 시각화
framer-motion==10+  // 실시간 알림 애니메이션
```

### Infrastructure
```yaml
Database:
  - PostgreSQL (기존)
  - Redis (이벤트 큐)
  - Supabase (백업/실시간)

Compute:
  - FastAPI + Uvicorn (기존)
  - Celery Worker (비동기)
  - LangGraph Runtime (오케스트레이션)

Monitoring:
  - Sentry (에러 추적, 기존)
  - Prometheus + Grafana (메트릭)
  - CloudWatch (로그)

External APIs:
  - Anthropic Claude API (추천/예측)
  - Google Sheets API (리포트)
  - Bank APIs (정산금 이체)
  - Kakao Talk Channel (메시지)
  - Twilio (SMS)
```

---

## 📊 기대 효과 & KPI

| 자동화 영역 | 현재 | 목표 | 기간 |
|----------|------|------|------|
| **급여정산** | 수동 계산 50분 | 자동 1초 | W1-2 |
| **스케줄** | 충돌 율 15% | 자동 해결 95% | W2-4 |
| **고객** | No-show 25% | 자동 예방 5% | W5-6 |
| **리포트** | 수동 작성 2시간 | 자동 생성 5분 | W7-8 |
| **대응** | 수동 조치 30분 | 자동 2초 | W9-10 |
| **API** | 수동 이체 1시간 | 자동 3초 | W11-12 |

**ROI 계산**
```
연간 절감 시간:
  급여정산: 50분/회 × 12개월 = 10시간
  스케줄: 30분/일 × 260일 = 130시간
  고객 대응: 15분/건 × 500건/년 = 125시간
  리포트: 2시간/월 × 12개월 = 24시간
  ────────────────────────────
  합계: 289시간 = $7,225/년 (@ $25/시간)

추가 수익:
  No-show 감소로 인한 추가 예약: +5%
  스케줄 최적화로 인한 예약 증대: +8%
  ────────────────────────────
  합계: +13% 매출 증가 (월 $10,000 → $11,300)
  연간: $15,600 추가 수익

Total ROI: (15,600 + 7,225) / 개발비 = 양의 ROI (개발비 < $25,000)
```

---

## 🔐 보안 & 규정

### 데이터 보안
- ✅ API Key 관리 (환경 변수)
- ✅ 트랜잭션 암호화 (은행 API)
- ✅ 감사 로그 (모든 자동화 액션)
- ✅ GDPR/CCPA 준수 (고객 데이터)

### AI 윤리
- ✅ Claude API 사용 정책 준수
- ✅ 자동화 의사결정 투명성 (로그)
- ✅ 인간 개입 옵션 (항상 가능)

---

## 📚 참고 자료 & 학습 경로

### LangGraph 학습
1. [LangGraph 공식 문서](https://langchain-ai.github.io/langgraph/)
2. [LangGraph 튜토리얼](https://github.com/langchain-ai/langgraph/tree/main/examples)
3. [Multi-agent 패턴](https://python.langchain.com/docs/modules/agents/)

### Claude API
1. [Claude 3.5 모델 가이드](https://docs.anthropic.com/)
2. [Prompt Caching](https://docs.anthropic.com/en/docs/build-a-bot/agent-loop)
3. [Tool Use & Structured Output](https://docs.anthropic.com/en/docs/build-a-bot/tool-use)

### 구현 참고
- ELSPA 기존 payroll orchestrator (`app/agents/payroll_orchestrator.py`)
- Schedule Table View (`frontend/src/app/admin/massage/`)
- FastAPI routers (`app/routers/`)

---

## ✅ 체크리스트 (Phase별)

### Phase 1: Schedule Optimizer (W1-4)
- [ ] LangGraph 환경 설정
- [ ] Claude API 통합
- [ ] Schedule optimizer 구현 (5개 Node)
- [ ] Conflict detection
- [ ] Frontend UI
- [ ] E2E 테스트
- [ ] 배포

### Phase 2: Advanced Automation (W5-8)
- [ ] Customer analytics
- [ ] Payroll predictor
- [ ] Report generator
- [ ] Bank integration
- [ ] Google Sheets API
- [ ] Multi-agent orchestration
- [ ] 배포

### Phase 3: Real-time Decision (W9-12)
- [ ] Real-time event pipeline
- [ ] Auto-resolution engine
- [ ] Kakao Channel API
- [ ] Calendar sync
- [ ] Monitoring & alerting
- [ ] 최종 배포

---

## 🚀 다음 단계

1. **Week 1**: LangGraph 환경 설정 + Claude API 통합
2. **Week 2**: Schedule optimizer 설계 & 개발 시작
3. **Week 4**: 첫 번째 자동화 영역 완성 & KPI 측정
4. **Month 2**: 고객/비용 자동화 병렬 개발
5. **Month 3**: 실시간 의사결정 시스템 완성

---

**작성자**: jitnet57 (ELSPA PM)  
**최종 검토**: 2026-05-29  
**상태**: ✅ 준비 완료 (개발 시작 대기)
