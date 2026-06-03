'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

// ============================================================
// 📌 컴포넌트명: Home (ElSpa 메인 게이트웨이 랜딩 페이지)
// 📋 목적: 초프리미엄 미드나잇 테마의 시스템 진입 게이트웨이 및 캐시 무효화 제어
// 🔧 기능: 루트(/)에서 /monitor로 자동 리다이렉트
// 📅 작성일: 2026-05-28 / 개정: 2026-06-03
// ⚠️ 주의: Cloudflare Pages 정적 export 환경에서 404를 방지하기 위해 .html 주소 활용
// ============================================================
export default function Home() {
  const router = useRouter();

  // 페이지 로드 시 자동으로 /monitor로 리다이렉트
  useEffect(() => {
    router.push('/monitor');
  }, [router]);

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

  // 리다이렉트 중이므로 간단한 로딩 화면만 표시
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-bounce">💆</div>
        <p className="text-lg text-indigo-300/60">연결 중...</p>
      </div>
    </div>
  );
}

