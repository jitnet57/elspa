/**
 * ============================================================
 * 📌 Hook: useWalkInMatching
 * 📋 목적: 워크인 손님의 베드-테라피스트 하이브리드 매칭 관리
 * 🎯 기능:
 *   - 워크인 예약 생성 (베드 + 테라피스트 할당)
 *   - 예약 목록 조회
 *   - 예약 취소
 * 📅 작성일: 2025-05-13
 * ⚠️ 주의: 모니터 페이지 전용 (로컬 상태 관리)
 * ============================================================
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================
// 🔧 인터페이스 정의
// ============================================================

export interface WalkInBooking {
  id: string;                    // UUID
  count: number;                 // 인원수
  serviceType: string;           // 서비스 종류
  bedIds: number[];              // 할당된 베드 ID
  therapistIds: number[];        // 할당된 테라피스트 ID
  createdAt: Date;               // 생성 시간
  estimatedEndTime: Date;        // 예상 종료 시간 (서비스 시간 기준)
}

interface UseWalkInMatchingReturn {
  walkInBookings: WalkInBooking[];
  createWalkInBooking: (data: {
    count: number;
    serviceType: string;
    bedIds: number[];
    therapistIds: number[];
    estimatedDuration: number; // 분 단위
  }) => string; // 생성된 ID 반환
  cancelWalkInBooking: (id: string) => void;
  getWalkInBookingsByBed: (bedId: number) => WalkInBooking[];
  getWalkInBookingsByTherapist: (therapistId: number) => WalkInBooking[];
}

/**
 * ============================================================
 * 🎯 메인 훅
 * ============================================================
 */
export const useWalkInMatching = (): UseWalkInMatchingReturn => {
  // 워크인 예약 목록 (로컬 상태)
  const [walkInBookings, setWalkInBookings] = useState<WalkInBooking[]>([]);

  // ============================================================
  // 📌 함수: 워크인 예약 생성
  // ============================================================
  const createWalkInBooking = useCallback(
    (data: {
      count: number;
      serviceType: string;
      bedIds: number[];
      therapistIds: number[];
      estimatedDuration: number;
    }) => {
      // UUID 생성 (간단한 방식)
      const id = `walk-in-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 예상 종료 시간 계산
      const estimatedEndTime = new Date();
      estimatedEndTime.setMinutes(estimatedEndTime.getMinutes() + data.estimatedDuration);

      // 새 예약 객체 생성
      const newBooking: WalkInBooking = {
        id,
        count: data.count,
        serviceType: data.serviceType,
        bedIds: data.bedIds,
        therapistIds: data.therapistIds,
        createdAt: new Date(),
        estimatedEndTime,
      };

      // 상태에 추가
      setWalkInBookings(prev => [...prev, newBooking]);

      console.log(
        `✅ 워크인 예약 생성: ${data.count}명, 베드: ${data.bedIds.join(', ')}, 테라피스트: ${data.therapistIds.join(', ')}`
      );

      return id;
    },
    []
  );

  // ============================================================
  // 📌 함수: 워크인 예약 취소
  // ============================================================
  const cancelWalkInBooking = useCallback((id: string) => {
    setWalkInBookings(prev => prev.filter(booking => booking.id !== id));
    console.log(`❌ 워크인 예약 취소: ${id}`);
  }, []);

  // ============================================================
  // 📌 함수: 특정 베드의 워크인 예약 조회
  // ============================================================
  const getWalkInBookingsByBed = useCallback(
    (bedId: number) => {
      return walkInBookings.filter(booking => booking.bedIds.includes(bedId));
    },
    [walkInBookings]
  );

  // ============================================================
  // 📌 함수: 특정 테라피스트의 워크인 예약 조회
  // ============================================================
  const getWalkInBookingsByTherapist = useCallback(
    (therapistId: number) => {
      return walkInBookings.filter(booking =>
        booking.therapistIds.includes(therapistId)
      );
    },
    [walkInBookings]
  );

  return {
    walkInBookings,
    createWalkInBooking,
    cancelWalkInBooking,
    getWalkInBookingsByBed,
    getWalkInBookingsByTherapist,
  };
};

/**
 * ============================================================
 * 🎯 유틸: 서비스 종류별 예상 시간 (분 단위)
 * ============================================================
 */
export const getServiceDuration = (serviceType: string): number => {
  const durations: Record<string, number> = {
    swedish: 60,      // 스웨디시 60분
    thai: 90,         // 타이마사지 90분
    hotstone: 60,     // 핫스톤 60분
    foot: 30,         // 발마사지 30분
    aroma: 45,        // 아로마테라피 45분
  };

  return durations[serviceType] || 60; // 기본값: 60분
};
