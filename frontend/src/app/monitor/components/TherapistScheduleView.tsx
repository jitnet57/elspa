'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import BookingModal from './BookingModal';

/**
 * 📌 컴포넌트: TherapistScheduleView
 * 📋 목적: 테라피스트 일일 스케줄(Gantt) ⇄ BOOKING WITH THERAPIST(테이블) 전환
 * 🎨 레이아웃: 날짜 선택기 + 뷰 토글(📅 스케줄 / 📋 예약표) + Start New Massage
 * 📅 작성일: 2026-05-28 / 개정: 2026-05-31 (뷰 전환 토글 추가)
 */

// 동적 임포트: SSR 이슈 방지
const TherapistScheduleGantt = dynamic(
  () => import('@/app/admin/massage/components/TherapistScheduleGantt'),
  { ssr: false, loading: () => <div className="text-gray-400 py-8 text-center">로딩 중...</div> }
);

type ViewMode = 'gantt' | 'table';

export default function TherapistScheduleView({ realtimeData }: { realtimeData?: any }) {
  const defaultDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="flex-1 overflow-auto px-3 py-4 flex flex-col">
      {/* 상단 컨트롤 바 */}
      <div className="mb-4 flex flex-wrap items-center gap-3 px-3">
        {/* 날짜 선택 */}
        <label htmlFor="schedule-date" className="text-sm font-semibold text-gray-300 whitespace-nowrap">
          📅 날짜:
        </label>
        <input
          id="schedule-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-indigo-500/50 text-white text-sm focus:outline-none focus:border-indigo-400 transition"
        />

        {/* 뷰 전환 토글: 스케줄(Gantt) ⇄ 예약표(Table) */}
        <div className="ml-2 inline-flex rounded-lg overflow-hidden border border-slate-600">
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-4 py-2 text-sm font-bold transition ${
              viewMode === 'gantt' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            📅 Daily Schedule
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm font-bold transition ${
              viewMode === 'table' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            📋 Booking Table
          </button>
        </div>

        {/* Start New Massage (image1의 3단계 버튼) */}
        <button
          onClick={() => setShowBooking(true)}
          className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition whitespace-nowrap"
        >
          + Start New Massage
        </button>
      </div>

      {/* 본문: 모드에 따라 Gantt 또는 예약 테이블 */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'gantt' ? (
          <TherapistScheduleGantt />
        ) : (
          // 예약 테이블 모드: image2와 동일 구성(BookingModal)
          <BookingModal onClose={() => setViewMode('gantt')} />
        )}
      </div>

      {/* Start New Massage → 예약 등록 모달 */}
      {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
    </div>
  );
}
