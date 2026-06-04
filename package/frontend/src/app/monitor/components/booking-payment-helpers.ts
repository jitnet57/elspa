/**
 * ============================================================
 * 📌 파일: booking-payment-helpers
 * 📋 목적: BookingSheetTable 결제 수단 입출력 헬퍼 함수
 * 🔧 사용: loadRows (마이그레이션), saveRow (검증 + 저장)
 * 📅 작성일: 2026-06-03
 * ============================================================
 */

import type { PaymentMethodData } from '@/components/PaymentMethodInput';

/**
 * 📌 함수: convertLegacyPayToMethods
 * 📋 목적: 기존 pay(숫자) → paymentMethods 배열로 마이그레이션
 * 🔧 예시: pay=5000 → [{method: 'cash', amount: 5000}]
 * 📤 반환값: PaymentMethodData[]
 */
export function convertLegacyPayToMethods(pay: number): PaymentMethodData[] {
  if (!pay || pay <= 0) return [];
  return [
    {
      id: `legacy_${Date.now()}`,
      method: 'cash',
      amount: pay,
      reference: '',
      notes: '',
    },
  ];
}

/**
 * 📌 함수: calculateTotalFromMethods
 * 📋 목적: paymentMethods 배열의 모든 금액 합계 계산
 * 🔧 예시: [{amount: 2000}, {amount: 3000}] → 5000
 * 📤 반환값: number (합계)
 */
export function calculateTotalFromMethods(methods: PaymentMethodData[]): number {
  if (!methods || methods.length === 0) return 0;
  return methods.reduce((sum, m) => sum + (m.amount || 0), 0);
}

/**
 * 📌 함수: getPaymentMethodsSummary
 * 📋 목적: 결제 수단 배열을 UI 표시용 요약 문자열로 변환
 * 🔧 예시: [{method: 'card', amount: 2000}, {method: 'cash', amount: 3000}]
 *          → "💳 2,000 + 💵 3,000"
 * 📤 반환값: string (요약)
 */
export function getPaymentMethodsSummary(methods: PaymentMethodData[]): string {
  if (!methods || methods.length === 0) return '💳 미지정';

  const methodIcons: Record<string, string> = {
    card: '💳',
    cash: '💵',
    gcash: '📱',
    bank_a: '🏦',
    bank_b: '🏦',
  };

  return methods
    .map((m) => {
      const icon = methodIcons[m.method] || '💳';
      return `${icon} ${(m.amount || 0).toLocaleString()}`;
    })
    .join(' + ');
}

/**
 * 📌 함수: getPaymentMethodsCount
 * 📋 목적: 결제 수단 개수 반환 (버튼 라벨용)
 * 🔧 예시: [{...}, {...}] → "2개"
 * 📤 반환값: string (개수 표시)
 */
export function getPaymentMethodsCount(methods: PaymentMethodData[]): string {
  if (!methods || methods.length === 0) return '추가';
  return `${methods.length}개`;
}
