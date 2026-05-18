'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const RealtimeMap = dynamic(() => import('@/components/RealtimeMap').then(m => ({ default: m.RealtimeMap })), {
  ssr: false
});

export default function DriverTrackingPage() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [driverId, setDriverId] = useState<number>(1); // 실제로는 할당된 드라이버 ID를 사용
  const [pickupStatus, setPickupStatus] = useState<'waiting' | 'driver_on_way' | 'arrived' | 'service_start' | 'completed'>('waiting');

  const statusMessages = {
    waiting: '🔍 드라이버를 찾는 중입니다...',
    driver_on_way: '🚗 드라이버가 가고 있습니다',
    arrived: '✅ 드라이버가 도착했습니다',
    service_start: '💆 서비스가 시작되었습니다',
    completed: '🎉 서비스가 완료되었습니다',
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🚗 드라이버 위치 추적</h1>
        <p className="text-gray-600 mt-2">드라이버의 실시간 위치를 확인하세요</p>
      </div>

      {/* 상태 표시 */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{pickupStatus === 'waiting' ? '⏳' : pickupStatus === 'driver_on_way' ? '🚗' : pickupStatus === 'arrived' ? '✅' : pickupStatus === 'service_start' ? '💆' : '🎉'}</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{statusMessages[pickupStatus]}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {pickupStatus === 'waiting' && '약 3-5분 후에 드라이버가 배정될 예정입니다.'}
              {pickupStatus === 'driver_on_way' && '드라이버가 현재 목적지로 향하고 있습니다. 약 5분 정도 소요될 예정입니다.'}
              {pickupStatus === 'arrived' && '드라이버가 도착했습니다. 대기 중입니다.'}
              {pickupStatus === 'service_start' && '서비스가 시작되었습니다. 즐거운 시간 되세요!'}
              {pickupStatus === 'completed' && '서비스 이용 감사합니다!'}
            </p>
          </div>
        </div>

        {/* 상태 변경 (테스트용) */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {Object.keys(statusMessages).map((status) => (
            <button
              key={status}
              onClick={() => setPickupStatus(status as any)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                pickupStatus === status ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border border-orange-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 지도 */}
      <div className="rounded-lg shadow-lg overflow-hidden border border-gray-300" style={{ height: '500px' }}>
        <RealtimeMap
          entityType="customer"
          entityId={1} // 실제로는 로그인한 손님 ID를 사용
          watchMode="target"
          targetEntityType="driver"
          targetEntityId={driverId}
          apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
        />
      </div>

      {/* 드라이버 정보 카드 */}
      {pickupStatus !== 'waiting' && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚗 드라이버 정보</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">김철수</p>
                <p className="text-sm text-gray-600">Rating: ⭐ 4.9 (237 reviews)</p>
                <p className="text-sm text-gray-600">차량: 화이트 기아 K5</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">위치:</span>
                <span className="font-semibold text-gray-900">서울시 강남구 도곡동</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">거리:</span>
                <span className="font-semibold text-gray-900">약 1.2 km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">소요시간:</span>
                <span className="font-semibold text-gray-900">약 5분</span>
              </div>
            </div>
          </div>

          {/* 연락 버튼 */}
          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              📞 전화
            </button>
            <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              💬 메시지
            </button>
          </div>
        </div>
      )}

      {/* 팁 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>팁:</strong> 긴급 상황이 발생하면 위의 '전화' 또는 '메시지' 버튼을 통해 드라이버에게 연락할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
