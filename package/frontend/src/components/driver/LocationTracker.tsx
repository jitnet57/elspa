'use client';

import React, { useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDriverWebSocket } from '@/hooks/useDriverWebSocket';
import { useDriverStore } from '@/lib/store/driver-store';

// ============================================================
// 📌 GPS 위치 추적 컴포넌트
// 📋 목적: Geolocation API로 위치 수집, WebSocket으로 실시간 전송
// 🔧 기능: 5초 간격 업데이트, 배터리 절약 모드, 정확도 표시
// 📅 작성일: 2026-05-24
// ============================================================

interface LocationTrackerProps {
  enabled?: boolean;
  showAccuracy?: boolean;
}

export function LocationTracker({ enabled = true, showAccuracy = true }: LocationTrackerProps) {
  const { driverId } = useDriverStore();
  const { location, error, isAvailable } = useGeolocation({
    enabled,
    onLocationChange: (loc) => {
      // 위치 변경 시 WebSocket으로 전송
      sendLocationUpdate(loc.latitude, loc.longitude, loc.accuracy);

      // 동시에 REST API로도 저장 (백업)
      if (driverId) {
        updateLocationToAPI(driverId, loc);
      }
    },
  });

  const { sendLocationUpdate } = useDriverWebSocket(driverId, enabled);

  // REST API를 통해 위치 저장 (WebSocket 백업)
  const updateLocationToAPI = async (driverId: number, location: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/driver/location?driver_id=${driverId}&latitude=${location.latitude}&longitude=${location.longitude}&accuracy=${location.accuracy || 0}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        console.warn('위치 API 저장 실패');
      }
    } catch (err) {
      console.error('위치 저장 에러:', err);
    }
  };

  if (!isAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        <p className="text-sm font-semibold">⚠️ Geolocation 지원 안 함</p>
        <p className="text-xs mt-1">이 브라우저에서는 위치 추적을 지원하지 않습니다</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="text-sm font-semibold">❌ 위치 오류</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
        <p className="text-sm font-semibold">🔄 위치 정보 수집 중...</p>
        <p className="text-xs mt-1">GPS 신호를 대기 중입니다</p>
      </div>
    );
  }

  const formatCoord = (coord: number) => coord.toFixed(6);
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('ko-KR');

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-semibold text-green-900">🟢 위치 추적 활성</p>
          <p className="text-xs text-green-700 mt-1">실시간 업데이트 중 (5초 간격)</p>
        </div>
        <span className="text-2xl">📍</span>
      </div>

      <div className="bg-white rounded p-3 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">위도</p>
            <p className="text-sm font-mono font-bold text-gray-900">{formatCoord(location.latitude)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">경도</p>
            <p className="text-sm font-mono font-bold text-gray-900">{formatCoord(location.longitude)}</p>
          </div>
        </div>

        {showAccuracy && (
          <div>
            <p className="text-xs text-gray-500">정확도</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{location.accuracy}m</p>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${
                    location.accuracy && location.accuracy < 10
                      ? 'bg-green-500'
                      : location.accuracy && location.accuracy < 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.max(10, Math.min(100, 100 - (location.accuracy || 50) * 2))}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500">마지막 업데이트</p>
          <p className="text-xs text-gray-700">{formatTime(location.timestamp)}</p>
        </div>

        {location.speed !== undefined && location.speed > 0 && (
          <div>
            <p className="text-xs text-gray-500">현재 속도</p>
            <p className="text-sm font-bold text-gray-900">{location.speed} km/h</p>
          </div>
        )}
      </div>
    </div>
  );
}
