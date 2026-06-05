'use client';

/**
 * ============================================================
 * 📌 경영지표 (Management Metrics)
 * 📋 월 영업이익 = 총매출 − 지출 / 순이익 = 영업이익 − 세금 / 연 누적
 * 🔌 Supabase 저장(management_metrics) + localStorage 폴백
 * 🔗 정산 매출 자동 연동(monthly_settlements) / 월별 추이 차트(recharts)
 * 📅 2026-06-01
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMonthMetrics, saveMonthMetrics, getYearMetrics } from '@/lib/api/management-client';
import { getMonthlySettlements } from '@/lib/api/companies-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PeriodReport from './PeriodReport';
import { useT } from '@/lib/i18n';
import { useRealtimeMetrics } from '@/lib/hooks/useRealtimeMetrics';

type Period = 'daily' | 'weekly' | 'monthly';

interface IndirectItem { label: string; amount: number }
interface MetricsMonth {
  revenue: number; payroll: number; incidental: number;
  indirect: IndirectItem[]; welfare: number; fuel: number; bankInterest: number; water: number; tax: number;
}

const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });
const emptyMonth = (): MetricsMonth => ({
  revenue: 0, payroll: 0, incidental: 0,
  indirect: [{ label: '전기세', amount: 0 }, { label: '임대료', amount: 0 }, { label: '차량할부금', amount: 0 }],
  welfare: 0, fuel: 0, bankInterest: 0, water: 0, tax: 0,
});
const norm = (d: any): MetricsMonth => ({ ...emptyMonth(), ...(d || {}), indirect: d?.indirect ?? emptyMonth().indirect });

const indirectTotal = (m: MetricsMonth) => m.indirect.reduce((s, i) => s + (i.amount || 0), 0);
const expenseTotal = (m: MetricsMonth) => m.payroll + m.incidental + indirectTotal(m) + m.welfare + m.fuel + m.bankInterest + m.water;
const operatingProfit = (m: MetricsMonth) => m.revenue - expenseTotal(m);
const netProfit = (m: MetricsMonth) => operatingProfit(m) - m.tax;

export default function ManagementMetricsPage() {
  const t = useT();
  const now = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [m, setM] = useState<MetricsMonth>(emptyMonth());
  const [yearData, setYearData] = useState<Record<string, MetricsMonth>>({});
  const [loadingRev, setLoadingRev] = useState(false);

  // 🔄 실시간 메트릭 데이터
  const { metrics: realtimeMetrics, loading: realtimeLoading } = useRealtimeMetrics(year, month);

  const key = `${year}-${String(month).padStart(2, '0')}`;

  // 월 데이터 로드
  useEffect(() => { getMonthMetrics(key).then((d) => setM(norm(d))); }, [key]);
  // 연 데이터 로드 (차트/누적)
  const loadYear = useCallback(() => {
    getYearMetrics(year).then((all) => {
      const out: Record<string, MetricsMonth> = {};
      Object.entries(all).forEach(([k, v]) => { out[k] = norm(v); });
      setYearData(out);
    });
  }, [year]);
  useEffect(() => { loadYear(); }, [loadYear]);

  const commit = (next: MetricsMonth) => {
    setM(next);
    setYearData((prev) => ({ ...prev, [key]: next }));
    saveMonthMetrics(key, next);
  };
  const update = (patch: Partial<MetricsMonth>) => commit({ ...m, ...patch });
  const updIndirect = (idx: number, patch: Partial<IndirectItem>) =>
    update({ indirect: m.indirect.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const addIndirect = () => update({ indirect: [...m.indirect, { label: '신규 항목', amount: 0 }] });
  const removeIndirect = (idx: number) => update({ indirect: m.indirect.filter((_, i) => i !== idx) });

  // 정산 매출 자동 연동
  const loadRevenue = async () => {
    setLoadingRev(true);
    try {
      const rows = await getMonthlySettlements({ settlement_month: key });
      const total = (rows || []).reduce((s: number, r: any) => s + (Number(r.total_revenue) || 0), 0);
      update({ revenue: total });
    } catch { /* noop */ } finally { setLoadingRev(false); }
  };

  // 연 누적
  const yearAgg = useMemo(() => {
    const acc = { revenue: 0, expense: 0, operating: 0, net: 0, tax: 0 };
    Object.values(yearData).forEach((mm) => {
      acc.revenue += mm.revenue; acc.expense += expenseTotal(mm);
      acc.operating += operatingProfit(mm); acc.net += netProfit(mm); acc.tax += mm.tax;
    });
    return acc;
  }, [yearData]);

  // 월별 추이 차트 데이터
  const chartData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const k = `${year}-${String(i + 1).padStart(2, '0')}`;
      const mm = yearData[k];
      return {
        month: t(`${i + 1}`, `${i + 1}월`),
        매출: mm ? mm.revenue : 0,
        영업이익: mm ? operatingProfit(mm) : 0,
        순이익: mm ? netProfit(mm) : 0,
      };
    }), [yearData, year, t]);

  const numInput = (val: number, on: (n: number) => void) => (
    <input type="number" value={val || ''} onChange={(e) => on(Number(e.target.value) || 0)}
      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-right text-gray-900 focus:border-blue-500 focus:outline-none" placeholder="0" />
  );
  const ExpenseRow = ({ label, val, on }: { label: string; val: number; on: (n: number) => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>{numInput(val, on)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-6 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('📈 Management Metrics', '📈 경영지표')}</h1>
        <p className="text-gray-600 mt-1 text-sm">{t('Daily · Weekly reports (auto-aggregated) · Monthly operating/net profit/cumulative', '일간 · 주간 보고서(자동 집계) · 월간 영업이익/순이익/누적')}</p>
        {/* 일간·주간·월간 탭 */}
        <div className="flex gap-2 mt-4">
          {([['daily', t('📆 Daily', '📆 일간')], ['weekly', t('🗓️ Weekly', '🗓️ 주간')], ['monthly', t('📅 Monthly', '📅 월간')]] as [Period, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                period === p
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {period !== 'monthly' && <PeriodReport mode={period} />}

      {period === 'monthly' && (
      <main className="px-6 py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900">
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{t(`${y}`, `${y}년`)}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => <option key={mm} value={mm}>{t(`${mm}`, `${mm}월`)}</option>)}
          </select>
          <button onClick={loadRevenue} disabled={loadingRev} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold">
            {loadingRev ? t('Loading…', '불러오는 중…') : t('🔄 Auto-load settlement revenue', '🔄 정산 매출 자동 불러오기')}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Kpi label={t('Total Revenue', '총매출')} value={peso(realtimeMetrics.totalRevenue)} cls="from-blue-500 to-blue-600" />
            {realtimeLoading && <div className="absolute top-2 right-2 text-xs text-blue-300">🔄 {t('Syncing...', '동기화중...')}</div>}
          </div>
          <div className="relative">
            <Kpi label={t('Total Expenses', '총지출')} value={peso(realtimeMetrics.totalExpenses)} cls="from-red-500 to-red-600" />
            {realtimeLoading && <div className="absolute top-2 right-2 text-xs text-red-300">🔄 {t('Syncing...', '동기화중...')}</div>}
          </div>
          <div className="relative">
            <Kpi label={t('Operating Profit', '영업이익')} value={peso(realtimeMetrics.operatingProfit)} cls="from-emerald-500 to-emerald-600" />
            {realtimeLoading && <div className="absolute top-2 right-2 text-xs text-emerald-300">🔄 {t('Syncing...', '동기화중...')}</div>}
          </div>
          <div className="relative">
            <Kpi label={t('Net Profit (−Tax)', '순이익 (−세금)')} value={peso(realtimeMetrics.netProfit)} cls="from-purple-500 to-purple-600" />
            {realtimeLoading && <div className="absolute top-2 right-2 text-xs text-purple-300">🔄 {t('Syncing...', '동기화중...')}</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">{t('💰 Revenue · Tax', '💰 매출 · 세금')}</h3>
            <ExpenseRow label={t('Total Revenue', '총매출')} val={m.revenue} on={(v) => update({ revenue: v })} />
            <ExpenseRow label={t('Tax', '세금')} val={m.tax} on={(v) => update({ tax: v })} />
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">{t('Operating Profit', '영업이익')}</span><b className="text-emerald-600">{peso(operatingProfit(m))}</b></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('Net Profit', '순이익')}</span><b className="text-purple-600">{peso(netProfit(m))}</b></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">{t('📉 Expenses', '📉 지출')}</h3>
            <ExpenseRow label={t('Payroll', '급여')} val={m.payroll} on={(v) => update({ payroll: v })} />
            <ExpenseRow label={t('Incidentals', '부대비용')} val={m.incidental} on={(v) => update({ incidental: v })} />
            <ExpenseRow label={t('Welfare', '복리후생비')} val={m.welfare} on={(v) => update({ welfare: v })} />
            <ExpenseRow label={t('Fuel', '유류비')} val={m.fuel} on={(v) => update({ fuel: v })} />
            <ExpenseRow label={t('Bank Interest', '은행이자')} val={m.bankInterest} on={(v) => update({ bankInterest: v })} />
            <ExpenseRow label={t('Water', '수도세')} val={m.water} on={(v) => update({ water: v })} />
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">{t('Indirect costs (electricity · rent · vehicle installment, etc.)', '간접비용 (전기세·임대료·차량할부금 등)')}</span>
                <button onClick={addIndirect} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">{t('+ Add item', '+ 항목 추가')}</button>
              </div>
              {m.indirect.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1">
                  <input value={it.label} onChange={(e) => updIndirect(idx, { label: e.target.value })} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900" />
                  {numInput(it.amount, (v) => updIndirect(idx, { amount: v }))}
                  <button onClick={() => removeIndirect(idx)} className="text-red-500 hover:text-red-700 px-1">✕</button>
                </div>
              ))}
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100"><span className="text-gray-600">{t('Indirect costs total', '간접비용 합계')}</span><b>{peso(indirectTotal(m))}</b></div>
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t-2 border-gray-200 font-bold"><span>{t('Total Expenses', '총지출')}</span><span className="text-red-600">{peso(expenseTotal(m))}</span></div>
          </div>
        </div>

        {/* 월별 추이 차트 */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">{t(`📊 ${year} Monthly Trend`, `📊 ${year}년 월별 추이`)}</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v, name) => [peso(Number(v)), name === '매출' ? t('Revenue', '매출') : name === '영업이익' ? t('Operating Profit', '영업이익') : name === '순이익' ? t('Net Profit', '순이익') : name]} />
                <Legend formatter={(value) => value === '매출' ? t('Revenue', '매출') : value === '영업이익' ? t('Operating Profit', '영업이익') : value === '순이익' ? t('Net Profit', '순이익') : value} />
                <Line type="monotone" dataKey="매출" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="영업이익" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="순이익" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 연 누적 */}
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-6">
          <h3 className="font-black text-lg mb-4">{t(`📅 ${year} Cumulative`, `📅 ${year}년 누적`)}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <YearStat label={t('Cumulative Revenue', '누적 매출')} value={peso(yearAgg.revenue)} />
            <YearStat label={t('Cumulative Expenses', '누적 지출')} value={peso(yearAgg.expense)} />
            <YearStat label={t('Cumulative Operating Profit', '누적 영업이익')} value={peso(yearAgg.operating)} />
            <YearStat label={t('Cumulative Tax', '누적 세금')} value={peso(yearAgg.tax)} />
            <YearStat label={t('Cumulative Net Profit', '누적 순이익')} value={peso(yearAgg.net)} highlight />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">{t('* Saved to Supabase instantly on input (localStorage if not configured). Settlement revenue is auto-aggregated from monthly settlement data.', '* 입력 즉시 Supabase 저장(미설정 시 localStorage). 정산 매출은 월정산 데이터에서 자동 합산.')}</p>
      </main>
      )}
    </div>
  );
}

function Kpi({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className={`bg-gradient-to-br ${cls} rounded-lg p-4 text-white`}>
      <p className="text-xs opacity-90">{label}</p><p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
function YearStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-purple-600' : 'bg-white/10'}`}>
      <p className="text-xs opacity-80">{label}</p><p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}
