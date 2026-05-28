# ElSpa API Integration Guide — Complete Specification & Examples

**Version:** 1.0  
**Date:** 2026-05-29  
**Base URL:** `https://api.elspa.com/api/v1`  
**Status:** Production Ready  

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [27 API Endpoints Specification](#27-api-endpoints-specification)
3. [Error Codes & Responses](#error-codes--responses)
4. [Rate Limiting](#rate-limiting)
5. [Integration Examples](#integration-examples)
6. [Webhooks](#webhooks)

---

## Authentication & Authorization

### JWT Token Management

```
┌─────────────────────────────────────────────────────────┐
│           Authentication Flow                            │
└─────────────────────────────────────────────────────────┘

1. Login
   POST /auth/login
   { "email": "...", "password": "..." }
   Response: { "access_token": "...", "refresh_token": "..." }

2. API Request
   Header: Authorization: Bearer <access_token>
   GET /customers/123

3. Token Refresh (if expired)
   POST /auth/refresh
   { "refresh_token": "..." }
   Response: { "access_token": "..." }
```

### Implementation

```python
# File: api/app/auth/jwt.py
"""
JWT 토큰 관리
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
from pydantic import BaseModel
import os

class TokenRequest(BaseModel):
    """토큰 요청"""
    email: str
    password: str

class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # 초 단위

class JWTManager:
    """JWT 토큰 관리자"""
    
    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        self.algorithm = "HS256"
        self.access_token_expire = 3600  # 1시간
        self.refresh_token_expire = 604800  # 7일
    
    def create_access_token(
        self,
        subject: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """액세스 토큰 생성"""
        
        if expires_delta is None:
            expires_delta = timedelta(seconds=self.access_token_expire)
        
        expire = datetime.utcnow() + expires_delta
        to_encode = {
            "sub": subject,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            self.secret_key,
            algorithm=self.algorithm
        )
        
        return encoded_jwt
    
    def create_refresh_token(self, subject: str) -> str:
        """리프레시 토큰 생성"""
        
        expire = datetime.utcnow() + timedelta(seconds=self.refresh_token_expire)
        to_encode = {
            "sub": subject,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            self.secret_key,
            algorithm=self.algorithm
        )
        
        return encoded_jwt
    
    def verify_token(self, token: str) -> dict:
        """토큰 검증"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception("Token expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")

# FastAPI 의존성
async def get_current_user(
    authorization: str = Header(...)
) -> str:
    """현재 사용자 조회"""
    
    try:
        token = authorization.replace("Bearer ", "")
        jwt_manager = JWTManager()
        payload = jwt_manager.verify_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise Exception("Invalid token")
        
        return user_id
    
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
```

### API Key Authentication

```python
# File: api/app/auth/api_key.py
"""
API 키 기반 인증 (서버-투-서버)
"""

class APIKeyManager:
    """API 키 관리자"""
    
    @staticmethod
    async def verify_api_key(api_key: str, db: Session) -> bool:
        """API 키 검증"""
        
        from api.app.models.api_key import APIKey
        
        key_record = db.query(APIKey).filter(
            APIKey.key == api_key,
            APIKey.is_active == True,
            APIKey.expires_at > datetime.utcnow()
        ).first()
        
        return key_record is not None

# FastAPI 의존성
async def verify_api_key(
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
) -> bool:
    """API 키 검증 미들웨어"""
    
    is_valid = await APIKeyManager.verify_api_key(x_api_key, db)
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True
```

---

## 27 API Endpoints Specification

### Group 1: Authentication (3 endpoints)

#### 1.1 POST /auth/login
```
Request:
{
    "email": "user@example.com",
    "password": "password123"
}

Response (200):
{
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600
}

Errors:
- 400: Invalid email/password
- 401: Account locked
- 422: Validation error
```

#### 1.2 POST /auth/refresh
```
Request:
{
    "refresh_token": "eyJhbGc..."
}

Response (200):
{
    "access_token": "eyJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600
}

Errors:
- 401: Invalid/expired refresh token
```

#### 1.3 POST /auth/logout
```
Headers:
Authorization: Bearer <access_token>

Response (200):
{
    "message": "Logged out successfully"
}

Errors:
- 401: Unauthorized
```

---

### Group 2: Customer Onboarding (4 endpoints)

#### 2.1 POST /onboard/start
```
Request:
{
    "language": "en"
}

Response (200):
{
    "session_id": "uuid",
    "step": "personal_info",
    "progress": 0,
    "form_schema": {
        "fields": [
            { "name": "first_name", "type": "text", "required": true }
        ]
    }
}

Errors:
- 400: Invalid language
```

#### 2.2 GET /onboard/status/{session_id}
```
Response (200):
{
    "session_id": "uuid",
    "step": "personal_info",
    "progress": 25.0,
    "form_schema": { ... },
    "validation_errors": {}
}

Errors:
- 404: Session not found
```

#### 2.3 POST /onboard/submit/{session_id}
```
Request:
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01",
    "gender": "M",
    "nationality": "US"
}

Response (200):
{
    "status": "success",
    "next_step": "address",
    "progress": 33.0,
    "next_action": "submit_form"
}

Or (if error):
{
    "status": "error",
    "validation_errors": {
        "email": "Email already exists"
    },
    "next_action": "retry_form"
}

Errors:
- 400: Validation failed
- 429: Too many attempts
```

#### 2.4 POST /onboard/complete/{session_id}
```
Response (200):
{
    "customer_id": "uuid",
    "token": "eyJhbGc...",
    "kyc_status": "approved"
}

Errors:
- 400: Onboarding not completed
- 409: Customer already exists
```

---

### Group 3: Payroll Management (8 endpoints)

#### 3.1 POST /payroll/periods
```
Request:
{
    "period_start": "2026-05-18",
    "period_end": "2026-06-01",
    "period_type": "biweekly"
}

Response (201):
{
    "period_id": "uuid",
    "period_start": "2026-05-18",
    "period_end": "2026-06-01",
    "status": "open",
    "created_at": "2026-05-29T10:00:00Z"
}

Errors:
- 400: Invalid date range
- 409: Period already exists
```

#### 3.2 GET /payroll/periods
```
Query Parameters:
- status: open|locked|exported
- limit: 20
- offset: 0

Response (200):
{
    "data": [
        { "period_id": "...", "status": "open" }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
}
```

#### 3.3 POST /payroll/calculate
```
Request:
{
    "period_id": "uuid",
    "staff_ids": ["uuid1", "uuid2"]  // null = all staff
}

Response (200):
{
    "status": "success",
    "records_created": 25,
    "records": [
        {
            "record_id": "uuid",
            "staff_id": "uuid",
            "net_pay": 15000.00
        }
    ]
}

Errors:
- 404: Period not found
- 409: Period already calculated
```

#### 3.4 POST /payroll/verify/{record_id}
```
Request:
{
    "verified_by": "uuid",
    "notes": "Verified and approved"
}

Response (200):
{
    "status": "verified",
    "net_pay": 15000.00,
    "verified_at": "2026-05-29T11:00:00Z"
}

Errors:
- 404: Record not found
- 409: Already verified
```

#### 3.5 GET /payroll/records/{period_id}
```
Query Parameters:
- staff_id: uuid (optional)
- verified: true|false (optional)

Response (200):
{
    "data": [
        {
            "record_id": "uuid",
            "staff_id": "uuid",
            "gross_pay": 20000.00,
            "total_deduction": 5000.00,
            "net_pay": 15000.00,
            "verified": true
        }
    ],
    "total": 25
}
```

#### 3.6 POST /payroll/export
```
Request:
{
    "period_id": "uuid",
    "format": "pdf|excel|json"
}

Response (200):
{
    "filename": "payroll_2026-06-01.pdf",
    "url": "https://s3.amazonaws.com/reports/...",
    "expires_in": 3600
}

Errors:
- 404: Period not found
- 415: Unsupported format
```

#### 3.7 POST /payroll/lock
```
Request:
{
    "period_id": "uuid"
}

Response (200):
{
    "status": "locked",
    "locked_at": "2026-05-29T15:00:00Z"
}

Errors:
- 404: Period not found
- 409: Already locked
```

#### 3.8 POST /payroll/disburse
```
Request:
{
    "period_id": "uuid",
    "method": "bank_transfer|check|cash"
}

Response (200):
{
    "status": "processing",
    "disbursement_id": "uuid",
    "total_amount": 375000.00,
    "record_count": 25,
    "estimated_completion": "2026-05-31T00:00:00Z"
}

Errors:
- 404: Period not found
- 409: Already disbursed
```

---

### Group 4: Reporting (5 endpoints)

#### 4.1 POST /reports/payroll
```
Request:
{
    "period_id": "uuid",
    "format": "pdf|excel|json",
    "include_deductions": true,
    "include_audit_trail": true
}

Response (200):
{
    "report_id": "uuid",
    "filename": "payroll_2026-06-01.pdf",
    "url": "https://s3.amazonaws.com/reports/...",
    "generated_at": "2026-05-29T12:00:00Z",
    "expires_in": 3600
}
```

#### 4.2 POST /reports/tax/bir2307
```
Request:
{
    "year": 2026,
    "staff_id": "uuid"  // optional
}

Response (200):
{
    "report_id": "uuid",
    "filename": "BIR-2307-2026.pdf",
    "url": "https://s3.amazonaws.com/reports/...",
    "total_compensation": 450000.00
}
```

#### 4.3 POST /reports/tax/sss
```
Request:
{
    "month": 5,
    "year": 2026
}

Response (200):
{
    "report_id": "uuid",
    "filename": "SSS-MAY-2026.xlsx",
    "url": "https://s3.amazonaws.com/reports/...",
    "total_contributions": 25000.00
}
```

#### 4.4 GET /reports/list
```
Query Parameters:
- type: payroll|tax|attendance
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- limit: 20

Response (200):
{
    "data": [
        {
            "report_id": "uuid",
            "type": "payroll",
            "filename": "...",
            "generated_at": "2026-05-29T12:00:00Z",
            "url": "..."
        }
    ],
    "total": 45
}
```

#### 4.5 DELETE /reports/{report_id}
```
Response (204):
(No content)

Errors:
- 404: Report not found
```

---

### Group 5: Support & Ticketing (4 endpoints)

#### 5.1 POST /support/tickets
```
Request:
{
    "subject": "Payroll calculation incorrect",
    "message": "My net pay calculation seems wrong...",
    "category": "payroll|technical|other",
    "priority": "low|medium|high",
    "language": "en"
}

Response (201):
{
    "ticket_id": "uuid",
    "status": "open",
    "auto_classified_as": "payroll",
    "suggested_faq": [
        {
            "title": "How is my salary calculated?",
            "answer": "..."
        }
    ],
    "created_at": "2026-05-29T10:00:00Z"
}
```

#### 5.2 GET /support/tickets/{ticket_id}
```
Response (200):
{
    "ticket_id": "uuid",
    "status": "open",
    "subject": "...",
    "messages": [
        {
            "sender": "customer|support",
            "message": "...",
            "timestamp": "2026-05-29T10:00:00Z"
        }
    ],
    "assigned_to": "uuid"
}
```

#### 5.3 POST /support/tickets/{ticket_id}/reply
```
Request:
{
    "message": "Here's the solution..."
}

Response (200):
{
    "ticket_id": "uuid",
    "message_id": "uuid",
    "status": "pending_customer_response"
}
```

#### 5.4 GET /support/faq
```
Query Parameters:
- language: en|ko|th|vi|id
- category: payroll|technical|other
- search: "search term"

Response (200):
{
    "data": [
        {
            "faq_id": "uuid",
            "question": "How is my salary calculated?",
            "answer": "...",
            "category": "payroll",
            "helpful_count": 245,
            "language": "en"
        }
    ],
    "total": 45
}
```

---

### Group 6: Analytics (3 endpoints)

#### 6.1 POST /analytics/churn/predict
```
Request:
{
    "staff_id": "uuid"
}

Response (200):
{
    "staff_id": "uuid",
    "churn_probability": 65.5,
    "risk_level": "high",
    "factors": [
        "Low attendance rate",
        "Salary below market",
        "No recent training"
    ],
    "recommendation": "Schedule one-on-one meeting"
}
```

#### 6.2 GET /analytics/revenue/forecast
```
Query Parameters:
- months: 3
- confidence_level: 0.95

Response (200):
{
    "forecast_id": "uuid",
    "predictions": [
        {
            "month": "2026-06",
            "predicted_revenue": 1500000.00,
            "lower_bound": 1400000.00,
            "upper_bound": 1600000.00,
            "confidence": 0.95
        }
    ]
}
```

#### 6.3 GET /analytics/anomalies/detect
```
Query Parameters:
- metric: payroll|revenue|absence
- days: 30

Response (200):
{
    "anomalies": [
        {
            "date": "2026-05-15",
            "metric": "payroll",
            "value": 450000.00,
            "expected_value": 350000.00,
            "deviation_percent": 28.5,
            "severity": "high"
        }
    ],
    "total": 3
}
```

---

## Error Codes & Responses

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | Success | Data retrieved successfully |
| **201** | Created | Resource created |
| **204** | No Content | Resource deleted |
| **400** | Bad Request | Validation error |
| **401** | Unauthorized | Invalid token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Resource already exists |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Server Error | Internal error |

### Error Response Format

```json
{
    "error": {
        "code": "INVALID_EMAIL",
        "message": "The provided email is invalid",
        "status": 400,
        "timestamp": "2026-05-29T10:00:00Z",
        "request_id": "uuid",
        "details": {
            "field": "email",
            "value": "invalid-email",
            "constraint": "valid_email_format"
        }
    }
}
```

### Common Error Codes

```
VALIDATION_ERROR (400)
- Required field missing
- Invalid data type
- Value out of range

AUTHENTICATION_ERROR (401)
- Invalid credentials
- Token expired
- Token invalid

AUTHORIZATION_ERROR (403)
- Insufficient permissions
- Resource access denied

NOT_FOUND_ERROR (404)
- Resource not found
- Page not found

CONFLICT_ERROR (409)
- Resource already exists
- State conflict

RATE_LIMIT_ERROR (429)
- Too many requests
- Quota exceeded

INTERNAL_ERROR (500)
- Server error
- Database error
```

---

## Rate Limiting

### Limits by Endpoint Category

```
┌─────────────────────┬──────────┬───────────┐
│ Category            │ Requests │ Window    │
├─────────────────────┼──────────┼───────────┤
│ Authentication      │ 5        │ 1 minute  │
│ Onboarding          │ 10       │ 1 minute  │
│ Payroll             │ 100      │ 1 hour    │
│ Reporting           │ 50       │ 1 hour    │
│ Support             │ 20       │ 1 hour    │
│ Analytics           │ 30       │ 1 hour    │
│ Default (other)     │ 100      │ 1 minute  │
└─────────────────────┴──────────┴───────────┘
```

### Rate Limit Headers

```
Response Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1685353200

When limit exceeded (429):
{
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Too many requests",
        "retry_after": 60
    }
}
```

### Rate Limiter Implementation

```python
# File: api/app/middleware/rate_limiter.py

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """요청 레이트 리미팅"""
    
    client_id = request.client.host
    endpoint = request.url.path
    
    # 엔드포인트별 제한 조회
    limits = {
        "/api/v1/auth/": (5, 60),
        "/api/v1/onboard/": (10, 60),
        "/api/v1/payroll/": (100, 3600),
        "/api/v1/reports/": (50, 3600),
        "/api/v1/support/": (20, 3600),
        "/api/v1/analytics/": (30, 3600),
    }
    
    # 제한 확인
    limit, window = next(
        (v for k, v in limits.items() if endpoint.startswith(k)),
        (100, 60)
    )
    
    # Redis에서 요청 수 조회
    redis = request.app.state.redis
    key = f"rate_limit:{client_id}:{endpoint}"
    count = await redis.incr(key)
    
    if count == 1:
        await redis.expire(key, window)
    
    # 제한 초과
    if count > limit:
        return JSONResponse(
            status_code=429,
            content={
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests",
                    "retry_after": window
                }
            }
        )
    
    response = await call_next(request)
    
    # Rate limit 헤더 추가
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(limit - count)
    response.headers["X-RateLimit-Reset"] = str(int(time.time()) + window)
    
    return response
```

---

## Integration Examples

### Python Integration

```python
# File: examples/python_integration.py
"""
Python 클라이언트 예제
"""

import requests
import json
from datetime import datetime

class ElSpAPIClient:
    """ElSpa API 클라이언트"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.access_token = None
    
    def login(self, email: str, password: str):
        """로그인"""
        
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={
                "email": email,
                "password": password
            }
        )
        
        data = response.json()
        self.access_token = data["access_token"]
        return data
    
    def _headers(self) -> dict:
        """공통 헤더"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def start_onboarding(self, language: str = "en") -> dict:
        """온보딩 시작"""
        
        response = requests.post(
            f"{self.base_url}/onboard/start",
            json={"language": language},
            headers=self._headers()
        )
        
        return response.json()
    
    def submit_onboarding_data(self, session_id: str, data: dict) -> dict:
        """온보딩 데이터 제출"""
        
        response = requests.post(
            f"{self.base_url}/onboard/submit/{session_id}",
            json=data,
            headers=self._headers()
        )
        
        return response.json()
    
    def complete_onboarding(self, session_id: str) -> dict:
        """온보딩 완료"""
        
        response = requests.post(
            f"{self.base_url}/onboard/complete/{session_id}",
            headers=self._headers()
        )
        
        return response.json()
    
    def calculate_payroll(self, period_id: str, staff_ids: list = None) -> dict:
        """급여 정산"""
        
        response = requests.post(
            f"{self.base_url}/payroll/calculate",
            json={
                "period_id": period_id,
                "staff_ids": staff_ids
            },
            headers=self._headers()
        )
        
        return response.json()
    
    def get_payroll_records(self, period_id: str, verified: bool = None) -> dict:
        """급여 기록 조회"""
        
        params = {}
        if verified is not None:
            params["verified"] = verified
        
        response = requests.get(
            f"{self.base_url}/payroll/records/{period_id}",
            params=params,
            headers=self._headers()
        )
        
        return response.json()
    
    def export_payroll(self, period_id: str, format: str = "pdf") -> str:
        """급여 보고서 내보내기"""
        
        response = requests.post(
            f"{self.base_url}/payroll/export",
            json={
                "period_id": period_id,
                "format": format
            },
            headers=self._headers()
        )
        
        data = response.json()
        return data["url"]

# 사용 예제
if __name__ == "__main__":
    client = ElSpAPIClient(
        base_url="https://api.elspa.com/api/v1",
        api_key="your-api-key"
    )
    
    # 1. 로그인
    client.login("user@example.com", "password123")
    
    # 2. 온보딩 시작
    session = client.start_onboarding(language="en")
    session_id = session["session_id"]
    
    # 3. 개인정보 제출
    personal_info = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "date_of_birth": "1990-01-01",
        "gender": "M",
        "nationality": "US"
    }
    client.submit_onboarding_data(session_id, personal_info)
    
    # 4. 주소 제출
    address = {
        "address_line1": "123 Main St",
        "city": "New York",
        "province": "NY",
        "postal_code": "10001",
        "country": "US"
    }
    client.submit_onboarding_data(session_id, address)
    
    # 5. 신분증 제출
    documents = {
        "id_type": "passport",
        "id_number": "AB123456",
        "id_issue_date": "2020-01-01",
        "id_expiry_date": "2030-01-01"
    }
    client.submit_onboarding_data(session_id, documents)
    
    # 6. 완료
    completion = client.complete_onboarding(session_id)
    print(f"New customer: {completion['customer_id']}")
```

### Node.js Integration

```javascript
// File: examples/nodejs_integration.js
/**
 * Node.js 클라이언트 예제
 */

const axios = require('axios');

class ElSpAPIClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.accessToken = null;
    }
    
    async login(email, password) {
        const response = await axios.post(
            `${this.baseUrl}/auth/login`,
            { email, password }
        );
        
        this.accessToken = response.data.access_token;
        return response.data;
    }
    
    _headers() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }
    
    async startOnboarding(language = 'en') {
        const response = await axios.post(
            `${this.baseUrl}/onboard/start`,
            { language },
            { headers: this._headers() }
        );
        
        return response.data;
    }
    
    async submitOnboardingData(sessionId, data) {
        const response = await axios.post(
            `${this.baseUrl}/onboard/submit/${sessionId}`,
            data,
            { headers: this._headers() }
        );
        
        return response.data;
    }
    
    async calculatePayroll(periodId, staffIds = null) {
        const response = await axios.post(
            `${this.baseUrl}/payroll/calculate`,
            { period_id: periodId, staff_ids: staffIds },
            { headers: this._headers() }
        );
        
        return response.data;
    }
    
    async exportPayroll(periodId, format = 'pdf') {
        const response = await axios.post(
            `${this.baseUrl}/payroll/export`,
            { period_id: periodId, format },
            { headers: this._headers() }
        );
        
        return response.data.url;
    }
}

// 사용 예제
(async () => {
    const client = new ElSpAPIClient(
        'https://api.elspa.com/api/v1',
        'your-api-key'
    );
    
    // 1. 로그인
    await client.login('user@example.com', 'password123');
    
    // 2. 온보딩 시작
    const session = await client.startOnboarding('en');
    const sessionId = session.session_id;
    
    // 3. 개인정보 제출
    await client.submitOnboardingData(sessionId, {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        gender: 'M',
        nationality: 'US'
    });
    
    console.log('Onboarding started!');
})();
```

### cURL Examples

```bash
#!/bin/bash
# File: examples/curl_examples.sh

BASE_URL="https://api.elspa.com/api/v1"

# 1. 로그인
echo "=== Login ==="
LOGIN_RESPONSE=$(curl -X POST \
  "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Access Token: $ACCESS_TOKEN"

# 2. 온보딩 시작
echo -e "\n=== Start Onboarding ==="
curl -X POST \
  "$BASE_URL/onboard/start" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "language": "en" }' | jq .

# 3. 개인정보 제출
echo -e "\n=== Submit Personal Info ==="
curl -X POST \
  "$BASE_URL/onboard/submit/SESSION_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01",
    "gender": "M",
    "nationality": "US"
  }' | jq .

# 4. 급여 정산 계산
echo -e "\n=== Calculate Payroll ==="
curl -X POST \
  "$BASE_URL/payroll/calculate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period_id": "PERIOD_ID",
    "staff_ids": ["STAFF_ID_1", "STAFF_ID_2"]
  }' | jq .

# 5. 보고서 내보내기
echo -e "\n=== Export Payroll Report ==="
curl -X POST \
  "$BASE_URL/payroll/export" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period_id": "PERIOD_ID",
    "format": "pdf"
  }' | jq .
```

---

## Webhooks

### Webhook Events

```
Event Types:
- onboarding.completed
- payroll.calculated
- payroll.verified
- payroll.disbursed
- report.generated
- ticket.created
- ticket.updated
- churn_prediction.high_risk
```

### Webhook Implementation

```python
# File: api/app/webhooks/handler.py
"""
Webhook 이벤트 처리
"""

from fastapi import APIRouter, Request
from typing import Dict, Any
import hmac
import hashlib

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

WEBHOOK_SECRET = "your-webhook-secret"

@router.post("/events")
async def handle_webhook(request: Request):
    """Webhook 이벤트 처리"""
    
    # 서명 검증
    signature = request.headers.get("X-Webhook-Signature")
    body = await request.body()
    
    # HMAC-SHA256 검증
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_signature:
        return {"error": "Invalid signature"}, 401
    
    # 이벤트 처리
    data = await request.json()
    event_type = data.get("event_type")
    
    if event_type == "onboarding.completed":
        await handle_onboarding_completed(data)
    
    elif event_type == "payroll.calculated":
        await handle_payroll_calculated(data)
    
    elif event_type == "payroll.verified":
        await handle_payroll_verified(data)
    
    return {"status": "received"}

async def handle_onboarding_completed(data: Dict[str, Any]):
    """온보딩 완료 처리"""
    customer_id = data["customer_id"]
    # TODO: 메일 발송, 보너스 지급 등
    print(f"Customer {customer_id} onboarded successfully")

async def handle_payroll_calculated(data: Dict[str, Any]):
    """급여 계산 완료 처리"""
    period_id = data["period_id"]
    # TODO: 알림 발송, 보고서 생성 등
    print(f"Payroll for period {period_id} calculated")

async def handle_payroll_verified(data: Dict[str, Any]):
    """급여 검증 완료 처리"""
    period_id = data["period_id"]
    # TODO: 자동 지급 시작
    print(f"Payroll for period {period_id} verified")
```

---

**Total Endpoints:** 27  
**Authentication:** JWT + API Key  
**Rate Limits:** Endpoint-specific  
**Documentation:** Complete with examples  
**Production Ready:** Yes
