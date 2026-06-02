/**
 * ============================================================
 * 📌 컴포넌트: PaymentMethodModal
 * 📋 목적: BookingSheetTable 행별 결제 수단 입력 모달
 * 🔧 사용: BookingSheetTable에서 "💳 결제 수단" 버튼 클릭 시
 * 📅 작성일: 2026-06-03
 * ============================================================
 */

import { useState } from 'react';
import { PaymentMethodInput } from '@/components/PaymentMethodInput';
import type { PaymentMethodData } from '@/components/PaymentMethodInput';

interface PaymentMethodModalProps {
  isOpen: boolean;
  rowIndex: number | null;
  initialMethods: PaymentMethodData[];
  totalAmount: number;
  onClose: () => void;
  onConfirm: (methods: PaymentMethodData[]) => void;
  locale: 'en' | 'ko';
}

export default function PaymentMethodModal({
  isOpen,
  rowIndex,
  initialMethods,
  totalAmount,
  onClose,
  onConfirm,
  locale,
}: PaymentMethodModalProps) {
  const [methods, setMethods] = useState(initialMethods);
  const [isValid, setIsValid] = useState(false);

  // 모달이 열릴 때마다 초기값 리셋
  const handleOpen = () => {
    setMethods(initialMethods);
    setIsValid(false);
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(methods);
    onClose();
  };

  return (
    <dialog className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {locale === 'ko' ? '결제 수단 입력' : 'Payment Methods'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 청구액 정보 */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            {locale === 'ko' ? '청구액' : 'Total Amount'}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            ₱ {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* PaymentMethodInput 컴포넌트 */}
        <div className="mb-6">
          <PaymentMethodInput
            totalAmount={totalAmount}
            initialMethods={initialMethods}
            onChange={setMethods}
            onValidationChange={setIsValid}
            currency="₱"
            locale={locale}
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            {locale === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            disabled={!isValid}
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {locale === 'ko' ? '확인' : 'Confirm'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
