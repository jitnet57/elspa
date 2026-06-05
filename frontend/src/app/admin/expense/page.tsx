'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useAutoSaveSettings } from '@/lib/hooks/useAutoSaveSettings';
import { isOnline } from '@/lib/db/syncService';
import { db } from '@/lib/db/localDb';
import { getSupabase } from '@/lib/supabase/client';

const API_BASE = 'https://elspa-api-production.jitnet57.workers.dev';

// ── 카테고리 정의 ───────────────────────────────────────────────
const CATEGORIES = [
  { value: 'food',          label: '🍽️ Food',           bg: 'bg-orange-100 text-orange-800',  border: 'border-orange-200',  bar: 'bg-orange-400' },
  { value: 'transport',     label: '🚗 Transport',       bg: 'bg-sky-100 text-sky-800',         border: 'border-sky-200',     bar: 'bg-sky-400' },
  { value: 'supplies',      label: '🛒 Supplies',        bg: 'bg-green-100 text-green-800',     border: 'border-green-200',   bar: 'bg-green-400' },
  { value: 'utilities',     label: '💡 Utilities',       bg: 'bg-yellow-100 text-yellow-800',   border: 'border-yellow-200',  bar: 'bg-yellow-400' },
  { value: 'entertainment', label: '🤝 Entertainment',   bg: 'bg-pink-100 text-pink-800',       border: 'border-pink-200',    bar: 'bg-pink-400' },
  { value: 'medical',       label: '🏥 Medical',         bg: 'bg-purple-100 text-purple-800',   border: 'border-purple-200',  bar: 'bg-purple-400' },
  { value: 'other',         label: '📦 Other',           bg: 'bg-gray-100 text-gray-700',       border: 'border-gray-200',    bar: 'bg-gray-400' },
] as const;

type CatValue = typeof CATEGORIES[number]['value'];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.value, c])) as Record<CatValue, typeof CATEGORIES[number]>;

const peso = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── 타입 ────────────────────────────────────────────────────────
interface DateSummary   { date: string; count: number; total: number }
interface ExpenseRecord {
  id:            number;
  report_date:   string;
  vendor:        string;
  expense_date:  string;
  amount:        number;
  currency:      string;
  category_name: string;
  items:         string[];
  description:   string;
}
type EditRow    = ExpenseRecord & { dirty?: boolean };
type FileItem   = { file: File; preview: string };
type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

// ════════════════════════════════════════════════════════════════
export default function ExpensePage() {
  const t = useT();
  const { enabled: autoSaveEnabled, intervalMs: autoSaveIntervalMs } = useAutoSaveSettings();
  const today = new Date().toISOString().split('T')[0];

  const [tab, setTab] = useState<'records' | 'scan'>('records');

  // ── Records 상태 ────────────────────────────────────────────
  const [dates,         setDates]         = useState<DateSummary[]>([]);
  const [selectedDate,  setSelectedDate]  = useState(today);
  const [records,       setRecords]       = useState<EditRow[]>([]);
  const [loadingDates,  setLoadingDates]  = useState(false);
  const [loadingRecs,   setLoadingRecs]   = useState(false);
  const [saving,        setSaving]        = useState<Set<number>>(new Set());
  const [deleting,      setDeleting]      = useState<Set<number>>(new Set());
  const [exporting,     setExporting]     = useState(false);
  const [recError,      setRecError]      = useState('');
  // ── 자동 저장 마지막 시각 (HH:MM 형식) ─────────────────────
  const [lastAutoSave,  setLastAutoSave]  = useState<string | null>(null);

  // ── Scan 상태 ───────────────────────────────────────────────
  const [files,       setFiles]       = useState<FileItem[]>([]);
  const [dragOver,    setDragOver]    = useState(false);
  const [scanStatus,  setScanStatus]  = useState<ScanStatus>('idle');
  const [scanError,   setScanError]   = useState('');
  const [scanCount,   setScanCount]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── 날짜 목록 로드 ──────────────────────────────────────────
  // 📝 API 제거 - 빈 배열 반환
  const fetchDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      setDates([]);
    } catch (e) {
      setRecError(e instanceof Error ? e.message : 'Error');
    } finally { setLoadingDates(false); }
  }, []);

  // ── 레코드 로드 (온라인: 백엔드 API, 오프라인: IndexedDB 폴백) ─
  // 📝 API 제거 - IndexedDB만 사용
  const fetchRecords = useCallback(async (date: string) => {
    if (!date) return;
    setLoadingRecs(true); setRecError('');
    try {
      // IndexedDB에서만 로드
      const local = await db.expenseRecords.where('report_date').equals(date).toArray();
      setRecords(local.map(r => ({ ...r, dirty: false })) as any);
      setRecError('');
    } catch (e) {
      setRecError(e instanceof Error ? e.message : 'Error');
    } finally { setLoadingRecs(false); }
  }, []);

  useEffect(() => { fetchDates(); }, [fetchDates]);
  useEffect(() => { fetchRecords(selectedDate); }, [selectedDate]);

  // ── 셀 편집 ─────────────────────────────────────────────────
  const updateCell = (id: number, field: keyof EditRow, value: string | number) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value, dirty: true } : r
    ));
  };

  // ── 행 저장 ─────────────────────────────────────────────────
  // 📝 API 제거 - IndexedDB만 사용
  const saveRow = async (row: EditRow) => {
    setSaving(prev => new Set(prev).add(row.id));
    try {
      // IndexedDB에 저장
      await db.expenseRecords.update(row.id, {
        vendor:        row.vendor,
        expense_date:  row.expense_date,
        amount:        row.amount,
        currency:      row.currency,
        category_name: row.category_name,
        items:         row.items,
        description:   row.description,
      });
      setRecords(prev => prev.map(r => r.id === row.id ? { ...r, dirty: false } : r));
    } catch (e) { alert(e instanceof Error ? e.message : t('Save error', '저장 오류')); }
    finally { setSaving(prev => { const s = new Set(prev); s.delete(row.id); return s; }); }
  };

  // ── 모두 저장 ───────────────────────────────────────────────
  const saveAll = async () => {
    const dirty = records.filter(r => r.dirty);
    for (const row of dirty) await saveRow(row);
  };

  // ── 행 삭제 ─────────────────────────────────────────────────
  const deleteRow = async (id: number) => {
    if (!confirm(t('Delete this expense record?', '이 지출 기록을 삭제하시겠습니까?'))) return;
    setDeleting(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`${API_BASE}/api/expense/records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('Delete failed', '삭제 실패'));
      setRecords(prev => prev.filter(r => r.id !== id));
      fetchDates();
    } catch (e) { alert(e instanceof Error ? e.message : t('Delete error', '삭제 오류')); }
    finally { setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  };

  // ── 새 행 추가 ──────────────────────────────────────────────
  // 📝 API 제거 - IndexedDB만 사용
  const addRow = async () => {
    try {
      const newId = Math.max(...records.map(r => r.id), 0) + 1;
      const newRow: ExpenseRecord = {
        id: newId,
        report_date: selectedDate,
        vendor: '',
        expense_date: selectedDate,
        amount: 0,
        currency: 'PHP',
        category_name: 'other',
        items: [],
        description: '',
      };
      await db.expenseRecords.add(newRow as any);
      setRecords(prev => [...prev, { ...newRow, dirty: false }]);
    } catch (e) { alert(e instanceof Error ? e.message : t('Add error', '추가 오류')); }
  };

  // ── Excel 내보내기 ──────────────────────────────────────────
  // 📝 API 제거 - 로컬 다운로드만 지원
  const handleExport = async () => {
    setExporting(true);
    try {
      // 로컬에서 CSV로 내보내기 (간단한 구현)
      const csv = [
        ['Date', 'Vendor', 'Category', 'Amount', 'Currency', 'Description'].join(','),
        ...records.map(r => [
          r.expense_date,
          r.vendor,
          r.category_name,
          r.amount,
          r.currency,
          r.description,
        ].join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expense_${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : t('Export error', '내보내기 오류')); }
    finally { setExporting(false); }
  };

  // ── Supabase + Excel 자동 저장 (1시간마다 백그라운드 실행) ──
  // records 와 selectedDate 를 Supabase에 저장하고 Excel로 내보냅니다.
  // 성공 시 lastAutoSave를 true로 설정하여 💾 아이콘만 표시합니다.
  const autoExport = useCallback(async () => {
    if (!records.length) return;
    try {
      // Supabase에 저장
      const supabase = getSupabase();
      if (!supabase) return;

      // 기존 데이터 삭제 (같은 날짜)
      const { error: deleteError } = await supabase
        .from('expense_records')
        .delete()
        .eq('report_date', selectedDate);

      if (deleteError) throw deleteError;

      // 새로운 데이터 삽입
      const expenseData = records.map(r => ({
        report_date: selectedDate,
        vendor: r.vendor || '',
        expense_date: r.expense_date || selectedDate,
        amount: r.amount || 0,
        currency: r.currency || 'PHP',
        category_name: r.category_name,
        items: r.items || [],
        description: r.description || '',
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('expense_records')
        .insert(expenseData);

      if (insertError) throw insertError;

      // Excel 내보내기
      const res = await fetch(`${API_BASE}/api/expense/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_date: selectedDate }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const cd = res.headers.get('Content-Disposition') ?? '';
        const name = cd.match(/filename="?([^"]+)"?/)?.[1] ?? `Expense_${selectedDate}.xlsx`;
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }

      // 저장 표시
      setLastAutoSave('saved');
    } catch {
      // 네트워크 오류 등은 무시 (자동 저장이므로 사용자에게 표시 안 함)
    }
  }, [records, selectedDate]);

  // 설정에 따라 자동 저장 인터벌 (꺼져 있으면 등록 안 함)
  // 📝 자동 저장 비활성화 (API 제거)
  useEffect(() => {
    // 자동 저장 불활성화
    return () => {};
  }, []);


  // ── 집계 ────────────────────────────────────────────────────
  const grandTotal  = records.reduce((s, r) => s + (r.amount || 0), 0);
  const dirtyCount  = records.filter(r => r.dirty).length;
  const summary = CATEGORIES.map(cat => ({
    ...cat,
    count: records.filter(r => r.category_name === cat.value).length,
    total: records.filter(r => r.category_name === cat.value)
                  .reduce((s, r) => s + (r.amount || 0), 0),
  })).filter(s => s.count > 0);

  // ── Scan 파일 추가 ──────────────────────────────────────────
  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const next: FileItem[] = [];
    for (const f of Array.from(incoming)) {
      if (!allowed.includes(f.type)) continue;
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setFiles(prev => [...prev, ...next]);
    setScanStatus('idle');
  }, []);

  const removeFile = (idx: number) => {
    setFiles(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };

  // ── 스캔 실행 ───────────────────────────────────────────────
  const handleScan = async () => {
    if (!files.length) return;
    setScanStatus('scanning'); setScanError('');
    try {
      const form = new FormData();
      files.forEach(({ file }) => form.append('files', file));
      const res = await fetch(
        `${API_BASE}/api/expense/scan?report_date=${encodeURIComponent(selectedDate)}`,
        { method: 'POST', body: form }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || t('Server error', '서버 오류'));
      }
      const data = await res.json();
      setScanCount(data.count || 0);
      setScanStatus('done');
      // 파일 초기화 후 Records 탭으로
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      await fetchDates();
      await fetchRecords(selectedDate);
      setTimeout(() => setTab('records'), 800);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : t('Unknown error', '알 수 없는 오류'));
      setScanStatus('error');
    }
  };

  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <a href="/admin" className="text-white/70 hover:text-white text-sm transition-colors">← Admin</a>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">💰 Daily Expense Report</h1>
              {!isOnline() && <span className="text-xs font-bold text-orange-200 bg-orange-500/30 px-2 py-1 rounded-lg">📴 오프라인 — 로컬 데이터</span>}
            </div>
            <p className="text-emerald-100 text-sm mt-0.5">View · Edit · Scan receipts → DB + Excel</p>
          </div>
          {/* 탭 */}
          <div className="flex rounded-xl overflow-hidden border border-white/30">
            {(['records', 'scan'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 text-sm font-bold transition-colors ${
                  tab === t ? 'bg-white text-emerald-700' : 'text-white/80 hover:bg-white/20'
                }`}>
                {t === 'records' ? '📊 Records' : '📷 Scan New'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ══ RECORDS TAB ════════════════════════════════════════ */}
        {tab === 'records' && (
          <div className="space-y-5">

            {/* 날짜 선택 + 메타 */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
              <div className="flex flex-wrap items-center gap-4">

                {/* 날짜 드롭다운 또는 date picker */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 bg-white"
                    />
                    {/* 저장된 날짜 빠른 선택 */}
                    {dates.length > 0 && (
                      <select
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none bg-gray-50"
                      >
                        <option value="">-- Saved dates --</option>
                        {dates.map(d => (
                          <option key={d.date} value={d.date}>
                            {d.date} ({d.count}{t(' items', '건')} · ₱{d.total.toFixed(0)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {records.length > 0 && (
                  <div className="border-l border-gray-200 pl-4">
                    <p className="text-xs text-gray-400">Grand Total</p>
                    <p className="text-2xl font-bold text-emerald-700">₱{peso(grandTotal)}</p>
                    <p className="text-xs text-gray-400">{records.length} receipts</p>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                  {dirtyCount > 0 && (
                    <>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                        {dirtyCount} unsaved
                      </span>
                      <button onClick={saveAll}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg font-semibold transition-colors">
                        💾 Save All
                      </button>
                    </>
                  )}
                  <button onClick={addRow}
                    className="text-xs border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg font-semibold transition-colors">
                    + Add Row
                  </button>
                  {/* 데이터 저장 아이콘 */}
                  {lastAutoSave && (
                    <button className="text-xl hover:scale-110 transition-transform" title="Data saved to Supabase + Excel">
                      💾
                    </button>
                  )}
                  <button onClick={handleExport}
                    disabled={!records.length || exporting}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5">
                    {exporting
                      ? <><span className="animate-spin">⟳</span> Exporting…</>
                      : '📊 Export Excel'}
                  </button>
                  <button onClick={() => fetchRecords(selectedDate)}
                    disabled={loadingRecs}
                    className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg font-semibold transition-colors">
                    ↺
                  </button>
                </div>
              </div>
            </div>

            {/* 오류 */}
            {recError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">⚠️ {recError}</div>
            )}

            {/* 메인 테이블 */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              {loadingRecs ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="text-4xl mb-3 animate-pulse">⟳</div>
                  <p className="text-sm">Loading…</p>
                </div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="text-5xl mb-3">🧾</div>
                  <p className="text-sm font-medium text-gray-500">No expenses for {selectedDate}</p>
                  <p className="text-xs mt-1">Scan receipts or click + Add Row</p>
                  <button onClick={() => setTab('scan')}
                    className="mt-4 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                    📷 Scan Receipts
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-emerald-50 border-b border-emerald-100">
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-8">#</th>
                          <th className="px-3 py-3 text-left font-bold text-gray-600 min-w-[180px]">Vendor / Store</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-32">Date</th>
                          <th className="px-3 py-3 text-left font-bold text-gray-600 min-w-[170px]">Category</th>
                          <th className="px-3 py-3 text-right font-bold text-gray-600 w-28">Amount (PHP)</th>
                          <th className="px-3 py-3 text-left font-bold text-gray-600 min-w-[160px]">Notes</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-20">Save</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-8">✕</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((row, idx) => {
                          const cat        = CAT[row.category_name as CatValue] ?? CAT['other'];
                          const isDirty    = row.dirty;
                          const isSaving   = saving.has(row.id);
                          const isDeleting = deleting.has(row.id);
                          return (
                            <tr key={row.id}
                              className={`border-b border-gray-100 transition-colors ${
                                isDirty ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                              } hover:bg-emerald-50/20`}
                            >
                              <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>

                              {/* Vendor */}
                              <td className="px-3 py-2">
                                <input value={row.vendor}
                                  onChange={e => updateCell(row.id, 'vendor', e.target.value)}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent font-medium text-gray-800"
                                  placeholder="Store / vendor name" />
                              </td>

                              {/* Date */}
                              <td className="px-3 py-2">
                                <input type="date" value={row.expense_date || ''}
                                  onChange={e => updateCell(row.id, 'expense_date', e.target.value)}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-gray-700 text-xs" />
                              </td>

                              {/* Category */}
                              <td className="px-3 py-2">
                                <select value={row.category_name}
                                  onChange={e => updateCell(row.id, 'category_name', e.target.value)}
                                  className={`text-xs rounded-lg px-2 py-1 border-0 focus:outline-none font-medium cursor-pointer ${cat.bg}`}>
                                  {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Amount */}
                              <td className="px-3 py-2">
                                <input type="number" value={row.amount}
                                  onChange={e => updateCell(row.id, 'amount', parseFloat(e.target.value) || 0)}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-right font-mono text-gray-800"
                                  min="0" step="0.01" />
                              </td>

                              {/* Notes */}
                              <td className="px-3 py-2">
                                <input value={row.description}
                                  onChange={e => updateCell(row.id, 'description', e.target.value)}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-gray-600"
                                  placeholder="Receipt #, remarks…" />
                              </td>

                              {/* Save */}
                              <td className="px-3 py-2 text-center">
                                <button onClick={() => saveRow(row)}
                                  disabled={!isDirty || isSaving || isDeleting}
                                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                    isDirty && !isSaving
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                                      : 'bg-gray-100 text-gray-300 cursor-default'
                                  }`}>
                                  {isSaving ? '…' : '💾'}
                                </button>
                              </td>

                              {/* Delete */}
                              <td className="px-3 py-2 text-center">
                                <button onClick={() => deleteRow(row.id)} disabled={isDeleting}
                                  className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none">
                                  {isDeleting ? '…' : '✕'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-600 text-white">
                          <td colSpan={4} className="px-3 py-3 font-bold text-sm">
                            TOTAL — {records.length} receipts
                          </td>
                          <td className="px-3 py-3 text-right font-bold font-mono text-sm">
                            ₱{peso(grandTotal)}
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 카테고리 요약 */}
                  {summary.length > 0 && (
                    <div className="border-t border-emerald-100 px-5 py-5 bg-emerald-50/30">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Category Breakdown
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {summary.map(cat => {
                          const pct = grandTotal > 0 ? cat.total / grandTotal * 100 : 0;
                          return (
                            <div key={cat.value}
                              className={`rounded-xl p-3 border ${cat.border} ${cat.bg.split(' ')[0]}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-gray-700 truncate">{cat.label}</p>
                                <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{cat.count}{t(' items', '건')}</span>
                              </div>
                              <p className="text-base font-bold text-gray-800">₱{peso(cat.total)}</p>
                              <div className="bg-white/60 rounded-full h-1 mt-2">
                                <div className={`h-1 rounded-full ${cat.bar}`} style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ SCAN TAB ══════════════════════════════════════════ */}
        {tab === 'scan' && (
          <div className="max-w-3xl mx-auto space-y-6">

            {/* 날짜 선택 */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 flex items-center gap-4">
              <span className="text-3xl">📅</span>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Report Date</p>
                <input type="date" value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="ml-auto text-right border-l border-gray-200 pl-4">
                <p className="text-xs text-gray-400 mb-0.5">Receipts folder</p>
                <p className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                  📁 e:/elspa/receipts/
                </p>
              </div>
            </div>

            {/* Step 1: Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <h2 className="font-bold text-gray-800">Upload Receipt Images</h2>
                {files.length > 0 && (
                  <span className="ml-auto text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    {files.length} selected
                  </span>
                )}
              </div>

              <div onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                className={`mx-6 my-5 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                           : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}>
                <div className="text-5xl mb-3">🧾</div>
                <p className="font-semibold text-gray-700 mb-1">Drag & drop receipt photos, or click to select</p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP · Multiple at once</p>
                <input ref={inputRef} type="file" multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden" onChange={e => addFiles(e.target.files)} />
              </div>

              {files.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {files.map((item, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.preview} alt={item.file.name}
                          className="w-full h-20 object-cover rounded-xl border border-gray-200" />
                        <button onClick={e => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow">
                          ✕
                        </button>
                        <p className="text-xs text-gray-400 mt-1 truncate">{item.file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Scan & Save */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <h2 className="font-bold text-gray-800">Scan & Save to Database</h2>
              </div>

              <div className="px-6 py-5 space-y-4">
                <button onClick={handleScan}
                  disabled={!files.length || scanStatus === 'scanning'}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-md ${
                    !files.length
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : scanStatus === 'scanning'
                      ? 'bg-emerald-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}>
                  {scanStatus === 'scanning'
                    ? <><span className="animate-spin text-xl">⟳</span> AI Scanning… may take 30–60 sec</>
                    : <><span className="text-xl">🔍</span> Scan & Save to Database</>}
                </button>

                {scanStatus === 'scanning' && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="animate-pulse text-emerald-500 text-lg">●</span>
                      <p className="text-sm font-semibold text-emerald-700">Claude AI reading receipts…</p>
                    </div>
                    <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-xs text-emerald-400 mt-2">
                      Extracting vendor · date · amount · category → saving to DB
                    </p>
                  </div>
                )}

                {scanStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-500 text-xl">⚠️</span>
                    <div>
                      <p className="text-sm font-bold text-red-700">Scan Failed</p>
                      <p className="text-xs text-red-500 mt-1">{scanError}</p>
                    </div>
                  </div>
                )}

                {scanStatus === 'done' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-3xl">✅</span>
                    <div>
                      <p className="text-sm font-bold text-green-700">
                        {scanCount} receipt{scanCount !== 1 ? 's' : ''} scanned & saved!
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Saved to database · Switching to Records tab…
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400 text-center pt-1">
                  Data is saved to DB automatically · Edit anytime in the Records tab
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
