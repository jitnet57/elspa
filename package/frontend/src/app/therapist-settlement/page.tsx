'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { getTranslations } from '@/lib/translations';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TherapistSettlement {
  therapist_id: number;
  therapist_name: string;
  name?: string;
  specialty?: string;
  session_count?: number;
  total_revenue?: number;
  avg_rating?: number;
  monthly_revenue: number;
  commission_rate: number;
  commission_amount: number;
  deductions: number;
  net_payout: number;
  status: 'completed' | 'confirmed' | 'pending';
  settlement_date: string;
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

  // Fetch therapist settlement data from API
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/settlements/therapist?target_date=${selectedMonth}-01`
        );
        if (!response.ok) throw new Error('Failed to retrieve settlement data');

        const data = await response.json();
        setSettlements(data.settlements || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Settlement data retrieval error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, [selectedMonth]);

  // Filtering and search
  const filteredSettlements = useMemo(() => {
    let filtered = settlements.filter(s =>
      s.therapist_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.monthly_revenue - a.monthly_revenue;
        case 'sessions':
          return 0; // No session count in new interface
        case 'name':
          return a.therapist_name.localeCompare(b.therapist_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [settlements, searchQuery, sortBy]);

  const selectedData = selectedTherapist
    ? settlements.find(s => s.therapist_id === selectedTherapist)
    : null;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = settlements.reduce((sum, s) => sum + s.monthly_revenue, 0);
    const totalCommission = settlements.reduce((sum, s) => sum + s.commission_amount, 0);
    const netAmount = settlements.reduce((sum, s) => sum + s.net_payout, 0);
    const avgCommissionRate = settlements.length > 0
      ? (settlements.reduce((sum, s) => sum + s.commission_rate, 0) / settlements.length * 100).toFixed(1)
      : 0;

    return { totalRevenue, totalCommission, netAmount, avgCommissionRate };
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
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">Therapist Settlement Management</h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">View therapist revenue and settlement status</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Filter & Search */}
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
                <option value="revenue">Revenue (High)</option>
                <option value="sessions">Sessions (Many)</option>
                <option value="name">Name (A-Z)</option>
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

        {/* Statistics */}
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
            <p className="text-xs text-gray-600 mb-1">Average Commission</p>
            <p className="text-3xl font-bold text-amber-600">{stats.avgCommissionRate}%</p>
            <p className="text-xs text-gray-500 mt-2">Overall</p>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 테라피스트 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden" style={{ minHeight: 'auto' }}>
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">Loading data...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50">
                  <p className="text-red-600">⚠️ {error}</p>
                </div>
              ) : filteredSettlements.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">No search results</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-900">Specialty</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">Sessions</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">Revenue</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">Commission Rate</th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-900">Rating</th>
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
                          <td className="text-right px-6 py-4 font-semibold text-green-600">₱{formatPrice(settlement.total_revenue ?? 0)}K</td>
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

          {/* Detailed Settlement */}
          <div className="lg:block">
            {selectedData ? (
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6 space-y-3 sm:space-y-4 lg:sticky lg:top-6">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">{selectedData.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedData.specialty}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedData.session_count}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₱{formatPrice(selectedData.monthly_revenue ?? 0)}K</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Commission Rate</p>
                  <p className="text-xl font-bold text-red-600">{selectedData.commission_rate}%</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Commission (Deducted)</p>
                  <p className="text-2xl font-bold text-red-600">-₱{formatPrice(selectedData.commission_amount)}K</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                  <p className="text-xs text-gray-600 mb-1">Final Payment Amount</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₱{formatPrice(selectedData.monthly_revenue - selectedData.commission_amount)}K
                  </p>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Rating</p>
                  <p className="text-2xl font-bold text-amber-600">⭐ {selectedData.avg_rating}</p>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors mt-4">
                  Download Settlement Statement
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 sm:p-6 text-center hidden lg:block lg:sticky lg:top-6">
                <div className="text-4xl sm:text-5xl mb-3">👈</div>
                <p className="text-sm sm:text-base text-gray-600">Select a therapist to<br />view settlement information</p>
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
                  <Bar dataKey="total_revenue" fill="#10b981" name="Revenue" />
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
                  <Line type="monotone" dataKey="total_revenue" stroke="#3b82f6" name="Revenue" />
                  <Line type="monotone" dataKey="total_commission" stroke="#ef4444" name="Commission" />
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
                  <Bar dataKey="session_count" fill="#8b5cf6" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
