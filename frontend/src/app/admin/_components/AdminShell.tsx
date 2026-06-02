'use client';

import Link from 'next/link';
import React from 'react';
import { useAdminGate } from '@/lib/store/admin-gate-store';
import { useT } from '@/lib/i18n';

// ============================================================
// 📌 컴포넌트명: AdminShell
// 📋 목적: 관리자 대시보드 레이아웃 (사이드바 + 헤더 + 메인)
// 🔧 기능: 네비게이션 드로어, 로그아웃 버튼
// 📅 작성일: 2026-05-28
// ============================================================

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const { logout } = useAdminGate();
  const t = useT();

  return (
    <div className="min-h-screen bg-[#0c1324] bg-[radial-gradient(circle_at_top_right,_#1e1b4b,_#0c1324_60%)] text-[#dce1fb] font-sans antialiased relative pb-16">

      {/* 우주 은하 안개 백그라운드 효과 */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600 top-[-200px] right-[-100px] filter blur-[120px] opacity-10 -z-10 pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600 bottom-[-200px] left-[-100px] filter blur-[120px] opacity-10 -z-10 pointer-events-none"></div>

      {/* Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[280px] bg-slate-900/40 backdrop-blur-xl border-r border-indigo-500/10 shadow-2xl shadow-black/50 z-50 p-6 overflow-hidden">
        <div className="flex flex-col gap-4 min-h-0 flex-1">
          <div className="px-4 py-6 flex-shrink-0">
            <h2 className="text-3xl font-black text-[#8aebff] tracking-tighter drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">ELSPA</h2>
            <p className="text-[10px] font-mono text-indigo-300/60 tracking-widest mt-1 uppercase">Command Center</p>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent pr-1">
            {/* Dashboard */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-[#8aebff] bg-white/10 border-l-2 border-[#8aebff] shadow-[0_0_15px_rgba(34,211,238,0.2)]" href="/admin">
              <span className="text-lg">📊</span>
              <span className="text-sm">Dashboard</span>
            </Link>

            {/* Knowledge Network */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin?tab=knowledge-network">
              <span className="text-lg">🧠</span>
              <span className="text-sm">Knowledge Network</span>
            </Link>

            {/* 경영지표 */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/management">
              <span className="text-lg">📈</span>
              <span className="text-sm">{t('Business Metrics', '경영지표')}</span>
            </Link>

            {/* 비용 (Daily Reporting · 지출 원장) */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/expense">
              <span className="text-lg">💸</span>
              <span className="text-sm">{t('Expenses', '비용')}</span>
            </Link>

            {/* Payroll */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/payroll">
              <span className="text-lg">💰</span>
              <span className="text-sm">Payroll</span>
            </Link>

            {/* 공제/선지급 관리 */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/deductions">
              <span className="text-lg">💸</span>
              <span className="text-sm">{t('Deductions / Advances', '공제/선지급 관리')}</span>
            </Link>

            {/* 월정산 */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/monthly-settlement">
              <span className="text-lg">📅</span>
              <span className="text-sm">{t('Monthly Settlement', '월정산')}</span>
            </Link>

            {/* 정산 리포트 */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/settlement-report">
              <span className="text-lg">📊</span>
              <span className="text-sm">{t('Settlement Report', '정산 리포트')}</span>
            </Link>

            {/* Settings */}
            <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300/70 hover:text-white hover:bg-white/5 transition-all" href="/admin/settings">
              <span className="text-lg">⚙️</span>
              <span className="text-sm">Settings</span>
            </Link>

            {/* Settings Submenu */}
            <div className="ml-3 space-y-1 border-l border-indigo-500/20 pl-3">
              <Link className="flex items-center gap-3 px-4 py-2 rounded-lg text-indigo-300/60 hover:text-indigo-300 hover:bg-white/3 transition-all text-sm" href="/admin/settings/import">
                <span className="text-lg">📥</span>
                <span className="text-xs">Import Data</span>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-2 rounded-lg text-indigo-300/60 hover:text-indigo-300 hover:bg-white/3 transition-all text-sm" href="/admin/policies">
                <span className="text-lg">📋</span>
                <span className="text-xs">Policies</span>
              </Link>
              <Link className="flex items-center gap-3 px-4 py-2 rounded-lg text-indigo-300/60 hover:text-indigo-300 hover:bg-white/3 transition-all text-sm" href="/admin/audit-logs">
                <span className="text-lg">📊</span>
                <span className="text-xs">Audit Logs</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex-shrink-0 mt-4">
          <div className="flex items-center gap-3">
            <img alt={t('Admin', '관리자')} className="w-10 h-10 rounded-full border border-cyan-500/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-Zy8obKMQ4KCOYGq9VIYlInzuOjEWliz7MAm1b9M5EEj61q1lo_2sCRiGkqfcKFDnZjkwYMvbTZHOg2smiDIkZDWTwUpaCQk-oX6O0iXV1zHd1WgoZFvVOp48yI6TmwNqLqIIqVWp_S_QBwxAPp62YS_LzVshm44scATwlDBlPFAtUD82Uo44NHlxPnEPZFBXmYfzAZJcRzB7KKQ9mII2ooy_6pSlDZHBruhDIHh_RkDrzvLV2QPWnD4iw7G2YybILo_B44PhxT-d"/>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate text-white">Admin User</p>
              <p className="text-[9px] font-mono text-cyan-400">v2.0.5 • 2026-05-28 13:23</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 lg:ml-[280px] pb-24 lg:pb-8">

        {/* TopAppBar */}
        <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-40 bg-slate-950/40 backdrop-blur-md border-b border-indigo-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#8aebff]">security</span>
            <h2 className="text-lg sm:text-xl font-black tracking-tighter text-[#8aebff] drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">
              ELSPA CONTROL
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-all font-mono text-[9px] font-black tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              LOGOUT
            </button>
          </div>
        </header>

        {/* Content Area */}
        {children}

        {/* Mobile Navigation Footer */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-indigo-500/10 z-50">
          <div className="flex justify-around items-stretch">
            <Link href="/admin" className="flex flex-col items-center justify-center flex-1 py-3 text-[#8aebff] hover:bg-white/5 transition-all text-[10px] font-bold">
              <span className="text-xl">📊</span>
              <span className="mt-1">Dashboard</span>
            </Link>
            <Link href="/admin/payroll" className="flex flex-col items-center justify-center flex-1 py-3 text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold">
              <span className="text-xl">💰</span>
              <span className="mt-1">Payroll</span>
            </Link>
            <Link href="/admin/settings" className="flex flex-col items-center justify-center flex-1 py-3 text-indigo-300/60 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold">
              <span className="text-xl">⚙️</span>
              <span className="mt-1">Settings</span>
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}
