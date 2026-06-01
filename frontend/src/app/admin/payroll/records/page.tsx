'use client';

/**
 * ============================================================
 * 📌 급여정산 화면 (Payroll Settlement) — 직군별 규칙 반영
 * 📋 직군: 매니저(정직원)/할리스/네일/메인테넌스/테라피스트/드라이버
 * 🧮 급여 규칙:
 *    - 테라피스트   : 수수료(정해진 금액)만, 기본급 없음
 *    - 매니저(정직원): 13일 출근 시 고정급 전액, 미달 시 일할
 *    - 할리스/네일/메인/드라이버(다른직원): 출근일 비례 (고정급/13 × 출근일)
 *    - 드라이버     : 고정(일할) + 운행수당 + 식비
 *    - 차감: SSS / 가불(CA) / 건강검진 / 13개월 / 지각 / 결근
 * 🗓 주기: 격주(biweekly) = 13 근무일 기준
 * 📅 작성일: 2026-05-21 / 개정: 2026-06-01 (직군 규칙 반영)
 * ============================================================
 */

import { useMemo, useState } from 'react';

const FULL_DAYS = 13; // 격주 만근 기준일

type EmpType = 'manager' | 'hollys' | 'nail' | 'maintenance' | 'therapist' | 'driver';

const TYPE_LABEL: Record<EmpType, string> = {
  manager: '매니저(정직원)',
  hollys: '할리스커피',
  nail: '네일샵',
  maintenance: '메인테넌스',
  therapist: '테라피스트',
  driver: '드라이버',
};
const TYPE_ORDER: EmpType[] = ['manager', 'therapist', 'driver', 'nail', 'hollys', 'maintenance'];

interface EmpInput {
  id: number;
  name: string;
  type: EmpType;
  base_salary: number;     // 격주 고정급 (정직원/다른직원)
  days_worked: number;     // 출근일수 (0~13)
  commission: number;      // 테라피스트 수수료(정해진 금액 합계)
  driving_allowance: number; // 드라이버 운행수당
  meal_allowance: number;  // 식비(드라이버 등)
  // 차감
  sss: number;
  cash_advance: number;
  health_check: number;
  thirteenth: number;
  late: number;
  absence: number;
  status: 'draft' | 'approved' | 'paid';
}

// ── 직군 규칙에 따른 기본급 지급액 ──────────────────────────
function basePayOf(e: EmpInput): number {
  if (e.type === 'therapist') return 0; // 수수료제
  if (e.type === 'manager') {
    // 정직원: 13일 출근 시 전액, 미달 시 일할
    return e.days_worked >= FULL_DAYS ? e.base_salary : Math.round((e.base_salary / FULL_DAYS) * e.days_worked);
  }
  // 다른직원(할리스/네일/메인/드라이버): 출근일 비례
  return Math.round((e.base_salary / FULL_DAYS) * e.days_worked);
}

function computePay(e: EmpInput) {
  const base = basePayOf(e);
  const commission = e.type === 'therapist' ? e.commission : 0;
  const driving = e.type === 'driver' ? e.driving_allowance : 0;
  const meal = e.meal_allowance; // 드라이버 식비 등
  const gross = base + commission + driving + meal;
  const totalDeductions = e.sss + e.cash_advance + e.health_check + e.thirteenth + e.late + e.absence;
  const net = Math.max(0, gross - totalDeductions);
  return { base, commission, driving, meal, gross, totalDeductions, net };
}

// ── 대표 목데이터 (규칙 시연용) ─────────────────────────────
const MOCK: EmpInput[] = [
  { id: 1, name: 'Manager Kim', type: 'manager', base_salary: 30000, days_worked: 13, commission: 0, driving_allowance: 0, meal_allowance: 0, sss: 1350, cash_advance: 0, health_check: 0, thirteenth: 1200, late: 0, absence: 0, status: 'approved' },
  { id: 2, name: 'Manager Lee', type: 'manager', base_salary: 30000, days_worked: 11, commission: 0, driving_allowance: 0, meal_allowance: 0, sss: 1350, cash_advance: 2000, health_check: 0, thirteenth: 1200, late: 300, absence: 0, status: 'draft' },
  { id: 3, name: 'Therapist Sarah', type: 'therapist', base_salary: 0, days_worked: 12, commission: 18500, driving_allowance: 0, meal_allowance: 0, sss: 900, cash_advance: 3000, health_check: 0, thirteenth: 800, late: 0, absence: 0, status: 'paid' },
  { id: 4, name: 'Therapist Emma', type: 'therapist', base_salary: 0, days_worked: 13, commission: 21000, driving_allowance: 0, meal_allowance: 0, sss: 1000, cash_advance: 0, health_check: 500, thirteenth: 900, late: 0, absence: 0, status: 'draft' },
  { id: 5, name: 'Driver Jose', type: 'driver', base_salary: 18000, days_worked: 12, commission: 0, driving_allowance: 3500, meal_allowance: 1500, sss: 900, cash_advance: 1000, health_check: 0, thirteenth: 700, late: 0, absence: 0, status: 'draft' },
  { id: 6, name: 'Nail Anna', type: 'nail', base_salary: 16000, days_worked: 10, commission: 0, driving_allowance: 0, meal_allowance: 0, sss: 720, cash_advance: 0, health_check: 0, thirteenth: 600, late: 200, absence: 0, status: 'draft' },
  { id: 7, name: 'Hollys Grace', type: 'hollys', base_salary: 15000, days_worked: 13, commission: 0, driving_allowance: 0, meal_allowance: 0, sss: 700, cash_advance: 0, health_check: 0, thirteenth: 600, late: 0, absence: 0, status: 'approved' },
  { id: 8, name: 'Maint. Pedro', type: 'maintenance', base_salary: 14000, days_worked: 9, commission: 0, driving_allowance: 0, meal_allowance: 0, sss: 650, cash_advance: 0, health_check: 0, thirteenth: 500, late: 0, absence: 1556, status: 'draft' },
];

const peso = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
const statusBadge = (s: string) =>
  s === 'paid' ? 'bg-green-100 text-green-700' : s === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
const statusLabel = (s: string) => (s === 'paid' ? '💰 지급' : s === 'approved' ? '✅ 확정' : '📝 작성');

export default function PayrollSettlementPage() {
  const [period] = useState('2026-05-15 ~ 2026-05-28 (격주)');
  const [typeFilter, setTypeFilter] = useState<'all' | EmpType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EmpInput | null>(null);

  const rows = useMemo(
    () =>
      MOCK.filter((e) => (typeFilter === 'all' || e.type === typeFilter) && e.name.toLowerCase().includes(search.toLowerCase())),
    [typeFilter, search],
  );

  const grouped = useMemo(() => {
    const g: Record<string, EmpInput[]> = {};
    rows.forEach((e) => {
      (g[e.type] ??= []).push(e);
    });
    return g;
  }, [rows]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, e) => {
        const c = computePay(e);
        acc.gross += c.gross;
        acc.ded += c.totalDeductions;
        acc.net += c.net;
        return acc;
      },
      { gross: 0, ded: 0, net: 0 },
    );
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💵 급여정산 (직원)</h1>
        <p className="text-gray-600 mt-1 text-sm">정산기간: {period}</p>
      </div>

      <main className="px-4 py-6 pb-24 max-w-6xl mx-auto">
        {/* 계산 규칙 안내 */}
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
          <p className="font-bold mb-1">🧮 직군별 급여 규칙 (격주 {FULL_DAYS}근무일 기준)</p>
          <ul className="list-disc pl-5 space-y-0.5 text-indigo-800">
            <li><b>테라피스트</b>: 수수료(정해진 금액)만 지급</li>
            <li><b>매니저(정직원)</b>: {FULL_DAYS}일 출근 시 고정급 전액, 미달 시 일할</li>
            <li><b>할리스·네일·메인·드라이버</b>: 출근일 비례 (고정급 ÷ {FULL_DAYS} × 출근일)</li>
            <li><b>드라이버</b>: 고정(일할) + 운행수당 + 식비</li>
          </ul>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">총 지급(Gross)</p>
            <h3 className="text-xl font-bold mt-1">{peso(totals.gross)}</h3>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">총 차감</p>
            <h3 className="text-xl font-bold mt-1">{peso(totals.ded)}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">실수령(Net)</p>
            <h3 className="text-xl font-bold mt-1">{peso(totals.net)}</h3>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-5 flex flex-wrap gap-3 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 직원 이름 검색"
            className="flex-1 min-w-[180px] px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="all">전체 직군</option>
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>

        {/* 직군별 그룹 테이블 */}
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">결과 없음</div>
        ) : (
          TYPE_ORDER.filter((t) => grouped[t]?.length).map((t) => (
            <div key={t} className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800">
                {TYPE_LABEL[t]} <span className="text-xs text-gray-500">({grouped[t].length}명)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-100">
                      <th className="px-4 py-2">직원</th>
                      <th className="px-4 py-2 text-center">출근일</th>
                      <th className="px-4 py-2 text-right">기본급</th>
                      <th className="px-4 py-2 text-right">수수료</th>
                      <th className="px-4 py-2 text-right">운행/식비</th>
                      <th className="px-4 py-2 text-right">차감</th>
                      <th className="px-4 py-2 text-right">실수령</th>
                      <th className="px-4 py-2 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[t].map((e) => {
                      const c = computePay(e);
                      return (
                        <tr
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-2 font-semibold text-gray-900">{e.name}</td>
                          <td className="px-4 py-2 text-center">
                            {e.type === 'therapist' ? '—' : `${e.days_worked}/${FULL_DAYS}`}
                          </td>
                          <td className="px-4 py-2 text-right">{c.base ? peso(c.base) : '—'}</td>
                          <td className="px-4 py-2 text-right">{c.commission ? peso(c.commission) : '—'}</td>
                          <td className="px-4 py-2 text-right">{c.driving + c.meal ? peso(c.driving + c.meal) : '—'}</td>
                          <td className="px-4 py-2 text-right text-red-600">{peso(c.totalDeductions)}</td>
                          <td className="px-4 py-2 text-right font-bold text-blue-600">{peso(c.net)}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge(e.status)}`}>{statusLabel(e.status)}</span>
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

      {/* 상세 모달 */}
      {selected && <DetailModal e={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailModal({ e, onClose }: { e: EmpInput; onClose: () => void }) {
  const c = computePay(e);
  const row = (label: string, val: number, neg = false) =>
    val ? (
      <div className="flex justify-between">
        <span className="text-sm text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${neg ? 'text-red-600' : 'text-gray-900'}`}>{(neg ? '-' : '') + peso(val)}</span>
      </div>
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
          {/* 수입 */}
          <div>
            <h3 className="font-bold mb-2">💰 수입</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1.5">
              {row('기본급', c.base)}
              {row('수수료(정해진 금액)', c.commission)}
              {row('운행수당', c.driving)}
              {row('식비', c.meal)}
              <div className="border-t border-green-200 pt-2 flex justify-between font-bold">
                <span className="text-sm">총 지급(Gross)</span>
                <span className="text-sm text-green-700">{peso(c.gross)}</span>
              </div>
            </div>
          </div>
          {/* 차감 */}
          <div>
            <h3 className="font-bold mb-2">📉 차감</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1.5">
              {row('SSS', e.sss, true)}
              {row('가불(CA)', e.cash_advance, true)}
              {row('건강검진', e.health_check, true)}
              {row('13개월 적립', e.thirteenth, true)}
              {row('지각', e.late, true)}
              {row('결근', e.absence, true)}
              <div className="border-t border-red-200 pt-2 flex justify-between font-bold">
                <span className="text-sm">총 차감</span>
                <span className="text-sm text-red-600">-{peso(c.totalDeductions)}</span>
              </div>
            </div>
          </div>
          {/* 실수령 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
            <p className="text-xs opacity-90">실수령액 (Net Pay)</p>
            <h3 className="text-3xl font-bold mt-1">{peso(c.net)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
