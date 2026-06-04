'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useT, useLang, setLang } from '@/lib/i18n';
import BedLayoutView from './components/BedLayoutView';
import DailyTherapistSchedule from './components/DailyTherapistSchedule';
import BookingSheetTable from './components/BookingSheetTable';
import AttendanceView from './components/AttendanceView';

/**
 * ============================================================
 * 📌 컴포넌트: MonitorContent
 * 📋 목적: Monitor 페이지 메인 콘텐츠 (Suspense 경계 내부)
 * 🔄 URL 기반 탭 관리:
 *   - /monitor?tab=booking (기본)
 *   - /monitor?tab=beds
 *   - /monitor?tab=schedule
 *   - /monitor?tab=attendance
 * 📅 작성일: 2026-06-04
 * ============================================================
 */

export default function MonitorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get('tab') as 'beds' | 'schedule' | 'booking' | 'attendance') || 'booking';
  const activeTab = tab;

  const setActiveTab = (newTab: 'beds' | 'schedule' | 'booking' | 'attendance') => {
    router.push(`/monitor?tab=${newTab}`);
  };

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
        {activeTab === 'schedule' && <DailyTherapistSchedule key="schedule" />}
        {activeTab === 'booking' && <BookingSheetTable />}
        {activeTab === 'attendance' && <AttendanceView />}
      </div>
    </div>
  );
}
