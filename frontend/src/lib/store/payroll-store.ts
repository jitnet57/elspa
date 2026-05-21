/**
 * 📌 Zustand Payroll Store
 * 📋 목적: 급여 정산 시스템의 전역 상태 관리 (employees, periods, cash advances, etc.)
 * 🔧 포함: 상태, 액션, 에러 처리, Retry 로직 (최대 3회)
 * 📅 작성일: 2026-05-22
 */

import { create } from 'zustand';
import {
  Employee,
  PayrollPeriod,
  CashAdvance,
  AttendanceLog,
  PhilippineHoliday,
  PayrollRecord,
  getEmployees,
  getPayrollPeriods,
  getCashAdvances,
  getAttendance,
  getHolidays,
  getPayrollRecords,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createCashAdvance,
  updateCashAdvanceStatus,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  calculatePayroll,
  approvePeriod,
} from '@/lib/api/payroll-client';

// ============================================================
// State Types
// ============================================================

interface PayrollState {
  // Loading states
  loading: boolean;
  loadingByKey: Record<string, boolean>;

  // Data states
  employees: Employee[];
  periods: PayrollPeriod[];
  cashAdvances: CashAdvance[];
  attendance: AttendanceLog[];
  holidays: PhilippineHoliday[];
  records: PayrollRecord[];

  // Error state
  error: string | null;

  // Actions - Employee
  fetchEmployees: (params?: any) => Promise<void>;
  createNewEmployee: (data: Partial<Employee>) => Promise<Employee>;
  updateExistingEmployee: (id: number, data: Partial<Employee>) => Promise<Employee>;
  deleteExistingEmployee: (id: number) => Promise<void>;

  // Actions - Payroll Period
  fetchPeriods: (params?: any) => Promise<void>;
  startCalculation: (periodId: number) => Promise<void>;
  approvePeriodAction: (periodId: number) => Promise<void>;

  // Actions - Cash Advance
  fetchCashAdvances: (params?: any) => Promise<void>;
  createNewCashAdvance: (data: Partial<CashAdvance>) => Promise<CashAdvance>;
  updateCAStatus: (id: number, status: string) => Promise<CashAdvance>;

  // Actions - Attendance
  fetchAttendance: (params?: any) => Promise<void>;
  createNewAttendance: (data: Partial<AttendanceLog>) => Promise<AttendanceLog>;
  updateExistingAttendance: (id: number, data: Partial<AttendanceLog>) => Promise<AttendanceLog>;
  deleteExistingAttendance: (id: number) => Promise<void>;

  // Actions - Holiday
  fetchHolidays: (params?: any) => Promise<void>;
  createNewHoliday: (data: Partial<PhilippineHoliday>) => Promise<PhilippineHoliday>;
  updateExistingHoliday: (id: number, data: Partial<PhilippineHoliday>) => Promise<PhilippineHoliday>;
  deleteExistingHoliday: (id: number) => Promise<void>;

  // Actions - Record
  fetchRecords: (params?: any) => Promise<void>;

  // Utility
  clearError: () => void;
}

// ============================================================
// Retry Logic (최대 3회)
// ============================================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  throw lastError || new Error('최대 재시도 횟수 초과');
}

// ============================================================
// Zustand Store
// ============================================================

export const usePayrollStore = create<PayrollState>((set, get) => ({
  // Initial state
  loading: false,
  loadingByKey: {},
  employees: [],
  periods: [],
  cashAdvances: [],
  attendance: [],
  holidays: [],
  records: [],
  error: null,

  // ============================================================
  // Employee Actions
  // ============================================================

  fetchEmployees: async (params?: any) => {
    set({ loading: true, error: null, loadingByKey: { ...get().loadingByKey, employees: true } });
    try {
      const data = await withRetry(() => getEmployees(params));
      set({ employees: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : '직원 목록 로드 실패';
      set({ error: message });
    } finally {
      set({ loading: false, loadingByKey: { ...get().loadingByKey, employees: false } });
    }
  },

  createNewEmployee: async (data: Partial<Employee>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => createEmployee(data));
      set(state => ({
        employees: [...state.employees, result],
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '직원 생성 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateExistingEmployee: async (id: number, data: Partial<Employee>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => updateEmployee(id, data));
      set(state => ({
        employees: state.employees.map(e => (e.id === id ? result : e)),
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '직원 업데이트 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteExistingEmployee: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await withRetry(() => deleteEmployee(id));
      set(state => ({
        employees: state.employees.filter(e => e.id !== id),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '직원 삭제 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ============================================================
  // Payroll Period Actions
  // ============================================================

  fetchPeriods: async (params?: any) => {
    set({ loading: true, error: null, loadingByKey: { ...get().loadingByKey, periods: true } });
    try {
      const data = await withRetry(() => getPayrollPeriods(params));
      set({ periods: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : '정산 기간 로드 실패';
      set({ error: message });
    } finally {
      set({ loading: false, loadingByKey: { ...get().loadingByKey, periods: false } });
    }
  },

  startCalculation: async (periodId: number) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => calculatePayroll(periodId));
      // Re-fetch periods to get updated status
      await get().fetchPeriods();
      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '정산 계산 시작 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  approvePeriodAction: async (periodId: number) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => approvePeriod(periodId));
      set(state => ({
        periods: state.periods.map(p => (p.id === periodId ? result : p)),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '정산 기간 승인 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ============================================================
  // Cash Advance Actions
  // ============================================================

  fetchCashAdvances: async (params?: any) => {
    set({
      loading: true,
      error: null,
      loadingByKey: { ...get().loadingByKey, cashAdvances: true },
    });
    try {
      const data = await withRetry(() => getCashAdvances(params));
      set({ cashAdvances: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : '현금선금 목록 로드 실패';
      set({ error: message });
    } finally {
      set({
        loading: false,
        loadingByKey: { ...get().loadingByKey, cashAdvances: false },
      });
    }
  },

  createNewCashAdvance: async (data: Partial<CashAdvance>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => createCashAdvance(data));
      set(state => ({
        cashAdvances: [...state.cashAdvances, result],
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '현금선금 생성 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateCAStatus: async (id: number, status: string) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => updateCashAdvanceStatus(id, status));
      set(state => ({
        cashAdvances: state.cashAdvances.map(ca => (ca.id === id ? result : ca)),
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '현금선금 상태 업데이트 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ============================================================
  // Attendance Actions
  // ============================================================

  fetchAttendance: async (params?: any) => {
    set({
      loading: true,
      error: null,
      loadingByKey: { ...get().loadingByKey, attendance: true },
    });
    try {
      const data = await withRetry(() => getAttendance(params));
      set({ attendance: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : '출퇴근 기록 로드 실패';
      set({ error: message });
    } finally {
      set({
        loading: false,
        loadingByKey: { ...get().loadingByKey, attendance: false },
      });
    }
  },

  createNewAttendance: async (data: Partial<AttendanceLog>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => createAttendance(data));
      set(state => ({
        attendance: [...state.attendance, result],
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '출퇴근 기록 생성 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateExistingAttendance: async (id: number, data: Partial<AttendanceLog>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => updateAttendance(id, data));
      set(state => ({
        attendance: state.attendance.map(a => (a.id === id ? result : a)),
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '출퇴근 기록 업데이트 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteExistingAttendance: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await withRetry(() => deleteAttendance(id));
      set(state => ({
        attendance: state.attendance.filter(a => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '출퇴근 기록 삭제 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ============================================================
  // Holiday Actions
  // ============================================================

  fetchHolidays: async (params?: any) => {
    set({
      loading: true,
      error: null,
      loadingByKey: { ...get().loadingByKey, holidays: true },
    });
    try {
      const data = await withRetry(() => getHolidays(params));
      set({ holidays: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : '공휴일 목록 로드 실패';
      set({ error: message });
    } finally {
      set({
        loading: false,
        loadingByKey: { ...get().loadingByKey, holidays: false },
      });
    }
  },

  createNewHoliday: async (data: Partial<PhilippineHoliday>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => createHoliday(data));
      set(state => ({
        holidays: [...state.holidays, result],
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '공휴일 생성 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateExistingHoliday: async (id: number, data: Partial<PhilippineHoliday>) => {
    set({ loading: true, error: null });
    try {
      const result = await withRetry(() => updateHoliday(id, data));
      set(state => ({
        holidays: state.holidays.map(h => (h.id === id ? result : h)),
        loading: false,
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '공휴일 업데이트 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteExistingHoliday: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await withRetry(() => deleteHoliday(id));
      set(state => ({
        holidays: state.holidays.filter(h => h.id !== id),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '공휴일 삭제 실패';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ============================================================
  // Payroll Record Actions
  // ============================================================

  fetchRecords: async (params?: any) => {
    set({
      loading: true,
      error: null,
      loadingByKey: { ...get().loadingByKey, records: true },
    });
    try {
      const data = await withRetry(() => getPayrollRecords(params));
      set({ records: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : '정산 결과 로드 실패';
      set({ error: message });
    } finally {
      set({
        loading: false,
        loadingByKey: { ...get().loadingByKey, records: false },
      });
    }
  },

  // ============================================================
  // Utility Actions
  // ============================================================

  clearError: () => set({ error: null }),
}));
