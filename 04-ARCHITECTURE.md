# ElSpa Manager - System Architecture
## BMAD Phase 3: Solutioning

**문서 작성일:** 2026-05-30  
**담당자:** Architect (Winston)  
**상태:** ✅ 완료

---

## 1. Architecture Overview

### 1.1 High-Level 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│ Cloudflare Pages (Frontend)                             │
│ ├─ Next.js 16.2.4 (React 19)                            │
│ ├─ Pages: Admin, Therapist, Customer, Monitor          │
│ ├─ State: Zustand                                       │
│ └─ Styling: Tailwind CSS 4                              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + JWT
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Vercel Serverless Functions (Backend)                   │
│ ├─ FastAPI (Python)                                     │
│ ├─ API Routes: /api/bookings, /api/payroll, etc        │
│ ├─ WebSocket: /ws/monitor                              │
│ ├─ Google Sheets Integration                            │
│ └─ Database: Supabase (PostgreSQL)                      │
└──────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌──────────────┐
    │Supabase│   │Google    │   │External APIs │
    │(DB)    │   │Sheets API│   │(Auth, etc)   │
    └────────┘   └──────────┘   └──────────────┘
```

---

## 2. Frontend Architecture

### 2.1 프로젝트 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              (루트 레이아웃)
│   │   ├── page.tsx                (랜딩)
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            (대시보드)
│   │   │   ├── payroll/
│   │   │   │   ├── page.tsx        (정산 목록)
│   │   │   │   └── [id]/page.tsx   (정산 상세)
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx        (예약 목록)
│   │   │   │   └── [id]/page.tsx   (예약 상세)
│   │   │   ├── therapists/
│   │   │   │   ├── page.tsx        (테라피스트 목록)
│   │   │   │   └── [id]/page.tsx   (상세)
│   │   │   └── monitor/
│   │   │       ├── page.tsx        (침대 상태)
│   │   │       └── timeline.tsx    (타임라인)
│   │   ├── therapist/
│   │   │   ├── page.tsx            (대시보드)
│   │   │   ├── bookings/page.tsx   (나의 예약)
│   │   │   └── sheets/page.tsx     (Google Sheets)
│   │   ├── customer/
│   │   │   ├── page.tsx            (대시보드)
│   │   │   ├── booking/new.tsx     (새 예약)
│   │   │   └── bookings/page.tsx   (내 예약)
│   │   └── monitor/page.tsx        (실시간 모니터링)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── PayrollList.tsx
│   │   │   ├── BookingList.tsx
│   │   │   ├── BedStatus.tsx
│   │   │   └── DashboardKPI.tsx
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Badge.tsx
│   │   └── monitor/
│   │       ├── RealtimeMonitor.tsx
│   │       ├── BedGrid.tsx
│   │       └── ActivityTimeline.tsx
│   ├── hooks/
│   │   ├── useAuth.ts              (인증)
│   │   ├── useRealtimeSync.ts      (WebSocket)
│   │   ├── usePayrollStore.ts      (급여 상태)
│   │   ├── useBookingStore.ts      (예약 상태)
│   │   └── useMonitorStore.ts      (모니터링 상태)
│   ├── lib/
│   │   ├── api.ts                  (API 클라이언트)
│   │   ├── auth.ts                 (JWT 관리)
│   │   ├── google-sheets.ts        (Google Sheets 연동)
│   │   └── utils.ts                (유틸리티)
│   └── stores/
│       ├── authStore.ts            (Zustand)
│       ├── payrollStore.ts
│       ├── bookingStore.ts
│       └── monitorStore.ts
├── public/
│   └── (아이콘, 이미지)
└── package.json
```

### 2.2 상태 관리 (Zustand)

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  role: 'admin' | 'therapist' | 'customer' | 'monitor';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// stores/payrollStore.ts
interface PayrollState {
  payrolls: Payroll[];
  loading: boolean;
  fetchPayrolls: (month: string) => Promise<void>;
  updatePayroll: (id: string, data: Partial<Payroll>) => Promise<void>;
}

// stores/monitorStore.ts
interface MonitorState {
  beds: Bed[];
  bookings: Booking[];
  therapists: Therapist[];
  updateBedStatus: (bedId: number, status: BedStatus) => void;
  addBooking: (booking: Booking) => void;
  removeBooking: (bookingId: number) => void;
}
```

### 2.3 API 통신

```typescript
// lib/api.ts
class ElSpaAPI {
  private baseURL = process.env.NEXT_PUBLIC_API_URL;
  
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return response.json();
  }
  
  async post<T>(path: string, data: unknown): Promise<T> {
    // ...
  }
  
  async patch<T>(path: string, data: unknown): Promise<T> {
    // ...
  }
}
```

### 2.4 WebSocket (실시간 모니터링)

```typescript
// hooks/useRealtimeSync.ts
export function useRealtimeSync(options) {
  const wsRef = useRef<WebSocket>(null);
  const monitorStore = useMonitorStore();
  
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch(message.type) {
        case 'bed_status_changed':
          monitorStore.updateBedStatus(message.data.bedId, message.data.status);
          break;
        case 'booking_added':
          monitorStore.addBooking(message.data);
          break;
        // ...
      }
    };
    
    return () => ws.close();
  }, []);
}
```

---

## 3. Backend Architecture

### 3.1 FastAPI 프로젝트 구조

```
app/
├── main.py                    (진입점)
├── config.py                  (설정)
├── database.py                (DB 연결)
├── models/
│   ├── user.py               (SQLAlchemy ORM)
│   ├── therapist.py
│   ├── booking.py
│   ├── payroll.py
│   └── google_sheet_sync.py
├── schemas/
│   ├── booking.py            (Pydantic)
│   ├── payroll.py
│   ├── user.py
│   └── responses.py
├── routers/
│   ├── bookings_api.py       (예약 API)
│   ├── payroll.py            (급여 API)
│   ├── google_sheets_router.py (Google Sheets)
│   ├── auth.py               (인증)
│   └── websocket_realtime.py (WebSocket)
├── services/
│   ├── payroll_service.py    (급여 계산 로직)
│   ├── booking_service.py    (예약 로직)
│   ├── google_sheets_service.py (동기화)
│   └── scheduler.py          (백그라운드 작업)
├── middleware/
│   ├── auth.py               (JWT 검증)
│   ├── cors.py               (CORS)
│   └── error_handler.py      (에러 처리)
└── utils/
    ├── logger.py             (로깅)
    └── validators.py         (검증)

api/
└── index.py                  (Vercel Serverless 진입점)
```

### 3.2 주요 API 엔드포인트

**Bookings**
```
POST   /api/bookings           → BookingService.create()
GET    /api/bookings           → BookingService.list()
GET    /api/bookings/{id}      → BookingService.get()
PATCH  /api/bookings/{id}      → BookingService.update()
DELETE /api/bookings/{id}      → BookingService.cancel()
```

**Payroll**
```
POST   /api/payroll/generate   → PayrollService.generate_monthly()
GET    /api/payroll            → PayrollService.list()
GET    /api/payroll/{id}       → PayrollService.get()
PATCH  /api/payroll/{id}       → PayrollService.update()
GET    /api/payroll/{id}/export → PayrollService.export_csv()
```

**Google Sheets**
```
POST   /api/google-sheets/sync → GoogleSheetsService.sync()
GET    /api/google-sheets/status → GoogleSheetsService.get_status()
GET    /api/google-sheets/logs → GoogleSheetsService.get_logs()
```

**WebSocket**
```
WS     /ws/monitor             → WebSocketManager.handle_monitor()
```

### 3.3 데이터베이스 스키마 (Supabase)

```sql
-- Users 테이블
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100),
  role VARCHAR(50) CHECK (role IN ('admin', 'therapist', 'customer', 'monitor')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Therapists 테이블
CREATE TABLE therapists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate INTEGER,
  bank_account VARCHAR(100),
  specialization VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings 테이블
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id),
  therapist_id INTEGER REFERENCES therapists(id),
  service_id INTEGER,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payroll 테이블
CREATE TABLE payroll (
  id SERIAL PRIMARY KEY,
  therapist_id INTEGER REFERENCES therapists(id),
  period VARCHAR(7), -- YYYY-MM
  total_hours INTEGER,
  hourly_rate INTEGER,
  gross_salary INTEGER,
  deductions INTEGER,
  net_salary INTEGER,
  status VARCHAR(50) CHECK (status IN ('draft', 'approved', 'rejected', 'finalized')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GoogleSheetSync 테이블
CREATE TABLE google_sheet_sync (
  id SERIAL PRIMARY KEY,
  therapist_id INTEGER REFERENCES therapists(id),
  booking_id INTEGER REFERENCES bookings(id),
  status VARCHAR(50) CHECK (status IN ('synced', 'pending', 'failed')),
  error_message TEXT,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_therapist ON bookings(therapist_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_payroll_period ON payroll(period);
CREATE INDEX idx_sync_therapist ON google_sheet_sync(therapist_id);
```

### 3.4 Google Sheets 동기화 흐름

```python
# services/google_sheets_service.py

class GoogleSheetsService:
    def __init__(self):
        self.service = build('sheets', 'v4', credentials=get_credentials())
        self.spreadsheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.sheet_name = "테라피스트 예약정보"
    
    async def sync_booking(self, booking: Booking):
        """예약 정보를 Google Sheet에 동기화"""
        
        try:
            # 1. 데이터 준비
            row_data = [
                booking.therapist.user.name,
                booking.customer.name,
                booking.service.name,
                booking.start_time.strftime('%H:%M'),
                booking.start_time.strftime('%Y-%m-%d'),
                booking.status
            ]
            
            # 2. Google Sheets API 호출
            self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.sheet_name}!A:F",
                valueInputOption="USER_ENTERED",
                body={"values": [row_data]}
            ).execute()
            
            # 3. 동기화 로그 저장
            await self.log_sync(booking.id, "synced", None)
            
        except Exception as e:
            await self.log_sync(booking.id, "failed", str(e))
            # 재시도 로직
            await self.retry_sync(booking.id, max_retries=3)
```

### 3.5 급여 계산 로직

```python
# services/payroll_service.py

class PayrollService:
    
    @staticmethod
    def calculate_salary(
        therapist: Therapist,
        period: str  # "YYYY-MM"
    ) -> dict:
        """월별 급여 계산"""
        
        # 1. 근무시간 조회
        bookings = Booking.query.filter(
            Booking.therapist_id == therapist.id,
            Booking.start_time >= period_start,
            Booking.start_time <= period_end,
            Booking.status == 'completed'
        ).all()
        
        total_hours = sum(booking.duration for booking in bookings)
        
        # 2. 급여 계산
        hourly_rate = therapist.hourly_rate
        regular_hours = min(total_hours, 160)  # 월 160시간 기준
        overtime_hours = max(total_hours - 160, 0)
        
        basic_salary = regular_hours * hourly_rate
        overtime_pay = overtime_hours * hourly_rate * 1.5  # 초과근무 1.5배
        
        # 3. 수당
        holidays = calculate_holidays_in_period(period)
        holiday_pay = hourly_rate * 8 * holidays
        
        gross_salary = basic_salary + overtime_pay + holiday_pay
        
        # 4. 공제
        insurance = 150000  # 4대보험 (예시)
        income_tax = gross_salary * 0.1  # 소득세 (예시)
        
        deductions = insurance + income_tax
        net_salary = gross_salary - deductions
        
        return {
            'therapist_id': therapist.id,
            'period': period,
            'total_hours': total_hours,
            'hourly_rate': hourly_rate,
            'basic_salary': basic_salary,
            'overtime_pay': overtime_pay,
            'holiday_pay': holiday_pay,
            'gross_salary': gross_salary,
            'deductions': deductions,
            'net_salary': net_salary
        }
```

---

## 4. 배포 아키텍처

### 4.1 Cloudflare Pages (Frontend)

```yaml
# vercel.json (제거됨 - Cloudflare 직접 배포)
# wrangler.toml 기반 배포

builds:
  - command: npm install && npm run build
    publish_dir: frontend/.next

routes:
  - path: /api/*
    status: 308
    headers: X-Forwarded-To: api.elspa.com
```

### 4.2 Vercel Serverless (Backend)

```yaml
# vercel.json
{
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/ws/(.*)",
      "dest": "/api/index.py"
    }
  ]
}
```

### 4.3 환경 변수 관리

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api.elspa.com
NEXT_PUBLIC_WS_URL=wss://api.elspa.com/ws
NEXT_PUBLIC_GOOGLE_SHEET_ID=xxx
NEXT_PUBLIC_GOOGLE_API_KEY=xxx
```

**Backend (Vercel Secrets)**
```
DATABASE_URL=postgresql://user:pass@supabase.co/db
JWT_SECRET_KEY=xxx
GOOGLE_SHEETS_CREDENTIALS=xxx
SENTRY_DSN=xxx
```

---

## 5. 보안 아키텍처

### 5.1 인증 흐름

```
Client
  │
  ├─ POST /api/auth/login
  │     ├─ email, password
  │     └─ 서버: JWT 토큰 발급
  │
  ├─ JWT 토큰 저장 (localStorage / secure cookie)
  │
  └─ 이후 요청
      └─ Header: Authorization: Bearer <JWT>
         └─ 서버: JWT 검증 (signature + expiry)
```

### 5.2 RBAC (Role-Based Access Control)

```python
# middleware/auth.py

@app.middleware("http")
async def verify_user_role(request: Request, call_next):
    """사용자 역할 검증"""
    
    token = request.headers.get("Authorization")
    user = decode_token(token)
    
    # 엔드포인트별 권한 확인
    required_roles = get_required_roles(request.url.path)
    
    if user.role not in required_roles:
        return JSONResponse(
            status_code=403,
            content={"detail": "Forbidden"}
        )
    
    return await call_next(request)
```

### 5.3 데이터 암호화

- 비밀번호: bcrypt 해싱
- 전송: HTTPS + TLS 1.3
- 저장: Supabase 암호화 (자동)

---

## 6. 성능 최적화

### 6.1 Frontend
- **코드 분할**: Next.js dynamic import
- **이미지 최적화**: Next.js Image 컴포넌트
- **캐싱**: Service Worker + IndexedDB
- **번들 크기**: < 200KB (gzip)

### 6.2 Backend
- **데이터베이스 쿼리**: Index + Prepared Statements
- **캐싱**: Redis (Supabase 지원)
- **배치 처리**: Google Sheets 동기화 (배치 작업)
- **비동기 작업**: Background tasks (APScheduler)

---

## 7. 모니터링 & 로깅

```python
# middleware/logging.py

import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=1.0
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """모든 요청 로깅"""
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} "
        f"- {response.status_code} - {process_time:.3f}s"
    )
    
    return response
```

---

## 8. 승인 게이트

**이 Architecture를 승인하시겠습니까?**
- [ ] 승인 (Phase 3 + 4 진행)
- [ ] 수정 요청 (명시)

---

## 문서 정보

**버전:** v1.0  
**작성자:** Architect (Winston)  
**검토자:** (대기 중)  
**승인자:** (대기 중)  
**마지막 수정:** 2026-05-30 00:00 KST
