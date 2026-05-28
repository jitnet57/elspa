'use client';

import { useState } from 'react';
import BedLayoutView from './components/BedLayoutView';
import TherapistScheduleView from './components/TherapistScheduleView';
import BookingModal from './components/BookingModal';

/**
 * 📌 페이지: Monitor
 * 📋 목적: 실시간 침대 상태, 테라피스트 스케줄, 예약 관리 통합 모니터
 * 🎨 탭: Real-time Bed Mode, Therapist Daily Schedule, BOOKING WITH THERAPIST
 * 📅 작성일: 2026-05-28
 */

export default function MonitorPage() {
  const [activeTab, setActiveTab] = useState<'beds' | 'schedule' | 'booking'>('beds');
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
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
        {activeTab === 'beds' && <BedLayoutView />}
        {activeTab === 'schedule' && <TherapistScheduleView />}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
}
