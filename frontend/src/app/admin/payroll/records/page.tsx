'use client';

/**
 * 📌 Settlement Records Page
 * 📋 목적: 급여 정산 결과 조회, 기간 선택, 상세 조회, PDF 다운로드
 * 🔧 포함: 기간 필터, 결과 테이블, 상세 모달, PDF 다운로드 버튼
 * 📅 작성일: 2026-05-21
 */

import { useState, useEffect } from 'react';

interface PayrollRecord {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  employee_name?: string;
  period_start?: string;
  period_end?: string;

  // Income
  base_amount: number;
  commission_amount: number;
  overtime_amount: number;
  holiday_bonus: number;
  meal_allowance: number;

  // Deductions
  late_deduction: number;
  absence_deduction: number;
  sss_deduction: number;
  ca_deduction: number;
  health_check_deduction: number;
  thirteenth_month_deduction: number;

  // Final
  gross_pay: number;
  total_deductions: number;
  net_pay: number;

  status: 'draft' | 'approved' | 'paid';
  notes?: string;

  created_at: string;
  updated_at: string;
}

const MOCK_RECORDS: PayrollRecord[] = [
  {
    id: 1,
    payroll_period_id: 1,
    employee_id: 1,
    employee_name: 'Maria Santos',
    period_start: '2026-05-01',
    period_end: '2026-05-07',
    base_amount: 15000,
    commission_amount: 3500,
    overtime_amount: 2000,
    holiday_bonus: 1000,
    meal_allowance: 500,
    late_deduction: 500,
    absence_deduction: 0,
    sss_deduction: 1200,
    ca_deduction: 5000,
    health_check_deduction: 0,
    thirteenth_month_deduction: 500,
    gross_pay: 22000,
    total_deductions: 7200,
    net_pay: 14800,
    status: 'paid',
    created_at: '2026-05-01T10:00:00',
    updated_at: '2026-05-08T15:30:00',
  },
  {
    id: 2,
    payroll_period_id: 2,
    employee_id: 2,
    employee_name: 'Jose Garcia',
    period_start: '2026-05-08',
    period_end: '2026-05-14',
    base_amount: 18000,
    commission_amount: 2500,
    overtime_amount: 4500,
    holiday_bonus: 0,
    meal_allowance: 500,
    late_deduction: 0,
    absence_deduction: 0,
    sss_deduction: 1400,
    ca_deduction: 8000,
    health_check_deduction: 500,
    thirteenth_month_deduction: 600,
    gross_pay: 25500,
    total_deductions: 10500,
    net_pay: 15000,
    status: 'approved',
    created_at: '2026-05-08T10:00:00',
    updated_at: '2026-05-14T18:00:00',
  },
  {
    id: 3,
    payroll_period_id: 3,
    employee_id: 3,
    employee_name: 'Carmen Reyes',
    period_start: '2026-05-15',
    period_end: '2026-05-21',
    base_amount: 16000,
    commission_amount: 4000,
    overtime_amount: 1500,
    holiday_bonus: 800,
    meal_allowance: 500,
    late_deduction: 300,
    absence_deduction: 0,
    sss_deduction: 1300,
    ca_deduction: 3000,
    health_check_deduction: 0,
    thirteenth_month_deduction: 500,
    gross_pay: 22800,
    total_deductions: 5100,
    net_pay: 17700,
    status: 'draft',
    created_at: '2026-05-15T10:00:00',
    updated_at: '2026-05-21T09:00:00',
  },
];

export default function RecordsPage() {
  const [records, setRecords] = useState<PayrollRecord[]>(MOCK_RECORDS);
  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>(MOCK_RECORDS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter records
  useEffect(() => {
    let filtered = records;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterPeriod !== 'all') {
      filtered = filtered.filter(r => r.payroll_period_id.toString() === filterPeriod);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(r =>
        r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  }, [filterStatus, filterPeriod, searchQuery, records]);

  const handleExportPDF = async (record: PayrollRecord) => {
    try {
      setLoading(true);
      // Simulate PDF export
      setTimeout(() => {
        alert(`PDF export for ${record.employee_name} - Period ${record.period_start} to ${record.period_end}`);
        setLoading(false);
      }, 1000);
    } catch (err) {
      alert('Error exporting PDF');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const uniquePeriods = [...new Set(records.map(r => r.payroll_period_id))];
  const totalRecords = records.length;
  const totalGrossPay = records.reduce((sum, r) => sum + r.gross_pay, 0);
  const totalNetPay = records.reduce((sum, r) => sum + r.net_pay, 0);
  const totalDeductions = records.reduce((sum, r) => sum + r.total_deductions, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 Settlement Records</h1>
        <p className="text-gray-600 mt-1">View and export payroll calculation results</p>
      </div>

      <main className="px-4 py-6 pb-24">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Total Records</p>
            <h3 className="text-3xl font-bold mt-2">{totalRecords}</h3>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Total Gross Pay</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalGrossPay)}</h3>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Total Deductions</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalDeductions)}</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Total Net Pay</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalNetPay)}</h3>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="🔍 Search by employee name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="draft">📝 Draft</option>
                <option value="approved">✅ Approved</option>
                <option value="paid">💰 Paid</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Filter by Period</label>
              <select
                value={filterPeriod}
                onChange={e => setFilterPeriod(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Periods</option>
                {uniquePeriods.map(periodId => (
                  <option key={periodId} value={periodId.toString()}>
                    Period {periodId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Records List - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No records found
            </div>
          ) : (
            filteredRecords.map(record => (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{record.employee_name}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(record.period_start || '')} - {formatDate(record.period_end || '')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(record.status)}`}>
                    {getStatusEmoji(record.status)} {record.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gross Pay:</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(record.gross_pay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deductions:</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(record.total_deductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Net Pay:</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(record.net_pay)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm"
                  >
                    👁️ Details
                  </button>
                  <button
                    onClick={() => handleExportPDF(record)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold rounded-lg text-sm"
                  >
                    📄 PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Records List - Desktop Table */}
        <div className="hidden lg:block">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No records found
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Employee</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Period</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Gross Pay</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Deductions</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Net Pay</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{record.employee_name}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        {formatDate(record.period_start || '')} - {formatDate(record.period_end || '')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                        {formatCurrency(record.gross_pay)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                        {formatCurrency(record.total_deductions)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                        {formatCurrency(record.net_pay)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusColor(record.status)}`}>
                          {getStatusEmoji(record.status)} {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-xs transition-all"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleExportPDF(record)}
                          disabled={loading}
                          className="px-3 py-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold rounded text-xs transition-all"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white w-full lg:max-w-3xl rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Settlement Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Employee</p>
                    <p className="text-lg font-bold text-gray-900">{selectedRecord.employee_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Status</p>
                    <p className={`text-lg font-bold inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(selectedRecord.status)}`}>
                      {getStatusEmoji(selectedRecord.status)} {selectedRecord.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Period Start</p>
                    <p className="text-base font-bold text-gray-900">{formatDate(selectedRecord.period_start || '')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Period End</p>
                    <p className="text-base font-bold text-gray-900">{formatDate(selectedRecord.period_end || '')}</p>
                  </div>
                </div>
              </div>

              {/* Income Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Income</h3>
                <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Base Salary</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.base_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Commission</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.commission_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Overtime</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.overtime_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Holiday Bonus</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.holiday_bonus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Meal Allowance</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.meal_allowance)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex justify-between font-bold">
                    <span className="text-sm text-gray-900">Gross Pay</span>
                    <span className="text-sm text-green-600">{formatCurrency(selectedRecord.gross_pay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">📉 Deductions</h3>
                <div className="space-y-2 bg-red-50 p-4 rounded-lg border border-red-200">
                  {selectedRecord.late_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Late Deduction</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.late_deduction)}</span>
                    </div>
                  )}
                  {selectedRecord.absence_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Absence Deduction</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.absence_deduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">SSS Deduction</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.sss_deduction)}</span>
                  </div>
                  {selectedRecord.ca_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Cash Advance Deduction</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.ca_deduction)}</span>
                    </div>
                  )}
                  {selectedRecord.health_check_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Health Check</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.health_check_deduction)}</span>
                    </div>
                  )}
                  {selectedRecord.thirteenth_month_deduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">13th Month Saving</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.thirteenth_month_deduction)}</span>
                    </div>
                  )}
                  <div className="border-t border-red-200 pt-2 flex justify-between font-bold">
                    <span className="text-sm text-gray-900">Total Deductions</span>
                    <span className="text-sm text-red-600">{formatCurrency(selectedRecord.total_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <p className="text-sm font-semibold opacity-90">NET PAY (Take-Home)</p>
                <h3 className="text-4xl font-bold mt-2">{formatCurrency(selectedRecord.net_pay)}</h3>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-600 font-semibold">Notes</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => handleExportPDF(selectedRecord)}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-lg"
                >
                  {loading ? '💫 Exporting...' : '📄 Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
