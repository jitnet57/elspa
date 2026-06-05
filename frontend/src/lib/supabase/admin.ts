// ============================================================
// 📌 모듈: Supabase 서버 관리자 클라이언트
// 📋 목적: API 라우트에서 사용 (서버 사이드만)
// 🔧 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// 📅 작성일: 2026-06-06
// ⚠️ 주의: service_role 키를 사용 (프론트엔드에 절대 노출 금지)
//         내부 API 라우트에서만 사용
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

/**
 * Supabase 관리자 클라이언트를 반환합니다 (싱글톤).
 * 서버 사이드 API 라우트에서만 사용합니다.
 *
 * @returns SupabaseClient 또는 null (미설정 시)
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 환경변수 미설정 → null 반환
  if (!url || !serviceRoleKey) {
    console.warn(
      '⚠️ Supabase 관리자 설정 미완료 — SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY 필수'
    );
    return null;
  }

  _adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _adminClient;
}
