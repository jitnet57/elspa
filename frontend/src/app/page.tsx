'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Settings } from 'lucide-react';
import DeploymentBadge from '@/components/DeploymentBadge';

// ============================================================
// 📌 컴포넌트명: Home (ElSpa 랜딩 페이지)
// 📋 목적: Monitor/Admin 선택 메뉴
// 🔧 기능: 클릭 시 해당 페이지로 이동
// 📅 작성일: 2026-06-03
// ============================================================
export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white font-sans flex flex-col items-center justify-center p-4">
      {/* 배포 배지 (상단 우측) */}
      <div className="absolute top-4 right-4">
        <DeploymentBadge />
      </div>

      <div className="text-center space-y-12 max-w-2xl">
        {/* 헤더 */}
        <div className="space-y-4">
          <div className="text-6xl md:text-7xl font-black">💆</div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            ElSpa
          </h1>
          <p className="text-lg text-indigo-300/80">마사지 샵 통합 관리 시스템</p>
        </div>

        {/* 메뉴 버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monitor 버튼 */}
          <button
            onClick={() => router.push('/monitor')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/50"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <div className="relative space-y-4">
              <div className="text-5xl">📊</div>
              <h2 className="text-2xl font-bold">Monitor</h2>
              <p className="text-indigo-200 text-sm">BOOKING WITH THERAPIST<br />예약 관리 및 테라피스트 스케줄</p>
              <div className="pt-4 flex items-center justify-center gap-2 text-indigo-200 group-hover:text-white transition-colors">
                <BarChart3 size={18} />
                <span className="text-sm font-semibold">예약표 보기 →</span>
              </div>
            </div>
          </button>

          {/* Admin 버튼 */}
          <button
            onClick={() => router.push('/admin')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 p-8 transition-all hover:shadow-2xl hover:shadow-pink-500/50"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            <div className="relative space-y-4">
              <div className="text-5xl">⚙️</div>
              <h2 className="text-2xl font-bold">Admin</h2>
              <p className="text-pink-200 text-sm">관리자 대시보드<br />설정, 마사지 종류, 비용 관리</p>
              <div className="pt-4 flex items-center justify-center gap-2 text-pink-200 group-hover:text-white transition-colors">
                <Settings size={18} />
                <span className="text-sm font-semibold">설정 페이지 →</span>
              </div>
            </div>
          </button>
        </div>

        {/* 푸터 */}
        <div className="pt-8 border-t border-white/10 text-xs text-slate-400">
          <p>v1.0.0 | {new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
    </div>
  );
}

