'use client';

import { useState } from 'react';
import BedLayoutView from './components/BedLayoutView';
import DailyTherapistSchedule from './components/DailyTherapistSchedule';
import BookingSheetTable from './components/BookingSheetTable';

/**
 * ============================================================
 * 📌 페이지: Monitor
 * 📋 목적: 침대 상태, 테라피스트 스케줄, 예약 관리 통합 모니터
 * 🎨 탭: Real-time Bed Mode, Therapist Daily Schedule, BOOKING WITH THERAPIST
 * 📅 작성일: 2026-05-28 / 개정: 2026-05-31
 * ============================================================
 *
 * 데이터 동기화:
 *   - ❌ WebSocket/실시간 연결 제거 (백엔드 불필요)
 *   - ✅ 5초 폴링으로 Supabase에서 직접 조회 (useGetBeds / useGetTherapists)
 *   - ✅ 변경 즉시 Supabase 저장, 1시간 단위 Google Sheet 백업(Apps Script)
 */

export default function MonitorPage() {
  const [activeTab, setActiveTab] = useState<'beds' | 'schedule' | 'booking'>('beds');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          {/* 폴링 기반 상태 표시 (WebSocket 제거) */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-600">🟢 Live (5s polling)</span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('beds')}
              className={`px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'beds' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:text-gray-800'
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
              onClick={() => setActiveTab('booking')}
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
        {/* 테라피스트 일일 스케줄 (타임라인, 이미지2) */}
        {activeTab === 'schedule' && <DailyTherapistSchedule key="schedule" />}
        {/* BOOKING WITH THERAPIST → 30행 예약 입력 화면 */}
        {activeTab === 'booking' && <BookingSheetTable />}
      </div>
    </div>
  );
}
