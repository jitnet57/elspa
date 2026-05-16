'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { PriceDisplay } from '@/components/PriceDisplay';
import { exportMonthlySettlementCSV, downloadCSV } from '@/lib/utils/csv-export';
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
    service_breakdown: {
      swedish: { sessions: 3, revenue: 240000 },
      thai: { sessions: 2, revenue: 160000 },
    },
    status: 'pending',
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
    service_breakdown: {
      thai: { sessions: 4, revenue: 360000 },
    },
    status: 'confirmed',
    notes: '확정 완료',
    created_at: '2026-05-20',
  },
  {
    id: 3,
    company_id: 1,
    guide_id: 3,
    settlement_month: '2026-05',
    settlement_date: '2026-05-20',
    total_sessions: 3,
    total_revenue: 280000,
    commission_rate: 30,
    commission_amount: 84000,
    payment_amount: 196000,
    service_breakdown: {
      hotstone: { sessions: 3, revenue: 280000 },
    },
    status: 'paid',
    notes: '지급 완료',
    created_at: '2026-05-20',
  },
  {
    id: 4,
    company_id: 2,
    guide_id: 4,
    settlement_month: '2026-05',
    settlement_date: '2026-05-05',
    total_sessions: 6,
    total_revenue: 300000,
    commission_rate: 25,
    commission_amount: 75000,
    payment_amount: 225000,
    service_breakdown: {
      foot: { sessions: 6, revenue: 300000 },
    },
    status: 'confirmed',
    notes: '',
    created_at: '2026-05-05',
  },
];

const mockCompanies: Company[] = [
  { id: 1, name: 'ABC여행사', settlement_day: 20 },
  { id: 2, name: 'XYZ여행사', settlement_day: 15 },
  { id: 3, name: '글로벌투어', settlement_day: 25 },
];

const mockGuides: Guide[] = [
  { id: 1, name: 'Sarah', company_id: 1 },
  { id: 2, name: 'Emma', company_id: 1 },
  { id: 3, name: 'Jessica', company_id: 1 },
  { id: 4, name: 'Amanda', company_id: 2 },
  { id: 5, name: 'Catherine', company_id: 2 },
  { id: 6, name: 'Rachel', company_id: 3 },
];

export default function MonthlySettlementPage() {
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

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Mock 데이터 사용 (실제 API 연동은 백엔드 준비 후)
        setSettlements(mockMonthlySettlements);
        setCompanies(mockCompanies);
        setGuides(mockGuides);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
        console.error('정산 데이터 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 필터링 및 검색
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
    return companies.find(c => c.id === companyId)?.name || '알 수 없음';
  };

  const getGuideName = (guideId: number) => {
    return guides.find(g => g.id === guideId)?.name || '알 수 없음';
  };

  const getNextSettlementDate = (companyId: number): string => {
    const company = companies.find(c => c.id === companyId);
    if (!company || !company.settlement_day) return '정산일 미설정';

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    let nextDate = new Date(year, month, company.settlement_day);

    if (nextDate <= today) {
      nextDate = new Date(year, month + 1, company.settlement_day);
    }

    return nextDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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
        return '미확정';
      case 'confirmed':
        return '확정';
      case 'paid':
        return '지급완료';
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
          ? `${guideName}의 ${updated.settlement_month} 정산이 확정되었습니다`
          : `${guideName}에게 ₱${(updated.payment_amount / 1000).toFixed(0)}K 지급을 완료했습니다`;

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
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-4xl">📊</div>
            <div>
              <h1 className="text-4xl font-bold">월정산 관리</h1>
              <p className="text-green-100 text-sm mt-1">업체별 정산 현황 조회 및 관리</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* 필터 & 액션 */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">월 선택</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">업체</label>
              <select
                value={filterCompanyId || ''}
                onChange={e => setFilterCompanyId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">모든 업체</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">상태</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">미확정</option>
                <option value="confirmed">확정</option>
                <option value="paid">지급완료</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="가이드 이름 검색"
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
                  downloadCSV(`월정산_${selectedMonth}.csv`, csv);
                  alert('정산 데이터가 다운로드되었습니다!');
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                📥 CSV 내보내기
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            검색 결과: <span className="font-bold text-green-600">{filteredSettlements.length}</span>건
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">총 거래액</p>
            <p className="text-3xl font-bold text-blue-600">₱{(totals.revenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">{filteredSettlements.length}건</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">총 수수료</p>
            <p className="text-3xl font-bold text-red-600">₱{(totals.commission / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">차감액</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">최종 지급액</p>
            <p className="text-3xl font-bold text-green-600">₱{(totals.payment / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">실 수령액</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">지급 건수</p>
            <p className="text-3xl font-bold text-purple-600">{totals.count}</p>
            <p className="text-xs text-gray-500 mt-2">건</p>
          </div>
        </div>

        {/* 정산 상세 */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-red-50">
              <p className="text-red-600">⚠️ {error}</p>
            </div>
          ) : Object.keys(groupedByCompany).length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">정산 데이터가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedByCompany).map(([companyId, companySettlements]) => (
                <div key={companyId} className="border-b border-gray-200">
                  {/* 업체 헤더 */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{getCompanyName(parseInt(companyId))}</h3>
                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      다음 정산: {getNextSettlementDate(parseInt(companyId))}
                    </span>
                  </div>

                  {/* 가이드별 정산 */}
                  <div className="divide-y divide-gray-100">
                    {companySettlements.map(settlement => (
                      <div
                        key={settlement.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{getGuideName(settlement.guide_id)}</h4>
                          <p className="text-sm text-gray-600 mt-1">세션 {settlement.total_sessions}회 · {settlement.settlement_date}</p>
                        </div>

                        <div className="grid grid-cols-4 gap-6 mr-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-600">수익</p>
                            <p className="font-bold text-gray-900">₱{(settlement.total_revenue / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">수수료</p>
                            <p className="font-bold text-red-600">{settlement.commission_rate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">지급</p>
                            <p className="font-bold text-green-600">₱{(settlement.payment_amount / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">상태</p>
                            <span className={`inline-block text-xs font-bold px-2 py-1 rounded mt-1 ${getStatusColor(settlement.status)}`}>
                              {getStatusLabel(settlement.status)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded transition-colors whitespace-nowrap"
                          >
                            상세보기
                          </button>
                          {settlement.status === 'pending' && (
                            <button
                              onClick={() => updateSettlementStatus(settlement.id, 'confirmed')}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded transition-colors whitespace-nowrap"
                            >
                              ✅ 확정
                            </button>
                          )}
                          {settlement.status === 'confirmed' && (
                            <button
                              onClick={() => updateSettlementStatus(settlement.id, 'paid')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded transition-colors whitespace-nowrap"
                            >
                              💰 지급
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 업체 소계 */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-12">
                    <div className="text-right">
                      <p className="text-xs text-gray-600">소계 수익</p>
                      <p className="font-bold text-gray-900">₱{(companySettlements.reduce((sum, s) => sum + s.total_revenue, 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">소계 지급</p>
                      <p className="font-bold text-green-700">₱{(companySettlements.reduce((sum, s) => sum + s.payment_amount, 0) / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상세 조회 모달 */}
        {isDetailModalOpen && selectedSettlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-green-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSettlement.settlement_month} - {getGuideName(selectedSettlement.guide_id)} 정산
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
                    <p className="text-xs text-gray-600 mb-1">업체</p>
                    <p className="font-bold text-gray-900">{getCompanyName(selectedSettlement.company_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">가이드</p>
                    <p className="font-bold text-gray-900">{getGuideName(selectedSettlement.guide_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">총 세션</p>
                    <p className="font-bold text-gray-900">{selectedSettlement.total_sessions}회</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">정산일</p>
                    <p className="font-bold text-gray-900">{selectedSettlement.settlement_date}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">📊 정산 요약</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 매출</span>
                      <span className="font-bold">₱{(selectedSettlement.total_revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">수수료율</span>
                      <span className="font-bold">{selectedSettlement.commission_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">차감액</span>
                      <span className="font-bold text-red-600">-₱{(selectedSettlement.commission_amount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
                      <span>최종 지급액</span>
                      <span className="text-green-600">₱{(selectedSettlement.payment_amount / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">📈 서비스별 상세</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedSettlement.service_breakdown).map(([service, data]) => (
                      <div key={service} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">{service} ({data.sessions}회)</span>
                        <span className="font-bold">₱{(data.revenue / 1000).toFixed(0)}K</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSettlement.notes && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-bold text-gray-900 mb-2">📝 비고</h3>
                    <p className="text-sm text-gray-600">{selectedSettlement.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 차트 섹션 */}
        {filteredSettlements.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* 업체별 정산액 비교 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">업체별 정산액 비교</h3>
              {Object.keys(groupedByCompany).length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(groupedByCompany).map(([companyId, companySettlements]) => ({
                      name: getCompanyName(parseInt(companyId)),
                      revenue: companySettlements.reduce((sum, s) => sum + s.total_revenue, 0),
                      payment: companySettlements.reduce((sum, s) => sum + s.payment_amount, 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="수익" />
                    <Bar dataKey="payment" fill="#3b82f6" name="지급액" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 상태별 정산 현황 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">상태별 정산 현황</h3>
              {filteredSettlements.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: '미확정',
                          value: filteredSettlements.filter(s => s.status === 'pending').length,
                        },
                        {
                          name: '확정',
                          value: filteredSettlements.filter(s => s.status === 'confirmed').length,
                        },
                        {
                          name: '지급완료',
                          value: filteredSettlements.filter(s => s.status === 'paid').length,
                        },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name} ${value}건`}
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

            {/* 수수료율별 분석 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">수익 vs 지급액 추이</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={filteredSettlements.sort((a, b) =>
                    new Date(a.settlement_date).getTime() - new Date(b.settlement_date).getTime()
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="settlement_date"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Legend />
                  <Line type="monotone" dataKey="total_revenue" stroke="#10b981" name="수익" />
                  <Line type="monotone" dataKey="payment_amount" stroke="#3b82f6" name="지급액" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 가이드별 지급액 TOP 5 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">가이드별 지급액 TOP 5</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredSettlements
                    .sort((a, b) => b.payment_amount - a.payment_amount)
                    .slice(0, 5)
                    .map(s => ({
                      name: getGuideName(s.guide_id),
                      payment: s.payment_amount,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Bar dataKey="payment" fill="#8b5cf6" name="지급액" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
