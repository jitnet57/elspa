# ElSpa API Specification (OpenAPI 3.0)

**버전:** 1.0.0  
**작성일:** 2026-05-13  
**담당팀:** Team G (Backend API Layer)  
**상태:** Spec Ready for Implementation

---

## 목차

1. [개요](#개요)
2. [인증](#인증)
3. [데이터 모델](#데이터-모델)
4. [API 엔드포인트](#api-엔드포인트)
5. [오류 처리](#오류-처리)
6. [실시간 업데이트](#실시간-업데이트)
7. [레이트 제한](#레이트-제한)

---

## 개요

### 기본 정보

```
Base URL: http://localhost:8000 (Dev) / https://api.elspa.com (Prod)
Protocol: REST + HTTP/JSON
Auth: Bearer Token (Phase 2)
Timeout: 5 seconds (API request)
Polling: 5 seconds (Frontend refresh)
```

### 핵심 도메인

- **Beds**: 86개 침대의 상태 관리
- **Therapists**: 테라피스트 현황 관리
- **Bookings**: 고객 예약 및 매칭
- **Attendance**: 테라피스트 출근/퇴근
- **Notifications**: 알림 큐

---

## 인증

### Phase 1 (현재) — No Auth

모든 엔드포인트는 인증 없이 접근 가능합니다. (로컬 네트워크 전용)

### Phase 2 (이후) — Bearer Token

```
Authorization: Bearer <token>
```

---

## 데이터 모델

### Bed (침대)

```typescript
interface Bed {
  id: number;                // 1-86, 고유 ID
  bed_number: number;        // 1-30 (각 룸별로 번호 매김)
  room_zone: string;         // '마사지룸1' | '마사지룸2' | 'VIP룸' | '커플룸'
  status: 'available' | 'reserved' | 'in_service' | 'cleaning';
  customer_name?: string;    // 예약/서비스 중인 고객 이름
  therapist_id?: number;     // 배정된 테라피스트 ID
  therapist_name?: string;   // 배정된 테라피스트 이름 (조회 편의)
  service_name?: string;     // '스웨디시 60분', '타이마사지 90분' 등
  service_minutes?: number;  // 60, 90, 45 등
  starts_at?: string;        // ISO 8601 timestamp (예: 2026-05-13T14:30:00Z)
  ends_at?: string;          // ISO 8601 timestamp (예: 2026-05-13T15:30:00Z)
  updated_at: string;        // 마지막 업데이트 시간
  created_at: string;        // 생성 시간
}
```

**상태 전환 다이어그램:**
```
available → [고객예약] → reserved → [고객도착] → in_service → [서비스종료] → cleaning → [정리완료] → available
```

---

### Therapist (테라피스트)

```typescript
interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  // idle: 대기 중, 즉시 배정 가능
  // in_service: 현재 서비스 중
  // resting: 휴식 중
  // checked_out: 퇴근함

  specialty: string;         // '스웨디시' | '타이마사지' | '핫스톤' | '종합'
  current_bed_id?: number;   // in_service 상태일 때만 값 있음
  current_bed_number?: number;
  remaining_minutes?: number; // in_service 상태일 때 남은 시간
  rating?: number;           // 0-5 평점
  total_sessions?: number;   // 총 누적 세션 수

  updated_at: string;
  created_at: string;
}
```

---

### Booking (예약)

```typescript
interface Booking {
  id: number;
  customer_id: number;       // 고객 ID
  customer_name: string;     // 고객 이름
  service_type: string;      // '스웨디시' | '타이마사지' 등
  service_minutes: number;   // 60, 90, 45 등
  requested_therapist_id?: number;  // 원하는 테라피스트 (선택사항)
  status: 'requested' | 'matched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

  // 매칭 정보
  matched_therapist_id?: number;
  matched_therapist_name?: string;
  matched_bed_id?: number;

  // 타이밍
  requested_at: string;      // 예약 요청 시간
  scheduled_at: string;      // 예약 시간 (고객이 들어올 예상 시간)
  started_at?: string;       // 실제 시작 시간
  ends_at?: string;          // 실제 종료 시간

  // 메타데이터
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

### Attendance (테라피스트 출퇴근)

```typescript
interface Attendance {
  id: number;
  therapist_id: number;
  therapist_name: string;
  date: string;              // YYYY-MM-DD
  checked_in_at: string;     // ISO 8601 (체크인 시간)
  checked_out_at?: string;   // ISO 8601 (체크아웃 시간, optional)
  status: 'checked_in' | 'checked_out';
  
  // 통계
  total_sessions: number;
  total_hours: number;
  
  created_at: string;
  updated_at: string;
}
```

---

## API 엔드포인트

### 1. Beds API

#### 1.1 침대 목록 조회

```
GET /api/beds
```

**쿼리 파라미터:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| room_zone | string | No | 필터: '마사지룸1', '마사지룸2', 'VIP룸', '커플룸' |
| status | string | No | 필터: 'available', 'reserved', 'in_service', 'cleaning' |

**응답 (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "bed_number": 1,
      "room_zone": "마사지룸1",
      "status": "available",
      "updated_at": "2026-05-13T14:30:00Z",
      "created_at": "2026-05-01T00:00:00Z"
    },
    {
      "id": 5,
      "bed_number": 5,
      "room_zone": "마사지룸1",
      "status": "in_service",
      "customer_name": "김민준",
      "therapist_id": 1,
      "therapist_name": "박유진",
      "service_name": "스웨디시 60분",
      "starts_at": "2026-05-13T14:20:00Z",
      "ends_at": "2026-05-13T15:20:00Z",
      "remaining_minutes": 42,
      "updated_at": "2026-05-13T14:30:00Z",
      "created_at": "2026-05-01T00:00:00Z"
    }
  ],
  "total_count": 86,
  "filtered_count": 1
}
```

**응답 시간:** < 200ms  
**캐시:** 3초 (5초 폴링 기반)

---

#### 1.2 특정 침대 조회

```
GET /api/beds/{bed_id}
```

**경로 파라미터:**

| Param | Type | Required |
|-------|------|----------|
| bed_id | integer | Yes |

**응답 (200 OK):**

```json
{
  "id": 5,
  "bed_number": 5,
  "room_zone": "마사지룸1",
  "status": "in_service",
  "customer_name": "김민준",
  "therapist_id": 1,
  "therapist_name": "박유진",
  "service_name": "스웨디시 60분",
  "service_minutes": 60,
  "starts_at": "2026-05-13T14:20:00Z",
  "ends_at": "2026-05-13T15:20:00Z",
  "updated_at": "2026-05-13T14:30:00Z",
  "created_at": "2026-05-01T00:00:00Z"
}
```

**오류 (404 Not Found):**

```json
{
  "error": "Bed not found",
  "bed_id": 999
}
```

---

#### 1.3 침대 상태 업데이트

```
POST /api/beds/{bed_id}/status
```

**요청 본문:**

```json
{
  "status": "in_service",
  "customer_name": "김민준",
  "therapist_id": 1,
  "therapist_name": "박유진",
  "service_name": "스웨디시 60분",
  "service_minutes": 60,
  "starts_at": "2026-05-13T14:20:00Z",
  "ends_at": "2026-05-13T15:20:00Z"
}
```

**응답 (200 OK):**

```json
{
  "id": 5,
  "bed_number": 5,
  "status": "in_service",
  "updated_at": "2026-05-13T14:32:00Z"
}
```

**오류 (400 Bad Request):**

```json
{
  "error": "Invalid status transition",
  "current_status": "available",
  "requested_status": "cleaning",
  "detail": "Available beds cannot transition to cleaning state"
}
```

**자동 상태 전환 규칙 (서버):**
- `in_service` 상태이고 `ends_at < now()` → 자동으로 `cleaning`으로 변경
- 이 규칙은 매 API 호출 시 검사됨

---

### 2. Therapists API

#### 2.1 테라피스트 목록 조회

```
GET /api/therapists
```

**쿼리 파라미터:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | 필터: 'idle', 'in_service', 'resting', 'checked_out' |
| specialty | string | No | 필터: '스웨디시', '타이마사지' 등 |

**응답 (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "박유진",
      "status": "in_service",
      "specialty": "스웨디시",
      "current_bed_id": 5,
      "current_bed_number": 5,
      "remaining_minutes": 42,
      "rating": 4.8,
      "total_sessions": 1247,
      "updated_at": "2026-05-13T14:30:00Z",
      "created_at": "2026-01-15T00:00:00Z"
    },
    {
      "id": 3,
      "name": "이소영",
      "status": "idle",
      "specialty": "핫스톤",
      "rating": 4.9,
      "total_sessions": 956,
      "updated_at": "2026-05-13T14:28:00Z",
      "created_at": "2026-02-10T00:00:00Z"
    }
  ],
  "total_count": 8,
  "idle_count": 3,
  "in_service_count": 2,
  "resting_count": 1,
  "checked_out_count": 2
}
```

---

#### 2.2 테라피스트 체크인

```
POST /api/therapists/{therapist_id}/checkin
```

**경로 파라미터:**

| Param | Type | Required |
|-------|------|----------|
| therapist_id | integer | Yes |

**요청 본문:**

```json
{
  "date": "2026-05-13"
}
```

**응답 (200 OK):**

```json
{
  "id": 1,
  "name": "박유진",
  "status": "idle",
  "specialty": "스웨디시",
  "checked_in_at": "2026-05-13T10:00:00Z",
  "message": "체크인 완료. 현재 대기 상태입니다."
}
```

**오류 (409 Conflict):**

```json
{
  "error": "Already checked in",
  "therapist_id": 1,
  "checked_in_at": "2026-05-13T10:00:00Z"
}
```

---

#### 2.3 테라피스트 체크아웃

```
POST /api/therapists/{therapist_id}/checkout
```

**응답 (200 OK):**

```json
{
  "id": 1,
  "name": "박유진",
  "status": "checked_out",
  "checked_out_at": "2026-05-13T18:00:00Z",
  "summary": {
    "sessions_today": 8,
    "total_hours": 7.5
  }
}
```

---

### 3. Bookings API

#### 3.1 예약 생성

```
POST /api/bookings
```

**요청 본문:**

```json
{
  "customer_name": "김민준",
  "customer_id": 101,
  "service_type": "스웨디시",
  "service_minutes": 60,
  "requested_therapist_id": null,
  "scheduled_at": "2026-05-13T15:00:00Z",
  "notes": "민감한 피부"
}
```

**응답 (201 Created):**

```json
{
  "id": 1001,
  "customer_name": "김민준",
  "service_type": "스웨디시",
  "service_minutes": 60,
  "status": "requested",
  "requested_at": "2026-05-13T14:35:00Z",
  "scheduled_at": "2026-05-13T15:00:00Z"
}
```

---

#### 3.2 대기 중인 예약 목록

```
GET /api/bookings?status=requested,matched
```

**응답 (200 OK):**

```json
{
  "data": [
    {
      "id": 1001,
      "customer_name": "김민준",
      "service_type": "스웨디시",
      "service_minutes": 60,
      "status": "requested",
      "requested_at": "2026-05-13T14:35:00Z",
      "scheduled_at": "2026-05-13T15:00:00Z"
    }
  ],
  "total_count": 1
}
```

---

### 4. Matching API (매칭)

#### 4.1 매칭 제안 생성

```
POST /api/matching/propose
```

**요청 본문:**

```json
{
  "booking_id": 1001,
  "mode": "balanced"
}
```

**모드:**
- `balanced`: 전문성 70%, 시간 20%, 평점 10% (기본)
- `fairness`: 모든 테라피스트에게 균등한 기회 제공
- `new_boost`: 신입 테라피스트 우대
- `hybrid`: 균형과 공정성 혼합

**응답 (200 OK):**

```json
{
  "booking_id": 1001,
  "customer_name": "김민준",
  "service_type": "스웨디시",
  "candidates": [
    {
      "rank": 1,
      "therapist_id": 1,
      "therapist_name": "박유진",
      "specialty": "스웨디시",
      "score": 92,
      "score_breakdown": {
        "expertise": 70,
        "availability": 15,
        "rating": 7
      },
      "availability": "즉시 가용",
      "estimated_start": "2026-05-13T14:45:00Z"
    },
    {
      "rank": 2,
      "therapist_id": 2,
      "therapist_name": "최정은",
      "specialty": "타이마사지",
      "score": 87,
      "availability": "25분 후",
      "estimated_start": "2026-05-13T15:00:00Z"
    },
    {
      "rank": 3,
      "therapist_id": 8,
      "therapist_name": "유지원",
      "specialty": "타이마사지",
      "score": 81,
      "availability": "32분 후",
      "estimated_start": "2026-05-13T15:07:00Z"
    }
  ],
  "proposed_at": "2026-05-13T14:35:00Z",
  "expires_at": "2026-05-13T14:40:00Z"
}
```

**응답 시간:** 500ms - 1초 (AI 알고리즘 실행)

---

#### 4.2 매칭 확정

```
POST /api/matching/confirm
```

**요청 본문:**

```json
{
  "booking_id": 1001,
  "therapist_id": 1,
  "bed_id": 5
}
```

**응답 (200 OK):**

```json
{
  "booking_id": 1001,
  "therapist_id": 1,
  "therapist_name": "박유진",
  "bed_id": 5,
  "bed_number": 5,
  "room_zone": "마사지룸1",
  "status": "confirmed",
  "confirmed_at": "2026-05-13T14:36:00Z",
  "message": "매칭이 확정되었습니다. 테라피스트를 침대로 안내하세요."
}
```

**중요:** 이 호출 후:
1. `bookings` 테이블: status → `confirmed`
2. `beds` 테이블: status → `reserved`, customer_name, therapist_id 업데이트
3. `therapists` 테이블: status → `ready` (Phase 2에서)

---

#### 4.3 What-if 시뮬레이션

```
POST /api/matching/simulate
```

**요청 본문:**

```json
{
  "service_type": "스웨디시",
  "service_minutes": 60,
  "requested_therapist_id": null,
  "mode": "balanced"
}
```

**응답 (200 OK):**

```json
{
  "simulation_id": "sim_12345",
  "service_type": "스웨디시",
  "candidates": [
    {
      "therapist_id": 1,
      "therapist_name": "박유진",
      "score": 92,
      "estimated_start": "2026-05-13T14:45:00Z",
      "estimated_bed": 5
    }
  ],
  "note": "This is a simulation. No data was written to the database."
}
```

**중요:** DB에 변경사항 없음 (순수 계산만)

---

### 5. Predictions API (예측)

#### 5.1 평균 대기시간

```
GET /api/predictions/wait-time
```

**응답 (200 OK):**

```json
{
  "average_wait_minutes": 12,
  "next_available_therapist": {
    "id": 3,
    "name": "이소영",
    "availability": "즉시 가용",
    "specialty": "핫스톤"
  },
  "idle_therapists_count": 3,
  "in_service_therapists_count": 2,
  "calculated_at": "2026-05-13T14:36:00Z"
}
```

---

#### 5.2 테라피스트별 예측

```
GET /api/predictions/therapist-availability
```

**응답 (200 OK):**

```json
{
  "data": [
    {
      "therapist_id": 1,
      "therapist_name": "박유진",
      "status": "in_service",
      "current_bed_number": 5,
      "available_at": "2026-05-13T15:20:00Z",
      "minutes_until_available": 42
    },
    {
      "therapist_id": 3,
      "therapist_name": "이소영",
      "status": "idle",
      "available_at": "즉시",
      "minutes_until_available": 0
    }
  ]
}
```

---

## 오류 처리

### 표준 오류 응답 형식

```json
{
  "error": "Error message in English",
  "error_ko": "한국어 오류 메시지",
  "status_code": 400,
  "error_code": "INVALID_REQUEST",
  "timestamp": "2026-05-13T14:36:00Z",
  "details": {
    "field": "service_minutes",
    "issue": "Must be between 30 and 120 minutes"
  }
}
```

### HTTP 상태 코드

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET /api/beds (성공) |
| 201 | Created | POST /api/bookings (생성 성공) |
| 400 | Bad Request | 잘못된 파라미터 (음수 service_minutes 등) |
| 404 | Not Found | 존재하지 않는 침대 ID |
| 409 | Conflict | 이미 체크인한 테라피스트 |
| 422 | Unprocessable Entity | 비즈니스 로직 위반 (예: 모든 테라피스트 in_service) |
| 500 | Internal Server Error | 서버 오류 |
| 503 | Service Unavailable | DB 연결 불가 |

---

## 실시간 업데이트

### 폴링 기반 (Phase 1 - 현재)

**클라이언트:**
```typescript
setInterval(async () => {
  const beds = await fetch('/api/beds');
  const therapists = await fetch('/api/therapists');
  // 상태 업데이트
}, 5000);  // 5초
```

**서버:**
- 응답 시간: < 200ms (캐시 활용)
- 상태 자동 전환 (ends_at 체크)

---

### WebSocket 기반 (Phase 2)

```
wss://api.elspa.com/ws/monitor
```

**메시지 형식:**

```json
{
  "type": "bed_status_changed",
  "data": {
    "bed_id": 5,
    "status": "cleaning",
    "timestamp": "2026-05-13T15:20:00Z"
  }
}
```

---

## 레이트 제한

### Phase 1 (로컬 네트워크, 제한 없음)

- Rate limit: 없음
- Timeout: 5초 (연결 타임아웃)

### Phase 2 (클라우드 배포)

- Rate limit: 100 req/min per IP
- X-RateLimit-Remaining: 헤더로 제공

---

## 구현 체크리스트 (Team G)

### Week 1 (May 13-19)

- [ ] FastAPI 프로젝트 구조 설정
- [ ] Pydantic 모델 정의 (Bed, Therapist, Booking 등)
- [ ] `/api/beds` GET 엔드포인트 (DB 연동)
- [ ] `/api/therapists` GET 엔드포인트
- [ ] DB 자동 상태 전환 로직 (in_service → cleaning)
- [ ] 기본 오류 처리

### Week 2 (May 20-26)

- [ ] `/api/bookings` POST 엔드포인트
- [ ] `/api/matching/propose` (Team F 알고리즘 통합)
- [ ] `/api/matching/confirm` (트랜잭션)
- [ ] `/api/therapists/{id}/checkin`
- [ ] `/api/therapists/{id}/checkout`

### Week 3 (May 27 - June 2)

- [ ] `/api/matching/simulate`
- [ ] `/api/predictions/*` 엔드포인트
- [ ] 캐싱 전략 (Redis 또는 in-memory)
- [ ] 로깅 및 모니터링
- [ ] API 문서 (Swagger/OpenAPI)

### Week 4 (June 3-9)

- [ ] 통합 테스트 (Frontend + Backend)
- [ ] 성능 테스트 (부하 테스트)
- [ ] 버그 수정 및 최적화
- [ ] 배포 준비

---

## 추가 리소스

- **Mock API**: `frontend/lib/api/mock-adapter.ts`
- **Frontend Hooks**: `frontend/hooks/useGetBeds.ts` (Team D)
- **상세 계획**: `20260513-BMAD-LANGGRAPH-WorkPlan.md`

---

**Last Updated:** 2026-05-13  
**Approval:** Ready for Team G Implementation
