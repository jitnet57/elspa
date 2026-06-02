# PaymentMethodInput — Complete TypeScript Types Reference

> **작성일:** 2026-06-02  
> **언어:** TypeScript  
> **목적:** 모든 Type, Interface, Enum 정의서

---

## 📋 목차 (Table of Contents)

1. [PaymentMethod (결제 수단 타입)](#paymentmethod)
2. [PaymentMethodData (결제 데이터 인터페이스)](#paymentmethoddata)
3. [PaymentMethodInputProps (컴포넌트 Props)](#paymentmethodinputprops)
4. [ValidationError (검증 에러)](#validationerror)
5. [ValidationRules (검증 규칙)](#validationrules)
6. [PaymentMethodState (Zustand 상태)](#paymentmethodstate)
7. [용도별 타입 조합](#용도별-타입-조합)

---

## PaymentMethod

### 정의

```typescript
export type PaymentMethod = 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b';
```

### 설명

지원하는 5가지 결제 수단:

| 타입 | 이름 | 설명 | 참조번호 필수 | 중복 허용 |
|------|------|------|--------------|----------|
| `'card'` | 신용/직불카드 | Credit/Debit Card | ✗ (선택) | ✓ |
| `'cash'` | 현금 | Cash Payment | ✗ | ✗ (1회만) |
| `'gcash'` | GCash | 필리핀 디지털 결제 | ✓ (필수) | ✓ |
| `'bank_a'` | 은행 A | 로컬 은행 계좌 이체 | ✓ (필수) | ✓ |
| `'bank_b'` | 은행 B | 로컬 은행 계좌 이체 | ✓ (필수) | ✓ |

### 사용 예시

```typescript
const method: PaymentMethod = 'card';
// ✓ 가능: 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b'

const invalid: PaymentMethod = 'crypto'; // ✗ Type Error!
```

---

## PaymentMethodData

### 정의

```typescript
export interface PaymentMethodData {
  id: string;                    // 고유 ID
  method: PaymentMethod;         // 결제 수단
  amount: number;                // 결제 금액
  reference?: string;            // 참조번호 (선택사항)
  notes?: string;                // 메모 (선택사항)
}
```

### 각 필드 설명

#### id: string

- **필수**: ✓
- **설명**: 고유 식별자
- **생성 방식**: 
  - `payment_${Date.now()}` (컴포넌트 기본)
  - UUID (uuid 라이브러리 사용)
  - 임의의 문자열
- **예시**: `'payment_1717309600000'`, `'payment-1'`

#### method: PaymentMethod

- **필수**: ✓
- **설명**: 결제 수단 선택
- **예시**:
  ```typescript
  method: 'card'    // 신용카드
  method: 'cash'    // 현금
  method: 'gcash'   // GCash
  ```

#### amount: number

- **필수**: ✓
- **설명**: 결제 금액
- **범위**: 0 ~ 999,999,999
- **제약사항**:
  - 음수 불가 (자동 검증)
  - 소수점 지원 (예: 1234.56)
- **예시**:
  ```typescript
  amount: 5000      // ₱5,000
  amount: 2500.50   // ₱2,500.50
  ```

#### reference?: string

- **필수**: ✗ (선택사항, 결제 수단에 따라 다름)
- **설명**: 거래 참조번호 또는 식별자
- **수단별 형식**:
  | 수단 | 참조번호 예시 | 설명 |
  |------|----------|------|
  | `card` | `'1234'` | 카드 마지막 4자리 |
  | `card` | `'TXN-20250602-001'` | 거래번호 |
  | `gcash` | `'12345678'` | GCash 거래 ID (8-12자) |
  | `bank_a` | `'CHK-5678'` | 체크번호 |
  | `bank_b` | `'REF-20250602'` | 계좌이체 참조번호 |
  | `cash` | `''` 또는 생략 | 불필요 |

- **예시**:
  ```typescript
  reference: '1234'           // 카드 마지막 4자리
  reference: 'GCX123456789'   // GCash ID
  reference: 'CHK-5678-A'     // 체크번호
  ```

#### notes?: string

- **필수**: ✗ (선택사항)
- **설명**: 추가 메모 또는 비고
- **최대 길이**: 제한 없음 (권장: 200자 이내)
- **예시**:
  ```typescript
  notes: '신용카드로 선결제'
  notes: 'GCash - John Doe의 계좌'
  notes: '현금 결제 - 거스름돈 주기'
  ```

### 사용 예시

```typescript
// 신용카드 결제
const cardPayment: PaymentMethodData = {
  id: 'payment_1',
  method: 'card',
  amount: 3000,
  reference: '1234',  // 카드 마지막 4자리
  notes: '신용카드',
};

// 현금 결제
const cashPayment: PaymentMethodData = {
  id: 'payment_2',
  method: 'cash',
  amount: 2000,
  // reference와 notes는 선택사항
};

// GCash 결제
const gcashPayment: PaymentMethodData = {
  id: 'payment_3',
  method: 'gcash',
  amount: 5000,
  reference: '12345678',  // 필수: GCash ID
  notes: 'Mobile wallet payment',
};
```

### 배열 사용

```typescript
// 복수 결제 수단
const methods: PaymentMethodData[] = [
  { id: '1', method: 'card', amount: 2500 },
  { id: '2', method: 'cash', amount: 2500 },
];

// 타입 추론
const newMethod: PaymentMethodData = { /* ... */ };
methods.push(newMethod);
```

---

## PaymentMethodInputProps

### 정의

```typescript
interface PaymentMethodInputProps {
  totalAmount: number;
  initialMethods?: PaymentMethodData[];
  onChange?: (methods: PaymentMethodData[]) => void;
  onValidationChange?: (isValid: boolean) => void;
  currency?: string;
  locale?: 'en' | 'ko';
}
```

### Props 상세 설명

#### totalAmount: number

- **필수**: ✓
- **설명**: 청구 총액 (모든 결제 수단의 합이 이 값과 일치해야 함)
- **범위**: 0 이상의 숫자
- **예시**:
  ```typescript
  <PaymentMethodInput
    totalAmount={5000}  // ₱5,000
  />
  ```

#### initialMethods?: PaymentMethodData[]

- **필수**: ✗ (기본값: `[]`)
- **설명**: 초기 결제 수단 데이터 (수정 시나리오)
- **사용 사례**:
  - 기존 예약의 결제 정보 수정
  - 저장된 데이터 복원
- **예시**:
  ```typescript
  <PaymentMethodInput
    totalAmount={5000}
    initialMethods={[
      { id: '1', method: 'card', amount: 3000 },
      { id: '2', method: 'cash', amount: 2000 },
    ]}
  />
  ```

#### onChange?: (methods: PaymentMethodData[]) => void

- **필수**: ✗ (선택사항)
- **설명**: 결제 수단이 변경되었을 때 호출되는 콜백
- **호출 시점**:
  - 새로운 결제 수단 추가
  - 기존 결제 수단 제거
  - 금액 변경
  - 참조번호/메모 변경
- **예시**:
  ```typescript
  <PaymentMethodInput
    totalAmount={5000}
    onChange={(methods) => {
      console.log('결제 수단 변경됨:', methods);
      setPaymentMethods(methods);  // 상태 업데이트
    }}
  />
  ```

#### onValidationChange?: (isValid: boolean) => void

- **필수**: ✗ (선택사항)
- **설명**: 검증 상태가 변경되었을 때 호출되는 콜백
- **호출 타이밍**:
  - 유효함 → 유효하지 않음 (또는 반대)
- **사용 사례**:
  - 제출 버튼 활성화/비활성화
  - 에러 상태 처리
- **예시**:
  ```typescript
  <PaymentMethodInput
    totalAmount={5000}
    onValidationChange={(isValid) => {
      setCanSubmit(isValid);  // 버튼 활성화 제어
    }}
  />
  ```

#### currency?: string

- **필수**: ✗ (기본값: `'₱'`)
- **설명**: 통화 기호
- **예시**:
  ```typescript
  currency="₱"    // 필리핀 페소 (기본값)
  currency="$"    // 미국 달러
  currency="₩"    // 한국 원
  currency="€"    // 유로
  currency="£"    // 영국 파운드
  ```

#### locale?: 'en' | 'ko'

- **필수**: ✗ (기본값: `'en'`)
- **설명**: 언어 설정
- **지원 언어**:
  - `'en'` — English (영어)
  - `'ko'` — 한국어
- **예시**:
  ```typescript
  <PaymentMethodInput
    totalAmount={5000}
    locale="ko"  // 한국어로 표시
  />
  ```

### Props 조합 예시

#### 예시 1: 최소 구성

```typescript
<PaymentMethodInput
  totalAmount={5000}
/>
```

#### 예시 2: 콜백 포함

```typescript
<PaymentMethodInput
  totalAmount={5000}
  onChange={(methods) => console.log(methods)}
  onValidationChange={(isValid) => console.log(isValid)}
/>
```

#### 예시 3: 초기 데이터 + 다국어

```typescript
<PaymentMethodInput
  totalAmount={5000}
  initialMethods={[{ id: '1', method: 'card', amount: 5000 }]}
  onChange={handleChange}
  onValidationChange={handleValidationChange}
  currency="₱"
  locale="ko"
/>
```

---

## ValidationError

### 정의

```typescript
interface ValidationError {
  totalMismatch?: string;       // 합계 오류
  negativeAmount?: string;      // 음수 금액
  duplicateMethod?: string;     // 중복 결제 수단
  invalidReference?: string;    // 잘못된 참조번호
}
```

### 세부 검증 에러 구조 (usePaymentValidation 사용 시)

```typescript
export interface ValidationErrors {
  // 전체 검증 에러
  totalMismatch?: {
    field: 'total';
    code: 'AMOUNT_NOT_EQUAL';
    expected: number;         // 예상 금액
    actual: number;          // 실제 금액
    difference: number;      // 차이
  };

  // 음수 금액 에러
  negativeAmount?: {
    field: 'amount';
    code: 'NEGATIVE_AMOUNT';
    methodIds: string[];     // 해당 결제 수단 ID
    values: number[];        // 음수 값들
  };

  // 초과 결제 에러
  overpayment?: {
    field: 'total';
    code: 'OVERPAYMENT';
    amount: number;          // 초과 금액
  };

  // 중복 결제 수단 에러
  duplicateMethod?: {
    field: 'method';
    code: 'DUPLICATE_PAYMENT_METHOD';
    method: PaymentMethod;   // 중복된 수단
    count: number;          // 중복 개수
  };

  // 참조번호 누락 에러
  missingReference?: {
    field: 'reference';
    code: 'MISSING_REQUIRED_REFERENCE';
    methodIds: string[];     // 참조번호 필요한 ID
    methods: PaymentMethod[]; // 해당 수단 타입
  };

  // 결제 수단 없음 에러
  noPaymentMethods?: {
    field: 'methods';
    code: 'NO_PAYMENT_METHODS';
  };

  // 잘못된 금액 형식 에러
  invalidAmount?: {
    field: 'amount';
    code: 'INVALID_AMOUNT_FORMAT';
    methodIds: string[];     // 문제 있는 ID
  };
}
```

### 에러 메시지 매핑 (다국어)

```typescript
const ERROR_MESSAGES: Record<'en' | 'ko', Record<string, string>> = {
  en: {
    'AMOUNT_NOT_EQUAL': 'Total payment must equal the total amount',
    'NEGATIVE_AMOUNT': 'Payment amounts cannot be negative',
    'OVERPAYMENT': 'Total payment exceeds the total amount',
    'DUPLICATE_PAYMENT_METHOD': 'Only one cash payment is allowed',
    'MISSING_REQUIRED_REFERENCE': 'Reference number is required for this payment method',
    'NO_PAYMENT_METHODS': 'At least one payment method is required',
    'INVALID_AMOUNT_FORMAT': 'Invalid payment amount format',
  },
  ko: {
    'AMOUNT_NOT_EQUAL': '결제액의 합이 청구액과 정확히 같아야 합니다',
    'NEGATIVE_AMOUNT': '결제액은 음수가 될 수 없습니다',
    'OVERPAYMENT': '결제액이 청구액을 초과합니다',
    'DUPLICATE_PAYMENT_METHOD': '현금 결제는 1회만 가능합니다',
    'MISSING_REQUIRED_REFERENCE': '이 결제 수단에서는 참조번호가 필수입니다',
    'NO_PAYMENT_METHODS': '최소 1개의 결제 수단이 필요합니다',
    'INVALID_AMOUNT_FORMAT': '잘못된 금액 형식입니다',
  },
};
```

### 사용 예시

```typescript
const { errors, errorMessages } = usePaymentValidation(
  methods,
  totalAmount
);

// 에러 확인
if (errors.totalMismatch) {
  console.log('금액 오류:', errors.totalMismatch);
  // {
  //   field: 'total',
  //   code: 'AMOUNT_NOT_EQUAL',
  //   expected: 5000,
  //   actual: 4500,
  //   difference: 500
  // }
}

// 에러 메시지 출력
errorMessages.forEach((msg) => console.log(msg));
```

---

## ValidationRules

### 정의

```typescript
export interface ValidationRules {
  // 금액 검증 규칙
  requireExactMatch: boolean;
  allowZeroAmount: boolean;
  maxAmount: number;

  // 결제 수단 검증 규칙
  allowDuplicateMethods: Record<PaymentMethod, boolean>;
  requireReference: Record<PaymentMethod, boolean>;

  // 기타
  requireAtLeastOneMethod: boolean;
  allowPartialPayment: boolean;
  locale: 'en' | 'ko';
}
```

### 기본 검증 규칙

```typescript
const DEFAULT_VALIDATION_RULES: ValidationRules = {
  // 금액
  requireExactMatch: true,              // 청구액과 정확히 일치
  allowZeroAmount: false,               // 0원 결제 불허
  maxAmount: 999999999,                 // 최대 999,999,999

  // 결제 수단
  allowDuplicateMethods: {
    card: true,      // 카드 중복 허용
    cash: false,     // 현금은 1회만
    gcash: true,
    bank_a: true,
    bank_b: true,
  },

  // 참조번호 필수 여부
  requireReference: {
    card: false,     // 선택사항
    cash: false,     // 불필요
    gcash: true,     // 필수
    bank_a: true,    // 필수
    bank_b: true,    // 필수
  },

  // 기타
  requireAtLeastOneMethod: true,
  allowPartialPayment: false,
  locale: 'en',
};
```

### 커스텀 규칙 예시

```typescript
// 부분 결제 허용
const customRules: Partial<ValidationRules> = {
  requireExactMatch: false,   // 정확히 일치하지 않아도 됨
  allowPartialPayment: true,  // 부분 결제 허용
  locale: 'ko',
};

const { isValid, errors } = usePaymentValidation(
  methods,
  totalAmount,
  customRules
);
```

---

## PaymentMethodState

### Zustand Store 상태 타입

```typescript
interface PaymentMethodState {
  // ===== State =====
  methods: PaymentMethodData[];
  totalAmount: number;
  isValid: boolean;
  lastUpdated: string | null;

  // ===== Computed Values =====
  totalPaid: () => number;
  remainingAmount: () => number;
  overpaymentAmount: () => number;

  // ===== Actions =====
  setMethods: (methods: PaymentMethodData[]) => void;
  setTotalAmount: (amount: number) => void;
  addMethod: (method: PaymentMethodData) => void;
  removeMethod: (id: string) => void;
  updateMethod: (id: string, updates: Partial<PaymentMethodData>) => void;
  clearMethods: () => void;
  validate: () => boolean;
  setValidationStatus: (isValid: boolean) => void;
}
```

### Store 액션 상세 설명

#### setMethods: (methods: PaymentMethodData[]) => void

전체 결제 수단 목록을 한 번에 설정합니다.

```typescript
const { setMethods } = usePaymentMethodStore();
setMethods([
  { id: '1', method: 'card', amount: 5000 },
]);
```

#### setTotalAmount: (amount: number) => void

청구 총액을 설정합니다.

```typescript
const { setTotalAmount } = usePaymentMethodStore();
setTotalAmount(10000);  // ₱10,000
```

#### addMethod: (method: PaymentMethodData) => void

새로운 결제 수단을 추가합니다.

```typescript
const { addMethod } = usePaymentMethodStore();
addMethod({
  id: 'new_1',
  method: 'card',
  amount: 5000,
});
```

#### removeMethod: (id: string) => void

특정 ID의 결제 수단을 제거합니다.

```typescript
const { removeMethod } = usePaymentMethodStore();
removeMethod('payment_1');
```

#### updateMethod: (id: string, updates: Partial<PaymentMethodData>) => void

특정 결제 수단의 일부 필드를 업데이트합니다.

```typescript
const { updateMethod } = usePaymentMethodStore();
updateMethod('payment_1', {
  amount: 3000,
  reference: '5678',
});
```

#### clearMethods: () => void

모든 결제 수단을 초기화합니다.

```typescript
const { clearMethods } = usePaymentMethodStore();
clearMethods();
```

#### validate: () => boolean

현재 상태를 검증하고 결과를 반환합니다.

```typescript
const { validate } = usePaymentMethodStore();
const isValid = validate();
console.log(isValid ? '✓ Valid' : '✗ Invalid');
```

### Store 셀렉터

```typescript
// 특정 결제 수단만 필터링
const cardMethods = usePaymentMethodStore(
  selectMethodsByType('card')
);

// 결제 수단 개수
const count = usePaymentMethodStore(selectMethodCount);

// 전체 통계
const summary = usePaymentMethodStore(selectPaymentSummary);
// {
//   totalAmount: 10000,
//   totalPaid: 8000,
//   remainingAmount: 2000,
//   overpaymentAmount: 0,
//   methodCount: 2,
//   isValid: false
// }
```

---

## 용도별 타입 조합

### 시나리오 1: 기본 결제 입력

```typescript
// Props
const props: PaymentMethodInputProps = {
  totalAmount: 5000,
  onChange: (methods) => {},
  locale: 'ko',
};

// 사용 예시
<PaymentMethodInput {...props} />
```

### 시나리오 2: 복수 결제 수단

```typescript
// 데이터
const paymentMethods: PaymentMethodData[] = [
  {
    id: 'method_1',
    method: 'card',
    amount: 2500,
    reference: '1234',
  },
  {
    id: 'method_2',
    method: 'gcash',
    amount: 2500,
    reference: '87654321',
  },
];

// Props
const props: PaymentMethodInputProps = {
  totalAmount: 5000,
  initialMethods: paymentMethods,
  onChange: (methods) => {},
  onValidationChange: (isValid) => {},
  currency: '₱',
  locale: 'ko',
};
```

### 시나리오 3: 검증 포함

```typescript
// 데이터 및 상태
const methods: PaymentMethodData[] = [];
const totalAmount = 10000;

// 검증 규칙
const validationRules: Partial<ValidationRules> = {
  requireExactMatch: true,
  locale: 'ko',
};

// 검증 결과
const validationResult = usePaymentValidation(
  methods,
  totalAmount,
  validationRules
);

// 타입: {
//   isValid: boolean;
//   errors: ValidationErrors;
//   errorMessages: string[];
//   validate: () => {...};
// }
```

### 시나리오 4: 전역 상태 관리

```typescript
// Store 상태
const storeState: PaymentMethodState = {
  methods: [],
  totalAmount: 0,
  isValid: false,
  lastUpdated: null,
  totalPaid: () => 0,
  remainingAmount: () => 0,
  overpaymentAmount: () => 0,
  // ... 액션들
};

// 사용
const store = usePaymentMethodStore();
// store: PaymentMethodState
```

---

## 🎯 타입 안정성 체크리스트

- [ ] `PaymentMethod` 타입 확인 (5개 중 1개)
- [ ] `PaymentMethodData` 배열 타입 체크
- [ ] `PaymentMethodInputProps` 필수 필드 확인
- [ ] 콜백 함수 시그니처 확인
- [ ] 검증 에러 처리 로직 구현
- [ ] Store 액션 반환값 확인
- [ ] 다국어 locale 설정 확인

---

**최종 업데이트:** 2026-06-02  
**TypeScript 버전:** 5.0+  
**상태:** ✅ Complete Reference
