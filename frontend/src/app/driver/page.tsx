'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDriverStore } from '@/lib/store/driver-store';
import { BookingCard } from '@/components/driver/BookingCard';
import { EarningsChart } from '@/components/driver/EarningsChart';
import { RealtimeNotification } from '@/components/driver/RealtimeNotification';
import { LocationTracker } from '@/components/driver/LocationTracker';
import { WithdrawalPanel } from '@/components/driver/WithdrawalPanel';
import { useDriverWebSocket } from '@/hooks/useDriverWebSocket';
import { MOCK_PICKUP_REQUESTS } from '@/lib/mock/pickup-mock';

// ============================================================
// 📌 Driver Dashboard: 드라이버 메인 대시보드
// 📋 목적: 오늘의 배정, 수익, 위치 추적 관리
// 🔧 포함: 예약 관리, 수익 차트, 실시간 위치
// 📅 작성일: 2026-05-24
// ============================================================

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'earnings' | 'schedule' | 'withdrawal' | 'pickups'>('today');
  const [driverId, setLocalDriverId] = useState<number | null>(null);
  const [pickupRequests, setPickupRequests] = useState(MOCK_PICKUP_REQUESTS.filter(r => r.status === 'pending'));

  // Zustand store
  const {
    driverId: storedDriverId,
    profile,
    bookings,
    earnings,
    loading,
    error,
    setDriverId,
    fetchProfile,
    fetchTodayBookings,
    fetchEarnings,
    acceptBooking,
    rejectBooking,
    startTrip,
    completeTrip,
    clearError,
  } = useDriverStore();

  // WebSocket 연결 초기화 (실시간 위치, 배정 알림)
  const { isConnected, sendLocationUpdate, sendPing } = useDriverWebSocket(storedDriverId, true);

  // 초기화: 드라이버 ID 설정 (테스트용 1번)
  useEffect(() => {
    const id = 1; // 실제로는 로그인 정보에서 가져와야 함
    setLocalDriverId(id);
    setDriverId(id);
  }, [setDriverId]);

  // 데이터 로드
  useEffect(() => {
    if (storedDriverId) {
      Promise.all([fetchProfile(), fetchTodayBookings(), fetchEarnings()]);
    }
  }, [storedDriverId, fetchProfile, fetchTodayBookings, fetchEarnings]);

  // WebSocket 헬스 체크 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      sendPing();
    }, 30000);

    return () => clearInterval(interval);
  }, [sendPing]);

  const pendingPickupRequests = pickupRequests.filter(r => r.status === 'pending');

  const handlePickupResponse = (pickupId: string, accepted: boolean) => {
    if (accepted) {
      setPickupRequests(prev =>
        prev.map(req =>
          req.id === pickupId
            ? { ...req, status: 'assigned' as const, assignedDriverId: driverId || 1 }
            : req
        )
      );
    } else {
      setPickupRequests(prev => prev.filter(req => req.id !== pickupId));
    }
  };

  const weekSchedule = [
    { day: '월', time: '08:00 - 20:00', status: '근무' },
    { day: '화', time: '08:00 - 20:00', status: '근무' },
    { day: '수', time: '휴무', status: '휴무' },
    { day: '목', time: '08:00 - 20:00', status: '근무' },
    { day: '금', time: '08:00 - 20:00', status: '근무' },
    { day: '토', time: '10:00 - 18:00', status: '근무' },
    { day: '일', time: '휴무', status: '휴무' },
  ];

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 실시간 알림 컴포넌트 */}
      <RealtimeNotification />

      {/* WebSocket 연결 상태 표시 */}
      {storedDriverId && (
        <div className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 w-fit ${
          isConnected
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-yellow-600'}`}></span>
          {isConnected ? '🟢 실시간 연결 중' : '🟡 연결 중...'}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* GPS 위치 추적 */}
      <section className="max-w-md">
        <LocationTracker enabled={true} showAccuracy={true} />
      </section>

      {/* 헤더 */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl sm:rounded-xl p-6 sm:p-8 md:p-12 shadow-sm border border-blue-100">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            🚗 드라이버 대시보드
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
            {profile?.name || '드라이버'}님, 오늘의 배정을 확인하고 관리하세요.
          </p>

          {/* 주요 통계 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-500 font-light">상태</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">
                {profile?.status === 'online' ? '🟢 온라인' : profile?.status === 'on_trip' ? '🚗 여행중' : '⚫ 오프라인'}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">차량: {profile?.vehicle_brand}</p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 border border-indigo-200">
              <p className="text-xs sm:text-sm text-gray-500 font-light">평점</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">⭐ {profile?.rating.toFixed(1) || '0.0'}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">완료: {profile?.completed_trips || 0}건</p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 border border-purple-200">
              <p className="text-xs sm:text-sm text-gray-500 font-light">누적 수익</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">
                ₩{Math.floor(profile?.total_earnings || 0).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">총 {profile?.total_trips || 0}건</p>
            </div>
          </div>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-4 px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'today'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📅 오늘의 배정 ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-4 px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 수익
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-4 px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 스케줄
        </button>
        <button
          onClick={() => setActiveTab('withdrawal')}
          className={`pb-4 px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'withdrawal'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💸 출금
        </button>
        <button
          onClick={() => setActiveTab('pickups')}
          className={`pb-4 px-4 font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'pickups'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚗 픽업 요청 ({pendingPickupRequests.length})
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'today' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">오늘의 배정</h2>
            <Link
              href="/driver/customer-locations"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              📍 위치 추적 →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">오늘의 배정이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={acceptBooking}
                  onReject={rejectBooking}
                  onStart={startTrip}
                  onComplete={completeTrip}
                  isLoading={loading}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'earnings' && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">수익 현황</h2>
          <EarningsChart earnings={earnings} isLoading={loading} />
        </section>
      )}

      {activeTab === 'schedule' && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">주간 스케줄</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {weekSchedule.map((day) => (
              <div
                key={day.day}
                className={`rounded-lg p-4 text-center transition-all ${
                  day.status === '근무'
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <p className="text-lg font-bold text-gray-900 mb-2">{day.day}</p>
                <p className="text-xs text-gray-600 mb-2">{day.time}</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    day.status === '근무'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {day.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'pickups' && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">픽업 요청</h2>
          {pendingPickupRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">대기 중인 픽업 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPickupRequests.map(req => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{req.customerName}</p>
                      <p className="text-sm text-gray-600 mt-1">{req.serviceType}</p>
                      {req.flightNumber && (
                        <p className="text-sm text-blue-600 mt-1">✈️ {req.flightNumber} ({new Date(req.flightArrivalTime || '').toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})</p>
                      )}
                      {req.passengerCount && (
                        <p className="text-sm text-gray-600 mt-1">👥 {req.passengerCount}명 / 🧳 {req.luggageCount}개</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">📍 {req.pickupAddress}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">신청 대기</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePickupResponse(req.id, true)}
                      className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 rounded-lg py-2 font-semibold transition-all"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handlePickupResponse(req.id, false)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-lg py-2 font-semibold transition-all"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'withdrawal' && (
        <section>
          <WithdrawalPanel />
        </section>
      )}

      {/* 푸터 */}
      <section className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-4">
          더 많은 기능은 설정에서 확인하세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/driver/settings" className="text-blue-600 hover:text-blue-700 font-semibold">
            ⚙️ 설정
          </Link>
          <Link href="/driver/support" className="text-blue-600 hover:text-blue-700 font-semibold">
            💬 고객 지원
          </Link>
        </div>
      </section>
    </div>
  );
}
