'use client';

import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, Eye, EyeOff } from 'lucide-react';

// ============================================================
// 📌 컴포넌트명: ImportPreview
// 📋 목적: Excel 임포트 전 데이터 검증 및 미리보기
// 🔧 기능: 행 미리보기, 검증 결과 표시, 에러/경고 목록, 요약 통계
// 📤 Props: data, columns, validators, onValidate
// 📅 작성일: 2026-06-02
// ============================================================

interface ValidationRule {
  field: string;
  validate: (value: any, row?: Record<string, any>) => { valid: boolean; message?: string; type: 'error' | 'warning' };
  required?: boolean;
}

interface ValidationResult {
  rowIndex: number;
  field: string;
  type: 'error' | 'warning';
  message: string;
}

interface ImportPreviewProps {
  data: Record<string, any>[];
  columns: string[];
  validators?: ValidationRule[];
  previewRows?: number;
  onValidate?: (results: { totalRows: number; validRows: number; invalidRows: number; warnings: number; errors: ValidationResult[] }) => void;
}

interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: number;
  errors: number;
  errorsByField: Record<string, number>;
  warningsByField: Record<string, number>;
}

/**
 * 기본 검증 규칙: 필수 필드
 */
const createRequiredValidator = (field: string): ValidationRule => ({
  field,
  required: true,
  validate: (value) => ({
    valid: value !== null && value !== undefined && value !== '',
    message: `${field}은(는) 필수 입력 항목입니다`,
    type: 'error'
  })
});

/**
 * 기본 검증 규칙: 숫자 필드
 */
const createNumberValidator = (field: string): ValidationRule => ({
  field,
  validate: (value) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true, message: undefined, type: 'error' };
    }
    const num = Number(value);
    return {
      valid: !isNaN(num),
      message: `${field}은(는) 숫자여야 합니다 (입력값: ${value})`,
      type: 'error'
    };
  }
});

/**
 * 기본 검증 규칙: 날짜 필드 (YYYY-MM-DD)
 */
const createDateValidator = (field: string): ValidationRule => ({
  field,
  validate: (value) => {
    if (value === null || value === undefined || value === '') {
      return { valid: true, message: undefined, type: 'error' };
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(String(value))) {
      return {
        valid: false,
        message: `${field}은(는) YYYY-MM-DD 형식이어야 합니다 (입력값: ${value})`,
        type: 'error'
      };
    }
    const date = new Date(String(value));
    return {
      valid: !isNaN(date.getTime()),
      message: `${field}의 날짜가 유효하지 않습니다 (입력값: ${value})`,
      type: 'error'
    };
  }
});

/**
 * ImportPreview 컴포넌트
 * Excel 데이터 임포트 전 검증 및 미리보기를 표시합니다
 */
export default function ImportPreview({
  data,
  columns,
  validators = [],
  previewRows = 5,
  onValidate
}: ImportPreviewProps) {
  const [expandedErrors, setExpandedErrors] = useState(false);
  const [detailedView, setDetailedView] = useState(false);

  /**
   * 검증 수행
   */
  const validationResults = useMemo(() => {
    const errors: ValidationResult[] = [];

    data.forEach((row, rowIndex) => {
      columns.forEach((column) => {
        const columnValidators = validators.filter((v) => v.field === column);

        columnValidators.forEach((validator) => {
          const value = row[column];
          const result = validator.validate(value, row);

          if (!result.valid) {
            errors.push({
              rowIndex: rowIndex + 2, // +2: 1 for 0-index to 1-index, 1 for header row
              field: column,
              type: result.type,
              message: result.message || `${column} 검증 실패`
            });
          }
        });
      });
    });

    return errors;
  }, [data, columns, validators]);

  /**
   * 검증 요약 계산
   */
  const summary = useMemo(() => {
    const result: ValidationSummary = {
      totalRows: data.length,
      validRows: 0,
      invalidRows: 0,
      warnings: 0,
      errors: 0,
      errorsByField: {},
      warningsByField: {}
    };

    const rowsWithErrors = new Set<number>();
    const rowsWithWarnings = new Set<number>();

    validationResults.forEach((error) => {
      if (error.type === 'error') {
        result.errors += 1;
        rowsWithErrors.add(error.rowIndex);
        result.errorsByField[error.field] = (result.errorsByField[error.field] || 0) + 1;
      } else {
        result.warnings += 1;
        rowsWithWarnings.add(error.rowIndex);
        result.warningsByField[error.field] = (result.warningsByField[error.field] || 0) + 1;
      }
    });

    result.invalidRows = rowsWithErrors.size;
    result.validRows = result.totalRows - result.invalidRows;

    if (onValidate) {
      onValidate({
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        warnings: result.warnings,
        errors: validationResults
      });
    }

    return result;
  }, [data, validationResults, onValidate]);

  /**
   * 행별 에러/경고 매핑
   */
  const errorsByRow = useMemo(() => {
    const map: Record<number, ValidationResult[]> = {};
    validationResults.forEach((error) => {
      if (!map[error.rowIndex]) map[error.rowIndex] = [];
      map[error.rowIndex].push(error);
    });
    return map;
  }, [validationResults]);

  /**
   * 미리보기 행 (최대 5개)
   */
  const previewData = useMemo(() => data.slice(0, previewRows), [data, previewRows]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      {/* 🎯 헤더 + 검증 요약 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 임포트 미리보기 & 검증</h2>

        {/* 요약 카드들 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {/* 총 행 수 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 font-medium">총 행 수</div>
            <div className="text-3xl font-bold text-blue-900">{summary.totalRows}</div>
          </div>

          {/* 유효한 행 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <CheckCircle size={16} />
              유효한 행
            </div>
            <div className="text-3xl font-bold text-green-900">{summary.validRows}</div>
          </div>

          {/* 오류 있는 행 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
              <XCircle size={16} />
              오류 행
            </div>
            <div className="text-3xl font-bold text-red-900">{summary.invalidRows}</div>
          </div>

          {/* 오류 수 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-700 font-medium">오류 개수</div>
            <div className="text-3xl font-bold text-red-900">{summary.errors}</div>
          </div>

          {/* 경고 수 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
              <AlertTriangle size={16} />
              경고
            </div>
            <div className="text-3xl font-bold text-amber-900">{summary.warnings}</div>
          </div>
        </div>

        {/* 필드별 오류/경고 */}
        {(Object.keys(summary.errorsByField).length > 0 || Object.keys(summary.warningsByField).length > 0) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">⚠️ 필드별 검증 상태</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(summary.errorsByField).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2">오류 필드</h4>
                  <ul className="space-y-1">
                    {Object.entries(summary.errorsByField).map(([field, count]) => (
                      <li key={field} className="text-sm text-red-600">
                        • {field}: <span className="font-semibold">{count}</span>개
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Object.keys(summary.warningsByField).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-700 mb-2">경고 필드</h4>
                  <ul className="space-y-1">
                    {Object.entries(summary.warningsByField).map(([field, count]) => (
                      <li key={field} className="text-sm text-amber-600">
                        • {field}: <span className="font-semibold">{count}</span>개
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 📋 미리보기 테이블 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            📋 첫 {previewRows}개 행 미리보기
          </h3>
          <button
            onClick={() => setDetailedView(!detailedView)}
            className="flex items-center gap-2 text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {detailedView ? <EyeOff size={16} /> : <Eye size={16} />}
            {detailedView ? '간단히' : '상세히'}
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 w-12">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 w-16">상태</th>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => {
                const rowNum = idx + 2; // +2 for header and 1-based indexing
                const rowErrors = errorsByRow[rowNum] || [];
                const hasError = rowErrors.some((e) => e.type === 'error');
                const hasWarning = rowErrors.some((e) => e.type === 'warning');

                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`border-b border-gray-200 ${
                        hasError ? 'bg-red-50' : hasWarning ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600 font-medium">{rowNum}</td>
                      <td className="px-4 py-3">
                        {hasError ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                            <XCircle size={12} />
                            오류
                          </span>
                        ) : hasWarning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            <AlertTriangle size={12} />
                            경고
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle size={12} />
                            정상
                          </span>
                        )}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={`${idx}-${col}`}
                          className="px-4 py-3 text-gray-700 max-w-xs truncate"
                          title={String(row[col] || '')}
                        >
                          {row[col] === null || row[col] === undefined ? (
                            <span className="text-gray-400 italic">(비어있음)</span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* 상세 오류/경고 표시 */}
                    {detailedView && rowErrors.length > 0 && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={columns.length + 2} className="px-4 py-3">
                          <div className="space-y-1">
                            {rowErrors.map((error, errIdx) => (
                              <div
                                key={errIdx}
                                className={`flex items-start gap-2 p-2 rounded text-sm ${
                                  error.type === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {error.type === 'error' ? (
                                  <XCircle size={14} className="flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <span className="font-semibold">{error.field}:</span> {error.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {data.length > previewRows && (
          <p className="mt-2 text-sm text-gray-600">
            💡 총 {data.length - previewRows}개의 추가 행이 더 있습니다
          </p>
        )}
      </div>

      {/* ❌ 전체 오류 목록 */}
      {validationResults.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedErrors(!expandedErrors)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left font-semibold text-gray-900 transition"
          >
            {expandedErrors ? (
              <AlertCircle size={20} className="text-red-600" />
            ) : (
              <AlertCircle size={20} className="text-gray-600" />
            )}
            <span>
              {expandedErrors ? '▼' : '▶'} 모든 검증 오류 & 경고 ({validationResults.length}개)
            </span>
          </button>

          {expandedErrors && (
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
              {validationResults.map((error, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded border ${
                    error.type === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {error.type === 'error' ? (
                    <XCircle size={18} className="flex-shrink-0 text-red-600 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="flex-shrink-0 text-amber-600 mt-0.5" />
                  )}
                  <div className="flex-1 text-sm">
                    <div className={error.type === 'error' ? 'text-red-900' : 'text-amber-900'}>
                      <span className="font-semibold">행 {error.rowIndex}</span> · 필드: <span className="font-mono">{error.field}</span>
                    </div>
                    <div className={error.type === 'error' ? 'text-red-700' : 'text-amber-700'}>
                      {error.message}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${
                    error.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {error.type === 'error' ? '오류' : '경고'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ 성공 메시지 */}
      {summary.invalidRows === 0 && summary.errors === 0 && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <div className="font-semibold text-green-900">모든 데이터가 유효합니다!</div>
              <div className="text-sm text-green-700">총 {summary.totalRows}개 행을 안전하게 임포트할 수 있습니다</div>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 정보 */}
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ 데이터 정보</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 전체 열(컬럼): {columns.length}</li>
          <li>• 전체 행(데이터): {data.length}</li>
          <li>• 미리보기 행: {previewData.length}</li>
          <li>• 적용된 검증 규칙: {validators.length}</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 유틸리티 내보내기: 검증 규칙 생성 함수들
 */
export {
  createRequiredValidator,
  createNumberValidator,
  createDateValidator,
  type ValidationRule,
  type ValidationResult,
  type ImportPreviewProps
};
