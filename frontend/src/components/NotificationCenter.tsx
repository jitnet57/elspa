/**
 * Component: NotificationCenter
 *
 * 목적: 화면 우측 상단에 알림 토스트 표시
 * 사용: <NotificationCenter /> 를 layout에 추가
 */

'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/store';

interface NotificationToastProps {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  onClose: () => void;
}

const NotificationToast = ({ id, message, severity, onClose }: NotificationToastProps) => {
  useEffect(() => {
    // 5초 후 자동 닫기
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    success: 'bg-green-600',
  }[severity];

  const icon = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  }[severity];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right`}
      role="alert"
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:opacity-80 transition"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * NotificationCenter: 모든 알림을 화면 우측 상단에 표시
 */
export const NotificationCenter = () => {
  const { notifications, removeNotification } = useStore();
  const [displayedNotifications, setDisplayedNotifications] = useState(
    notifications.slice(0, 5) // 최대 5개만 표시
  );

  useEffect(() => {
    setDisplayedNotifications(notifications.slice(0, 5));
  }, [notifications]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {displayedNotifications.map(notif => (
        <div key={notif.id} className="pointer-events-auto">
          <NotificationToast
            id={notif.id}
            message={notif.message}
            severity={notif.severity}
            onClose={() => removeNotification(notif.id)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * NotificationBadge: 읽지 않은 알림 개수 표시
 * 사용: <NotificationBadge />
 */
export const NotificationBadge = () => {
  const { unreadCount } = useStore();

  if (unreadCount === 0) return null;

  return (
    <div className="relative inline-block">
      <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
        {unreadCount > 99 ? '99+' : unreadCount}
      </div>
    </div>
  );
};

/**
 * NotificationPanel: 모든 알림 목록을 표시하는 패널
 * 사용: <NotificationPanel isOpen={open} onClose={() => setOpen(false)} />
 */
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { notifications, removeNotification, markAsRead } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900 text-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">🔔 알림</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 p-4">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-400 py-8">알림이 없습니다.</div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition ${
                  notif.isRead ? 'bg-gray-800 border-gray-600' : 'bg-gray-700 border-blue-500'
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-400">
                    {notif.timestamp.toLocaleTimeString('ko-KR', { hour12: false })}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="text-gray-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-sm">{notif.message}</div>
                {!notif.isRead && <div className="mt-2 text-xs text-blue-400">● 새 알림</div>}
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="m-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
