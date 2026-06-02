'use client';

/**
 * ============================================================
 * 📌 PeriodReport — 경영지표 일간·주간 자동 집계 보고서
 * 📋 매출(예약 service_price) + 비용(expense) 기간 합산 → 영업이익
 * 🔧 mode: 'daily' | 'weekly'  / 날짜 선택 시 해당 일·주 집계
 * 🔌 GET /api/massage-bookings/revenue/range, /api/expense/range
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getRevenueRange, getExpenseRange, EXPENSE_CATEGORY_LABELS,
  type RevenueRange, type ExpenseRange,
} from '@/lib/api/metrics-report-client';

const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });

// YYYY-MM-DD (로컬 기준)
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 선택일이 속한 주(월~일) 범위
function weekRange(dateStr: string): [string, string] {
  const d = new Date(dateStr + 'T00:00:00');
  const mondayOffset = (d.getDay() + 6) % 7; // 월=0 … 일=6
  const mon = new Date(d); mon.setDate(d.getDate() - mondayOffset);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return [iso(mon), iso(sun)];
}

export default function PeriodReport({ mode }: { mode: 'daily' | 'weekly' }) {
  const today = useMemo(() => iso(new Date()), []);
  const [anchor, setAnchor] = useState(today);
  const [rev, setRev] = useState<RevenueRange | null>(null);
  const [exp, setExp] = useState<ExpenseRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [start, end] = useMemo<[string, string]>(
    () => (mode === 'daily' ? [anchor, anchor] : weekRange(anchor)),
    [mode, anchor],
  );

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const [r, e] = await Promise.all([getRevenueRange(start, end), getExpenseRange(start, end)]);
      setRev(r); setExp(e);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : '집계 오류');
      setRev(null); setExp(null);
    } finally { setLoading(false); }
  }, [start, end]);

  useEffect(() => { load(); }, [load]);

  const revenue = rev?.total_revenue ?? 0;
  const cost = exp?.total ?? 0;
  const profit = revenue - cost;
  const bookings = rev?.total_count ?? 0;

  // 일자별 매출/비용 결합 (주간 차트용)
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; 매출: number; 비용: number }>();
    rev?.by_date.forEach((d) => map.set(d.date, { date: d.date.slice(5), 매출: d.revenue, 비용: 0 }));
    exp?.by_date.forEach((d) => {
      const k = d.date.slice(5);
      const cur = map.get(d.date) ?? { date: k, 매출: 0, 비용: 0 };
      cur.비용 = d.total; map.set(d.date, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rev, exp]);

  const categories = Object.entries(exp?.by_category ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <main className="px-6 py-6 max-w-5xl mx-auto">
      {/* 기간 선택 */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <label className="text-sm font-bold text-gray-700">{mode === 'daily' ? '날짜' : '기준일(주)'}</label>
        <input
          type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)}
          className="px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
        />
        <span className="text-sm text-gray-500">
          집계 구간: <b className="text-gray-700">{start}</b>{mode === 'weekly' && <> ~ <b className="text-gray-700">{end}</b></>}
        </span>
        <button onClick={load} disabled={loading}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold">
          {loading ? '집계 중…' : '🔄 새로고침'}
        </button>
        <Link href="/admin/expense"
          className="px-3 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-bold">
          💸 비용 등록 →
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-5">* 매출=예약(service_price) 자동 합산 · 비용=일자별 지출 자동 합산. 비용 입력은 「비용 등록」에서.</p>

      {err && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-semibold">⚠️ {err} (백엔드 API 연결을 확인하세요)</div>}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="매출" value={peso(revenue)} cls="from-blue-500 to-blue-600" />
        <Kpi label="비용" value={peso(cost)} cls="from-red-500 to-red-600" />
        <Kpi label="영업이익" value={peso(profit)} cls={profit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-rose-500 to-rose-600'} />
        <Kpi label="예약 건수" value={`${bookings.toLocaleString()} 건`} cls="from-purple-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 비용 카테고리 분해 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">📉 비용 분류</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">등록된 비용이 없습니다.</p>
          ) : (
            <>
              {categories.map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</span>
                  <b className="text-gray-900">{peso(amt)}</b>
                </div>
              ))}
              <div className="flex justify-between mt-3 pt-3 border-t-2 border-gray-200 font-bold">
                <span>비용 합계</span><span className="text-red-600">{peso(cost)}</span>
              </div>
            </>
          )}
        </div>

        {/* 손익 요약 / 주간 차트 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">{mode === 'weekly' ? '📊 일자별 매출·비용' : '💰 손익 요약'}</h3>
          {mode === 'weekly' ? (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(v) => peso(Number(v))} />
                  <Legend />
                  <Bar dataKey="매출" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="비용" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="매출" value={peso(revenue)} />
              <Row label="비용" value={peso(cost)} red />
              <div className="flex justify-between pt-3 border-t-2 border-gray-200 font-bold">
                <span>영업이익</span>
                <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{peso(profit)}</span>
              </div>
              <div className="flex justify-between text-gray-500"><span>이익률</span><span>{revenue > 0 ? Math.round((profit / revenue) * 100) : 0}%</span></div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className={`bg-gradient-to-br ${cls} rounded-lg p-4 text-white`}>
      <p className="text-xs opacity-90">{label}</p><p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
function Row({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-gray-700">{label}</span>
      <b className={red ? 'text-red-600' : 'text-gray-900'}>{value}</b>
    </div>
  );
}
