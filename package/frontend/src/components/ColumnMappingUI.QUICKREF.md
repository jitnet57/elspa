# ColumnMappingUI - Quick Reference Guide

## 📌 파일 위치
```
/Users/kwangseobpark/elspa/frontend/src/components/ColumnMappingUI.tsx
```

## 🚀 가장 간단한 사용법 (30초)

```typescript
import ColumnMappingUI from '@/components/ColumnMappingUI';

export function MyPage() {
  return (
    <ColumnMappingUI
      excelColumns={['Company ID', 'Year', 'Revenue']}
      dbFields={[
        { fieldName: 'company_id', displayName: 'Company ID', dataType: 'number', isRequired: true },
        { fieldName: 'year', displayName: 'Year', dataType: 'number', isRequired: true },
        { fieldName: 'revenue', displayName: 'Revenue', dataType: 'decimal', isRequired: false },
      ]}
      autoDetect={true}
      onMappingChange={(mappings) => console.log(mappings)}
    />
  );
}
```

## 📋 Props 한 줄 설명

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `excelColumns` | `string[]` | ✅ | - | 엑셀 헤더 컬럼명 배열 |
| `dbFields` | `DBField[]` | ✅ | - | DB 필드 정의 배열 |
| `onMappingChange` | `function` | ❌ | - | 매핑 변경 시 호출 |
| `autoDetect` | `boolean` | ❌ | `true` | 자동 감지 활성화 |

## 🎯 DBField 객체 (필수)

```typescript
{
  fieldName: 'company_id',           // DB에서 사용할 컬럼명
  displayName: '업체 ID',             // UI에 표시할 이름
  dataType: 'number',                // 데이터 타입 (string|number|date|boolean|decimal)
  isRequired: true,                  // 필수 필드인지 여부
  description: '고유한 업체 ID'      // (선택) 필드 설명
}
```

## 📊 ColumnMapping 콜백 결과

```typescript
onMappingChange={(mappings) => {
  // mappings 배열 구조:
  mappings.forEach(m => {
    console.log(m.excelColumn);   // "Company ID"
    console.log(m.dbField);       // "company_id" 또는 null (미매핑)
    console.log(m.isAutoDetected); // true/false
  });
}}
```

## 🎨 색상 체계 (Tailwind)

| 상태 | 색상 | 의미 |
|------|------|------|
| 필수 필드 ✓ | `emerald` | 성공/필수 |
| 자동 감지 | `blue` | 정보 |
| 미매핑 ⚠️ | `amber` | 경고 |
| 필수 미매핑 ❌ | `red` | 오류 |

## 💡 자동 감지 작동 원리

```
유사도 점수: 0.0 ~ 1.0 범위
- 1.0 = "Company ID" ↔ "Company ID" (정확 일치)
- 0.9 = "Company ID" ↔ "company_id" (완벽한 단어 매치)
- 0.8 = "Total Money" ↔ "Total Revenue" (부분 포함)
- 0.7 = "Settlement Year" ↔ "settlement_period_year" (단어 일치율)
- 0.0 = "Unknown" ↔ "company_id" (일치 없음)

임계값: 0.6 이상만 자동 매핑됨
```

## 📱 주요 시나리오별 설정

### 시나리오 1: CompanySettlement 임포트
```typescript
const dbFields = [
  { fieldName: 'company_id', displayName: '업체 ID', dataType: 'number', isRequired: true },
  { fieldName: 'settlement_period_year', displayName: '정산 연도', dataType: 'number', isRequired: true },
  { fieldName: 'settlement_period_month', displayName: '정산 월', dataType: 'number', isRequired: true },
  { fieldName: 'total_revenue', displayName: '총 매출액', dataType: 'decimal', isRequired: false },
];
```

### 시나리오 2: 커스텀 데이터 임포트
```typescript
// dbFields를 동적으로 생성
const dbFields = tableSchema.columns.map(col => ({
  fieldName: col.name,
  displayName: col.label,
  dataType: col.type,
  isRequired: col.nullable === false,
}));
```

### 시나리오 3: 읽기 전용 모드
```typescript
// onMappingChange 없이 사용 (읽기만 가능)
<ColumnMappingUI
  excelColumns={columns}
  dbFields={fields}
  autoDetect={true}
/>
```

## 🔍 매핑 결과 검증

```typescript
const validateMappings = (mappings: ColumnMapping[], dbFields: DBField[]) => {
  // 필수 필드가 모두 매핑되었는지 확인
  const requiredFields = dbFields.filter(f => f.isRequired);
  const mappedRequired = mappings
    .filter(m => m.dbField && requiredFields.some(f => f.fieldName === m.dbField))
    .length;

  const isValid = mappedRequired === requiredFields.length;
  return {
    isValid,
    unmappedRequired: requiredFields.length - mappedRequired,
  };
};
```

## 📤 백엔드로 전송 예시

```typescript
async function submitMappings(mappings: ColumnMapping[]) {
  const response = await fetch('/api/import/mapping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'CompanySettlement',
      mappings: mappings.map(m => ({
        excelColumn: m.excelColumn,
        dbField: m.dbField,
      })),
      timestamp: new Date().toISOString(),
    }),
  });

  return await response.json();
}
```

## 🧪 테스트하기

```bash
# 컴포넌트 테스트 실행
npm test ColumnMappingUI.test.tsx

# 특정 테스트만 실행
npm test -- -t "should auto-detect mappings"
```

## 🚨 일반적인 실수

| 실수 | 해결책 |
|------|--------|
| `dataType` 값이 잘못됨 | `'string'\|'number'\|'date'\|'boolean'\|'decimal'`만 사용 |
| 자동 감지 안 됨 | 임계값(0.6) 확인, `autoDetect={true}` 확인 |
| 콜백이 호출 안 됨 | `onMappingChange` prop 전달 확인 |
| 드롭다운이 안 열림 | Tailwind CSS 로드 확인, z-index 확인 |

## 📚 관련 파일

- `ColumnMappingUI.tsx` - 메인 컴포넌트
- `ColumnMappingUI.example.tsx` - 5가지 사용 예시
- `ColumnMappingUI.md` - 완전한 문서
- `ColumnMappingUI.test.tsx` - 단위 테스트

## 🎯 디버깅 팁

```typescript
// 1. 콘솔로 매핑 확인
onMappingChange={(mappings) => {
  console.table(mappings);
}}

// 2. 자동 감지 점수 확인
// calculateSimilarity 함수를 수정해서 점수 로깅

// 3. 통계 확인
// 총 컬럼, 매핑된 컬럼 수를 UI에서 확인

// 4. 필드 설명 확인
// 각 필드의 description을 추가하면 UI에 표시됨
```

## ✅ 체크리스트 (사용 전)

- [ ] `excelColumns` 배열 준비됨
- [ ] `dbFields` 배열 준비됨 (fieldName, displayName, dataType, isRequired)
- [ ] `onMappingChange` 콜백 함수 준비됨
- [ ] Tailwind CSS 로드됨
- [ ] lucide-react 아이콘 설치됨 (`npm install lucide-react`)
- [ ] Next.js 'use client' 지시문 포함됨

---

**버전:** 1.0  
**최종 수정:** 2026-06-02  
**작성자:** ElSpa Development Team
