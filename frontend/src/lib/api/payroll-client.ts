/**
 * 📌 Payroll API Client — Supabase 직결 (백엔드 없음)
 * 📋 기존 fetch(API_URL) 호출을 supabase-js로 교체. 함수 시그니처는 동일하게 유지하여
 *    관리자 페이지(employees/attendance/cash-advance/holidays/records) 수정 불필요.
 * 📅 작성일: 2026-05-22 / 개정: 2026-05-31 (Supabase 직결 + 계산 로직 프론트 이식)
 */

import { getSupabase } from '@/lib/supabase/client';
import { calculateEmployeePayroll, type CalcAttendance } from '@/lib/payroll/calc';

// ============================================================
// 타입 정의 (변경 없음 — 기존 페이지 호환)
// ============================================================
export interface Employee {
  id: number;
  name: string;
  phone: string;
  employee_type: 'therapist' | 'driver' | 'manager';
  pay_group: 'weekly' | 'biweekly';
  base_salary: number;
  commission_rate: number;
  hire_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriod {
  id: number;
  period_start: string;
  period_end: string;
  pay_group: 'weekly' | 'biweekly';
  status: 'draft' | 'approved' | 'paid';
  created_at: string;
  updated_at: string;
  employeeCount?: number;
  processedCount?: number;
}

export interface CashAdvance {
  id: number;
  employee_id: number;
  employee_name?: string;
  amount: number;
  request_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'settled';
  settled_payroll_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: number;
  employee_id: number;
  employee_name?: string;
  work_date: string;
  clock_in?: string;
  clock_out?: string;
  late_minutes: number;
  overtime_minutes: number;
  is_absent: boolean;
  holiday_type: 'none' | 'national' | 'special';
  created_at: string;
  updated_at: string;
}

export interface PhilippineHoliday {
  id: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: 'national' | 'special';
  rate_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  employee_name?: string;
  period_start?: string;
  period_end?: string;
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
  thirteenth_month_deduction: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: 'draft' | 'approved' | 'paid';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 공통: Supabase 핸들 (미설정 시 명확한 에러)
// ============================================================
function sb() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase 미설정 — NEXT_PUBLIC_SUPABASE_* 환경변수를 확인하세요.');
  return client;
}
const sum = (rows: any[] | null, key: string) =>
  (rows ?? []).reduce((s, r) => s + (Number(r[key]) || 0), 0);

// ============================================================
// Payroll Period
// ============================================================
export async function getPayrollPeriods(params?: {
  skip?: number; limit?: number; pay_group?: string; status?: string;
}): Promise<PayrollPeriod[]> {
  let q = sb().from('payroll_periods').select('*').order('period_end', { ascending: false });
  if (params?.pay_group) q = q.eq('pay_group', params.pay_group);
  if (params?.status) q = q.eq('status', params.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PayrollPeriod[];
}

export async function getPayrollPeriod(id: number): Promise<PayrollPeriod> {
  const { data, error } = await sb().from('payroll_periods').select('*').eq('id', id).single();
  if (error) throw error;
  return data as PayrollPeriod;
}

/**
 * 정산 계산 — 프론트에서 계산 후 payroll_records에 저장 (백엔드 calculate 대체)
 */
export async function calculatePayroll(periodId: number): Promise<{ records: PayrollRecord[] }> {
  const s = sb();
  const period = await getPayrollPeriod(periodId);

  const { data: employees, error: empErr } = await s
    .from('employees').select('*').eq('pay_group', period.pay_group).eq('is_active', true);
  if (empErr) throw empErr;

  const records: PayrollRecord[] = [];

  for (const emp of (employees ?? []) as Employee[]) {
    // 근태
    const { data: att } = await s.from('attendance_logs').select('*')
      .eq('employee_id', emp.id)
      .gte('work_date', period.period_start)
      .lte('work_date', period.period_end);

    // 승인 CA 합계
    const { data: ca } = await s.from('cash_advances').select('amount')
      .eq('employee_id', emp.id).eq('status', 'approved');

    // 이전 13개월 누적 차감
    const { data: prev } = await s.from('payroll_records').select('thirteenth_month_deduction')
      .eq('employee_id', emp.id).eq('is_obsolete', false).neq('status', 'draft');

    // 커미션 (therapist/nail): 기간 내 예약 pay 합계 (이름 매칭, 근사)
    let commissionAmount = 0;
    if (emp.employee_type === 'therapist' || (emp.employee_type as string) === 'nail') {
      const { data: bk } = await s.from('bookings').select('pay')
        .eq('therapist_name', emp.name)
        .gte('booking_date', period.period_start)
        .lte('booking_date', period.period_end)
        .neq('status', 'deleted');
      commissionAmount = sum(bk, 'pay');
    }

    const computed = calculateEmployeePayroll(
      { id: emp.id, name: emp.name, employee_type: emp.employee_type, base_salary: emp.base_salary, hire_date: emp.hire_date },
      (att ?? []) as CalcAttendance[],
      {
        periodStart: period.period_start,
        periodEnd: period.period_end,
        commissionAmount,
        approvedCaAmount: sum(ca, 'amount'),
        previousThirteenthDeductions: sum(prev, 'thirteenth_month_deduction'),
      }
    );

    // 기존 (period, employee) 레코드 정리 후 삽입 (중복 방지)
    await s.from('payroll_records').delete().eq('payroll_period_id', periodId).eq('employee_id', emp.id);
    const { data: inserted, error: insErr } = await s.from('payroll_records').insert({
      payroll_period_id: periodId,
      employee_id: emp.id,
      ...computed,
      status: 'draft',
    }).select().single();
    if (insErr) throw insErr;
    records.push({ ...(inserted as PayrollRecord), employee_name: emp.name });
  }

  return { records };
}

export async function approvePeriod(periodId: number): Promise<PayrollPeriod> {
  const s = sb();
  await s.from('payroll_records').update({ status: 'approved' }).eq('payroll_period_id', periodId);
  const { data, error } = await s.from('payroll_periods').update({ status: 'approved' }).eq('id', periodId).select().single();
  if (error) throw error;
  return data as PayrollPeriod;
}

// ============================================================
// Employee
// ============================================================
export async function getEmployees(params?: { skip?: number; limit?: number; employee_type?: string }): Promise<Employee[]> {
  let q = sb().from('employees').select('*').order('id', { ascending: true });
  if (params?.employee_type) q = q.eq('employee_type', params.employee_type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Employee[];
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data, error } = await sb().from('employees').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Employee;
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  const { data: row, error } = await sb().from('employees').insert(data).select().single();
  if (error) throw error;
  return row as Employee;
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
  const { data: row, error } = await sb().from('employees').update(data).eq('id', id).select().single();
  if (error) throw error;
  return row as Employee;
}

export async function deleteEmployee(id: number): Promise<void> {
  const { error } = await sb().from('employees').delete().eq('id', id);
  if (error) throw new Error('직원 삭제 실패');
}

// ============================================================
// Cash Advance
// ============================================================
export async function getCashAdvances(params?: { skip?: number; limit?: number; status?: string }): Promise<CashAdvance[]> {
  let q = sb().from('cash_advances').select('*').order('request_date', { ascending: false });
  if (params?.status) q = q.eq('status', params.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CashAdvance[];
}

export async function createCashAdvance(data: Partial<CashAdvance>): Promise<CashAdvance> {
  const { data: row, error } = await sb().from('cash_advances').insert(data).select().single();
  if (error) throw error;
  return row as CashAdvance;
}

export async function updateCashAdvanceStatus(id: number, status: string): Promise<CashAdvance> {
  const { data: row, error } = await sb().from('cash_advances').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return row as CashAdvance;
}

// ============================================================
// Attendance
// ============================================================
export async function getAttendance(params?: { skip?: number; limit?: number; work_date?: string; employee_id?: number }): Promise<AttendanceLog[]> {
  let q = sb().from('attendance_logs').select('*').order('work_date', { ascending: false });
  if (params?.work_date) q = q.eq('work_date', params.work_date);
  if (params?.employee_id) q = q.eq('employee_id', params.employee_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AttendanceLog[];
}

export async function createAttendance(data: Partial<AttendanceLog>): Promise<AttendanceLog> {
  const { data: row, error } = await sb().from('attendance_logs').insert(data).select().single();
  if (error) throw error;
  return row as AttendanceLog;
}

export async function updateAttendance(id: number, data: Partial<AttendanceLog>): Promise<AttendanceLog> {
  const { data: row, error } = await sb().from('attendance_logs').update(data).eq('id', id).select().single();
  if (error) throw error;
  return row as AttendanceLog;
}

export async function deleteAttendance(id: number): Promise<void> {
  const { error } = await sb().from('attendance_logs').delete().eq('id', id);
  if (error) throw new Error('출퇴근 기록 삭제 실패');
}

// ============================================================
// Holiday
// ============================================================
export async function getHolidays(params?: { skip?: number; limit?: number; holiday_type?: string }): Promise<PhilippineHoliday[]> {
  let q = sb().from('philippine_holidays').select('*').order('holiday_date', { ascending: true });
  if (params?.holiday_type) q = q.eq('holiday_type', params.holiday_type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PhilippineHoliday[];
}

export async function createHoliday(data: Partial<PhilippineHoliday>): Promise<PhilippineHoliday> {
  const { data: row, error } = await sb().from('philippine_holidays').insert(data).select().single();
  if (error) throw error;
  return row as PhilippineHoliday;
}

export async function updateHoliday(id: number, data: Partial<PhilippineHoliday>): Promise<PhilippineHoliday> {
  const { data: row, error } = await sb().from('philippine_holidays').update(data).eq('id', id).select().single();
  if (error) throw error;
  return row as PhilippineHoliday;
}

export async function deleteHoliday(id: number): Promise<void> {
  const { error } = await sb().from('philippine_holidays').delete().eq('id', id);
  if (error) throw new Error('공휴일 삭제 실패');
}

// ============================================================
// Payroll Record (조회)
// ============================================================
export async function getPayrollRecords(params?: {
  skip?: number; limit?: number; payroll_period_id?: number; employee_id?: number; status?: string;
}): Promise<PayrollRecord[]> {
  let q = sb().from('payroll_records').select('*').eq('is_obsolete', false).order('id', { ascending: true });
  if (params?.payroll_period_id) q = q.eq('payroll_period_id', params.payroll_period_id);
  if (params?.employee_id) q = q.eq('employee_id', params.employee_id);
  if (params?.status) q = q.eq('status', params.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PayrollRecord[];
}

export async function getPayrollRecord(id: number): Promise<PayrollRecord> {
  const { data, error } = await sb().from('payroll_records').select('*').eq('id', id).single();
  if (error) throw error;
  return data as PayrollRecord;
}
