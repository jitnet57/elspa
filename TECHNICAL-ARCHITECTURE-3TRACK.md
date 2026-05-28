# ElSpa 3-Track 기술 아키텍처 (Technical Architecture)

**Version**: 1.0  
**Updated**: 2026-05-29  
**Lead Architect**: jitnet57  
**Status**: Production Ready

---

## 📋 목차

1. [Track A: B2B 파트너 통합](#track-a-b2b-파트너-통합)
2. [Track B: 프리랜서/요양원 플랫폼](#track-b-프리랜서요양원-플랫폼)
3. [Track C: 고객 유지 및 분석](#track-c-고객-유지-및-분석)
4. [통합 인프라](#통합-인프라)
5. [보안 모델](#보안-모델)
6. [배포 및 모니터링](#배포-및-모니터링)

---

## Track A: B2B 파트너 통합

### 1.1 API Gateway 설계

**목표**: 다양한 파트너 시스템(어썸팀, 더존, Shopify 등)과의 안정적인 데이터 교환

#### Gateway 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    ElSpa API Gateway                         │
│  (FastAPI 기반, Rate Limiting, Request/Response Logging)    │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
        ┌──────────▼────┐   ┌────────▼──────────┐
        │  Partner API  │   │  Webhook Handler  │
        │  (REST/gRPC)  │   │  (Async Events)   │
        └───────────────┘   └───────────────────┘
                   │                  │
        ┌──────────▼────────────────▼──────────┐
        │     FastAPI Routers                  │
        │  ┌─────────────────────────────────┐ │
        │  │ /api/v1/employees               │ │
        │  │ /api/v1/payroll/records         │ │
        │  │ /api/v1/reports/financial      │ │
        │  │ /api/v1/partners/webhooks      │ │
        │  └─────────────────────────────────┘ │
        └──────────────────┬───────────────────┘
                           │
        ┌──────────────────▼───────────────────┐
        │     PostgreSQL (Supabase)            │
        │  ┌─────────────────────────────────┐ │
        │  │ Employees, Payroll, Audits      │ │
        │  │ Partner Integrations, Logs      │ │
        │  └─────────────────────────────────┘ │
        └──────────────────────────────────────┘
```

#### Rate Limiting 정책

```python
# FastAPI 미들웨어 (app/middleware/rate_limit.py)
RATE_LIMITS = {
    "awesome_team": {
        "requests_per_minute": 600,      # 10 req/sec
        "burst_size": 100,
        "daily_limit": 864000            # 10/sec * 86400
    },
    "dojun": {
        "requests_per_minute": 1200,     # 20 req/sec
        "burst_size": 200,
        "daily_limit": 1728000
    },
    "shopify": {
        "requests_per_minute": 300,      # 5 req/sec (FREE tier)
        "burst_size": 50,
        "daily_limit": 432000
    },
    "default": {
        "requests_per_minute": 100,
        "burst_size": 20,
        "daily_limit": 144000
    }
}

# Redis 기반 구현 (app/services/rate_limiter.py)
class RedisRateLimiter:
    async def check_limit(self, partner_id: str) -> bool:
        key = f"ratelimit:{partner_id}"
        current = await redis.incr(key)
        if current == 1:
            await redis.expire(key, 60)
        return current <= RATE_LIMITS[partner_id]["requests_per_minute"]
```

#### 인증 메커니즘

```python
# JWT + API Key 이중 인증 (app/auth/partner_auth.py)

class PartnerAuthScheme:
    """
    각 파트너별 고유한 인증 방식 지원
    """
    
    # 1. JWT 토큰 (단기, 15분)
    async def validate_jwt(self, token: str) -> dict:
        """
        POST /api/v1/auth/token
        {
            "client_id": "awesome_team_prod",
            "client_secret": "sec_xxxxx"
        }
        -> { "access_token": "eyJxx...", "expires_in": 900 }
        """
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {
            "partner_id": payload["sub"],
            "scope": payload["scope"],  # ["read:employees", "write:payroll"]
            "expires_at": payload["exp"]
        }
    
    # 2. API Key (영구, 회전 가능)
    async def validate_api_key(self, api_key: str) -> dict:
        """
        Header: X-API-Key: live_xxxxx
        GET /api/v1/employees?api_key=live_xxxxx
        """
        key_record = await db.partner_api_keys.find_one(
            {"key": api_key, "active": True}
        )
        return {
            "partner_id": key_record["partner_id"],
            "scope": key_record["scope"],
            "rotation_required": key_record["created_at"] < (now() - 90days)
        }
    
    # 3. OAuth 2.0 (Shopify, 서드파티)
    async def validate_oauth(self, code: str) -> dict:
        """
        Shopify OAuth 콜백
        GET /callback?code=xxx&state=yyy
        """
        token_response = await shopify_client.get_token(code)
        return {
            "partner_id": f"shopify_{token_response['store_id']}",
            "access_token": token_response["access_token"],
            "expires_at": token_response["expires_at"]
        }
```

### 1.2 FastAPI 엔드포인트 구조

#### 직원 관리 API

```python
# app/routers/partners/employees.py

from fastapi import APIRouter, Depends, HTTPException
from app.auth.partner_auth import PartnerAuthScheme
from app.schemas import EmployeeSchema, BulkEmployeeImport

router = APIRouter(prefix="/api/v1/partners/employees", tags=["Partner Integration"])
auth = PartnerAuthScheme()

@router.get("/", dependencies=[Depends(auth.verify_scope(["read:employees"]))])
async def list_employees(
    partner_id: str = Depends(auth.get_partner_id),
    limit: int = 100,
    offset: int = 0,
    filter_by: str = None  # "active", "inactive", "all"
):
    """
    파트너사가 임직원 목록을 조회
    
    Response:
    {
        "total": 150,
        "data": [
            {
                "employee_id": "emp_001",
                "name": "김철수",
                "email": "kim@company.com",
                "phone": "+63987654321",
                "position": "Therapist",
                "sss_number": "03-1234567-1",
                "tin": "903-456-789-100",
                "status": "active",
                "joined_date": "2024-01-15",
                "salary_base": 25000,
                "currency": "PHP"
            }
        ]
    }
    """
    employees = await Employee.find({
        "partner_id": partner_id,
        "status": filter_by or None
    }).skip(offset).limit(limit)
    
    return {
        "total": await Employee.count_documents({"partner_id": partner_id}),
        "data": employees
    }

@router.post("/bulk-import", dependencies=[Depends(auth.verify_scope(["write:employees"]))])
async def bulk_import_employees(
    partner_id: str = Depends(auth.get_partner_id),
    payload: BulkEmployeeImport
):
    """
    파트너사가 임직원을 일괄 등록
    
    Request:
    {
        "operation": "upsert",
        "employees": [
            {
                "external_id": "EMP-001",  # 파트너사 고유 ID
                "name": "김철수",
                "email": "kim@company.com",
                ...
            }
        ]
    }
    """
    result = await Employee.bulk_write([
        UpdateOne(
            {"partner_id": partner_id, "external_id": emp["external_id"]},
            {"$set": emp},
            upsert=True
        )
        for emp in payload.employees
    ])
    
    return {
        "inserted": result.upserted_id and 1 or 0,
        "modified": result.modified_count,
        "errors": []
    }

@router.get("/{employee_id}", dependencies=[Depends(auth.verify_scope(["read:employees"]))])
async def get_employee_detail(
    partner_id: str = Depends(auth.get_partner_id),
    employee_id: str
):
    """
    개별 임직원 상세 정보 조회
    """
    employee = await Employee.find_one({
        "partner_id": partner_id,
        "employee_id": employee_id
    })
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee
```

#### 급여 데이터 API

```python
# app/routers/partners/payroll.py

@router.post("/records/batch", dependencies=[Depends(auth.verify_scope(["write:payroll"]))])
async def create_payroll_batch(
    partner_id: str = Depends(auth.get_partner_id),
    payload: PayrollBatchCreate
):
    """
    파트너사가 급여 정산 기록 생성
    
    Request:
    {
        "payroll_period": "2026-05",
        "records": [
            {
                "employee_id": "emp_001",
                "salary_base": 25000,
                "overtime_hours": 10,
                "overtime_rate": 1.25,
                "ca_deduction": 5000,
                "sss_deduction": 1650,
                "philhealth_deduction": 500,
                "pagibig_deduction": 200,
                "withholding_tax": 2500,
                "notes": "Regular month"
            }
        ]
    }
    
    Response:
    {
        "batch_id": "batch_202605_awesome_001",
        "status": "created",
        "records_count": 25,
        "calculated_total": 612500,
        "created_at": "2026-05-29T10:30:00Z"
    }
    """
    batch = PayrollRecord(
        partner_id=partner_id,
        payroll_period=payload.payroll_period,
        status="draft"
    )
    await batch.save()
    
    for record in payload.records:
        salary_record = SalaryRecord(
            batch_id=batch.id,
            **record
        )
        await salary_record.save()
    
    return {"batch_id": batch.id, "status": "created", "records_count": len(payload.records)}

@router.get("/records/{batch_id}", dependencies=[Depends(auth.verify_scope(["read:payroll"]))])
async def get_payroll_record(
    partner_id: str = Depends(auth.get_partner_id),
    batch_id: str
):
    """
    급여 정산 배치 조회
    """
    record = await PayrollRecord.find_one({
        "partner_id": partner_id,
        "id": batch_id
    })
    return {
        "batch_id": record.id,
        "payroll_period": record.payroll_period,
        "status": record.status,
        "records": await SalaryRecord.find({"batch_id": batch_id}),
        "totals": calculate_batch_totals(record)
    }

@router.post("/records/{batch_id}/approve", dependencies=[Depends(auth.verify_scope(["write:payroll"]))])
async def approve_payroll_batch(
    partner_id: str = Depends(auth.get_partner_id),
    batch_id: str,
    approved_by: str
):
    """
    급여 정산 배치 승인
    """
    batch = await PayrollRecord.find_one_and_update(
        {"partner_id": partner_id, "id": batch_id},
        {"$set": {"status": "approved", "approved_at": datetime.now(), "approved_by": approved_by}}
    )
    
    # Webhook 발송: partner.payroll.approved
    await emit_webhook(partner_id, "payroll.approved", batch)
    
    return {"batch_id": batch_id, "status": "approved"}
```

#### 리포트 API

```python
# app/routers/partners/reports.py

@router.get("/financial/summary", dependencies=[Depends(auth.verify_scope(["read:reports"]))])
async def get_financial_summary(
    partner_id: str = Depends(auth.get_partner_id),
    start_date: str,  # "2026-01-01"
    end_date: str
):
    """
    파트너사 재무 요약 (월별)
    
    Response:
    {
        "summary": [
            {
                "month": "2026-05",
                "total_employees": 25,
                "total_payroll": 612500,
                "total_deductions": 78500,
                "net_payroll": 534000,
                "overtime_cost": 12500,
                "benefits_cost": 15000,
                "by_department": {
                    "therapy": 450000,
                    "front_desk": 80000,
                    "management": 84500
                }
            }
        ]
    }
    """
    records = await PayrollRecord.find({
        "partner_id": partner_id,
        "payroll_period": {
            "$gte": start_date,
            "$lte": end_date
        }
    })
    
    return {
        "summary": aggregate_by_period(records),
        "date_range": {"start": start_date, "end": end_date}
    }

@router.get("/audit-trail", dependencies=[Depends(auth.verify_scope(["read:reports"]))])
async def get_audit_trail(
    partner_id: str = Depends(auth.get_partner_id),
    entity_type: str = None,  # "employee", "payroll", "settings"
    action: str = None  # "create", "update", "delete"
):
    """
    감사 로그 (Compliance용)
    
    Response:
    {
        "logs": [
            {
                "timestamp": "2026-05-28T14:30:00Z",
                "user_id": "user_123",
                "action": "update",
                "entity_type": "payroll",
                "entity_id": "batch_202605_awesome_001",
                "changes": {
                    "status": ["draft", "approved"],
                    "approved_by": [null, "manager@awesome.com"]
                },
                "ip_address": "203.0.113.42"
            }
        ]
    }
    """
    filters = {
        "partner_id": partner_id,
        "entity_type": entity_type or None,
        "action": action or None
    }
    
    logs = await AuditLog.find({k: v for k, v in filters.items() if v}).sort("timestamp", -1)
    return {"logs": logs}
```

### 1.3 파트너 통합 방식

#### 방식 1: REST API (실시간 조회)

```
ElSpa System                        Partner System
    ↓                               ↓
  [API Gateway] ←─── HTTP/REST ───→ [Integration Service]
    ↓
  - GET /employees
  - POST /payroll/records
  - GET /reports/summary
  
장점: 실시간, 통합 간편
단점: 네트워크 의존, 지연 가능성
```

#### 방식 2: Webhook (이벤트 기반)

```python
# app/services/webhook_publisher.py

class WebhookPublisher:
    """
    이벤트 기반 파트너 시스템 연동
    """
    
    EVENT_TYPES = {
        "employee.created": "신규 임직원 등록",
        "employee.updated": "임직원 정보 변경",
        "payroll.approved": "급여 정산 승인",
        "payroll.sent": "급여 송금 완료",
        "report.generated": "리포트 생성"
    }
    
    async def publish(self, event_type: str, payload: dict):
        """
        파트너사에 Webhook 발송
        """
        subscriptions = await WebhookSubscription.find({
            "event_type": event_type,
            "active": True
        })
        
        for sub in subscriptions:
            webhook_job = WebhookJob(
                subscription_id=sub.id,
                event_type=event_type,
                payload=payload,
                retry_count=0,
                status="pending"
            )
            await webhook_job.save()
            
            # 비동기 처리
            asyncio.create_task(self._send_webhook(webhook_job, sub.url))
    
    async def _send_webhook(self, job: WebhookJob, url: str, max_retries: int = 5):
        """
        Webhook 전송 + 재시도 로직
        
        Retry 전략:
        - 1차: 즉시
        - 2차: 30초 후
        - 3차: 5분 후
        - 4차: 30분 후
        - 5차: 2시간 후
        """
        for attempt in range(max_retries):
            try:
                response = await httpx.post(
                    url,
                    json=job.payload,
                    headers={
                        "X-Webhook-Signature": self._sign_payload(job.payload),
                        "X-Webhook-Id": str(job.id),
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    job.status = "delivered"
                    await job.save()
                    return
                else:
                    job.status = "failed"
                    job.last_error = f"HTTP {response.status_code}"
                    
            except Exception as e:
                job.last_error = str(e)
            
            if attempt < max_retries - 1:
                wait_time = [0, 30, 300, 1800, 7200][attempt]
                await asyncio.sleep(wait_time)
    
    def _sign_payload(self, payload: dict) -> str:
        """
        HMAC-SHA256 서명 (파트너가 검증용)
        """
        import hmac
        import hashlib
        
        message = json.dumps(payload, separators=(',', ':'))
        signature = hmac.new(
            WEBHOOK_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
```

#### 방식 3: Batch Export (일일 종료)

```python
# app/services/batch_exporter.py

class BatchExporter:
    """
    일일 종료 시 파트너사에 데이터 전송
    실시간 동기화 부담 감소
    """
    
    async def export_daily_summary(self, partner_id: str):
        """
        매일 자정(UTC+8) 데이터 내보내기
        """
        today = datetime.now().date()
        
        # 1. 오늘 발생한 모든 이벤트 수집
        events = await Event.find({
            "partner_id": partner_id,
            "created_at": {
                "$gte": today.replace(hour=0, minute=0, second=0),
                "$lt": (today + timedelta(days=1)).replace(hour=0, minute=0, second=0)
            }
        })
        
        # 2. CSV/Excel 생성
        export_file = await self._generate_export_file(partner_id, events)
        
        # 3. SFTP/S3로 전송
        await self._upload_to_partner_storage(partner_id, export_file)
        
        # 4. 알림 발송
        await self._notify_partner_export_ready(partner_id)
```

### 1.4 파트너별 맞춤 설정

```python
# app/models/partner_integration.py

class PartnerIntegration(BaseModel):
    """
    파트너사별 통합 설정
    """
    partner_id: str  # "awesome_team", "dojun_group"
    partner_name: str
    contact_email: str
    
    # API 설정
    api_key: str
    api_endpoints: List[str]
    rate_limit_rps: int
    max_retries: int
    
    # Webhook 설정
    webhook_url: str
    webhook_events: List[str]
    webhook_secret: str
    
    # 데이터 매핑
    employee_id_mapping: Dict[str, str]  # {"external_id": "sss_number"}
    payroll_field_mapping: Dict[str, str]
    
    # 규정 준수 (Compliance)
    is_tax_compliant: bool
    is_sss_compliant: bool
    is_philhealth_compliant: bool
    
    # 옵션
    support_bulk_import: bool
    support_real_time_sync: bool
    support_batch_export: bool
    
    created_at: datetime
    updated_at: datetime
    active: bool
```

---

## Track B: 프리랜서/요양원 플랫폼

### 2.1 Frontend 아키텍처 (Next.js 16.2.4)

#### 디렉토리 구조

```
frontend/src/
├── app/
│   ├── page.tsx                    # 랜딩 / 대시보드 선택
│   ├── layout.tsx                  # Root Layout
│   ├── globals.css
│   │
│   ├── admin/                       # 관리자
│   │   ├── layout.tsx
│   │   ├── page.tsx                # 관리자 대시보드
│   │   ├── employees/
│   │   │   ├── page.tsx            # 임직원 목록
│   │   │   ├── [id]/page.tsx       # 상세
│   │   │   └── new/page.tsx        # 신규
│   │   ├── payroll/
│   │   │   ├── page.tsx            # 급여 정산
│   │   │   ├── records/
│   │   │   ├── analytics/
│   │   │   └── audit-logs/
│   │   └── therapist-schedule/    # 요양사 스케줄
│   │       ├── page.tsx
│   │       ├── layout.tsx
│   │       └── [date]/page.tsx
│   │
│   ├── therapist/                  # 요양사 (프리랜서)
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── earnings/
│   │   └── profile/
│   │
│   ├── driver/                      # 기사
│   │   ├── map/                    # 실시간 위치 지도
│   │   ├── schedule/
│   │   └── earnings/
│   │
│   ├── customer/                    # 고객
│   │   ├── booking/
│   │   ├── history/
│   │   └── reviews/
│   │
│   └── auth/
│       ├── login/
│       └── register/
│
├── components/
│   ├── common/                      # 재사용 가능 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   │
│   ├── admin/                       # 관리자 특화 컴포넌트
│   │   ├── EmployeeForm.tsx
│   │   ├── PayrollBatch.tsx
│   │   └── ScheduleGrid.tsx
│   │
│   ├── maps/
│   │   ├── RealtimeMap.tsx         # Leaflet 지도
│   │   └── LocationMarker.tsx
│   │
│   └── charts/
│       ├── LineChart.tsx            # Recharts
│       └── BarChart.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts               # Axios 인스턴스
│   │   ├── auth.ts
│   │   ├── employees.ts
│   │   ├── payroll.ts
│   │   └── webhooks.ts
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   ├── currency.ts
│   │   ├── validation.ts
│   │   └── auth.ts
│   │
│   └── hooks/
│       ├── useAuth.ts
│       ├── usePayroll.ts
│       ├── useLocation.ts
│       └── useWebSocket.ts
│
├── store/                           # Zustand 상태 관리
│   ├── authStore.ts
│   ├── employeeStore.ts
│   ├── payrollStore.ts
│   └── locationStore.ts
│
└── types/
    ├── api.ts
    ├── models.ts
    └── forms.ts
```

#### 상태 관리 (Zustand)

```typescript
// lib/store/authStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "therapist" | "driver" | "customer";
    partner_id?: string;
  } | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post("/auth/login", {
            email,
            password,
          });
          set({
            user: response.data.user,
            token: response.data.access_token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      refreshToken: async () => {
        try {
          const response = await apiClient.post("/auth/refresh");
          set({ token: response.data.access_token });
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: "auth-store",
      storage: typeof window !== "undefined" ? localStorage : undefined,
    }
  )
);

// lib/store/payrollStore.ts

export interface PayrollState {
  batch: PayrollBatch | null;
  records: SalaryRecord[];
  loading: boolean;

  // Actions
  fetchBatch: (batchId: string) => Promise<void>;
  updateRecord: (recordId: string, data: Partial<SalaryRecord>) => Promise<void>;
  approveBatch: () => Promise<void>;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  batch: null,
  records: [],
  loading: false,

  fetchBatch: async (batchId: string) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/payroll/records/${batchId}`);
      set({
        batch: response.data.batch,
        records: response.data.records,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
    }
  },

  updateRecord: async (recordId: string, data: Partial<SalaryRecord>) => {
    try {
      const response = await apiClient.patch(
        `/payroll/records/${recordId}`,
        data
      );
      const records = get().records.map((r) =>
        r.id === recordId ? response.data : r
      );
      set({ records });
    } catch (error) {
      console.error(error);
    }
  },

  approveBatch: async () => {
    const batch = get().batch;
    if (!batch) return;

    set({ loading: true });
    try {
      await apiClient.post(`/payroll/records/${batch.id}/approve`);
      set({ batch: { ...batch, status: "approved" }, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },
}));
```

#### API 클라이언트

```typescript
// lib/api/client.ts

import axios, { AxiosInstance, AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request 인터셉터 (JWT 추가)
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터 (에러 처리 + Token 갱신)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { refreshToken, logout } = useAuthStore.getState();

    if (error.response?.status === 401) {
      try {
        await refreshToken();
        // 원래 요청 재시도
        return apiClient(error.config!);
      } catch {
        logout();
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// lib/api/payroll.ts

export const payrollApi = {
  // 급여 배치 생성
  createBatch: (payload: PayrollBatchCreate) =>
    apiClient.post("/payroll/records/batch", payload),

  // 급여 배치 조회
  getBatch: (batchId: string) =>
    apiClient.get(`/payroll/records/${batchId}`),

  // 급여 기록 업데이트
  updateRecord: (recordId: string, data: Partial<SalaryRecord>) =>
    apiClient.patch(`/payroll/records/${recordId}`, data),

  // 급여 배치 승인
  approveBatch: (batchId: string, approvedBy: string) =>
    apiClient.post(`/payroll/records/${batchId}/approve`, { approved_by: approvedBy }),

  // 재무 요약 조회
  getFinancialSummary: (startDate: string, endDate: string) =>
    apiClient.get("/reports/financial/summary", {
      params: { start_date: startDate, end_date: endDate },
    }),

  // 감사 로그
  getAuditTrail: (entityType?: string, action?: string) =>
    apiClient.get("/reports/audit-trail", {
      params: { entity_type: entityType, action },
    }),
};
```

### 2.2 Backend 구조 (FastAPI)

#### 데이터 모델

```python
# app/models/employee.py

from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from enum import Enum

class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"

class Employee(Base):
    """
    임직원 정보 (정규직, 계약직, 프리랜서)
    """
    __tablename__ = "employees"

    id = Column(String, primary_key=True)
    partner_id = Column(String, nullable=False, index=True)
    external_id = Column(String)  # 파트너사의 고유 ID

    # 기본 정보
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    position = Column(String)  # Therapist, Driver, Front Desk
    status = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE)

    # 급여 정보
    salary_base = Column(Float)  # 월급
    hourly_rate = Column(Float)  # 시급
    commission_percentage = Column(Float, default=0)

    # 정부 ID
    sss_number = Column(String)  # SSS (Social Security System)
    philhealth_number = Column(String)  # PhilHealth (국민건강보험)
    pagibig_number = Column(String)  # PAGIBIG (퇴직 펀드)
    tin = Column(String)  # TIN (Tax Identification Number)
    
    # 시간 정보
    joined_date = Column(DateTime, default=datetime.utcnow)
    terminated_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    payroll_records = relationship("PayrollRecord", back_populates="employee")
    attendance_logs = relationship("AttendanceLog", back_populates="employee")

# app/models/payroll.py

class PayrollRecord(Base):
    """
    급여 정산 기록 (월별 또는 기간별)
    """
    __tablename__ = "payroll_records"

    id = Column(String, primary_key=True)
    batch_id = Column(String, index=True)
    employee_id = Column(String, ForeignKey("employees.id"))
    partner_id = Column(String, nullable=False, index=True)

    # 급여 기간
    payroll_period = Column(String)  # "2026-05"
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    # 수입 (Income)
    salary_base = Column(Float, default=0)
    overtime_pay = Column(Float, default=0)
    bonus = Column(Float, default=0)
    commission = Column(Float, default=0)
    cash_advance = Column(Float, default=0)

    # 공제 (Deductions)
    sss_deduction = Column(Float, default=0)
    philhealth_deduction = Column(Float, default=0)
    pagibig_deduction = Column(Float, default=0)
    withholding_tax = Column(Float, default=0)
    ca_deduction = Column(Float, default=0)  # Cash Advance
    other_deduction = Column(Float, default=0)

    # 합계
    gross_salary = Column(Float, computed_always=True)
    total_deductions = Column(Float, computed_always=True)
    net_salary = Column(Float, computed_always=True)

    # 상태
    status = Column(String, default="draft")  # draft, approved, processed, paid
    notes = Column(String)
    approved_by = Column(String)
    approved_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    employee = relationship("Employee", back_populates="payroll_records")

# app/models/audit_log.py

class AuditLog(Base):
    """
    감사 로그 (Compliance & 추적용)
    """
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    partner_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False)
    
    # 변경 내용
    entity_type = Column(String)  # "employee", "payroll", "settings"
    entity_id = Column(String, index=True)
    action = Column(String)  # "create", "update", "delete", "approve"
    
    # 변경 사항
    old_values = Column(JSON)
    new_values = Column(JSON)
    
    # 메타데이터
    ip_address = Column(String)
    user_agent = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
```

#### 핵심 계산 로직

```python
# app/services/payroll_calculator.py

from typing import Dict
from app.models import PayrollRecord, Employee

class PayrollCalculator:
    """
    필리핀 급여 계산 규정 준수
    - SSS, PhilHealth, PAGIBIG 자동 계산
    - 공휴일 수당 (125% 추가)
    - 초과 근무 (25% 추가)
    - 소득세 (PERA 공제 제외)
    - 13개월 보너스 (12월)
    """
    
    # 2026년 필리핀 세율
    SSS_RATES = {
        "employee": 0.04,  # 직원 부담 4%
        "employer": 0.01675,  # 고용주 부담 1.675%
    }
    
    PHILHEALTH_RATES = {
        "employee": 0.025,  # 직원 부담 2.5%
        "employer": 0.025,  # 고용주 부담 2.5%
    }
    
    PAGIBIG_RATES = {
        "employee": 0.01,  # 직원 부담 1%
        "employer": 0.02,  # 고용주 부담 2%
    }
    
    WITHHOLDING_TAX_BRACKETS = [
        (250000, 0),
        (400000, 0.05),
        (800000, 0.10),
        (2000000, 0.15),
        (float('inf'), 0.20),
    ]

    async def calculate_payroll_record(
        self,
        employee: Employee,
        period: str,  # "2026-05"
        base_salary: float,
        overtime_hours: float = 0,
        holiday_hours: float = 0,
        commission: float = 0,
        cash_advance: float = 0,
    ) -> Dict:
        """
        포괄적인 급여 계산
        """
        # 1. 수입 계산
        overtime_pay = self._calculate_overtime(
            employee.hourly_rate or (base_salary / 160),
            overtime_hours
        )
        
        holiday_pay = self._calculate_holiday_pay(
            employee.hourly_rate or (base_salary / 160),
            holiday_hours
        )
        
        gross_salary = base_salary + overtime_pay + holiday_pay + commission
        
        # 2. 공제 계산
        sss_deduction = self._calculate_sss(gross_salary)
        philhealth_deduction = self._calculate_philhealth(gross_salary)
        pagibig_deduction = self._calculate_pagibig(gross_salary)
        
        # 3. 소득세 (PERA 공제 후)
        taxable_income = gross_salary - (sss_deduction + philhealth_deduction + pagibig_deduction)
        withholding_tax = self._calculate_withholding_tax(taxable_income)
        
        # 4. 급여 선금 (Cash Advance) 공제
        ca_deduction = min(cash_advance, gross_salary * 0.5)  # 최대 월급의 50%
        
        # 5. 합계
        total_deductions = (
            sss_deduction +
            philhealth_deduction +
            pagibig_deduction +
            withholding_tax +
            ca_deduction
        )
        
        net_salary = gross_salary - total_deductions
        
        return {
            "gross_salary": gross_salary,
            "overtime_pay": overtime_pay,
            "holiday_pay": holiday_pay,
            "commission": commission,
            "sss_deduction": sss_deduction,
            "philhealth_deduction": philhealth_deduction,
            "pagibig_deduction": pagibig_deduction,
            "withholding_tax": withholding_tax,
            "ca_deduction": ca_deduction,
            "total_deductions": total_deductions,
            "net_salary": net_salary,
        }
    
    def _calculate_overtime(self, hourly_rate: float, overtime_hours: float) -> float:
        """
        초과 근무 (1.25배)
        """
        return hourly_rate * overtime_hours * 1.25
    
    def _calculate_holiday_pay(self, hourly_rate: float, holiday_hours: float) -> float:
        """
        공휴일 수당 (1.25배 또는 1.30배)
        """
        # 단순 공휴일: 1.25배
        # 특별 공휴일: 1.30배
        return hourly_rate * holiday_hours * 1.25
    
    def _calculate_sss(self, gross_salary: float) -> float:
        """
        SSS 계산 (Social Security System)
        """
        return gross_salary * self.SSS_RATES["employee"]
    
    def _calculate_philhealth(self, gross_salary: float) -> float:
        """
        PhilHealth 계산 (건강보험)
        """
        return gross_salary * self.PHILHEALTH_RATES["employee"]
    
    def _calculate_pagibig(self, gross_salary: float) -> float:
        """
        PAGIBIG 계산 (퇴직 펀드)
        """
        return min(
            gross_salary * self.PAGIBIG_RATES["employee"],
            15000  # 최대값
        )
    
    def _calculate_withholding_tax(self, taxable_income: float) -> float:
        """
        소득세 (Withholding Tax) - 누진세
        """
        for limit, rate in self.WITHHOLDING_TAX_BRACKETS:
            if taxable_income <= limit:
                return taxable_income * rate
        return 0  # 과도한 공제 방지
    
    async def calculate_thirteenth_month_bonus(
        self,
        employee_id: str,
        year: int
    ) -> float:
        """
        13개월 보너스 (필리핀 규정)
        - 계산: 월 급여 / 12 * 재직 개월 수
        """
        records = await PayrollRecord.find({
            "employee_id": employee_id,
            "payroll_period": {"$regex": f"^{year}-"}
        })
        
        total_salary = sum(r.gross_salary for r in records)
        months_worked = len(records)
        
        return (total_salary / 12) * (months_worked / 12)
```

---

## Track C: 고객 유지 및 분석

### 3.1 감시 시스템 (Monitoring & Analytics)

#### 데이터 수집 아키텍처

```python
# app/services/customer_monitoring.py

from datetime import datetime, timedelta
from typing import List, Dict
import asyncio

class CustomerMonitoringService:
    """
    고객 유지율 분석
    - NPS (Net Promoter Score) 추적
    - 로그인 활동 분석
    - 사용 패턴 분석
    - 이탈 위험 예측
    """
    
    async def track_login_event(self, customer_id: str, platform: str = "web"):
        """
        고객 로그인 기록
        """
        login_log = {
            "customer_id": customer_id,
            "platform": platform,
            "timestamp": datetime.utcnow(),
            "ip_address": get_client_ip(),
            "user_agent": get_user_agent(),
        }
        
        await db.login_logs.insert_one(login_log)
        
        # 고객 마지막 활동 업데이트
        await db.customers.update_one(
            {"customer_id": customer_id},
            {"$set": {"last_login_at": login_log["timestamp"]}}
        )
    
    async def track_booking_event(self, booking_id: str, event_type: str):
        """
        예약 이벤트 추적 (생성, 취소, 완료)
        """
        booking_event = {
            "booking_id": booking_id,
            "event_type": event_type,  # "created", "cancelled", "completed"
            "timestamp": datetime.utcnow(),
        }
        
        await db.booking_events.insert_one(booking_event)
    
    async def track_review_event(self, review_id: str, rating: int):
        """
        리뷰/평가 추적
        """
        await db.reviews.insert_one({
            "review_id": review_id,
            "rating": rating,  # 1-5
            "timestamp": datetime.utcnow(),
        })
    
    async def calculate_nps(self, timeframe_days: int = 30) -> Dict:
        """
        NPS (Net Promoter Score) 계산
        - Promoters (9-10점): 적극 추천
        - Passives (7-8점): 중립
        - Detractors (0-6점): 불만
        
        NPS = (Promoters - Detractors) / Total * 100
        """
        since = datetime.utcnow() - timedelta(days=timeframe_days)
        
        reviews = await db.reviews.find({
            "timestamp": {"$gte": since}
        }).to_list()
        
        promoters = sum(1 for r in reviews if r["rating"] >= 9)
        detractors = sum(1 for r in reviews if r["rating"] <= 6)
        total = len(reviews)
        
        if total == 0:
            return {"nps": 0, "promoters": 0, "detractors": 0, "total": 0}
        
        nps = ((promoters - detractors) / total) * 100
        
        return {
            "nps": round(nps, 2),
            "promoters": promoters,
            "passives": total - promoters - detractors,
            "detractors": detractors,
            "total": total,
            "timeframe_days": timeframe_days,
        }
    
    async def analyze_usage_patterns(self, customer_id: str) -> Dict:
        """
        사용 패턴 분석
        - 평균 예약 간격
        - 서비스별 선호도
        - 방문 빈도
        """
        bookings = await db.bookings.find({
            "customer_id": customer_id
        }).sort("created_at", -1).to_list()
        
        if not bookings:
            return {"status": "no_bookings"}
        
        # 1. 방문 빈도
        booking_dates = [b["created_at"].date() for b in bookings]
        intervals = []
        for i in range(len(booking_dates) - 1):
            interval = (booking_dates[i] - booking_dates[i + 1]).days
            intervals.append(interval)
        
        avg_interval = sum(intervals) / len(intervals) if intervals else 0
        
        # 2. 서비스별 선호도
        service_counts = {}
        for booking in bookings:
            service = booking.get("service_type", "unknown")
            service_counts[service] = service_counts.get(service, 0) + 1
        
        preferred_service = max(service_counts, key=service_counts.get) if service_counts else None
        
        # 3. 최근 활동 (7일, 30일, 90일)
        now = datetime.utcnow()
        recent_7d = sum(1 for b in bookings if (now - b["created_at"]).days <= 7)
        recent_30d = sum(1 for b in bookings if (now - b["created_at"]).days <= 30)
        recent_90d = sum(1 for b in bookings if (now - b["created_at"]).days <= 90)
        
        return {
            "total_bookings": len(bookings),
            "avg_booking_interval_days": round(avg_interval, 1),
            "preferred_service": preferred_service,
            "service_distribution": service_counts,
            "recent_activity": {
                "last_7_days": recent_7d,
                "last_30_days": recent_30d,
                "last_90_days": recent_90d,
            },
            "churn_risk": self._assess_churn_risk(bookings),
        }
    
    def _assess_churn_risk(self, bookings: List[Dict]) -> str:
        """
        이탈 위험도 평가
        """
        if not bookings:
            return "unknown"
        
        last_booking = bookings[0]["created_at"]
        days_since_last = (datetime.utcnow() - last_booking).days
        
        if days_since_last > 180:
            return "high"  # 6개월 이상 방문 없음
        elif days_since_last > 90:
            return "medium"  # 3개월 이상 방문 없음
        else:
            return "low"  # 활성 고객
```

### 3.2 분석 대시보드

```typescript
// frontend/src/app/admin/analytics/page.tsx

"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie } from "recharts";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api/client";

export default function AnalyticsDashboard() {
  const [npsData, setNpsData] = useState(null);
  const [usagePatterns, setUsagePatterns] = useState(null);
  const [churnRisk, setChurnRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // 1. NPS 데이터
        const npsResponse = await apiClient.get("/analytics/nps?days=30");
        setNpsData(npsResponse.data);

        // 2. 사용 패턴
        const usageResponse = await apiClient.get("/analytics/usage-patterns");
        setUsagePatterns(usageResponse.data);

        // 3. 이탈 위험 고객 목록
        const churnResponse = await apiClient.get(
          "/analytics/churn-risk?risk_level=high"
        );
        setChurnRisk(churnResponse.data.customers);

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Customer Analytics Dashboard</h1>

      {/* NPS 섹션 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">NPS Score</h3>
          <p className="text-4xl font-bold text-blue-600">{npsData?.nps || 0}</p>
          <p className="text-gray-400 text-xs mt-2">
            +5 from last month
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Promoters</h3>
          <p className="text-3xl font-bold text-green-600">
            {npsData?.promoters || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Detractors</h3>
          <p className="text-3xl font-bold text-red-600">
            {npsData?.detractors || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Response Rate</h3>
          <p className="text-3xl font-bold text-purple-600">42%</p>
        </div>
      </div>

      {/* 사용 패턴 차트 */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Booking Frequency (Last 90 Days)</h2>
          <LineChart width={400} height={300} data={usagePatterns?.trend || []}>
            <Line type="monotone" dataKey="bookings" stroke="#3b82f6" />
          </LineChart>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Service Preferences</h2>
          <PieChart width={400} height={300}>
            <Pie data={usagePatterns?.service_distribution || []} />
          </PieChart>
        </div>
      </div>

      {/* 이탈 위험 고객 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">High-Risk Churn Customers</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Last Booking</th>
              <th className="px-4 py-2">Days Since</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {churnRisk.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{customer.name}</td>
                <td className="px-4 py-2">{customer.last_booking}</td>
                <td className="px-4 py-2 text-red-600 font-bold">
                  {customer.days_since_booking}
                </td>
                <td className="px-4 py-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                    Send Offer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 통합 인프라

### 4.1 데이터베이스 설계

#### PostgreSQL 스키마

```sql
-- 멀티 테넌시 모델
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('partner', 'platform') NOT NULL,
    plan ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 파트너별 고객 분리
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_customers (tenant_id, id)
);

-- 감사 로그 (모든 변경 기록)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID,
    entity_type VARCHAR(50),
    entity_id UUID,
    action VARCHAR(20),  -- create, update, delete
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_tenant_time (tenant_id, timestamp)
);

-- 실시간 이벤트 스트림 (Event Sourcing)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_aggregate (aggregate_id),
    INDEX idx_timestamp (timestamp)
);
```

### 4.2 캐싱 전략 (Redis)

```python
# app/cache/redis_client.py

from redis import Redis
from typing import Any, Optional
import json

class CacheManager:
    """
    Redis 기반 멀티레벨 캐싱
    """
    
    # 캐시 TTL (초)
    TTL = {
        "employee": 3600,           # 1시간
        "payroll_batch": 1800,      # 30분
        "analytics": 300,           # 5분
        "user_session": 86400,      # 24시간
    }
    
    async def get(self, key: str) -> Optional[Any]:
        """캐시에서 조회"""
        value = await redis.get(key)
        return json.loads(value) if value else None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """캐시에 저장"""
        await redis.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )
    
    async def invalidate_pattern(self, pattern: str):
        """패턴에 맞는 모든 캐시 삭제"""
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)

# 캐싱 데코레이터
def cached(ttl: int = 3600):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 캐시 키 생성
            key = f"{func.__module__}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 캐시 조회
            cached_value = await cache_manager.get(key)
            if cached_value is not None:
                return cached_value
            
            # 캐시 미스: 함수 실행
            result = await func(*args, **kwargs)
            
            # 결과 저장
            await cache_manager.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator

# 사용 예
@cached(ttl=3600)
async def get_employee(employee_id: str):
    return await db.employees.find_one({"id": employee_id})
```

---

## 보안 모델

### 5.1 인증 및 인가

```python
# app/auth/security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

class SecurityManager:
    """
    JWT + RBAC (역할 기반 접근 제어)
    """
    
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 15
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    def create_access_token(
        self,
        user_id: str,
        role: str,
        partner_id: Optional[str] = None
    ) -> str:
        """
        JWT 토큰 생성
        """
        expires = datetime.utcnow() + timedelta(
            minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
        payload = {
            "sub": user_id,
            "role": role,
            "partner_id": partner_id,
            "exp": expires,
            "iat": datetime.utcnow(),
        }
        
        return jwt.encode(
            payload,
            SECRET_KEY,
            algorithm=self.ALGORITHM
        )
    
    async def verify_token(self, token: str) -> dict:
        """
        JWT 토큰 검증
        """
        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[self.ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

# Role-Based Access Control
ROLE_PERMISSIONS = {
    "admin": ["read:all", "write:all", "delete:all"],
    "manager": ["read:own", "write:own"],
    "therapist": ["read:own"],
    "customer": ["read:own"],
}

async def check_permission(
    current_user: dict = Depends(security_manager.verify_token),
    required_permission: str = None
):
    """
    권한 검증 의존성
    """
    user_role = current_user.get("role")
    user_permissions = ROLE_PERMISSIONS.get(user_role, [])
    
    if required_permission and required_permission not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    return current_user
```

---

## 배포 및 모니터링

### 6.1 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Backend Docker Image
        run: |
          docker build -t elspa-backend:latest ./app
          docker push ${{ secrets.DOCKER_REGISTRY }}/elspa-backend:latest
      
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
          npx next export
      
      - name: Deploy Frontend to Cloudflare Pages
        run: |
          npx wrangler pages deploy frontend/out
      
      - name: Deploy Backend to Railway
        run: |
          docker push ${{ secrets.RAILWAY_TOKEN }}/elspa-backend
```

### 6.2 모니터링 스택

```python
# app/monitoring/setup.py

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

# Sentry 초기화
sentry_sdk.init(
    dsn=SENTRY_DSN,
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.1,  # 10% 샘플링
    profiles_sample_rate=0.1,
)

# Prometheus 메트릭
from prometheus_client import Counter, Histogram

request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# ELK Stack (Elasticsearch, Logstash, Kibana)
# 모든 로그는 Elasticsearch로 스트림
# Kibana에서 실시간 모니터링
```

---

## 요약

| Track | 주요 컴포넌트 | 기술 스택 |
|-------|-------------|---------|
| **A (B2B 파트너)** | API Gateway, REST/Webhook, Rate Limiting | FastAPI, Redis, PostgreSQL |
| **B (프리랜서)** | Frontend (Next.js), Backend (FastAPI), Real-time | Next.js 16, React 19, Zustand |
| **C (고객 유지)** | Analytics, NPS, Churn Prediction | Python, MongoDB, Recharts |
| **인프라** | PostgreSQL (멀티 테넌시), Redis (캐싱) | Supabase, Railway, Cloudflare |
| **보안** | JWT + RBAC, 감사 로그, TLS | OpenSSL, Sentry |
| **배포** | GitHub Actions, Docker, Railway | Docker, Railway, Cloudflare Pages |

---

**기술 리드**: jitnet57  
**최종 업데이트**: 2026-05-29  
**상태**: Production Ready
