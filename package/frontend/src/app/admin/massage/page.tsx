'use client';

import React, { useState } from 'react';
import MassageScheduleTable from './components/MassageScheduleTable';
import BedGroupingSettings from './components/BedGroupingSettings';
import MassageTypeSettings from './components/MassageTypeSettings';

/**
 * 📌 페이지: MassageBookingPage
 * 📋 목적: 마사지 예약 및 침대 관리 통합 페이지
 * 🎨 레이아웃: 탭 기반 (스케줄, 그룹 설정, 마사지 종류)
 * 📅 작성일: 2026-05-28
 */

export default function MassageBookingPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'grouping' | 'types'>('schedule');

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      {/* 탭 네비게이션 */}
      <div className="flex gap-4 px-6 py-4 border-b border-slate-700 bg-slate-900">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-2 font-bold rounded-lg transition ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-gray-300 hover:text-white'
          }`}
        >
          📅 마사지 스케줄
        </button>
        <button
          onClick={() => setActiveTab('grouping')}
          className={`px-6 py-2 font-bold rounded-lg transition ${
            activeTab === 'grouping'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-gray-300 hover:text-white'
          }`}
        >
          🛏️ 침대 그룹 설정
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`px-6 py-2 font-bold rounded-lg transition ${
            activeTab === 'types'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-gray-300 hover:text-white'
          }`}
        >
          💆 마사지 종류
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'schedule' && <MassageScheduleTable />}
        {activeTab === 'grouping' && <BedGroupingSettings />}
        {activeTab === 'types' && <MassageTypeSettings />}
      </div>
    </div>
  );
}
