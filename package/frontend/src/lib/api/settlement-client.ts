/**
 * ============================================================
 * 📌 정산 API 클라이언트 (Supabase 직결)
 * 📋 목적: 월정산 리포트가 Supabase(monthly_settlements/companies/guides)를
 *         직접 조회하도록 함. (백엔드/OAuth 토큰 불필요)
 * 🔗 데이터: companies-client(Supabase) 위임 → 구글시트는 Apps Script syncAll 미러
 * 📅 작성일: 2026-05-29 / 개정: 2026-06-01 (authenticatedGet 제거 → Supabase 직결)
 * ============================================================
 */

import {
  getMonthlySettlements as supaGetMonthlySettlements,
  getCompanies,
  getGuides,
} from './companies-client';

/** 월별 정산 데이터 조회 (Supabase monthly_settlements, 월 필터) */
export async function getMonthlySettlements(month: string): Promise<any[]> {
  try {
    return await supaGetMonthlySettlements({ settlement_month: month });
  } catch (error) {
    console.error(`월정산 조회 실패 (${month}):`, error);
    return [];
  }
}

/** 회사 목록 조회 (리포트의 회사명 매핑/회사별 통계용) */
export async function getCompanySettlements(_month: string): Promise<any[]> {
  try {
    return await getCompanies();
  } catch (error) {
    console.error('회사 조회 실패:', error);
    return [];
  }
}

/** 가이드 목록 조회 (리포트의 가이드명 매핑/가이드별 통계용) */
export async function getGuideSettlements(_month: string): Promise<any[]> {
  try {
    return await getGuides();
  } catch (error) {
    console.error('가이드 조회 실패:', error);
    return [];
  }
}

/** 월정산 + 회사 + 가이드 통합 조회 */
export async function getAllSettlements(month: string): Promise<{
  settlements: any[];
  companies: any[];
  guides: any[];
}> {
  const [settlements, companies, guides] = await Promise.all([
    getMonthlySettlements(month),
    getCompanies().catch(() => []),
    getGuides().catch(() => []),
  ]);
  return { settlements, companies, guides };
}
