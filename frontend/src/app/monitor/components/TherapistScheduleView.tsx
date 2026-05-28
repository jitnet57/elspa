'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

/**
 * 📌 컴포넌트: TherapistScheduleView
 * 📋 목적: 테라피스트 일일 스케줄을 Gantt 차트로 표시
 * 🎨 레이아웃: 날짜 선택기 + 시간별 예약 현황 (08:00~18:00)
 * 📅 작성일: 2026-05-28
 */

// 동적 임포트: SSR 이슈 방지
const TherapistScheduleGantt = dynamic(
  () => import('@/app/admin/massage/components/TherapistScheduleGantt'),
  { ssr: false, loading: () => <div className="text-gray-400 py-8 text-center">로딩 중...</div> }
);

export default function TherapistScheduleView() {
  // 기본값: 오늘 날짜
  const defaultDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  return (
    <div className="flex-1 overflow-auto px-6 py-4 flex flex-col">
      {/* 날짜 선택기 */}
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="schedule-date" className="text-sm font-semibold text-gray-300">
          📅 날짜 선택:
        </label>
        <input
          id="schedule-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-indigo-500/50 text-white text-sm focus:outline-none focus:border-indigo-400 transition"
        />
        <span className="text-xs text-gray-400 ml-2">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Gantt 차트 */}
      <div className="flex-1 overflow-auto border border-white/10 rounded-lg bg-white/5 backdrop-blur-xl">
        <TherapistScheduleGantt />
      </div>
    </div>
  );
}
