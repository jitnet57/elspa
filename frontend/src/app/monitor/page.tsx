'use client';

import { Suspense } from 'react';
import MonitorContent from './MonitorContent';

/**
 * ============================================================
 * 📌 페이지: Monitor
 * 📋 목적: 침대 상태, 테라피스트 스케줄, 예약 관리 통합 모니터
 * 🔄 URL 기반 탭 관리: /monitor?tab=booking|beds|schedule|attendance
 * 📅 작성일: 2026-05-28 / 개정: 2026-06-04
 * ============================================================
 */

export default function MonitorPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">로딩 중...</div>}>
      <MonitorContent />
    </Suspense>
  );
}
