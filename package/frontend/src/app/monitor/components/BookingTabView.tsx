'use client';

import dynamic from 'next/dynamic';

/**
 * 📌 컴포넌트: BookingTabView
 * 📋 목적: 마사지 예약 현황을 테이블 형식으로 표시
 * 🎨 레이아웃: 테라피스트, 서비스, 시간, 손님명, 룸, 상태 컬럼
 * 📅 작성일: 2026-05-28
 */

// 동적 임포트: SSR 호환성
const MassageScheduleTable = dynamic(
  () => import('@/app/admin/massage/components/MassageScheduleTable'),
  { ssr: false, loading: () => <div className="text-gray-400 py-8 text-center">로딩 중...</div> }
);

export default function BookingTabView() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white">💆 마사지 예약 현황</h2>
        </div>

        {/* 테이블 래퍼 */}
        <div className="overflow-x-auto">
          <MassageScheduleTable />
        </div>
      </div>
    </div>
  );
}
