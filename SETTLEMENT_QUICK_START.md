# 정산 계산 로직 — 빠른 시작 가이드

> 5분 안에 시작하기 (Quick Start)

---

## 🎯 3가지 함수 요약

### 1️⃣ calculate_commission(booking)

```python
from app.services.settlement_calculator import calculate_commission

commission = calculate_commission(booking)
# 반환: Decimal(1250)  # 5000 × 25%
```

**규칙:**
- 기본: `total_price × 25%`
- 취소/환불: `0%`

---

### 2️⃣ auto_create_settlement(booking, db, created_by)

```python
from app.services.settlement_calculator import auto_create_settlement

settlement = auto_create_settlement(booking, db, created_by='system')
# 반환: CompanySettlement 객체
```

**3가지 규칙:**

| Rule | payment_from | 회수율 | 정산 상태 |
|------|--------------|--------|----------|
| 1 | 'guest' | 80% | pending |
| 2 | 'company' | 0% | waived |
| 3 | 'credit' | 100% | pending |

**예시:**
```python
# 손님 외상 (Rule 1)
booking.payment_from = 'guest'
settlement = auto_create_settlement(booking, db)
# settlement.recovery_rate = 80%
# settlement.status = 'pending'
# settlement.net_settlement = (5000×80%) - (5000×25%) = 2750

# 회사 제외 (Rule 2)
booking.payment_from = 'company'
settlement = auto_create_settlement(booking, db)
# settlement.status = 'waived'
# settlement.net_settlement = 0

# 신용카드 (Rule 3)
booking.payment_from = 'credit'
settlement = auto_create_settlement(booking, db)
# settlement.recovery_rate = 100%
# settlement.net_settlement = (5000×100%) - (5000×25%) = 3750
```

---

### 3️⃣ bulk_settle_monthly(year, month, db, company_id, settled_by)

```python
from app.services.settlement_calculator import bulk_settle_monthly

result = bulk_settle_monthly(
    year=2026,
    month=6,
    db=db,
    company_id=None,  # None이면 전체
    settled_by='admin'
)
# 반환: List[CompanySettlement] (처리된 정산 목록)
```

**동작:**
- 대상: approved 상태 정산만
- 전환: approved → settled
- 자동 입력: payment_date (월 마지막), paid_by

---

## 🚀 즉시 사용하기

### Step 1: 모듈 임포트
```python
from app.services.settlement_calculator import (
    calculate_commission,
    auto_create_settlement,
    bulk_settle_monthly,
)
```

### Step 2: 예약 완료 시 정산 자동 생성
```python
# 1. 예약 조회
booking = db.query(Booking).filter(Booking.id == 101).first()

# 2. payment_from 설정 (없으면 'guest' 기본값)
booking.payment_from = 'guest'

# 3. 정산 자동 생성
settlement = auto_create_settlement(booking, db, created_by='app')

print(f"✅ Settlement #{settlement.id} 생성")
print(f"   회수율: {settlement.recovery_rate}%")
print(f"   정산액: {settlement.net_settlement} PHP")
```

### Step 3: 월간 정산 처리
```python
# 1. 월간 정산 일괄 처리
result = bulk_settle_monthly(2026, 6, db, settled_by='admin')

# 2. 처리 결과 확인
print(f"✅ {len(result)}개 정산 처리됨")
for settlement in result:
    print(f"   Settlement #{settlement.id}: {settlement.net_settlement} PHP")
```

---

## 📊 계산 예시

### 예시: 5000 PHP 마사지

```
입력:
  - Booking.total_price = 5000
  - Booking.status = 'completed'
  - Booking.payment_from = 'guest'

Step 1: calculate_commission()
  commission = 5000 × 25% = 1250 PHP

Step 2: auto_create_settlement()
  recovery_rate = 80%           (Rule 1)
  recovered_amount = 4000 PHP   (5000 × 80%)
  platform_fee = 1250 PHP       (5000 × 25%)
  net_settlement = 2750 PHP     (4000 - 1250)
  status = 'pending'

Step 3: bulk_settle_monthly()
  [승인 후]
  status = 'settled'
  payment_date = 2026-06-30
  paid_by = 'admin'

결과:
  ✅ 정산액 2750 PHP 지급
```

---

## ✅ 검증 체크리스트

- [ ] `settlement_calculator.py` 임포트 가능?
- [ ] `calculate_commission()` 작동?
- [ ] `auto_create_settlement()` 작동?
- [ ] `bulk_settle_monthly()` 작동?
- [ ] 테스트 통과? `pytest tests/test_settlement_calculator.py -v`

---

## 🔗 문서 링크

| 목적 | 문서 |
|------|------|
| **상세 설명** | `docs/SETTLEMENT_CALCULATOR.md` |
| **통합 가이드** | `docs/SETTLEMENT_INTEGRATION_GUIDE.md` |
| **사용 예시** | `examples/settlement_usage_example.py` |
| **테스트 코드** | `tests/test_settlement_calculator.py` |
| **전달 요약** | `SETTLEMENT_DELIVERY_SUMMARY.md` |

---

## ❓ FAQ

**Q: payment_from이 없으면?**
A: 기본값 'guest' 사용 (Rule 1, 회수율 80%)

**Q: 취소된 예약 커미션은?**
A: 0 (calculate_commission에서 자동 반환)

**Q: draft 상태 정산을 일괄 처리할 수 있나?**
A: 아니오, approved만 처리 (draft → approved는 관리자가 수동)

**Q: 정산 금액이 마이너스가 되면?**
A: 자동으로 0으로 조정 (음수 방지)

---

**작성일:** 2026-06-02 | **버전:** 1.0
