'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store';
import { exportSettlementReportCSV, downloadCSV } from '@/lib/utils/csv-export';
import { getCompanySettlements, getGuideSettlements } from '@/lib/api/settlement-client';
import { exportSettlementToSheet } from '@/lib/api/settlement-sheet-client';


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

export default function SettlementReportPage() {
  const {
    monthlySettlements,
    isLoading,
    error,
    fetchMonthlySettlements,
    companies,
    setCompanies,
    guides,
    setGuides
  } = useStore();
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [reportType, setReportType] = useState<'monthly' | 'company' | 'guide'>('monthly');
  const [sheetLoading, setSheetLoading] = useState(false);
  // Drive 저장 로딩 상태 (매출 / 수수료 각각 관리)
  const [driveRevenueLoading, setDriveRevenueLoading] = useState(false);
  const [driveCommissionLoading, setDriveCommissionLoading] = useState(false);

  // API에서 정산 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchMonthlySettlements(selectedMonth);
      } catch (err) {
        console.error('Failed to load settlements:', err);
      }
    };

    loadData();
  }, [selectedMonth, fetchMonthlySettlements]);

  // 회사와 가이드 데이터 로드 (초기 1회)
  useEffect(() => {
    const fetchCompaniesAndGuides = async () => {
      try {
        if (companies.length === 0) {
          const companyData = await getCompanySettlements(selectedMonth);
          setCompanies(companyData as any);
        }
        if (guides.length === 0) {
          const guideData = await getGuideSettlements(selectedMonth);
          setGuides(guideData as any);
        }
      } catch (err) {
        console.error('Failed to load companies/guides:', err);
        // 기본 데이터 설정
        const defaultCompanies: Company[] = [
          { id: 1, name: 'ABC Travel Agency' },
          { id: 2, name: 'XYZ Travel Agency' },
          { id: 3, name: 'Global Tours' },
        ];
        const defaultGuides: Guide[] = [
          { id: 1, name: 'Sarah', company_id: 1 },
          { id: 2, name: 'Emma', company_id: 1 },
          { id: 3, name: 'Jessica', company_id: 1 },
          { id: 4, name: 'Amanda', company_id: 2 },
          { id: 5, name: 'Catherine', company_id: 2 },
          { id: 6, name: 'Rachel', company_id: 3 },
        ];
        if (companies.length === 0) setCompanies(defaultCompanies as any);
        if (guides.length === 0) setGuides(defaultGuides as any);
      }
    };

    fetchCompaniesAndGuides();
  }, [companies.length, guides.length, selectedMonth, setCompanies, setGuides]);

  // 정산 데이터 필터링 (로딩 중일 때 빈 배열)
  const filteredSettlements = isLoading ? [] : monthlySettlements.filter(s => s.settlement_month === selectedMonth);

  // 헬퍼 함수: 회사명 조회
  const getCompanyName = (id: number) => {
    const company = (companies as Company[]).find(c => c.id === id);
    return company?.name || `Company #${id}`;
  };

  // 헬퍼 함수: 가이드명 조회
  const getGuideName = (id: number) => {
    const guide = (guides as Guide[]).find(g => g.id === id);
    return guide?.name || `Guide #${id}`;
  };

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

  // ============================================================
  // 📌 함수명: handleDriveExport
  // 📋 목적: 정산 데이터를 Google Drive 스프레드시트로 저장
  // 🔧 매개변수: category ('매출' | '수수료') — 저장할 데이터 종류
  // 📅 작성일: 2026-06-02
  // ============================================================
  const handleDriveExport = async (category: '매출' | '수수료') => {
    // 매출/수수료에 따라 로딩 상태 및 rows 구성 분기
    if (category === '매출') {
      setDriveRevenueLoading(true);
    } else {
      setDriveCommissionLoading(true);
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

      let rows: Array<Array<any>>;
      if (category === '매출') {
        // 매출 헤더 + 데이터 행
        const header = ['업체', '가이드', '매출', '세션수', '월', '상태'];
        const dataRows = filteredSettlements.map(s => [
          getCompanyName(s.company_id),
          getGuideName(s.guide_id),
          s.total_revenue,
          s.total_sessions,
          s.settlement_month,
          s.status,
        ]);
        rows = [header, ...dataRows];
      } else {
        // 수수료 헤더 + 데이터 행
        const header = ['업체', '가이드', '매출', '커미션율', '커미션액', '지급액', '월', '상태'];
        const dataRows = filteredSettlements.map(s => [
          getCompanyName(s.company_id),
          getGuideName(s.guide_id),
          s.total_revenue,
          s.commission_rate,
          s.commission_amount,
          s.payment_amount,
          s.settlement_month,
          s.status,
        ]);
        rows = [header, ...dataRows];
      }

      const res = await fetch(`${API_BASE}/api/booking/drive/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title_prefix: selectedMonth,
          rows,
        }),
      });

      if (res.status === 401) {
        alert('Google 계정 인증이 필요합니다. 우측 Google 연결 버튼을 통해 인증해 주세요.');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Drive 저장 실패');
      }
      alert(`✅ ${data.message}`);
    } catch (e) {
      alert(`⚠️ Drive 저장 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (category === '매출') {
        setDriveRevenueLoading(false);
      } else {
        setDriveCommissionLoading(false);
      }
    }
  };

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

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-red-600 text-2xl">⚠️</span>
              <div>
                <p className="text-red-800 font-semibold">데이터 로드 실패</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchMonthlySettlements(selectedMonth)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              🔄 재시도
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-6 bg-white border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              <p className="text-gray-700 font-medium">정산 데이터를 로드하는 중...</p>
            </div>
          </div>
        )}

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
                companies as any,
                guides as any,
                selectedMonth,
                reportType
              );
              const typeText =
                reportType === 'monthly' ? '월별' : reportType === 'company' ? '회사별' : '가이드별';
              downloadCSV(`정산보고서_${selectedMonth}_${typeText}.csv`, csv);
              alert('보고서가 다운로드되었습니다!');
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            📥 Export CSV
          </button>
          <button
            onClick={async () => {
              setSheetLoading(true);
              try {
                const r = await exportSettlementToSheet({
                  month: selectedMonth,
                  reportType,
                  settlements: filteredSettlements as any,
                  companies: companies as any,
                  guides: guides as any,
                });
                alert(`✅ ${r.message}`);
              } catch (e) {
                alert(`⚠️ ${e instanceof Error ? e.message : 'Google Sheet 내보내기 실패'}`);
              } finally {
                setSheetLoading(false);
              }
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading || sheetLoading}
          >
            {sheetLoading ? '내보내는 중…' : '📊 Google Sheet로 내보내기'}
          </button>
          {/* Drive 저장 버튼: 매출 */}
          <button
            onClick={() => handleDriveExport('매출')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading || driveRevenueLoading}
          >
            {driveRevenueLoading ? '저장 중…' : '💾 Drive 저장 (매출)'}
          </button>
          {/* Drive 저장 버튼: 수수료 */}
          <button
            onClick={() => handleDriveExport('수수료')}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading || driveCommissionLoading}
          >
            {driveCommissionLoading ? '저장 중…' : '💾 Drive 저장 (수수료)'}
          </button>
          {/* Google 인증 상태 표시 */}
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

