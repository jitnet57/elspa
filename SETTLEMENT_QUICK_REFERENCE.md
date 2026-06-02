# CompanySettlement 빠른 참조 가이드

## 3가지 정산 규칙

```
┌──────────────┬──────────────┬────────────────┐
│ 비회원 (Guest) │ 외상 (Credit) │ 제외 (Waived)  │
├──────────────┼──────────────┼────────────────┤
│ SETTLED      │ PENDING      │ WAIVED         │
│ 회수율: 100% │ 회수율: 변동  │ 회수율: 0%     │
│ 즉시 정산    │ 월말 정산    │ 정산 제외      │
└──────────────┴──────────────┴────────────────┘
```

## 5가지 계산 공식

```python
# 1. 매출 분류
total = guest + credit + waived

# 2. 외상 회수액
recovered = credit × recovery_rate / 100

# 3. 플랫폼 수수료
base = total - waived
fee = base × platform_fee_rate / 100  # 기본 25%

# 4. 차감액 합계
deductions = refund + dispute + other

# 5. 최종 정산액
net_settlement = (guest + recovered) - fee - deductions
```

## 5단계 워크플로우

```
1️⃣ 데이터 수집     → booking + customer 통합
2️⃣ 자동 계산       → DRAFT 상태
3️⃣ 관리자 승인     → APPROVED 상태 (회수율 갱신)
4️⃣ 자동 지급       → SETTLED 상태 (은행/GCash)
5️⃣ 확인           → CONFIRMED 상태 (대조)
```

## 7개 API 엔드포인트

```bash
# 1. 정산 계산
POST /api/settlements/company/calculate
{
  "company_id": 1,
  "year": 2026,
  "month": 5
}

# 2. 정산 조회
GET /api/settlements/company/1/2026/5

# 3. 정산 목록
GET /api/settlements/company/1?status=approved

# 4. 정산 승인
PATCH /api/settlements/company/1/approve
{"approved_by": "admin@example.com"}

# 5. 정산 지급
PATCH /api/settlements/company/1/settle
{
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-05",
  "paid_by": "finance@example.com"
}

# 6. 회수율 갱신
PATCH /api/settlements/company/1/recovery-rate
{"recovery_rate": 85.50, "updated_by": "admin"}

# 7. 거래 기록
GET /api/settlements/company/1/transactions
```

## 핵심 데이터 모델

### CompanySettlement (월간 정산)
```
id: Integer (PK)
company_id: BigInteger
settlement_period_year: Integer
settlement_period_month: Integer
total_revenue, guest_revenue, credit_revenue, waived_revenue: Decimal
recovery_rate: Decimal (%)
recovered_amount: Decimal
platform_fee_rate, platform_fee: Decimal
refund_amount, dispute_deduction, other_deduction: Decimal
net_settlement: Decimal
status: String (draft/approved/settled/rejected/confirmed)
payment_date: Date
created_by, approved_by, paid_by: String
```

### SettlementTransaction (거래 추적)
```
id: BigInteger (PK)
company_settlement_id: Integer (FK)
booking_id: BigInteger (FK)
transaction_type: String (booking/refund/dispute/adjustment)
settlement_category: String (guest/credit/waived)
amount, recovery_rate, recovered_amount: Decimal
transaction_date: Date
```

### SettlementRule (정산 규칙)
```
id: Integer (PK)
rule_name: String (unique)
customer_type, payment_method: String
settlement_status: String (settled/pending/waived)
recovery_rate, platform_fee_rate: Decimal
is_active: Boolean
```

## 상태 전이 다이어그램

```
DRAFT (자동 계산)
  ↓
APPROVED (관리자 승인)
  ↓
SETTLED (자동 지급)
  ↓
CONFIRMED (은행 대조)

또는

DRAFT → REJECTED (거부) → (재계산 필요)
```

## Python 사용 예시

### 정산 계산
```python
from app.services.settlement_engine import SettlementCalculator, SettlementRepository

calculator = SettlementCalculator(db)
result = calculator.calculate_settlement(
    company_id=1,
    year=2026,
    month=5
)

repo = SettlementRepository(db)
settlement = repo.create_settlement(result)
```

### 회수율 갱신
```python
repo = SettlementRepository(db)
settlement = repo.update_recovery_rate(
    settlement_id=1,
    recovery_rate=Decimal(85.50),
    updated_by="admin@example.com"
)
```

### 정산 승인 & 지급
```python
# 승인
settlement = repo.approve_settlement(
    settlement_id=1,
    approved_by="admin@example.com"
)

# 지급
settlement = repo.settle_payment(
    settlement_id=1,
    payment_method="bank_transfer",
    payment_date=date.today(),
    paid_by="finance@example.com"
)
```

## 규칙 엔진 작동 원리

```python
settlement_type 판정 규칙 우선순위:

1. 수기 입력 (booking.settlement_type)
   ↓
2. 규칙 매칭 (settlement_rules 테이블)
   - customer_type + payment_method로 매칭
   ↓
3. 기본값
   - 비회원 → "settled"
   - 현금/카드 → "settled"
   - company_credit → "pending"
   - 기타 → "settled"
```

## 실제 계산 예시

```
Company: Makati Spa Center
Period: 2026-05-01 ~ 2026-05-31

1. 매출 수집
   - 비회원: 150,000 (100건 × 1,500)
   - 외상: 100,000 (40건 × 2,500)
   - 제외: 50,000 (10건 × 5,000)
   ───────────
   합계: 300,000

2. 회수액 계산
   recovered = 100,000 × 80% = 80,000

3. 수수료 계산
   base = 300,000 - 50,000 = 250,000
   fee = 250,000 × 25% = 62,500

4. 차감액
   refund: 5,000
   dispute: 2,000
   other: 1,000
   ───────────
   total: 8,000

5. 최종 정산액
   net = (150,000 + 80,000) - 62,500 - 8,000
       = 230,000 - 70,500
       = 149,500 PHP ✓
```

## 마이그레이션 체크리스트

```bash
# 1. 모델 임포트 (이미 완료)
# app/models/__init__.py에서 확인

# 2. Alembic 마이그레이션
alembic revision --autogenerate -m "Add company settlement"
alembic upgrade head

# 3. API 라우터 등록
# main.py에서
from app.routers import company_settlement
app.include_router(company_settlement.router)

# 4. 초기 규칙 데이터
# 아래 SQL 실행
INSERT INTO settlement_rules (rule_name, settlement_status, recovery_rate, is_active)
VALUES ('Default Guest Rule', 'settled', 100.00, true);
VALUES ('Default Credit Rule', 'pending', 80.00, true);
VALUES ('Default Waived Rule', 'waived', 0.00, true);

# 5. 테스트
pytest tests/test_settlement_*.py
```

## 파일 위치

```
/Users/kwangseobpark/elspa/
├── CompanySettlement_Design.md (설계)
├── CompanySettlement_Implementation_Guide.md (구현 가이드)
├── SETTLEMENT_SUMMARY.txt (요약)
├── SETTLEMENT_QUICK_REFERENCE.md (이 파일)
└── app/
    ├── models/company_settlement.py
    ├── services/settlement_engine.py
    └── routers/company_settlement.py
```

## 디버깅 팁

```python
# 계산 검증
settlement = db.query(CompanySettlement).filter_by(id=1).first()
print(f"Guest: {settlement.guest_revenue}")
print(f"Credit: {settlement.credit_revenue}")
print(f"Waived: {settlement.waived_revenue}")
print(f"Total: {settlement.total_revenue}")
assert settlement.guest_revenue + settlement.credit_revenue + settlement.waived_revenue == settlement.total_revenue

# 회수액 검증
expected = settlement.credit_revenue * (settlement.recovery_rate / Decimal(100))
assert settlement.recovered_amount == expected

# 최종 정산액 검증
expected_net = (settlement.guest_revenue + settlement.recovered_amount) \
              - settlement.platform_fee \
              - settlement.total_deductions
assert settlement.net_settlement == expected_net
```

## 일반적인 오류 & 해결책

| 오류 | 원인 | 해결책 |
|------|------|--------|
| 중복 정산 | settlement 이미 존재 | GET으로 기존 정산 조회 후 수정 |
| 상태 오류 | draft가 아닌데 approve 시도 | 현재 상태 확인 후 적절한 엔드포인트 사용 |
| 음수 정산액 | 차감액이 매출 초과 | 차감액 검토 및 조정 |
| 금액 불일치 | 소수점 처리 오류 | Decimal 사용 확인 (float 아님) |

## 성능 최적화

```python
# 인덱스 활용 (이미 설정됨)
- (company_id, year, month) - 정산 조회 빠름
- (status) - 상태별 필터링 빠름
- (payment_date) - 지급일 기준 조회 빠름

# 쿼리 최적화
settlements = db.query(CompanySettlement)\
    .filter(CompanySettlement.status == 'settled')\
    .filter(CompanySettlement.settlement_period_year == 2026)\
    .order_by(CompanySettlement.settlement_period_month.desc())\
    .all()

# 거래 조회 최적화
transactions = db.query(SettlementTransaction)\
    .filter(SettlementTransaction.company_settlement_id == settlement_id)\
    .order_by(SettlementTransaction.transaction_date)\
    .all()
```

---

**작성일:** 2026-06-02  
**버전:** 1.0  
**담당자:** jitnet-gif

