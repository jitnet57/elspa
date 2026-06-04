# ImportProgressBar 빠른 시작 가이드

> 5분 만에 프로젝트에 추가하기

---

## 🚀 3단계 통합

### Step 1: 컴포넌트 임포트
```tsx
import ImportProgressBar from '@/components/ImportProgressBar';
import { useImportProgress } from '@/hooks/useImportProgress';
```

### Step 2: 훅 초기화
```tsx
export function MyImportPage() {
  const progress = useImportProgress(100); // 100개 행 처리 예정
  
  return <>...코드...</>;
}
```

### Step 3: UI에 추가
```tsx
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
  title="직원 정보 가져오기"
/>
```

---

## 💻 완전한 예제 (복사/붙여넣기 가능)

```tsx
'use client';

import React, { useCallback } from 'react';
import ImportProgressBar from '@/components/ImportProgressBar';
import { useImportProgress } from '@/hooks/useImportProgress';

export default function ImportTherapistsPage() {
  const TOTAL_ROWS = 200;
  const progress = useImportProgress(TOTAL_ROWS);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    progress.start();

    try {
      // CSV 파일 읽기
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const dataLines = lines.slice(1); // 헤더 스킵

      // 각 행 처리
      for (let i = 0; i < dataLines.length; i++) {
        // API 호출 시뮬레이션 (실제로는 fetch 사용)
        await new Promise(resolve => setTimeout(resolve, 200));

        const rowNumber = i + 2; // 헤더를 1이라 가정
        const rowData = { raw: dataLines[i] };

        // 검증 & 저장 (시뮬레이션)
        try {
          // 실제: await api.therapists.create(rowData);
          if (Math.random() > 0.95) {
            throw new Error('유효하지 않은 이메일 형식');
          }
          progress.addSuccess();
        } catch (error) {
          progress.addFailed(
            rowNumber,
            rowData,
            error instanceof Error ? error.message : '알 수 없는 오류'
          );
        }
      }

      progress.complete();
    } catch (error) {
      console.error('Import failed:', error);
      progress.complete();
    }
  }, [progress]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">테라피스트 정보 가져오기</h1>

      {/* 파일 선택 (진행 전에만) */}
      {!progress.isImporting && progress.progress === 0 && (
        <label className="block p-8 mb-8 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <p className="font-semibold text-gray-800">CSV 파일을 선택하세요</p>
            <p className="text-sm text-gray-600">또는 여기에 드래그</p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}

      {/* 진행 상황 표시 */}
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
        title="테라피스트 정보 가져오기"
        onDownloadLog={(csv) => {
          // CSV 로그 다운로드 처리
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
      />

      {/* 재설정 버튼 */}
      {!progress.isImporting && progress.progress > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => progress.reset()}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
          >
            새로운 파일 가져오기
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 단계별 추가 (기존 페이지에)

### 1️⃣ 임포트 추가
```tsx
// 기존 코드에 추가
import ImportProgressBar from '@/components/ImportProgressBar';
import { useImportProgress } from '@/hooks/useImportProgress';
```

### 2️⃣ 상태 추가
```tsx
export default function AdminManagementPage() {
  // 기존 상태들...
  
  // 추가
  const progress = useImportProgress(500);
  
  return <>...</>;
}
```

### 3️⃣ 핸들러 추가
```tsx
const handleImport = async (file: File) => {
  progress.start();
  
  for (let row of rows) {
    try {
      // 처리 로직
      progress.addSuccess();
    } catch (error) {
      progress.addFailed(rowNum, row, error.message);
    }
  }
  
  progress.complete();
};
```

### 4️⃣ UI 추가
```tsx
<div>
  <input type="file" accept=".csv" onChange={...} />
  
  {/* ImportProgressBar 추가 */}
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
</div>
```

---

## 📊 핵심 API 요약

### 훅 메서드

| 메서드 | 설명 | 예시 |
|--------|------|------|
| `start()` | 진행 시작 | `progress.start()` |
| `addSuccess()` | 성공 카운트 +1 | `progress.addSuccess()` |
| `addFailed(row, data, error)` | 실패 기록 | `progress.addFailed(5, {}, 'error msg')` |
| `addWarning()` | 경고 카운트 +1 | `progress.addWarning()` |
| `complete()` | 진행 완료 | `progress.complete()` |
| `reset()` | 초기화 | `progress.reset()` |
| `setProgress(n)` | 진행률 수동 설정 | `progress.setProgress(50)` |

### 상태 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `isImporting` | boolean | 진행 중 여부 |
| `progress` | number | 진행률 (0-100) |
| `successCount` | number | 성공 수 |
| `failedCount` | number | 실패 수 |
| `warningCount` | number | 경고 수 |
| `elapsedSeconds` | number | 경과 시간 |
| `estimatedSecondsRemaining` | number | 예상 남은 시간 |
| `failedRows` | array | 실패 상세 정보 |

---

## ⚠️ 주의사항

### ✅ 올바른 사용
```tsx
// O: 진행 시작
progress.start();

for (let i = 0; i < 100; i++) {
  // ... 처리
  progress.addSuccess(); // 또는 addFailed()
}

progress.complete(); // 진행 완료
```

### ❌ 잘못된 사용
```tsx
// X: start() 없이 addSuccess() 호출
progress.addSuccess();
progress.addSuccess();

// X: complete() 없이 상태 초기화
progress.reset();

// X: 무한 루프 (addSuccess 호출 안 함)
for (let i = 0; i < 100; i++) {
  // 아무것도 안 함
}
```

---

## 🎨 UI 커스터마이징

### 제목 변경
```tsx
<ImportProgressBar
  ...
  title="특정 기능 가져오기"
/>
```

### 색상 변경 (Tailwind CSS)
파일 수정: `ImportProgressBar.tsx` 라인 ~130

```tsx
// from-blue-500 to-indigo-600 대신
from-purple-500 to-pink-600
```

### 에러 로그 다운로드 핸들링
```tsx
<ImportProgressBar
  ...
  onDownloadLog={(csv) => {
    // CSV 내용으로 자신의 작업 수행
    console.log(csv);
  }}
/>
```

---

## 🧪 테스트 체크리스트

- [ ] 파일 선택 가능
- [ ] 진행 중 진행률 바 표시
- [ ] 행 카운터 업데이트 됨
- [ ] 경과 시간 증가
- [ ] 완료 후 최종 요약 표시
- [ ] 실패한 행 테이블 표시 (실패 있을 경우)
- [ ] 행 확장으로 상세 정보 표시
- [ ] CSV 다운로드 버튼 작동
- [ ] 모바일에서 반응형 표시
- [ ] 재설정 버튼으로 초기화 가능

---

## 📱 모바일 최적화

컴포넌트는 기본적으로 모바일 친화적입니다:
- ✅ 반응형 그리드 (`md:grid-cols-4`)
- ✅ 테이블 스크롤 가능
- ✅ 터치 친화적 버튼

모바일 테스트:
```bash
# 개발 서버에서 F12 열기
# Device Toolbar 활성화 (Ctrl+Shift+M)
# iPhone/Android 선택
```

---

## 🐛 문제 해결

### 진행률이 업데이트 안 됨
```tsx
// ❌ 잘못
progress.progress = 50; // 직접 수정 X

// ✅ 올바름
progress.addSuccess(); // 자동 계산
progress.addSuccess();
progress.addSuccess();
```

### 시간이 증가 안 함
```tsx
// ✅ start() 호출 확인
progress.start();

// ✅ 컴포넌트 props 확인
<ImportProgressBar
  elapsedSeconds={progress.elapsedSeconds}
/>
```

### 실패한 행이 보이지 않음
```tsx
// ✅ failedRows prop 전달 확인
<ImportProgressBar
  failedRows={progress.failedRows}
/>

// ✅ addFailed() 호출 확인
progress.addFailed(rowNum, data, error);
```

---

## 📚 더 알아보기

- **상세 문서:** `ImportProgressBar.README.md`
- **실제 예제:** `ImportProgressBar.example.tsx`
- **훅 코드:** `useImportProgress.ts`
- **컴포넌트:** `ImportProgressBar.tsx`

---

## 🎯 다음 단계

1. ✅ 이 가이드대로 기본 통합
2. 📝 CSV 파싱 로직 추가
3. 🔌 백엔드 API 연결
4. ✔️ 테스트 및 배포

---

**작성일:** 2026-06-02  
**버전:** 1.0  
**난이도:** 초급 ~ 중급
