/**
 * 파일 가져오기(Import) 진행 상황 추적 훅
 * 경로: frontend/src/hooks/useImportProgress.ts
 * 작성일: 2026-06-02
 *
 * 기능:
 * - 진행률, 행 카운터, 소요 시간 추적
 * - 성공/실패/경고 카운트 관리
 * - 예상 시간 계산
 * - 실패한 행 데이터 저장
 *
 * 사용 예시:
 * ```tsx
 * const progress = useImportProgress(totalRows);
 *
 * // 진행 시작
 * progress.start();
 *
 * // 행 처리 완료
 * progress.addSuccess();
 * progress.addFailed(rowNumber, data, errorMessage);
 * progress.addWarning();
 *
 * // 진행 완료
 * progress.complete();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ImportFailedRow {
  rowNumber: number;
  data: Record<string, unknown>;
  error: string;
  type?: 'error' | 'warning';
}

export interface ImportProgressState {
  isImporting: boolean;
  progress: number; // 0-100 (%)
  successCount: number;
  failedCount: number;
  warningCount: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
  failedRows: ImportFailedRow[];
}

export interface UseImportProgressReturn extends ImportProgressState {
  start: () => void;
  complete: () => void;
  reset: () => void;
  addSuccess: () => void;
  addFailed: (rowNumber: number, data: Record<string, unknown>, error: string, type?: 'error' | 'warning') => void;
  addWarning: () => void;
  setProgress: (value: number) => void;
}

/**
 * 📌 함수명: useImportProgress
 * 📋 목적: 파일 가져오기의 진행 상황을 실시간으로 추적하는 커스텀 훅
 * 🔧 매개변수: totalRows (number) - 가져올 전체 행의 개수
 * 📤 반환값: UseImportProgressReturn - 상태 및 제어 함수들
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 마운트 시 자동으로 시간 추적이 시작되지 않음 (start() 호출 필수)
 */
export function useImportProgress(totalRows: number): UseImportProgressReturn {
  const [state, setState] = useState<ImportProgressState>({
    isImporting: false,
    progress: 0,
    successCount: 0,
    failedCount: 0,
    warningCount: 0,
    elapsedSeconds: 0,
    estimatedSecondsRemaining: 0,
    failedRows: [],
  });

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 시간 경과 및 예상 시간 계산
  useEffect(() => {
    if (!state.isImporting) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;

      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const processedRows = state.successCount + state.failedCount + state.warningCount;
      const remainingRows = totalRows - processedRows;

      let estimatedSecondsRemaining = 0;
      if (processedRows > 0 && elapsedSeconds > 0) {
        const secondsPerRow = elapsedSeconds / processedRows;
        estimatedSecondsRemaining = Math.ceil(secondsPerRow * remainingRows);
      }

      setState((prev) => ({
        ...prev,
        elapsedSeconds,
        estimatedSecondsRemaining,
      }));
    }, 1000); // 1초마다 업데이트

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isImporting, state.successCount, state.failedCount, state.warningCount, totalRows]);

  // 진행 시작
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setState((prev) => ({
      ...prev,
      isImporting: true,
      progress: 0,
      successCount: 0,
      failedCount: 0,
      warningCount: 0,
      elapsedSeconds: 0,
      estimatedSecondsRemaining: 0,
      failedRows: [],
    }));
  }, []);

  // 진행 완료
  const complete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isImporting: false,
      progress: 100,
    }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 초기화
  const reset = useCallback(() => {
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      isImporting: false,
      progress: 0,
      successCount: 0,
      failedCount: 0,
      warningCount: 0,
      elapsedSeconds: 0,
      estimatedSecondsRemaining: 0,
      failedRows: [],
    });
  }, []);

  // 성공 카운트 증가
  const addSuccess = useCallback(() => {
    setState((prev) => {
      const newSuccessCount = prev.successCount + 1;
      const totalProcessed = newSuccessCount + prev.failedCount + prev.warningCount;
      const newProgress = totalRows > 0 ? (totalProcessed / totalRows) * 100 : 0;

      return {
        ...prev,
        successCount: newSuccessCount,
        progress: newProgress,
      };
    });
  }, [totalRows]);

  // 실패 카운트 증가 및 에러 정보 저장
  const addFailed = useCallback(
    (rowNumber: number, data: Record<string, unknown>, error: string, type: 'error' | 'warning' = 'error') => {
      setState((prev) => {
        const newFailedCount = prev.failedCount + 1;
        const totalProcessed = prev.successCount + newFailedCount + prev.warningCount;
        const newProgress = totalRows > 0 ? (totalProcessed / totalRows) * 100 : 0;

        return {
          ...prev,
          failedCount: newFailedCount,
          progress: newProgress,
          failedRows: [
            ...prev.failedRows,
            {
              rowNumber,
              data,
              error,
              type,
            },
          ],
        };
      });
    },
    [totalRows]
  );

  // 경고 카운트 증가
  const addWarning = useCallback(() => {
    setState((prev) => {
      const newWarningCount = prev.warningCount + 1;
      const totalProcessed = prev.successCount + prev.failedCount + newWarningCount;
      const newProgress = totalRows > 0 ? (totalProcessed / totalRows) * 100 : 0;

      return {
        ...prev,
        warningCount: newWarningCount,
        progress: newProgress,
      };
    });
  }, [totalRows]);

  // 진행률 수동 설정
  const setProgress = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      progress: Math.min(Math.max(value, 0), 100),
    }));
  }, []);

  return {
    ...state,
    start,
    complete,
    reset,
    addSuccess,
    addFailed,
    addWarning,
    setProgress,
  };
}

export default useImportProgress;
