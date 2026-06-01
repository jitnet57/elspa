'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDriverStore } from '@/lib/store/driver-store';

// ============================================================
// 📌 드라이버 WebSocket 훅
// 📋 목적: 실시간 위치 업데이트, 예약 알림, 상태 동기화
// 📅 작성일: 2026-05-24
// ============================================================

interface LocationUpdateMessage {
  type: 'location_update';
  driver_id: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface BookingNotificationMessage {
  type: 'booking_notification';
  event: 'assigned' | 'accepted' | 'started' | 'completed';
  driver_id: number;
  booking_id: number;
  data?: any;
  timestamp: string;
}

interface ConnectionMessage {
  type: 'connection_established' | 'pong';
  driver_id?: number;
  status?: string;
  timestamp: string;
}

type WebSocketMessage = LocationUpdateMessage | BookingNotificationMessage | ConnectionMessage;

export function useDriverWebSocket(driverId: number | null, enabled: boolean = true) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  const { updateLocation, fetchTodayBookings } = useDriverStore();

  const connectWebSocket = useCallback(() => {
    if (!driverId || !enabled || ws.current?.readyState === WebSocket.OPEN) return;

    // 백엔드(WS 서버) 미설정 시 연결 시도 안 함 (localhost 에러 방지)
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || '';
    if (!wsBase) return;
    const wsUrl = `${wsBase}/api/driver/ws/${driverId}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`🔄 드라이버 WebSocket 연결 (ID: ${driverId})`);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;
      };

      ws.current.onmessage = async (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'location_update') {
            // 위치 업데이트 메시지
            const loc = message as LocationUpdateMessage;
            console.log(`📍 위치 업데이트 (${loc.latitude}, ${loc.longitude})`);
            // 상태는 클라이언트가 직접 관리 (REST API로 저장)
          } else if (message.type === 'booking_notification') {
            // 예약 알림 메시지
            const notif = message as BookingNotificationMessage;
            console.log(`📢 예약 알림: ${notif.event} (ID: ${notif.booking_id})`);

            // 배정 알림 시 예약 목록 새로고침
            if (notif.event === 'assigned') {
              await fetchTodayBookings();
            }
          } else if (message.type === 'connection_established') {
            // 연결 수립 확인
            console.log(`✅ WebSocket 연결 확립`);
          }
        } catch (err) {
          console.error('WebSocket 메시지 파싱 에러:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket 에러:', error);
      };

      ws.current.onclose = () => {
        console.log('🔌 WebSocket 연결 해제');
        // 자동 재연결
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          setTimeout(() => {
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
            connectWebSocket();
          }, reconnectDelay.current);
        } else {
          console.warn('❌ WebSocket 재연결 실패 (최대 시도 횟수 초과)');
        }
      };
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  }, [driverId, enabled, updateLocation, fetchTodayBookings]);

  // 위치 업데이트 메시지 전송
  const sendLocationUpdate = useCallback((latitude: number, longitude: number, accuracy?: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'location_update',
        latitude,
        longitude,
        accuracy,
      };
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // 헬스 체크 (ping/pong)
  const sendPing = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // 연결 초기화
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  return {
    isConnected: ws.current?.readyState === WebSocket.OPEN,
    sendLocationUpdate,
    sendPing,
  };
}
