'use client';

// ============================================================
// 📌 컴포넌트: GoogleSettings
// 📋 목적: Settings 페이지 전용 Google Drive/Sheets 연결 상세 UI
//          - 연결 상태 조회, 연결/해제, 안내 정보 표시
// 🔌 GET  /api/booking/status           → 연결 상태 확인
// 🔌 GET  /api/booking/auth/google      → OAuth 인증 URL 요청
// 🔌 DELETE /api/booking/auth/google    → 연결 해제
// 📅 작성일: 2026-06-02
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAutoSaveSettings } from '@/lib/hooks/useAutoSaveSettings';

const BACKEND_URL = 'https://elspa-api-production.jitnet57.workers.dev'

// ============================================================
// 📌 타입: GoogleStatus
// 📋 목적: /api/booking/status 응답 구조 정의
// ============================================================
interface GoogleStatus {
  connected: boolean;
  email?: string;
  token_expiry?: string;
  scopes?: string[];
}

// ============================================================
// 📌 유틸: formatExpiry
// 📋 목적: ISO 날짜 문자열을 읽기 좋은 형태로 변환
// 📤 반환값: "YYYY-MM-DD HH:MM" 또는 원본 문자열
// ============================================================
function formatExpiry(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const ymd = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const hm = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${ymd} ${hm}`;
  } catch {
    return iso;
  }
}

// ============================================================
// 📌 유틸: nowHHMM
// 📋 목적: 현재 시각을 HH:MM 형식으로 반환
// ============================================================
function nowHHMM(): string {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ============================================================
// 📌 컴포넌트: GoogleSettings (default export)
// 📋 목적: Settings 페이지 Google Drive 연결 섹션 전체 담당
// ============================================================
export default function GoogleSettings() {
  // 자동 저장 설정 (공유 훅 — localStorage 영속)
  const { enabled, intervalMinutes, setEnabled, setIntervalMinutes } = useAutoSaveSettings();

  // ⚠️ Google OAuth는 설정 문제로 비활성화
  // Google Apps Script로만 저장합니다

  // 연결 상태 (null = 로딩 중)
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  // 인증 URL 요청 로딩
  const [loading, setLoading] = useState(false);
  // 연결 해제 로딩
  const [disconnecting, setDisconnecting] = useState(false);
  // 마지막 상태 확인 시각
  const [lastChecked, setLastChecked] = useState<string>('');

  // ----------------------------------------------------------
  // 📌 함수: fetchStatus
  // 📋 목적: /api/booking/status 호출 → status 상태 업데이트
  // ----------------------------------------------------------
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/booking/status`);
      const data = await res.json();
      setStatus({
        connected: !!data.connected,
        email: data.email,
        token_expiry: data.token_expiry,
        scopes: data.scopes,
      });
    } catch {
      // 네트워크 오류 등 → 미연결로 표시
      setStatus({ connected: false });
    } finally {
      setLastChecked(nowHHMM());
    }
  }, []);

  // 마운트 시 상태 조회
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ----------------------------------------------------------
  // 📌 함수: handleConnect
  // 📋 목적: OAuth 인증 URL을 받아 새 창에서 Google 로그인 열기
  //          새 창 열고 5초 후 fetchStatus() 1회 재호출 (완료 체크)
  // ----------------------------------------------------------
  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/booking/auth/google`);
      const data = await res.json();
      if (data.authorization_url) {
        // 새 창으로 Google OAuth 열기
        window.open(data.authorization_url, '_blank', 'noopener,noreferrer');
        // 5초 후 연결 완료 여부 폴링 (1회)
        setTimeout(() => {
          fetchStatus();
        }, 5000);
      } else {
        alert('인증 URL을 받지 못했습니다. 백엔드 설정을 확인하세요.');
      }
    } catch {
      alert('인증 URL 요청 실패: 백엔드 서버 또는 Google OAuth 설정을 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // 📌 함수: handleDisconnect
  // 📋 목적: 연결 해제 confirm 후 DELETE 요청 → fetchStatus 재호출
  // ----------------------------------------------------------
  const handleDisconnect = async () => {
    const ok = confirm('Google 계정 연결을 해제하시겠습니까?\nDrive 자동 저장이 중단됩니다.');
    if (!ok) return;
    setDisconnecting(true);
    try {
      await fetch(`${BACKEND_URL}/api/booking/auth/google`, { method: 'DELETE' });
      await fetchStatus();
    } catch {
      alert('연결 해제 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setDisconnecting(false);
    }
  };

  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------
  return (
    <div className="bg-white rounded-xl border-2 border-blue-100 shadow-sm p-6">
      {/* ── 헤더 ────────────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">📊 Google Sheets 자동 저장</h2>
        <p className="text-sm text-gray-500 mt-1">
          Google Apps Script를 통해 비용·예약·출결 데이터를 Google Sheets에 자동 저장합니다.
        </p>
      </div>

      {/* ── Google OAuth 비활성화 안내 ────────────────────── */}
      <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ✅ <strong>Google Apps Script 연동 완료</strong><br/>
          <span className="text-xs text-blue-700 mt-1 block">
            Google OAuth 인증 대신 Google Apps Script를 통해 자동으로 저장됩니다.
          </span>
        </p>
      </div>

      {/* ── 자동 저장 설정 ────────────────────────────────── */}
      <div className="mt-5 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-800 mb-3">⚙️ Drive 자동 저장 설정</p>
        <div className="flex flex-wrap gap-6 items-center">
          {/* 자동 저장 on/off */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-700 font-medium">자동 저장 활성화</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </label>

          {/* 저장 간격 선택 */}
          <label className={`flex items-center gap-2 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-sm text-gray-700 font-medium">저장 간격</span>
            <select
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 bg-white focus:border-blue-400 focus:outline-none"
            >
              <option value={15}>15분</option>
              <option value={30}>30분</option>
              <option value={60}>1시간 (기본)</option>
              <option value={120}>2시간</option>
            </select>
          </label>
        </div>
        {enabled && (
          <p className="mt-2 text-xs text-gray-500">
            비용·예약·출결 페이지가 열려 있는 동안 <strong>{intervalMinutes}분</strong>마다 Google Drive에 자동 저장됩니다.
          </p>
        )}
        {!enabled && (
          <p className="mt-2 text-xs text-gray-400">자동 저장이 꺼져 있습니다. 수동으로 Drive 저장 버튼을 눌러 저장하세요.</p>
        )}
      </div>

      {/* ── 안내 박스: Drive 폴더 구조 / 파일 유지 ─────────── */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold mb-2">📁 Drive 저장 구조</p>
        <p>• Google Drive → <code className="font-mono bg-blue-100 px-1 rounded">elspa / 비용·예약·출결·급여·매출·수수료</code> 폴더에 저장</p>
        <p>• 폴더당 <strong>최신 파일 + *.backup</strong> 2개만 유지</p>
        <p>• 토큰 만료 시 재인증 필요 (위 [연결 해제] 후 재연결)</p>
      </div>
    </div>
  );
}
