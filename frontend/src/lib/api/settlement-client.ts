/**
 * ============================================================
 * 📌 정산 API 클라이언트
 * 📋 목적: 월정산 시스템 API 통합
 * 🔧 기능:
 *   - getMonthlySettlements(month) - 월별 정산 데이터 조회
 *   - getCompanySettlements(month) - 회사별 정산 조회
 *   - getGuideSettlements(month) - 가이드별 정산 조회
 * 📅 작성일: 2026-05-29
 * ============================================================
 */

import { authenticatedGet } from './authenticated-client';

/**
 * 월별 정산 데이터 조회
 *
 * @param month - 조회 월 (예: "2026-05")
 * @returns MonthlySettlement[] 배열
 *
 * @example
 * const settlements = await getMonthlySettlements("2026-05");
 */
export async function getMonthlySettlements(month: string): Promise<any[]> {
  try {
    const response = await authenticatedGet<{ settlements: any[] }>(
      `/api/settlements/monthly?month=${month}`
    );
    return response.settlements || [];
  } catch (error) {
    console.error(`Failed to fetch monthly settlements for ${month}:`, error);
    throw error;
  }
}

/**
 * 회사별 정산 데이터 조회
 *
 * @param month - 조회 월 (예: "2026-05")
 * @returns Company[] 배열
 *
 * @example
 * const companies = await getCompanySettlements("2026-05");
 */
export async function getCompanySettlements(month: string): Promise<any[]> {
  try {
    const response = await authenticatedGet<{ companies: any[] }>(
      `/api/settlements/company?month=${month}`
    );
    return response.companies || [];
  } catch (error) {
    console.error(`Failed to fetch company settlements for ${month}:`, error);
    throw error;
  }
}

/**
 * 가이드별 정산 데이터 조회
 *
 * @param month - 조회 월 (예: "2026-05")
 * @returns Guide[] 배열
 *
 * @example
 * const guides = await getGuideSettlements("2026-05");
 */
export async function getGuideSettlements(month: string): Promise<any[]> {
  try {
    const response = await authenticatedGet<{ guides: any[] }>(
      `/api/settlements/guide?month=${month}`
    );
    return response.guides || [];
  } catch (error) {
    console.error(`Failed to fetch guide settlements for ${month}:`, error);
    throw error;
  }
}

/**
 * 모든 정산 데이터 통합 조회
 *
 * @param month - 조회 월 (예: "2026-05")
 * @returns 정산 데이터 전체
 *
 * @example
 * const allSettlements = await getAllSettlements("2026-05");
 */
export async function getAllSettlements(month: string): Promise<{
  settlements: any[];
  companies: any[];
  guides: any[];
}> {
  try {
    const [settlements, companies, guides] = await Promise.all([
      getMonthlySettlements(month),
      getCompanySettlements(month),
      getGuideSettlements(month),
    ]);

    return { settlements, companies, guides };
  } catch (error) {
    console.error(`Failed to fetch all settlements for ${month}:`, error);
    throw error;
  }
}
