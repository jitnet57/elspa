/**
 * 📌 예약 카드 컴포넌트
 * 📋 목적: 드라이버의 개별 예약 표시
 * 🔧 포함: 예약 상태, 액션 버튼, 위치 정보
 * 📅 작성일: 2026-05-24
 */

'use client';

import React from 'react';
import { Booking } from '@/lib/api/driver-client';

interface BookingCardProps {
  booking: Booking;
  onAccept?: (bookingId: number) => void;
  onReject?: (bookingId: number) => void;
  onStart?: (bookingId: number) => void;
  onComplete?: (bookingId: number) => void;
  isLoading?: boolean;
}

const statusConfig = {
  pending: { color: 'bg-yellow-50', textColor: 'text-yellow-700', badge: '대기중' },
  accepted: { color: 'bg-blue-50', textColor: 'text-blue-700', badge: '수락됨' },
  rejected: { color: 'bg-red-50', textColor: 'text-red-700', badge: '거절됨' },
  ongoing: { color: 'bg-green-50', textColor: 'text-green-700', badge: '진행중' },
  completed: { color: 'bg-gray-50', textColor: 'text-gray-700', badge: '완료' },
};

export function BookingCard({
  booking,
  onAccept,
  onReject,
  onStart,
  onComplete,
  isLoading = false,
}: BookingCardProps) {
  const config = statusConfig[booking.status as keyof typeof statusConfig];
  const scheduledTime = new Date(booking.scheduled_time);

  const renderActionButtons = () => {
    if (booking.status === 'pending') {
      return (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAccept?.(booking.id)}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-sm transition-colors"
          >
            {isLoading ? '수락중...' : '✅ 수락'}
          </button>
          <button
            onClick={() => onReject?.(booking.id)}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold text-sm transition-colors"
          >
            {isLoading ? '거절중...' : '❌ 거절'}
          </button>
        </div>
      );
    }

    if (booking.status === 'accepted') {
      return (
        <button
          onClick={() => onStart?.(booking.id)}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm transition-colors mt-4"
        >
          {isLoading ? '시작중...' : '🚗 여행 시작'}
        </button>
      );
    }

    if (booking.status === 'ongoing') {
      return (
        <button
          onClick={() => onComplete?.(booking.id)}
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-sm transition-colors mt-4"
        >
          {isLoading ? '완료중...' : '✨ 여행 완료'}
        </button>
      );
    }

    return null;
  };

  return (
    <div className={`${config.color} rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow`}>
      {/* 헤더: 시간 + 상태 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {scheduledTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.textColor} bg-white border border-current`}>
          {config.badge}
        </span>
      </div>

      {/* 서비스 정보 */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900 mb-1">💆 {booking.service_type}</p>
        <p className="text-sm text-gray-600">📍 {booking.customer_address}</p>
      </div>

      {/* 수익 정보 */}
      <div className="mb-4 pt-3 border-t border-gray-300">
        <p className="text-lg font-bold text-gray-900">
          💰 ₩{Math.floor(booking.earnings).toLocaleString()}
        </p>
      </div>

      {/* 액션 버튼 */}
      {renderActionButtons()}
    </div>
  );
}
