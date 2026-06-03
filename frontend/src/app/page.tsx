'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================
// 📌 컴포넌트명: Home (ElSpa 메인 게이트웨이)
// 📋 목적: 루트(/)에서 /monitor로 자동 리다이렉트
// 🔧 기능: BOOKING WITH THERAPIST를 메인 랜딩 페이지로 설정
// 📅 작성일: 2026-06-03
// ============================================================
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/monitor');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-bounce">💆</div>
        <p className="text-lg text-indigo-300/60">연결 중...</p>
      </div>
    </div>
  );
}

