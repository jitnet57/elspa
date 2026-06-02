'use client';

/**
 * ============================================================
 * 📌 컴포넌트: GoogleConnect
 * 📋 목적: Google(Drive/Sheets) 인증 상태 표시 + 인증 링크 연결
 * 🔌 GET /api/booking/status, GET /api/booking/auth/google
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function GoogleConnect() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [opening, setOpening] = useState(false);

  // 연결 상태 확인
  const check = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/booking/status`);
      const d = await r.json();
      setConnected(!!d.connected);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  // 인증 URL 받아서 새 창으로 열기
  const connect = async () => {
    setOpening(true);
    try {
      const r = await fetch(`${API_BASE}/api/booking/auth/google`);
      const d = await r.json();
      if (d.authorization_url) {
        window.open(d.authorization_url, '_blank', 'noopener,noreferrer');
      } else {
        alert('인증 URL을 받지 못했습니다.');
      }
    } catch {
      alert('인증 URL 요청 실패 (백엔드/구글 설정 확인).');
    } finally {
      setOpening(false);
    }
  };

  if (connected === null) {
    return <span className="text-xs text-gray-400">Google 연결 확인 중…</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      {connected ? (
        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1.5 rounded-lg">🟢 Google 연결됨</span>
      ) : (
        <>
          {/* Settings 페이지 바로가기 */}
          <Link
            href="/admin/policies#google"
            className="text-xs font-semibold text-blue-600 underline hover:text-blue-800"
          >
            ⚙️ 설정에서 연결
          </Link>
          <span className="text-gray-300">|</span>
          {/* 또는 직접 인증 */}
          <button
            onClick={connect}
            disabled={opening}
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg"
          >
            {opening ? '인증 창 여는 중…' : '🔗 Google 연결'}
          </button>
        </>
      )}
      <button onClick={check} title="연결 상태 새로고침" className="text-xs text-gray-500 hover:text-gray-800 px-1.5 py-1.5">↻</button>
    </span>
  );
}
