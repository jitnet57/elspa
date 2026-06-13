# 🔐 ElSpa 관리자(admin) 라우트 경로 — 총 42개

> **배포:** 프론트엔드 = **Vercel** (프로젝트명 `elspa`)
> **기본 도메인(유력):** `https://elspa.vercel.app` — 실제 운영 도메인은 **Vercel 대시보드 → elspa → Domains** 에서 확인
> **사용법:** `https://<도메인>` + 아래 경로 (예: `https://elspa.vercel.app/admin/monitor` 식)
>
> 작성일: 2026-06-13 · 코드(`frontend/src/app/admin/**/page.tsx`) 기준 자동 추출

---

## 1) 예약 · 마사지 운영 (10)

| # | 경로 | 화면 설명 |
|---|------|----------|
| 1 | `/admin` | 관리자 메인 대시보드 |
| 2 | `/admin/massage` | 마사지 관리 |
| 3 | `/admin/book-massage` | 마사지 예약하기 |
| 4 | `/admin/therapist-schedule` | 일일 테라피스트 스케줄 |
| 5 | `/admin/therapists` | 테라피스트 목록·관리 |
| 6 | `/admin/therapist-booking-dashboard` | 테라피스트 예약 대시보드 |
| 7 | `/admin/matching` | 워크인 매칭 |
| 8 | `/admin/fairness-dashboard` | 공정성(배정) 대시보드 |
| 9 | `/admin/pickup-dispatch` | 픽업 배차 |
| 10 | `/admin/realtime-locations` | 실시간 위치 |

## 2) 정산 · 급여 (Payroll) (16)

| # | 경로 | 화면 설명 |
|---|------|----------|
| 11 | `/admin/monthly-settlement` | 월 정산 |
| 12 | `/admin/settlement-report` | 정산 보고서 |
| 13 | `/admin/settlement-init` | 정산 초기화 |
| 14 | `/admin/sss` | SSS(사회보장) |
| 15 | `/admin/commission-settings` | 수수료 설정 |
| 16 | `/admin/deductions` | 공제 |
| 17 | `/admin/guide-referral-fee` | 가이드 소개 수수료 |
| 18 | `/admin/payroll` | 급여 메인 |
| 19 | `/admin/payroll/employees` | 급여 - 직원 |
| 20 | `/admin/payroll/attendance` | 급여 - 출근 |
| 21 | `/admin/payroll/records` | 급여 - 기록 |
| 22 | `/admin/payroll/holidays` | 급여 - 휴일 |
| 23 | `/admin/payroll/cash-advance` | 급여 - 가불 |
| 24 | `/admin/payroll/analytics` | 급여 - 분석 |
| 25 | `/admin/payroll/settings` | 급여 - 설정 |
| 26 | `/admin/billing` | 청구/결제 |

## 3) 재무 · 경영 (6)

| # | 경로 | 화면 설명 |
|---|------|----------|
| 27 | `/admin/financial-dashboard` | 재무 대시보드 |
| 28 | `/admin/expense` | 지출 |
| 29 | `/admin/companies` | 거래 업체 |
| 30 | `/admin/guides` | 가이드 |
| 31 | `/admin/management` | 경영 관리 |
| 32 | `/admin/simulation` | 시뮬레이션 |

## 4) 데이터 · 시스템 (10)

| # | 경로 | 화면 설명 |
|---|------|----------|
| 33 | `/admin/policies` | 정책 |
| 34 | `/admin/settings` | 설정 |
| 35 | `/admin/settings/import` | 설정 - 가져오기 |
| 36 | `/admin/data-management` | 데이터 관리 |
| 37 | `/admin/excel-import` | 엑셀 임포트 |
| 38 | `/admin/test-data` | 테스트 데이터 |
| 39 | `/admin/audit-logs` | 감사 로그 |
| 40 | `/admin/change-logs` | 변경 로그 |
| 41 | `/admin/knowledge-network` | 지식 네트워크 |
| 42 | `/admin/knowledge-network-benchmark` | 지식 네트워크 벤치마크 |

---

## 📌 참고
- 이번에 수정한 **베드 모니터 ↔ 테라피스트 예약현황**은 admin이 아니라 **`/monitor`** 입니다.
  - `/monitor?tab=beds` 베드 모니터 · `/monitor?tab=schedule` 예약현황 · `/monitor?tab=booking` 예약 시트 · `/monitor?tab=attendance` 출근
- 실제 운영 도메인을 알려주시면 각 경로의 전체 URL을 만들어 드립니다.
