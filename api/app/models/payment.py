"""
결제 시스템 모델
- PaymentRecord: 결제 이력
- TherapistCommissionLedger: 테라피스트 수수료 기록
- PaymentMethodSetting: 결제 수단 설정

생성일: 2026-06-02
"""

from sqlalchemy import Column, BigInteger, Integer, String, Numeric, DateTime, ForeignKey, Boolean, Text, func, JSON, Index, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class PaymentStatusEnum(str, enum.Enum):
    """결제 상태"""
    PENDING = "pending"           # 결제 대기 중
    PAID = "paid"                 # 결제 완료
    FAILED = "failed"             # 결제 실패
    REFUNDED = "refunded"         # 환불됨
    PARTIAL = "partial"           # 부분 결제


class PaymentTypeEnum(str, enum.Enum):
    """결제 유형"""
    BOOKING = "booking"           # 예약 서비스
    DEPOSIT = "deposit"           # 선금
    REFUND = "refund"             # 환불
    ADJUSTMENT = "adjustment"     # 조정


class TransactionStatusEnum(str, enum.Enum):
    """거래 상태"""
    PENDING = "pending"           # 대기 중
    COMPLETED = "completed"       # 완료
    FAILED = "failed"             # 실패
    CANCELLED = "cancelled"       # 취소


class PaymentGatewayEnum(str, enum.Enum):
    """결제 게이트웨이"""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    PAYMONGO = "paymongo"
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    NONE = "none"


class PaymentMethodEnum(str, enum.Enum):
    """결제 수단"""
    CARD = "card"                 # 신용/체크카드
    CASH = "cash"                 # 현금
    KAKAOPAY = "kakaopay"         # 카카오페이
    BANK_TRANSFER = "bank_transfer"  # 계좌이체
    PAYMONGO = "paymongo"         # PayMongo


class TransactionTypeEnum(str, enum.Enum):
    """거래 유형"""
    BOOKING_SERVICE = "booking_service"  # 예약 서비스
    REFERRAL = "referral"                 # 레퍼럴
    ADJUSTMENT = "adjustment"             # 조정
    BONUS = "bonus"                       # 보너스


class CommissionStatusEnum(str, enum.Enum):
    """수수료 상태"""
    PENDING = "pending"           # 대기 중 (결제 전)
    APPROVED = "approved"         # 승인됨
    PAID = "paid"                 # 지급됨
    CANCELLED = "cancelled"       # 취소됨


class PaymentRecord(Base):
    """
    결제 기록 모델

    모든 결제 거래를 추적하는 감사 로그 역할
    - 결제 이력 추적
    - 환불 기록
    - 거래 상태 관리

    인덱스:
    - (booking_id, therapist_id): 예약별 테라피스트 조회
    - transaction_id: 거래 ID로 빠른 조회
    """

    __tablename__ = "payment_records"

    # 기본 정보
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    booking_id = Column(BigInteger, ForeignKey("bookings.id"), nullable=False, index=True)
    therapist_id = Column(BigInteger, ForeignKey("therapists.id"), nullable=True)

    # 금액 정보
    amount = Column(Numeric(10, 2), nullable=False, comment="결제 금액")
    payment_type = Column(
        String(50),
        nullable=False,
        comment="booking(예약), deposit(선금), refund(환불), adjustment(조정)"
    )

    # 상태 정보
    status = Column(
        String(50),
        nullable=False,
        default="completed",
        comment="pending(대기), completed(완료), failed(실패), cancelled(취소)"
    )

    # 게이트웨이 정보
    gateway = Column(
        String(50),
        nullable=True,
        comment="stripe, paypal, paymongo, cash, bank_transfer"
    )

    # 거래 참조 정보
    transaction_id = Column(
        String(255),
        nullable=True,
        unique=True,
        comment="외부 결제 게이트웨이 거래 ID"
    )
    reference_code = Column(
        String(100),
        nullable=True,
        comment="내부 참조 코드"
    )

    # 결제 수단
    method = Column(
        String(50),
        nullable=True,
        comment="card(카드), cash(현금), kakaopay, bank_transfer"
    )

    # 추가 데이터
    metadata = Column(
        JSON,
        nullable=True,
        comment="승인 번호, 카드 마지막 4자리 등 추가 정보"
    )

    # 타임스탐프
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 인덱스 정의
    __table_args__ = (
        Index("ix_payment_records_booking_therapist", "booking_id", "therapist_id"),
        Index("ix_payment_records_transaction", "transaction_id"),
    )


class TherapistCommissionLedger(Base):
    """
    테라피스트 수수료 기록 모델

    - 테라피스트별 수수료 추적
    - 월별 정산 기준
    - 수수료 상태 관리

    주요 필드:
    - commission_amount: 실제 수수료 금액
    - commission_rate: 수수료율 (%)
    - base_amount: 계산 기준이 된 금액
    - period: 월정산 기준 (2026-06)
    - status: pending(미지급) → approved(승인) → paid(지급)

    인덱스:
    - (therapist_id, period): 테라피스트별 월별 조회
    - (status, period): 상태별 월별 조회
    """

    __tablename__ = "therapist_commission_ledger"

    # 기본 정보
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    therapist_id = Column(BigInteger, ForeignKey("therapists.id"), nullable=False, index=True)
    booking_id = Column(BigInteger, ForeignKey("bookings.id"), nullable=True)

    # 수수료 정보
    commission_amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="지급할 수수료 금액"
    )
    commission_rate = Column(
        Numeric(5, 2),
        nullable=True,
        comment="수수료율 (%)"
    )
    base_amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="수수료 계산 기준 금액"
    )

    # 거래 정보
    transaction_type = Column(
        String(50),
        nullable=False,
        comment="booking_service(서비스), referral(레퍼럴), adjustment(조정)"
    )

    # 상태 정보
    status = Column(
        String(50),
        nullable=False,
        default="pending",
        comment="pending(대기), approved(승인), paid(지급), cancelled(취소)"
    )

    # 정산 기간
    period = Column(
        String(10),
        nullable=True,
        index=True,
        comment="월정산 기준 (YYYY-MM)"
    )

    # 추가 정보
    notes = Column(
        String(500),
        nullable=True,
        comment="조정 사유 등 메모"
    )

    # 타임스탐프
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 인덱스 정의
    __table_args__ = (
        Index("ix_therapist_commission_ledger_period", "therapist_id", "period"),
        Index("ix_therapist_commission_ledger_status", "status", "period"),
    )


class PaymentMethodSetting(Base):
    """
    결제 수단 설정 모델

    - 사용 가능한 결제 수단 목록
    - 수단별 설정 (수수료율, 활성화 여부 등)
    - 결제 게이트웨이 매핑

    예시:
    - 현금: 수수료 0%, 오프라인
    - 신용카드: Stripe 게이트웨이, 2.9% 수수료
    - 카카오페이: 1.5% 수수료
    """

    __tablename__ = "payment_method_settings"

    # 기본 정보
    id = Column(Integer, primary_key=True, autoincrement=True)
    method_name = Column(
        String(50),
        nullable=False,
        unique=True,
        comment="card, cash, kakaopay, bank_transfer"
    )
    display_name = Column(
        String(100),
        nullable=False,
        comment="사용자에게 표시할 이름"
    )

    # 게이트웨이
    gateway = Column(
        String(50),
        nullable=True,
        comment="stripe, paypal, paymongo 등"
    )

    # 활성화 여부
    is_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="사용 가능 여부"
    )

    # 온라인/오프라인
    is_online = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="온라인 결제 여부"
    )

    # 수수료
    fee_percentage = Column(
        Numeric(5, 2),
        nullable=True,
        comment="수수료율 (%)"
    )

    # 설명
    description = Column(
        String(255),
        nullable=True,
        comment="결제 수단 설명"
    )

    # 타임스탐프
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# Booking 모델 확장 필드 (alembic 마이그레이션에서 추가됨)
# Booking 테이블에 추가되는 필드:
# - payment_status: 결제 상태 (pending, paid, failed, refunded, partial)
# - payment_details: 결제 상세 정보 (JSON)
# - paid_at: 실제 결제 완료 시간
# - payment_gateway: 사용된 결제 게이트웨이 (stripe, paypal, paymongo, cash, bank_transfer, none)
