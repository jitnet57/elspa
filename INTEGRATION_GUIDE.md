# 결제/정산 API 통합 가이드

**작성일:** 2026-06-02  
**대상:** 백엔드 개발자

---

## 🚀 빠른 시작

### Step 1: 라우터 등록 (main.py)

```python
from fastapi import FastAPI
from app.routers.payment_settlement import payment_router, settlement_router

app = FastAPI()

# 라우터 등록
app.include_router(payment_router)
app.include_router(settlement_router)
```

### Step 2: 스키마 임포트 검증

```bash
cd /Users/kwangseobpark/elspa
python -c "from app.schemas.payment_settlement import PaymentMethodCreate; print('✓ 스키마 임포트 성공')"
```

### Step 3: 모델 확장 (선택사항)

Booking 모델에 다음 필드 추가:

```python
# app/models/booking.py
from sqlalchemy import Column, String, Float

class Booking(Base):
    # 기존 필드...
    
    # 새로운 필드
    payment_method = Column(String(50), nullable=True)  # bank_transfer, gcash 등
    payment_from = Column(String(50), nullable=True)    # customer, company_credit 등
    sss_status = Column(String(50), nullable=True)      # prepaid, gov_invoice 등
    sss_contribution_percent = Column(Float, default=12.5)
```

### Step 4: 마이그레이션 생성

```bash
# Alembic을 사용하는 경우
alembic revision --autogenerate -m "Add payment and SSS fields to Booking"
alembic upgrade head
```

---

## 📊 API 엔드포인트 매핑

| 엔드포인트 | 파일 | 함수 | 상태 |
|----------|------|------|------|
| POST `/api/bookings/{id}/payment-methods` | payment_settlement.py | `add_payment_method()` | ✅ |
| PATCH `/api/bookings/{id}/sss-option` | payment_settlement.py | `update_sss_option()` | ✅ |
| PATCH `/api/bookings/{id}/payment-from` | payment_settlement.py | `update_payment_source()` | ✅ |
| GET `/api/bookings/{id}/payment-info` | payment_settlement.py | `get_booking_payment_info()` | ✅ |
| GET `/api/settlements/pending` | payment_settlement.py | `get_pending_settlements()` | ✅ |
| GET `/api/settlements/{id}` | payment_settlement.py | `get_settlement_details()` | ✅ |
| PATCH `/api/settlements/{id}/mark-settled` | payment_settlement.py | `mark_settlement_as_settled()` | ✅ |

---

## 🔧 세부 구현 가이드

### 1. PaymentMethod 모델 생성

**파일:** `app/models/payment_method.py`

```python
from sqlalchemy import Column, Integer, String, DateTime, Text, BigInteger, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class PaymentMethod(Base):
    """예약별 결제 방법 기록"""
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(BigInteger, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    payment_method = Column(String(50), nullable=False)  # bank_transfer, gcash, cash, check, card, manual
    account_number = Column(String(100), nullable=True)
    account_name = Column(String(100), nullable=True)
    bank_name = Column(String(100), nullable=True)
    gcash_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 관계
    booking = relationship("Booking", backref="payment_methods")
```

### 2. 서비스 레이어 작성

**파일:** `app/services/payment_settlement_service.py`

```python
from sqlalchemy.orm import Session
from app.models.booking import Booking
from app.models.company_settlement import CompanySettlement, SettlementTransaction
from datetime import datetime
from decimal import Decimal


class PaymentSettlementService:
    """결제/정산 비즈니스 로직"""
    
    @staticmethod
    def get_booking_or_raise(db: Session, booking_id: int):
        """예약 조회 또는 예외 발생"""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found")
        return booking
    
    @staticmethod
    def get_settlement_or_raise(db: Session, settlement_id: int):
        """정산 조회 또는 예외 발생"""
        settlement = db.query(CompanySettlement).filter(
            CompanySettlement.id == settlement_id
        ).first()
        if not settlement:
            raise ValueError(f"Settlement {settlement_id} not found")
        return settlement
    
    @staticmethod
    def validate_payment_method(payment_method: str, account_number: str = None):
        """결제 방법 유효성 검사"""
        if payment_method == "bank_transfer" and not account_number:
            raise ValueError("Bank transfer requires account_number")
        if payment_method == "gcash" and not account_number:
            raise ValueError("GCash requires gcash_number")
    
    @staticmethod
    def calculate_settlement(settlement: CompanySettlement) -> Decimal:
        """정산액 계산"""
        guest_recovered = settlement.guest_revenue
        credit_recovered = (
            settlement.credit_revenue * 
            (settlement.recovery_rate / Decimal(100))
        )
        total_deductions = (
            settlement.platform_fee + 
            settlement.refund_amount + 
            settlement.dispute_deduction + 
            settlement.other_deduction
        )
        
        net_settlement = guest_recovered + credit_recovered - total_deductions
        return max(net_settlement, Decimal(0))


# 사용 예
service = PaymentSettlementService()
booking = service.get_booking_or_raise(db, booking_id)
settlement = service.get_settlement_or_raise(db, settlement_id)
```

### 3. 라우터 함수 구현 (업데이트)

기존 `app/routers/payment_settlement.py`의 NOTE: 섹션을 다음과 같이 교체:

```python
# payment_settlement.py의 add_payment_method() 함수 내
from app.models.payment_method import PaymentMethod

# db_payment = PaymentMethod(
#     booking_id=booking_id,
#     payment_method=payload.payment_method.value,
#     account_number=payload.account_number,
#     account_name=payload.account_name,
#     bank_name=payload.bank_name,
#     gcash_number=payload.gcash_number,
#     notes=payload.notes,
# )
# db.add(db_payment)
# db.commit()
# db.refresh(db_payment)
```

---

## 🧪 테스트 코드 예제

**파일:** `tests/test_payment_settlement.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal


client = TestClient(app)


@pytest.fixture
def db():
    """테스트 데이터베이스 세션"""
    db = SessionLocal()
    yield db
    db.close()


def test_add_payment_method(db):
    """결제 방법 추가 테스트"""
    response = client.post(
        "/api/bookings/1/payment-methods",
        json={
            "payment_method": "bank_transfer",
            "account_number": "123456789",
            "account_name": "John Doe",
            "bank_name": "BDO",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["payment_method"] == "bank_transfer"
    assert data["booking_id"] == 1


def test_update_sss_option(db):
    """SSS 옵션 업데이트 테스트"""
    response = client.patch(
        "/api/bookings/1/sss-option",
        json={
            "sss_status": "prepaid",
            "sss_contribution_percent": 12.5,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sss_status"] == "prepaid"


def test_get_pending_settlements(db):
    """정산 대기 목록 조회 테스트"""
    response = client.get("/api/settlements/pending")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "pending_count" in data
    assert "items" in data


def test_mark_settlement_as_settled(db):
    """정산 완료 처리 테스트"""
    response = client.patch(
        "/api/settlements/1/mark-settled",
        json={
            "payment_method": "bank_transfer",
            "payment_date": "2026-06-02",
            "paid_by": "admin_user",
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "settled"
```

---

## 📋 데이터베이스 마이그레이션

### Alembic 스크립트 예제

**파일:** `alembic/versions/xxxx_add_payment_sss_fields.py`

```python
"""Add payment and SSS fields to booking"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    # Booking 테이블에 필드 추가
    op.add_column('bookings', sa.Column('payment_method', sa.String(50), nullable=True))
    op.add_column('bookings', sa.Column('payment_from', sa.String(50), nullable=True))
    op.add_column('bookings', sa.Column('sss_status', sa.String(50), nullable=True))
    op.add_column('bookings', sa.Column('sss_contribution_percent', sa.Float(), nullable=True))
    
    # PaymentMethod 테이블 생성
    op.create_table(
        'payment_methods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.BigInteger(), nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=False),
        sa.Column('account_number', sa.String(100), nullable=True),
        sa.Column('account_name', sa.String(100), nullable=True),
        sa.Column('bank_name', sa.String(100), nullable=True),
        sa.Column('gcash_number', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payment_methods_booking_id', 'payment_methods', ['booking_id'])


def downgrade():
    op.drop_index('ix_payment_methods_booking_id', table_name='payment_methods')
    op.drop_table('payment_methods')
    op.drop_column('bookings', 'sss_contribution_percent')
    op.drop_column('bookings', 'sss_status')
    op.drop_column('bookings', 'payment_from')
    op.drop_column('bookings', 'payment_method')
```

---

## 🔄 정산 자동화 (배치 작업)

### 월간 정산 생성 배치

**파일:** `app/tasks/settlement_tasks.py`

```python
from celery import shared_task
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.company_settlement import CompanySettlement
from datetime import datetime, date
from decimal import Decimal


@shared_task
def create_monthly_settlements():
    """매월 1일에 전월 정산 생성"""
    db = SessionLocal()
    try:
        today = date.today()
        prev_month = today.month - 1 if today.month > 1 else 12
        prev_year = today.year if today.month > 1 else today.year - 1
        
        # 정산 데이터 조회 및 생성
        # (구현 생략)
        
        db.commit()
    finally:
        db.close()


# Celery Beat 스케줄 설정 (celery.py)
from celery.schedules import crontab

app.conf.beat_schedule = {
    'create-monthly-settlements': {
        'task': 'app.tasks.settlement_tasks.create_monthly_settlements',
        'schedule': crontab(hour=0, minute=0, day_of_month=1),  # 매월 1일 00:00
    },
}
```

---

## 🐛 일반적인 오류 및 해결

### 오류 1: 모델 필드 누락

**증상:** `AttributeError: 'Booking' object has no attribute 'sss_status'`

**해결:**
```bash
# Step 1: Booking 모델에 필드 추가 (위 참고)
# Step 2: 마이그레이션 생성
alembic revision --autogenerate -m "Add SSS fields"
# Step 3: 마이그레이션 적용
alembic upgrade head
```

### 오류 2: 스키마 임포트 실패

**증상:** `ModuleNotFoundError: No module named 'app.schemas.payment_settlement'`

**해결:**
```bash
# 파일 경로 확인
ls -la app/schemas/payment_settlement.py

# Python 경로 확인
export PYTHONPATH=/Users/kwangseobpark/elspa:$PYTHONPATH
python -c "from app.schemas.payment_settlement import PaymentMethodCreate"
```

### 오류 3: 데이터베이스 제약조건 위반

**증상:** `sqlalchemy.exc.IntegrityError: (psycopg2.IntegrityError) duplicate key`

**해결:**
```python
# 트랜잭션 롤백 후 재시도
try:
    db.commit()
except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=400, detail="중복된 데이터")
```

---

## ✅ 체크리스트

### 사전 준비
- [ ] 현재 프로젝트 구조 확인
- [ ] FastAPI, SQLAlchemy 버전 확인
- [ ] PostgreSQL 데이터베이스 접근 확인

### 구현
- [ ] `app/schemas/payment_settlement.py` 복사
- [ ] `app/routers/payment_settlement.py` 복사
- [ ] `main.py`에 라우터 등록
- [ ] `app/models/payment_method.py` 생성 (선택)
- [ ] `app/models/booking.py` 확장 (선택)

### 테스트
- [ ] 스키마 임포트 테스트
- [ ] 라우터 등록 확인
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 연결 테스트

### 배포
- [ ] 마이그레이션 스크립트 작성
- [ ] 프로덕션 데이터베이스 마이그레이션
- [ ] API 문서 (Swagger) 확인
- [ ] 모니터링 설정

---

## 📞 지원

**문제 발생 시:**
1. `API_PAYMENT_SETTLEMENT_SPEC.md` 확인
2. 위 "일반적인 오류" 섹션 확인
3. 로그 파일 확인
4. 담당자에게 문의

**담당자:** jitnet-gif  
**이메일:** kangjichul@hanmail.net

---

**최종 수정:** 2026-06-02
