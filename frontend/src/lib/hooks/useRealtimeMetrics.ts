'use client';

/**
 * 📌 실시간 메트릭 데이터 동기화 Hook
 * 📋 Supabase Realtime 구독으로 데이터 변경 감지
 * 🔄 비용/매출 추가/수정/삭제 시 자동 반영
 * 📅 작성일: 2026-06-06
 */

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface MetricsData {
  totalRevenue: number;
  totalExpenses: number;
  operatingProfit: number;
  netProfit: number;
}

export function useRealtimeMetrics(year: number, month: number) {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalRevenue: 0,
    totalExpenses: 0,
    operatingProfit: 0,
    netProfit: 0,
  });

  const [loading, setLoading] = useState(true);

  // 📊 메트릭 계산
  const calculateMetrics = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setLoading(true);

      const dateStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const dateEnd = new Date(year, month, 0);
      const dateEndStr = dateEnd.toISOString().split('T')[0];

      // 1️⃣ 매출 계산 (massage_bookings)
      const { data: bookings, error: bookingsError } = await supabase
        .from('massage_bookings')
        .select('service_price')
        .gte('booking_date', dateStart)
        .lte('booking_date', dateEndStr)
        .eq('status', 'completed');

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.service_price || 0), 0) || 0;

      // 2️⃣ 비용 계산 (expense_records)
      const { data: expenses, error: expensesError } = await supabase
        .from('expense_records')
        .select('amount')
        .gte('expense_date', dateStart)
        .lte('expense_date', dateEndStr);

      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // 3️⃣ 수익 계산
      const operatingProfit = totalRevenue - totalExpenses;
      const netProfit = operatingProfit; // 세금은 별도로 처리

      setMetrics({
        totalRevenue,
        totalExpenses,
        operatingProfit,
        netProfit,
      });
    } catch (error) {
      console.error('❌ 메트릭 계산 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // 📌 초기 로드
  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  // 🔄 실시간 구독
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // expense_records 변경 감지
    const expenseSubscription = supabase
      .channel(`expense_records:${year}-${month}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'expense_records',
        },
        () => {
          console.log('💾 비용 데이터 변경 감지, 재계산...');
          calculateMetrics();
        }
      )
      .subscribe();

    // massage_bookings 변경 감지
    const bookingSubscription = supabase
      .channel(`massage_bookings:${year}-${month}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'massage_bookings',
        },
        () => {
          console.log('💳 예약 데이터 변경 감지, 재계산...');
          calculateMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expenseSubscription);
      supabase.removeChannel(bookingSubscription);
    };
  }, [year, month, calculateMetrics]);

  return { metrics, loading, recalculate: calculateMetrics };
}
