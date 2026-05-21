'use client';

/**
 * 📌 Cash Advance Management Page
 * 📋 목적: CA 신청 목록 조회, 상태 필터, 승인/거절 처리 (API 연동)
 * 🔧 포함: CA 테이블, 상태 필터, 승인/거절 버튼, 상세 모달
 * 📌 개선: Zustand store 사용, API 연동, Retry logic
 * 📅 작성일: 2026-05-22
 */

import { useState, useEffect } from 'react';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { CashAdvance } from '@/lib/api/payroll-client';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    emoji: '⏳',
    bgColor: 'from-yellow-500 to-yellow-600',
  },
  approved: {
    label: 'Approved',
    color: 'bg-blue-100 text-blue-700',
    emoji: '✅',
    bgColor: 'from-blue-500 to-blue-600',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    emoji: '❌',
    bgColor: 'from-red-500 to-red-600',
  },
  settled: {
    label: 'Settled',
    color: 'bg-green-100 text-green-700',
    emoji: '✔️',
    bgColor: 'from-green-500 to-green-600',
  },
};

export default function CashAdvancePage() {
  const [filteredCAs, setFilteredCAs] = useState<CashAdvance[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCA, setSelectedCA] = useState<CashAdvance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Zustand store
  const { cashAdvances, loading, error, fetchCashAdvances, updateCAStatus, clearError } =
    usePayrollStore();

  // Load cash advances on mount
  useEffect(() => {
    fetchCashAdvances();
  }, [fetchCashAdvances]);

  // Filter CAs when status or search changes
  useEffect(() => {
    let filtered = cashAdvances;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ca => ca.status === filterStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        ca =>
          ca.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ca.id.toString().includes(searchQuery)
      );
    }

    setFilteredCAs(filtered);
  }, [filterStatus, searchQuery, cashAdvances]);

  const handleApprove = async () => {
    if (!selectedCA) return;

    try {
      await updateCAStatus(selectedCA.id, 'approved');
      setShowActionModal(false);
      setActionNotes('');
      setActionType(null);
      alert('Cash advance approved successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error approving cash advance';
      alert(errorMsg);
    }
  };

  const handleReject = async () => {
    if (!selectedCA) return;

    try {
      await updateCAStatus(selectedCA.id, 'rejected');
      setShowActionModal(false);
      setActionNotes('');
      setActionType(null);
      alert('Cash advance rejected');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error rejecting cash advance';
      alert(errorMsg);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: cashAdvances.length,
    pending: cashAdvances.filter(ca => ca.status === 'pending').length,
    approved: cashAdvances.filter(ca => ca.status === 'approved').length,
    rejected: cashAdvances.filter(ca => ca.status === 'rejected').length,
    settled: cashAdvances.filter(ca => ca.status === 'settled').length,
    totalAmount: cashAdvances.reduce((sum, ca) => sum + ca.amount, 0),
    pendingAmount: cashAdvances
      .filter(ca => ca.status === 'pending')
      .reduce((sum, ca) => sum + ca.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">💰 Cash Advance Management</h1>
        <p className="text-gray-600 mt-1">Review and approve employee cash advance requests</p>
      </div>

      <main className="px-4 py-6 pb-24">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Total Requests</p>
            <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Pending</p>
            <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Approved</p>
            <h3 className="text-2xl font-bold mt-1">{stats.approved}</h3>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Rejected</p>
            <h3 className="text-2xl font-bold mt-1">{stats.rejected}</h3>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Settled</p>
            <h3 className="text-2xl font-bold mt-1">{stats.settled}</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-90">Pending Amt</p>
            <h3 className="text-lg font-bold mt-1">{formatCurrency(stats.pendingAmount)}</h3>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="🔍 Search by employee name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Status
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  filterStatus === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {config.emoji} {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* CA List - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredCAs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No cash advances found
            </div>
          ) : (
            filteredCAs.map(ca => {
              const config = STATUS_CONFIG[ca.status as keyof typeof STATUS_CONFIG];
              return (
                <div
                  key={ca.id}
                  className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{ca.employee_name}</h3>
                      <p className="text-sm text-gray-600">CA #{ca.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                      {config.emoji} {config.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm font-bold text-green-600">{formatCurrency(ca.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Requested:</span>
                      <span className="text-sm font-bold text-gray-900">{formatDate(ca.request_date)}</span>
                    </div>
                    {ca.reason && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Reason:</span>
                        <span className="text-sm font-bold text-gray-900">{ca.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCA(ca);
                        setShowModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg text-sm"
                    >
                      👁️ View
                    </button>
                    {ca.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCA(ca);
                            setActionType('approve');
                            setShowActionModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCA(ca);
                            setActionType('reject');
                            setShowActionModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CA List - Desktop Table */}
        <div className="hidden lg:block">
          {filteredCAs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No cash advances found
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Employee</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Reason</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Request Date</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCAs.map(ca => {
                    const config = STATUS_CONFIG[ca.status as keyof typeof STATUS_CONFIG];
                    return (
                      <tr key={ca.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">CA-{ca.id.toString().padStart(4, '0')}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{ca.employee_name}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                          {formatCurrency(ca.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{ca.reason || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-700">
                          {formatDate(ca.request_date)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${config.color}`}>
                            {config.emoji} {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCA(ca);
                              setShowModal(true);
                            }}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded text-xs transition-all"
                          >
                            View
                          </button>
                          {ca.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCA(ca);
                                  setActionType('approve');
                                  setShowActionModal(true);
                                }}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-xs transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCA(ca);
                                  setActionType('reject');
                                  setShowActionModal(true);
                                }}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      {showModal && selectedCA && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Cash Advance Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <p className="text-sm font-semibold opacity-90">Amount</p>
                <h3 className="text-4xl font-bold mt-2">{formatCurrency(selectedCA.amount)}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">CA ID</p>
                  <p className="text-lg font-bold text-gray-900">#{selectedCA.id}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Employee</p>
                  <p className="text-lg font-bold text-gray-900">{selectedCA.employee_name}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Reason</p>
                <p className="text-gray-900 mt-1">{selectedCA.reason || 'No reason provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Requested</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(selectedCA.request_date)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold">Created</p>
                  <p className="text-sm font-bold text-gray-900">{formatDateTime(selectedCA.created_at)}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Status</p>
                <p className={`text-sm font-bold mt-1 ${STATUS_CONFIG[selectedCA.status as keyof typeof STATUS_CONFIG].color} inline-block px-3 py-1 rounded-full`}>
                  {STATUS_CONFIG[selectedCA.status as keyof typeof STATUS_CONFIG].emoji} {selectedCA.status.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg mt-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Approve/Reject) */}
      {showActionModal && selectedCA && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {actionType === 'approve' ? '✅ Approve Request' : '❌ Reject Request'}
              </h2>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionNotes('');
                  setActionType(null);
                }}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-lg ${actionType === 'approve' ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
                <p className="text-sm font-bold text-gray-700">Employee</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedCA.employee_name}</p>
                <p className="text-sm text-gray-600 mt-2">Amount: {formatCurrency(selectedCA.amount)}</p>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Optional)'}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Add any notes about this approval...'
                      : 'Explain why this request is being rejected...'
                  }
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setActionNotes('');
                    setActionType(null);
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={actionType === 'approve' ? handleApprove : handleReject}
                  disabled={loading}
                  className={`px-6 py-3 text-white font-bold rounded-lg transition-all disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading
                    ? '💫 Processing...'
                    : actionType === 'approve'
                      ? '✅ Confirm Approval'
                      : '❌ Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
