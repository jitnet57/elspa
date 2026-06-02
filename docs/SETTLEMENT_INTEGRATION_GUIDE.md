# 정산 계산 로직 통합 가이드

> ElSpa 정산 시스템에 `settlement_calculator.py` 모듈 통합하기
> 작성일: 2026-06-02

---

## 📦 제공 파일 목록

| 파일 | 경로 | 설명 |
|------|------|------|
| **핵심 모듈** | `app/services/settlement_calculator.py` | 3가지 핵심 함수 구현 |
| **테스트 코드** | `tests/test_settlement_calculator.py` | 14개 테스트 케이스 |
| **상세 문서** | `docs/SETTLEMENT_CALCULATOR.md` | 함수별 설명서 |
| **사용 예시** | `examples/settlement_usage_example.py` | 6가지 실제 사용 예제 |

---

## 🎯 3가지 핵심 함수

### 1. `calculate_commission(booking) → Decimal`

**목적:** 예약의 커미션(플랫폼 수수료) 계산

```python
from app.services.settlement_calculator import calculate_commission

# 예약의 커미션 계산
commission = calculate_commission(booking)
# 반환: Decimal(1250)  # 5000 × 25%
```

**규칙:**
- 기본: total_price × 25%
- 취소/환불: 0%
- 반환값: 항상 >= 0

---

### 2. `auto_create_settlement(booking, db, created_by) → CompanySettlement`

**목적:** 예약의 지급 방식(payment_from)에 따라 자동으로 정산 생성

```python
from app.services.settlement_calculator import auto_create_settlement

settlement = auto_create_settlement(
    booking=booking,
    db=db,
    created_by='system'
)
```

**3가지 정산 규칙:**

| Rule | payment_from | 상태 | 회수율 | 설명 |
|------|--------------|------|--------|------|
| **1** | 'guest' | pending | 80% | 손님 외상 (회수 불확실) |
| **2** | 'company' | waived | 0% | 회사 정산 제외 |
| **3** | 'credit' | pending | 100% | 신용카드/선지급 (나중 회수) |

---

### 3. `bulk_settle_monthly(year, month, db, company_id, settled_by) → List[CompanySettlement]`

**목적:** 월간 정산을 일괄 처리 (approved → settled)

```python
from app.services.settlement_calculator import bulk_settle_monthly

result = bulk_settle_monthly(
    year=2026,
    month=6,
    db=db,
    company_id=None,  # None이면 전체 업체
    settled_by='admin'
)
# 반환: [CompanySettlement(...), ...]
```

**처리 내용:**
- 대상: approved 상태 정산만
- 전환: approved → settled
- 자동 입력: payment_date (월 마지막 날), paid_by

---

## 🔧 개발자 설정

### Step 1: 모듈 임포트 확인

```python
# FastAPI 라우터 또는 서비스에서 임포트
from app.services.settlement_calculator import (
    calculate_commission,
    auto_create_settlement,
    bulk_settle_monthly,
    get_monthly_settlement_stats,
)
```

### Step 2: Booking 모델에 payment_from 필드 추가 (필요시)

현재 `Booking` 모델에 `payment_from` 필드가 없다면 추가:

```python
# app/models/booking.py
from sqlalchemy import Column, String

class Booking(Base):
    __tablename__ = "bookings"
    
    # ... 기존 필드 ...
    
    # 새로 추가
    payment_from = Column(
        String(50),
        nullable=True,
        default='guest',
        comment="guest, company, credit"
    )
```

마이그레이션 생성:
```bash
alembic revision --autogenerate -m "Add payment_from to Booking"
alembic upgrade head
```

### Step 3: 테스트 실행

```bash
# pytest 실행
pytest tests/test_settlement_calculator.py -v

# 특정 테스트만 실행
pytest tests/test_settlement_calculator.py::TestCalculateCommission -v
```

### Step 4: API 엔드포인트 연동 (선택)

기존 `app/routers/company_settlement.py`의 엔드포인트에서 사용:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.settlement_calculator import auto_create_settlement

router = APIRouter()

@router.post("/bookings/{booking_id}/settle")
async def settle_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    """
    예약을 정산하기 (자동 생성)
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # auto_create_settlement 호출
    settlement = auto_create_settlement(booking, db, created_by='api_user')
    
    return {
        "settlement_id": settlement.id,
        "status": settlement.status,
        "net_settlement": str(settlement.net_settlement)
    }
```

---

## 📊 데이터 흐름

```
Booking 생성/완료
    ↓
calculate_commission()
    ↓ 커미션 = 5000 × 25% = 1250
auto_create_settlement()
    ↓
    ├─ Rule 1: guest → pending, 80% recovery
    ├─ Rule 2: company → waived, 0% recovery
    └─ Rule 3: credit → pending, 100% recovery
    ↓
CompanySettlement 생성 (status='draft')
    ↓
[관리자 승인: draft → approved]
    ↓
bulk_settle_monthly()
    ↓
CompanySettlement 상태 전환 (approved → settled)
    ↓
[지급 완료]
```

---

## 💻 API 통합 예시

### 예시 1: Booking 완료 시 자동 정산

```python
# app/routers/bookings.py (기존 라우터 수정)

from app.services.settlement_calculator import auto_create_settlement

@router.patch("/{booking_id}/complete")
async def complete_booking(booking_id: int, db: Session = Depends(get_db)):
    """
    예약 완료 처리
    → 자동으로 정산 생성
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    # 1. 예약 상태 변경
    booking.status = 'completed'
    db.add(booking)
    db.flush()
    
    # 2. 정산 자동 생성
    if not hasattr(booking, 'payment_from'):
        booking.payment_from = 'guest'
    
    settlement = auto_create_settlement(booking, db, created_by='booking_system')
    
    return {
        "booking_id": booking_id,
        "booking_status": booking.status,
        "settlement_id": settlement.id,
        "settlement_status": settlement.status,
        "net_settlement": str(settlement.net_settlement)
    }
```

### 예시 2: 월간 정산 처리

```python
# app/routers/company_settlement.py (새 엔드포인트)

from app.services.settlement_calculator import (
    bulk_settle_monthly,
    get_monthly_settlement_stats
)

@router.post("/monthly-settle")
async def monthly_settle(
    year: int,
    month: int,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    월간 정산 일괄 처리
    """
    # 1. 정산 현황 조회
    stats = get_monthly_settlement_stats(year, month, db, company_id)
    
    # 2. 승인된 정산 확인
    if stats['count']['approved'] == 0:
        return {"message": "No approved settlements to process"}
    
    # 3. 일괄 정산 처리
    result = bulk_settle_monthly(
        year=year,
        month=month,
        db=db,
        company_id=company_id,
        settled_by='finance_api'
    )
    
    return {
        "period": f"{year}-{month:02d}",
        "processed": len(result),
        "total_amount": str(sum(s.net_settlement for s in result)),
        "settlements": [
            {
                "id": s.id,
                "company_id": s.company_id,
                "net_settlement": str(s.net_settlement),
                "payment_date": s.payment_date.isoformat()
            }
            for s in result
        ]
    }
```

---

## 🧪 테스트 전략

### 단위 테스트 (Unit Tests)

```python
# tests/test_settlement_calculator.py 실행
pytest tests/test_settlement_calculator.py::TestCalculateCommission -v
pytest tests/test_settlement_calculator.py::TestAutoCreateSettlement -v
pytest tests/test_settlement_calculator.py::TestBulkSettleMonthly -v
```

### 통합 테스트 (Integration Tests)

```python
# 실제 DB와 함께 테스트
pytest tests/test_settlement_calculator.py::TestSettlementIntegration -v
```

### 수동 테스트

```bash
# 예제 실행
python examples/settlement_usage_example.py
```

---

## 🚀 배포 체크리스트

### Phase 1: 개발 환경 (Local)
- [ ] `settlement_calculator.py` 모듈 생성
- [ ] 테스트 코드 작성 및 실행
- [ ] `Booking.payment_from` 필드 추가 (필요시)
- [ ] 마이그레이션 생성 및 테스트
- [ ] FastAPI 라우터에서 함수 호출 테스트

### Phase 2: 테스트 환경 (Staging)
- [ ] 월간 정산 실행 테스트
- [ ] 정산 금액 검증
- [ ] 상태 전환 확인 (draft → approved → settled)
- [ ] 거래 기록 검증

### Phase 3: 프로덕션 환경 (Production)
- [ ] DB 마이그레이션 배포
- [ ] 모듈 배포 (`settlement_calculator.py`)
- [ ] API 엔드포인트 활성화
- [ ] 모니터링 설정
- [ ] 관리자 문서 배포

---

## 📋 정산 규칙 비교표

```
┌─────────────┬─────────────┬──────────┬─────────┬──────────────────┐
│ Rule        │ payment_from│ 상태    │ 회수율  │ 용도              │
├─────────────┼─────────────┼──────────┼─────────┼──────────────────┤
│ Rule 1      │ 'guest'     │ pending  │ 80%     │ 손님 외상         │
│ (손님 외상) │             │          │         │ (회수 불확실)    │
├─────────────┼─────────────┼──────────┼─────────┼──────────────────┤
│ Rule 2      │ 'company'   │ waived   │ 0%      │ 회사 정산 제외    │
│ (회사 제외) │             │          │         │ (정산 안함)       │
├─────────────┼─────────────┼──────────┼─────────┼──────────────────┤
│ Rule 3      │ 'credit'    │ pending  │ 100%    │ 신용카드/선지급   │
│ (선지급)    │             │          │         │ (나중 회수)       │
└─────────────┴─────────────┴──────────┴─────────┴──────────────────┘
```

---

## 🔍 문제 해결

### Q: calculate_commission이 0을 반환합니다

**A:** 다음을 확인하세요:
- `booking.status`가 'cancelled' 또는 'refunded'인가?
- `booking.total_price`가 0 또는 None인가?

```python
# 디버그
print(f"Status: {booking.status}")
print(f"Price: {booking.total_price}")
print(f"Commission: {calculate_commission(booking)}")
```

### Q: auto_create_settlement에서 ValueError가 발생합니다

**A:** 다음 중 하나일 수 있습니다:
- booking이 None
- booking.status가 유효하지 않음 ('pending', 'confirmed', 'completed만 가능)
- payment_from이 잘못된 값

```python
# 디버그
try:
    settlement = auto_create_settlement(booking, db)
except ValueError as e:
    print(f"Error: {e}")
    print(f"Booking ID: {booking.id}")
    print(f"Booking Status: {booking.status}")
    print(f"Payment From: {getattr(booking, 'payment_from', 'NOT SET')}")
```

### Q: bulk_settle_monthly가 정산을 처리하지 않습니다

**A:** 다음을 확인하세요:
- 정산의 상태가 'approved'인가? (draft가 아니어야 함)
- 정산의 연도/월이 정확한가?

```python
# 디버그
from sqlalchemy import and_
from app.models.company_settlement import CompanySettlement

query = db.query(CompanySettlement).filter(
    and_(
        CompanySettlement.settlement_period_year == 2026,
        CompanySettlement.settlement_period_month == 6,
        CompanySettlement.status == 'approved'
    )
)

print(f"Approved settlements: {query.count()}")
for settlement in query.all():
    print(f"  - #{settlement.id}: {settlement.status}")
```

---

## 📚 참고 문서

| 문서 | 내용 |
|------|------|
| `docs/SETTLEMENT_CALCULATOR.md` | 상세 함수 설명서 |
| `examples/settlement_usage_example.py` | 6가지 실제 사용 예제 |
| `tests/test_settlement_calculator.py` | 14개 테스트 케이스 |
| `app/models/company_settlement.py` | 정산 모델 정의 |
| `app/routers/company_settlement.py` | 기존 API 라우터 |

---

## 🎓 학습 목표

이 모듈을 통해 다음을 학습할 수 있습니다:

1. **정산 자동화 로직**: 예약 → 정산 변환 프로세스
2. **조건부 처리**: payment_from에 따른 3가지 규칙 적용
3. **일괄 처리**: 월간 대량 정산 처리 방식
4. **데이터 무결성**: Decimal 정밀도, 제약 조건 관리
5. **에러 처리**: ValueError, 유효성 검증
6. **테스트 작성**: 단위 테스트, 통합 테스트

---

**작성일:** 2026-06-02  
**버전:** 1.0  
**담당:** ElSpa 개발팀
