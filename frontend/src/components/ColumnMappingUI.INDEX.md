# ColumnMappingUI - Complete Documentation Index

**작성일:** 2026-06-02  
**버전:** 1.0  
**상태:** ✅ 완성

---

## 📦 생성된 파일 (4개)

### 1. **ColumnMappingUI.tsx** (메인 컴포넌트)
- **크기:** 17KB
- **라인:** ~650줄
- **역할:** React 컴포넌트 구현
- **주요 내용:**
  - `ColumnMappingUI` 기본 컴포넌트
  - 자동 감지 알고리즘 (`autoDetectMappings`)
  - 유사도 계산 (`calculateSimilarity`)
  - 드롭다운 UI (`ColumnDropdown`)
  - 통계 카드 (`StatCard`)
  - 상태 배지 (`StatusBadge`)
  - TypeScript 인터페이스 (DBField, ColumnMapping, Props)

**특징:**
- ✅ 'use client' 지시문 포함
- ✅ React hooks (useState, useMemo)
- ✅ Tailwind CSS 스타일
- ✅ Lucide-react 아이콘
- ✅ 완전한 JSDoc 주석

---

### 2. **ColumnMappingUI.example.tsx** (사용 예시)
- **크기:** 19KB
- **라인:** ~700줄
- **역할:** 5가지 실제 사용 예시 제공
- **포함 예시:**
  1. **CompanySettlementMappingExample**
     - 업체 월간 정산 데이터 임포트
     - 11개 필드 정의
     - 자동 감지 활성화
  
  2. **SettlementTransactionMappingExample**
     - 정산 거래 상세 기록 임포트
     - 9개 필드 정의
     - API 콜백 구조
  
  3. **CustomDataModelMappingExample**
     - 커스텀 데이터 모델 (Therapist, Booking, Customer)
     - 동적 모델 선택
     - 제너릭 사용법
  
  4. **sendMappingToBackend** (유틸리티 함수)
     - 매핑 데이터 검증
     - API 요청 처리
     - 에러 핸들링
  
  5. **CompleteImportWorkflowExample** (완전한 워크플로우)
     - 파일 업로드
     - 매핑 선택
     - 임포트 실행
     - 단계별 진행 표시

**사용 시기:**
- 컴포넌트 통합 방법 학습
- 실제 데이터 모델과 연동
- API 통신 패턴 참고
- 워크플로우 설계

---

### 3. **ColumnMappingUI.md** (완전한 문서)
- **크기:** 13KB
- **라인:** ~500줄
- **역할:** 공식 문서
- **섹션:**
  1. **개요** - 컴포넌트 소개 및 주요 기능
  2. **자동 감지** - 유사도 계산 알고리즘 설명
  3. **필수 vs 선택적 필드** - 필드 분류 체계
  4. **실시간 상태 표시** - UI 상태 종류
  5. **통계 대시보드** - 통계 항목 설명
  6. **사용 방법** - 기본 사용법 및 Props
  7. **타입 정의** - TypeScript 인터페이스
  8. **실제 사용 예시** - 2가지 주요 사용 사례
  9. **UI 레이아웃** - ASCII 다이어그램
  10. **스타일링** - Tailwind CSS 커스터마이제이션
  11. **고급 기능** - 수동 매핑, 선택 안함, 데이터 타입
  12. **에러 처리** - 경고 및 에러 상황
  13. **성능 최적화** - useMemo 활용
  14. **접근성** - WCAG 준수
  15. **브라우저 호환성** - 지원 브라우저

**참고 시기:**
- 컴포넌트 상세 학습
- Props 및 타입 확인
- UI/UX 디자인 이해
- 문제 해결

---

### 4. **ColumnMappingUI.test.tsx** (단위 테스트)
- **크기:** 9KB
- **라인:** ~400줄
- **역할:** Jest/React Testing Library 테스트
- **테스트 항목:**
  1. **렌더링 테스트**
     - 타이틀 및 설명 표시
     - 통계 카드 표시
     - 엑셀 컬럼 테이블
     - 필드 섹션

  2. **자동 감지 테스트**
     - 자동 매핑 동작
     - 자동 감지 배지 표시
     - 유사도 계산

  3. **상호작용 테스트**
     - 드롭다운 클릭
     - 옵션 선택
     - 매핑 변경

  4. **콜백 테스트**
     - onMappingChange 호출
     - 올바른 데이터 전달

  5. **경고/메시지 테스트**
     - 미매핑 경고
     - 필수 필드 경고
     - 성공 메시지

  6. **엣지 케이스 테스트**
     - 빈 배열 처리
     - autoDetect=false
     - 정확한 일치

**실행:**
```bash
npm test ColumnMappingUI.test.tsx
npm test -- -t "auto-detect"  # 특정 테스트만
```

---

### 5. **ColumnMappingUI.QUICKREF.md** (빠른 참조)
- **크기:** 4KB
- **라인:** ~150줄
- **역할:** 빠른 참조 가이드
- **포함:**
  - 가장 간단한 사용법 (30초)
  - Props 한 줄 설명
  - DBField 객체 구조
  - 색상 체계
  - 자동 감지 원리
  - 시나리오별 설정
  - 검증 코드
  - 백엔드 전송 예시
  - 디버깅 팁
  - 체크리스트

**사용:**
- 빠른 구현
- 문제 해결
- 패턴 확인

---

## 🎯 핵심 기능 요약

### 자동 감지 알고리즘
```
엑셀 컬럼 + DB 필드 정의 → 유사도 계산 (0~1) → 0.6 이상만 자동 매핑
```

### 필수/선택적 필드 관리
```
DBField.isRequired = true  → 드롭다운 위쪽 "필수 필드" 섹션
DBField.isRequired = false → 드롭다운 아래쪽 "선택적 필드" 섹션
```

### 상태 표시 시스템
```
미매핑        → Amber   (⚠️)
자동 감지됨   → Blue    (🔄)
필수 매핑됨   → Emerald (✓)
선택 매핑됨   → Emerald (✓)
```

### 통계 대시보드
```
총 컬럼 | 매핑된 컬럼 | 미매핑 컬럼 | 필수 미매핑
  11   |     9      |     2      |     0
```

---

## 📋 타입 정의 (Copy-Paste Ready)

### DBField
```typescript
interface DBField {
  fieldName: string;
  displayName: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'decimal';
  isRequired: boolean;
  description?: string;
}
```

### ColumnMapping
```typescript
interface ColumnMapping {
  excelColumn: string;
  dbField: string | null;
  isAutoDetected: boolean;
}
```

### ColumnMappingUIProps
```typescript
interface ColumnMappingUIProps {
  excelColumns: string[];
  dbFields: DBField[];
  onMappingChange?: (mapping: ColumnMapping[]) => void;
  autoDetect?: boolean;
}
```

---

## 🚀 통합 가이드

### Step 1: 컴포넌트 임포트
```typescript
import ColumnMappingUI from '@/components/ColumnMappingUI';
```

### Step 2: DB 필드 정의
```typescript
const dbFields: DBField[] = [
  { fieldName: 'id', displayName: 'ID', dataType: 'number', isRequired: true },
  { fieldName: 'name', displayName: '이름', dataType: 'string', isRequired: true },
  { fieldName: 'email', displayName: '이메일', dataType: 'string', isRequired: false },
];
```

### Step 3: 엑셀 컬럼 수집
```typescript
// 1. 파일 업로드 → xlsx 라이브러리로 헤더 추출
// 2. 또는 사용자가 수동으로 입력

const excelColumns = ['ID', 'Name', 'Email Address'];
```

### Step 4: 매핑 콜백 구현
```typescript
const handleMappingChange = (mappings: ColumnMapping[]) => {
  // 1. 검증
  const isValid = mappings.every(m => !m.dbField || dbFields.some(f => f.fieldName === m.dbField));
  
  // 2. 저장 또는 전송
  if (isValid) {
    submitToBackend(mappings);
  }
};
```

### Step 5: 컴포넌트 렌더링
```typescript
<ColumnMappingUI
  excelColumns={excelColumns}
  dbFields={dbFields}
  onMappingChange={handleMappingChange}
  autoDetect={true}
/>
```

---

## 🔧 통합 대상

### 1. CompanySettlement 임포트 페이지
- 파일: 미정
- 필드: company_id, settlement_period_year, settlement_period_month, total_revenue, ...
- 예시: ColumnMappingUI.example.tsx의 CompanySettlementMappingExample 참고

### 2. SettlementTransaction 임포트 페이지
- 파일: 미정
- 필드: company_settlement_id, transaction_type, settlement_category, amount, ...
- 예시: ColumnMappingUI.example.tsx의 SettlementTransactionMappingExample 참고

### 3. 기타 데이터 모델
- Therapist, Booking, Customer 등
- 예시: ColumnMappingUI.example.tsx의 CustomDataModelMappingExample 참고

---

## 📚 문서 선택 가이드

| 상황 | 참고 문서 |
|------|---------|
| 빠르게 구현하고 싶음 | QUICKREF.md |
| 상세하게 학습하고 싶음 | ColumnMappingUI.md |
| 사용 예시를 보고 싶음 | ColumnMappingUI.example.tsx |
| 테스트 작성 중 | ColumnMappingUI.test.tsx |
| 컴포넌트 코드 수정 | ColumnMappingUI.tsx |
| 전체 구조 이해 | 이 파일 (INDEX) |

---

## ✅ 완성도 체크리스트

### 코드 작성
- ✅ 메인 컴포넌트 (ColumnMappingUI.tsx)
- ✅ 자동 감지 알고리즘
- ✅ UI 컴포넌트 (드롭다운, 배지, 카드)
- ✅ 상태 관리 (useState, useMemo)
- ✅ 타입 정의 (DBField, ColumnMapping)

### 예시 및 가이드
- ✅ 5가지 사용 예시 (ColumnMappingUI.example.tsx)
- ✅ 완전한 문서 (ColumnMappingUI.md)
- ✅ 빠른 참조 (QUICKREF.md)
- ✅ API 통합 패턴
- ✅ 워크플로우 예제

### 테스트
- ✅ 렌더링 테스트
- ✅ 자동 감지 테스트
- ✅ 상호작용 테스트
- ✅ 콜백 테스트
- ✅ 경고 메시지 테스트
- ✅ 엣지 케이스 테스트

### 포매팅 및 품질
- ✅ Prettier 포매팅
- ✅ TypeScript 타입 체크
- ✅ JSDoc 주석
- ✅ 한국어 설명
- ✅ 인라인 주석

---

## 🔗 관련 리소스

### 프로젝트 문서
- CLAUDE.md - 프로젝트 전체 가이드
- history-workflow-book.md - 개발 히스토리

### 외부 라이브러리
- [React 19 공식 문서](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### ElSpa 관련 모델
- app/models/company_settlement.py
- app/models/settlement_transaction.py
- app/schemas/company_settlement.py

---

## 🎓 학습 순서 추천

### 1단계: 기본 이해 (15분)
→ QUICKREF.md 읽기

### 2단계: 실제 사용 (30분)
→ ColumnMappingUI.example.tsx 중 1개 예시 따라 하기

### 3단계: 상세 학습 (1시간)
→ ColumnMappingUI.md 전체 읽기

### 4단계: 고급 활용 (1시간)
→ ColumnMappingUI.tsx 코드 분석
→ calculateSimilarity 알고리즘 이해

### 5단계: 통합 구현 (2시간)
→ 실제 프로젝트에 통합
→ 백엔드 API 연동

---

## 📞 자주 묻는 질문 (FAQ)

**Q: 자동 감지가 작동하지 않는데요?**  
A: 임계값(0.6)을 확인하세요. ColumnMappingUI.md의 "자동 감지 알고리즘" 섹션 참고.

**Q: 특정 필드를 필수로 만들려면?**  
A: DBField의 `isRequired: true`로 설정하면 UI에서 필드 표시가 달라집니다.

**Q: 엑셀 파일에서 헤더를 자동으로 추출하려면?**  
A: xlsx 라이브러리 사용. ColumnMappingUI.example.tsx의 handleFileUpload 참고.

**Q: 매핑 결과를 백엔드로 보내려면?**  
A: sendMappingToBackend 함수 참고 (ColumnMappingUI.example.tsx).

**Q: 커스텀 스타일을 적용하려면?**  
A: Tailwind CSS 클래스를 수정하거나 래퍼 div에 스타일 적용.

---

**버전 히스토리:**
- v1.0 (2026-06-02): 초기 완성

**다음 업데이트 예정:**
- 다중 언어 지원 (i18n)
- 고급 필터링 옵션
- 매핑 템플릿 저장/로드
- 대용량 데이터 가상 스크롤링
