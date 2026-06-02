'use client';

/**
 * 📌 Payroll Main Dashboard
 * 📋 목적: 정산 기간 관리, 주간/격주 탭 구분, 진행 상황 표시 (API 연동)
 * 🔧 포함: 탭 필터, 기간 선택, 정산 계산 시작 버튼, 진행률 카드
 * 📌 개선: Zustand store로 상태 관리, Retry logic 포함, API 연동
 * 📅 작성일: 2026-05-22
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { PayrollPeriod } from '@/lib/api/payroll-client';

interface PayrollStats {
  totalPeriods: number;
  draftCount: number;
  approvedCount: number;
  paidCount: number;
  totalGrossPay: number;
  averageNetPay: number;
}

export default function PayrollDashboard() {
  const [payGroup, setPayGroup] = useState<'weekly' | 'biweekly'>('weekly');
  const [stats, setStats] = useState<PayrollStats>({
    totalPeriods: 0,
    draftCount: 0,
    approvedCount: 0,
    paidCount: 0,
    totalGrossPay: 0,
    averageNetPay: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Zustand store
  const { periods, loading, error, fetchPeriods, startCalculation, approvePeriodAction, clearError } =
    usePayrollStore();

  // Load payroll periods on mount
  useEffect(() => {
    fetchPeriods({ pay_group: payGroup });
  }, [payGroup, fetchPeriods]);

  // Update stats when periods change
  useEffect(() => {
    setStats({
      totalPeriods: periods.length,
      draftCount: periods.filter(p => p.status === 'draft').length,
      approvedCount: periods.filter(p => p.status === 'approved').length,
      paidCount: periods.filter(p => p.status === 'paid').length,
      totalGrossPay: periods.reduce((sum, p) => sum + (p.employeeCount || 0) * 10000, 0),
      averageNetPay: 35000,
    });
  }, [periods]);

  const handleCalculatePayroll = async (periodId: number) => {
    try {
      setIsCalculating(true);
      await startCalculation(periodId);
      alert('Payroll calculation started successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to calculate payroll';
      alert(errorMsg);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApprovePeriod = async (periodId: number) => {
    try {
      await approvePeriodAction(periodId);
      alert('Period approved successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve period';
      alert(errorMsg);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'draft':
        return '📝';
      case 'approved':
        return '✅';
      case 'paid':
        return '💰';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600 font-semibold">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      {/* 제목 영역과 빠른 이동 버튼을 가로로 배치 (제목 왼쪽 / 버튼 오른쪽) */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 제목 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Payroll System</h1>
            <p className="text-gray-600 mt-1">Manage payroll periods, calculate salaries, and process settlements</p>
          </div>
          {/* 빠른 이동 버튼: 직원 관리(파랑) / 기록 보기(보라) — 알약형 버튼 */}
          <div className="flex gap-2">
            <a
              href="/admin/payroll/employees"
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 font-bold text-sm whitespace-nowrap"
              title="Manage Employees"
            >
              👥 직원 관리
            </a>
            <a
              href="/admin/payroll/records"
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 font-bold text-sm whitespace-nowrap"
              title="View Records"
            >
              📊 기록 보기
            </a>
            <a
              href="/admin/payroll/settings"
              className="px-5 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 font-bold text-sm whitespace-nowrap"
              title="Payroll Settings"
            >
              ⚙️ 급여설정
            </a>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded flex justify-between items-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={clearError}
            className="text-red-700 hover:text-red-900 font-bold text-lg"
          >
            ✕
          </button>
        </div>
      )}

      <main className="px-4 py-6 pb-24">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold opacity-90">Total Periods</p>
                <h3 className="text-3xl font-bold mt-2">{stats.totalPeriods}</h3>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold opacity-90">Draft</p>
                <h3 className="text-3xl font-bold mt-2">{stats.draftCount}</h3>
              </div>
              <span className="text-3xl">📝</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold opacity-90">Approved</p>
                <h3 className="text-3xl font-bold mt-2">{stats.approvedCount}</h3>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold opacity-90">Paid</p>
                <h3 className="text-3xl font-bold mt-2">{stats.paidCount}</h3>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Pay Group Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPayGroup('weekly')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              payGroup === 'weekly'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📅 Weekly
          </button>
          <button
            onClick={() => setPayGroup('biweekly')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              payGroup === 'biweekly'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📆 Bi-Weekly
          </button>
        </div>

        {/* Payroll Periods List */}
        <div className="space-y-4">
          {periods.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              <p className="text-lg font-semibold">No payroll periods found</p>
            </div>
          ) : (
            periods
              .filter(p => p.pay_group === payGroup)
              .map(period => (
                <div
                  key={period.id}
                  className="bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-all p-6"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Period Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {formatDate(period.period_start)} - {formatDate(period.period_end)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                            period.status
                          )}`}
                        >
                          {getStatusEmoji(period.status)} {period.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 font-semibold">Progress</span>
                          <span className="text-gray-700 font-bold">
                            {period.processedCount || 0} / {period.employeeCount || 0} employees
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                period.employeeCount
                                  ? ((period.processedCount || 0) / period.employeeCount) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        Created: {formatDate(period.created_at)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                      {period.status === 'draft' && (
                        <button
                          onClick={() => handleCalculatePayroll(period.id)}
                          disabled={isCalculating}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all active:scale-95 text-sm"
                        >
                          🧮 {isCalculating ? 'Calculating...' : 'Start Calculation'}
                        </button>
                      )}
                      {period.status === 'approved' && (
                        <button
                          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-all active:scale-95 text-sm"
                        >
                          💳 Process Payment
                        </button>
                      )}
                      {period.status !== 'approved' && period.status !== 'paid' && (
                        <button
                          onClick={() => handleApprovePeriod(period.id)}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all active:scale-95 text-sm"
                        >
                          ✅ Approve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowModal(true);
                        }}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-all active:scale-95 text-sm"
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showModal && selectedPeriod && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Period Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Start Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(selectedPeriod.period_start)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">End Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(selectedPeriod.period_end)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Pay Group</p>
                  <p className="text-lg font-bold text-gray-900 uppercase">
                    {selectedPeriod.pay_group}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Status</p>
                  <p className="text-lg font-bold text-gray-900 uppercase">
                    {selectedPeriod.status}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg"
                >
                  Close
                </button>
                <a
                  href={`/admin/payroll/records?period=${selectedPeriod.id}`}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-center"
                >
                  View Records
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
