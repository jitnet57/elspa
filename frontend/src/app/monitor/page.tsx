'use client';

import { useState } from 'react';
import { useT, useLang, setLang } from '@/lib/i18n';
import BedLayoutView from './components/BedLayoutView';
import DailyTherapistSchedule from './components/DailyTherapistSchedule';
import BookingSheetTable from './components/BookingSheetTable';
import AttendanceView from './components/AttendanceView';

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
  const [activeTab, setActiveTab] = useState<'beds' | 'schedule' | 'booking' | 'attendance'>('booking');
  const t = useT();
  const lang = useLang();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('beds')}
              className={`px-4 py-1 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'beds' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              🛏️ {t('Real-time Bed Mode', '실시간 베드 모드')}
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-1 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              📅 {t('Therapist Daily Schedule', '테라피스트 일일 스케줄')}
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-4 py-1 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'booking'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              📊 {t('BOOKING WITH THERAPIST', '테라피스트 예약')}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-1 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              👥 {t('Attendance', '출결')}
            </button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-lg font-bold text-sm ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>EN</button>
            <button onClick={() => setLang('ko')} className={`px-3 py-1 rounded-lg font-bold text-sm ${lang === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>KO</button>
            <button className="p-1 text-gray-600 hover:text-gray-800">⚙️</button>
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
        {/* 출결 — 전 직원(6직군) 출근/퇴근/결근 체크 */}
        {activeTab === 'attendance' && <AttendanceView />}
      </div>
    </div>
  );
}
