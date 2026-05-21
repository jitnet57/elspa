# ElSpa Payroll API Reference

## Overview

24개 엔드포인트를 통한 완전한 급여 정산 시스템 API

## Base URL
- Development: `http://localhost:8000`
- Production: `https://api.elspa.app`

## Endpoints

### 직원 관리 (5개)
- `POST /api/payroll/employees` - 직원 등록
- `GET /api/payroll/employees` - 직원 목록
- `GET /api/payroll/employees/{id}` - 직원 상세
- `PUT /api/payroll/employees/{id}` - 직원 수정
- `DELETE /api/payroll/employees/{id}` - 직원 삭제

### 선지급 관리 (3개)
- `POST /api/payroll/cash-advance` - CA 신청
- `GET /api/payroll/cash-advance` - CA 목록
- `PUT /api/payroll/cash-advance/{id}` - CA 상태 변경 (승인/거절)

### 출퇴근 관리 (3개)
- `POST /api/payroll/attendance` - 출퇴근 기록
- `GET /api/payroll/attendance` - 기록 조회
- `PUT /api/payroll/attendance/{id}` - 기록 수정

### 공휴일 관리 (3개)
- `POST /api/payroll/holidays` - 공휴일 등록
- `GET /api/payroll/holidays` - 공휴일 목록
- `DELETE /api/payroll/holidays/{id}` - 공휴일 삭제

### 정산 기간 (4개)
- `POST /api/payroll/periods` - 정산 기간 생성
- `GET /api/payroll/periods` - 기간 목록
- `GET /api/payroll/periods/{id}` - 기간 상세
- `POST /api/payroll/periods/{id}/approve` - 정산 승인

### 정산 결과 (3개)
- `POST /api/payroll/periods/{id}/calculate` - 급여 계산
- `GET /api/payroll/records` - 결과 목록
- `GET /api/payroll/records/{id}` - 결과 상세

## 계산 규칙

### 수입 항목
| 항목 | 계산식 | 대상 |
|------|--------|------|
| 기본급 | base_salary | 전체 |
| 커미션 | session_count * 100 | therapist, nail |
| 초과근무 | (OT분/60)*70 Peso | 40분 이상 |
| 공휴일가산 | daily_rate * 배수 | 국가(2.0x), 특정(1.3x) |
| 식대 | 200 Peso | driver (격주) |

### 차감 항목
| 항목 | 계산식 | 조건 |
|------|--------|------|
| 지각 | (분-9)*10 Peso | 10분 초과 |
| 결근 | base_salary/15*일수 | manager만 |
| SSS | 0 | TBD |
| CA | approved 합계 | 승인된 것만 |
| 보건소검사 | 0 | therapist 분기별 |
| 13개월보너스 | 0 | TBD |

## 직원 유형별 구조

| 유형 | 지급주기 | 구성 |
|------|---------|------|
| therapist | 주간 | 기본급 + 커미션 |
| nail | 주간 | 기본급 + 커미션 |
| driver | 격주 | 기본급 + 식대 |
| maintenance | 격주 | 기본급 |
| hollys | 격주 | 기본급 |
| manager | 격주 | 기본급 |

## 상태 전이

### PayrollPeriod
```
draft → approved → paid
```

### CashAdvance
```
pending → approved → settled
     ↓
  rejected
```

### PayrollRecord
```
draft → approved → paid
```

## 오류 코드

| 코드 | 설명 |
|------|------|
| 400 | 유효하지 않은 입력값 |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 상태 전이 불가 |
| 500 | 서버 오류 |
