#!/usr/bin/env python3
"""
ElSpa 급여 정산 시스템 — BMAD 템플릿 기반 빠른 생성
(API 키 미설정 시 템플릿으로 자동 생성)
"""

import json
from datetime import datetime
from pathlib import Path


def generate_analyst_output():
    """Phase 1: Analyst — 비즈니스 로직 명세서"""
    return """# ElSpa 급여 정산 시스템 — 비즈니스 로직 명세서

## 1. 직원 분류 & 지급 주기

### White (정직원)
- **직종**: Manager
- **지급 주기**: 2주급 (격주 금요일)
- **급여 구조**: 기본급 (고정)
- **특징**: OT 가능, 결근 시 급여/15 일할 단가 차감

### Blue (유지보수직)
- **직종**: Maintenance, Driver, Hollys Coffee Staffs
- **지급 주기**: 2주급 (격주 금요일)
- **급여 구조**: 기본급 (고정)
- **특징**: OT 가능, Driver는 2주당 식대 200 Peso 추가

### Commission (커미션직)
- **직종**: Therapist, Nail Shop Staffs
- **지급 주기**: 1주급 (매주 일요일)
- **급여 구조**: 기본급 + 커미션
- **특징**: 세션 수 기반 커미션, 출석 필수

---

## 2. 차감 항목 상세

| # | 항목 | 대상 | 계산 방식 | 우선순위 |
|---|------|------|---------|--------|
| 1 | SSS 회사 선지급 | 전체 | 고정액 차감 | P1 |
| 2 | CA (Cash Advance) | 전체 | 개인별 입력 금액 차감 | P1 |
| 3 | 13개월 보너스 선지급 | 전체 | 선지급액 차감 | P1 |
| 4 | 보건소 검사비 | Therapist | 분기별(Q1,Q2,Q3,Q4) 차감 | P2 |
| 5 | 지각 패널티 | 전체 | 10분 초과부터 1분당 10 Peso | P1 |
| 6 | 결근 | Manager | 13일 미만 출근 → 급여/15 = 1일 금액 차감 | P2 |

### 지각 계산 엣지케이스
- 0~9분: 정상 (차감 없음)
- 10분: 100 Peso 차감
- 11분: 110 Peso 차감
- 30분: 300 Peso 차감
- 60분 이상: 결근 처리

---

## 3. 추가 지급 항목 상세

| # | 항목 | 대상 | 계산 방식 | 우선순위 |
|---|------|------|---------|--------|
| 1 | 드라이버 식대 | Driver | 2주당 일괄 200 Peso | P1 |
| 2 | 초과근무 (OT) | White/Blue만 | 40분 이상 시 1시간당 70 Peso | P1 |
| 3 | 국가 공휴일 가산 | 전체 | 200% 지급 | P1 |
| 4 | 특정 공휴일 가산 | 전체 | 130% 지급 | P1 |

### OT 계산 엣지케이스
- 0~39분: OT 없음 (0 Peso)
- 40~60분: 1시간 OT 로 계산 (70 Peso)
- 61~120분: 2시간 OT로 계산 (140 Peso)
- 분단위: 올림 처리 (45분 = 1시간)

### 공휴일 공식
- **국가 공휴일**: 일일 기본급의 200%
  - 예: 5,000 Peso 일급 × 200% = 10,000 Peso
- **특정 공휴일**: 일일 기본급의 130%
  - 예: 5,000 Peso 일급 × 130% = 6,500 Peso

---

## 4. 정산 공식

```
=== 커미션직 (Therapist/Nail, 주급) ===
기본급 A
+ 커미션 B (세션 수 × 세션 단가)
+ 공휴일 보너스 C
+ 초과근무 D
- SSS 선지급
- CA
- 13개월 선지급
- 보건소 검사비
- 지각 패널티
---
= 순지급액

=== 정직원 (Manager/Maintenance/Driver/Hollys, 격주급) ===
기본급 A
+ 초과근무 B
+ 드라이버 식대 C (Driver만)
+ 공휴일 보너스 D
- SSS 선지급
- CA
- 13개월 선지급
- 지각 패널티
- 결근 차감 (Manager만, 급여/15)
---
= 순지급액
```

---

## 5. 필리핀 공휴일 목록 (2026)

### 국가 공휴일 (200%)
- 2026-01-01: 새해 첫날
- 2026-02-10: EDSA 혁명 기념일
- 2026-02-25: EDSA 혁명 기념일 (대체공휴일)
- 2026-03-28: 성 토마스 주일
- 2026-03-29: 부활절 일요일
- 2026-04-09: 아라우 아니베르사리오 데 필리핀 혁명
- 2026-06-12: 필리핀 독립 기념일
- 2026-08-21: 니노이 아키노 기념일
- 2026-11-01: 만성절
- 2026-11-30: 보니파시오 날
- 2026-12-08: 성모 마리아 무염시태
- 2026-12-25: 성탄절
- 2026-12-30: 리잘 기념일 (대체)

### 특정 공휴일 (130%)
- 2026-02-09: 마닐라 해방 기념일 (특정)
- 2026-03-28: 성 토마스 주일 (특정)
- 2026-12-08: 성모 마리아 무염시태 (특정)

---

## 6. 엣지케이스 정리

1. **공휴일 + OT 중복**
   - 처리: 기본급 계산에 공휴일 배수(200%) 적용 후, OT 가산
   - 예: 5,000 × 200% + (30분 OT 70Peso)

2. **결근 + 공휴일**
   - 처리: 결근은 무조건 차감 (공휴일 상관없음)

3. **음수 급여**
   - 처리: 차감이 지급액을 초과하면 0으로 처리, 다음 기수에 이월

4. **정산 기간 중 채용/퇴직**
   - 처리: 일할 기준으로 계산 (기간 일수로 나누어 단일 계산)

5. **CA 승인 안 됨**
   - 처리: 미승인 CA는 정산 대상 제외

---

## 7. 데이터 검증 규칙

- clock_in < clock_out (퇴근이 출근보다 나중이어야 함)
- overtime_minutes >= 0 (음수 불가)
- amount >= 0 (금액은 0 이상)
- employee_type in [therapist, nail, driver, maintenance, hollys, manager]
- pay_group in [weekly, biweekly]
"""


def generate_pm_output():
    """Phase 2: PM — PRD 및 기능 명세서"""
    return """# ElSpa 급여 정산 시스템 — PRD & 기능 명세서

## 1. 개요

- **프로젝트명**: ElSpa 급여 정산 자동화 시스템 (Payroll Settlement)
- **목표**: 필리핀 필리핀 노동법 준수하는 멀티 직종 급여 정산 자동화
- **범위**: 관리자 대시보드 + API 기반 자동 계산
- **기간**: MVP 1주 + Phase 2 1주

---

## 2. 핵심 기능 (MVP)

### 2-1. 직원 마스터 관리
- **화면**: `/admin/payroll/employees/`
- **기능**:
  - 직원 생성/수정/삭제
  - 직원 유형별 필터링 (therapist, driver, manager 등)
  - 기본급·커미션률 입력
- **입력 필드**: 이름, 핸드폰, 직원유형, 기본급, 커미션율

### 2-2. Cash Advance (CA) 관리
- **화면**: `/admin/payroll/cash-advance/`
- **기능**:
  - CA 신청 등록
  - 승인/거절 처리
  - 정산 차감 자동 연결
- **입력 필드**: 신청자, 금액, 사유, 상태(pending/approved/rejected)

### 2-3. 출퇴근 기록 입력
- **화면**: `/admin/payroll/attendance/`
- **기능**:
  - 일일 출퇴근 시간 입력
  - 지각/OT 자동 계산
  - 공휴일 마킹
  - 결근 처리
- **입력 필드**: 날짜, 출근시간, 퇴근시간, 공휴일 유형

### 2-4. 공휴일 관리
- **화면**: `/admin/payroll/holidays/`
- **기능**:
  - 필리핀 국가 공휴일 등록 (200%)
  - 특정 공휴일 등록 (130%)
  - 캘린더 뷰로 시각화
- **입력 필드**: 날짜, 공휴일명, 유형(national/special)

### 2-5. 급여 정산 실행
- **화면**: `/admin/payroll/`
- **기능**:
  - 정산 기간 선택 (주간/격주)
  - "정산 계산" 버튼 클릭 → 급여 자동 계산
  - 계산 결과 프리뷰
- **액션**: POST /api/payroll/periods/{id}/calculate

### 2-6. 정산 결과 조회
- **화면**: `/admin/payroll/records/`
- **기능**:
  - 개인별 상세 정산서 조회
  - 차감/추가 항목 명세 표시
  - PDF 내보내기
  - 정산 승인/지급 처리
- **표시 항목**:
  - 기본급, 커미션, OT, 공휴일 보너스
  - SSS, CA, 13개월, 지각, 결근 차감
  - 순지급액

---

## 3. 필수 API 엔드포인트

```
=== PayrollPeriod (정산 기간) ===
POST   /api/payroll/periods              → 기간 생성
GET    /api/payroll/periods              → 기간 목록
GET    /api/payroll/periods/{id}         → 기간 상세
POST   /api/payroll/periods/{id}/calculate → 급여 계산 실행
POST   /api/payroll/periods/{id}/approve → 정산 승인

=== Employee (직원) ===
GET    /api/payroll/employees            → 직원 목록
POST   /api/payroll/employees            → 직원 생성
GET    /api/payroll/employees/{id}       → 직원 상세
PUT    /api/payroll/employees/{id}       → 직원 수정
DELETE /api/payroll/employees/{id}       → 직원 삭제

=== CashAdvance (CA) ===
POST   /api/payroll/cash-advance         → CA 신청
GET    /api/payroll/cash-advance         → CA 목록
GET    /api/payroll/cash-advance/{id}    → CA 상세
PUT    /api/payroll/cash-advance/{id}    → CA 상태 변경

=== AttendanceLog (출퇴근) ===
POST   /api/payroll/attendance           → 출퇴근 기록
GET    /api/payroll/attendance           → 출퇴근 목록
PUT    /api/payroll/attendance/{id}      → 출퇴근 수정

=== PhilippineHoliday (공휴일) ===
POST   /api/payroll/holidays             → 공휴일 등록
GET    /api/payroll/holidays             → 공휴일 목록
DELETE /api/payroll/holidays/{id}        → 공휴일 삭제

=== PayrollRecord (정산 결과) ===
GET    /api/payroll/records              → 정산 결과 목록
GET    /api/payroll/records/{id}         → 개인별 상세
GET    /api/payroll/records/{id}/export  → PDF 내보내기
```

---

## 4. 우선순위 (MoSCoW)

### MUST (MVP, 1주차)
- Employee CRUD
- CashAdvance 입력/승인
- AttendanceLog 입력
- PhilippineHoliday 관리
- 급여 계산 엔진
- PayrollRecord 생성 및 조회

### SHOULD (Phase 2, 2주차)
- PDF 정산서 생성/다운로드
- 13개월 보너스 모듈
- 보건소 검사비 분기별 자동 차감
- WhatsApp/카카오 정산서 발송

### COULD (Phase 3+)
- 급여 명세서 자동 이메일 발송
- 직원별 급여 히스토리 분석
- 공정성 대시보드 (직종별 평균 급여 비교)

---

## 5. 핵심 사용 시나리오

### Scenario 1: 주급 Therapist 정산
```
1. 마사지사 A의 기본급: 5,000 Peso
2. 이번 주 세션 수: 30개 → 커미션 3,000 Peso
3. 월요일 10분 지각 → 100 Peso 차감
4. SSS 선지급: 500 Peso 차감
5. CA 신청: 1,000 Peso (승인됨) → 1,000 Peso 차감
6. 일요일(공휴일) 근무 → 공휴일 가산 계산
---
결과: 5000 + 3000 + 공휴일 - 100 - 500 - 1000 = ...
```

### Scenario 2: 격주급 Manager 정산
```
1. 매니저 B의 기본급: 20,000 Peso
2. 2주 동안 3시간 OT → 210 Peso 추가
3. 2주 동안 1일 결근 → 20000/15 = 1,333.33 Peso 차감
4. SSS 선지급: 1,000 Peso 차감
5. 13개월 선지급: 2,000 Peso 차감
---
결과: 20000 + 210 - 1333.33 - 1000 - 2000 = ...
```

### Scenario 3: Driver 격주급 정산
```
1. 드라이버 C의 기본급: 12,000 Peso
2. 2주 식대: 200 Peso 추가
3. 1시간 20분 OT → 140 Peso 추가 (2시간 계산)
4. SSS: 600 Peso 차감
---
결과: 12000 + 200 + 140 - 600 = ...
```

---

## 6. 데이터 모델 요약

| 모델 | 목적 | 핵심 필드 |
|------|------|---------|
| Employee | 직원 마스터 | id, name, employee_type, base_salary, commission_rate |
| CashAdvance | CA 선지급 | id, employee_id, amount, status, settled_payroll_id |
| AttendanceLog | 출퇴근 기록 | id, employee_id, work_date, clock_in, clock_out, late_minutes, overtime_minutes |
| PayrollPeriod | 정산 기간 | id, period_start, period_end, pay_group, status |
| PayrollRecord | 정산 결과 | id, payroll_period_id, employee_id, base_amount, commission_amount, deductions, net_pay |
| PhilippineHoliday | 공휴일 | id, holiday_date, holiday_name, rate_multiplier |

---

## 7. 성공 조건

- [ ] 모든 API 엔드포인트 구현
- [ ] 정산 계산 정확도 100% (5개 샘플 케이스 검증)
- [ ] PDF 내보내기 가능
- [ ] TypeScript 타입 체크 통과
- [ ] FastAPI `npm run build` 성공
"""


def generate_ux_output():
    """Phase 3: UX — 화면 설계"""
    return """# ElSpa 급여 정산 시스템 — 화면 설계 & Wireframe

## 1. /admin/payroll/ — 메인 대시보드

```
┌─────────────────────────────────────────┐
│  📊 급여 정산 대시보드                     │
├─────────────────────────────────────────┤
│ [주간 정산] [격주 정산] [히스토리]         │
├─────────────────────────────────────────┤
│ 정산 기간 선택:                          │
│ ┌──────────┐  ┌──────────┐             │
│ │ 2026-05 │  │ 2026-06 │  [◀] [▶]    │
│ └──────────┘  └──────────┘             │
├─────────────────────────────────────────┤
│ ✓ 출퇴근 기록: 50명/50명 입력            │
│ ✓ CA 승인 대기: 3명                     │
│ ✓ 공휴일 지정: 국가공휴일 1개            │
├─────────────────────────────────────────┤
│                                         │
│ [정산 계산 시작] [결과 조회]             │
│                                         │
│ 최근 정산 기록:                         │
│ ┌────────────┬───────────┬──────────┐  │
│ │ 기간       │ 직원수     │ 상태     │  │
│ ├────────────┼───────────┼──────────┤  │
│ │ 2026-05-11 │ 30명      │ 완료 ✓   │  │
│ │ 2026-05-04 │ 30명      │ 완료 ✓   │  │
│ │ 2026-04-27 │ 28명      │ 완료 ✓   │  │
│ └────────────┴───────────┴──────────┘  │
└─────────────────────────────────────────┘
```

---

## 2. /admin/payroll/employees/ — 직원 마스터 관리

```
┌──────────────────────────────────────────────┐
│  👥 직원 관리                                 │
├──────────────────────────────────────────────┤
│ [신규 등록] [일괄 임포트]                     │
├──────────────────────────────────────────────┤
│ 직원 유형: [전체▼] 검색: [________]          │
├──────────────────────────────────────────────┤
│ ┌────────┬─────────────┬──────────┬─────┐  │
│ │ ID     │ 이름        │ 직종     │ 기본급│  │
│ ├────────┼─────────────┼──────────┼─────┤  │
│ │ T001   │ 마리아      │therapist │ 5000│  │
│ │ D001   │ 후안        │driver    │12000│  │
│ │ M001   │ 산토스      │manager   │20000│  │
│ │ H001   │ 로샤        │hollys    │ 9000│  │
│ │ ...    │ ...         │ ...      │ ... │  │
│ └────────┴─────────────┴──────────┴─────┘  │
│                                             │
│ [수정 D001] [삭제 D001]                     │
└──────────────────────────────────────────────┘

[수정 폼]
┌──────────────────────────────────┐
│ 직원 정보 수정                     │
├──────────────────────────────────┤
│ 이름: [산토스________]           │
│ 핸드폰: [09159876543]            │
│ 직원유형: [manager▼]             │
│ 기본급: [20000_________]         │
│ 커미션율(%): [___] (therapist용) │
│ 고용일: [2025-01-15]             │
│                                  │
│ [저장] [취소]                     │
└──────────────────────────────────┘
```

---

## 3. /admin/payroll/cash-advance/ — CA 관리

```
┌────────────────────────────────────────────┐
│  💵 Cash Advance (CA) 관리                   │
├────────────────────────────────────────────┤
│ [신규 CA 신청] [승인 대기: 5건]             │
├────────────────────────────────────────────┤
│ 상태: [전체▼] [pending] [approved] [rejected]
├────────────────────────────────────────────┤
│ ┌──────┬──────────┬────────┬────────┬──┐ │
│ │ ID   │ 신청자   │ 금액   │ 상태   │  │ │
│ ├──────┼──────────┼────────┼────────┤  │ │
│ │ CA001│ 마리아   │1500    │ pending│✓ │ │
│ │ CA002│ 후안     │2000    │pending │✓ │ │
│ │ CA003│ 로샤     │1000    │approved│  │ │
│ └──────┴──────────┴────────┴────────┴──┘ │
│                                          │
│ [승인 CA001] [거절 CA002]                 │
└────────────────────────────────────────────┘

[신규 CA 신청 폼]
┌──────────────────────────┐
│ CA 신청                   │
├──────────────────────────┤
│ 신청자: [마리아____]     │
│ 금액: [1500_______] Peso │
│ 사유: [휴가비___________]│
│ 승인자: [Admin___▼]     │
│                          │
│ [신청] [취소]            │
└──────────────────────────┘
```

---

## 4. /admin/payroll/attendance/ — 출퇴근 입력

```
┌─────────────────────────────────────────┐
│  🕐 출퇴근 관리                           │
├─────────────────────────────────────────┤
│ 날짜: [2026-05-20▼]  [◀ 어제] [내일 ▶]  │
├─────────────────────────────────────────┤
│ 직원: [마리아▼]  [일괄 입력]             │
├─────────────────────────────────────────┤
│ ┌────────┬──────┬──────┬───┬──┬────┐  │
│ │ 직원   │ 출근 │ 퇴근 │지각│OT│공휴│  │
│ ├────────┼──────┼──────┼───┼──┼────┤  │
│ │ 마리아 │07:45 │17:30 │0분│30│일반│  │
│ │ 후안   │08:15 │18:00 │15│45│일반│  │
│ │ 로샤   │08:00 │18:45 │0분│60│일반│  │
│ │ 산토스 │ ─    │ ─    │   │  │공휴│  │
│ │ ...    │...   │...   │...│..|..  │  │
│ └────────┴──────┴──────┴───┴──┴────┘  │
│                                       │
│ [출근시간] [퇴근시간] [지각] [공휴일 마크]
│ [저장]                                │
└─────────────────────────────────────────┘

[일일 입력 폼]
┌────────────────────────┐
│ 출퇴근 입력              │
├────────────────────────┤
│ 날짜: [2026-05-20]     │
│ 직원: [마리아____]     │
│ 출근: [07:45_____]     │
│ 퇴근: [17:30_____]     │
│ 지각분: [0분] (자동)    │
│ OT분: [30분] (자동)    │
│ 공휴일: [☐ 국가 ☐ 특정]│
│ 결근: [☐ 결근]        │
│                        │
│ [저장] [취소]          │
└────────────────────────┘
```

---

## 5. /admin/payroll/holidays/ — 공휴일 관리

```
┌──────────────────────────────────────────┐
│  🎉 공휴일 관리 (2026)                     │
├──────────────────────────────────────────┤
│ [공휴일 추가]                             │
├──────────────────────────────────────────┤
│  May         June        July             │
│ Su Mo Tu We  Su Mo Tu We  Su Mo Tu We    │
│           1           1  2  3  4         │
│ ...                                      │
│  3  4  5  6  4  5  6  7  5  6  7  8    │
│        🎉(특정)   🎉(국가)               │
│                                          │
├──────────────────────────────────────────┤
│ 공휴일 목록:                             │
│ ┌────────────┬──────────┬──────┐        │
│ │ 날짜       │ 공휴일명 │ 타입 │        │
│ ├────────────┼──────────┼──────┤        │
│ │ 2026-06-12 │ 독립기념 │국가 │        │
│ │ 2026-11-01 │ 만성절   │국가 │        │
│ │ 2026-08-21 │ 아키노   │특정 │        │
│ └────────────┴──────────┴──────┘        │
│                                         │
│ [수정] [삭제]                            │
└──────────────────────────────────────────┘

[공휴일 추가 폼]
┌──────────────────────────┐
│ 공휴일 등록                │
├──────────────────────────┤
│ 날짜: [2026-12-25_____] │
│ 공휴일명: [성탄절____]   │
│ 유형: [국가공휴일▼]     │
│   ☐ 국가 (200%)          │
│   ☐ 특정 (130%)          │
│                          │
│ [저장] [취소]            │
└──────────────────────────┘
```

---

## 6. /admin/payroll/records/ — 정산 결과 조회

```
┌──────────────────────────────────────────────┐
│  📋 정산 결과                                  │
├──────────────────────────────────────────────┤
│ 정산기간: [2026-05-11~05-17▼]               │
│ 직원: [마리아▼] 상태: [전체▼]               │
├──────────────────────────────────────────────┤
│ ┌──────┬──────┬──────┬──────┬─────┐        │
│ │ID    │이름  │기본급│차감 │순지급│        │
│ ├──────┼──────┼──────┼──────┼─────┤        │
│ │T001  │마리아│5000 │1600 │3400 │        │
│ │D001  │후안  │12000│2200 │9800 │        │
│ │M001  │산토스│20000│4000 │16000│        │
│ └──────┴──────┴──────┴──────┴─────┘        │
│                                            │
│ [상세 조회] [PDF 다운로드] [승인] [지급]   │
└──────────────────────────────────────────────┘

[개인별 상세 정산서]
┌────────────────────────────────────────┐
│ 마리아 (T001) 정산서 - 2026-05-11~17   │
├────────────────────────────────────────┤
│ 💰 수입                                 │
│   기본급:          5,000 Peso          │
│   커미션:          3,000 Peso          │
│   공휴일 보너스:   1,500 Peso          │
│   OT:               500 Peso          │
│  ────────────────────────────          │
│   소계:           10,000 Peso          │
│                                        │
│ 💳 차감                                 │
│   SSS 선지급:        500 Peso         │
│   CA 차감:         1,000 Peso         │
│   13개월 선지급:     500 Peso         │
│   지각(10분):        100 Peso         │
│  ────────────────────────────          │
│   소계:            2,100 Peso         │
│                                        │
│ 💵 순지급액:         7,900 Peso        │
│                                        │
│ [PDF] [승인] [지급완료]                 │
└────────────────────────────────────────┘
```

---

## 7. 색상 & 타이포그래피

- **메인 색상**: #00B66E (엘스파 그린)
- **보조 색상**: #F39C12 (주황), #E74C3C (빨강, 에러)
- **배경**: #F5F5F5 (밝은 회색)
- **텍스트**: #333333 (검정)
- **폰트**: Inter (헤더), System Font (본문)
- **반응형**: Mobile 우선, Tablet/Desktop 최적화

---

## 8. 접근성 (A11y)

- WCAG 2.1 Level AA 준수
- 모든 입력 필드에 라벨 제공
- 에러 메시지는 시각 + 텍스트로 표현
- 키보드 네비게이션 지원
- 색상만으로 정보 전달하지 않음 (아이콘, 텍스트 병행)
"""


def generate_architect_output():
    """Phase 4: Architect — 기술 설계"""
    return """# ElSpa 급여 정산 시스템 — 기술 설계 & DB 스키마

## 1. 아키텍처 개요

```
FastAPI 백엔드
├── app/
│   ├── models/
│   │   ├── employee.py
│   │   ├── cash_advance.py
│   │   ├── attendance_log.py
│   │   ├── payroll_period.py
│   │   ├── payroll_record.py
│   │   └── philippine_holiday.py
│   ├── routers/
│   │   └── payroll.py
│   ├── schemas/
│   │   └── payroll.py
│   └── services/
│       └── payroll_calculator.py

Next.js 프론트엔드
├── app/admin/payroll/
│   ├── page.tsx           (메인 대시보드)
│   ├── employees/page.tsx (직원 관리)
│   ├── cash-advance/page.tsx
│   ├── attendance/page.tsx
│   ├── holidays/page.tsx
│   └── records/page.tsx
├── components/payroll/
│   ├── PayrollDashboard.tsx
│   ├── EmployeeForm.tsx
│   ├── AttendanceInput.tsx
│   └── PayrollRecordDetail.tsx
└── lib/payroll.ts        (API 호출 유틸)
```

---

## 2. SQLAlchemy 모델 설계

### 2-1. Employee (직원 마스터)

필드:
- id: Integer, PK
- name: String(255), NOT NULL
- phone: String(20), NOT NULL
- employee_type: String(50), 값: therapist|nail|driver|maintenance|hollys|manager
- pay_group: String(50), 값: weekly|biweekly
- base_salary: Numeric(10,2), NOT NULL
- commission_rate: Numeric(5,2), DEFAULT 0 (therapist/nail용)
- hire_date: Date, NOT NULL
- is_active: Boolean, DEFAULT True
- created_at: DateTime, DEFAULT now()
- updated_at: DateTime, DEFAULT now()

관계:
- cash_advances (1:N)
- attendance_logs (1:N)
- payroll_records (1:N)

---

### 2-2. CashAdvance (CA 선지급)

필드:
- id: Integer, PK
- employee_id: Integer, FK(Employee.id)
- amount: Numeric(10,2), NOT NULL
- request_date: Date, NOT NULL
- reason: String(500)
- status: String(50), 값: pending|approved|rejected
- settled_payroll_id: Integer, FK(PayrollRecord.id), nullable
- created_at: DateTime
- updated_at: DateTime

---

### 2-3. AttendanceLog (출퇴근 기록)

필드:
- id: Integer, PK
- employee_id: Integer, FK(Employee.id)
- work_date: Date, NOT NULL
- clock_in: Time
- clock_out: Time
- late_minutes: Integer, DEFAULT 0 (자동 계산)
- overtime_minutes: Integer, DEFAULT 0 (자동 계산)
- is_absent: Boolean, DEFAULT False
- holiday_type: String(50), 값: none|national|special
- created_at: DateTime
- updated_at: DateTime

---

### 2-4. PayrollPeriod (정산 기간)

필드:
- id: Integer, PK
- period_start: Date, NOT NULL
- period_end: Date, NOT NULL
- pay_group: String(50), 값: weekly|biweekly
- status: String(50), 값: draft|approved|paid
- created_at: DateTime
- updated_at: DateTime

관계:
- payroll_records (1:N)

---

### 2-5. PayrollRecord (개인별 정산 결과)

필드:
- id: Integer, PK
- payroll_period_id: Integer, FK(PayrollPeriod.id)
- employee_id: Integer, FK(Employee.id)
- base_amount: Numeric(10,2)
- commission_amount: Numeric(10,2), DEFAULT 0
- overtime_amount: Numeric(10,2), DEFAULT 0
- holiday_bonus: Numeric(10,2), DEFAULT 0
- meal_allowance: Numeric(10,2), DEFAULT 0 (driver용)
- late_deduction: Numeric(10,2), DEFAULT 0
- absence_deduction: Numeric(10,2), DEFAULT 0
- sss_deduction: Numeric(10,2), DEFAULT 0
- ca_deduction: Numeric(10,2), DEFAULT 0
- health_check_deduction: Numeric(10,2), DEFAULT 0
- thirteenth_month_deduction: Numeric(10,2), DEFAULT 0
- gross_pay: Numeric(10,2) (계산 필드)
- total_deductions: Numeric(10,2) (계산 필드)
- net_pay: Numeric(10,2) (계산 필드)
- status: String(50), 값: draft|approved|paid
- notes: String(1000)
- created_at: DateTime
- updated_at: DateTime

---

### 2-6. PhilippineHoliday (공휴일)

필드:
- id: Integer, PK
- holiday_date: Date, NOT NULL, UNIQUE
- holiday_name: String(255), NOT NULL
- holiday_type: String(50), 값: national(200%)|special(130%)
- rate_multiplier: Numeric(3,2), 기본값: 2.0 또는 1.3
- created_at: DateTime
- updated_at: DateTime

---

## 3. 급여 계산 엔진 (calculate_payroll 함수)

```python
async def calculate_payroll(payroll_period_id: int) -> List[PayrollRecord]:
    \"\"\"
    정산 기간에 해당하는 모든 직원의 급여 계산

    단계:
    1. PayrollPeriod 조회
    2. 해당 기간의 모든 직원 조회 (pay_group 매칭)
    3. 각 직원별 계산:
       - base_amount = 기본급
       - commission_amount = 세션 수 × 세션 단가 (therapist/nail만)
       - overtime_amount = OT 분 계산
       - holiday_bonus = 공휴일 근무 시 계산
       - meal_allowance = driver 일괄 지급
       - 모든 차감 항목 계산
       - gross_pay = 모든 수입 합
       - total_deductions = 모든 차감 합
       - net_pay = gross_pay - total_deductions (최소 0)
    4. PayrollRecord 생성 (draft 상태)
    \"\"\"
    pass

def calculate_late_deduction(late_minutes: int) -> float:
    \"\"\"지각 차감 계산 (10분 초과부터 1분당 10 Peso)\"\"\"
    if late_minutes <= 9:
        return 0.0
    return (late_minutes - 9) * 10

def calculate_overtime_amount(overtime_minutes: int) -> float:
    \"\"\"OT 계산 (40분 이상 시 1시간당 70 Peso, 올림)\"\"\"
    if overtime_minutes < 40:
        return 0.0
    hours = (overtime_minutes + 59) // 60  # 올림
    return hours * 70

def calculate_holiday_bonus(
    employee_type: str,
    base_salary: float,
    work_date: date,
    holiday_type: str
) -> float:
    \"\"\"공휴일 가산 계산 (기본급 × 배수)\"\"\"
    if holiday_type == "none":
        return 0.0
    daily_rate = base_salary / 15
    multiplier = 2.0 if holiday_type == "national" else 1.3
    return daily_rate * multiplier
```

---

## 4. API 라우터 구조 (payroll.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

# PayrollPeriod
@router.post("/periods")
async def create_payroll_period(payload: PayrollPeriodCreate, db: Session = Depends(get_db)):
    pass

@router.get("/periods")
async def list_payroll_periods(db: Session = Depends(get_db)):
    pass

@router.post("/periods/{period_id}/calculate")
async def calculate_payroll(period_id: int, db: Session = Depends(get_db)):
    pass

@router.post("/periods/{period_id}/approve")
async def approve_payroll(period_id: int, db: Session = Depends(get_db)):
    pass

# Employee
@router.post("/employees")
@router.get("/employees")
@router.get("/employees/{employee_id}")
@router.put("/employees/{employee_id}")
@router.delete("/employees/{employee_id}")
async def employee_crud(...):
    pass

# CashAdvance
@router.post("/cash-advance")
@router.get("/cash-advance")
@router.put("/cash-advance/{ca_id}")
async def ca_crud(...):
    pass

# AttendanceLog
@router.post("/attendance")
@router.get("/attendance")
@router.put("/attendance/{log_id}")
async def attendance_crud(...):
    pass

# PhilippineHoliday
@router.post("/holidays")
@router.get("/holidays")
@router.delete("/holidays/{holiday_id}")
async def holiday_crud(...):
    pass

# PayrollRecord
@router.get("/records")
@router.get("/records/{record_id}")
@router.get("/records/{record_id}/export")  # PDF 내보내기
async def record_read(...):
    pass
```

---

## 5. 기존 모델과의 연동

| 기존 모델 | 연동 방식 |
|---------|---------|
| `Staff` | Employee FK로 연결 또는 `employee_id` 추가 |
| `Therapist` | Employee로 통합 (중복 제거) |
| `Attendance` | AttendanceLog로 확장 (late_minutes, overtime_minutes 추가) |
| `SssContribution` | PayrollRecord.sss_deduction 참조 |

---

## 6. 데이터베이스 마이그레이션 전략

### 단계 1: 신규 테이블 생성
- Employee (신규)
- CashAdvance (신규)
- AttendanceLog (신규)
- PayrollPeriod (신규)
- PayrollRecord (신규)
- PhilippineHoliday (신규)

### 단계 2: 기존 데이터 마이그레이션
```python
# Staff → Employee 마이그레이션
INSERT INTO employees (name, phone, employee_type, base_salary, hire_date)
SELECT name, phone, 'therapist', 5000, NOW() FROM staffs;
```

### 단계 3: 기존 라우터 업데이트
- `settlements.py` → `/api/payroll/records` 호출로 교체
- Mock 데이터 제거

---

## 7. 성능 최적화

- **DB 인덱스**:
  - Employee: (employee_type, is_active)
  - AttendanceLog: (employee_id, work_date)
  - PayrollRecord: (payroll_period_id, employee_id)
  - PhilippineHoliday: (holiday_date)

- **캐싱**:
  - 공휴일 목록 (한 번 로드 후 메모리 캐시)
  - Employee 기본급 (정산 기간 중 변경 금지)

- **배치 처리**:
  - calculate_payroll은 비동기 작업으로 별도 처리

---

## 8. 보안 & 검증

- **입력 검증**:
  - amount >= 0
  - clock_in < clock_out
  - period_start < period_end

- **접근 제어**:
  - /api/payroll/* 엔드포인트는 admin 권한만 접근

- **감사 로그**:
  - 모든 PayrollRecord 변경사항 기록
  - 사용자, 타임스탬프, 변경 전후 값 저장
"""


def generate_sm_output():
    """Phase 5: Scrum Master — 스프린트 계획"""
    return """{
  "sprint_name": "Payroll Settlement MVP - Sprint 1",
  "duration": "1주 (Mon-Fri)",
  "goal": "Employee/CashAdvance/AttendanceLog/Holiday 모델 + 계산 엔진 완성",

  "mvp_tasks": [
    {
      "task_id": "BE-001",
      "task_name": "Employee 모델 구현",
      "owner": "backend",
      "duration": "4 hours",
      "dependencies": [],
      "description": "SQLAlchemy Employee 모델 + migration",
      "status": "pending"
    },
    {
      "task_id": "BE-002",
      "task_name": "CashAdvance 모델 구현",
      "owner": "backend",
      "duration": "3 hours",
      "dependencies": ["BE-001"],
      "description": "CA 선지급 모델 + 상태 관리",
      "status": "pending"
    },
    {
      "task_id": "BE-003",
      "task_name": "AttendanceLog 모델 구현",
      "owner": "backend",
      "duration": "4 hours",
      "dependencies": ["BE-001"],
      "description": "출퇴근 기록 모델 + 자동 계산 (late, OT)",
      "status": "pending"
    },
    {
      "task_id": "BE-004",
      "task_name": "PayrollPeriod/PayrollRecord 모델",
      "owner": "backend",
      "duration": "3 hours",
      "dependencies": ["BE-001"],
      "description": "정산 기간 및 결과 모델",
      "status": "pending"
    },
    {
      "task_id": "BE-005",
      "task_name": "PhilippineHoliday 모델",
      "owner": "backend",
      "duration": "2 hours",
      "dependencies": [],
      "description": "공휴일 관리 모델 + 2026 데이터",
      "status": "pending"
    },
    {
      "task_id": "BE-006",
      "task_name": "급여 계산 엔진 구현",
      "owner": "backend",
      "duration": "8 hours",
      "dependencies": ["BE-001", "BE-003", "BE-004", "BE-005"],
      "description": "calculate_payroll 함수 + 모든 공식",
      "status": "pending"
    },
    {
      "task_id": "BE-007",
      "task_name": "Payroll API 라우터",
      "owner": "backend",
      "duration": "6 hours",
      "dependencies": ["BE-006"],
      "description": "/api/payroll/* 모든 CRUD 엔드포인트",
      "status": "pending"
    },
    {
      "task_id": "FE-001",
      "task_name": "/admin/payroll/ 대시보드",
      "owner": "frontend",
      "duration": "5 hours",
      "dependencies": ["BE-007"],
      "description": "메인 대시보드 UI + 정산 계산 버튼",
      "status": "pending"
    },
    {
      "task_id": "FE-002",
      "task_name": "/admin/payroll/employees/",
      "owner": "frontend",
      "duration": "5 hours",
      "dependencies": ["BE-007"],
      "description": "직원 마스터 CRUD UI",
      "status": "pending"
    },
    {
      "task_id": "FE-003",
      "task_name": "/admin/payroll/cash-advance/",
      "owner": "frontend",
      "duration": "4 hours",
      "dependencies": ["BE-007"],
      "description": "CA 관리 UI",
      "status": "pending"
    },
    {
      "task_id": "FE-004",
      "task_name": "/admin/payroll/attendance/",
      "owner": "frontend",
      "duration": "6 hours",
      "dependencies": ["BE-007"],
      "description": "출퇴근 입력 UI + 테이블",
      "status": "pending"
    },
    {
      "task_id": "FE-005",
      "task_name": "/admin/payroll/holidays/",
      "owner": "frontend",
      "duration": "4 hours",
      "dependencies": ["BE-007"],
      "description": "공휴일 관리 UI + 캘린더",
      "status": "pending"
    },
    {
      "task_id": "FE-006",
      "task_name": "/admin/payroll/records/",
      "owner": "frontend",
      "duration": "5 hours",
      "dependencies": ["BE-007"],
      "description": "정산 결과 조회 UI + 상세 정산서",
      "status": "pending"
    },
    {
      "task_id": "QA-001",
      "task_name": "계산 정확도 테스트",
      "owner": "qa",
      "duration": "4 hours",
      "dependencies": ["BE-006"],
      "description": "5개 샘플 케이스 수동 검증",
      "status": "pending"
    },
    {
      "task_id": "QA-002",
      "task_name": "엣지케이스 검증",
      "owner": "qa",
      "duration": "3 hours",
      "dependencies": ["BE-006"],
      "description": "OT 40분/39분, 지각 9분/11분 경계값",
      "status": "pending"
    }
  ],

  "parallel_tracks": [
    {
      "track": "Backend Development",
      "tasks": ["BE-001", "BE-002", "BE-003", "BE-004", "BE-005", "BE-006", "BE-007"],
      "estimated_hours": 30,
      "critical_path": "BE-001 → BE-003 → BE-006 → BE-007"
    },
    {
      "track": "Frontend Development",
      "tasks": ["FE-001", "FE-002", "FE-003", "FE-004", "FE-005", "FE-006"],
      "estimated_hours": 29,
      "dependency": "BE-007 must complete before FE tasks"
    },
    {
      "track": "QA & Testing",
      "tasks": ["QA-001", "QA-002"],
      "estimated_hours": 7,
      "dependency": "BE-006 must complete first"
    }
  ],

  "risks": [
    {
      "risk_id": "R-001",
      "risk": "Anthropic API 지연",
      "impact": "high",
      "probability": "medium",
      "mitigation": "캐싱 및 배치 처리로 API 호출 최소화"
    },
    {
      "risk_id": "R-002",
      "risk": "OT/공휴일 계산 복잡도",
      "impact": "high",
      "probability": "medium",
      "mitigation": "단위 테스트 충분히 작성, 샘플 케이스 미리 검증"
    },
    {
      "risk_id": "R-003",
      "risk": "기존 모델과 충돌",
      "impact": "medium",
      "probability": "low",
      "mitigation": "마이그레이션 스크립트 사전 테스트"
    }
  ],

  "success_criteria": [
    "모든 API 엔드포인트 구현 완료",
    "5개 샘플 케이스 정산 결과 100% 정확",
    "TypeScript 빌드 에러 0",
    "FastAPI 테스트 100% 통과",
    "프론트엔드 UI 반응형 동작 확인"
  ]
}"""


def main():
    """BMAD 템플릿 기반 결과물 생성"""
    output_dir = Path("e:/elspa/bmad_outputs")
    output_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 생성 및 저장
    outputs = {
        f"01_analyst_business_rules_{timestamp}.md": generate_analyst_output(),
        f"02_pm_prd_{timestamp}.md": generate_pm_output(),
        f"03_ux_screen_design_{timestamp}.md": generate_ux_output(),
        f"04_architect_tech_spec_{timestamp}.md": generate_architect_output(),
        f"05_sm_sprint_plan_{timestamp}.json": generate_sm_output(),
    }

    for filename, content in outputs.items():
        filepath = output_dir / filename
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ 저장: {filepath}")

    # 요약 리포트
    summary = f"""# ElSpa 급여 정산 시스템 — BMAD 템플릿 기반 결과

**생성 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 완료된 BMAD 단계

✅ Phase 1: Analyst — 비즈니스 로직 명세서
✅ Phase 2: PM — PRD 및 기능 명세서
✅ Phase 3: UX — 화면 설계 (Wireframe)
✅ Phase 4: Architect — 기술 설계 & DB 스키마
✅ Phase 5: Scrum Master — 스프린트 계획

## 생성된 산출물

1. **비즈니스 로직** — 직원 분류, 차감/추가 항목, 공휴일 규칙
2. **PRD** — 6개 관리자 화면, 필수 API 엔드포인트
3. **화면 설계** — 각 페이지의 상세 Wireframe
4. **기술 설계** — SQLAlchemy 모델 6개, 계산 엔진 설계
5. **스프린트 계획** — 15개 태스크, 59시간 예상 (Backend 30h + Frontend 29h)

## 다음 단계

**Phase 6: Dev (백엔드/프론트엔드)** — 코드 구현 시작
- Backend: `app/models/payroll.py` + `app/routers/payroll.py` 작성
- Frontend: 6개 페이지 컴포넌트 작성
- 동시 병렬 처리 가능

**Phase 7: QA** — 검증 및 테스트

## 예상 일정

- MVP 완성: 1주 (5 working days)
- Phase 2 (PDF, 13개월 보너스): 추가 1주

---

**주의**: 이 문서는 템플릿 기반 자동 생성되었습니다.
실제 구현 전에 비즈니스 로직 검증을 반드시 수행하세요.
"""

    summary_file = output_dir / f"BMAD_SUMMARY_{timestamp}.md"
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write(summary)
    print(f"✅ 저장: {summary_file}")

    print(f"\n📂 모든 결과물 저장 완료: {output_dir}")
    print("\n✨ BMAD 단계별 산출물:")
    for filename in outputs.keys():
        print(f"  - {filename}")


if __name__ == "__main__":
    main()
