'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const RealtimeMap = dynamic(() => import('@/components/RealtimeMap').then(m => ({ default: m.RealtimeMap })), {
  ssr: false
});

export default function CustomerLocationsPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<number | null>(null);

  // 테스트용 고객 데이터
  const upcomingCustomers = [
    { id: 1, name: '박미영', address: '서울시 강남구 도곡동', distance: '1.2 km', eta: '5분', service: '스웨덱 마사지' },
    { id: 2, name: '이지은', address: '서울시 강남구 삼성동', distance: '2.5 km', eta: '12분', service: '타이 마사지' },
    { id: 3, name: '최수진', address: '서울시 강남구 압구정동', distance: '0.8 km', eta: '3분', service: '발마사지' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👤 손님 위치 추적</h1>
        <p className="text-gray-600 mt-2">오늘의 손님 위치를 확인하고 경로를 계획하세요</p>
      </div>

      {/* 2열 레이아웃: 지도 + 손님 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 지도 (2열) */}
        <div className="lg:col-span-2 rounded-lg shadow-lg overflow-hidden border border-gray-300" style={{ height: '500px' }}>
          <RealtimeMap
            entityType="driver"
            entityId={1} // 실제로는 로그인한 드라이버 ID를 사용
            watchMode="target"
            targetEntityType="customer"
            targetEntityId={selectedCustomer || 1}
            apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          />
        </div>

        {/* 손님 목록 (1열) */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <h2 className="font-bold text-lg">📋 오늘의 손님</h2>
            <p className="text-sm text-blue-100 mt-1">{upcomingCustomers.length}명</p>
          </div>

          <div className="divide-y max-h-[500px] overflow-y-auto">
            {upcomingCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer.id)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedCustomer === customer.id
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{customer.eta}</span>
                </div>

                <p className="text-sm text-gray-600 mb-2">{customer.address}</p>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>📍 {customer.distance}</span>
                  <span>💆 {customer.service}</span>
                </div>

                {activeSession === customer.id && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSession(null);
                      }}
                      className="w-full bg-green-600 text-white text-xs py-1 rounded font-semibold hover:bg-green-700"
                    >
                      ✅ 서비스 완료
                    </button>
                  </div>
                )}

                {activeSession !== customer.id && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSession(customer.id);
                      }}
                      className="w-full bg-blue-600 text-white text-xs py-1 rounded font-semibold hover:bg-blue-700"
                    >
                      🚗 픽업 시작
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 선택된 손님 상세 정보 */}
      {selectedCustomer && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-gray-900 mb-4">👤 손님 상세 정보</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">이름</label>
                <p className="font-semibold text-gray-900">
                  {upcomingCustomers.find((c) => c.id === selectedCustomer)?.name}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">주소</label>
                <p className="font-semibold text-gray-900">
                  {upcomingCustomers.find((c) => c.id === selectedCustomer)?.address}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">서비스</label>
                <p className="font-semibold text-gray-900">
                  {upcomingCustomers.find((c) => c.id === selectedCustomer)?.service}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">거리</label>
                <p className="font-semibold text-gray-900">
                  {upcomingCustomers.find((c) => c.id === selectedCustomer)?.distance}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">예상 도착 시간</label>
                <p className="font-semibold text-gray-900">
                  {upcomingCustomers.find((c) => c.id === selectedCustomer)?.eta}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">상태</label>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  {activeSession === selectedCustomer ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      서비스 진행 중
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                      픽업 대기 중
                    </>
                  )}
                </p>
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
          💡 <strong>팁:</strong> 손님을 클릭하면 지도에서 손님의 위치를 확인하고 상세 정보를 볼 수 있습니다.
        </p>
      </div>
    </div>
  );
}
