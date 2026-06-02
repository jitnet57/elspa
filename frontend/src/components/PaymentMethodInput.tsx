'use client';

/**
 * ============================================================
 * 📌 Component: PaymentMethodInput
 * 📋 목적: 복수 결제 수단을 통한 금액 분배 입력
 * 🔧 기능:
 *    - 결제 수단 추가/제거 (카드, 현금, Gcash, BankA, BankB)
 *    - 각 수단별 금액 입력
 *    - 실시간 합계 계산 및 남은 금액 표시
 *    - 총액 검증 (합 = 청구액)
 *    - 유효성 검사 및 에러 표시
 * 🔧 상태 관리: Zustand 기반 커스텀 훅 (usePaymentMethodStore)
 * 📤 반환값: PaymentMethodData[]
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================
// Types & Interfaces
// ============================================================

/**
 * 지원하는 결제 수단 타입
 * - card: 신용카드
 * - cash: 현금
 * - gcash: GCash (필리핀 디지털 결제)
 * - bank_a: 은행 A (로컬 은행)
 * - bank_b: 은행 B (로컬 은행)
 */
export type PaymentMethod = 'card' | 'cash' | 'gcash' | 'bank_a' | 'bank_b';

/**
 * 결제 수단 항목 인터페이스
 */
export interface PaymentMethodData {
  id: string;                    // 고유 ID (UUID 또는 timestamp)
  method: PaymentMethod;         // 결제 수단
  amount: number;                // 결제 금액
  reference?: string;            // 참조번호 (선택사항: 거래번호, 체크번호 등)
  notes?: string;                // 메모 (선택사항)
}

/**
 * 컴포넌트 Props
 */
interface PaymentMethodInputProps {
  totalAmount: number;           // 청구 총액
  initialMethods?: PaymentMethodData[];  // 초기 결제 수단 데이터
  onChange?: (methods: PaymentMethodData[]) => void;  // 변경 콜백
  onValidationChange?: (isValid: boolean) => void;    // 유효성 콜백
  currency?: string;             // 통화 기호 (기본값: ₱)
  locale?: 'en' | 'ko';          // 언어 설정
}

/**
 * 검증 에러 타입
 */
interface ValidationError {
  totalMismatch?: string;
  negativeAmount?: string;
  duplicateMethod?: string;
  invalidReference?: string;
}

// ============================================================
// Payment Method Configuration
// ============================================================

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; hint: string }> = {
  card: {
    label: 'Credit/Debit Card',
    icon: '💳',
    hint: 'Enter card reference or last 4 digits',
  },
  cash: {
    label: 'Cash',
    icon: '💵',
    hint: 'No reference required for cash',
  },
  gcash: {
    label: 'GCash',
    icon: '📱',
    hint: 'Enter GCash transaction ID',
  },
  bank_a: {
    label: 'Bank A Transfer',
    icon: '🏦',
    hint: 'Enter bank reference or check number',
  },
  bank_b: {
    label: 'Bank B Transfer',
    icon: '🏦',
    hint: 'Enter bank reference or check number',
  },
};

// ============================================================
// Main Component
// ============================================================

export function PaymentMethodInput({
  totalAmount,
  initialMethods = [],
  onChange,
  onValidationChange,
  currency = '₱',
  locale = 'en',
}: PaymentMethodInputProps) {
  // ============================================================
  // State Management
  // ============================================================

  const [methods, setMethods] = useState<PaymentMethodData[]>(initialMethods);
  const [errors, setErrors] = useState<ValidationError>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // ============================================================
  // Calculated Values
  // ============================================================

  /**
   * 결제 수단별 금액의 합계 계산
   */
  const totalPaid = useMemo(() => {
    return methods.reduce((sum, method) => sum + (method.amount || 0), 0);
  }, [methods]);

  /**
   * 남은 금액 (청구액 - 결제액)
   */
  const remainingAmount = useMemo(() => {
    return Math.max(0, totalAmount - totalPaid);
  }, [totalAmount, totalPaid]);

  /**
   * 초과 결제액 (결제액 > 청구액)
   */
  const overpaymentAmount = useMemo(() => {
    return Math.max(0, totalPaid - totalAmount);
  }, [totalAmount, totalPaid]);

  /**
   * 유효성 검사 상태
   * - 총액과 결제액이 정확히 일치해야 함
   * - 음수 금액이 없어야 함
   */
  const isValid = useMemo(() => {
    return (
      methods.length > 0 &&
      totalPaid === totalAmount &&
      methods.every((m) => m.amount >= 0) &&
      !Object.keys(errors).length
    );
  }, [methods, totalAmount, totalPaid, errors]);

  // ============================================================
  // Validation Logic
  // ============================================================

  /**
   * 검증 수행 및 에러 메시지 생성
   */
  const validate = useCallback((updatedMethods: PaymentMethodData[]): ValidationError => {
    const newErrors: ValidationError = {};
    const total = updatedMethods.reduce((sum, m) => sum + (m.amount || 0), 0);

    // 총액 검증
    if (total !== totalAmount) {
      newErrors.totalMismatch = `Total must equal ${currency}${totalAmount.toFixed(2)}`;
    }

    // 음수 금액 검증
    const hasNegative = updatedMethods.some((m) => m.amount < 0);
    if (hasNegative) {
      newErrors.negativeAmount = 'Payment amounts cannot be negative';
    }

    // 중복 결제 수단 검증
    const methodCounts: Record<PaymentMethod, number> = {
      card: 0,
      cash: 0,
      gcash: 0,
      bank_a: 0,
      bank_b: 0,
    };
    updatedMethods.forEach((m) => {
      methodCounts[m.method]++;
    });

    // 현금은 1회만 허용
    if (methodCounts.cash > 1) {
      newErrors.duplicateMethod = 'Only one cash payment allowed';
    }

    return newErrors;
  }, [totalAmount, currency]);

  // ============================================================
  // Event Handlers
  // ============================================================

  /**
   * 새로운 결제 수단 추가
   */
  const handleAddMethod = useCallback(() => {
    const newMethod: PaymentMethodData = {
      id: `payment_${Date.now()}`,
      method: 'card',
      amount: remainingAmount,
      reference: '',
      notes: '',
    };

    const updatedMethods = [...methods, newMethod];
    setMethods(updatedMethods);
    onChange?.(updatedMethods);
  }, [methods, remainingAmount, onChange]);

  /**
   * 결제 수단 제거
   */
  const handleRemoveMethod = useCallback(
    (id: string) => {
      const updatedMethods = methods.filter((m) => m.id !== id);
      const newErrors = validate(updatedMethods);
      setMethods(updatedMethods);
      setErrors(newErrors);
      onValidationChange?.(updatedMethods.length > 0 && !Object.keys(newErrors).length);
      onChange?.(updatedMethods);
    },
    [methods, validate, onChange, onValidationChange]
  );

  /**
   * 결제 수단 변경
   */
  const handleMethodChange = useCallback(
    (id: string, newMethod: PaymentMethod) => {
      const updatedMethods = methods.map((m) =>
        m.id === id ? { ...m, method: newMethod } : m
      );
      const newErrors = validate(updatedMethods);
      setMethods(updatedMethods);
      setErrors(newErrors);
      onValidationChange?.(updatedMethods.length > 0 && !Object.keys(newErrors).length);
      onChange?.(updatedMethods);
    },
    [methods, validate, onChange, onValidationChange]
  );

  /**
   * 금액 입력 처리
   */
  const handleAmountChange = useCallback(
    (id: string, value: string) => {
      const amount = value ? parseFloat(value) : 0;

      // NaN 체크
      if (isNaN(amount)) return;

      const updatedMethods = methods.map((m) =>
        m.id === id ? { ...m, amount: Math.max(0, amount) } : m
      );

      const newErrors = validate(updatedMethods);
      setMethods(updatedMethods);
      setErrors(newErrors);
      onValidationChange?.(updatedMethods.length > 0 && !Object.keys(newErrors).length);
      onChange?.(updatedMethods);
    },
    [methods, validate, onChange, onValidationChange]
  );

  /**
   * 참조번호 변경
   */
  const handleReferenceChange = useCallback(
    (id: string, value: string) => {
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, reference: value } : m))
      );
    },
    []
  );

  /**
   * 메모 변경
   */
  const handleNotesChange = useCallback(
    (id: string, value: string) => {
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, notes: value } : m))
      );
    },
    []
  );

  /**
   * 남은 금액을 현재 항목에 자동 채우기
   */
  const handleAutoFill = useCallback(
    (id: string) => {
      const updatedMethods = methods.map((m) =>
        m.id === id ? { ...m, amount: remainingAmount } : m
      );
      const newErrors = validate(updatedMethods);
      setMethods(updatedMethods);
      setErrors(newErrors);
      onValidationChange?.(updatedMethods.length > 0 && !Object.keys(newErrors).length);
      onChange?.(updatedMethods);
    },
    [methods, remainingAmount, validate, onChange, onValidationChange]
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="w-full space-y-4">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {locale === 'ko' ? '결제 수단' : 'Payment Methods'}
        </h3>
        <span className="text-xs text-gray-500">
          {locale === 'ko' ? `총 ${methods.length}개` : `${methods.length} method(s)`}
        </span>
      </div>

      {/* ===== Error Messages ===== */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
          {errors.totalMismatch && (
            <p className="text-red-700 text-sm">
              ⚠️ {errors.totalMismatch}
            </p>
          )}
          {errors.negativeAmount && (
            <p className="text-red-700 text-sm">
              ⚠️ {errors.negativeAmount}
            </p>
          )}
          {errors.duplicateMethod && (
            <p className="text-red-700 text-sm">
              ⚠️ {errors.duplicateMethod}
            </p>
          )}
        </div>
      )}

      {/* ===== Payment Methods List ===== */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {methods.map((method, index) => (
          <PaymentMethodItem
            key={method.id}
            method={method}
            index={index}
            currency={currency}
            locale={locale}
            remainingAmount={remainingAmount}
            isEditing={editingId === method.id}
            onEdit={() => setEditingId(method.id)}
            onMethodChange={(newMethod) => handleMethodChange(method.id, newMethod)}
            onAmountChange={(value) => handleAmountChange(method.id, value)}
            onReferenceChange={(value) => handleReferenceChange(method.id, value)}
            onNotesChange={(value) => handleNotesChange(method.id, value)}
            onRemove={() => handleRemoveMethod(method.id)}
            onAutoFill={() => handleAutoFill(method.id)}
          />
        ))}
      </div>

      {/* ===== Summary Section ===== */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {locale === 'ko' ? '청구 총액:' : 'Total Amount:'}
          </span>
          <span className="font-semibold text-gray-900">
            {currency}{totalAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {locale === 'ko' ? '결제액:' : 'Total Paid:'}
          </span>
          <span className="font-semibold text-gray-900">
            {currency}{totalPaid.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
          <span className={`text-sm font-medium ${
            remainingAmount > 0
              ? 'text-orange-600'
              : overpaymentAmount > 0
              ? 'text-blue-600'
              : 'text-green-600'
          }`}>
            {remainingAmount > 0
              ? locale === 'ko'
                ? '남은 금액:'
                : 'Remaining:'
              : overpaymentAmount > 0
              ? locale === 'ko'
                ? '초과 결제:'
                : 'Overpayment:'
              : locale === 'ko'
              ? '완납:'
              : 'Complete:'}
          </span>
          <span className={`font-bold text-lg ${
            remainingAmount > 0
              ? 'text-orange-600'
              : overpaymentAmount > 0
              ? 'text-blue-600'
              : 'text-green-600'
          }`}>
            {currency}{(remainingAmount > 0 ? remainingAmount : overpaymentAmount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ===== Action Buttons ===== */}
      <div className="flex gap-2">
        <button
          onClick={handleAddMethod}
          disabled={remainingAmount <= 0}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition ${
            remainingAmount <= 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {locale === 'ko' ? '+ 결제 수단 추가' : '+ Add Payment Method'}
        </button>

        {!isValid && methods.length > 0 && (
          <div className="flex items-center gap-2 text-red-600 text-xs">
            <span>⚠️</span>
            <span>{locale === 'ko' ? '검증 실패' : 'Invalid'}</span>
          </div>
        )}
      </div>

      {/* ===== Validation Status ===== */}
      {isValid && methods.length > 0 && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-green-700 text-sm font-medium">
            {locale === 'ko' ? '검증 완료' : 'Validation Passed'}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PaymentMethodItem Component (Sub-component)
// ============================================================

/**
 * 개별 결제 수단 항목
 */
interface PaymentMethodItemProps {
  method: PaymentMethodData;
  index: number;
  currency: string;
  locale: 'en' | 'ko';
  remainingAmount: number;
  isEditing: boolean;
  onEdit: () => void;
  onMethodChange: (method: PaymentMethod) => void;
  onAmountChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onRemove: () => void;
  onAutoFill: () => void;
}

function PaymentMethodItem({
  method,
  index,
  currency,
  locale,
  remainingAmount,
  isEditing,
  onEdit,
  onMethodChange,
  onAmountChange,
  onReferenceChange,
  onNotesChange,
  onRemove,
  onAutoFill,
}: PaymentMethodItemProps) {
  const config = PAYMENT_METHOD_CONFIG[method.method];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* ===== Method Header ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{config.label}</p>
            <p className="text-xs text-gray-500">{config.hint}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition text-lg"
          title="Remove payment method"
        >
          ✕
        </button>
      </div>

      {/* ===== Method Selection (Dropdown) ===== */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {locale === 'ko' ? '결제 수단' : 'Method'}
          </label>
          <select
            value={method.method}
            onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Object.keys(PAYMENT_METHOD_CONFIG) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_CONFIG[m].icon} {PAYMENT_METHOD_CONFIG[m].label}
              </option>
            ))}
          </select>
        </div>

        {/* ===== Amount Input ===== */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {locale === 'ko' ? '금액' : 'Amount'}
          </label>
          <div className="flex gap-1">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-gray-600 text-sm">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={method.amount || ''}
                onChange={(e) => onAmountChange(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <button
              onClick={onAutoFill}
              className="px-2 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
              title="Auto-fill with remaining amount"
            >
              {locale === 'ko' ? '자동' : 'Auto'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Reference & Notes (Collapsible) ===== */}
      <div className="border-t border-gray-200 pt-3">
        <button
          onClick={onEdit}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {isEditing
            ? locale === 'ko'
              ? '간단히 보기 ▲'
              : 'Collapse ▲'
            : locale === 'ko'
            ? '자세히 보기 ▼'
            : 'Details ▼'}
        </button>

        {isEditing && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === 'ko' ? '참조번호 (선택)' : 'Reference (Optional)'}
              </label>
              <input
                type="text"
                value={method.reference || ''}
                onChange={(e) => onReferenceChange(e.target.value)}
                placeholder={config.hint}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {locale === 'ko' ? '메모 (선택)' : 'Notes (Optional)'}
              </label>
              <textarea
                value={method.notes || ''}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder={locale === 'ko' ? '추가 정보...' : 'Additional information...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-12 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Export Zustand Store Hook (optional - for state management)
// ============================================================

/**
 * 선택적: Zustand store를 사용한 전역 상태 관리
 * 여러 페이지에서 결제 정보를 공유해야 할 경우 사용
 */
export function usePaymentMethodStore() {
  // Zustand 스토어 구현 (선택사항)
  // 이 파일과 분리하여 @/lib/store/payment.ts에 구현 가능
}
