# Excel Import API Client - 파일 인덱스

> Excel 임포트 기능의 모든 파일을 한눈에 확인하세요.

---

## 📁 파일 구조

```
frontend/src/lib/
├── api/
│   ├── excel-import-client.ts          ← 메인 유틸리티 함수 + 클래스
│   ├── excel-import-examples.ts        ← 7가지 사용 예제
│   ├── EXCEL_IMPORT_README.md          ← 상세 문서 (메인)
│   └── EXCEL_IMPORT_INDEX.md           ← 이 파일
│
└── hooks/
    └── useExcelImport.ts               ← React 커스텀 훅 (4개)
```

---

## 📄 각 파일 설명

### 1️⃣ excel-import-client.ts (19KB, 450줄)

**목적**: Excel 임포트 API의 핵심 유틸리티 함수

#### 포함된 함수

```typescript
// 메인 함수 (4개)
fetchSupportedTablesUtil()        // 지원 테이블 조회
parseExcelFileUtil()              // 파일 파싱
validateMappingUtil()             // 매핑 검증
executeImportUtil()               // 임포트 실행 (진행률 O)
bulkExecuteImportUtil()           // 일괄 임포트

// 유틸리티
withRetry()                       // 지수 백오프 재시도
streamProgressResponse()          // NDJSON/SSE 처리
parseErrorResponse()              // 에러 변환

// 클래스
ExcelImportError                  // 커스텀 에러

// 기존 (유지)
ExcelImportClient (클래스)
```

#### 사용 예제

```typescript
import { executeImportUtil, ExcelImportError } from '@/lib/api/excel-import-client';

try {
  const stats = await executeImportUtil(
    file,
    'employees',
    mapping,
    (event) => console.log(`행 ${event.row_number}`),
    { maxAttempts: 3 }
  );
} catch (error) {
  if (error instanceof ExcelImportError) {
    console.error(`[${error.code}] ${error.message}`);
  }
}
```

---

### 2️⃣ useExcelImport.ts (15KB, 600줄)

**목적**: React 컴포넌트에서 Excel 임포트를 간편하게 사용

#### 포함된 훅

```typescript
useExcelValidation()              // 검증 상태 관리
useExcelImportProgress()          // 진행률 추적
useExcelImport()                  // 메인 워크플로우
useExcelImportBatch()             // 일괄 임포트
```

#### 사용 예제

```typescript
import { useExcelImport } from '@/lib/hooks/useExcelImport';

export function ImportForm() {
  const {
    parseResult,
    parseFile,
    executeImport,
    progress,
  } = useExcelImport({
    onSuccess: (stats) => console.log('완료!'),
  });

  const handleImport = async (file: File) => {
    const result = await parseFile(file, 'employees');
    const stats = await executeImport(
      file,
      'employees',
      result.suggested_mapping
    );
  };

  return (
    <div>
      <progress value={progress.progress} max="100" />
      <p>{progress.message}</p>
    </div>
  );
}
```

---

### 3️⃣ excel-import-examples.ts (15KB, 400줄)

**목적**: 다양한 사용 시나리오의 예제 코드

#### 예제 목록

| 번호 | 예제 | 주요 기능 |
|------|------|---------|
| 1 | `basicImportFlow()` | 기본 워크플로우 |
| 2 | `importWithRetry()` | 자동 재시도 |
| 3 | `batchImportExample()` | 여러 파일 임포트 |
| 4 | `displaySupportedTables()` | 테이블 조회 |
| 5 | `advancedErrorHandling()` | 에러 처리 |
| 6 | `selectiveRetry()` | 선택적 재시도 |
| 7 | `importWithProgressBar()` | 진행률 UI |

#### 사용 예제

```typescript
import { basicImportFlow } from '@/lib/api/excel-import-examples';

await basicImportFlow(file, 'employees');
// 1️⃣ 파싱 → 2️⃣ 검증 → 3️⃣ 임포트 자동 수행
```

---

### 4️⃣ EXCEL_IMPORT_README.md (700줄)

**목적**: 전체 기능의 상세 문서

#### 섹션

- 📚 설치 및 임포트
- 📖 주요 함수 상세 설명
- 🎣 React 훅 상세 설명
- 📋 타입 정의
- 💡 2가지 React 컴포넌트 예제 + 1가지 유틸리티 예제
- ⚠️ 에러 처리 가이드
- 🔄 재시도 로직 설명
- 📊 진행률 스트리밍 설명
- ❓ FAQ (11가지)
- ⚡ 성능 최적화

---

### 5️⃣ EXCEL_IMPORT_INDEX.md (이 파일)

**목적**: 모든 파일의 빠른 네비게이션

---

## 🎯 빠른 시작

### 1단계: 유틸리티 함수만 사용

```typescript
import { parseExcelFileUtil, executeImportUtil } from '@/lib/api/excel-import-client';

const parseResult = await parseExcelFileUtil(file, 'employees');
const stats = await executeImportUtil(file, 'employees', parseResult.suggested_mapping);
```

### 2단계: React 훅 사용

```typescript
import { useExcelImport } from '@/lib/hooks/useExcelImport';

const { parseFile, executeImport, progress } = useExcelImport();
const result = await parseFile(file, 'employees');
await executeImport(file, 'employees', result.suggested_mapping);
```

### 3단계: 예제 참고

```typescript
import { basicImportFlow } from '@/lib/api/excel-import-examples';

await basicImportFlow(file, 'employees');
```

---

## 📊 기능 비교표

| 기능 | 유틸리티 함수 | React 훅 | 예제 |
|------|-------------|--------|-----|
| 테이블 조회 | ✅ | ✅ | ✅ |
| 파일 파싱 | ✅ | ✅ | ✅ |
| 매핑 검증 | ✅ | ✅ | ✅ |
| 임포트 실행 | ✅ | ✅ | ✅ |
| 진행률 추적 | ✅ | ✅ | ✅ |
| 상태 관리 | ❌ | ✅ | ❌ |
| 에러 처리 | ✅ | ✅ | ✅ |
| 재시도 로직 | ✅ | ✅ | ✅ |
| 일괄 임포트 | ✅ | ✅ | ✅ |

---

## 🔍 용도별 추천

### 상황 1: CLI 스크립트/백엔드

→ **유틸리티 함수** 사용

```typescript
import { executeImportUtil } from '@/lib/api/excel-import-client';
const stats = await executeImportUtil(file, 'employees', mapping);
```

### 상황 2: React 컴포넌트 (상태 관리 필요)

→ **React 훅** 사용

```typescript
import { useExcelImport } from '@/lib/hooks/useExcelImport';
const { parseFile, executeImport, progress } = useExcelImport();
```

### 상황 3: 학습 목적 / 빠른 프로토타이핑

→ **예제 코드** 참고

```typescript
import { basicImportFlow } from '@/lib/api/excel-import-examples';
await basicImportFlow(file, 'employees');
```

---

## 📚 타입 정의 (excel-import-client.ts)

```typescript
// 테이블명
type ImportTableName = 'employees' | 'therapists' | 'customers' | 'expense_categories' | 'beds';

// 필드 타입
type FieldType = 'string' | 'integer' | 'decimal' | 'boolean' | 'enum' | 'date' | 'datetime';

// 진행률 이벤트
interface ImportProgressEvent {
  row_number: number;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  errors?: Record<string, string>;
}

// 최종 결과
interface ImportStatistics {
  total_rows: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  execution_time_seconds: number;
  errors: Record<string, any>[];
}

// 재시도 옵션
interface RetryOptions {
  maxAttempts?: number;     // 기본값: 3
  delayMs?: number;         // 기본값: 1000
  backoffMultiplier?: number; // 기본값: 2
}
```

---

## 🚀 배포 체크리스트

```
✅ 파일 생성 완료
✅ TypeScript 타입 정의
✅ 에러 처리 구현
✅ 재시도 로직 구현
✅ 스트리밍 처리 구현
✅ React 훅 구현
✅ 예제 코드 작성
✅ 문서 작성

⬜ npm run build 테스트
⬜ 통합 테스트 실행
⬜ 배포
```

---

## 🎓 학습 자료

### TypeScript
- 제네릭 타입 (`<T>`)
- 유니온 타입 (`type | type`)
- 인터페이스 정의

### React
- 커스텀 훅 설계
- useState / useCallback
- useRef로 AbortController 관리

### 비동기 프로그래밍
- Fetch API
- ReadableStream 처리
- 지수 백오프 재시도

### 에러 처리
- 커스텀 Error 클래스
- 에러 코드별 처리
- 사용자 친화적 메시지

---

## 🔗 링크

| 문서 | 경로 |
|------|------|
| 메인 README | `/frontend/src/lib/api/EXCEL_IMPORT_README.md` |
| 파일 인덱스 (이 문서) | `/frontend/src/lib/api/EXCEL_IMPORT_INDEX.md` |
| 유틸리티 함수 | `/frontend/src/lib/api/excel-import-client.ts` |
| React 훅 | `/frontend/src/lib/hooks/useExcelImport.ts` |
| 예제 코드 | `/frontend/src/lib/api/excel-import-examples.ts` |

---

## 💬 Q&A

### Q: 어떤 파일부터 시작해야 하나요?

**A**: 목적에 따라 다릅니다.
- **처음 배우는 경우**: `EXCEL_IMPORT_README.md` → `excel-import-examples.ts`
- **즉시 사용**: `useExcelImport()` 훅
- **상세 구현**: `excel-import-client.ts` 유틸리티 함수

### Q: 어떤 함수/훅을 사용해야 하나요?

**A**: 
- **상태 관리 필요 없음**: `excel-import-client.ts`의 유틸리티 함수
- **React 컴포넌트**: `useExcelImport.ts`의 훅
- **학습 목표**: `excel-import-examples.ts`의 예제

### Q: 파일 크기 제한은?

**A**: 최대 10MB (API 설정에 따라 다를 수 있음)

### Q: 재시도는 어떻게 작동하나요?

**A**: 
```
시도 1: 즉시
시도 2: 1초 후
시도 3: 2초 후
시도 4: 4초 후 (지수 백오프)
```

---

## 📞 문의

- 파일 위치: `/frontend/src/lib/api/`, `/frontend/src/lib/hooks/`
- 문서: `EXCEL_IMPORT_README.md`
- 예제: `excel-import-examples.ts`

---

**작성일**: 2026-06-02  
**담당자**: Claude Code  
**상태**: ✅ 완료
