/**
 * ============================================================
 * 📌 경영지표 보고서 집계 클라이언트 (일간·주간 자동 집계)
 * 📋 매출: massage_bookings.service_price 일자별 합산
 *    비용: expense.report_date 일자별·카테고리별 합산
 * 🔧 매개변수: start/end (YYYY-MM-DD)
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface RevenuePoint { date: string; revenue: number; count: number }
export interface RevenueRange {
  start: string; end: string;
  total_revenue: number; total_count: number;
  by_date: RevenuePoint[];
}

export interface ExpensePoint { date: string; total: number }
export interface ExpenseRange {
  start: string; end: string;
  total: number;
  by_category: Record<string, number>;
  by_date: ExpensePoint[];
}

// ============================================================
// 📌 getRevenueRange: 기간 매출 자동 집계
// 📤 RevenueRange — 일자별 매출/예약건수 + 총합
// ============================================================
export async function getRevenueRange(start: string, end: string): Promise<RevenueRange> {
  const res = await fetch(`${API_BASE}/api/massage-bookings/revenue/range?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('매출 집계 오류');
  return res.json();
}

// ============================================================
// 📌 getExpenseRange: 기간 비용 자동 집계
// 📤 ExpenseRange — 카테고리별·일자별 비용 + 총합
// ============================================================
export async function getExpenseRange(start: string, end: string): Promise<ExpenseRange> {
  const res = await fetch(`${API_BASE}/api/expense/range?start=${start}&end=${end}`);
  if (!res.ok) throw new Error('비용 집계 오류');
  return res.json();
}

// ── 비용 카테고리 라벨 (expense 라우터와 동일) ──────────────────
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  food:          '🍽️ 식비',
  transport:     '🚗 교통비',
  supplies:      '🛒 소모품',
  utilities:     '💡 공과금',
  entertainment: '🤝 접대비',
  medical:       '🏥 의료비',
  other:         '📦 기타',
};
