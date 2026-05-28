// ============================================================
// 📌 네트워크 WebSocket 훅
// 📋 목적: FastAPI WebSocket 서버와 실시간 동기화
// 🔧 기능: 엣지 추가/삭제, 실시간 업데이트, 자동 재연결
// 📅 작성일: 2025-05-29
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react';

export interface NetworkMessage {
  type: 'edge_added' | 'edge_deleted' | 'node_added' | 'init' | 'error';
  data?: any;
  timestamp?: string;
}

export interface UseNetworkWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: NetworkMessage) => void;
  onError?: (error: Event | Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// ============================================================
// 🔌 useNetworkWebSocket Hook
// ============================================================
export function useNetworkWebSocket(options: UseNetworkWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/network',
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<NetworkMessage[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // ============================================================
  // 📡 WebSocket 연결
  // ============================================================
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // 환경에 맞춰 URL 조정
      let wsUrl = url;
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        if (url.startsWith('ws')) {
          wsUrl = url;
        } else {
          wsUrl = `${protocol}//${window.location.host}${url}`;
        }
      }

      wsRef.current = new WebSocket(wsUrl);

      // 연결 성공
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket 연결됨:', wsUrl);
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectCountRef.current = 0;

        // 메시지 큐 처리
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
          }
        }

        onConnect?.();
      };

      // 메시지 수신
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as NetworkMessage;
          console.log('📨 WebSocket 메시지:', message);
          onMessage?.(message);
        } catch (error) {
          console.error('❌ 메시지 파싱 에러:', error);
        }
      };

      // 에러 처리
      wsRef.current.onerror = (event) => {
        console.error('❌ WebSocket 에러:', event);
        onError?.(event);
      };

      // 연결 종료
      wsRef.current.onclose = () => {
        console.log('❌ WebSocket 연결 종료');
        setIsConnected(false);
        onDisconnect?.();

        // 자동 재연결
        if (reconnectCountRef.current < maxReconnectAttempts) {
          setIsReconnecting(true);
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 WebSocket 재연결 시도 (${reconnectCountRef.current}/${maxReconnectAttempts})`);
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket 연결 에러:', error);
      onError?.(error as Error);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onError, onConnect, onDisconnect]);

  // ============================================================
  // 📤 메시지 전송
  // ============================================================
  const send = useCallback((message: NetworkMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 메시지 전송:', message);
    } else {
      // 연결 안 되면 큐에 저장
      messageQueueRef.current.push(message);
      console.log('📋 메시지 대기열에 추가:', message);
    }
  }, []);

  // ============================================================
  // 🔌 연결 해제
  // ============================================================
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsReconnecting(false);
  }, []);

  // ============================================================
  // 🔄 재연결 강제 시도
  // ============================================================
  const reconnect = useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // ============================================================
  // 🎯 초기 연결
  // ============================================================
  useEffect(() => {
    if (autoConnect && typeof window !== 'undefined') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isReconnecting,
    send,
    disconnect,
    reconnect,
  };
}

// ============================================================
// 🎯 Edge 추가 메시지 생성
// ============================================================
export function createEdgeAddedMessage(edge: {
  source: string;
  target: string;
  weight?: number;
  type?: string;
}): NetworkMessage {
  return {
    type: 'edge_added',
    data: edge,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// 🎯 Edge 삭제 메시지 생성
// ============================================================
export function createEdgeDeletedMessage(sourceId: string, targetId: string): NetworkMessage {
  return {
    type: 'edge_deleted',
    data: { source: sourceId, target: targetId },
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// 🎯 Node 추가 메시지 생성
// ============================================================
export function createNodeAddedMessage(node: {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  z?: number;
}): NetworkMessage {
  return {
    type: 'node_added',
    data: node,
    timestamp: new Date().toISOString(),
  };
}
