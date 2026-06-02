// ============================================================
// 📌 파일명: useExcelImport.ts
// 📋 목적: Excel 임포트 기능을 위한 React 커스텀 훅
// 🔧 기능: 파일 파싱, 매핑 검증, 임포트 실행, 진행률 추적
// 📤 반환값: useExcelImport, useExcelImportProgress, useExcelValidation 훅
// 📅 작성일: 2026-06-02
// ⚠️ 주의: Zustand 상태 관리 + 에러 처리 + 진행률 실시간 업데이트
// ============================================================

'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ExcelImportError,
  executeImportUtil,
  parseExcelFileUtil,
  validateMappingUtil,
  fetchSupportedTablesUtil,
  ImportProgressEvent,
  ImportStatistics,
  ImportTableName,
  ParseExcelResponse,
  ValidateMappingResponse,
  GetTablesResponse,
  RetryOptions,
} from '../api/excel-import-client';

/**
 * ============================================================
 * 📌 useExcelValidation 훅
 * 📋 목적: Excel 파일 및 매핑 검증
 * ============================================================
 */

export interface UseExcelValidationState {
  isValidating: boolean;
  validationResult: ValidateMappingResponse | null;
  validationError: ExcelImportError | null;
}

export function useExcelValidation() {
  const [state, setState] = useState<UseExcelValidationState>({
    isValidating: false,
    validationResult: null,
    validationError: null,
  });

  /**
   * 📌 함수: validate
   * 📋 목적: 파일과 매핑 검증 실행
   * 🔧 매개변수:
   *    - file: File 객체
   *    - tableName: 대상 테이블명
   *    - mapping: 컬럼 매핑
   * 📤 반환값: ValidateMappingResponse
   * 📅 작성일: 2026-06-02
   */
  const validate = useCallback(
    async (
      file: File,
      tableName: ImportTableName,
      mapping: Record<string, string>
    ): Promise<ValidateMappingResponse | null> => {
      setState((prev) => ({ ...prev, isValidating: true, validationError: null }));

      try {
        const result = await validateMappingUtil(file, tableName, mapping);
        setState((prev) => ({ ...prev, validationResult: result }));
        return result;
      } catch (error) {
        const importError =
          error instanceof ExcelImportError
            ? error
            : new ExcelImportError(
                'VALIDATION_ERROR',
                error instanceof Error ? error.message : '검증 실패'
              );

        setState((prev) => ({
          ...prev,
          validationError: importError,
          validationResult: null,
        }));

        return null;
      } finally {
        setState((prev) => ({ ...prev, isValidating: false }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isValidating: false,
      validationResult: null,
      validationError: null,
    });
  }, []);

  return { ...state, validate, reset };
}

/**
 * ============================================================
 * 📌 useExcelImportProgress 훅
 * 📋 목적: 실시간 임포트 진행률 추적
 * ============================================================
 */

export interface UseExcelImportProgressState {
  isImporting: boolean;
  progress: number;
  currentRow: number;
  totalRows: number;
  status: 'idle' | 'processing' | 'validating' | 'importing' | 'completed' | 'error';
  message: string;
  statistics: ImportStatistics | null;
  importError: ExcelImportError | null;
}

export function useExcelImportProgress() {
  const [state, setState] = useState<UseExcelImportProgressState>({
    isImporting: false,
    progress: 0,
    currentRow: 0,
    totalRows: 0,
    status: 'idle',
    message: '',
    statistics: null,
    importError: null,
  });

  /**
   * 📌 함수: updateProgress
   * 📋 목적: 진행률 상태 업데이트
   * 🔧 매개변수:
   *    - event: ImportProgressEvent
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const updateProgress = useCallback((event: ImportProgressEvent) => {
    setState((prev) => ({
      ...prev,
      currentRow: event.row_number,
      message: event.message || `행 ${event.row_number} 처리 중...`,
      status: event.status === 'success' ? 'importing' : 'error',
    }));
  }, []);

  /**
   * 📌 함수: setStatistics
   * 📋 목적: 최종 통계 설정
   * 🔧 매개변수:
   *    - stats: ImportStatistics
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const setStatistics = useCallback((stats: ImportStatistics) => {
    const progress = stats.total_rows > 0 ? (stats.success_count / stats.total_rows) * 100 : 0;

    setState((prev) => ({
      ...prev,
      statistics: stats,
      progress: progress,
      currentRow: stats.total_rows,
      totalRows: stats.total_rows,
      status: 'completed',
      message: `완료: ${stats.success_count}/${stats.total_rows}`,
    }));
  }, []);

  /**
   * 📌 함수: setError
   * 📋 목적: 에러 상태 설정
   * 🔧 매개변수:
   *    - error: ExcelImportError
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const setError = useCallback((error: ExcelImportError) => {
    setState((prev) => ({
      ...prev,
      importError: error,
      status: 'error',
      message: error.message,
      isImporting: false,
    }));
  }, []);

  /**
   * 📌 함수: reset
   * 📋 목적: 상태 초기화
   * 🔧 매개변수: (없음)
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const reset = useCallback(() => {
    setState({
      isImporting: false,
      progress: 0,
      currentRow: 0,
      totalRows: 0,
      status: 'idle',
      message: '',
      statistics: null,
      importError: null,
    });
  }, []);

  /**
   * 📌 함수: start
   * 📋 목적: 임포트 시작
   * 🔧 매개변수:
   *    - totalRows: 총 행 수
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const start = useCallback((totalRows: number) => {
    setState((prev) => ({
      ...prev,
      isImporting: true,
      totalRows,
      currentRow: 0,
      progress: 0,
      status: 'processing',
      message: '파일 처리 중...',
    }));
  }, []);

  return {
    ...state,
    updateProgress,
    setStatistics,
    setError,
    reset,
    start,
  };
}

/**
 * ============================================================
 * 📌 useExcelImport 메인 훅
 * 📋 목적: Excel 임포트 전체 워크플로우 관리
 * ============================================================
 */

export interface UseExcelImportOptions {
  retryOptions?: RetryOptions;
  skipErrors?: boolean;
  onSuccess?: (stats: ImportStatistics) => void;
  onError?: (error: ExcelImportError) => void;
}

export function useExcelImport(options?: UseExcelImportOptions) {
  const [supportedTables, setSupportedTables] = useState<GetTablesResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExcelResponse | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const validation = useExcelValidation();
  const progress = useExcelImportProgress();

  // 진행률 콜백 처리를 위한 ref (메모리 누수 방지)
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 📌 함수: fetchTables
   * 📋 목적: 지원되는 테이블 목록 조회
   * 🔧 매개변수: (없음)
   * 📤 반환값: GetTablesResponse | null
   * 📅 작성일: 2026-06-02
   */
  const fetchTables = useCallback(async () => {
    setIsFetching(true);

    try {
      const tables = await fetchSupportedTablesUtil(options?.retryOptions);
      setSupportedTables(tables);
      return tables;
    } catch (error) {
      const importError =
        error instanceof ExcelImportError
          ? error
          : new ExcelImportError(
              'FETCH_TABLES_ERROR',
              error instanceof Error ? error.message : '테이블 조회 실패'
            );

      progress.setError(importError);
      options?.onError?.(importError);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [options, progress]);

  /**
   * 📌 함수: parseFile
   * 📋 목적: Excel 파일 파싱
   * 🔧 매개변수:
   *    - file: File 객체
   *    - tableName: 대상 테이블명
   * 📤 반환값: ParseExcelResponse | null
   * 📅 작성일: 2026-06-02
   */
  const parseFile = useCallback(
    async (file: File, tableName: ImportTableName) => {
      setIsParsingFile(true);
      validation.reset();

      try {
        const result = await parseExcelFileUtil(
          file,
          tableName,
          options?.retryOptions
        );
        setParseResult(result);
        return result;
      } catch (error) {
        const importError =
          error instanceof ExcelImportError
            ? error
            : new ExcelImportError(
                'PARSE_ERROR',
                error instanceof Error ? error.message : '파일 파싱 실패'
              );

        progress.setError(importError);
        options?.onError?.(importError);
        return null;
      } finally {
        setIsParsingFile(false);
      }
    },
    [options, progress, validation]
  );

  /**
   * 📌 함수: executeImport
   * 📋 목적: 임포트 실행 (진행률 실시간 추적)
   * 🔧 매개변수:
   *    - file: File 객체
   *    - tableName: 대상 테이블명
   *    - mapping: 컬럼 매핑
   * 📤 반환값: ImportStatistics | null
   * 📅 작성일: 2026-06-02
   * ⚠️ 주의: onProgress 콜백 자동 포함
   */
  const executeImport = useCallback(
    async (
      file: File,
      tableName: ImportTableName,
      mapping: Record<string, string>
    ): Promise<ImportStatistics | null> => {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        progress.start(parseResult?.total_rows || 0);

        const stats = await executeImportUtil(
          file,
          tableName,
          mapping,
          (event) => {
            // 취소 확인
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('임포트 취소됨');
            }

            progress.updateProgress(event);
          },
          {
            skipErrors: options?.skipErrors ?? false,
            retryOptions: options?.retryOptions,
          }
        );

        progress.setStatistics(stats);
        options?.onSuccess?.(stats);
        return stats;
      } catch (error) {
        // 취소 요청은 에러로 처리하지 않음
        if (error instanceof Error && error.message === '임포트 취소됨') {
          progress.reset();
          return null;
        }

        const importError =
          error instanceof ExcelImportError
            ? error
            : new ExcelImportError(
                'IMPORT_ERROR',
                error instanceof Error ? error.message : '임포트 실패'
              );

        progress.setError(importError);
        options?.onError?.(importError);
        return null;
      }
    },
    [parseResult, options, progress]
  );

  /**
   * 📌 함수: cancel
   * 📋 목적: 진행 중인 임포트 취소
   * 🔧 매개변수: (없음)
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    progress.reset();
  }, [progress]);

  /**
   * 📌 함수: reset
   * 📋 목적: 전체 상태 초기화
   * 🔧 매개변수: (없음)
   * 📤 반환값: (없음)
   * 📅 작성일: 2026-06-02
   */
  const reset = useCallback(() => {
    validation.reset();
    progress.reset();
    setParseResult(null);
    setSupportedTables(null);
  }, [validation, progress]);

  return {
    // 상태
    supportedTables,
    isFetching,
    parseResult,
    isParsingFile,
    validation,
    progress,

    // 함수
    fetchTables,
    parseFile,
    executeImport,
    cancel,
    reset,
  };
}

/**
 * ============================================================
 * 📌 useExcelImportBatch 훅
 * 📋 목적: 여러 파일 일괄 임포트 관리
 * ============================================================
 */

export interface BatchImportFile {
  file: File;
  tableName: ImportTableName;
  mapping: Record<string, string>;
}

export function useExcelImportBatch(options?: UseExcelImportOptions) {
  const [batchProgress, setBatchProgress] = useState<
    Record<number, { progress: number; status: 'pending' | 'importing' | 'completed' | 'error' }>
  >({});
  const [batchResults, setBatchResults] = useState<ImportStatistics[]>([]);
  const [isBatchImporting, setIsBatchImporting] = useState(false);

  /**
   * 📌 함수: executeBatch
   * 📋 목적: 여러 파일 순차 임포트
   * 🔧 매개변수:
   *    - files: BatchImportFile[]
   * 📤 반환값: ImportStatistics[]
   * 📅 작성일: 2026-06-02
   */
  const executeBatch = useCallback(
    async (files: BatchImportFile[]): Promise<ImportStatistics[]> => {
      setIsBatchImporting(true);
      setBatchResults([]);
      setBatchProgress({});

      const results: ImportStatistics[] = [];

      for (let i = 0; i < files.length; i++) {
        const { file, tableName, mapping } = files[i];

        setBatchProgress((prev) => ({
          ...prev,
          [i]: { progress: 0, status: 'importing' },
        }));

        try {
          const result = await executeImportUtil(
            file,
            tableName,
            mapping,
            (event) => {
              const rowProgress =
                files[i].mapping && Object.keys(files[i].mapping).length > 0
                  ? event.row_number * 100 // 실제 진행률 계산
                  : 0;

              setBatchProgress((prev) => ({
                ...prev,
                [i]: { progress: rowProgress, status: 'importing' },
              }));
            },
            {
              skipErrors: options?.skipErrors ?? false,
              retryOptions: options?.retryOptions,
            }
          );

          results.push(result);

          setBatchProgress((prev) => ({
            ...prev,
            [i]: { progress: 100, status: 'completed' },
          }));

          options?.onSuccess?.(result);
        } catch (error) {
          const importError =
            error instanceof ExcelImportError
              ? error
              : new ExcelImportError(
                  'BATCH_IMPORT_ERROR',
                  error instanceof Error ? error.message : '일괄 임포트 실패'
                );

          setBatchProgress((prev) => ({
            ...prev,
            [i]: { progress: 0, status: 'error' },
          }));

          options?.onError?.(importError);

          // 실패한 파일에 대한 기본 결과 추가
          results.push({
            total_rows: 0,
            success_count: 0,
            failed_count: 1,
            skipped_count: 0,
            execution_time_seconds: 0,
            errors: [
              {
                file: file.name,
                message: importError.message,
              },
            ],
          });
        }
      }

      setBatchResults(results);
      setIsBatchImporting(false);
      return results;
    },
    [options]
  );

  const reset = useCallback(() => {
    setBatchProgress({});
    setBatchResults([]);
    setIsBatchImporting(false);
  }, []);

  return {
    batchProgress,
    batchResults,
    isBatchImporting,
    executeBatch,
    reset,
  };
}
