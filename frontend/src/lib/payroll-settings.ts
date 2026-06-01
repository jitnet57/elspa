/**
 * ============================================================
 * 📌 모듈: payroll-settings
 * 📋 목적: 급여 계산에 쓰이는 단가/배율을 설정에서 등록·조회
 *    - 야근수당 시급, 지각 차감 분당단가, 공휴일(국가/일반) 배율
 * 💾 저장: localStorage (단말 공용). 추후 Supabase settings 테이블로 이관 가능.
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

export interface PayrollSettings {
  overtimeHourlyRate: number;        // 야근수당 시급 (₱/시간)
  overtimeMinThreshold: number;      // 야근 인정 최소 분 (이 분 이상일 때만 야근수당 지급, 기본 40)
  lateGraceMinutes: number;          // 지각 유예 분 (이 분까지는 차감 없음)
  latePerMinute: number;             // 지각 차감 (₱/분, 유예 초과분에 대해)
  nationalHolidayMultiplier: number; // 국가 공휴일 배율 (예: 2.0 → 일급의 2배)
  specialHolidayMultiplier: number;  // 일반(특별) 공휴일 배율 (예: 1.3)
}

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  overtimeHourlyRate: 150,
  overtimeMinThreshold: 40,
  lateGraceMinutes: 0,
  latePerMinute: 50,
  nationalHolidayMultiplier: 2.0,
  specialHolidayMultiplier: 1.3,
};

const KEY = 'elspa.payroll.settings';

export function getPayrollSettings(): PayrollSettings {
  if (typeof window === 'undefined') return DEFAULT_PAYROLL_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PAYROLL_SETTINGS, ...JSON.parse(raw) } : DEFAULT_PAYROLL_SETTINGS;
  } catch {
    return DEFAULT_PAYROLL_SETTINGS;
  }
}

export function savePayrollSettings(s: PayrollSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}
