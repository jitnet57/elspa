/**
 * ImportProgressBar & useImportProgress TypeScript 타입 정의
 * 경로: frontend/src/components/ImportProgressBar.types.ts
 * 작성일: 2026-06-02
 *
 * 모든 인터페이스와 타입을 한 곳에 정의합니다.
 */

/**
 * 📌 인터페이스: ImportFailedRow
 * 📋 목적: 실패한 행의 상세 정보
 * 🔧 사용처: ImportProgressBar.tsx, useImportProgress.ts
 * 📅 작성일: 2026-06-02
 */
export interface ImportFailedRow {
  /** 행 번호 (1부터 시작, 헤더 제외) */
  rowNumber: number;

  /** 해당 행의 전체 데이터 */
  data: Record<string, unknown>;

  /** 에러 메시지 */
  error: string;

  /** 에러 타입 ('error' | 'warning') */
  type?: 'error' | 'warning';
}

/**
 * 📌 인터페이스: ImportProgressState
 * 📋 목적: 진행 상황 상태의 모든 속성
 * 🔧 사용처: useImportProgress.ts
 * 📅 작성일: 2026-06-02
 */
export interface ImportProgressState {
  /** 진행 중 여부 */
  isImporting: boolean;

  /** 진행률 (0-100, %) */
  progress: number;

  /** 성공한 행 수 */
  successCount: number;

  /** 실패한 행 수 */
  failedCount: number;

  /** 경고 행 수 */
  warningCount: number;

  /** 경과 시간 (초) */
  elapsedSeconds: number;

  /** 예상 남은 시간 (초) */
  estimatedSecondsRemaining: number;

  /** 실패한 행 상세 정보 */
  failedRows: ImportFailedRow[];
}

/**
 * 📌 인터페이스: ImportProgressBarProps
 * 📋 목적: ImportProgressBar 컴포넌트의 Props
 * 🔧 사용처: ImportProgressBar.tsx
 * 📅 작성일: 2026-06-02
 */
export interface ImportProgressBarProps {
  // 진행 상태 (필수)
  isImporting: boolean;
  progress: number;
  totalRows: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  elapsedSeconds: number;

  // 진행 상태 (선택)
  estimatedSecondsRemaining?: number;

  // 완료 후 결과 (선택)
  failedRows?: ImportFailedRow[];
  title?: string;
  onDownloadLog?: (csvContent: string) => void;
}

/**
 * 📌 인터페이스: UseImportProgressReturn
 * 📋 목적: useImportProgress 훅의 반환값
 * 🔧 사용처: useImportProgress.ts
 * 📅 작성일: 2026-06-02
 */
export interface UseImportProgressReturn extends ImportProgressState {
  // 제어 함수
  start: () => void;
  complete: () => void;
  reset: () => void;
  addSuccess: () => void;
  addFailed: (
    rowNumber: number,
    data: Record<string, unknown>,
    error: string,
    type?: 'error' | 'warning'
  ) => void;
  addWarning: () => void;
  setProgress: (value: number) => void;
}

/**
 * 📌 타입: ImportProgressHandler
 * 📋 목적: 진행 상황 처리 콜백의 시그니처
 * 🔧 사용처: API 통합 시
 * 📅 작성일: 2026-06-02
 */
export type ImportProgressHandler = (
  type: 'success' | 'failed' | 'warning',
  data?: {
    rowNumber?: number;
    rowData?: Record<string, unknown>;
    error?: string;
  }
) => void;

/**
 * 📌 타입: ImportStatusType
 * 📋 목적: 행의 처리 상태 타입
 * 🔧 사용처: CSV 파싱 시
 * 📅 작성일: 2026-06-02
 */
export type ImportStatusType = 'success' | 'failed' | 'warning' | 'pending';

/**
 * 📌 인터페이스: ImportRow
 * 📋 목적: 처리할 행의 구조
 * 🔧 사용처: CSV 파싱 및 검증
 * 📅 작성일: 2026-06-02
 */
export interface ImportRow {
  /** 행 번호 */
  rowNumber: number;

  /** 행 데이터 */
  data: Record<string, unknown>;

  /** 처리 상태 */
  status: ImportStatusType;

  /** 에러 메시지 (status === 'failed'일 때만) */
  error?: string;

  /** 경고 메시지 (status === 'warning'일 때만) */
  warning?: string;

  /** 처리 시간 (ms) */
  processingTime?: number;
}

/**
 * 📌 인터페이스: ImportResult
 * 📋 목적: 전체 가져오기 작업의 결과
 * 🔧 사용처: 완료 후 콜백
 * 📅 작성일: 2026-06-02
 */
export interface ImportResult {
  /** 총 처리된 행 수 */
  totalRows: number;

  /** 성공한 행 수 */
  successCount: number;

  /** 실패한 행 수 */
  failedCount: number;

  /** 경고 행 수 */
  warningCount: number;

  /** 성공률 (%) */
  successRate: number;

  /** 총 소요 시간 (초) */
  elapsedSeconds: number;

  /** 실패한 행 상세 정보 */
  failedRows: ImportFailedRow[];

  /** 처리 완료 여부 */
  completed: boolean;

  /** 완료 시간 (ISO 형식) */
  completedAt?: string;
}

/**
 * 📌 인터페이스: ImportOptions
 * 📋 목적: 가져오기 작업의 옵션
 * 🔧 사용처: useImportProgress 초기화 시
 * 📅 작성일: 2026-06-02
 */
export interface ImportOptions {
  /** 총 행 수 */
  totalRows: number;

  /** 청크 크기 (한번에 처리할 행 수) */
  chunkSize?: number;

  /** 행 지연 (ms) */
  rowDelay?: number;

  /** 실패 시 중단 여부 */
  stopOnError?: boolean;

  /** 콜백 함수 */
  onProgress?: ImportProgressHandler;
  onComplete?: (result: ImportResult) => void;
  onError?: (error: Error) => void;
}

/**
 * 📌 인터페이스: CSVParseResult
 * 📋 목적: CSV 파싱 결과
 * 🔧 사용처: CSV 파일 읽기
 * 📅 작성일: 2026-06-02
 */
export interface CSVParseResult {
  /** 헤더 행 */
  headers: string[];

  /** 데이터 행들 */
  rows: Record<string, unknown>[];

  /** 총 행 수 */
  rowCount: number;

  /** 파싱 오류 (있으면) */
  error?: Error;
}

/**
 * 📌 인터페이스: APIProgressEvent
 * 📋 목적: Server-Sent Events (SSE) 진행 상황 이벤트
 * 🔧 사용처: API 통합 (SSE)
 * 📅 작성일: 2026-06-02
 */
export interface APIProgressEvent {
  /** 이벤트 타입 */
  type: 'progress' | 'complete' | 'error';

  /** 현재 진행률 (0-100) */
  progress?: number;

  /** 행 번호 */
  rowNumber?: number;

  /** 행 처리 결과 타입 */
  resultType?: 'success' | 'failed' | 'warning';

  /** 행 데이터 */
  rowData?: Record<string, unknown>;

  /** 에러 메시지 */
  error?: string;

  /** 완료 정보 */
  completionData?: ImportResult;

  /** 타임스탬프 */
  timestamp?: string;
}

/**
 * 📌 함수 타입: CSVValidator
 * 📋 목적: CSV 행 검증 함수의 시그니처
 * 🔧 사용처: 커스텀 검증 로직
 * 📅 작성일: 2026-06-02
 */
export type CSVValidator = (
  row: Record<string, unknown>,
  rowNumber: number
) => {
  valid: boolean;
  error?: string;
  warning?: string;
};

/**
 * 📌 함수 타입: CSVTransformer
 * 📋 목적: CSV 행 변환 함수의 시그니처
 * 🔧 사용처: 데이터 전처리
 * 📅 작성일: 2026-06-02
 */
export type CSVTransformer = (
  row: Record<string, unknown>,
  headers: string[]
) => Record<string, unknown>;

// ============================================================
// 상수 & Enum 정의
// ============================================================

/**
 * 📌 Enum: ImportErrorType
 * 📋 목적: 에러 타입 분류
 * 🔧 사용처: 에러 처리
 * 📅 작성일: 2026-06-02
 */
export enum ImportErrorType {
  VALIDATION_ERROR = 'validation_error',
  PARSING_ERROR = 'parsing_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * 📌 상수: DEFAULT_CHUNK_SIZE
 * 📋 목적: 기본 청크 크기
 * 🔧 사용처: useImportProgress
 * 📅 작성일: 2026-06-02
 */
export const DEFAULT_CHUNK_SIZE = 10;

/**
 * 📌 상수: DEFAULT_ROW_DELAY
 * 📋 목적: 기본 행 지연 (ms)
 * 🔧 사용처: useImportProgress
 * 📅 작성일: 2026-06-02
 */
export const DEFAULT_ROW_DELAY = 100;

/**
 * 📌 상수: PROGRESS_UPDATE_INTERVAL
 * 📋 목적: 진행 상황 업데이트 간격 (ms)
 * 🔧 사용처: useImportProgress
 * 📅 작성일: 2026-06-02
 */
export const PROGRESS_UPDATE_INTERVAL = 1000; // 1초

/**
 * 📌 상수: MAX_FAILED_ROWS_DISPLAY
 * 📋 목적: UI에 표시할 최대 실패 행 수
 * 🔧 사용처: ImportProgressBar
 * 📅 작성일: 2026-06-02
 */
export const MAX_FAILED_ROWS_DISPLAY = 50;

// ============================================================
// 유틸리티 함수 타입
// ============================================================

/**
 * 📌 함수 타입: FormatTime
 * 📋 목적: 시간 포맷팅 함수
 * 🔧 사용처: 시간 표시
 * 📅 작성일: 2026-06-02
 */
export type FormatTime = (seconds: number) => string;

/**
 * 📌 함수 타입: CalculateProgress
 * 📋 목적: 진행률 계산 함수
 * 🔧 사용처: 진행률 업데이트
 * 📅 작성일: 2026-06-02
 */
export type CalculateProgress = (
  processedRows: number,
  totalRows: number
) => number;

// ============================================================
// 내보내기
// ============================================================

/**
 * 기본 내보내기
 */
export default {
  // 인터페이스
  ImportFailedRow,
  ImportProgressState,
  ImportProgressBarProps,
  UseImportProgressReturn,
  ImportRow,
  ImportResult,
  ImportOptions,
  CSVParseResult,
  APIProgressEvent,

  // 타입
  ImportStatusType,
  ImportProgressHandler,
  CSVValidator,
  CSVTransformer,
  FormatTime,
  CalculateProgress,

  // Enum
  ImportErrorType,

  // 상수
  DEFAULT_CHUNK_SIZE,
  DEFAULT_ROW_DELAY,
  PROGRESS_UPDATE_INTERVAL,
  MAX_FAILED_ROWS_DISPLAY,
};
