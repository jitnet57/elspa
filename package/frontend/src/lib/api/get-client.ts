// ============================================================
// 📌 모듈: API 클라이언트 seam (Mock ⇄ Supabase 전환 지점)
// 📋 목적: 백엔드 없이 Supabase를 데이터 소스로 사용. 환경변수로 전환.
//     - NEXT_PUBLIC_USE_SUPABASE=true  → Supabase 어댑터 (실데이터)
//     - 그 외                          → Mock 어댑터 (로컬 테스트)
// 📅 작성일: 2026-05-31
// ⚠️ 순환 import 방지: mock-adapter는 이 파일을 import하지 않음
// ============================================================

import { mockApiAdapter } from './mock-adapter';
import { supabaseApiAdapter } from './supabase-adapter';
import { isSupabaseEnabled } from '@/lib/supabase/client';

/**
 * 현재 활성 API 클라이언트를 반환합니다.
 * Supabase가 활성화돼 있으면 Supabase 어댑터, 아니면 Mock 어댑터.
 */
export const getApiClient = () => {
  if (isSupabaseEnabled()) {
    return supabaseApiAdapter;
  }
  return mockApiAdapter;
};
