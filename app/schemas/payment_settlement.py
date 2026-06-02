"""
============================================================
📌 스키마: Payment & Settlement (결제/정산 API)
📋 목적: 결제 방법, SSS옵션, 정산 관련 입출력 검증
📅 작성일: 2026-06-02
설명: 예약별 결제 방법 관리, SSS선지급 옵션, 정산 상태 추적

스키마 (8개):
  - PaymentMethodCreate, PaymentMethodResponse
  - SSSOptionUpdate, PaymentSourceUpdate
  - SettlementPending, SettlementMarkedSettled
  - SettlementResponse (기본 응답)
============================================================
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


# ============================================================
# 열거형 (Enums)
# ============================================================

class PaymentMethodType(str, Enum):
    """지급 방법"""
    BANK_TRANSFER = "bank_transfer"  # 은행 송금
    GCASH = "gcash"                   # GCash (필리핀 전자지갑)
    CASH = "cash"                     # 현금
    CHECK = "check"                   # 수표
    CARD = "card"                     # 카드
    MANUAL = "manual"                 # 수기 기록


class SSSStatus(str, Enum):
    """SSS 정산 상태"""
    NOT_APPLICABLE = "not_applicable"  # 해당 없음
    PREPAID = "prepaid"                # 선지급 (정부 인보이스)
    GOVERNMENT_INVOICE = "gov_invoice" # 정부 인보이스
    FULL_RECOVERY = "full_recovery"    # 전액 회수


class PaymentFromType(str, Enum):
    """결제 출처"""
    CUSTOMER = "customer"              # 고객 직접 결제
    COMPANY_CREDIT = "company_credit"  # 기업 외상
    VOUCHER = "voucher"                # 바우처
    MEMBERSHIP = "membership"          # 멤버십
    PROMO = "promo"                    # 프로모션


class SettlementStatus(str, Enum):
    """정산 상태"""
    PENDING = "pending"                # 대기 중
    DRAFT = "draft"                    # 초안
    APPROVED = "approved"              # 승인됨
    SETTLED = "settled"                # 정산 완료
    CONFIRMED = "confirmed"            # 확정됨
    REJECTED = "rejected"              # 거부됨


# ============================================================
# 결제 방법 관련 스키마
# ============================================================

class PaymentMethodCreate(BaseModel):
    """결제 방법 추가 요청"""
    booking_id: int = Field(..., description="예약 ID")
    payment_method: PaymentMethodType = Field(..., description="지급 방법")
    account_number: Optional[str] = Field(None, description="은행 계좌번호")
    account_name: Optional[str] = Field(None, description="계좌 소유자명")
    bank_name: Optional[str] = Field(None, description="은행명")
    gcash_number: Optional[str] = Field(None, description="GCash 번호")
    notes: Optional[str] = Field(None, description="비고")

    class Config:
        json_schema_extra = {
            "example": {
                "booking_id": 12345,
                "payment_method": "bank_transfer",
                "account_number": "123456789",
                "account_name": "John Doe",
                "bank_name": "BDO",
                "notes": "예약 관련 결제"
            }
        }


class PaymentMethodResponse(BaseModel):
    """결제 방법 응답"""
    id: int = Field(..., description="결제 방법 ID")
    booking_id: int = Field(..., description="예약 ID")
    payment_method: PaymentMethodType = Field(..., description="지급 방법")
    account_number: Optional[str] = Field(None, description="계좌번호")
    account_name: Optional[str] = Field(None, description="계좌 소유자명")
    bank_name: Optional[str] = Field(None, description="은행명")
    gcash_number: Optional[str] = Field(None, description="GCash 번호")
    notes: Optional[str] = None
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "booking_id": 12345,
                "payment_method": "bank_transfer",
                "account_number": "123456789",
                "account_name": "John Doe",
                "bank_name": "BDO",
                "gcash_number": None,
                "notes": "예약 관련 결제",
                "created_at": "2026-06-02T10:30:00Z",
                "updated_at": "2026-06-02T10:30:00Z"
            }
        }


# ============================================================
# SSS 옵션 관련 스키마
# ============================================================

class SSSOptionUpdate(BaseModel):
    """SSS 정산 옵션 업데이트"""
    booking_id: int = Field(..., description="예약 ID")
    sss_status: SSSStatus = Field(..., description="SSS 상태")
    sss_contribution_percent: Optional[float] = Field(None, ge=0, le=100, description="SSS 기여율 (%)")
    notes: Optional[str] = Field(None, description="비고")

    class Config:
        json_schema_extra = {
            "example": {
                "booking_id": 12345,
                "sss_status": "prepaid",
                "sss_contribution_percent": 12.5,
                "notes": "선지급 기반 정산"
            }
        }


class SSSOptionResponse(BaseModel):
    """SSS 옵션 응답"""
    booking_id: int
    sss_status: SSSStatus
    sss_contribution_percent: Optional[float] = None
    notes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "booking_id": 12345,
                "sss_status": "prepaid",
                "sss_contribution_percent": 12.5,
                "notes": "선지급 기반 정산",
                "updated_at": "2026-06-02T10:30:00Z"
            }
        }


# ============================================================
# 결제 출처 관련 스키마
# ============================================================

class PaymentSourceUpdate(BaseModel):
    """결제 출처 업데이트"""
    booking_id: int = Field(..., description="예약 ID")
    payment_from: PaymentFromType = Field(..., description="결제 출처")
    company_credit_id: Optional[int] = Field(None, description="기업 외상 ID (payment_from이 company_credit일 경우)")
    voucher_id: Optional[int] = Field(None, description="바우처 ID (payment_from이 voucher일 경우)")
    notes: Optional[str] = Field(None, description="비고")

    class Config:
        json_schema_extra = {
            "example": {
                "booking_id": 12345,
                "payment_from": "company_credit",
                "company_credit_id": 567,
                "notes": "ABC회사 신용"
            }
        }


class PaymentSourceResponse(BaseModel):
    """결제 출처 응답"""
    booking_id: int
    payment_from: PaymentFromType
    company_credit_id: Optional[int] = None
    voucher_id: Optional[int] = None
    notes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "booking_id": 12345,
                "payment_from": "company_credit",
                "company_credit_id": 567,
                "notes": "ABC회사 신용",
                "updated_at": "2026-06-02T10:30:00Z"
            }
        }


# ============================================================
# 정산 관련 스키마
# ============================================================

class SettlementTransactionDetail(BaseModel):
    """정산 거래 상세"""
    id: int = Field(..., description="거래 ID")
    booking_id: Optional[int] = Field(None, description="예약 ID")
    transaction_type: str = Field(..., description="거래 유형: booking, refund, dispute, adjustment")
    settlement_category: str = Field(..., description="분류: guest, credit, waived")
    amount: Decimal = Field(..., description="금액")
    recovery_rate: Decimal = Field(..., description="회수율 (%)")
    recovered_amount: Decimal = Field(..., description="회수액")
    transaction_date: date = Field(..., description="거래 날짜")
    notes: Optional[str] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 101,
                "booking_id": 12345,
                "transaction_type": "booking",
                "settlement_category": "guest",
                "amount": Decimal("5000.00"),
                "recovery_rate": Decimal("100.00"),
                "recovered_amount": Decimal("5000.00"),
                "transaction_date": "2026-06-02",
                "notes": "일반 고객 결제"
            }
        }


class SettlementPending(BaseModel):
    """정산 대기 항목"""
    id: int = Field(..., description="정산 ID")
    company_id: int = Field(..., description="업체 ID")
    settlement_period_year: int = Field(..., description="정산 연도")
    settlement_period_month: int = Field(..., description="정산 월")
    total_revenue: Decimal = Field(..., description="총 매출액")
    guest_revenue: Decimal = Field(..., description="비회원 매출")
    credit_revenue: Decimal = Field(..., description="외상 매출")
    waived_revenue: Decimal = Field(..., description="제외 매출")
    recovery_rate: Decimal = Field(..., description="외상 회수율 (%)")
    platform_fee: Decimal = Field(..., description="플랫폼 수수료")
    net_settlement: Decimal = Field(..., description="순정산액")
    status: SettlementStatus = Field(..., description="정산 상태")
    transactions: List[SettlementTransactionDetail] = Field(default_factory=list, description="거래 내역")
    created_at: datetime = Field(..., description="생성 시간")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "company_id": 100,
                "settlement_period_year": 2026,
                "settlement_period_month": 6,
                "total_revenue": Decimal("50000.00"),
                "guest_revenue": Decimal("30000.00"),
                "credit_revenue": Decimal("20000.00"),
                "waived_revenue": Decimal("0.00"),
                "recovery_rate": Decimal("100.00"),
                "platform_fee": Decimal("12500.00"),
                "net_settlement": Decimal("37500.00"),
                "status": "pending",
                "transactions": [],
                "created_at": "2026-06-02T10:30:00Z"
            }
        }


class SettlementListResponse(BaseModel):
    """정산 목록 응답"""
    total: int = Field(..., description="총 항목 수")
    pending_count: int = Field(..., description="대기 중 항목 수")
    items: List[SettlementPending] = Field(..., description="정산 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 5,
                "pending_count": 3,
                "items": []
            }
        }


class SettlementMarkSettledRequest(BaseModel):
    """정산 완료 처리 요청"""
    settlement_id: int = Field(..., description="정산 ID")
    payment_method: PaymentMethodType = Field(..., description="지급 방법")
    payment_date: date = Field(..., description="실제 지급 날짜")
    notes: Optional[str] = Field(None, description="비고")
    paid_by: Optional[str] = Field(None, description="처리자")

    class Config:
        json_schema_extra = {
            "example": {
                "settlement_id": 1,
                "payment_method": "bank_transfer",
                "payment_date": "2026-06-02",
                "notes": "BDO 계좌로 이체",
                "paid_by": "admin_user"
            }
        }


class SettlementMarkedSettled(BaseModel):
    """정산 완료 처리 응답"""
    id: int = Field(..., description="정산 ID")
    status: SettlementStatus = Field(..., description="정산 상태")
    payment_method: PaymentMethodType = Field(..., description="지급 방법")
    payment_date: date = Field(..., description="지급 날짜")
    net_settlement: Decimal = Field(..., description="순정산액")
    updated_at: datetime = Field(..., description="수정 시간")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "status": "settled",
                "payment_method": "bank_transfer",
                "payment_date": "2026-06-02",
                "net_settlement": Decimal("37500.00"),
                "updated_at": "2026-06-02T15:30:00Z"
            }
        }


class SettlementResponse(BaseModel):
    """정산 기본 응답"""
    id: int
    company_id: int
    settlement_period_year: int
    settlement_period_month: int
    total_revenue: Decimal
    platform_fee: Decimal
    net_settlement: Decimal
    status: SettlementStatus
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# 통합 응답 스키마
# ============================================================

class BookingPaymentInfo(BaseModel):
    """예약 결제 정보 통합"""
    booking_id: int
    payment_method: Optional[PaymentMethodType] = None
    payment_from: Optional[PaymentFromType] = None
    sss_status: Optional[SSSStatus] = None
    payment_method_details: Optional[PaymentMethodResponse] = None
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "booking_id": 12345,
                "payment_method": "bank_transfer",
                "payment_from": "company_credit",
                "sss_status": "prepaid",
                "payment_method_details": None,
                "updated_at": "2026-06-02T10:30:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """에러 응답"""
    status: int = Field(..., description="HTTP 상태 코드")
    message: str = Field(..., description="에러 메시지")
    detail: Optional[str] = Field(None, description="상세 설명")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="발생 시간")

    class Config:
        json_schema_extra = {
            "example": {
                "status": 400,
                "message": "Invalid booking ID",
                "detail": "Booking with ID 12345 not found",
                "timestamp": "2026-06-02T10:30:00Z"
            }
        }
