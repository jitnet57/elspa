# 📡 WebSocket 실시간 동기화 구현 가이드

> ElSpa Monitor 페이지의 침대/예약/테라피스트 실시간 업데이트 시스템

**작성일:** 2026-05-28  
**상태:** ✅ 구현 완료  
**테스트:** 로컬 개발 서버에서 검증 필요

---

## 📋 목차

1. [아키텍처](#아키텍처)
2. [백엔드 구현](#백엔드-구현)
3. [프론트엔드 구현](#프론트엔드-구현)
4. [메시지 형식](#메시지-형식)
5. [사용 예시](#사용-예시)
6. [테스트 방법](#테스트-방법)
7. [트러블슈팅](#트러블슈팅)

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Monitor Page                                     │   │
│  │ ├─ useRealtimeSync Hook (WebSocket 관리)        │   │
│  │ ├─ BedLayoutView (침대 상태)                     │   │
│  │ ├─ TherapistScheduleView (테라피스트 일정)      │   │
│  │ └─ Connection Status Indicator (연결 상태)      │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕ WebSocket                     │
│        ws://localhost:8000/ws/monitor                    │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Backend (FastAPI)                                │   │
│  │ ┌──────────────────────────────────────────────┐ │   │
│  │ │ websocket_realtime.py                        │ │   │
│  │ │ ├─ /ws/monitor (WebSocket 엔드포인트)       │ │   │
│  │ │ ├─ /api/realtime/broadcast/bed-status       │ │   │
│  │ │ ├─ /api/realtime/broadcast/booking-*        │ │   │
│  │ │ ├─ /api/realtime/broadcast/therapist-*      │ │   │
│  │ │ └─ /api/realtime/ws/status                  │ │   │
│  │ └──────────────────────────────────────────────┘ │   │
│  │                                                    │   │
│  │ ┌──────────────────────────────────────────────┐ │   │
│  │ │ websocket_manager.py                         │ │   │
│  │ │ ├─ ConnectionManager (연결 관리)             │ │   │
│  │ │ ├─ RealtimeMessageBuilder (메시지 구성)     │ │   │
│  │ │ └─ broadcast() (모든 클라이언트에 전송)     │ │   │
│  │ └──────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕ (내부 API)                    │
│                    Database Events                      │
│           (침대/예약/테라피스트 변경 감지)              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 백엔드 구현

### 1. WebSocket 엔드포인트 (`websocket_realtime.py`)

**파일 경로:** `e:\elspa\app\routers\websocket_realtime.py`

#### WebSocket 연결

```python
@router.websocket("/ws/monitor")
async def websocket_monitor_endpoint(
    websocket: WebSocket,
    user_id: str = Query(None),
    room_zone: str = Query(None),
):
    """
    Monitor 대시보드 실시간 동기화
    
    사용 예시:
      ws://localhost:8000/ws/monitor?user_id=admin1&room_zone=all
    """
```

**동작:**
1. 클라이언트가 WebSocket에 연결
2. 서버가 `connected` 메시지 전송
3. 30초마다 하트비트 전송
4. 침대/예약/테라피스트 변경 시 실시간 메시지 브로드캐스트

---

#### 브로드캐스트 API

침대 상태 변경 시 호출:

```bash
POST /api/realtime/broadcast/bed-status
Content-Type: application/json

{
  "bed_id": 1,
  "status": "occupied",
  "customer_id": 123,
  "customer_name": "김철수",
  "therapist_id": 456,
  "therapist_name": "이영희",
  "service_name": "스웨디시 60분",
  "starts_at": "2026-05-28T10:00:00",
  "ends_at": "2026-05-28T11:00:00"
}
```

예약 추가 시:

```bash
POST /api/realtime/broadcast/booking-added
{
  "booking_id": 101,
  "bed_id": 1,
  "customer_id": 123,
  "customer_name": "김철수",
  "therapist_id": 456,
  "therapist_name": "이영희",
  "service_name": "스웨디시 60분",
  "service_minutes": 60,
  "service_price": 50000,
  "starts_at": "2026-05-28T10:00:00",
  "ends_at": "2026-05-28T11:00:00"
}
```

---

### 2. 메시지 빌더 (`websocket_manager.py`)

**파일 경로:** `e:\elspa\app\services\websocket_manager.py`

새로 추가된 클래스: `RealtimeMessageBuilder`

```python
class RealtimeMessageBuilder:
    """Monitor 실시간 메시지 빌더"""
    
    @staticmethod
    def bed_status_changed(...):
        """침대 상태 변경"""
    
    @staticmethod
    def booking_added(...):
        """새 예약 추가"""
    
    @staticmethod
    def booking_completed(...):
        """예약 완료"""
    
    @staticmethod
    def booking_cancelled(...):
        """예약 취소"""
    
    @staticmethod
    def therapist_checkin(...):
        """테라피스트 체크인"""
    
    @staticmethod
    def therapist_checkout(...):
        """테라피스트 체크아웃"""
```

---

### 3. main.py 등록

**파일 경로:** `e:\elspa\main.py` (라인 270-275)

```python
# 📡 Monitor 실시간 동기화 WebSocket 라우터 (신규 - 2026-05-28)
from app.routers import websocket_realtime
app.include_router(websocket_realtime.router)
```

---

## 💻 프론트엔드 구현

### 1. useRealtimeSync Hook

**파일 경로:** `e:\elspa\frontend\src\hooks\useRealtimeSync.ts`

#### 기본 사용법

```typescript
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function MyComponent() {
  const { isConnected, isConnecting, lastUpdate, send, disconnect } = useRealtimeSync({
    onBedStatusChanged: (data) => {
      console.log('침대 상태 변경:', data);
      // UI 업데이트
    },
    onBookingAdded: (data) => {
      console.log('새 예약:', data);
      // UI 업데이트
    },
  });

  return (
    <div>
      <p>연결 상태: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
    </div>
  );
}
```

#### Hook 반환 값

| 항목 | 타입 | 설명 |
|------|------|------|
| `isConnected` | `boolean` | WebSocket 연결 여부 |
| `isConnecting` | `boolean` | 연결 중 여부 |
| `lastUpdate` | `string \| null` | 마지막 업데이트 시간 (ISO 8601) |
| `send` | `(msg) => void` | 메시지 전송 함수 |
| `disconnect` | `() => void` | 연결 해제 함수 |

#### Hook 옵션

```typescript
interface UseRealtimeSyncOptions {
  enabled?: boolean;                              // 기본값: true
  onBedStatusChanged?: (data: BedStatusChangedData) => void;
  onBookingAdded?: (data: BookingAddedData) => void;
  onBookingCompleted?: (data: BookingCompletedData) => void;
  onBookingCancelled?: (data: BookingCancelledData) => void;
  onTherapistCheckin?: (data: TherapistCheckinData) => void;
  onTherapistCheckout?: (data: TherapistCheckoutData) => void;
}
```

---

### 2. Monitor 페이지 통합

**파일 경로:** `e:\elspa\frontend\src\app\monitor\page.tsx`

#### 구현된 기능

1. **WebSocket 연결 상태 표시**
   - 🟢 Green: Connected
   - 🟡 Yellow: Connecting
   - 🔴 Red: Disconnected

2. **실시간 데이터 수신**
   - 침대 상태 변경
   - 예약 추가/완료/취소
   - 테라피스트 체크인/체크아웃

3. **자식 컴포넌트로 데이터 전달**
   ```typescript
   <BedLayoutView realtimeData={realtimeData} />
   <TherapistScheduleView realtimeData={realtimeData} />
   ```

4. **Debug 정보 (개발 모드)**
   - 우측 하단에 최신 메시지 표시
   - `NODE_ENV === 'development'`일 때만 표시

---

## 📨 메시지 형식

### 클라이언트 → 서버

```typescript
// Ping 메시지
{
  "type": "ping"
}

// 동기화 요청
{
  "type": "sync"
}
```

### 서버 → 클라이언트

#### 1. 연결 성공

```json
{
  "type": "connected",
  "data": {
    "message": "Monitor dashboard connected",
    "userId": "admin1",
    "roomZone": "all",
    "activeConnections": 5
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 2. 침대 상태 변경

```json
{
  "type": "bed_status_changed",
  "data": {
    "bedId": 1,
    "status": "occupied",
    "customerId": 123,
    "customerName": "김철수",
    "therapistId": 456,
    "therapistName": "이영희",
    "serviceName": "스웨디시 60분",
    "startsAt": "2026-05-28T10:00:00",
    "endsAt": "2026-05-28T11:00:00"
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 3. 새 예약 추가

```json
{
  "type": "booking_added",
  "data": {
    "bookingId": 101,
    "bedId": 1,
    "customerId": 123,
    "customerName": "김철수",
    "therapistId": 456,
    "therapistName": "이영희",
    "serviceName": "스웨디시 60분",
    "serviceMinutes": 60,
    "servicePrice": 50000,
    "startsAt": "2026-05-28T10:00:00",
    "endsAt": "2026-05-28T11:00:00"
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 4. 예약 완료

```json
{
  "type": "booking_completed",
  "data": {
    "bookingId": 101,
    "bedId": 1
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 5. 예약 취소

```json
{
  "type": "booking_cancelled",
  "data": {
    "bookingId": 101,
    "bedId": 1,
    "reason": "고객 요청"
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 6. 테라피스트 체크인

```json
{
  "type": "therapist_checkin",
  "data": {
    "therapistId": 456,
    "therapistName": "이영희",
    "checkInTime": "2026-05-28T09:00:00"
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 7. 테라피스트 체크아웃

```json
{
  "type": "therapist_checkout",
  "data": {
    "therapistId": 456,
    "therapistName": "이영희",
    "checkOutTime": "2026-05-28T18:00:00"
  },
  "timestamp": "2026-05-28T10:30:00"
}
```

#### 8. 하트비트

```json
{
  "type": "heartbeat",
  "message": "Monitor server is alive",
  "timestamp": "2026-05-28T10:30:00"
}
```

---

## 🔌 사용 예시

### 예시 1: 침대 상태 변경 시 브로드캐스트

**상황:** 침대 #1의 상태를 'available'에서 'occupied'로 변경

```python
# 백엔드 (beds.py 또는 해당 라우터에서)
from httpx import AsyncClient

async def change_bed_status(bed_id: int, status: str):
    # 1. 데이터베이스 업데이트
    # db.query(Bed).filter(Bed.id == bed_id).update({"status": status})
    
    # 2. WebSocket 브로드캐스트
    async with AsyncClient() as client:
        await client.post(
            "http://localhost:8000/api/realtime/broadcast/bed-status",
            json={
                "bed_id": bed_id,
                "status": status,
                "customer_id": 123,
                "customer_name": "김철수",
                "therapist_id": 456,
                "therapist_name": "이영희",
                "service_name": "스웨디시 60분",
                "starts_at": "2026-05-28T10:00:00",
                "ends_at": "2026-05-28T11:00:00"
            }
        )
```

### 예시 2: Monitor 페이지에서 침대 상태 변경 감지

**상황:** 모니터 페이지가 침대 상태 변경을 감지하고 UI 업데이트

```typescript
// 프론트엔드 (Monitor 페이지)
export default function MonitorPage() {
  const { isConnected } = useRealtimeSync({
    onBedStatusChanged: (data) => {
      // 침대 상태 변경 감지
      console.log(`침대 #${data.bedId} 상태: ${data.status}`);
      
      // 상태에 따라 UI 업데이트
      if (data.status === 'occupied') {
        // 침대를 파란색으로 표시
        updateBedColor(data.bedId, 'blue');
      } else if (data.status === 'cleaning') {
        // 침대를 노란색으로 표시
        updateBedColor(data.bedId, 'yellow');
      } else if (data.status === 'available') {
        // 침대를 초록색으로 표시
        updateBedColor(data.bedId, 'green');
      }
    },
  });

  return (
    <div>
      <p>연결 상태: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      {/* 침대 레이아웃 */}
    </div>
  );
}
```

---

## 🧪 테스트 방법

### 1. 로컬 개발 서버 시작

```bash
cd e:\elspa\frontend
npm run dev
# http://localhost:3000 에서 확인

# 다른 터미널에서
cd e:\elspa
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# FastAPI 서버 시작
```

### 2. WebSocket 연결 확인

1. Monitor 페이지 열기: http://localhost:3000/monitor
2. 브라우저 개발자 도구 (F12) → Console 탭
3. 로그 확인:
   ```
   ✅ Monitor WebSocket 연결됨
   🎯 Monitor 대시보드 연결 확인: {...}
   ```

### 3. 침대 상태 변경 테스트 (cURL)

```bash
curl -X POST http://localhost:8000/api/realtime/broadcast/bed-status \
  -H "Content-Type: application/json" \
  -d '{
    "bed_id": 1,
    "status": "occupied",
    "customer_id": 123,
    "customer_name": "김철수",
    "therapist_id": 456,
    "therapist_name": "이영희",
    "service_name": "스웨디시 60분",
    "starts_at": "2026-05-28T10:00:00",
    "ends_at": "2026-05-28T11:00:00"
  }'
```

### 4. WebSocket 상태 확인 API

```bash
curl http://localhost:8000/api/realtime/ws/status

# 응답:
# {
#   "active_connections": 1,
#   "active_users": 1,
#   "status": "🟢 Ready"
# }
```

### 5. 다중 클라이언트 테스트

1. Monitor 페이지를 2개 탭에서 엽니다
2. 한 탭에서 침대 상태 변경 API 호출
3. 두 탭 모두에서 실시간으로 업데이트 확인

---

## 🔧 트러블슈팅

### 문제 1: WebSocket 연결이 실패합니다

**증상:** Console에 "❌ WebSocket 연결 실패" 메시지

**원인:**
- FastAPI 서버가 실행되지 않음
- 포트 8000이 이미 사용 중
- CORS 설정 문제

**해결:**
```bash
# FastAPI 서버 확인
lsof -i :8000  # Unix/Mac
netstat -ano | findstr :8000  # Windows

# 포트 변경 (필요시)
python -m uvicorn main:app --port 8001
```

### 문제 2: "WebSocket이 연결되지 않았습니다" 경고

**증상:** Console에 경고 메시지 반복

**원인:**
- 30초마다 하트비트 전송 시 연결이 아직 열리지 않음 (일시적)
- 네트워크 지연

**해결:**
- 무시 가능 (자동 재연결됨)
- 네트워크 상태 확인

### 문제 3: 메시지가 수신되지 않습니다

**증상:** Console에 메시지 수신 로그 없음

**원인:**
- WebSocket이 연결되지 않음
- 브로드캐스트 API가 호출되지 않음
- 메시지 형식 오류

**해결:**
```bash
# 1. WebSocket 상태 확인
curl http://localhost:8000/api/realtime/ws/status

# 2. 정확한 메시지 형식으로 브로드캐스트
curl -X POST http://localhost:8000/api/realtime/broadcast/bed-status \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### 문제 4: 자동 재연결이 작동하지 않습니다

**원인:**
- Hook의 `enabled` 옵션이 `false`로 설정됨
- useEffect 의존성 배열 오류

**해결:**
```typescript
const { isConnected } = useRealtimeSync({
  enabled: true,  // 명시적으로 true 설정
  // ...
});
```

---

## 📊 성능 고려사항

### 1. 메모리 사용

- 활성 연결당 약 1-2 MB 메모리
- 1000명 동시 접속 시 약 1-2 GB 메모리 필요

### 2. 대역폭

- 하트비트: 30초마다 ~50 bytes
- 메시지: 타입별로 200-500 bytes

### 3. 최적화

**연결 풀 재사용:**
```python
# 기존: 각 요청마다 새로운 AsyncClient 생성
async with AsyncClient() as client:
    await client.post(...)

# 개선: 전역 클라이언트 인스턴스 사용
client = AsyncClient()
await client.post(...)
```

---

## 📚 참고 자료

- [FastAPI WebSocket 공식 문서](https://fastapi.tiangolo.com/advanced/websockets/)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Hooks 공식 문서](https://react.dev/reference/react/hooks)

---

## ✅ 구현 체크리스트

- [x] 백엔드 WebSocket 엔드포인트 구현
- [x] RealtimeMessageBuilder 구현
- [x] main.py에 라우터 등록
- [x] 프론트엔드 useRealtimeSync Hook 구현
- [x] Monitor 페이지에 Hook 통합
- [x] 연결 상태 표시 UI 추가
- [x] 실시간 데이터 전달 기능
- [x] 메시지 형식 정의
- [x] API 문서 작성
- [ ] 통합 테스트 (로컬 개발 서버에서 실행)
- [ ] E2E 테스트 (Playwright/Cypress)
- [ ] 성능 테스트 (1000+ 동시 연결)
- [ ] 배포 (Vercel/Cloudflare Pages)

---

**최종 업데이트:** 2026-05-28  
**담당자:** jitnet57 (Kang Jichul)
