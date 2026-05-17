'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { getTranslations } from '@/lib/translations';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TherapistSettlement {
  therapist_id: number;
  name: string;
  specialty: string;
  session_count: number;
  total_revenue: number;
  total_commission: number;
  commission_rate: number;
  avg_rating: number;
}

export default function TherapistSettlementPage() {
  const { language } = useStore();
  const t = getTranslations(language);
  const [settlements, setSettlements] = useState<TherapistSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [selectedTherapist, setSelectedTherapist] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'sessions' | 'name'>('revenue');

  // API에서 테라피스트 정산 데이터 조회
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/settlements/therapist?target_date=${selectedMonth}-01`
        );
        if (!response.ok) throw new Error('정산 데이터 조회 실패');

        const data = await response.json();
        setSettlements(data.settlements || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
        console.error('정산 데이터 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, [selectedMonth]);

  // 필터링 및 검색
  const filteredSettlements = useMemo(() => {
    let filtered = settlements.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        case 'sessions':
          return b.session_count - a.session_count;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [settlements, searchQuery, sortBy]);

  const selectedData = selectedTherapist
    ? settlements.find(s => s.therapist_id === selectedTherapist)
    : null;

  // 통계 계산
  const stats = useMemo(() => {
    const totalRevenue = settlements.reduce((sum, s) => sum + s.total_revenue, 0);
    const totalCommission = settlements.reduce((sum, s) => sum + s.total_commission, 0);
    const netAmount = totalRevenue - totalCommission;
    const avgRating = settlements.length > 0
      ? (settlements.reduce((sum, s) => sum + s.avg_rating, 0) / settlements.length).toFixed(1)
      : 0;

    return { totalRevenue, totalCommission, netAmount, avgRating };
  }, [settlements]);

  const formatPrice = (price: number) => {
    return (price / 1000).toFixed(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 lg:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <div className="text-2xl sm:text-3xl lg:text-4xl">💆</div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">테라피스트 정산 관리</h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">테라피스트별 수익 및 정산 현황 조회</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 필터 & 검색 */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {/* 월 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">월 선택</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedTherapist(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 검색 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="이름/전문분야 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 정렬 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">정렬</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="revenue">수익 기준 (높음)</option>
                <option value="sessions">세션 기준 (많음)</option>
                <option value="name">이름 기준 (A-Z)</option>
              </select>
            </div>

            {/* 결과 수 */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                검색 결과: <span className="font-bold text-blue-600">{filteredSettlements.length}</span>명
              </div>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">총 테라피스트</p>
            <p className="text-3xl font-bold text-blue-600">{settlements.length}</p>
            <p className="text-xs text-gray-500 mt-2">명</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">총 수익</p>
            <p className="text-3xl font-bold text-green-600">₱{formatPrice(stats.totalRevenue)}K</p>
            <p className="text-xs text-gray-500 mt-2">이번 달</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">총 수수료</p>
            <p className="text-3xl font-bold text-red-600">₱{formatPrice(stats.totalCommission)}K</p>
            <p className="text-xs text-gray-500 mt-2">차감액</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 hover:shadow-md transition">
            <p className="text-xs text-gray-600 mb-1">평균 평점</p>
            <p className="text-3xl font-bold text-amber-600">⭐ {stats.avgRating}</p>
            <p className="text-xs text-gray-500 mt-2">전체</p>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 테라피스트 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden" style={{ minHeight: 'auto' }}>
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">데이터를 불러오는 중...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50">
                  <p className="text-red-600">⚠️ {error}</p>
                </div>
              ) : filteredSettlements.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-gray-900">이름</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-900">전문분야</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">세션</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">수익</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">수수료율</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">평점</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSettlements.map((settlement, idx) => (
                        <tr
                          key={settlement.therapist_id}
                          onClick={() => setSelectedTherapist(settlement.therapist_id)}
                          className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${
                            selectedTherapist === settlement.therapist_id ? 'bg-blue-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900">{settlement.name}</td>
                          <td className="px-6 py-4 text-gray-600">{settlement.specialty}</td>
                          <td className="text-right px-6 py-4 text-gray-900">{settlement.session_count}</td>
                          <td className="text-right px-6 py-4 font-semibold text-green-600">₱{formatPrice(settlement.total_revenue)}K</td>
                          <td className="text-right px-6 py-4 text-red-600">{settlement.commission_rate}%</td>
                          <td className="text-right px-6 py-4 font-semibold">⭐ {settlement.avg_rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 상세 정산서 */}
          <div className="lg:block">
            {selectedData ? (
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6 space-y-3 sm:space-y-4 lg:sticky lg:top-6">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">{selectedData.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedData.specialty}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">총 세션</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedData.session_count}회</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">총 수익</p>
                  <p className="text-2xl font-bold text-green-600">₱{formatPrice(selectedData.total_revenue)}K</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">수수료율</p>
                  <p className="text-xl font-bold text-red-600">{selectedData.commission_rate}%</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">수수료 (차감)</p>
                  <p className="text-2xl font-bold text-red-600">-₱{formatPrice(selectedData.total_commission)}K</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                  <p className="text-xs text-gray-600 mb-1">최종 지급액</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₱{formatPrice(selectedData.total_revenue - selectedData.total_commission)}K
                  </p>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">평가</p>
                  <p className="text-2xl font-bold text-amber-600">⭐ {selectedData.avg_rating}</p>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors mt-4">
                  정산서 다운로드
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6 text-center hidden lg:block lg:sticky lg:top-6">
                <div className="text-4xl sm:text-5xl mb-3">👈</div>
                <p className="text-sm sm:text-base text-gray-600">테라피스트를 선택하면<br />정산 정보가 표시됩니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 차트 섹션 */}
        {filteredSettlements.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {/* 테라피스트별 수익 비교 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">테라피스트별 수익 비교</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredSettlements} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Bar dataKey="total_revenue" fill="#10b981" name="수익" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 수수료 vs 순액 분석 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">수수료 분석</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredSettlements} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="total_revenue" stroke="#3b82f6" name="수익" />
                  <Line type="monotone" dataKey="total_commission" stroke="#ef4444" name="수수료" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 총 수익 분배 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">총 수익 분배</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: -20, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={filteredSettlements}
                    dataKey="total_revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, percent }) => filteredSettlements.length > 3 ? `${((percent || 0) * 100).toFixed(0)}%` : `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={filteredSettlements.length <= 3}
                  >
                    {filteredSettlements.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₱${(value / 1000).toFixed(0)}K`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 세션 수 비교 */}
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">테라피스트별 세션 수</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredSettlements} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="session_count" fill="#8b5cf6" name="세션 수" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
