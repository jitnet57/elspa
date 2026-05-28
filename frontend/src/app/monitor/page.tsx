'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MOCK_PICKUP_REQUESTS, MOCK_DRIVERS, MOCK_ACTIVE_TRIPS, MOCK_STATS, MOCK_STATIC_MAP_MARKERS } from '@/lib/mock/pickup-mock';
import type { PickupRequest, DriverSummary, ActiveTrip, StaticMarker } from '@/lib/types/pickup-types';

const RealtimeMap = dynamic(() => import('@/components/RealtimeMap').then(m => m.RealtimeMap), { ssr: false, loading: () => <div className="w-full h-full bg-gray-800 animate-pulse"></div> });

type TabType = 'queue' | 'trips' | 'drivers' | 'bookings';

interface MassageBooking {
  id: string;
  therapist: string;
  service: string;
  date: string;
  time: string;
  guestName: string;
  roomNumber: string;
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
}

interface GoogleSheetBooking {
  id: string;
  therapist: string;
  service: string;
  date: string;
  time: string;
  guestName: string;
  roomNumber: string;
}

export default function MonitorPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('--:--:--');
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>(MOCK_PICKUP_REQUESTS);
  const [drivers, setDrivers] = useState<DriverSummary[]>(MOCK_DRIVERS);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [showGoogleSheet, setShowGoogleSheet] = useState(false);
  const [googleSheetBookings, setGoogleSheetBookings] = useState<GoogleSheetBooking[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [massageBookings, setMassageBookings] = useState<MassageBooking[]>([
    { id: '1', therapist: 'Maria Santos', service: 'Swedish Massage', date: '2026-05-28', time: '14:00', guestName: 'John Doe', roomNumber: '01', status: 'confirmed', createdAt: new Date().toISOString() },
    { id: '2', therapist: 'Ana Mercado', service: 'Thai Massage', date: '2026-05-28', time: '15:00', guestName: 'Jane Smith', roomNumber: '02', status: 'pending', createdAt: new Date().toISOString() },
    { id: '3', therapist: 'Rosa Chavez', service: 'Hot Stone Therapy', date: '2026-05-28', time: '16:00', guestName: 'Mike Johnson', roomNumber: '03', status: 'confirmed', createdAt: new Date().toISOString() },
  ]);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Google Sheet 예약 데이터 조회
  const fetchGoogleSheetBookings = async () => {
    setIsLoadingSheet(true);
    try {
      const response = await fetch('http://localhost:8000/api/massage-bookings/');
      if (response.ok) {
        const data = await response.json();
        const bookings = data.bookings || [];
        setGoogleSheetBookings(bookings.map((b: any) => ({
          id: b.id,
          therapist: b.therapist,
          service: b.service,
          date: b.date,
          time: b.time,
          guestName: b.guest_name || b.guestName,
          roomNumber: b.room_number || b.roomNumber,
        })));
      } else {
        // 에러 발생 시 현재 마사지 북은 기존 데이터로 표시
        setGoogleSheetBookings(massageBookings.map(b => ({
          id: b.id,
          therapist: b.therapist,
          service: b.service,
          date: b.date,
          time: b.time,
          guestName: b.guestName,
          roomNumber: b.roomNumber,
        })));
      }
    } catch (error) {
      console.error('Google Sheet 데이터 조회 실패:', error);
      // 백업: 현재 테이블의 마사지 예약 데이터 사용
      setGoogleSheetBookings(massageBookings.map(b => ({
        id: b.id,
        therapist: b.therapist,
        service: b.service,
        date: b.date,
        time: b.time,
        guestName: b.guestName,
        roomNumber: b.roomNumber,
      })));
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleOpenGoogleSheet = () => {
    setShowGoogleSheet(true);
    fetchGoogleSheetBookings();
  };

  // 드라이버 배정 처리
  const handleAssignDriver = (requestId: string, driverId: number) => {
    const driverToAssign = drivers.find(d => d.id === driverId);
    if (!driverToAssign) return;

    // 픽업 요청 업데이트
    setPickupRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'assigned' as const,
              assignedDriverId: driverId,
              assignedAt: new Date().toISOString(),
              estimatedArrival: '약 5분',
            }
          : req
      )
    );

    // 드라이버 상태 업데이트 (available → on_trip)
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? {
              ...d,
              status: 'on_trip' as const,
              currentCustomerId: pickupRequests.find(r => r.id === requestId)?.customerId,
            }
          : d
      )
    );

    setIsAssigning(null);
    setSelectedDriver(null);
  };

  const pendingRequests = pickupRequests.filter(r => r.status === 'pending');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: { [key: string]: string } = {
      home_visit: '🏠 집 방문',
      transport_to_spa: '🚗 스파 이동',
      airport_pickup: '✈️ 공항 픽업',
      airport_dropoff: '✈️ 공항 드롭',
    };
    return labels[serviceType] || serviceType;
  };

  const getFlightInfo = (req: PickupRequest) => {
    if (!req.flightNumber) return null;
    const arrivalTime = req.flightArrivalTime ? new Date(req.flightArrivalTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
    return `${req.flightNumber} (${arrivalTime})`;
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 px-6 py-4">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🚗 픽업 디스패치 센터</h1>
            <p className="text-sm text-gray-400 mt-1">실시간 드라이버 및 픽업 요청 관리</p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-indigo-400">{currentTime}</div>
            <p className="text-xs text-gray-500 mt-1">실시간 모니터링</p>
          </div>
        </div>

        {/* 🧖 RED BOX - Google Sheet Bookings Menu */}
        <div className="mt-4 border-4 border-red-500/80 rounded-lg p-6 bg-white/5 backdrop-blur-sm">
          <button
            onClick={handleOpenGoogleSheet}
            className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-lg font-bold text-white text-lg transition-all shadow-xl hover:shadow-rose-500/50 flex items-center justify-center gap-3 group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">🧖</span>
            <div className="text-left">
              <div className="font-bold">마사지 예약</div>
              <div className="text-xs text-white/80">Google Sheets 예약 정보</div>
            </div>
            <span className="ml-auto text-white/70 group-hover:text-white">→</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-slate-950 border-b border-white/10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-indigo-400">{MOCK_STATS.activeDrivers}</div>
          <p className="text-xs text-gray-400 mt-1">활성 드라이버</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-cyan-400">{MOCK_STATS.pendingPickups}</div>
          <p className="text-xs text-gray-400 mt-1">대기 중 픽업</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-amber-400">{MOCK_STATS.activeTrips}</div>
          <p className="text-xs text-gray-400 mt-1">진행 중 트립</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
          <div className="text-3xl font-bold text-emerald-400">{MOCK_STATS.completedToday}</div>
          <p className="text-xs text-gray-400 mt-1">오늘 완료</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 px-6 py-4 overflow-hidden">
        {/* Map Section (60%) */}
        <div className="w-3/5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {mounted ? (
            <RealtimeMap
              enableWebSocket={false}
              staticMarkers={MOCK_STATIC_MAP_MARKERS}
              onMarkerClick={() => {}}
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <p className="text-gray-400">🗺️ 지도 로딩 중...</p>
            </div>
          )}
        </div>

        {/* Control Panel (40%) */}
        <div className="w-2/5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-indigo-500/20 text-indigo-300 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              픽업 큐 ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                activeTab === 'trips'
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              진행 중 ({MOCK_ACTIVE_TRIPS.length})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                activeTab === 'drivers'
                  ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              드라이버 ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                activeTab === 'bookings'
                  ? 'bg-pink-500/20 text-pink-300 border-b-2 border-pink-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              마사지 ({massageBookings.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Pickup Queue Tab */}
            {activeTab === 'queue' && (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">대기 중인 픽업 요청이 없습니다</p>
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 hover:bg-white/8 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{req.customerName}</p>
                          <p className="text-xs text-gray-400 mt-1">{getServiceTypeLabel(req.serviceType)}</p>
                          {req.flightNumber && (
                            <p className="text-xs text-cyan-400 mt-1">✈️ {getFlightInfo(req)}</p>
                          )}
                          {req.passengerCount && (
                            <p className="text-xs text-gray-400 mt-1">👥 {req.passengerCount}명 / 🧳 {req.luggageCount}개</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{req.pickupAddress}</p>
                        </div>
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded whitespace-nowrap">대기 중</span>
                      </div>

                      {isAssigning === req.id ? (
                        <div className="space-y-2">
                          <select
                            value={selectedDriver || ''}
                            onChange={e => setSelectedDriver(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-white/20 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="">드라이버 선택...</option>
                            {availableDrivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.vehicleBrand})
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (selectedDriver) {
                                  handleAssignDriver(req.id, selectedDriver);
                                }
                              }}
                              className="flex-1 bg-indigo-500 hover:bg-indigo-600 rounded-lg px-2 py-1 text-xs font-medium transition-all"
                            >
                              배정
                            </button>
                            <button
                              onClick={() => {
                                setIsAssigning(null);
                                setSelectedDriver(null);
                              }}
                              className="flex-1 bg-white/10 hover:bg-white/20 rounded-lg px-2 py-1 text-xs font-medium transition-all"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAssigning(req.id)}
                          className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 rounded-lg px-3 py-2 text-xs font-medium text-indigo-300 transition-all"
                        >
                          배정하기
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Active Trips Tab */}
            {activeTab === 'trips' && (
              <div className="space-y-3">
                {MOCK_ACTIVE_TRIPS.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">진행 중인 트립이 없습니다</p>
                  </div>
                ) : (
                  MOCK_ACTIVE_TRIPS.map(trip => (
                    <div key={trip.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-white text-sm">{trip.driverName}</p>
                          <p className="text-xs text-gray-400">고객: {trip.customerName}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          trip.status === 'en_route' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {trip.status === 'en_route' ? '🚗 이동 중' : '🏠 서비스 진행'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{trip.serviceType}</p>
                      <p className="text-xs text-gray-500 mt-1">{trip.estimatedCompletion}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div className="space-y-3">
                {drivers.map(driver => (
                  <div key={driver.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-white text-sm">{driver.name}</p>
                        <p className="text-xs text-gray-400">{driver.vehicleBrand}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        driver.status === 'available'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : driver.status === 'on_trip'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {driver.status === 'available' ? '✅ 대기' : driver.status === 'on_trip' ? '🚗 운행' : '⭕ 오프'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>⭐ {driver.rating}</span>
                      <span>완료: {driver.completedTripsToday}건</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Massage Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-3">
                {massageBookings.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">마사지 예약이 없습니다</p>
                  </div>
                ) : (
                  massageBookings.map(booking => (
                    <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 hover:bg-white/8 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">🧖 {booking.guestName}</p>
                          <p className="text-xs text-pink-400 mt-1">{booking.service}</p>
                          <p className="text-xs text-gray-400 mt-1">테라피스트: {booking.therapist}</p>
                          <p className="text-xs text-gray-500 mt-1">📅 {booking.date} {booking.time} | 🚪 Room {booking.roomNumber}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : booking.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {booking.status === 'confirmed' ? '✅ 예약' : booking.status === 'completed' ? '✓ 완료' : '⏳ 대기'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Sheet Bookings Modal */}
      {showGoogleSheet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-pink-500/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4 flex justify-between items-center border-b border-pink-500/30">
              <div>
                <h2 className="text-xl font-bold text-white">🧖 Google Sheets 마사지 예약</h2>
                <p className="text-xs text-pink-100 mt-1">클라우드 동기화 데이터</p>
              </div>
              <button
                onClick={() => setShowGoogleSheet(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoadingSheet ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500 border-opacity-75"></div>
                  <span className="ml-4 text-gray-400">데이터 로딩 중...</span>
                </div>
              ) : googleSheetBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Google Sheet에 예약 데이터가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {googleSheetBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-base">👤 {booking.guestName}</p>
                          <p className="text-sm text-pink-400 mt-1">{booking.service}</p>
                          <p className="text-sm text-gray-400 mt-1">테라피스트: <span className="text-indigo-300 font-medium">{booking.therapist}</span></p>
                          <p className="text-xs text-gray-500 mt-2">📅 {booking.date} ⏰ {booking.time} | 🚪 Room {booking.roomNumber}</p>
                        </div>
                        <div className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                          ☁️ Cloud
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Sync Info */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 text-center">
                      💾 매일 자정(00:00)에 자동으로 클라우드와 동기화됩니다
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => fetchGoogleSheetBookings()}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition-all"
              >
                🔄 새로고침
              </button>
              <button
                onClick={() => setShowGoogleSheet(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
