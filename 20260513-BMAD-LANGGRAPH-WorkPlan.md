# ElSpa 실시간 운영 시스템 | BMAD × LANGGRAPH 협업 워크플로우 계획

**작성일:** 2026-05-13  
**프레임워크:** BMAD (Business Model Analysis & Design) + LANGGRAPH (Workflow Orchestration)  
**대상:** 8개 팀 병렬 처리, 의존성 관리, 순차 실행 식별

---

## 📊 1. BMAD 기반 비즈니스 모델 분해

### 1.1 핵심 가치 제안 (Value Proposition)

**문제:** 60명+ 테라피스트 × 86개 침대 운영이 100% 수작업
- 침대 상태 파악 → 매니저 육안 확인
- 테라피스트 대기 현황 → 카톡/구두 보고
- 배정 결정 → 경험의존적 판단

**솔루션:** 2개 화면 1개 엔진으로 전체 상태 실시간 시각화 + AI 자동 제안
- 카운터 모니터 (읽기 전용, 대형 화면)
- 어드민 제어판 (매칭 확정, 시뮬레이션)
- 상태 엔진 (침대/테라피스트 상태 + 매칭 알고리즘)

**핵심 지표 (KPI):**
- 고객 대기시간 30% 감소
- 테라피스트 유휴시간 20% 감소
- 매니저 의사결정 시간 90% 단축

---

### 1.2 기술 아키텍처 분해 (Technical Decomposition)

```
┌─────────────────────────────────────────────────────────────┐
│               State Management Layer (Redux/Zustand)        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │  Beds State  │ │Therapists St │ │ Bookings St  │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└────────────────┬─────────────────────────────────┬──────────┘
                 │                                  │
         ┌───────▼──────────┐          ┌──────────▼─────────┐
         │  API Client      │          │ Real-time Engine  │
         │ (React Query)    │          │ (Polling/Websocket)│
         └───────┬──────────┘          └──────────┬─────────┘
                 │                                  │
         ┌───────▼──────────────────────────────────▼────────┐
         │         FastAPI Backend (SQLAlchemy + NeonDB)    │
         │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
         │  │ Bed API    │ │Matching API│ │Therapist API │  │
         │  └────────────┘ └────────────┘ └──────────────┘  │
         └────────────────┬─────────────────────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  NeonDB (PostgreSQL)            │
         │  ┌──────────┐ ┌──────────────┐  │
         │  │  beds    │ │ therapists   │  │
         │  │ bookings │ │ attendance   │  │
         │  └──────────┘ └──────────────┘  │
         └─────────────────────────────────┘
```

---

### 1.3 비즈니스 프로세스 흐름 (Business Process Flow)

**Process 1: 신규 고객 예약 → 매칭 → 배정**

```
고객 예약 생성
    ↓
AI 매칭 실행 (70/20/10)
    ↓
상위 3명 후보 제안 (어드민)
    ↓
매니저 확인 클릭 (또는 5분 자동 확정)
    ↓
침대 + 테라피스트 상태 동시 업데이트
    ↓
카운터/어드민 화면 즉시 반영 (5초 이내)
```

**Process 2: 서비스 종료 → 다음 대기 예약 매칭**

```
서비스 ends_at 도달
    ↓
침대 상태 → [in_service] → [cleaning]
테라피스트 상태 → [in_service] → [resting]
    ↓
다음 대기 예약 자동 스캔
    ↓
미배정 예약 있으면 즉시 재매칭
    ↓
어드민에 알림 (배지 + 팝업)
```

---

## 🎯 2. LANGGRAPH 오케스트레이션 설계

### 2.1 워크플로우 그래프 정의

```
Node: BedsPolling (5초마다)
    Input: 현재 beds state
    Output: 업데이트된 beds 배열
    Trigger: setInterval(5000)
    Async: YES (API call to /api/beds)

Node: TherapistsPolling (5초마다)
    Input: 현재 therapists state
    Output: 업데이트된 therapists 배열
    Async: YES (API call to /api/therapists)

Node: StatsCalculation (BedsPolling 직후)
    Input: Updated beds
    Output: {available, reserved, in_service, cleaning}
    Dependencies: [BedsPolling]

Node: PredictionEngine (BedsPolling + TherapistsPolling 완료 후)
    Input: updated beds + therapists
    Output: {wait_time, next_available_therapist, next_available_bed}
    Dependencies: [BedsPolling, TherapistsPolling]

Node: MatchingProposal (신규 예약 또는 서비스 종료 시)
    Input: Pending bookings + available therapists
    Output: [Candidate 1, 2, 3] with scores
    Trigger: Manual trigger OR auto on booking creation
    Async: YES (AI matching algorithm)
    Dependencies: [TherapistsPolling]

Node: MatchingConfirmation (매니저 수동 승인)
    Input: Selected candidate + booking
    Output: Confirmed matching record
    Trigger: Manager click
    Side effects: Update bed + therapist status
    Dependencies: [MatchingProposal]

Node: NotificationQueue (모든 상태 변경 후)
    Input: All state changes
    Output: [Notification 1, 2, 3, ...]
    Task: Emit to UI (badge, modal, visual effect)
    Dependencies: [ALL nodes]
```

### 2.2 실행 순서 (Execution DAG)

```
Time 0s:
  ┌─ BedsPolling ────────┐
  │                      │
  └─ TherapistsPolling ──┘
       ↓
       ├─ StatsCalculation
       └─ PredictionEngine
             ↓
             └─ NotificationQueue → UI Update

Time 5s: (Repeat)
  [Same as Time 0s]

Event: New Booking
       ↓
       └─ MatchingProposal (async)
             ↓
             └─ [Wait for Manager Action OR 5min timeout]
                    ↓
                    └─ MatchingConfirmation
                           ↓
                           └─ Update beds/therapists
                                 ↓
                                 └─ NotificationQueue
```

---

### 2.3 비동기 흐름 제어

| Node | Start Condition | End Condition | Timeout | Parallelizable |
|------|-----------------|---------------|---------|-----------------|
| BedsPolling | setInterval (5s) | API response | 3s | YES (with Therapists) |
| TherapistsPolling | setInterval (5s) | API response | 3s | YES (with Beds) |
| StatsCalculation | BedsPolling done | Sync calc done | N/A | NO (depends on Beds) |
| PredictionEngine | Both polling done | Calc done | N/A | NO (depends on both) |
| MatchingProposal | Trigger (manual/auto) | Candidates ranked | 5s | YES (independent) |
| MatchingConfirm | Manager click | DB update + commit | 2s | NO (depends on proposal) |
| NotificationQueue | Any state change | Emitted to UI | 1s | YES (parallel) |

---

## 👥 3. 8팀 병렬 처리 구조 (Team-to-Task Mapping)

### 팀 구성 및 책임

**Frontend 4팀:**

| Team | Focus | Deliverables | Dependencies |
|------|-------|---------------|--------------|
| **A: Monitor UI** | 카운터 모니터 페이지 | `/monitor` 침대그리드 + 테라피스트 패널 + 실시간 업데이트 UI | API layer (Team G) |
| **B: Admin Dashboard** | 어드민 매칭제어판 | `/admin/matching` 제어판 + What-if 시뮬레이션 + 알림 | API layer (Team G) |
| **C: State Management** | Redux/Zustand 설정 | Global store 설계 + reducers + selectors | Team G API contracts |
| **D: API Client & Real-time** | React Query + Polling | API hooks (useGetBeds, useGetTherapists) + 5s 폴링 설정 | Team G API endpoints |

**Backend 3팀:**

| Team | Focus | Deliverables | Dependencies |
|------|-------|---------------|--------------|
| **E: Database Design** | NeonDB 스키마 | beds, therapists, bookings, attendance 테이블 + indices | None |
| **F: Matching Algorithm** | AI 매칭 로직 | 70/20/10 점수 계산 + 4 modes (balanced/fairness/new_boost/hybrid) | DB (Team E) |
| **G: API Layer** | FastAPI endpoints | `/api/beds`, `/api/therapists`, `/api/matching/propose`, `/api/matching/confirm` | DB (Team E), Algo (Team F) |

**DevOps/Integration 1팀:**

| Team | Focus | Deliverables | Dependencies |
|------|-------|---------------|--------------|
| **H: CI/CD & Integration** | Build + Deploy pipeline | GitHub Actions workflow + Docker container + Vercel/Railway deploy | All teams |

---

### 3.1 팀별 상세 작업 계획

#### **Team A: Monitor UI** (Frontend 1)
```
✅ [완료] /monitor 기본 레이아웃 (침대 그리드 86개)
✅ [완료] 상태별 색상 (초록/파랑/주황/회색)
✅ [완료] 침대 클릭 → DetailModal
⏳ [진행중] 실시간 폴링 UI 연결 (5초마다 상태 갱신)
  └─ useGetBeds() hook 호출 (Team D가 제공)
  └─ setInterval 대신 useQuery 의존성 배열 활용
⏳ 남은 작업:
  ├─ 침대 상태 변경 애니메이션 (color transition)
  ├─ 타이머 카운트다운 (ends_at 기반 남은시간)
  └─ 테라피스트 패널 실시간 업데이트

예상 일정: 3일
```

#### **Team B: Admin Dashboard** (Frontend 2)
```
⏳ [예정] /admin/matching 기본 레이아웃
⏳ 대기 예약 목록 표시
⏳ AI 매칭 제안 3명 (점수 표시)
⏳ "매칭 확정" 버튼 → API 호출
⏳ What-if 시뮬레이션 입력폼 + 결과 표시
⏳ 알림 배지 (신규 건수)

의존성:
  ├─ Team G API: /api/matching/propose, /api/matching/confirm
  ├─ Team C: Global state (selectedMatching, matchingProposals)
  └─ Team D: useConfirmMatching() hook

예상 일정: 5일
```

#### **Team C: State Management** (Frontend 3)
```
⏳ Redux 또는 Zustand 선택 결정
⏳ Store 구조 설계:
  ├─ beds slice
  │  ├─ State: beds[], bedsByRoom, stats
  │  └─ Actions: setBeds, updateBedStatus, selectBed
  ├─ therapists slice
  │  ├─ State: therapists[], therapistStats
  │  └─ Actions: setTherapists, updateTherapistStatus
  ├─ matchings slice
  │  ├─ State: proposals[], selectedProposal, confirmedMatching
  │  └─ Actions: setProposals, selectProposal, confirmMatching
  └─ notifications slice
     ├─ State: notifications[]
     └─ Actions: addNotification, clearNotification
⏳ Selectors 작성 (reselect)
⏳ DevTools 연결

의존성:
  ├─ Team G API contracts (response shape)
  └─ Team D (hooks와의 연결)

예상 일정: 2일
```

#### **Team D: API Client & Real-time** (Frontend 4)
```
⏳ API 클라이언트 설정
  ├─ axios 또는 fetch 래퍼 (baseURL, interceptors)
  └─ Error handling (401, 500 등)
⏳ React Query hooks 작성
  ├─ useGetBeds() → 5s 자동 갱신
  ├─ useGetTherapists() → 5s 자동 갱신
  ├─ useGetMatchingProposals(bookingId)
  └─ useConfirmMatching(matchingId)
⏳ Polling 설정 (refetchInterval: 5000)
⏳ Cache invalidation 전략
  ├─ Optimistic update (UI 먼저 반영)
  ├─ Server sync (API 응답 후 확정)

의존성:
  ├─ Team G API endpoints
  └─ Team C state (optional, React Query가 캐시 역할)

예상 일정: 2.5일
```

#### **Team E: Database Design** (Backend 1)
```
✅ [완료] beds 테이블 스키마
✅ [완료] therapists 테이블
⏳ [진행중] 추가 테이블:
  ├─ therapist_attendance (출근/퇴근/상태 관리)
  ├─ bookings (예약 정보)
  ├─ notifications (알림 큐)
  └─ therapist_specialties (전문성 관리)
⏳ Indices 설계
  ├─ beds (status, updated_at)
  ├─ therapist_attendance (therapist_id, date, status)
  └─ bookings (status, created_at)
⏳ Migration scripts (Alembic)

의존성: None (가장 먼저 시작 가능)

예상 일정: 2.5일
```

#### **Team F: Matching Algorithm** (Backend 2)
```
⏳ 매칭 알고리즘 구현
  ├─ 점수 계산:
  │  ├─ 전문성 매칭 (70%): 고객 요청 서비스 vs 테라피스트 스킬
  │  ├─ 시간 가용성 (20%): 즉시 가능? 얼마나 빨리?
  │  └─ 평점 (10%): 고객 만족도 히스토리
  ├─ 4가지 매칭 모드:
  │  ├─ balanced: 세 가지 가중치 균형
  │  ├─ fairness: 모든 테라피스트에게 기회 공평
  │  ├─ new_boost: 신입 테라피스트 우대
  │  └─ hybrid: 혼합 (UI에서 선택)
  └─ 상위 3명 후보 반환 (score > 0 기준)
⏳ Unit tests (pytest)
  ├─ Test case: 전문성 100% match
  ├─ Test case: 모두 idle 상태
  ├─ Test case: 모두 in_service 상태

의존성:
  ├─ Team E: therapists, specialties 테이블 스키마
  └─ Team G: API endpoint 정의

예상 일정: 3.5일
```

#### **Team G: API Layer** (Backend 3)
```
⏳ FastAPI 라우터 작성
  ├─ GET /api/beds
  │  ├─ Response: [{id, bed_number, status, customer_name, ...}]
  │  └─ Query params: room_zone (optional), status (optional)
  ├─ GET /api/therapists
  │  ├─ Response: [{id, name, status, current_bed, remaining_minutes}]
  │  └─ Query params: status (optional)
  ├─ POST /api/matching/propose
  │  ├─ Request: {booking_id, service_type, preferred_therapist_id}
  │  ├─ Response: [{therapist_id, name, score}, ...]
  │  └─ Call Team F algorithm
  ├─ POST /api/matching/confirm
  │  ├─ Request: {booking_id, therapist_id}
  │  ├─ Response: {success, bed_id, confirmed_at}
  │  └─ Update beds + therapists + bookings tables
  ├─ POST /api/beds/{id}/status
  │  ├─ Request: {status, customer_name, therapist_id}
  │  └─ Update bed status
  └─ POST /api/therapists/{id}/checkin
     ├─ Request: {}
     └─ Create attendance record + set status to idle
⏳ Error handling (HTTPException)
⏳ Request validation (Pydantic)

의존성:
  ├─ Team E: DB schemas
  ├─ Team F: Matching algorithm
  └─ Team D: API contracts

예상 일정: 3일
```

#### **Team H: CI/CD & Integration** (DevOps)
```
⏳ GitHub Actions workflow
  ├─ Trigger: push to main
  ├─ Steps:
  │  ├─ npm install (frontend)
  │  ├─ pip install (backend)
  │  ├─ npm run build (frontend)
  │  ├─ npm test (frontend)
  │  ├─ pytest (backend)
  │  └─ docker build + push
  └─ Deploy to Railway/Vercel
⏳ Docker 설정
  ├─ Frontend Dockerfile (node:18 + next build)
  ├─ Backend Dockerfile (python:3.11 + fastapi)
  └─ docker-compose.yml (local dev)
⏳ Environment variables (.env.example)
⏳ Health check endpoints
  ├─ GET /health (backend)
  └─ GET / (frontend)

의존성:
  ├─ Teams A-D (frontend complete)
  ├─ Teams E-G (backend complete)

예상 일정: 2일
```

---

## 🔄 4. 의존성 매트릭스 (Dependency Matrix)

```
     │ A │ B │ C │ D │ E │ F │ G │ H │
─────┼───┼───┼───┼───┼───┼───┼───┼───┤
 A   │ - │ X │   │ D │   │   │ D │ D │
 B   │   │ - │   │ D │   │   │ D │ D │
 C   │   │   │ - │ D │   │   │   │   │
 D   │   │   │   │ - │   │   │ D │   │
 E   │   │   │   │   │ - │ D │ D │   │
 F   │   │   │   │   │   │ - │ D │   │
 G   │   │   │   │   │   │   │ - │ D │
 H   │   │   │   │   │   │   │   │ - │

Legend:
 D = Depends on
 X = Optional integration
```

**순환 의존성 확인:** 없음 ✓

---

## ⏱️ 5. 실행 타임라인 (Execution Timeline)

### Phase 1: 기초 작업 (병렬 작업 가능)

```
Week 1 (May 13-19):
├─ Team E (DB Design)           [████████░░] 2.5일
├─ Team D (API Client Setup)    [████░░░░░░] 2.5일 (Team G API spec 대기)
├─ Team C (State Management)    [█████░░░░░] 2일
└─ Team A (Monitor UI Polish)   [███░░░░░░░] 3일

병렬 시작 가능 팀: A, B, C, D (Team G spec만 있으면)

Week 1 완료 조건:
  ✓ Team E: 모든 테이블 스키마 정의
  ✓ Team D: API hooks 기본 작성 (mock API 기반)
  ✓ Team C: Redux/Zustand store 완성
  ✓ Team A: Monitor UI 기본 완성 + polishing
```

### Phase 2: 백엔드 구현 (Team E 완료 후)

```
Week 2-3 (May 20-June 2):
├─ Team F (Matching Algorithm)  [███████░░░] 3.5일 (Team E 필요)
├─ Team G (API Layer)           [██████░░░░] 3일 (Team E, F 필요)
└─ Team B (Admin Dashboard)     [██████░░░░] 5일 (Team G API 필요)

순차 의존성:
  E → F → G → B

Team G 완료 후 Team A, D 통합 시작
```

### Phase 3: 통합 & 배포 (모든 팀 거의 완료)

```
Week 3-4 (June 3-16):
├─ Team A-D (Frontend 통합)     [████████░░] 최종 테스트
├─ Team E-G (Backend 통합)      [████████░░] API 통합 테스트
└─ Team H (CI/CD + Deploy)      [█████░░░░░] 2일

통합 테스트:
  ✓ Monitor → API → DB 왕복
  ✓ Admin → Matching Proposal → Confirm 전체 흐름
  ✓ 5초 폴링 안정성 (30분 연속 운영)
  ✓ 예외 상황 (API timeout, DB error, 동시 요청)
```

---

### 타임라인 요약

| Milestone | Date | Owner | Status |
|-----------|------|-------|--------|
| DB Schema 완성 | May 19 | Team E | Go |
| API Spec 정의 | May 17 | Team G | Go |
| Frontend API hooks 완성 | May 22 | Team D | Go |
| Matching Algorithm 완성 | May 30 | Team F | Go |
| API Endpoints 완성 | June 2 | Team G | Go |
| Frontend-Backend 통합 완료 | June 9 | All | Go |
| 배포 완료 | June 16 | Team H | Go |

**총 예상 소요 기간: 4주 (May 13 - June 16)**

---

## 🚀 6. 병렬 처리 가능성 (Parallelization Assessment)

### 6.1 최대 병렬도 (Maximum Parallelism)

**Phase 1 (주 1):** 4개 팀 동시 작업 (A, C, D, E)
```
Critical Path: E → F → G → B
Non-blocking: A, C, D (API spec만 있으면)
```

**Phase 2 (주 2-3):** 5개 팀 동시 작업 (A-D + G)
```
Team F는 Team E 대기중
Team B는 Team G 대기중
Team A, D는 Team G와 병렬 통합
```

**Phase 3 (주 3-4):** 8개 팀 모두 활성화
```
최종 통합, 버그 수정, 배포 준비
병렬도 감소 (모두 최종 테스트 단계)
```

### 6.2 병목 지점 (Bottleneck Analysis)

1. **Team G (API Layer)** — Critical Path의 중심
   - 앞: Team E, F 의존
   - 뒤: Team A, B, D 대기
   - 완화책: API spec 조기 정의, Mock API 제공

2. **Team E (DB Schema)** — 모든 팀의 기초
   - 완화책: 우선순위 테이블부터 (beds, therapists)
   - 나머지는 incrementally 추가

3. **통합 테스트 (Integration)** — 병렬 불가
   - 최종 단계에 모든 팀의 작업 필요
   - 완화책: 각 팀의 unit test 철저 (병렬 수정 가능)

### 6.3 병렬 처리 권장안

```
✅ DO: 병렬로 진행
├─ Frontend UI (A, B) ← Mock API로 진행
├─ State Management (C) ← 독립 작업
├─ API Client (D) ← API spec 있으면 실제 API로
├─ DB Design (E) ← 가장 먼저 시작
└─ Matching Algorithm (F) ← E 완료 후 즉시

❌ DON'T: 순차로만 진행
├─ Team B를 Team G 완료까지 기다리기
└─ Team A를 Team G 통합까지 기다리기

🔄 RECOMMEND: Mock-First Strategy
├─ Week 1: 모든 팀이 Mock API 기반으로 진행
├─ Team G이 실제 API 완성되면 즉시 교체
└─ 통합 테스트는 Week 3부터
```

---

## 📋 7. ORCHESTRATION 구현 패턴 (LANGGRAPH → 코드)

### 7.1 React Query + Polling 기반 Orchestration

**Frontend (Team D가 구현):**

```typescript
// hooks/useBedPolling.ts
import { useQuery } from '@tanstack/react-query';

export const useBedPolling = () => {
  return useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const res = await fetch('/api/beds');
      return res.json();
    },
    refetchInterval: 5000,  // 5초 폴링
    refetchOnWindowFocus: true,
    staleTime: 3000,  // 3초 후 stale
  });
};

// hooks/useTherapistPolling.ts
export const useTherapistPolling = () => {
  return useQuery({
    queryKey: ['therapists'],
    queryFn: async () => {
      const res = await fetch('/api/therapists');
      return res.json();
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });
};

// components/MonitorPage.tsx
export default function MonitorPage() {
  // Parallel queries
  const bedsQuery = useBedPolling();
  const therapistsQuery = useTherapistPolling();

  // Dependent calculations
  useEffect(() => {
    if (bedsQuery.data && therapistsQuery.data) {
      const stats = calculateStats(bedsQuery.data);
      const predictions = calculatePredictions(bedsQuery.data, therapistsQuery.data);
      
      // Update store (Team C)
      dispatch(setStats(stats));
      dispatch(setPredictions(predictions));
    }
  }, [bedsQuery.data, therapistsQuery.data]);

  if (bedsQuery.isLoading || therapistsQuery.isLoading) return <LoadingScreen />;
  if (bedsQuery.isError || therapistsQuery.isError) return <ErrorScreen />;

  return (
    <div>
      <BedGrid beds={bedsQuery.data} />
      <TherapistPanel therapists={therapistsQuery.data} />
    </div>
  );
}
```

### 7.2 Backend Orchestration (FastAPI)

```python
# routes/beds.py
@router.get("/api/beds")
async def get_beds(room_zone: Optional[str] = None):
    """
    핵심 데이터 조회
    - DB에서 현재 beds 상태 조회
    - 예상 종료시간 < now()인 것 자동으로 'cleaning'으로 변경
    - 응답 시간: ~50ms (with caching)
    """
    # 자동 상태 갱신 (in_service → cleaning if ends_at < now)
    await auto_transition_beds()
    
    # DB 조회
    beds = db.query(Bed).all()
    return beds

@router.post("/api/matching/propose")
async def propose_matching(booking: BookingProposal):
    """
    매칭 알고리즘 실행
    - Team F의 matching_algorithm 호출
    - 상위 3명 후보 반환
    - DB 쓰기 없음 (순수 계산)
    """
    # 알고리즘 실행 (Team F)
    candidates = await matching_algorithm(
        service_type=booking.service_type,
        preferred_therapist_id=booking.preferred_therapist_id
    )
    return candidates  # [{ therapist_id, name, score }, ...]

@router.post("/api/matching/confirm")
async def confirm_matching(matching: MatchingConfirmation):
    """
    매칭 확정
    - Booking 상태: matched → confirmed
    - Bed 상태: available → reserved
    - Therapist 상태: idle → ready
    """
    async with db.transaction():  # 원자성 보장
        booking = db.query(Booking).get(matching.booking_id)
        therapist = db.query(Therapist).get(matching.therapist_id)
        bed = find_available_bed(room_zone=booking.preferred_room)
        
        # 모두 동시 업데이트
        booking.status = 'confirmed'
        therapist.status = 'ready'
        bed.status = 'reserved'
        bed.customer_name = booking.customer_name
        bed.therapist_id = therapist.id
        
        db.commit()
    
    return { 'bed_id': bed.id, 'confirmed_at': datetime.now() }
```

### 7.3 상태 머신 (State Machine Orchestration)

```python
# lib/state_machines.py
from enum import Enum
from datetime import datetime, timedelta

class BedStatus(str, Enum):
    AVAILABLE = 'available'
    RESERVED = 'reserved'
    IN_SERVICE = 'in_service'
    CLEANING = 'cleaning'

class BedStateMachine:
    """
    침대 상태 전환 규칙
    - available → reserved: 예약 생성
    - reserved → in_service: 고객 도착
    - in_service → cleaning: ends_at 도달
    - cleaning → available: 정리 완료 (타이머 또는 수동)
    """
    
    def __init__(self, bed: Bed):
        self.bed = bed
    
    def transition_to_in_service(self, customer_name, therapist_id):
        assert self.bed.status == BedStatus.RESERVED
        self.bed.status = BedStatus.IN_SERVICE
        self.bed.customer_name = customer_name
        self.bed.therapist_id = therapist_id
        self.bed.starts_at = datetime.now()
        self.bed.ends_at = datetime.now() + timedelta(
            minutes=self.bed.service_minutes
        )
    
    def auto_transition_to_cleaning(self):
        """매 API 호출 시 호출되는 자동 상태 전환"""
        if self.bed.status == BedStatus.IN_SERVICE:
            if self.bed.ends_at < datetime.now():
                self.bed.status = BedStatus.CLEANING
                self.bed.cleaning_started_at = datetime.now()
                self.bed.cleaning_ends_at = datetime.now() + timedelta(minutes=15)
    
    def transition_to_available(self):
        assert self.bed.status == BedStatus.CLEANING
        self.bed.status = BedStatus.AVAILABLE
        self.bed.customer_name = None
        self.bed.therapist_id = None
```

---

## ✅ 8. 검증 & 모니터링 계획

### 8.1 통합 테스트 시나리오

| Scenario | Flow | Expected Output | Pass/Fail |
|----------|------|-----------------|-----------|
| **S1: 기본 폴링** | 5초마다 beds 조회 | API 응답 < 1초 | - |
| **S2: 상태 변경** | in_service → cleaning 자동 전환 | 타이머 만료 시 즉시 상태 변경 | - |
| **S3: 매칭 제안** | 신규 예약 → 매칭 제안 생성 | 상위 3명 후보 + 점수 | - |
| **S4: 매칭 확정** | 매니저 버튼 클릭 → DB 업데이트 | 침대 + 테라피스트 상태 동시 변경 | - |
| **S5: 실시간 반영** | API 응답 → UI 갱신 | 5초 이내 화면 업데이트 | - |
| **S6: 예약 취소** | 매니저 취소 클릭 | 침대 available, 테라피스트 idle로 복구 | - |
| **S7: 동시 요청** | 2명의 매니저가 동시에 다른 침대 배정 | 트랜잭션 처리, 한 명만 성공 | - |

### 8.2 성능 벤치마크

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| API `/api/beds` 응답시간 | < 200ms | < 500ms | > 1000ms |
| API `/api/therapists` 응답시간 | < 200ms | < 500ms | > 1000ms |
| 매칭 알고리즘 실행시간 | < 500ms | < 1000ms | > 3000ms |
| UI 업데이트 지연 | < 1초 | < 2초 | > 5초 |
| 동시 사용자 3명 | No errors | < 10% slow | > 10% error |
| 메모리 사용량 | < 500MB | < 800MB | > 1GB |

---

## 🎯 9. 다음 단계 (Next Steps)

### Immediate (Today - May 13):
1. ✅ 이 계획 문서 작성 완료
2. 👤 각 팀 리드 할당
3. 📊 Slack/협업 채널 생성 (8개 팀별)
4. 📝 API 스펙 문서 작성 시작 (Team G가 주도)

### Week 1 (May 13-19):
1. Team E: DB migration scripts 완성
2. Team G: API Spec 확정 + Mock API 배포
3. Team A-D: Mock API 기반 프론트엔드 개발 병렬 진행
4. Daily standup (15분, 10AM)

### Week 2-3 (May 20 - June 2):
1. Team F: Matching algorithm 완성 + Unit tests
2. Team G: 실제 API 구현
3. Team B: Admin dashboard 완성
4. Integration tests 시작

### Week 3-4 (June 3-16):
1. End-to-end 통합 테스트
2. 버그 수정 및 성능 최적화
3. 배포 파이프라인 설정
4. 실운영 점검 (Staging)

---

## 📚 참고 자료

- **현황 파일:** `개발가이드북.md` (3차 카운터 관리 시스템 설계)
- **모니터 페이지:** `/monitor/page.tsx` (완성된 클릭 모달 포함)
- **플랜 파일:** `humble-wandering-bunny.md` (전체 시스템 아키텍처)

---

**작성자:** Claude Code | **최종 검토:** 2026-05-13  
**버전:** 1.0 | **상태:** Ready for Team Kickoff
