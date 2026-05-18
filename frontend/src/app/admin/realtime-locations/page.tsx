'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const RealtimeMap = dynamic(() => import('@/components/RealtimeMap').then(m => ({ default: m.RealtimeMap })), {
  ssr: false
});

export default function RealtimeLocationsPage() {
  const [viewMode, setViewMode] = useState<'all' | 'drivers' | 'customers'>('all');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📍 실시간 위치 모니터링</h1>
          <p className="text-gray-600 mt-2">드라이버와 손님의 실시간 위치를 지도에서 확인합니다</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setViewMode('drivers')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'drivers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🚗 드라이버
          </button>
          <button
            onClick={() => setViewMode('customers')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'customers'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👤 손님
          </button>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>팁:</strong> 마커를 클릭하면 상세 정보를 볼 수 있습니다. 지도는 실시간으로 업데이트됩니다.
        </p>
      </div>

      {/* 지도 */}
      <div className="rounded-lg shadow-lg overflow-hidden border border-gray-300" style={{ height: '600px' }}>
        <RealtimeMap
          entityType="admin"
          entityId={0}
          watchMode="all"
          apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
        />
      </div>

      {/* 범례 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🚗</span> 드라이버
          </h3>
          <p className="text-sm text-gray-600 mt-1">파란색 마커 - 목적지로 이동 중인 드라이버</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">👤</span> 손님
          </h3>
          <p className="text-sm text-gray-600 mt-1">초록색 마커 - 서비스를 기다리는 손님</p>
        </div>
      </div>

      {/* 실시간 정보 패널 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 모니터링 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600">활성 드라이버</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">-</p>
            <p className="text-xs text-gray-500 mt-2">실시간 추적 중</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600">활성 손님</p>
            <p className="text-3xl font-bold text-green-600 mt-2">-</p>
            <p className="text-xs text-gray-500 mt-2">서비스 대기 중</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-600">진행 중인 세션</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
            <p className="text-xs text-gray-500 mt-2">픽업/드롭오프</p>
          </div>
        </div>
      </div>
    </div>
  );
}
