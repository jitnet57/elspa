'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MOCK_AVAILABLE_DRIVERS, MOCK_STATIC_MAP_MARKERS } from '@/lib/mock/pickup-mock';
import type { StaticMarker } from '@/lib/types/pickup-types';

const RealtimeMap = dynamic(() => import('@/components/RealtimeMap').then(m => m.RealtimeMap), { ssr: false });

type Step = 1 | 2 | 3 | 4;

interface PickupLocation {
  lat: number;
  lng: number;
  address: string;
}

export default function CustomerPickupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [serviceType, setServiceType] = useState<'home_visit' | 'transport_to_spa' | 'airport_pickup' | 'airport_dropoff' | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GPS 위치 감지 (Step 1)
  useEffect(() => {
    if (step === 1 && !pickupLocation) {
      setLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Nominatim reverse geocoding (API 키 없음)
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await response.json();
              setPickupLocation({
                lat: latitude,
                lng: longitude,
                address: data.address?.city || data.address?.town || '현재 위치',
              });
            } catch (err) {
              setPickupLocation({
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              });
            }
            setLoading(false);
          },
          () => {
            // 위치 허용 거부 시 기본값 (서울 강남)
            setPickupLocation({
              lat: 37.497,
              lng: 127.027,
              address: '서울시 강남구',
            });
            setLoading(false);
          }
        );
      }
    }
  }, [step, pickupLocation]);

  const handleNextStep = () => {
    if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleStartTracking = () => {
    if (selectedDriverId && pickupLocation) {
      // sessionStorage에 배정된 드라이버 ID 저장
      sessionStorage.setItem('assignedDriverId', selectedDriverId.toString());
      sessionStorage.setItem('pickupLocation', JSON.stringify(pickupLocation));
      sessionStorage.setItem('serviceType', serviceType || '');
      // 실시간 추적 페이지로 이동
      router.push('/customer/driver-tracking');
    }
  };

  const serviceOptions = [
    { id: 'home_visit', label: '🏠 집 방문', desc: '집에서 테라피스트 방문' },
    { id: 'transport_to_spa', label: '🚗 스파로 이동', desc: '스파 센터까지 운송' },
    { id: 'airport_pickup', label: '✈️ 공항 픽업', desc: '공항에서 출발' },
    { id: 'airport_dropoff', label: '✈️ 공항 드롭', desc: '공항으로 이동' },
  ];

  const mapMarkers: StaticMarker[] =
    pickupLocation && step <= 3
      ? [
          {
            id: 'pickup-location',
            entity_type: 'customer',
            entity_id: 1,
            latitude: pickupLocation.lat,
            longitude: pickupLocation.lng,
            label: '픽업 위치',
            address: pickupLocation.address,
          },
          ...MOCK_STATIC_MAP_MARKERS.filter(m => m.entity_type === 'driver').slice(0, 3),
        ]
      : MOCK_STATIC_MAP_MARKERS;

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Full-screen Map */}
      <div className="absolute inset-0 z-[100]">
        <RealtimeMap enableWebSocket={false} staticMarkers={mapMarkers} onMarkerClick={() => {}} />
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[110] bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
        {/* Handle Bar */}
        <div className="flex justify-center py-3 border-b border-gray-200">
          <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: GPS Location Detection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">어디서 픽업할까요?</h2>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">위치를 감지 중입니다...</p>
                </div>
              ) : (
                <>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">현재 위치:</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{pickupLocation?.address}</p>
                    <p className="text-xs text-gray-500 mt-1">{pickupLocation?.lat.toFixed(4)}, {pickupLocation?.lng.toFixed(4)}</p>
                  </div>
                  <button
                    onClick={handleNextStep}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 font-semibold transition-all"
                  >
                    다음 (서비스 선택)
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Service Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">어떤 서비스를 원하시나요?</h2>
              <div className="space-y-2">
                {serviceOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setServiceType(option.id as typeof serviceType)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      serviceType === option.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg py-2 font-semibold transition-all"
                >
                  이전
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!serviceType}
                  className={`flex-1 rounded-lg py-2 font-semibold transition-all ${
                    serviceType
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  다음 (드라이버 선택)
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Driver Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">드라이버를 선택하세요</h2>
              <div className="space-y-2">
                {MOCK_AVAILABLE_DRIVERS.map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedDriverId === driver.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{driver.name}</p>
                        <p className="text-sm text-gray-600">{driver.vehicleBrand}</p>
                        <p className="text-xs text-gray-500 mt-1">📍 {driver.licensePlate}</p>
                      </div>
                      <span className="text-lg font-bold text-yellow-500">⭐ {driver.rating}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg py-2 font-semibold transition-all"
                >
                  이전
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!selectedDriverId}
                  className={`flex-1 rounded-lg py-2 font-semibold transition-all ${
                    selectedDriverId
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  다음 (확인)
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && selectedDriverId && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">픽업 요청 확인</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 uppercase">📍 픽업 위치</p>
                  <p className="font-semibold text-gray-900 mt-1">{pickupLocation?.address}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 uppercase">🚗 드라이버</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {MOCK_AVAILABLE_DRIVERS.find(d => d.id === selectedDriverId)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {MOCK_AVAILABLE_DRIVERS.find(d => d.id === selectedDriverId)?.vehicleBrand}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 uppercase">📋 서비스</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {serviceOptions.find(s => s.id === serviceType)?.label}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg py-2 font-semibold transition-all"
                >
                  이전
                </button>
                <button
                  onClick={handleStartTracking}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 font-semibold transition-all"
                >
                  실시간 추적 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
