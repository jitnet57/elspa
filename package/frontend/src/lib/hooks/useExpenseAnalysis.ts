/**
 * 비용 분석 Hook
 * 일/주/월/년 집계 및 분석
 */

import { useMemo } from 'react';
import { ExpenseRecord, BudgetAnalysis } from '@/lib/store/types';

export interface ExpenseStats {
  totalAmount: number;
  categoryBreakdown: Record<string, number>;
  trend: { date: string; amount: number }[];
  averageDaily: number;
  largestExpense: ExpenseRecord | null;
  topCategories: { category: string; amount: number }[];
}

export function useExpenseAnalysis(expenses: ExpenseRecord[], period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  const stats = useMemo<ExpenseStats>(() => {
    if (expenses.length === 0) {
      return {
        totalAmount: 0,
        categoryBreakdown: {},
        trend: [],
        averageDaily: 0,
        largestExpense: null,
        topCategories: [],
      };
    }

    // 필터링: 선택된 기간에 해당하는 데이터만
    const filtered = filterByPeriod(expenses, period);

    // 전체 합계
    const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

    // 카테고리별 분류
    const categoryBreakdown: Record<string, number> = {};
    filtered.forEach(exp => {
      const cat = exp.ai_category || exp.category;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount;
    });

    // 상위 카테고리
    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // 추세 분석
    const trend = calculateTrend(filtered, period);

    // 일평균
    const dateSet = new Set(filtered.map(e => e.date));
    const averageDaily = dateSet.size > 0 ? totalAmount / dateSet.size : 0;

    // 최대 지출
    const largestExpense = filtered.reduce((max, exp) => (exp.amount > (max?.amount || 0) ? exp : max), null as ExpenseRecord | null);

    return {
      totalAmount,
      categoryBreakdown,
      trend,
      averageDaily,
      largestExpense,
      topCategories,
    };
  }, [expenses, period]);

  return stats;
}

// 월별 비용 분석
export function useMonthlyBudgetAnalysis(
  expenses: ExpenseRecord[],
  budget: Record<string, number>
): BudgetAnalysis[] {
  return useMemo(() => {
    const months = new Set(expenses.map(e => e.date.slice(0, 7)));
    const analysis: BudgetAnalysis[] = [];

    months.forEach(month => {
      const monthlyExpenses = expenses.filter(e => e.date.startsWith(month));

      Object.entries(budget).forEach(([category, budgeted]) => {
        const actual = monthlyExpenses
          .filter(e => (e.ai_category || e.category) === category)
          .reduce((sum, e) => sum + e.amount, 0);

        const variance = budgeted - actual;
        const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;

        analysis.push({
          month,
          category,
          budgeted,
          actual,
          variance,
          percentage,
        });
      });
    });

    return analysis.sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses, budget]);
}

// 연간 비용 트렌드
export function useYearlyTrend(expenses: ExpenseRecord[]): Record<string, number> {
  return useMemo(() => {
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const month = exp.date.slice(0, 7); // YYYY-MM
      monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
    });

    return monthlyTotals;
  }, [expenses]);
}

// 카테고리별 월간 추세
export function useCategoryTrend(expenses: ExpenseRecord[], category: string): Record<string, number> {
  return useMemo(() => {
    const categoryExpenses = expenses.filter(e => (e.ai_category || e.category) === category);
    const monthlyTotals: Record<string, number> = {};

    categoryExpenses.forEach(exp => {
      const month = exp.date.slice(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
    });

    return monthlyTotals;
  }, [expenses, category]);
}

// 비용 효율성 분석
export function useExpenseEfficiency(
  expenses: ExpenseRecord[],
  revenue: number
): { expenseRatio: number; profitMargin: number; recommendation: string } {
  return useMemo(() => {
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseRatio = revenue > 0 ? (totalExpense / revenue) * 100 : 0;
    const profitMargin = 100 - expenseRatio;

    let recommendation = '';
    if (expenseRatio > 80) {
      recommendation = '⚠️ 비용이 높습니다. 지출 감축이 필요합니다.';
    } else if (expenseRatio > 60) {
      recommendation = '📈 비용을 관리하는 것이 좋습니다.';
    } else {
      recommendation = '✅ 건전한 비용 구조입니다.';
    }

    return { expenseRatio, profitMargin, recommendation };
  }, [expenses, revenue]);
}

// === 헬퍼 함수 ===

function filterByPeriod(expenses: ExpenseRecord[], period: string): ExpenseRecord[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return expenses;
  }

  return expenses.filter(e => new Date(e.date) >= startDate);
}

function calculateTrend(expenses: ExpenseRecord[], period: string): { date: string; amount: number }[] {
  const groupedByDate: Record<string, number> = {};

  expenses.forEach(exp => {
    let key = exp.date;
    if (period === 'weekly') {
      // 주를 기준으로 그룹핑
      const date = new Date(exp.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      key = exp.date.slice(0, 7);
    } else if (period === 'yearly') {
      key = exp.date.slice(0, 4);
    }

    groupedByDate[key] = (groupedByDate[key] || 0) + exp.amount;
  });

  return Object.entries(groupedByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
