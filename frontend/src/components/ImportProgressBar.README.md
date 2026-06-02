# ImportProgressBar 컴포넌트 & useImportProgress 훅

> 파일 가져오기(Import) 기능의 진행 상황을 실시간으로 추적하고, 완료 후 결과를 상세하게 표시하는 React 컴포넌트 및 훅입니다.

---

## 📋 목차

1. [개요](#개요)
2. [파일 구조](#파일-구조)
3. [ImportProgressBar 컴포넌트](#importprogressbar-컴포넌트)
4. [useImportProgress 훅](#useimportprogress-훅)
5. [사용 예제](#사용-예제)
6. [스타일링](#스타일링)
7. [API 통합](#api-통합)

---

## 개요

### 📊 주요 기능

#### 1️⃣ 진행 중 상태 (isImporting = true)
- **진행률 바** (0-100%)
- **행 카운터** (45/100, 처리된 행 수 표시)
- **상태별 카운트** (성공/실패/경고)
- **시간 정보**
  - 경과 시간 (HH:MM:SS)
  - 예상 남은 시간 (계산 기반)
- **처리 속도** (행/분)

#### 2️⃣ 완료 상태 (isImporting = false)
- **최종 요약** (성공/실패/경고 개수 및 백분율)
- **실패한 행 테이블**
  - 행 번호, 에러 메시지, 타입 표시
  - 확장 가능한 상세 정보
  - 에러 메시지 및 행 데이터 표시
- **CSV 다운로드** (에러 로그)

---

## 파일 구조

```
frontend/src/
├── components/
│   ├── ImportProgressBar.tsx          # 메인 컴포넌트
│   ├── ImportProgressBar.example.tsx  # 사용 예제
│   └── ImportProgressBar.README.md    # 이 문서
│
└── hooks/
    └── useImportProgress.ts           # 진행 상황 추적 훅
```

---

## ImportProgressBar 컴포넌트

### Props 인터페이스

```typescript
interface ImportProgressBarProps {
  // 진행 상태
  isImporting: boolean;              // 진행 중 여부
  progress: number;                  // 0-100 (%)
  totalRows: number;                 // 전체 행 수
  successCount: number;              // 성공한 행 수
  failedCount: number;               // 실패한 행 수
  warningCount: number;              // 경고 행 수
  elapsedSeconds: number;            // 경과 시간 (초)
  estimatedSecondsRemaining?: number; // 예상 남은 시간 (초)

  // 완료 후 결과
  failedRows?: ImportFailedRow[];     // 실패한 행 상세 정보
  title?: string;                    // 제목 (기본값: "파일 가져오기")
  onDownloadLog?: (csvContent: string) => void; // CSV 다운로드 콜백
}

interface ImportFailedRow {
  rowNumber: number;                 // 행 번호
  data: Record<string, unknown>;     // 행 데이터
  error: string;                     // 에러 메시지
  type?: 'error' | 'warning';        // 에러 타입
}
```

### 기본 사용

```tsx
import ImportProgressBar from '@/components/ImportProgressBar';

export function MyComponent() {
  return (
    <ImportProgressBar
      isImporting={false}
      progress={100}
      totalRows={100}
      successCount={95}
      failedCount={5}
      warningCount={0}
      elapsedSeconds={120}
      estimatedSecondsRemaining={0}
      title="직원 정보 가져오기"
    />
  );
}
```

### 시각적 특징

#### 진행 중 상태
```
┌─────────────────────────────────────┐
│ ⏳ 파일 가져오기                      │
├─────────────────────────────────────┤
│ 진행률: ████████░░░░░░░░ 45%       │
│                                     │
│ 처리된 행: 45 / 100                 │
│ ✅ 성공 40  ❌ 실패 5               │
│                                     │
│ 경과 시간: 1분 30초                 │
│ 예상 남은 시간: 1분 45초            │
└─────────────────────────────────────┘
```

#### 완료 상태 (성공)
```
┌─────────────────────────────────────┐
│ ✅ 파일 가져오기 완료                │
│ 총 소요 시간: 3분 15초               │
├─────────────────────────────────────┤
│ 총 행: 100  │ 성공: 95 (95%)       │
│            │ 실패: 5 (5%)         │
└─────────────────────────────────────┘
```

---

## useImportProgress 훅

### 상태 및 함수 인터페이스

```typescript
interface ImportProgressState {
  isImporting: boolean;
  progress: number;           // 0-100
  successCount: number;
  failedCount: number;
  warningCount: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
  failedRows: ImportFailedRow[];
}

interface UseImportProgressReturn extends ImportProgressState {
  // 제어 함수
  start: () => void;                    // 진행 시작
  complete: () => void;                 // 진행 완료
  reset: () => void;                    // 상태 초기화
  addSuccess: () => void;               // 성공 카운트 증가
  addFailed: (
    rowNumber: number,
    data: Record<string, unknown>,
    error: string,
    type?: 'error' | 'warning'
  ) => void;
  addWarning: () => void;               // 경고 카운트 증가
  setProgress: (value: number) => void; // 진행률 수동 설정
}
```

### 훅 사용법

```typescript
import { useImportProgress } from '@/hooks/useImportProgress';

export function ImportComponent() {
  const progress = useImportProgress(100); // 100개 행 처리 예정

  // 진행 시작
  const startImport = () => {
    progress.start();

    // 행 처리 루프
    for (let i = 0; i < 100; i++) {
      try {
        // 행 처리 로직
        const result = processRow(i);

        if (result.success) {
          progress.addSuccess();
        } else {
          progress.addFailed(i + 1, result.data, result.error);
        }
      } catch (error) {
        progress.addFailed(i + 1, {}, error.message, 'error');
      }
    }

    // 진행 완료
    progress.complete();
  };

  return (
    <>
      <button onClick={startImport}>가져오기 시작</button>
      <ImportProgressBar
        isImporting={progress.isImporting}
        progress={progress.progress}
        totalRows={100}
        successCount={progress.successCount}
        failedCount={progress.failedCount}
        warningCount={progress.warningCount}
        elapsedSeconds={progress.elapsedSeconds}
        estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
        failedRows={progress.failedRows}
      />
    </>
  );
}
```

### 주요 메서드 설명

#### start()
진행을 시작하고 타이머를 시작합니다.
```typescript
progress.start();
// ✅ isImporting = true
// ✅ 경과 시간 추적 시작
// ✅ 예상 시간 계산 시작
```

#### addSuccess()
성공한 행의 카운트를 증가시킵니다.
```typescript
progress.addSuccess();
// ✅ successCount +1
// ✅ progress 자동 계산
```

#### addFailed(rowNumber, data, error, type?)
실패한 행 정보를 기록합니다.
```typescript
progress.addFailed(5, { name: 'John', email: 'invalid' }, '유효하지 않은 이메일 형식');
// ✅ failedCount +1
// ✅ failedRows에 상세 정보 저장
// ✅ progress 자동 계산
```

#### complete()
진행을 완료합니다.
```typescript
progress.complete();
// ✅ isImporting = false
// ✅ progress = 100
// ✅ 타이머 중지
```

#### reset()
모든 상태를 초기화합니다.
```typescript
progress.reset();
// ✅ 모든 카운트 0으로 리셋
// ✅ failedRows 비우기
// ✅ 새로운 가져오기 준비
```

---

## 사용 예제

### 예제 1: CSV 파일 가져오기 (기본)

```tsx
import React, { useCallback } from 'react';
import ImportProgressBar from '@/components/ImportProgressBar';
import { useImportProgress } from '@/hooks/useImportProgress';

export function CSVImportComponent() {
  const TOTAL_ROWS = 100;
  const progress = useImportProgress(TOTAL_ROWS);

  const handleImport = useCallback(async (file: File) => {
    progress.start();

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const dataLines = lines.slice(1); // 헤더 스킵

      for (let i = 0; i < dataLines.length; i++) {
        // 네트워크 요청 등으로 인한 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 100));

        const rowNumber = i + 2;
        const rowData = parseCSVLine(dataLines[i]);

        // 검증
        try {
          validateRow(rowData);
          progress.addSuccess();
        } catch (error) {
          progress.addFailed(rowNumber, rowData, error.message);
        }
      }

      progress.complete();
    } catch (error) {
      console.error('Import failed:', error);
      progress.complete();
    }
  }, [progress]);

  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />

      <ImportProgressBar
        isImporting={progress.isImporting}
        progress={progress.progress}
        totalRows={TOTAL_ROWS}
        successCount={progress.successCount}
        failedCount={progress.failedCount}
        warningCount={progress.warningCount}
        elapsedSeconds={progress.elapsedSeconds}
        estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
        failedRows={progress.failedRows}
        title="직원 정보 가져오기"
      />
    </>
  );
}
```

### 예제 2: API와 SSE를 사용한 실시간 진행

```tsx
export function APIImportComponent() {
  const progress = useImportProgress(500);

  const handleImport = useCallback(async (file: File) => {
    progress.start();

    try {
      // 1단계: 파일 업로드
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/import/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadId = uploadResponse.headers.get('X-Upload-ID');

      // 2단계: Server-Sent Events로 진행 상황 수신
      const eventSource = new EventSource(`/api/import/progress?uploadId=${uploadId}`);

      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        progress.setProgress(data.progress);

        if (data.type === 'success') {
          progress.addSuccess();
        } else if (data.type === 'failed') {
          progress.addFailed(data.rowNumber, data.rowData, data.error);
        }
      });

      eventSource.addEventListener('complete', () => {
        eventSource.close();
        progress.complete();
      });

      eventSource.addEventListener('error', () => {
        eventSource.close();
        progress.complete();
      });
    } catch (error) {
      console.error('Import failed:', error);
      progress.complete();
    }
  }, [progress]);

  return (
    <ImportProgressBar
      isImporting={progress.isImporting}
      progress={progress.progress}
      totalRows={500}
      successCount={progress.successCount}
      failedCount={progress.failedCount}
      warningCount={progress.warningCount}
      elapsedSeconds={progress.elapsedSeconds}
      estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
      failedRows={progress.failedRows}
    />
  );
}
```

### 예제 3: 다중 파일 처리

```tsx
export function BatchImportComponent() {
  const [files, setFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const progress = useImportProgress(1000);

  const processBatch = useCallback(async () => {
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      await processFile(files[i]);
    }
    progress.complete();
  }, [files, progress]);

  return (
    <>
      {/* 파일 선택 UI */}
      <ImportProgressBar
        isImporting={progress.isImporting}
        progress={progress.progress}
        totalRows={files.reduce((sum, f) => sum + countRows(f), 0)}
        successCount={progress.successCount}
        failedCount={progress.failedCount}
        warningCount={progress.warningCount}
        elapsedSeconds={progress.elapsedSeconds}
        estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
        failedRows={progress.failedRows}
        title={`파일 가져오기 (${currentFileIndex + 1}/${files.length})`}
      />
    </>
  );
}
```

---

## 스타일링

### Tailwind CSS 클래스

컴포넌트는 다음 Tailwind CSS 클래스를 사용합니다:

- **색상**: `blue-500`, `green-600`, `red-600`, `yellow-600`, `gray-*`
- **그라디언트**: `gradient-to-r`, `from-blue-50`, `to-indigo-50`
- **애니메이션**: `animate-spin` (로딩 스피너)
- **상태**: `hover:*`, `disabled:*`

### 커스텀 스타일링

Tailwind CSS를 사용하므로, `globals.css`에서 다음과 같이 확장할 수 있습니다:

```css
@layer components {
  .import-progress-bar {
    @apply w-full space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200;
  }
}
```

---

## API 통합

### 백엔드 예상 엔드포인트

#### 1️⃣ 파일 업로드
```
POST /api/admin/import/therapists
Content-Type: multipart/form-data

Response Headers:
X-Upload-ID: uuid-1234-5678
```

#### 2️⃣ 진행 상황 스트리밍 (SSE)
```
GET /api/admin/import/therapists/progress?uploadId=uuid-1234-5678

Event Stream Format:
event: progress
data: {
  "progress": 45,
  "rowNumber": 45,
  "type": "success",
  "rowData": {...}
}

event: complete
data: {
  "totalSuccess": 450,
  "totalFailed": 50
}
```

#### 3️⃣ 에러 로그 (선택사항)
```
GET /api/admin/import/errors?uploadId=uuid-1234-5678

Response:
text/csv

행 번호,에러 타입,에러 메시지,행 데이터
2,error,유효하지 않은 이메일 형식,...
```

### FastAPI 백엔드 구현 예제

```python
# app/routers/import.py
from fastapi import APIRouter, File, UploadFile, BackgroundTasks
from fastapi.responses import StreamingResponse
import asyncio
import json

router = APIRouter(prefix="/api/admin/import", tags=["import"])

# 진행 상황 추적 (실제로는 Redis/DB 사용)
import_progress: dict = {}

@router.post("/therapists")
async def upload_therapists(file: UploadFile = File(...)):
    """테라피스트 파일 업로드"""
    upload_id = str(uuid.uuid4())
    
    # 백그라운드에서 파일 처리
    background_tasks.add_task(process_therapist_file, file, upload_id)
    
    return {"uploadId": upload_id}


@router.get("/therapists/progress")
async def get_progress(uploadId: str):
    """SSE로 진행 상황 스트리밍"""
    async def event_generator():
        while True:
            if uploadId in import_progress:
                data = import_progress[uploadId]
                yield f"event: progress\ndata: {json.dumps(data)}\n\n"
                
                if data.get("complete"):
                    yield f"event: complete\ndata: {json.dumps(data)}\n\n"
                    break
            
            await asyncio.sleep(0.5)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


async def process_therapist_file(file: UploadFile, upload_id: str):
    """파일 처리 (백그라운드 태스크)"""
    import_progress[upload_id] = {
        "progress": 0,
        "successCount": 0,
        "failedCount": 0,
    }
    
    # 파일 읽기 및 처리...
```

---

## 🎯 체크리스트

- [ ] ImportProgressBar 컴포넌트 임포트
- [ ] useImportProgress 훅 초기화
- [ ] start() 호출로 진행 시작
- [ ] 행 처리 시 addSuccess() 또는 addFailed() 호출
- [ ] complete() 호출로 진행 완료
- [ ] failedRows 표시 (필요시)
- [ ] CSV 다운로드 핸들러 구현 (선택)

---

## 📞 문제 해결

### Q: 예상 시간이 정확하지 않음
**A:** 초기 몇 개 행의 처리 속도로 계산되므로, 처리 시간이 일정하지 않으면 부정확할 수 있습니다. 더 정확한 계산을 위해 백엔드에서 진행 상황을 제공하는 것을 권장합니다.

### Q: 실패한 행이 너무 많음
**A:** CSV 형식 검증, 데이터 타입 확인, 필수 필드 검사 등을 강화하세요. 상세한 에러 메시지를 제공하면 사용자가 문제를 파악하기 쉽습니다.

### Q: SSE 연결이 끊김
**A:** 네트워크 상태를 확인하고, 타임아웃 설정을 조정하세요. EventSource에 오류 핸들러를 추가하는 것이 좋습니다.

---

## 📚 참고 자료

- [Tailwind CSS 문서](https://tailwindcss.com/)
- [React Hooks API](https://react.dev/reference/react)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [TypeScript 인터페이스](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

**작성일:** 2026-06-02  
**최종 업데이트:** 2026-06-02  
**담당자:** jitnet-gif
