# ElSpa 결제 & 정산 시스템 설계

> 예약의 다중 결제 방식 + SSS 옵션 + 업체 정산 로직

---

## 1️⃣ **결제 방식 (Payment Methods)**

### A. 데이터 모델

```typescript
// 단일 결제 방식
interface PaymentMethod {
  type: 'card' | 'cash' | 'gcash' | 'bankA' | 'bankB';
  amount: number; // 결제 금액
  timestamp?: Date;
}

// 예약의 결제 정보
interface BookingPayment {
  total_amount: number;        // 총액 (₱)
  payment_methods: PaymentMethod[]; // 다중 결제 배열
  status: 'pending' | 'completed' | 'refunded';
}

// 예:
{
  "total_amount": 1800,
  "payment_methods": [
    { "type": "card", "amount": 1000 },
    { "type": "cash", "amount": 500 },
    { "type": "gcash", "amount": 300 }
  ],
  "status": "completed"
}
```

### B. UI 구성 (BookingSheetTable)

```
┌─────────────────────────────────┐
│ Pay 열                           │
├─────────────────────────────────┤
│ 💳 Card: ₱1000                  │
│ 💵 Cash: ₱500                   │
│ 📱 Gcash: ₱300                  │
│ [+ 추가 결제 방식]               │
│                                 │
│ 총액: ₱1800                     │
│ 남은금: ₱0                      │
└─────────────────────────────────┘
```

### C. 구현 흐름

```
1. 초기 상태: 한 개의 payment_method 입력창
   ├─ 방식 선택: card / cash / Gcash / BankA / BankB (Dropdown)
   └─ 금액 입력: ₱0 (Input)

2. "+ 추가" 버튼 클릭
   └─ 새로운 payment_method 입력창 추가

3. 결제 검증
   ├─ sum(amount) == total_amount ✓
   └─ 불일치 시: 경고 표시

4. 저장 시
   └─ payment_methods 배열 저장
```

---

## 2️⃣ **SSS (Social Security System) 옵션**

### A. 데이터 모델

```typescript
interface SSSRecord {
  employee_id: number;
  booking_id: number;
  sss_amount: number;            // SSS 공제액
  sss_status: 'prepaid' | 'hold'; // 선지급 vs 보류
  status: 'pending' | 'paid';
  due_date?: Date;
}

// 예:
{
  "employee_id": 5,
  "booking_id": 1001,
  "sss_amount": 450,
  "sss_status": "prepaid",  // ✅ 선지급 (즉시 회사가 대납)
  "status": "pending"
}

// 또는
{
  "employee_id": 5,
  "booking_id": 1002,
  "sss_amount": 450,
  "sss_status": "hold",  // ⏸️ 보류 (나중에 결정)
  "status": "pending"
}
```

### B. UI 구성 (BookingSheetTable 또는 별도)

```
┌────────────────────────────────────┐
│ SSS 옵션                            │
├────────────────────────────────────┤
│ ○ 선지급 (Prepaid)                │
│   └─ 설명: 회사가 즉시 대납        │
│       SSS 공제액 자동 계산          │
│                                    │
│ ● 보류 (Hold)                     │
│   └─ 설명: 나중에 수집하여 납부    │
│       직원이 별도 기간에 납부       │
│                                    │
│ SSS 공제액: ₱450                   │
└────────────────────────────────────┘
```

### C. 비즈니스 로직

```
급여 정산 시:
├─ Prepaid SSS
│  └─ 이미 회사가 대납했으므로 급여에서 공제만
│     예: 급여 ₱5000 - SSS ₱450 = ₱4550
│
└─ Hold SSS
   └─ 직원에게 수집 후 회사가 납부
      예: 급여 ₱5000 → 수금대기 ₱450 → 미수금 추적
```

---

## 3️⃣ **업체 정산 로직 (Company Settlement)**

### A. 정산 시나리오

| 시나리오 | 손님 지급자 | 정산 여부 | 설명 |
|---------|-----------|---------|------|
| **(업체, 손님)** | 손님 직접 지급 | ✅ YES | 업체가 수수료 받음 (추후 정산) |
| **(업체, 업체)** | 업체 대신 지급 | ❌ NO | 정산 불필요 (내부 처리) |
| **(업체, 외상)** | 나중에 지급 | ✅ YES | 수금 대기 (외상 정산) |

### B. 데이터 모델

```typescript
interface CompanySettlement {
  company_id: number;
  guide_id: number;
  booking_id: number;
  service_amount: number;      // 서비스 금액 (₱)
  commission_rate: number;     // 수수료율 (%)
  commission_amount: number;   // 수수료 금액 (₱)
  payment_from: 'guest' | 'company' | 'credit'; // 지급자
  settlement_status: 'pending' | 'settled' | 'waived';
  settlement_date?: Date;
  notes?: string;
}

// 예 1: (업체, 손님) - 수수료 정산 필요
{
  "company_id": 1,
  "guide_id": 5,
  "booking_id": 1001,
  "service_amount": 2000,
  "commission_rate": 20,
  "commission_amount": 400,
  "payment_from": "guest",     // ✅ 손님이 직접 지급
  "settlement_status": "pending" // → 나중에 업체에 수수료 지급
}

// 예 2: (업체, 업체) - 정산 불필요
{
  "company_id": 1,
  "guide_id": 5,
  "booking_id": 1002,
  "service_amount": 2000,
  "commission_rate": 20,
  "commission_amount": 400,
  "payment_from": "company",   // ❌ 업체가 대신 지급
  "settlement_status": "waived" // → 정산 없음
}

// 예 3: (업체, 외상) - 수금 후 정산
{
  "company_id": 1,
  "guide_id": 5,
  "booking_id": 1003,
  "service_amount": 2000,
  "commission_rate": 20,
  "commission_amount": 400,
  "payment_from": "credit",    // ⏸️ 외상 (나중에 수금)
  "settlement_status": "pending" // → 수금 후 업체에 지급
}
```

### C. 정산 흐름

```
예약 생성 시
├─ payment_from 선택
│  ├─ 손님 지급 (guest)
│  │  └─ → settlement_status = "pending" (정산 대기)
│  │
│  ├─ 업체 지급 (company)
│  │  └─ → settlement_status = "waived" (정산 면제)
│  │
│  └─ 외상 (credit)
│     └─ → settlement_status = "pending" (수금 대기)
│
정산 시점
├─ 손님 지급 건
│  └─ 매달 말: 업체에 수수료 지급 ✓
│
├─ 외상 건
│  ├─ 수금 여부 확인
│  └─ 수금 완료 후: 업체에 수수료 지급 ✓
│
└─ 업체 지급 건
   └─ 정산 스킵 (PASS)
```

---

## 4️⃣ **데이터베이스 스키마**

### Bookings 테이블 확장

```sql
ALTER TABLE bookings ADD COLUMN (
  -- 다중 결제 방식
  payment_methods JSON DEFAULT '[]',
  total_amount DECIMAL(10,2),
  
  -- SSS 옵션
  sss_amount DECIMAL(10,2) DEFAULT 0,
  sss_status ENUM('prepaid', 'hold') DEFAULT 'prepaid',
  
  -- 업체 지급자 정보
  payment_from ENUM('guest', 'company', 'credit') DEFAULT 'guest',
  
  -- 정산 상태
  settlement_status ENUM('pending', 'settled', 'waived') DEFAULT 'pending',
  settlement_date TIMESTAMP NULL
);
```

### Company Settlement 테이블

```sql
CREATE TABLE company_settlements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  guide_id INT NOT NULL,
  booking_id INT NOT NULL UNIQUE,
  service_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  payment_from ENUM('guest', 'company', 'credit'),
  settlement_status ENUM('pending', 'settled', 'waived'),
  settlement_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (guide_id) REFERENCES employees(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX (settlement_status, settlement_date)
);
```

---

## 5️⃣ **UI 구현 계획**

### 파일별 수정 항목

```
📱 Frontend
├─ BookingSheetTable.tsx
│  ├─ Pay 열 → 다중 결제 입력 UI
│  ├─ SSS 옵션 선택 (prepaid/hold)
│  └─ payment_from 선택 (guest/company/credit)
│
├─ components/PaymentMethodInput.tsx (신규)
│  ├─ [+ 추가 결제 방식] 버튼
│  └─ 결제 방식별 입력 폼
│
├─ components/SSSOptionSelect.tsx (신규)
│  ├─ Prepaid (선지급) 라디오
│  └─ Hold (보류) 라디오
│
└─ admin/settlement-report/page.tsx
   ├─ 정산 대상 필터링
   │  └─ payment_from = 'guest' OR 'credit'
   └─ 정산 상태 추적

🐍 Backend
├─ app/models/booking.py
│  ├─ payment_methods: JSON
│  ├─ sss_status: Enum
│  └─ payment_from: Enum
│
└─ app/models/settlement.py (신규)
   └─ CompanySettlement 모델
```

### 구현 우선순위

```
1️⃣ HIGH (필수)
   ├─ PaymentMethodInput 컴포넌트
   ├─ SSS 옵션 UI
   └─ payment_from 선택

2️⃣ MEDIUM (정산)
   ├─ Company Settlement 테이블
   ├─ 정산 대상 필터링
   └─ 정산 상태 추적

3️⃣ LOW (리포팅)
   ├─ 정산 리포트 (매달)
   └─ 외상 추적 대시보드
```

---

## 6️⃣ **예제: 실제 사용 시나리오**

### 시나리오: 손님이 여러 방식으로 결제 + 외상 기업 + SSS 선지급

```json
{
  "id": 2024060501,
  "therapist": "Anna",
  "guest": "Mr. Kim",
  "company": "Pacific Tours",
  "guide": "Marco",
  "treatment": "Swedish Massage",
  "start_time": "06:30",
  "end_time": "08:00",
  "base_price": 2000,
  
  // 결제 방식 (다중)
  "payment_methods": [
    { "type": "card", "amount": 1000 },
    { "type": "cash", "amount": 700 },
    { "type": "gcash", "amount": 300 }
  ],
  "total_amount": 2000,
  
  // SSS 옵션
  "sss_amount": 450,
  "sss_status": "prepaid",  // ✅ 선지급
  
  // 업체 지급 정보
  "payment_from": "credit",  // ⏸️ 외상 (나중에 수금)
  
  // 정산 상태
  "settlement_status": "pending",  // → 수금 후 업체와 정산
  
  // 급여 계산
  "therapist_pay": 1000,           // 기본 급여
  "company_commission": 200,       // 업체 수수료 (20%)
  
  // 정산 레코드 (자동 생성)
  "company_settlement": {
    "company_id": 1,
    "guide_id": 5,
    "commission_amount": 200,
    "payment_from": "credit",
    "settlement_status": "pending",  // 수금 대기
    "notes": "고객 외상, 06/15까지 수금 예정"
  }
}
```

### 급여 정산 (월말)

```
직원 Anna:
├─ 기본 급여: ₱50,000
├─ SSS 공제: -₱450 (선지급)
├─ 추가 커미션: ₱1,200 (예약 6건 × ₱200)
└─ 최종 급여: ₱50,750 ✓

업체 Pacific Tours:
├─ 손님 지급 건: ₱200 × 2 = ₱400 ✓ (수수료)
├─ 외상 건: ₱200 × 1 (수금 대기)
├─ 업체 지급 건: ₱200 × 1 (정산 면제)
└─ 정산액: ₱400 (수금 건 제외) + 외상 ₱200 대기 중
```

---

## 7️⃣ **요약표**

| 항목 | 현재 | 변경 후 | 비고 |
|------|------|--------|------|
| **결제 방식** | 단일 (1개) | 다중 (N개) | card, cash, Gcash, BankA, BankB |
| **SSS** | 없음 | 옵션 선택 | prepaid / hold |
| **지급자** | 손님만 | 3가지 | guest / company / credit |
| **정산** | 전부 | 조건부 | payment_from에 따라 |
| **외상 관리** | 없음 | 추적 | 수금 대기 상태 관리 |

---

## 8️⃣ **다음 단계**

```
1. 데이터베이스 스키마 추가
   └─ bookings 테이블 확장
   └─ company_settlements 테이블 생성

2. PaymentMethodInput 컴포넌트 개발
   └─ 다중 결제 입력 UI

3. SSS 옵션 UI 추가
   └─ Prepaid / Hold 라디오 선택

4. Company Settlement 로직
   └─ 정산 대상 필터링
   └─ 정산 상태 추적

5. 월말 정산 자동화
   └─ 정산 리포트 생성
   └─ 외상 추적 알림
```

---

**담당자:** Claude (AI Assistant)  
**작성일:** 2026-06-02  
**상태:** 📋 설계 완료 → 구현 대기
