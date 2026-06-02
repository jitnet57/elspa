/**
 * ============================================================
 * 📌 Hook: usePaymentValidation
 * 📋 목적: 결제 수단 입력 검증 로직 (커스텀 훅)
 * 🔧 기능:
 *    - 금액 합계 검증 (정확히 일치해야 함)
 *    - 결제 수단별 유효성 검사
 *    - 중복 결제 수단 검증
 *    - 음수/초과 금액 체크
 *    - 참조번호 포맷 검증 (선택사항)
 *    - 실시간 에러 메시지 생성
 * 📤 반환값: {
 *      isValid: boolean,
 *      errors: ValidationErrors,
 *      errorMessages: string[],
 *      validate: () => boolean,
 * }
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

'use client';

import { useCallback, useMemo } from 'react';
import { PaymentMethodData, PaymentMethod } from '@/components/PaymentMethodInput';

// ============================================================
// Types & Interfaces
// ============================================================

/**
 * 검증 에러 세부사항
 */
export interface ValidationErrors {
  // 전체 검증
  totalMismatch?: {
    field: 'total';
    code: 'AMOUNT_NOT_EQUAL';
    expected: number;
    actual: number;
    difference: number;
  };

  // 금액 검증
  negativeAmount?: {
    field: 'amount';
    code: 'NEGATIVE_AMOUNT';
    methodIds: string[];
    values: number[];
  };

  overpayment?: {
    field: 'total';
    code: 'OVERPAYMENT';
    amount: number;
  };

  // 결제 수단 검증
  duplicateMethod?: {
    field: 'method';
    code: 'DUPLICATE_PAYMENT_METHOD';
    method: PaymentMethod;
    count: number;
  };

  missingReference?: {
    field: 'reference';
    code: 'MISSING_REQUIRED_REFERENCE';
    methodIds: string[];
    methods: PaymentMethod[];
  };

  // 기타
  noPaymentMethods?: {
    field: 'methods';
    code: 'NO_PAYMENT_METHODS';
  };

  invalidAmount?: {
    field: 'amount';
    code: 'INVALID_AMOUNT_FORMAT';
    methodIds: string[];
  };
}

/**
 * 검증 규칙 설정
 */
export interface ValidationRules {
  // 금액 검증 규칙
  requireExactMatch: boolean;           // 청구액과 정확히 일치해야 함
  allowZeroAmount: boolean;             // 0원 결제 허용
  maxAmount: number;                    // 최대 결제액

  // 결제 수단 검증 규칙
  allowDuplicateMethods: Record<PaymentMethod, boolean>;  // 중복 허용 여부
  requireReference: Record<PaymentMethod, boolean>;      // 참조번호 필수 여부

  // 기타
  requireAtLeastOneMethod: boolean;     // 최소 1개 결제 수단 필수
  allowPartialPayment: boolean;         // 부분 결제 허용

  // 언어
  locale: 'en' | 'ko';
}

/**
 * 검증 옵션
 */
export interface ValidationOptions {
  showDetailedErrors?: boolean;         // 상세 에러 메시지
  strictMode?: boolean;                 // 엄격한 검증 모드
}

// ============================================================
// Default Validation Rules
// ============================================================

const DEFAULT_VALIDATION_RULES: ValidationRules = {
  // 금액
  requireExactMatch: true,              // 청구액과 정확히 일치
  allowZeroAmount: false,               // 0원 결제 불허
  maxAmount: 999999999,                 // 최대 999,999,999

  // 결제 수단 (현금은 1회만, 나머지는 중복 허용)
  allowDuplicateMethods: {
    card: true,
    cash: false,                        // 현금은 1회만
    gcash: true,
    bank_a: true,
    bank_b: true,
  },

  // 참조번호 필수 여부
  requireReference: {
    card: false,                        // 선택사항
    cash: false,                        // 현금은 필요 없음
    gcash: true,                        // GCash ID 필수
    bank_a: true,                       // 은행 참조번호 필수
    bank_b: true,                       // 은행 참조번호 필수
  },

  // 기타
  requireAtLeastOneMethod: true,
  allowPartialPayment: false,

  locale: 'en',
};

// ============================================================
// Error Messages
// ============================================================

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

// ============================================================
// Main Hook
// ============================================================

/**
 * 결제 수단 검증 훅
 *
 * 사용 예시:
 * ```typescript
 * const { isValid, errors, errorMessages, validate } = usePaymentValidation(
 *   methods,
 *   totalAmount,
 *   { requireExactMatch: true, locale: 'ko' }
 * );
 * ```
 */
export function usePaymentValidation(
  methods: PaymentMethodData[],
  totalAmount: number,
  customRules?: Partial<ValidationRules>,
  options?: ValidationOptions
) {
  // 검증 규칙 병합
  const rules = useMemo(
    () => ({ ...DEFAULT_VALIDATION_RULES, ...customRules }),
    [customRules]
  );

  // 검증 로직
  const validate = useCallback((): {
    isValid: boolean;
    errors: ValidationErrors;
    errorMessages: string[];
  } => {
    const errors: ValidationErrors = {};
    const errorMessages: string[] = [];

    // ===== 1. 결제 수단 존재 여부 =====
    if (rules.requireAtLeastOneMethod && methods.length === 0) {
      errors.noPaymentMethods = {
        field: 'methods',
        code: 'NO_PAYMENT_METHODS',
      };
      errorMessages.push(ERROR_MESSAGES[rules.locale]['NO_PAYMENT_METHODS']);
      return { isValid: false, errors, errorMessages };
    }

    // ===== 2. 금액 합계 =====
    const totalPaid = methods.reduce((sum, m) => sum + (m.amount || 0), 0);

    if (rules.requireExactMatch && totalPaid !== totalAmount) {
      const difference = totalAmount - totalPaid;
      errors.totalMismatch = {
        field: 'total',
        code: 'AMOUNT_NOT_EQUAL',
        expected: totalAmount,
        actual: totalPaid,
        difference: Math.abs(difference),
      };

      const message =
        rules.locale === 'ko'
          ? `결제액을 ${Math.abs(difference).toFixed(2)}${difference < 0 ? '만큼 줄여야' : '만큼 더해야'} 합니다`
          : `Payment is ${Math.abs(difference).toFixed(2)} ${difference < 0 ? 'too much' : 'too little'}`;

      errorMessages.push(message);
    } else if (!rules.allowPartialPayment && totalPaid > totalAmount) {
      errors.overpayment = {
        field: 'total',
        code: 'OVERPAYMENT',
        amount: totalPaid - totalAmount,
      };
      errorMessages.push(ERROR_MESSAGES[rules.locale]['OVERPAYMENT']);
    }

    // ===== 3. 개별 금액 검증 =====
    const negativeAmountIds: string[] = [];
    const negativeAmountValues: number[] = [];

    methods.forEach((method) => {
      if (method.amount < 0) {
        negativeAmountIds.push(method.id);
        negativeAmountValues.push(method.amount);
      }

      // 최대액 체크
      if (method.amount > rules.maxAmount) {
        if (!errors.invalidAmount) {
          errors.invalidAmount = {
            field: 'amount',
            code: 'INVALID_AMOUNT_FORMAT',
            methodIds: [],
          };
        }
        errors.invalidAmount.methodIds.push(method.id);
      }
    });

    if (negativeAmountIds.length > 0) {
      errors.negativeAmount = {
        field: 'amount',
        code: 'NEGATIVE_AMOUNT',
        methodIds: negativeAmountIds,
        values: negativeAmountValues,
      };
      errorMessages.push(ERROR_MESSAGES[rules.locale]['NEGATIVE_AMOUNT']);
    }

    // ===== 4. 중복 결제 수단 검증 =====
    const methodCounts: Record<PaymentMethod, string[]> = {
      card: [],
      cash: [],
      gcash: [],
      bank_a: [],
      bank_b: [],
    };

    methods.forEach((method) => {
      methodCounts[method.method].push(method.id);
    });

    Object.entries(methodCounts).forEach(([methodType, ids]) => {
      const type = methodType as PaymentMethod;
      if (!rules.allowDuplicateMethods[type] && ids.length > 1) {
        errors.duplicateMethod = {
          field: 'method',
          code: 'DUPLICATE_PAYMENT_METHOD',
          method: type,
          count: ids.length,
        };
        errorMessages.push(ERROR_MESSAGES[rules.locale]['DUPLICATE_PAYMENT_METHOD']);
      }
    });

    // ===== 5. 참조번호 검증 =====
    const missingReferenceIds: string[] = [];
    const missingReferenceMethods: PaymentMethod[] = [];

    methods.forEach((method) => {
      if (
        rules.requireReference[method.method] &&
        (!method.reference || method.reference.trim() === '')
      ) {
        missingReferenceIds.push(method.id);
        missingReferenceMethods.push(method.method);
      }
    });

    if (missingReferenceIds.length > 0) {
      errors.missingReference = {
        field: 'reference',
        code: 'MISSING_REQUIRED_REFERENCE',
        methodIds: missingReferenceIds,
        methods: missingReferenceMethods,
      };
      errorMessages.push(ERROR_MESSAGES[rules.locale]['MISSING_REQUIRED_REFERENCE']);
    }

    // ===== Final Result =====
    const isValid = Object.keys(errors).length === 0;

    return {
      isValid,
      errors,
      errorMessages,
    };
  }, [methods, totalAmount, rules]);

  // 실행 및 결과 캐싱
  const validationResult = useMemo(() => validate(), [validate]);

  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    errorMessages: validationResult.errorMessages,
    validate,
  };
}

// ============================================================
// Helper Hook: Reference Number Validation
// ============================================================

/**
 * 참조번호 포맷 검증 (선택사항)
 */
export function useReferenceValidation(methodType: PaymentMethod) {
  return useCallback(
    (reference: string): { isValid: boolean; message?: string } => {
      // 빈 문자열은 유효함 (선택사항 필드)
      if (!reference || reference.trim() === '') {
        return { isValid: true };
      }

      switch (methodType) {
        case 'card':
          // 카드: 4자 이상 (마지막 4자리 또는 거래번호)
          return {
            isValid: reference.length >= 4 && /^\d+$/.test(reference),
            message: 'Card reference should be numbers (at least 4 digits)',
          };

        case 'gcash':
          // GCash: 8-12자 숫자
          return {
            isValid: /^\d{8,12}$/.test(reference),
            message: 'GCash ID should be 8-12 digits',
          };

        case 'bank_a':
        case 'bank_b':
          // 은행: 6-20자 (숫자, 영문, 하이픈)
          return {
            isValid: /^[A-Z0-9\-]{6,20}$/.test(reference.toUpperCase()),
            message: 'Bank reference should be 6-20 characters (alphanumeric)',
          };

        case 'cash':
          // 현금: 참조번호 필요 없음
          return { isValid: true };

        default:
          return { isValid: true };
      }
    },
    [methodType]
  );
}

// ============================================================
// Export
// ============================================================

export type { ValidationErrors, ValidationRules, ValidationOptions };
export { DEFAULT_VALIDATION_RULES };
