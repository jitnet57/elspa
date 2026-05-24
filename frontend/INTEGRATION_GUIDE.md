# ElSpa Payroll UI 통합 가이드

## 📦 생성된 파일 목록

### 컴포넌트 (React)
- `src/app/admin/payroll/components/PayrollRecords.tsx` ✓
- `src/app/admin/payroll/components/HolidayManagement.tsx` ✓
- `src/app/admin/payroll/components/PayrollRecordDetail.tsx` ✓

### JSON 스키마 (문서)
- `src/app/admin/payroll/schemas/payroll-records-schema.json` ✓
- `src/app/admin/payroll/schemas/holidays-schema.json` ✓
- `src/app/admin/payroll/schemas/record-detail-schema.json` ✓
- `src/app/admin/payroll/schemas/ui-design-system.json` ✓ (통합 설계 시스템)

---

## 🚀 빠른 시작 (5분)

### 1단계: 경로 설정
```bash
# 페이지 파일 생성
touch src/app/admin/payroll/page.tsx
touch src/app/admin/payroll/holidays/page.tsx
touch src/app/admin/payroll/records/[id]/page.tsx
```

### 2단계: 페이지 컴포넌트 작성
```typescript
// src/app/admin/payroll/page.tsx
import PayrollRecords from './components/PayrollRecords';
export default function Page() {
  return <PayrollRecords />;
}
```

### 3단계: 빌드 검증
```bash
cd frontend
npm run build
# TypeScript 타입 체크 + 번들 최적화
```

### 4단계: 개발 서버 시작
```bash
npm run dev
# http://localhost:3000/admin/payroll 방문
```

---

## 📊 컴포넌트별 가이드

### PayrollRecords (급여 정산 기록)
**경로:** `/admin/payroll/records`

**기능:**
- 모든 정산 기록 리스트 (필터 포함)
- 상태 필터 (Draft, Approved, Paid)
- 직원 유형 필터
- 정산 기간 선택
- 모바일 반응형 (바텀 네비)

**주요 Props:**
- `records?: PayrollRecord[]` - Mock 대신 API 데이터 전달
- `onFilterChange?: (filters) => void` - 필터 변경 이벤트

**API 연동:**
```typescript
// fastapi/app/routers/payroll.py 의 엔드포인트 사용
const response = await fetch('/api/payroll/records', {
  params: { period, status, employeeType }
});
```

---

### HolidayManagement (공휴일 관리)
**경로:** `/admin/payroll/holidays`

**기능:**
- 필리핀 국가/특정 공휴일 관리
- 공휴일별 급여 배율 (200%, 130%)
- 추가/수정/삭제 기능
- 검색 기능

**API 연동:**
```typescript
// POST /api/payroll/holidays - 공휴일 추가
// DELETE /api/payroll/holidays/:id - 공휴일 삭제
// PUT /api/payroll/holidays/:id - 공휴일 수정
```

---

### PayrollRecordDetail (개별 정산 상세)
**경로:** `/admin/payroll/records/[id]`

**기능:**
- 상세 정산서 (직원별)
- 수입 내역 (기본급, 커미션, OT, 보너스)
- 차감 내역 (지각, 결근, SSS, CA, 건강검진)
- Net Pay 강조 표시
- PDF 다운로드
- 승인/거부 버튼

**구조:**
```
┌─────────────────────────────────────┐
│  Employee Profile & Period          │
├─────────────────────────────────────┤
│ ┌───────────────┬──────────────────┐ │
│ │  EARNINGS     │   DEDUCTIONS     │ │
│ │  Base Salary  │   Late/Tardy     │ │
│ │  Commission   │   Absence        │ │
│ │  Overtime     │   SSS Loan       │ │
│ │  Holiday      │   Cash Advance   │ │
│ │  Meal Allow.  │   Health Check   │ │
│ ├───────────────┴──────────────────┤ │
│ │  NET PAY HIGHLIGHT               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎨 스타일링 정보

### Tailwind 색상 팔레트
모든 컴포넌트는 이미 Tailwind 클래스를 사용합니다:

```tailwind
primary: #004e9f        → bg-primary, text-primary
secondary: #505f76      → bg-secondary, text-secondary
error: #ba1a1a          → bg-error, text-error
success: #2e7d32        → (custom green)
surface: #f9f9f9        → bg-surface
outline: #727784        → border-outline-variant
```

### 폰트 (이미 로드됨)
- **Hanken Grotesk** - 헤더 (20-48px)
- **Inter** - 본문 (12-16px)
- **Material Symbols** - 아이콘

---

## 🔗 API 통합 체크리스트

- [ ] `GET /api/payroll/records` - 기록 목록
- [ ] `GET /api/payroll/records/:id` - 상세 조회
- [ ] `GET /api/payroll/holidays` - 공휴일 목록
- [ ] `POST /api/payroll/holidays` - 공휴일 추가
- [ ] `PUT /api/payroll/holidays/:id` - 공휴일 수정
- [ ] `DELETE /api/payroll/holidays/:id` - 공휴일 삭제
- [ ] `POST /api/payroll/records/:id/approve` - 승인
- [ ] `POST /api/payroll/records/:id/export/pdf` - PDF 내보내기

---

## 📱 반응형 동작

### 모바일 (< 768px)
- **상단 네비:** TopAppBar + 메뉴 버튼
- **하단 네비:** BottomNavBar (고정)
- **레이아웃:** 단일 컬럼
- **카드:** 스택 형태

### 데스크탑 (≥ 768px)
- **상단 네비:** TopAppBar + 링크 메뉴
- **하단 네비:** 숨김
- **레이아웃:** 멀티 컬럼
- **카드:** Flex/Grid

---

## 🧪 로컬 테스트

```bash
# 1. 컴포넌트 렌더링 테스트
npm run dev
# http://localhost:3000/admin/payroll

# 2. TypeScript 타입 검사
npm run build

# 3. 접근성 검증
npm run lint

# 4. 단위 테스트 (선택사항)
npm run test -- PayrollRecords.test.tsx
```

---

## 🚨 알려진 제한사항 & 주의사항

1. **Mock 데이터 사용 중**
   - 모든 컴포넌트는 hardcoded mock 데이터 사용
   - 실제 데이터는 prop이나 API에서 전달 필요

2. **이미지 URL**
   - Google AI 생성 이미지 사용 (임시)
   - 프로덕션에서는 회사 이미지 서버로 교체 필요

3. **아이콘**
   - lucide-react 라이브러리 사용
   - Material Symbols와 혼용되는 부분 조정 필요

4. **상태 관리**
   - 현재 로컬 useState 사용
   - Zustand/Redux로 전역 상태 관리로 업그레이드 권장

---

## 📚 다음 단계

### Phase 1 (즉시)
- [ ] 컴포넌트 페이지 라우팅 설정
- [ ] Mock → API 데이터 연동
- [ ] 이미지 CDN 교체

### Phase 2 (1주일)
- [ ] 상태 관리 (Zustand) 통합
- [ ] 폼 유효성 검사 추가
- [ ] 에러 처리 & 로딩 상태

### Phase 3 (2주일)
- [ ] PDF 생성 라이브러리 (jsPDF) 통합
- [ ] 인쇄 스타일 최적화
- [ ] 접근성 감사 (WCAG AA)

---

## 💡 코드 예시: API 연동

```typescript
// src/app/admin/payroll/components/PayrollRecords.tsx 수정 예

import { useEffect, useState } from 'react';

export default function PayrollRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      const res = await fetch('/api/payroll/records');
      const data = await res.json();
      setRecords(data);
      setLoading(false);
    }
    fetchRecords();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    // ... 기존 JSX ... records.map(...)
  );
}
```

---

## 📞 문제 해결

**Q: TypeScript 에러가 발생합니다**
```bash
# 타입 정의 파일 재생성
rm -rf .next
npm run build
```

**Q: 아이콘이 표시되지 않습니다**
```typescript
// lucide-react import 확인
import { ChevronRight, Download, Print } from 'lucide-react';
```

**Q: Tailwind 색상이 적용되지 않습니다**
```bash
# tailwind.config.js의 색상 정의 확인
# 또는 globals.css의 tailwind 지시어 확인
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

**작성 날짜:** 2026-05-25  
**버전:** 1.0  
**담당자:** AI Developer Agent  
**상태:** Phase 6 완료 ✓ → Phase 7 (배포) 진행 중
