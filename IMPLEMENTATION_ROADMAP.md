# ELSPA 자동화 구현 로드맵 (12주)

> 병렬 처리 기반 3단계 구현 계획  
> **작성일**: 2026-05-29  
> **총 소요시간**: 12주 (480시간)

---

## 📋 로드맵 요약

| Phase | 주차 | 주제 | 기술 | 목표 |
|-------|------|------|------|------|
| **1** | W1-2 | 아키텍처 & 기초 | LangGraph, Claude API | 환경 설정 완료 |
| **1** | W2-4 | Schedule Optimizer | LangGraph 5-Node | 스케줄 자동화 |
| **2** | W5-6 | Customer & Payroll | Multi-agent | 고객/급여 분석 |
| **2** | W7-8 | 리포트 & 통합 | Scheduler, API | 자동 리포트 |
| **3** | W9-10 | 실시간 대응 | Redis, Event-driven | AI 의사결정 |
| **3** | W11-12 | API & 배포 | Bank, Kakao, Deploy | 프로덕션 준비 |

---

## 📅 Week-by-Week 상세 계획

### PHASE 1: 기초 자동화 (W1-4)

---

#### **Week 1-2: 아키텍처 & 환경 설정** (40시간)

**목표**: LangGraph + Claude API 통합 완료

**작업 분배**
```
Day 1-2: 아키텍처 설계 (10시간)
  ├─ LangGraph 학습 (공식 문서, 튜토리얼)
  ├─ State 설계 (TypedDict 정의)
  ├─ Graph 구조 설계 (Supervisor + 3개 Sub-graph)
  └─ 데이터베이스 확장 설계

Day 3-4: Claude API 통합 (12시간)
  ├─ API Key 관리 (environment variables)
  ├─ Prompt Caching 설정
  ├─ Tool Use 구현 (DB Query 도구)
  ├─ Error handling & retry logic
  └─ 비용 최적화 (캐싱으로 50% 절감 목표)

Day 5-6: PostgreSQL 확장 (10시간)
  ├─ LangGraph 체크포인트 테이블 생성
  ├─ Agent 실행 로그 테이블
  ├─ 메트릭 저장 테이블
  └─ 마이그레이션 스크립트

Day 7-10: 기본 보일러플레이트 (8시간)
  ├─ graph_setup.py (기본 그래프 초기화)
  ├─ config.py (LangGraph 설정)
  ├─ agents/__init__.py (에이전트 모듈)
  └─ tests/test_graph_setup.py (초기 테스트)
```

**생성 파일**
```
app/
├── agents/
│   ├── __init__.py
│   ├── graph_setup.py (600줄)
│   ├── supervisor.py (200줄)
│   └── state.py (150줄)
├── config/
│   ├── langgraph_config.py (100줄)
│   └── claude_config.py (80줄)
├── routers/
│   └── agents_api.py (100줄)
└── tests/
    └── test_graph_setup.py (150줄)
```

**KPI**
- ✅ Claude API 정상 연동
- ✅ Prompt Caching 동작 확인
- ✅ 기본 State 정의 완료
- ✅ DB 마이그레이션 완료

---

#### **Week 2-4: Schedule Optimizer 구현** (80시간)

**목표**: 5-Node Schedule Optimizer 완성 & 테스트

**작업 분배**

**Week 2-3 (40시간): 핵심 구현**
```
Day 1-2: Node 1-2 구현 (15시간)
  ├─ load_data Node
  │   ├─ Booking 조회 쿼리
  │   ├─ Customer 선호도 조회
  │   ├─ Therapist 정보 로드
  │   ├─ 가용성 계산 (예약 충돌 감지)
  │   └─ Unit test (5개 TC)
  │
  └─ check_conflicts Node
      ├─ 예약 시간 충돌 감지
      ├─ 테라피스트 능력 확인
      ├─ 서비스 가능 여부 검증
      └─ Unit test (8개 TC)

Day 3-4: Node 3 구현 (Claude AI) (15시간)
  ├─ Claude API 호출 구현
  ├─ Prompt 작성 (추천 로직)
  ├─ Tool Use (SQL 쿼리 자동화)
  ├─ Structured output (JSON 스키마)
  ├─ Prompt Caching 최적화
  ├─ 비용 측정 (평균 API 비용)
  └─ Integration test (5개 TC)

Day 5-6: Node 4-5 구현 (10시간)
  ├─ rank_options Node
  │   ├─ 점수 기반 정렬
  │   ├─ 신뢰도 계산
  │   └─ Unit test (4개 TC)
  │
  └─ format_response Node
      ├─ 최종 응답 포맷
      ├─ 근거 생성 (자연어)
      └─ Unit test (3개 TC)
```

**Week 3-4 (40시간): Frontend + 통합 테스트**
```
Day 1-2: Frontend UI 구현 (20시간)
  ├─ Recommendation Panel 컴포넌트 (200줄)
  │   ├─ 탭 UI (제안된 시간대, 테라피스트)
  │   ├─ 신뢰도 게이지
  │   ├─ 추천 근거 표시
  │   └─ 선택 버튼
  │
  ├─ Recommendation Hook (50줄)
  │   ├─ API 호출 로직
  │   ├─ 로딩 상태 관리
  │   └─ 에러 처리
  │
  └─ Schedule View 통합 (150줄)
      ├─ 추천 패널 레이아웃
      ├─ 선택 시 일정 업데이트
      └─ 실시간 업데이트

Day 3-4: E2E 테스트 (Cypress) (15시간)
  ├─ 정상 추천 케이스 (3개 TC)
  ├─ 충돌 감지 & 자동 해결 (3개 TC)
  ├─ 다중 옵션 선택 (2개 TC)
  └─ 에러 핸들링 (3개 TC)

Day 5: 성능 테스트 (5시간)
  ├─ API 응답 시간 측정 (목표: < 2초)
  ├─ 메모리 사용량 확인
  ├─ Claude API 비용 분석
  └─ Prompt Caching 효과 측정
```

**생성 파일**
```
app/
├── agents/
│   ├── schedule_optimizer.py (500줄)
│   └── schedule_graph.py (300줄)
├── routers/
│   └── schedule_api.py (300줄)
└── tests/
    ├── test_schedule_optimizer.py (400줄)
    └── test_schedule_e2e.py (200줄)

frontend/
├── src/
│   ├── components/
│   │   ├── ScheduleRecommendation.tsx (250줄)
│   │   ├── RecommendationPanel.tsx (200줄)
│   │   └── ConfidenceGauge.tsx (100줄)
│   ├── hooks/
│   │   └── useScheduleOptimizer.ts (120줄)
│   └── app/
│       └── admin/
│           └── massage/
│               └── page.tsx (수정: 150줄 추가)
└── cypress/
    └── e2e/
        └── schedule-optimizer.cy.ts (300줄)
```

**테스트 케이스**
```
Unit Tests: 23개
  ├─ load_data: 5개
  ├─ check_conflicts: 8개
  ├─ generate_options: 5개
  ├─ rank_options: 4개
  └─ format_response: 3개

Integration Tests: 5개
  ├─ Full graph flow: 3개
  └─ Error scenarios: 2개

E2E Tests: 11개
  ├─ Normal recommendation: 3개
  ├─ Conflict resolution: 3개
  ├─ Multi-option selection: 2개
  ├─ Error handling: 3개

Total: 39개 TC
```

**KPI**
- ✅ 스케줄 최적화 엔드-to-엔드 완성
- ✅ 추천 정확도 > 85%
- ✅ API 응답 시간 < 2초
- ✅ 테스트 커버리지 > 90%
- ✅ 충돌 감지율 100%

**리뷰 & 승인**
- 코드 리뷰 (동료 1명)
- 성능 테스트 검증
- 프로덕션 준비 체크리스트

---

### PHASE 2: 고급 자동화 (W5-8)

---

#### **Week 5-6: Customer Analytics & Payroll Predictor (병렬)** (80시간)

**목표**: 2개 에이전트 동시 개발 & 통합

**LEFT TRACK: Customer Analytics (40시간)**

```
Day 1-2: 데이터 준비 & 분석 (12시간)
  ├─ Customer booking history 모델 확장
  ├─ RFM 분석 (Recency, Frequency, Monetary)
  ├─ Churn prediction 데이터 준비
  ├─ Historical data aggregation
  └─ Unit test (8개 TC)

Day 3-4: Claude AI 분석 (15시간)
  ├─ Churn risk 스코어 계산 (AI 기반)
  ├─ LTV 예측
  ├─ 고객 세분화 (VIP, Regular, At-risk)
  ├─ 타겟 오퍼 생성
  └─ Integration test (5개 TC)

Day 5-6: 마케팅 자동화 (13시간)
  ├─ 자동 리마인더 (SMS/카톡)
  ├─ 할인 오퍼 생성 & 발송
  ├─ 고객 분석 API (3개 엔드포인트)
  ├─ 대시보드 UI (150줄)
  └─ E2E test (5개 TC)
```

**생성 파일**
```
app/
├── agents/
│   ├── customer_analytics.py (400줄)
│   └── customer_graph.py (250줄)
├── services/
│   ├── churn_prediction.py (200줄)
│   └── marketing_automation.py (180줄)
├── routers/
│   └── customer_api.py (250줄)
└── tests/
    ├── test_customer_analytics.py (300줄)
    └── test_marketing_automation.py (200줄)

frontend/
├── src/
│   ├── components/
│   │   ├── ChurnRiskCard.tsx (120줄)
│   │   ├── CustomerSegmentChart.tsx (140줄)
│   │   └── OfferPanel.tsx (100줄)
│   └── app/
│       └── admin/
│           └── customer-insights/ (신규)
│               ├── page.tsx (300줄)
│               └── components/ (200줄)
```

---

**RIGHT TRACK: Payroll Predictor (40시간)**

```
Day 1-2: 급여 예측 모델 (12시간)
  ├─ YTD 데이터 수집
  ├─ 초과근무 패턴 분석
  ├─ 보너스/특별 수당 반영
  ├─ 과거 12개월 데이터 준비
  └─ Unit test (6개 TC)

Day 3-4: Claude AI 예측 (15시간)
  ├─ 급여 예측 (다음 달)
  ├─ 세금/보험료 자동 계산
  ├─ 현금 부족 예측
  ├─ 자동 차입 제안
  └─ Integration test (4개 TC)

Day 5-6: 알림 & 제안 (13시간)
  ├─ 급여 부족 알림 (관리자)
  ├─ 자동 차입 신청 프로세스
  ├─ 예측 대시보드 (월별 그래프)
  ├─ 급여 선금 API (2개 엔드포인트)
  └─ E2E test (4개 TC)
```

**생성 파일**
```
app/
├── agents/
│   ├── payroll_predictor.py (350줄)
│   └── payroll_graph.py (200줄)
├── services/
│   └── prediction_engine.py (250줄)
├── routers/
│   └── payroll_prediction_api.py (200줄)
└── tests/
    ├── test_payroll_predictor.py (300줄)
    └── test_cash_advance_auto.py (150줄)

frontend/
├── src/
│   ├── components/
│   │   ├── SalaryForecast.tsx (180줄)
│   │   ├── CashAdvanceWidget.tsx (150줄)
│   │   └── TaxEstimate.tsx (100줄)
│   └── app/
│       └── admin/
│           └── payroll/
│               └── prediction/ (신규)
│                   └── page.tsx (250줄)
```

---

**Week 7-8: 통합 & 리포트 생성** (80시간)

```
Day 1-2: Supervisor Graph (3개 에이전트 통합) (12시간)
  ├─ SupervisorGraph 구현
  ├─ Conditional routing
  ├─ 상태 동기화
  ├─ 병렬 실행 (async)
  └─ Integration test (5개 TC)

Day 3-4: 자동 리포트 생성 (20시간)
  ├─ 일일 리포트
  │   ├─ 어제 매출 요약
  │   ├─ 예약 현황
  │   ├─ 테라피스트 실적
  │   └─ 생성 시간: 06:00
  │
  ├─ 주간 리포트
  │   ├─ 트렌드 분석
  │   ├─ TOP 3 테라피스트
  │   ├─ 고객 만족도
  │   └─ 생성 시간: 월요일 08:00
  │
  └─ 월간 리포트
      ├─ 매출/비용 분석
      ├─ 급여 정산
      ├─ 세금/보험료
      └─ 생성 시간: 월 1일 10:00

Day 5-6: Google Sheets 통합 (18시간)
  ├─ Google Sheets API 연동
  ├─ 일일 리포트 → Sheets 자동 작성
  ├─ 월간 리포트 → 차트 자동 생성
  ├─ 공유 설정 (관리자에게)
  ├─ 형식화 & 시각화
  └─ 스케줄링 (APScheduler)

Day 7: Email 발송 (10시간)
  ├─ 리포트 PDF 변환
  ├─ 자동 이메일 발송 (관리자)
  ├─ 템플릿 작성
  └─ E2E test (3개 TC)
```

**생성 파일**
```
app/
├── agents/
│   └── supervisor_orchestrator.py (300줄)
├── services/
│   ├── report_generator.py (400줄)
│   ├── google_sheets_service.py (250줄)
│   └── email_service.py (150줄)
├── routers/
│   ├── supervisor_api.py (200줄)
│   └── reports_api.py (200줄)
├── jobs/
│   └── scheduled_reports.py (200줄)
└── tests/
    ├── test_supervisor_orchestrator.py (250줄)
    ├── test_report_generator.py (300줄)
    └── test_sheets_integration.py (200줄)

frontend/
├── src/
│   └── app/
│       └── admin/
│           └── reports/ (신규)
│               ├── page.tsx (250줄)
│               └── components/ (150줄)
```

**KPI**
- ✅ Customer Analytics 완성
- ✅ Payroll Predictor 완성
- ✅ 자동 리포트 생성 (3종류)
- ✅ Google Sheets 동기화
- ✅ 전사 자동화 기본 플랫폼 완성

---

### PHASE 3: 실시간 의사결정 (W9-12)

---

#### **Week 9-10: Real-time Event Pipeline & Auto-Response** (80시간)

**목표**: 실시간 이벤트 감지 & 자동 대응

```
Day 1-2: Event-driven Architecture (12시간)
  ├─ Redis Pub/Sub 설정
  ├─ Event queue 구현
  ├─ Event schema 정의 (5개 이벤트 타입)
  ├─ Producer 구현
  └─ Unit test (6개 TC)

Day 3-4: Incident Handler (18시간)
  ├─ No-show 감지 & 대응
  │   ├─ 예약 시간 + 15분 체크
  │   ├─ 자동 대체 배치 (Schedule Optimizer 재사용)
  │   ├─ 고객 오퍼 생성 (20% 할인)
  │   └─ 테라피스트 알림
  │
  ├─ 테라피스트 지각 감지 & 대응
  │   ├─ GPS 기반 위치 확인
  │   ├─ 지각 예상 시간 계산
  │   ├─ 관리자 알림
  │   ├─ 대체 테라피스트 자동 추천
  │   └─ 고객에게 변경 제안
  │
  └─ 고객 클레임 대응
      ├─ 음성/텍스트 감정 분석
      ├─ 자동 환불 처리 (경미함)
      ├─ 관리자 에스컬레이션 (심각함)
      └─ 만족도 피드백 수집

Day 5: AI 의사결정 엔진 (15시간)
  ├─ Real-time Decision Agent (200줄)
  ├─ Claude API 호출 (상황 분석)
  ├─ 자동 액션 선택
  ├─ 신뢰도 평가
  └─ Integration test (4개 TC)

Day 6-7: WebSocket 통합 (15시간)
  ├─ Real-time notification (사용자)
  ├─ Admin dashboard (실시간 업데이트)
  ├─ 상황 알림 (SMS/카톡 추가)
  └─ E2E test (4개 TC)
```

**생성 파일**
```
app/
├── agents/
│   ├── realtime_decision_agent.py (400줄)
│   └── incident_handler.py (350줄)
├── services/
│   ├── event_manager.py (200줄)
│   └── sms_alert_service.py (150줄)
├── routers/
│   ├── websocket_realtime.py (250줄)
│   └── incident_api.py (150줄)
└── tests/
    ├── test_realtime_decision.py (300줄)
    └── test_incident_handler.py (250줄)

frontend/
├── src/
│   ├── components/
│   │   ├── RealTimeAlerts.tsx (200줄)
│   │   ├── IncidentNotification.tsx (150줄)
│   │   └── AdminDashboard.tsx (300줄)
│   └── hooks/
│       └── useRealTimeEvents.ts (100줄)
```

---

#### **Week 11-12: API 통합 & 최종 배포** (80시간)

**목표**: 전사 자동화 플랫폼 프로덕션 준비 완료

```
Day 1-2: Kakao Channel API 통합 (15시간)
  ├─ Kakao Talk Channel 설정
  ├─ 메시지 발송 자동화
  │   ├─ 예약 알림 (24시간 전)
  │   ├─ 급여 지급 알림
  │   ├─ 프로모션 메시지
  │   └─ 긴급 알림 (no-show, 지각)
  ├─ 리치 메시지 (버튼, 이미지)
  └─ Integration test (5개 TC)

Day 3-4: 은행 API 통합 (18시간)
  ├─ BDO, Metrobank API 연동
  ├─ 자동 정산금 이체
  │   ├─ 월말 자동 계좌 이체
  │   ├─ 실시간 이체 상태 추적
  │   ├─ 오류 처리 (실패 시 재시도)
  │   └─ 감사 로그
  ├─ 보안 (암호화, API Key 관리)
  └─ Integration test (6개 TC)

Day 5-6: Google Calendar 동기화 (12시간)
  ├─ Google Calendar API
  ├─ 예약 → Calendar 자동 추가
  ├─ 취소 → Calendar 자동 삭제
  ├─ 일정 변경 → Calendar 자동 업데이트
  └─ Unit & Integration test (4개 TC)

Day 7: Slack/Discord 통합 (15시간)
  ├─ 관리자 알림 채널
  ├─ 일일 리포트
  ├─ 긴급 알림
  ├─ 성과 공유 (TOP 테라피스트)
  └─ E2E test (3개 TC)
```

**생성 파일**
```
app/
├── integrations/
│   ├── kakao_channel.py (200줄)
│   ├── bank_api.py (250줄)
│   ├── google_calendar.py (180줄)
│   └── slack_discord.py (150줄)
├── routers/
│   └── integrations_api.py (200줄)
└── tests/
    ├── test_kakao_integration.py (150줄)
    ├── test_bank_integration.py (200줄)
    ├── test_calendar_sync.py (120줄)
    └── test_slack_integration.py (100줄)
```

**배포 작업 (10시간/day × 2 = 20시간)**
```
Day 1: Docker & CI/CD
  ├─ Dockerfile 작성
  ├─ docker-compose.yml (개발 환경)
  ├─ GitHub Actions 워크플로우
  ├─ PR 검증 (타입 체크, 테스트)
  └─ 자동 배포 설정 (Cloudflare Pages, Railway)

Day 2: 모니터링 & 프로덕션 체크리스트
  ├─ Sentry (에러 추적)
  ├─ Prometheus + Grafana (메트릭)
  ├─ CloudWatch (로그)
  ├─ 부하 테스트 (1,000 동시 요청)
  └─ 성능 최적화 (캐싱, DB 인덱싱)
```

**생성 파일**
```
deployment/
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── deploy.yml
│       └── monitoring.yml
└── kubernetes/ (optional)
    ├── deployment.yaml
    ├── service.yaml
    └── configmap.yaml

docs/
├── DEPLOYMENT.md
├── RUNBOOK.md
└── API_DOCUMENTATION.md
```

---

## 📊 시간 할당 및 리소스

### 총 시간 계획 (480시간)

| Phase | 주차 | 개발 | 테스트 | 배포 | 문서 | 합계 |
|-------|------|------|--------|------|------|------|
| 1-아키텍처 | W1-2 | 30h | 6h | 2h | 2h | 40h |
| 1-Schedule | W2-4 | 60h | 15h | 3h | 2h | 80h |
| 2-Customer | W5-6 | 30h | 8h | 1h | 1h | 40h |
| 2-Payroll | W5-6 | 30h | 6h | 2h | 2h | 40h |
| 2-Report | W7-8 | 40h | 10h | 5h | 5h | 60h |
| 3-RT Events | W9-10 | 50h | 20h | 5h | 5h | 80h |
| 3-API & 배포 | W11-12 | 50h | 15h | 10h | 5h | 80h |
| **합계** | **12주** | **290h** | **80h** | **28h** | **22h** | **480h** |

### 인력 구성 (권장)

```
전체: 1명 (개발자) + 0.25명 (QA, 파트타임)

병렬 작업 (W5-6):
  ├─ 개발자 A: Customer Analytics
  └─ 개발자 B: Payroll Predictor
  
또는 1명이 순차 진행 (총 시간 동일)
```

---

## ✅ 마일스톤 & 승인 기준

### Milestone 1: Schedule Optimizer 완성 (W4 말)
**기준**
- [ ] 5개 Node 모두 구현 & 테스트
- [ ] Claude API 비용 < $50/월
- [ ] API 응답 시간 < 2초 (p99)
- [ ] 테스트 커버리지 > 90%
- [ ] Frontend UI 완성 & 반응형
- [ ] 운영 문서 완성

**KPI**
- 충돌 감지율: 100%
- 추천 정확도: > 85%
- 배치 시간: 10분 → 1초

---

### Milestone 2: Multi-agent Orchestration (W8 말)
**기준**
- [ ] 3개 에이전트 모두 구현
- [ ] Supervisor Graph 통합 테스트 통과
- [ ] 자동 리포트 생성 (3종류)
- [ ] Google Sheets 동기화 검증
- [ ] 성능 테스트 통과 (< 5초 end-to-end)

**KPI**
- No-show 감소: 25% → 5%
- 자동화 비율: 60% → 85%
- 수동 작업 절감: 40시간/월

---

### Milestone 3: 프로덕션 배포 (W12 말)
**기준**
- [ ] 모든 API 통합 테스트 통과
- [ ] 부하 테스트 (1,000 concurrent) 통과
- [ ] 보안 감사 (Snyk, OWASP Top 10)
- [ ] Monitoring 대시보드 활성화
- [ ] 배포 자동화 (GitHub Actions)
- [ ] 운영 가이드 & Runbook 완성

**KPI**
- 시스템 가용성: > 99.5%
- API 응답 시간: p99 < 3초
- 에러율: < 0.1%

---

## 🔄 주간 스프린트 프로세스

### 스프린트 사이클 (1주)

**월요일: 계획 회의 (1시간)**
- 현주 목표 정의
- 우선순위 순서 조정
- 장애물 파악

**화-목요일: 개발 (주중 3일)**
- 매일 10:00 Standup (15분)
- 코드 리뷰 (Pull Request)
- 진행 상황 추적

**금요일: 리뷰 & 회고 (2시간)**
- 데모 (완성된 기능)
- 테스트 결과 검토
- 다음주 개선 사항 논의

---

## 📈 위험 관리

### 주요 위험 요소

| 위험 | 가능성 | 영향 | 완화 방안 |
|------|--------|------|---------|
| Claude API 비용 초과 | 중간 | 높음 | Prompt Caching 최적화, 토큰 제한 |
| LangGraph 성능 병목 | 낮음 | 높음 | 조기 부하 테스트, 캐싱 전략 |
| 데이터 품질 문제 | 중간 | 중간 | 데이터 검증, 정제 파이프라인 |
| 외부 API 중단 (Bank, Kakao) | 낮음 | 높음 | Fallback 메커니즘, Mock 서버 |
| 보안 취약점 | 낮음 | 높음 | 정기 보안 감사, 침투 테스트 |

### 대응 계획
- 주간 리스크 리뷰 (금요일)
- 장애 대응 계획 수립
- 긴급 대응팀 구성

---

## 🚀 성공 정의

**개발 완료 기준**
1. ✅ 모든 12주 마일스톤 달성
2. ✅ 6개 자동화 영역 모두 구현
3. ✅ 테스트 커버리지 > 85%
4. ✅ 프로덕션 배포 완료
5. ✅ 모니터링 & 로깅 활성화

**비즈니스 KPI**
- 시간 절감: 289시간/년 (ROI: 7,225달러)
- 수익 증대: +13% 예약 증가 (15,600달러/년)
- 비용 절감: 자동화로 직원 1명 작업량 감소 (12,000달러/년)
- **Total First Year ROI: 34,825달러** (개발비 < 25,000달러)

---

**문서 작성자**: jitnet57  
**최종 검토**: 2026-05-29  
**상태**: ✅ 준비 완료
