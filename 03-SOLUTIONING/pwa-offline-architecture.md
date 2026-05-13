# ElSpa PWA + 오프라인 아키텍처
**Phase 3.5: Progressive Web App & Offline-First Design | Date: 2026-05-05**

---

## 1. PWA 아키텍처 (웹앱 통합)

### 1.1 기존 vs 새로운 배포 모델

```
기존 (모바일 앱 + 웹):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Admin Web    │  │ User Web     │  │ Staff App    │
│ (Next.js)    │  │ (Next.js)    │  │(React Native)│
└──────────────┘  └──────────────┘  └──────────────┘
문제: 3개 배포, 매장에서 QR코드 구성 어려움


새로운 (PWA 3개 + QR):
┌─────────────────────────────────────────────────┐
│           QR Code 스캔 또는 URL 접근             │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│ │ Admin PWA    │  │ User PWA     │  │Staff   │  │
│ │ (Next.js)    │  │ (Next.js)    │  │ PWA    │  │
│ │ + Service    │  │ + Service    │  │(React) │  │
│ │   Worker     │  │   Worker     │  │        │  │
│ └──────────────┘  └──────────────┘  └────────┘  │
│                                                 │
│ 모든 기기에서 즉시 사용 (설치 불필요)           │
└─────────────────────────────────────────────────┘

장점:
✅ 설치 없음 (QR 코드로 즉시 접근)
✅ 오프라인 작동
✅ 네이티브 앱처럼 느낌 (Home Screen Add)
✅ 자동 업데이트 (Service Worker)
```

### 1.2 각 PWA 사이트 정의

```
1. Admin PWA (admin.elspa.com)
   - 오너/매니저용
   - QR: https://admin.elspa.com/setup/qr (고유 코드 출력)
   - 오프라인: 읽기/기본 기능만 (Dashboard, History)
   - 동기: 온라인 복귀 시 자동 병합

2. User PWA (app.elspa.com)
   - 고객용
   - QR: https://app.elspa.com/download (각 매장별 고유)
   - 오프라인: 완전 기능 (예약, 결제 대기, 로컬 저장)
   - 동기: 온라인 복귀 시 예약 전송

3. Staff PWA (staff.elspa.com)
   - 테라피스트 + 드라이버용
   - QR: https://staff.elspa.com/join (매장 접근)
   - 오프라인: 스케줄 보기, 타이머, 위치 로그
   - 동기: 온라인 복귀 시 클라우드 동기화
```

---

## 2. 오프라인-퍼스트 데이터 전략

### 2.1 로컬 스토리지 구조

```
IndexedDB (구조화된 데이터):
├─ users (사용자 정보, 권한)
├─ schedules (스케줄, 룸, 테라피스트)
├─ bookings (예약 목록, 상태)
├─ chats (메시지, 채팅 이력)
├─ transactions (거래 기록)
├─ sync_queue (오프라인 중 생성된 변경사항)
└─ cache (API 응답 캐시)

localStorage (설정/세션):
├─ auth_token (JWT, 만료 시간)
├─ user_id
├─ selected_room_id (현재 선택 룸)
├─ language (한국어/English)
└─ offline_mode (수동 오프라인 활성화)
```

### 2.2 동기화 전략 (Sync Queue)

```
오프라인 중 사용자 행동:
1. 예약 생성 → sync_queue에 저장 (sync_id: uuid, status: pending)
2. 메시지 전송 → sync_queue에 추가 (offline_message_id)
3. 로컬에서 즉시 UI 업데이트 (optimistic)

온라인 복귀:
1. Service Worker 감지 (online event)
2. sync_queue 순회
   ├─ 각 항목별 API 호출
   ├─ 성공 → sync_queue에서 제거
   ├─ 실패 (충돌) → conflict_log에 저장
   └─ 최대 재시도: 3회
3. 충돌 해결 (Conflict Resolution)
   ├─ 예약 충돌: 서버 예약이 우선 (로컬 취소)
   ├─ 채팅 충돌: 양쪽 모두 저장 (타임스탬프로 정렬)
   └─ 스케줄 충돌: 최신 시간 우선
4. 동기화 완료 → UI 갱신 (toast 알림)

UX 예시:
┌─────────────────────────────────────────┐
│ 🔄 동기화 중... (3/5 항목 완료)          │
│                                         │
│ ✅ 예약 #123 (09:00)                    │
│ ⏳ 메시지 "언제 도착하나요?" (재시도 1)  │
│ ⚠️  충돌: 예약 #124 (중복 방지)         │
├─────────────────────────────────────────┤
│ [상세 보기] [완료]                       │
└─────────────────────────────────────────┘
```

### 2.3 충돌 해결 규칙

| 리소스 | 충돌 시나리오 | 해결 방식 |
|-------|-----------|---------|
| **예약** | 오프라인 중 + 온라인 중 예약 (같은 시간) | 서버 예약 우선, 로컬 취소 알림 |
| **스케줄** | 테라피스트 가용성 업데이트 | 서버 시간대가 우선 (최신) |
| **채팅** | 오프라인 메시지 + 서버 응답 | 둘 다 저장 (오프라인 먼저, 타임스탬프) |
| **결제** | 결제 대기 중 동기화 | 서버 결제 기록이 우선 |
| **거래** | 금융 기록 | 서버 기록만 인정 (로컬 재시도) |

---

## 3. Service Worker 구현

### 3.1 캐싱 전략

```typescript
// service-worker.ts

// 1. 설치 시 필수 리소스 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1-static').then((cache) => {
      return cache.addAll([
        '/index.html',
        '/manifest.json',
        '/offline.html',
        '/css/tailwind.css',
        '/js/app.js'
      ]);
    })
  );
});

// 2. 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // API 요청 (Network First)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 캐시에 저장
          caches.open('v1-api').then((cache) => {
            cache.put(request, response.clone());
          });
          return response;
        })
        .catch(() => {
          // 네트워크 실패 → 캐시 반환
          return caches.match(request) 
            || new Response(JSON.stringify({ offline: true }), {
              status: 503,
              statusText: 'Offline'
            });
        })
    );
  }
  
  // 정적 리소스 (Cache First)
  else {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
  }
});

// 3. 백그라운드 동기화
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue());
  }
});
```

### 3.2 버전 관리 & 업데이트

```
Service Worker 버전 관리:
- v1-static: HTML, CSS, JS (30일 캐시)
- v1-api: API 응답 (1일 캐시, 자동 갱신)
- v1-image: 이미지 (90일 캐시)

업데이트 흐름:
1. 신 버전 배포 (v2)
2. 사용자 다시 방문 → 새 SW 다운로드
3. 구 SW 여전히 활동 (skipWaiting 안 함)
4. 사용자에게 "업데이트 있음" 알림
5. [지금 업데이트] 클릭 → self.clients.claim()
6. 페이지 새로고침 → 새 캐시 사용

UX:
┌──────────────────────────────────┐
│ ✨ 새 버전 업데이트 사용 가능     │
│                                  │
│ [나중에] [지금 업데이트]         │
└──────────────────────────────────┘
```

---

## 4. 권한 & 보안

### 4.1 오프라인 접근 제어

```
각 PWA별 오프라인 기능:

Admin PWA:
  ✅ 읽기: Dashboard, 통계, 기록 조회 (로컬 캐시)
  ❌ 쓰기: 새 예약, 결제, 설정 변경 (온라인 필수)
  ✅ 긴급: 직원 연락처, SOS 로그

User PWA:
  ✅ 완전: 예약 조회, 새 예약 (로컬 저장), 메시지 읽기
  ✅ 쓰기: 예약 변경, 메시지 전송 (큐에 저장)
  ✅ 결제 대기: 결제 정보 저장 (온라인 시 전송)

Staff PWA:
  ✅ 읽기: 스케줄, 예약, 고객 정보
  ✅ 쓰기: 타이머, 서비스 완료 로그 (로컬)
  ✅ 위치: GPS 기록 (오프라인 중 로그)
  ❌ 실시간: 픽드랍 실시간 추적 (온라인 필수)
```

### 4.2 데이터 암호화

```
민감 데이터 (오프라인 저장):
- JWT 토큰: localStorage (httpOnly 불가, JS 필요)
  → 암호화: crypto-js (클라이언트 마스터 키)
  
- 고객 정보 (이름, 전화):
  → 암호화: IndexedDB에 암호화 저장
  → 복호화: 온라인 시만
  
- 결제 정보: IndexedDB에 절대 저장 금지
  → 메모리 전용 (세션)

마스터 키 관리:
- 디바이스별 고유 키 생성 (IndexedDB에 저장)
- 기기 초기화 시 삭제
- 클라우드 복구 불가 (의도적)
```

---

## 5. 오프라인 모드 UX

### 5.1 상태 표시

```
헤더 상단:
┌────────────────────────────────────────────────┐
│ 📡 온라인 (마지막 동기: 2분 전)                 │
│ 🔴 오프라인 (로컬 모드 | 3개 항목 대기중)       │
│ 🔄 동기화 중... (2/5 완료)                      │
└────────────────────────────────────────────────┘

Tailwind 클래스:
- 온라인: bg-green-50 border-l-4 border-green-400
- 오프라인: bg-yellow-50 border-l-4 border-yellow-400
- 동기화: bg-blue-50 border-l-4 border-blue-400 (pulse 애니메이션)
```

### 5.2 오프라인 기능 표시

```
읽기 전용 필드:
┌─────────────────────────────────┐
│ 예약 상세                       │
├─────────────────────────────────┤
│ 고객: 홍길동                    │
│ 시간: 2026-05-05 14:00 (로컬)  │ 🔒 수정 불가
│ 서비스: 스웨디시 60분           │
│ 가격: ₩80,000                   │
│ 상태: 예약 대기중               │
└─────────────────────────────────┘
```

### 5.3 동기화 상태 모달

```
동기화 큐 상세 화면:

┌─────────────────────────────────────────────────┐
│ 📋 로컬 변경사항 (온라인 복귀 시 자동 동기화)   │
├─────────────────────────────────────────────────┤
│                                                 │
│ ✅ 예약 #789 (09:00 ~ 10:00) [완료]            │
│    아로마 테라피, 고객: 김영희, ₩100,000        │
│                                                 │
│ ⏳ 메시지 전송 #2 (재시도 중...)                │
│    "예약 확정되었습니다"                        │
│    마지막 시도: 30초 전                        │
│                                                 │
│ ⚠️  충돌: 예약 #790 (중복 감지)                │
│    로컬: 14:00~15:00 (오프라인 중 예약)         │
│    서버: 14:30~15:30 (온라인 사용자 예약)      │
│    → 서버 예약 유지, 로컬 취소됨                │
│                                                 │
│ ❌ 실패: 거래 기록 #5                          │
│    "네트워크 오류" (자동 재시도: 3회 완료)      │
│    [수동 재시도] [삭제] [상세]                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ 전체 진행: ████████░░ 80%                       │
│ 예상 시간: 45초                                 │
│ [백그라운드에서 동기화] [닫기]                  │
└─────────────────────────────────────────────────┘
```

---

## 6. Manifest & 설치

### 6.1 manifest.json (웹앱 메타데이터)

```json
{
  "name": "ElSpa Admin",
  "short_name": "ElSpa",
  "description": "마사지 스파 업무 자동화 시스템",
  "start_url": "/dashboard",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "categories": ["business", "productivity"],
  
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshot-540x720.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-1280x720.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  
  "shortcuts": [
    {
      "name": "새 예약",
      "short_name": "예약",
      "url": "/bookings/new",
      "icons": [{"src": "/shortcut-new-booking.png", "sizes": "192x192"}]
    },
    {
      "name": "스케줄",
      "short_name": "일정",
      "url": "/schedule",
      "icons": [{"src": "/shortcut-schedule.png", "sizes": "192x192"}]
    }
  ]
}
```

### 6.2 설치 UX

```
Browser Chrome/Safari:
1. 사용자 방문 → admin.elspa.com
2. 하단/상단에 "설치" 배너 표시
3. [설치] 클릭 → Home Screen에 추가
4. 아이콘 클릭 → 풀스크린 PWA 시작

QR 스캔 (매장):
1. 오너가 매니저용 QR 코드 출력
   → https://admin.elspa.com/?qr=mgr-branch-001
2. 새 직원이 QR 스캔 → 자동 로그인 (일회용)
3. 권한 자동 설정 (Manager 역할)
4. [설치] 클릭 → Home Screen

UX 흐름:
┌─────────────────────────────┐
│ 🔗 QR 코드 스캔             │
├─────────────────────────────┤
│ 자동 로그인 중...            │
│ └─ 권한: Manager            │
│ └─ 지점: 강남점             │
│ └─ 만료: 30일               │
├─────────────────────────────┤
│ [설치] [닫기]               │
└─────────────────────────────┘
```

---

## 7. 기술 스택

```
Frontend:
- Next.js 14 (React 18, App Router)
- TypeScript
- Tailwind CSS (반응형)
- Zustand (상태관리)
- TanStack Query (데이터 동기화)

오프라인:
- Service Worker (자체 구현)
- IndexedDB (데이터 저장)
- crypto-js (암호화)
- idb (IndexedDB 래퍼)

라이브러리:
- qrcode.react (QR 코드 생성)
- axios (HTTP, 인터셉터)
- date-fns (시간대 처리)
- uuid (동기화 ID)

배포:
- Vercel (Next.js 최적화)
- CDN (정적 리소스)
- HTTP/2 Push (manifest.json, SW)
```

---

## 8. 마이그레이션 경로

### Phase A → B (PWA 도입)

```
Week 1-4 (Phase A MVP):
├─ 모놀리식 웹앱 (온라인 필수)
├─ 3개 사이트 분리
└─ 기본 Service Worker (캐싱만)

Week 5-6 (Phase B.1 PWA 개선):
├─ 오프라인 데이터 저장 (IndexedDB)
├─ 동기화 큐 구현
├─ Conflict resolution
└─ 권한 기반 오프라인 기능

Week 7-8 (Phase B.2 QR + 배포):
├─ QR 코드 생성 & 스캔
├─ 일회용 QR 로그인
├─ manifest.json + 설치 UX
└─ PWA 배포 최적화
```

---

## 다음 단계

1. **QR 배포 시스템 설계** (QR-deployment-system.md)
2. **최종 Epic/Stories v3** (PWA + Tailwind 통합)
3. **프로토타입 개발** (Service Worker + IndexedDB 테스트)
