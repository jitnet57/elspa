"""
정산 엔진 — 자동 계산 및 규칙 적용
경로: app/services/settlement_engine.py
작성일: 2026-06-02
설명: CompanySettlement 자동 계산, 규칙 판정, 거래 추적
"""

from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

# 모델 임포트
from app.models.booking import Booking
from app.models.customer import Customer
from app.models.company_settlement import (
    CompanySettlement,
    SettlementTransaction,
    SettlementRule,
    SettlementStatus,
    SettlementCategory,
    TransactionType,
)


# ============================================================
# SettlementCalculator — 정산 계산 엔진
# ============================================================
class SettlementCalculator:
    """
    업체 월간 정산을 자동 계산하는 엔진

    워크플로우:
      1. 대상 기간의 예약 수집 (booking)
      2. 규칙 엔진으로 settlement_type 판정
      3. 매출 분류 (guest, credit, waived)
      4. 회수액 계산
      5. 수수료 계산
      6. 차감액 합계
      7. 최종 정산액 계산
      8. 거래 기록 (settlement_transactions)
    """

    def __init__(self, db: Session):
        self.db = db
        self.rule_engine = SettlementRuleEngine(db)

    def calculate_settlement(
        self,
        company_id: int,
        year: int,
        month: int
    ) -> Dict:
        """
        월간 정산액 자동 계산

        Args:
            company_id: 업체 ID
            year: 정산 연도
            month: 정산 월

        Returns:
            정산 계산 결과 딕셔너리
            {
                'company_id': int,
                'period': {'year': int, 'month': int},
                'revenue': {...},
                'recovery': {...},
                'fee': {...},
                'deductions': {...},
                'net_settlement': Decimal,
                'transactions': List[Dict],
                'status': 'draft',
            }
        """
        # Step 1: 대상 기간의 예약 수집
        period_start = date(year, month, 1)
        # 다음 달 1일 -1일 = 해당 달의 마지막 날
        if month == 12:
            period_end = date(year + 1, 1, 1)
        else:
            period_end = date(year, month + 1, 1)

        bookings = self._fetch_bookings(company_id, period_start, period_end)

        # Step 2-3: 매출 분류
        revenue_breakdown = self._classify_revenue(bookings, company_id)

        # Step 4: 회수액 계산
        recovery_result = self._calculate_recovery(
            credit_revenue=revenue_breakdown['credit_revenue'],
            company_id=company_id,
            year=year,
            month=month
        )

        # Step 5: 수수료 계산
        fee_result = self._calculate_platform_fee(
            total_revenue=revenue_breakdown['total_revenue'],
            waived_revenue=revenue_breakdown['waived_revenue'],
            company_id=company_id
        )

        # Step 6: 차감액 조회
        deductions = self._fetch_deductions(company_id, year, month)

        # Step 7: 최종 정산액
        net_settlement = self._calculate_net_settlement(
            guest_revenue=revenue_breakdown['guest_revenue'],
            recovered_amount=recovery_result['recovered_amount'],
            platform_fee=fee_result['platform_fee'],
            total_deductions=deductions['total_deductions']
        )

        # Step 8: 거래 기록 준비
        transactions = self._prepare_transactions(
            bookings=bookings,
            revenue_breakdown=revenue_breakdown
        )

        return {
            'company_id': company_id,
            'period': {
                'year': year,
                'month': month,
                'start': period_start.isoformat(),
                'end': period_end.isoformat(),
            },
            'revenue': {
                'total': revenue_breakdown['total_revenue'],
                'guest': revenue_breakdown['guest_revenue'],
                'credit': revenue_breakdown['credit_revenue'],
                'waived': revenue_breakdown['waived_revenue'],
            },
            'recovery': {
                'credit_revenue': recovery_result['credit_revenue'],
                'recovery_rate': recovery_result['recovery_rate'],
                'recovered_amount': recovery_result['recovered_amount'],
            },
            'fee': {
                'base_amount': fee_result['base_amount'],
                'platform_fee_rate': fee_result['platform_fee_rate'],
                'platform_fee': fee_result['platform_fee'],
            },
            'deductions': {
                'refund': deductions['refund_amount'],
                'dispute': deductions['dispute_deduction'],
                'other': deductions['other_deduction'],
                'total': deductions['total_deductions'],
            },
            'net_settlement': net_settlement,
            'transactions': transactions,
            'status': SettlementStatus.DRAFT.value,
        }

    def _fetch_bookings(
        self,
        company_id: int,
        period_start: date,
        period_end: date
    ) -> List[Booking]:
        """대상 기간의 예약 조회"""
        # TODO: company_id와 booking의 관계 확인 필요
        # 현재는 therapist → company 관계를 통해 조회
        bookings = self.db.query(Booking).filter(
            Booking.booking_date >= period_start,
            Booking.booking_date < period_end,
            Booking.status == 'completed'  # 완료된 예약만
        ).all()
        return bookings

    def _classify_revenue(
        self,
        bookings: List[Booking],
        company_id: int
    ) -> Dict[str, Decimal]:
        """매출 분류: guest, credit, waived"""
        guest_revenue = Decimal(0)
        credit_revenue = Decimal(0)
        waived_revenue = Decimal(0)

        for booking in bookings:
            amount = Decimal(str(booking.total_price or 0))

            # settlement_type 판정
            settlement_type = self.rule_engine.determine_settlement_type(
                booking=booking,
                company_id=company_id
            )

            if settlement_type == SettlementCategory.GUEST.value:
                guest_revenue += amount
            elif settlement_type == SettlementCategory.CREDIT.value:
                credit_revenue += amount
            elif settlement_type == SettlementCategory.WAIVED.value:
                waived_revenue += amount

        total_revenue = guest_revenue + credit_revenue + waived_revenue

        return {
            'total_revenue': total_revenue,
            'guest_revenue': guest_revenue,
            'credit_revenue': credit_revenue,
            'waived_revenue': waived_revenue,
        }

    def _calculate_recovery(
        self,
        credit_revenue: Decimal,
        company_id: int,
        year: int,
        month: int
    ) -> Dict[str, Decimal]:
        """
        외상 회수액 계산

        회수율은:
        1. 기존 정산 기록에서 조회 (historical)
        2. 없으면 규칙 엔진의 기본값 사용
        3. 관리자 수기 입력으로 갱신 가능
        """
        # 기본 회수율 (규칙 엔진)
        default_recovery_rate = self.rule_engine.get_default_recovery_rate(
            settlement_category=SettlementCategory.CREDIT.value
        )

        # TODO: 외상 회수율 이력 조회 가능하도록 확장
        # 현재는 기본값 사용
        recovery_rate = default_recovery_rate

        recovered_amount = credit_revenue * (recovery_rate / Decimal(100))

        return {
            'credit_revenue': credit_revenue,
            'recovery_rate': recovery_rate,
            'recovered_amount': recovered_amount,
        }

    def _calculate_platform_fee(
        self,
        total_revenue: Decimal,
        waived_revenue: Decimal,
        company_id: int
    ) -> Dict[str, Decimal]:
        """
        플랫폼 수수료 계산

        base_amount = total_revenue - waived_revenue
        (제외된 매출은 수수료 대상 제외)

        platform_fee = base_amount × (rate / 100)
        """
        # 기본 수수료율 (규칙 엔진)
        default_fee_rate = self.rule_engine.get_default_platform_fee_rate()

        base_amount = total_revenue - waived_revenue
        platform_fee = base_amount * (default_fee_rate / Decimal(100))

        return {
            'base_amount': base_amount,
            'platform_fee_rate': default_fee_rate,
            'platform_fee': platform_fee,
        }

    def _fetch_deductions(
        self,
        company_id: int,
        year: int,
        month: int
    ) -> Dict[str, Decimal]:
        """차감액 조회"""
        # TODO: 환불, 분쟁, 기타 차감액 DB에서 조회
        # 현재는 0으로 초기화
        return {
            'refund_amount': Decimal(0),
            'dispute_deduction': Decimal(0),
            'other_deduction': Decimal(0),
            'total_deductions': Decimal(0),
        }

    def _calculate_net_settlement(
        self,
        guest_revenue: Decimal,
        recovered_amount: Decimal,
        platform_fee: Decimal,
        total_deductions: Decimal
    ) -> Decimal:
        """
        최종 정산액 계산

        Formula:
          net_settlement = (guest_revenue + recovered_amount)
                         - platform_fee
                         - total_deductions
        """
        net = (guest_revenue + recovered_amount) - platform_fee - total_deductions
        # 음수 방지 (항상 >= 0)
        return max(net, Decimal(0))

    def _prepare_transactions(
        self,
        bookings: List[Booking],
        revenue_breakdown: Dict
    ) -> List[Dict]:
        """거래 기록 준비"""
        transactions = []

        for booking in bookings:
            settlement_type = revenue_breakdown.get(
                f'{booking.id}_type',
                SettlementCategory.GUEST.value
            )

            transactions.append({
                'booking_id': booking.id,
                'customer_id': booking.customer_id,
                'transaction_type': TransactionType.BOOKING.value,
                'settlement_category': settlement_type,
                'amount': Decimal(str(booking.total_price or 0)),
                'recovery_rate': Decimal(100) if settlement_type == SettlementCategory.GUEST.value else Decimal(80),
                'transaction_date': booking.booking_date,
                'notes': f'Booking #{booking.id}',
            })

        return transactions


# ============================================================
# SettlementRuleEngine — 규칙 엔진
# ============================================================
class SettlementRuleEngine:
    """
    settlement_type 자동 판정 규칙 엔진

    규칙 우선순위:
      1. 수기 입력 (booking.settlement_type 이미 설정)
      2. 규칙 매칭 (settlement_rules 테이블)
      3. 기본값 (guest = settled)
    """

    def __init__(self, db: Session):
        self.db = db

    def determine_settlement_type(
        self,
        booking: Booking,
        company_id: int
    ) -> str:
        """
        예약의 settlement_type 판정

        Args:
            booking: Booking 객체
            company_id: 업체 ID

        Returns:
            'settled', 'pending', 'waived' 중 하나
        """
        # Rule 1: 수기 입력된 값 사용
        if hasattr(booking, 'settlement_type') and booking.settlement_type:
            return booking.settlement_type

        # Rule 2: 규칙 매칭
        customer = self.db.query(Customer).filter(
            Customer.id == booking.customer_id
        ).first() if booking.customer_id else None

        matched_rule = self._match_rule(
            customer=customer,
            payment_method=booking.payment_method,
            booking=booking
        )

        if matched_rule:
            return matched_rule.settlement_status

        # Rule 3: 기본값
        # 비회원 → settled
        if not booking.customer_id:
            return SettlementCategory.GUEST.value

        # 회원 + 현금 결제 → settled
        if booking.payment_method in ['cash', 'card']:
            return SettlementCategory.GUEST.value

        # 회원 + 회사 크레딧 → pending
        if booking.payment_method == 'company_credit':
            return SettlementCategory.CREDIT.value

        # 기본값: settled
        return SettlementCategory.GUEST.value

    def _match_rule(
        self,
        customer: Optional[Customer],
        payment_method: str,
        booking: Booking
    ) -> Optional[SettlementRule]:
        """규칙 테이블에서 매칭되는 규칙 조회"""
        # TODO: 더 정교한 규칙 매칭 로직 구현
        # 현재는 간단한 payment_method 매칭만 수행
        rule = self.db.query(SettlementRule).filter(
            SettlementRule.payment_method == payment_method,
            SettlementRule.is_active == True
        ).first()
        return rule

    def get_default_recovery_rate(
        self,
        settlement_category: str
    ) -> Decimal:
        """정산 분류별 기본 회수율"""
        rate_map = {
            SettlementCategory.GUEST.value: Decimal(100),
            SettlementCategory.CREDIT.value: Decimal(80),
            SettlementCategory.WAIVED.value: Decimal(0),
        }
        return rate_map.get(settlement_category, Decimal(100))

    def get_default_platform_fee_rate(self) -> Decimal:
        """기본 플랫폼 수수료율"""
        return Decimal(25)  # 25%


# ============================================================
# SettlementRepository — 저장소 패턴
# ============================================================
class SettlementRepository:
    """CompanySettlement 데이터 영속성 관리"""

    def __init__(self, db: Session):
        self.db = db

    def create_settlement(
        self,
        calculation_result: Dict
    ) -> CompanySettlement:
        """
        정산 기록 생성 및 저장

        Args:
            calculation_result: SettlementCalculator.calculate_settlement() 결과

        Returns:
            저장된 CompanySettlement 객체
        """
        settlement = CompanySettlement(
            company_id=calculation_result['company_id'],
            settlement_period_year=calculation_result['period']['year'],
            settlement_period_month=calculation_result['period']['month'],
            total_revenue=calculation_result['revenue']['total'],
            guest_revenue=calculation_result['revenue']['guest'],
            credit_revenue=calculation_result['revenue']['credit'],
            waived_revenue=calculation_result['revenue']['waived'],
            recovery_rate=calculation_result['recovery']['recovery_rate'],
            recovered_amount=calculation_result['recovery']['recovered_amount'],
            platform_fee_rate=calculation_result['fee']['platform_fee_rate'],
            platform_fee=calculation_result['fee']['platform_fee'],
            refund_amount=calculation_result['deductions']['refund'],
            dispute_deduction=calculation_result['deductions']['dispute'],
            other_deduction=calculation_result['deductions']['other'],
            total_deductions=calculation_result['deductions']['total'],
            net_settlement=calculation_result['net_settlement'],
            status=SettlementStatus.DRAFT.value,
        )

        self.db.add(settlement)
        self.db.flush()  # ID 할당

        # 거래 기록 생성
        for tx in calculation_result['transactions']:
            transaction = SettlementTransaction(
                company_settlement_id=settlement.id,
                booking_id=tx.get('booking_id'),
                customer_id=tx.get('customer_id'),
                transaction_type=tx['transaction_type'],
                settlement_category=tx['settlement_category'],
                amount=tx['amount'],
                recovery_rate=tx['recovery_rate'],
                recovered_amount=tx['amount'] * (tx['recovery_rate'] / Decimal(100)),
                transaction_date=tx['transaction_date'],
                notes=tx.get('notes'),
            )
            self.db.add(transaction)

        self.db.commit()
        return settlement

    def get_settlement(
        self,
        company_id: int,
        year: int,
        month: int
    ) -> Optional[CompanySettlement]:
        """정산 기록 조회"""
        return self.db.query(CompanySettlement).filter(
            CompanySettlement.company_id == company_id,
            CompanySettlement.settlement_period_year == year,
            CompanySettlement.settlement_period_month == month,
        ).first()

    def update_recovery_rate(
        self,
        settlement_id: int,
        recovery_rate: Decimal,
        updated_by: str
    ) -> CompanySettlement:
        """외상 회수율 수기 갱신"""
        settlement = self.db.query(CompanySettlement).filter(
            CompanySettlement.id == settlement_id
        ).first()

        if not settlement:
            raise ValueError(f"Settlement #{settlement_id} not found")

        settlement.recovery_rate = recovery_rate
        settlement.recovered_amount = settlement.credit_revenue * (recovery_rate / Decimal(100))
        settlement.net_settlement = self._recalculate_net_settlement(settlement)
        settlement.updated_at = datetime.utcnow()

        self.db.commit()
        return settlement

    def approve_settlement(
        self,
        settlement_id: int,
        approved_by: str
    ) -> CompanySettlement:
        """정산 승인"""
        settlement = self.db.query(CompanySettlement).filter(
            CompanySettlement.id == settlement_id
        ).first()

        if not settlement:
            raise ValueError(f"Settlement #{settlement_id} not found")

        settlement.status = SettlementStatus.APPROVED.value
        settlement.approved_by = approved_by
        settlement.updated_at = datetime.utcnow()

        self.db.commit()
        return settlement

    def settle_payment(
        self,
        settlement_id: int,
        payment_method: str,
        payment_date: date,
        paid_by: str
    ) -> CompanySettlement:
        """지급 처리"""
        settlement = self.db.query(CompanySettlement).filter(
            CompanySettlement.id == settlement_id
        ).first()

        if not settlement:
            raise ValueError(f"Settlement #{settlement_id} not found")

        settlement.status = SettlementStatus.SETTLED.value
        settlement.payment_method = payment_method
        settlement.payment_date = payment_date
        settlement.settlement_date = payment_date
        settlement.paid_by = paid_by
        settlement.updated_at = datetime.utcnow()

        self.db.commit()
        return settlement

    def _recalculate_net_settlement(
        self,
        settlement: CompanySettlement
    ) -> Decimal:
        """정산액 재계산"""
        net = (settlement.guest_revenue + settlement.recovered_amount) \
              - settlement.platform_fee \
              - settlement.total_deductions
        return max(net, Decimal(0))
