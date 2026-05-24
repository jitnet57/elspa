'use client';

import React, { useEffect, useState } from 'react';
import { useDriverStore } from '@/lib/store/driver-store';

// ============================================================
// 📌 실시간 알림 컴포넌트
// 📋 목적: 예약 배정, 상태 변경 실시간 알림
// 📅 작성일: 2026-05-24
// ============================================================

interface Notification {
  id: string;
  type: 'booking_assigned' | 'booking_started' | 'booking_completed' | 'location_error' | 'earnings_update';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function RealtimeNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { bookings } = useDriverStore();

  // 알림 자동 제거 (5초 후)
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications.map((notif) => {
      return setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 5000);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [notifications]);

  // 알림 추가
  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setNotifications((prev) => [...prev, newNotif]);
  };

  // 예약 배정 알림
  useEffect(() => {
    const pendingBookings = bookings.filter((b) => b.status === 'pending');
    if (pendingBookings.length > 0) {
      pendingBookings.forEach((booking) => {
        addNotification({
          type: 'booking_assigned',
          title: '📅 새 배정',
          message: `${booking.service_type} 배정이 도착했습니다. (₩${Math.floor(booking.earnings).toLocaleString()})`,
          action: {
            label: '수락',
            onClick: () => {
              // 수락 버튼 클릭 핸들러는 BookingCard에서 처리
            },
          },
        });
      });
    }
  }, [bookings]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 animate-slide-in ${
            notif.type === 'booking_assigned'
              ? 'bg-blue-50 border-blue-400 text-blue-900'
              : notif.type === 'booking_started'
                ? 'bg-green-50 border-green-400 text-green-900'
                : notif.type === 'booking_completed'
                  ? 'bg-purple-50 border-purple-400 text-purple-900'
                  : notif.type === 'location_error'
                    ? 'bg-red-50 border-red-400 text-red-900'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-900'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-semibold text-sm">{notif.title}</p>
              <p className="text-xs mt-1">{notif.message}</p>
              {notif.action && (
                <button
                  onClick={notif.action.onClick}
                  className="mt-2 text-xs font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: notif.type === 'booking_assigned' ? '#3b82f6' : '#10b981',
                    color: 'white',
                  }}
                >
                  {notif.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
              className="text-lg font-bold ml-2 hover:opacity-60"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
