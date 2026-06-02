/**
 * ============================================================
 * 📌 Example: PaymentMethodInput Component Usage
 * 📋 목적: PaymentMethodInput 컴포넌트 사용 예시
 * 🔧 포함:
 *    - 기본 사용법
 *    - Zustand 스토어 연동
 *    - 검증 훅 사용
 *    - 다양한 시나리오
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';
import { usePaymentMethodStore } from '@/lib/store/payment';
import { usePaymentValidation } from '@/hooks/payment/usePaymentValidation';

// ============================================================
// Example 1: Basic Usage
// ============================================================

/**
 * 기본 사용 예시: 결제 수단 입력 폼
 */
export function PaymentFormBasicExample() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const totalAmount = 5000; // 5,000 원 또는 ₱

  const handleChange = (updatedMethods: PaymentMethodData[]) => {
    setMethods(updatedMethods);
    console.log('Updated methods:', updatedMethods);
  };

  const handleValidationChange = (isValid: boolean) => {
    console.log('Is valid:', isValid);
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

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Debug Info:</h2>
        <pre className="text-sm">
          {JSON.stringify(
            {
              methodCount: methods.length,
              totalPaid: methods.reduce((sum, m) => sum + (m.amount || 0), 0),
              totalAmount,
              methods,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

// ============================================================
// Example 2: With Zustand Store
// ============================================================

/**
 * Zustand 스토어와 함께 사용하는 예시
 */
export function PaymentFormWithStoreExample() {
  const { methods, setMethods, setTotalAmount, addMethod, removeMethod, isValid } =
    usePaymentMethodStore();

  const totalAmount = 10000;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">결제 수단 - Store 연동</h1>

        <PaymentMethodInput
          totalAmount={totalAmount}
          initialMethods={methods}
          onChange={setMethods}
          onValidationChange={(valid) => {
            if (valid) console.log('✓ 검증 완료');
          }}
          currency="₱"
          locale="ko"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => setTotalAmount(15000)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          청구액을 15,000원으로 변경
        </button>

        {isValid && (
          <button
            onClick={() => {
              console.log('결제 완료:', methods);
              // API 호출 또는 결제 처리
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            결제하기
          </button>
        )}
      </div>

      {/* Store State Display */}
      <div className="p-4 bg-slate-100 rounded-lg">
        <h2 className="font-semibold mb-2">Store State:</h2>
        <div className="space-y-1 text-sm">
          <p>총액: ₱{totalAmount}</p>
          <p>결제액: ₱{methods.reduce((sum, m) => sum + (m.amount || 0), 0)}</p>
          <p>상태: {isValid ? '✓ Valid' : '✗ Invalid'}</p>
          <p>수단 개수: {methods.length}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Example 3: With Custom Validation
// ============================================================

/**
 * 커스텀 검증 규칙을 적용한 예시
 */
export function PaymentFormWithValidationExample() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const totalAmount = 8000;

  const { isValid, errors, errorMessages } = usePaymentValidation(
    methods,
    totalAmount,
    {
      requireExactMatch: true,      // 정확히 일치해야 함
      allowPartialPayment: false,   // 부분 결제 불허
      requireAtLeastOneMethod: true, // 최소 1개 필수
      locale: 'ko',
    }
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">결제 수단 - 커스텀 검증</h1>

      <PaymentMethodInput
        totalAmount={totalAmount}
        onChange={setMethods}
        currency="₱"
        locale="ko"
      />

      {/* Validation Status */}
      {!isValid && errorMessages.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-2">검증 오류:</h3>
          <ul className="space-y-1">
            {errorMessages.map((msg, i) => (
              <li key={i} className="text-red-700 text-sm">
                • {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isValid && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-semibold">✓ 모든 검증이 완료되었습니다!</p>
        </div>
      )}

      {/* Detailed Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Error Details:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(errors, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Example 4: Multiple Payment Scenario
// ============================================================

/**
 * 복수 결제 수단 시나리오
 * 예: 50% 카드, 50% 현금
 */
export function PaymentFormMultipleMethodsExample() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([
    {
      id: 'method_1',
      method: 'card',
      amount: 2500,
      reference: '1234',
    },
    {
      id: 'method_2',
      method: 'cash',
      amount: 2500,
    },
  ]);

  const totalAmount = 5000;
  const { isValid } = usePaymentValidation(methods, totalAmount, {
    locale: 'ko',
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">복수 결제 수단 예시</h1>
      <p className="text-gray-600">
        카드 ₱2,500 + 현금 ₱2,500 = 총액 ₱5,000
      </p>

      <PaymentMethodInput
        totalAmount={totalAmount}
        initialMethods={methods}
        onChange={setMethods}
        currency="₱"
        locale="ko"
      />

      {isValid && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-green-700">
            ✓ 모든 결제 수단이 올바르게 설정되었습니다.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Example 5: Complete Checkout Page
// ============================================================

/**
 * 완전한 결제 페이지 예시
 */
export function CompleteCheckoutPageExample() {
  const [methods, setMethods] = useState<PaymentMethodData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const billItems = [
    { description: '마사지 60분', price: 3000 },
    { description: '스톤 테라피', price: 2000 },
  ];
  const totalAmount = billItems.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('결제 완료:', {
        items: billItems,
        totalAmount,
        methods,
        timestamp: new Date().toISOString(),
      });

      alert('결제가 완료되었습니다!');
      setMethods([]);
    } catch (error) {
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">결제</h1>
      </div>

      {/* Bill Items */}
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

      {/* Payment Methods */}
      <PaymentMethodInput
        totalAmount={totalAmount}
        onChange={setMethods}
        onValidationChange={setIsValid}
        currency="₱"
        locale="ko"
      />

      {/* Submit Button */}
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

// ============================================================
// Export
// ============================================================

export const PaymentExamples = {
  Basic: PaymentFormBasicExample,
  WithStore: PaymentFormWithStoreExample,
  WithValidation: PaymentFormWithValidationExample,
  MultiplePayments: PaymentFormMultipleMethodsExample,
  CompleteCheckout: CompleteCheckoutPageExample,
};
