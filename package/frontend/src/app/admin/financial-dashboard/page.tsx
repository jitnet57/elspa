'use client';

/**
 * 📌 Financial Dashboard Page
 * 📋 목적: 경영지표자료 대시보드 - 총매출, 지출, 수익, 예산 추적
 * 🔧 포함: KPI 카드, 차트, 지출 테이블, 필터, 예산 설정, 실시간 동기화
 */

import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/financial';
import { KPICards } from '@/components/financial/KPICards';
import { ExpenseChart } from '@/components/financial/ExpenseChart';
import { ExportButton } from '@/components/financial/ExportButton';
import { BudgetAlertPanel } from '@/components/financial/BudgetAlertPanel';
import { VirtualExpenseTable, ExpenseItem } from '@/components/financial/VirtualExpenseTable';
import { useFinancialRevenue, useFinancialExpenses, useFinancialWebSocket } from '@/hooks/financial';

export default function FinancialDashboardPage() {
  const store = useFinancialStore();
  const [isLoading, setIsLoading] = useState(true);

  // React Query 데이터 폴링
  const revenueQuery = useFinancialRevenue(store.selectedYear, store.selectedMonth);
  const expensesQuery = useFinancialExpenses(store.selectedYear, store.selectedMonth);

  // WebSocket 실시간 동기화
  useFinancialWebSocket(true);

  useEffect(() => {
    // 1차: 샘플 데이터로 초기화
    initializeSampleData();

    // 2차: React Query 데이터 동기화
    if (!revenueQuery.isLoading && revenueQuery.data) {
      store.setMonthlyRevenues(revenueQuery.data);
    }

    if (!expensesQuery.isLoading && expensesQuery.data) {
      store.setExpenses(expensesQuery.data);
    }

    setIsLoading(false);
  }, [revenueQuery.data, expensesQuery.data]);

  const initializeSampleData = () => {
    // Sample expense categories
    const sampleCategories = [
      { id: 1, name: 'Salary', categoryType: 'salary', isActive: true },
      { id: 2, name: 'Rent', categoryType: 'indirect_costs', isActive: true },
      { id: 3, name: 'Utilities', categoryType: 'indirect_costs', isActive: true },
      { id: 4, name: 'Benefits', categoryType: 'benefits', isActive: true },
      { id: 5, name: 'Fuel', categoryType: 'fuel', isActive: true },
      { id: 6, name: 'Miscellaneous', categoryType: 'miscellaneous', isActive: true },
    ];

    // Sample expenses (current month)
    const now = new Date();
    const sampleExpenses = [
      {
        id: 1,
        categoryId: 1,
        amount: 150000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        description: 'Monthly salary',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        categoryId: 2,
        amount: 50000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        description: 'Office rent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        categoryId: 3,
        amount: 8000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
        description: 'Electricity bill',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 4,
        categoryId: 5,
        amount: 12000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        description: 'Fuel for vehicles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Sample monthly revenue
    const sampleRevenues = [
      {
        id: 1,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        totalRevenue: 500000,
        therapistCommission: 150000,
        companyCommission: 100000,
        walkupRevenue: 250000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Sample budgets
    const sampleBudgets = [
      {
        id: 1,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        targetRevenue: 500000,
        expenseLimit: 250000,
        salaryBudget: 150000,
        indirectCostsBudget: 60000,
        benefitsBudget: 20000,
        otherBudget: 20000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    store.setCategories(sampleCategories);
    store.setExpenses(sampleExpenses);
    store.setMonthlyRevenues(sampleRevenues);
    store.setBudgets(sampleBudgets);
    store.setSelectedPeriod(now.getFullYear(), now.getMonth() + 1);
  };

  const isDataLoading = isLoading || revenueQuery.isLoading || expensesQuery.isLoading;

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-500">Loading financial dashboard...</p>
          {revenueQuery.isError && (
            <p className="text-red-500 text-sm mt-2">Revenue data fetch error</p>
          )}
          {expensesQuery.isError && (
            <p className="text-red-500 text-sm mt-2">Expenses data fetch error</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            💰 Financial Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time revenue, expenses, and budget tracking for your business
          </p>
        </div>

        {/* Period selector */}
        <div className="mb-6 flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <label className="text-sm font-semibold text-gray-700">Period:</label>
          <select
            value={store.selectedMonth}
            onChange={(e) =>
              store.setSelectedPeriod(store.selectedYear, parseInt(e.target.value))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2026, m - 1).toLocaleString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        {/* KPI Cards */}
        <KPICards year={store.selectedYear} month={store.selectedMonth} />

        {/* Budget Alert Panel (Sprint 11) */}
        <div className="mb-8">
          <BudgetAlertPanel year={store.selectedYear} month={store.selectedMonth} />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Chart */}
          <ExpenseChart />

          {/* Budget vs Actual */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Budget vs Actual</h3>

            {store.budgets.length > 0 ? (
              <div className="space-y-6">
                {store.budgets.map((budget) => (
                  <div key={budget.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">
                        Expense Limit
                      </span>
                      <span className="text-gray-900 font-bold">
                        ₱{budget.expenseLimit.toLocaleString('en-PH')}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          store.getTotalExpenses() <= budget.expenseLimit
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (store.getTotalExpenses() / budget.expenseLimit) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Spent</p>
                        <p className="font-bold text-gray-900">
                          ₱{store.getTotalExpenses().toLocaleString('en-PH', {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Remaining</p>
                        <p className={`font-bold ${
                          budget.expenseLimit - store.getTotalExpenses() >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          ₱{(budget.expenseLimit - store.getTotalExpenses()).toLocaleString('en-PH', {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Used</p>
                        <p className="font-bold text-gray-900">
                          {(
                            (store.getTotalExpenses() / budget.expenseLimit) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No budget data</p>
            )}
          </div>
        </div>

        {/* Expense details table (Virtual Scrolling) */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">📋 Expenses (Virtual Table)</h3>
            <ExportButton />
          </div>

          {store.expenses.length > 0 ? (
            <VirtualExpenseTable
              expenses={store.expenses.map((exp) => ({
                id: exp.id,
                categoryId: exp.categoryId,
                categoryName: store.categories.find((c) => c.id === exp.categoryId)?.name || 'Unknown',
                amount: exp.amount,
                expenseDate: exp.expenseDate,
                description: exp.description || '-',
              })) as ExpenseItem[]}
              height={400}
              itemsPerPage={20}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
