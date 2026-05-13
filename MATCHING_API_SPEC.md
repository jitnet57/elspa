# 매칭 엔진 API 명세서

**문서 버전**: 1.0  
**API 버전**: v1  
**베이스 URL**: `https://api.elspa.com/api/matching`  
**인증**: Bearer Token (Authorization 헤더)  

---

## 📋 목차

1. [개요](#개요)
2. [인증](#인증)
3. [엔드포인트](#엔드포인트)
4. [요청/응답 스키마](#요청응답-스키마)
5. [에러 처리](#에러-처리)
6. [Rate Limiting](#rate-limiting)
7. [사용 예제](#사용-예제)

---

## 개요

### API 목적

테라피스트 자동 매칭 엔진의 REST API로, 다음을 제공합니다:

- 매칭 후보자 추천
- 매칭 확정
- 사용 가능한 모드 조회
- 매칭 시뮬레이션 (공정성 분석)

### 주요 특징

```
✓ 4가지 매칭 모드 (Balanced, Fairness, New Boost, Hybrid)
✓ 실시간 점수 계산
✓ 시뮬레이션 기반 분석
✓ RESTful 설계
✓ JSON 요청/응답
✓ 비동기 처리 (async/await)
```

### 기술 스택

```
Framework: FastAPI (Python)
Database: PostgreSQL (Supabase)
Async: asyncio, SQLAlchemy AsyncSession
Response Format: JSON
Authentication: JWT Bearer Token
```

---

## 인증

### Bearer Token

모든 요청에 다음 헤더 포함:

```http
Authorization: Bearer <your_jwt_token>
```

### Token 생성 (별도 엔드포인트)

```
POST /api/auth/token
Content-Type: application/json

{
    "username": "user@example.com",
    "password": "password123"
}

Response (200 OK):
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
}
```

### 토큰 갱신

```
POST /api/auth/refresh
Authorization: Bearer <your_refresh_token>

Response (200 OK):
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
}
```

---

## 엔드포인트

### 1. 매칭 후보 조회

#### 요청

```http
POST /api/matching/propose
Content-Type: application/json
Authorization: Bearer <token>

{
    "service_id": 1,
    "requested_time": "14:00",
    "preferred_staff_id": null,
    "mode": "balanced",
    "limit": 3
}
```

#### 파라미터

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `service_id` | integer | ✓ | 서비스 ID (1부터 시작) |
| `requested_time` | string | - | 요청 시간 (HH:MM 형식, 예: "14:00") |
| `preferred_staff_id` | integer | - | 선호하는 테라피스트 ID (선택) |
| `mode` | string | - | 매칭 모드: `balanced` \| `fairness` \| `new_boost` \| `hybrid` (기본값: `balanced`) |
| `limit` | integer | - | 반환할 최대 후보 수 (1~10, 기본값: 3) |

#### 응답

**Status: 200 OK**

```json
{
    "mode": "balanced",
    "total_candidates": 3,
    "candidates": [
        {
            "staff_id": 1,
            "name": "Alice",
            "rating": 4.5,
            "total_sessions": 100,
            "month_sessions": 10,
            "score": 96.5,
            "breakdown": {
                "expertise": 70,
                "availability": 20,
                "rating": 8,
                "fairness": null,
                "new_boost": null
            },
            "availability_status": "available"
        },
        {
            "staff_id": 2,
            "name": "Bob",
            "rating": 4.3,
            "total_sessions": 75,
            "month_sessions": 12,
            "score": 92.3,
            "breakdown": {
                "expertise": 70,
                "availability": 18,
                "rating": 6,
                "fairness": null,
                "new_boost": null
            },
            "availability_status": "available"
        },
        {
            "staff_id": 3,
            "name": "Carol",
            "rating": 4.6,
            "total_sessions": 150,
            "month_sessions": 20,
            "score": 89.5,
            "breakdown": {
                "expertise": 70,
                "availability": 10,
                "rating": 9,
                "fairness": null,
                "new_boost": null
            },
            "availability_status": "available"
        }
    ]
}
```

#### 필드 설명

```json
{
    "mode": "사용된 매칭 모드",
    "total_candidates": "반환된 후보 수",
    "candidates": [
        {
            "staff_id": "테라피스트 ID",
            "name": "테라피스트 이름",
            "rating": "평점 (0.0~5.0)",
            "total_sessions": "누적 세션 수",
            "month_sessions": "이달 세션 수",
            "score": "매칭 점수 (0~100 또는 0~120)",
            "breakdown": {
                "expertise": "전문성 점수 (0~70)",
                "availability": "가용시간 점수 (0~20)",
                "rating": "평점 점수 (0~10)",
                "fairness": "공정성 점수 (0~30, Fairness 모드만)",
                "new_boost": "신인 보너스 (0~20, New Boost 모드만)"
            },
            "availability_status": "가용 상태 (available|busy|unavailable)"
        }
    ]
}
```

#### 에러 응답

**Status: 400 Bad Request**
```json
{
    "detail": "invalid service_id"
}
```

**Status: 500 Internal Server Error**
```json
{
    "detail": "Database connection failed"
}
```

---

### 2. 매칭 확정

#### 요청

```http
POST /api/matching/confirm
Content-Type: application/json
Authorization: Bearer <token>

{
    "booking_id": 42,
    "staff_id": 1
}
```

#### 파라미터

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `booking_id` | integer | ✓ | 예약 ID |
| `staff_id` | integer | ✓ | 테라피스트 ID |

#### 응답

**Status: 200 OK**

```json
{
    "success": true,
    "booking_id": 42,
    "staff_id": 1,
    "confirmed_at": "2026-05-13T14:30:45.123456"
}
```

#### 에러 응답

**Status: 400 Bad Request**
```json
{
    "detail": "Booking not found"
}
```

**Status: 409 Conflict**
```json
{
    "detail": "Staff is not available"
}
```

---

### 3. 사용 가능한 모드 조회

#### 요청

```http
GET /api/matching/modes
Authorization: Bearer <token>
```

#### 응답

**Status: 200 OK**

```json
{
    "modes": [
        "balanced",
        "fairness",
        "new_boost",
        "hybrid"
    ]
}
```

#### 설명

```
balanced:    균형잡힌 매칭 (기본, 고품질)
fairness:    공정성 중심 (모두에게 동등한 기회)
new_boost:   신인 부스트 (신입 테라피스트 육성)
hybrid:      시간대별 자동 전환
```

---

### 4. 매칭 시뮬레이션

#### 요청

```http
POST /api/matching/simulate
Content-Type: application/json
Authorization: Bearer <token>

{
    "service_id": 1,
    "mode": "fairness",
    "num_simulations": 1000
}
```

#### 파라미터

| 이름 | 타입 | 필수 | 범위 | 설명 |
|------|------|------|------|------|
| `service_id` | integer | ✓ | 1+ | 서비스 ID |
| `mode` | string | ✓ | - | 매칭 모드 |
| `num_simulations` | integer | - | 100~10000 | 시뮬레이션 횟수 (기본값: 1000) |

#### 응답

**Status: 200 OK**

```json
{
    "mode": "fairness",
    "total_simulations": 1000,
    "total_matches": 1000,
    "average_score": 85.4,
    "fairness_score": 88.2,
    "staff_matching_count": {
        "1": 350,
        "2": 200,
        "3": 200,
        "4": 150,
        "5": 100
    },
    "staff_matching_percentage": {
        "1": 35.0,
        "2": 20.0,
        "3": 20.0,
        "4": 15.0,
        "5": 10.0
    },
    "average_score_per_staff": {
        "1": 94.2,
        "2": 84.5,
        "3": 85.1,
        "4": 78.3,
        "5": 72.9
    }
}
```

#### 필드 설명

```json
{
    "mode": "사용된 모드",
    "total_simulations": "시뮬레이션 횟수",
    "total_matches": "총 매칭 수",
    "average_score": "평균 매칭 점수",
    "fairness_score": "공정성 지표 (0~100, 높을수록 공정함)",
    "staff_matching_count": "테라피스트별 선택된 횟수",
    "staff_matching_percentage": "테라피스트별 선택 비율 (%)",
    "average_score_per_staff": "테라피스트별 평균 점수"
}
```

#### 용도

```
공정성 분석:
- fairness_score가 높을수록 공정한 모드
- staff_matching_percentage로 선택 분포 확인

모드 선택:
- Fairness: fairness_score > 80
- Balanced: 신인 선택률 < 15%
- New Boost: 신인 선택률 > 50%
- Hybrid: fairness_score와 average_score 균형
```

---

## 요청/응답 스키마

### Common Response Format

모든 성공 응답:

```json
{
    "data": { /* 실제 데이터 */ },
    "meta": {
        "timestamp": "2026-05-13T14:30:45.123456",
        "request_id": "req_abc123def456",
        "version": "1.0"
    }
}
```

모든 에러 응답:

```json
{
    "error": {
        "code": "INVALID_REQUEST",
        "message": "Invalid service_id: 999",
        "details": {
            "field": "service_id",
            "reason": "Service not found"
        }
    },
    "meta": {
        "timestamp": "2026-05-13T14:30:45.123456",
        "request_id": "req_abc123def456",
        "version": "1.0"
    }
}
```

### Candidate Schema

```json
{
    "type": "object",
    "properties": {
        "staff_id": {
            "type": "integer",
            "description": "테라피스트 ID"
        },
        "name": {
            "type": "string",
            "description": "테라피스트 이름"
        },
        "rating": {
            "type": "number",
            "format": "float",
            "minimum": 0,
            "maximum": 5,
            "description": "평점"
        },
        "total_sessions": {
            "type": "integer",
            "minimum": 0,
            "description": "누적 세션 수"
        },
        "month_sessions": {
            "type": "integer",
            "minimum": 0,
            "description": "이달 세션 수"
        },
        "score": {
            "type": "number",
            "format": "float",
            "minimum": 0,
            "maximum": 120,
            "description": "매칭 점수"
        },
        "breakdown": {
            "$ref": "#/components/schemas/ScoreBreakdown"
        },
        "availability_status": {
            "type": "string",
            "enum": ["available", "busy", "unavailable"],
            "description": "가용 상태"
        }
    }
}
```

### ScoreBreakdown Schema

```json
{
    "type": "object",
    "properties": {
        "expertise": {
            "type": "number",
            "format": "float",
            "minimum": 0,
            "maximum": 70,
            "description": "전문성 점수"
        },
        "availability": {
            "type": "number",
            "format": "float",
            "minimum": 0,
            "maximum": 20,
            "description": "가용시간 점수"
        },
        "rating": {
            "type": "number",
            "format": "float",
            "minimum": 0,
            "maximum": 10,
            "description": "평점 점수"
        },
        "fairness": {
            "type": ["number", "null"],
            "minimum": 0,
            "maximum": 30,
            "description": "공정성 점수 (Fairness 모드만)"
        },
        "new_boost": {
            "type": ["number", "null"],
            "minimum": 0,
            "maximum": 20,
            "description": "신인 보너스 (New Boost 모드만)"
        }
    }
}
```

---

## 에러 처리

### 에러 코드

| 코드 | HTTP 상태 | 설명 | 해결책 |
|------|----------|------|--------|
| `INVALID_REQUEST` | 400 | 요청 파라미터 오류 | 요청 형식 확인 |
| `INVALID_SERVICE_ID` | 400 | 존재하지 않는 서비스 | 서비스 ID 확인 |
| `BOOKING_NOT_FOUND` | 404 | 예약을 찾을 수 없음 | 예약 ID 확인 |
| `STAFF_NOT_FOUND` | 404 | 테라피스트를 찾을 수 없음 | 테라피스트 ID 확인 |
| `STAFF_UNAVAILABLE` | 409 | 테라피스트 불가능 | 다른 후보 선택 |
| `UNAUTHORIZED` | 401 | 인증 토큰 오류 | 토큰 갱신 |
| `FORBIDDEN` | 403 | 권한 없음 | 관리자 문의 |
| `RATE_LIMITED` | 429 | 요청 한도 초과 | 잠시 후 재시도 |
| `INTERNAL_ERROR` | 500 | 서버 오류 | 관리자 문의 |

### 에러 응답 예제

**400 Bad Request**
```json
{
    "error": {
        "code": "INVALID_REQUEST",
        "message": "Invalid parameters",
        "details": {
            "field": "mode",
            "reason": "Must be one of: balanced, fairness, new_boost, hybrid"
        }
    }
}
```

**404 Not Found**
```json
{
    "error": {
        "code": "BOOKING_NOT_FOUND",
        "message": "Booking ID 42 not found",
        "details": {
            "booking_id": 42
        }
    }
}
```

**429 Too Many Requests**
```json
{
    "error": {
        "code": "RATE_LIMITED",
        "message": "Too many requests",
        "details": {
            "retry_after": 60
        }
    }
}
```

---

## Rate Limiting

### 제한 사항

```
기본 한도:
- 인증된 사용자: 100 요청/분
- 시뮬레이션: 10 요청/분 (무거운 작업)
- 매칭 확정: 제한 없음

초과 시:
- 429 Too Many Requests 반환
- Retry-After 헤더에 대기 시간 포함
```

### 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1684080645
Retry-After: 60
```

---

## 사용 예제

### Python

```python
import requests
import json

BASE_URL = "https://api.elspa.com/api/matching"
TOKEN = "your_jwt_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 예제 1: 매칭 후보 조회
response = requests.post(
    f"{BASE_URL}/propose",
    headers=headers,
    json={
        "service_id": 1,
        "requested_time": "14:00",
        "mode": "balanced",
        "limit": 3
    }
)

print(json.dumps(response.json(), indent=2))

# 예제 2: 매칭 확정
response = requests.post(
    f"{BASE_URL}/confirm",
    headers=headers,
    json={
        "booking_id": 42,
        "staff_id": 1
    }
)

print(json.dumps(response.json(), indent=2))

# 예제 3: 매칭 시뮬레이션
response = requests.post(
    f"{BASE_URL}/simulate",
    headers=headers,
    json={
        "service_id": 1,
        "mode": "fairness",
        "num_simulations": 1000
    }
)

print(json.dumps(response.json(), indent=2))
```

### JavaScript (Node.js)

```javascript
const BASE_URL = 'https://api.elspa.com/api/matching';
const TOKEN = 'your_jwt_token';

const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
};

// 예제 1: 매칭 후보 조회
async function proposeMatching() {
    const response = await fetch(`${BASE_URL}/propose`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            service_id: 1,
            requested_time: '14:00',
            mode: 'balanced',
            limit: 3
        })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

// 예제 2: 매칭 확정
async function confirmMatching() {
    const response = await fetch(`${BASE_URL}/confirm`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            booking_id: 42,
            staff_id: 1
        })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

// 예제 3: 매칭 시뮬레이션
async function simulateMatching() {
    const response = await fetch(`${BASE_URL}/simulate`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            service_id: 1,
            mode: 'fairness',
            num_simulations: 1000
        })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

// 실행
proposeMatching();
confirmMatching();
simulateMatching();
```

### cURL

```bash
# 1. 매칭 후보 조회
curl -X POST https://api.elspa.com/api/matching/propose \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "requested_time": "14:00",
    "mode": "balanced",
    "limit": 3
  }'

# 2. 매칭 확정
curl -X POST https://api.elspa.com/api/matching/confirm \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 42,
    "staff_id": 1
  }'

# 3. 사용 가능한 모드
curl -X GET https://api.elspa.com/api/matching/modes \
  -H "Authorization: Bearer your_jwt_token"

# 4. 매칭 시뮬레이션
curl -X POST https://api.elspa.com/api/matching/simulate \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "mode": "fairness",
    "num_simulations": 1000
  }'
```

---

## 개발 가이드

### 로컬 테스트

```bash
# 1. 테스트 서버 시작
python -m uvicorn main:app --reload --port 8000

# 2. API 문서 (자동 생성)
http://localhost:8000/docs       # Swagger UI
http://localhost:8000/redoc      # ReDoc

# 3. 테스트 실행
pytest test_matching_engine.py -v
```

### 모니터링

```python
# 로그 확인
# /var/log/elspa/matching.log

# 메트릭
# - 평균 응답 시간: < 500ms
# - 성공률: > 99.5%
# - 에러율: < 0.5%
```

---

## 변경 이력

| 버전 | 날짜 | 변경사항 |
|------|------|---------|
| 1.0 | 2026-05-13 | 초기 릴리스 |

---

**API 문서 제목**: Matching Engine API Specification  
**작성자**: Team F (매칭 알고리즘)  
**마지막 수정**: 2026-05-13  
**다음 검토**: 2026-06-13
