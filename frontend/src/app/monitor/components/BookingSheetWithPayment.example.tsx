'use client';

/**
 * ============================================================
 * 📌 예시: BookingSheetTable + PaymentMethodInput 통합
 * 📋 목적: 예약 테이블과 결제 수단 입력을 하나의 페이지로 통합
 * 🔧 기능:
 *    - BookingSheetTable에서 행 선택
 *    - PaymentMethodInput 모달/드로어로 결제 수단 입력
 *    - 입력된 결제 방법을 행에 저장
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useState, useCallback } from 'react';
import BookingSheetTable from './BookingSheetTable';
import { PaymentMethodInput, PaymentMethodData } from '@/components/PaymentMethodInput';

// ============================================================
// 통합 컴포넌트 Props
// ============================================================

interface BookingWithPaymentProps {
  // 필요시 추가 props
}

// ============================================================
// 메인 컴포넌트: BookingSheetTable + Payment
// ============================================================

/**
 * BookingSheetTable과 PaymentMethodInput을 통합한 페이지
 *
 * 사용 흐름:
 * 1. 예약 테이블에서 "💳 결제" 버튼 클릭
 * 2. 결제 수단 입력 모달 오픈
 * 3. 복수 결제 수단 입력 및 검증
 * 4. "완료" 버튼으로 저장 → 행에 반영
 */
export default function BookingSheetWithPayment(
  _props: BookingWithPaymentProps
) {
  // ============================================================
  // 상태 관리
  // ============================================================

  // 결제 수단 입력 모달
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [isPaymentValid, setIsPaymentValid] = useState(false);

  // 선택된 행의 결제 정보 (pay, tip)
  const [rowPayment, setRowPayment] = useState<{
    pay: number;
    tip: number;
  }>({ pay: 0, tip: 0 });

  // ============================================================
  // 이벤트 핸들러
  // ============================================================

  /**
   * 행의 "💳 결제" 버튼 클릭
   */
  const handleOpenPaymentModal = useCallback(
    (rowIndex: number, pay: number, tip: number) => {
      setSelectedRowIndex(rowIndex);
      setRowPayment({ pay, tip });

      // 기존 결제 금액으로 초기화 (선택사항)
      // setPaymentMethods([
      //   { id: 'init', method: 'card', amount: pay }
      // ]);

      setShowPaymentModal(true);
    },
    []
  );

  /**
   * 결제 모달 닫기
   */
  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedRowIndex(null);
    setPaymentMethods([]);
    setIsPaymentValid(false);
  }, []);

  /**
   * 결제 정보 저장
   */
  const handleSavePayment = useCallback(() => {
    if (!isPaymentValid || selectedRowIndex === null) return;

    // TODO: 이 부분에서 예약 데이터에 결제 정보 저장
    console.log(`행 ${selectedRowIndex + 1}의 결제 수단:`, {
      paymentMethods,
      totalAmount: rowPayment.pay + rowPayment.tip,
      timestamp: new Date().toISOString(),
    });

    // 모달 닫기
    handleClosePaymentModal();

    // 성공 메시지 표시 (선택사항)
    alert(`✅ 행 ${selectedRowIndex + 1}의 결제 정보가 저장되었습니다.`);
  }, [selectedRowIndex, paymentMethods, rowPayment, isPaymentValid, handleClosePaymentModal]);

  // ============================================================
  // 렌더링
  // ============================================================

  return (
    <div className="flex flex-col h-screen">
      {/* ===== 예약 테이블 (상단) ===== */}
      <div className="flex-1 overflow-hidden">
        <BookingSheetTableWithPaymentButton
          onPaymentClick={handleOpenPaymentModal}
        />
      </div>

      {/* ===== 결제 수단 입력 모달 ===== */}
      {showPaymentModal && selectedRowIndex !== null && (
        <PaymentModal
          rowIndex={selectedRowIndex}
          totalAmount={rowPayment.pay + rowPayment.tip}
          paymentMethods={paymentMethods}
          onMethodsChange={setPaymentMethods}
          onValidationChange={setIsPaymentValid}
          onSave={handleSavePayment}
          onClose={handleClosePaymentModal}
          isValid={isPaymentValid}
        />
      )}
    </div>
  );
}

// ============================================================
// Sub-component: BookingSheetTable + Payment Button
// ============================================================

/**
 * BookingSheetTable에 "💳 결제" 버튼을 추가한 확장 버전
 *
 * 실제 구현 시:
 * BookingSheetTable.tsx의 테이블 행에 다음 열을 추가하세요:
 *
 * <td className="px-2 py-1">
 *   <button
 *     onClick={() => onPaymentClick(i, rows[i].pay, rows[i].tip)}
 *     className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
 *     title="결제 수단 입력"
 *   >
 *     💳 {rows[i].pay + rows[i].tip > 0 ? '✓' : ''}
 *   </button>
 * </td>
 */
interface BookingSheetTableWithPaymentButtonProps {
  onPaymentClick: (rowIndex: number, pay: number, tip: number) => void;
}

function BookingSheetTableWithPaymentButton({
  onPaymentClick,
}: BookingSheetTableWithPaymentButtonProps) {
  // 실제 구현에서는 BookingSheetTable을 래핑하고,
  // 테이블 행에 "💳 결제" 버튼을 추가합니다.

  return (
    <div>
      {/* <BookingSheetTable /> */}
      {/* → 각 행에 다음 버튼 추가: */}
      {/* <button onClick={() => onPaymentClick(i, pay, tip)}>💳</button> */}

      {/* 임시 주석 - 실제 구현 시 활용 */}
      <BookingSheetTable />
    </div>
  );
}

// ============================================================
// Sub-component: Payment Modal (결제 모달)
// ============================================================

interface PaymentModalProps {
  rowIndex: number;
  totalAmount: number;
  paymentMethods: PaymentMethodData[];
  onMethodsChange: (methods: PaymentMethodData[]) => void;
  onValidationChange: (isValid: boolean) => void;
  onSave: () => void;
  onClose: () => void;
  isValid: boolean;
}

/**
 * 결제 수단 입력 모달
 */
function PaymentModal({
  rowIndex,
  totalAmount,
  paymentMethods,
  onMethodsChange,
  onValidationChange,
  onSave,
  onClose,
  isValid,
}: PaymentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ===== 모달 헤더 ===== */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">💳 결제 수단 입력</h2>
            <p className="text-sm text-gray-600 mt-1">행 #{rowIndex + 1}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* ===== 청구액 요약 ===== */}
        <div className="p-6 bg-slate-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">청구액:</span>
            <span className="text-2xl font-bold text-gray-900">
              ₱{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ===== PaymentMethodInput 컴포넌트 ===== */}
        <div className="p-6">
          <PaymentMethodInput
            totalAmount={totalAmount}
            initialMethods={paymentMethods}
            onChange={onMethodsChange}
            onValidationChange={onValidationChange}
            currency="₱"
            locale="ko"
          />
        </div>

        {/* ===== 모달 푸터 (버튼) ===== */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            취소
          </button>

          <button
            onClick={onSave}
            disabled={!isValid}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition ${
              isValid
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isValid ? '✓ 저장' : '검증 실패'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 사용 참고사항
// ============================================================

/**
 * BookingSheetTable.tsx에 통합하는 방법:
 *
 * 1. 테이블 열 추가
 * ───────────────────
 * <thead>
 *   <tr>
 *     ...
 *     <th className="px-2 py-2 w-16">Pay</th>
 *     <th className="px-2 py-2 w-16">Tip</th>
 *     <th className="px-2 py-2 w-20">💳</th>  ← 새로운 열
 *   </tr>
 * </thead>
 *
 * 2. 테이블 데이터 행에 버튼 추가
 * ────────────────────────────────
 * <td className="px-2 py-1">
 *   <button
 *     onClick={() => onPaymentClick(i, rows[i].pay, rows[i].tip)}
 *     className="w-full px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-30"
 *     disabled={rows[i].pay === 0 && rows[i].tip === 0}
 *   >
 *     💳
 *     {rows[i].paymentMethodsSet && ' ✓'}
 *   </button>
 * </td>
 *
 * 3. Row 인터페이스 확장
 * ──────────────────────
 * interface Row {
 *   ...
 *   pay: number;
 *   tip: number;
 *   paymentMethods?: PaymentMethodData[];  ← 새로운 필드
 *   paymentMethodsSet?: boolean;            ← 설정 여부 플래그
 * }
 *
 * 4. 완성된 코드 예시:
 * ──────────────────
 * <button
 *   onClick={() => handleOpenPaymentModal(i, rows[i].pay, rows[i].tip)}
 *   className={`w-full px-2 py-1 text-xs rounded font-medium transition ${
 *     rows[i].paymentMethodsSet
 *       ? 'bg-green-600 text-white hover:bg-green-700'
 *       : 'bg-purple-600 text-white hover:bg-purple-700'
 *   }`}
 * >
 *   {rows[i].paymentMethodsSet ? '✓ 결제완료' : '💳 결제'}
 * </button>
 */

// ============================================================
// Export
// ============================================================

export { PaymentModal, BookingSheetTableWithPaymentButton };
