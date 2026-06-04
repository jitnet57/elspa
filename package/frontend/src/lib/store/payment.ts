/**
 * ============================================================
 * 📌 Zustand Store: Payment Methods
 * 📋 목적: 결제 수단 상태 관리 (전역 상태)
 * 🔧 기능:
 *    - 결제 수단 목록 상태 관리
 *    - 유효성 검사 상태 관리
 *    - 금액 계산 (합계, 남은 금액)
 *    - 결제 수단 CRUD 작업
 * 📤 사용 예시: const { methods, addMethod, removeMethod } = usePaymentMethodStore();
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaymentMethodData, PaymentMethod } from '@/components/PaymentMethodInput';

// ============================================================
// Types & Interfaces
// ============================================================

/**
 * 결제 상태 저장소 인터페이스
 */
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

// ============================================================
// Zustand Store
// ============================================================

/**
 * 결제 수단 상태 관리 store
 * localStorage에 자동 저장됨
 */
export const usePaymentMethodStore = create<PaymentMethodState>()(
  persist(
    (set, get) => ({
      // ===== Initial State =====
      methods: [],
      totalAmount: 0,
      isValid: false,
      lastUpdated: null,

      // ===== Computed Values (Getters) =====
      /**
       * 결제액 합계 계산
       */
      totalPaid: () => {
        const { methods } = get();
        return methods.reduce((sum, method) => sum + (method.amount || 0), 0);
      },

      /**
       * 남은 금액 계산
       */
      remainingAmount: () => {
        const { totalAmount } = get();
        const totalPaid = get().totalPaid();
        return Math.max(0, totalAmount - totalPaid);
      },

      /**
       * 초과 결제액 계산
       */
      overpaymentAmount: () => {
        const { totalAmount } = get();
        const totalPaid = get().totalPaid();
        return Math.max(0, totalPaid - totalAmount);
      },

      // ===== Actions =====

      /**
       * 결제 수단 목록 전체 설정
       */
      setMethods: (methods: PaymentMethodData[]) => {
        set({
          methods,
          lastUpdated: new Date().toISOString(),
        });
        // 자동 검증
        get().validate();
      },

      /**
       * 청구 총액 설정
       */
      setTotalAmount: (amount: number) => {
        if (amount < 0) {
          console.warn('Total amount cannot be negative');
          return;
        }
        set({
          totalAmount: amount,
          lastUpdated: new Date().toISOString(),
        });
        // 자동 검증
        get().validate();
      },

      /**
       * 결제 수단 추가
       */
      addMethod: (method: PaymentMethodData) => {
        const { methods } = get();
        const newMethods = [...methods, method];
        set({
          methods: newMethods,
          lastUpdated: new Date().toISOString(),
        });
        get().validate();
      },

      /**
       * 결제 수단 제거
       */
      removeMethod: (id: string) => {
        const { methods } = get();
        const newMethods = methods.filter((m) => m.id !== id);
        set({
          methods: newMethods,
          lastUpdated: new Date().toISOString(),
        });
        get().validate();
      },

      /**
       * 특정 결제 수단 업데이트
       */
      updateMethod: (id: string, updates: Partial<PaymentMethodData>) => {
        const { methods } = get();
        const newMethods = methods.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        );
        set({
          methods: newMethods,
          lastUpdated: new Date().toISOString(),
        });
        get().validate();
      },

      /**
       * 결제 수단 전체 삭제
       */
      clearMethods: () => {
        set({
          methods: [],
          isValid: false,
          lastUpdated: new Date().toISOString(),
        });
      },

      /**
       * 유효성 검증
       * 규칙:
       * 1. 총 결제액 = 청구액
       * 2. 음수 금액 없음
       * 3. 현금 결제는 1회만
       */
      validate: () => {
        const { methods, totalAmount } = get();
        const totalPaid = get().totalPaid();

        // 규칙 1: 금액이 정확히 일치해야 함
        const amountMatches = totalPaid === totalAmount;

        // 규칙 2: 음수 금액 체크
        const noNegativeAmounts = methods.every((m) => m.amount >= 0);

        // 규칙 3: 현금 결제 중복 체크
        const cashMethodCount = methods.filter((m) => m.method === 'cash').length;
        const noCashDuplicate = cashMethodCount <= 1;

        const isValid = amountMatches && noNegativeAmounts && noCashDuplicate;

        set({ isValid });
        return isValid;
      },

      /**
       * 유효성 상태 수동 설정
       */
      setValidationStatus: (isValid: boolean) => {
        set({ isValid });
      },
    }),
    {
      name: 'payment-method-store',
      version: 1,
    }
  )
);

// ============================================================
// Helper Functions & Selectors
// ============================================================

/**
 * 특정 결제 수단 필터링 셀렉터
 */
export const selectMethodsByType = (methodType: PaymentMethod) => (state: PaymentMethodState) =>
  state.methods.filter((m) => m.method === methodType);

/**
 * 결제 수단 개수 셀렉터
 */
export const selectMethodCount = (state: PaymentMethodState) => state.methods.length;

/**
 * 특정 결제 수단 찾기 셀렉터
 */
export const selectMethodById = (id: string) => (state: PaymentMethodState) =>
  state.methods.find((m) => m.id === id);

/**
 * 모든 주요 통계 한 번에 가져오기
 */
export const selectPaymentSummary = (state: PaymentMethodState) => ({
  totalAmount: state.totalAmount,
  totalPaid: state.totalPaid(),
  remainingAmount: state.remainingAmount(),
  overpaymentAmount: state.overpaymentAmount(),
  methodCount: state.methods.length,
  isValid: state.isValid,
});

// ============================================================
// Type Exports
// ============================================================

export type { PaymentMethodState };
