'use client';

// ============================================================
// 📌 페이지: 공제/선지급 관리 (/admin/deductions)
// 📋 목적: 한 화면에서 탭으로 (1) 선지급(CA) (2) 보건검진 실비
//         (3) 13개월 선지급 (4) SSS 기여표를 조회/등록/삭제합니다.
//         Supabase 직결 — payroll-client / deductions-client 사용.
// 📅 작성일: 2026-05-31
// ⚠️ 주의: Supabase 미설정 시 에러 메시지를 화면에 표시합니다.
//         기존 payroll-client.ts / calc.ts 는 수정하지 않고 호출만 합니다.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import EmployeePicker from '../_components/EmployeePicker';
import {
  getCashAdvances,
  createCashAdvance,
  type CashAdvance,
} from '@/lib/api/payroll-client';
import {
  getHealthCheckLogs,
  createHealthCheckLog,
  deleteHealthCheckLog,
  getThirteenthMonthAdvances,
  createThirteenthMonthAdvance,
  deleteThirteenthMonthAdvance,
  getSssBrackets,
  createSssBracket,
  deleteSssBracket,
  type HealthCheckLog,
  type ThirteenthMonthAdvance,
  type SssBracket,
} from '@/lib/api/deductions-client';

type TabKey = 'ca' | 'health' | 'thirteenth' | 'sss';

const TABS: { key: TabKey; en: string; ko: string }[] = [
  { key: 'ca', en: 'Cash Advance (CA)', ko: '선지급(CA)' },
  { key: 'health', en: 'Health Check (Reimbursement)', ko: '보건검진(실비)' },
  { key: 'thirteenth', en: '13th Month Advance', ko: '13개월 선지급' },
  { key: 'sss', en: 'SSS Contribution Table', ko: 'SSS 기여표' },
];

// 에러 메시지 추출 헬퍼
const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'An unknown error occurred. | 알 수 없는 오류가 발생했습니다.';

// 공통 입력 스타일
const inputCls =
  'px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none placeholder-slate-500';
const thCls = 'px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider';
const tdCls = 'px-3 py-2 text-sm text-slate-200 whitespace-nowrap';

export default function DeductionsPage() {
  const t = useT();
  const [tab, setTab] = useState<TabKey>('ca');

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{t('💸 Deductions / Advances', '💸 공제/선지급 관리')}</h1>
          <p className="text-sm text-slate-400">{t('Manage cash advances (CA), health check reimbursements, 13th month advances, and the SSS contribution table.', '선지급(CA), 보건검진 실비, 13개월 선지급, SSS 기여표를 관리합니다.')}</p>
        </div>

        {/* 탭 */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t transition-colors ${
                tab === tabItem.key
                  ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(tabItem.en, tabItem.ko)}
            </button>
          ))}
        </div>

        {/* 탭 본문 */}
        {tab === 'ca' && <CashAdvanceTab />}
        {tab === 'health' && <HealthCheckTab />}
        {tab === 'thirteenth' && <ThirteenthTab />}
        {tab === 'sss' && <SssTab />}
      </div>
    </div>
  );
}

// ============================================================
// 공통 UI: 로딩 / 에러 표시
// ============================================================
function Status({ loading, error }: { loading: boolean; error: string | null }) {
  const t = useT();
  if (loading) return <div className="py-8 text-center text-slate-400 text-sm">{t('Loading...', '불러오는 중...')}</div>;
  if (error)
    return (
      <div className="my-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
        ⚠️ {error}
      </div>
    );
  return null;
}

const card = 'bg-slate-800/60 border border-slate-700 rounded-lg p-4';
const tableWrap = 'overflow-x-auto bg-slate-800/60 border border-slate-700 rounded-lg';
const btnPrimary =
  'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50';
const btnDelete = 'px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs font-semibold rounded transition-colors';

// ============================================================
// 탭1: 선지급(CA) — payroll-client 사용 (읽기 전용 표 + 등록 폼)
// ============================================================
function CashAdvanceTab() {
  const t = useT();
  const [rows, setRows] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ employee_id: string; amount: string; reason: string; request_date: string }>({
    employee_id: '',
    amount: '',
    reason: '',
    request_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getCashAdvances());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.employee_id || !form.amount) {
      setError(t('Employee ID and amount are required.', '직원ID와 금액은 필수입니다.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCashAdvance({
        employee_id: Number(form.employee_id),
        amount: Number(form.amount),
        reason: form.reason || undefined,
        request_date: form.request_date,
        status: 'pending',
      });
      setForm({ employee_id: '', amount: '', reason: '', request_date: new Date().toISOString().split('T')[0] });
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 등록 폼 */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">{t('Register Cash Advance', '선지급 등록')}</h2>
        <div className="flex flex-wrap gap-2">
          <div className="basis-full">
            <EmployeePicker value={form.employee_id} onChange={(id) => setForm({ ...form, employee_id: id })} />
          </div>
          <input className={inputCls} type="number" placeholder={t('Amount', '금액')} value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className={inputCls} type="text" placeholder={t('Reason', '사유')} value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <input className={inputCls} type="date" value={form.request_date}
            onChange={(e) => setForm({ ...form, request_date: e.target.value })} />
          <button className={btnPrimary} onClick={handleCreate} disabled={submitting}>
            {submitting ? t('Registering...', '등록 중...') : t('+ Register', '+ 등록')}
          </button>
        </div>
      </div>

      <Status loading={loading} error={error} />

      {/* 읽기 전용 목록 */}
      <div className={tableWrap}>
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className={thCls}>{t('Employee ID', '직원ID')}</th>
              <th className={thCls}>{t('Amount', '금액')}</th>
              <th className={thCls}>{t('Request Date', '신청일')}</th>
              <th className={thCls}>{t('Status', '상태')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.length === 0 && !loading ? (
              <tr><td className="px-3 py-6 text-center text-slate-500 text-sm" colSpan={4}>{t('No cash advances registered.', '등록된 선지급이 없습니다.')}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className={tdCls}>{r.employee_name ?? r.employee_id}</td>
                  <td className={tdCls}>{r.amount.toLocaleString()}</td>
                  <td className={tdCls}>{r.request_date}</td>
                  <td className={tdCls}>{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 탭2: 보건검진(실비) — health_check_logs
// ============================================================
function HealthCheckTab() {
  const t = useT();
  const [rows, setRows] = useState<HealthCheckLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ employee_id: string; check_date: string; amount: string; note: string }>({
    employee_id: '',
    check_date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getHealthCheckLogs());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.employee_id || !form.amount) {
      setError(t('Employee ID and amount are required.', '직원ID와 금액은 필수입니다.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createHealthCheckLog({
        employee_id: Number(form.employee_id),
        check_date: form.check_date,
        amount: Number(form.amount),
        note: form.note || null,
      });
      setForm({ employee_id: '', check_date: new Date().toISOString().split('T')[0], amount: '', note: '' });
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('Delete this health check record?', '이 보건검진 기록을 삭제할까요?'))) return;
    setError(null);
    try {
      await deleteHealthCheckLog(id);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">{t('Register Health Check Reimbursement', '보건검진 실비 등록')}</h2>
        <div className="flex flex-wrap gap-2">
          <input className={inputCls} type="number" placeholder={t('Employee ID', '직원ID')} value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
          <input className={inputCls} type="date" value={form.check_date}
            onChange={(e) => setForm({ ...form, check_date: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t('Amount', '금액')} value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className={inputCls} type="text" placeholder={t('Note', '비고')} value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button className={btnPrimary} onClick={handleCreate} disabled={submitting}>
            {submitting ? t('Registering...', '등록 중...') : t('+ Register', '+ 등록')}
          </button>
        </div>
      </div>

      <Status loading={loading} error={error} />

      <div className={tableWrap}>
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className={thCls}>{t('Employee ID', '직원ID')}</th>
              <th className={thCls}>{t('Check Date', '검진일')}</th>
              <th className={thCls}>{t('Amount', '금액')}</th>
              <th className={thCls}>{t('Note', '비고')}</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.length === 0 && !loading ? (
              <tr><td className="px-3 py-6 text-center text-slate-500 text-sm" colSpan={5}>{t('No records registered.', '등록된 기록이 없습니다.')}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className={tdCls}>{r.employee_id}</td>
                  <td className={tdCls}>{r.check_date}</td>
                  <td className={tdCls}>{r.amount.toLocaleString()}</td>
                  <td className={tdCls}>{r.note ?? '-'}</td>
                  <td className={tdCls}><button className={btnDelete} onClick={() => handleDelete(r.id)}>{t('Delete', '삭제')}</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 탭3: 13개월 선지급 — thirteenth_month_advances
// ============================================================
function ThirteenthTab() {
  const t = useT();
  const [rows, setRows] = useState<ThirteenthMonthAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ employee_id: string; pay_date: string; amount: string; note: string }>({
    employee_id: '',
    pay_date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getThirteenthMonthAdvances());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.employee_id || !form.amount) {
      setError(t('Employee ID and amount are required.', '직원ID와 금액은 필수입니다.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createThirteenthMonthAdvance({
        employee_id: Number(form.employee_id),
        pay_date: form.pay_date,
        amount: Number(form.amount),
        note: form.note || null,
      });
      setForm({ employee_id: '', pay_date: new Date().toISOString().split('T')[0], amount: '', note: '' });
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('Delete this 13th month advance record?', '이 13개월 선지급 기록을 삭제할까요?'))) return;
    setError(null);
    try {
      await deleteThirteenthMonthAdvance(id);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">{t('Register 13th Month Advance', '13개월 선지급 등록')}</h2>
        <div className="flex flex-wrap gap-2">
          <input className={inputCls} type="number" placeholder={t('Employee ID', '직원ID')} value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
          <input className={inputCls} type="date" value={form.pay_date}
            onChange={(e) => setForm({ ...form, pay_date: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t('Amount', '금액')} value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className={inputCls} type="text" placeholder={t('Note', '비고')} value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button className={btnPrimary} onClick={handleCreate} disabled={submitting}>
            {submitting ? t('Registering...', '등록 중...') : t('+ Register', '+ 등록')}
          </button>
        </div>
      </div>

      <Status loading={loading} error={error} />

      <div className={tableWrap}>
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className={thCls}>{t('Employee ID', '직원ID')}</th>
              <th className={thCls}>{t('Pay Date', '지급일')}</th>
              <th className={thCls}>{t('Amount', '금액')}</th>
              <th className={thCls}>{t('Note', '비고')}</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.length === 0 && !loading ? (
              <tr><td className="px-3 py-6 text-center text-slate-500 text-sm" colSpan={5}>{t('No records registered.', '등록된 기록이 없습니다.')}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className={tdCls}>{r.employee_id}</td>
                  <td className={tdCls}>{r.pay_date}</td>
                  <td className={tdCls}>{r.amount.toLocaleString()}</td>
                  <td className={tdCls}>{r.note ?? '-'}</td>
                  <td className={tdCls}><button className={btnDelete} onClick={() => handleDelete(r.id)}>{t('Delete', '삭제')}</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 탭4: SSS 기여표 — sss_brackets
// ============================================================
function SssTab() {
  const t = useT();
  const [rows, setRows] = useState<SssBracket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ salary_from: string; salary_to: string; employee_share: string; employer_share: string }>({
    salary_from: '',
    salary_to: '',
    employee_share: '',
    employer_share: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getSssBrackets());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.salary_from || !form.salary_to) {
      setError(t('Salary range (lower/upper bound) is required.', '급여 구간(하한/상한)은 필수입니다.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createSssBracket({
        salary_from: Number(form.salary_from),
        salary_to: Number(form.salary_to),
        employee_share: Number(form.employee_share || 0),
        employer_share: Number(form.employer_share || 0),
      });
      setForm({ salary_from: '', salary_to: '', employee_share: '', employer_share: '' });
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('Delete this SSS bracket?', '이 SSS 구간을 삭제할까요?'))) return;
    setError(null);
    try {
      await deleteSssBracket(id);
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-4">
      {/* SSS Portal 이동 — 대시보드에 있던 스캔/엑셀 기능을 이 탭으로 이전 */}
      <div className={`${card} flex items-center justify-between gap-4`}>
        <div>
          <Link
            href="/admin/sss"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors"
          >
            {t('📤 SSS Scan · Export to Excel', '📤 SSS 스캔 · 엑셀 내보내기')}
          </Link>
          <p className="mt-2 text-xs text-slate-500">{t('Legacy data migration & scan to spreadsheet.', '레거시 데이터 마이그레이션 및 스프레드시트 스캔.')}</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">{t('Register SSS Bracket', 'SSS 구간 등록')}</h2>
        <div className="flex flex-wrap gap-2">
          <input className={inputCls} type="number" placeholder={t('Lower bound', '구간 하한')} value={form.salary_from}
            onChange={(e) => setForm({ ...form, salary_from: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t('Upper bound', '구간 상한')} value={form.salary_to}
            onChange={(e) => setForm({ ...form, salary_to: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t('Employee share', '직원 부담')} value={form.employee_share}
            onChange={(e) => setForm({ ...form, employee_share: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t('Employer share', '사업주 부담')} value={form.employer_share}
            onChange={(e) => setForm({ ...form, employer_share: e.target.value })} />
          <button className={btnPrimary} onClick={handleCreate} disabled={submitting}>
            {submitting ? t('Registering...', '등록 중...') : t('+ Register', '+ 등록')}
          </button>
        </div>
      </div>

      <Status loading={loading} error={error} />

      <div className={tableWrap}>
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className={thCls}>{t('Salary Range', '급여 구간')}</th>
              <th className={thCls}>{t('Employee Share', '직원 부담')}</th>
              <th className={thCls}>{t('Employer Share', '사업주 부담')}</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.length === 0 && !loading ? (
              <tr><td className="px-3 py-6 text-center text-slate-500 text-sm" colSpan={4}>{t('No brackets registered.', '등록된 구간이 없습니다.')}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className={tdCls}>{r.salary_from.toLocaleString()} ~ {r.salary_to.toLocaleString()}</td>
                  <td className={tdCls}>{r.employee_share.toLocaleString()}</td>
                  <td className={tdCls}>{r.employer_share.toLocaleString()}</td>
                  <td className={tdCls}><button className={btnDelete} onClick={() => handleDelete(r.id)}>{t('Delete', '삭제')}</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
