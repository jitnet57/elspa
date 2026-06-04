'use client';

/**
 * 📌 Expense Chart Component
 * 📋 목적: 카테고리별 지출 분포를 원형/막대 차트로 표시 (Recharts)
 * 🔧 포함: PieChart (default) 또는 BarChart 선택 가능
 */

import { useFinancialStore } from '@/lib/store/financial';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export function ExpenseChart() {
  const store = useFinancialStore();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const expensesByCategory = store.getExpensesByCategory();
  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Expense Breakdown</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 rounded text-sm font-semibold ${
              chartType === 'pie'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Pie
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded text-sm font-semibold ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📈 Bar
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No expense data available
        </div>
      ) : (
        <>
          {chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    `₱${(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) =>
                    `₱${(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
                  }
                />
                <Bar dataKey="value" fill="#3b82f6">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Summary table */}
          <div className="mt-6 border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-700">{item.name}</p>
                    <p className="text-gray-500">
                      ₱{item.value.toLocaleString('en-PH', { maximumFractionDigits: 0 })} (
                      {((item.value / totalExpenses) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
