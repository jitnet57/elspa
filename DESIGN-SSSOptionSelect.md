# SSSOptionSelect 컴포넌트 설계 문서

**작성일:** 2026-06-02  
**목적:** SSS(사회보장공사) 선지급 vs 보류 옵션 선택 인터페이스 설계  
**대상:** ElSpa 급여 정산 시스템  
**언어:** 한국어 설명 + TypeScript/Python 코드

---

## 📋 목차

1. [개요](#개요)
2. [UI 모형(Mockup)](#ui-모형mockup)
3. [상태 구조(State Structure)](#상태-구조state-structure)
4. [비즈니스 로직(Business Logic)](#비즈니스-로직business-logic)
5. [API 명세](#api-명세)
6. [구현 예시](#구현-예시)

---

## 개요

### 문제 정의

필리핀 SSS(Social Security System)는 직원의 사회보장 기여금을 두 가지 방식으로 정산합니다:

| 옵션 | 설명 | 기준 | 특징 |
|------|------|------|------|
| **Prepaid (선지급)** | 정부 인보이스 기준 | 정부 공식 문서 | 고정액, 즉시 계산 |
| **Hold (보류)** | 실제 근무 기준 | 출퇴근 기록 | 유동액, 더 공정 |

### 해결책

SSSOptionSelect 컴포넌트는:
- 🎯 **직관적 라디오 선택:** Prepaid vs Hold 선택
- 📊 **실시간 급여 영향도:** 선택에 따른 금액 비교
- ✅ **검증 및 제약:** 월 25일 이후 변경 불가
- 📝 **감시 로그:** 모든 변경 기록

---

## UI 모형(Mockup)

### 1. 메인 뷰 (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ 💼 SSS 기여금 정산 방식                                  │
│ September 2024 — 직원 ID: 1                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ◉ 정부 인보이스 선지급              [정부 인보이스]    │
│    정부 인보이스 기준으로 즉시 계산 및 선지급           │
│                                                         │
│  ○ 실제 정산 보류                    [유동적]           │
│    실제 근무 현황에 따라 유연하게 정산                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 📊 급여 영향도                                    ▼ 상세 │
│                                                         │
│ ┌──────────┬──────────┬──────────┬──────────┐          │
│ │Gross     │SSS기여금 │선지급액  │보류액    │          │
│ │₱50,000   │₱2,025   │₱2,025   │₱1,840   │          │
│ └──────────┴──────────┴──────────┴──────────┘          │
│                                                         │
│ [✓ 상세 정보 펼침]                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 💡 중요 안내                                            │
│ • 선지급: 정부 인보이스 기준의 고정액                   │
│ • 보류: 실제 근무 시간/이벤트에 따라 유연한 정산       │
│ • 정산 기한: 매월 25일                                  │
└─────────────────────────────────────────────────────────┘
```

### 2. 상세 정보 펼침 (Expanded)

```
┌─────────────────────────────────────────────────────────┐
│ ... [위의 주요 정보] ...                                │
│                                                         │
│ 정산 예정일: 2024년 9월 25일                            │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💡 세금 영향도                                      │ │
│ │                                                     │ │
│ │ 선지급(Prepaid): ₱2,025.00 — 정부 인보이스 기준   │ │
│ │ 보류(Hold): ₱1,840.00 — 실제 근무 91% 기준       │ │
│ │ 차액: ₱185.00 (9.1%)                             │ │
│ │                                                     │ │
│ │ 📌 선택 시 영향:                                   │ │
│ │ • 선지급 선택: 초과분은 월말 차액 정산             │ │
│ │ • 보류 선택: 실제 근무에 따라 정확한 정산 (더 공정)│ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3. 모바일 뷰 (Mobile - 반응형)

```
┌────────────────────┐
│ 💼 SSS 정산 방식   │
│ Sep 2024 ID: 1    │
├────────────────────┤
│                    │
│ ◉ 정부 인보이스   │
│   선지급           │
│   정부 인보이스... │
│                    │
│ ○ 실제 정산 보류  │
│   실제 근무...     │
│                    │
├────────────────────┤
│ 📊 급여 영향도     │
│ 총급여 ₱50,000    │
│ SSS기여금 ₱2,025  │
│ 선지급액 ₱2,025   │
│ 보류액 ₱1,840     │
│                    │
│ [▼ 상세]          │
├────────────────────┤
│ 💡 중요 안내       │
│ • 선지급: 고정액  │
│ • 보류: 유연액     │
│ • 마감: 25일      │
└────────────────────┘
```

### 4. 상태 표시 (States)

#### 4-1. 활성 상태 (Active)

```
라디오 버튼: 파란색 테두리, 체크마크 표시
배경: 밝은 파란색 (bg-blue-50)
전환: 부드러운 애니메이션 (200ms)
```

#### 4-2. 비활성 상태 (Disabled)

```
라디오 버튼: 회색, 불투명 60%
커서: not-allowed
포인터 이벤트: none
```

#### 4-3. 로딩 상태 (Loading)

```
오버레이: 반투명 흰색 배경 + 블러
아이콘: 회전하는 로더
텍스트: "처리 중..."
```

---

## 상태 구조(State Structure)

### 1. 컴포넌트 Props

```typescript
// SSSOptionSelect.tsx
interface SSSOptionSelectProps {
  employeeId: number;           // 직원 ID
  currentMonth: string;         // 정산 월 (예: "September 2024")
  currentOption: 'prepaid' | 'hold';  // 현재 선택된 옵션
  onOptionChange: (option: 'prepaid' | 'hold') => void;  // 변경 콜백
  payrollImpact: PayrollImpact; // 급여 영향도 데이터
  isLoading?: boolean;          // 로딩 상태
  disabled?: boolean;           // 비활성화 여부
}
```

### 2. 급여 영향도 데이터 구조

```typescript
interface PayrollImpact {
  grossSalary: number;          // 총 급여
  sssContribution: number;      // SSS 기여금 (직원+사주 합계)
  prepaidAmount: number;        // 선지급액 (정부 인보이스 기준)
  holdAmount: number;           // 보류액 (실제 근무 기준)
  taxImplications: string;      // 세금 영향도 설명
  settlementDate: string;       // 정산 예정일
}
```

### 3. Hook 상태 (useSSSOptionSelect)

```typescript
interface SSSOptionSelectHookResult {
  selectedOption: 'prepaid' | 'hold';          // 현재 선택
  payrollImpact: PayrollImpact;               // 급여 영향도
  isLoading: boolean;                         // 로딩 중
  isSaving: boolean;                          // 저장 중
  error: string | null;                       // 에러 메시지
  changeOption: (option: 'prepaid' | 'hold') => void;  // 옵션 변경
  saveOption: () => Promise<void>;            // 저장 (API)
  calculateImpact: () => Promise<PayrollImpact>;  // 영향도 재계산
}
```

### 4. 상태 전환도

```
┌────────────┐
│   Prepaid  │ ◀─── 초기값 (정부 인보이스 기준)
│ (선지급)   │
│   ◯        │
└────────────┘
      │ 사용자 선택
      ▼
┌────────────┐
│    Hold    │
│  (보류)    │
│   ◉        │
└────────────┘
      │ 사용자 선택
      ▼
┌────────────┐
│   Prepaid  │ ◀─── 다시 원래대로
│ (선지급)   │
│   ◉        │
└────────────┘
```

---

## 비즈니스 로직(Business Logic)

### 1. SSS 금액 계산

#### 1-1. Prepaid (선지급) 계산

```python
def calculate_prepaid(
    government_invoice_amount: Decimal
) -> Decimal:
    """
    선지급액 = 정부 인보이스 금액 (변경 불가)
    
    특징:
    - 정부 공식 문서 기준
    - 근무 현황 무관
    - 고정액
    """
    return government_invoice_amount  # 예: ₱2,025.00
```

#### 1-2. Hold (보류) 계산

```python
def calculate_hold(
    sss_contribution: Decimal,
    actual_workdays_worked: int,
    total_workdays_in_month: int
) -> Decimal:
    """
    보류액 = SSS기여금 × (실제근무일 / 전체근무일)
    
    특징:
    - 실제 근무 기반
    - 공정한 정산
    - 유동액
    
    예시:
    - SSS 기여금: ₱2,025.00
    - 실제 근무: 20일 / 22일 = 90.9%
    - 보류액: ₱2,025.00 × 0.909 = ₱1,840.00
    """
    if total_workdays_in_month == 0:
        return sss_contribution
    
    ratio = Decimal(actual_workdays_worked) / Decimal(total_workdays_in_month)
    return sss_contribution * ratio
```

### 2. 변경 가능 여부 검증

```python
def validate_sss_option_change(
    current_option: str,
    new_option: str,
    current_month: str,
    days_remaining_in_month: int
) -> Tuple[bool, str]:
    """
    변경 가능 여부 검증
    
    규칙:
    1. 동일 옵션 재선택 불가
    2. 월 25일 이후 변경 불가 (정산 마감)
    3. 이전 월 변경 불가
    """
    
    # 규칙 1: 동일 옵션 확인
    if current_option == new_option:
        return False, "현재와 동일한 옵션을 선택했습니다"
    
    # 규칙 2: 정산 마감일 확인
    if days_remaining_in_month < 0:
        return False, "정산 기한(25일)이 지났습니다. 이월에 변경 가능합니다"
    
    # 규칙 3: 이전 월 변경 불가 (API에서 체크)
    
    return True, "옵션 변경 가능"
```

### 3. 차액 계산 및 권장사항

```python
def calculate_sss_difference(
    prepaid_amount: Decimal,
    hold_amount: Decimal,
    gross_salary: Decimal
) -> dict:
    """
    Prepaid vs Hold 차액 분석
    """
    
    difference = abs(prepaid_amount - hold_amount)
    percentage = (difference / gross_salary * 100) if gross_salary > 0 else 0
    
    # 권장사항 생성
    recommendation = (
        "보류(Hold) 선택 권장 — 실제 근무에 따른 정확한 정산"
        if prepaid_amount > hold_amount
        else "선지급(Prepaid) 선택 권장 — 고정액 보장"
    )
    
    return {
        "difference": float(difference),
        "percentage": float(percentage),
        "recommendation": recommendation
    }
```

### 4. 감시 로그 기록

```python
async def log_sss_option_change(
    employee_id: int,
    month: str,
    previous_option: str,
    new_option: str,
    user_id: str,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None
) -> None:
    """
    SSS 옵션 변경 감시 로그 기록
    
    기록 항목:
    - 직원 ID
    - 정산 월
    - 이전 옵션 / 변경 후 옵션
    - 변경자 (user_id)
    - 변경 시간
    - 변경 사유 (선택)
    - IP 주소 (선택)
    
    사용 사례:
    - 감시 추적
    - 분쟁 해결
    - 규정 준수
    """
    
    log = SSSOptionAuditLog(
        employee_id=employee_id,
        month=month,
        previous_option=previous_option,
        selected_option=new_option,
        changed_by_user_id=user_id,
        changed_at=datetime.utcnow(),
        reason=reason,
        ip_address=ip_address
    )
    
    db.add(log)
    await db.commit()
```

---

## API 명세

### 1. 월별 급여 요약 조회

**엔드포인트:** `GET /api/payroll/employees/{employeeId}/monthly-summary`

**쿼리 파라미터:**
```
month: string (예: "September 2024")
```

**응답:**
```json
{
  "employee_id": 1,
  "employee_name": "Juan Dela Cruz",
  "current_month": "September 2024",
  "gross_salary": 50000.00,
  "sss_contribution": 2025.00,
  "government_invoice_amount": 2025.00,
  "workdays_in_month": 22,
  "actual_workdays_worked": 20,
  "current_sss_option": "prepaid",
  "payroll_impact": {
    "gross_salary": 50000.00,
    "sss_contribution": 2025.00,
    "prepaid_amount": 2025.00,
    "hold_amount": 1840.00,
    "tax_implications": "선지급(Prepaid): ₱2,025.00...",
    "settlement_date": "2024-09-25"
  }
}
```

### 2. SSS 옵션 변경

**엔드포인트:** `PUT /api/payroll/employees/{employeeId}/sss-option`

**요청 본문:**
```json
{
  "option": "hold",
  "month": "September 2024",
  "notes": "유동적 정산 선호"
}
```

**응답:**
```json
{
  "employee_id": 1,
  "month": "September 2024",
  "previous_option": "prepaid",
  "updated_option": "hold",
  "updated_at": "2024-09-15T10:30:00",
  "payroll_impact": {
    "gross_salary": 50000.00,
    "sss_contribution": 2025.00,
    "prepaid_amount": 2025.00,
    "hold_amount": 1840.00,
    "tax_implications": "...",
    "settlement_date": "2024-09-25"
  }
}
```

### 3. SSS 옵션 히스토리 조회

**엔드포인트:** `GET /api/payroll/employees/{employeeId}/sss-option-history`

**응답:**
```json
[
  {
    "month": "September 2024",
    "selected_option": "hold",
    "changed_at": "2024-09-15T10:30:00",
    "changed_by_user_id": "admin-001",
    "reason": "유동적 정산 선호"
  },
  {
    "month": "August 2024",
    "selected_option": "prepaid",
    "changed_at": "2024-08-20T14:15:00",
    "changed_by_user_id": "admin-001",
    "reason": null
  }
]
```

---

## 구현 예시

### 1. 프론트엔드 사용 예시

```typescript
// pages/payroll/sss-option.tsx
'use client';

import { SSSOptionSelect } from '@/components/SSSOptionSelect';
import { useSSSOptionSelect } from '@/hooks/useSSSOptionSelect';
import { useState } from 'react';

export default function SSSOptionPage({ params }: { params: { employeeId: string } }) {
  const employeeId = parseInt(params.employeeId);
  const currentMonth = "September 2024";
  
  const {
    selectedOption,
    payrollImpact,
    isLoading,
    isSaving,
    error,
    changeOption,
    saveOption,
  } = useSSSOptionSelect(
    employeeId,
    currentMonth,
    'prepaid',
    async (option) => {
      // 저장 완료 후 처리
      console.log(`✅ SSS 옵션 저장됨: ${option}`);
    }
  );

  const handleSave = async () => {
    try {
      await saveOption();
      // 성공 토스트 표시
    } catch (err) {
      // 에러 토스트 표시
    }
  };

  if (error) {
    return <div className="text-red-600">에러: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <SSSOptionSelect
        employeeId={employeeId}
        currentMonth={currentMonth}
        currentOption={selectedOption}
        onOptionChange={changeOption}
        payrollImpact={payrollImpact}
        isLoading={isLoading}
        disabled={isSaving}
      />
      
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
        >
          취소
        </button>
      </div>
    </div>
  );
}
```

### 2. 백엔드 구현 예시

```python
# app/routers/sss_option.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.sss_option_service import SSSOptionService
from app.schemas.sss_option import (
    MonthlySummaryResponse,
    SSSOptionUpdateRequest,
    SSSOptionUpdateResponse
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/payroll", tags=["sss-option"])

@router.get("/employees/{employee_id}/monthly-summary", response_model=MonthlySummaryResponse)
async def get_monthly_summary(
    employee_id: int,
    month: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """직원의 월별 급여 요약 조회"""
    service = SSSOptionService(db)
    
    try:
        summary = await service.get_monthly_summary(employee_id, month)
        return MonthlySummaryResponse(**summary)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/employees/{employee_id}/sss-option", response_model=SSSOptionUpdateResponse)
async def update_sss_option(
    employee_id: int,
    request: SSSOptionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """SSS 옵션 변경"""
    service = SSSOptionService(db)
    
    try:
        result = await service.update_sss_option(
            employee_id=employee_id,
            month=request.month,
            new_option=request.option,
            user_id=current_user.get("user_id"),
            notes=request.notes,
            ip_address=current_user.get("ip_address")
        )
        return SSSOptionUpdateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 파일 목록

| 파일 경로 | 설명 |
|----------|------|
| `frontend/src/components/SSSOptionSelect.tsx` | 메인 컴포넌트 |
| `frontend/src/hooks/useSSSOptionSelect.ts` | 상태 관리 Hook |
| `app/schemas/sss_option.py` | 백엔드 Pydantic 스키마 |
| `app/services/sss_option_service.py` | 비즈니스 로직 서비스 |
| `app/routers/sss_option.py` | API 라우터 (별도 구현) |
| `app/models/sss_option.py` | ORM 모델 (별도 구현) |

---

## 번역 키 (i18n)

```typescript
{
  'sss_option_title': 'SSS 기여금 정산 방식',
  'sss_option_subtitle': '{month} — 직원 ID: {employeeId}',
  
  'sss_option_prepaid_label': '정부 인보이스 선지급',
  'sss_option_prepaid_desc': '정부 인보이스 기준으로 즉시 계산 및 선지급',
  
  'sss_option_hold_label': '실제 정산 보류',
  'sss_option_hold_desc': '실제 근무 현황에 따라 유연하게 정산',
  
  'sss_badge_government': 'Government Invoice',
  'sss_badge_flexible': 'Flexible',
  
  'sss_payroll_impact': '급여 영향도',
  'sss_gross_salary': 'Gross Salary',
  'sss_contribution': 'SSS Contribution',
  'sss_prepaid_amount': 'Prepaid Amount',
  'sss_hold_amount': 'Hold Amount',
  'sss_settlement_date': 'Settlement Date',
  'sss_tax_implications': '세금 영향도',
  
  'sss_important_note': '중요 안내',
  'sss_note_prepaid': '선지급: 정부 인보이스 기준의 고정액',
  'sss_note_hold': '보류: 실제 근무 시간/이벤트에 따라 유연한 정산',
  'sss_note_settlement': '정산 기한: 매월 25일',
  
  'sss_processing': '처리 중...',
}
```

---

## 참고 사항

### SSS 규칙 (필리핀)

1. **선지급 (Prepaid)**
   - 정부 공식 인보이스 기준
   - 매월 25일 이전 지급
   - 고정액

2. **보류 (Hold)**
   - 실제 근무 기반
   - 차월 5일 이내 정산
   - 유동액

3. **변경 마감**
   - 매월 25일 이후 변경 불가
   - 예: 9월 25일 이후 변경 시 → 10월에 적용

### 성능 최적화

- 급여 데이터 캐싱 (5분)
- 이미지 Lazy Loading
- API 요청 디바운싱

### 접근성 (a11y)

- ARIA 라벨 추가
- 키보드 네비게이션 지원
- 화면 읽기 프로그램 호환성

---

**문서 버전:** 1.0  
**최종 업데이트:** 2026-06-02  
**담당자:** ElSpa 개발팀
