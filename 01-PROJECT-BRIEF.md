# ElSpa Manager - Project Brief
## BMAD Phase 1: Analysis

**문서 작성일:** 2026-05-30  
**담당자:** Analyst (Mary)  
**상태:** ✅ 완료

---

## 1. 프로젝트 개요

### 1.1 프로젝트명
**ElSpa Manager** - 마사지 샵 통합 관리 시스템

### 1.2 프로젝트 설명
마사지 샵의 운영을 효율적으로 관리하기 위한 통합 플랫폼.
- 🧖 테라피스트 예약 관리
- 💰 급여 정산 자동화
- 📊 실시간 모니터링
- 👥 고객/관리자 포털

### 1.3 핵심 가치 제안
| 이해관계자 | 문제점 | 해결책 |
|-----------|--------|--------|
| **관리자** | 수동 급여 정산, 예약 관리 번거움 | 자동화된 Payroll, 예약 시스템 |
| **테라피스트** | 예약 정보 검색 어려움 | Google Sheets 실시간 동기화 |
| **고객** | 예약 창구 단일화 | 통합 Customer Portal |

---

## 2. 범위 (Scope)

### 2.1 포함되는 것 (In Scope)
✅ Admin Dashboard - 관리자 포털
✅ Therapist Portal - 테라피스트 포털
✅ Customer Portal - 고객 포털
✅ Monitor Dashboard - 실시간 모니터링
✅ Payroll System - 급여 정산 시스템
✅ Booking System - 예약 관리
✅ Google Sheets Integration - 테라피스트 예약정보 동기화

### 2.2 제외되는 것 (Out of Scope)
❌ 모바일 앱 (웹만)
❌ 결제 게이트웨이 (향후)
❌ 다국어 지원 (한국어만)
❌ 오프라인 모드

---

## 3. 사용자 페르소나

### 3.1 Admin (관리자)
- **역할:** 시스템 운영, 급여 정산, 통계 분석
- **기술 수준:** 중상
- **주요 작업:** 예약 관리, 급여 계산, 데이터 내보내기

### 3.2 Therapist (테라피스트)
- **역할:** 서비스 제공, 예약 관리
- **기술 수준:** 초중
- **주요 작업:** 자신의 예약 확인, Google Sheet 업데이트

### 3.3 Customer (고객)
- **역할:** 서비스 예약
- **기술 수준:** 초
- **주요 작업:** 예약 신청, 예약 조회, 취소

### 3.4 Monitor (모니터)
- **역할:** 실시간 상태 감시 (관리자 권한)
- **기술 수준:** 중
- **주요 작업:** 침대 상태, 예약 상태, 테라피스트 상태 실시간 확인

---

## 4. 기술 스택 (Proposed)

### 4.1 Frontend
```
Framework: Next.js 16.2.4
UI Library: React 19
State Management: Zustand 5
Styling: Tailwind CSS 4
Charts: Recharts
Deployment: Cloudflare Pages
```

### 4.2 Backend
```
Framework: FastAPI (Python)
Database: Supabase (PostgreSQL)
WebSocket: FastAPI WebSocket
Google Integration: Google Sheets API
Deployment: Vercel Serverless Functions
```

### 4.3 Infrastructure
```
Database: Supabase (PostgreSQL)
Storage: Google Drive (via Google Sheets)
Hosting: Cloudflare Pages (FE) + Vercel (BE)
Analytics: Vercel Analytics + Web Analytics
```

---

## 5. 핵심 기능 (Features)

### 5.1 Payroll System (급여 정산)
- 일급 / 월급 계산
- 보너스 관리
- 세금 공제
- 정산 내역 조회

### 5.2 Booking System (예약 관리)
- 예약 신청/취소
- 테라피스트 배정
- 서비스 선택
- 예약 시간 관리

### 5.3 Google Sheets Integration (테라피스트 예약정보)
- 테라피스트 예약 정보 실시간 동기화
- Google Sheet 자동 업데이트
- 양방향 동기화 (Sheet → DB → Sheet)

### 5.4 Monitor Dashboard (실시간 모니터링)
- 침대 상태 (Available / Occupied / Cleaning)
- 예약 진행률
- 테라피스트 체크인/체크아웃
- 실시간 WebSocket 업데이트

### 5.5 Admin Dashboard (관리자 포털)
- 통계 및 분석
- 사용자 관리
- 급여 정산 관리
- 시스템 설정

---

## 6. 데이터 모델 (Conceptual)

### 6.1 핵심 엔티티
```
Users (사용자)
├── id
├── role (admin, therapist, customer, monitor)
├── name
├── email
└── phone

Therapists (테라피스트)
├── id
├── user_id (FK: Users)
├── bank_account
├── hourly_rate
└── specialization

Bookings (예약)
├── id
├── customer_id (FK: Users)
├── therapist_id (FK: Therapists)
├── service_id
├── start_time
├── end_time
└── status (pending, confirmed, completed, cancelled)

Payroll (급여)
├── id
├── therapist_id (FK: Therapists)
├── period (YYYY-MM)
├── total_hours
├── gross_salary
├── deductions
└── net_salary

GoogleSheetSync (동기화 로그)
├── id
├── therapist_id
├── booking_id
├── status (synced, pending, failed)
└── last_sync_at
```

---

## 7. 제약 조건 (Constraints)

### 7.1 기술적 제약
- Vercel Serverless Functions: 메모리 1GB, 실행시간 60초
- Supabase: 무료 tier 또는 유료 플랜 선택 필요
- Google Sheets API: 요청 한도 제한 (QPS 100)

### 7.2 비즈니스 제약
- 한국어만 지원
- 웹 기반만 (모바일 앱 X)
- 초기 배포: 1개 매장 기준

### 7.3 데이터 제약
- 예약 데이터: Supabase에만 저장
- Google Sheet: 읽기/쓰기 권한 필요
- 개인정보: GDPR 고려 (한국 개인정보보호법)

---

## 8. 성공 지표 (Success Criteria)

| 지표 | 목표 | 측정 방법 |
|------|------|---------|
| 시스템 가용성 | 99.9% | Vercel Analytics |
| 페이지 로딩 속도 | < 2초 | Lighthouse |
| Google Sheets 동기화 | < 10초 | Sync 로그 |
| 사용자 만족도 | > 4.0/5.0 | NPS 설문 |
| 급여 정산 정확도 | 100% | 감사 로그 |

---

## 9. 위험 요인 (Risks)

| 위험 | 가능성 | 영향 | 대책 |
|------|--------|------|------|
| Google Sheets API 한도 초과 | 중 | 높음 | 배치 처리, 캐싱 |
| Vercel Function 시간 초과 | 낮음 | 높음 | 비동기 처리, 큐 도입 |
| Supabase 다운타임 | 낮음 | 높음 | 백업, 모니터링 |
| 데이터 동기화 불일치 | 중 | 중 | 트랜잭션, 로깅 |

---

## 10. 타임라인 & 마일스톤

| 마일스톤 | 예상 일정 | 산출물 |
|---------|---------|-------|
| Phase 1: Analysis ✅ | 2026-05-30 | Project Brief |
| Phase 2: Planning | 2026-05-31 ~ 06-02 | PRD, UX Spec |
| Phase 3: Solutioning | 2026-06-03 ~ 06-05 | Architecture, Stories |
| Phase 4: Implementation | 2026-06-06 ~ 06-30 | Source Code, Tests |
| **MVP 배포** | **2026-06-30** | **Cloudflare + Vercel** |

---

## 11. 다음 단계

### Phase 2: Planning 준비
- ✅ PRD (Product Requirements Document) 작성
- ✅ UX Specification (화면 설계)
- ✅ User Stories 초안 작성

### Approval Gate
**이 Project Brief를 승인하시겠습니까?**
- [ ] 승인 (Phase 2 진행)
- [ ] 수정 요청 (명시)

---

## 문서 정보

**버전:** v1.0  
**작성자:** Analyst (Mary)  
**검토자:** (대기 중)  
**승인자:** (대기 중)  
**마지막 수정:** 2026-05-30 00:00 KST
