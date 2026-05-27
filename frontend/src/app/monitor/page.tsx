'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MOCK_PICKUP_REQUESTS, MOCK_DRIVERS, MOCK_ACTIVE_TRIPS, MOCK_STATS, MOCK_STATIC_MAP_MARKERS } from '@/lib/mock/pickup-mock';
import type { PickupRequest, DriverSummary, ActiveTrip, StaticMarker } from '@/lib/types/pickup-types';

const RealtimeMap = dynamic(() => import('@/components/RealtimeMap').then(m => m.RealtimeMap), { ssr: false, loading: () => <div className="w-full h-full bg-gray-800 animate-pulse"></div> });

type TabType = 'queue' | 'trips' | 'drivers';

export default function MonitorPage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>(MOCK_PICKUP_REQUESTS);
  const [drivers, setDrivers] = useState<DriverSummary[]>(MOCK_DRIVERS);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🚗 픽업 디스패치 센터</h1>
            <p className="text-sm text-gray-400 mt-1">실시간 드라이버 및 픽업 요청 관리</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-indigo-400">{currentTime}</div>
            <p className="text-xs text-gray-500 mt-1">실시간 모니터링</p>
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
