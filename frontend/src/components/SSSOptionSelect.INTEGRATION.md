# SSSOptionSelect 컴포넌트 - 통합 가이드

## 📋 개요

`SSSOptionSelect`는 ElSpa 급여 정산 시스템에서 **SSS 기여금 정산 방식**을 선택하는 라디오 버튼 컴포넌트입니다.

- **Prepaid (정부 인보이스 선지급)**: 정부 인보이스 기준의 고정액
- **Hold (유연한 보류)**: 실제 근무 시간/이벤트 기반 유연한 정산

---

## 🎯 주요 기능

### 1. 라디오 버튼 선택
```
[ ● ] 정부 인보이스 선지급      ✓
[ ○ ] 유연한 보류
```

### 2. SSS 금액 시각화
```
┌─────────────────────────────────────────┐
│ 총 급여         │ SSS 기여금          │
│ ₱45,000        │ ₱1,912.50          │
├─────────────────────────────────────────┤
│ 선지급액       │ 보류액              │
│ ₱1,912.50      │ ₱1,850.00           │
└─────────────────────────────────────────┘
```

### 3. 상세 정보 펼침
```
정산 예정일: 2026-07-25
세금 영향도: 선지급은 고정액 기준... (상세 설명)
```

### 4. 에러 처리
- ✅ 로딩 상태 (isLoading) 처리
- ✅ 비활성화 상태 (disabled) 처리
- ✅ 잘못된 옵션 선택 방지

### 5. 다국어 지원
- 영어 (en): English labels
- 한국어 (ko): 한글 라벨

---

## 🔌 Props 인터페이스

```typescript
interface SSSOptionSelectProps {
  employeeId: number;                    // 직원 ID (필수)
  currentMonth: string;                  // 현재 정산 월 (필수)
                                         // 예: "September 2024"
  currentOption: 'prepaid' | 'hold';     // 현재 선택 옵션 (필수)
  onOptionChange: (option: 'prepaid' | 'hold') => void;  // 콜백 (필수)
  payrollImpact: PayrollImpact;          // 급여 데이터 (필수)
  isLoading?: boolean;                   // 로딩 상태 (기본값: false)
  disabled?: boolean;                    // 비활성화 (기본값: false)
}

interface PayrollImpact {
  grossSalary: number;                   // 총 급여 (예: 45000)
  sssContribution: number;               // SSS 기여금 (예: 1912.50)
  prepaidAmount: number;                 // 선지급액 (예: 1912.50)
  holdAmount: number;                    // 보류액 (예: 1850.00)
  taxImplications: string;               // 세금 영향도 설명 문자열
  settlementDate: string;                // 정산 예정일 (ISO 형식)
}
```

---

## 📝 사용 예제

### 기본 사용법

```typescript
'use client';

import { useState } from 'react';
import { SSSOptionSelect, PayrollImpact } from '@/components/SSSOptionSelect';

export default function PayrollSettlementPage() {
  const [sssOption, setSssOption] = useState<'prepaid' | 'hold'>('prepaid');
  const [isLoading, setIsLoading] = useState(false);

  // 급여 데이터 (API에서 가져오거나 하드코딩)
  const payrollData: PayrollImpact = {
    grossSalary: 45000,
    sssContribution: 1912.50,
    prepaidAmount: 1912.50,
    holdAmount: 1850.00,
    taxImplications: '선지급 옵션은 정부 인보이스 기준...',
    settlementDate: '2026-07-25',
  };

  // SSS 옵션 변경 핸들러
  const handleSSSChange = async (option: 'prepaid' | 'hold') => {
    setSssOption(option);
    setIsLoading(true);

    try {
      // API 호출: POST /api/employees/:id/sss-option
      const response = await fetch(
        `/api/employees/${employeeId}/sss-option`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update SSS option');
      }

      // 성공 메시지 표시
      console.log('SSS option updated:', option);
    } catch (error) {
      console.error('Error:', error);
      // 사용자에게 에러 알림
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8">
      <SSSOptionSelect
        employeeId={12345}
        currentMonth="September 2024"
        currentOption={sssOption}
        onOptionChange={handleSSSChange}
        payrollImpact={payrollData}
        isLoading={isLoading}
        disabled={false}
      />
    </div>
  );
}
```

---

## 🔄 상태 관리 플로우

```
1. 초기 로드
   ├─ currentOption 프롭으로 "prepaid" 또는 "hold" 설정
   └─ selectedOption state 초기화

2. 사용자 상호작용
   ├─ 라디오 버튼 클릭
   ├─ handleOptionChange() 호출
   └─ selectedOption 업데이트

3. 콜백 실행
   ├─ onOptionChange(option) 호출
   └─ 부모 컴포넌트에 변경 알림

4. API 저장 (부모 책임)
   ├─ POST /api/employees/:id/sss-option
   ├─ 데이터베이스에 저장
   └─ 성공/실패 응답

5. UI 업데이트
   ├─ 금액 정보 자동 업데이트
   └─ 영향도 정보 표시
```

---

## 🌐 다국어 지원

### 번역 키 목록

| 키 | 영어 | 한국어 |
|----|------|--------|
| `sss_option_title` | SSS Contribution Settlement Method | SSS 기여금 정산 방식 |
| `sss_option_prepaid_label` | Government Invoice Prepaid | 정부 인보이스 선지급 |
| `sss_option_hold_label` | Flexible Hold | 유연한 보류 |
| `sss_payroll_impact` | Payroll Impact | 급여 영향도 |
| `sss_gross_salary` | Gross Salary | 총 급여 |
| `sss_contribution` | SSS Contribution | SSS 기여금 |
| `sss_prepaid_amount` | Prepaid Amount | 선지급액 |
| `sss_hold_amount` | Hold Amount | 보류액 |
| `sss_settlement_date` | Settlement Date | 정산 예정일 |
| `sss_important_note` | Important Notice | 중요 안내 |

### 번역 파일 위치

```
frontend/src/lib/translations.ts
```

### 언어 변경 방법

```typescript
import { useLanguage } from '@/lib/LanguageContext';

const { language, setLanguage } = useLanguage();

// 언어 변경
setLanguage('ko'); // 한국어
setLanguage('en'); // 영어
```

---

## 🎨 스타일 커스터마이징

### Tailwind CSS 클래스

```typescript
// 라디오 버튼 컨테이너
className="relative flex items-start p-4 rounded-lg border-2"

// 뱃지 색상 (emerald, amber, blue)
className="bg-emerald-100 text-emerald-800 border-emerald-300"

// 금액 박스 (그래디언트)
className="bg-gradient-to-br from-blue-50 to-blue-100"
```

### 색상 팔레트

```
선지급 (Prepaid)
  - 배경: emerald (초록)
  - 강조: emerald-600

보류 (Hold)
  - 배경: amber (주황)
  - 강조: amber-600

기타
  - 중립: gray, blue, purple
```

---

## ⚠️ 에러 처리

### 1. 잘못된 옵션 선택
```typescript
// ❌ 안됨
onOptionChange('invalid'); // 에러!

// ✅ 됨
onOptionChange('prepaid');  // OK
onOptionChange('hold');     // OK
```

### 2. 로딩 상태
```typescript
// isLoading={true}일 때:
// - 라디오 버튼 비활성화 (disabled)
// - 오버레이 표시
// - "처리 중..." 메시지 표시
```

### 3. 비활성화 상태
```typescript
// disabled={true}일 때:
// - 모든 상호작용 불가
// - 불투명 처리 (opacity-60)
// - "읽기 전용" 상태
```

---

## 🔐 데이터 검증

### 백엔드 검증 (FastAPI)

```python
# app/routers/employees.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class SSSOptionUpdate(BaseModel):
    option: str  # "prepaid" 또는 "hold"

@router.post("/employees/{employee_id}/sss-option")
async def update_sss_option(employee_id: int, data: SSSOptionUpdate):
    # 1. 옵션 검증
    if data.option not in ["prepaid", "hold"]:
        raise HTTPException(status_code=400, detail="Invalid SSS option")
    
    # 2. 직원 존재 확인
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # 3. 기존 기록 조회 (히스토리)
    existing = db.query(SSSOption).filter(
        SSSOption.employee_id == employee_id,
        SSSOption.month == current_month,
    ).first()
    
    # 4. 업데이트 또는 생성
    if existing:
        existing.option = data.option
    else:
        sss_option = SSSOption(
            employee_id=employee_id,
            month=current_month,
            option=data.option,
        )
        db.add(sss_option)
    
    # 5. 저장 및 응답
    db.commit()
    return {
        "status": "success",
        "employee_id": employee_id,
        "option": data.option,
        "updated_at": datetime.now(),
    }
```

---

## 📊 SSS 기여금 계산 규칙 (필독!)

### Prepaid (정부 인보이스 선지급)
```
SSS 기여금 = Gross Salary × 3.63% (Employee) + 4.25% (Employer)
           = Gross Salary × 7.88%

선지급액 = SSS 기여금 (고정)
정산일: 매월 25일
```

### Hold (유연한 보류)
```
SSS 기여금 = Gross Salary × 3.63% (Employee) + 4.25% (Employer)
           = Gross Salary × 7.88%

실제 보류액 = SSS 기여금 × (실제 근무 시간 / 예상 근무 시간)
정산일: 매월 25일
```

### 예시

```
직원: John
월급: ₱45,000
SSS 기여금: ₱45,000 × 7.88% = ₱3,546

옵션 A: Prepaid
  선지급액: ₱3,546 (고정, 즉시 공제)

옵션 B: Hold
  보류액: ₱3,546 × (실제 근무시간 / 예상 근무시간)
  예) 실제 근무 90% → ₱3,191.40
  정산일: 2026-07-25
```

---

## 🐛 디버깅 팁

### 1. 번역이 안 나올 때
```typescript
// 확인 1: translations.ts에 키가 있는지 확인
// 확인 2: 언어 콘텍스트가 로드되었는지 확인
const { language } = useLanguage();
console.log('Current language:', language);

// 확인 3: getTranslations() 반환값 확인
const t = getTranslations();
console.log('Translation object:', t);
```

### 2. 라디오 버튼이 반응하지 않을 때
```typescript
// 확인 1: onOptionChange 콜백이 호출되는지 확인
const handleOptionChange = (option) => {
  console.log('Option changed to:', option);
  onOptionChange(option);
};

// 확인 2: disabled 또는 isLoading이 true인지 확인
console.log('isLoading:', isLoading, 'disabled:', disabled);
```

### 3. 금액이 잘못 표시될 때
```typescript
// 확인 1: payrollImpact 데이터 확인
console.log('Payroll Impact:', payrollImpact);

// 확인 2: 통화 포맷 함수 확인
const formatted = formatPHP(1912.50);
console.log('Formatted:', formatted); // "₱1,912.50"
```

---

## 📁 파일 구조

```
frontend/src/
├── components/
│   ├── SSSOptionSelect.tsx               ← 메인 컴포넌트
│   ├── SSSOptionSelect.example.tsx       ← 예제 (테스트용)
│   └── SSSOptionSelect.INTEGRATION.md    ← 이 파일
├── lib/
│   ├── translations.ts                   ← 번역 파일
│   └── LanguageContext.tsx               ← 언어 콘텍스트
└── app/
    └── (payroll-related-pages)/
```

---

## 🚀 배포 체크리스트

- [ ] 번역 키 모두 `translations.ts`에 추가됨
- [ ] Props 타입 검증 완료
- [ ] 로딩/비활성화 상태 테스트 완료
- [ ] 다국어 표시 확인 (한글/영어)
- [ ] 금액 포맷 정확성 확인 (PHP)
- [ ] 반응형 레이아웃 확인 (모바일/PC)
- [ ] 에러 메시지 처리 완료
- [ ] API 엔드포인트 구현 완료
- [ ] Git 커밋 및 푸시 완료

---

## 📞 문제 해결

### Q: 선택한 옵션이 저장되지 않음
A: 부모 컴포넌트의 `onOptionChange` 콜백에서 API 호출이 성공적으로 이루어지는지 확인하세요.

### Q: 번역이 공란으로 표시됨
A: `translations.ts`에서 해당 언어(en/ko)에 키가 정의되어 있는지 확인하세요.

### Q: 금액이 `NaN`으로 표시됨
A: `payrollImpact`의 각 금액 필드가 number 타입인지 확인하세요.

### Q: 로딩 오버레이가 보이지 않음
A: `isLoading={true}`가 올바르게 전달되었는지 확인하고, 컴포넌트에 `position: relative` 스타일이 있는지 확인하세요.

---

## 📚 참고 자료

- [SSSOptionSelect.tsx](./SSSOptionSelect.tsx) - 메인 컴포넌트 코드
- [SSSOptionSelect.example.tsx](./SSSOptionSelect.example.tsx) - 사용 예제
- [translations.ts](/src/lib/translations.ts) - 다국어 번역 파일
- [LanguageContext.tsx](/src/lib/LanguageContext.tsx) - 언어 관리

---

**최종 업데이트:** 2026-06-02  
**작성자:** jitnet-gif  
**상태:** ✅ 프로덕션 준비 완료
