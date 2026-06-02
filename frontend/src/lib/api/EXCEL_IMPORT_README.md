# Excel Import API 클라이언트

> TypeScript 유틸리티 함수 및 React 훅을 제공하여 Excel 파일 임포트를 간편하게 처리합니다.
> 재시도 로직, 실시간 진행률, 상세한 에러 처리를 포함합니다.

## 📋 목차

1. [설치 및 임포트](#설치-및-임포트)
2. [주요 함수](#주요-함수)
3. [React 훅](#react-훅)
4. [타입 정의](#타입-정의)
5. [예제](#예제)
6. [에러 처리](#에러-처리)
7. [재시도 로직](#재시도-로직)
8. [진행률 스트리밍](#진행률-스트리밍)

---

## 설치 및 임포트

### 유틸리티 함수 임포트

```typescript
import {
  fetchSupportedTablesUtil,
  parseExcelFileUtil,
  validateMappingUtil,
  executeImportUtil,
  bulkExecuteImportUtil,
  ExcelImportError,
} from '@/lib/api/excel-import-client';
```

### React 훅 임포트

```typescript
import {
  useExcelImport,
  useExcelValidation,
  useExcelImportProgress,
  useExcelImportBatch,
} from '@/lib/hooks/useExcelImport';
```

---

## 주요 함수

### 📌 fetchSupportedTablesUtil()

지원되는 모든 테이블과 컬럼 정보를 조회합니다.

```typescript
// 기본 사용
const tables = await fetchSupportedTablesUtil();

// 재시도 옵션 지정
const tables = await fetchSupportedTablesUtil({
  maxAttempts: 5,
  delayMs: 2000,
  backoffMultiplier: 2,
});

// 반환값
interface GetTablesResponse {
  tables: TableDefinition[];
  total_count: number;
}

interface TableDefinition {
  name: ImportTableName; // 'employees' | 'therapists' | 'customers' ...
  display_name: string;
  description: string;
  fields: FieldDefinition[];
}
```

### 📌 parseExcelFileUtil()

Excel 파일을 파싱하고 컬럼 정보, 샘플 데이터, 추천 매핑을 제공합니다.

```typescript
// 기본 사용
const parseResult = await parseExcelFileUtil(file, 'employees');

// 반환값
interface ParseExcelResponse {
  headers: string[];
  sample_data: Record<string, any>[];
  total_rows: number;
  suggested_mapping: Record<string, string>; // Excel 컬럼 → DB 컬럼 자동 매핑
}

// 사용 예제
const { headers, sample_data, suggested_mapping, total_rows } = parseResult;
console.log(`파싱 완료: ${headers.length}개 컬럼, ${total_rows}개 행`);
console.log('추천 매핑:', suggested_mapping);
```

### 📌 validateMappingUtil()

컬럼 매핑의 유효성을 검증하고 샘플 데이터로 미리 확인합니다.

```typescript
// 기본 사용
const validationResult = await validateMappingUtil(
  file,
  'employees',
  {
    '이름': 'name',
    '이메일': 'email',
    '직급': 'position',
  }
);

// 반환값
interface ValidateMappingResponse {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  preview_data: Record<string, any>[];
  total_rows: number;
}

// 에러 체크
if (!validationResult.is_valid) {
  validationResult.errors.forEach((err) => {
    console.warn(`행 ${err.row_number}: ${err.column} - ${err.error_message}`);
  });
}
```

### 📌 executeImportUtil()

실제 임포트를 실행하고 실시간 진행률을 추적합니다.

```typescript
// 기본 사용 (진행률 콜백 없음)
const statistics = await executeImportUtil(file, 'employees', mapping);

// 진행률 콜백 포함
const statistics = await executeImportUtil(
  file,
  'employees',
  mapping,
  (event) => {
    console.log(`행 ${event.row_number}: ${event.status}`);
    if (event.errors) {
      console.warn('에러:', event.errors);
    }
  },
  {
    skipErrors: false,
    retryOptions: {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    },
  }
);

// 반환값
interface ImportStatistics {
  total_rows: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  execution_time_seconds: number;
  errors: Record<string, any>[];
}

// 결과 확인
console.log(`성공: ${statistics.success_count}/${statistics.total_rows}`);
```

### 📌 bulkExecuteImportUtil()

여러 파일을 순차적으로 임포트합니다.

```typescript
// 기본 사용
const results = await bulkExecuteImportUtil([
  {
    file: employeesFile,
    tableName: 'employees',
    mapping: employeeMapping,
  },
  {
    file: therapistsFile,
    tableName: 'therapists',
    mapping: therapistMapping,
  },
]);

// 진행률 콜백 포함
const results = await bulkExecuteImportUtil(
  files,
  (event) => {
    console.log(`[파일 ${event.fileIndex}] 행 ${event.row_number}`);
  },
  { skipErrors: true }
);

// 결과 분석
results.forEach((stats, idx) => {
  console.log(`파일 ${idx}: ${stats.success_count}/${stats.total_rows} 성공`);
});
```

---

## React 훅

### 📌 useExcelValidation()

Excel 파일 및 매핑 검증 상태를 관리합니다.

```typescript
const validation = useExcelValidation();

// 상태
validation.isValidating; // 검증 중
validation.validationResult; // 검증 결과
validation.validationError; // 검증 에러

// 함수
await validation.validate(file, 'employees', mapping);
validation.reset();
```

### 📌 useExcelImportProgress()

실시간 임포트 진행률을 추적합니다.

```typescript
const progress = useExcelImportProgress();

// 상태
progress.isImporting; // 임포트 중
progress.progress; // 진행률 (0-100)
progress.currentRow; // 현재 행 번호
progress.totalRows; // 총 행 수
progress.status; // 'idle' | 'processing' | 'importing' | 'completed' | 'error'
progress.message; // 상태 메시지
progress.statistics; // 최종 통계
progress.importError; // 에러 정보

// 함수
progress.updateProgress(event);
progress.setStatistics(stats);
progress.setError(error);
progress.start(totalRows);
progress.reset();
```

### 📌 useExcelImport()

전체 임포트 워크플로우를 관리하는 메인 훅입니다.

```typescript
const {
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
} = useExcelImport({
  skipErrors: true,
  retryOptions: { maxAttempts: 3 },
  onSuccess: (stats) => console.log('성공:', stats),
  onError: (error) => console.error('에러:', error),
});

// 사용 예제
const handleUpload = async (file: File) => {
  // 1. 테이블 목록 조회
  const tables = await fetchTables();

  // 2. 파일 파싱
  const parseResult = await parseFile(file, 'employees');

  // 3. 매핑 검증
  await validation.validate(file, 'employees', parseResult.suggested_mapping);

  // 4. 임포트 실행
  const stats = await executeImport(
    file,
    'employees',
    parseResult.suggested_mapping
  );
};
```

### 📌 useExcelImportBatch()

여러 파일 일괄 임포트를 관리합니다.

```typescript
const { batchProgress, batchResults, isBatchImporting, executeBatch, reset } =
  useExcelImportBatch({
    skipErrors: true,
    onSuccess: (stats) => console.log('파일 임포트 성공:', stats),
  });

// 일괄 임포트 실행
const results = await executeBatch([
  {
    file: file1,
    tableName: 'employees',
    mapping: mapping1,
  },
  {
    file: file2,
    tableName: 'therapists',
    mapping: mapping2,
  },
]);

// 진행률 추적
batchProgress[0]; // {progress: 50, status: 'importing'}
batchProgress[1]; // {progress: 100, status: 'completed'}
```

---

## 타입 정의

### ImportTableName

```typescript
type ImportTableName =
  | 'employees'
  | 'therapists'
  | 'customers'
  | 'expense_categories'
  | 'beds';
```

### FieldType

```typescript
type FieldType =
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'enum'
  | 'date'
  | 'datetime';
```

### ImportProgressEvent

```typescript
interface ImportProgressEvent {
  row_number: number;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  errors?: Record<string, string>;
}
```

### RetryOptions

```typescript
interface RetryOptions {
  maxAttempts?: number; // 기본값: 3
  delayMs?: number; // 기본값: 1000
  backoffMultiplier?: number; // 기본값: 2 (지수 백오프)
}
```

---

## 예제

### 예제 1: 기본 임포트 워크플로우 (React 컴포넌트)

```typescript
import { useExcelImport } from '@/lib/hooks/useExcelImport';

export function ExcelImportForm() {
  const {
    parseResult,
    validation,
    progress,
    parseFile,
    executeImport,
  } = useExcelImport({
    skipErrors: false,
    onSuccess: (stats) => {
      alert(`완료! ${stats.success_count}/${stats.total_rows} 임포트됨`);
    },
    onError: (error) => {
      alert(`에러: ${error.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1단계: 파일 파싱
    const parse = await parseFile(file, 'employees');
    if (!parse) return;

    // 2단계: 매핑 검증
    const isValid = await validation.validate(
      file,
      'employees',
      parse.suggested_mapping
    );
    if (!isValid) return;

    // 3단계: 임포트 실행
    await executeImport(file, 'employees', parse.suggested_mapping);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />

      {/* 진행률 표시 */}
      {progress.isImporting && (
        <div>
          <progress value={progress.progress} max="100" />
          <p>
            {progress.currentRow}/{progress.totalRows} (
            {progress.progress.toFixed(1)}%)
          </p>
        </div>
      )}

      {/* 결과 표시 */}
      {progress.statistics && (
        <div>
          <h3>임포트 완료</h3>
          <p>성공: {progress.statistics.success_count}</p>
          <p>실패: {progress.statistics.failed_count}</p>
        </div>
      )}

      {/* 에러 표시 */}
      {progress.importError && (
        <div className="error">
          <p>{progress.importError.message}</p>
        </div>
      )}
    </div>
  );
}
```

### 예제 2: 일괄 임포트 (React 컴포넌트)

```typescript
import { useExcelImportBatch } from '@/lib/hooks/useExcelImport';

export function BatchImportForm() {
  const { batchProgress, batchResults, executeBatch } = useExcelImportBatch();

  const handleBatchImport = async () => {
    const files = [
      { file: file1, tableName: 'employees' as const, mapping: {...} },
      { file: file2, tableName: 'therapists' as const, mapping: {...} },
    ];

    const results = await executeBatch(files);

    // 결과 처리
    results.forEach((stats, idx) => {
      console.log(`파일 ${idx}: ${stats.success_count}/${stats.total_rows}`);
    });
  };

  return (
    <div>
      <button onClick={handleBatchImport}>일괄 임포트</button>

      {/* 각 파일별 진행률 */}
      {Object.entries(batchProgress).map(([idx, prog]) => (
        <div key={idx}>
          <p>파일 {idx}</p>
          <progress value={prog.progress} max="100" />
        </div>
      ))}

      {/* 최종 결과 */}
      {batchResults.length > 0 && (
        <div>
          <h3>일괄 임포트 완료</h3>
          <table>
            <thead>
              <tr>
                <th>파일</th>
                <th>성공</th>
                <th>실패</th>
              </tr>
            </thead>
            <tbody>
              {batchResults.map((stats, idx) => (
                <tr key={idx}>
                  <td>파일 {idx}</td>
                  <td>{stats.success_count}</td>
                  <td>{stats.failed_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### 예제 3: 유틸리티 함수 직접 사용

```typescript
import {
  parseExcelFileUtil,
  validateMappingUtil,
  executeImportUtil,
} from '@/lib/api/excel-import-client';

async function importEmployees(file: File) {
  try {
    // 1. 파일 파싱
    const { headers, suggested_mapping, total_rows } = await parseExcelFileUtil(
      file,
      'employees'
    );

    console.log(`파일: ${headers.length}개 컬럼, ${total_rows}개 행`);

    // 2. 매핑 검증
    const { is_valid, errors } = await validateMappingUtil(
      file,
      'employees',
      suggested_mapping
    );

    if (!is_valid) {
      errors.forEach((err) => {
        console.error(`행 ${err.row_number}: ${err.error_message}`);
      });
      return;
    }

    // 3. 임포트 실행
    const statistics = await executeImportUtil(
      file,
      'employees',
      suggested_mapping,
      (event) => {
        console.log(`진행: ${event.row_number}`);
      },
      {
        retryOptions: {
          maxAttempts: 5,
          delayMs: 2000,
        },
      }
    );

    console.log(
      `완료: ${statistics.success_count}/${statistics.total_rows} 임포트`
    );
  } catch (error) {
    console.error('임포트 실패:', error);
  }
}
```

---

## 에러 처리

### ExcelImportError 클래스

```typescript
class ExcelImportError extends Error {
  code: string; // 에러 코드
  message: string; // 에러 메시지
  details?: any; // 상세 정보
}
```

### 에러 코드

| 코드 | 의미 | 해결책 |
|------|------|--------|
| `PARSE_ERROR` | 파일 파싱 실패 | Excel 파일 형식 확인 |
| `VALIDATION_ERROR` | 매핑 검증 실패 | 컬럼 매핑 재확인 |
| `IMPORT_ERROR` | 임포트 실행 실패 | 데이터 형식 및 필수값 확인 |
| `HTTP_401` | 인증 실패 | 로그인 필요 |
| `HTTP_403` | 권한 부족 | 관리자 권한 확인 |
| `HTTP_413` | 파일 크기 초과 | 파일 크기 감소 (최대 10MB) |
| `HTTP_500` | 서버 에러 | 서버 상태 확인 |
| `STREAM_ERROR` | 스트리밍 에러 | 연결 상태 확인, 재시도 |

### 에러 처리 패턴

```typescript
try {
  await executeImportUtil(file, tableName, mapping);
} catch (error) {
  if (error instanceof ExcelImportError) {
    switch (error.code) {
      case 'PARSE_ERROR':
        // 파일 형식 오류 처리
        break;

      case 'HTTP_401':
        // 인증 오류 처리 (로그인 페이지로 이동)
        break;

      case 'HTTP_413':
        // 파일 크기 오류 처리 (사용자에게 알림)
        break;

      default:
        // 기타 오류 처리
    }

    console.error(`[${error.code}] ${error.message}`);
    console.error('상세:', error.details);
  } else {
    // 예상치 못한 오류
    console.error('오류:', error);
  }
}
```

---

## 재시도 로직

### 자동 재시도

모든 유틸리티 함수는 자동 재시도 로직을 지원합니다.

```typescript
// 기본값: 3회 재시도, 1초 대기, 지수 백오프
const result = await parseExcelFileUtil(file, 'employees');

// 커스텀 재시도 옵션
const result = await parseExcelFileUtil(
  file,
  'employees',
  {
    maxAttempts: 5, // 5회 재시도
    delayMs: 2000, // 초기 2초 대기
    backoffMultiplier: 2, // 2배씩 증가 (2s, 4s, 8s, 16s)
  }
);

// 재시도 안 함
const result = await parseExcelFileUtil(
  file,
  'employees',
  { maxAttempts: 1 }
);
```

### 재시도 시간 계산

```
시도 1: 즉시
시도 2: 2초 후 (2 * 2^0 = 2s)
시도 3: 4초 후 (2 * 2^1 = 4s)
시도 4: 8초 후 (2 * 2^2 = 8s)
시도 5: 16초 후 (2 * 2^3 = 16s)
```

---

## 진행률 스트리밍

### Server-Sent Events (SSE) 또는 NDJSON

임포트 실행 시 진행률은 실시간으로 스트리밍됩니다.

```typescript
const statistics = await executeImportUtil(
  file,
  'employees',
  mapping,
  (event) => {
    // 매 행마다 또는 배치마다 호출
    console.log(`행 ${event.row_number}: ${event.status}`);

    if (event.errors) {
      Object.entries(event.errors).forEach(([column, error]) => {
        console.warn(`  ${column}: ${error}`);
      });
    }
  }
);
```

### ImportProgressEvent 형식

```typescript
interface ImportProgressEvent {
  row_number: number; // 처리된 행 번호
  status: 'success' | 'failed' | 'skipped'; // 상태
  message?: string; // 상태 메시지
  errors?: Record<string, string>; // 컬럼별 에러
}
```

### 진행률 계산

```typescript
const progress = await executeImportUtil(
  file,
  'employees',
  mapping,
  (event) => {
    // 수동으로 진행률 계산
    const percent = (event.row_number / totalRows) * 100;
    updateProgressBar(percent);
  }
);
```

---

## 파일 크기 제한

- **최대 파일 크기**: 10MB
- **최대 행 수**: 100,000행 (성능에 따라 달라질 수 있음)

---

## 자주 묻는 질문

### Q: 대용량 파일 임포트는 어떻게 하나요?

A: 파일을 여러 개로 분할하여 `bulkExecuteImportUtil()`을 사용하세요.

```typescript
const results = await bulkExecuteImportUtil([
  { file: part1, tableName: 'employees', mapping },
  { file: part2, tableName: 'employees', mapping },
  { file: part3, tableName: 'employees', mapping },
]);
```

### Q: 임포트 중에 취소할 수 있나요?

A: React 훅 사용 시 `cancel()` 함수를 호출하세요.

```typescript
const { executeImport, cancel } = useExcelImport();

const handleCancel = () => {
  cancel(); // 임포트 취소
};
```

### Q: 매핑을 수동으로 지정해야 하나요?

A: 아니오, `parseExcelFileUtil()`이 추천 매핑을 자동으로 제공합니다.
필요시 수동으로 수정할 수 있습니다.

### Q: 에러가 발생하면 계속 진행할 수 있나요?

A: 예, `skipErrors: true` 옵션을 사용하세요.

```typescript
await executeImportUtil(file, tableName, mapping, undefined, {
  skipErrors: true,
});
```

---

## 성능 최적화

### 1. 캐시 활용

```typescript
// 테이블 정보는 자주 조회되므로 캐시
const [cachedTables, setCachedTables] = useState(null);

if (!cachedTables) {
  const tables = await fetchSupportedTablesUtil();
  setCachedTables(tables);
}
```

### 2. 배치 처리

```typescript
// 여러 파일을 동시에 아닌 순차적으로 처리
for (const file of files) {
  await executeImportUtil(file, tableName, mapping);
}
```

### 3. 메모리 관리

```typescript
// 대용량 진행률 이벤트를 버퍼링
const eventBuffer: ImportProgressEvent[] = [];

const stats = await executeImportUtil(
  file,
  tableName,
  mapping,
  (event) => {
    eventBuffer.push(event);

    // 100개마다 처리
    if (eventBuffer.length >= 100) {
      processEvents(eventBuffer);
      eventBuffer.length = 0;
    }
  }
);
```

---

## 라이선스

MIT

---

**마지막 업데이트**: 2026-06-02  
**작성자**: jitnet57 (ElSpa 프로젝트)
