# PaymentMethodInput - Quick Reference Guide

빠른 통합을 위한 가이드입니다.

---

## 1️⃣ 설치 & 임포트

```typescript
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';
import { usePaymentMethodStore } from '@/lib/store/payment';
import { usePaymentValidation } from '@/hooks/payment/usePaymentValidation';
```

---

## 2️⃣ 기본 사용

### 최소 구현 (3줄)

```typescript
const [methods, setMethods] = useState([]);

<PaymentMethodInput
  totalAmount={5000}
  onChange={setMethods}
/>
```

### 모든 옵션 포함

```typescript
const [methods, setMethods] = useState([]);
const [isValid, setIsValid] = useState(false);

<PaymentMethodInput
  totalAmount={5000}
  initialMethods={methods}
  onChange={setMethods}
  onValidationChange={setIsValid}
  currency="₱"
  locale="ko"
/>
```

---

## 3️⃣ 검증

### 로컬 검증 (컴포넌트 내부)
자동으로 처리됨 - `onValidationChange` 콜백 사용

### 커스텀 검증

```typescript
const { isValid, errorMessages } = usePaymentValidation(
  methods,
  totalAmount,
  { locale: 'ko' }  // 선택사항
);

if (!isValid) {
  errorMessages.forEach(msg => console.error(msg));
}
```

---

## 4️⃣ 결제 수단 타입

| 타입 | 아이콘 | 필수 참조번호 |
|------|-------|-----------|
| `card` | 💳 | 아니오 |
| `cash` | 💵 | 아니오 |
| `gcash` | 📱 | 예 |
| `bank_a` | 🏦 | 예 |
| `bank_b` | 🏦 | 예 |

```typescript
type PaymentMethod = 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b';
```

---

## 5️⃣ PaymentMethodData 구조

```typescript
interface PaymentMethodData {
  id: string;           // "payment_1717328400000"
  method: PaymentMethod; // "card"
  amount: number;       // 2500
  reference?: string;   // "1234" (선택)
  notes?: string;       // "반액 선결제" (선택)
}
```

---

## 6️⃣ 이벤트 콜백

### onChange
결제 수단 배열이 변경될 때마다 호출

```typescript
onChange={(methods: PaymentMethodData[]) => {
  console.log('현재 결제 수단:', methods);
  // API 저장, 상태 업데이트 등
}}
```

### onValidationChange
검증 상태가 변경될 때 호출

```typescript
onValidationChange={(isValid: boolean) => {
  console.log('검증 상태:', isValid);
  // 결제 버튼 활성화/비활성화
}}
```

---

## 7️⃣ Zustand Store 사용

### 상태 읽기

```typescript
const { methods, totalAmount, isValid } = usePaymentMethodStore();
```

### 상태 수정

```typescript
const { setMethods, setTotalAmount, addMethod, removeMethod } = usePaymentMethodStore();

// 전체 설정
setMethods([...]);

// 청구액 설정
setTotalAmount(10000);

// 새 결제 수단 추가
addMethod({
  id: `payment_${Date.now()}`,
  method: 'card',
  amount: 5000,
});

// 제거
removeMethod('payment_1717328400000');
```

### 계산된 값

```typescript
const totalPaid = store.totalPaid();           // 현재까지 결제액
const remaining = store.remainingAmount();     // 남은 금액
const overpaid = store.overpaymentAmount();    // 초과 결제액
```

---

## 8️⃣ 검증 규칙 커스터마이징

```typescript
const { isValid, errors } = usePaymentValidation(
  methods,
  totalAmount,
  {
    requireExactMatch: true,         // 정확히 일치 필요 (기본값)
    allowPartialPayment: false,      // 부분 결제 불허 (기본값)
    allowZeroAmount: false,          // 0원 불허 (기본값)
    locale: 'ko',                    // 한국어 (기본값: en)
    
    // 중복 허용 여부
    allowDuplicateMethods: {
      card: true,
      cash: false,  // 현금은 1회만
      gcash: true,
      bank_a: true,
      bank_b: true,
    },
    
    // 참조번호 필수 여부
    requireReference: {
      card: false,
      cash: false,
      gcash: true,   // GCash ID 필수
      bank_a: true,  // 은행 참조번호 필수
      bank_b: true,
    },
  }
);
```

---

## 9️⃣ 일반적인 사용 패턴

### 패턴 1: 50% + 50% 분할

```typescript
const [methods, setMethods] = useState([
  { id: 'p1', method: 'card', amount: 2500 },
  { id: 'p2', method: 'cash', amount: 2500 },
]);
```

### 패턴 2: 복수 카드

```typescript
const [methods, setMethods] = useState([
  { id: 'p1', method: 'card', amount: 3000, reference: '1234' },
  { id: 'p2', method: 'card', amount: 2000, reference: '5678' },
]);
```

### 패턴 3: 은행 이체 + 마진

```typescript
const [methods, setMethods] = useState([
  { id: 'p1', method: 'bank_a', amount: 5000, reference: 'CHK001' },
  { id: 'p2', method: 'cash', amount: 500 }, // 추가 수수료
]);
```

---

## 🔟 에러 처리

### 에러 타입 확인

```typescript
const { errors } = usePaymentValidation(methods, totalAmount);

if (errors.totalMismatch) {
  console.error('금액 불일치:', errors.totalMismatch.difference);
}

if (errors.negativeAmount) {
  console.error('음수 금액:', errors.negativeAmount.methodIds);
}

if (errors.duplicateMethod) {
  console.error('중복 결제 수단:', errors.duplicateMethod.method);
}

if (errors.missingReference) {
  console.error('참조번호 누락:', errors.missingReference.methodIds);
}
```

---

## 1️⃣1️⃣ 다국어 설정

```typescript
// 영어
<PaymentMethodInput
  totalAmount={5000}
  locale="en"
/>

// 한국어
<PaymentMethodInput
  totalAmount={5000}
  locale="ko"
/>
```

---

## 1️⃣2️⃣ 완전한 결제 페이지 예시

```typescript
'use client';

import { useState } from 'react';
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';
import { usePaymentValidation } from '@/hooks/payment/usePaymentValidation';

export default function CheckoutPage() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = 10000;
  const { isValid, errorMessages } = usePaymentValidation(methods, totalAmount, {
    locale: 'ko',
  });

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsProcessing(true);
    try {
      // API 호출
      const response = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ methods, totalAmount }),
      });

      if (response.ok) {
        alert('결제 완료!');
        setMethods([]);
      } else {
        alert('결제 실패');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">결제</h1>

      <PaymentMethodInput
        totalAmount={totalAmount}
        onChange={setMethods}
        currency="₱"
        locale="ko"
      />

      {errorMessages.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          {errorMessages.map((msg) => (
            <p key={msg} className="text-red-700 text-sm">
              • {msg}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || isProcessing}
        className={`w-full mt-6 py-3 rounded-lg font-semibold text-white ${
          isValid && !isProcessing
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isProcessing ? '처리 중...' : '결제 완료'}
      </button>
    </div>
  );
}
```

---

## 1️⃣3️⃣ FAQ

### Q: 결제 수단을 몇 개까지 추가할 수 있나요?
**A:** 제한 없습니다. 다만 UX를 위해 5개 이하를 권장합니다.

### Q: 부분 결제를 허용하려면?
**A:** 커스텀 규칙에서 `allowPartialPayment: true` 설정

```typescript
const { isValid } = usePaymentValidation(methods, totalAmount, {
  allowPartialPayment: true,  // 부분 결제 허용
});
```

### Q: 이전에 입력한 결제 수단을 복구하려면?
**A:** localStorage는 Zustand에서 자동 관리

```typescript
const { methods } = usePaymentMethodStore();  // 자동으로 저장된 데이터 로드
```

### Q: API에 보낼 때 형식은?
**A:** `PaymentMethodData[]` 배열 그대로 전송

```json
[
  {
    "id": "payment_1717328400000",
    "method": "card",
    "amount": 5000,
    "reference": "1234"
  },
  {
    "id": "payment_1717328400001",
    "method": "cash",
    "amount": 5000
  }
]
```

---

## 1️⃣4️⃣ 파일 위치

```
frontend/src/
├── components/PaymentMethodInput.tsx         # 메인 컴포넌트
├── components/PaymentMethodInput.example.tsx # 5개 예시
├── lib/store/payment.ts                      # Zustand 스토어
└── hooks/payment/usePaymentValidation.ts     # 검증 훅
```

---

## 1️⃣5️⃣ 체크리스트

새 페이지에 통합할 때:

- [ ] 컴포넌트 임포트
- [ ] `totalAmount` prop 설정
- [ ] `onChange` 콜백 구현
- [ ] `onValidationChange` 콜백 구현 (선택)
- [ ] 검증 규칙 확인
- [ ] 언어 설정 (`locale`)
- [ ] 결제 버튼 `isValid` 상태 연동
- [ ] 에러 메시지 표시
- [ ] API 호출 구현

---

**최종 수정:** 2026-06-02
