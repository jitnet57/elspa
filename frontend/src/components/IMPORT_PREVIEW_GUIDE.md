# 📊 ImportPreview.tsx — Excel 임포트 검증 & 미리보기 컴포넌트

> Excel/CSV 파일 임포트 전 데이터를 검증하고 미리 확인하는 React 컴포넌트

**작성일:** 2026-06-02  
**버전:** 1.0  
**파일:** `/frontend/src/components/ImportPreview.tsx`

---

## 🎯 핵심 기능

### 1️⃣ 데이터 미리보기
- 임포트할 Excel/CSV의 **첫 5개 행** 테이블로 표시
- 유효한 데이터 vs 오류 있는 데이터 시각적 구분 (색상 코드)
- 비어있는 셀 명확히 표시
- 스크롤 가능한 테이블 레이아웃

### 2️⃣ 검증 기능
- **필수 필드 검증** — 빈 값 확인
- **숫자 필드 검증** — 숫자 형식 및 범위 확인
- **날짜 필드 검증** — YYYY-MM-DD 형식 확인
- **커스텀 검증** — 비즈니스 로직에 맞는 규칙 정의
- **에러 vs 경고 구분** — 심각도별 처리

### 3️⃣ 검증 결과 요약
```
┌─────────────────────────────────┐
│ 총 행: 1000  유효: 950  오류: 50 │
│ 오류: 75개   경고: 12개          │
└─────────────────────────────────┘
```

### 4️⃣ 필드별 오류 현황
```
오류 필드           오류 개수
─────────────────────────
이름                10
이메일              15
전화번호            25
```

### 5️⃣ 전체 오류 목록
```
행 5 · 필드: 이메일
  ✗ 이메일 형식이 잘못되었습니다

행 8 · 필드: 전화번호
  ✓ 전화번호 형식이 유효하지 않습니다
```

---

## 📦 Props (속성)

### `data: Record<string, any>[]` ✅ 필수
임포트할 데이터 배열
```typescript
[
  { name: 'John', email: 'john@example.com', salary: '3000000' },
  { name: 'Jane', email: 'jane@example.com', salary: '2500000' }
]
```

### `columns: string[]` ✅ 필수
테이블 열 이름 배열
```typescript
['name', 'email', 'salary']
```

### `validators?: ValidationRule[]` 🔵 선택
검증 규칙 배열 (default: [])
```typescript
interface ValidationRule {
  field: string;
  validate: (value: any, row?: Record<string, any>) => {
    valid: boolean;
    message?: string;
    type: 'error' | 'warning'
  };
  required?: boolean;
}
```

### `previewRows?: number` 🔵 선택
미리보기 행 개수 (default: 5)

### `onValidate?: (results) => void` 🔵 선택
검증 완료 콜백
```typescript
onValidate={(results) => {
  console.log(results.totalRows);    // 전체 행 수
  console.log(results.validRows);    // 유효한 행 수
  console.log(results.invalidRows);  // 오류 있는 행 수
  console.log(results.warnings);     // 경고 수
  console.log(results.errors);       // 오류 객체 배열
}}
```

---

## 🛠️ 사용 예제

### 1️⃣ 기본 사용 (검증 없음)
```typescript
import ImportPreview from '@/components/ImportPreview';

export default function Page() {
  const data = [
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
  ];

  return (
    <ImportPreview
      data={data}
      columns={['name', 'email']}
    />
  );
}
```

### 2️⃣ 필드 검증 추가
```typescript
import ImportPreview, {
  createRequiredValidator,
  createNumberValidator,
  createDateValidator
} from '@/components/ImportPreview';

export default function PayrollImport() {
  const payrollData = [
    { name: 'Kim, John', salary: '3000000', joinDate: '2025-01-15' },
    { name: 'Lee, Sarah', salary: '2500000', joinDate: '2024-06-01' }
  ];

  const validators = [
    createRequiredValidator('name'),
    createNumberValidator('salary'),
    createDateValidator('joinDate')
  ];

  return (
    <ImportPreview
      data={payrollData}
      columns={['name', 'salary', 'joinDate']}
      validators={validators}
      previewRows={5}
    />
  );
}
```

### 3️⃣ 커스텀 검증 규칙
```typescript
import ImportPreview, { type ValidationRule } from '@/components/ImportPreview';

const customValidators: ValidationRule[] = [
  // 이메일 검증
  {
    field: 'email',
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        valid: emailRegex.test(String(value)),
        message: '유효한 이메일 주소가 아닙니다',
        type: 'error'
      };
    }
  },

  // 급여 범위 검증
  {
    field: 'salary',
    validate: (value) => {
      const num = Number(value);
      if (num < 1000000) {
        return {
          valid: false,
          message: '급여는 최소 1,000,000원 이상이어야 합니다',
          type: 'error'
        };
      }
      if (num > 10000000) {
        return {
          valid: false,
          message: '급여가 비정상적으로 높습니다 (검토 필요)',
          type: 'warning'
        };
      }
      return { valid: true, type: 'error' };
    }
  },

  // 드롭다운 값 검증
  {
    field: 'department',
    validate: (value) => {
      const validDepts = ['마사지', '운전', '관리', '회계'];
      return {
        valid: validDepts.includes(String(value)),
        message: `부서는 ${validDepts.join(', ')} 중 하나여야 합니다`,
        type: 'error'
      };
    }
  }
];
```

### 4️⃣ 행 데이터를 참고한 검증 (교차 필드)
```typescript
{
  field: 'endDate',
  validate: (value, row) => {
    if (!row || !row.startDate) {
      return { valid: true, type: 'error' };
    }
    
    const startDate = new Date(row.startDate);
    const endDate = new Date(String(value));
    
    if (endDate <= startDate) {
      return {
        valid: false,
        message: '종료일은 시작일보다 나중이어야 합니다',
        type: 'error'
      };
    }
    
    return { valid: true, type: 'error' };
  }
}
```

### 5️⃣ 검증 결과 처리
```typescript
const handleValidate = (results) => {
  if (results.invalidRows === 0) {
    console.log('✅ 모든 데이터가 유효합니다!');
    // 임포트 진행 가능
    proceedWithImport(data);
  } else {
    console.log(`❌ ${results.invalidRows}개 행에 오류가 있습니다`);
    // 사용자에게 오류 표시하고 수정 대기
  }
};

return (
  <ImportPreview
    data={data}
    columns={columns}
    validators={validators}
    onValidate={handleValidate}
  />
);
```

---

## 🎨 UI/UX 기능

### 색상 코드
- 🟢 **녹색** (bg-green-50) — 유효한 데이터
- 🟠 **주황색** (bg-amber-50) — 경고
- 🔴 **빨간색** (bg-red-50) — 오류

### 인터랙티브 기능
1. **상세/간단 토글** — 행별 오류 메시지 표시/숨기기
2. **전개 가능한 오류 목록** — 모든 오류를 한 곳에서 확인
3. **필드별 요약** — 어떤 필드에서 가장 많은 오류가 발생했는지 표시

### 아이콘
- ✓ `CheckCircle` — 유효
- ✗ `XCircle` — 오류
- ⚠ `AlertTriangle` — 경고
- ⓘ `AlertCircle` — 정보

---

## 📊 검증 결과 구조

```typescript
interface ValidationResult {
  rowIndex: number;           // 행 번호 (1부터 시작)
  field: string;              // 필드명
  type: 'error' | 'warning';  // 오류 또는 경고
  message: string;            // 오류 메시지
}

interface ValidationSummary {
  totalRows: number;          // 전체 행 수
  validRows: number;          // 유효한 행 수
  invalidRows: number;        // 오류가 있는 행 수
  warnings: number;           // 경고 개수
  errors: number;             // 오류 개수
  errorsByField: {            // 필드별 오류 수
    [fieldName]: number
  };
  warningsByField: {          // 필드별 경고 수
    [fieldName]: number
  };
}
```

---

## 🔧 유틸리티 함수들

### `createRequiredValidator(field: string)`
필수 필드 검증
```typescript
createRequiredValidator('email')
// → email 필드가 비어있으면 오류
```

### `createNumberValidator(field: string)`
숫자 필드 검증
```typescript
createNumberValidator('salary')
// → salary 필드가 숫자가 아니면 오류
```

### `createDateValidator(field: string)`
날짜 필드 검증 (YYYY-MM-DD)
```typescript
createDateValidator('joinDate')
// → joinDate가 YYYY-MM-DD 형식이 아니면 오류
```

### 커스텀 검증 함수 작성
```typescript
function createEmailValidator(field: string): ValidationRule {
  return {
    field,
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        valid: emailRegex.test(String(value || '')),
        message: '유효한 이메일이 아닙니다',
        type: 'error'
      };
    }
  };
}

function createRangeValidator(
  field: string,
  min: number,
  max: number
): ValidationRule {
  return {
    field,
    validate: (value) => {
      const num = Number(value);
      if (isNaN(num) || num < min || num > max) {
        return {
          valid: false,
          message: `${field}은(는) ${min} ~ ${max} 범위여야 합니다`,
          type: 'error'
        };
      }
      return { valid: true, type: 'error' };
    }
  };
}
```

---

## 📝 데이터 포맷 가이드

### 입력 데이터 형식
```typescript
// ✅ 올바른 형식
const data = [
  { 
    name: 'John',
    email: 'john@example.com',
    salary: '3000000',
    joinDate: '2025-01-15'
  },
  { 
    name: 'Jane',
    email: 'jane@example.com',
    salary: '2500000',
    joinDate: '2024-06-01'
  }
];

// ❌ 잘못된 형식
const data = [
  ['John', 'john@example.com', '3000000', '2025-01-15'],
  ['Jane', 'jane@example.com', '2500000', '2024-06-01']
];
```

### Excel → JSON 변환 예제
```typescript
import * as XLSX from 'xlsx';

// Excel 파일 읽기
const file = (event.target as HTMLInputElement).files?.[0];
if (!file) return;

const reader = new FileReader();
reader.onload = (e) => {
  const workbook = XLSX.read(e.target?.result, { type: 'binary' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // ImportPreview에 전달
  setImportData(data);
};
reader.readAsBinaryString(file);
```

---

## 🚀 실전 예제: 직원 급여 임포트

```typescript
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import ImportPreview, {
  createRequiredValidator,
  createNumberValidator,
  createDateValidator,
  type ValidationRule
} from '@/components/ImportPreview';

export default function PayrollImportPage() {
  const [importData, setImportData] = useState<Record<string, any>[]>([]);
  const [isValidated, setIsValidated] = useState(false);

  const validators: ValidationRule[] = [
    // 필수 필드
    createRequiredValidator('직원명'),
    createRequiredValidator('부서'),

    // 숫자 검증
    {
      field: '기본급',
      validate: (value) => {
        if (!value || value === '') {
          return { valid: false, message: '기본급은 필수입니다', type: 'error' };
        }
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, message: '기본급은 숫자여야 합니다', type: 'error' };
        }
        if (num < 1000000) {
          return { valid: false, message: '기본급은 최소 1,000,000원 이상이어야 합니다', type: 'error' };
        }
        return { valid: true, type: 'error' };
      }
    },

    // 날짜 검증
    createDateValidator('입사일'),

    // 부서 검증
    {
      field: '부서',
      validate: (value) => {
        const validDepts = ['마사지', '운전', '관리', '회계'];
        if (!validDepts.includes(String(value))) {
          return {
            valid: false,
            message: `부서는 ${validDepts.join(', ')} 중 하나여야 합니다`,
            type: 'error'
          };
        }
        return { valid: true, type: 'error' };
      }
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(data);
        setIsValidated(false);
      } catch (error) {
        console.error('파일 읽기 실패:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleValidate = (results: any) => {
    console.log('✅ 검증 완료:', {
      총행: results.totalRows,
      유효행: results.validRows,
      오류행: results.invalidRows,
      오류: results.errors.length
    });
    setIsValidated(true);
  };

  const handleImport = async () => {
    try {
      const response = await fetch('/api/payroll/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importData })
      });

      if (response.ok) {
        alert('✅ 임포트 완료!');
        setImportData([]);
      } else {
        alert('❌ 임포트 실패');
      }
    } catch (error) {
      console.error('임포트 오류:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">💼 직원 급여 임포트</h1>

      {/* 파일 업로드 */}
      <div className="p-4 border-2 border-dashed rounded-lg">
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileUpload}
          className="w-full"
        />
      </div>

      {/* 검증 및 미리보기 */}
      {importData.length > 0 && (
        <>
          <ImportPreview
            data={importData}
            columns={['직원명', '부서', '기본급', '보너스', '입사일']}
            validators={validators}
            previewRows={5}
            onValidate={handleValidate}
          />

          {/* 임포트 버튼 */}
          {isValidated && (
            <button
              onClick={handleImport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              📤 임포트 진행
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 🐛 자주 묻는 질문 (FAQ)

### Q1: Excel 파일에서 데이터를 어떻게 읽나요?
```typescript
import * as XLSX from 'xlsx';

const workbook = XLSX.read(file, { type: 'binary' });
const data = XLSX.utils.sheet_to_json(workbook.Sheets[0]);
```

### Q2: 여러 개의 검증 규칙을 어떻게 조합하나요?
```typescript
const validators = [
  createRequiredValidator('email'),
  createEmailValidator('email'),  // 커스텀
  createRangeValidator('age', 18, 65)
];
```

### Q3: 행 데이터를 참고해서 다른 필드와 비교하는 검증은?
```typescript
{
  field: 'endDate',
  validate: (value, row) => {
    if (new Date(value) <= new Date(row.startDate)) {
      return { valid: false, message: '종료일이 시작일보다 빨라야 합니다', type: 'error' };
    }
    return { valid: true, type: 'error' };
  }
}
```

### Q4: 경고와 오류의 차이는?
- **오류** (`type: 'error'`) — 데이터 임포트 불가, 반드시 수정 필요
- **경고** (`type: 'warning'`) — 데이터 임포트 가능, 하지만 검토 권장

### Q5: 검증 결과를 API로 전송할 때는?
```typescript
const handleValidate = (results) => {
  if (results.invalidRows === 0) {
    // 검증 통과한 데이터만 전송
    await fetch('/api/import', {
      method: 'POST',
      body: JSON.stringify({ data: importData })
    });
  }
};
```

---

## 📚 관련 파일

| 파일 | 설명 |
|------|------|
| `ImportPreview.tsx` | 메인 컴포넌트 |
| `ImportPreview.examples.tsx` | 5가지 실전 예제 |
| `IMPORT_PREVIEW_GUIDE.md` | 이 가이드 |

---

## 🔗 기술 스택

- **React 19** — UI 렌더링
- **TypeScript** — 타입 안전성
- **Tailwind CSS** — 스타일링
- **Lucide Icons** — 아이콘
- **useMemo** — 성능 최적화

---

**최종 업데이트:** 2026-06-02  
**컴포넌트 버전:** 1.0  
**상태:** ✅ 프로덕션 준비 완료
