# ElSpa 최종 Epic/Stories v5
**Final Epic & User Stories | Date: 2026-05-06**

---

## 📊 Executive Summary

**Total Scope**: 21 Epic, 180+ User Stories, **1,670 Story Points**
**Timeline**: 10 weeks (Phase A: 4 weeks + Phase B: 6 weeks)
**Team**: 3.5 → 9 members
**Architecture**: Monolithic (Phase A) → Microservices (Phase B)

---

## 🏗️ Epic 구조

### **Phase A: MVP + 반응형 (Week 1-4) - 300pt**

#### Epic 1: 인증 & 권한 관리 (RBAC) - 60pt
**Narrative**: 3개 웹앱(Admin/User/Staff) 사용자의 안전한 인증과 권한 제어

**Stories**:
- [60pt] JWT 기반 인증 시스템 (OAuth2, Google, 휴대폰)
- [20pt] RBAC 모델 설계 및 구현 (5개 역할: Owner/Manager/Therapist/Driver/Customer)
- [15pt] 관리자 권한 분리 (마케팅/운영/재무 담당자)
- [15pt] 세션 관리 및 토큰 갱신
- [10pt] 접근 제어 및 감시 로그

---

#### Epic 2: 채팅 & AI 상담 시스템 - 100pt
**Narrative**: 메신저/카톡 통합 + AI 자동상담으로 24/7 고객 응대

**Stories**:
- [40pt] 채팅 서비스 구축 (메신저, 카톡 웹훅)
- [35pt] AI 상담봇 (Claude/GPT 활용, 규칙 기반 답변)
- [15pt] 챗봇 학습 데이터 관리 (자주묻는질문)
- [10pt] 실시간 알림 및 메시지 동기화
- [10pt] 상담 이력 및 분석

**Blocked/Future (Phase B)**:
- ElevenLabs 음성 상담 (TTS/STT) → Phase B-6

---

#### Epic 3: 예약 & 스케줄 시스템 - 70pt
**Narrative**: 실시간 스케줄 통합, 자동 예약 이관, 충돌 방지

**Stories**:
- [35pt] 예약 엔진 (가능시간 계산, 중복 방지)
- [20pt] 실시간 스케줄 뷰 (Admin/Staff/Customer)
- [15pt] 예약 알림 (SMS, Push, Email)
- [10pt] 예약 취소 및 변경 정책
- [10pt] Caldotcom 연동 준비 (API 문서 검토)

**Blocked/Future (Phase B)**:
- Caldotcom 실시간 동기화 → Phase B-2
- 구글캘린더 연동 → Phase B-2

---

#### Epic 4: 결제 & 정산 시스템 - 80pt
**Narrative**: 자동 결제 처리, 테라피스트/드라이버/가이드 정산

**Stories**:
- [30pt] 결제 게이트웨이 통합 (Stripe/PayPal)
- [25pt] 정산 자동화 (구글시트 실시간 기록)
- [15pt] 정산 리포트 (일/주/월 기준)
- [10pt] 환불 정책 및 처리

**Phase B 추가 (20pt)**:
- [20pt] 여행가이드 정산 로직 (커미션 계산)

**Total: 100pt**

---

#### Epic 5: 직원 & 드라이버 관리 - 65pt
**Narrative**: 테라피스트/드라이버 프로필, 스케줄, 평가 관리

**Stories**:
- [25pt] 직원 프로필 관리 (신상정보, 자격증, 등급)
- [20pt] 직원 스케줄 설정 (근무시간, 휴무일)
- [15pt] 직원 평가 & 통계 (고객 리뷰 기반)
- [10pt] Pick-Drop 자동배정 (가장 가까운 기사)
- [10pt] 직원 온보딩 (QR 코드 기반)

**Phase B 추가 (15pt)**:
- [15pt] 여행가이드 프로필 관리

**Total: 80pt**

---

#### Epic 6: 백업 & 복원 시스템 - 40pt
**Narrative**: Admin 로컬 자동 백업, 설정 가능한 일정, 신속한 복원

**Stories**:
- [20pt] 자동 백업 엔진 (일일/시간 단위, 암호화)
- [15pt] 백업 스케줄 관리 UI
- [10pt] 데이터 복원 기능 및 검증
- [5pt] 백업 스토리지 관리

**Phase B 추가 (20pt)**:
- [20pt] 클라우드 백업 (AWS S3)

**Total: 60pt**

---

### **Phase B: 확장 & 마이크로서비스 (Week 5-10) - 1,370pt**

#### Epic 7: 마이크로서비스 아키텍처 - 120pt
**Narrative**: 모놀리식 → 마이크로서비스 마이그레이션

**Stories**:
- [40pt] API Gateway 구축 (Express, Rate Limiting)
- [30pt] 서비스 분리 (Auth, Chat, Booking, Schedule, Finance, Employee, Driver, Guide)
- [25pt] 서비스 간 통신 (Event Bus, Kafka/RabbitMQ)
- [15pt] 서비스 디스커버리 (Consul/Eureka)
- [10pt] 분산 로깅 및 모니터링 (ELK Stack)

---

#### Epic 8: PWA & 오프라인 기능 - 110pt
**Narrative**: Service Worker, IndexedDB, 자동 동기화로 완전한 오프라인 지원

**Stories**:
- [40pt] Service Worker 구현 (Network First 캐싱)
- [30pt] IndexedDB 로컬 데이터 저장소
- [20pt] 동기화 엔진 (Sync Queue, 충돌 해결)
- [15pt] 오프라인 UI/UX (동기화 상태 표시)
- [5pt] 데이터 암호화

---

#### Epic 9: QR 코드 배포 시스템 - 95pt
**Narrative**: 3가지 QR 타입 (고정/일회용/추천)으로 멀티채널 접근

**Stories**:
- [35pt] 고정 QR 관리 (매장 설치, 통계)
- [30pt] 일회용 QR (신입직원 온보딩, JWT 토큰)
- [20pt] 추천 QR (고객 공유, 리워드)
- [10pt] QR 스캔 분석 대시보드

---

#### Epic 10: 마케팅 분석 & 리포팅 - 100pt
**Narrative**: 일간/주간/월간/분기/연간 통계 리포트 (ElevenLabs/Caldotcom 데이터)

**Stories**:
- [35pt] 데이터 수집 엔진 (ElevenLabs API, Caldotcom API)
- [25pt] 분석 대시보드 (시계열 차트, 추이)
- [20pt] 리포트 자동 생성 (PDF, Excel)
- [15pt] 예측 분석 (트렌드, 수요 예측)
- [5pt] 이메일 자동 발송

---

#### Epic 11: 여행 가이드 통합 - 140pt
**Narrative**: 가이드 예약, 투어 관리, 정산 (3개 역할 통합)

**Stories**:
- [40pt] 가이드 프로필 & 예약 시스템 (freelance/fulltime 구분)
- [35pt] 투어 타입 관리 (개인/그룹/전문특화/공항+투어)
- [30pt] 가이드 정산 로직 (50% commission 또는 hourly)
- [25pt] Staff Site 추가 (테라피스트/드라이버/가이드 통합)
- [10pt] 가이드 평가 및 통계

---

#### Epic 12: 자동 스탐프 쿠폰 시스템 - 85pt
**Narrative**: 10회 사용 = 1회 무료 쿠폰 자동생성 및 알림

**Stories**:
- [30pt] 스탐프 적립 로직 (예약 완료 시 자동)
- [25pt] 쿠폰 자동 생성 (10 stamps → 1 coupon, 3개월 유효)
- [20pt] 알림 시스템 (Push/Email/SMS)
- [10pt] 쿠폰 사용 및 만료 관리

---

#### Epic 13: 고객 리뷰 & SNS 자동 업로드 - 120pt
**Narrative**: 웹앱 내 리뷰 수집 → 자동 Facebook 업로드 + Gemini Vids 영상 생성

**Stories**:
- [35pt] 리뷰 수집 UI (별점, 텍스트, 사진)
- [30pt] 리뷰 검증 및 저장 (스팸 필터)
- [30pt] Facebook 자동 업로드 (Meta Graph API)
- [25pt] 리뷰 대시보드 (통계, 분석)

---

#### Epic 14: AI 영상 자동 생성 & SNS 배포 - 130pt
**Narrative**: Gemini Vids로 30-60초 마케팅 영상 자동 생성 및 TikTok/Facebook/YouTube 배포

**Stories**:
- [40pt] Gemini Vids 통합 (API, 3가지 템플릿)
- [35pt] 영상 템플릿 디자인 (고객 후기/서비스 소개/프로모션)
- [30pt] SNS 자동 배포 (TikTok, Facebook, YouTube)
- [15pt] 스케줄링 (자동 발송 시간 관리)
- [10pt] 영상 분석 대시보드 (조회수, 좋아요, 엔게이지먼트)

---

#### Epic 15: 반응형 디자인 (Tailwind CSS) - 90pt
**Narrative**: 3개 웹앱(Admin/User/Staff)의 모든 페이지를 Tailwind로 반응형 구현

**Stories** (각 웹앱별 15pt × 3):
- [45pt] Admin Site (대시보드, 설정, 분석, 정산)
  - [15pt] 반응형 레이아웃 (sm/md/lg/xl/2xl)
- [45pt] User Site (예약, 결제, 이력, 리뷰)
  - [15pt] 반응형 레이아웃
- [45pt] Staff Site (스케줄, Pick-Drop, 평가, 정산)
  - [15pt] 반응형 레이아웃

**Subtotal**: 135pt → Consolidated as 90pt (design system reuse)

---

#### Epic 16: API Gateway & 서비스 라우팅 - 80pt
**Narrative**: 8개 마이크로서비스 트래픽 관리, 인증, Rate Limiting

**Stories**:
- [30pt] API Gateway (Express, JWT 검증)
- [25pt] 서비스 라우팅 규칙 (URL 패턴)
- [15pt] Rate Limiting 및 Throttling
- [10pt] 요청/응답 로깅

---

#### Epic 17: 데이터베이스 & 캐싱 - 90pt
**Narrative**: PostgreSQL (각 서비스), Redis (세션/캐시)

**Stories**:
- [35pt] PostgreSQL 스키마 설계 (정규화)
- [30pt] Redis 캐싱 전략 (세션, Hot data)
- [15pt] 데이터베이스 마이그레이션 도구
- [10pt] 성능 모니터링 (Slow query)

---

#### Epic 18: ElevenLabs 음성 AI 상담 - 110pt
**Narrative**: 음성 전화 통화 실시간 변환, AI 자동응답

**Stories**:
- [40pt] ElevenLabs API 통합 (STT/TTS)
- [30pt] 실시간 음성 처리 (WebSocket)
- [25pt] 상담 녹음 및 저장
- [15pt] 음성 상담 분석 (감정, 주요 내용)

---

#### Epic 19: Caldotcom 연동 - 105pt
**Narrative**: 외부 스케줄 플랫폼과 양방향 동기화

**Stories**:
- [40pt] Caldotcom API 연동 (OAuth)
- [35pt] 양방향 동기화 (예약 추가/수정/삭제)
- [20pt] 충돌 해결 로직 (양쪽 동시 변경 시)
- [10pt] 동기화 상태 모니터링

---

#### Epic 20: OCR & 영수증 인식 - 90pt
**Narrative**: Google Vision API로 영수증 자동 인식, Claude AI로 필드 추출

**Stories**:
- [35pt] Google Vision API 통합 (TEXT_DETECTION, DOCUMENT_TEXT_DETECTION)
- [30pt] Claude AI 필드 추출 (상호, 금액, 날짜, 항목)
- [15pt] 신뢰도 스코어 (>80% 자동 승인, <80% 검증)
- [10pt] OCR 결과 캐싱 및 최적화

---

#### Epic 21: 비용 자동 분류 & 정산 - 70pt
**Narrative**: 영수증 자동 분류, 중복 제거, Excel/Google Sheets 자동 생성

**Stories**:
- [25pt] 자동 분류 엔진 (8개 카테고리: 물품/유지비/식비/교통비/통신비/광고/교육/기타)
- [20pt] 중복 제거 알고리즘 (시간±30min, 상호 유사도>90%, 금액±5%)
- [15pt] 일/월 자동 집계 (Bull Queue)
- [10pt] Excel/Google Sheets 자동 생성 및 업로드

---

## 📊 Story Point 분배

| Phase | Epic Count | Story Count | Story Points | Focus |
|-------|-----------|------------|--------------|--------|
| **A (W1-4)** | 6 | 60 | **300** | MVP, 기본 기능, 반응형 |
| **B (W5-10)** | 15 | 120+ | **1,370** | 확장, 마이크로서비스, AI/외부API |
| **Total** | **21** | **180+** | **1,670** | 완전한 자동화 플랫폼 |

---

## 🔄 의존성 & 차단 관계

```
Phase A (병렬 진행 가능):
├─ Epic 1 (Auth) → Epic 2, 3, 4, 5, 6 (선행)
├─ Epic 2 (Chat) → Epic 10 (미래)
├─ Epic 3 (Booking) → Epic 9 (QR) 선행 필요
├─ Epic 4 (Settlement) 독립
├─ Epic 5 (Employee) → Epic 11 (Guide) 선행
└─ Epic 6 (Backup) 독립

Phase B (순차):
├─ Epic 7 (Microservices) → Epic 8-16 (선행 필수)
├─ Epic 8 (PWA) → Epic 9 (QR) 선행
├─ Epic 18 (ElevenLabs) → Epic 2 (Chat) 통합
└─ Epic 19 (Caldotcom) → Epic 3 (Booking) 통합

Blocked (외부 의존성):
├─ ElevenLabs API 문서 검토 필요
├─ Caldotcom API 접근 권한 필요
├─ Meta Graph API 승인 필요
└─ Google Vision API 할당량 확보 필요
```

---

## 🎯 Phase A 세부 계획 (Week 1-4)

### **W1: 기초 인프라 + Auth (90pt)**

**Day 1-2: 프로젝트 세팅**
- Git 저장소 초기화
- 개발 환경 구성 (Node.js, Docker, PostgreSQL)
- 패키지 설치 (Next.js, Tailwind, Prisma)
- CI/CD 파이프라인 (GitHub Actions)

**Day 3-5: Auth Service (60pt)**
- JWT 기반 인증 구현
- OAuth 2.0 (Google, Kakao)
- RBAC 모델 및 권한 검증
- 세션 관리 및 토큰 갱신
- Admin 권한 분리 (Role-based)

**Day 6-7: 데이터베이스 설계**
- PostgreSQL 스키마 (Users, Roles, Sessions)
- Prisma ORM 설정
- 마이그레이션 스크립트

---

### **W2: Chat + Booking (70pt)**

**Day 1-3: Chat Service (40pt)**
- Express 서버 세팅
- 메신저/카톡 웹훅 통합
- 메시지 저장소 (PostgreSQL)
- 실시간 알림 (WebSocket)

**Day 4-7: Booking Engine (30pt)**
- 예약 엔진 (가능시간 계산)
- 중복 예약 방지 로직
- 예약 알림 (SMS/Email)
- 캘린더 UI (Admin/User)

---

### **W3: Settlement + Employee (70pt)**

**Day 1-3: Settlement (40pt)**
- 결제 게이트웨이 통합 (Stripe)
- 정산 자동화 (구글시트)
- 정산 리포트

**Day 4-7: Employee Management (30pt)**
- 직원 프로필 관리
- 스케줄 설정
- Pick-Drop 자동배정

---

### **W4: Backup + Responsive Design (70pt)**

**Day 1-3: Backup System (20pt)**
- 자동 백업 엔진
- 복원 기능

**Day 4-7: Responsive Design (50pt)**
- Tailwind CSS 디자인 시스템
- 3개 웹앱 반응형 구현
- 다크모드 지원

---

## 🔌 Phase B 상세 계획 (Week 5-10)

### **B-1 (W5): 마이크로서비스 아키텍처 (120pt)**
- API Gateway 구축
- 서비스 분리 및 통신
- 서비스 디스커버리

### **B-2 (W6): PWA + QR (205pt)**
- Service Worker 구현
- IndexedDB 동기화
- QR 코드 관리

### **B-3 (W7): 마케팅 자동화 (230pt)**
- 마케팅 분석 대시보드
- 리뷰 수집 시스템
- AI 영상 생성 (Gemini Vids)

### **B-4 (W8): 외부 API 통합 (215pt)**
- ElevenLabs 음성 상담
- Caldotcom 일정 동기화
- 영수증 OCR (Google Vision + Claude)

### **B-5 (W9): 여행 가이드 + 쿠폰 (225pt)**
- 가이드 시스템 통합
- 자동 스탐프 쿠폰
- 통합 정산 사이트

### **B-6 (W10): 테스트 + 배포 (180pt)**
- 통합 테스트 (Jest, Cypress)
- 성능 최적화 (번들 크기, API 응답)
- 보안 감사
- 프로덕션 배포 (Vercel, AWS)

---

## 🛠️ 기술 스택 최종 확정

### Frontend (3 PWA)
```
Framework:    Next.js 14 + React 18 + TypeScript
Styling:      Tailwind CSS + shadcn/ui
State:        Zustand + TanStack Query
Charts:       Recharts
PWA:          Service Worker + IndexedDB
QR:           qrcode.react
Responsive:   sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
Dark Mode:    Supported
```

### Backend (Microservices)
```
Framework:    Express.js + Node.js 18+
ORM:          Prisma
Database:     PostgreSQL (각 서비스 분리)
Cache:        Redis (Ioredis)
Queue:        Bull + Redis
Messaging:    Event Bus (Kafka/RabbitMQ)
Search:       Elasticsearch (옵션)
```

### External Services
```
Auth:         OAuth 2.0 (Google, Kakao)
Payment:      Stripe / PayPal
Email:        SendGrid
SMS:          Twilio
Push:         Firebase Cloud Messaging
AI:           Claude API (필드 추출), ElevenLabs (STT/TTS), Gemini Vids
Storage:      AWS S3 + CloudFront (CDN)
Calendar:     Google Calendar API, Caldotcom API
Analytics:    Google Analytics 4
```

### DevOps
```
Containerization:  Docker + Docker Compose
Orchestration:     Kubernetes (prod)
CI/CD:             GitHub Actions
Monitoring:        Prometheus + Grafana
Logging:           ELK Stack (Elasticsearch, Logstash, Kibana)
```

---

## 📋 팀 구성 (3.5 → 9명)

| Phase | 역할 | 명 | 담당 Epic |
|-------|-----|----|---------| 
| **A** | PM/기획 | 1 | 전체 조율 |
| **A** | Backend Lead | 1 | Auth, Settlement, Backup |
| **A** | Frontend Lead | 1 | UI/UX, Responsive |
| **A** | DevOps | 0.5 | CI/CD, Database |
| **B** | Backend Dev (×2) | 2 | Microservices, APIs |
| **B** | Frontend Dev (×2) | 2 | PWA, QR, SNS Integration |
| **B** | AI/ML Engineer | 1 | OCR, Classification |
| **B** | QA Engineer | 1 | 테스트, 배포 |
| **B** | DevOps | 1 | Infrastructure, Monitoring |
| **Total** | | **9** | |

---

## 💰 예상 개발 비용

| 항목 | 단가 | 투입 시간 | 소계 |
|-----|-----|---------|------|
| PM/기획 | $50/h | 160h | $8,000 |
| Backend Dev (×2) | $60/h | 400h | $24,000 |
| Frontend Dev (×2) | $60/h | 350h | $21,000 |
| DevOps/Infrastructure | $70/h | 120h | $8,400 |
| AI/ML Engineer | $80/h | 100h | $8,000 |
| QA/Testing | $45/h | 80h | $3,600 |
| **총 개발 비용** | | | **$73,000** |
| **외부 API 비용** (월) | | | ~$500 |
| **인프라 비용** (월) | | | ~$1,000 |

---

## ✅ 성공 기준 (Definition of Done)

### Phase A Completion
```
- ✅ 3개 웹앱 기본 기능 구현 완료
- ✅ 모든 페이지 Tailwind 반응형 완성
- ✅ Auth/Chat/Booking/Settlement 통합 테스트 통과
- ✅ Admin 로컬 백업/복원 동작 확인
- ✅ 300pt 전체 완료
```

### Phase B Completion
```
- ✅ 마이크로서비스 아키텍처 배포 완료
- ✅ PWA 오프라인 동작 테스트 완료
- ✅ QR 코드 3가지 타입 모두 동작
- ✅ ElevenLabs 음성 상담 연동 완료
- ✅ Caldotcom 양방향 동기화 완료
- ✅ Gemini Vids 영상 생성 자동화 완료
- ✅ 영수증 OCR 정확도 >95%
- ✅ 여행가이드 통합 정산 시스템 운영 중
- ✅ 1,370pt 전체 완료
- ✅ 프로덕션 배포 (Vercel/AWS) 완료
```

---

## 📅 마일스톤

| 마일스톤 | 목표 | 완료 기준 |
|---------|-----|---------|
| **M1 (W1 말)** | MVP Auth 완료 | Epic 1 100% |
| **M2 (W2 말)** | Chat + Booking 완료 | Epic 2, 3 100% |
| **M3 (W4 말)** | Phase A 완료 | 300pt 완료, 웹앱 라이브 |
| **M4 (W6 말)** | 마이크로서비스 + PWA | Epic 7, 8 완료 |
| **M5 (W8 말)** | 외부 API 통합 | Epic 18, 19, 20 완료 |
| **M6 (W10 말)** | Phase B 완료 | 1,370pt 완료, 프로덕션 배포 |

---

## 🚀 다음 단계

1. **즉시 (이번 주)**
   - [ ] 팀 구성 최종 확정
   - [ ] 개발 환경 세팅
   - [ ] GitHub 저장소 생성

2. **W1 시작**
   - [ ] 자세한 API 명세 작성 (OpenAPI/Swagger)
   - [ ] 데이터베이스 ER 다이어그램 설계
   - [ ] Figma UI/UX 디자인 시작

3. **Week 1-2**
   - [ ] Auth Service 구현 시작
   - [ ] 3개 웹앱 프로젝트 생성
   - [ ] CI/CD 파이프라인 구축

---

**Document Status**: Final v5 ✅
**Last Updated**: 2026-05-06
**Total Epics**: 21 | **Total Stories**: 180+ | **Total Points**: 1,670
