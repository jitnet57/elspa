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
import { useT } from '@/lib/i18n';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getRevenueRange, getExpenseRange, EXPENSE_CATEGORY_LABELS,
  getExpenseRecords, createExpenseRecord, updateExpenseRecord, deleteExpenseRecord,
  type RevenueRange, type ExpenseRange, type ExpenseRecord, type ExpenseRecordInput,
} from '@/lib/api/metrics-report-client';

const peso = (n: number) => '₱' + (n || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });

// 비용 카테고리 키 목록 (드롭다운 선택용 — 라벨은 EXPENSE_CATEGORY_LABELS)
const EXPENSE_CATEGORY_KEYS = ['food', 'transport', 'supplies', 'utilities', 'entertainment', 'medical', 'other'] as const;

// 인라인 편집용 폼 상태 (vendor/카테고리/금액/설명)
interface ExpenseForm {
  vendor: string;
  category_name: string;
  amount: string; // input 값은 문자열로 보관 → 저장 시 숫자 변환
  description: string;
}
const emptyForm: ExpenseForm = { vendor: '', category_name: 'other', amount: '', description: '' };

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
  const t = useT();
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
      setErr(ex instanceof Error ? ex.message : t('Aggregation error', '집계 오류'));
      setRev(null); setExp(null);
    } finally { setLoading(false); }
  }, [start, end]);

  useEffect(() => { load(); }, [load]);

  // ── 일간 모드 비용 항목 CRUD 상태 ───────────────────────────
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recErr, setRecErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState<ExpenseForm>(emptyForm);          // 행 추가용 폼
  const [editId, setEditId] = useState<number | null>(null);               // 수정 중인 항목 id
  const [editForm, setEditForm] = useState<ExpenseForm>(emptyForm);        // 수정용 폼

  // 선택한 날짜(anchor)의 비용 항목 목록 조회
  const loadRecords = useCallback(async () => {
    if (mode !== 'daily') return;
    setRecLoading(true); setRecErr('');
    try {
      setRecords(await getExpenseRecords(anchor));
    } catch (ex) {
      setRecErr(ex instanceof Error ? ex.message : t('Failed to load expense items', '비용 항목 조회 오류'));
      setRecords([]);
    } finally { setRecLoading(false); }
  }, [mode, anchor]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // 폼 → API 입력 변환 (report_date·expense_date = anchor)
  const toInput = (f: ExpenseForm): ExpenseRecordInput => ({
    report_date: anchor,
    vendor: f.vendor.trim(),
    expense_date: anchor,
    amount: Number(f.amount) || 0,
    currency: 'PHP',
    category_name: f.category_name,
    description: f.description.trim(),
  });

  // 행 추가 (POST) → 목록·자동집계 갱신
  const handleCreate = async () => {
    if (!newForm.vendor.trim() || !(Number(newForm.amount) > 0)) {
      setRecErr(t('Enter vendor name and amount (greater than 0).', '업체명과 금액(0 초과)을 입력하세요.')); return;
    }
    setSaving(true); setRecErr('');
    try {
      await createExpenseRecord(toInput(newForm));
      setNewForm(emptyForm);
      await Promise.all([loadRecords(), load()]);
    } catch (ex) {
      setRecErr(ex instanceof Error ? ex.message : t('Failed to save expense item', '비용 항목 저장 오류'));
    } finally { setSaving(false); }
  };

  // 수정 시작 — 기존 값으로 폼 채우기
  const startEdit = (r: ExpenseRecord) => {
    setEditId(r.id);
    setEditForm({
      vendor: r.vendor ?? '',
      category_name: r.category_name ?? 'other',
      amount: String(r.amount ?? ''),
      description: r.description ?? '',
    });
  };

  // 수정 저장 (PUT) → 목록·자동집계 갱신
  const handleUpdate = async () => {
    if (editId == null) return;
    if (!editForm.vendor.trim() || !(Number(editForm.amount) > 0)) {
      setRecErr(t('Enter vendor name and amount (greater than 0).', '업체명과 금액(0 초과)을 입력하세요.')); return;
    }
    setSaving(true); setRecErr('');
    try {
      await updateExpenseRecord(editId, toInput(editForm));
      setEditId(null);
      await Promise.all([loadRecords(), load()]);
    } catch (ex) {
      setRecErr(ex instanceof Error ? ex.message : t('Failed to update expense item', '비용 항목 수정 오류'));
    } finally { setSaving(false); }
  };

  // 삭제 (DELETE) → 목록·자동집계 갱신
  const handleDelete = async (id: number) => {
    if (!confirm(t('Delete this expense item?', '이 비용 항목을 삭제할까요?'))) return;
    setSaving(true); setRecErr('');
    try {
      await deleteExpenseRecord(id);
      if (editId === id) setEditId(null);
      await Promise.all([loadRecords(), load()]);
    } catch (ex) {
      setRecErr(ex instanceof Error ? ex.message : t('Failed to delete expense item', '비용 항목 삭제 오류'));
    } finally { setSaving(false); }
  };

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
        <label className="text-sm font-bold text-gray-700">{mode === 'daily' ? t('Date', '날짜') : t('Reference day (week)', '기준일(주)')}</label>
        <input
          type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)}
          className="px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900"
        />
        <span className="text-sm text-gray-500">
          {t('Range', '집계 구간')}: <b className="text-gray-700">{start}</b>{mode === 'weekly' && <> ~ <b className="text-gray-700">{end}</b></>}
        </span>
        <button onClick={load} disabled={loading}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold">
          {loading ? t('Aggregating…', '집계 중…') : t('🔄 Refresh', '🔄 새로고침')}
        </button>
        <Link href="/admin/expense"
          className="px-3 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-bold">
          {t('💸 Register expense →', '💸 비용 등록 →')}
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-5">{t('* Revenue = bookings (service_price) auto-summed · Cost = daily expenses auto-summed. Enter costs under “Register expense”.', '* 매출=예약(service_price) 자동 합산 · 비용=일자별 지출 자동 합산. 비용 입력은 「비용 등록」에서.')}</p>

      {err && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-semibold">⚠️ {err} {t('(check the backend API connection)', '(백엔드 API 연결을 확인하세요)')}</div>}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label={t('Revenue', '매출')} value={peso(revenue)} cls="from-blue-500 to-blue-600" />
        <Kpi label={t('Cost', '비용')} value={peso(cost)} cls="from-red-500 to-red-600" />
        <Kpi label={t('Operating profit', '영업이익')} value={peso(profit)} cls={profit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-rose-500 to-rose-600'} />
        <Kpi label={t('Bookings', '예약 건수')} value={`${bookings.toLocaleString()} ${t('bookings', '건')}`} cls="from-purple-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 비용 카테고리 분해 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">{t('📉 Cost breakdown', '📉 비용 분류')}</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t('No costs registered.', '등록된 비용이 없습니다.')}</p>
          ) : (
            <>
              {categories.map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</span>
                  <b className="text-gray-900">{peso(amt)}</b>
                </div>
              ))}
              <div className="flex justify-between mt-3 pt-3 border-t-2 border-gray-200 font-bold">
                <span>{t('Total cost', '비용 합계')}</span><span className="text-red-600">{peso(cost)}</span>
              </div>
            </>
          )}
        </div>

        {/* 손익 요약 / 주간 차트 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3">{mode === 'weekly' ? t('📊 Daily revenue & cost', '📊 일자별 매출·비용') : t('💰 P&L summary', '💰 손익 요약')}</h3>
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
              <Row label={t('Revenue', '매출')} value={peso(revenue)} />
              <Row label={t('Cost', '비용')} value={peso(cost)} red />
              <div className="flex justify-between pt-3 border-t-2 border-gray-200 font-bold">
                <span>{t('Operating profit', '영업이익')}</span>
                <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{peso(profit)}</span>
              </div>
              <div className="flex justify-between text-gray-500"><span>{t('Profit margin', '이익률')}</span><span>{revenue > 0 ? Math.round((profit / revenue) * 100) : 0}%</span></div>
            </div>
          )}
        </div>
      </div>

      {/* 일간 모드: 비용 항목 인라인 CRUD (행 추가/수정/삭제) */}
      {mode === 'daily' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">🧾 {anchor} {t('Expense items', '비용 항목')}</h3>
            <button onClick={loadRecords} disabled={recLoading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-bold">
              {recLoading ? t('Loading…', '불러오는 중…') : t('🔄 Refresh list', '🔄 목록 새로고침')}
            </button>
          </div>

          {recErr && <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-semibold">⚠️ {recErr}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3 font-semibold">{t('Vendor', '업체명')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('Category', '분류')}</th>
                  <th className="py-2 pr-3 font-semibold text-right">{t('Amount (₱)', '금액(₱)')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('Description', '설명')}</th>
                  <th className="py-2 font-semibold text-right">{t('Manage', '관리')}</th>
                </tr>
              </thead>
              <tbody>
                {/* 기존 항목 행들 */}
                {records.map((r) => (
                  editId === r.id ? (
                    <tr key={r.id} className="border-b border-gray-100 bg-amber-50">
                      <td className="py-2 pr-3">
                        <input value={editForm.vendor} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-gray-900" placeholder={t('Vendor', '업체명')} />
                      </td>
                      <td className="py-2 pr-3">
                        <select value={editForm.category_name} onChange={(e) => setEditForm({ ...editForm, category_name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-gray-900">
                          {EXPENSE_CATEGORY_KEYS.map((k) => <option key={k} value={k}>{EXPENSE_CATEGORY_LABELS[k]}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input type="number" min="0" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-gray-900 text-right" placeholder="0" />
                      </td>
                      <td className="py-2 pr-3">
                        <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-40 px-2 py-1 border border-gray-300 rounded text-gray-900" placeholder={t('Description', '설명')} />
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={handleUpdate} disabled={saving}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold mr-1">{t('Save', '저장')}</button>
                        <button onClick={() => setEditId(null)} disabled={saving}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold">{t('Cancel', '취소')}</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-900">{r.vendor || '-'}</td>
                      <td className="py-2 pr-3 text-gray-700">{EXPENSE_CATEGORY_LABELS[r.category_name] ?? r.category_name}</td>
                      <td className="py-2 pr-3 text-right text-gray-900 font-semibold">{peso(r.amount)}</td>
                      <td className="py-2 pr-3 text-gray-500">{r.description || '-'}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={() => startEdit(r)} disabled={saving}
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-bold mr-1">{t('Edit', '수정')}</button>
                        <button onClick={() => handleDelete(r.id)} disabled={saving}
                          className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-xs font-bold">{t('Delete', '삭제')}</button>
                      </td>
                    </tr>
                  )
                ))}

                {/* 빈 목록 안내 */}
                {!recLoading && records.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-400">{t('No expense items registered.', '등록된 비용 항목이 없습니다.')}</td></tr>
                )}

                {/* 행 추가 입력 행 */}
                <tr className="bg-gray-50">
                  <td className="py-2 pr-3">
                    <input value={newForm.vendor} onChange={(e) => setNewForm({ ...newForm, vendor: e.target.value })}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-gray-900" placeholder={t('Vendor', '업체명')} />
                  </td>
                  <td className="py-2 pr-3">
                    <select value={newForm.category_name} onChange={(e) => setNewForm({ ...newForm, category_name: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-gray-900">
                      {EXPENSE_CATEGORY_KEYS.map((k) => <option key={k} value={k}>{EXPENSE_CATEGORY_LABELS[k]}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <input type="number" min="0" value={newForm.amount} onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-gray-900 text-right" placeholder="0" />
                  </td>
                  <td className="py-2 pr-3">
                    <input value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                      className="w-40 px-2 py-1 border border-gray-300 rounded text-gray-900" placeholder={t('Description (optional)', '설명(선택)')} />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={handleCreate} disabled={saving}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-bold">
                      {saving ? t('Saving…', '저장 중…') : t('+ Add', '+ 추가')}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">{t('* Adding/editing/deleting auto-updates the KPI and cost breakdown totals above.', '* 추가/수정/삭제 시 위쪽 KPI·비용 분류 합계가 자동 갱신됩니다.')}</p>
        </div>
      )}
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
