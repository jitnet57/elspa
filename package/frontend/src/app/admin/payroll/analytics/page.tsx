'use client';

/**
 * 📌 Payroll Analytics Dashboard
 * 📋 목적: 급여 통계 및 차트 - 월별 추이, 직원별 분포, 차감 분석
 * 🔧 포함: KPI 카드, 라인 차트, 바 차트, 파이 차트, 상세 테이블
 * 📅 작성일: 2026-05-22
 * 업데이트: Phase 8-7 (Wave 3-3)
 */

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { usePayrollStore } from '@/lib/store/payroll-store';

// 타입 정의
interface MonthlyTrendData {
  months: string[];
  total_payroll: number[];
  average_pay: number[];
  deductions: number[];
}

interface EmployeeDistribution {
  employees: string[];
  net_pay: number[];
  gross_pay: number[];
}

interface DeductionBreakdown {
  labels: string[];
  values: number[];
  percentages: string[];
}

interface PayrollSummary {
  total_employees: number;
  total_payroll: number;
  average_gross: number;
  average_net: number;
  top_earner: {
    name: string;
    gross_pay: number;
    net_pay: number;
  } | null;
  lowest_earner: {
    name: string;
    gross_pay: number;
    net_pay: number;
  } | null;
}

interface EmployeeDetail {
  employee_id: number;
  name: string;
  employee_type: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  top_deduction: {
    type: string;
    amount: number;
  };
}

interface EmployeeDetailsResponse {
  total: number;
  items: EmployeeDetail[];
}

export default function PayrollAnalyticsPage() {
  const { periods } = usePayrollStore();

  // 상태 관리
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 차트 데이터
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData | null>(null);
  const [employeeDistribution, setEmployeeDistribution] = useState<EmployeeDistribution | null>(null);
  const [deductionBreakdown, setDeductionBreakdown] = useState<DeductionBreakdown | null>(null);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetailsResponse | null>(null);

  // 선택된 정산 기간 초기 설정
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0].id);
    }
  }, [periods, selectedPeriod]);

  // 모든 데이터 로드
  const loadAnalyticsData = async () => {
    if (!selectedPeriod) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      // 병렬로 모든 API 호출
      const [trendRes, distRes, dedRes, summaryRes, detailRes] = await Promise.all([
        fetch(`https://elspa-api-production.jitnet57.workers.dev/api/payroll/analytics/monthly-trend?year=${selectedYear}`, { headers }),
        fetch(`https://elspa-api-production.jitnet57.workers.dev/api/payroll/analytics/employee-distribution?period_id=${selectedPeriod}`, { headers }),
        fetch(`https://elspa-api-production.jitnet57.workers.dev/api/payroll/analytics/deduction-breakdown?period_id=${selectedPeriod}`, { headers }),
        fetch(`https://elspa-api-production.jitnet57.workers.dev/api/payroll/analytics/summary?period_id=${selectedPeriod}`, { headers }),
        fetch(`https://elspa-api-production.jitnet57.workers.dev/api/payroll/analytics/employee-details?period_id=${selectedPeriod}&skip=0&limit=50`, { headers })
      ]);

      const trend = await trendRes.json();
      const dist = await distRes.json();
      const ded = await dedRes.json();
      const sum = await summaryRes.json();
      const detail = await detailRes.json();

      setMonthlyTrend(trend);
      setEmployeeDistribution(dist);
      setDeductionBreakdown(ded);
      setSummary(sum);
      setEmployeeDetails(detail);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      alert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, selectedYear]);

  // 통화 형식 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // 월별 추이 차트 데이터 변환
  const monthlyChartData = monthlyTrend
    ? monthlyTrend.months.map((month, idx) => ({
        month,
        'Total Payroll': monthlyTrend.total_payroll[idx],
        'Avg Net Pay': monthlyTrend.average_pay[idx],
        'Total Deductions': monthlyTrend.deductions[idx],
      }))
    : [];

  // 직원별 분포 차트 데이터 변환
  const employeeChartData = employeeDistribution
    ? employeeDistribution.employees.map((name, idx) => ({
        name,
        'Net Pay': employeeDistribution.net_pay[idx],
        'Gross Pay': employeeDistribution.gross_pay[idx],
      }))
    : [];

  // 차감 분석 차트 데이터 변환
  const deductionChartData = deductionBreakdown
    ? deductionBreakdown.labels.map((label, idx) => ({
        name: label,
        value: deductionBreakdown.values[idx],
        percentage: deductionBreakdown.percentages[idx],
      }))
    : [];

  // 색상 팔레트
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Analytics</h1>
          <p className="text-gray-600">급여 통계 및 성과 분석</p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 연도 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* 정산 기간 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Period</label>
              <select
                value={selectedPeriod || ''}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Period --</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* 갱신 버튼 */}
            <div className="flex items-end">
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* KPI 카드 섹션 */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* 총 급여 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total Payroll</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_payroll)}</p>
              <p className="text-xs text-gray-500 mt-2">{summary.total_employees} employees</p>
            </div>

            {/* 평균 순지급 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Avg Net Pay</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.average_net)}</p>
              <p className="text-xs text-green-600 mt-2">Per Employee</p>
            </div>

            {/* 평균 차감 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Avg Deductions</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.average_gross - summary.average_net)}
              </p>
              <p className="text-xs text-red-600 mt-2">Per Employee</p>
            </div>

            {/* 직원 수 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total Employees</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.total_employees}</p>
              <p className="text-xs text-gray-500 mt-2">Active</p>
            </div>

            {/* 평균 총수입 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Avg Gross</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.average_gross)}</p>
              <p className="text-xs text-blue-600 mt-2">Per Employee</p>
            </div>
          </div>
        )}

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 월별 추이 차트 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Total Payroll" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Avg Net Pay" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Total Deductions" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 차감 분석 파이 차트 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deduction Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deductionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: ₱${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deductionChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 직원별 분포 차트 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Employee Distribution</h3>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={employeeChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
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
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
                />
                <Legend />
                <Bar dataKey="Gross Pay" fill="#3b82f6" />
                <Bar dataKey="Net Pay" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 직원별 상세 테이블 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Employee Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Gross Pay</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Deductions</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Pay</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Top Deduction</th>
                </tr>
              </thead>
              <tbody>
                {employeeDetails?.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {item.employee_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                      {formatCurrency(item.gross_pay)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-semibold">
                      {formatCurrency(item.total_deductions)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold">
                      {formatCurrency(item.net_pay)}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <span className="text-sm">
                        {item.top_deduction.type} ({formatCurrency(item.top_deduction.amount)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!employeeDetails?.items || employeeDetails.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No employee details available
              </div>
            )}
          </div>
        </div>

        {/* 최고/최저 수입자 정보 */}
        {summary?.top_earner && summary?.lowest_earner && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* 최고 수입자 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500">
              <h4 className="text-sm font-medium text-green-700 mb-2">Top Earner</h4>
              <p className="text-xl font-bold text-green-900 mb-1">{summary.top_earner.name}</p>
              <div className="text-sm text-green-700">
                <p>Gross: {formatCurrency(summary.top_earner.gross_pay)}</p>
                <p>Net: {formatCurrency(summary.top_earner.net_pay)}</p>
              </div>
            </div>

            {/* 최저 수입자 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 border-l-4 border-orange-500">
              <h4 className="text-sm font-medium text-orange-700 mb-2">Lowest Earner</h4>
              <p className="text-xl font-bold text-orange-900 mb-1">{summary.lowest_earner.name}</p>
              <div className="text-sm text-orange-700">
                <p>Gross: {formatCurrency(summary.lowest_earner.gross_pay)}</p>
                <p>Net: {formatCurrency(summary.lowest_earner.net_pay)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
