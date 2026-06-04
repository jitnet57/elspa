/**
 * 급여 정산 Mock 데이터
 * ElSpa 테라피스트, 직원, 기타 직종별 실제 계산 데이터
 * 작성일: 2026-05-26
 */

export interface Employee {
  id: string;
  name: string;
  employeeType: 'therapist' | 'nail' | 'driver' | 'maintenance' | 'hollys' | 'manager';
  displayType: string;
  department: string;
  hireDate: string;
  baseSalary: number;
  commissionRate?: number;
  avatar: string;
  payGroup: 'weekly' | 'biweekly';
  status: 'active' | 'inactive';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  name: string;
  employeeType: string;
  period: string;
  periodStartDate: string;
  periodEndDate: string;
  avatar: string;

  // 수입
  earnings: {
    baseSalary: number;
    commission: number;
    overtime: number;
    holidayBonus: number;
    mealAllowance: number;
    serviceBonus?: number;
  };

  // 차감
  deductions: {
    late: number;
    absence: number;
    sssLoan: number;
    cashAdvance: number;
    healthCheck: number;
    thirteenthMonth: number;
  };

  // 합계
  grossPay: number;
  totalDeductions: number;
  netPay: number;

  status: 'Draft' | 'Approved' | 'Paid';
  approvedDate?: string;
  paidDate?: string;
}

export interface Holiday {
  id: string;
  date: string;
  month: string;
  day: string;
  name: string;
  type: 'National' | 'Special';
  multiplier: number;
  year: number;
}

export interface CashAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  requestDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Settled';
  approvedAmount?: number;
  approvalDate?: string;
  settledPayrollId?: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  workDate: string;
  clockIn: string;
  clockOut: string;
  lateMinutes: number;
  overtimeMinutes: number;
  isAbsent: boolean;
  holidayType: 'none' | 'national' | 'special';
}

// ============================================================
// 직원 마스터 데이터
// ============================================================
export const employees: Employee[] = [
  {
    id: '2024-0001',
    name: 'Maria Christina Santos',
    employeeType: 'therapist',
    displayType: 'Therapist',
    department: 'Therapy & Wellness',
    hireDate: '2022-01-12',
    baseSalary: 15500,
    commissionRate: 15,
    avatar: 'MS',
    payGroup: 'weekly',
    status: 'active',
  },
  {
    id: '2024-0002',
    name: 'John Dela Cruz',
    employeeType: 'therapist',
    displayType: 'Therapist',
    department: 'Therapy & Wellness',
    hireDate: '2021-06-15',
    baseSalary: 16000,
    commissionRate: 15,
    avatar: 'JD',
    payGroup: 'weekly',
    status: 'active',
  },
  {
    id: '2024-0003',
    name: 'Rosa Maria Gonzalez',
    employeeType: 'nail',
    displayType: 'Nail Technician',
    department: 'Nail Services',
    hireDate: '2023-03-20',
    baseSalary: 12000,
    commissionRate: 12,
    avatar: 'RG',
    payGroup: 'weekly',
    status: 'active',
  },
  {
    id: '2024-0004',
    name: 'Antonio Reyes',
    employeeType: 'driver',
    displayType: 'Driver',
    department: 'Transport',
    hireDate: '2020-11-08',
    baseSalary: 14000,
    avatar: 'AR',
    payGroup: 'biweekly',
    status: 'active',
  },
  {
    id: '2024-0005',
    name: 'Miguel Santos',
    employeeType: 'maintenance',
    displayType: 'Maintenance',
    department: 'Operations',
    hireDate: '2019-09-01',
    baseSalary: 13500,
    avatar: 'MS',
    payGroup: 'biweekly',
    status: 'active',
  },
  {
    id: '2024-0006',
    name: 'Patricia Lim',
    employeeType: 'hollys',
    displayType: 'Hollys Coffee Staff',
    department: 'Café',
    hireDate: '2023-07-10',
    baseSalary: 11500,
    avatar: 'PL',
    payGroup: 'biweekly',
    status: 'active',
  },
  {
    id: '2024-0007',
    name: 'Fernando Garcia',
    employeeType: 'manager',
    displayType: 'Manager',
    department: 'Administration',
    hireDate: '2018-02-05',
    baseSalary: 25000,
    avatar: 'FG',
    payGroup: 'biweekly',
    status: 'active',
  },
  {
    id: '2024-0008',
    name: 'Jennifer Cruz',
    employeeType: 'therapist',
    displayType: 'Therapist',
    department: 'Therapy & Wellness',
    hireDate: '2022-08-22',
    baseSalary: 15500,
    commissionRate: 15,
    avatar: 'JC',
    payGroup: 'weekly',
    status: 'active',
  },
  {
    id: '2024-0009',
    name: 'Lucia Mendoza',
    employeeType: 'nail',
    displayType: 'Nail Technician',
    department: 'Nail Services',
    hireDate: '2023-01-15',
    baseSalary: 12000,
    commissionRate: 12,
    avatar: 'LM',
    payGroup: 'weekly',
    status: 'active',
  },
  {
    id: '2024-0010',
    name: 'Carlos Reyes',
    employeeType: 'driver',
    displayType: 'Driver',
    department: 'Transport',
    hireDate: '2021-04-12',
    baseSalary: 14000,
    avatar: 'CR',
    payGroup: 'biweekly',
    status: 'active',
  },
];

// ============================================================
// 정산 기록 (초기화)
// ============================================================
export const payrollRecords: PayrollRecord[] = [];

// ============================================================
// 필리핀 공휴일 (초기화)
// ============================================================
export const holidays: Holiday[] = [];

// ============================================================
// 선금 (초기화)
// ============================================================
export const cashAdvances: CashAdvance[] = [];

// ============================================================
// 출퇴근 기록 (초기화)
// ============================================================
export const attendanceLogs: AttendanceLog[] = [];

// ============================================================
// 통계 요약 (초기화)
// ============================================================
export const payrollSummary = {
  totalEmployees: employees.length,
  activeEmployees: employees.filter(e => e.status === 'active').length,
  therapists: employees.filter(e => e.employeeType === 'therapist').length,

  currentPeriod: '',
  totalPayrollAmount: 0,

  recordsStatus: {
    draft: 0,
    approved: 0,
    paid: 0,
  },

  totalNationalHolidays: 0,
  totalSpecialHolidays: 0,
};
