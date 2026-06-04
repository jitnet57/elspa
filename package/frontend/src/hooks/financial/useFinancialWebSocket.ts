/**
 * 📌 useFinancialWebSocket Hook
 * 📋 목적: WebSocket으로 실시간 지출 업데이트 수신
 * 🔧 포함: 자동 재연결, 하트비트, 에러 복구
 */

import { useEffect, useRef, useCallback } from 'react';
import { useFinancialStore } from '@/lib/store/financial';

interface WebSocketMessage {
  type: 'expense_added' | 'expense_updated' | 'budget_changed' | 'budget_exceeded' | 'heartbeat';
  data?: any;
  timestamp?: string;
}

export function useFinancialWebSocket(enabled: boolean = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const store = useFinancialStore();

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/financial`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Financial WebSocket 연결됨');
        // 하트비트 전송 (30초마다)
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 에러:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket 에러:', error);
      };

      wsRef.current.onclose = () => {
        console.warn('⚠️ WebSocket 연결 종료');
        // 3초 후 자동 재연결
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 WebSocket 재연결 시도...');
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
    }
  }, [enabled]);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'expense_added':
        store.addExpense(message.data);
        console.log('✅ 새 지출 추가됨:', message.data);
        break;

      case 'expense_updated':
        store.updateExpense(message.data.id, message.data);
        console.log('✅ 지출 업데이트됨:', message.data);
        break;

      case 'budget_changed':
        store.setBudget(message.data);
        console.log('✅ 예산 변경됨:', message.data);
        break;

      case 'budget_exceeded':
        // 🚨 예산 초과 알림 (Sprint 12)
        console.warn('🚨 예산 초과 경고:', message.data);
        // LocalStorage에 알림 저장 (RealtimeNotification에서 읽음)
        if (typeof window !== 'undefined') {
          const notification = {
            id: `budget_exceeded_${Date.now()}`,
            type: 'budget_exceeded',
            title: '🚨 예산 초과',
            message: message.data?.message || '예산 한도를 초과했습니다.',
            duration: 10000, // 10초 표시
          };
          const existingNotifications = JSON.parse(
            localStorage.getItem('financial_notifications') || '[]'
          );
          localStorage.setItem(
            'financial_notifications',
            JSON.stringify([...existingNotifications, notification])
          );
          // BroadcastChannel로 다른 탭에 알림
          const channel = new BroadcastChannel('financial_alerts');
          channel.postMessage(notification);
        }
        break;

      case 'heartbeat':
        // 서버 연결 확인 - 응답 없음
        break;

      default:
        console.warn('⚠️ 알 수 없는 메시지 타입:', message.type);
    }
  };

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket이 연결되지 않았습니다');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    send,
  };
}
