'use client';

/**
 * 📌 KPI Cards Component
 * 📋 목적: 총매출, 총지출, 수익, 목표달성률을 카드로 표시
 * 🔧 포함: 4개의 메트릭 카드 (gradient 배경)
 */

import { useFinancialStore } from '@/lib/store/financial';

interface KPICardsProps {
  year?: number;
  month?: number;
}

export function KPICards({ year, month }: KPICardsProps) {
  const store = useFinancialStore();
  const totalRevenue = store.getTotalRevenue();
  const totalExpenses = store.getTotalExpenses();
  const profit = totalRevenue - totalExpenses;
  const profitMargin = store.getProfitMargin();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 📊 Total Revenue */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold opacity-90">Total Revenue</p>
            <h3 className="text-3xl font-bold mt-2">{formatCurrency(totalRevenue)}</h3>
          </div>
          <span className="text-3xl">📈</span>
        </div>
        <p className="text-xs opacity-75">
          {store.selectedMonth}/{store.selectedYear}
        </p>
      </div>

      {/* 💰 Total Expenses */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold opacity-90">Total Expenses</p>
            <h3 className="text-3xl font-bold mt-2">{formatCurrency(totalExpenses)}</h3>
          </div>
          <span className="text-3xl">💳</span>
        </div>
        <p className="text-xs opacity-75">
          {store.expenses.length} transactions
        </p>
      </div>

      {/* 💵 Net Profit */}
      <div className={`bg-gradient-to-br ${profit >= 0 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} rounded-lg p-6 text-white shadow-lg`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold opacity-90">Net Profit</p>
            <h3 className="text-3xl font-bold mt-2">{formatCurrency(profit)}</h3>
          </div>
          <span className="text-3xl">{profit >= 0 ? '✅' : '⚠️'}</span>
        </div>
        <p className="text-xs opacity-75">
          Revenue - Expenses
        </p>
      </div>

      {/* 📊 Profit Margin */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold opacity-90">Profit Margin</p>
            <h3 className="text-3xl font-bold mt-2">{profitMargin.toFixed(1)}%</h3>
          </div>
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-xs opacity-75">
          Profit / Revenue ratio
        </p>
      </div>
    </div>
  );
}
