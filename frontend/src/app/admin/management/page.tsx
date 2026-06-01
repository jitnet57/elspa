'use client';

/**
 * ============================================================
 * 📌 경영지표 (Management Metrics)
 * 📋 월 영업이익 = 총매출 − 지출(급여/부대비용/간접비용/복리후생비/유류비/은행이자/수도세)
 *    순이익 = 영업이익 − 세금 / 연(年) 누적 계산
 * 💾 localStorage('elspa.metrics') 월별 저장 (백엔드 불필요)
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

import { useEffect, useMemo, useState } from 'react';

interface IndirectItem { label: string; amount: number }
interface MetricsMonth {
  revenue: number;       // 총매출
  payroll: number;       // 급여
  incidental: number;    // 부대비용
  indirect: IndirectItem[]; // 간접비용 (전기세/임대료/차량할부금 + 추가)
  welfare: number;       // 복리후생비
  fuel: number;          // 유류비
  bankInterest: number;  // 은행이자
  water: number;         // 수도세
  tax: number;           // 세금
}

const STORE_KEY = 'elspa.metrics';
const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });

const emptyMonth = (): MetricsMonth => ({
  revenue: 0, payroll: 0, incidental: 0,
  indirect: [
    { label: '전기세', amount: 0 },
    { label: '임대료', amount: 0 },
    { label: '차량할부금', amount: 0 },
  ],
  welfare: 0, fuel: 0, bankInterest: 0, water: 0, tax: 0,
});

type Store = Record<string, MetricsMonth>; // key: "YYYY-MM"

const loadStore = (): Store => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
};
const saveStore = (s: Store) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {} };

const indirectTotal = (m: MetricsMonth) => m.indirect.reduce((s, i) => s + (i.amount || 0), 0);
const expenseTotal = (m: MetricsMonth) =>
  m.payroll + m.incidental + indirectTotal(m) + m.welfare + m.fuel + m.bankInterest + m.water;
const operatingProfit = (m: MetricsMonth) => m.revenue - expenseTotal(m);
const netProfit = (m: MetricsMonth) => operatingProfit(m) - m.tax;

export default function ManagementMetricsPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [store, setStore] = useState<Store>({});

  useEffect(() => { setStore(loadStore()); }, []);

  const key = `${year}-${String(month).padStart(2, '0')}`;
  const m = store[key] ?? emptyMonth();

  const update = (patch: Partial<MetricsMonth>) => {
    const next = { ...store, [key]: { ...m, ...patch } };
    setStore(next); saveStore(next);
  };
  const updIndirect = (idx: number, patch: Partial<IndirectItem>) => {
    const indirect = m.indirect.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    update({ indirect });
  };
  const addIndirect = () => update({ indirect: [...m.indirect, { label: '신규 항목', amount: 0 }] });
  const removeIndirect = (idx: number) => update({ indirect: m.indirect.filter((_, i) => i !== idx) });

  // 연 누적 (해당 연도 모든 월 합산)
  const yearAgg = useMemo(() => {
    const months = Object.entries(store).filter(([k]) => k.startsWith(`${year}-`)).map(([, v]) => v);
    const acc = { revenue: 0, expense: 0, operating: 0, net: 0, tax: 0 };
    months.forEach((mm) => {
      acc.revenue += mm.revenue; acc.expense += expenseTotal(mm);
      acc.operating += operatingProfit(mm); acc.net += netProfit(mm); acc.tax += mm.tax;
    });
    return acc;
  }, [store, year]);

  const numInput = (val: number, on: (n: number) => void) => (
    <input type="number" value={val || ''} onChange={(e) => on(Number(e.target.value) || 0)}
      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-right text-gray-900 focus:border-blue-500 focus:outline-none" placeholder="0" />
  );

  const ExpenseRow = ({ label, val, on }: { label: string; val: number; on: (n: number) => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      {numInput(val, on)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-6 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📈 경영지표</h1>
        <p className="text-gray-600 mt-1 text-sm">월 영업이익 · 순이익 · 연 누적</p>
      </div>

      <main className="px-6 py-6 max-w-5xl mx-auto">
        {/* 기간 선택 */}
        <div className="flex items-center gap-3 mb-6">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900">
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => <option key={mm} value={mm}>{mm}월</option>)}
          </select>
        </div>

        {/* 월 요약 KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi label="총매출" value={peso(m.revenue)} cls="from-blue-500 to-blue-600" />
          <Kpi label="총지출" value={peso(expenseTotal(m))} cls="from-red-500 to-red-600" />
          <Kpi label="영업이익" value={peso(operatingProfit(m))} cls="from-emerald-500 to-emerald-600" />
          <Kpi label="순이익 (−세금)" value={peso(netProfit(m))} cls="from-purple-500 to-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 매출/세금 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">💰 매출 · 세금</h3>
            <ExpenseRow label="총매출" val={m.revenue} on={(v) => update({ revenue: v })} />
            <ExpenseRow label="세금" val={m.tax} on={(v) => update({ tax: v })} />
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">영업이익</span><b className="text-emerald-600">{peso(operatingProfit(m))}</b></div>
              <div className="flex justify-between"><span className="text-gray-600">순이익</span><b className="text-purple-600">{peso(netProfit(m))}</b></div>
            </div>
          </div>

          {/* 지출 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">📉 지출</h3>
            <ExpenseRow label="급여" val={m.payroll} on={(v) => update({ payroll: v })} />
            <ExpenseRow label="부대비용" val={m.incidental} on={(v) => update({ incidental: v })} />
            <ExpenseRow label="복리후생비" val={m.welfare} on={(v) => update({ welfare: v })} />
            <ExpenseRow label="유류비" val={m.fuel} on={(v) => update({ fuel: v })} />
            <ExpenseRow label="은행이자" val={m.bankInterest} on={(v) => update({ bankInterest: v })} />
            <ExpenseRow label="수도세" val={m.water} on={(v) => update({ water: v })} />

            {/* 간접비용 (항목 추가 가능) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">간접비용 (전기세·임대료·차량할부금 등)</span>
                <button onClick={addIndirect} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">+ 항목 추가</button>
              </div>
              {m.indirect.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1">
                  <input value={it.label} onChange={(e) => updIndirect(idx, { label: e.target.value })}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900" />
                  {numInput(it.amount, (v) => updIndirect(idx, { amount: v }))}
                  <button onClick={() => removeIndirect(idx)} className="text-red-500 hover:text-red-700 px-1">✕</button>
                </div>
              ))}
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100"><span className="text-gray-600">간접비용 합계</span><b>{peso(indirectTotal(m))}</b></div>
            </div>

            <div className="flex justify-between mt-4 pt-3 border-t-2 border-gray-200 font-bold"><span>총지출</span><span className="text-red-600">{peso(expenseTotal(m))}</span></div>
          </div>
        </div>

        {/* 연 누적 */}
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-6">
          <h3 className="font-black text-lg mb-4">📅 {year}년 누적</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <YearStat label="누적 매출" value={peso(yearAgg.revenue)} />
            <YearStat label="누적 지출" value={peso(yearAgg.expense)} />
            <YearStat label="누적 영업이익" value={peso(yearAgg.operating)} />
            <YearStat label="누적 세금" value={peso(yearAgg.tax)} />
            <YearStat label="누적 순이익" value={peso(yearAgg.net)} highlight />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">* 입력 즉시 자동 저장(localStorage). 월별로 입력하면 연 누적이 자동 합산됩니다.</p>
      </main>
    </div>
  );
}

function Kpi({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className={`bg-gradient-to-br ${cls} rounded-lg p-4 text-white`}>
      <p className="text-xs opacity-90">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
function YearStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-purple-600' : 'bg-white/10'}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}
