'use client';

/**
 * 📌 실시간 재무 분석 데이터 동기화 Hook
 * 📋 매출/비용/수익 분석 자동 계산
 * 🔄 비용/예약 변경 시 자동 반영
 * 📅 작성일: 2026-06-06
 */

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface FinancialStats {
  // 기본 통계
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;

  // 비용 분류
  payrollExpenses: number;
  operatingExpenses: number;
  incidentalExpenses: number;
  welfareExpenses: number;

  // 시계열 데이터
  dailyRevenue: { date: string; amount: number }[];
  weeklyRevenue: { week: string; amount: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

export function useRealtimeFinancial() {
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    profitMargin: 0,
    payrollExpenses: 0,
    operatingExpenses: 0,
    incidentalExpenses: 0,
    welfareExpenses: 0,
    dailyRevenue: [],
    weeklyRevenue: [],
    monthlyRevenue: [],
  });

  const [loading, setLoading] = useState(true);

  // 📊 재무 데이터 계산
  const calculateFinancialData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setLoading(true);

      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dateStart = thirtyDaysAgo.toISOString().split('T')[0];

      // 1️⃣ 최근 30일 매출 조회
      const { data: bookings } = await supabase
        .from('massage_bookings')
        .select('service_price, booking_date, status')
        .gte('booking_date', dateStart)
        .eq('status', 'completed')
        .order('booking_date', { ascending: true });

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.service_price || 0), 0) || 0;

      // 2️⃣ 최근 30일 비용 조회
      const { data: expenses } = await supabase
        .from('expense_records')
        .select('amount, category, expense_date')
        .gte('expense_date', dateStart)
        .order('expense_date', { ascending: true });

      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const payrollExpenses = expenses?.filter(e => e.category === 'payroll').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const operatingExpenses = expenses?.filter(e => e.category === 'operating').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const incidentalExpenses = expenses?.filter(e => e.category === 'incidental').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const welfareExpenses = expenses?.filter(e => e.category === 'welfare').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // 3️⃣ 수익성 계산
      const grossProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // 4️⃣ 일별 매출 집계
      const dailyRevenueMap: Record<string, number> = {};
      bookings?.forEach(b => {
        const date = b.booking_date || '';
        dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + (b.service_price || 0);
      });
      const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, amount]) => ({ date, amount }));

      // 5️⃣ 주별 매출 집계
      const weeklyRevenueMap: Record<string, number> = {};
      bookings?.forEach(b => {
        const date = new Date(b.booking_date || '');
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const week = weekStart.toISOString().split('T')[0];
        weeklyRevenueMap[week] = (weeklyRevenueMap[week] || 0) + (b.service_price || 0);
      });
      const weeklyRevenue = Object.entries(weeklyRevenueMap).map(([week, amount]) => ({ week, amount }));

      // 6️⃣ 월별 매출 집계
      const monthlyRevenueMap: Record<string, number> = {};
      bookings?.forEach(b => {
        const month = (b.booking_date || '').substring(0, 7);
        monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + (b.service_price || 0);
      });
      const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, amount]) => ({ month, amount }));

      setFinancialStats({
        totalRevenue,
        totalExpenses,
        grossProfit,
        profitMargin,
        payrollExpenses,
        operatingExpenses,
        incidentalExpenses,
        welfareExpenses,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('❌ 재무 데이터 계산 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 📌 초기 로드
  useEffect(() => {
    calculateFinancialData();
  }, [calculateFinancialData]);

  // 🔄 실시간 구독
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // 매출 변경 감지
    const bookingSubscription = supabase
      .channel('massage_bookings:financial')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'massage_bookings',
        },
        () => {
          console.log('📊 매출 데이터 변경 감지, 재계산...');
          calculateFinancialData();
        }
      )
      .subscribe();

    // 비용 변경 감지
    const expenseSubscription = supabase
      .channel('expense_records:financial')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_records',
        },
        () => {
          console.log('💰 비용 데이터 변경 감지, 재계산...');
          calculateFinancialData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSubscription);
      supabase.removeChannel(expenseSubscription);
    };
  }, [calculateFinancialData]);

  return { financialStats, loading, recalculate: calculateFinancialData };
}
