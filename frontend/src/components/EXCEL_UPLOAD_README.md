# ExcelFileUpload 컴포넌트 - 빠른 참고

## 📦 파일 목록

| 파일 | 설명 |
|------|------|
| `ExcelFileUpload.tsx` | 메인 컴포넌트 (Drag & Drop UI) |
| `ExcelFileUpload.example.tsx` | 사용 예제 및 데모 |
| `../lib/excel-parser.ts` | Excel 파싱 유틸리티 함수 |
| `../lib/excel-index.ts` | 편리한 재내보내기 |
| `../lib/EXCEL_UPLOAD_GUIDE.md` | 상세 사용 설명서 |

---

## ⚡ 30초 빠른 시작

```typescript
'use client';

import ExcelFileUpload from '@/components/ExcelFileUpload';

export default function Page() {
  return (
    <ExcelFileUpload
      onFileUpload={(data) => {
        console.log('헤더:', data.headers);
        console.log('데이터:', data.data);
        console.log('행 수:', data.rowCount);
      }}
      onError={(error) => console.error('에러:', error)}
    />
  );
}
```

---

## 🎯 주요 기능

- ✅ Drag & Drop 지원
- ✅ 파일 타입/크기 검증
- ✅ Excel (.xlsx, .xls) + CSV 지원
- ✅ 업로드 진행률 표시
- ✅ 헤더 자동 추출
- ✅ 데이터 미리보기 (테이블)
- ✅ 여러 시트 선택 가능

---

## 📋 Props

```typescript
<ExcelFileUpload
  onFileUpload={(data) => {}}      // 필수: 파일 업로드 콜백
  onError={(error) => {}}           // 선택: 에러 콜백
  maxSizeMB={10}                   // 선택: 최대 크기 (기본값: 10)
  acceptedFormats={['xlsx']}       // 선택: 파일 형식 (기본값: xlsx, xls, csv)
  showPreview={true}               // 선택: 미리보기 표시 (기본값: true)
/>
```

---

## 📤 반환 데이터 구조

```typescript
interface ParsedExcelFile {
  headers: string[];           // ['이름', '전화번호', ...]
  data: Record<string, any>[]; // [{ 이름: '홍길동', ... }, ...]
  sheetName: string;           // 'Sheet1'
  rowCount: number;            // 100
  error?: string;              // undefined (성공 시)
}
```

---

## 🔧 유틸리티 함수

```typescript
// 1️⃣ 파일 파싱
import { parseExcelFile } from '@/lib/excel-parser';
const result = await parseExcelFile(file, 0);

// 2️⃣ 파일 검증
import { validateExcelFile } from '@/lib/excel-parser';
const { valid, error } = validateExcelFile(file, 10);

// 3️⃣ 시트명 조회
import { getExcelSheets } from '@/lib/excel-parser';
const sheets = await getExcelSheets(file);

// 4️⃣ 데이터 포맷팅
import { formatDataForDisplay } from '@/lib/excel-parser';
const preview = formatDataForDisplay(data, 10);
```

---

## 💡 실제 사용 예제

### 직원 일괄 가져오기

```typescript
const handleFileUpload = async (data: ParsedExcelFile) => {
  // 필수 컬럼 확인
  const required = ['이름', '이메일', '직급'];
  const missing = required.filter(col => !data.headers.includes(col));
  if (missing.length > 0) {
    alert(`누락된 컬럼: ${missing.join(', ')}`);
    return;
  }

  // 서버로 전송
  const response = await fetch('/api/employees/import', {
    method: 'POST',
    body: JSON.stringify(data.data),
  });

  if (response.ok) {
    alert(`${data.rowCount}명 추가 완료!`);
  }
};
```

---

## ⚠️ 중요 주의사항

1. **첫 번째 행은 헤더입니다**
   - Excel의 첫 번째 행이 자동으로 헤더로 인식됨
   - 데이터는 두 번째 행부터 시작해야 함

2. **파일 크기 제한**
   - 기본값: 10MB
   - 커스터마이징 가능: `maxSizeMB={50}`

3. **빈 셀 처리**
   ```typescript
   const value = row['컬럼명'] ?? '기본값';
   ```

4. **특수 문자 인코딩**
   - CSV는 UTF-8 사용 권장

---

## 🎨 Tailwind CSS 클래스

컴포넌트는 Tailwind CSS를 사용합니다. 커스터마이징이 필요하면:
- `.border-dashed` - Drag & Drop 존
- `.bg-green-50` - 성공 메시지
- `.bg-red-50` - 에러 메시지
- `.bg-blue-100` - 헤더 태그

---

## 📚 더 자세한 정보

전체 설명서는 `../lib/EXCEL_UPLOAD_GUIDE.md`를 참고하세요.

---

**작성**: 2025-06-02  
**버전**: 1.0
