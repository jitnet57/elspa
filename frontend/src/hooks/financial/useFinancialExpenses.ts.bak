/**
 * 📌 useFinancialExpenses Hook
 * 📋 목적: React Query로 지출 데이터 폴링
 * 🔧 자동 새로고침: 15초마다 (더 자주 업데이트)
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Expense } from '@/lib/store/financial';

const QUERY_KEY = ['financial', 'expenses'];
const POLLING_INTERVAL = 15000; // 15초

async function fetchExpenses(
  year: number,
  month?: number,
  categoryId?: number
): Promise<Expense[]> {
  const params = new URLSearchParams({ year: year.toString() });
  if (month) params.append('month', month.toString());
  if (categoryId) params.append('category_id', categoryId.toString());

  const response = await fetch(`/api/admin/financial/expenses?${params}`);
  if (!response.ok) throw new Error('Failed to fetch expenses');
  return response.json();
}

export function useFinancialExpenses(
  year: number,
  month?: number,
  categoryId?: number
): UseQueryResult<Expense[], Error> {
  return useQuery({
    queryKey: [...QUERY_KEY, year, month, categoryId],
    queryFn: () => fetchExpenses(year, month, categoryId),
    refetchInterval: POLLING_INTERVAL,
    staleTime: 10000, // 10초 후 stale
    gcTime: 5 * 60 * 1000,
    retry: 3,
  });
}
