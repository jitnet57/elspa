# CompanySettlement 구현 가이드

**작성일:** 2026-06-02  
**최종 수정:** 2026-06-02  
**상태:** 완료 (설계 & 초기 구현)

---

## 📋 목차

1. [개요](#개요)
2. [생성된 파일 목록](#생성된-파일-목록)
3. [데이터 모델 상세](#데이터-모델-상세)
4. [API 엔드포인트](#api-엔드포인트)
5. [계산 엔진 상세](#계산-엔진-상세)
6. [사용 예시](#사용-예시)
7. [마이그레이션 가이드](#마이그레이션-가이드)
8. [테스트 계획](#테스트-계획)

---

## 개요

### 핵심 개념

CompanySettlement 시스템은 ElSpa 플랫폼의 **월간 업체 정산**을 자동화합니다.

```
월초 → 데이터 수집 → 자동 계산 → 관리자 승인 → 자동 지급 → 월말 확인
```

### 세 가지 정산 규칙

| 고객 유형 | 정산 상태 | 설명 | 회수율 |
|----------|---------|------|--------|
| **Guest** | SETTLE | 즉시 정산 (현금) | 100% |
| **Credit** | PENDING | 외상 대기 | 0~100% (수기) |
| **Waived** | WAIVE | 정산 제외 (프로모션) | 0% |

---

## 생성된 파일 목록

### 1. 설계 문서
```
📄 /Users/kwangseobpark/elspa/CompanySettlement_Design.md
   ├─ ER 다이어그램
   ├─ 정산 규칙 & 공식
   ├─ 워크플로우 & 시나리오
   ├─ 정산 구현 로드맵
   └─ 주요 고려사항
```

### 2. 데이터베이스 모델
```
📄 /Users/kwangseobpark/elspa/app/models/company_settlement.py
   ├─ CompanySettlement (업체 월간 정산)
   ├─ SettlementTransaction (거래 추적)
   └─ SettlementRule (정산 규칙)
```

### 3. 비즈니스 로직
```
📄 /Users/kwangseobpark/elspa/app/services/settlement_engine.py
   ├─ SettlementCalculator (계산 엔진)
   ├─ SettlementRuleEngine (규칙 엔진)
   └─ SettlementRepository (저장소)
```

### 4. API 라우터
```
📄 /Users/kwangseobpark/elspa/app/routers/company_settlement.py
   ├─ POST /api/settlements/company/calculate
   ├─ GET /api/settlements/company/{company_id}/{year}/{month}
   ├─ GET /api/settlements/company/{company_id}
   ├─ PATCH /api/settlements/company/{settlement_id}/approve
   ├─ PATCH /api/settlements/company/{settlement_id}/settle
   ├─ PATCH /api/settlements/company/{settlement_id}/recovery-rate
   └─ GET /api/settlements/company/{settlement_id}/transactions
```

---

## 데이터 모델 상세

### CompanySettlement 테이블 구조

```python
CompanySettlement(
    # 기본 정보
    id: Integer (PK),
    company_id: BigInteger (FK to companies),
    settlement_period_year: Integer,
    settlement_period_month: Integer,
    
    # 매출 분류
    total_revenue: Decimal(12,2),        # 총 매출
    guest_revenue: Decimal(12,2),        # 비회원 (100% 회수)
    credit_revenue: Decimal(12,2),       # 외상 (회수율 변동)
    waived_revenue: Decimal(12,2),       # 제외 (0% 회수)
    
    # 외상 회수
    recovery_rate: Decimal(5,2),         # 회수율 (%) - 수기 갱신
    recovered_amount: Decimal(12,2),     # 실제 회수액
    
    # 수수료
    platform_fee_rate: Decimal(5,2),     # 플랫폼 수수료율 (기본 25%)
    platform_fee: Decimal(12,2),         # 수수료액
    
    # 차감액
    refund_amount: Decimal(12,2),        # 환불액
    dispute_deduction: Decimal(12,2),    # 분쟁 차감
    other_deduction: Decimal(12,2),      # 기타 차감
    total_deductions: Decimal(12,2),     # 총 차감
    
    # 최종 정산액
    net_settlement: Decimal(12,2),       # 순정산액
    
    # 상태 관리
    status: String (draft/approved/settled/rejected/confirmed),
    settlement_date: Date,
    payment_method: String,
    payment_date: Date,
    
    # 감시 정보
    created_by: String,
    approved_by: String,
    paid_by: String,
    created_at: DateTime,
    updated_at: DateTime,
)
```

### SettlementTransaction 테이블 구조

```python
SettlementTransaction(
    # 기본 정보
    id: BigInteger (PK),
    company_settlement_id: Integer (FK),
    booking_id: BigInteger (FK),
    customer_id: BigInteger (FK),
    
    # 거래 분류
    transaction_type: String (booking/refund/dispute/adjustment),
    settlement_category: String (guest/credit/waived),
    
    # 금액
    amount: Decimal(12,2),
    recovery_rate: Decimal(5,2),
    recovered_amount: Decimal(12,2),
    
    # 기타
    transaction_date: Date,
    notes: Text,
    created_at: DateTime,
)
```

### SettlementRule 테이블 구조

```python
SettlementRule(
    # 기본 정보
    id: Integer (PK),
    rule_name: String (unique),
    description: Text,
    
    # 규칙 조건
    customer_type: String,
    payment_method: String,
    
    # 규칙 설정
    settlement_status: String (settled/pending/waived),
    recovery_rate: Decimal(5,2),
    platform_fee_rate: Decimal(5,2),
    
    # 상태
    is_active: Boolean,
    created_at: DateTime,
    updated_at: DateTime,
)
```

---

## API 엔드포인트

### 1. 정산 계산

```http
POST /api/settlements/company/calculate
Content-Type: application/json

{
  "company_id": 1,
  "year": 2026,
  "month": 5
}

Response (200):
{
  "id": 1,
  "company_id": 1,
  "settlement_period_year": 2026,
  "settlement_period_month": 5,
  "revenue": {
    "total": "300000.00",
    "guest": "150000.00",
    "credit": "100000.00",
    "waived": "50000.00"
  },
  "recovery": {
    "credit_revenue": "100000.00",
    "recovery_rate": "80.00",
    "recovered_amount": "80000.00"
  },
  "fee": {
    "base_amount": "250000.00",
    "platform_fee_rate": "25.00",
    "platform_fee": "62500.00"
  },
  "deductions": {
    "refund": "5000.00",
    "dispute": "2000.00",
    "other": "1000.00",
    "total": "8000.00"
  },
  "net_settlement": "149500.00",
  "status": "draft",
  "settlement_date": null,
  "payment_method": null,
  "payment_date": null,
  "created_by": null,
  "approved_by": null,
  "paid_by": null,
  "created_at": "2026-06-02T10:00:00",
  "updated_at": "2026-06-02T10:00:00"
}
```

### 2. 정산 조회

```http
GET /api/settlements/company/1/2026/5

Response (200):
{
  // CompanySettlementResponseSchema (위와 동일)
}
```

### 3. 정산 목록

```http
GET /api/settlements/company/1?status=approved&year=2026

Response (200):
[
  { /* CompanySettlementResponseSchema */ },
  { /* CompanySettlementResponseSchema */ },
  ...
]
```

### 4. 정산 승인

```http
PATCH /api/settlements/company/1/approve
Content-Type: application/json

{
  "approved_by": "admin@example.com",
  "notes": "검토 완료, 이상 없음"
}

Response (200):
{
  // status: "approved"
}
```

### 5. 정산 지급

```http
PATCH /api/settlements/company/1/settle
Content-Type: application/json

{
  "payment_method": "bank_transfer",
  "payment_date": "2026-06-05",
  "paid_by": "finance@example.com",
  "notes": "BDO 은행 송금"
}

Response (200):
{
  // status: "settled"
}
```

### 6. 회수율 갱신

```http
PATCH /api/settlements/company/1/recovery-rate
Content-Type: application/json

{
  "recovery_rate": 85.50,
  "updated_by": "admin@example.com",
  "notes": "실제 회수액 기반 조정"
}

Response (200):
{
  // recovered_amount, net_settlement 자동 재계산
}
```

### 7. 거래 기록 조회

```http
GET /api/settlements/company/1/transactions

Response (200):
[
  {
    "id": 101,
    "booking_id": 1001,
    "customer_id": 2001,
    "transaction_type": "booking",
    "settlement_category": "guest",
    "amount": "2000.00",
    "recovery_rate": "100.00",
    "recovered_amount": "2000.00",
    "transaction_date": "2026-05-15",
    "notes": "Booking #1001",
    "created_at": "2026-06-02T10:00:00"
  },
  ...
]
```

---

## 계산 엔진 상세

### SettlementCalculator 워크플로우

```python
class SettlementCalculator:
    
    def calculate_settlement(company_id, year, month):
        """
        Step 1: 데이터 수집
        """
        bookings = _fetch_bookings(company_id, period_start, period_end)
        
        """
        Step 2-3: 매출 분류
        """
        revenue_breakdown = _classify_revenue(bookings, company_id)
        # {
        #   'total_revenue': Decimal,
        #   'guest_revenue': Decimal (100% 회수),
        #   'credit_revenue': Decimal (회수율 적용),
        #   'waived_revenue': Decimal (0% 회수),
        # }
        
        """
        Step 4: 회수액 계산
        """
        recovery_result = _calculate_recovery(credit_revenue, company_id)
        # {
        #   'credit_revenue': Decimal,
        #   'recovery_rate': Decimal (기본 80%),
        #   'recovered_amount': credit_revenue * rate / 100,
        # }
        
        """
        Step 5: 수수료 계산
        """
        fee_result = _calculate_platform_fee(total_revenue, waived_revenue)
        # {
        #   'base_amount': total_revenue - waived_revenue,
        #   'platform_fee_rate': Decimal (기본 25%),
        #   'platform_fee': base_amount * rate / 100,
        # }
        
        """
        Step 6: 차감액 조회
        """
        deductions = _fetch_deductions(company_id, year, month)
        # {
        #   'refund_amount': Decimal,
        #   'dispute_deduction': Decimal,
        #   'other_deduction': Decimal,
        #   'total_deductions': Decimal,
        # }
        
        """
        Step 7: 최종 정산액 계산
        
        Formula:
          net_settlement = (guest_revenue + recovered_amount)
                         - platform_fee
                         - total_deductions
        """
        net_settlement = _calculate_net_settlement(
            guest_revenue=150000,
            recovered_amount=80000,
            platform_fee=62500,
            total_deductions=8000
        )
        # net_settlement = (150000 + 80000) - 62500 - 8000 = 149500
        
        """
        Step 8: 거래 기록 준비 및 저장
        """
        settlement = repo.create_settlement(calculation_result)
        # CompanySettlement 저장
        # SettlementTransaction 일괄 저장
```

### SettlementRuleEngine 규칙 판정

```python
class SettlementRuleEngine:
    
    def determine_settlement_type(booking, company_id):
        """
        settlement_type 자동 판정 (guest / credit / waived)
        
        규칙 우선순위:
        1. 수기 입력값 (booking.settlement_type 이미 설정)
        2. 규칙 매칭 (settlement_rules 테이블)
        3. 기본값 (payment_method 기반)
        """
        
        # Rule 1: 수기 입력
        if booking.settlement_type:
            return booking.settlement_type
        
        # Rule 2: 규칙 매칭
        rule = _match_rule(customer, payment_method)
        if rule:
            return rule.settlement_status  # settled/pending/waived
        
        # Rule 3: 기본값
        if not booking.customer_id:
            return "settled"  # 비회원 → 즉시 정산
        
        if booking.payment_method in ['cash', 'card']:
            return "settled"  # 현금/카드 → 즉시 정산
        
        if booking.payment_method == 'company_credit':
            return "pending"  # 회사 크레딧 → 외상 대기
        
        return "settled"  # 기본값
    
    def get_default_recovery_rate(settlement_category):
        """
        정산 분류별 기본 회수율
        
        - guest: 100% (비회원)
        - credit: 80% (외상, 수기 갱신 가능)
        - waived: 0% (제외)
        """
        return {
            "guest": Decimal(100),
            "credit": Decimal(80),
            "waived": Decimal(0),
        }[settlement_category]
```

---

## 사용 예시

### 예시 1: 월간 정산 자동 계산

```python
from app.services.settlement_engine import SettlementCalculator, SettlementRepository
from sqlalchemy.orm import Session

def calculate_monthly_settlement(db: Session, company_id: int, year: int, month: int):
    """
    월간 정산 자동 계산 및 저장
    """
    # Step 1: 계산 엔진 실행
    calculator = SettlementCalculator(db)
    calculation_result = calculator.calculate_settlement(company_id, year, month)
    
    # Step 2: 결과 확인
    print(f"Company: {calculation_result['company_id']}")
    print(f"Period: {year}-{month:02d}")
    print(f"Total Revenue: {calculation_result['revenue']['total']}")
    print(f"Net Settlement: {calculation_result['net_settlement']}")
    print(f"Status: {calculation_result['status']}")
    
    # Step 3: 저장
    repo = SettlementRepository(db)
    settlement = repo.create_settlement(calculation_result)
    
    return settlement
```

### 예시 2: 외상 회수율 수기 갱신

```python
from app.services.settlement_engine import SettlementRepository

def update_recovery_rate(db: Session, settlement_id: int, new_rate: Decimal):
    """
    외상 회수율 수기 갱신
    
    예: 실제 회수액이 100,000 중 90,000이면 90%로 조정
    """
    repo = SettlementRepository(db)
    
    settlement = repo.update_recovery_rate(
        settlement_id=settlement_id,
        recovery_rate=new_rate,
        updated_by="admin@example.com"
    )
    
    print(f"Updated recovery_rate: {settlement.recovery_rate}%")
    print(f"Recovered amount: {settlement.recovered_amount}")
    print(f"Net settlement: {settlement.net_settlement}")
```

### 예시 3: 정산 승인 및 지급

```python
from datetime import date

def approve_and_settle(db: Session, settlement_id: int):
    """
    정산 승인 후 지급 처리
    
    Workflow: draft → approved → settled
    """
    repo = SettlementRepository(db)
    
    # Step 1: 승인
    settlement = repo.approve_settlement(
        settlement_id=settlement_id,
        approved_by="admin@example.com"
    )
    print(f"Settlement approved: {settlement.status}")
    
    # Step 2: 지급
    settlement = repo.settle_payment(
        settlement_id=settlement_id,
        payment_method="bank_transfer",
        payment_date=date.today(),
        paid_by="finance@example.com"
    )
    print(f"Settlement settled: {settlement.status}")
    print(f"Payment date: {settlement.payment_date}")
```

---

## 마이그레이션 가이드

### Step 1: 데이터베이스 테이블 생성

```bash
# FastAPI 앱의 models/__init__.py에서 임포트 확인
from app.models.company_settlement import (
    CompanySettlement,
    SettlementTransaction,
    SettlementRule,
)

# Alembic 마이그레이션 생성
alembic revision --autogenerate -m "Add company settlement models"

# 마이그레이션 실행
alembic upgrade head
```

### Step 2: API 라우터 등록

```python
# main.py 또는 app/__init__.py에서

from fastapi import FastAPI
from app.routers import company_settlement

app = FastAPI()
app.include_router(company_settlement.router)
```

### Step 3: 초기 규칙 데이터 설정

```python
def initialize_settlement_rules(db: Session):
    """정산 규칙 초기화"""
    rules = [
        SettlementRule(
            rule_name="비회원 즉시정산",
            description="비회원 고객의 현금 결제",
            customer_type="guest",
            payment_method="cash",
            settlement_status="settled",
            recovery_rate=Decimal(100),
            platform_fee_rate=Decimal(25),
            is_active=True,
        ),
        SettlementRule(
            rule_name="업체 외상",
            description="업체 크레딧 고객의 외상",
            customer_type="company",
            payment_method="company_credit",
            settlement_status="pending",
            recovery_rate=Decimal(80),
            platform_fee_rate=Decimal(25),
            is_active=True,
        ),
        SettlementRule(
            rule_name="프로모션 정산 제외",
            description="프로모션 및 인센티브",
            customer_type=None,
            payment_method="promotion",
            settlement_status="waived",
            recovery_rate=Decimal(0),
            platform_fee_rate=Decimal(0),
            is_active=True,
        ),
    ]
    
    for rule in rules:
        db.add(rule)
    
    db.commit()
```

### Step 4: bookings 테이블 마이그레이션

```sql
-- 신규 컬럼 추가 (선택사항, 기존 settlement.py에서 관리 가능)
ALTER TABLE bookings ADD COLUMN settlement_type VARCHAR(50) DEFAULT 'settled';
ALTER TABLE bookings ADD COLUMN settlement_id INTEGER;
ALTER TABLE bookings ADD COLUMN recovery_rate NUMERIC(5, 2) DEFAULT 100;
ALTER TABLE bookings ADD INDEX idx_settlement_type (settlement_type);
```

---

## 테스트 계획

### Unit Tests (app/tests/test_settlement_engine.py)

```python
import pytest
from decimal import Decimal
from app.services.settlement_engine import (
    SettlementCalculator,
    SettlementRuleEngine,
    SettlementRepository,
)

def test_classify_revenue():
    """매출 분류 테스트"""
    # Arrange
    bookings = [
        Booking(customer_id=None, total_price=1000),  # 비회원
        Booking(customer_id=1, total_price=2000, payment_method='company_credit'),  # 외상
        Booking(customer_id=2, total_price=500, payment_method='promotion'),  # 프로모션
    ]
    
    # Act
    calculator = SettlementCalculator(db)
    result = calculator._classify_revenue(bookings, company_id=1)
    
    # Assert
    assert result['guest_revenue'] == Decimal(1000)
    assert result['credit_revenue'] == Decimal(2000)
    assert result['waived_revenue'] == Decimal(500)
    assert result['total_revenue'] == Decimal(3500)

def test_calculate_recovery():
    """회수액 계산 테스트"""
    # Arrange
    credit_revenue = Decimal(100000)
    recovery_rate = Decimal(80)
    
    # Act
    calculator = SettlementCalculator(db)
    result = calculator._calculate_recovery(credit_revenue, company_id=1, year=2026, month=5)
    
    # Assert
    assert result['recovered_amount'] == Decimal(80000)

def test_calculate_net_settlement():
    """최종 정산액 계산 테스트"""
    # Arrange
    guest_revenue = Decimal(150000)
    recovered_amount = Decimal(80000)
    platform_fee = Decimal(62500)
    total_deductions = Decimal(8000)
    
    # Act
    calculator = SettlementCalculator(db)
    net = calculator._calculate_net_settlement(
        guest_revenue,
        recovered_amount,
        platform_fee,
        total_deductions
    )
    
    # Assert
    assert net == Decimal(149500)
```

### Integration Tests (app/tests/test_settlement_api.py)

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_calculate_settlement_endpoint():
    """정산 계산 엔드포인트 테스트"""
    # Arrange
    request_body = {
        "company_id": 1,
        "year": 2026,
        "month": 5
    }
    
    # Act
    response = client.post(
        "/api/settlements/company/calculate",
        json=request_body
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data['company_id'] == 1
    assert data['status'] == 'draft'
    assert 'net_settlement' in data

def test_approve_settlement_workflow():
    """정산 승인 워크플로우 테스트"""
    # Arrange
    settlement_id = 1
    
    # Act
    response = client.patch(
        f"/api/settlements/company/{settlement_id}/approve",
        json={"approved_by": "admin@example.com"}
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'approved'
    assert data['approved_by'] == 'admin@example.com'
```

---

## 주요 체크리스트

### 데이터베이스
- [ ] `company_settlements` 테이블 생성 완료
- [ ] `settlement_transactions` 테이블 생성 완료
- [ ] `settlement_rules` 테이블 생성 완료
- [ ] 외래키 및 인덱스 검증
- [ ] 제약 조건 검증

### 백엔드 코드
- [ ] `app/models/company_settlement.py` 임포트 확인
- [ ] `app/services/settlement_engine.py` 임포트 확인
- [ ] `app/routers/company_settlement.py` FastAPI 등록
- [ ] 초기 규칙 데이터 설정

### API 테스트
- [ ] POST /api/settlements/company/calculate 테스트
- [ ] GET /api/settlements/company/{id}/{year}/{month} 테스트
- [ ] PATCH /api/settlements/company/{id}/approve 테스트
- [ ] PATCH /api/settlements/company/{id}/settle 테스트
- [ ] PATCH /api/settlements/company/{id}/recovery-rate 테스트
- [ ] GET /api/settlements/company/{id}/transactions 테스트

### 비즈니스 로직
- [ ] SettlementCalculator 테스트
- [ ] SettlementRuleEngine 테스트
- [ ] SettlementRepository 테스트
- [ ] 계산 공식 정확성 검증

### 문서화
- [ ] API 문서 (Swagger) 자동 생성 확인
- [ ] 사용자 가이드 작성
- [ ] 관리자 가이드 작성

---

## 다음 단계

### Phase 2: 프론트엔드 구현
1. 관리자 정산 대시보드 UI
2. 정산 상세 조회 페이지
3. 정산 승인 모달
4. 지급 관리 인터페이스
5. 분쟁/환불 관리 UI

### Phase 3: 자동화
1. 월초 자동 정산 계산 (Cron Job)
2. 월말 자동 승인 알림
3. 은행 API 연동 (자동 송금)
4. GCash API 연동
5. 메시지 알림 (WhatsApp, 카카오톡)

### Phase 4: 분석 & 보고
1. 정산 현황 대시보드
2. 월별 비교 분석
3. 업체별 성과 분석
4. 회수율 추이 분석

---

## 문서 버전

| 버전 | 작성자 | 날짜 | 변경 사항 |
|------|--------|------|----------|
| 1.0 | jitnet-gif | 2026-06-02 | 초안 작성 |
| 1.1 (예정) | - | - | 프론트엔드 구현 추가 |
| 1.2 (예정) | - | - | 자동화 기능 추가 |

---

**담당자:** jitnet-gif (kang jichul)  
**연락처:** kangjichul@hanmail.net

