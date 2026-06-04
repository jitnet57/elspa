# PaymentMethodInput Component — Complete Integration Guide

> **작성일:** 2026-06-02  
> **컴포넌트:** PaymentMethodInput.tsx + usePaymentValidation + Zustand Store  
> **목적:** 복수 결제 수단 입력, 유효성 검증, BookingSheetTable 통합

---

## 📋 개요 (Overview)

`PaymentMethodInput` 컴포넌트는 **복수 결제 수단**을 통한 금액 분배를 입력·검증하는 React 컴포넌트입니다.

### 주요 기능 (Key Features)

- ✅ **결제 수단 다중 선택** — 카드, 현금, GCash, BankA, BankB
- ✅ **동적 추가/제거** — Add/Remove 버튼으로 수단 추가 및 삭제
- ✅ **실시간 계산** — 합계, 남은 금액, 초과 결제 자동 계산
- ✅ **유효성 검증** — 총액 일치, 음수 금액, 중복 검증
- ✅ **참조번호 관리** — 선택적 거래번호, 체크번호 등 저장
- ✅ **다국어 지원** — 영어/한국어 동시 지원 (locale: 'en' | 'ko')
- ✅ **자동 채우기** — "자동" 버튼으로 남은 금액 자동 입력
- ✅ **통화 커스터마이제이션** — 기본값 ₱, 변경 가능

---

## 🏗️ 구조 (Architecture)

### 파일 구조

```
frontend/src/
├── components/
│   ├── PaymentMethodInput.tsx              # 메인 컴포넌트 (622줄)
│   └── PaymentMethodInput.example.tsx      # 사용 예시 (356줄)
│
├── hooks/
│   └── payment/
│       └── usePaymentValidation.ts         # 검증 훅 (410줄)
│
└── lib/
    └── store/
        └── payment.ts                       # Zustand 상태 관리 (256줄)
```

### 의존성 (Dependencies)

- **React 19** — useState, useCallback, useMemo
- **Zustand 5** — 전역 상태 관리 (localStorage 자동 저장)
- **TypeScript** — 완벽한 타입 안정성

---

## 🎯 핵심 Types & Interfaces

### PaymentMethodData

```typescript
export interface PaymentMethodData {
  id: string;                    // 고유 ID (UUID 또는 timestamp)
  method: PaymentMethod;         // 결제 수단: 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b'
  amount: number;                // 결제 금액
  reference?: string;            // 참조번호 (선택사항: 거래번호, 체크번호 등)
  notes?: string;                // 메모 (선택사항)
}

export type PaymentMethod = 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b';
```

### 컴포넌트 Props

```typescript
interface PaymentMethodInputProps {
  totalAmount: number;                         // 청구 총액
  initialMethods?: PaymentMethodData[];        // 초기 결제 수단 데이터
  onChange?: (methods: PaymentMethodData[]) => void;  // 변경 콜백
  onValidationChange?: (isValid: boolean) => void;    // 유효성 콜백
  currency?: string;                           // 통화 기호 (기본값: ₱)
  locale?: 'en' | 'ko';                       // 언어 설정
}
```

---

## 💻 기본 사용법 (Basic Usage)

### 예시 1: 간단한 결제 폼

```typescript
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';
import { useState } from 'react';

export function SimplePaymentForm() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const totalAmount = 5000; // ₱5,000

  const handleChange = (updatedMethods: PaymentMethodData[]) => {
    setMethods(updatedMethods);
    console.log('현재 결제 수단:', updatedMethods);
  };

  const handleValidationChange = (isValid: boolean) => {
    console.log('검증 상태:', isValid ? '✓ Valid' : '✗ Invalid');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">결제 수단 입력</h1>

      <PaymentMethodInput
        totalAmount={totalAmount}
        onChange={handleChange}
        onValidationChange={handleValidationChange}
        currency="₱"
        locale="ko"
      />

      {/* 현재 상태 표시 */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <p>결제액: ₱{methods.reduce((sum, m) => sum + m.amount, 0).toFixed(2)}</p>
        <p>남은 금액: ₱{Math.max(0, totalAmount - methods.reduce((sum, m) => sum + m.amount, 0)).toFixed(2)}</p>
      </div>
    </div>
  );
}
```

---

## 🔄 BookingSheetTable 통합 (Integration with BookingSheetTable)

### 통합 전략

`BookingSheetTable`은 현재 **pay** 및 **tip** 필드를 직접 입력받습니다. `PaymentMethodInput`을 추가하려면:

#### 방법 1: 모달 또는 별도 섹션으로 추가

```typescript
'use client';

import { useState } from 'react';
import BookingSheetTable from '@/app/monitor/components/BookingSheetTable';
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';

export default function BookingWithPaymentPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePaymentChange = (methods: PaymentMethodData[]) => {
    setPaymentMethods(methods);
    // 이 금액들을 BookingSheetTable에 전달할 수 있음
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 예약 테이블 */}
      <BookingSheetTable />

      {/* 결제 섹션 (모달 또는 별도 패널) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">결제 수단 입력</h2>
            <PaymentMethodInput
              totalAmount={totalAmount}
              initialMethods={paymentMethods}
              onChange={handlePaymentChange}
              currency="₱"
              locale="ko"
            />
            <button
              onClick={() => setShowPaymentModal(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 방법 2: 개별 행(Row) 결제 수단 입력

BookingSheetTable의 각 행에서 "결제 수단" 버튼을 눌렀을 때 PaymentMethodInput을 띄우기:

```typescript
// BookingSheetTable 내부에서
const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

// 테이블 행에 추가하기
<td className="px-2 py-1">
  <button
    onClick={() => setSelectedRowIndex(i)}
    className="text-blue-600 hover:underline text-sm"
  >
    💳 결제
  </button>
</td>

// 모달 또는 드로어에서 PaymentMethodInput 표시
{selectedRowIndex !== null && (
  <PaymentMethodInput
    totalAmount={rows[selectedRowIndex].pay + rows[selectedRowIndex].tip}
    onChange={(methods) => {
      // 이 행의 결제 수단 저장
      console.log(`행 ${selectedRowIndex + 1}의 결제 수단:`, methods);
    }}
    locale="ko"
  />
)}
```

---

## 🔍 검증 (Validation)

### usePaymentValidation Hook 사용

```typescript
import { usePaymentValidation } from '@/hooks/payment/usePaymentValidation';
import { PaymentMethodData } from '@/components/PaymentMethodInput';
import { useState } from 'react';

export function PaymentWithValidation() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const totalAmount = 10000;

  const { isValid, errors, errorMessages } = usePaymentValidation(
    methods,
    totalAmount,
    {
      requireExactMatch: true,      // 청구액과 정확히 일치해야 함
      allowPartialPayment: false,   // 부분 결제 불허
      requireAtLeastOneMethod: true, // 최소 1개 필수
      locale: 'ko',
    }
  );

  return (
    <div>
      <PaymentMethodInput
        totalAmount={totalAmount}
        onChange={setMethods}
        locale="ko"
      />

      {/* 에러 메시지 표시 */}
      {!isValid && errorMessages.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
          <h3 className="font-semibold text-red-900 mb-2">검증 오류:</h3>
          <ul className="space-y-1">
            {errorMessages.map((msg, i) => (
              <li key={i} className="text-red-700 text-sm">• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 완료 상태 */}
      {isValid && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
          <p className="text-green-700">✓ 모든 검증이 완료되었습니다!</p>
        </div>
      )}

      {/* 상세 에러 정보 (디버깅용) */}
      {Object.keys(errors).length > 0 && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(errors, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

### 검증 규칙

#### 기본 검증 규칙

| 규칙 | 설명 | 기본값 |
|------|------|--------|
| `requireExactMatch` | 결제액 합 = 청구액 | `true` |
| `allowZeroAmount` | 0원 결제 허용 | `false` |
| `allowPartialPayment` | 부분 결제 허용 | `false` |
| `requireAtLeastOneMethod` | 최소 1개 필수 | `true` |

#### 결제 수단별 검증

```typescript
// 중복 허용 여부
allowDuplicateMethods: {
  card: true,      // 카드는 여러 번 가능
  cash: false,     // 현금은 1회만
  gcash: true,
  bank_a: true,
  bank_b: true,
}

// 참조번호 필수 여부
requireReference: {
  card: false,     // 선택사항
  cash: false,     // 필요 없음
  gcash: true,     // 필수: GCash ID
  bank_a: true,    // 필수: 은행 참조번호
  bank_b: true,    // 필수: 은행 참조번호
}
```

---

## 🗄️ 상태 관리 (Zustand Store)

### usePaymentMethodStore 사용

```typescript
import { usePaymentMethodStore } from '@/lib/store/payment';

export function PaymentFormWithGlobalState() {
  const {
    methods,          // PaymentMethodData[]
    totalAmount,      // number
    isValid,          // boolean
    totalPaid,        // () => number
    remainingAmount,  // () => number
    setMethods,       // (methods) => void
    setTotalAmount,   // (amount) => void
    addMethod,        // (method) => void
    removeMethod,     // (id) => void
    updateMethod,     // (id, updates) => void
    clearMethods,     // () => void
    validate,         // () => boolean
  } = usePaymentMethodStore();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">결제 - Store 연동</h1>

      <PaymentMethodInput
        totalAmount={totalAmount}
        initialMethods={methods}
        onChange={setMethods}
        onValidationChange={(valid) => {
          console.log('검증 상태:', valid);
        }}
        locale="ko"
      />

      {/* Store 상태 표시 */}
      <div className="p-4 bg-slate-100 rounded-lg space-y-2">
        <p>청구액: ₱{totalAmount.toFixed(2)}</p>
        <p>결제액: ₱{totalPaid().toFixed(2)}</p>
        <p>남은 금액: ₱{remainingAmount().toFixed(2)}</p>
        <p>상태: {isValid ? '✓ Valid' : '✗ Invalid'}</p>
        <p>수단 개수: {methods.length}</p>
      </div>

      {/* 금액 변경 */}
      <button
        onClick={() => setTotalAmount(15000)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        청구액 변경 (15,000원)
      </button>

      {/* 결제 완료 */}
      {isValid && (
        <button
          onClick={() => {
            console.log('결제 완료:', { methods, totalAmount });
            clearMethods();
          }}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
        >
          결제 완료
        </button>
      )}
    </div>
  );
}
```

### Store 셀렉터 (Selectors)

```typescript
import {
  selectMethodsByType,
  selectMethodCount,
  selectPaymentSummary,
} from '@/lib/store/payment';

// 특정 결제 수단만 가져오기
const cardMethods = usePaymentMethodStore(selectMethodsByType('card'));

// 결제 수단 개수만 가져오기
const count = usePaymentMethodStore(selectMethodCount);

// 모든 통계 한 번에 가져오기
const summary = usePaymentMethodStore(selectPaymentSummary);
```

---

## 📊 UI 컴포넌트 구조

### 메인 컴포넌트 레이아웃

```
PaymentMethodInput
├── Header (제목 + 개수 표시)
├── Error Messages (검증 에러 표시)
├── Payment Methods List (스크롤 가능)
│   └── PaymentMethodItem (개별 항목)
│       ├── Method Header (아이콘 + 레이블)
│       ├── Method Selection (드롭다운)
│       ├── Amount Input (숫자 입력 + 자동 채우기)
│       └── Reference & Notes (접기/펼치기)
├── Summary Section (합계, 남은 금액, 초과 결제)
├── Action Buttons (+ 결제 수단 추가)
└── Validation Status (검증 완료/실패)
```

### PaymentMethodItem 세부 구조

```typescript
interface PaymentMethodItem {
  id: string;
  method: PaymentMethod;      // 드롭다운으로 선택 가능
  amount: number;             // 숫자 입력, Auto 버튼으로 자동 채우기
  reference?: string;         // 선택적 참조번호
  notes?: string;             // 선택적 메모
}
```

---

## 🎨 스타일 커스터마이제이션

### Tailwind CSS 클래스

모든 컴포넌트는 **Tailwind CSS 4** 사용:
- 배경색: `bg-slate-900`, `bg-white`, `bg-green-50`
- 텍스트: `text-white`, `text-gray-800`, `text-red-700`
- 레이아웃: `flex`, `grid`, `space-y-4`, `gap-3`
- 상태: `hover:`, `active:`, `disabled:`, `focus:`

### 커스텀 스타일 적용

```typescript
<PaymentMethodInput
  totalAmount={5000}
  onChange={handleChange}
  // 기본 스타일이 포함되어 있으므로, 외부 div로 감싸서 커스터마이제이션
/>

// CSS로 추가 스타일
<style>{`
  .payment-input-custom input:focus {
    @apply ring-2 ring-purple-500 !important;
  }
`}</style>
```

---

## 🔌 실제 사용 예시

### 예시 1: 완전한 결제 페이지

```typescript
'use client';

import { useState } from 'react';
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';

export function CheckoutPage() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // 청구 항목
  const billItems = [
    { description: '마사지 60분', price: 3000 },
    { description: '스톤 테라피', price: 2000 },
  ];
  const totalAmount = billItems.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsProcessing(true);
    try {
      // API 호출
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: billItems,
          totalAmount,
          paymentMethods: methods,
        }),
      });

      if (response.ok) {
        alert('✅ 결제가 완료되었습니다!');
        setMethods([]);
      }
    } catch (error) {
      alert('❌ 결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">결제</h1>
      </div>

      {/* 청구 항목 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-lg mb-3">청구 항목</h2>
        {billItems.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{item.description}</span>
            <span>₱{item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>총액</span>
          <span className="text-lg">₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* 결제 수단 입력 */}
      <PaymentMethodInput
        totalAmount={totalAmount}
        onChange={setMethods}
        onValidationChange={setIsValid}
        currency="₱"
        locale="ko"
      />

      {/* 결제 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isProcessing}
        className={`w-full py-3 rounded-lg font-semibold text-white transition ${
          !isValid || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {isProcessing ? '처리 중...' : '결제 완료'}
      </button>
    </div>
  );
}
```

### 예시 2: 다중 결제 수단 시나리오 (50% 카드 + 50% 현금)

```typescript
const [methods, setMethods] = useState<PaymentMethodData[]>([
  {
    id: 'method_1',
    method: 'card',
    amount: 2500,
    reference: '5432',  // 카드 마지막 4자리
    notes: '신용카드',
  },
  {
    id: 'method_2',
    method: 'cash',
    amount: 2500,
    notes: '현금 결제',
  },
]);

const totalAmount = 5000; // ₱5,000
```

---

## 🐛 일반적인 문제 해결 (Troubleshooting)

### 문제 1: 검증이 항상 실패함

**원인:** 결제액 합이 청구액과 정확히 일치하지 않음

```typescript
// ✓ 해결: Auto 버튼 사용 또는 수동으로 금액 조정
// 남은 금액: 50원이 남은 경우
// → 카드에 "Auto" 버튼 클릭하여 자동 채우기
```

### 문제 2: 현금 결제를 2번 이상 추가할 수 없음

**원인:** 기본 규칙상 현금은 1회만 허용

```typescript
// ✓ 해결: 카드나 GCash 등 다른 수단 사용
// 또는 검증 규칙 변경 (allowDuplicateMethods.cash: true)
```

### 문제 3: GCash 선택 시 참조번호 필수 에러

**원인:** GCash는 참조번호(거래 ID)가 필수

```typescript
// ✓ 해결: 거래 ID 입력
// "자세히 보기" 클릭 → 참조번호 입력: "12345678"
```

---

## 📚 추가 학습 자료

### 관련 파일
- `/components/PaymentMethodInput.tsx` — 메인 컴포넌트 (622줄)
- `/components/PaymentMethodInput.example.tsx` — 5가지 사용 예시
- `/hooks/payment/usePaymentValidation.ts` — 검증 로직 (410줄)
- `/lib/store/payment.ts` — Zustand 상태 관리 (256줄)

### 기술 문서
- [React Hooks 가이드](https://react.dev/reference/react)
- [Zustand 문서](https://docs.pmnd.rs/zustand)
- [TypeScript Interface](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

## ✅ 체크리스트

새로운 페이지에서 PaymentMethodInput을 사용할 때:

- [ ] `PaymentMethodInput` import 완료
- [ ] `totalAmount` prop 설정
- [ ] `onChange` 콜백 구현
- [ ] `onValidationChange` 콜백 구현
- [ ] `locale` 설정 ('ko' 또는 'en')
- [ ] `currency` 설정 (₱, $, ₩ 등)
- [ ] 검증 규칙 확인 (필요시 커스터마이징)
- [ ] 결제 완료 버튼 disabled 상태 처리 (`isValid` 사용)
- [ ] API 호출 시 `methods` 데이터 전송

---

**최종 업데이트:** 2026-06-02  
**컴포넌트 버전:** 1.0  
**상태:** ✅ Production Ready
