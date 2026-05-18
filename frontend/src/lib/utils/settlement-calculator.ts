// ============================================================
// 📌 Settlement Calculator: Validate & Calculate Commission
// 📋 Purpose: Calculate accurate settlements with validation
// 🔧 Includes: Revenue calculation, commission deduction, data matching
// 📤 Returns: Settlement data with validation results
// ============================================================

import {
  mockCompanies,
  mockGuides,
  mockCustomers,
  mockSessions,
  Company,
  Guide,
  Customer,
  ServiceSession,
} from '@/lib/mock/test-data';

export interface SettlementCalculation {
  guide_id: number;
  guide_name: string;
  company_id: number;
  company_name: string;
  settlement_month: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  noshow_sessions: number;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  payment_amount: number;
  average_session_price: number;
  settlement_day: number;
  expected_settlement_date: string;
  validation_status: 'valid' | 'warning' | 'error';
  validation_messages: string[];
}

export interface TestDataValidation {
  totalCompanies: number;
  totalGuides: number;
  totalCustomers: number;
  totalSessions: number;
  completedSessions: number;
  totalRevenue: number;
  totalCommissions: number;
  totalPayments: number;
  guideSettlements: SettlementCalculation[];
  warnings: string[];
  errors: string[];
}

export function calculateSettlements(month: string): TestDataValidation {
  const [year, monthNum] = month.split('-').map(Number);
  const warnings: string[] = [];
  const errors: string[] = [];
  const guideSettlements: SettlementCalculation[] = [];

  let totalRevenue = 0;
  let totalCommissions = 0;
  let totalPayments = 0;
  let totalCompletedSessions = 0;

  // Validate test data integrity
  if (mockCompanies.length !== 10) {
    errors.push(`Expected 10 companies, found ${mockCompanies.length}`);
  }

  if (mockGuides.length !== 10) {
    errors.push(`Expected 10 guides, found ${mockGuides.length}`);
  }

  if (mockCustomers.length !== 100) {
    errors.push(`Expected 100 customers, found ${mockCustomers.length}`);
  }

  if (mockSessions.length !== 100) {
    errors.push(`Expected 100 sessions, found ${mockSessions.length}`);
  }

  // Calculate settlement for each guide
  mockGuides.forEach((guide) => {
    const company = mockCompanies.find((c) => c.id === guide.company_id);
    if (!company) {
      errors.push(`Guide ${guide.name} (ID: ${guide.id}) has invalid company_id ${guide.company_id}`);
      return;
    }

    // Filter sessions for this guide in the specified month
    const guideSessions = mockSessions.filter((session) => {
      const sessionMonth = session.session_date.substring(0, 7);
      return session.guide_id === guide.id && sessionMonth === month;
    });

    const completedSessions = guideSessions.filter((s) => s.status === 'completed');
    const cancelledSessions = guideSessions.filter((s) => s.status === 'cancelled');
    const noshowSessions = guideSessions.filter((s) => s.status === 'noshow');

    // Calculate revenue (only completed sessions)
    const guideRevenue = completedSessions.reduce((sum, session) => sum + session.service_price, 0);
    totalRevenue += guideRevenue;
    totalCompletedSessions += completedSessions.length;

    // Determine commission rate (guide override or company default)
    const commissionRate = guide.commission_rate ?? company.commission_rate;
    const commissionAmount = Math.floor(guideRevenue * (commissionRate / 100));
    const paymentAmount = guideRevenue - commissionAmount;

    totalCommissions += commissionAmount;
    totalPayments += paymentAmount;

    // Calculate expected settlement date
    const settlementDate = new Date(year, monthNum - 1, company.settlement_day);
    const expectedSettlementDate = settlementDate.toISOString().split('T')[0];

    // Validation
    const validationMessages: string[] = [];
    let validationStatus: 'valid' | 'warning' | 'error' = 'valid';

    // Check guide-customer matching
    const uniqueCustomers = new Set(guideSessions.map((s) => s.customer_id));
    completedSessions.forEach((session) => {
      const customer = mockCustomers.find((c) => c.id === session.customer_id);
      if (!customer) {
        validationMessages.push(`Session ${session.id}: Customer ID ${session.customer_id} not found`);
        validationStatus = 'error';
      }
    });

    // Check for unusual data
    if (guideRevenue === 0 && guideSessions.length > 0) {
      validationMessages.push(`No revenue despite ${guideSessions.length} sessions (all cancelled/noshow)`);
      if (validationStatus === 'valid') {
        validationStatus = 'warning';
      }
    }

    if (completedSessions.length === 0 && guideSessions.length > 0) {
      validationMessages.push(`All sessions for month are cancelled or no-show`);
      if (validationStatus === 'valid') {
        validationStatus = 'warning';
      }
    }

    // Check commission rate validity
    if (commissionRate < 20 || commissionRate > 40) {
      validationMessages.push(`Commission rate ${commissionRate}% is outside normal range (20-40%)`);
      if (validationStatus === 'valid') {
        validationStatus = 'warning';
      }
    }

    const settlement: SettlementCalculation = {
      guide_id: guide.id,
      guide_name: guide.name,
      company_id: company.id,
      company_name: company.name,
      settlement_month: month,
      total_sessions: guideSessions.length,
      completed_sessions: completedSessions.length,
      cancelled_sessions: cancelledSessions.length,
      noshow_sessions: noshowSessions.length,
      total_revenue: guideRevenue,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      payment_amount: paymentAmount,
      average_session_price: completedSessions.length > 0 ? Math.floor(guideRevenue / completedSessions.length) : 0,
      settlement_day: company.settlement_day,
      expected_settlement_date: expectedSettlementDate,
      validation_status: validationStatus,
      validation_messages: validationMessages,
    };

    guideSettlements.push(settlement);
  });

  return {
    totalCompanies: mockCompanies.length,
    totalGuides: mockGuides.length,
    totalCustomers: mockCustomers.length,
    totalSessions: mockSessions.length,
    completedSessions: totalCompletedSessions,
    totalRevenue,
    totalCommissions,
    totalPayments,
    guideSettlements,
    warnings,
    errors,
  };
}

export function getMonthOptions(): string[] {
  // Return last 3 months of data for testing
  const months: string[] = [];
  for (let i = 2; i >= 0; i--) {
    const date = new Date(2025, 2 - i);
    months.push(date.toISOString().substring(0, 7));
  }
  return months;
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getValidationColor(status: 'valid' | 'warning' | 'error'): string {
  switch (status) {
    case 'valid':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
      return 'text-red-600 bg-red-50';
  }
}
