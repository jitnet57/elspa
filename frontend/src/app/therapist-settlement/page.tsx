'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { getTranslations } from '@/lib/translations';

interface TherapistSettlement {
  therapistId: number;
  therapistName: string;
  totalSessions: number;
  totalRevenue: number;
  totalCommission: number;
  commissionRate: number;
  netAmount: number;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
}

const mockSettlementData: TherapistSettlement[] = [
  {
    therapistId: 1,
    therapistName: 'Elena Park',
    totalSessions: 12,
    totalRevenue: 800000,
    totalCommission: 240000,
    commissionRate: 30,
    netAmount: 560000,
    status: 'idle',
  },
  {
    therapistId: 2,
    therapistName: 'Jessica Choi',
    totalSessions: 10,
    totalRevenue: 750000,
    totalCommission: 225000,
    commissionRate: 30,
    netAmount: 525000,
    status: 'in_service',
  },
  {
    therapistId: 3,
    therapistName: 'Sophie Lee',
    totalSessions: 15,
    totalRevenue: 950000,
    totalCommission: 285000,
    commissionRate: 30,
    netAmount: 665000,
    status: 'resting',
  },
  {
    therapistId: 4,
    therapistName: 'Amanda Brown',
    totalSessions: 11,
    totalRevenue: 770000,
    totalCommission: 231000,
    commissionRate: 30,
    netAmount: 539000,
    status: 'idle',
  },
  {
    therapistId: 5,
    therapistName: 'Catherine Miller',
    totalSessions: 13,
    totalRevenue: 880000,
    totalCommission: 264000,
    commissionRate: 30,
    netAmount: 616000,
    status: 'checked_out',
  },
  {
    therapistId: 6,
    therapistName: 'Rachel White',
    totalSessions: 9,
    totalRevenue: 620000,
    totalCommission: 186000,
    commissionRate: 30,
    netAmount: 434000,
    status: 'idle',
  },
];

export default function TherapistSettlementPage() {
  const { language } = useStore();
  const t = getTranslations(language);
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [selectedTherapist, setSelectedTherapist] = useState<number | null>(null);

  const settlements = useMemo(() => {
    return mockSettlementData;
  }, []);

  const selectedData = selectedTherapist
    ? settlements.find(s => s.therapistId === selectedTherapist)
    : null;

  const totalRevenue = settlements.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalCommission = settlements.reduce((sum, s) => sum + s.totalCommission, 0);
  const totalPayout = settlements.reduce((sum, s) => sum + s.netAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'in_service':
        return 'bg-blue-100 text-blue-800';
      case 'resting':
        return 'bg-yellow-100 text-yellow-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      idle: '대기중',
      in_service: '서비스중',
      resting: '휴식중',
      checked_out: '퇴근',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-300 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">💰</div>
            <h1 className="text-3xl font-bold">테라피스트 정산 관리</h1>
          </div>
          <p className="text-blue-100">각 테라피스트의 수익 및 정산 현황을 관리합니다</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* 필터 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">월 선택</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">총 수익</div>
            <div className="text-2xl font-bold text-blue-600">₱{(totalRevenue / 1000000).toFixed(1)}M</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">총 수수료</div>
            <div className="text-2xl font-bold text-red-600">₱{(totalCommission / 1000000).toFixed(1)}M</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">총 지급액</div>
            <div className="text-2xl font-bold text-green-600">₱{(totalPayout / 1000000).toFixed(1)}M</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 테라피스트 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-bold text-gray-900">테라피스트</th>
                      <th className="text-right px-6 py-3 font-bold text-gray-900">세션</th>
                      <th className="text-right px-6 py-3 font-bold text-gray-900">수익</th>
                      <th className="text-right px-6 py-3 font-bold text-gray-900">수수료</th>
                      <th className="text-right px-6 py-3 font-bold text-gray-900">지급액</th>
                      <th className="text-center px-6 py-3 font-bold text-gray-900">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((settlement, idx) => (
                      <tr
                        key={settlement.therapistId}
                        className={`border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition ${
                          selectedTherapist === settlement.therapistId ? 'bg-blue-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                        onClick={() => setSelectedTherapist(settlement.therapistId)}
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">{settlement.therapistName}</td>
                        <td className="text-right px-6 py-4 text-gray-900">{settlement.totalSessions}회</td>
                        <td className="text-right px-6 py-4 text-gray-900">₱{(settlement.totalRevenue / 1000).toFixed(0)}K</td>
                        <td className="text-right px-6 py-4 text-red-600 font-semibold">₱{(settlement.totalCommission / 1000).toFixed(0)}K</td>
                        <td className="text-right px-6 py-4 text-green-600 font-bold">₱{(settlement.netAmount / 1000).toFixed(0)}K</td>
                        <td className="text-center px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(settlement.status)}`}>
                            {getStatusLabel(settlement.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 상세 정산서 */}
          <div>
            {selectedData ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">
                  {selectedData.therapistName}
                </h3>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">총 세션</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedData.totalSessions}회</div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">총 수익</div>
                    <div className="text-2xl font-bold text-gray-900">₱{(selectedData.totalRevenue / 1000).toFixed(0)}K</div>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">수수료율</div>
                    <div className="text-lg font-bold text-red-600">{selectedData.commissionRate}%</div>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">수수료 (차감)</div>
                    <div className="text-2xl font-bold text-red-600">-₱{(selectedData.totalCommission / 1000).toFixed(0)}K</div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                    <div className="text-xs text-gray-600 mb-1">최종 지급액</div>
                    <div className="text-3xl font-bold text-green-600">₱{(selectedData.netAmount / 1000).toFixed(0)}K</div>
                  </div>

                  <div className="pt-4">
                    <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${getStatusColor(selectedData.status)}`}>
                      {getStatusLabel(selectedData.status)}
                    </span>
                  </div>

                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors">
                    정산서 다운로드
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">👈</div>
                <p className="text-gray-600">테라피스트를 선택하면 정산 정보가 표시됩니다</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

