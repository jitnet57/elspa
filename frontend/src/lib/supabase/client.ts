// ============================================================
// 📌 모듈: Supabase 브라우저 클라이언트 (싱글톤)
// 📋 목적: 백엔드(FastAPI) 없이 프론트엔드가 Supabase에 직접 읽기/쓰기
// 🔧 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// 📅 작성일: 2026-05-31
// ⚠️ 주의: anon 키만 사용 (service_role 키는 절대 프론트에 넣지 않음)
//         테이블 보호는 Supabase RLS 정책으로 처리 (supabase/schema.sql 참고)
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Supabase 클라이언트를 반환합니다 (싱글톤).
 *
 * 환경변수가 설정돼 있지 않으면 null을 반환하므로, 호출부에서
 * null인 경우 Mock 데이터/캐시로 폴백할 수 있습니다.
 *
 * @returns SupabaseClient 또는 null (미설정 시)
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수 미설정 → null 반환 (호출부에서 폴백 처리)
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Supabase 환경변수 미설정 — Mock/캐시로 폴백합니다.');
    }
    return null;
  }

  _client = createClient(url, anonKey, {
    auth: { persistSession: false }, // 모니터는 익명 읽기/쓰기 (RLS로 보호)
  });
  return _client;
}

/** Supabase 사용 가능 여부 (env 설정 + USE_SUPABASE 플래그) */
export function isSupabaseEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
