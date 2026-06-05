'use client';

/**
 * 📌 실시간 급여 데이터 동기화 Hook
 * 📋 Supabase Realtime 구독으로 급여 데이터 변경 감지
 * 🔄 급여 추가/수정/삭제 시 자동 반영
 * 📅 작성일: 2026-06-06
 */

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface PayrollSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  averageNetPay: number;
  draftCount: number;
  approvedCount: number;
  paidCount: number;
}

export function useRealtimePayroll() {
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>({
    totalEmployees: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    averageNetPay: 0,
    draftCount: 0,
    approvedCount: 0,
    paidCount: 0,
  });

  const [loading, setLoading] = useState(true);

  // 📊 급여 데이터 계산
  const calculatePayrollData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setLoading(true);

      // 1️⃣ 직원 수 조회
      const { data: employees } = await supabase
        .from('therapists')
        .select('id, name')
        .eq('status', 'active');

      const totalEmployees = employees?.length || 0;

      // 2️⃣ 급여 기간별 현황
      const { data: periods } = await supabase
        .from('payroll_periods')
        .select('id, status, start_date, end_date');

      const draftCount = periods?.filter(p => p.status === 'draft').length || 0;
      const approvedCount = periods?.filter(p => p.status === 'approved').length || 0;
      const paidCount = periods?.filter(p => p.status === 'paid').length || 0;

      // 3️⃣ 급여 기록 조회
      const { data: payrollRecords } = await supabase
        .from('payroll_records')
        .select('gross_pay, deductions, net_pay');

      const totalGrossPay = payrollRecords?.reduce((sum, r) => sum + (r.gross_pay || 0), 0) || 0;
      const totalDeductions = payrollRecords?.reduce((sum, r) => sum + (r.deductions || 0), 0) || 0;
      const totalNetPay = payrollRecords?.reduce((sum, r) => sum + (r.net_pay || 0), 0) || 0;
      const averageNetPay = payrollRecords && payrollRecords.length > 0
        ? totalNetPay / payrollRecords.length
        : 0;

      setPayrollSummary({
        totalEmployees,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        averageNetPay,
        draftCount,
        approvedCount,
        paidCount,
      });
    } catch (error) {
      console.error('❌ 급여 데이터 계산 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 📌 초기 로드
  useEffect(() => {
    calculatePayrollData();
  }, [calculatePayrollData]);

  // 🔄 실시간 구독
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // payroll_records 변경 감지
    const payrollSubscription = supabase
      .channel('payroll_records:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payroll_records',
        },
        () => {
          console.log('💰 급여 데이터 변경 감지, 재계산...');
          calculatePayrollData();
        }
      )
      .subscribe();

    // payroll_periods 변경 감지
    const periodSubscription = supabase
      .channel('payroll_periods:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payroll_periods',
        },
        () => {
          console.log('📅 급여 기간 변경 감지, 재계산...');
          calculatePayrollData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(payrollSubscription);
      supabase.removeChannel(periodSubscription);
    };
  }, [calculatePayrollData]);

  return { payrollSummary, loading, recalculate: calculatePayrollData };
}
