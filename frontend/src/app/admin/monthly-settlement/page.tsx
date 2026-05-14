'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';
import { exportMonthlySettlementCSV, downloadCSV } from '@/lib/utils/csv-export';

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

export default function MonthlySettlementPage() {
  const {
    monthlySettlements,
    setMonthlySettlements,
    updateSettlementStatus,
    companies,
    setCompanies,
    guides,
    setGuides,
    addNotification,
  } = useStore();
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<MonthlySettlement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock 데이터 초기화
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

  const filteredSettlements = monthlySettlements.filter(s => {
    const monthMatch = s.settlement_month === selectedMonth;
    const companyMatch = !filterCompanyId || s.company_id === filterCompanyId;
    return monthMatch && companyMatch;
  });

  const getCompanyName = (companyId: number) => {
    return (companies as Company[]).find(c => c.id === companyId)?.name || '알 수 없음';
  };

  const getGuideName = (guideId: number) => {
    return (guides as Guide[]).find(g => g.id === guideId)?.name || '알 수 없음';
  };

  const groupedByCompany = filteredSettlements.reduce(
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

  const totals = filteredSettlements.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.total_revenue,
      commission: acc.commission + s.commission_amount,
      payment: acc.payment + s.payment_amount,
      count: acc.count + 1,
    }),
    { revenue: 0, commission: 0, payment: 0, count: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📊 월정산 관리
          </h1>
          <p className="text-lg text-gray-600 font-light">
            업체별 가이드 월별 정산 조회 및 관리
          </p>
        </div>

        {/* 필터 & 액션 */}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">업체</label>
            <select
              value={filterCompanyId || ''}
              onChange={e => setFilterCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">모든 업체</option>
              {(companies as Company[]).map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const csv = exportMonthlySettlementCSV(
                filteredSettlements,
                mockCompanies as any,
                mockGuides as any,
                selectedMonth
              );
              downloadCSV(`월정산_${selectedMonth}.csv`, csv);
              alert('정산 데이터가 다운로드되었습니다!');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            📥 CSV 내보내기
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">총 거래액</div>
            <div className="text-3xl font-bold text-blue-600">₩{(totals.revenue / 1000000).toFixed(1)}M</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">총 수수료</div>
            <div className="text-3xl font-bold text-red-600">₩{(totals.commission / 1000000).toFixed(1)}M</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">최종 지급액</div>
            <div className="text-3xl font-bold text-green-600">₩{(totals.payment / 1000000).toFixed(1)}M</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">지급 건수</div>
            <div className="text-3xl font-bold text-purple-600">{totals.count}</div>
          </div>
        </div>

        {/* 정산 상세 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">정산 상세</h2>

          {Object.keys(groupedByCompany).length === 0 ? (
            <div className="text-center py-12 text-gray-500">정산 데이터가 없습니다</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByCompany).map(([companyId, settlements]) => (
                <div key={companyId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 업체 헤더 */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">{getCompanyName(parseInt(companyId))}</h3>
                  </div>

                  {/* 가이드별 정산 */}
                  <div className="divide-y divide-gray-200">
                    {settlements.map(settlement => (
                      <div key={settlement.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="font-bold text-gray-900">{getGuideName(settlement.guide_id)}</h4>
                                <div className="text-sm text-gray-600 mt-1">세션 {settlement.total_sessions}회</div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-right mr-6">
                            <div>
                              <div className="text-xs text-gray-600">수익</div>
                              <div className="font-bold text-gray-900">₩{(settlement.total_revenue / 1000).toFixed(0)}K</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">수수료</div>
                              <div className="font-bold text-red-600">{settlement.commission_rate}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">지급</div>
                              <div className="font-bold text-green-600">₩{(settlement.payment_amount / 1000).toFixed(0)}K</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">상태</div>
                              <div
                                className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1 ${
                                  settlement.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : settlement.status === 'confirmed'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {settlement.status === 'pending'
                                  ? '미확정'
                                  : settlement.status === 'confirmed'
                                    ? '확정'
                                    : '지급완료'}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedSettlement(settlement);
                                setIsDetailModalOpen(true);
                              }}
                              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded transition-colors"
                            >
                              보기
                            </button>
                            {settlement.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    updateSettlementStatus(settlement.id, 'confirmed');
                                    addNotification({
                                      type: 'settlement_confirmed',
                                      message: `${getGuideName(settlement.guide_id)}의 ${settlement.settlement_month} 정산이 확정되었습니다. (₩${(settlement.payment_amount / 1000).toFixed(0)}K)`,
                                      severity: 'success',
                                      isRead: false,
                                      action_url: `/admin/monthly-settlement`,
                                    });
                                  }}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded transition-colors"
                                >
                                  ✅ 확정
                                </button>
                              </>
                            )}
                            {settlement.status === 'confirmed' && (
                              <button
                                onClick={() => {
                                  updateSettlementStatus(settlement.id, 'paid');
                                  addNotification({
                                    type: 'settlement_paid',
                                    message: `${getGuideName(settlement.guide_id)}에게 ₩${(settlement.payment_amount / 1000).toFixed(0)}K 지급을 완료했습니다.`,
                                    severity: 'success',
                                    isRead: false,
                                    action_url: `/admin/monthly-settlement`,
                                  });
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded transition-colors"
                              >
                                💰 지급완료
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 업체 소계 */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-600">소계</div>
                      <div className="font-bold text-gray-900">
                        ₩{(settlements.reduce((sum, s) => sum + s.total_revenue, 0) / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상세 조회 모달 */}
        {isDetailModalOpen && selectedSettlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-96 overflow-y-auto border-2 border-blue-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSettlement.settlement_month} - {getGuideName(selectedSettlement.guide_id)} 정산 상세
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">업체</div>
                    <div className="font-bold">{getCompanyName(selectedSettlement.company_id)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">가이드</div>
                    <div className="font-bold">{getGuideName(selectedSettlement.guide_id)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">총 세션</div>
                    <div className="font-bold">{selectedSettlement.total_sessions}회</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">정산일</div>
                    <div className="font-bold">{selectedSettlement.settlement_date}</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">📊 정산 요약</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 매출</span>
                      <span className="font-bold">₩{selectedSettlement.total_revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">수수료율</span>
                      <span className="font-bold">{selectedSettlement.commission_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">차감액</span>
                      <span className="font-bold text-red-600">-₩{selectedSettlement.commission_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
                      <span>지급액</span>
                      <span className="text-green-600">₩{selectedSettlement.payment_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">📈 서비스별 상세</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedSettlement.service_breakdown).map(([service, data]) => (
                      <div key={service} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">
                          {service} ({data.sessions}회)
                        </span>
                        <span className="font-bold">₩{data.revenue.toLocaleString()}</span>
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
      </div>
    </div>
  );
}
