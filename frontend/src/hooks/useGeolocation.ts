'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================
// 📌 Geolocation 훅
// 📋 목적: 브라우저 위치 정보 수집, 5초 간격 주기적 업데이트
// 📅 작성일: 2026-05-24
// ============================================================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface UseGeolocationOptions {
  enabled?: boolean;
  onLocationChange?: (location: LocationData) => void;
  onError?: (error: GeolocationPositionError) => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enabled = true, onLocationChange, onError } = options;
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Geolocation API 지원 여부 확인
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    setIsAvailable(supported);

    if (!supported) {
      setError('이 브라우저에서는 Geolocation API를 지원하지 않습니다');
    }
  }, []);

  // 위치 업데이트 처리
  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } =
      position.coords;

    const locationData: LocationData = {
      latitude,
      longitude,
      accuracy: Math.round(accuracy),
      altitude: altitude ? Math.round(altitude) : undefined,
      altitudeAccuracy: altitudeAccuracy ? Math.round(altitudeAccuracy) : undefined,
      heading: heading ?? undefined,
      speed: speed ? Math.round(speed * 3.6) : undefined, // m/s -> km/h
      timestamp: position.timestamp,
    };

    setLocation(locationData);
    setError(null);
    onLocationChange?.(locationData);
  }, [onLocationChange]);

  // 위치 에러 처리
  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let errorMsg = '위치 정보를 가져올 수 없습니다';

    if (err.code === err.PERMISSION_DENIED) {
      errorMsg = '위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.';
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      errorMsg = '위치 정보를 사용할 수 없습니다';
    } else if (err.code === err.TIMEOUT) {
      errorMsg = '위치 정보 요청 시간 초과';
    }

    setError(errorMsg);
    onError?.(err);
  }, [onError]);

  // 위치 추적 시작
  const startTracking = useCallback(() => {
    if (!isAvailable || !enabled) return;

    // 초기 위치 요청
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // 5초마다 주기적으로 위치 업데이트
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    }, 5000); // 5초 간격
  }, [isAvailable, enabled, handlePositionSuccess, handlePositionError]);

  // 위치 추적 중지
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 자동 시작/중지
  useEffect(() => {
    if (enabled && isAvailable) {
      startTracking();
      return () => stopTracking();
    } else {
      stopTracking();
    }
  }, [enabled, isAvailable, startTracking, stopTracking]);

  return {
    location,
    error,
    isAvailable,
    startTracking,
    stopTracking,
  };
}
