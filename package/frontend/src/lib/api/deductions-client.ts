// ============================================================
// 📌 모듈: Deductions API Client — Supabase 직결 (백엔드 없음)
// 📋 목적: 공제/선지급 관련 3개 테이블의 CRUD를 payroll-client.ts의 sb() 패턴과
//         동일하게 제공합니다. getSupabase() 사용, 미설정 시 명확히 throw.
//   - sss_brackets             : SSS 기여표 (구간별 직원/사업주 부담)
//   - health_check_logs        : 보건검진 실비 기록
//   - thirteenth_month_advances: 13개월 선지급 기록
// 📅 작성일: 2026-05-31
// ⚠️ 주의: 기존 payroll-client.ts / calc.ts 는 수정하지 않습니다 (신규 모듈).
//         테이블 보호는 Supabase RLS 정책으로 처리합니다.
// ============================================================

import { getSupabase } from '@/lib/supabase/client';

// ============================================================
// 타입 정의 (export)
// ============================================================

/** SSS 기여표 한 구간 — 급여 구간별 직원/사업주 부담금 */
export interface SssBracket {
  id: number;
  salary_from: number;   // 구간 하한 (이상)
  salary_to: number;     // 구간 상한 (이하)
  employee_share: number; // 직원 부담금
  employer_share: number; // 사업주 부담금
}

/** 보건검진(실비) 기록 — 정산 시 직원에게 공제할 실비 */
export interface HealthCheckLog {
  id: number;
  employee_id: number;
  check_date: string; // YYYY-MM-DD
  amount: number;
  note?: string | null;
}

/** 13개월 선지급 기록 — 13개월 적립금에서 차감할 선지급액 */
export interface ThirteenthMonthAdvance {
  id: number;
  employee_id: number;
  pay_date: string; // YYYY-MM-DD
  amount: number;
  note?: string | null;
}

// ============================================================
// 공통: Supabase 핸들 (미설정 시 명확한 에러)
// payroll-client.ts 의 sb() 패턴과 동일
// ============================================================
function sb() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase 미설정 — NEXT_PUBLIC_SUPABASE_* 환경변수를 확인하세요.');
  return client;
}

// ============================================================
// SSS 기여표 (sss_brackets) — list / create / update / delete
// ============================================================
export async function getSssBrackets(): Promise<SssBracket[]> {
  const { data, error } = await sb()
    .from('sss_brackets')
    .select('*')
    .order('salary_from', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SssBracket[];
}

export async function createSssBracket(data: Partial<SssBracket>): Promise<SssBracket> {
  const { data: row, error } = await sb().from('sss_brackets').insert(data).select().single();
  if (error) throw error;
  return row as SssBracket;
}

export async function updateSssBracket(id: number, data: Partial<SssBracket>): Promise<SssBracket> {
  const { data: row, error } = await sb().from('sss_brackets').update(data).eq('id', id).select().single();
  if (error) throw error;
  return row as SssBracket;
}

export async function deleteSssBracket(id: number): Promise<void> {
  const { error } = await sb().from('sss_brackets').delete().eq('id', id);
  if (error) throw new Error('SSS 구간 삭제 실패');
}

// ============================================================
// 보건검진(실비) (health_check_logs) — list(옵션 employee_id) / create / delete
// ============================================================
export async function getHealthCheckLogs(params?: { employee_id?: number }): Promise<HealthCheckLog[]> {
  let q = sb().from('health_check_logs').select('*').order('check_date', { ascending: false });
  if (params?.employee_id) q = q.eq('employee_id', params.employee_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as HealthCheckLog[];
}

export async function createHealthCheckLog(data: Partial<HealthCheckLog>): Promise<HealthCheckLog> {
  const { data: row, error } = await sb().from('health_check_logs').insert(data).select().single();
  if (error) throw error;
  return row as HealthCheckLog;
}

export async function deleteHealthCheckLog(id: number): Promise<void> {
  const { error } = await sb().from('health_check_logs').delete().eq('id', id);
  if (error) throw new Error('보건검진 기록 삭제 실패');
}

// ============================================================
// 13개월 선지급 (thirteenth_month_advances) — list(옵션 employee_id) / create / delete
// ============================================================
export async function getThirteenthMonthAdvances(params?: { employee_id?: number }): Promise<ThirteenthMonthAdvance[]> {
  let q = sb().from('thirteenth_month_advances').select('*').order('pay_date', { ascending: false });
  if (params?.employee_id) q = q.eq('employee_id', params.employee_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ThirteenthMonthAdvance[];
}

export async function createThirteenthMonthAdvance(data: Partial<ThirteenthMonthAdvance>): Promise<ThirteenthMonthAdvance> {
  const { data: row, error } = await sb().from('thirteenth_month_advances').insert(data).select().single();
  if (error) throw error;
  return row as ThirteenthMonthAdvance;
}

export async function deleteThirteenthMonthAdvance(id: number): Promise<void> {
  const { error } = await sb().from('thirteenth_month_advances').delete().eq('id', id);
  if (error) throw new Error('13개월 선지급 기록 삭제 실패');
}
