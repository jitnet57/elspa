/**
 * ============================================================
 * 📌 Excel Import API Client
 * 📋 목적: Excel 임포트 API 클라이언트 (TypeScript) - 유틸리티 함수 + 클래스 기반
 * 🔧 경로: frontend/src/lib/api/excel-import-client.ts
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 재시도 로직(3회) + 스트리밍 진행률 + 상세 에러 처리 포함
 * ============================================================
 */

import { API_BASE_URL } from '../config/api-config';

/**
 * Types & Interfaces
 */

export type ImportTableName = 'employees' | 'therapists' | 'customers' | 'expense_categories' | 'beds';

export type FieldType = 'string' | 'integer' | 'decimal' | 'boolean' | 'enum' | 'date' | 'datetime';

export type ImportStatus = 'success' | 'failed' | 'skipped';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  description?: string;
  values?: string[]; // for enum types
  max_length?: number; // for string types
  default_value?: any;
}

export interface TableDefinition {
  name: ImportTableName;
  display_name: string;
  description: string;
  fields: FieldDefinition[];
}

export interface GetTablesResponse {
  tables: TableDefinition[];
  total_count: number;
}

export interface ParseExcelResponse {
  headers: string[];
  sample_data: Record<string, any>[];
  total_rows: number;
  suggested_mapping: Record<string, string>;
}

export interface ValidationError {
  row_number: number;
  column: string;
  error_message: string;
  value?: any;
}

export interface ValidationWarning {
  row_number: number;
  column: string;
  warning_message: string;
  value?: any;
}

export interface ValidateMappingResponse {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  preview_data: Record<string, any>[];
  total_rows: number;
}

export interface ImportProgressEvent {
  row_number: number;
  status: ImportStatus;
  message?: string;
  errors?: Record<string, string>;
}

export interface ImportStatistics {
  total_rows: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  execution_time_seconds: number;
  errors: Record<string, any>[];
}

export interface ImportHistory {
  import_id: string;
  table_name: ImportTableName;
  file_name: string;
  file_size: number;
  created_by: string;
  created_at: string;
  statistics: ImportStatistics;
}

export interface ImportHistoryResponse {
  history: ImportHistory[];
  total_count: number;
  page: number;
  page_size: number;
}

/**
 * Base API Client
 */
class ApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  protected async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { method: 'GET' });
    if (!response.ok) throw new Error(`GET ${path} failed: ${response.statusText}`);
    return response.json();
  }

  protected async post<T>(path: string, body: any, options?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? body : JSON.stringify(body),
      ...options,
    });
    if (!response.ok) throw new Error(`POST ${path} failed: ${response.statusText}`);
    return response.json();
  }
}

/**
 * Excel Import API Client
 */
export class ExcelImportClient extends ApiClient {
  /**
   * Get supported tables for import
   */
  async getTables(): Promise<GetTablesResponse> {
    return this.get('/import/tables');
  }

  /**
   * Parse Excel file and get headers, sample data, and suggested mapping
   */
  async parseExcel(
    file: File,
    tableName: ImportTableName
  ): Promise<ParseExcelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);

    return this.post('/import/parse-excel', formData, {
      headers: {
        // Let the browser set Content-Type with boundary for FormData
      },
    });
  }

  /**
   * Validate mapping and get preview data
   */
  async validateMapping(
    file: File,
    tableName: ImportTableName,
    mapping: Record<string, string>
  ): Promise<ValidateMappingResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);
    formData.append('mapping', JSON.stringify(mapping));

    return this.post('/import/validate-mapping', formData, {
      headers: {
        // Let the browser set Content-Type with boundary for FormData
      },
    });
  }

  /**
   * Execute import with streaming progress
   */
  async executeImport(
    file: File,
    tableName: ImportTableName,
    mapping: Record<string, string>,
    options?: {
      skipErrors?: boolean;
      onProgress?: (event: ImportProgressEvent) => void;
      onComplete?: (stats: ImportStatistics) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<ImportStatistics> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('table_name', tableName);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('skip_errors', String(options?.skipErrors ?? false));

      const xhr = new XMLHttpRequest();
      const apiUrl = `${this.baseUrl}/import/execute`;
      const token = localStorage.getItem('access_token');

      xhr.open('POST', apiUrl);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      let lastEventId = 0;
      let finalStats: ImportStatistics | null = null;

      xhr.onprogress = () => {
        if (xhr.responseText) {
          const lines = xhr.responseText.split('\n\n');

          for (let i = lastEventId; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) continue;

            // Parse SSE format
            const eventMatch = line.match(/event:\s*(\w+)/);
            const dataMatch = line.match(/data:\s*(.+)/);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              const dataStr = dataMatch[1];

              try {
                const data = JSON.parse(dataStr);

                if (eventType === 'progress') {
                  options?.onProgress?.(data as ImportProgressEvent);
                } else if (eventType === 'complete') {
                  finalStats = data as ImportStatistics;
                  options?.onComplete?.(finalStats);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }

            lastEventId++;
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 && finalStats) {
          resolve(finalStats);
        } else {
          reject(new Error(`Import failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        const error = new Error('Import request failed');
        options?.onError?.(error);
        reject(error);
      };

      xhr.send(formData);
    });
  }

  /**
   * Get import history
   */
  async getImportHistory(
    page: number = 1,
    pageSize: number = 10,
    tableName?: ImportTableName
  ): Promise<ImportHistoryResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    if (tableName) {
      params.append('table_name', tableName);
    }

    return this.get(`/import/history?${params.toString()}`);
  }

  /**
   * Get import details by ID
   */
  async getImportDetails(importId: string): Promise<ImportHistory> {
    return this.get(`/import/history/${importId}`);
  }

  /**
   * Download import error report as CSV
   */
  async downloadErrorReport(importId: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/import/history/${importId}/errors/csv`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download error report');
    }

    return response.blob();
  }
}

/**
 * Utility Functions
 */

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validate Excel file before upload
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ['.xlsx', '.xls'];

  // Check file extension
  const hasValidExtension = allowedExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. 허용 형식: ${allowedExtensions.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 크기: ${formatFileSize(maxSize)}`,
    };
  }

  return { valid: true };
}

/**
 * Convert mapping object to query string
 */
export function mappingToQuery(mapping: Record<string, string>): string {
  return JSON.stringify(mapping);
}

/**
 * Parse error response from import
 */
export function parseImportError(error: ValidationError): string {
  return `행 ${error.row_number}, 컬럼 "${error.column}": ${error.error_message}`;
}

/**
 * Create singleton instance
 */
const excelImportClient = new ExcelImportClient();

export default excelImportClient;

/**
 * ============================================================
 * 📌 고급 유틸리티 함수 (Advanced Utility Functions)
 * 📋 목적: 재시도 로직, 상세 에러 처리, 스트리밍 지원
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

/**
 * 📌 에러 클래스
 */
export class ExcelImportError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ExcelImportError';
  }
}

/**
 * 📌 재시도 옵션
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

/**
 * 📌 함수: withRetry
 * 📋 목적: 함수 실행 시 자동 재시도 (지수 백오프)
 * 🔧 매개변수:
 *    - fn: 실행할 함수
 *    - options: 재시도 옵션 {maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2}
 * 📤 반환값: Promise<T>
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 기본값은 3회 재시도, 1초 대기, 2배 증가
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2 } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      console.warn(
        `[재시도] ${attempt}/${maxAttempts} 재시도 중... (${delay}ms 대기)`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('재시도 로직 오류');
}

/**
 * 📌 함수: parseErrorResponse
 * 📋 목적: 에러 응답을 상세한 ExcelImportError로 변환
 * 🔧 매개변수:
 *    - response: Response 객체
 * 📤 반환값: ExcelImportError
 * 📅 작성일: 2026-06-02
 */
async function parseErrorResponse(response: Response): Promise<ExcelImportError> {
  try {
    const data = await response.json();
    const message =
      data.error_message ||
      data.detail ||
      `Excel Import API 요청 실패 (${response.status})`;

    return new ExcelImportError(
      data.error_code || `HTTP_${response.status}`,
      message,
      data.details
    );
  } catch {
    return new ExcelImportError(
      `HTTP_${response.status}`,
      `Excel Import API 요청 실패: ${response.statusText}`
    );
  }
}

/**
 * 📌 함수: fetchSupportedTablesUtil
 * 📋 목적: 지원되는 테이블 목록을 유틸리티 함수로 조회
 * 🔧 매개변수:
 *    - retryOptions: 재시도 옵션 (선택)
 * 📤 반환값: GetTablesResponse
 * 📅 작성일: 2026-06-02
 */
export async function fetchSupportedTablesUtil(
  retryOptions?: RetryOptions
): Promise<GetTablesResponse> {
  return withRetry(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/supported-tables`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json();
  }, retryOptions);
}

/**
 * 📌 함수: parseExcelFileUtil
 * 📋 목적: Excel 파일 파싱 (유틸리티)
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - retryOptions: 재시도 옵션
 * 📤 반환값: ParseExcelResponse
 * 📅 작성일: 2026-06-02
 */
export async function parseExcelFileUtil(
  file: File,
  tableName: ImportTableName,
  retryOptions?: RetryOptions
): Promise<ParseExcelResponse> {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);

    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/parse-excel`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json();
  }, retryOptions);
}

/**
 * 📌 함수: validateMappingUtil
 * 📋 목적: 컬럼 매핑 검증 (유틸리티)
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - mapping: 컬럼 매핑
 *    - retryOptions: 재시도 옵션
 * 📤 반환값: ValidateMappingResponse
 * 📅 작성일: 2026-06-02
 */
export async function validateMappingUtil(
  file: File,
  tableName: ImportTableName,
  mapping: Record<string, string>,
  retryOptions?: RetryOptions
): Promise<ValidateMappingResponse> {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);
    formData.append('mapping', JSON.stringify(mapping));

    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/validate-mapping`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json();
  }, retryOptions);
}

/**
 * 📌 함수: executeImportUtil
 * 📋 목적: Excel 임포트 실행 (스트리밍 지원)
 * 🔧 매개변수:
 *    - file: File 객체
 *    - tableName: 대상 테이블명
 *    - mapping: 컬럼 매핑
 *    - onProgress: 진행률 콜백 (선택)
 *    - options: 추가 옵션 {skipErrors, retryOptions}
 * 📤 반환값: ImportStatistics
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의:
 *    - SSE 또는 NDJSON 형식으로 진행률 스트리밍
 *    - onProgress는 매 행마다 또는 배치마다 호출됨
 *    - skipErrors=true일 경우 에러 발생 시 계속 진행
 */
export async function executeImportUtil(
  file: File,
  tableName: ImportTableName,
  mapping: Record<string, string>,
  onProgress?: (event: ImportProgressEvent) => void,
  options?: {
    skipErrors?: boolean;
    retryOptions?: RetryOptions;
  }
): Promise<ImportStatistics> {
  return withRetry(async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('skip_errors', String(options?.skipErrors ?? false));
    formData.append('stream_progress', 'true'); // 진행률 스트리밍 활성화

    const response = await fetch(
      `${API_BASE_URL}/api/excel/import/execute`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    // 스트리밍 처리
    if (onProgress && response.body) {
      return streamProgressResponse(response, onProgress);
    }

    return response.json();
  }, options?.retryOptions);
}

/**
 * 📌 함수: streamProgressResponse
 * 📋 목적: ReadableStream에서 진행률 이벤트 처리 (NDJSON 형식)
 * 🔧 매개변수:
 *    - response: Response 객체
 *    - onProgress: 진행률 콜백
 * 📤 반환값: ImportStatistics
 * 📅 작성일: 2026-06-02
 * ⚠️ 주의: 각 라인은 JSON 객체 (ImportProgressEvent 또는 최종 ImportStatistics)
 */
async function streamProgressResponse(
  response: Response,
  onProgress: (event: ImportProgressEvent) => void
): Promise<ImportStatistics> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalStats: ImportStatistics | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // NDJSON: 라인별 처리
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인 보존

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);

            // ImportProgressEvent 또는 ImportStatistics 판별
            if ('row_number' in event && 'status' in event) {
              onProgress(event as ImportProgressEvent);
            } else if ('total_rows' in event && 'success_count' in event) {
              finalStats = event as ImportStatistics;
            }
          } catch (parseError) {
            console.warn('진행률 파싱 오류:', line, parseError);
          }
        }
      }
    }

    // 남은 버퍼 처리
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        if ('total_rows' in event && 'success_count' in event) {
          finalStats = event as ImportStatistics;
        }
      } catch {
        // 무시
      }
    }

    if (!finalStats) {
      throw new ExcelImportError(
        'STREAM_ERROR',
        '임포트 결과를 받지 못했습니다'
      );
    }

    return finalStats;
  } finally {
    reader.releaseLock();
  }
}

/**
 * 📌 함수: bulkExecuteImportUtil
 * 📋 목적: 여러 파일 순차 임포트 (유틸리티)
 * 🔧 매개변수:
 *    - files: {file: File, tableName: string, mapping: Record<string, string>}[]
 *    - onProgress: (event: ImportProgressEvent & {fileIndex: number}) => void
 *    - options: 추가 옵션
 * 📤 반환값: ImportStatistics[]
 * 📅 작성일: 2026-06-02
 */
export async function bulkExecuteImportUtil(
  files: Array<{
    file: File;
    tableName: ImportTableName;
    mapping: Record<string, string>;
  }>,
  onProgress?: (
    event: ImportProgressEvent & { fileIndex: number }
  ) => void,
  options?: {
    skipErrors?: boolean;
    retryOptions?: RetryOptions;
  }
): Promise<ImportStatistics[]> {
  const results: ImportStatistics[] = [];

  for (let i = 0; i < files.length; i++) {
    const { file, tableName, mapping } = files[i];

    try {
      const result = await executeImportUtil(
        file,
        tableName,
        mapping,
        (event) => {
          onProgress?.({ ...event, fileIndex: i });
        },
        options
      );
      results.push(result);
    } catch (error) {
      console.error(`파일 ${i} 임포트 실패:`, error);
      // 에러 결과 추가
      results.push({
        total_rows: 0,
        success_count: 0,
        failed_count: 1,
        skipped_count: 0,
        execution_time_seconds: 0,
        errors: [
          {
            file: file.name,
            message:
              error instanceof Error ? error.message : '알 수 없는 오류',
          },
        ],
      });
    }
  }

  return results;
}

/**
 * ============================================================
 * 📌 자동 분류 및 매핑 (Auto-Classification & Mapping)
 * 📋 목적: Excel 헤더 분석으로 테이블 추천 및 자동 매핑
 * 📅 작성일: 2026-06-03
 * ============================================================
 */

// 각 테이블별 헤더 패턴 정의
const TABLE_PATTERNS: Record<ImportTableName, { keywords: string[]; priority: number }> = {
  therapists: {
    keywords: ['therapist', 'name', 'specialty', 'license', 'phone', 'certificate'],
    priority: 1,
  },
  employees: {
    keywords: ['employee', 'staff', 'position', 'department', 'salary', 'hire_date'],
    priority: 2,
  },
  customers: {
    keywords: ['customer', 'client', 'member', 'phone', 'email', 'address'],
    priority: 3,
  },
  beds: {
    keywords: ['bed', 'room', 'status', 'therapist'],
    priority: 4,
  },
  expense_categories: {
    keywords: ['category', 'expense', 'cost', 'type'],
    priority: 5,
  },
};

// 컬럼 매핑을 위한 동의어 사전
const COLUMN_SYNONYMS: Record<string, string[]> = {
  name: ['name', 'full_name', 'therapist_name', 'employee_name', 'customer_name', 'person_name'],
  specialty: ['specialty', 'specialization', 'field', 'expertise'],
  license: ['license', 'license_number', 'certificate', 'cert_number'],
  phone: ['phone', 'phone_number', 'phone_num', 'contact', 'mobile'],
  email: ['email', 'email_address', 'mail'],
  address: ['address', 'location', 'addr'],
  status: ['status', 'state', 'condition'],
  room_number: ['room', 'room_number', 'room_num', 'room_id'],
  position: ['position', 'job', 'title', 'job_title'],
  department: ['department', 'dept', 'division'],
  salary: ['salary', 'wage', 'pay', 'compensation'],
  hire_date: ['hire_date', 'start_date', 'date_hired'],
  category: ['category', 'type', 'kind'],
  cost: ['cost', 'price', 'amount', 'value'],
};

/**
 * 📌 함수: detectTableFromHeaders
 * 📋 목적: Excel 헤더 패턴 분석으로 테이블 자동 추천
 * 🔧 매개변수: headers (string[]) - Excel 파일의 헤더 배열
 * 📤 반환값: {table: ImportTableName, confidence: number}
 * 📅 작성일: 2026-06-03
 */
export function detectTableFromHeaders(
  headers: string[]
): { table: ImportTableName; confidence: number } {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // 각 테이블별 점수 계산
  const scores: Record<ImportTableName, number> = {
    therapists: 0,
    employees: 0,
    customers: 0,
    beds: 0,
    expense_categories: 0,
  };

  for (const [tableName, pattern] of Object.entries(TABLE_PATTERNS)) {
    const table = tableName as ImportTableName;
    let matchCount = 0;

    for (const keyword of pattern.keywords) {
      const found = normalizedHeaders.some((h) => h.includes(keyword));
      if (found) matchCount++;
    }

    scores[table] = matchCount / pattern.keywords.length;
  }

  // 가장 높은 점수의 테이블 선택
  const [bestTable, bestScore] = Object.entries(scores).reduce((prev, curr) =>
    curr[1] > prev[1] ? curr : prev
  ) as [ImportTableName, number];

  return {
    table: bestTable,
    confidence: Math.round(bestScore * 100),
  };
}

/**
 * 📌 함수: generateAutoMapping
 * 📋 목적: Excel 헤더와 데이터베이스 필드를 자동으로 매핑 (규칙 기반)
 * 🔧 매개변수:
 *    - headers: Excel 헤더 배열
 *    - tableName: 대상 테이블명
 *    - fields: 테이블 필드 정의 배열 (선택)
 * 📤 반환값: Record<string, string> (Excel헤더 -> DB필드 매핑)
 * 📅 작성일: 2026-06-03
 * ⚠️ 주의: 동의어 매칭 사용, 매칭 없으면 공백
 */
export function generateAutoMapping(
  headers: string[],
  tableName: ImportTableName,
  fields?: FieldDefinition[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // 필드 목록이 없으면 기본 필드 목록 사용
  const dbFields = fields ? fields.map((f) => f.name) : getDefaultFields(tableName);

  for (const header of normalizedHeaders) {
    let matchedField = '';

    // 정확한 매칭 시도
    if (dbFields.includes(header)) {
      matchedField = header;
    } else {
      // 동의어로 매칭 시도
      for (const [dbField, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
        if (dbFields.includes(dbField)) {
          const found = synonyms.some(
            (syn) =>
              header === syn ||
              header.includes(syn) ||
              syn.includes(header.split('_')[0])
          );

          if (found) {
            matchedField = dbField;
            break;
          }
        }
      }
    }

    mapping[header] = matchedField;
  }

  return mapping;
}

/**
 * 📌 헬퍼 함수: getDefaultFields
 * 📋 목적: 테이블별 기본 필드 목록 반환
 * 🔧 매개변수: tableName - 테이블명
 * 📤 반환값: string[] - 필드명 배열
 */
function getDefaultFields(tableName: ImportTableName): string[] {
  const defaultFields: Record<ImportTableName, string[]> = {
    therapists: ['name', 'specialty', 'license', 'phone', 'email', 'hire_date'],
    employees: ['name', 'position', 'department', 'salary', 'hire_date', 'phone'],
    customers: ['name', 'phone', 'email', 'address'],
    beds: ['room_number', 'status', 'therapist_id'],
    expense_categories: ['category', 'cost'],
  };

  return defaultFields[tableName] || [];
}

/**
 * 📌 함수: autoDetectAndMap
 * 📋 목적: Excel 헤더 분석 및 자동 매핑 (통합)
 * 🔧 매개변수:
 *    - headers: Excel 헤더 배열
 *    - fields: 테이블 필드 정의 배열 (선택)
 * 📤 반환값: {table: ImportTableName, mapping: Record<string, string>, confidence: number}
 * 📅 작성일: 2026-06-03
 */
export function autoDetectAndMap(
  headers: string[],
  fields?: FieldDefinition[]
): {
  table: ImportTableName;
  mapping: Record<string, string>;
  confidence: number;
} {
  const { table, confidence } = detectTableFromHeaders(headers);
  const mapping = generateAutoMapping(headers, table, fields);

  return {
    table,
    mapping,
    confidence,
  };
}
