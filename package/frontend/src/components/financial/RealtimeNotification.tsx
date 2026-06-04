'use client';

/**
 * 📌 Realtime Notification Component
 * 📋 목적: WebSocket 메시지를 기반으로 실시간 알림 표시
 * 🔧 포함: 토스트 알림, 자동 사라짐, 액션 버튼
 */

import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'expense_added' | 'expense_updated' | 'expense_deleted' | 'budget_changed' | 'budget_exceeded' | 'category_added' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number; // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface RealtimeNotificationProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
}

export function RealtimeNotification({ notifications, onDismiss }: RealtimeNotificationProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setDisplayedNotifications(notifications);

    // 자동 사라짐
    notifications.forEach((notification) => {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        onDismiss?.(notification.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, onDismiss]);

  const getIcon = (type: Notification['type']) => {
    const icons: Record<Notification['type'], string> = {
      'expense_added': '➕',
      'expense_updated': '✏️',
      'expense_deleted': '🗑️',
      'budget_changed': '💰',
      'budget_exceeded': '⚠️',
      'category_added': '📂',
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
    };
    return icons[type];
  };

  const getColor = (type: Notification['type']): string => {
    const colors: Record<Notification['type'], string> = {
      'expense_added': 'bg-green-50 border-green-200 text-green-900',
      'expense_updated': 'bg-blue-50 border-blue-200 text-blue-900',
      'expense_deleted': 'bg-red-50 border-red-200 text-red-900',
      'budget_changed': 'bg-purple-50 border-purple-200 text-purple-900',
      'budget_exceeded': 'bg-orange-50 border-orange-200 text-orange-900',
      'category_added': 'bg-indigo-50 border-indigo-200 text-indigo-900',
      'info': 'bg-blue-50 border-blue-200 text-blue-900',
      'success': 'bg-green-50 border-green-200 text-green-900',
      'warning': 'bg-yellow-50 border-yellow-200 text-yellow-900',
      'error': 'bg-red-50 border-red-200 text-red-900',
    };
    return colors[type];
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-3">
      {displayedNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            border rounded-lg p-4 shadow-lg animate-slideIn
            ${getColor(notification.type)}
          `}
        >
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">{getIcon(notification.type)}</span>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{notification.title}</h3>
              <p className="text-sm opacity-90 break-words">{notification.message}</p>

              {notification.action && (
                <button
                  onClick={() => {
                    notification.action?.onClick();
                    onDismiss?.(notification.id);
                  }}
                  className="mt-2 text-sm font-semibold hover:underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => onDismiss?.(notification.id)}
              className="flex-shrink-0 text-lg opacity-50 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>

          {/* 자동 사라짐 진행 표시줄 */}
          <div
            className="mt-2 h-1 bg-current opacity-30 rounded-full"
            style={{
              animation: `shrink ${notification.duration || 5000}ms linear forwards`,
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [
      ...prev,
      {
        ...notification,
        id,
      },
    ]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
  };
}
