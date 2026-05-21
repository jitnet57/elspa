'use client';

import { useState, useRef, useCallback } from 'react';

// ── 카테고리 정의 ──────────────────────────────────────────────
const CATEGORIES = [
  { value: 'food',          label: '🍽️ Food (식비)',           bg: 'bg-orange-100 text-orange-800',  border: 'border-orange-200',  bar: 'bg-orange-400' },
  { value: 'transport',     label: '🚗 Transport (교통비)',     bg: 'bg-sky-100 text-sky-800',         border: 'border-sky-200',     bar: 'bg-sky-400' },
  { value: 'supplies',      label: '🛒 Supplies (소모품)',      bg: 'bg-green-100 text-green-800',     border: 'border-green-200',   bar: 'bg-green-400' },
  { value: 'utilities',     label: '💡 Utilities (공과금)',     bg: 'bg-yellow-100 text-yellow-800',   border: 'border-yellow-200',  bar: 'bg-yellow-400' },
  { value: 'entertainment', label: '🤝 Entertainment (접대비)', bg: 'bg-pink-100 text-pink-800',       border: 'border-pink-200',    bar: 'bg-pink-400' },
  { value: 'medical',       label: '🏥 Medical (의료비)',       bg: 'bg-purple-100 text-purple-800',   border: 'border-purple-200',  bar: 'bg-purple-400' },
  { value: 'other',         label: '📦 Other (기타)',           bg: 'bg-gray-100 text-gray-700',       border: 'border-gray-200',    bar: 'bg-gray-400' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c])) as Record<CategoryValue, typeof CATEGORIES[number]>;

interface FileItem {
  file: File;
  preview: string;
}

interface ExpenseRow {
  id: number;
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  items: string[];
  notes: string;
  filename: string;
}

type ScanStatus   = 'idle' | 'scanning' | 'done' | 'error';
type ExportStatus = 'idle' | 'exporting' | 'done';

export default function ExpensePage() {
  const today = new Date().toISOString().split('T')[0];

  const [reportDate,   setReportDate]   = useState(today);
  const [files,        setFiles]        = useState<FileItem[]>([]);
  const [dragOver,     setDragOver]     = useState(false);
  const [scanStatus,   setScanStatus]   = useState<ScanStatus>('idle');
  const [scanError,    setScanError]    = useState('');
  const [expenses,     setExpenses]     = useState<ExpenseRow[]>([]);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [downloadUrl,  setDownloadUrl]  = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // ── 파일 추가 ─────────────────────────────────────────────────
  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const next: FileItem[] = [];
    for (const f of Array.from(incoming)) {
      if (!allowed.includes(f.type)) continue;
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setFiles(prev => [...prev, ...next]);
    setExpenses([]);
    setScanStatus('idle');
    setDownloadUrl(null);
    setExportStatus('idle');
  }, []);

  const removeFile = (idx: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── 스캔 실행 ─────────────────────────────────────────────────
  const handleScan = async () => {
    if (!files.length) return;
    setScanStatus('scanning');
    setScanError('');
    setExpenses([]);
    setDownloadUrl(null);
    setExportStatus('idle');

    try {
      const form = new FormData();
      files.forEach(({ file }) => form.append('files', file));

      const res = await fetch(`${API_BASE}/api/expense/scan`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || '서버 오류');
      }

      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: ExpenseRow[] = (data.results as any[]).map((r) => ({
        id:       r.id,
        vendor:   r.vendor   ?? '',
        date:     r.date     ?? reportDate,
        amount:   r.amount   ?? 0,
        currency: r.currency ?? 'PHP',
        category: r.category ?? 'other',
        items:    r.items    ?? [],
        notes:    r.notes    ?? '',
        filename: r.filename ?? '',
      }));
      setExpenses(rows);
      setScanStatus('done');
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : '알 수 없는 오류');
      setScanStatus('error');
    }
  };

  // ── 행 수정 ───────────────────────────────────────────────────
  const updateExpense = (id: number, field: keyof ExpenseRow, value: string | number) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    setDownloadUrl(null);
    setExportStatus('idle');
  };

  const addRow = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses(prev => [...prev, {
      id: newId, vendor: '', date: reportDate, amount: 0,
      currency: 'PHP', category: 'other', items: [], notes: '', filename: '',
    }]);
  };

  const deleteRow = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDownloadUrl(null);
    setExportStatus('idle');
  };

  // ── Excel 내보내기 ─────────────────────────────────────────────
  const handleExport = async () => {
    if (!expenses.length) return;
    setExportStatus('exporting');

    try {
      const res = await fetch(`${API_BASE}/api/expense/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_date: reportDate, expenses }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || '내보내기 실패');
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const cd   = res.headers.get('Content-Disposition') ?? '';
      const name = cd.match(/filename="?([^"]+)"?/)?.[1] ?? `Expense_Report_${reportDate}.xlsx`;

      setDownloadUrl(url);
      setDownloadName(name);
      setExportStatus('done');
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : '내보내기 오류');
      setExportStatus('idle');
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href     = downloadUrl;
    a.download = downloadName;
    a.click();
  };

  // ── 카테고리 집계 ─────────────────────────────────────────────
  const grandTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const summary = CATEGORIES.map(cat => ({
    ...cat,
    count: expenses.filter(e => e.category === cat.value).length,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(s => s.count > 0);

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <a href="/admin" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Admin
          </a>
          <div>
            <h1 className="text-2xl font-bold">💰 Daily Expense Report</h1>
            <p className="text-emerald-100 text-sm mt-0.5">
              Upload receipts → AI extracts data → Review & edit → Download Excel
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Date + Folder info */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 flex flex-wrap items-center gap-5">
          <span className="text-3xl">📅</span>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Report Date</p>
            <input
              type="date"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="border-l border-gray-200 pl-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Receipts Folder</p>
            <p className="text-xs font-mono text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              📁 e:/elspa/receipts/
            </p>
            <p className="text-xs text-gray-400 mt-1">Save receipt photos here for reference</p>
          </div>
          {expenses.length > 0 && (
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Grand Total</p>
              <p className="text-2xl font-bold text-emerald-700">
                ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400">{expenses.length} receipts</p>
            </div>
          )}
        </div>

        {/* ── Step 1: Upload ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <h2 className="font-bold text-gray-800">Upload Receipt Images</h2>
            {files.length > 0 && (
              <span className="ml-auto text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                {files.length} files selected
              </span>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className={`mx-6 my-5 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50'
            }`}
          >
            <div className="text-5xl mb-3">🧾</div>
            <p className="font-semibold text-gray-700 mb-1">
              Drag & drop receipt photos here, or click to select
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP · Multiple receipts at once</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />
          </div>

          {/* Thumbnails */}
          {files.length > 0 && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {files.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="w-full h-20 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all" />
                    <button
                      onClick={e => { e.stopPropagation(); removeFile(idx); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-400 mt-1 truncate">{item.file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 2: Scan ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <h2 className="font-bold text-gray-800">AI Scan & Review</h2>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Scan 버튼 */}
            <button
              onClick={handleScan}
              disabled={!files.length || scanStatus === 'scanning'}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-md ${
                !files.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : scanStatus === 'scanning'
                  ? 'bg-emerald-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {scanStatus === 'scanning' ? (
                <>
                  <span className="animate-spin text-xl">⟳</span>
                  Scanning {files.length} receipt(s)… (may take 30–60 sec)
                </>
              ) : (
                <>
                  <span className="text-xl">🔍</span>
                  Scan All Receipts with AI
                </>
              )}
            </button>

            {/* 스캔 진행 */}
            {scanStatus === 'scanning' && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="animate-pulse text-emerald-500 text-lg">●</span>
                  <p className="text-sm font-semibold text-emerald-700">Claude AI is reading the receipts…</p>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-emerald-500 rounded-full animate-pulse" style={{ width: '65%' }} />
                </div>
                <p className="text-xs text-emerald-400 mt-2">
                  Extracting vendor, date, amount, and category for each receipt
                </p>
              </div>
            )}

            {/* 오류 */}
            {scanStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-red-700">Scan Failed</p>
                  <p className="text-xs text-red-500 mt-1">{scanError}</p>
                </div>
              </div>
            )}

            {/* 결과 테이블 (편집 가능) */}
            {expenses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Extracted Data — {expenses.length} receipts
                    <span className="ml-2 font-normal text-gray-400 normal-case">(all fields editable)</span>
                  </p>
                  <button
                    onClick={addRow}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">#</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">Vendor / Store</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">Date</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">Category</th>
                        <th className="px-3 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">Amount (PHP)</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">Notes</th>
                        <th className="px-3 py-2.5 text-center font-bold text-gray-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp) => {
                        const cat = CAT_MAP[exp.category as CategoryValue] ?? CAT_MAP['other'];
                        return (
                          <tr key={exp.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-2 text-gray-400 font-mono">{exp.id}</td>
                            <td className="px-3 py-2">
                              <input
                                value={exp.vendor}
                                onChange={e => updateExpense(exp.id, 'vendor', e.target.value)}
                                className="w-full min-w-[130px] border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-gray-800"
                                placeholder="Vendor name"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={exp.date || ''}
                                onChange={e => updateExpense(exp.id, 'date', e.target.value)}
                                className="border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-gray-700 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={exp.category}
                                onChange={e => updateExpense(exp.id, 'category', e.target.value)}
                                className={`text-xs rounded-lg px-2 py-1 border-0 focus:outline-none font-medium cursor-pointer ${cat.bg}`}
                              >
                                {CATEGORIES.map(c => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={exp.amount}
                                onChange={e => updateExpense(exp.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full min-w-[90px] border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-right font-mono text-gray-800"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={exp.notes}
                                onChange={e => updateExpense(exp.id, 'notes', e.target.value)}
                                className="w-full min-w-[110px] border border-transparent hover:border-gray-300 focus:border-emerald-400 focus:outline-none rounded px-1.5 py-0.5 bg-transparent text-gray-600"
                                placeholder="Receipt #, remarks…"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => deleteRow(exp.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t-2 border-emerald-300">
                        <td colSpan={4} className="px-3 py-2.5 font-bold text-emerald-800 text-xs">
                          TOTAL ({expenses.length} receipts)
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold font-mono text-emerald-800 text-sm">
                          ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Category Summary ─────────────────────────── */}
        {summary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <h2 className="font-bold text-gray-800">Category Summary</h2>
              <span className="ml-auto text-sm font-bold text-emerald-700">
                ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} total
              </span>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.map(cat => {
                  const pct = grandTotal > 0 ? (cat.total / grandTotal * 100) : 0;
                  return (
                    <div key={cat.value} className={`rounded-xl p-4 border ${cat.border} ${cat.bg.split(' ')[0]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-700">{cat.label}</p>
                        <span className="text-xs text-gray-500">{cat.count}건</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 mb-2">
                        ₱{cat.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${cat.bar} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}% of total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Export Excel ──────────────────────────────── */}
        {expenses.length > 0 && (
          <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
            exportStatus === 'done' ? 'border-green-200' : 'border-emerald-100'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${
              exportStatus === 'done' ? 'bg-green-50 border-green-100' : 'bg-emerald-50 border-emerald-100'
            }`}>
              <span className={`w-7 h-7 text-white rounded-full flex items-center justify-center text-sm font-bold ${
                exportStatus === 'done' ? 'bg-green-600' : 'bg-emerald-600'
              }`}>4</span>
              <h2 className={`font-bold ${exportStatus === 'done' ? 'text-green-800' : 'text-gray-800'}`}>
                {exportStatus === 'done' ? '✅ Excel Ready!' : 'Export to Excel'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-3">
              {exportStatus !== 'done' && (
                <button
                  onClick={handleExport}
                  disabled={exportStatus === 'exporting'}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-md ${
                    exportStatus === 'exporting'
                      ? 'bg-emerald-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {exportStatus === 'exporting' ? (
                    <><span className="animate-spin text-xl">⟳</span> Generating Excel…</>
                  ) : (
                    <>
                      <span className="text-xl">📊</span>
                      Export Excel — {expenses.length} receipts · ₱{grandTotal.toFixed(2)}
                    </>
                  )}
                </button>
              )}

              {exportStatus === 'done' && downloadUrl && (
                <>
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <span className="text-4xl">📊</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{downloadName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        2 sheets: Daily Expenses + Category Summary
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-base hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md"
                  >
                    <span className="text-xl">⬇️</span>
                    Download Excel File
                  </button>

                  <button
                    onClick={() => { setExportStatus('idle'); setDownloadUrl(null); }}
                    className="w-full py-3 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    ↩ Re-export (after editing)
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        {scanStatus === 'idle' && expenses.length === 0 && (
          <div className="bg-white/60 rounded-2xl border border-emerald-100 p-5">
            <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wide">How It Works</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '📷', title: 'Upload Photos',    desc: 'Take photos of receipts or select existing images' },
                { icon: '🤖', title: 'AI Reads Receipt', desc: 'Claude AI extracts vendor, date, amount & category' },
                { icon: '✏️', title: 'Review & Edit',    desc: 'Verify amounts, fix categories, add notes' },
                { icon: '📊', title: 'Download Excel',   desc: 'Get formatted daily report + category summary' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-xl">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-700">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Categories reference */}
            <div className="mt-4 pt-4 border-t border-emerald-100">
              <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Expense Categories</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <span key={cat.value} className={`text-xs px-2.5 py-1 rounded-full font-medium ${cat.bg}`}>
                    {cat.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
