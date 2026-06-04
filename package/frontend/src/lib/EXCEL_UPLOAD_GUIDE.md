# Excel 파일 업로드 컴포넌트 가이드

## 📋 개요

**ExcelFileUpload** 컴포넌트는 사용자가 Excel/CSV 파일을 쉽게 업로드하고, 파일의 헤더와 데이터를 파싱할 수 있도록 해주는 React 컴포넌트입니다.

### 주요 기능
- ✅ Drag & Drop 업로드 존
- ✅ 파일 타입 검증 (xlsx, xls, csv)
- ✅ 파일 크기 검증 (최대 10MB, 커스터마이징 가능)
- ✅ 업로드 진행률 표시
- ✅ Excel 헤더 자동 추출
- ✅ 데이터 미리보기 (테이블)
- ✅ 여러 시트 지원

---

## 🚀 빠른 시작

### 1️⃣ 설치 (필요시)

**react-dropzone**이 아직 설치되지 않았다면:

```bash
npm install react-dropzone
```

> 💡 **주의**: xlsx 라이브러리는 이미 package.json에 포함되어 있습니다.

### 2️⃣ 기본 사용법

```typescript
'use client';

import React, { useState } from 'react';
import ExcelFileUpload from '@/components/ExcelFileUpload';
import { ParsedExcelFile } from '@/lib/excel-parser';

export default function MyPage() {
  const [data, setData] = useState<ParsedExcelFile | null>(null);

  const handleFileUpload = (parsedData: ParsedExcelFile) => {
    console.log('업로드된 데이터:', parsedData);
    setData(parsedData);
    // 여기서 API 호출이나 데이터 저장 가능
  };

  return (
    <div>
      <ExcelFileUpload onFileUpload={handleFileUpload} />
      {data && <div>총 {data.rowCount}개 행이 업로드되었습니다.</div>}
    </div>
  );
}
```

---

## 📖 API 문서

### ExcelFileUpload Props

| Props | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `onFileUpload` | `(data: ParsedExcelFile) => void` | - | 파일 업로드 성공 시 호출 |
| `onError` | `(error: string) => void` | - | 에러 발생 시 호출 |
| `maxSizeMB` | `number` | `10` | 최대 파일 크기 (MB) |
| `acceptedFormats` | `string[]` | `['xlsx', 'xls', 'csv']` | 허용된 파일 형식 |
| `showPreview` | `boolean` | `true` | 데이터 미리보기 표시 여부 |

### ParsedExcelFile 인터페이스

```typescript
interface ParsedExcelFile {
  headers: string[];           // 열 헤더 배열
  data: Record<string, any>[]; // 파싱된 데이터
  sheetName: string;           // 시트 이름
  rowCount: number;            // 행 개수
  error?: string;              // 에러 메시지 (선택사항)
}
```

### 각 속성 설명

- **headers**: 첫 번째 행의 값들을 문자열 배열로 변환
  ```
  예: ['이름', '전화번호', '이메일']
  ```

- **data**: 파싱된 모든 행을 객체 배열로 변환
  ```typescript
  예: [
    { '이름': '홍길동', '전화번호': '010-1234-5678', '이메일': 'hong@email.com' },
    { '이름': '김철수', '전화번호': '010-9876-5432', '이메일': 'kim@email.com' },
  ]
  ```

- **sheetName**: 읽은 시트의 이름 (기본값: 첫 번째 시트)
  ```
  예: 'Sheet1', 'Data', 'Report'
  ```

- **rowCount**: 파싱된 데이터 행의 개수 (헤더 제외)
  ```
  예: 100 (100개 행)
  ```

- **error**: 파싱 중 발생한 에러 메시지
  ```
  예: '지원하지 않는 파일 형식입니다.'
  ```

---

## 🛠️ 유틸리티 함수

### excel-parser.ts의 공개 함수들

#### 1️⃣ parseExcelFile

Excel/CSV 파일을 읽고 헤더와 데이터를 추출합니다.

```typescript
import { parseExcelFile } from '@/lib/excel-parser';

const result = await parseExcelFile(file, 0); // 첫 번째 시트
console.log(result.headers); // ['헤더1', '헤더2', ...]
console.log(result.data);    // [{ ... }, { ... }, ...]
console.log(result.rowCount); // 100
```

#### 2️⃣ validateExcelFile

파일 타입과 크기를 검증합니다.

```typescript
import { validateExcelFile } from '@/lib/excel-parser';

const validation = validateExcelFile(file, 10); // 10MB 제한
if (!validation.valid) {
  console.error(validation.error);
}
```

#### 3️⃣ getExcelSheets

Excel 파일의 모든 시트명을 조회합니다.

```typescript
import { getExcelSheets } from '@/lib/excel-parser';

const sheets = await getExcelSheets(file);
console.log(sheets); // ['Sheet1', 'Sheet2', 'Summary']
```

#### 4️⃣ formatDataForDisplay

데이터를 테이블 표시용으로 포맷팅합니다 (행 제한).

```typescript
import { formatDataForDisplay } from '@/lib/excel-parser';

const preview = formatDataForDisplay(data, 10); // 처음 10개 행만
```

---

## 📝 사용 사례

### 1️⃣ 직원 일괄 가져오기

```typescript
'use client';

import ExcelFileUpload from '@/components/ExcelFileUpload';
import { ParsedExcelFile } from '@/lib/excel-parser';

export default function EmployeeImport() {
  const handleFileUpload = async (data: ParsedExcelFile) => {
    // 엑셀 데이터를 서버로 전송
    const response = await fetch('/api/employees/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headers: data.headers,
        rows: data.data,
      }),
    });

    if (response.ok) {
      alert(`${data.rowCount}명의 직원이 등록되었습니다.`);
    }
  };

  return (
    <div>
      <h1>직원 일괄 가져오기</h1>
      <ExcelFileUpload
        onFileUpload={handleFileUpload}
        maxSizeMB={50}
        showPreview={true}
      />
    </div>
  );
}
```

### 2️⃣ 예약 데이터 검증 및 가져오기

```typescript
'use client';

import ExcelFileUpload from '@/components/ExcelFileUpload';
import { ParsedExcelFile } from '@/lib/excel-parser';

export default function BookingImport() {
  const handleFileUpload = async (data: ParsedExcelFile) => {
    // 필수 컬럼 검증
    const requiredColumns = ['예약날짜', '고객명', '서비스'];
    const hasMissingColumns = requiredColumns.some(col => !data.headers.includes(col));

    if (hasMissingColumns) {
      alert(`필수 컬럼이 누락되었습니다: ${requiredColumns.join(', ')}`);
      return;
    }

    // 데이터 검증
    const validRows = data.data.filter(row => row['예약날짜'] && row['고객명']);
    console.log(`유효한 행: ${validRows.length}/${data.rowCount}`);

    // 서버로 전송
    const response = await fetch('/api/bookings/batch-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRows),
    });

    const result = await response.json();
    alert(`${result.imported}개 예약이 추가되었습니다.`);
  };

  return <ExcelFileUpload onFileUpload={handleFileUpload} />;
}
```

### 3️⃣ CSV 데이터 처리 (숙련자용)

```typescript
'use client';

import { parseExcelFile, getExcelSheets } from '@/lib/excel-parser';
import { useState } from 'react';

export default function AdvancedCSVProcessor() {
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (files.length > 0) {
      const file = files[0];
      
      // 시트 목록 조회
      const sheets = await getExcelSheets(file);
      console.log('사용 가능한 시트:', sheets);

      // 각 시트 파싱
      for (let i = 0; i < sheets.length; i++) {
        const result = await parseExcelFile(file, i);
        console.log(`${sheets[i]}: ${result.rowCount}개 행`);
      }
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed p-8"
    >
      파일을 드롭하세요
    </div>
  );
}
```

---

## ⚠️ 주의사항

### 1️⃣ 파일 크기 제한

기본 제한은 10MB입니다. 더 큰 파일을 처리해야 하는 경우:

```typescript
<ExcelFileUpload
  maxSizeMB={100}  // 100MB까지 허용
  onFileUpload={handleFileUpload}
/>
```

### 2️⃣ 첫 번째 행은 헤더로 간주

XLSX 라이브러리는 첫 번째 행을 헤더로 자동으로 간주합니다. 데이터가 두 번째 행부터 시작하는지 확인하세요.

❌ 잘못된 형식:
```
이름   전화번호   이메일
홍길동 010-1234-5678 hong@email.com
```
(이 경우 '홍길동'이 헤더로 간주됨)

✅ 올바른 형식:
```
Name   Phone         Email
홍길동 010-1234-5678 hong@email.com
```

### 3️⃣ 특수 문자 처리

Excel 파일의 특수 문자가 제대로 인코딩되어 있는지 확인하세요. CSV 파일은 UTF-8 인코딩을 권장합니다.

### 4️⃣ 빈 셀 처리

빈 셀은 `undefined` 또는 `null`로 처리되니 주의하세요:

```typescript
const value = row['컬럼명'] ?? '기본값';
```

### 5️⃣ 날짜 형식

Excel의 날짜는 숫자(serial number)로 반환될 수 있습니다. 필요시 포맷팅하세요:

```typescript
const excelDate = 45000; // Excel serial date
const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
```

---

## 🎨 스타일링 커스터마이징

컴포넌트는 Tailwind CSS를 사용합니다. 커스터마이징이 필요하면 컴포넌트를 직접 수정하세요.

주요 CSS 클래스:
- `.border-dashed` - Drag & Drop 존
- `.bg-green-50` - 성공 메시지
- `.bg-red-50` - 에러 메시지
- `.bg-blue-100` - 헤더 태그

---

## 🐛 일반적인 문제 해결

### Q: "파일 파싱 실패" 에러가 발생합니다

**A:** Excel 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다. 다음을 확인하세요:
- 파일이 정상적으로 열리는가?
- xlsx 또는 csv 형식인가?
- 파일 크기가 10MB 이하인가?

### Q: CSV 파일이 인식되지 않습니다

**A:** CSV 파일이 UTF-8 인코딩인지 확인하세요. Excel에서 "CSV UTF-8"로 저장하면 됩니다.

### Q: 데이터가 제대로 파싱되지 않습니다

**A:** 다음을 확인하세요:
- 첫 번째 행이 헤더인가?
- 모든 행의 컬럼 수가 일정한가?
- 특수 문자가 포함되어 있진 않은가?

### Q: 네트워크 요청을 보낼 수 없습니다

**A:** `onFileUpload` 콜백 내에서 비동기 작업을 수행할 때는 에러 처리를 추가하세요:

```typescript
const handleFileUpload = async (data: ParsedExcelFile) => {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('업로드 실패');
  } catch (error) {
    console.error('네트워크 에러:', error);
  }
};
```

---

## 📚 관련 파일

- **컴포넌트**: `/frontend/src/components/ExcelFileUpload.tsx`
- **파서 유틸**: `/frontend/src/lib/excel-parser.ts`
- **예제**: `/frontend/src/components/ExcelFileUpload.example.tsx`
- **가이드**: `/frontend/src/lib/EXCEL_UPLOAD_GUIDE.md` (이 파일)

---

## 🎯 다음 단계

1. 컴포넌트를 페이지에 추가합니다
2. `onFileUpload` 콜백에서 데이터를 처리합니다
3. 필요시 `onError` 콜백으로 에러를 처리합니다
4. 테스트 파일로 동작을 확인합니다

---

**작성일**: 2025-06-02  
**최종 업데이트**: 2025-06-02
