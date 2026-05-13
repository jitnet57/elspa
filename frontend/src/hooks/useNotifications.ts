/**
 * Hook: useNotifications
 *
 * 목적: 알림 시스템 관리
 * 사용: useNotifications() → 알림 조회/추가/제거
 */

'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/store/store';

/**
 * 전체 알림 관리
 */
export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearNotifications,
  } = useStore();

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearNotifications,
  };
};

/**
 * 알림 추가 헬퍼 (편의용)
 */
export const useAddNotification = () => {
  const { addNotification } = useStore();

  return {
    success: useCallback(
      (message: string) => {
        addNotification({
          type: 'match_ready',
          message,
          severity: 'success',
        });
      },
      [addNotification]
    ),

    error: useCallback(
      (message: string) => {
        addNotification({
          type: 'error',
          message,
          severity: 'error',
        });
      },
      [addNotification]
    ),

    warning: useCallback(
      (message: string) => {
        addNotification({
          type: 'session_ending',
          message,
          severity: 'warning',
        });
      },
      [addNotification]
    ),

    info: useCallback(
      (message: string) => {
        addNotification({
          type: 'wait_alert',
          message,
          severity: 'info',
        });
      },
      [addNotification]
    ),

    sessionEnding: useCallback(
      (bedNumber: number, remainingMinutes: number) => {
        addNotification({
          type: 'session_ending',
          message: `침대 ${bedNumber} 세션이 ${remainingMinutes}분 후 종료됩니다.`,
          severity: 'warning',
        });
      },
      [addNotification]
    ),

    matchReady: useCallback(
      (therapistName: string, bedNumber: number) => {
        addNotification({
          type: 'match_ready',
          message: `${therapistName}님이 침대 ${bedNumber}에 준비되었습니다.`,
          severity: 'success',
        });
      },
      [addNotification]
    ),

    checkIn: useCallback(
      (therapistName: string) => {
        addNotification({
          type: 'check_in',
          message: `${therapistName}님이 체크인했습니다.`,
          severity: 'info',
        });
      },
      [addNotification]
    ),

    waitAlert: useCallback(
      (customerName: string, estimatedMinutes: number) => {
        addNotification({
          type: 'wait_alert',
          message: `${customerName}님 예상 대기시간: ${estimatedMinutes}분`,
          severity: 'info',
        });
      },
      [addNotification]
    ),
  };
};

/**
 * 읽지 않은 알림 관리
 */
export const useUnreadNotifications = () => {
  const { notifications, markAsRead } = useStore();
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return {
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    markAsRead,
  };
};

/**
 * 특정 타입의 알림만 조회
 */
export const useNotificationsByType = (type: string) => {
  const { notifications } = useStore();
  return notifications.filter(n => n.type === type);
};

/**
 * 최근 알림 조회
 */
export const useRecentNotifications = (limit: number = 5) => {
  const { notifications } = useStore();
  return notifications.slice(0, limit);
};
