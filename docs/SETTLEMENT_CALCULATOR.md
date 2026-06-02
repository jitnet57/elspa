# 정산 계산 로직 (Settlement Calculator)

> ElSpa의 예약 정산 자동화 핵심 모듈
> 경로: `app/services/settlement_calculator.py`

---

## 📋 개요

정산 계산 모듈은 **예약(Booking)에서 정산(Settlement)**으로 변환되는 전 과정을 자동화합니다.

```
Booking → calculate_commission() → 커미션 계산
       → auto_create_settlement() → 정산 자동 생성
       → bulk_settle_monthly() → 월간 일괄 정산
```

---

## 🎯 3가지 핵심 함수

### 1️⃣ `calculate_commission(booking) → Decimal`

**목적:** 예약의 플랫폼 수수료(커미션)를 계산합니다.

#### 📝 함수 시그니처
```python
def calculate_commission(booking: Booking) -> Decimal:
    """
    예약의 커미션액을 계산합니다.
    
    Returns:
        Decimal: 커미션액 (항상 >= 0)
    """
```

#### 🔧 계산 규칙

| 조건 | 커미션율 | 예시 |
|------|---------|------|
| **일반 완료 예약** | 25% | 5000 × 25% = 1250 |
| **취소 예약** (status='cancelled') | 0% | 0 |
| **환불 예약** (status='refunded') | 0% | 0 |

#### 💻 사용 예시

```python
from app.services.settlement_calculator import calculate_commission
from app.models.booking import Booking

# 데이터베이스에서 예약 조회
booking = db.query(Booking).filter(Booking.id == 123).first()

# 커미션 계산
commission = calculate_commission(booking)
print(f"커미션: {commission} PHP")  # 커미션: 1250 PHP
```

#### ⚠️ 에러 처리

```python
try:
    commission = calculate_commission(None)
except ValueError as e:
    print(f"에러: {e}")  # 에러: Booking object cannot be None
```

---

### 2️⃣ `auto_create_settlement(booking, db, created_by) → CompanySettlement`

**목적:** 예약의 지급 방식(`payment_from`)에 따라 자동으로 정산을 생성합니다.

#### 📝 함수 시그니처
```python
def auto_create_settlement(
    booking: Booking,
    db: Session,
    created_by: Optional[str] = None
) -> CompanySettlement:
    """
    예약의 payment_from 필드에 따라 자동으로 정산을 생성합니다.
    
    Returns:
        CompanySettlement: 생성된 정산 기록
    """
```

#### 🔧 정산 규칙 (3가지)

##### **Rule 1: payment_from = 'guest'** (손님 외상)

```
상황: 손님이 나중에 결제하기로 약속
      → 회수 불확실하므로 회수율 낮음

정산 상태: 'pending' (대기)
회수율: 80%
정산 카테고리: 'credit'

예시:
  - 예약 금액: 5000 PHP
  - 회수액: 5000 × 80% = 4000 PHP
  - 수수료: 5000 × 25% = 1250 PHP
  - 순정산액: 4000 - 1250 = 2750 PHP
```

##### **Rule 2: payment_from = 'company'** (회사 정산 제외)

```
상황: 회사에서 직접 지급하는 경우
      → 정산에서 제외

정산 상태: 'waived' (제외)
회수율: 0%
정산 카테고리: 'waived'

예시:
  - 예약 금액: 3000 PHP
  - 회수액: 0 PHP (정산 안함)
  - 순정산액: 0 PHP
```

##### **Rule 3: payment_from = 'credit'** (신용카드/선지급)

```
상황: 신용카드 선지급 또는 회사 신용
      → 나중에 회수 예정

정산 상태: 'pending' (대기)
회수율: 100%
정산 카테고리: 'credit'

예시:
  - 예약 금액: 10000 PHP
  - 회수액: 10000 × 100% = 10000 PHP
  - 수수료: 10000 × 25% = 2500 PHP
  - 순정산액: 10000 - 2500 = 7500 PHP
```

#### 💻 사용 예시

```python
from app.services.settlement_calculator import auto_create_settlement

# 시나리오 1: 손님 외상 (Rule 1)
booking = db.query(Booking).filter(Booking.id == 101).first()
booking.payment_from = 'guest'

settlement = auto_create_settlement(booking, db, created_by='app_user')
print(f"정산 상태: {settlement.status}")  # draft
print(f"회수율: {settlement.recovery_rate}%")  # 80%
print(f"회수액: {settlement.recovered_amount} PHP")  # 4000

# 시나리오 2: 회사 정산 제외 (Rule 2)
booking = db.query(Booking).filter(Booking.id == 102).first()
booking.payment_from = 'company'

settlement = auto_create_settlement(booking, db)
print(f"정산 상태: {settlement.status}")  # waived
print(f"회수율: {settlement.recovery_rate}%")  # 0%

# 시나리오 3: 신용카드 선지급 (Rule 3)
booking = db.query(Booking).filter(Booking.id == 103).first()
booking.payment_from = 'credit'

settlement = auto_create_settlement(booking, db)
print(f"정산 상태: {settlement.status}")  # draft
print(f"회수율: {settlement.recovery_rate}%")  # 100%
```

#### 📊 생성되는 정산 기록 구조

```python
CompanySettlement(
    company_id=booking.therapist_id,
    settlement_period_year=2026,
    settlement_period_month=6,
    
    # 매출 분류
    total_revenue=5000,
    guest_revenue=0,
    credit_revenue=5000,
    waived_revenue=0,
    
    # 회수
    recovery_rate=80,
    recovered_amount=4000,
    
    # 수수료
    platform_fee_rate=25,
    platform_fee=1250,
    
    # 순정산액
    net_settlement=2750,  # 4000 - 1250
    
    # 상태
    status='draft',
    created_by='system'
)
```

---

### 3️⃣ `bulk_settle_monthly(year, month, db, company_id, settled_by) → List[CompanySettlement]`

**목적:** 특정 월의 모든 정산을 일괄 처리합니다. (approved → settled)

#### 📝 함수 시그니처
```python
def bulk_settle_monthly(
    year: int,
    month: int,
    db: Session,
    company_id: Optional[int] = None,
    settled_by: Optional[str] = None
) -> List[CompanySettlement]:
    """
    특정 월의 모든 정산을 일괄 처리합니다.
    
    Returns:
        List[CompanySettlement]: 처리된 정산 목록
    """
```

#### 🔧 처리 워크플로우

```
Step 1: 대상 정산 조회
        ↓
Step 2: status='approved'인 정산만 필터
        ↓
Step 3: 각 정산 상태 전환 (approved → settled)
        ↓
Step 4: 지급 정보 입력
        ↓
Step 5: DB 저장
        ↓
Result: 처리된 정산 목록 반환
```

#### 💻 사용 예시

```python
from app.services.settlement_calculator import bulk_settle_monthly

# 시나리오 1: 전체 월간 정산
result = bulk_settle_monthly(
    year=2026,
    month=6,
    db=db,
    settled_by='admin_user'
)
print(f"처리된 정산: {len(result)}개")

# 시나리오 2: 특정 업체만 정산
result = bulk_settle_monthly(
    year=2026,
    month=6,
    db=db,
    company_id=1,
    settled_by='finance_team'
)
print(f"Company #1 정산: {len(result)}개")

# 시나리오 3: 12월 정산 (다음해 1월 지급)
result = bulk_settle_monthly(
    year=2025,
    month=12,
    db=db,
    settled_by='year_end_process'
)
for settlement in result:
    print(f"지급일: {settlement.payment_date}")
    # 지급일: 2025-12-31
```

#### 📋 필터 조건

| 조건 | 설명 |
|------|------|
| `settlement_period_year` | 정산 연도 |
| `settlement_period_month` | 정산 월 (1-12) |
| `status` | 'approved'만 처리 |
| `company_id` | 선택적 (None이면 전체) |

#### 📊 반환 데이터

```python
settlements = [
    CompanySettlement(
        id=1,
        status='settled',  # approved → settled 변경됨
        payment_date=date(2026, 6, 30),
        paid_by='admin_user',
        net_settlement=Decimal(7500),
        ...
    ),
    CompanySettlement(
        id=2,
        status='settled',
        payment_date=date(2026, 6, 30),
        paid_by='admin_user',
        ...
    ),
]
```

---

## 🎨 함수 간 관계도

```
┌─────────────────────────────────────────────────────┐
│                    Booking 예약                      │
│  (total_price, status, payment_from, booking_date) │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────▼────────┐
         │ calculate_commission │ Step 1
         │ (커미션 = 5000×25%) │
         └─────────┬────────┘
                   │
         ┌─────────▼──────────────┐
         │ auto_create_settlement │ Step 2
         │ (정산 자동 생성)      │
         │ - Rule 1: guest→pending │
         │ - Rule 2: company→waived │
         │ - Rule 3: credit→pending │
         └─────────┬──────────────┘
                   │
         CompanySettlement
         (status='draft')
                   │
    [관리자 승인: draft → approved]
                   │
         ┌─────────▼─────────────┐
         │ bulk_settle_monthly   │ Step 3
         │ (월간 일괄 정산)      │
         │ (approved → settled)  │
         └─────────┬─────────────┘
                   │
         CompanySettlement
         (status='settled')
                   │
              [지급 완료]
```

---

## 📊 계산 예시 (상세)

### 예시 1: 손님 외상 정산

```
입력:
  - Booking #101
  - total_price: 5000 PHP
  - status: completed
  - payment_from: guest
  - booking_date: 2026-06-15

Step 1: calculate_commission()
  commission = 5000 × 25% = 1250 PHP

Step 2: auto_create_settlement()
  Rule 1 적용 (payment_from='guest')
  
  - settlement_category: 'credit'
  - recovery_rate: 80%
  - recovered_amount: 5000 × 80% = 4000 PHP
  - platform_fee: 1250 PHP
  - net_settlement: 4000 - 1250 = 2750 PHP
  - status: 'draft'

Step 3: bulk_settle_monthly(2026, 6)
  [관리자가 승인 후]
  
  - status: 'draft' → 'approved' (관리자 승인)
  - status: 'approved' → 'settled' (자동 정산)
  - payment_date: 2026-06-30
  - paid_by: 'admin_user'

결과:
  ✅ CompanySettlement 생성
  ✅ net_settlement: 2750 PHP
  ✅ 지급 완료
```

### 예시 2: 회사 정산 제외

```
입력:
  - Booking #102
  - total_price: 3000 PHP
  - payment_from: company

Step 2: auto_create_settlement()
  Rule 2 적용 (payment_from='company')
  
  - settlement_category: 'waived'
  - recovery_rate: 0%
  - recovered_amount: 0 PHP
  - net_settlement: 0 PHP
  - status: 'waived'

결과:
  ✅ CompanySettlement 생성 (정산 기록만 남김)
  ❌ 정산액 없음 (회사 정산 제외)
```

### 예시 3: 신용카드 선지급

```
입력:
  - Booking #103
  - total_price: 10000 PHP
  - payment_from: credit

Step 2: auto_create_settlement()
  Rule 3 적용 (payment_from='credit')
  
  - recovery_rate: 100%
  - recovered_amount: 10000 PHP
  - platform_fee: 10000 × 25% = 2500 PHP
  - net_settlement: 10000 - 2500 = 7500 PHP
  - status: 'draft'

결과:
  ✅ CompanySettlement 생성
  ✅ net_settlement: 7500 PHP
  ✅ 나중에 회수
```

---

## 🔄 데이터베이스 연동

### 모델 관계

```
Booking
  ├── total_price: Decimal
  ├── status: String ('completed', 'cancelled', ...)
  ├── payment_from: String ('guest', 'company', 'credit')
  └── booking_date: Date

        ↓ auto_create_settlement()

CompanySettlement
  ├── company_id: BigInteger
  ├── settlement_period_year: Integer
  ├── settlement_period_month: Integer
  ├── total_revenue: Numeric(12, 2)
  ├── credit_revenue: Numeric(12, 2)
  ├── recovery_rate: Numeric(5, 2)
  ├── platform_fee: Numeric(12, 2)
  ├── net_settlement: Numeric(12, 2)
  ├── status: String ('draft', 'approved', 'settled', 'waived')
  └── payment_date: Date

        ↓ bulk_settle_monthly()

SettlementTransaction (거래 기록)
  ├── company_settlement_id: Integer (FK)
  ├── booking_id: BigInteger (FK)
  ├── transaction_type: String ('booking')
  ├── settlement_category: String ('guest', 'credit', 'waived')
  └── amount: Numeric(12, 2)
```

---

## 🛠️ 통합 사용 예시

### 전체 워크플로우 구현

```python
from sqlalchemy.orm import Session
from datetime import date
from app.services.settlement_calculator import (
    calculate_commission,
    auto_create_settlement,
    bulk_settle_monthly,
    get_monthly_settlement_stats
)

# === Phase 1: 예약 생성 및 정산 자동 생성 ===
def process_completed_booking(booking: Booking, db: Session):
    """완료된 예약의 정산 자동 생성"""
    
    # 1. 커미션 계산
    commission = calculate_commission(booking)
    print(f"Booking #{booking.id} 커미션: {commission} PHP")
    
    # 2. 정산 자동 생성
    settlement = auto_create_settlement(
        booking=booking,
        db=db,
        created_by=f"booking_system_{booking.id}"
    )
    
    print(f"Settlement #{settlement.id} 생성")
    print(f"  - 상태: {settlement.status}")
    print(f"  - 회수율: {settlement.recovery_rate}%")
    print(f"  - 회수액: {settlement.recovered_amount}")
    print(f"  - 순정산액: {settlement.net_settlement}")
    
    return settlement


# === Phase 2: 월간 일괄 정산 ===
def process_monthly_settlements(year: int, month: int, db: Session):
    """월간 정산 일괄 처리"""
    
    # 1. 월간 정산 통계 조회
    stats = get_monthly_settlement_stats(year, month, db)
    print(f"\n{year}-{month:02d} 정산 현황")
    print(f"  - 총 정산: {stats['count']['total']}개")
    print(f"  - 대기 중: {stats['count']['draft']}개")
    print(f"  - 승인됨: {stats['count']['approved']}개")
    print(f"  - 완료: {stats['count']['settled']}개")
    print(f"  - 총 매출: {stats['amounts']['total_revenue']} PHP")
    print(f"  - 총 수수료: {stats['amounts']['total_fee']} PHP")
    print(f"  - 총 정산액: {stats['amounts']['total_settlement']} PHP")
    
    # 2. 월간 일괄 정산 처리
    result = bulk_settle_monthly(
        year=year,
        month=month,
        db=db,
        settled_by='finance_system'
    )
    
    print(f"\n정산 처리 완료: {len(result)}개")
    for settlement in result:
        print(f"  - Settlement #{settlement.id}: {settlement.net_settlement} PHP")


# === 실행 ===
if __name__ == '__main__':
    from app.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        # 예약 #101 정산 처리
        booking = db.query(Booking).filter(Booking.id == 101).first()
        if booking:
            process_completed_booking(booking, db)
        
        # 2026년 6월 월간 정산 처리
        process_monthly_settlements(2026, 6, db)
        
    finally:
        db.close()
```

---

## ✅ 체크리스트

### 개발자용
- [ ] `settlement_calculator.py` 모듈 임포트 가능 확인
- [ ] `calculate_commission` 함수 테스트
- [ ] `auto_create_settlement` 함수 테스트 (3가지 Rule)
- [ ] `bulk_settle_monthly` 함수 테스트
- [ ] 데이터베이스 마이그레이션 확인

### 운영자용
- [ ] 월간 정산 수동 검토 프로세스 수립
- [ ] 회수율 수기 입력 프로세스 (필요시)
- [ ] 정산 승인 권한 설정
- [ ] 지급 방법 결정

---

## 📚 참고 자료

| 문서 | 경로 |
|------|------|
| **테스트 코드** | `tests/test_settlement_calculator.py` |
| **모델 정의** | `app/models/company_settlement.py` |
| **API 라우터** | `app/routers/company_settlement.py` |
| **기존 엔진** | `app/services/settlement_engine.py` |

---

**작성일:** 2026-06-02  
**버전:** 1.0  
**담당:** ElSpa 개발팀
