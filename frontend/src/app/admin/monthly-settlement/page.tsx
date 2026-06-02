'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { useT } from '@/lib/i18n';
import { PriceDisplay } from '@/components/PriceDisplay';
import { exportMonthlySettlementCSV, downloadCSV } from '@/lib/utils/csv-export';
import {
  getCompanies,
  getGuides,
  getMonthlySettlements,
} from '@/lib/api/companies-client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  settlement_day?: number;
  commission_rate?: number;
  representative?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  gcash_number?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
}

interface Guide {
  id: number;
  name: string;
  company_id: number;
}

export default function MonthlySettlementPage() {
  const t = useT();
  const { rates, addNotification } = useStore();
  const [settlements, setSettlements] = useState<MonthlySettlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'paid'>('all');
  const [selectedSettlement, setSelectedSettlement] = useState<MonthlySettlement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ============================================================
  // 📌 레퍼럴 → 월정산 자동 반영 상태
  // 📋 isApplying: 처리 중(버튼 비활성/스피너), applyResult: 결과 배너 메시지
  // ============================================================
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ type: 'success' | 'empty' | 'error'; text: string } | null>(null);

  // ============================================================
  // 📌 Initial data load — Supabase 직결 (companies-client)
  // 📋 회사/가이드/월정산을 병렬 로드. 빈 데이터/미설정 시 빈 표로 처리.
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [companyRows, guideRows, settlementRows] = await Promise.all([
          getCompanies(),
          getGuides(),
          getMonthlySettlements(),
        ]);

        setCompanies(companyRows as Company[]);
        setGuides(guideRows as Guide[]);
        // 클라이언트 타입의 optional 필드를 화면용 비-optional 형태로 정규화
        setSettlements(
          settlementRows.map(s => ({
            ...s,
            guide_id: s.guide_id ?? 0,
            settlement_date: s.settlement_date ?? '',
            service_breakdown: s.service_breakdown ?? {},
            created_at: s.created_at ?? '',
          })) as MonthlySettlement[]
        );
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Settlement data query error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtering and search
  const filteredSettlements = useMemo(() => {
    let filtered = settlements.filter(s => {
      const monthMatch = s.settlement_month === selectedMonth;
      const companyMatch = !filterCompanyId || s.company_id === filterCompanyId;
      const statusMatch = statusFilter === 'all' || s.status === statusFilter;
      const guideName = guides.find(g => g.id === s.guide_id)?.name || '';
      const searchMatch = guideName.toLowerCase().includes(searchQuery.toLowerCase());

      return monthMatch && companyMatch && statusMatch && searchMatch;
    });

    return filtered;
  }, [settlements, selectedMonth, filterCompanyId, statusFilter, searchQuery, guides]);

  const groupedByCompany = useMemo(() => {
    return filteredSettlements.reduce(
      (acc, settlement) => {
        const companyId = settlement.company_id;
        if (!acc[companyId]) {
          acc[companyId] = [];
        }
        acc[companyId].push(settlement);
        return acc;
      },
      {} as Record<number, MonthlySettlement[]>
    );
  }, [filteredSettlements]);

  const totals = useMemo(() => {
    return filteredSettlements.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.total_revenue,
        commission: acc.commission + s.commission_amount,
        payment: acc.payment + s.payment_amount,
        count: acc.count + 1,
      }),
      { revenue: 0, commission: 0, payment: 0, count: 0 }
    );
  }, [filteredSettlements]);

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown';
  };

  const getGuideName = (guideId: number) => {
    return guides.find(g => g.id === guideId)?.name || 'Unknown';
  };

  const getNextSettlementDate = (companyId: number): string => {
    const company = companies.find(c => c.id === companyId);
    if (!company || !company.settlement_day) return t('Settlement day not set', '정산일 미설정');

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    let nextDate = new Date(year, month, company.settlement_day);

    if (nextDate <= today) {
      nextDate = new Date(year, month + 1, company.settlement_day);
    }

    return nextDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // ============================================================
  // 📌 isReferralSettlement
  // 📋 목적: 레퍼럴 파이프라인이 자동 생성한 정산인지 판별
  //          (referral-settlement.ts 가 notes 에 'referral' 마커를 남김)
  // 📤 반환값: boolean
  // ============================================================
  const isReferralSettlement = (s: MonthlySettlement) =>
    !!s.notes && s.notes.toLowerCase().includes('referral');

  // ============================================================
  // 📌 handleApplyReferral
  // 📋 목적: 선택한 월의 예약 레퍼럴(노트)을 월정산에 자동 반영
  //          - 확인(confirm) → 처리 중 비활성/스피너 → 결과 배너 표시
  // ============================================================
  const handleApplyReferral = async () => {
    if (isApplying) return;
    const ok = window.confirm(
      t(
        `Aggregate the company/guide referrals (notes) of ${selectedMonth} bookings and apply them to the monthly settlement?\n` +
          'Already-applied (company·guide·month) entries will be updated with the latest aggregation.',
        `${selectedMonth} 예약의 업체·가이드 레퍼럴(노트)을 집계하여 월정산에 반영할까요?\n` +
          '이미 반영된 (업체·가이드·월) 항목은 최신 집계로 갱신됩니다.'
      )
    );
    if (!ok) return;

    setIsApplying(true);
    setApplyResult(null);
    try {
      const { applyReferralSettlements } = await import('@/lib/api/referral-settlement');
      const { count, aggs } = await applyReferralSettlements(selectedMonth);

      if (count === 0) {
        setApplyResult({
          type: 'empty',
          text: t(
            `No company/guide referrals (notes) found in ${selectedMonth} bookings. Select a company·guide in the company name (notes) field of the booking window to aggregate automatically.`,
            `${selectedMonth} 예약에 업체/가이드 레퍼럴(노트)이 없습니다. 예약창의 업체명(노트)에서 업체·가이드를 선택하면 자동 집계됩니다.`
          ),
        });
        return;
      }

      // 총 매출/수수료 합계로 요약 메시지 구성
      const sumRevenue = aggs.reduce((acc: number, a: any) => acc + (Number(a.revenue) || 0), 0);
      const sumCommission = aggs.reduce((acc: number, a: any) => acc + (Number(a.commission_amount) || 0), 0);
      setApplyResult({
        type: 'success',
        text: t(
          `Applied ${count} referrals to the ${selectedMonth} monthly settlement. ` +
            `Total revenue ₱${sumRevenue.toLocaleString()} / commission ₱${sumCommission.toLocaleString()}. Refreshing the list…`,
          `레퍼럴 ${count}건을 ${selectedMonth} 월정산에 반영했습니다. ` +
            `총 매출 ₱${sumRevenue.toLocaleString()} / 수수료 ₱${sumCommission.toLocaleString()}. 목록을 새로고침합니다…`
        ),
      });

      // 반영 결과를 표에 즉시 반영하기 위해 데이터 재조회
      try {
        const settlementRows = await getMonthlySettlements();
        setSettlements(
          settlementRows.map(s => ({
            ...s,
            guide_id: s.guide_id ?? 0,
            settlement_date: s.settlement_date ?? '',
            service_breakdown: s.service_breakdown ?? {},
            created_at: s.created_at ?? '',
          })) as MonthlySettlement[]
        );
      } catch {
        // 재조회 실패 시 전체 새로고침으로 폴백
        location.reload();
      }
    } catch (e) {
      setApplyResult({ type: 'error', text: e instanceof Error ? e.message : t('Failed to apply.', '반영에 실패했습니다.') });
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('Pending', '대기');
      case 'confirmed':
        return t('Confirmed', '확정');
      case 'paid':
        return t('Paid', '지급완료');
      default:
        return status;
    }
  };

  const updateSettlementStatus = (settlementId: number, newStatus: 'pending' | 'confirmed' | 'paid') => {
    setSettlements(prev =>
      prev.map(s =>
        s.id === settlementId ? { ...s, status: newStatus } : s
      )
    );

    const updated = settlements.find(s => s.id === settlementId);
    if (updated) {
      const guideName = getGuideName(updated.guide_id);
      const message =
        newStatus === 'confirmed'
          ? t(
              `${guideName}'s ${updated.settlement_month} settlement has been confirmed`,
              `${guideName}님의 ${updated.settlement_month} 정산이 확정되었습니다`
            )
          : t(
              `Payment of ₱${(updated.payment_amount / 1000).toFixed(0)}K to ${guideName} has been completed`,
              `${guideName}님에게 ₱${(updated.payment_amount / 1000).toFixed(0)}K 지급이 완료되었습니다`
            );

      addNotification({
        type: newStatus === 'confirmed' ? 'settlement_confirmed' : 'settlement_paid',
        message,
        severity: 'success',
        isRead: false,
        action_url: '/admin/monthly-settlement',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <div className="text-2xl sm:text-3xl lg:text-4xl">📊</div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">{t('Monthly Settlement Management', '월정산 관리')}</h1>
              <p className="text-green-100 text-xs sm:text-sm mt-1">{t('View and manage settlement status by company', '업체별 정산 현황을 조회하고 관리합니다')}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Select Month', '월 선택')}</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Company', '업체')}</label>
              <select
                value={filterCompanyId || ''}
                onChange={e => setFilterCompanyId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">{t('All Companies', '전체 업체')}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Status', '상태')}</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="all">{t('All Status', '전체 상태')}</option>
                <option value="pending">{t('Pending', '대기')}</option>
                <option value="confirmed">{t('Confirmed', '확정')}</option>
                <option value="paid">{t('Paid', '지급완료')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Search', '검색')}</label>
              <input
                type="text"
                placeholder={t('Search guide name', '가이드 이름 검색')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const csv = exportMonthlySettlementCSV(
                    filteredSettlements,
                    companies as any,
                    guides as any,
                    selectedMonth
                  );
                  downloadCSV(`Monthly_Settlement_${selectedMonth}.csv`, csv);
                  alert(t('Settlement data has been downloaded!', '정산 데이터를 다운로드했습니다!'));
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                {t('📥 Export CSV', '📥 CSV 내보내기')}
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyReferral}
                disabled={isApplying}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isApplying ? (
                  <>
                    {/* 처리 중 스피너 */}
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {t('Applying…', '반영 중…')}
                  </>
                ) : (
                  <>{t('🔄 Booking→Settlement', '🔄 예약→월정산 반영')}</>
                )}
              </button>
            </div>
          </div>

          {/* 레퍼럴 반영 결과 배너 (성공/없음/실패) */}
          {applyResult && (
            <div
              className={`mb-3 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                applyResult.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : applyResult.type === 'empty'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span>
                {applyResult.type === 'success' ? '✅ ' : applyResult.type === 'empty' ? 'ℹ️ ' : '⚠️ '}
                {applyResult.text}
              </span>
              <button
                onClick={() => setApplyResult(null)}
                className="text-current/60 hover:text-current font-bold leading-none"
                aria-label={t('Close', '닫기')}
              >
                ✕
              </button>
            </div>
          )}

          {/* 가이드 레퍼럴율 → 월정산 흐름 안내 */}
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs text-indigo-800">
            <span>
              💡 {t('Assign a company·guide to the ', '예약창 ')}<strong>{t('company name (notes)', '업체명(노트)')}</strong>{t(' field of the booking window, and the ', '에 업체·가이드를 지정하면, ')}<strong>{t('Booking→Settlement', '예약→월정산 반영')}</strong>{t(' button automatically aggregates revenue and applies the guide/company ', ' 버튼으로 매출이 자동 집계되고 가이드/업체 ')}<strong>{t('commission rate', '수수료율')}</strong>{t('.', '이 적용됩니다.')}
            </span>
            <a
              href="/admin/guide-referral-fee"
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold whitespace-nowrap"
            >
              {t('🎯 Manage Guide Referral Fees →', '🎯 가이드 레퍼럴 수수료 관리 →')}
            </a>
          </div>

          <div className="text-sm text-gray-600">
            {t('Search Results: ', '검색 결과: ')}<span className="font-bold text-green-600">{filteredSettlements.length}</span>{t(' records', '건')}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">{t('Total Revenue', '총 매출')}</p>
            <p className="text-3xl font-bold text-blue-600">₱{(totals.revenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">{filteredSettlements.length}{t(' records', '건')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">{t('Total Commission', '총 수수료')}</p>
            <p className="text-3xl font-bold text-red-600">₱{(totals.commission / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">{t('Deducted Amount', '공제 금액')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">{t('Final Payment Amount', '최종 지급액')}</p>
            <p className="text-3xl font-bold text-green-600">₱{(totals.payment / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">{t('Actual Payment', '실지급액')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">{t('Number of Payments', '지급 건수')}</p>
            <p className="text-3xl font-bold text-purple-600">{totals.count}</p>
            <p className="text-xs text-gray-500 mt-2">{t('payments', '건')}</p>
          </div>
        </div>

        {/* Settlement Details */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">{t('Loading data...', '데이터를 불러오는 중...')}</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-red-50">
              <p className="text-red-600">⚠️ {error}</p>
            </div>
          ) : Object.keys(groupedByCompany).length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">{t('No settlement data available', '정산 데이터가 없습니다')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedByCompany).map(([companyId, companySettlements]) => (
                <div key={companyId} className="border-b border-gray-200">
                  {/* Company Header */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{getCompanyName(parseInt(companyId))}</h3>
                    <span className="text-xs px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold whitespace-nowrap">
                      {t('Next Settlement: ', '다음 정산일: ')}{getNextSettlementDate(parseInt(companyId))}
                    </span>
                  </div>

                  {/* Settlement by Guide */}
                  <div className="divide-y divide-gray-100">
                    {companySettlements.map(settlement => (
                      <div
                        key={settlement.id}
                        className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 truncate">{getGuideName(settlement.guide_id)}</h4>
                            {/* 레퍼럴 자동 반영 정산 배지 */}
                            {isReferralSettlement(settlement) && (
                              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap">
                                🔄 Referral
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('Sessions: ', '세션: ')}{settlement.total_sessions} · {settlement.settlement_date}</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mr-0 sm:mr-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-600">{t('Revenue', '매출')}</p>
                            <p className="font-bold text-gray-900">₱{(settlement.total_revenue / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">{t('Commission', '수수료')}</p>
                            <p className="font-bold text-red-600">{settlement.commission_rate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">{t('Payment', '지급액')}</p>
                            <p className="font-bold text-green-600">₱{(settlement.payment_amount / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">{t('Status', '상태')}</p>
                            <span className={`inline-block text-xs font-bold px-2 py-1 rounded mt-1 ${getStatusColor(settlement.status)}`}>
                              {getStatusLabel(settlement.status)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 sm:gap-2 ml-0 sm:ml-4 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                          <button
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setIsDetailModalOpen(true);
                            }}
                            className="flex-1 sm:flex-none px-2 sm:px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap text-center sm:text-left"
                          >
                            {t('View Details', '상세 보기')}
                          </button>
                          {settlement.status === 'pending' && (
                            <button
                              onClick={() => updateSettlementStatus(settlement.id, 'confirmed')}
                              className="flex-1 sm:flex-none px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap text-center"
                            >
                              {t('✅ Confirm', '✅ 확정')}
                            </button>
                          )}
                          {settlement.status === 'confirmed' && (
                            <button
                              onClick={() => updateSettlementStatus(settlement.id, 'paid')}
                              className="flex-1 sm:flex-none px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm rounded transition-colors whitespace-nowrap text-center"
                            >
                              {t('💰 Pay', '💰 지급')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Company Subtotal */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-6 sm:gap-12">
                    <div className="text-right">
                      <p className="text-xs text-gray-600">{t('Subtotal Revenue', '매출 소계')}</p>
                      <p className="font-bold text-gray-900">₱{(companySettlements.reduce((sum, s) => sum + s.total_revenue, 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">{t('Subtotal Payment', '지급 소계')}</p>
                      <p className="font-bold text-green-700">₱{(companySettlements.reduce((sum, s) => sum + s.payment_amount, 0) / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail View Modal */}
        {isDetailModalOpen && selectedSettlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-green-500 shadow-2xl">
              <div className="flex justify-between items-start gap-2 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex-1 flex items-center gap-2 flex-wrap">
                  {selectedSettlement.settlement_month} - {getGuideName(selectedSettlement.guide_id)} {t('Settlement', '정산')}
                  {/* 레퍼럴 자동 반영 정산 배지 */}
                  {isReferralSettlement(selectedSettlement) && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap">
                      {t('🔄 Referral auto-applied', '🔄 Referral 자동 반영')}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('Company', '업체')}</p>
                    <p className="font-bold text-gray-900">{getCompanyName(selectedSettlement.company_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('Guide', '가이드')}</p>
                    <p className="font-bold text-gray-900">{getGuideName(selectedSettlement.guide_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('Total Sessions', '총 세션')}</p>
                    <p className="font-bold text-gray-900">{selectedSettlement.total_sessions} {t('sessions', '세션')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('Settlement Date', '정산일')}</p>
                    <p className="font-bold text-gray-900">{selectedSettlement.settlement_date}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">{t('📊 Settlement Summary', '📊 정산 요약')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('Total Revenue', '총 매출')}</span>
                      <span className="font-bold">₱{(selectedSettlement.total_revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('Commission Rate', '수수료율')}</span>
                      <span className="font-bold">{selectedSettlement.commission_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('Deducted Amount', '공제 금액')}</span>
                      <span className="font-bold text-red-600">-₱{(selectedSettlement.commission_amount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
                      <span>{t('Final Payment Amount', '최종 지급액')}</span>
                      <span className="text-green-600">₱{(selectedSettlement.payment_amount / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">{t('📈 Service Details', '📈 서비스 상세')}</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedSettlement.service_breakdown).map(([service, data]) => (
                      <div key={service} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">{service} ({data.sessions} {t('sessions', '세션')})</span>
                        <span className="font-bold">₱{(data.revenue / 1000).toFixed(0)}K</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSettlement.notes && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-bold text-gray-900 mb-2">{t('📝 Notes', '📝 비고')}</h3>
                    <p className="text-sm text-gray-600">{selectedSettlement.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chart Section */}
        {filteredSettlements.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {/* Company Settlement Comparison */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t('Settlement Amount by Company', '업체별 정산 금액')}</h3>
              {Object.keys(groupedByCompany).length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(groupedByCompany).map(([companyId, companySettlements]) => ({
                      name: getCompanyName(parseInt(companyId)),
                      revenue: companySettlements.reduce((sum, s) => sum + s.total_revenue, 0),
                      payment: companySettlements.reduce((sum, s) => sum + s.payment_amount, 0),
                    }))}
                    margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="revenue" fill="#10b981" name={t('Revenue', '매출')} />
                    <Bar dataKey="payment" fill="#3b82f6" name={t('Payment', '지급액')} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Settlement Status Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t('Settlement Status Overview', '정산 상태 개요')}</h3>
              {filteredSettlements.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: t('Pending', '대기'),
                          value: filteredSettlements.filter(s => s.status === 'pending').length,
                        },
                        {
                          name: t('Confirmed', '확정'),
                          value: filteredSettlements.filter(s => s.status === 'confirmed').length,
                        },
                        {
                          name: t('Paid', '지급완료'),
                          value: filteredSettlements.filter(s => s.status === 'paid').length,
                        },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, value }) => filteredSettlements.length > 5 ? `${value}` : `${name} ${value}`}
                      labelLine={filteredSettlements.length <= 5}
                    >
                      <Cell fill="#fbbf24" />
                      <Cell fill="#60a5fa" />
                      <Cell fill="#34d399" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Commission Rate Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t('Revenue vs Payment Trend', '매출 대비 지급 추이')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={filteredSettlements.sort((a, b) =>
                    new Date(a.settlement_date).getTime() - new Date(b.settlement_date).getTime()
                  )}
                  margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="settlement_date"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="total_revenue" stroke="#10b981" name={t('Revenue', '매출')} />
                  <Line type="monotone" dataKey="payment_amount" stroke="#3b82f6" name={t('Payment', '지급액')} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top 5 Payment by Guide */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t('Top 5 Payment by Guide', '가이드별 지급 상위 5')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredSettlements
                    .sort((a, b) => b.payment_amount - a.payment_amount)
                    .slice(0, 5)
                    .map(s => ({
                      name: getGuideName(s.guide_id),
                      payment: s.payment_amount,
                    }))}
                  margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Bar dataKey="payment" fill="#8b5cf6" name={t('Payment', '지급액')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
