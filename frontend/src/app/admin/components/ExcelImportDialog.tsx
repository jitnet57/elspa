/**
 * ============================================================
 * 📌 Excel Import Dialog Component
 * 📋 목적: 엑셀 파일 임포트 UI 컴포넌트 (대화형)
 * 🔧 경로: frontend/src/app/admin/components/ExcelImportDialog.tsx
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

'use client';

import React, { useState, useCallback } from 'react';
import excelImportClient, {
  ExcelImportClient,
  ImportTableName,
  ValidateMappingResponse,
  ParseExcelResponse,
  validateExcelFile,
  formatFileSize,
} from '@/lib/api/excel-import-client';

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (stats: any) => void;
  onError?: (error: Error) => void;
}

type DialogStep = 'select' | 'parse' | 'mapping' | 'validate' | 'preview' | 'execute' | 'complete';

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
  stats: any | null;
}

export function ExcelImportDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ExcelImportDialogProps) {
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

  const [tables, setTables] = useState<Array<{ name: string; display_name: string }>>([]);

  React.useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    try {
      const response = await excelImportClient.getTables();
      setTables(
        response.tables.map((t) => ({
          name: t.name,
          display_name: t.display_name,
        }))
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `테이블 목록 로드 실패: ${(error as Error).message}`,
      }));
    }
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    []
  );

  const handleTableSelect = useCallback(
    (tableName: ImportTableName) => {
      setState((prev) => ({
        ...prev,
        selectedTable: tableName,
        error: null,
      }));
    },
    []
  );

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
      onError?.(error as Error);
    }
  };

  const handleMappingChange = (excelCol: string, dbField: string) => {
    setState((prev) => ({
      ...prev,
      mapping: {
        ...prev.mapping,
        [excelCol]: dbField,
      },
    }));
  };

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
        error: `매핑 검증 실패: ${(error as Error).message}`,
        loading: false,
      }));
      onError?.(error as Error);
    }
  };

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
          skipErrors: true,
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
              ].slice(-100), // Keep last 100 items
            }));
          },
          onComplete: (stats) => {
            setState((prev) => ({
              ...prev,
              step: 'complete',
              stats,
              loading: false,
            }));
            onSuccess?.(stats);
          },
        }
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `임포트 실행 실패: ${(error as Error).message}`,
        loading: false,
      }));
      onError?.(error as Error);
    }
  };

  const handleClose = () => {
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
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Excel 임포트</h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-blue-700 rounded p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-sm mt-1 opacity-90">
            {state.step === 'select' && '파일과 테이블을 선택하세요'}
            {state.step === 'parse' && '파일을 분석 중입니다...'}
            {state.step === 'mapping' && '컬럼 매핑을 확인하세요'}
            {state.step === 'validate' && '데이터를 검증 중입니다...'}
            {state.step === 'preview' && '데이터 미리보기'}
            {state.step === 'execute' && '임포트를 진행 중입니다...'}
            {state.step === 'complete' && '임포트 완료'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {state.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ⚠️ {state.error}
            </div>
          )}

          {/* Step 1: Select File & Table */}
          {state.step === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대상 테이블
                </label>
                <select
                  value={state.selectedTable}
                  onChange={(e) =>
                    handleTableSelect(e.target.value as ImportTableName)
                  }
                  className="w-full border border-gray-300 rounded-lg p-3"
                >
                  <option value="">테이블 선택...</option>
                  {tables.map((table) => (
                    <option key={table.name} value={table.name}>
                      {table.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel 파일 선택
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full border border-gray-300 rounded-lg p-3"
                />
                {state.selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    선택된 파일: {state.selectedFile.name} (
                    {formatFileSize(state.selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                <strong>팁:</strong> Excel 파일의 첫 번째 행은 헤더여야 합니다.
                지원 형식: .xlsx, .xls (최대 10MB)
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {state.step === 'mapping' && state.parseResult && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  컬럼 매핑 ({state.parseResult.headers.length}개)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {state.parseResult.headers.map((header) => (
                    <div key={header} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {header}
                        </div>
                      </div>
                      <div className="text-2xl text-gray-400">→</div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={state.mapping[header] || ''}
                          onChange={(e) =>
                            handleMappingChange(header, e.target.value)
                          }
                          placeholder="DB 필드명"
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">샘플 데이터</h4>
                <div className="overflow-x-auto text-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {state.parseResult.headers.map((header) => (
                          <th
                            key={header}
                            className="border p-2 bg-gray-100 text-left text-xs font-semibold"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.parseResult.sample_data.slice(0, 3).map((row, idx) => (
                        <tr key={idx}>
                          {state.parseResult!.headers.map((header) => (
                            <td
                              key={`${idx}-${header}`}
                              className="border p-2 text-xs"
                            >
                              {String(row[header] || '-').slice(0, 50)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  총 {state.parseResult.total_rows}행
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {state.step === 'preview' && state.validateResult && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {state.validateResult.preview_data.length}
                  </div>
                  <div className="text-sm text-gray-700">유효한 행</div>
                </div>
                <div className="flex-1 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">
                    {state.validateResult.errors.length}
                  </div>
                  <div className="text-sm text-gray-700">에러</div>
                </div>
                <div className="flex-1 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">
                    {state.validateResult.warnings.length}
                  </div>
                  <div className="text-sm text-gray-700">경고</div>
                </div>
              </div>

              {state.validateResult.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">에러</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {state.validateResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        • 행 {err.row_number}, 컬럼 "{err.column}": {err.error_message}
                      </li>
                    ))}
                    {state.validateResult.errors.length > 5 && (
                      <li>• 외 {state.validateResult.errors.length - 5}개...</li>
                    )}
                  </ul>
                </div>
              )}

              {state.validateResult.warnings.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">경고</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {state.validateResult.warnings.slice(0, 5).map((warn, idx) => (
                      <li key={idx}>
                        • 행 {warn.row_number}, 컬럼 "{warn.column}": {warn.warning_message}
                      </li>
                    ))}
                    {state.validateResult.warnings.length > 5 && (
                      <li>• 외 {state.validateResult.warnings.length - 5}개...</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">미리보기</h4>
                <div className="overflow-x-auto text-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {state.parseResult?.headers.map((header) => (
                          <th
                            key={header}
                            className="border p-2 bg-gray-100 text-left text-xs font-semibold"
                          >
                            {state.mapping[header] || header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.validateResult.preview_data.slice(0, 3).map((row, idx) => (
                        <tr key={idx}>
                          {state.parseResult!.headers.map((header) => {
                            const dbField = state.mapping[header];
                            return (
                              <td
                                key={`${idx}-${header}`}
                                className="border p-2 text-xs"
                              >
                                {String(row[dbField] || '-').slice(0, 50)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Execute */}
          {state.step === 'execute' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="font-semibold text-blue-900">임포트 진행 중...</span>
                </div>
                <p className="text-sm text-blue-700">
                  처리된 행: {state.progress.length}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto text-sm font-mono text-gray-700">
                {state.progress.length === 0 ? (
                  <p className="text-gray-500">진행 상황을 기다리는 중...</p>
                ) : (
                  state.progress.map((item, idx) => (
                    <div
                      key={idx}
                      className={
                        item.status === 'success'
                          ? 'text-green-700'
                          : item.status === 'failed'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                      }
                    >
                      [{item.status.toUpperCase()}] 행 {item.row}: {item.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {state.step === 'complete' && state.stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-700">
                    {state.stats.success_count}
                  </div>
                  <div className="text-sm text-gray-700">성공</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-700">
                    {state.stats.failed_count}
                  </div>
                  <div className="text-sm text-gray-700">실패</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">총 행 수</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {state.stats.total_rows}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">실행 시간</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {state.stats.execution_time_seconds.toFixed(2)}초
                    </p>
                  </div>
                </div>
              </div>

              {state.stats.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">에러 상세</h4>
                  <div className="text-sm text-red-700 max-h-48 overflow-y-auto">
                    {state.stats.errors.slice(0, 10).map((err: any, idx: number) => (
                      <p key={idx} className="mb-1">
                        • 행 {err.row_number}: {JSON.stringify(err.errors || err.error)}
                      </p>
                    ))}
                    {state.stats.errors.length > 10 && (
                      <p className="mt-2 text-red-600">
                        외 {state.stats.errors.length - 10}개...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 border-t px-6 py-4 flex justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            처음부터
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              닫기
            </button>

            {state.step === 'select' && (
              <button
                onClick={handleParseExcel}
                disabled={!state.selectedFile || !state.selectedTable || state.loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? '분석 중...' : '다음'}
              </button>
            )}

            {state.step === 'mapping' && (
              <button
                onClick={handleValidateMapping}
                disabled={state.loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {state.loading ? '검증 중...' : '검증'}
              </button>
            )}

            {state.step === 'preview' && (
              <button
                onClick={handleExecuteImport}
                disabled={state.loading || state.validateResult?.errors.length! > 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {state.loading ? '임포트 중...' : '임포트 시작'}
              </button>
            )}

            {state.step === 'complete' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                완료
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
