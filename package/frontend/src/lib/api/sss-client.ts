/**
 * ============================================================
 * 📌 SSS 후정산 클라이언트 (Supabase 직결, 백엔드 불필요)
 * 📋 정부 인보이스 기반 SSS 후정산 레코드 CRUD (localhost 백엔드 제거)
 * 🔗 테이블: public.sss_records (sss_records_schema.sql)
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

import { getSupabase } from '@/lib/supabase/client';

export interface SssRecord {
  id: number;
  applicable_month: string;
  company: string | null;
  employer_ss_no: string | null;
  invoice_no: string | null;
  employee_no: number | null;
  employee_name: string;
  ss_number: string | null;
  ss_amount: number;
  ec_amount: number;
  total_amount: number;
}

export interface MonthSummary {
  applicable_month: string;
  company: string | null;
  employer_ss_no: string | null;
  invoice_no: string | null;
  count: number;
  total: number;
}

function sb() {
  const c = getSupabase();
  if (!c) throw new Error('Supabase 미설정 — NEXT_PUBLIC_SUPABASE_* 환경변수를 확인하세요.');
  return c;
}

/** 월별 요약 (전체 레코드를 가져와 월 그룹 집계) */
export async function getSssMonths(): Promise<MonthSummary[]> {
  const { data, error } = await sb()
    .from('sss_records')
    .select('applicable_month, company, employer_ss_no, invoice_no, total_amount')
    .order('applicable_month', { ascending: false });
  if (error) throw error;
  const map = new Map<string, MonthSummary>();
  for (const r of (data ?? []) as any[]) {
    const m = map.get(r.applicable_month) ?? {
      applicable_month: r.applicable_month,
      company: r.company,
      employer_ss_no: r.employer_ss_no,
      invoice_no: r.invoice_no,
      count: 0,
      total: 0,
    };
    m.count += 1;
    m.total += Number(r.total_amount) || 0;
    map.set(r.applicable_month, m);
  }
  return Array.from(map.values());
}

/** 특정 월 레코드 */
export async function getSssRecords(month: string): Promise<SssRecord[]> {
  const { data, error } = await sb()
    .from('sss_records')
    .select('*')
    .eq('applicable_month', month)
    .order('employee_no', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SssRecord[];
}

export async function createSssRecord(input: Partial<SssRecord>): Promise<SssRecord> {
  const { data, error } = await sb().from('sss_records').insert(input).select().single();
  if (error) throw error;
  return data as SssRecord;
}

export async function updateSssRecord(id: number, patch: Partial<SssRecord>): Promise<SssRecord> {
  const { data, error } = await sb().from('sss_records').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as SssRecord;
}

export async function deleteSssRecord(id: number): Promise<void> {
  const { error } = await sb().from('sss_records').delete().eq('id', id);
  if (error) throw error;
}
