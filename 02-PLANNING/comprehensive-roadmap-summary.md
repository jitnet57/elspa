# ElSpa 통합 로드맵 (최종 기획 정리)
**Comprehensive Roadmap Summary | Date: 2026-05-05**

---

## 📊 전체 요구사항 통합

### 1.1 기획된 모든 요구사항

```
사용자 메시지별 요구사항 통합:

Message 1-3: 마사지/스파 자동화 시스템
├─ 채널 상담 (메신저/카톡) + AI
├─ 자동 예약 이관
├─ 실시간 스케줄 통합
├─ 자동 정산 (구글시트)
├─ 직원 관리
└─ 픽드랍 자동배정

Message 4: 마케팅 분석 + 백업
├─ 일간/주간/월간/분기/연간 리포트
│  (ElevenLabs + Caldotcom 데이터)
└─ 자동 백업/복원 시스템

Message 5: 반응형 디자인
└─ Tailwind CSS (모든 웹앱)

Message 6: PWA + 오프라인
├─ 웹앱 (모바일 설치 가능)
├─ 오프라인 동기화
└─ Service Worker

Message 7: QR 코드 배포
├─ 고정 QR (매장)
├─ 일회용 QR (신입 직원)
└─ 추천 QR (고객 공유)

Message 8: 여행 가이드 통합
├─ 가이드 예약 시스템
├─ 가이드 정산
└─ 통합 Settlement Site (3역할)

Message 9: 자동 스탐프 쿠폰
├─ 10회 사용 = 1회 무료
├─ 자동 쿠폰 생성
└─ 알림 (Push+Email+SMS)

총 범위: 16개 Epic, 150개 Story, 1,200+ Story Points
```

### 1.2 기술 스택 (최종 확정)

```
Frontend (3개 PWA):
├─ Framework: Next.js 14, React 18, TypeScript
├─ Styling: Tailwind CSS (반응형, Dark mode)
├─ State: Zustand, TanStack Query
├─ UI: shadcn/ui
├─ Charts: recharts
├─ PWA: Service Worker, IndexedDB, qrcode.react
└─ Responsive: sm, md, lg, xl, 2xl

Backend (Microservices):
├─ Framework: Express.js, Node.js 18+
├─ API Gateway: Express
├─ Services: Auth, Chat, Booking, Schedule, Finance, Employee, Driver, Guide
├─ Database: PostgreSQL (각 서비스)
├─ Cache: Redis (세션, 캐시, Pub/Sub)
├─ Queue: Bull (배치 작업)
└─ ORM: Prisma

외부 서비스:
├─ ElevenLabs (STT/TTS)
├─ Caldotcom (일정 관리)
├─ Google APIs (OAuth, Calendar, Sheets, Maps)
├─ SendGrid (이메일)
├─ Twilio (SMS)
└─ Firebase (푸시)

배포:
├─ Frontend: Vercel (3개 PWA)
├─ Backend: Docker + Kubernetes
├─ Database: AWS RDS (PostgreSQL)
└─ CDN: CloudFront
```

---

## 🎯 Phase A vs Phase B 최종 구성

### 2.1 Phase A: MVP + 반응형 (Week 1-4)

```
목표: 빠른 출시, 모든 기능 기본 구현, 반응형 디자인, PWA 기초

구성 (300pt):

W1: 인증 + 채팅 (90pt)
├─ Auth Service (JWT, OAuth, RBAC) - 60pt
├─ Chat Service (Messenger, Kakao) - 30pt
└─ Tailwind 기초 (버튼, 폼, 그리드)

W2: 예약 + User Site (70pt)
├─ Booking Service - 25pt
├─ User Site (4단계 예약) - 25pt
├─ Tailwind 반응형 (모바일 최적화) - 20pt

W3: 정산 + 직원 + 백업 (90pt)
├─ Finance Service (거래, 정산, Google Sheets) - 40pt
├─ Employee Service (직원 관리) - 30pt
├─ Database Backup System - 20pt

W4: Staff Site + PWA 기초 (50pt)
├─ Staff Site (테라피스트, 드라이버) - 30pt
├─ Service Worker (캐싱만) - 10pt
├─ Manifest.json + 설치 UI - 10pt

총: 300pt
배포: 3개 웹앱 (Admin, User, Staff) + Vercel

특징:
✅ 온라인 필수 (오프라인 미지원)
✅ 모든 기기 지원 (반응형)
✅ PWA처럼 설치 가능
✅ 모바일 앱 경험
```

### 2.2 Phase B: 고도화 + 오프라인 (Week 5-8)

```
목표: 완전한 오프라인, 마이크로서비스, 통합 정산

구성 (520pt):

W5: ElevenLabs + Caldotcom + Google Calendar + 마케팅 분석 (100pt)
├─ ElevenLabs 통합 (STT/TTS) - 20pt
├─ Caldotcom 양방향 동기화 - 20pt
├─ Google Calendar 동기화 - 20pt
├─ 마케팅 분석 데이터 수집 - 20pt
├─ Marketing Analytics 대시보드 - 20pt

W6: PWA + Offline 완전 구현 (70pt)
├─ Service Worker (Network First) - 18pt
├─ IndexedDB (로컬 데이터 저장) - 16pt
├─ 동기화 엔진 (충돌 해결) - 22pt
├─ 오프라인 UX (상태 표시, 모달) - 14pt

W7: QR 코드 + 가이드 예약 (100pt)
├─ QR 생성/관리 시스템 - 15pt
├─ QR 스캔 플로우 (3가지) - 18pt
├─ 일회용 QR 토큰 - 17pt
├─ 가이드 프로필 & 예약 - 30pt
├─ 가이드 정산 - 20pt

W8: Microservices + Settlement Site + 스탐프 쿠폰 (250pt)
├─ 마이크로서비스 코드 분리 - 25pt
├─ 서비스 간 통신 (Sync+Async) - 20pt
├─ Saga 패턴 분산 트랜잭션 - 20pt
├─ DB 분리 (각 서비스) - 20pt
├─ Settlement Site (3역할) - 80pt
├─ 스탐프 쿠폰 시스템 - 80pt
└─ 모니터링 & 보안 & 버그 fix - 5pt

총: 520pt
배포: Kubernetes 마이크로서비스 + Settlement Site

특징:
✅ 완벽한 오프라인 기능
✅ 8개 마이크로서비스 운영
✅ 3개 역할 통합 정산
✅ 고객 충성도 프로그램
```

---

## 📋 최종 Epic/Stories 구성 (v4)

### 3.1 Epic 목록 (16개)

```
Phase A (W1-W4):

Epic 1: Auth & User Management
  └─ 6 Stories, 60pt

Epic 2: Chat Service & AI Consulting
  └─ 6 Stories, 100pt

Epic 3: Booking Management
  └─ 5 Stories, 70pt

Epic 4: Finance & Settlement
  └─ 5 Stories, 80pt

Epic 5: Employee Management
  └─ 4 Stories, 65pt

Epic 6: Database Backup & Restore
  └─ 3 Stories, 40pt

Epic 7: Staff Site (Therapist + Driver)
  └─ 5 Stories, 50pt

Phase B (W5-W8):

Epic 8: External Integrations (ElevenLabs, Caldotcom, Google Calendar)
  └─ 3 Stories, 60pt

Epic 9: PWA & Offline Functionality
  └─ 6 Stories, 70pt

Epic 10: QR Code Deployment System
  └─ 3 Stories, 50pt

Epic 11: Microservices Refactoring
  └─ 4 Stories, 80pt

Epic 12: Marketing Analytics & Reporting
  └─ 5 Stories, 100pt

Epic 13: Travel Guide Service (신규)
  └─ 7 Stories, 150pt

Epic 14: Settlement Site - Unified (신규)
  └─ 5 Stories, 80pt

Epic 15: User Site Extension - Travel Booking (신규)
  └─ 4 Stories, 60pt

Epic 16: Loyalty Program & Auto-Stamp Coupon (신규)
  └─ 7 Stories, 80pt

총합: 16 Epic, 150 Stories, 1,200+ Story Points
```

### 3.2 우선순위 & 의존성

```
Critical Path (반드시 순서 지킬 것):

1. Epic 1 (Auth) - 기초
   ↓
2. Epic 2 (Chat) + Epic 3 (Booking) - 핵심 기능 (병렬)
   ↓
3. Epic 5 (Employee) + Epic 4 (Finance) - 운영 (병렬)
   ↓
4. Epic 7 (Staff Site) - 스태프용
   ↓
5. Epic 6 (Backup) - 데이터 보호
   ↓
6. [Phase A 완료 & 배포]
   ↓
7. Epic 8 (통합) → Epic 9 (PWA) → Epic 12 (분석) - (순차)
   ↓
8. Epic 10 (QR) → Epic 13 (가이드) → Epic 14 (Settlement) (순차)
   ↓
9. Epic 15 (User 확장) + Epic 16 (스탐프) - (병렬)
   ↓
10. Epic 11 (Microservices) - 최후 리팩토링

Non-critical (병렬 가능):
- 단위 테스트 (각 Sprint)
- 모니터링 설정 (W6+)
- 문서화 (지속적)
```

---

## 🗺️ 주요 시스템 흐름

### 4.1 고객 여정 (Customer Journey)

```
미지원 → 신규 고객 → 재방문 → VIP 고객

신규 고객:
1. User Site에 접근 (QR 스캔 또는 URL)
2. 회원가입 (Google/Kakao OAuth)
3. 서비스 검색 & 예약
4. 결제
5. 예약 완료 알림

재방문:
1. User Site 로그인
2. 지난 예약 조회
3. 새 예약
4. 결제 (쿠폰 사용 가능)
5. 예약 추적 (GPS)
6. 리뷰 작성

충성도 적립:
- 매 예약마다 1 스탐프 적립
- 10 스탐프 → 1 무료 쿠폰 (자동)
- 3개월 유효기간
- 리뷰/초대 시 보너스 스탐프

VIP 고객:
- 고정 예약 (주 1회)
- 우선 예약권
- 전용 테라피스트
```

### 4.2 스태프 여정 (Staff Journey)

```
신입 → 활동 → 정산

신입 직원:
1. Admin이 일회용 QR 생성
2. 직원이 QR 스캔 → 자동 로그인
3. Profile 설정 (프로필 사진, 소개)
4. 역할 선택 (테라피스트/드라이버/가이드)

활동 중:
1. Staff Site 로그인
2. 오늘의 일정 확인
3. 예약 시작
4. 서비스 타이머 (마사지) 또는 GPS (드라이버) 또는 GPS (가이드)
5. 완료 표시
6. 완료 후 스탐프 확인 (고객)

정산:
1. Settlement Site에서 정산 조회
2. 월간/주간/일간 통계 확인
3. PDF/Excel 다운로드
4. 은행 계좌 확인 & 이체 완료 알림

분류별:
- 테라피스트: 서비스 수수료 (50%)
- 드라이버: 픽드랍 수수료 (50%)
- 가이드: 투어 수수료 (50% 또는 시급)
```

### 4.3 관리자 여정 (Admin Journey)

```
모니터링 → 관리 → 분석

모니터링:
1. Admin Site 로그인
2. Main Dashboard (KPI, 실시간 메트릭)
3. 경고 확인 (저매출, 클레임)

관리:
1. 채팅 통합 (Messenger/Kakao)
   - 수신 메시지 조회
   - AI 응답 승인/거부
   - 예약 이관

2. 스케줄 관리
   - 실시간 일정 보기
   - 충돌 감지 & 해결
   - Caldotcom/Google Calendar 동기화

3. 직원 관리
   - 신입 초대 (QR 생성)
   - 근무 기록 추가
   - 성과 평가
   - 정산 확인

4. 고객 관리
   - 고객 목록 & 검색
   - 구매 이력
   - 리뷰 모니터링
   - 쿠폰 생성 & 관리

분석:
1. 마케팅 분석 대시보드
   - ElevenLabs 통계 (통화, 성공률)
   - Caldotcom 분석 (예약, 채널)
   - 매출 추이 & 예측
   - 고객 세분화

2. 정산 현황
   - 월간 정산액 (테라피스트/드라이버/가이드)
   - 개별 정산 내역
   - 총 절감액 (쿠폰)

3. 충성도 프로그램
   - 스탐프 보유분포
   - 쿠폰 생성/사용/만료
   - 재방문율 추이
```

---

## 🏗️ 아키텍처 구조

### 5.1 마이크로서비스 배포도

```
┌────────────────────────────────────────────────┐
│                  Vercel CDN                     │
├────────────────────────────────────────────────┤
│                                                │
│  Admin PWA    User PWA    Staff PWA Settlement│
│  (Next.js)    (Next.js)   (Next.js)    (NJS)  │
│   admin.elspa  app.elspa  staff.elspa  settlement.
│                                                │
└─────────────────┬────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
    ┌───▼────┐           ┌──▼────┐
    │ Vercel │           │CloudFront
    │ Domain │           │(CDN)
    └────────┘           └────────┘
        │
        │
    API Gateway (Express)
    ├─ /api/auth/*
    ├─ /api/chats/*
    ├─ /api/bookings/*
    ├─ /api/schedule/*
    ├─ /api/finance/*
    ├─ /api/staff/*
    ├─ /api/drivers/*
    ├─ /api/guides/*
    └─ /api/settlement/*
        │
        └─────────────────────────┬─────────────────┐
                                  │                 │
                    ┌─────────────┼──────────────┐  │
                    │             │              │  │
        ┌──────────▼──┐   ┌──────▼──┐   ┌──────▼──┐│
        │ Kubernetes  │   │ Redis   │   │AWS RDS  ││
        │ (Services)  │   │(Cache)  │   │(DB)     ││
        │             │   │         │   │         ││
        │ - Auth Svc  │   │ Sessions│   │ - Auth  ││
        │ - Chat Svc  │   │ Queues  │   │ - Chat  ││
        │ - Booking   │   │ Pub/Sub │   │ - Booking
        │ - Schedule  │   │         │   │ - Schedule
        │ - Finance   │   └─────────┘   │ - Finance
        │ - Employee  │                 │ - Employee
        │ - Driver    │                 │ - Driver
        │ - Guide     │                 │ - Guide
        │ - API Gate  │                 │ - Settlement
        │             │                 │         │
        └─────────────┘                 └─────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────┐
        │                                   │                   │
    ┌───▼──┐                           ┌────▼────┐         ┌──▼──┐
    │ Bull │                           │ S3 Bkt  │         │ELK  │
    │Queue │                           │(Backups)│         │Stack│
    │      │                           │         │         │     │
    │- Daily settlement                │- DB backup│     │- Logs  │
    │- Hourly analytics               │- File backup    │- Metrics
    │- Cron jobs                       └─────────┘         └──────┘
    │                                       │
    └──────────────────────────────────────┘
                    │
        ┌───────────┴────────────┬────────────┐
        │                        │            │
    ┌───▼───┐              ┌────▼──┐    ┌──▼──┐
    │ElevenLabs             │Caldotcom  │Google
    │(STT/TTS)             │API       │APIs
    └───────┘              └────┬─────┘    │
                                 │         │
                            ┌────▼─────────▼──┐
                            │ Webhook Handlers│
                            │ (inbound events)│
                            └─────────────────┘
```

### 5.2 데이터 흐름 (예약 → 정산)

```
1. 고객 예약
   ┌──────────────────┐
   │ User PWA         │
   │ [예약 버튼]      │
   └────────┬─────────┘
            │ POST /api/bookings
            ▼
   ┌──────────────────────────────┐
   │ Booking Service              │
   ├──────────────────────────────┤
   │ 1. 가용성 확인 (Schedule)    │
   │ 2. 중복 감지 (Saga)         │
   │ 3. 예약 생성                │
   │ 4. 결제 (결제 게이트웨이)   │
   │ 5. 알림 발송 (Notification) │
   └────────┬─────────────────────┘
            │

2. 서비스 제공
   ┌──────────────────────────┐
   │ Staff Site / Therapist   │
   │ [서비스 타이머 START]    │
   │ ...                      │
   │ [서비스 완료]            │
   └────────┬─────────────────┘
            │ PUT /api/bookings/:id (status: completed)
            ▼

3. 스탐프 적립
   ┌──────────────────────────┐
   │ Booking Service          │
   │ status = 'completed'     │
   └────────┬─────────────────┘
            │ Event: booking:completed
            ▼
   ┌──────────────────────────┐
   │ Customer Service         │
   │ stamps += 1              │
   └────────┬─────────────────┘
            │ if stamps >= 10?
            ├─ YES → 쿠폰 생성 (Notification)
            └─ NO → 진행률 업데이트

4. 정산 (매일 1:00 AM)
   ┌──────────────────────────┐
   │ Bull Queue               │
   │ Job: settlement          │
   └────────┬─────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Finance Service              │
   ├──────────────────────────────┤
   │ 1. 완료 투어 조회 (어제)     │
   │ 2. 수수료 계산               │
   │ 3. 세금 공제                │
   │ 4. 정산 기록 생성           │
   │ 5. Google Sheets 기록       │
   │ 6. 알림 발송                │
   └────────┬──────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Settlement Site              │
   ├──────────────────────────────┤
   │ Staff가 조회                 │
   │ - 정산액: 4,109,250₩        │
   │ - 은행: 국민은행            │
   │ - 상태: 예정                │
   └──────────────────────────────┘
            │
   ┌────────▼──────────────────────┐
   │ Banking API (09:00)          │
   ├──────────────────────────────┤
   │ 실제 계좌이체               │
   │ status: completed            │
   └──────────────────────────────┘
```

---

## 📅 최종 일정 계획

### 6.1 Week-by-Week (8주)

```
PHASE A: MVP + 반응형 디자인 (4주)

Week 1 (5/5-5/11):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • Auth Service (JWT, OAuth, RBAC)      │
│ • Chat Service (Messenger, Kakao)      │
│ • Tailwind CSS 초기 설정                │
│                                         │
│ Deliverables:                          │
│ ✓ Auth API (login, register, verify)  │
│ ✓ Chat 웹훅 (수신)                    │
│ ✓ Tailwind 설정 + 기본 컴포넌트       │
│ ✓ Skeleton UI (대시보드, 폼)          │
│                                         │
│ Team: 3명 (1 Backend, 1 Frontend, 1 Full-stack)
└─────────────────────────────────────────┘

Week 2 (5/12-5/18):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • Booking Service (예약 생성/관리)     │
│ • User Site (4단계 예약 플로우)       │
│ • 반응형 디자인 (모바일)               │
│                                         │
│ Deliverables:                          │
│ ✓ Booking API (CRUD, 충돌 감지)      │
│ ✓ User Site 프로토타입                │
│ ✓ Responsive 그리드 (Tailwind)       │
│ ✓ 다크 모드 지원                       │
│                                         │
│ Team: 3명 (계속)
└─────────────────────────────────────────┘

Week 3 (5/19-5/25):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • Finance Service (정산, Google Sheets)│
│ • Employee Service (직원 관리)         │
│ • Database Backup 시스템               │
│                                         │
│ Deliverables:                          │
│ ✓ Settlement API (계산, 기록)        │
│ ✓ Google Sheets 연동 (자동 기록)     │
│ ✓ Staff 관리 대시보드                 │
│ ✓ pg_dump 백업 스크립트               │
│                                         │
│ Team: 3명 (계속)
└─────────────────────────────────────────┘

Week 4 (5/26-6/1):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • Staff Site (테라피스트 + 드라이버)  │
│ • Service Worker (캐싱만)              │
│ • PWA 설치                             │
│ • Phase A 배포                         │
│                                         │
│ Deliverables:                          │
│ ✓ Staff Site UI (Tailwind)            │
│ ✓ Service Worker + Manifest            │
│ ✓ Vercel 배포 (3개 웹앱)              │
│ ✓ QA & 버그 fix                       │
│                                         │
│ Team: 3명 (계속) + QA 1명
│ Status: ✅ PHASE A COMPLETE
└─────────────────────────────────────────┘

PHASE B: 고도화 + 오프라인 (4주)

Week 5 (6/2-6/8):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • ElevenLabs 통합 (STT/TTS)           │
│ • Caldotcom 양방향 동기화              │
│ • Google Calendar 동기화               │
│ • 마케팅 분석 시스템                   │
│                                         │
│ Deliverables:                          │
│ ✓ ElevenLabs API (음성 처리)          │
│ ✓ Caldotcom 웹훅 + 동기화            │
│ ✓ Google Calendar OAuth + 2-way sync  │
│ ✓ Analytics 데이터 수집               │
│ ✓ 마케팅 대시보드 UI (Tailwind)      │
│                                         │
│ Team: 4명 (기존 3 + 1 추가)
└─────────────────────────────────────────┘

Week 6 (6/9-6/15):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • Service Worker (Network First)       │
│ • IndexedDB (로컬 데이터 저장)        │
│ • 동기화 엔진 (충돌 해결)              │
│ • 오프라인 UX                          │
│                                         │
│ Deliverables:                          │
│ ✓ Service Worker (캐싱 전략)         │
│ ✓ IndexedDB 스키마 & 암호화          │
│ ✓ Sync Queue 엔진                     │
│ ✓ Conflict Resolution 규칙            │
│ ✓ 오프라인 배너/모달                  │
│                                         │
│ Team: 4명 (계속)
└─────────────────────────────────────────┘

Week 7 (6/16-6/22):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • QR 코드 시스템                       │
│ • 가이드 예약 시스템                   │
│ • 가이드 정산                          │
│                                         │
│ Deliverables:                          │
│ ✓ QR 생성/관리 API                   │
│ ✓ QR 스캔 플로우 (3가지)             │
│ ✓ 일회용 QR 토큰                      │
│ ✓ Guide Service API                   │
│ ✓ Guide Settlement (자동 계산)        │
│ ✓ QR 스캔 분석 대시보드               │
│                                         │
│ Team: 5명 (4 + 1 가이드 담당)
└─────────────────────────────────────────┘

Week 8 (6/23-6/29):
┌─────────────────────────────────────────┐
│ Sprint Goals:                           │
│ • Microservices 리팩토링               │
│ • Settlement Site (3역할 통합)        │
│ • 스탐프 쿠폰 시스템                   │
│ • Phase B 배포 & 최적화                │
│                                         │
│ Deliverables:                          │
│ ✓ 마이크로서비스 분리 (8개)          │
│ ✓ API Gateway 라우팅                 │
│ ✓ Saga 패턴 분산 트랜잭션            │
│ ✓ Settlement Site (새 PWA)           │
│ ✓ 스탐프 자동 적립 시스템            │
│ ✓ 쿠폰 생성 엔진                     │
│ ✓ 알림 시스템 (Push/Email/SMS)       │
│ ✓ Kubernetes 배포                    │
│ ✓ 성능 최적화 & 버그 fix             │
│                                         │
│ Team: 5명 (계속) + DevOps 1명
│ Status: ✅ PHASE B COMPLETE
└─────────────────────────────────────────┘
```

### 6.2 마일스톤

```
Milestone 1: Phase A MVP (6월 1일)
├─ 3개 웹앱 배포 (Admin, User, Staff)
├─ 모바일/태블릿/데스크톱 반응형 100%
├─ 모든 기본 기능 동작
└─ User Feedback 수집

Milestone 2: Phase B 고도화 (6월 29일)
├─ PWA 오프라인 완전 지원
├─ 마이크로서비스 운영 시작
├─ 마케팅 분석 리포트 자동화
├─ 여행 가이드 기능 추가
├─ 통합 정산 시스템 운영
└─ 고객 충성도 프로그램 시작

Milestone 3: 최적화 & 확장 (추후 계획)
├─ 성능 튜닝 (< 2초 로드타임)
├─ 국제화 (다국어 지원)
├─ 추가 외부 통합
└─ 모바일 네이티브 앱 (필요시)
```

---

## 📊 예상 리소스

### 7.1 팀 구성

```
Phase A (W1-W4):
├─ Backend Engineers: 1명 (Full-time)
├─ Frontend Engineers: 1명 (Full-time)
├─ Full-stack Engineer: 1명 (Full-time)
└─ QA: 0.5명 (Part-time)
총: 3.5명

Phase B (W5-W8):
├─ Backend Engineers: 2명 (추가 1)
├─ Frontend Engineers: 1명
├─ Full-stack Engineers: 1명
├─ Guide Feature Specialist: 1명 (신입)
├─ DevOps/Infrastructure: 1명 (신입)
└─ QA: 1명 (풀타임 전환)
총: 7명

오버헤드:
├─ PM: 1명 (기획/조율)
├─ 아키텍트: 0.5명 (기술 설계)
└─ 정산/정산: 1명 (후반기)
```

### 7.2 인프라 비용 추정

```
월간 비용 (Phase B 이후):

Frontend Hosting (Vercel):
└─ 3개 PWA: 약 $100/월 (Pro)

Backend (AWS):
├─ EC2 (t3.medium × 3): $150/월
├─ RDS PostgreSQL: $300/월
├─ ElastiCache Redis: $150/월
├─ S3 (백업): $50/월
└─ 대역폭/기타: $100/월

외부 서비스:
├─ SendGrid (이메일): $100/월
├─ Twilio (SMS): $50/월
├─ Google APIs: 포함
├─ ElevenLabs: 사용량 기준 (~$200)
└─ Caldotcom: API 포함

CDN & 모니터링:
├─ CloudFront: $50/월
├─ Datadog: $100/월
└─ Other tools: $50/월

총 월간 비용: 약 1,300$/월 (~1.6M₩)
```

---

## ✅ 최종 체크리스트

### 8.1 기획 완료 항목

```
✅ 마사지 스파 자동화 시스템 (기본)
✅ AI 상담 & 자동 예약 이관
✅ 실시간 스케줄 통합
✅ 자동 정산 (Google Sheets)
✅ 직원 관리 & 기록
✅ 픽드랍 자동배정
✅ 마케팅 분석 & 리포트 (일/주/월/분기/연)
✅ 데이터베이스 백업/복원
✅ Tailwind CSS 반응형 디자인
✅ PWA (웹앱) + 오프라인 기능
✅ QR 코드 배포 시스템 (3가지)
✅ 여행 가이드 통합
✅ 통합 정산 사이트 (3역할)
✅ 자동 스탐프 쿠폰 & 충성도
✅ 아키텍처 설계 (마이크로서비스)
✅ 일정 계획 (8주)
✅ 팀 구성 & 비용
```

### 8.2 다음 액션 아이템 (코딩 전)

```
⏭️ 최종 Epic/Stories v4 작성
├─ 기존 v3 기반
├─ 여행가이드 + Settlement + 스탐프 추가
└─ 리뷰 & 승인

⏭️ UX 디자인 상세화
├─ Wireframe (figma)
├─ Tailwind 컴포넌트 라이브러리
├─ 프로토타입 (Interactive)
└─ 스타일가이드

⏭️ API 명세서 (OpenAPI/Swagger)
├─ Auth Service
├─ Chat Service
├─ Booking Service
├─ Guide Service
├─ Settlement Service
└─ 기타 (8개 총)

⏭️ 데이터베이스 상세 설계
├─ ER 다이어그램
├─ 마이그레이션 스크립트
├─ 인덱싱 전략
└─ 백업 정책

⏭️ 보안 & 규정
├─ PII 암호화
├─ HTTPS/TLS 설정
├─ GDPR 준수 (고객 데이터)
└─ 정산 감사 규정

⏭️ 테스트 전략
├─ 단위 테스트 계획
├─ E2E 테스트 시나리오
├─ 성능 테스트 목표
└─ 부하 테스트 (200 동시 사용자)

⏭️ 배포 & CI/CD
├─ GitHub Actions 설정
├─ Docker 이미지
├─ Kubernetes 매니페스트
├─ 롤백 전략
└─ 모니터링 & 알림
```

---

## 🎯 성공 기준

### 9.1 Phase A 완료 (6월 1일)

```
기능:
✅ 3개 웹앱 배포 (Admin, User, Staff)
✅ 모든 기본 기능 동작
✅ 온라인 필수 (오프라인 미지원, 예정)
✅ 모든 기기 반응형

성능:
✅ 페이지 로드 < 3초
✅ 모바일 LCP < 2.5초
✅ 버그 심각도 0 (Critical 없음)

품질:
✅ 코드 커버리지 > 70%
✅ E2E 테스트 자동화 > 80%
✅ 보안 스캔 Pass

만족도:
✅ 테스트 사용자 호평
✅ 기능 완성도 100%
✅ 문서화 완성
```

### 9.2 Phase B 완료 (6월 29일)

```
기능:
✅ PWA 오프라인 완전 지원
✅ 8개 마이크로서비스 운영
✅ 마케팅 분석 리포트 자동화
✅ 여행 가이드 기능 완전 구현
✅ 통합 정산 시스템 가동
✅ 스탐프 쿠폰 시스템 가동

성능:
✅ API 응답시간 < 200ms (p95)
✅ Service Worker 캐시 hitrate > 80%
✅ 동기화 지연 < 5초
✅ 정산 배치 < 5분

품질:
✅ 코드 커버리지 > 80%
✅ 자동화 테스트 > 90%
✅ 보안 감사 Pass
✅ 성능 감사 Pass (Lighthouse > 90)

비즈니스:
✅ 재방문율 80% → 85%+
✅ 고객만족도 4.7 → 4.9/5.0
✅ 스탐프 참여율 50%+
✅ 쿠폰 사용률 90%+
```

---

## 📝 문서 참고

```
작성된 기획 문서:

1. microservices-architecture.md
   └─ 마이크로서비스 설계

2. final-epics-stories-v3.md
   └─ 95개 Story, 825pt (v3)

3. pwa-offline-architecture.md
   └─ Service Worker, IndexedDB, 오프라인

4. qr-deployment-system.md
   └─ QR 코드 배포 (고정/일회용/추천)

5. travel-guide-integration-plan.md
   └─ 여행 가이드 + 통합 정산

6. loyalty-stamp-system-plan.md
   └─ 스탐프 쿠폰 자동화

7. marketing-analytics-and-backup.md
   └─ 마케팅 분석 + 백업

다음: Final Epic/Stories v4 작성
      (위 모든 기획을 통합한 최종 Story 정의)
```

