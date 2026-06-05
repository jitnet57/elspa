/**
 * 📌 Companies API Client — Supabase 직결 (백엔드 없음)
 * 📋 업체(companies) / 가이드(guides) / 월정산(monthly_settlements) CRUD
 * 📅 작성일: 2026-05-31
 */

import { getSupabase } from '@/lib/supabase/client';

export interface Company {
  id: number;
  name: string;
  representative?: string;
  phone?: string;
  address?: string;
  settlement_day?: number;
  commission_rate?: number;
  status?: 'active' | 'inactive';
  gcash_number?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  created_at?: string;
}

export interface Guide {
  id: number;
  name: string;
  company_id: number;
  commission_rate?: number;
  status?: 'active' | 'inactive';
}

export interface MonthlySettlement {
  id: number;
  company_id: number;
  guide_id?: number;
  settlement_month: string;
  settlement_date?: string;
  total_sessions: number;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  payment_amount: number;
  service_breakdown: Record<string, { sessions: number; revenue: number }>;
  status: 'pending' | 'confirmed' | 'paid';
  notes?: string;
  created_at?: string;
}

function sb() {
  const c = getSupabase();
  if (!c) throw new Error('Supabase 미설정 — NEXT_PUBLIC_SUPABASE_* 환경변수를 확인하세요.');
  return c;
}

// ---------- Companies ----------
export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await sb().from('companies').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Company[];
}
export async function createCompany(data: Partial<Company>): Promise<Company> {
  const { data: row, error } = await sb().from('companies').insert(data).select().single();
  if (error) throw error;
  return row as Company;
}
export async function updateCompany(id: number, data: Partial<Company>): Promise<Company> {
  const { data: row, error } = await sb().from('companies').update(data).eq('id', id).select().single();
  if (error) throw error;
  return row as Company;
}
export async function deleteCompany(id: number): Promise<void> {
  const { error } = await sb().from('companies').delete().eq('id', id);
  if (error) throw new Error('업체 삭제 실패');
}

// ---------- Guides (companies 테이블에서 관리) ----------
export async function getGuides(companyId?: number): Promise<Guide[]> {
  // guides는 폐기됨, companies에서 가이드 역할 수행
  let q = sb().from('companies').select('id, name, id as company_id, commission_rate, status').order('id', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    company_id: c.company_id,
    commission_rate: c.commission_rate,
    status: c.status,
  })) as Guide[];
}
export async function createGuide(data: Partial<Guide>): Promise<Guide> {
  // guides는 companies로 저장
  const { data: row, error } = await sb().from('companies').insert({
    name: data.name,
    commission_rate: data.commission_rate,
    status: data.status,
  }).select().single();
  if (error) throw error;
  return {
    id: row.id,
    name: row.name,
    company_id: row.id,
    commission_rate: row.commission_rate,
    status: row.status,
  } as Guide;
}
export async function updateGuide(id: number, data: Partial<Guide>): Promise<Guide> {
  // guides는 companies에서 업데이트
  const { data: row, error } = await sb().from('companies').update({
    name: data.name,
    commission_rate: data.commission_rate,
    status: data.status,
  }).eq('id', id).select().single();
  if (error) throw error;
  return {
    id: row.id,
    name: row.name,
    company_id: row.id,
    commission_rate: row.commission_rate,
    status: row.status,
  } as Guide;
}
export async function deleteGuide(id: number): Promise<void> {
  // guides는 companies에서 삭제
  const { error } = await sb().from('companies').delete().eq('id', id);
  if (error) throw new Error('가이드 삭제 실패');
}

// ---------- Monthly Settlements ----------
export async function getMonthlySettlements(params?: { company_id?: number; settlement_month?: string }): Promise<MonthlySettlement[]> {
  let q = sb().from('monthly_settlements').select('*').order('settlement_month', { ascending: false });
  if (params?.company_id) q = q.eq('company_id', params.company_id);
  if (params?.settlement_month) q = q.eq('settlement_month', params.settlement_month);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MonthlySettlement[];
}
export async function createMonthlySettlement(data: Partial<MonthlySettlement>): Promise<MonthlySettlement> {
  const { data: row, error } = await sb().from('monthly_settlements').insert(data).select().single();
  if (error) throw error;
  return row as MonthlySettlement;
}
export async function updateMonthlySettlement(id: number, data: Partial<MonthlySettlement>): Promise<MonthlySettlement> {
  const { data: row, error } = await sb().from('monthly_settlements').update(data).eq('id', id).select().single();
  if (error) throw error;
  return row as MonthlySettlement;
}
export async function deleteMonthlySettlement(id: number): Promise<void> {
  const { error } = await sb().from('monthly_settlements').delete().eq('id', id);
  if (error) throw new Error('월정산 삭제 실패');
}
