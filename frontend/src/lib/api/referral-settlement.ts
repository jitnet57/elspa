/**
 * ============================================================
 * 📌 레퍼럴 → 월정산 자동 반영 파이프라인
 * 📋 예약(bookings)의 note 에 기록된 "이름 (업체)"/"이름 (가이드)" 레퍼럴을
 *    월별로 집계 → monthly_settlements 에 upsert (소개수수료 자동 정산)
 * 🧮 매출 = Σ booking.pay, 수수료 = round(매출 × 업체수수료율 / 100), 지급 = 매출 − 수수료
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { getSupabase } from '@/lib/supabase/client';
import { getCompanies, getGuides } from './companies-client';

export interface ReferralAgg {
  company: any;
  guide: any | null;
  kind: 'company' | 'guide';
  sessions: number;
  revenue: number;
  commission_rate: number;
  commission_amount: number;
  payment_amount: number;
}

/** note → 레퍼럴 파싱: "ABC Travel (업체)" / "Anna (가이드)" */
export function parseReferral(note?: string | null): { name: string; kind: 'company' | 'guide' } | null {
  if (!note) return null;
  const m = note.match(/^(.*?)\s*\((업체|가이드)\)\s*$/);
  if (!m) return null;
  return { name: m[1].trim(), kind: m[2] === '업체' ? 'company' : 'guide' };
}

/** 해당 월 예약을 레퍼럴별로 집계 */
export async function aggregateReferrals(month: string): Promise<ReferralAgg[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: bookings } = await sb.from('bookings').select('*').like('booking_date', `${month}%`).neq('status', 'deleted');
  const [companies, guides] = await Promise.all([getCompanies().catch(() => []), getGuides().catch(() => [])]);

  const map = new Map<string, ReferralAgg>();
  for (const b of (bookings ?? []) as any[]) {
    const ref = parseReferral(b.note);
    if (!ref) continue;
    let company: any = null;
    let guide: any = null;
    if (ref.kind === 'company') {
      company = companies.find((c: any) => c.name === ref.name);
    } else {
      guide = guides.find((g: any) => g.name === ref.name) || null;
      company = guide ? companies.find((c: any) => c.id === guide.company_id) : null;
    }
    if (!company) continue;
    const key = `${company.id}|${guide?.id ?? ''}`;
    const agg = map.get(key) || {
      company, guide, kind: ref.kind, sessions: 0, revenue: 0,
      commission_rate: 0, commission_amount: 0, payment_amount: 0,
    };
    agg.sessions += 1;
    agg.revenue += Number(b.pay) || 0;
    map.set(key, agg);
  }
  return Array.from(map.values()).map((a) => {
    // 가이드 레퍼럴 → 가이드 자신의 수수료율, 업체 레퍼럴 → 업체 수수료율
    const rate = a.kind === 'guide' && a.guide
      ? (Number(a.guide.commission_rate) || 0)
      : (Number(a.company.commission_rate) || 0);
    const commission = Math.round((a.revenue * rate) / 100);
    return { ...a, commission_rate: rate, commission_amount: commission, payment_amount: a.revenue - commission };
  });
}

/** 집계 결과를 monthly_settlements 에 upsert (기존 (company,guide,month) 갱신 / 없으면 삽입) */
export async function applyReferralSettlements(month: string): Promise<{ count: number; aggs: ReferralAgg[] }> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase 미설정 — NEXT_PUBLIC_SUPABASE_* 확인');
  const aggs = await aggregateReferrals(month);
  for (const a of aggs) {
    const row = {
      company_id: a.company.id, guide_id: a.guide?.id ?? null, settlement_month: month,
      total_sessions: a.sessions, total_revenue: a.revenue, commission_rate: a.commission_rate,
      commission_amount: a.commission_amount, payment_amount: a.payment_amount,
      status: 'pending', notes: '예약 자동 집계(referral)',
    };
    let q = sb.from('monthly_settlements').select('id').eq('company_id', a.company.id).eq('settlement_month', month);
    q = a.guide ? q.eq('guide_id', a.guide.id) : q.is('guide_id', null);
    const { data: ex } = await q.maybeSingle();
    if (ex) await sb.from('monthly_settlements').update(row).eq('id', (ex as any).id);
    else await sb.from('monthly_settlements').insert(row);
  }
  return { count: aggs.length, aggs };
}
