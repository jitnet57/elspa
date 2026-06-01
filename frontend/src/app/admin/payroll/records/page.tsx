'use client';

/**
 * ============================================================
 * 📌 급여정산 화면 (Payroll Settlement) — 직군 규칙 + 설정 기반 가산/차감
 * 🧮 급여 규칙:
 *    - 테라피스트   : 수수료(정해진 금액)만
 *    - 매니저(정직원): 13일 만근 시 고정급 전액, 미달 시 개별 일급 × 출근일
 *    - 할리스/네일/메인/드라이버: 개별 일급 × 출근일 (개인마다 일급 다름)
 *    - 드라이버     : 일급×출근일 + 운행수당 + 식비
 *    - 가산(설정값) : 야근수당(야근시간×시급) + 공휴일가산(일급×(배율−1)×공휴일수)
 *    - 차감         : 지각(지각분×분당단가) + SSS + 가불 + 건강검진 + 13개월 + 결근
 * ⚙️ 단가/배율은 /admin/payroll/settings 에서 등록 (localStorage)
 * 🗓 주기: 격주(biweekly) = 13 근무일
 * 📅 개정: 2026-06-01
 * ============================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { getPayrollSettings, DEFAULT_PAYROLL_SETTINGS, type PayrollSettings } from '@/lib/payroll-settings';

const FULL_DAYS = 13;

type EmpType = 'manager' | 'hollys' | 'nail' | 'maintenance' | 'therapist' | 'driver';

const TYPE_LABEL: Record<EmpType, string> = {
  manager: '매니저(정직원)', hollys: '할리스커피', nail: '네일샵',
  maintenance: '메인테넌스', therapist: '테라피스트', driver: '드라이버',
};
const TYPE_ORDER: EmpType[] = ['manager', 'therapist', 'driver', 'nail', 'hollys', 'maintenance'];

interface EmpInput {
  id: number; name: string; type: EmpType;
  base_salary: number;       // 정직원 만근 전액
  daily_wage: number;        // 개별 일급 (각자 등록)
  days_worked: number;       // 출근일 (0~13)
  commission: number;        // 테라피스트 수수료(정해진 금액)
  driving_allowance: number; // 드라이버 운행수당
  meal_allowance: number;    // 식비
  // 가산 원천(설정 단가로 환산)
  overtime_minutes: number;  // 야근 분 (설정 임계값 이상일 때만 인정)
  national_days: number;     // 국가 공휴일 근무일
  special_days: number;      // 일반(특별) 공휴일 근무일
  // 차감
  late_minutes: number;      // 지각분(설정 분당단가로 환산)
  absence: number;           // 결근 차감액
  sss: number; cash_advance: number; health_check: number; thirteenth: number;
  status: 'draft' | 'approved' | 'paid';
}

function basePayOf(e: EmpInput): number {
  if (e.type === 'therapist') return 0;
  if (e.type === 'manager') return e.days_worked >= FULL_DAYS ? e.base_salary : e.daily_wage * e.days_worked;
  return e.daily_wage * e.days_worked;
}

function computePay(e: EmpInput, s: PayrollSettings) {
  const base = basePayOf(e);
  const commission = e.type === 'therapist' ? e.commission : 0;
  const driving = e.type === 'driver' ? e.driving_allowance : 0;
  const meal = e.meal_allowance;
  // 야근수당: 야근 분이 임계값(기본 40분) 이상일 때만 인정, 시간 환산 × 시급
  const overtime = e.overtime_minutes >= s.overtimeMinThreshold
    ? Math.round((e.overtime_minutes / 60) * s.overtimeHourlyRate)
    : 0;
  const holiday = Math.round(
    e.daily_wage * (s.nationalHolidayMultiplier - 1) * e.national_days +
      e.daily_wage * (s.specialHolidayMultiplier - 1) * e.special_days,
  );
  const gross = base + commission + driving + meal + overtime + holiday;

  // 지각 차감: 유예 분 초과분에 대해서만 분당 단가 적용
  const lateDed = Math.max(0, e.late_minutes - s.lateGraceMinutes) * s.latePerMinute;
  const totalDeductions = e.sss + e.cash_advance + e.health_check + e.thirteenth + lateDed + e.absence;
  const net = Math.max(0, gross - totalDeductions);
  return { base, commission, driving, meal, overtime, holiday, gross, lateDed, totalDeductions, net };
}

const MOCK: EmpInput[] = [
  { id: 1, name: 'Manager Kim', type: 'manager', base_salary: 30000, daily_wage: 2300, days_worked: 13, commission: 0, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 240, national_days: 0, special_days: 0, late_minutes: 0, absence: 0, sss: 1350, cash_advance: 0, health_check: 0, thirteenth: 1200, status: 'approved' },
  { id: 2, name: 'Manager Lee', type: 'manager', base_salary: 30000, daily_wage: 2300, days_worked: 11, commission: 0, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 0, national_days: 0, special_days: 0, late_minutes: 25, absence: 0, sss: 1350, cash_advance: 2000, health_check: 0, thirteenth: 1200, status: 'draft' },
  { id: 3, name: 'Therapist Sarah', type: 'therapist', base_salary: 0, daily_wage: 0, days_worked: 12, commission: 18500, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 0, national_days: 0, special_days: 0, late_minutes: 0, absence: 0, sss: 900, cash_advance: 3000, health_check: 0, thirteenth: 800, status: 'paid' },
  { id: 4, name: 'Therapist Emma', type: 'therapist', base_salary: 0, daily_wage: 0, days_worked: 13, commission: 21000, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 0, national_days: 0, special_days: 0, late_minutes: 0, absence: 0, sss: 1000, cash_advance: 0, health_check: 500, thirteenth: 900, status: 'draft' },
  { id: 5, name: 'Driver Jose', type: 'driver', base_salary: 0, daily_wage: 1400, days_worked: 12, commission: 0, driving_allowance: 3500, meal_allowance: 200, overtime_minutes: 360, national_days: 1, special_days: 0, late_minutes: 0, absence: 0, sss: 900, cash_advance: 1000, health_check: 0, thirteenth: 700, status: 'draft' },
  { id: 6, name: 'Nail Anna', type: 'nail', base_salary: 0, daily_wage: 1250, days_worked: 10, commission: 0, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 30, national_days: 0, special_days: 1, late_minutes: 15, absence: 0, sss: 720, cash_advance: 0, health_check: 0, thirteenth: 600, status: 'draft' },
  { id: 7, name: 'Hollys Grace', type: 'hollys', base_salary: 0, daily_wage: 1150, days_worked: 13, commission: 0, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 0, national_days: 0, special_days: 0, late_minutes: 0, absence: 0, sss: 700, cash_advance: 0, health_check: 0, thirteenth: 600, status: 'approved' },
  { id: 8, name: 'Maint. Pedro', type: 'maintenance', base_salary: 0, daily_wage: 1080, days_worked: 9, commission: 0, driving_allowance: 0, meal_allowance: 0, overtime_minutes: 0, national_days: 0, special_days: 0, late_minutes: 0, absence: 1080, sss: 650, cash_advance: 0, health_check: 0, thirteenth: 500, status: 'draft' },
];

const peso = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
const statusBadge = (s: string) => (s === 'paid' ? 'bg-green-100 text-green-700' : s === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700');
const statusLabel = (s: string) => (s === 'paid' ? '💰 지급' : s === 'approved' ? '✅ 확정' : '📝 작성');

export default function PayrollSettlementPage() {
  const [period] = useState('2026-05-15 ~ 2026-05-28 (격주)');
  const [settings, setSettings] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS);
  const [typeFilter, setTypeFilter] = useState<'all' | EmpType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EmpInput | null>(null);

  useEffect(() => setSettings(getPayrollSettings()), []);

  const rows = useMemo(
    () => MOCK.filter((e) => (typeFilter === 'all' || e.type === typeFilter) && e.name.toLowerCase().includes(search.toLowerCase())),
    [typeFilter, search],
  );
  const grouped = useMemo(() => {
    const g: Record<string, EmpInput[]> = {};
    rows.forEach((e) => (g[e.type] ??= []).push(e));
    return g;
  }, [rows]);
  const totals = useMemo(
    () => rows.reduce((a, e) => { const c = computePay(e, settings); a.gross += c.gross; a.ded += c.totalDeductions; a.net += c.net; return a; }, { gross: 0, ded: 0, net: 0 }),
    [rows, settings],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💵 급여정산 (직원)</h1>
          <p className="text-gray-600 mt-1 text-sm">정산기간: {period}</p>
        </div>
        <a href="/admin/payroll/settings" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 whitespace-nowrap">⚙️ 급여 설정</a>
      </div>

      <main className="px-4 py-6 pb-24 max-w-6xl mx-auto">
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
          <p className="font-bold mb-1">🧮 급여 규칙 (격주 {FULL_DAYS}근무일 · 단가는 설정값 반영)</p>
          <ul className="list-disc pl-5 space-y-0.5 text-indigo-800">
            <li><b>테라피스트</b>: 수수료(정해진 금액)만</li>
            <li><b>매니저(정직원)</b>: {FULL_DAYS}일 만근 시 고정급 전액, 미달 시 일급×출근일</li>
            <li><b>매니저·메인·드라이버·할리스</b>: 개별 일급 × 출근일 (드라이버는 +운행수당 +식비 {peso(200)}/2주)</li>
            <li><b>야근(퇴근)</b>: {settings.overtimeMinThreshold}분 이상 시 1시간당 {peso(settings.overtimeHourlyRate)} 지급</li>
            <li><b>공휴일(전직원)</b>: 국가공휴일 {Math.round(settings.nationalHolidayMultiplier * 100)}% · 특별공휴일 {Math.round(settings.specialHolidayMultiplier * 100)}% (일급×(배율−1) 추가 지급)</li>
            <li><b>지각(출근)</b>: {settings.lateGraceMinutes}분 유예, 초과분 1분당 {peso(settings.latePerMinute)} 차감 · <b>SSS 선지급(인보이스·전액회수)</b> · 가불 · 건강검진 · 13개월 · 결근</li>
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">총 지급(Gross)</p><h3 className="text-xl font-bold mt-1">{peso(totals.gross)}</h3></div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">총 차감</p><h3 className="text-xl font-bold mt-1">{peso(totals.ded)}</h3></div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white"><p className="text-xs opacity-90">실수령(Net)</p><h3 className="text-xl font-bold mt-1">{peso(totals.net)}</h3></div>
        </div>

        <div className="mb-5 flex flex-wrap gap-3 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 직원 이름 검색" className="flex-1 min-w-[180px] px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            <option value="all">전체 직군</option>
            {TYPE_ORDER.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">결과 없음</div>
        ) : (
          TYPE_ORDER.filter((t) => grouped[t]?.length).map((t) => (
            <div key={t} className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800">{TYPE_LABEL[t]} <span className="text-xs text-gray-500">({grouped[t].length}명)</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[820px]">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-100">
                      <th className="px-4 py-2">직원</th>
                      <th className="px-4 py-2 text-center">출근일</th>
                      <th className="px-4 py-2 text-right">일급</th>
                      <th className="px-4 py-2 text-right">기본급</th>
                      <th className="px-4 py-2 text-right">수수료</th>
                      <th className="px-4 py-2 text-right">가산</th>
                      <th className="px-4 py-2 text-right">차감</th>
                      <th className="px-4 py-2 text-right">실수령</th>
                      <th className="px-4 py-2 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[t].map((e) => {
                      const c = computePay(e, settings);
                      const extras = c.driving + c.meal + c.overtime + c.holiday;
                      return (
                        <tr key={e.id} onClick={() => setSelected(e)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                          <td className="px-4 py-2 font-semibold text-gray-900">{e.name}</td>
                          <td className="px-4 py-2 text-center">{e.type === 'therapist' ? '—' : `${e.days_worked}/${FULL_DAYS}`}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{e.daily_wage ? peso(e.daily_wage) : '—'}</td>
                          <td className="px-4 py-2 text-right">{c.base ? peso(c.base) : '—'}</td>
                          <td className="px-4 py-2 text-right">{c.commission ? peso(c.commission) : '—'}</td>
                          <td className="px-4 py-2 text-right text-emerald-600">{extras ? peso(extras) : '—'}</td>
                          <td className="px-4 py-2 text-right text-red-600">{peso(c.totalDeductions)}</td>
                          <td className="px-4 py-2 text-right font-bold text-blue-600">{peso(c.net)}</td>
                          <td className="px-4 py-2 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge(e.status)}`}>{statusLabel(e.status)}</span></td>
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

      {selected && <DetailModal e={selected} s={settings} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailModal({ e, s, onClose }: { e: EmpInput; s: PayrollSettings; onClose: () => void }) {
  const c = computePay(e, s);
  const row = (label: string, val: number, neg = false) =>
    val ? (
      <div className="flex justify-between"><span className="text-sm text-gray-700">{label}</span><span className={`text-sm font-bold ${neg ? 'text-red-600' : 'text-gray-900'}`}>{(neg ? '-' : '') + peso(val)}</span></div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{e.name}</h2>
            <p className="text-sm text-gray-500">{TYPE_LABEL[e.type]} · 출근 {e.type === 'therapist' ? '—' : `${e.days_worked}/${FULL_DAYS}일`}</p>
          </div>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <h3 className="font-bold mb-2">💰 수입</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1.5">
              {row('기본급', c.base)}
              {row('수수료(정해진 금액)', c.commission)}
              {row('운행수당', c.driving)}
              {row('식비', c.meal)}
              {row(`야근수당 (${e.overtime_minutes}분${e.overtime_minutes >= s.overtimeMinThreshold ? '' : ` <${s.overtimeMinThreshold}분 미인정`} × ${peso(s.overtimeHourlyRate)}/h)`, c.overtime)}
              {row(`공휴일 가산 (국가 ${e.national_days}일·일반 ${e.special_days}일)`, c.holiday)}
              <div className="border-t border-green-200 pt-2 flex justify-between font-bold"><span className="text-sm">총 지급(Gross)</span><span className="text-sm text-green-700">{peso(c.gross)}</span></div>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-2">📉 차감</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1.5">
              {row(`지각 (${e.late_minutes}분 × ${peso(s.latePerMinute)})`, c.lateDed, true)}
              {row('결근', e.absence, true)}
              {row('SSS 선지급 회수 (인보이스 기준)', e.sss, true)}
              {row('가불(CA)', e.cash_advance, true)}
              {row('건강검진', e.health_check, true)}
              {row('13개월 적립', e.thirteenth, true)}
              <div className="border-t border-red-200 pt-2 flex justify-between font-bold"><span className="text-sm">총 차감</span><span className="text-sm text-red-600">-{peso(c.totalDeductions)}</span></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white"><p className="text-xs opacity-90">실수령액 (Net Pay)</p><h3 className="text-3xl font-bold mt-1">{peso(c.net)}</h3></div>
        </div>
      </div>
    </div>
  );
}
