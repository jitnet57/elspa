"""
업체 정산 시스템 — SQLAlchemy 모델 (3개)
경로: app/models/company_settlement.py
작성일: 2026-06-02
설명: CompanySettlement, SettlementTransaction, SettlementRule
"""

from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Boolean,
    ForeignKey, Numeric, Index, UniqueConstraint, CheckConstraint, BigInteger, Text
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class SettlementStatus(str, enum.Enum):
    """정산 상태"""
    DRAFT = "draft"           # 초안 (자동 계산 완료)
    APPROVED = "approved"     # 승인됨 (관리자 확인)
    SETTLED = "settled"       # 정산 완료 (지급 완료)
    REJECTED = "rejected"     # 거부됨 (재계산 필요)
    CONFIRMED = "confirmed"   # 확정됨 (은행 거래 확인)


class SettlementCategory(str, enum.Enum):
    """정산 분류"""
    GUEST = "guest"           # 비회원 (회수율 100%)
    CREDIT = "credit"         # 외상 (회수율 변동)
    WAIVED = "waived"         # 제외 (회수율 0%)


class TransactionType(str, enum.Enum):
    """거래 유형"""
    BOOKING = "booking"       # 예약 매출
    REFUND = "refund"         # 환불
    DISPUTE = "dispute"       # 분쟁
    ADJUSTMENT = "adjustment" # 조정


class PaymentMethod(str, enum.Enum):
    """지급 방법"""
    BANK_TRANSFER = "bank_transfer"
    GCASH = "gcash"
    CASH = "cash"
    CHECK = "check"
    MANUAL = "manual"


# ============================================================
# 모델 1: CompanySettlement (월간 정산)
# ============================================================
class CompanySettlement(Base):
    """
    업체 월간 정산 기록
    자동 계산 + 관리자 승인 + 지급 추적

    특징:
      - 정산 기간: 월 단위 (year + month)
      - 정산 상태: draft → approved → settled → confirmed
      - 거래 추적: settlement_transactions 통해 상세 기록
      - 금액 정밀도: Numeric(12, 2) - 필리핀 페소

    제약 조건:
      - (company_id, settlement_period_year, settlement_period_month) UNIQUE
      - 모든 금액 >= 0 (CHECK)
      - recovery_rate 0~100% (CHECK)
      - platform_fee_rate 0~100% (CHECK)

    인덱스:
      - (company_id, settlement_period_year, settlement_period_month)
      - (status)
      - (payment_date)
    """
    __tablename__ = "company_settlements"

    # ━━━ 기본 정보 ━━━
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(BigInteger, nullable=False, index=True)
    settlement_period_year = Column(Integer, nullable=False)
    settlement_period_month = Column(Integer, nullable=False)

    # ━━━ 매출 분류 ━━━
    total_revenue = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="총 매출액"
    )
    guest_revenue = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="비회원 매출 (회수율 100%)"
    )
    credit_revenue = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="외상 매출 (회수율 변동)"
    )
    waived_revenue = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="제외 매출 (회수율 0%, 정산 제외)"
    )

    # ━━━ 외상 회수 ━━━
    recovery_rate = Column(
        Numeric(5, 2),
        nullable=False,
        default=100,
        comment="외상 회수율 (%) - 관리자 수기 갱신"
    )
    recovered_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="실제 회수액 = credit_revenue × recovery_rate / 100"
    )

    # ━━━ 수수료 ━━━
    platform_fee_rate = Column(
        Numeric(5, 2),
        nullable=False,
        default=25,
        comment="플랫폼 수수료율 (%)"
    )
    platform_fee = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="플랫폼 수수료 = (total_revenue - waived_revenue) × rate / 100"
    )

    # ━━━ 차감 항목 ━━━
    refund_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="환불액"
    )
    dispute_deduction = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="분쟁으로 인한 차감액"
    )
    other_deduction = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="기타 차감액"
    )
    total_deductions = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="총 차감액"
    )

    # ━━━ 최종 정산액 ━━━
    net_settlement = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="순정산액 = (guest + recovered) - fee - deductions"
    )

    # ━━━ 상태 ━━━
    status = Column(
        String(50),
        nullable=False,
        default="draft",
        index=True,
        comment="draft, approved, settled, rejected, confirmed"
    )
    settlement_date = Column(
        Date,
        nullable=True,
        comment="정산 완료일"
    )
    payment_method = Column(
        String(50),
        nullable=True,
        comment="지급 방법"
    )
    payment_date = Column(
        Date,
        nullable=True,
        index=True,
        comment="실제 지급일"
    )

    # ━━━ 메모 ━━━
    notes = Column(
        Text,
        nullable=True,
        comment="일반 메모"
    )
    dispute_notes = Column(
        Text,
        nullable=True,
        comment="분쟁 관련 메모"
    )

    # ━━━ 감시 정보 (Audit Trail) ━━━
    created_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    paid_by = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ━━━ 제약 조건 ━━━
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "settlement_period_year",
            "settlement_period_month",
            name="uq_company_settlement_period"
        ),
        CheckConstraint("total_revenue >= 0", name="ck_total_revenue_positive"),
        CheckConstraint("guest_revenue >= 0", name="ck_guest_revenue_positive"),
        CheckConstraint("credit_revenue >= 0", name="ck_credit_revenue_positive"),
        CheckConstraint("waived_revenue >= 0", name="ck_waived_revenue_positive"),
        CheckConstraint("recovery_rate >= 0 AND recovery_rate <= 100", name="ck_recovery_rate_range"),
        CheckConstraint("platform_fee_rate >= 0 AND platform_fee_rate <= 100", name="ck_platform_fee_rate_range"),
        CheckConstraint("platform_fee >= 0", name="ck_platform_fee_positive"),
        CheckConstraint("total_deductions >= 0", name="ck_total_deductions_positive"),
        CheckConstraint("net_settlement >= 0", name="ck_net_settlement_positive"),
        Index("idx_company_settlement_period", "company_id", "settlement_period_year", "settlement_period_month"),
        Index("idx_company_settlement_status", "status"),
        Index("idx_company_settlement_payment_date", "payment_date"),
    )

    # ━━━ 관계 ━━━
    transactions = relationship(
        "SettlementTransaction",
        back_populates="company_settlement",
        cascade="all, delete-orphan",
        foreign_keys="SettlementTransaction.company_settlement_id"
    )

    # ============================================================
    # 메서드: 정산 상태 관리
    # ============================================================

    def mark_settled(self, payment_date: date = None, payment_method: str = None, paid_by: str = None) -> bool:
        """
        정산을 완료 상태로 변경

        매개변수:
            payment_date (date): 지급일 (기본값: 오늘)
            payment_method (str): 지급 방법 (bank_transfer, gcash, cash, check, manual)
            paid_by (str): 지급 담당자

        반환값:
            bool: 성공 여부

        조건:
            - status가 "draft" 또는 "approved"여야 함
            - net_settlement > 0이어야 함 (지급할 금액이 있어야 함)
        """
        from datetime import date as date_type

        # 지급할 금액이 없으면 실패
        if self.net_settlement <= 0:
            return False

        # 현재 상태가 settled/confirmed이면 이미 정산됨
        if self.status in ["settled", "confirmed"]:
            return True

        self.status = "settled"
        self.settlement_date = payment_date or date_type.today()
        if payment_method:
            self.payment_method = payment_method
        if paid_by:
            self.paid_by = paid_by
        self.payment_date = payment_date or date_type.today()
        self.updated_at = datetime.utcnow()

        return True

    def mark_waived(self, waive_reason: str = None, approved_by: str = None) -> bool:
        """
        정산을 제외 처리 (회수 불가)

        매개변수:
            waive_reason (str): 제외 사유 (dispute_notes에 기록)
            approved_by (str): 승인자

        반환값:
            bool: 성공 여부

        조건:
            - status가 "draft" 또는 "approved"여야 함
            - 제외 사유를 dispute_notes에 기록
        """
        if self.status in ["settled", "confirmed"]:
            return False

        self.status = "waived"
        self.net_settlement = Decimal("0.00")
        self.settlement_date = None
        self.payment_date = None

        if waive_reason:
            existing_notes = self.dispute_notes or ""
            self.dispute_notes = f"{existing_notes}\n제외 사유: {waive_reason}".strip()

        if approved_by:
            self.approved_by = approved_by

        self.updated_at = datetime.utcnow()

        return True

    def mark_pending(self, reason: str = None, created_by: str = None) -> bool:
        """
        정산을 보류 상태로 변경 (재검토 필요)

        매개변수:
            reason (str): 보류 사유
            created_by (str): 기록 담당자

        반환값:
            bool: 성공 여부

        상태 흐름:
            draft → pending: 자동 계산 후 검토 필요
            approved → pending: 재계산 필요
        """
        # rejected 상태에서는 pending으로 돌아갈 수 있음
        if self.status == "settled" or self.status == "confirmed":
            return False

        self.status = "pending"

        if reason:
            existing_notes = self.notes or ""
            self.notes = f"{existing_notes}\n보류 사유: {reason}".strip()

        if created_by:
            self.created_by = created_by

        self.updated_at = datetime.utcnow()

        return True

    def get_settlement_summary(self) -> dict:
        """
        정산 요약 정보 반환

        반환값:
            dict: {
                "period": "2026-06",
                "total_revenue": 10000.00,
                "recoverable_amount": 9500.00,
                "platform_fee": 2375.00,
                "deductions": 100.00,
                "net_settlement": 7025.00,
                "status": "approved",
                "payment_date": "2026-06-05"
            }
        """
        return {
            "period": f"{self.settlement_period_year:04d}-{self.settlement_period_month:02d}",
            "company_id": self.company_id,
            "total_revenue": float(self.total_revenue),
            "guest_revenue": float(self.guest_revenue),
            "credit_revenue": float(self.credit_revenue),
            "waived_revenue": float(self.waived_revenue),
            "recovery_rate": float(self.recovery_rate),
            "recovered_amount": float(self.recovered_amount),
            "platform_fee_rate": float(self.platform_fee_rate),
            "platform_fee": float(self.platform_fee),
            "total_deductions": float(self.total_deductions),
            "net_settlement": float(self.net_settlement),
            "status": self.status,
            "settlement_date": self.settlement_date.isoformat() if self.settlement_date else None,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "payment_method": self.payment_method,
            "transaction_count": len(self.transactions) if self.transactions else 0,
        }

    def calculate_net_settlement(self) -> Decimal:
        """
        순정산액 재계산
        net_settlement = (guest_revenue + recovered_amount) - platform_fee - total_deductions

        반환값:
            Decimal: 재계산된 순정산액
        """
        self.net_settlement = (
            self.guest_revenue +
            self.recovered_amount -
            self.platform_fee -
            self.total_deductions
        )

        # 음수가 되지 않도록 0으로 조정
        if self.net_settlement < 0:
            self.net_settlement = Decimal("0.00")

        return self.net_settlement

    def is_reconciled(self) -> bool:
        """
        정산이 확정되었는지 확인

        반환값:
            bool: status가 "confirmed"이면 True
        """
        return self.status == "confirmed"


# ============================================================
# 모델 2: SettlementTransaction (거래 추적)
# ============================================================
class SettlementTransaction(Base):
    """
    정산 거래 상세 기록
    company_settlements의 구성 항목

    용도:
      - 각 예약의 정산 상태 추적
      - 환불, 분쟁 등 거래 내역 기록
      - 감사(Audit) 목적 거래 증거 유지

    특징:
      - 거래 유형: booking, refund, dispute, adjustment
      - 분류: guest, credit, waived
      - 회수율: 거래별 적용 가능

    인덱스:
      - (company_settlement_id)
      - (booking_id)
      - (transaction_type)
    """
    __tablename__ = "settlement_transactions"

    # ━━━ 기본 정보 ━━━
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    company_settlement_id = Column(
        Integer,
        ForeignKey("company_settlements.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # ━━━ 거래 링크 ━━━
    booking_id = Column(
        BigInteger,
        ForeignKey("bookings.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    customer_id = Column(
        BigInteger,
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True
    )

    # ━━━ 거래 분류 ━━━
    transaction_type = Column(
        String(50),
        nullable=False,
        comment="booking, refund, dispute, adjustment"
    )
    settlement_category = Column(
        String(50),
        nullable=False,
        comment="guest, credit, waived"
    )

    # ━━━ 금액 ━━━
    amount = Column(
        Numeric(12, 2),
        nullable=False,
        comment="거래 금액"
    )
    recovery_rate = Column(
        Numeric(5, 2),
        nullable=False,
        default=100,
        comment="회수율 (%)"
    )
    recovered_amount = Column(
        Numeric(12, 2),
        nullable=False,
        comment="실제 회수액 = amount × recovery_rate / 100"
    )

    # ━━━ 날짜 ━━━
    transaction_date = Column(Date, nullable=False)

    # ━━━ 메모 ━━━
    notes = Column(Text, nullable=True)

    # ━━━ 타임스탬프 ━━━
    created_at = Column(DateTime, default=datetime.utcnow)

    # ━━━ 제약 조건 ━━━
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_transaction_amount_positive"),
        CheckConstraint("recovery_rate >= 0 AND recovery_rate <= 100", name="ck_transaction_recovery_range"),
        CheckConstraint("recovered_amount >= 0", name="ck_transaction_recovered_positive"),
        Index("idx_settlement_transaction_company", "company_settlement_id"),
        Index("idx_settlement_transaction_booking", "booking_id"),
        Index("idx_settlement_transaction_type", "transaction_type"),
    )

    # ━━━ 관계 ━━━
    company_settlement = relationship(
        "CompanySettlement",
        back_populates="transactions",
        foreign_keys=[company_settlement_id]
    )


# ============================================================
# 모델 3: SettlementRule (정산 규칙 관리)
# ============================================================
class SettlementRule(Base):
    """
    정산 규칙 설정
    예약의 settlement_type 자동 판정 기준

    용도:
      - 고객 유형별 정산 방식 정의
      - 지급 방법별 수수료율 설정
      - 회수율 기본값 설정

    예시:
      - Rule 1: guest_type = 'walk_in' → settled, recovery = 100%
      - Rule 2: payment_method = 'company_credit' → pending, recovery = 80%
      - Rule 3: booking_type = 'promotion' → waived, recovery = 0%

    인덱스:
      - (customer_type, payment_method)
    """
    __tablename__ = "settlement_rules"

    # ━━━ 기본 정보 ━━━
    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    # ━━━ 규칙 조건 ━━━
    customer_type = Column(
        String(50),
        nullable=True,
        comment="guest, company, therapist 등"
    )
    payment_method = Column(
        String(50),
        nullable=True,
        comment="cash, card, gcash, company_credit 등"
    )

    # ━━━ 규칙 설정 ━━━
    settlement_status = Column(
        String(50),
        nullable=False,
        comment="settled, pending, waived"
    )
    recovery_rate = Column(
        Numeric(5, 2),
        nullable=False,
        default=100,
        comment="기본 회수율 (%)"
    )
    platform_fee_rate = Column(
        Numeric(5, 2),
        nullable=False,
        default=25,
        comment="플랫폼 수수료율 (%)"
    )

    is_active = Column(
        Boolean,
        default=True,
        comment="규칙 활성화 여부"
    )

    # ━━━ 타임스탬프 ━━━
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ━━━ 제약 조건 ━━━
    __table_args__ = (
        CheckConstraint("recovery_rate >= 0 AND recovery_rate <= 100", name="ck_rule_recovery_range"),
        CheckConstraint("platform_fee_rate >= 0 AND platform_fee_rate <= 100", name="ck_rule_fee_range"),
        Index("idx_settlement_rule_conditions", "customer_type", "payment_method"),
    )
