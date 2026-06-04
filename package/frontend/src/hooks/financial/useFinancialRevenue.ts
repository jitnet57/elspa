/**
 * 📌 useFinancialRevenue Hook
 * 📋 목적: React Query로 월별 매출 데이터 폴링
 * 🔧 자동 새로고침: 30초마다
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { MonthlyRevenue } from '@/lib/store/financial';

const QUERY_KEY = ['financial', 'revenue'];
const POLLING_INTERVAL = 30000; // 30초

async function fetchRevenue(year: number, month?: number): Promise<MonthlyRevenue[]> {
  const params = new URLSearchParams({ year: year.toString() });
  if (month) params.append('month', month.toString());

  const response = await fetch(`https://elspa-api-production.jitnet57.workers.dev/api/admin/financial/revenue?${params}`);
  if (!response.ok) throw new Error('Failed to fetch revenue');
  return response.json();
}

export function useFinancialRevenue(
  year: number,
  month?: number
): UseQueryResult<MonthlyRevenue[], Error> {
  return useQuery({
    queryKey: [...QUERY_KEY, year, month],
    queryFn: () => fetchRevenue(year, month),
    refetchInterval: POLLING_INTERVAL,
    staleTime: 20000, // 20초 후 stale 처리
    gcTime: 5 * 60 * 1000, // 5분 cache
    retry: 3,
  });
}
