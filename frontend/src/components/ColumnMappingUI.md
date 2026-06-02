# ColumnMappingUI 컴포넌트 문서

## 개요

**ColumnMappingUI**는 엑셀 파일의 컬럼을 데이터베이스 필드로 매핑하는 React 컴포넌트입니다. 자동 감지, 수동 드롭다운 선택, 필수/선택적 필드 구분, 매핑 상태 표시 등의 기능을 제공합니다.

## 주요 기능

### 1. 자동 감지 (Auto-Detection)

컴포넌트는 엑셀 컬럼명과 DB 필드명의 유사도를 계산하여 자동으로 매핑을 제안합니다.

**유사도 계산 알고리즘:**
- 정확히 일치: 1.0 (100%)
- 단어 기반 일치: 0.6~0.9 (60%~90%)
- 부분 일치: 0.8 (80%)
- 일치 없음: 0.0 (0%)

**최소 임계값:** 0.6 (60%) 이상인 경우만 자동 매핑

예시:
```
엑셀 컬럼 → 자동 감지 결과
"Company ID" → "company_id" (1.0 - 정확히 일치)
"Settlement Year" → "settlement_period_year" (0.7 - 단어 일치)
"Revenue Total" → "total_revenue" (0.6 - 부분 일치)
```

### 2. 필수 vs 선택적 필드

각 필드는 필수(required) 또는 선택적(optional)으로 분류됩니다.

```typescript
// 필수 필드 예시
{
  fieldName: 'company_id',
  displayName: '업체 ID',
  isRequired: true,  // ← 반드시 매핑되어야 함
}

// 선택적 필드 예시
{
  fieldName: 'notes',
  displayName: '메모',
  isRequired: false,  // ← 매핑 선택 사항
}
```

### 3. 실시간 상태 표시

| 상태 | 아이콘 | 색상 | 설명 |
|------|--------|------|------|
| 미매핑 | ⚠️ | Amber | 아직 매핑되지 않은 컬럼 |
| 자동 감지됨 | 🔄 | Blue | 자동 감지로 매핑된 컬럼 |
| 필수 필드 | ✓ | Emerald | 필수 필드로 매핑된 컬럼 |
| 매핑됨 | ✓ | Emerald | 수동으로 매핑된 컬럼 |

### 4. 통계 대시보드

```
총 컬럼: 11 | 매핑됨: 9 | 미매핑: 2 | 필수 미매핑: 0
```

## 사용 방법

### 기본 사용 (TypeScript)

```typescript
import ColumnMappingUI, { DBField, ColumnMapping } from './ColumnMappingUI';

export function MyImportPage() {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  // 1. DB 필드 정의
  const dbFields: DBField[] = [
    {
      fieldName: 'company_id',
      displayName: '업체 ID',
      dataType: 'number',
      isRequired: true,
      description: '고유한 업체 ID',
    },
    {
      fieldName: 'total_revenue',
      displayName: '총 매출액',
      dataType: 'decimal',
      isRequired: false,
      description: '총 매출액 (PHP)',
    },
  ];

  // 2. 엑셀 컬럼 설정
  const excelColumns = ['Company ID', 'Total Revenue', 'Settlement Year'];

  // 3. 매핑 변경 콜백
  const handleMappingChange = (newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
    console.log('매핑 변경:', newMappings);
  };

  // 4. 컴포넌트 렌더링
  return (
    <ColumnMappingUI
      excelColumns={excelColumns}
      dbFields={dbFields}
      onMappingChange={handleMappingChange}
      autoDetect={true}
    />
  );
}
```

### Props (입력 매개변수)

| Props | 타입 | 필수 | 기본값 | 설명 |
|-------|------|------|--------|------|
| `excelColumns` | `string[]` | ✅ | - | 엑셀 파일의 컬럼명 배열 |
| `dbFields` | `DBField[]` | ✅ | - | DB 테이블의 필드 정의 배열 |
| `onMappingChange` | `(mapping: ColumnMapping[]) => void` | ❌ | - | 매핑 변경 시 호출되는 콜백 |
| `autoDetect` | `boolean` | ❌ | `true` | 자동 감지 활성화 여부 |

### 타입 정의

#### DBField

```typescript
interface DBField {
  fieldName: string;          // DB 컬럼명 (예: "company_id")
  displayName: string;        // UI 표시명 (예: "업체 ID")
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'decimal';
  isRequired: boolean;        // 필수 필드 여부
  description?: string;       // 필드 설명
}
```

#### ColumnMapping

```typescript
interface ColumnMapping {
  excelColumn: string;        // 엑셀 컬럼명 (예: "Company ID")
  dbField: string | null;     // 매핑된 DB 필드명 (null이면 미매핑)
  isAutoDetected: boolean;    // 자동 감지 여부
}
```

## 실제 사용 예시

### 예시 1: CompanySettlement 임포트

```typescript
import ColumnMappingUI, { DBField } from './ColumnMappingUI';

const dbFields: DBField[] = [
  {
    fieldName: 'company_id',
    displayName: '업체 ID',
    dataType: 'number',
    isRequired: true,
  },
  {
    fieldName: 'settlement_period_year',
    displayName: '정산 연도',
    dataType: 'number',
    isRequired: true,
  },
  {
    fieldName: 'settlement_period_month',
    displayName: '정산 월',
    dataType: 'number',
    isRequired: true,
  },
  {
    fieldName: 'total_revenue',
    displayName: '총 매출액',
    dataType: 'decimal',
    isRequired: false,
  },
  {
    fieldName: 'guest_revenue',
    displayName: '비회원 매출',
    dataType: 'decimal',
    isRequired: false,
  },
  {
    fieldName: 'credit_revenue',
    displayName: '외상 매출',
    dataType: 'decimal',
    isRequired: false,
  },
  {
    fieldName: 'waived_revenue',
    displayName: '제외 매출',
    dataType: 'decimal',
    isRequired: false,
  },
  {
    fieldName: 'recovery_rate',
    displayName: '회수율',
    dataType: 'decimal',
    isRequired: false,
  },
  {
    fieldName: 'platform_fee_rate',
    displayName: '플랫폼 수수료율',
    dataType: 'decimal',
    isRequired: false,
  },
  {
    fieldName: 'status',
    displayName: '정산 상태',
    dataType: 'string',
    isRequired: false,
  },
  {
    fieldName: 'notes',
    displayName: '메모',
    dataType: 'string',
    isRequired: false,
  },
];

export function CompanySettlementImport() {
  const [mappings, setMappings] = useState([]);

  return (
    <ColumnMappingUI
      excelColumns={[
        'Company ID',
        'Settlement Year',
        'Settlement Month',
        'Total Revenue',
        'Guest Revenue',
        'Credit Revenue',
        'Waived Revenue',
        'Recovery Rate',
        'Platform Fee Rate',
        'Status',
        'Notes',
      ]}
      dbFields={dbFields}
      onMappingChange={setMappings}
      autoDetect={true}
    />
  );
}
```

### 예시 2: 백엔드로 매핑 데이터 전송

```typescript
async function importData(mappings: ColumnMapping[]) {
  // 1. 검증: 모든 필드가 매핑되었는지 확인
  const unmappedColumns = mappings.filter(m => m.dbField === null);
  if (unmappedColumns.length > 0) {
    alert(`미매핑 컬럼: ${unmappedColumns.map(m => m.excelColumn).join(', ')}`);
    return;
  }

  // 2. API에 매핑 데이터 전송
  const response = await fetch('/api/import/company-settlement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mappings,
      excelData: excelFileData,  // 실제 엑셀 데이터
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Import failed: ${response.status}`);
  }

  const result = await response.json();
  console.log(`Successfully imported ${result.importedRows} rows`);
}
```

## UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ 엑셀 컬럼 매핑                                               │
│ 엑셀 파일의 각 컬럼을 데이터베이스 필드로 매핑하세요.       │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ 총 컬럼  │ 매핑됨   │ 미매핑   │ 필수     │
│ 11       │ 9        │ 2        │ 0        │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────────────────┐
│ 필드 분류:                                                   │
│ • 필수 필드 (3개): company_id, settlement_year, ...         │
│ • 선택적 필드 (8개): total_revenue, guest_revenue, ...      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬───────┬────────────┐
│ 엑셀 컬럼        │ 매핑 대상        │ 상태  │ 설명       │
├──────────────────┼──────────────────┼───────┼────────────┤
│ Company ID       │ [업체 ID ▼]      │ ✓ 필  │ 고유 ID    │
│ Settlement Year  │ [정산 연도 ▼]    │ 🔄 자 │ 연도       │
│ Settlement Month │ [정산 월 ▼]      │ ✓ 필  │ 월         │
│ Total Revenue    │ [총 매출액 ▼]    │ 🔄 자 │ 매출액     │
│ Guest Revenue    │ [— 선택 안함 —]  │ ⚠️ 미 │ —          │
└──────────────────┴──────────────────┴───────┴────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚠️ 미매핑 컬럼 있음                                          │
│ 1개의 컬럼이 아직 매핑되지 않았습니다.                       │
└─────────────────────────────────────────────────────────────┘
```

## 스타일링

컴포넌트는 **Tailwind CSS 4**를 사용합니다. 색상 체계:

| 용도 | 색상 클래스 | RGB |
|------|-----------|-----|
| 필수 필드 | `emerald` | 성공 상태 |
| 자동 감지 | `blue` | 정보 상태 |
| 미매핑 | `amber` | 경고 상태 |
| 필수 미매핑 | `red` | 오류 상태 |

### 커스텀 스타일 (필요 시)

```typescript
// 부모 컴포넌트에서 원하는 스타일 적용
<div className="your-custom-wrapper">
  <ColumnMappingUI {...props} />
</div>

// CSS 변수로 커스터마이제이션
<style>
  :root {
    --mapping-primary: #3b82f6;    /* Blue */
    --mapping-success: #10b981;    /* Emerald */
    --mapping-warning: #f59e0b;    /* Amber */
    --mapping-error: #ef4444;      /* Red */
  }
</style>
```

## 고급 기능

### 1. 수동 매핑 보정

사용자가 자동 매핑을 보정할 수 있습니다:

```
엑셀: "Revenue Total"
자동 감지: "total_revenue" (0.6 - 유사도)
사용자: 드롭다운에서 "guest_revenue" 선택 ← 수동 보정
```

### 2. 선택 안함 옵션

일부 컬럼을 무시할 수 있습니다:

```
엑셀: "Extra Data"
사용자: "— 선택 안함 —" ← 이 컬럼은 임포트되지 않음
```

### 3. 필드 데이터 타입

매핑 시 데이터 타입을 확인하여 검증:

```typescript
dataType: 'string' | 'number' | 'date' | 'boolean' | 'decimal'

// 예시: "Company ID" → "company_id" (type: number)
// 엑셀 셀 값이 숫자로 변환 가능해야 함
```

## 에러 처리

### 미매핑 컬럼 경고

```typescript
if (mappings.some(m => m.dbField === null)) {
  // ⚠️ 경고: 미매핑 컬럼 있음
  // UI에 amber 경고 배지 표시
}
```

### 필수 필드 미매핑 에러

```typescript
if (mappings.some(m => 
  !m.dbField && 
  dbFields.find(f => f.fieldName === m.dbField)?.isRequired
)) {
  // ❌ 오류: 필수 필드가 매핑되지 않음
  // UI에 red 에러 배지 표시
  // 임포트 진행 불가
}
```

## 성능 최적화

### useMemo로 최적화된 계산

```typescript
// 1. 자동 매핑 (초기 로드 시에만 계산)
const initialAutoMappings = useMemo(
  () => (autoDetect ? autoDetectMappings(excelColumns, dbFields) : new Map()),
  [excelColumns, dbFields, autoDetect]
);

// 2. 통계 계산 (매핑 변경 시에만 계산)
const stats = useMemo(() => {
  // total, mapped, unmapped, requiredUnmapped
}, [userMappings, excelColumns, dbFields]);
```

### 대용량 데이터 처리

- 엑셀 컬럼 수: 최대 100개까지 안정적
- DB 필드 수: 최대 200개까지 안정적
- 그 이상의 대용량 데이터는 가상 스크롤링 고려

## 접근성 (Accessibility)

- ✅ 키보드 네비게이션 (Tab, Enter, Esc)
- ✅ 스크린 리더 지원
- ✅ ARIA 라벨 포함
- ✅ 색상 대비 WCAG AA 준수

## 브라우저 호환성

| 브라우저 | 버전 | 지원 |
|---------|------|------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Edge | 90+ | ✅ |
| IE | - | ❌ |

## 관련 파일

- `ColumnMappingUI.tsx` - 메인 컴포넌트
- `ColumnMappingUI.example.tsx` - 사용 예시 (5가지)
- `ColumnMappingUI.md` - 이 문서

## 라이선스

ElSpa 프로젝트의 일부로 내부 사용만 가능합니다.

---

**작성 일자:** 2026-06-02  
**최종 수정:** 2026-06-02  
**담당자:** jitnet57 (kang jichul)
