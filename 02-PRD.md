# ElSpa Manager - Product Requirements Document (PRD)
## BMAD Phase 2: Planning

**문서 작성일:** 2026-05-30  
**담당자:** PM (John)  
**상태:** ✅ 완료

---

## 1. Executive Summary

ElSpa Manager는 마사지 샵의 **예약**, **급여 정산**, **모니터링**을 통합으로 관리하는 시스템입니다.

**핵심 가치:**
- 📊 자동화된 급여 정산 (정확도 100%)
- 📅 중앙집중식 예약 관리
- 📱 Google Sheets 실시간 동기화
- 🔴 실시간 모니터링 대시보드

---

## 2. 사용자 요구사항 (User Requirements)

### 2.1 Admin (관리자)

**FR-ADMIN-001: 대시보드 조회**
- 전일 예약 건수, 수익, 테라피스트 평가 한눈에 보기
- 실시간 침대 상태 모니터링
- 예상 완료: 2026-06-10

**FR-ADMIN-002: 급여 정산**
- 월별 급여 자동 계산
- 손/초과근무 수당 적용
- 13개월 보너스 중복 방지
- 정산 내역 CSV 다운로드
- 예상 완료: 2026-06-20

**FR-ADMIN-003: 예약 관리**
- 모든 예약 조회 및 수정
- 테라피스트 배정 자동화
- 예약 취소/환불 처리
- 예상 완료: 2026-06-08

**FR-ADMIN-004: 사용자 관리**
- 테라피스트 추가/편집/삭제
- 권한 설정
- 예상 완료: 2026-06-15

---

### 2.2 Therapist (테라피스트)

**FR-THERAPIST-001: 나의 예약 조회**
- 오늘/이번 주/이번 달 예약 조회
- 고객 정보 (연락처, 요청사항)
- 예상 완료: 2026-06-05

**FR-THERAPIST-002: Google Sheets 동기화**
- 예약 정보 자동 저장 (테라피스트 이름, 고객, 시간, 서비스)
- 수동 갱신 버튼
- 실시간 업데이트 (< 10초)
- 예상 완료: 2026-06-10

**FR-THERAPIST-003: 근무 기록**
- 체크인/체크아웃
- 일일 근무시간 자동 계산
- 예상 완료: 2026-06-12

---

### 2.3 Customer (고객)

**FR-CUSTOMER-001: 예약 신청**
- 테라피스트 선택
- 서비스 선택 (마사지 종류, 시간)
- 예약 날짜/시간 선택
- 예상 완료: 2026-06-07

**FR-CUSTOMER-002: 예약 조회**
- 나의 예약 목록
- 예약 상태 (예정, 확정, 완료, 취소)
- 예상 완료: 2026-06-06

**FR-CUSTOMER-003: 예약 취소**
- 취소 신청
- 환불 정책 안내
- 예상 완료: 2026-06-09

---

### 2.4 Monitor (실시간 모니터링)

**FR-MONITOR-001: 실시간 대시보드**
- 침대 상태 (사용 가능 / 사용 중 / 청소 중)
- 예약 진행률 (몇 % 진행)
- 테라피스트 상태 (근무중 / 휴무)
- WebSocket 실시간 업데이트
- 예상 완료: 2026-06-10

---

## 3. 기능 요구사항 상세 (Detailed Requirements)

### 3.1 Payroll System

**계산 공식:**
```
총급여 = (시간급 × 근무시간) + 수당 - 공제금액

수당:
- 초과근무: 시간급 × 1.5 (9시간 초과)
- 주휴수당: 월 1회 제공
- 13개월 보너스: 연 1회 (중복 방지)

공제:
- 4대보험 (고정)
- 소득세 (진행률 기반)
```

**승인 워크플로우:**
1. Admin이 월별 급여 생성
2. 초안 검토 및 수정
3. 최종 승인
4. Therapist에 알림 발송

---

### 3.2 Booking System

**예약 상태 흐름:**
```
pending (예약 신청)
    ↓
confirmed (Admin 확인)
    ↓
in_progress (서비스 시작)
    ↓
completed (서비스 완료)

또는 → cancelled (취소)
```

**규칙:**
- 같은 테라피스트는 중복 예약 불가
- 최소 예약 시간: 30분
- 최대 예약 시간: 3시간
- 취소 수수료: 24시간 전 무료, 이후 10%

---

### 3.3 Google Sheets Integration

**동기화 대상:**
```
Sheet 이름: "테라피스트 예약정보"

컬럼:
A: 테라피스트 이름
B: 고객 이름
C: 서비스 종류
D: 예약 시간 (HH:MM)
E: 예약 날짜 (YYYY-MM-DD)
F: 상태
```

**동기화 주기:**
- 예약 생성/수정/삭제 시 즉시 (< 10초)
- 실패 시 자동 재시도 (최대 3회)
- 동기화 로그 기록 (감사 추적)

---

### 3.4 Monitor Dashboard

**실시간 업데이트:**
- WebSocket 연결 (ws://api.elspa.com/ws/monitor)
- 메시지 타입: bed_status_changed, booking_added, therapist_checkin, therapist_checkout
- 연결 끊김 시 자동 재연결 (최대 5회)

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

| 요구사항 | 목표 | 우선순위 |
|---------|------|---------|
| 페이지 로딩 속도 | < 2초 | 높음 |
| API 응답시간 | < 500ms | 높음 |
| 시스템 가용성 | 99.9% | 높음 |
| Google Sheets 동기화 지연 | < 10초 | 중 |
| 보안 (HTTPS, JWT) | 필수 | 높음 |
| 데이터 백업 | 일 1회 | 중 |
| 에러 로깅 | 모든 요청 | 중 |

---

## 5. 페이지 구조

### 5.1 Admin Dashboard
```
/admin
├── /dashboard (대시보드)
├── /payroll (급여 정산)
│   ├── /list (정산 목록)
│   ├── /detail/:id (정산 상세)
│   └── /generate (새 정산 생성)
├── /bookings (예약 관리)
│   ├── /calendar (달력 보기)
│   ├── /list (리스트 보기)
│   └── /detail/:id (예약 상세)
├── /therapists (테라피스트 관리)
│   ├── /list (테라피스트 목록)
│   ├── /detail/:id (상세 정보)
│   └── /add (추가)
└── /monitor (실시간 모니터링)
    ├── /beds (침대 상태)
    ├── /timeline (타임라인)
    └── /stats (통계)
```

### 5.2 Therapist Portal
```
/therapist
├── /dashboard (대시보드)
├── /bookings (나의 예약)
│   ├── /today (오늘)
│   ├── /week (이번 주)
│   └── /month (이번 달)
└── /google-sheets (Google Sheets 동기화)
    ├── /status (동기화 상태)
    └── /sync (수동 동기화)
```

### 5.3 Customer Portal
```
/customer
├── /dashboard (대시보드)
├── /booking (예약)
│   ├── /new (새 예약)
│   ├── /list (내 예약)
│   └── /detail/:id (상세)
└── /account (계정)
```

### 5.4 Monitor Dashboard
```
/monitor
├── /beds (침대 상태)
├── /timeline (실시간 타임라인)
└── /stats (통계)
```

---

## 6. 데이터 플로우

### 6.1 Booking → Google Sheets 흐름
```
Customer/Admin이 예약 생성
    ↓
FastAPI /api/bookings POST
    ↓
Supabase에 저장
    ↓
Google Sheets API 호출
    ↓
테라피스트 Sheet에 행 추가
    ↓
테라피스트가 확인
```

### 6.2 Payroll 계산 흐름
```
Admin이 월별 정산 생성
    ↓
FastAPI /api/payroll/generate POST
    ↓
Supabase에서 테라피스트별 근무시간 조회
    ↓
급여 공식 적용 계산
    ↓
결과 저장 + CSV 생성
    ↓
Admin 다운로드
```

---

## 7. API 엔드포인트 (Backend)

### 7.1 Bookings API
```
POST   /api/bookings              - 예약 생성
GET    /api/bookings              - 예약 목록 조회
GET    /api/bookings/{id}         - 예약 상세
PATCH  /api/bookings/{id}         - 예약 수정
DELETE /api/bookings/{id}         - 예약 취소
```

### 7.2 Payroll API
```
POST   /api/payroll/generate      - 월별 급여 생성
GET    /api/payroll               - 정산 목록
GET    /api/payroll/{id}          - 정산 상세
PATCH  /api/payroll/{id}          - 정산 수정
GET    /api/payroll/{id}/export   - CSV 다운로드
```

### 7.3 Google Sheets Sync API
```
POST   /api/google-sheets/sync    - 수동 동기화
GET    /api/google-sheets/status  - 동기화 상태
GET    /api/google-sheets/logs    - 동기화 로그
```

### 7.4 Monitor WebSocket
```
WS     /ws/monitor                - 실시간 모니터링 연결
```

---

## 8. 보안 요구사항

- ✅ JWT 토큰 기반 인증
- ✅ Role-based Access Control (RBAC)
- ✅ HTTPS 암호화
- ✅ API Rate Limiting (100 req/sec)
- ✅ CORS 설정 (elspa.pages.dev)
- ✅ SQL Injection 방지 (Prepared Statements)
- ✅ XSS 방지 (React escaping)
- ✅ CSRF 방지 (CSRF Token)

---

## 9. 승인 게이트

**이 PRD를 승인하시겠습니까?**
- [ ] 승인 (Phase 3 진행)
- [ ] 수정 요청 (명시)

---

## 문서 정보

**버전:** v1.0  
**작성자:** PM (John)  
**검토자:** (대기 중)  
**승인자:** (대기 중)  
**마지막 수정:** 2026-05-30 00:00 KST
