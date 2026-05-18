'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';
import { exportSettlementReportCSV, downloadCSV } from '@/lib/utils/csv-export';

interface MonthlySettlement {
  id: number;
  company_id: number;
  guide_id: number;
  settlement_month: string;
  settlement_date: string;
  total_sessions: number;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  payment_amount: number;
  service_breakdown: Record<string, { sessions: number; revenue: number }>;
  status: 'pending' | 'confirmed' | 'paid';
  notes?: string;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
}

interface Guide {
  id: number;
  name: string;
  company_id: number;
}

const mockMonthlySettlements: MonthlySettlement[] = [
  {
    id: 1,
    company_id: 1,
    guide_id: 1,
    settlement_month: '2026-05',
    settlement_date: '2026-05-20',
    total_sessions: 5,
    total_revenue: 400000,
    commission_rate: 30,
    commission_amount: 120000,
    payment_amount: 280000,
    service_breakdown: { swedish: { sessions: 3, revenue: 240000 }, thai: { sessions: 2, revenue: 160000 } },
    status: 'paid',
    notes: '',
    created_at: '2026-05-20',
  },
  {
    id: 2,
    company_id: 1,
    guide_id: 2,
    settlement_month: '2026-05',
    settlement_date: '2026-05-20',
    total_sessions: 4,
    total_revenue: 360000,
    commission_rate: 30,
    commission_amount: 108000,
    payment_amount: 252000,
    service_breakdown: { thai: { sessions: 4, revenue: 360000 } },
    status: 'paid',
    notes: '',
    created_at: '2026-05-20',
  },
];

export default function SettlementReportPage() {
  const { monthlySettlements, setMonthlySettlements, companies, setCompanies, guides, setGuides } = useStore();
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [reportType, setReportType] = useState<'monthly' | 'company' | 'guide'>('monthly');

  if (monthlySettlements.length === 0) {
    setMonthlySettlements(mockMonthlySettlements);
  }

  const mockCompanies: Company[] = [
    { id: 1, name: 'ABC Travel Agency' },
    { id: 2, name: 'XYZ Travel Agency' },
    { id: 3, name: 'Global Tours' },
  ];
  const mockGuides: Guide[] = [
    { id: 1, name: 'Sarah', company_id: 1 },
    { id: 2, name: 'Emma', company_id: 1 },
    { id: 3, name: 'Jessica', company_id: 1 },
    { id: 4, name: 'Amanda', company_id: 2 },
    { id: 5, name: 'Catherine', company_id: 2 },
    { id: 6, name: 'Rachel', company_id: 3 },
  ];

  if (companies.length === 0) setCompanies(mockCompanies as any);
  if (guides.length === 0) setGuides(mockGuides as any);

  const filteredSettlements = monthlySettlements.filter(s => s.settlement_month === selectedMonth);

  const getCompanyName = (id: number) => (companies as Company[]).find(c => c.id === id)?.name || 'Unknown';
  const getGuideName = (id: number) => (guides as Guide[]).find(g => g.id === id)?.name || 'Unknown';

  // Monthly statistics
  const monthlyStats = {
    total_revenue: filteredSettlements.reduce((sum, s) => sum + s.total_revenue, 0),
    total_commission: filteredSettlements.reduce((sum, s) => sum + s.commission_amount, 0),
    total_payment: filteredSettlements.reduce((sum, s) => sum + s.payment_amount, 0),
    total_sessions: filteredSettlements.reduce((sum, s) => sum + s.total_sessions, 0),
    guide_count: new Set(filteredSettlements.map(s => s.guide_id)).size,
  };

  // Statistics by company
  const companyStats = (companies as Company[]).map(company => {
    const companySettlements = filteredSettlements.filter(s => s.company_id === company.id);
    return {
      company_id: company.id,
      company_name: company.name,
      total_revenue: companySettlements.reduce((sum, s) => sum + s.total_revenue, 0),
      total_commission: companySettlements.reduce((sum, s) => sum + s.commission_amount, 0),
      total_payment: companySettlements.reduce((sum, s) => sum + s.payment_amount, 0),
      guide_count: companySettlements.length,
    };
  });

  // Statistics by guide
  const guideStats = (guides as Guide[])
    .map(guide => {
      const guideSettlements = filteredSettlements.filter(s => s.guide_id === guide.id);
      if (guideSettlements.length === 0) return null;
      return {
        guide_id: guide.id,
        guide_name: guide.name,
        company_name: getCompanyName(guide.company_id),
        total_revenue: guideSettlements.reduce((sum, s) => sum + s.total_revenue, 0),
        total_commission: guideSettlements.reduce((sum, s) => sum + s.commission_amount, 0),
        total_payment: guideSettlements.reduce((sum, s) => sum + s.payment_amount, 0),
        total_sessions: guideSettlements.reduce((sum, s) => sum + s.total_sessions, 0),
      };
    })
    .filter(s => s !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📈 Settlement Report
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Settlement statistics and analysis by month, company, and guide
          </p>
        </div>

        {/* Month Selection & Report Type */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
            <div className="flex gap-2">
              {[
                { value: 'monthly', label: 'Monthly' },
                { value: 'company', label: 'By Company' },
                { value: 'guide', label: 'By Guide' },
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value as any)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    reportType === type.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              const csv = exportSettlementReportCSV(
                filteredSettlements,
                mockCompanies as any,
                mockGuides as any,
                selectedMonth,
                reportType
              );
              const typeText =
                reportType === 'monthly' ? '월별' : reportType === 'company' ? '회사별' : '가이드별';
              downloadCSV(`정산보고서_${selectedMonth}_${typeText}.csv`, csv);
              alert('보고서가 다운로드되었습니다!');
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Monthly Report */}
        {reportType === 'monthly' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-blue-600">₱{(monthlyStats.total_revenue / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">Total Commission</div>
                <div className="text-3xl font-bold text-red-600">₱{(monthlyStats.total_commission / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">Payment Amount</div>
                <div className="text-3xl font-bold text-green-600">₱{(monthlyStats.total_payment / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">Number of Sessions</div>
                <div className="text-3xl font-bold text-purple-600">{monthlyStats.total_sessions}</div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Settlement Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left py-3 px-4 font-bold text-gray-900">Category</th>
                      <th className="text-right py-3 px-4 font-bold text-gray-900">Amount</th>
                      <th className="text-right py-3 px-4 font-bold text-gray-900">Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">Total Revenue</td>
                      <td className="text-right py-3 px-4 font-bold text-gray-900">₱{monthlyStats.total_revenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-gray-900">100%</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-red-600 font-semibold">Commission (Deducted)</td>
                      <td className="text-right py-3 px-4 font-bold text-red-600">
                        -₱{monthlyStats.total_commission.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-red-600">
                        {((monthlyStats.total_commission / monthlyStats.total_revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-t-2 border-green-300">
                      <td className="py-3 px-4 font-bold text-gray-900">Guide Payment</td>
                      <td className="text-right py-3 px-4 font-bold text-green-600">
                        ₱{monthlyStats.total_payment.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-green-600">
                        {((monthlyStats.total_payment / monthlyStats.total_revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Report by Company */}
        {reportType === 'company' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settlement Status by Company</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Company</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Revenue</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Commission</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Payment</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Number of Guides</th>
                  </tr>
                </thead>
                <tbody>
                  {companyStats.map(stat => (
                    <tr key={stat.company_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{stat.company_name}</td>
                      <td className="text-right py-3 px-4 text-gray-900">₱{(stat.total_revenue / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">₱{(stat.total_commission / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-green-600 font-bold">
                        ₱{(stat.total_payment / 1000).toFixed(0)}K
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">{stat.guide_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report by Guide */}
        {reportType === 'guide' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settlement Status by Guide</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Guide</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Company</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Sessions</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Revenue</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Commission</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {guideStats.map(stat => (
                    <tr key={stat.guide_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{stat.guide_name}</td>
                      <td className="py-3 px-4 text-gray-700">{stat.company_name}</td>
                      <td className="text-right py-3 px-4 text-gray-900">{stat.total_sessions}</td>
                      <td className="text-right py-3 px-4 text-gray-900">₱{(stat.total_revenue / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">₱{(stat.total_commission / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-green-600 font-bold">
                        ₱{(stat.total_payment / 1000).toFixed(0)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

