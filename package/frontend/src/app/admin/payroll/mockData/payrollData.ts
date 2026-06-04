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
// 정산 기록 (Oct 1-15, 2024 / Oct 16-31, 2024)
// ============================================================
export const payrollRecords: PayrollRecord[] = [
  // Oct 1-15, 2024 (주급)
  {
    id: 'PAY-2024-1001',
    employeeId: '2024-0001',
    name: 'Maria Christina Santos',
    employeeType: 'Therapist',
    period: 'Oct 01 - Oct 15, 2024',
    periodStartDate: '2024-10-01',
    periodEndDate: '2024-10-15',
    avatar: 'MS',
    earnings: {
      baseSalary: 7750,
      commission: 4250.5,
      overtime: 1120.25,
      holidayBonus: 0,
      mealAllowance: 750,
    },
    deductions: {
      late: 145,
      absence: 0,
      sssLoan: 500,
      cashAdvance: 1000,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 14470.75,
    totalDeductions: 1645,
    netPay: 12825.75,
    status: 'Paid',
    approvedDate: '2024-10-16',
    paidDate: '2024-10-17',
  },
  {
    id: 'PAY-2024-1002',
    employeeId: '2024-0002',
    name: 'John Dela Cruz',
    employeeType: 'Full-time',
    period: 'Oct 01 - Oct 15, 2024',
    periodStartDate: '2024-10-01',
    periodEndDate: '2024-10-15',
    avatar: 'JD',
    earnings: {
      baseSalary: 8000,
      commission: 3500,
      overtime: 1400,
      holidayBonus: 0,
      mealAllowance: 800,
    },
    deductions: {
      late: 0,
      absence: 0,
      sssLoan: 600,
      cashAdvance: 2000,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 13700,
    totalDeductions: 2600,
    netPay: 11100,
    status: 'Paid',
    approvedDate: '2024-10-16',
    paidDate: '2024-10-17',
  },
  {
    id: 'PAY-2024-1003',
    employeeId: '2024-0003',
    name: 'Rosa Maria Gonzalez',
    employeeType: 'Part-time',
    period: 'Oct 01 - Oct 15, 2024',
    periodStartDate: '2024-10-01',
    periodEndDate: '2024-10-15',
    avatar: 'RG',
    earnings: {
      baseSalary: 6000,
      commission: 2100,
      overtime: 650,
      holidayBonus: 0,
      mealAllowance: 500,
    },
    deductions: {
      late: 220,
      absence: 0,
      sssLoan: 400,
      cashAdvance: 500,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 9250,
    totalDeductions: 1120,
    netPay: 8130,
    status: 'Approved',
    approvedDate: '2024-10-18',
  },
  {
    id: 'PAY-2024-1004',
    employeeId: '2024-0008',
    name: 'Jennifer Cruz',
    employeeType: 'Therapist',
    period: 'Oct 01 - Oct 15, 2024',
    periodStartDate: '2024-10-01',
    periodEndDate: '2024-10-15',
    avatar: 'JC',
    earnings: {
      baseSalary: 7750,
      commission: 3800,
      overtime: 900,
      holidayBonus: 0,
      mealAllowance: 750,
    },
    deductions: {
      late: 0,
      absence: 0,
      sssLoan: 500,
      cashAdvance: 1500,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 13200,
    totalDeductions: 2000,
    netPay: 11200,
    status: 'Draft',
  },
  {
    id: 'PAY-2024-1005',
    employeeId: '2024-0009',
    name: 'Lucia Mendoza',
    employeeType: 'Part-time',
    period: 'Oct 01 - Oct 15, 2024',
    periodStartDate: '2024-10-01',
    periodEndDate: '2024-10-15',
    avatar: 'LM',
    earnings: {
      baseSalary: 6000,
      commission: 1800,
      overtime: 450,
      holidayBonus: 0,
      mealAllowance: 500,
    },
    deductions: {
      late: 150,
      absence: 0,
      sssLoan: 400,
      cashAdvance: 0,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 8750,
    totalDeductions: 550,
    netPay: 8200,
    status: 'Paid',
    approvedDate: '2024-10-16',
    paidDate: '2024-10-17',
  },

  // Oct 16-31, 2024 (격주급)
  {
    id: 'PAY-2024-1006',
    employeeId: '2024-0004',
    name: 'Antonio Reyes',
    employeeType: 'Contractor',
    period: 'Oct 16 - Oct 31, 2024',
    periodStartDate: '2024-10-16',
    periodEndDate: '2024-10-31',
    avatar: 'AR',
    earnings: {
      baseSalary: 14000,
      commission: 0,
      overtime: 550,
      holidayBonus: 2800,
      mealAllowance: 200,
    },
    deductions: {
      late: 0,
      absence: 0,
      sssLoan: 0,
      cashAdvance: 0,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 17550,
    totalDeductions: 0,
    netPay: 17550,
    status: 'Approved',
    approvedDate: '2024-10-25',
  },
  {
    id: 'PAY-2024-1007',
    employeeId: '2024-0005',
    name: 'Miguel Santos',
    employeeType: 'Full-time',
    period: 'Oct 16 - Oct 31, 2024',
    periodStartDate: '2024-10-16',
    periodEndDate: '2024-10-31',
    avatar: 'MS',
    earnings: {
      baseSalary: 13500,
      commission: 0,
      overtime: 700,
      holidayBonus: 2700,
      mealAllowance: 250,
    },
    deductions: {
      late: 75,
      absence: 0,
      sssLoan: 500,
      cashAdvance: 1000,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 17150,
    totalDeductions: 1575,
    netPay: 15575,
    status: 'Approved',
    approvedDate: '2024-10-25',
  },
  {
    id: 'PAY-2024-1008',
    employeeId: '2024-0006',
    name: 'Patricia Lim',
    employeeType: 'Part-time',
    period: 'Oct 16 - Oct 31, 2024',
    periodStartDate: '2024-10-16',
    periodEndDate: '2024-10-31',
    avatar: 'PL',
    earnings: {
      baseSalary: 11500,
      commission: 0,
      overtime: 450,
      holidayBonus: 2300,
      mealAllowance: 200,
    },
    deductions: {
      late: 220,
      absence: 0,
      sssLoan: 400,
      cashAdvance: 500,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 14450,
    totalDeductions: 1120,
    netPay: 13330,
    status: 'Draft',
  },
  {
    id: 'PAY-2024-1009',
    employeeId: '2024-0007',
    name: 'Fernando Garcia',
    employeeType: 'Manager',
    period: 'Oct 16 - Oct 31, 2024',
    periodStartDate: '2024-10-16',
    periodEndDate: '2024-10-31',
    avatar: 'FG',
    earnings: {
      baseSalary: 25000,
      commission: 0,
      overtime: 1200,
      holidayBonus: 5000,
      mealAllowance: 400,
    },
    deductions: {
      late: 0,
      absence: 0,
      sssLoan: 1000,
      cashAdvance: 3000,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 31600,
    totalDeductions: 4000,
    netPay: 27600,
    status: 'Draft',
  },
  {
    id: 'PAY-2024-1010',
    employeeId: '2024-0010',
    name: 'Carlos Reyes',
    employeeType: 'Contractor',
    period: 'Oct 16 - Oct 31, 2024',
    periodStartDate: '2024-10-16',
    periodEndDate: '2024-10-31',
    avatar: 'CR',
    earnings: {
      baseSalary: 14000,
      commission: 0,
      overtime: 600,
      holidayBonus: 2800,
      mealAllowance: 200,
    },
    deductions: {
      late: 0,
      absence: 800,
      sssLoan: 0,
      cashAdvance: 1000,
      healthCheck: 0,
      thirteenthMonth: 0,
    },
    grossPay: 17600,
    totalDeductions: 1800,
    netPay: 15800,
    status: 'Approved',
    approvedDate: '2024-10-25',
  },
];

// ============================================================
// 필리핀 공휴일 (2024년)
// ============================================================
export const holidays: Holiday[] = [
  {
    id: 'HOL-2024-001',
    date: 'Jan 1, 2024',
    month: 'Jan',
    day: '01',
    name: 'New Year\'s Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-002',
    date: 'Feb 12, 2024',
    month: 'Feb',
    day: '12',
    name: 'Chinese New Year',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-003',
    date: 'Feb 13, 2024',
    month: 'Feb',
    day: '13',
    name: 'Day after Chinese New Year',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-004',
    date: 'Mar 28, 2024',
    month: 'Mar',
    day: '28',
    name: 'Maundy Thursday',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-005',
    date: 'Mar 29, 2024',
    month: 'Mar',
    day: '29',
    name: 'Good Friday',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-006',
    date: 'Mar 30, 2024',
    month: 'Mar',
    day: '30',
    name: 'Black Saturday',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-007',
    date: 'Apr 9, 2024',
    month: 'Apr',
    day: '09',
    name: 'Day of Valor (Araw ng Kagitingan)',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-008',
    date: 'Apr 10, 2024',
    month: 'Apr',
    day: '10',
    name: 'Eid\'l Fitr',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-009',
    date: 'Jun 12, 2024',
    month: 'Jun',
    day: '12',
    name: 'Independence Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-010',
    date: 'Aug 21, 2024',
    month: 'Aug',
    day: '21',
    name: 'Ninoy Aquino Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-011',
    date: 'Aug 26, 2024',
    month: 'Aug',
    day: '26',
    name: 'National Heroes Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-012',
    date: 'Nov 1, 2024',
    month: 'Nov',
    day: '01',
    name: 'All Saints\' Day',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-013',
    date: 'Nov 2, 2024',
    month: 'Nov',
    day: '02',
    name: 'All Souls\' Day',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-014',
    date: 'Nov 30, 2024',
    month: 'Nov',
    day: '30',
    name: 'Bonifacio Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-015',
    date: 'Dec 8, 2024',
    month: 'Dec',
    day: '08',
    name: 'Feast of the Immaculate Conception',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
  {
    id: 'HOL-2024-016',
    date: 'Dec 25, 2024',
    month: 'Dec',
    day: '25',
    name: 'Christmas Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-017',
    date: 'Dec 30, 2024',
    month: 'Dec',
    day: '30',
    name: 'Rizal Day',
    type: 'National',
    multiplier: 200,
    year: 2024,
  },
  {
    id: 'HOL-2024-018',
    date: 'Dec 31, 2024',
    month: 'Dec',
    day: '31',
    name: 'New Year\'s Eve',
    type: 'Special',
    multiplier: 130,
    year: 2024,
  },
];

// ============================================================
// 선금 (Cash Advance)
// ============================================================
export const cashAdvances: CashAdvance[] = [
  {
    id: 'CA-2024-001',
    employeeId: '2024-0001',
    employeeName: 'Maria Christina Santos',
    amount: 5000,
    requestDate: '2024-10-05',
    reason: 'Emergency medical expense',
    status: 'Approved',
    approvedAmount: 5000,
    approvalDate: '2024-10-06',
    settledPayrollId: 'PAY-2024-1001',
  },
  {
    id: 'CA-2024-002',
    employeeId: '2024-0002',
    employeeName: 'John Dela Cruz',
    amount: 8000,
    requestDate: '2024-10-03',
    reason: 'School tuition payment',
    status: 'Approved',
    approvedAmount: 8000,
    approvalDate: '2024-10-04',
    settledPayrollId: 'PAY-2024-1002',
  },
  {
    id: 'CA-2024-003',
    employeeId: '2024-0003',
    employeeName: 'Rosa Maria Gonzalez',
    amount: 2500,
    requestDate: '2024-10-10',
    reason: 'Household repair',
    status: 'Approved',
    approvedAmount: 2500,
    approvalDate: '2024-10-11',
    settledPayrollId: 'PAY-2024-1003',
  },
  {
    id: 'CA-2024-004',
    employeeId: '2024-0005',
    employeeName: 'Miguel Santos',
    amount: 4000,
    requestDate: '2024-10-12',
    reason: 'Vehicle maintenance',
    status: 'Approved',
    approvedAmount: 4000,
    approvalDate: '2024-10-13',
    settledPayrollId: 'PAY-2024-1007',
  },
  {
    id: 'CA-2024-005',
    employeeId: '2024-0007',
    employeeName: 'Fernando Garcia',
    amount: 12000,
    requestDate: '2024-10-15',
    reason: 'Family event',
    status: 'Approved',
    approvedAmount: 12000,
    approvalDate: '2024-10-16',
    settledPayrollId: 'PAY-2024-1009',
  },
  {
    id: 'CA-2024-006',
    employeeId: '2024-0004',
    employeeName: 'Antonio Reyes',
    amount: 3000,
    requestDate: '2024-10-20',
    reason: 'Personal need',
    status: 'Pending',
  },
  {
    id: 'CA-2024-007',
    employeeId: '2024-0008',
    employeeName: 'Jennifer Cruz',
    amount: 5000,
    requestDate: '2024-10-18',
    reason: 'Medical treatment',
    status: 'Approved',
    approvedAmount: 5000,
    approvalDate: '2024-10-19',
  },
  {
    id: 'CA-2024-008',
    employeeId: '2024-0009',
    employeeName: 'Lucia Mendoza',
    amount: 2000,
    requestDate: '2024-10-22',
    reason: 'Loan repayment',
    status: 'Rejected',
  },
];

// ============================================================
// 출퇴근 기록 (샘플)
// ============================================================
export const attendanceLogs: AttendanceLog[] = [
  {
    id: 'ATT-2024-001',
    employeeId: '2024-0001',
    workDate: '2024-10-01',
    clockIn: '09:15',
    clockOut: '17:45',
    lateMinutes: 15,
    overtimeMinutes: 45,
    isAbsent: false,
    holidayType: 'none',
  },
  {
    id: 'ATT-2024-002',
    employeeId: '2024-0001',
    workDate: '2024-10-02',
    clockIn: '09:00',
    clockOut: '17:30',
    lateMinutes: 0,
    overtimeMinutes: 30,
    isAbsent: false,
    holidayType: 'none',
  },
  {
    id: 'ATT-2024-003',
    employeeId: '2024-0002',
    workDate: '2024-10-01',
    clockIn: '09:00',
    clockOut: '18:00',
    lateMinutes: 0,
    overtimeMinutes: 60,
    isAbsent: false,
    holidayType: 'none',
  },
  {
    id: 'ATT-2024-004',
    employeeId: '2024-0004',
    workDate: '2024-10-16',
    clockIn: '08:00',
    clockOut: '17:00',
    lateMinutes: 0,
    overtimeMinutes: 0,
    isAbsent: false,
    holidayType: 'none',
  },
  {
    id: 'ATT-2024-005',
    employeeId: '2024-0010',
    workDate: '2024-10-22',
    clockIn: '00:00',
    clockOut: '00:00',
    lateMinutes: 0,
    overtimeMinutes: 0,
    isAbsent: true,
    holidayType: 'none',
  },
];

// ============================================================
// 통계 요약
// ============================================================
export const payrollSummary = {
  totalEmployees: employees.length,
  activeEmployees: employees.filter(e => e.status === 'active').length,
  therapists: employees.filter(e => e.employeeType === 'therapist').length,

  currentPeriod: 'Oct 16 - Oct 31, 2024',
  totalPayrollAmount: payrollRecords
    .filter(r => r.periodEndDate === '2024-10-31')
    .reduce((sum, r) => sum + r.netPay, 0),

  recordsStatus: {
    draft: payrollRecords.filter(r => r.status === 'Draft').length,
    approved: payrollRecords.filter(r => r.status === 'Approved').length,
    paid: payrollRecords.filter(r => r.status === 'Paid').length,
  },

  totalNationalHolidays: holidays.filter(h => h.type === 'National').length,
  totalSpecialHolidays: holidays.filter(h => h.type === 'Special').length,
};
