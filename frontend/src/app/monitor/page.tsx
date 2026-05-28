'use client';

import { useState, useEffect } from 'react';
import BedLayoutView from './components/BedLayoutView';
import TherapistScheduleView from './components/TherapistScheduleView';
import BookingModal from './components/BookingModal';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

/**
 * ============================================================
 * 📌 페이지: Monitor
 * 📋 목적: 실시간 침대 상태, 테라피스트 스케줄, 예약 관리 통합 모니터
 * 🎨 탭: Real-time Bed Mode, Therapist Daily Schedule, BOOKING WITH THERAPIST
 * 📅 작성일: 2026-05-28
 * ============================================================
 *
 * 기능:
 *   - WebSocket 실시간 동기화 (침대/예약/테라피스트)
 *   - 연결 상태 표시 (Green: connected, Red: disconnected)
 *   - 새 데이터 받으면 로컬 상태 업데이트
 */

export default function MonitorPage() {
  const [activeTab, setActiveTab] = useState<'beds' | 'schedule' | 'booking'>('beds');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // ============================================================
  // WebSocket 실시간 동기화 Hook
  // ============================================================

  const { isConnected, isConnecting } = useRealtimeSync({
    onBedStatusChanged: (data) => {
      console.log('🔄 침대 상태 변경 수신:', data);
      setRealtimeData((prev: any) => ({
        ...prev,
        bedUpdate: {
          type: 'bed_status_changed',
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    },
    onBookingAdded: (data) => {
      console.log('🔄 새 예약 수신:', data);
      setRealtimeData((prev: any) => ({
        ...prev,
        bookingUpdate: {
          type: 'booking_added',
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    },
    onBookingCompleted: (data) => {
      console.log('🔄 예약 완료 수신:', data);
      setRealtimeData((prev: any) => ({
        ...prev,
        bookingUpdate: {
          type: 'booking_completed',
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    },
    onBookingCancelled: (data) => {
      console.log('🔄 예약 취소 수신:', data);
      setRealtimeData((prev: any) => ({
        ...prev,
        bookingUpdate: {
          type: 'booking_cancelled',
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    },
    onTherapistCheckin: (data) => {
      console.log('🔄 테라피스트 체크인 수신:', data);
      setRealtimeData((prev: any) => ({
        ...prev,
        therapistUpdate: {
          type: 'therapist_checkin',
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    },
    onTherapistCheckout: (data) => {
      console.log('🔄 테라피스트 체크아웃 수신:', data);
      setRealtimeData((prev: any) => ({
        ...prev,
        therapistUpdate: {
          type: 'therapist_checkout',
          data,
          timestamp: new Date().toISOString(),
        },
      }));
    },
  });

  // ============================================================
  // 연결 상태 업데이트
  // ============================================================

  useEffect(() => {
    if (isConnecting) {
      setConnectionStatus('connecting');
    } else if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, isConnecting]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          {/* WebSocket 연결 상태 표시 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-600">
              {connectionStatus === 'connected'
                ? '🟢 Connected'
                : connectionStatus === 'connecting'
                  ? '🟡 Connecting...'
                  : '🔴 Disconnected'}
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('beds')}
              className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'beds'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🛏️ Real-time Bed Mode
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              📅 Therapist Daily Schedule
            </button>
            <button
              onClick={() => {
                setActiveTab('booking');
                setShowBookingModal(true);
              }}
              className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'booking'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              📊 BOOKING WITH THERAPIST
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">EN</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold">KO</button>
            <button className="p-2 text-gray-600 hover:text-gray-800">⚙️</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {/* 실시간 데이터를 자식 컴포넌트로 전달 */}
        {activeTab === 'beds' && <BedLayoutView realtimeData={realtimeData} />}
        {activeTab === 'schedule' && <TherapistScheduleView realtimeData={realtimeData} />}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal onClose={() => setShowBookingModal(false)} />
      )}

      {/* Debug Info (개발 중 상태 확인용) */}
      {process.env.NODE_ENV === 'development' && realtimeData && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-3 rounded-lg max-w-xs max-h-32 overflow-y-auto">
          <p className="font-bold mb-1">📡 Realtime Update:</p>
          <pre>{JSON.stringify(realtimeData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
