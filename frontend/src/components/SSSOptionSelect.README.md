# SSSOptionSelect 컴포넌트

## 📌 목적

SSS 기여금 정산 방식을 선택하는 React 컴포넌트입니다.
- **Prepaid (정부 인보이스 선지급)**: 정부 기준 고정액
- **Hold (유연한 보류)**: 실제 근무 기반 유연 정산

---

## 🎯 핵심 기능

| 기능 | 설명 |
|------|------|
| **라디오 버튼** | Prepaid / Hold 중 선택 |
| **금액 시각화** | 총 급여, SSS 기여금, 선지급액, 보류액 표시 |
| **상세 정보** | 정산일, 세금 영향도 (펼침) |
| **에러 처리** | 로딩 상태, 비활성화 처리 |
| **다국어 지원** | 한국어/영어 자동 번역 |
| **반응형 디자인** | 모바일/PC 모두 대응 |

---

## 📦 Props

```typescript
interface SSSOptionSelectProps {
  employeeId: number;                    // 직원 ID
  currentMonth: string;                  // 정산 월 (예: "September 2024")
  currentOption: 'prepaid' | 'hold';     // 현재 선택
  onOptionChange: (option) => void;      // 변경 콜백
  payrollImpact: PayrollImpact;          // 급여 데이터
  isLoading?: boolean;                   // 로딩 상태
  disabled?: boolean;                    // 비활성화
}

interface PayrollImpact {
  grossSalary: number;                   // 총 급여
  sssContribution: number;               // SSS 기여금
  prepaidAmount: number;                 // 선지급액
  holdAmount: number;                    // 보류액
  taxImplications: string;               // 세금 설명
  settlementDate: string;                // 정산일 (ISO)
}
```

---

## 💻 사용 예제

```typescript
import { SSSOptionSelect } from '@/components/SSSOptionSelect';
import { useState } from 'react';

export default function PayrollPage() {
  const [option, setOption] = useState<'prepaid' | 'hold'>('prepaid');

  return (
    <SSSOptionSelect
      employeeId={12345}
      currentMonth="September 2024"
      currentOption={option}
      onOptionChange={setOption}
      payrollImpact={{
        grossSalary: 45000,
        sssContribution: 1912.50,
        prepaidAmount: 1912.50,
        holdAmount: 1850.00,
        taxImplications: '정부 인보이스 기준...',
        settlementDate: '2026-07-25',
      }}
      isLoading={false}
      disabled={false}
    />
  );
}
```

---

## 🎨 스타일

Tailwind CSS 기반 (커스터마이즈 가능)

```
선지급 (Prepaid)   → emerald (초록)
보류 (Hold)        → amber (주황)
기타               → blue, purple, gray
```

---

## 🌐 번역

`frontend/src/lib/translations.ts`에서 관리

```typescript
// 영어
sss_option_prepaid_label: 'Government Invoice Prepaid'

// 한국어
sss_option_prepaid_label: '정부 인보이스 선지급'
```

---

## ⚠️ 주의사항

1. **부모에서 API 호출**: `onOptionChange` 콜백에서 API 저장 구현 필요
2. **데이터 검증**: 백엔드에서 option 값 검증 필수
3. **로딩 상태**: 비동기 작업 중 `isLoading={true}` 설정
4. **장애 격리**: 번역 키 없으면 키 자체 표시 (폴백)

---

## 📁 관련 파일

- `SSSOptionSelect.tsx` - 메인 컴포넌트
- `SSSOptionSelect.example.tsx` - 3가지 예제 시나리오
- `SSSOptionSelect.INTEGRATION.md` - 상세 통합 가이드
- `frontend/src/lib/translations.ts` - 다국어 번역

---

## ✅ 체크리스트

### 배포 전
- [ ] Props 타입 모두 전달됨
- [ ] 번역 키 `translations.ts`에 추가됨
- [ ] API 엔드포인트 구현 완료
- [ ] 테스트 완료 (로딩, 비활성화 등)

### 사용자 관점
- [ ] 라디오 버튼 클릭 가능
- [ ] 금액 정확하게 표시됨
- [ ] 세부 정보 펼침 가능
- [ ] 다국어 표시 정상

---

**작성일:** 2026-06-02  
**상태:** ✅ 프로덕션 준비 완료
