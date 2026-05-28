/**
 * ============================================================
 * 📌 Hook: useRealtimeSync
 * 📋 목적: WebSocket으로 Monitor 실시간 데이터 동기화
 * 🔧 포함: 자동 재연결, 하트비트, 에러 복구
 * 📅 작성일: 2026-05-28
 * ============================================================
 *
 * 메시지 타입:
 *   - bed_status_changed: 침대 상태 변경
 *   - booking_added: 새 예약 추가
 *   - booking_completed: 예약 완료
 *   - booking_cancelled: 예약 취소
 *   - therapist_checkin: 테라피스트 체크인
 *   - therapist_checkout: 테라피스트 체크아웃
 *   - heartbeat: 하트비트 (30초마다 자동)
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================
// 타입 정의
// ============================================================

interface BedStatusChangedData {
  bedId: number;
  status: 'available' | 'occupied' | 'cleaning';
  customerId?: number;
  customerName?: string;
  therapistId?: number;
  therapistName?: string;
  serviceName?: string;
  startsAt?: string;
  endsAt?: string;
}

interface BookingAddedData {
  bookingId: number;
  bedId: number;
  customerId: number;
  customerName: string;
  therapistId: number;
  therapistName: string;
  serviceName: string;
  serviceMinutes: number;
  servicePrice: number;
  startsAt: string;
  endsAt: string;
}

interface BookingCompletedData {
  bookingId: number;
  bedId: number;
}

interface BookingCancelledData {
  bookingId: number;
  bedId: number;
  reason?: string;
}

interface TherapistCheckinData {
  therapistId: number;
  therapistName: string;
  checkInTime: string;
}

interface TherapistCheckoutData {
  therapistId: number;
  therapistName: string;
  checkOutTime: string;
}

export type RealtimeMessageType =
  | 'bed_status_changed'
  | 'booking_added'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'therapist_checkin'
  | 'therapist_checkout'
  | 'heartbeat'
  | 'connected'
  | 'pong'
  | 'sync_request';

interface WebSocketMessage {
  type: RealtimeMessageType;
  data?: any;
  timestamp?: string;
}

interface UseRealtimeSyncOptions {
  enabled?: boolean;
  onBedStatusChanged?: (data: BedStatusChangedData) => void;
  onBookingAdded?: (data: BookingAddedData) => void;
  onBookingCompleted?: (data: BookingCompletedData) => void;
  onBookingCancelled?: (data: BookingCancelledData) => void;
  onTherapistCheckin?: (data: TherapistCheckinData) => void;
  onTherapistCheckout?: (data: TherapistCheckoutData) => void;
}

interface UseRealtimeSyncReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastUpdate: string | null;
  send: (message: WebSocketMessage) => void;
  disconnect: () => void;
}

// ============================================================
// Hook: useRealtimeSync
// ============================================================

/**
 * Monitor 실시간 동기화 Hook
 *
 * 사용 예시:
 * ```typescript
 * const { isConnected, send } = useRealtimeSync({
 *   onBedStatusChanged: (data) => {
 *     console.log('침대 상태 변경:', data);
 *     // UI 업데이트 로직
 *   },
 *   onBookingAdded: (data) => {
 *     console.log('새 예약:', data);
 *   },
 * });
 * ```
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions = {}): UseRealtimeSyncReturn {
  const { enabled = true, ...callbacks } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // ============================================================
  // WebSocket 연결 함수
  // ============================================================

  const connect = useCallback(() => {
    if (!enabled || isConnecting) return;

    setIsConnecting(true);

    try {
      // WebSocket URL 구성 (프로토콜 자동 선택)
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
      const wsUrl = `${protocol}//${host}/ws/monitor`;

      console.log(`🔌 Monitor WebSocket 연결 중... (${wsUrl})`);
      wsRef.current = new WebSocket(wsUrl);

      // ============================================================
      // WebSocket 이벤트 핸들러
      // ============================================================

      wsRef.current.onopen = () => {
        console.log('✅ Monitor WebSocket 연결됨');
        setIsConnected(true);
        setIsConnecting(false);

        // 하트비트 전송 (30초마다)
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
          setLastUpdate(new Date().toISOString());
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 에러:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket 에러:', error);
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current.onclose = () => {
        console.warn('⚠️ Monitor WebSocket 연결 종료');
        setIsConnected(false);
        setIsConnecting(false);

        // 3초 후 자동 재연결
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Monitor WebSocket 재연결 시도...');
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      setIsConnecting(false);
    }
  }, [enabled, isConnecting]);

  // ============================================================
  // 메시지 핸들러
  // ============================================================

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'bed_status_changed':
        if (callbacks.onBedStatusChanged) {
          callbacks.onBedStatusChanged(message.data);
        }
        console.log('✅ 침대 상태 변경:', message.data);
        break;

      case 'booking_added':
        if (callbacks.onBookingAdded) {
          callbacks.onBookingAdded(message.data);
        }
        console.log('✅ 새 예약 추가:', message.data);
        break;

      case 'booking_completed':
        if (callbacks.onBookingCompleted) {
          callbacks.onBookingCompleted(message.data);
        }
        console.log('✅ 예약 완료:', message.data);
        break;

      case 'booking_cancelled':
        if (callbacks.onBookingCancelled) {
          callbacks.onBookingCancelled(message.data);
        }
        console.log('✅ 예약 취소:', message.data);
        break;

      case 'therapist_checkin':
        if (callbacks.onTherapistCheckin) {
          callbacks.onTherapistCheckin(message.data);
        }
        console.log('✅ 테라피스트 체크인:', message.data);
        break;

      case 'therapist_checkout':
        if (callbacks.onTherapistCheckout) {
          callbacks.onTherapistCheckout(message.data);
        }
        console.log('✅ 테라피스트 체크아웃:', message.data);
        break;

      case 'heartbeat':
        // 서버 연결 확인 - 응답 없음
        break;

      case 'connected':
        console.log('🎯 Monitor 대시보드 연결 확인:', message.data);
        break;

      case 'pong':
        // 핑-퐁 응답 확인
        break;

      default:
        console.warn('⚠️ 알 수 없는 메시지 타입:', message.type);
    }
  };

  // ============================================================
  // 메시지 전송 함수
  // ============================================================

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket이 연결되지 않았습니다');
    }
  }, []);

  // ============================================================
  // 연결 해제 함수
  // ============================================================

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
    setIsConnected(false);
  }, []);

  // ============================================================
  // 라이프사이클
  // ============================================================

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastUpdate,
    send,
    disconnect,
  };
}
