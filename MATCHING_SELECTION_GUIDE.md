# AI 추천 + 어드민 수정 가능한 매칭 선택 메커니즘
**작성일**: 2026-05-12  
**목적**: AI 매칭 추천과 어드민 수정 가능 기능의 상세 구현 가이드

---

## 1. 개요

```
매칭 선택 프로세스:

AI (자동)              어드민 (선택)            시스템 (기록)
    │                      │                       │
    ├─ 점수 계산          │                       │
    ├─ 3명 추천          │                       │
    └─────────────────────► 화면에 표시          │
                           │                       │
                           ├─ AI 추천 수용        │
                           ├─ 후보 변경           │
                           ├─ 수동 선택           │
                           ├─ 정책 재계산         │
                           └─────────────────────► 기록 저장
                                                  │
                                                  ├─ 선택 내역
                                                  ├─ 선택 이유
                                                  ├─ 시간
                                                  └─ 분석 데이터

핵심 원칙:
✅ AI는 추천하지만 강제하지 않음 (유연성)
✅ 어드민은 선택하지만 기록됨 (투명성)
✅ 모든 선택은 저장되고 분석됨 (개선용 데이터)
```

---

## 2. 데이터 모델

### 2.1 Booking 테이블 (기존)
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  service_id INTEGER REFERENCES services(id),
  reserved_time TIMESTAMPTZ,
  status VARCHAR(20), -- pending, matched, confirmed, in_progress, completed
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 2.2 MatchingRecommendation 테이블 (새로 추가)
```sql
CREATE TABLE matching_recommendations (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  
  -- AI 추천 정보
  matching_policy VARCHAR(50), -- 'basic', 'fairness', 'newtherapist', 'hybrid'
  policy_weights JSON, -- {expertise: 70, distance: 20, rating: 10, fairness: 0}
  
  -- 상위 3명 후보 (시간순)
  recommendation_1_therapist_id INTEGER REFERENCES therapists(id),
  recommendation_1_score DECIMAL(5,2),
  recommendation_1_reasons JSON, -- {expertise: 95, distance: 85, rating: 88}
  
  recommendation_2_therapist_id INTEGER REFERENCES therapists(id),
  recommendation_2_score DECIMAL(5,2),
  recommendation_2_reasons JSON,
  
  recommendation_3_therapist_id INTEGER REFERENCES therapists(id),
  recommendation_3_score DECIMAL(5,2),
  recommendation_3_reasons JSON,
  
  -- AI 추천 생성 정보
  recommended_at TIMESTAMPTZ,
  recommended_by_ai_version VARCHAR(20), -- 'v1.0', 'v1.5'
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 2.3 MatchingSelection 테이블 (새로 추가 - 최종 선택 기록)
```sql
CREATE TABLE matching_selections (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  
  -- AI 추천 정보
  recommendation_id INTEGER REFERENCES matching_recommendations(id),
  ai_recommended_therapist_id INTEGER REFERENCES therapists(id),
  ai_recommended_score DECIMAL(5,2),
  
  -- 어드민 최종 선택
  selected_therapist_id INTEGER REFERENCES therapists(id),
  selection_type VARCHAR(50), -- 'ai_recommended', 'ai_alternative', 'manual_override'
  selection_reason VARCHAR(500), -- "고객이 여성 테라피스트 요청" 등
  selection_policy VARCHAR(50), -- 선택 시 적용된 정책
  
  -- 선택자 정보
  selected_by_manager_id INTEGER REFERENCES staff(id),
  selected_at TIMESTAMPTZ,
  
  -- 변경 이력 (여러 번 수정 가능)
  is_final BOOLEAN DEFAULT TRUE,
  previous_selection_id INTEGER REFERENCES matching_selections(id),
  
  -- 분석용 플래그
  matches_ai_recommendation BOOLEAN, -- true면 AI 추천과 일치
  reason_category VARCHAR(50), -- 'customer_request', 'therapist_unavailable', 'policy_change', etc.
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 2.4 MatchingAnalysis 테이블 (분석용)
```sql
CREATE TABLE matching_analysis (
  id SERIAL PRIMARY KEY,
  
  -- 통계 기간
  analysis_date DATE,
  
  -- 추천 vs 최종 선택 비교
  total_recommendations INTEGER,
  matched_selections INTEGER, -- AI 추천과 일치한 선택
  modified_selections INTEGER, -- AI 추천과 다른 선택
  override_rate DECIMAL(5,2), -- 수정 비율 (%)
  
  -- 수정 이유별 분석
  override_by_customer_request INTEGER,
  override_by_policy_change INTEGER,
  override_by_therapist_unavailable INTEGER,
  override_by_other INTEGER,
  
  -- 정책별 성과
  basic_mode_recommendations INTEGER,
  basic_mode_matches INTEGER,
  basic_mode_overrides INTEGER,
  
  fairness_mode_recommendations INTEGER,
  fairness_mode_matches INTEGER,
  fairness_mode_overrides INTEGER,
  
  -- 성과 지표
  avg_ai_score DECIMAL(5,2),
  avg_final_score DECIMAL(5,2),
  customer_satisfaction_ai DECIMAL(3,1),
  customer_satisfaction_final DECIMAL(3,1),
  therapist_satisfaction_change DECIMAL(3,1),
  
  created_at TIMESTAMPTZ
);
```

---

## 3. API 엔드포인트

### 3.1 AI 추천 생성
```
POST /api/v1/matching/recommend

Request:
{
  booking_id: 123,
  policy: "basic" // 또는 "fairness", "newtherapist", "hybrid"
}

Response:
{
  recommendation_id: 456,
  booking_id: 123,
  policy: "basic",
  recommendations: [
    {
      rank: 1,
      therapist_id: 1,
      therapist_name: "이소영",
      score: 92.3,
      reasons: {
        expertise: 95,
        distance: 85,
        rating: 88
      },
      status: "idle",
      available_at: "즉시"
    },
    {
      rank: 2,
      therapist_id: 2,
      therapist_name: "박유진",
      score: 84.2,
      reasons: {
        expertise: 90,
        distance: 60,
        rating: 92
      },
      status: "in_service",
      available_at: "15분 후"
    },
    {
      rank: 3,
      therapist_id: 3,
      therapist_name: "최정은",
      score: 82.0,
      reasons: {
        expertise: 85,
        distance: 70,
        rating: 85
      },
      status: "in_service",
      available_at: "30분 후"
    }
  ],
  recommended_at: "2026-05-12T14:20:00Z"
}
```

### 3.2 어드민 선택 (AI 추천 수용)
```
POST /api/v1/matching/select

Request:
{
  recommendation_id: 456,
  selected_therapist_id: 1, // AI 1순위 선택
  selection_type: "ai_recommended",
  selection_reason: "", // 이유 생략 가능
  selected_by_manager_id: 10
}

Response:
{
  selection_id: 789,
  booking_id: 123,
  selected_therapist_id: 1,
  selected_therapist_name: "이소영",
  selection_type: "ai_recommended",
  matches_ai_recommendation: true,
  selected_at: "2026-05-12T14:25:00Z",
  status: "success"
}
```

### 3.3 어드민 선택 (AI 후보 변경)
```
POST /api/v1/matching/select

Request:
{
  recommendation_id: 456,
  selected_therapist_id: 2, // AI 2순위로 변경
  selection_type: "ai_alternative",
  selection_reason: "박유진이 더 빠르게 가능",
  selected_by_manager_id: 10
}

Response:
{
  selection_id: 789,
  booking_id: 123,
  selected_therapist_id: 2,
  selected_therapist_name: "박유진",
  selection_type: "ai_alternative",
  matches_ai_recommendation: false,
  deviation_from_ai_choice: "2순위로 변경",
  selection_reason: "박유진이 더 빠르게 가능",
  selected_at: "2026-05-12T14:25:00Z",
  status: "success"
}
```

### 3.4 어드민 선택 (수동 선택 - 모든 테라피스트)
```
POST /api/v1/matching/select

Request:
{
  recommendation_id: 456,
  selected_therapist_id: 5, // AI 추천 외 다른 사람
  selection_type: "manual_override",
  selection_reason: "고객 요청: 여성 테라피스트 + 스웨디시 경력 5년 이상",
  selected_by_manager_id: 10
}

Response:
{
  selection_id: 789,
  booking_id: 123,
  selected_therapist_id: 5,
  selected_therapist_name: "강지연",
  selection_type: "manual_override",
  matches_ai_recommendation: false,
  reason_category: "customer_request",
  selection_reason: "고객 요청: 여성 테라피스트 + 스웨디시 경력 5년 이상",
  selected_at: "2026-05-12T14:25:00Z",
  status: "success"
}
```

### 3.5 정책 변경 후 재추천
```
POST /api/v1/matching/recommend

Request:
{
  booking_id: 123,
  policy: "fairness" // 기본 모드에서 공정성 모드로 변경
}

Response:
{
  recommendation_id: 457, // 새로운 추천 ID
  booking_id: 123,
  policy: "fairness",
  recommendations: [
    {
      rank: 1,
      therapist_id: 3, // 이번엔 최정은이 1순위 (공정성 모드)
      therapist_name: "최정은",
      score: 86.0, // 공정성 점수 포함
      reasons: {
        expertise: 34,
        distance: 15,
        rating: 8.5,
        fairness: 28.5 // ← 공정성 점수 추가
      }
    }
    // ...
  ],
  recommended_at: "2026-05-12T14:22:00Z"
}
```

### 3.6 모든 테라피스트 목록 조회
```
GET /api/v1/matching/all-therapists?booking_id=123

Response:
{
  therapists: [
    {
      therapist_id: 1,
      name: "이소영",
      rating: 4.9,
      status: "idle",
      available_at: "즉시",
      current_score_with_booking: 92.3, // 이 예약 기준 점수
      fairness_score: 35,
      work_distribution: 180, // 평균 대비 180%
      is_in_ai_recommendation: true,
      rank_in_ai: 1
    },
    {
      therapist_id: 2,
      name: "박유진",
      rating: 4.8,
      status: "in_service",
      available_at: "15분 후",
      current_score_with_booking: 84.2,
      fairness_score: 65,
      work_distribution: 130,
      is_in_ai_recommendation: true,
      rank_in_ai: 2
    },
    // ... 모든 테라피스트
  ]
}
```

### 3.7 선택 이력 조회
```
GET /api/v1/matching/selections/:booking_id

Response:
{
  booking_id: 123,
  customer_name: "김민준",
  service: "스웨디시 60분",
  reserved_time: "2026-05-12T14:30:00Z",
  
  selection_history: [
    {
      sequence: 1,
      recommendation_id: 456,
      ai_recommended_therapist: "이소영",
      ai_score: 92.3,
      selected_therapist: "박유진",
      selection_type: "ai_alternative",
      selection_reason: "이소영이 다른 고객 서비스 중",
      selected_by: "매니저 Lisa",
      selected_at: "2026-05-12T14:25:00Z"
    }
  ],
  
  final_selection: {
    therapist_id: 2,
    therapist_name: "박유진",
    selection_id: 789,
    selected_at: "2026-05-12T14:25:00Z"
  }
}
```

### 3.8 분석 데이터 조회
```
GET /api/v1/matching/analysis?date=2026-05-12

Response:
{
  analysis_date: "2026-05-12",
  
  summary: {
    total_recommendations: 24,
    matched_selections: 18, // AI 추천과 일치
    modified_selections: 6, // AI 추천과 다름
    override_rate: 25 // 25% 수정율
  },
  
  by_type: {
    ai_recommended: 18,
    ai_alternative: 4,
    manual_override: 2
  },
  
  override_reasons: {
    customer_request: 2,
    therapist_unavailable: 2,
    policy_change: 1,
    other: 1
  },
  
  by_policy: {
    basic: {
      recommendations: 16,
      matches: 13,
      overrides: 3,
      override_rate: 18.75
    },
    fairness: {
      recommendations: 8,
      matches: 5,
      overrides: 3,
      override_rate: 37.5
    }
  },
  
  performance: {
    avg_ai_score: 87.5,
    avg_final_score: 86.2, // 약간 낮음 (수정으로 인해)
    customer_satisfaction_ai: 4.6,
    customer_satisfaction_final: 4.7, // 실제로는 더 만족 (고객 요청 반영)
    therapist_satisfaction_change: +0.3 // 공정성 개선
  }
}
```

---

## 4. UI/UX 플로우

### 4.1 어드민 매칭 화면 (상세)

```
┌────────────────────────────────────────────────────────────┐
│ ElSpa 매칭 제어판                                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ 좌측 패널: 대기 예약 목록                                   │
│ ┌─────────────────────────────────────┐                   │
│ │ 대기 중인 예약 (3건)                 │                   │
│ │                                     │                   │
│ │ 🔴 예약 #1: 김민준                  │                   │
│ │    서비스: 스웨디시 60분            │                   │
│ │    시간: 14:30                      │                   │
│ │    상태: 매칭 대기                  │                   │
│ │    [AI 추천 보기] ← 클릭            │                   │
│ │                                     │                   │
│ │ 🔴 예약 #2: 이수연                  │                   │
│ │    서비스: 타이 마사지 90분         │                   │
│ │    시간: 15:00                      │                   │
│ │    상태: 매칭 대기                  │                   │
│ │    [AI 추천 보기]                   │                   │
│ │                                     │                   │
│ │ 🟡 예약 #3: 박지은                  │                   │
│ │    서비스: 핫스톤 60분              │                   │
│ │    시간: 15:30                      │                   │
│ │    상태: 매칭 대기                  │                   │
│ │    [AI 추천 보기]                   │                   │
│ │                                     │                   │
│ └─────────────────────────────────────┘                   │
│                                                             │
│ 중앙 패널: AI 매칭 제안 (예약 #1 선택 시)                  │
│ ┌──────────────────────────────────────┐                  │
│ │ 예약 #1: 김민준 / 스웨디시 60분      │                  │
│ │ 예약 시간: 2026-05-12 14:30          │                  │
│ ├──────────────────────────────────────┤                  │
│ │ 🤖 AI 추천 (기본 모드 70/20/10)      │                  │
│ │    생성 시간: 14:20:15               │                  │
│ ├──────────────────────────────────────┤                  │
│ │                                      │                  │
│ │ 1️⃣ 이소영 (92.3점) ← 추천           │                  │
│ │    ┌──────────────────────────────┐ │                  │
│ │    │ 전문성: 95점 (스웨디시 전문)  │ │                  │
│ │    │ 가용성: 85점 (현재 idle)      │ │                  │
│ │    │ 평점: 88점 (이 고객층 평가)   │ │                  │
│ │    │ 공정성: 35점 (많이 받음 주의) │ │                  │
│ │    └──────────────────────────────┘ │                  │
│ │    현재 상태: ✅ idle (즉시 가능)   │                  │
│ │    공정성 점수: 35/100 (수정 권장)  │ │                  │
│ │                                      │                  │
│ │    [✓ 이 테라피스트 배정] (권장)   │                  │
│ │    [↴ 다른 이유로 선택]             │                  │
│ │                                      │                  │
│ ├──────────────────────────────────────┤                  │
│ │                                      │                  │
│ │ 2️⃣ 박유진 (84.2점)                 │                  │
│ │    전문성: 90점 | 가용성: 60점     │ │                  │
│ │    평점: 92점 | 공정성: 65점       │ │                  │
│ │    현재 상태: ⏳ in_service (15분 후) │                  │
│ │                                      │                  │
│ │    [✓ 이 테라피스트 배정]          │                  │
│ │    [↴ 다른 이유로 선택]             │                  │
│ │                                      │                  │
│ ├──────────────────────────────────────┤                  │
│ │                                      │                  │
│ │ 3️⃣ 최정은 (82.0점)                 │                  │
│ │    전문성: 85점 | 가용성: 70점     │ │                  │
│ │    평점: 85점 | 공정성: 82점       │ │                  │
│ │    현재 상태: ⏳ in_service (30분 후) │                  │
│ │                                      │                  │
│ │    [✓ 이 테라피스트 배정]          │                  │
│ │    [↴ 다른 이유로 선택]             │                  │
│ │                                      │                  │
│ ├──────────────────────────────────────┤                  │
│ │ 📋 모든 테라피스트 보기               │                  │
│ │    (AI 추천 외 다른 사람 선택)      │                  │
│ │    ├─ 김태희: idle, 점수 78점      │                  │
│ │    ├─ 강지연: resting, 점수 72점   │                  │
│ │    ├─ 박민경: idle, 점수 85점      │                  │
│ │    └─ ... (더 보기)                 │                  │
│ │    [⬇️ 펼치기]                      │                  │
│ │                                      │                  │
│ ├──────────────────────────────────────┤                  │
│ │ 🔧 정책 변경 & 재추천                │                  │
│ │    현재 정책: 기본 모드 (70/20/10)   │                  │
│ │    ├─ [공정성 모드 재계산]          │                  │
│ │    ├─ [신입 부스트 재계산]          │                  │
│ │    └─ [혼합 모드 재계산]            │                  │
│ │                                      │                  │
│ │    (재계산하면 새로운 상위 3명 제시) │                  │
│ │                                      │                  │
│ ├──────────────────────────────────────┤                  │
│ │ 💬 선택 이유 (선택사항)              │                  │
│ │    ┌──────────────────────────────┐ │                  │
│ │    │ [고객 특수 요청 입력란]        │ │                  │
│ │    │                              │ │                  │
│ │    │ 예: "고객이 여성 선호"         │ │                  │
│ │    │ 예: "테라피스트 불가능"       │ │                  │
│ │    │ 예: "정책 변경으로 재계산"    │ │                  │
│ │    │                              │ │                  │
│ │    └──────────────────────────────┘ │                  │
│ │                                      │                  │
│ └──────────────────────────────────────┘                  │
│                                                             │
│ 우측 패널: 현황 & 알림                                      │
│ ┌──────────────────────────────────────┐                  │
│ │ 오늘 현황                           │                  │
│ │ 출근: 24명 | 대기: 8명              │                  │
│ │ 서비스: 14명 | 휴식: 2명            │                  │
│ │                                     │                  │
│ │ 실시간 알림 (5건)                   │                  │
│ │ ⚠️ 김태희: 5분 후 종료 예정         │                  │
│ │ 📋 박지은: 14:30 예약 대기          │                  │
│ │ ✅ 이소영: 체크인 완료              │                  │
│ │                                     │                  │
│ └──────────────────────────────────────┘                  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 4.2 선택 후 확인 화면

```
┌─────────────────────────────────────────────┐
│ ✅ 매칭 완료                               │
├─────────────────────────────────────────────┤
│                                             │
│ 예약 #1: 김민준                             │
│ 서비스: 스웨디시 60분                       │
│ 시간: 2026-05-12 14:30                      │
│                                             │
│ 배정 테라피스트: 박유진 ⭐4.8               │
│ 선택 유형: AI 2순위 선택                   │
│ 선택 이유: "박유진이 더 빠르게 가능"        │
│ 선택자: 매니저 Lisa                        │
│ 시간: 14:25:00                             │
│                                             │
│ [✓ 고객에게 알림 발송]                     │
│ [📋 선택 이력 보기]                        │
│ [🔙 이전 화면으로]                         │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.3 선택 이력 화면

```
┌──────────────────────────────────────────────┐
│ 예약 #1: 김민준 - 선택 이력                 │
├──────────────────────────────────────────────┤
│                                              │
│ 타임라인:                                    │
│                                              │
│ 14:20 | AI 추천 생성                        │
│       └─ 기본 모드 (70/20/10)              │
│          1순위: 이소영 (92.3점)             │
│          2순위: 박유진 (84.2점)             │
│          3순위: 최정은 (82.0점)             │
│                                              │
│ 14:25 | 최종 선택: 박유진 ✓                 │
│       ├─ 선택 유형: AI 2순위 선택          │
│       ├─ AI 추천과의 차이: 2순위            │
│       ├─ 선택 이유: "박유진이 더 빠르게 가능" │
│       └─ 선택자: 매니저 Lisa               │
│                                              │
│ 📊 선택 분석:                                │
│    └─ AI 추천: 이소영 (92.3점)              │
│    └─ 최종 선택: 박유진 (84.2점)            │
│    └─ 점수 차이: -8.1점                     │
│    └─ 일치 여부: ❌ 수정됨                   │
│    └─ 이유 분류: therapist_availability     │
│                                              │
│ 💬 이 선택이 맞았는가?                      │
│    └─ 고객 만족도: ⭐⭐⭐⭐⭐ (5/5)          │
│    └─ 테라피스트 만족도: ⭐⭐⭐⭐ (4/5)    │
│                                              │
│ [📋 다른 선택지 비교]                       │
│ [🔙 이전]                                   │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 5. 구현 체크리스트

### Backend
```
[ ] MatchingRecommendation 테이블 생성
[ ] MatchingSelection 테이블 생성
[ ] MatchingAnalysis 테이블 생성
[ ] POST /api/v1/matching/recommend 구현
[ ] POST /api/v1/matching/select 구현
[ ] GET /api/v1/matching/all-therapists 구현
[ ] GET /api/v1/matching/selections/:booking_id 구현
[ ] GET /api/v1/matching/analysis 구현
[ ] 선택 이력 기록 로직
[ ] 선택 이유 저장 로직
[ ] 수정 카운팅 로직 (AI 추천 vs 최종 선택)
[ ] 분석 데이터 집계 로직
```

### Frontend
```
[ ] 매칭 제안 화면 UI 구현
[ ] AI 추천 3명 표시
[ ] 점수 상세 정보 표시 (마우스 오버)
[ ] 공정성 점수 경고 표시 (많이 받은 경우)
[ ] [AI 후보 선택] 버튼 (3개)
[ ] [모든 테라피스트 보기] 드롭다운
[ ] [정책 변경] 드롭다운 + 재계산
[ ] 선택 이유 입력 필드
[ ] 선택 후 확인 화면
[ ] 선택 이력 조회 화면
[ ] 로딩 상태 표시
[ ] 에러 처리
```

### Testing
```
[ ] AI 추천 로직 테스트 (모든 정책 모드)
[ ] 어드민 선택 로직 테스트
[ ] 데이터 저장 검증
[ ] 선택 이력 추적 검증
[ ] 분석 데이터 집계 검증
[ ] UI 반응형 테스트
[ ] 성능 테스트 (추천 생성 시간 <500ms)
```

---

## 6. 모니터링 & 분석

### 6.1 주요 메트릭

```
1️⃣ 매칭 정확도
   - AI 추천과 최종 선택 일치율: 75%+ (목표)
   - 의미: 75% 이상의 선택이 AI 추천을 수용

2️⃣ 수정 비율 (Override Rate)
   - 매일 수정 건수 / 전체 매칭 건수
   - 목표: 20-25% (너무 많으면 AI 학습, 너무 적으면 경직)

3️⃣ 수정 이유 분석
   - 고객 특수 요청: 40%
   - 테라피스트 불가능: 35%
   - 정책 변경: 15%
   - 기타: 10%

4️⃣ 성과 개선
   - AI 추천 점수 vs 최종 선택 점수
   - 고객 만족도: AI 기반 vs 최종 선택
   - 테라피스트 만족도: 공정성 점수 변화

5️⃣ 선택 시간
   - AI 추천 생성 시간: <300ms (목표)
   - 어드민 선택 시간: <10초 (목표)
   - 선택 후 배정 시간: <1초 (목표)
```

### 6.2 분석 활용

```
주간 분석:
├─ 가장 많이 수정된 예약 패턴
├─ 가장 자주 선택되는 테라피스트
├─ 가장 자주 회피되는 테라피스트
└─ 정책별 성과 비교 (기본 vs 공정성)

월간 분석:
├─ 알고리즘 성과 평가
├─ 고객/테라피스트 만족도 트렌드
├─ 공정성 점수 개선도
└─ 테라피스트 성과 연관성 분석

개선 사항:
├─ AI 추천 정확도 개선 (수정 이유 분석)
├─ 정책 모드 튜닝 (가중치 조정)
├─ UI/UX 개선 (선택 프로세스 최적화)
└─ 자동화 수준 조정 (자동 확정 기준)
```

---

## 7. FAQ

### Q1: AI 추천이 항상 최고점인가?
```
A: 맞습니다. AI는 현재 정책 및 조건에 따라 최고점의 
   테라피스트를 1순위로 추천합니다. 하지만 어드민은 
   이를 무시하고 다른 테라피스트를 선택할 수 있습니다.
   (예: 고객 요청, 테라피스트 불가능 등)
```

### Q2: 선택 이유를 기록하는 이유는?
```
A: 3가지 이유입니다:
   1. 투명성: AI 추천과 다른 선택의 정당성 기록
   2. 학습: 어떤 상황에서 수정되는지 패턴 분석
   3. 개선: AI 알고리즘 개선 데이터로 활용
   
   예: "고객이 여성 테라피스트 선호" 패턴이 많으면
       → AI에 "고객 성별 선호도" 가중치 추가 검토
```

### Q3: 정책을 변경하면 어떻게 되나?
```
A: 정책 변경 후 "재계산" 버튼을 누르면
   새로운 정책으로 AI가 다시 점수를 계산해서
   새로운 상위 3명을 제시합니다.
   
   예: 기본 모드(이소영 1순위) → 공정성 모드(최정은 1순위)
   이전 선택을 취소하고 새로 선택할 수 있습니다.
```

### Q4: 수정이 너무 많으면?
```
A: 월간 분석에서 수정률이 50% 이상이면
   AI 알고리즘에 문제가 있을 가능성입니다.
   
   액션:
   1. 수정 이유 분석 (패턴 파악)
   2. AI 가중치 조정 검토
   3. 정책 모드 변경 검토
   4. 고객 데이터 추가 (선호도 등)
```

### Q5: 수정이 너무 적으면?
```
A: 월간 분석에서 수정률이 5% 이하면
   AI가 너무 정확하거나, 어드민이 AI를 
   과도하게 신뢰하고 있을 가능성입니다.
   
   액션:
   1. 어드민에게 "수정도 가능하다" 재상기
   2. 특수한 상황(고객 요청 등) 최대화 권장
   3. 공정성 모드 사용 권장 (다양성 증대)
```

---

## 8. 배포 플랜

### Phase 1 (MVP, 7월)
```
✅ AI 추천 생성 (기본 모드만)
✅ 어드민 선택 (3명 후보 + 수동 선택)
✅ 선택 기록 (DB에 저장)
✅ 기본 UI (간단한 버튼)
```

### Phase 2 (v1.5, 8월)
```
✅ 정책 변경 & 재계산 (4가지 모드)
✅ 선택 이유 입력 필드
✅ 선택 이력 조회
✅ 분석 대시보드
✅ 고급 UI (정책 선택, 이유 입력 등)
```

---

**최종 정리**: AI는 추천하고, 어드민은 선택하고, 시스템은 기록한다! 🎯

---

✨ **이 메커니즘으로 유연성(어드민 수정)과 투명성(기록/분석)을 모두 확보합니다!** ✨
