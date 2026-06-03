'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import excelImportClient, {
  ImportTableName,
  ValidateMappingResponse,
  ParseExcelResponse,
  validateExcelFile,
  formatFileSize,
  ImportStatistics,
  ValidationError,
  autoDetectAndMap,
  detectTableFromHeaders,
  generateAutoMapping,
} from '@/lib/api/excel-import-client';
import { useT } from '@/lib/i18n';

// ============================================================
// 📌 페이지명: ExcelImportPage
// 📋 목적: 관리자 대시보드 > 설정 > 데이터 임포트
// 🔧 기능: Excel 파일 업로드 → 테이블 선택 → 컬럼 매핑 → 검증 → 임포트 실행
// 📅 작성일: 2026-06-02
// ============================================================

type DialogStep = 'select' | 'parse' | 'mapping' | 'validate' | 'preview' | 'execute' | 'complete';
type Mode = 'excel' | 'receipt';

interface DialogState {
  step: DialogStep;
  selectedFile: File | null;
  selectedTable: ImportTableName | '';
  loading: boolean;
  error: string | null;
  parseResult: ParseExcelResponse | null;
  mapping: Record<string, string>;
  validateResult: ValidateMappingResponse | null;
  progress: Array<{ row: number; status: string; message: string }>;
  stats: ImportStatistics | null;
  autoDetectConfidence?: number;
}

interface ReceiptState {
  images: File[];
  processing: boolean;
  results: Array<{ amount: number; category: string }>;
  error: string | null;
}

interface TableInfo {
  name: ImportTableName;
  display_name: string;
  description: string;
}

export default function ExcelImportPage() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('excel');
  const [state, setState] = useState<DialogState>({
    step: 'select',
    selectedFile: null,
    selectedTable: '',
    loading: false,
    error: null,
    parseResult: null,
    mapping: {},
    validateResult: null,
    progress: [],
    stats: null,
  });

  const [receiptState, setReceiptState] = useState<ReceiptState>({
    images: [],
    processing: false,
    results: [],
    error: null,
  });

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);

  // 페이지 로드 시 테이블 목록 가져오기
  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setTablesLoading(true);
      const response = await excelImportClient.getTables();
      setTables(
        response.tables.map((t) => ({
          name: t.name,
          display_name: t.display_name,
          description: t.description,
        }))
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `테이블 목록 로드 실패: ${(error as Error).message}`,
      }));
    } finally {
      setTablesLoading(false);
    }
  };

  // Step 1: 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateExcelFile(file);
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        error: validation.error || '파일 검증 실패',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedFile: file,
      error: null,
    }));
  };

  // Step 2: 테이블 선택
  const handleTableSelect = (tableName: ImportTableName) => {
    setState((prev) => ({
      ...prev,
      selectedTable: tableName,
      error: null,
    }));
  };

  // Step 3: Excel 파일 파싱
  const handleParseExcel = async () => {
    if (!state.selectedFile || !state.selectedTable) {
      setState((prev) => ({
        ...prev,
        error: '파일과 테이블을 선택하세요',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await excelImportClient.parseExcel(
        state.selectedFile,
        state.selectedTable as ImportTableName
      );

      setState((prev) => ({
        ...prev,
        step: 'mapping',
        parseResult: result,
        mapping: result.suggested_mapping,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `파일 파싱 실패: ${(error as Error).message}`,
        loading: false,
      }));
    }
  };

  // Step 4: 컬럼 매핑 업데이트
  const handleMappingChange = (excelColumn: string, dbColumn: string) => {
    setState((prev) => ({
      ...prev,
      mapping: {
        ...prev.mapping,
        [excelColumn]: dbColumn,
      },
    }));
  };

  // Step 5: 매핑 검증
  const handleValidateMapping = async () => {
    if (!state.selectedFile || !state.selectedTable) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await excelImportClient.validateMapping(
        state.selectedFile,
        state.selectedTable as ImportTableName,
        state.mapping
      );

      setState((prev) => ({
        ...prev,
        step: 'preview',
        validateResult: result,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `검증 실패: ${(error as Error).message}`,
        loading: false,
      }));
    }
  };

  // Step 6: 임포트 실행
  const handleExecuteImport = async () => {
    if (!state.selectedFile || !state.selectedTable) return;

    setState((prev) => ({
      ...prev,
      step: 'execute',
      loading: true,
      error: null,
      progress: [],
    }));

    try {
      const stats = await excelImportClient.executeImport(
        state.selectedFile,
        state.selectedTable as ImportTableName,
        state.mapping,
        {
          skipErrors: false,
          onProgress: (event) => {
            setState((prev) => ({
              ...prev,
              progress: [
                ...prev.progress,
                {
                  row: event.row_number,
                  status: event.status,
                  message: event.message || '',
                },
              ],
            }));
          },
          onComplete: (finalStats) => {
            setState((prev) => ({
              ...prev,
              step: 'complete',
              stats: finalStats,
              loading: false,
            }));
          },
        }
      );

      setState((prev) => ({
        ...prev,
        step: 'complete',
        stats,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `임포트 실패: ${(error as Error).message}`,
        loading: false,
      }));
    }
  };

  // 초기화 및 처음으로
  const handleReset = () => {
    setState({
      step: 'select',
      selectedFile: null,
      selectedTable: '',
      loading: false,
      error: null,
      parseResult: null,
      mapping: {},
      validateResult: null,
      progress: [],
      stats: null,
    });
  };

  // 📌 Excel 자동 분류 및 매핑
  const handleAutoDetect = async () => {
    if (!state.selectedFile) {
      setState((prev) => ({ ...prev, error: 'Excel 파일을 선택하세요' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // XLSX로 Excel 파일 읽기
      const arrayBuffer = await state.selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const headers = Object.keys(jsonData[0] || {});

      // 자동 감지 및 매핑
      const { table, mapping, confidence } = autoDetectAndMap(headers);

      setState((prev) => ({
        ...prev,
        selectedTable: table,
        mapping: mapping,
        autoDetectConfidence: confidence,
        step: 'mapping',
        parseResult: {
          headers,
          sample_data: jsonData.slice(0, 3),
          total_rows: jsonData.length,
          suggested_mapping: mapping,
        },
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `파일 읽기 실패: ${(error as Error).message}`,
        loading: false,
      }));
    }
  };

  // 📌 Receipt 이미지 선택
  const handleReceiptImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReceiptState((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
      error: null,
    }));
  };

  // 📌 Receipt 이미지 제거
  const handleRemoveReceiptImage = (index: number) => {
    setReceiptState((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // 📌 영수증 처리 (OCR)
  const handleProcessReceipts = async () => {
    if (receiptState.images.length === 0) {
      setReceiptState((prev) => ({
        ...prev,
        error: '이미지를 선택하세요',
      }));
      return;
    }

    setReceiptState((prev) => ({ ...prev, processing: true, error: null }));

    try {
      // 실제로는 backend ExpenseOCRService 호출
      // 임시로 모의 데이터 반환
      const mockResults = receiptState.images.map(() => ({
        amount: Math.floor(Math.random() * 100000) + 10000,
        category: ['식대', '교통비', '숙박료'][Math.floor(Math.random() * 3)],
      }));

      setReceiptState((prev) => ({
        ...prev,
        results: mockResults,
        processing: false,
      }));
    } catch (error) {
      setReceiptState((prev) => ({
        ...prev,
        error: `영수증 처리 실패: ${(error as Error).message}`,
        processing: false,
      }));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/policies"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-mono"
            >
              Settings
            </Link>
            <span className="text-indigo-400/50">/</span>
            <span className="text-indigo-400/70 text-sm font-mono">Import Data</span>
          </div>
          <h1 className="text-3xl font-black text-[#8aebff] drop-shadow-[0_0_8px_rgba(138,235,255,0.4)]">
            📥 데이터 임포트
          </h1>
          <p className="text-indigo-300/70 text-sm">
            대량 데이터를 Excel 파일 또는 영수증 이미지로부터 가져옵니다.
          </p>
        </div>

        {/* 📌 Mode Tabs */}
        <div className="flex gap-3 border-b border-white/10">
          <button
            onClick={() => setMode('excel')}
            className={`px-4 py-2.5 font-bold transition-all ${
              mode === 'excel'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-indigo-300/70 hover:text-indigo-300'
            }`}
          >
            📊 Excel 임포트
          </button>
          <button
            onClick={() => setMode('receipt')}
            className={`px-4 py-2.5 font-bold transition-all ${
              mode === 'receipt'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-indigo-300/70 hover:text-indigo-300'
            }`}
          >
            📸 영수증 스캔
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {(state.error || receiptState.error) && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-300 text-sm">
          <p className="font-bold mb-1">오류</p>
          <p>{state.error || receiptState.error}</p>
        </div>
      )}

      {/* 📌 Excel 모드 */}
      {mode === 'excel' && (
        <>
          {/* Step 1: Select File & Table */}
          {state.step === 'select' && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-bold text-indigo-300 block mb-2">
                  1️⃣ Excel 파일 선택
                </span>
                <div className="relative border-2 border-dashed border-indigo-500/30 rounded-lg p-6 text-center hover:border-indigo-500/60 transition-all cursor-pointer bg-indigo-500/5">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-3xl mb-2">📄</div>
                  {state.selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-cyan-400">
                        {state.selectedFile.name}
                      </p>
                      <p className="text-xs text-indigo-300/60">
                        {formatFileSize(state.selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-indigo-300">
                        클릭하여 파일 선택
                      </p>
                      <p className="text-xs text-indigo-300/60">.xlsx, .xls (최대 10MB)</p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Table Selection */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-bold text-indigo-300 block mb-2">
                  2️⃣ 대상 테이블 선택
                </span>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tablesLoading ? (
                    <div className="text-center py-4 text-indigo-300/50 text-sm">
                      로딩 중...
                    </div>
                  ) : tables.length === 0 ? (
                    <div className="text-center py-4 text-rose-300/70 text-sm">
                      사용 가능한 테이블이 없습니다
                    </div>
                  ) : (
                    tables.map((table) => (
                      <label
                        key={table.name}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          state.selectedTable === table.name
                            ? 'bg-cyan-500/15 border-cyan-500/50'
                            : 'bg-white/3 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="table"
                          value={table.name}
                          checked={state.selectedTable === table.name}
                          onChange={() => handleTableSelect(table.name)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">
                            {table.display_name}
                          </p>
                          <p className="text-xs text-indigo-300/60">
                            {table.description}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleAutoDetect}
              disabled={!state.selectedFile || state.loading}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              {state.loading ? '분석 중...' : '🤖 자동 분류'}
            </button>
            <button
              onClick={handleParseExcel}
              disabled={!state.selectedFile || !state.selectedTable || state.loading}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              {state.loading ? '파싱 중...' : '수동 선택 →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Mapping */}
          {state.step === 'mapping' && state.parseResult && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-cyan-400">
              2️⃣ 컬럼 매핑 (Excel → Database)
            </h2>
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded p-4 text-sm text-indigo-300">
              <p>
                총{' '}
                <span className="font-bold">
                  {state.parseResult.total_rows}
                </span>{' '}
                행이 감지되었습니다. Excel의 컬럼을 데이터베이스 필드와 연결하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.parseResult.headers.map((header) => (
                <div key={header} className="space-y-2">
                  <label className="block">
                    <span className="text-xs font-bold text-indigo-300">
                      Excel: {header}
                    </span>
                    <select
                      value={state.mapping[header] || ''}
                      onChange={(e) =>
                        handleMappingChange(header, e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-indigo-300/50 focus:border-cyan-500/50 focus:outline-none"
                    >
                      <option value="">-- 매핑하지 않음 --</option>
                      <optgroup label="Sample Fields">
                        {['id', 'name', 'email', 'phone', 'status'].map(
                          (field) => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          )
                        )}
                      </optgroup>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Data Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-indigo-300">샘플 데이터</h3>
            <div className="bg-black/20 rounded p-3 overflow-x-auto text-xs">
              <pre className="text-indigo-300/70 font-mono">
                {JSON.stringify(
                  state.parseResult.sample_data.slice(0, 2),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4">
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  step: 'select',
                  parseResult: null,
                  mapping: {},
                }))
              }
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all"
            >
              ← 이전
            </button>
            <button
              onClick={handleValidateMapping}
              disabled={state.loading}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
            >
              {state.loading ? '검증 중...' : '검증 →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {state.step === 'preview' && state.validateResult && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-cyan-400">
              3️⃣ 데이터 검증 및 미리보기
            </h2>

            {/* Validation Results */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
                <p className="text-xs text-emerald-300/60 uppercase tracking-widest font-bold">
                  유효한 행
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {state.validateResult.preview_data.length}
                </p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded p-3">
                <p className="text-xs text-rose-300/60 uppercase tracking-widest font-bold">
                  오류
                </p>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {state.validateResult.errors.length}
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                <p className="text-xs text-amber-300/60 uppercase tracking-widest font-bold">
                  경고
                </p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {state.validateResult.warnings.length}
                </p>
              </div>
            </div>

            {/* Errors */}
            {state.validateResult.errors.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded p-4 space-y-2">
                <p className="text-sm font-bold text-rose-300">오류 목록</p>
                <div className="space-y-1 max-h-40 overflow-y-auto text-xs text-rose-300/70">
                  {state.validateResult.errors.map((err, idx) => (
                    <p key={idx}>
                      행 {err.row_number}, {err.column}: {err.error_message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {state.validateResult.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 space-y-2">
                <p className="text-sm font-bold text-amber-300">경고 목록</p>
                <div className="space-y-1 max-h-40 overflow-y-auto text-xs text-amber-300/70">
                  {state.validateResult.warnings.slice(0, 5).map((warn, idx) => (
                    <p key={idx}>
                      행 {warn.row_number}, {warn.column}:{' '}
                      {warn.warning_message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Data Table */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-indigo-300">미리보기</p>
              <div className="bg-black/20 rounded overflow-x-auto max-h-64 overflow-y-auto text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-black/40">
                    <tr>
                      {Object.keys(
                        state.validateResult.preview_data[0] || {}
                      ).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left text-indigo-300/70 font-bold border-b border-white/10"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.validateResult.preview_data.slice(0, 5).map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        {Object.values(row).map((val, cidx) => (
                          <td
                            key={cidx}
                            className="px-3 py-2 text-indigo-300/70 truncate"
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4">
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  step: 'mapping',
                  validateResult: null,
                }))
              }
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all"
            >
              ← 이전
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={
                state.loading || state.validateResult.errors.length > 0
              }
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              {state.loading ? '시작 중...' : '임포트 시작 →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Executing */}
      {state.step === 'execute' && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-cyan-400">
              4️⃣ 임포트 진행 중
            </h2>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-indigo-300">
                  {state.progress.length}행 처리됨
                </span>
                <span className="text-indigo-300/60">
                  {state.stats
                    ? `${state.stats.success_count} 성공 / ${state.stats.failed_count} 실패`
                    : '처리 중...'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all rounded-full"
                  style={{
                    width: state.stats
                      ? `${((state.stats.success_count + state.stats.failed_count) / state.stats.total_rows) * 100}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>

            {/* Log */}
            <div className="bg-black/20 rounded p-3 max-h-64 overflow-y-auto text-xs font-mono">
              {state.progress.length === 0 ? (
                <p className="text-indigo-300/50">시작 대기 중...</p>
              ) : (
                state.progress.slice(-20).map((log, idx) => (
                  <p
                    key={idx}
                    className={
                      log.status === 'success'
                        ? 'text-emerald-400'
                        : log.status === 'failed'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                    }
                  >
                    행 {log.row}: {log.status.toUpperCase()} {log.message}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {state.step === 'complete' && state.stats && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <span className="text-2xl">✅</span> 임포트 완료
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-4">
                <p className="text-xs text-cyan-300/60 uppercase tracking-widest font-bold">
                  총 행
                </p>
                <p className="text-2xl font-black text-cyan-400 mt-1">
                  {state.stats.total_rows}
                </p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4">
                <p className="text-xs text-emerald-300/60 uppercase tracking-widest font-bold">
                  성공
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {state.stats.success_count}
                </p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded p-4">
                <p className="text-xs text-rose-300/60 uppercase tracking-widest font-bold">
                  실패
                </p>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {state.stats.failed_count}
                </p>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/30 rounded p-4">
                <p className="text-xs text-slate-300/60 uppercase tracking-widest font-bold">
                  소요 시간
                </p>
                <p className="text-2xl font-black text-slate-400 mt-1">
                  {state.stats.execution_time_seconds.toFixed(2)}초
                </p>
              </div>
            </div>

            {/* Error Report */}
            {state.stats.errors.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded p-4 space-y-2">
                <p className="text-sm font-bold text-rose-300">
                  {state.stats.errors.length}개의 오류 발생
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto text-xs text-rose-300/70">
                  {state.stats.errors.slice(0, 10).map((err, idx) => (
                    <p key={idx}>
                      {typeof err === 'string'
                        ? err
                        : JSON.stringify(err, null, 2)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-4">
            <button
              onClick={() =>
                window.location.href = '/admin/settings/import'
              }
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all"
            >
              닫기
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all"
            >
              새 파일 임포트
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* 📌 Receipt 모드 - 영수증 이미지 스캔 */}
      {mode === 'receipt' && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          {/* 이미지 업로드 */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-bold text-indigo-300 block mb-2">
                📸 영수증 이미지 선택
              </span>
              <div className="relative border-2 border-dashed border-indigo-500/30 rounded-lg p-6 text-center hover:border-indigo-500/60 transition-all cursor-pointer bg-indigo-500/5">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReceiptImageSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm font-bold text-indigo-300">
                  클릭하여 이미지 선택
                </p>
                <p className="text-xs text-indigo-300/60">
                  여러 장을 선택할 수 있습니다 (JPG, PNG)
                </p>
              </div>
            </label>
          </div>

          {/* 선택된 이미지 목록 */}
          {receiptState.images.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-300">
                선택된 이미지 ({receiptState.images.length}개)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {receiptState.images.map((image, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Receipt ${idx}`}
                      className="w-full h-32 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      onClick={() => handleRemoveReceiptImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-6 h-6 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                    <p className="text-xs text-indigo-300/60 mt-1 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 처리 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleProcessReceipts}
              disabled={receiptState.images.length === 0 || receiptState.processing}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              {receiptState.processing ? '처리 중...' : '🤖 OCR 처리'}
            </button>
          </div>

          {/* 처리 결과 */}
          {receiptState.results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-300">처리 결과</h3>
              <div className="space-y-2">
                {receiptState.results.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded p-3"
                  >
                    <div>
                      <p className="text-sm text-white font-semibold">
                        영수증 #{idx + 1}
                      </p>
                      <p className="text-xs text-indigo-300/70">
                        분류: {result.category}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-cyan-400">
                      ₩{result.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
