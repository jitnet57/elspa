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
    { id: 1, name: 'ABC여행사' },
    { id: 2, name: 'XYZ여행사' },
    { id: 3, name: '글로벌투어' },
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

  const getCompanyName = (id: number) => (companies as Company[]).find(c => c.id === id)?.name || '알 수 없음';
  const getGuideName = (id: number) => (guides as Guide[]).find(g => g.id === id)?.name || '알 수 없음';

  // 월별 통계
  const monthlyStats = {
    total_revenue: filteredSettlements.reduce((sum, s) => sum + s.total_revenue, 0),
    total_commission: filteredSettlements.reduce((sum, s) => sum + s.commission_amount, 0),
    total_payment: filteredSettlements.reduce((sum, s) => sum + s.payment_amount, 0),
    total_sessions: filteredSettlements.reduce((sum, s) => sum + s.total_sessions, 0),
    guide_count: new Set(filteredSettlements.map(s => s.guide_id)).size,
  };

  // 회사별 통계
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

  // 가이드별 통계
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
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📈 정산 보고서
          </h1>
          <p className="text-lg text-gray-600 font-light">
            월별, 회사별, 가이드별 정산 통계 및 분석
          </p>
        </div>

        {/* 월 선택 & 보고서 유형 */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">월 선택</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">보고서 유형</label>
            <div className="flex gap-2">
              {[
                { value: 'monthly', label: '월별' },
                { value: 'company', label: '회사별' },
                { value: 'guide', label: '가이드별' },
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
            📥 CSV 내보내기
          </button>
        </div>

        {/* 월별 보고서 */}
        {reportType === 'monthly' && (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">총 수익</div>
                <div className="text-3xl font-bold text-blue-600">₩{(monthlyStats.total_revenue / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">총 수수료</div>
                <div className="text-3xl font-bold text-red-600">₩{(monthlyStats.total_commission / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">지급액</div>
                <div className="text-3xl font-bold text-green-600">₩{(monthlyStats.total_payment / 1000000).toFixed(1)}M</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-1">세션 수</div>
                <div className="text-3xl font-bold text-purple-600">{monthlyStats.total_sessions}</div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">월 정산 요약</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left py-3 px-4 font-bold text-gray-900">구분</th>
                      <th className="text-right py-3 px-4 font-bold text-gray-900">금액</th>
                      <th className="text-right py-3 px-4 font-bold text-gray-900">비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">총 수익</td>
                      <td className="text-right py-3 px-4 font-bold text-gray-900">₩{monthlyStats.total_revenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-gray-900">100%</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-red-600 font-semibold">수수료 (차감)</td>
                      <td className="text-right py-3 px-4 font-bold text-red-600">
                        -₩{monthlyStats.total_commission.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-red-600">
                        {((monthlyStats.total_commission / monthlyStats.total_revenue) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-t-2 border-green-300">
                      <td className="py-3 px-4 font-bold text-gray-900">가이드 지급액</td>
                      <td className="text-right py-3 px-4 font-bold text-green-600">
                        ₩{monthlyStats.total_payment.toLocaleString()}
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

        {/* 회사별 보고서 */}
        {reportType === 'company' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">회사별 정산 현황</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">회사</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">수익</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">수수료</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">지급액</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">가이드 수</th>
                  </tr>
                </thead>
                <tbody>
                  {companyStats.map(stat => (
                    <tr key={stat.company_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{stat.company_name}</td>
                      <td className="text-right py-3 px-4 text-gray-900">₩{(stat.total_revenue / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">₩{(stat.total_commission / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-green-600 font-bold">
                        ₩{(stat.total_payment / 1000).toFixed(0)}K
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">{stat.guide_count}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 가이드별 보고서 */}
        {reportType === 'guide' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">가이드별 정산 현황</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">가이드</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">회사</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">세션</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">수익</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">수수료</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900">지급액</th>
                  </tr>
                </thead>
                <tbody>
                  {guideStats.map(stat => (
                    <tr key={stat.guide_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{stat.guide_name}</td>
                      <td className="py-3 px-4 text-gray-700">{stat.company_name}</td>
                      <td className="text-right py-3 px-4 text-gray-900">{stat.total_sessions}회</td>
                      <td className="text-right py-3 px-4 text-gray-900">₩{(stat.total_revenue / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">₩{(stat.total_commission / 1000).toFixed(0)}K</td>
                      <td className="text-right py-3 px-4 text-green-600 font-bold">
                        ₩{(stat.total_payment / 1000).toFixed(0)}K
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
