'use client';

/**
 * 📌 Financial Dashboard Page
 * 📋 목적: 경영지표자료 대시보드 - 총매출, 지출, 수익, 예산 추적
 * 🔧 포함: KPI 카드, 차트, 지출 테이블, 필터, 예산 설정
 */

import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/lib/store/financial';
import { KPICards } from '@/components/financial/KPICards';
import { ExpenseChart } from '@/components/financial/ExpenseChart';

export default function FinancialDashboardPage() {
  const store = useFinancialStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with sample data
    initializeSampleData();
    setIsLoading(false);
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading financial dashboard...</p>
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

        {/* Expense details table */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Expenses</h3>

          {store.expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {store.expenses.map((expense) => {
                    const category = store.categories.find(
                      (c) => c.id === expense.categoryId
                    );
                    return (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {category?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(expense.expenseDate).toLocaleDateString('en-PH')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {expense.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                          ₱{expense.amount.toLocaleString('en-PH', {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
