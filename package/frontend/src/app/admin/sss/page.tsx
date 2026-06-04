'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getSssMonths, getSssRecords, createSssRecord, updateSssRecord, deleteSssRecord } from '@/lib/api/sss-client';
import { useT } from '@/lib/i18n';

// ── 타입 ──────────────────────────────────────────────────────────
interface MonthSummary {
  applicable_month: string;
  company:          string | null;
  employer_ss_no:   string | null;
  invoice_no:       string | null;
  count:            number;
  total:            number;
}

interface SssRecord {
  id:               number;
  applicable_month: string;
  company:          string | null;
  employer_ss_no:   string | null;
  invoice_no:       string | null;
  employee_no:      number | null;
  employee_name:    string;
  ss_number:        string | null;
  ss_amount:        number;
  ec_amount:        number;
  total_amount:     number;
}

interface FileItem { file: File; preview: string }
type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

// ── 편집 중인 행 상태 ─────────────────────────────────────────────
type EditRow = Omit<SssRecord, 'id'> & { id: number; dirty?: boolean };

// ── PHP 포맷 ──────────────────────────────────────────────────────
const peso = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SssPage() {
  const t = useT();
  const [tab, setTab] = useState<'records' | 'scan'>('records');

  // ── Records 상태 ─────────────────────────────────────────────
  const [months,       setMonths]       = useState<MonthSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [records,      setRecords]      = useState<EditRow[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving,       setSaving]       = useState<Set<number>>(new Set());
  const [deleting,     setDeleting]     = useState<Set<number>>(new Set());
  const [exporting,    setExporting]    = useState(false);
  const [recordsError, setRecordsError] = useState('');

  // ── Scan 상태 ─────────────────────────────────────────────────
  const [files,      setFiles]      = useState<FileItem[]>([]);
  const [dragOver,   setDragOver]   = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanError,  setScanError]  = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── 월 목록 불러오기 ─────────────────────────────────────────
  const fetchMonths = useCallback(async () => {
    setLoadingMonths(true);
    try {
      const data: MonthSummary[] = await getSssMonths();
      setMonths(data);
      if (data.length > 0 && !selectedMonth) {
        setSelectedMonth(data[0].applicable_month);
      }
    } catch (e) {
      setRecordsError(e instanceof Error ? e.message : t('Error', '오류'));
    } finally {
      setLoadingMonths(false);
    }
  }, [selectedMonth]);

  // ── 레코드 불러오기 ──────────────────────────────────────────
  const fetchRecords = useCallback(async (month: string) => {
    if (!month) return;
    setLoadingRecords(true);
    setRecordsError('');
    try {
      const data: SssRecord[] = await getSssRecords(month);
      setRecords(data.map(r => ({ ...r, dirty: false })));
    } catch (e) {
      setRecordsError(e instanceof Error ? e.message : t('Error', '오류'));
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => { fetchMonths(); }, []);
  useEffect(() => { if (selectedMonth) fetchRecords(selectedMonth); }, [selectedMonth, fetchRecords]);

  // ── 셀 편집 ──────────────────────────────────────────────────
  const updateCell = (id: number, field: keyof EditRow, value: string | number | null) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value, dirty: true } : r
    ));
  };

  // ss + ec 변경 시 total 자동 계산
  const updateAmount = (id: number, field: 'ss_amount' | 'ec_amount', value: number) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value, dirty: true };
      updated.total_amount = (field === 'ss_amount' ? value : r.ss_amount) +
                             (field === 'ec_amount'  ? value : r.ec_amount);
      return updated;
    }));
  };

  // ── 행 저장 ──────────────────────────────────────────────────
  const saveRow = async (row: EditRow) => {
    setSaving(prev => new Set(prev).add(row.id));
    try {
      await updateSssRecord(row.id, {
        employee_name: row.employee_name,
        ss_number:     row.ss_number,
        ss_amount:     row.ss_amount,
        ec_amount:     row.ec_amount,
        total_amount:  row.total_amount,
        employee_no:   row.employee_no,
        company:       row.company,
        employer_ss_no: row.employer_ss_no,
        invoice_no:    row.invoice_no,
      });
      setRecords(prev => prev.map(r => r.id === row.id ? { ...r, dirty: false } : r));
    } catch (e) {
      alert(e instanceof Error ? e.message : t('Save error', '저장 오류'));
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(row.id); return s; });
    }
  };

  // ── 행 삭제 ──────────────────────────────────────────────────
  const deleteRow = async (id: number) => {
    if (!confirm(t('Delete this employee record?', '이 직원 기록을 삭제하시겠습니까?'))) return;
    setDeleting(prev => new Set(prev).add(id));
    try {
      await deleteSssRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : t('Delete error', '삭제 오류'));
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // ── 새 행 추가 ────────────────────────────────────────────────
  const addRow = async () => {
    if (!selectedMonth) return;
    const meta = months.find(m => m.applicable_month === selectedMonth);
    const nextNo = records.length > 0
      ? Math.max(...records.map(r => r.employee_no ?? 0)) + 1
      : 1;
    try {
      const newRow: SssRecord = await createSssRecord({
        applicable_month: selectedMonth,
        company:          meta?.company ?? '',
        employer_ss_no:   meta?.employer_ss_no ?? '',
        invoice_no:       meta?.invoice_no ?? '',
        employee_no:      nextNo,
        employee_name:    '',
        ss_number:        '',
        ss_amount:        0,
        ec_amount:        0,
        total_amount:     0,
      });
      setRecords(prev => [...prev, { ...newRow, dirty: false }]);
    } catch (e) {
      alert(e instanceof Error ? e.message : t('Add error', '추가 오류'));
    }
  };

  // ── Excel 내보내기 (DB 기반) ──────────────────────────────────
  const handleExport = async () => {
    if (!selectedMonth) return;
    setExporting(true);
    try {
      // 클라이언트 CSV 생성 (백엔드 불필요)
      const headers = ['No', 'Employee', 'SS Number', 'SS', 'EC', 'Total'];
      const lines = records.map(r => [
        r.employee_no ?? '', r.employee_name, r.ss_number ?? '',
        r.ss_amount, r.ec_amount, r.total_amount,
      ].join(','));
      const csv = '﻿' + [headers.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `SSS_${selectedMonth}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : t('Export error', '내보내기 오류'));
    } finally {
      setExporting(false);
    }
  };

  // ── 현재 월 메타 ─────────────────────────────────────────────
  const currentMeta = months.find(m => m.applicable_month === selectedMonth);
  const totalSS    = records.reduce((s, r) => s + (r.ss_amount    || 0), 0);
  const totalEC    = records.reduce((s, r) => s + (r.ec_amount    || 0), 0);
  const grandTotal = records.reduce((s, r) => s + (r.total_amount || 0), 0);
  const dirtyCount = records.filter(r => r.dirty).length;

  // ── Scan 탭 ─────────────────────────────────────────────────
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
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleScan = async () => {
    if (!files.length) return;
    // ⚠️ 자동 OCR 스캔은 별도 서버가 필요합니다(현재 백엔드 없음).
    //    후정산 흐름: 정부 인보이스를 보고 Records 탭에서 직접 입력/수정 → DB 저장.
    setScanStatus('error');
    setScanError(t('Automatic OCR scanning requires a server. Please refer to the government invoice and enter the data directly in the Records tab. (Post-settlement)', '자동 스캔(OCR)은 서버가 필요합니다. 정부 인보이스를 보고 Records 탭에서 직접 입력해 주세요. (후정산)'));
    setTab('records');
  };

  // ── 렌더 ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <a href="/admin" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Admin
          </a>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('📋 SSS Contribution Management', '📋 SSS 분담금 관리')}</h1>
            <p className="text-indigo-100 text-sm mt-0.5">
              {t('View · Edit · Scan receipts → Excel', '조회 · 편집 · 영수증 스캔 → 엑셀')}
            </p>
          </div>
          {/* 탭 전환 */}
          <div className="flex rounded-xl overflow-hidden border border-white/30">
            <button
              onClick={() => setTab('records')}
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                tab === 'records'
                  ? 'bg-white text-indigo-700'
                  : 'text-white/80 hover:bg-white/20'
              }`}
            >
              {t('📊 Records', '📊 기록')}
            </button>
            <button
              onClick={() => setTab('scan')}
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                tab === 'scan'
                  ? 'bg-white text-indigo-700'
                  : 'text-white/80 hover:bg-white/20'
              }`}
            >
              {t('📷 Scan New', '📷 새 스캔')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ══ RECORDS TAB ══════════════════════════════════════════ */}
        {tab === 'records' && (
          <div className="space-y-5">

            {/* 월 선택 + 요약 카드 */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5">
              <div className="flex flex-wrap items-center gap-4">
                {/* 월 드롭다운 */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('Month', '월')}</p>
                  {loadingMonths ? (
                    <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" />
                  ) : months.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">{t('No data — scan receipts first', '데이터 없음 — 먼저 영수증을 스캔하세요')}</p>
                  ) : (
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-indigo-500 bg-white min-w-[200px]"
                    >
                      {months.map(m => (
                        <option key={m.applicable_month} value={m.applicable_month}>
                          {m.applicable_month}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 메타 정보 */}
                {currentMeta && (
                  <>
                    <div className="border-l border-gray-200 pl-4">
                      <p className="text-xs text-gray-400">{t('Company', '업체')}</p>
                      <p className="text-sm font-bold text-gray-700">{currentMeta.company ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('Employer SS No.', '고용주 SS 번호')}</p>
                      <p className="text-sm font-mono text-gray-700">{currentMeta.employer_ss_no ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('Invoice No.', '인보이스 번호')}</p>
                      <p className="text-sm font-mono text-gray-700">{currentMeta.invoice_no ?? '—'}</p>
                    </div>
                  </>
                )}

                {/* 액션 버튼들 */}
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                  {dirtyCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                      {t(`${dirtyCount} unsaved change${dirtyCount > 1 ? 's' : ''}`, `미저장 변경 ${dirtyCount}건`)}
                    </span>
                  )}
                  <button
                    onClick={addRow}
                    disabled={!selectedMonth}
                    className="text-xs border border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40"
                  >
                    {t('+ Add Row', '+ 행 추가')}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={!selectedMonth || exporting || records.length === 0}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {exporting ? <><span className="animate-spin">⟳</span> {t('Exporting…', '내보내는 중…')}</> : t('📊 Export Excel', '📊 엑셀 내보내기')}
                  </button>
                  <button
                    onClick={() => fetchRecords(selectedMonth)}
                    disabled={!selectedMonth || loadingRecords}
                    className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {t('↺ Refresh', '↺ 새로고침')}
                  </button>
                </div>
              </div>
            </div>

            {/* 오류 */}
            {recordsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                ⚠️ {recordsError}
              </div>
            )}

            {/* 테이블 */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              {loadingRecords ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="text-4xl mb-3 animate-pulse">⟳</div>
                  <p className="text-sm">{t('Loading records…', '기록 불러오는 중…')}</p>
                </div>
              ) : records.length === 0 && selectedMonth ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">{t(`No records for ${selectedMonth}`, `${selectedMonth} 기록 없음`)}</p>
                  <button
                    onClick={() => setTab('scan')}
                    className="mt-3 text-xs text-indigo-600 hover:underline"
                  >
                    {t('→ Go to Scan New', '→ 새 스캔으로 이동')}
                  </button>
                </div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm">{t('No SSS data yet. Scan receipts to get started.', '아직 SSS 데이터가 없습니다. 영수증을 스캔해 시작하세요.')}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-indigo-50 border-b border-indigo-100">
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-10">#</th>
                          <th className="px-3 py-3 text-left font-bold text-gray-600 min-w-[220px]">{t('Name of Employee', '직원 이름')}</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-600 min-w-[140px]">{t('SS Number', 'SS 번호')}</th>
                          <th className="px-3 py-3 text-right font-bold text-gray-600 min-w-[110px]">{t('SS (PHP)', 'SS (PHP)')}</th>
                          <th className="px-3 py-3 text-right font-bold text-gray-600 min-w-[90px]">{t('EC (PHP)', 'EC (PHP)')}</th>
                          <th className="px-3 py-3 text-right font-bold text-gray-600 min-w-[110px]">{t('Total (PHP)', '합계 (PHP)')}</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-20">{t('Save', '저장')}</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-600 w-10">{t('Del', '삭제')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((row, idx) => {
                          const isZero  = row.total_amount === 0;
                          const isDirty = row.dirty;
                          const isSaving  = saving.has(row.id);
                          const isDeleting = deleting.has(row.id);
                          return (
                            <tr
                              key={row.id}
                              className={`border-b border-gray-100 transition-colors ${
                                isDirty
                                  ? 'bg-amber-50'
                                  : idx % 2 === 0 ? 'bg-gray-50/40' : 'bg-white'
                              } hover:bg-indigo-50/30`}
                            >
                              {/* No. */}
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  value={row.employee_no ?? ''}
                                  onChange={e => updateCell(row.id, 'employee_no', parseInt(e.target.value) || null)}
                                  className="w-10 text-center border border-transparent hover:border-gray-300 focus:border-indigo-400 focus:outline-none rounded px-1 bg-transparent text-gray-500"
                                />
                              </td>

                              {/* Name */}
                              <td className="px-3 py-2">
                                <input
                                  value={row.employee_name}
                                  onChange={e => updateCell(row.id, 'employee_name', e.target.value)}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-indigo-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent font-medium text-gray-800"
                                  placeholder={t('LAST, FIRST MIDDLE', '성, 이름 중간이름')}
                                />
                              </td>

                              {/* SS Number */}
                              <td className="px-3 py-2">
                                <input
                                  value={row.ss_number ?? ''}
                                  onChange={e => updateCell(row.id, 'ss_number', e.target.value)}
                                  className="w-full text-center border border-transparent hover:border-gray-300 focus:border-indigo-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent font-mono text-gray-700"
                                  placeholder="XX-XXXXXXX-X"
                                />
                              </td>

                              {/* SS Amount */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={row.ss_amount}
                                  onChange={e => updateAmount(row.id, 'ss_amount', parseFloat(e.target.value) || 0)}
                                  className={`w-full text-right border border-transparent hover:border-gray-300 focus:border-indigo-400 focus:outline-none rounded px-1.5 py-0.5 font-mono ${
                                    isZero ? 'bg-red-50 text-red-400' : 'bg-transparent text-gray-800'
                                  }`}
                                  min="0" step="0.01"
                                />
                              </td>

                              {/* EC Amount */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={row.ec_amount}
                                  onChange={e => updateAmount(row.id, 'ec_amount', parseFloat(e.target.value) || 0)}
                                  className={`w-full text-right border border-transparent hover:border-gray-300 focus:border-indigo-400 focus:outline-none rounded px-1.5 py-0.5 font-mono ${
                                    isZero ? 'bg-red-50 text-red-400' : 'bg-transparent text-gray-800'
                                  }`}
                                  min="0" step="0.01"
                                />
                              </td>

                              {/* Total */}
                              <td className={`px-3 py-2 text-right font-mono font-bold ${
                                isZero ? 'text-red-400' : 'text-gray-800'
                              }`}>
                                {peso(row.total_amount)}
                              </td>

                              {/* Save */}
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => saveRow(row)}
                                  disabled={!isDirty || isSaving || isDeleting}
                                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                    isDirty && !isSaving
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                      : 'bg-gray-100 text-gray-300 cursor-default'
                                  }`}
                                >
                                  {isSaving ? '…' : t('💾 Save', '💾 저장')}
                                </button>
                              </td>

                              {/* Delete */}
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => deleteRow(row.id)}
                                  disabled={isDeleting}
                                  className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none"
                                >
                                  {isDeleting ? '…' : '✕'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-600 text-white">
                          <td colSpan={3} className="px-3 py-3 font-bold text-sm">
                            {t(`TOTAL — ${records.length} employees`, `합계 — 직원 ${records.length}명`)}
                            &nbsp;
                            <span className="text-indigo-200 font-normal text-xs">
                              {t(`(${records.filter(r => r.total_amount > 0).length} with contribution)`, `(분담금 있음 ${records.filter(r => r.total_amount > 0).length}명)`)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-bold font-mono">{peso(totalSS)}</td>
                          <td className="px-3 py-3 text-right font-bold font-mono">{peso(totalEC)}</td>
                          <td className="px-3 py-3 text-right font-bold font-mono text-base">{peso(grandTotal)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 하단 요약 카드 */}
                  <div className="border-t border-indigo-100 px-5 py-4 bg-indigo-50/50">
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">{t('SS Contribution', 'SS 분담금')}</span>
                        <p className="font-bold text-indigo-800">₱ {peso(totalSS)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">{t('EC Contribution', 'EC 분담금')}</span>
                        <p className="font-bold text-indigo-800">₱ {peso(totalEC)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">{t('Grand Total', '총합계')}</span>
                        <p className="font-bold text-lg text-indigo-900">₱ {peso(grandTotal)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">{t('Zero-contribution', '분담금 없음')}</span>
                        <p className="font-bold text-red-500">
                          {t(`${records.filter(r => r.total_amount === 0).length} employees`, `직원 ${records.filter(r => r.total_amount === 0).length}명`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ SCAN TAB ════════════════════════════════════════════ */}
        {tab === 'scan' && (
          <div className="space-y-6 max-w-3xl mx-auto">

            {/* Step 1 Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <h2 className="font-bold text-gray-800">{t('Select SSS Receipt Images', 'SSS 영수증 이미지 선택')}</h2>
              </div>

              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
                className={`mx-6 my-5 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
                    : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50'
                }`}
              >
                <div className="text-5xl mb-3">📁</div>
                <p className="font-semibold text-gray-700 mb-1">
                  {t('Drag & drop images here, or click to select', '여기에 이미지를 끌어다 놓거나 클릭해서 선택하세요')}
                </p>
                <p className="text-xs text-gray-400">{t('JPG, PNG, WEBP · Multiple files OK', 'JPG, PNG, WEBP · 여러 파일 가능')}</p>
                <input
                  ref={inputRef}
                  type="file" multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((item, idx) => (
                      <div key={idx} className="relative group flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.preview} alt={item.file.name}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{item.file.name}</p>
                          <p className="text-xs text-gray-400">{(item.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeFile(idx); }}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Scan */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <h2 className="font-bold text-gray-800">{t('Scan & Save to Database', '스캔 후 데이터베이스에 저장')}</h2>
              </div>

              <div className="px-6 py-5 space-y-4">
                <button
                  onClick={handleScan}
                  disabled={!files.length || scanStatus === 'scanning'}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-md ${
                    !files.length
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : scanStatus === 'scanning'
                      ? 'bg-indigo-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {scanStatus === 'scanning' ? (
                    <><span className="animate-spin text-xl">⟳</span> {t('AI Scanning… (20–40 sec)', 'AI 스캔 중… (20~40초)')}</>
                  ) : (
                    <><span className="text-xl">🔍</span> {t('Scan & Save to Database', '스캔 후 데이터베이스에 저장')}</>
                  )}
                </button>

                {scanStatus === 'scanning' && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="animate-pulse text-indigo-500 text-lg">●</span>
                      <p className="text-sm font-semibold text-indigo-700">{t('Claude AI is reading the receipts…', 'Claude AI가 영수증을 읽는 중…')}</p>
                    </div>
                    <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-indigo-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                    </div>
                    <p className="text-xs text-indigo-400 mt-2">
                      {t('Extracting employee names, SS numbers, and amounts → saving to DB', '직원 이름, SS 번호, 금액 추출 중 → DB에 저장')}
                    </p>
                  </div>
                )}

                {scanStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                    <div>
                      <p className="text-sm font-bold text-red-700">{t('Scan Failed', '스캔 실패')}</p>
                      <p className="text-xs text-red-500 mt-1">{scanError}</p>
                    </div>
                  </div>
                )}

                {scanStatus === 'done' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-bold text-green-700">{t('Scan complete!', '스캔 완료!')}</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {t('Excel downloaded · Data saved to database · Switched to Records tab', '엑셀 다운로드 · 데이터 저장 완료 · 기록 탭으로 전환됨')}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center">
                  {t('⚠ Scanning will replace existing data for the same month', '⚠ 스캔하면 같은 월의 기존 데이터가 대체됩니다')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
