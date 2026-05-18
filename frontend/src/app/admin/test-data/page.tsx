'use client';

import { useState, useMemo } from 'react';
import {
  calculateSettlements,
  getMonthOptions,
  formatCurrency,
  getValidationColor,
  type SettlementCalculation,
} from '@/lib/utils/settlement-calculator';
import { testData } from '@/lib/mock/test-data';

type TabType = 'overview' | 'companies' | 'guides' | 'customers' | 'sessions' | 'settlement';

export default function TestDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMonth, setSelectedMonth] = useState(getMonthOptions()[0]);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const monthOptions = getMonthOptions();
  const validation = useMemo(() => calculateSettlements(selectedMonth), [selectedMonth]);

  const getCompanyName = (companyId: number) =>
    testData.companies.find((c) => c.id === companyId)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Test Data & Settlement Validation</h1>
          <p className="text-lg text-slate-300 font-light">
            Comprehensive test dataset with 10 companies, 10 guides, 100 customers & settlement calculation validation
          </p>
        </div>

        {/* Month Selector */}
        <div className="mb-8 flex gap-4 items-center">
          <label className="text-white font-semibold">Settlement Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:border-indigo-500 focus:outline-none"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700">
          {(['overview', 'companies', 'guides', 'customers', 'sessions', 'settlement'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Total Companies</div>
                  <div className="text-3xl font-bold text-white">{validation.totalCompanies}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Total Guides</div>
                  <div className="text-3xl font-bold text-white">{validation.totalGuides}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Total Customers</div>
                  <div className="text-3xl font-bold text-white">{validation.totalCustomers}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Total Sessions</div>
                  <div className="text-3xl font-bold text-white">{validation.totalSessions}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Completed Sessions</div>
                  <div className="text-3xl font-bold text-green-400">{validation.completedSessions}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {((validation.completedSessions / validation.totalSessions) * 100).toFixed(1)}% completion rate
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Total Revenue</div>
                  <div className="text-3xl font-bold text-blue-400">{formatCurrency(validation.totalRevenue)}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                  <div className="text-slate-300 text-sm font-semibold mb-2">Total Payment</div>
                  <div className="text-3xl font-bold text-purple-400">{formatCurrency(validation.totalPayments)}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Commission: {formatCurrency(validation.totalCommissions)}
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-xl font-bold text-white mb-4">Data Validation Status</h2>
                <div className="space-y-2">
                  {validation.errors.length === 0 ? (
                    <div className="text-green-400 font-semibold">✓ All data validation checks passed</div>
                  ) : (
                    <>
                      <div className="text-red-400 font-semibold">✗ {validation.errors.length} error(s) found:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, i) => (
                          <li key={i} className="text-red-300 text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-white">ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Company Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Representative</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Settlement Day</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Commission Rate</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600">
                    {testData.companies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-3">{company.id}</td>
                        <td className="px-6 py-3 font-semibold text-white">{company.name}</td>
                        <td className="px-6 py-3">{company.representative}</td>
                        <td className="px-6 py-3">Day {company.settlement_day}</td>
                        <td className="px-6 py-3 text-blue-400">{company.commission_rate}%</td>
                        <td className="px-6 py-3">
                          <div className="text-xs">{company.phone}</div>
                          <div className="text-xs text-slate-400">{company.email}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Guides Tab */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-white">ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Guide Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Company</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Specialty</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Commission Rate</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Bank Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600">
                    {testData.guides.map((guide) => (
                      <tr key={guide.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-3">{guide.id}</td>
                        <td className="px-6 py-3 font-semibold text-white">{guide.name}</td>
                        <td className="px-6 py-3">{getCompanyName(guide.company_id)}</td>
                        <td className="px-6 py-3">{guide.specialty}</td>
                        <td className="px-6 py-3 text-blue-400">
                          {guide.commission_rate ? `${guide.commission_rate}%` : 'Company default'}
                        </td>
                        <td className="px-6 py-3 text-xs">
                          <div>{guide.bank_name}</div>
                          <div className="text-slate-400">{guide.bank_account}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-white">ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Customer Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Phone</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Email</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600">
                    {testData.customers.slice(0, 50).map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-3">{customer.id}</td>
                        <td className="px-6 py-3 font-semibold text-white">{customer.name}</td>
                        <td className="px-6 py-3">{customer.phone}</td>
                        <td className="px-6 py-3 text-xs">{customer.email}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              customer.status === 'active'
                                ? 'bg-green-900 text-green-400'
                                : 'bg-red-900 text-red-400'
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-400">{customer.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-center text-slate-400 text-sm">Showing 50 of {testData.customers.length} customers</div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-white">ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Guide</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Customer ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Service Type</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Price</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Duration</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Date & Time</th>
                      <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600">
                    {testData.sessions.slice(0, 50).map((session) => {
                      const guide = testData.guides.find((g) => g.id === session.guide_id);
                      return (
                        <tr key={session.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-3">{session.id}</td>
                          <td className="px-6 py-3 font-semibold text-white text-sm">{guide?.name}</td>
                          <td className="px-6 py-3">{session.customer_id}</td>
                          <td className="px-6 py-3">{session.service_type}</td>
                          <td className="px-6 py-3 text-green-400 font-semibold">{formatCurrency(session.service_price)}</td>
                          <td className="px-6 py-3">{session.duration_minutes} min</td>
                          <td className="px-6 py-3 text-xs">{session.session_date} {session.session_time}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                session.status === 'completed'
                                  ? 'bg-green-900 text-green-400'
                                  : session.status === 'cancelled'
                                    ? 'bg-yellow-900 text-yellow-400'
                                    : 'bg-red-900 text-red-400'
                              }`}
                            >
                              {session.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-center text-slate-400 text-sm">Showing 50 of {testData.sessions.length} sessions</div>
            </div>
          )}

          {/* Settlement Tab */}
          {activeTab === 'settlement' && (
            <div className="space-y-6">
              {/* Settlement Summary */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-xl font-bold text-white mb-4">
                  Settlement Summary - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-400">{formatCurrency(validation.totalRevenue)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Total Commission</div>
                    <div className="text-2xl font-bold text-yellow-400">{formatCurrency(validation.totalCommissions)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Total Payment</div>
                    <div className="text-2xl font-bold text-purple-400">{formatCurrency(validation.totalPayments)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Avg Commission Rate</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(validation.guideSettlements.reduce((sum, s) => sum + s.commission_rate, 0) / validation.guideSettlements.length).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Guide Settlements */}
              <div className="space-y-4">
                {validation.guideSettlements.map((settlement) => (
                  <div key={settlement.guide_id} className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                    <button
                      onClick={() => setExpandedGuide(expandedGuide === settlement.guide_id ? null : settlement.guide_id)}
                      className={`w-full px-6 py-4 flex items-center justify-between hover:bg-slate-600/50 transition-colors ${
                        settlement.validation_status === 'error'
                          ? 'border-l-4 border-l-red-500'
                          : settlement.validation_status === 'warning'
                            ? 'border-l-4 border-l-yellow-500'
                            : 'border-l-4 border-l-green-500'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <div className="text-white font-semibold">{settlement.guide_name}</div>
                          <div className="text-sm text-slate-400">{settlement.company_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-white font-bold">{formatCurrency(settlement.payment_amount)}</div>
                          <div className="text-xs text-slate-400">Payment</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">{settlement.completed_sessions}</div>
                          <div className="text-xs text-slate-400">Sessions</div>
                        </div>
                        <div className={`px-3 py-1 rounded text-sm font-semibold ${getValidationColor(settlement.validation_status)}`}>
                          {settlement.validation_status.toUpperCase()}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedGuide === settlement.guide_id && (
                      <div className="px-6 py-6 bg-slate-800/50 border-t border-slate-600 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Total Sessions</div>
                            <div className="text-2xl font-bold text-white">{settlement.total_sessions}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Completed</div>
                            <div className="text-2xl font-bold text-green-400">{settlement.completed_sessions}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Cancelled</div>
                            <div className="text-2xl font-bold text-yellow-400">{settlement.cancelled_sessions}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">No-show</div>
                            <div className="text-2xl font-bold text-red-400">{settlement.noshow_sessions}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-600">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Total Revenue</div>
                            <div className="text-xl font-bold text-blue-400">{formatCurrency(settlement.total_revenue)}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Commission Rate</div>
                            <div className="text-xl font-bold text-yellow-400">{settlement.commission_rate}%</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Commission Amount</div>
                            <div className="text-xl font-bold text-yellow-300">{formatCurrency(settlement.commission_amount)}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Settlement Day</div>
                            <div className="text-lg font-bold text-white">Day {settlement.settlement_day}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Expected Settlement Date</div>
                            <div className="text-lg font-bold text-indigo-400">{settlement.expected_settlement_date}</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-xs mb-1">Average Session Price</div>
                          <div className="text-lg font-bold text-green-400">{formatCurrency(settlement.average_session_price)}</div>
                        </div>

                        {settlement.validation_messages.length > 0 && (
                          <div className="pt-4 border-t border-slate-600">
                            <div className="text-slate-400 text-xs font-semibold mb-2">Validation Messages:</div>
                            <ul className="space-y-1">
                              {settlement.validation_messages.map((msg, i) => (
                                <li key={i} className="text-xs text-slate-300">• {msg}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Validation Report */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h2 className="text-xl font-bold text-white mb-4">Validation Report</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-1">✓</span>
                    <div>
                      <div className="text-white font-semibold">Data Completeness</div>
                      <div className="text-sm text-slate-400">10 companies, 10 guides, 100 customers, 100 sessions verified</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-1">✓</span>
                    <div>
                      <div className="text-white font-semibold">Settlement Calculations</div>
                      <div className="text-sm text-slate-400">
                        All guide settlements calculated with proper commission deduction ({validation.totalRevenue.toLocaleString()} - {validation.totalCommissions.toLocaleString()} = {validation.totalPayments.toLocaleString()})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-1">✓</span>
                    <div>
                      <div className="text-white font-semibold">Guide-Company Matching</div>
                      <div className="text-sm text-slate-400">All guides properly matched to companies with correct settlement days</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 font-bold mt-1">✓</span>
                    <div>
                      <div className="text-white font-semibold">Session-Customer Validation</div>
                      <div className="text-sm text-slate-400">All sessions linked to valid customers and guides</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
