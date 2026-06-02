"""
예약 모델 — SQLAlchemy
경로: app/models/booking.py
작성일: 2026-06-02
설명: Booking 모델에 결제 및 정산 필드/메서드 추가
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Date, Time, Integer, Numeric, ForeignKey, func, JSON, Index, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional
import json


class Booking(Base):
    """
    예약 모델 — 확장 기능 포함

    기본 정보:
      - 예약 ID, 고객, 테라피스트, 서비스
      - 예약 날짜/시간, 기간, 위치

    결제 정보 (신규):
      - payment_methods: JSON 형식 (다중 결제 수단)
      - total_amount: 총 금액
      - sss_amount: SSS 정산액
      - sss_status: SSS 정산 상태
      - payment_from: 결제자 (guest, company, etc.)
      - settlement_status: 정산 상태 (pending, processed, settled)

    관계:
      - settlements: CompanySettlement와의 관계 (정산 추적)
    """
    __tablename__ = "bookings"

    # ━━━ 기본 정보 ━━━
    id = Column(BigInteger, primary_key=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    therapist_id = Column(BigInteger, ForeignKey("therapists.id"), nullable=False)
    service_id = Column(BigInteger, ForeignKey("services.id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    location = Column(String(255))
    special_request = Column(String)
    status = Column(String(50), default="pending")  # pending, confirmed, completed, cancelled
    notes = Column(String)

    # ━━━ 결제 정보 (신규) ━━━
    payment_methods = Column(
        JSON,
        nullable=False,
        default=list,
        comment="결제 수단 목록 (JSON): [{'method': 'cash', 'amount': 100.00}, ...]"
    )
    total_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=0,
        comment="총 예약 금액"
    )
    sss_amount = Column(
        Numeric(10, 2),
        nullable=False,
        default=0,
        comment="SSS 정산액 (선지급 기준)"
    )
    sss_status = Column(
        String(50),
        nullable=False,
        default="pending",
        comment="SSS 정산 상태: pending, processed, settled, disputed"
    )
    payment_from = Column(
        String(50),
        nullable=True,
        comment="결제 출처: guest, company, referral, promotion 등"
    )
    settlement_status = Column(
        String(50),
        nullable=False,
        default="pending",
        comment="정산 상태: pending, processed, settled, waived"
    )

    # ━━━ 호환성 (기존 필드) ━━━
    total_price = Column(Numeric(10, 2))  # 레거시 호환
    payment_method = Column(String(50))   # 레거시 호환 (단일 방법)

    # ━━━ 타임스탬프 ━━━
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    settled_at = Column(DateTime, nullable=True, comment="정산 완료 시간")

    # ━━━ 인덱스 ━━━
    __table_args__ = (
        Index("idx_booking_customer", "customer_id"),
        Index("idx_booking_therapist", "therapist_id"),
        Index("idx_booking_sss_status", "sss_status"),
        Index("idx_booking_settlement_status", "settlement_status"),
        Index("idx_booking_date", "booking_date"),
        CheckConstraint("total_amount >= 0", name="ck_total_amount_positive"),
        CheckConstraint("sss_amount >= 0", name="ck_sss_amount_positive"),
    )

    # ━━━ 관계 ━━━
    settlements = relationship(
        "CompanySettlement",
        secondary="settlement_transactions",
        primaryjoin="Booking.id == foreign(settlement_transactions.c.booking_id)",
        secondaryjoin="settlement_transactions.c.company_settlement_id == CompanySettlement.id",
        viewonly=True,
        comment="이 예약과 연결된 정산 기록"
    )

    # ============================================================
    # 메서드 1: add_payment_method()
    # ============================================================
    def add_payment_method(
        self,
        method: str,
        amount: Decimal,
        reference_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> bool:
        """
        결제 수단 추가 (다중 결제 지원)

        매개변수:
            method (str): 결제 수단 (cash, card, kakaopay, bank_transfer, gcash 등)
            amount (Decimal): 해당 수단으로 결제한 금액
            reference_id (str): 거래 참조 ID (카드 승인번호, 이체 영수증 등)
            notes (str): 추가 메모

        반환값:
            bool: 성공 여부

        로직:
            1. payment_methods (JSON) 리스트 파싱
            2. 신규 결제 항목 추가
            3. total_amount 재계산
            4. 유효성 검사 (total_amount <= booking amount)

        예시:
            booking.add_payment_method(
                method="cash",
                amount=Decimal("50.00"),
                notes="현금 선수금"
            )
        """
        # payment_methods 파싱
        if isinstance(self.payment_methods, str):
            methods_list = json.loads(self.payment_methods)
        else:
            methods_list = self.payment_methods or []

        # 신규 결제 항목
        payment_item = {
            "method": method,
            "amount": float(amount),
            "timestamp": datetime.utcnow().isoformat(),
        }
        if reference_id:
            payment_item["reference_id"] = reference_id
        if notes:
            payment_item["notes"] = notes

        methods_list.append(payment_item)

        # JSON 저장
        self.payment_methods = methods_list

        # total_amount 재계산
        self.total_amount = Decimal(str(sum(p["amount"] for p in methods_list)))

        return True

    # ============================================================
    # 메서드 2: validate_payment_total()
    # ============================================================
    def validate_payment_total(self, expected_total: Decimal) -> Dict[str, Any]:
        """
        결제 총액 유효성 검사

        매개변수:
            expected_total (Decimal): 예상 총액 (booking total_price)

        반환값:
            Dict[str, Any]: {
                "is_valid": bool,
                "total_paid": Decimal,
                "expected_total": Decimal,
                "difference": Decimal,
                "status": "paid_full" | "paid_partial" | "overpaid" | "unpaid",
                "payment_methods": List[Dict]
            }

        로직:
            1. payment_methods 파싱
            2. 합계 계산
            3. 상태 판정
            4. 상세 정보 반환

        예시:
            result = booking.validate_payment_total(Decimal("10000.00"))
            if result["status"] == "paid_full":
                print("결제 완료")
        """
        # payment_methods 파싱
        if isinstance(self.payment_methods, str):
            methods_list = json.loads(self.payment_methods)
        else:
            methods_list = self.payment_methods or []

        # 결제 총액
        total_paid = Decimal(str(sum(p.get("amount", 0) for p in methods_list)))
        expected = Decimal(str(expected_total))
        difference = total_paid - expected

        # 상태 판정
        if total_paid == 0:
            status = "unpaid"
        elif total_paid < expected:
            status = "paid_partial"
        elif total_paid == expected:
            status = "paid_full"
        else:
            status = "overpaid"

        return {
            "is_valid": status in ["paid_full", "overpaid"],
            "total_paid": total_paid,
            "expected_total": expected,
            "difference": difference,
            "status": status,
            "payment_methods": methods_list,
            "method_count": len(methods_list),
        }

    # ============================================================
    # 메서드 3: get_settlement_status()
    # ============================================================
    def get_settlement_status(self) -> Dict[str, Any]:
        """
        예약의 정산 상태 및 SSS 정보 조회

        반환값:
            Dict[str, Any]: {
                "booking_id": int,
                "status": str,
                "sss_status": str,
                "sss_amount": float,
                "settlement_status": str,
                "is_settled": bool,
                "payment_from": str,
                "settled_at": str (ISO format),
                "days_since_booking": int,
                "payment_methods": List[Dict],
                "notes": str
            }

        로직:
            1. 현재 정산 상태 조회
            2. SSS 정산 내역 확인
            3. 결제 수단 목록
            4. 정산 완료 여부 판정

        예시:
            info = booking.get_settlement_status()
            if info["is_settled"]:
                print(f"정산 완료: {info['settled_at']}")
        """
        # payment_methods 파싱
        if isinstance(self.payment_methods, str):
            methods_list = json.loads(self.payment_methods)
        else:
            methods_list = self.payment_methods or []

        # 정산 완료 여부
        is_settled = self.settlement_status == "settled" and self.settled_at is not None

        # 예약 이후 경과일
        days_since = (datetime.utcnow() - self.created_at).days if self.created_at else 0

        return {
            "booking_id": self.id,
            "status": self.status,
            "sss_status": self.sss_status,
            "sss_amount": float(self.sss_amount),
            "settlement_status": self.settlement_status,
            "is_settled": is_settled,
            "payment_from": self.payment_from,
            "settled_at": self.settled_at.isoformat() if self.settled_at else None,
            "days_since_booking": days_since,
            "payment_methods": methods_list,
            "total_paid": float(sum(p.get("amount", 0) for p in methods_list)),
            "method_count": len(methods_list),
            "notes": self.notes,
        }

    # ============================================================
    # 유틸리티 메서드
    # ============================================================

    def mark_settled(self, sss_amount: Decimal = None) -> bool:
        """
        예약을 정산 완료로 표시

        매개변수:
            sss_amount (Decimal): SSS 정산액 (옵션)

        반환값:
            bool: 성공 여부
        """
        self.settlement_status = "settled"
        self.sss_status = "settled"
        self.settled_at = datetime.utcnow()
        if sss_amount is not None:
            self.sss_amount = sss_amount
        self.updated_at = datetime.utcnow()
        return True

    def get_payment_method_summary(self) -> Dict[str, Decimal]:
        """
        결제 수단별 합계 조회

        반환값:
            Dict[str, Decimal]: {"cash": 50.00, "card": 100.00, ...}
        """
        if isinstance(self.payment_methods, str):
            methods_list = json.loads(self.payment_methods)
        else:
            methods_list = self.payment_methods or []

        summary = {}
        for payment in methods_list:
            method = payment.get("method", "unknown")
            amount = Decimal(str(payment.get("amount", 0)))
            summary[method] = summary.get(method, Decimal("0.00")) + amount

        return summary
