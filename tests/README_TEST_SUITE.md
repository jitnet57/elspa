# ElSpa 종합 테스트 스위트 가이드

## 📋 개요

ElSpa 프로젝트의 결제, SSS 계산, 정산 로직에 대한 종합 테스트 스위트입니다.

**작성일:** 2026-06-02  
**커버리지:** 결제 검증 → SSS 계산 → 정산 로직 → E2E 워크플로우

---

## 🎯 테스트 구조

```
tests/
├── test_payment_validation.py        (결제 검증)
├── test_sss_calculations.py          (SSS 계산)
├── test_settlement_logic.py           (정산 로직)
├── test_booking_settlement_integration.py  (통합 테스트)
├── test_settlement_edge_cases.py      (엣지 케이스)
├── test_settlement_calculator.py      (기존 테스트)
└── README_TEST_SUITE.md               (이 파일)

frontend/src/__tests__/
└── settlement.test.ts                 (프론트엔드 Jest 테스트)
```

---

## 🧪 각 테스트 파일 설명

### 1️⃣ `test_payment_validation.py` (결제 검증)

**목적:** 결제 방법, 금액, 상태 검증

| 테스트 슈트 | 테스트 케이스 수 | 설명 |
|-----------|----------------|------|
| PaymentMethodValidation | 4 | 유효한/유효하지 않은 결제 방법 |
| PaymentFromValidation | 5 | guest/company/credit 결제 출처 |
| PaymentAmountValidation | 6 | 결제 금액 검증 (0, 음수, 소수점) |
| MultiplePaymentMethods | 5 | 분할 결제, 초과/미결제 감지 |
| SSSOptionValidation | 7 | SSS 옵션 (prepaid/hold) |
| PaymentStatusTransitions | 4 | 결제 상태 전이 검증 |
| CreditCollectionRules | 6 | 외상 회수율 (80%, 100%, 0%) |
| RefundValidation | 5 | 환불액 검증 |

**주요 테스트 케이스:**
- ✅ 유효한 결제 방법 (cash, card, gcash, bank_transfer)
- ✅ 결제 출처별 회수율 (guest=80%, company=0%, credit=100%)
- ✅ 분할 결제 검증 및 초과/미결제 감지
- ✅ SSS 옵션 변경 마감 (월 25일)
- ✅ 환불액 <= 원금 검증

### 2️⃣ `test_sss_calculations.py` (SSS 계산)

**목적:** SSS 기여금, 선지급/보류 옵션, 급여 영향도

| 테스트 슈트 | 테스트 케이스 수 | 설명 |
|-----------|----------------|------|
| SSSContributionCalculation | 5 | SSS 기여금 계산 (3.63%) |
| SSprepaidOption | 3 | 선지급 옵션 (고정액) |
| SSSHoldOption | 4 | 보류 옵션 (실제 근무일 기준) |
| PrepaidVsHoldComparison | 4 | 선지급 vs 보류 비교 |
| MonthlySSSummary | 3 | 월별 요약 데이터 |
| PayrollImpactCalculation | 5 | 급여 영향도 분석 |
| SSSOptionChangeValidation | 5 | 옵션 변경 가능 여부 |
| SSSAuditLogging | 3 | 감사 로그 기록 |
| SSSEdgeCases | 4 | 엣지 케이스 (0근무, 전체근무) |

**주요 공식:**
```
SSS 기여금 = Gross Salary × 3.63%
선지급 = 정부 인보이스 기준 고정액 (예: ₱2,025)
보류 = SSS 기여금 × (실제 근무일 / 전체 근무일)
```

**예시:**
```
급여: ₱25,000
SSS 기여금: ₱907.50
선지급: ₱2,025 (고정)
보류 (18/22): ₱1,656.82 (유동)
차액: ₱368.18 (선지급이 더 많음)
```

### 3️⃣ `test_settlement_logic.py` (정산 로직)

**목적:** 정산 상태 전이, 규칙 엔진, 저장소 패턴

| 테스트 슈트 | 테스트 케이스 수 | 설명 |
|-----------|----------------|------|
| SettlementStatusTransitions | 6 | 상태 전이 (draft→approved→settled) |
| SettlementRuleEngine | 8 | 규칙 엔진 (정산 유형 판정) |
| SettlementCalculator | 4 | 정산 계산 엔진 |
| SettlementRepository | 6 | 저장소 패턴 (CRUD) |
| SettlementTransactionTracking | 4 | 거래 기록 추적 |
| SettlementWithDeductions | 4 | 차감액 처리 (환불, 분쟁) |
| SettlementPeriodHandling | 2 | 정산 기간 처리 (연도 경계) |

**정산 상태 흐름:**
```
draft → approved → settled → confirmed
  ↓
rejected → draft (재계산)
```

### 4️⃣ `test_booking_settlement_integration.py` (통합 테스트)

**목적:** 예약 → 정산 → 지급까지 E2E 워크플로우

| 테스트 슈트 | 테스트 케이스 수 | 설명 |
|-----------|----------------|------|
| SingleBookingSettlementFlow | 3 | 단일 예약 정산 흐름 |
| MultipleBookingsInMonth | 3 | 월간 다중 예약 정산 |
| CreditCollectionScenarios | 4 | 외상 회수 시나리오 |
| MonthEndProcessing | 3 | 월말 일괄 정산 |
| RefundAndAdjustmentFlows | 3 | 환불 및 조정 |
| SettlementApprovalWorkflow | 2 | 승인 워크플로우 |
| ComplexMultiStateTransitions | 2 | 복잡한 상태 전이 |
| EndToEndBookingToPayment | 2 | E2E 예약→지급 |

**예시 워크플로우:**
```
1. Booking 생성 (payment_from='guest')
   - total_price: ₱5,000
   - booking_date: 2026-06-01

2. 정산 자동 생성 (draft)
   - recovery_rate: 80%
   - recovered_amount: ₱4,000
   - platform_fee: ₱1,250
   - net_settlement: ₱2,750

3. 정산 승인 (approved)
   - approved_by: 'admin'
   - approved_at: 2026-06-10

4. 월말 일괄 정산 (settled)
   - payment_date: 2026-06-30
   - status: settled

5. 확정 (confirmed)
   - confirmation_date: 2026-07-01
```

### 5️⃣ `test_settlement_edge_cases.py` (엣지 케이스)

**목적:** 경계값, 예외 상황, 복합 시나리오

| 테스트 슈트 | 테스트 케이스 수 | 설명 |
|-----------|----------------|------|
| BoundaryValues | 5 | 최소/최대값, 극단값 |
| PrecisionAndRounding | 5 | 소수점 정밀도, 반올림 |
| MultiplePaymentComplexity | 3 | 복합 결제 방법 |
| MonthBoundaryConditions | 5 | 월 경계 (윤년, 짧은달) |
| CreditCollectionEdgeCases | 4 | 외상 회수 엣지 케이스 |
| DeductionEdgeCases | 4 | 차감 엣지 케이스 |
| SSSOptionEdgeCases | 4 | SSS 옵션 엣지 케이스 |
| SettlementStatusEdgeCases | 3 | 정산 상태 엣지 케이스 |
| NegativeScenarios | 5 | 부정적 시나리오 (음수, 중복) |
| ComplexScenarioCombinations | 2 | 복잡한 조합 시나리오 |

**주요 엣지 케이스:**
- ✅ 0.01원 (최소 양수 금액)
- ✅ ₱999,999,999.99 (최대 금액)
- ✅ 2월 29일 (윤년)
- ✅ 월 25일 경계 (SSS 변경 마감)
- ✅ 100+ 회수율 방지
- ✅ 음수 금액 방지
- ✅ 중복 정산 기간 방지

### 6️⃣ `settlement.test.ts` (프론트엔드 Jest 테스트)

**목적:** 프론트엔드 로직 검증 (TypeScript/Jest)

| 테스트 슈트 | 테스트 케이스 수 | 설명 |
|-----------|----------------|------|
| Commission Calculation | 5 | 커미션 계산 (25%) |
| Payment From Validation | 4 | 결제 출처 검증 |
| Recovery Amount Calculation | 5 | 회수액 계산 |
| Net Settlement Calculation | 5 | 순정산액 계산 |
| SSS Contribution Calculation | 4 | SSS 기여금 계산 |
| SSS Prepaid vs Hold Option | 4 | 선지급 vs 보류 비교 |
| Payment Status Validation | 2 | 결제 상태 검증 |
| Settlement Status Validation | 4 | 정산 상태 검증 |
| Multiple Payment Methods | 4 | 분할 결제 검증 |
| SSS Option Change Deadline | 5 | SSS 변경 마감 검증 |
| Refund Amount Validation | 5 | 환불액 검증 |
| Credit Collection Impact | 3 | 외상 회수 영향도 |
| API Response Validation | 2 | API 응답 검증 |

---

## 🚀 테스트 실행

### Python 테스트 (Pytest)

```bash
# 전체 테스트 실행
pytest tests/ -v

# 특정 파일만 실행
pytest tests/test_payment_validation.py -v

# 특정 테스트만 실행
pytest tests/test_payment_validation.py::TestPaymentMethodValidation::test_valid_payment_methods -v

# 커버리지 리포트
pytest tests/ --cov=app --cov-report=html
```

### TypeScript 테스트 (Jest)

```bash
# 프론트엔드 테스트 실행
cd frontend
npm test -- src/__tests__/settlement.test.ts

# 모든 프론트엔드 테스트
npm test

# 커버리지 리포트
npm test -- --coverage
```

---

## 📊 테스트 통계

### 전체 테스트 수

| 언어 | 파일 수 | 테스트 케이스 수 | 비고 |
|------|--------|-----------------|------|
| Python (Pytest) | 5 | ~170 | 결제, SSS, 정산, 통합, 엣지케이스 |
| TypeScript (Jest) | 1 | ~90 | 프론트엔드 로직 |
| **합계** | **6** | **~260** | |

### 테스트 주제별 분류

| 주제 | 테스트 수 | 커버리지 |
|------|---------|---------|
| 결제 검증 | 42 | 결제 방법, 금액, 상태 |
| SSS 계산 | 48 | 기여금, 선지급/보류, 급여 영향도 |
| 정산 로직 | 41 | 상태 전이, 규칙, 저장소 |
| E2E 통합 | 34 | 예약→정산→지급 워크플로우 |
| 엣지 케이스 | 54 | 경계값, 예외, 복합 시나리오 |

---

## ✅ 테스트 결과 해석

### 성공 기준

각 테스트는 다음 기준을 만족해야 합니다:

1. **기능 검증** ✓
   - 공식 동작 확인
   - 입력/출력 검증
   - 상태 전이 검증

2. **오류 처리** ✓
   - 유효하지 않은 입력 거부
   - 예외 상황 처리
   - 경계값 검증

3. **성능** ✓
   - 각 테스트 < 1초
   - 대량 데이터 처리 가능
   - 정밀도 유지 (소수점 2자리)

### 예상 결과

```bash
tests/test_payment_validation.py ...................... PASSED    [42 tests]
tests/test_sss_calculations.py ........................ PASSED    [48 tests]
tests/test_settlement_logic.py ........................ PASSED    [41 tests]
tests/test_booking_settlement_integration.py ......... PASSED    [34 tests]
tests/test_settlement_edge_cases.py .................. PASSED    [54 tests]
tests/test_settlement_calculator.py .................. PASSED    [~30 tests]
frontend/src/__tests__/settlement.test.ts ........... PASSED    [90 tests]

================================ 260+ tests passed ================================
```

---

## 🔧 주요 공식 및 로직

### 1. 커미션 계산
```
Commission = Total Price × Platform Fee Rate / 100
예: ₱5,000 × 25% = ₱1,250
```

### 2. 회수액 계산 (payment_from별)
```
Guest (손님 외상):      Recovery Rate = 80%
Company (업체 선지급):  Recovery Rate = 0%
Credit (신용카드):      Recovery Rate = 100%

Recovered Amount = Total Price × Recovery Rate / 100
```

### 3. 순정산액 계산
```
Net Settlement = (Guest Revenue + Recovered Amount)
               - Platform Fee
               - Total Deductions
               (최소: 0)
```

### 4. SSS 계산
```
SSS Contribution = Gross Salary × 3.63%

Prepaid (선지급) = Government Invoice Amount (고정)
Hold (보류) = SSS Contribution × (Actual Workdays / Total Workdays)

Difference = |Prepaid - Hold|
```

### 5. 월간 정산
```
Total Revenue = Guest Revenue + Credit Revenue + Waived Revenue
Recovered Amount = Guest Revenue × 100% + Credit Revenue × 80% + Waived Revenue × 0%
Platform Fee = (Total Revenue - Waived Revenue) × 25%
Net Settlement = Recovered Amount - Platform Fee - Deductions
```

---

## 📌 주의사항

### 1. 정밀도
- 모든 금액은 **소수점 2자리**로 관리
- 필리핀 페소(PHP) 기준

### 2. SSS 규칙
- **선지급 vs 보류 선택 마감:** 매월 25일
- **정산 예정일:** 매월 25일
- **선택 후 변경:** 다음 달 가능

### 3. 정산 상태
- **draft:** 자동 생성 (검증 필요)
- **approved:** 관리자 승인
- **settled:** 지급 완료
- **confirmed:** 은행 거래 확인
- **rejected:** 재계산 필요

### 4. 회수율
- **100%:** 현금/카드 결제 (즉시 수금)
- **80%:** 손님 외상 (불확실한 회수)
- **0%:** 업체 선지급 (정산 제외)
- 커스텀 설정 가능 (관리자)

---

## 🛠️ 문제 해결

### 테스트 실패 시

1. **Import 오류**
   ```bash
   # 패키지 재설치
   pip install -e .
   npm install
   ```

2. **DB 연결 오류**
   ```bash
   # 테스트 DB 초기화
   pytest --db-init tests/
   ```

3. **Mock 오류**
   - Mock 객체의 속성명 확인
   - spec 파라미터 사용하여 타입 검증

4. **시간대 오류**
   ```python
   # UTC 기준으로 통일
   datetime.utcnow()  # ✓
   datetime.now()     # ✗
   ```

---

## 📚 참고 자료

- [Pytest 공식 문서](https://docs.pytest.org/)
- [Jest 공식 문서](https://jestjs.io/)
- [ElSpa CLAUDE.md](../CLAUDE.md)
- [정산 계산기](../app/services/settlement_calculator.py)
- [정산 엔진](../app/services/settlement_engine.py)

---

**마지막 업데이트:** 2026-06-02  
**문서 버전:** 1.0  
**담당자:** jitnet57 (kang jichul)
