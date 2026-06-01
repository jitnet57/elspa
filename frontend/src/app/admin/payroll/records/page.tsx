'use client';

/**
 * ============================================================
 * 📌 급여정산 화면 (Payroll Settlement) — DB 연동
 * 🔌 직원: employees(Supabase) / 입력·결과: payroll_records(Supabase) 저장
 *    raw 입력값(출근일·야근분·지각분·공제 등)은 payroll_records.notes(JSON)에 보관 → 재편집
 * 🧮 규칙: 테라피스트=수수료 / 정직원=13일 만근 전액 / 다른직원=개별일급×출근일
 *    + 야근(설정), 지각(유예·설정), 공휴일 가산(설정), SSS 선지급(인보이스·전액회수)
 * 📅 개정: 2026-06-02 (정적 MOCK → DB 연동)
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPayrollSettings, DEFAULT_PAYROLL_SETTINGS, type PayrollSettings } from '@/lib/payroll-settings';
import {
  getEmployees, ensurePayrollPeriod, getPayrollRecords, upsertPayrollRecord,
  type Employee,
} from '@/lib/api/payroll-client';

const FULL_DAYS = 13;
type EmpType = 'manager' | 'hollys' | 'nail' | 'maintenance' | 'therapist' | 'driver';
const TYPE_LABEL: Record<EmpType, string> = {
  manager: '매니저(정직원)', hollys: '할리스커피', nail: '네일샵',
  maintenance: '메인테넌스', therapist: '테라피스트', driver: '드라이버',
};
const TYPE_ORDER: EmpType[] = ['manager', 'therapist', 'driver', 'nail', 'hollys', 'maintenance'];

// 정산기간마다 달라지는 입력값(원천) — payroll_records.notes(JSON)에 저장
interface Raw {
  days_worked: number; overtime_minutes: number;
  national_ot_min: number; special_ot_min: number; // 공휴일 야근(분) — 공휴일 시급 적용
  national_days: number; special_days: number; late_minutes: number;
  commission: number; driving_allowance: number; meal_allowance: number;
  sss: number; cash_advance: number; health_check: number; thirteenth: number; absence: number;
}
const emptyRaw = (): Raw => ({
  days_worked: 0, overtime_minutes: 0, national_ot_min: 0, special_ot_min: 0,
  national_days: 0, special_days: 0, late_minutes: 0,
  commission: 0, driving_allowance: 0, meal_allowance: 0,
  sss: 0, cash_advance: 0, health_check: 0, thirteenth: 0, absence: 0,
});

interface Row extends Raw {
  emp: Employee; type: EmpType;
  status: 'draft' | 'approved' | 'paid';
  saved: boolean; saving: boolean;
}

function basePayOf(type: EmpType, base_salary: number, daily_wage: number, days: number): number {
  if (type === 'therapist') return 0;
  if (type === 'manager') return days >= FULL_DAYS ? base_salary : daily_wage * days;
  return daily_wage * days;
}
function computeRow(r: Row, s: PayrollSettings) {
  const daily = r.emp.daily_wage ?? 0;
  const base = basePayOf(r.type, r.emp.base_salary, daily, r.days_worked);
  const commission = r.type === 'therapist' ? r.commission : 0;
  const driving = r.type === 'driver' ? r.driving_allowance : 0;
  const meal = r.meal_allowance;
  // 평일 야근 (40분 임계) + 공휴일 야근(공휴일 시급 적용)
  const normalOt = r.overtime_minutes >= s.overtimeMinThreshold ? Math.round((r.overtime_minutes / 60) * s.overtimeHourlyRate) : 0;
  const natOt = Math.round((r.national_ot_min / 60) * s.nationalHolidayOtRate);
  const specOt = Math.round((r.special_ot_min / 60) * s.specialHolidayOtRate);
  const overtime = normalOt + natOt + specOt;
  // 공휴일 (일) 가산 — 일급 기준
  const holiday = Math.round(daily * (s.nationalHolidayMultiplier - 1) * r.national_days + daily * (s.specialHolidayMultiplier - 1) * r.special_days);
  const gross = base + commission + driving + meal + overtime + holiday;
  const lateDed = Math.max(0, r.late_minutes - s.lateGraceMinutes) * s.latePerMinute;
  const totalDeductions = r.sss + r.cash_advance + r.health_check + r.thirteenth + lateDed + r.absence;
  const net = Math.max(0, gross - totalDeductions);
  return { base, commission, driving, meal, overtime, holiday, gross, lateDed, totalDeductions, net };
}

const peso = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
const statusBadge = (s: string) => (s === 'paid' ? 'bg-green-100 text-green-700' : s === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700');
const statusLabel = (s: string) => (s === 'paid' ? '💰 지급' : s === 'approved' ? '✅ 확정' : '📝 작성');

// 기본 격주 기간 (오늘 기준 직전 14일)
function defaultPeriod() {
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate() - 13);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(end) };
}

export default function PayrollSettlementPage() {
  const [settings, setSettings] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS);
  const dp = useMemo(defaultPeriod, []);
  const [periodStart, setPeriodStart] = useState(dp.start);
  const [periodEnd, setPeriodEnd] = useState(dp.end);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EmpType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => setSettings(getPayrollSettings()), []);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const emps = await getEmployees();
      let recs: any[] = [];
      let pid: number | null = null;
      try {
        const period = await ensurePayrollPeriod(periodStart, periodEnd, 'biweekly');
        pid = period.id;
        recs = await getPayrollRecords({ payroll_period_id: pid });
      } catch (e) {
        // period/records 실패해도 직원 명단은 표시
        console.warn('기간/레코드 로드 실패:', e);
      }
      setPeriodId(pid);
      const byEmp = new Map<number, any>(recs.map((r) => [r.employee_id, r]));
      setRows(
        (emps as Employee[]).filter((e) => e.is_active !== false).map((e) => {
          const rec = byEmp.get(e.id);
          let raw = emptyRaw();
          if (rec?.notes) { try { raw = { ...raw, ...JSON.parse(rec.notes) }; } catch {} }
          return {
            emp: e, type: (e.employee_type as EmpType) ?? 'manager',
            ...raw,
            status: (rec?.status as Row['status']) ?? 'draft',
            saved: !!rec, saving: false,
          };
        }),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : '직원 로드 실패 (Supabase 확인)');
      setRows([]);
    } finally { setLoading(false); }
  }, [periodStart, periodEnd]);

  useEffect(() => { load(); }, [load]);

  const update = (empId: number, patch: Partial<Raw> | { status: Row['status'] }) =>
    setRows((prev) => prev.map((r) => (r.emp.id === empId ? { ...r, ...patch, saved: false } : r)));

  const saveRow = async (row: Row) => {
    if (!periodId) { setErr('정산 기간 생성 실패 — payroll_periods 테이블/RLS 확인'); return; }
    setRows((prev) => prev.map((r) => (r.emp.id === row.emp.id ? { ...r, saving: true } : r)));
    const c = computeRow(row, settings);
    const raw: Raw = {
      days_worked: row.days_worked, overtime_minutes: row.overtime_minutes,
      national_ot_min: row.national_ot_min, special_ot_min: row.special_ot_min,
      national_days: row.national_days,
      special_days: row.special_days, late_minutes: row.late_minutes, commission: row.commission,
      driving_allowance: row.driving_allowance, meal_allowance: row.meal_allowance, sss: row.sss,
      cash_advance: row.cash_advance, health_check: row.health_check, thirteenth: row.thirteenth, absence: row.absence,
    };
    let ok = false;
    try {
      await upsertPayrollRecord(periodId, row.emp.id, {
        base_amount: c.base, commission_amount: c.commission, overtime_amount: c.overtime, holiday_bonus: c.holiday,
        meal_allowance: c.meal, late_deduction: c.lateDed, absence_deduction: row.absence, sss_deduction: row.sss,
        ca_deduction: row.cash_advance, health_check_deduction: row.health_check, thirteenth_month_deduction: row.thirteenth,
        gross_pay: c.gross, total_deductions: c.totalDeductions, net_pay: c.net, status: row.status,
        notes: JSON.stringify(raw),
      });
      ok = true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : '저장 실패');
    }
    setRows((prev) => prev.map((r) => (r.emp.id === row.emp.id ? { ...r, saving: false, saved: ok } : r)));
  };

  const filtered = rows.filter((r) => (typeFilter === 'all' || r.type === typeFilter) && r.emp.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = useMemo(() => {
    const g: Record<string, Row[]> = {};
    filtered.forEach((r) => (g[r.type] ??= []).push(r));
    return g;
  }, [filtered]);
  const totals = filtered.reduce((a, r) => {
    const c = computeRow(r, settings); a.gross += c.gross; a.ded += c.totalDeductions; a.net += c.net; return a;
  }, { gross: 0, ded: 0, net: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💵 급여정산 (직원)</h1>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="px-2 py-1 border rounded text-gray-900" />
            <span className="text-gray-500">~</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="px-2 py-1 border rounded text-gray-900" />
            <span className="text-xs text-gray-400">(격주)</span>
            {loading && <span className="text-xs text-gray-400">불러오는 중…</span>}
          </div>
        </div>
        <a href="/admin/payroll/settings" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700">⚙️ 급여 설정</a>
      </div>

      <main className="px-4 py-6 pb-24 max-w-6xl mx-auto">
        {err && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">⚠️ {err}</div>}

        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
          <p className="font-bold mb-1">🧮 급여 규칙 (격주 {FULL_DAYS}근무일 · 단가는 설정값)</p>
          <ul className="list-disc pl-5 space-y-0.5 text-indigo-800">
            <li>테라피스트=수수료 / 매니저=만근 전액 / 다른직원=개별 일급×출근일 (드라이버 +운행수당 +식비 {peso(200)}/2주)</li>
            <li>평일야근 {settings.overtimeMinThreshold}분↑ 1h당 {peso(settings.overtimeHourlyRate)} · <b>공휴일 야근</b> 국가 {peso(settings.nationalHolidayOtRate)}/h·특별 {peso(settings.specialHolidayOtRate)}/h</li>
            <li>공휴일(일) 가산 국가 {Math.round(settings.nationalHolidayMultiplier*100)}%/특별 {Math.round(settings.specialHolidayMultiplier*100)}% (일급 기준)</li>
            <li>지각 {settings.lateGraceMinutes}분 유예 후 1분당 {peso(settings.latePerMinute)} · SSS 선지급(인보이스·전액회수)</li>
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">총 지급</p><h3 className="text-xl font-bold mt-1">{peso(totals.gross)}</h3></div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">총 차감</p><h3 className="text-xl font-bold mt-1">{peso(totals.ded)}</h3></div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">실수령</p><h3 className="text-xl font-bold mt-1">{peso(totals.net)}</h3></div>
        </div>

        <div className="mb-5 flex flex-wrap gap-3 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 직원 이름 검색" className="flex-1 min-w-[180px] px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-900">
            <option value="all">전체 직군</option>
            {TYPE_ORDER.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border">불러오는 중…</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border">직원 데이터 없음 (employees 테이블 확인)</div>
        ) : (
          TYPE_ORDER.filter((t) => grouped[t]?.length).map((t) => (
            <div key={t} className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b font-bold text-gray-800">{TYPE_LABEL[t]} <span className="text-xs text-gray-500">({grouped[t].length}명)</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="px-3 py-2">직원</th>
                      <th className="px-3 py-2 w-20">출근일</th>
                      <th className="px-3 py-2 w-24">야근(분)</th>
                      <th className="px-3 py-2 w-24">지각(분)</th>
                      <th className="px-3 py-2 w-28">SSS선지급</th>
                      <th className="px-3 py-2 w-24">가불</th>
                      <th className="px-3 py-2 text-right">실수령</th>
                      <th className="px-3 py-2 w-16">상세</th>
                      <th className="px-3 py-2 w-20">저장</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[t].map((r) => {
                      const c = computeRow(r, settings);
                      const numCell = (v: number, on: (n: number) => void) => (
                        <input type="number" value={v || ''} onChange={(e) => on(Number(e.target.value) || 0)} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-gray-900" placeholder="0" />
                      );
                      return (
                        <tr key={r.emp.id} className={`border-b border-gray-50 ${r.saved ? 'bg-emerald-50/40' : ''}`}>
                          <td className="px-3 py-1.5 font-semibold text-gray-900">{r.emp.name}</td>
                          <td className="px-3 py-1.5">{r.type === 'therapist' ? '—' : numCell(r.days_worked, (v) => update(r.emp.id, { days_worked: v }))}</td>
                          <td className="px-3 py-1.5">{numCell(r.overtime_minutes, (v) => update(r.emp.id, { overtime_minutes: v }))}</td>
                          <td className="px-3 py-1.5">{numCell(r.late_minutes, (v) => update(r.emp.id, { late_minutes: v }))}</td>
                          <td className="px-3 py-1.5">{numCell(r.sss, (v) => update(r.emp.id, { sss: v }))}</td>
                          <td className="px-3 py-1.5">{numCell(r.cash_advance, (v) => update(r.emp.id, { cash_advance: v }))}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-blue-600">{peso(c.net)}</td>
                          <td className="px-3 py-1.5"><button onClick={() => setSelected(r)} className="text-xs px-2 py-1 bg-gray-100 rounded">상세</button></td>
                          <td className="px-3 py-1.5">
                            <button onClick={() => saveRow(r)} disabled={r.saving} className={`w-full px-2 py-1 rounded font-bold text-xs ${r.saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                              {r.saving ? '…' : r.saved ? '✓' : '저장'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </main>

      {selected && <DetailModal row={selected} s={settings} onClose={() => setSelected(null)} onChange={update} onSave={saveRow} />}
    </div>
  );
}

function DetailModal({ row, s, onClose, onChange, onSave }: {
  row: Row; s: PayrollSettings; onClose: () => void;
  onChange: (id: number, patch: Partial<Raw> | { status: Row['status'] }) => void; onSave: (r: Row) => void;
}) {
  const c = computeRow(row, s);
  const field = (label: string, v: number, on: (n: number) => void) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input type="number" value={v || ''} onChange={(e) => on(Number(e.target.value) || 0)} className="w-32 px-2 py-1 border rounded text-right text-gray-900" placeholder="0" />
    </div>
  );
  const id = row.emp.id;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white text-gray-900 w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div><h2 className="text-xl font-bold">{row.emp.name}</h2><p className="text-sm text-gray-500">{TYPE_LABEL[row.type]} · 기본급 {peso(row.emp.base_salary)} · 일급 {peso(row.emp.daily_wage ?? 0)}</p></div>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold mb-2">💰 수입 입력</h3>
            {row.type !== 'therapist' && field('출근일 (/13)', row.days_worked, (v) => onChange(id, { days_worked: v }))}
            {row.type === 'therapist' && field('수수료(정해진 금액)', row.commission, (v) => onChange(id, { commission: v }))}
            {row.type === 'driver' && field('운행수당', row.driving_allowance, (v) => onChange(id, { driving_allowance: v }))}
            {field('식비', row.meal_allowance, (v) => onChange(id, { meal_allowance: v }))}
            {field('평일 야근(분)', row.overtime_minutes, (v) => onChange(id, { overtime_minutes: v }))}
            {field('국가공휴일 야근(분)', row.national_ot_min, (v) => onChange(id, { national_ot_min: v }))}
            {field('특별공휴일 야근(분)', row.special_ot_min, (v) => onChange(id, { special_ot_min: v }))}
            {field('국가공휴일(일)', row.national_days, (v) => onChange(id, { national_days: v }))}
            {field('특별공휴일(일)', row.special_days, (v) => onChange(id, { special_days: v }))}
            <div className="flex justify-between font-bold border-t border-green-200 pt-2 mt-1"><span>총 지급</span><span className="text-green-700">{peso(c.gross)}</span></div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold mb-2">📉 차감 입력</h3>
            {field('지각(분)', row.late_minutes, (v) => onChange(id, { late_minutes: v }))}
            {field('SSS 선지급(인보이스)', row.sss, (v) => onChange(id, { sss: v }))}
            {field('가불(CA)', row.cash_advance, (v) => onChange(id, { cash_advance: v }))}
            {field('건강검진', row.health_check, (v) => onChange(id, { health_check: v }))}
            {field('13개월 적립', row.thirteenth, (v) => onChange(id, { thirteenth: v }))}
            {field('결근', row.absence, (v) => onChange(id, { absence: v }))}
            <div className="flex justify-between font-bold border-t border-red-200 pt-2 mt-1"><span>총 차감</span><span className="text-red-600">-{peso(c.totalDeductions)}</span></div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">실수령액</p><h3 className="text-3xl font-bold mt-1">{peso(c.net)}</h3></div>
          <div className="flex items-center gap-2">
            <select value={row.status} onChange={(e) => onChange(id, { status: e.target.value as Row['status'] })} className="px-3 py-2 border rounded text-gray-900">
              <option value="draft">📝 작성</option><option value="approved">✅ 확정</option><option value="paid">💰 지급</option>
            </select>
            <button onClick={() => { onSave(row); }} disabled={row.saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">{row.saving ? '저장 중…' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
