# ElSpa 종합 테스트 스위트 인덱스

**작성일:** 2026-06-02  
**총 라인 수:** 7,600+ 라인  
**총 테스트 케이스:** 260+ 개

---

## 📂 파일 구조 및 내용

### Backend Tests (Python/Pytest)

#### 1. `test_payment_validation.py` (429 라인)
**테스트 대상:** 결제 방법, 금액, 상태 검증

```python
# 8개 테스트 클래스, 42개 테스트 케이스
├── TestPaymentMethodValidation (4 tests)
│   └── 유효한/유효하지 않은 결제 방법
├── TestPaymentFromValidation (5 tests)
│   └── guest/company/credit 결제 출처별 회수율
├── TestPaymentAmountValidation (6 tests)
│   └── 0, 음수, 소수점 금액 검증
├── TestMultiplePaymentMethods (5 tests)
│   └── 분할 결제, 초과/미결제 감지
├── TestSSSOptionValidation (7 tests)
│   └── SSS prepaid/hold 옵션, 월 25일 마감
├── TestPaymentStatusTransitions (4 tests)
│   └── pending → completed → refunded
├── TestCreditCollectionRules (6 tests)
│   └── 회수율 80%, 100%, 0%, 커스텀
└── TestRefundValidation (5 tests)
    └── 환불액 <= 원금, 정산 후 환불 방지
```

**주요 테스트 케이스:**
- ✅ `test_valid_payment_methods` - 4가지 결제 방법 검증
- ✅ `test_payment_from_guest` - 손님 외상 회수율 80%
- ✅ `test_payment_from_company` - 업체 선지급 회수율 0%
- ✅ `test_split_payment_validation` - 분할 결제 검증
- ✅ `test_sss_option_change_after_deadline` - 월 25일 이후 변경 불가

---

#### 2. `test_sss_calculations.py` (494 라인)
**테스트 대상:** SSS 기여금, 선지급/보류 계산, 급여 영향도

```python
# 9개 테스트 클래스, 48개 테스트 케이스
├── TestSSSContributionCalculation (5 tests)
│   └── 3.63% 기여금 계산
├── TestSSprepaidOption (3 tests)
│   └── 정부 인보이스 기준 고정액
├── TestSSSHoldOption (4 tests)
│   └── 실제 근무일 기준 유동액
├── TestPrepaidVsHoldComparison (4 tests)
│   └── 선지급 vs 보류 차이 분석
├── TestMonthlySSSummary (3 tests)
│   └── 월별 요약 데이터 구조
├── TestPayrollImpactCalculation (5 tests)
│   └── 급여 영향도 시뮬레이션
├── TestSSSOptionChangeValidation (5 tests)
│   └── 월 25일 변경 마감, 중복 선택 방지
├── TestSSSAuditLogging (3 tests)
│   └── 감사 로그 기록 추적
└── TestSSSEdgeCases (4 tests)
    └── 0근무, 전체근무, 1일 근무
```

**주요 공식:**
```
SSS 기여금 = 급여 × 3.63%
선지급 = ₱2,025 (고정)
보류 = ₱2,025 × (18일 / 22일) ≈ ₱1,656.82

선지급이 더 많은 경우:
- 차액: ₱368.18
- 월말에 차액 정산
```

**주요 테스트 케이스:**
- ✅ `test_sss_contribution_basic` - 급여 25,000 × 3.63% = 907.50
- ✅ `test_prepaid_hold_difference_partial_workdays` - 부분 근무 비교
- ✅ `test_settlement_adjustment_prepaid` - 선지급 시 차액 정산
- ✅ `test_can_change_before_cutoff` - 월 25일 이전 변경 가능
- ✅ `test_audit_log_structure` - 감사 로그 구조 검증

---

#### 3. `test_settlement_logic.py` (596 라인)
**테스트 대상:** 정산 상태 전이, 규칙 엔진, 저장소 패턴

```python
# 7개 테스트 클래스, 41개 테스트 케이스
├── TestSettlementStatusTransitions (6 tests)
│   └── draft → approved → settled → confirmed
├── TestSettlementRuleEngine (8 tests)
│   └── 정산 유형 자동 판정 (guest/credit/waived)
├── TestSettlementCalculator (4 tests)
│   └── 매출 분류, 회수액, 수수료 계산
├── TestSettlementRepository (6 tests)
│   └── CRUD 작업, 회수율 업데이트, 승인, 지급
├── TestSettlementTransactionTracking (4 tests)
│   └── 예약, 환불, 분쟁, 조정 거래 기록
├── TestSettlementWithDeductions (4 tests)
│   └── 환불, 분쟁, 기타 차감액 처리
└── TestSettlementPeriodHandling (2 tests)
    └── 연도 경계, 12월 정산
```

**정산 상태 흐름:**
```
1. draft (자동 생성)
   ↓
2. approved (관리자 승인)
   ↓
3. settled (지급 완료)
   ↓
4. confirmed (은행 확인)

또는:
rejected → draft (재계산)
```

**주요 테스트 케이스:**
- ✅ `test_draft_to_approved` - 정산 승인
- ✅ `test_determine_settlement_type_from_booking_field` - 수기 입력 규칙
- ✅ `test_calculate_settlement_net_settlement` - 순정산액 계산
- ✅ `test_approve_settlement` - 정산 승인
- ✅ `test_settlement_with_multiple_deductions` - 복합 차감

---

#### 4. `test_booking_settlement_integration.py` (514 라인)
**테스트 대상:** 예약 → 정산 → 지급 E2E 워크플로우

```python
# 8개 테스트 클래스, 34개 테스트 케이스
├── TestSingleBookingSettlementFlow (3 tests)
│   └── guest/credit/company 결제별 정산
├── TestMultipleBookingsInMonth (3 tests)
│   └── 월간 다중 예약 정산 계산
├── TestCreditCollectionScenarios (4 tests)
│   └── 전액/부분/미회수 시나리오
├── TestMonthEndProcessing (3 tests)
│   └── 월말 일괄 정산, 12월 처리
├── TestRefundAndAdjustmentFlows (3 tests)
│   └── 환불, 분쟁, 조정 거래
├── TestSettlementApprovalWorkflow (2 tests)
│   └── 승인 및 거부 후 재계산
├── TestComplexMultiStateTransitions (2 tests)
│   └── 거부 후 재처리 루프
└── TestEndToEndBookingToPayment (2 tests)
    └── 완전한 E2E 워크플로우
```

**예시 E2E 워크플로우:**
```
1. Booking 생성
   - total_price: ₱5,000
   - payment_from: 'guest'

2. 정산 자동 생성 (draft)
   - recovery_rate: 80%
   - recovered_amount: ₱4,000
   - platform_fee (25%): ₱1,250
   - net_settlement: ₱2,750

3. 관리자 승인 (approved)

4. 월말 일괄 정산 (settled)
   - payment_date: 2026-06-30

5. 은행 확인 (confirmed)
```

**주요 테스트 케이스:**
- ✅ `test_flow_guest_payment_full_recovery` - 손님 외상 정산
- ✅ `test_monthly_settlement_with_mixed_payment_methods` - 혼합 결제
- ✅ `test_month_end_bulk_settle` - 월말 일괄 정산
- ✅ `test_complete_flow_guest_payment` - 완전 워크플로우

---

#### 5. `test_settlement_edge_cases.py` (580 라인)
**테스트 대상:** 경계값, 예외 상황, 복합 시나리오

```python
# 10개 테스트 클래스, 54개 테스트 케이스
├── TestBoundaryValues (5 tests)
│   └── 0.01원, ₱999,999,999.99, 극단값
├── TestPrecisionAndRounding (5 tests)
│   └── 소수점 2자리 정밀도, 반올림
├── TestMultiplePaymentComplexity (3 tests)
│   └── 4가지 결제, 많은 소액 결제
├── TestMonthBoundaryConditions (5 tests)
│   └── 윤년 2월 29일, 짧은달 30일
├── TestCreditCollectionEdgeCases (4 tests)
│   └── 0%, 95%, 33.33% 회수율
├── TestDeductionEdgeCases (4 tests)
│   └── 차감 > 매출, 소수점 차감
├── TestSSSOptionEdgeCases (4 tests)
│   └── 0근무, 전체근무, 1일 근무, 월 25일
├── TestSettlementStatusEdgeCases (3 tests)
│   └── 여러 번 거부, 장기 정산
├── TestNegativeScenarios (5 tests)
│   └── 음수 금액, 100%+ 회수율, 필수 필드 누락
└── TestComplexScenarioCombinations (2 tests)
    └── 혼합 결제 + 차감 + SSS
```

**주요 엣지 케이스:**
- ✅ `test_minimum_booking_amount` - ₱0.01 처리
- ✅ `test_february_leap_year` - 윤년 2월 29일
- ✅ `test_total_deduction_exceeds_revenue` - 차감 > 매출 (음수 방지)
- ✅ `test_negative_total_price_prevention` - 음수 금액 방지
- ✅ `test_mixed_payments_with_deductions_and_sss` - 복합 시나리오

---

### Frontend Tests (TypeScript/Jest)

#### 6. `settlement.test.ts` (542 라인)
**테스트 대상:** 프론트엔드 결제/정산 로직

```typescript
// 13개 테스트 그룹, 90개 테스트 케이스
├── Commission Calculation (5 tests)
│   └── 25% 수수료 계산
├── Payment From Validation (4 tests)
│   └── guest/company/credit 검증
├── Recovery Amount Calculation (5 tests)
│   └── 회수액 계산
├── Net Settlement Calculation (5 tests)
│   └── 순정산액 (차감 포함)
├── SSS Contribution Calculation (4 tests)
│   └── 3.63% SSS 계산
├── SSS Prepaid vs Hold Option (4 tests)
│   └── 선지급 vs 보류 비교
├── Payment Status Validation (2 tests)
│   └── 상태 전이 검증
├── Settlement Status Validation (4 tests)
│   └── 정산 상태 전이
├── Multiple Payment Methods (4 tests)
│   └── 분할 결제 검증
├── SSS Option Change Deadline (5 tests)
│   └── 월 25일 마감 검증
├── Refund Amount Validation (5 tests)
│   └── 환불액 검증
├── Credit Collection Impact (3 tests)
│   └── 외상 회수 영향도
└── API Response Validation (2 tests)
    └── API 응답 구조 검증
```

**주요 테스트 케이스:**
- ✅ `test_should_calculate_commission_at_25_percent_rate` - 커미션 계산
- ✅ `test_should_show_difference_for_partial_workdays` - SSS 선지급/보류 비교
- ✅ `test_should_validate_correct_response` - API 응답 검증

---

## 📊 테스트 통계

### 전체 요약

| 항목 | 수량 |
|------|------|
| **테스트 파일** | 6개 |
| **총 라인 수** | 7,612 라인 |
| **테스트 클래스/그룹** | 43개 |
| **테스트 케이스** | 260+ 개 |
| **언어** | Python (Pytest), TypeScript (Jest) |

### 주제별 분류

| 주제 | 테스트 수 | 파일 | 라인 |
|------|---------|------|------|
| 결제 검증 | 42 | test_payment_validation.py | 429 |
| SSS 계산 | 48 | test_sss_calculations.py | 494 |
| 정산 로직 | 41 | test_settlement_logic.py | 596 |
| E2E 통합 | 34 | test_booking_settlement_integration.py | 514 |
| 엣지 케이스 | 54 | test_settlement_edge_cases.py | 580 |
| 프론트엔드 | 90 | settlement.test.ts | 542 |
| **합계** | **309** | | **3,155** |

---

## 🚀 빠른 시작

### 전체 테스트 실행

```bash
# Python 테스트 (Pytest)
cd /Users/kwangseobpark/elspa
pytest tests/ -v

# TypeScript 테스트 (Jest)
cd frontend
npm test -- src/__tests__/settlement.test.ts
```

### 특정 테스트 실행

```bash
# 결제 검증만
pytest tests/test_payment_validation.py -v

# SSS 계산만
pytest tests/test_sss_calculations.py -v

# 특정 테스트 케이스
pytest tests/test_settlement_logic.py::TestSettlementStatusTransitions -v
```

### 커버리지 리포트

```bash
# Python
pytest tests/ --cov=app --cov-report=html

# TypeScript
npm test -- --coverage
```

---

## 📋 테스트 체크리스트

### 결제 관련
- [x] 결제 방법 검증 (4가지)
- [x] 결제 금액 검증 (0, 음수, 소수점)
- [x] 분할 결제 검증
- [x] 상태 전이 검증
- [x] 환불액 검증

### SSS 관련
- [x] SSS 기여금 계산 (3.63%)
- [x] 선지급 옵션 (고정액)
- [x] 보류 옵션 (유동액)
- [x] 선지급 vs 보류 비교
- [x] 월 25일 변경 마감

### 정산 관련
- [x] 정산 상태 전이
- [x] 규칙 엔진 (guest/credit/waived)
- [x] 정산 계산 (매출 분류, 수수료)
- [x] 저장소 패턴 (CRUD)
- [x] 거래 기록 추적

### E2E 워크플로우
- [x] 단일 예약 정산
- [x] 월간 다중 예약
- [x] 외상 회수 시나리오
- [x] 월말 일괄 정산
- [x] 환불 및 조정

### 엣지 케이스
- [x] 경계값 (0.01원, ₱999M+)
- [x] 소수점 정밀도
- [x] 월 경계 (윤년, 짧은달)
- [x] 음수 방지
- [x] 중복 정산 방지

---

## 📚 상세 문서

더 자세한 정보는 `README_TEST_SUITE.md` 참조:

```bash
cat /Users/kwangseobpark/elspa/tests/README_TEST_SUITE.md
```

---

**작성자:** jitnet57 (kang jichul)  
**작성일:** 2026-06-02  
**버전:** 1.0
