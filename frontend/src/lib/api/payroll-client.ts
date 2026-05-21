/**
 * 📌 Payroll API Client
 * 📋 목적: 급여 정산 API와 통신하는 HTTP 클라이언트 함수 모음
 * 🔧 포함: 직원, 현금선금, 출퇴근, 공휴일, 정산 기간, 정산 결과 API
 * 📅 작성일: 2026-05-22
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================
// 타입 정의
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
// 에러 처리 유틸리티
// ============================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error_message ||
      errorData.detail ||
      `API 요청 실패 (${response.status})`;
    throw new Error(errorMessage);
  }
  return response.json();
}

// ============================================================
// Payroll Period API
// ============================================================

export async function getPayrollPeriods(params?: {
  skip?: number;
  limit?: number;
  pay_group?: string;
  status?: string;
}): Promise<PayrollPeriod[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.pay_group) searchParams.append('pay_group', params.pay_group);
  if (params?.status) searchParams.append('status', params.status);

  const response = await fetch(
    `${API_BASE_URL}/api/payroll/periods?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  return handleResponse<PayrollPeriod[]>(response);
}

export async function getPayrollPeriod(id: number): Promise<PayrollPeriod> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/periods/${id}`,
    { cache: 'no-store' }
  );

  return handleResponse<PayrollPeriod>(response);
}

export async function calculatePayroll(periodId: number): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/periods/${periodId}/calculate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );

  return handleResponse(response);
}

export async function approvePeriod(periodId: number): Promise<PayrollPeriod> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/periods/${periodId}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );

  return handleResponse<PayrollPeriod>(response);
}

// ============================================================
// Employee API
// ============================================================

export async function getEmployees(params?: {
  skip?: number;
  limit?: number;
  employee_type?: string;
}): Promise<Employee[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.employee_type) searchParams.append('employee_type', params.employee_type);

  const response = await fetch(
    `${API_BASE_URL}/api/payroll/employees?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  return handleResponse<Employee[]>(response);
}

export async function getEmployee(id: number): Promise<Employee> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/employees/${id}`,
    { cache: 'no-store' }
  );

  return handleResponse<Employee>(response);
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/employees`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<Employee>(response);
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/employees/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<Employee>(response);
}

export async function deleteEmployee(id: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/employees/${id}`,
    {
      method: 'DELETE',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('직원 삭제 실패');
  }
}

// ============================================================
// Cash Advance API
// ============================================================

export async function getCashAdvances(params?: {
  skip?: number;
  limit?: number;
  status?: string;
}): Promise<CashAdvance[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.status) searchParams.append('status', params.status);

  const response = await fetch(
    `${API_BASE_URL}/api/payroll/cash-advance?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  return handleResponse<CashAdvance[]>(response);
}

export async function createCashAdvance(data: Partial<CashAdvance>): Promise<CashAdvance> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/cash-advance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<CashAdvance>(response);
}

export async function updateCashAdvanceStatus(
  id: number,
  status: string
): Promise<CashAdvance> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/cash-advance/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    }
  );

  return handleResponse<CashAdvance>(response);
}

// ============================================================
// Attendance API
// ============================================================

export async function getAttendance(params?: {
  skip?: number;
  limit?: number;
  work_date?: string;
  employee_id?: number;
}): Promise<AttendanceLog[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.work_date) searchParams.append('work_date', params.work_date);
  if (params?.employee_id) searchParams.append('employee_id', params.employee_id.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/payroll/attendance?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  return handleResponse<AttendanceLog[]>(response);
}

export async function createAttendance(data: Partial<AttendanceLog>): Promise<AttendanceLog> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/attendance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<AttendanceLog>(response);
}

export async function updateAttendance(
  id: number,
  data: Partial<AttendanceLog>
): Promise<AttendanceLog> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/attendance/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<AttendanceLog>(response);
}

export async function deleteAttendance(id: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/attendance/${id}`,
    {
      method: 'DELETE',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('출퇴근 기록 삭제 실패');
  }
}

// ============================================================
// Holiday API
// ============================================================

export async function getHolidays(params?: {
  skip?: number;
  limit?: number;
  holiday_type?: string;
}): Promise<PhilippineHoliday[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.holiday_type) searchParams.append('holiday_type', params.holiday_type);

  const response = await fetch(
    `${API_BASE_URL}/api/payroll/holidays?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  return handleResponse<PhilippineHoliday[]>(response);
}

export async function createHoliday(data: Partial<PhilippineHoliday>): Promise<PhilippineHoliday> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/holidays`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<PhilippineHoliday>(response);
}

export async function updateHoliday(
  id: number,
  data: Partial<PhilippineHoliday>
): Promise<PhilippineHoliday> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/holidays/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    }
  );

  return handleResponse<PhilippineHoliday>(response);
}

export async function deleteHoliday(id: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/holidays/${id}`,
    {
      method: 'DELETE',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('공휴일 삭제 실패');
  }
}

// ============================================================
// Payroll Record API (조회 전용)
// ============================================================

export async function getPayrollRecords(params?: {
  skip?: number;
  limit?: number;
  payroll_period_id?: number;
  employee_id?: number;
  status?: string;
}): Promise<PayrollRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.append('skip', params.skip.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.payroll_period_id)
    searchParams.append('payroll_period_id', params.payroll_period_id.toString());
  if (params?.employee_id) searchParams.append('employee_id', params.employee_id.toString());
  if (params?.status) searchParams.append('status', params.status);

  const response = await fetch(
    `${API_BASE_URL}/api/payroll/records?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  return handleResponse<PayrollRecord[]>(response);
}

export async function getPayrollRecord(id: number): Promise<PayrollRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/payroll/records/${id}`,
    { cache: 'no-store' }
  );

  return handleResponse<PayrollRecord>(response);
}
