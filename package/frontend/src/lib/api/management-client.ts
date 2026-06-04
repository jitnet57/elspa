/**
 * ============================================================
 * 📌 경영지표 클라이언트 (Supabase + localStorage 폴백)
 * 📋 월별 경영지표(jsonb) 저장/조회. Supabase 미설정/미생성 시 localStorage.
 * 📅 2026-06-01
 * ============================================================
 */

import { getSupabase } from '@/lib/supabase/client';

const LS_KEY = 'elspa.metrics';

// ── localStorage 폴백 ────────────────────────────────────────
function lsAll(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function lsSet(month: string, data: any) {
  if (typeof window === 'undefined') return;
  const all = lsAll(); all[month] = data;
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
}

/** 월 지표 조회 (Supabase → 실패 시 localStorage) */
export async function getMonthMetrics(month: string): Promise<any | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('management_metrics').select('data').eq('month', month).maybeSingle();
      if (!error) {
        if (data?.data) { lsSet(month, data.data); return data.data; }
        return lsAll()[month] ?? null;
      }
    } catch { /* 폴백 */ }
  }
  return lsAll()[month] ?? null;
}

/** 월 지표 저장 (Supabase upsert + localStorage 캐시) */
export async function saveMonthMetrics(month: string, data: any): Promise<void> {
  lsSet(month, data); // 항상 로컬 캐시
  const sb = getSupabase();
  if (sb) {
    try { await sb.from('management_metrics').upsert({ month, data }, { onConflict: 'month' }); } catch { /* 로컬만 */ }
  }
}

/** 연도 전체 월 지표 (Supabase → 폴백 localStorage) */
export async function getYearMetrics(year: number): Promise<Record<string, any>> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('management_metrics').select('month, data').like('month', `${year}-%`);
      if (!error && data) {
        const out: Record<string, any> = {};
        data.forEach((r: any) => { out[r.month] = r.data; });
        return out;
      }
    } catch { /* 폴백 */ }
  }
  const all = lsAll();
  return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(`${year}-`)));
}
