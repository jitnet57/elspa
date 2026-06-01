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
  overtimeHourlyRate: number;        // 평일 야근수당 시급 (₱/시간)
  overtimeMinThreshold: number;      // 야근 인정 최소 분 (이 분 이상일 때만 야근수당 지급, 기본 40)
  nationalHolidayOtRate: number;     // 국가 공휴일 야근 시급 (₱/시간)
  specialHolidayOtRate: number;      // 특별 공휴일 야근 시급 (₱/시간)
  lateGraceMinutes: number;          // 지각 유예 분 (이 분까지는 차감 없음)
  latePerMinute: number;             // 지각 차감 (₱/분, 유예 초과분에 대해)
  nationalHolidayMultiplier: number; // 국가 공휴일 (일) 배율 (예: 2.0 → 일급의 2배)
  specialHolidayMultiplier: number;  // 일반(특별) 공휴일 (일) 배율 (예: 1.3)
  // 테라피스트 세션별(마사지 종류별) 수수료 — 종류마다 다른 정해진 금액(₱/세션)
  therapistCommission: Record<string, number>;
}

// 마사지 종류별 테라피스트 세션 수수료 기본값 (₱/세션)
export const DEFAULT_THERAPIST_COMMISSION: Record<string, number> = {
  'Thai Massage': 300,
  'Swedish Massage': 280,
  'Deep Tissue': 400,
  'Foot Massage': 200,
  'Facial Treatment': 350,
  'Aromatherapy': 250,
  'Hot Stone Massage': 380,
};

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  overtimeHourlyRate: 70,        // 평일 야근 40분 이상 시 1시간당 70 peso
  overtimeMinThreshold: 40,      // 40분 이상부터 야근 인정
  nationalHolidayOtRate: 140,    // 국가공휴일 야근 시급 (70 × 2.0)
  specialHolidayOtRate: 91,      // 특별공휴일 야근 시급 (70 × 1.3)
  lateGraceMinutes: 10,          // 출근 5~10분 유예, 11분부터 차감
  latePerMinute: 10,             // 유예 초과분 1분당 10 peso 차감
  nationalHolidayMultiplier: 2.0,
  specialHolidayMultiplier: 1.3,
  therapistCommission: DEFAULT_THERAPIST_COMMISSION,
};

const KEY = 'elspa.payroll.settings';

export function getPayrollSettings(): PayrollSettings {
  if (typeof window === 'undefined') return DEFAULT_PAYROLL_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PAYROLL_SETTINGS;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_PAYROLL_SETTINGS,
      ...saved,
      // 종류별 수수료는 기본값에 저장값을 병합 (누락 종류 보존)
      therapistCommission: { ...DEFAULT_THERAPIST_COMMISSION, ...(saved.therapistCommission || {}) },
    };
  } catch {
    return DEFAULT_PAYROLL_SETTINGS;
  }
}

export function savePayrollSettings(s: PayrollSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}
