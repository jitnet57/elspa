'use client';

import { useState } from 'react';
import React from 'react';

// ============================================================
// 📌 컴포넌트명: Home (ElSpa 메인 게이트웨이 랜딩 페이지)
// 📋 목적: 초프리미엄 미드나잇 테마의 시스템 진입 게이트웨이 및 캐시 무효화 제어
// 🔧 기능: 캐시/로컬스토리지 소거 기능, 모니터/어드민 정적 라우팅(.html) 연결
// 📅 작성일: 2026-05-28
// ⚠️ 주의: Cloudflare Pages 정적 export 환경에서 404를 방지하기 위해 .html 주소 활용
// ============================================================
export default function Home() {
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // ============================================================
  // 📌 함수명: handleClearCache
  // 📋 목적: 서비스 워커, 로컬스토리지, IndexedDB를 완전 초기화하여 캐시 꼬임 방지
  // 📤 반환값: Promise<void>
  // ============================================================
  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // 1. 서비스 워커 캐시 스토리지 비우기
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // 2. 브라우저 스토리지 완전 초기화
      localStorage.clear();
      sessionStorage.clear();

      // 3. IndexedDB 데이터베이스 자동 삭제
      if ('indexedDB' in window) {
        const dbs = await window.indexedDB.databases?.() || [];
        dbs.forEach(db => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      }

      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);

      // 4. 화면 강제 리로드로 신규 캐시 적재 유도
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Cache clear error:', error);
      setCacheCleared(false);
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-white font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* 우주 안개 빛 효과 (Nebula Glow Backdrop) */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-slate-900/40 backdrop-blur-md border-b border-indigo-500/20 py-4 px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              💆
            </div>
            <div>
              <div className="text-xl font-black bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent tracking-tight">ELSPA</div>
              <p className="text-[10px] text-indigo-300/40 font-extrabold tracking-widest uppercase">Global Operations Gateway</p>
            </div>
            <span className="text-[10px] font-black bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full ml-3 uppercase">v 2.1.0</span>
          </div>
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 border active:scale-95 shadow-md ${
              cacheCleared
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : isClearingCache
                ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/50 text-orange-400 hover:shadow-orange-500/10'
            }`}
            title="Clear service worker cache and reload page"
          >
            {cacheCleared ? '✓ CACHE CLEARED' : isClearingCache ? '⏳ CLEARING...' : '🔄 FORCE CLEAR CACHE'}
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900/40 backdrop-blur-md border-b border-indigo-500/20 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.5)]">
              💆
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">ELSPA</div>
              <p className="text-[8px] text-indigo-300/40 font-bold tracking-widest uppercase">Operations</p>
            </div>
          </div>
          <p className="text-[10px] text-indigo-300/40 font-black bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">v 2.1.0</p>
        </div>
        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className={`w-full py-2.5 rounded-lg text-xs font-black transition-all active:scale-95 border ${
            cacheCleared
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : isClearingCache
              ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/50 text-orange-400'
          }`}
        >
          {cacheCleared ? '✓ CACHE CLEARED' : isClearingCache ? '⏳ CLEARING...' : '🔄 FORCE CLEAR CACHE'}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-4xl text-center py-12 lg:py-16 space-y-8">
          <div className="inline-block text-5xl lg:text-6xl mb-2 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-bounce duration-1000">💆</div>
          
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-300 bg-clip-text text-transparent">
              ELSPA Gateway
            </h1>
            <p className="text-sm lg:text-lg text-indigo-200/60 font-semibold tracking-wide max-w-xl mx-auto">
              Professional Wellness Operations & System Management Console
            </p>
          </div>

          {/* Dual Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6">
            {/* Monitor Dashboard Card */}
            <a
              href="/monitor.html"
              className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 lg:p-10 transition-all hover:border-indigo-500/60 hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] hover:-translate-y-1.5 active:scale-95 group duration-300 flex flex-col items-center justify-center text-center space-y-4 hover:bg-slate-900/70"
            >
              <div className="text-4xl lg:text-5xl bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                📊
              </div>
              <div className="space-y-1">
                <h2 className="text-xl lg:text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">
                  Real-time Monitor
                </h2>
                <p className="text-xs lg:text-sm text-indigo-300/40 font-bold group-hover:text-indigo-300/60 transition-colors">
                  Beds Status & Daily Schedules
                </p>
              </div>
            </a>

            {/* Admin Console Card */}
            <a
              href="/admin.html"
              className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 lg:p-10 transition-all hover:border-indigo-500/60 hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] hover:-translate-y-1.5 active:scale-95 group duration-300 flex flex-col items-center justify-center text-center space-y-4 hover:bg-slate-900/70"
            >
              <div className="text-4xl lg:text-5xl bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300">
                👥
              </div>
              <div className="space-y-1">
                <h2 className="text-xl lg:text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">
                  Admin Console
                </h2>
                <p className="text-xs lg:text-sm text-indigo-300/40 font-bold group-hover:text-indigo-300/60 transition-colors">
                  Therapists, Settlements & Payroll
                </p>
              </div>
            </a>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (fixed at bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-indigo-500/20 shadow-2xl">
        <div className="flex justify-around">
          <a
            href="/monitor.html"
            className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black text-indigo-300/60 hover:text-indigo-400 border-r border-indigo-500/10 last:border-r-0 tracking-wider"
          >
            <span className="text-base">📊</span>
            <span>MONITOR</span>
          </a>
          <a
            href="/admin.html"
            className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black text-indigo-300/60 hover:text-indigo-400 tracking-wider"
          >
            <span className="text-base">👥</span>
            <span>ADMIN</span>
          </a>
        </div>
      </div>

      {/* Mobile bottom padding spacer */}
      <div className="lg:hidden h-16" />
    </div>
  );
}

