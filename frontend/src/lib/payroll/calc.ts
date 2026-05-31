// ============================================================
// 📌 모듈: 급여 계산 (백엔드 payroll_calculator.py의 TS 이식)
// 📋 목적: 백엔드 없이 프론트에서 필리핀 급여 규칙 계산
// 📅 작성일: 2026-05-31 (원본 2026-05-27 파이썬 로직 1:1 이식)
// 규칙 요약:
//   - 지각: 9분 초과부터 1분당 10 Peso
//   - OT: 40분 이상 시 1시간당 70 Peso (올림)
//   - 공휴일: 일급(월급/15) × 200%(national) / 130%(special) × 일수
//   - 결근(Manager): 13일 이상 출근 → 차감 없음 / 미만 → (15-출근일) 차감
//   - 13개월: 월급/12 × 근속개월 (이전 차감분 제외)
//   - 보건소(Therapist): 분기말(3/6/9/12월) 500 Peso
//   - 식대(Driver): 2주당 200 Peso
// ============================================================

export type EmployeeType = 'therapist' | 'nail' | 'driver' | 'manager' | 'maintenance' | 'hollys' | string;
export type HolidayType = 'none' | 'national' | 'special';

export interface CalcEmployee {
  id: number;
  name: string;
  employee_type: EmployeeType;
  base_salary: number;
  hire_date?: string | null; // "YYYY-MM-DD"
}

export interface CalcAttendance {
  late_minutes?: number;
  overtime_minutes?: number;
  is_absent?: boolean;
  holiday_type?: HolidayType;
}

export interface CalcContext {
  periodStart: string; // "YYYY-MM-DD"
  periodEnd: string;   // "YYYY-MM-DD"
  commissionAmount?: number;     // Therapist/Nail: 예약 기반 커미션 (외부 계산값)
  approvedCaAmount?: number;     // 승인된 CA 합계
  previousThirteenthDeductions?: number; // 이전 정산 13개월 누적 차감
}

export interface PayrollComputed {
  base_amount: number;
  commission_amount: number;
  overtime_amount: number;
  holiday_bonus: number;
  meal_allowance: number;
  late_deduction: number;
  absence_deduction: number;
  sss_deduction: number;
  ca_deduction: number;
  health_check_deduction: number;
  thirteenth_month_accrual: number;
  thirteenth_month_deduction: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// 지각 차감: 9분 초과부터 1분당 10 Peso
export const lateDeduction = (lateMinutes = 0): number =>
  lateMinutes <= 9 ? 0 : (lateMinutes - 9) * 10;

// OT 수당: 40분 이상 시 1시간당 70 Peso (올림)
export const overtimeAmount = (otMinutes = 0): number =>
  otMinutes < 40 ? 0 : Math.ceil(otMinutes / 60) * 70;

// 공휴일 가산: 일급(월급/15) × 배수 × 일수
export const holidayBonus = (baseSalary: number, holidayType: HolidayType, daysWorked = 1): number => {
  const daily = baseSalary / 15;
  if (holidayType === 'national') return daily * 2 * daysWorked;
  if (holidayType === 'special') return daily * 1.3 * daysWorked;
  return 0;
};

// 결근 차감(Manager): 일급 × 부족일수
export const absenceDeduction = (baseSalary: number, daysAbsent: number): number =>
  daysAbsent <= 0 ? 0 : (baseSalary / 15) * daysAbsent;

// 보건소 검사비(Therapist, 분기말 500 Peso)
export const healthCheckDeduction = (employeeType: EmployeeType, periodEnd: string): number => {
  if (employeeType !== 'therapist') return 0;
  const month = Number(periodEnd.slice(5, 7));
  return [3, 6, 9, 12].includes(month) ? 500 : 0;
};

// 근속 개월 수 (입사일~기준일, 최소 1)
export const monthsEmployed = (hireDate?: string | null, referenceDate?: string): number => {
  if (!hireDate || !referenceDate) return 1;
  const h = new Date(hireDate + 'T00:00:00');
  const r = new Date(referenceDate + 'T00:00:00');
  if (h > r) return 0;
  let total = (r.getFullYear() - h.getFullYear()) * 12 + (r.getMonth() - h.getMonth());
  if (r.getDate() >= h.getDate()) total += 1;
  return Math.max(total, 1);
};

// 13개월 보너스 누적액 = 월급/12 × 근속개월
export const thirteenthMonthAccrual = (baseSalary: number, hireDate?: string | null, referenceDate?: string): number => {
  if (baseSalary <= 0) return 0;
  return (baseSalary / 12) * monthsEmployed(hireDate, referenceDate);
};

/**
 * 한 직원의 급여 계산 (백엔드 _calculate_employee_payroll 이식)
 */
export function calculateEmployeePayroll(
  employee: CalcEmployee,
  attendanceLogs: CalcAttendance[],
  ctx: CalcContext
): PayrollComputed {
  const type = employee.employee_type;
  const base = Number(employee.base_salary) || 0;

  // 커미션 (Therapist/Nail) — 외부에서 예약 기반으로 계산해 전달
  const commission = (type === 'therapist' || type === 'nail') ? (ctx.commissionAmount ?? 0) : 0;

  // OT (정직원)
  let overtime = 0;
  if (['manager', 'maintenance', 'driver', 'hollys'].includes(type)) {
    const totalOt = attendanceLogs.reduce((s, l) => s + (l.overtime_minutes ?? 0), 0);
    overtime = overtimeAmount(totalOt);
  }

  // 공휴일 가산
  let holiday = 0;
  for (const log of attendanceLogs) {
    if (log.holiday_type === 'national' || log.holiday_type === 'special') {
      holiday += holidayBonus(base, log.holiday_type);
    }
  }

  // 식대 (Driver)
  const meal = type === 'driver' ? 200 : 0;

  const gross = base + commission + overtime + holiday + meal;

  // 지각 차감
  let late = 0;
  for (const log of attendanceLogs) late += lateDeduction(log.late_minutes ?? 0);

  // 결근 차감 (Manager 13일 보장)
  let absence = 0;
  if (type === 'manager') {
    const daysWorked = attendanceLogs.filter((l) => !l.is_absent).length;
    if (daysWorked < 13) absence = absenceDeduction(base, 15 - daysWorked);
  }

  const sss = 0;
  const ca = ctx.approvedCaAmount ?? 0;

  // 13개월
  const accrual = thirteenthMonthAccrual(base, employee.hire_date, ctx.periodEnd);
  const thirteenthDeduction = Math.max(0, accrual - (ctx.previousThirteenthDeductions ?? 0));

  // 보건소
  const health = healthCheckDeduction(type, ctx.periodEnd);

  const totalDeductions = late + absence + sss + ca + thirteenthDeduction + health;
  const net = Math.max(gross - totalDeductions, 0);

  return {
    base_amount: round2(base),
    commission_amount: round2(commission),
    overtime_amount: round2(overtime),
    holiday_bonus: round2(holiday),
    meal_allowance: round2(meal),
    late_deduction: round2(late),
    absence_deduction: round2(absence),
    sss_deduction: round2(sss),
    ca_deduction: round2(ca),
    health_check_deduction: round2(health),
    thirteenth_month_accrual: round2(accrual),
    thirteenth_month_deduction: round2(thirteenthDeduction),
    gross_pay: round2(gross),
    total_deductions: round2(totalDeductions),
    net_pay: round2(net),
  };
}
