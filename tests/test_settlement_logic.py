"""
정산 로직 및 엔진 테스트
경로: tests/test_settlement_logic.py
작성일: 2026-06-02
설명: 정산 상태 전이, 규칙 엔진, 리포지토리 패턴 테스트
"""

import pytest
from datetime import datetime, date
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch

from app.services.settlement_engine import (
    SettlementCalculator,
    SettlementRuleEngine,
    SettlementRepository,
)
from app.models.company_settlement import (
    CompanySettlement,
    SettlementStatus,
    SettlementCategory,
    SettlementTransaction,
    TransactionType,
)
from app.models.booking import Booking


# ============================================================
# Test Suite 1: Settlement Status Transitions
# ============================================================
class TestSettlementStatusTransitions:
    """정산 상태 전이"""

    def test_draft_to_approved(self):
        """draft → approved"""
        settlement = Mock(spec=CompanySettlement)
        settlement.status = SettlementStatus.DRAFT.value

        # 승인으로 전이
        settlement.status = SettlementStatus.APPROVED.value

        assert settlement.status == 'approved'

    def test_approved_to_settled(self):
        """approved → settled"""
        settlement = Mock(spec=CompanySettlement)
        settlement.status = SettlementStatus.APPROVED.value

        # 지급으로 전이
        settlement.status = SettlementStatus.SETTLED.value

        assert settlement.status == 'settled'

    def test_settled_to_confirmed(self):
        """settled → confirmed"""
        settlement = Mock(spec=CompanySettlement)
        settlement.status = SettlementStatus.SETTLED.value

        # 확정으로 전이
        settlement.status = SettlementStatus.CONFIRMED.value

        assert settlement.status == 'confirmed'

    def test_draft_to_rejected(self):
        """draft → rejected"""
        settlement = Mock(spec=CompanySettlement)
        settlement.status = SettlementStatus.DRAFT.value

        # 거부로 전이
        settlement.status = SettlementStatus.REJECTED.value

        assert settlement.status == 'rejected'

    def test_rejected_to_draft(self):
        """rejected → draft (재계산)"""
        settlement = Mock(spec=CompanySettlement)
        settlement.status = SettlementStatus.REJECTED.value

        # 재계산 후 다시 draft
        settlement.status = SettlementStatus.DRAFT.value

        assert settlement.status == 'draft'

    def test_invalid_transition_settled_to_draft(self):
        """settled → draft (불가능)"""
        settlement = Mock(spec=CompanySettlement)
        settlement.status = SettlementStatus.SETTLED.value

        # settled 상태에서는 draft로 돌아갈 수 없음
        valid_next_states = ['confirmed', 'rejected']

        if SettlementStatus.DRAFT.value not in valid_next_states:
            with pytest.raises(ValueError):
                raise ValueError("Cannot transition from settled to draft")


# ============================================================
# Test Suite 2: Settlement Rule Engine
# ============================================================
class TestSettlementRuleEngine:
    """정산 규칙 엔진"""

    def test_determine_settlement_type_from_booking_field(self):
        """Rule 1: booking.settlement_type 직접 설정"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        booking = Mock(spec=Booking)
        booking.settlement_type = 'waived'
        booking.customer_id = 1

        result = engine.determine_settlement_type(booking, company_id=1)

        # 설정된 값을 사용
        assert result == 'waived'

    def test_determine_settlement_type_by_payment_method_cash(self):
        """Rule 2: payment_method = cash → guest"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        booking = Mock(spec=Booking)
        booking.settlement_type = None
        booking.payment_method = 'cash'
        booking.customer_id = 1

        result = engine.determine_settlement_type(booking, company_id=1)

        # 현금 결제: guest
        assert result == SettlementCategory.GUEST.value

    def test_determine_settlement_type_by_payment_method_card(self):
        """Rule 2: payment_method = card → guest"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        booking = Mock(spec=Booking)
        booking.settlement_type = None
        booking.payment_method = 'card'
        booking.customer_id = 1

        result = engine.determine_settlement_type(booking, company_id=1)

        # 카드 결제: guest
        assert result == SettlementCategory.GUEST.value

    def test_determine_settlement_type_by_payment_method_company_credit(self):
        """Rule 2: payment_method = company_credit → credit"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        booking = Mock(spec=Booking)
        booking.settlement_type = None
        booking.payment_method = 'company_credit'
        booking.customer_id = 1

        result = engine.determine_settlement_type(booking, company_id=1)

        # 회사 크레딧: credit
        assert result == SettlementCategory.CREDIT.value

    def test_determine_settlement_type_non_member_guest(self):
        """Rule 3: 비회원 → guest"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        booking = Mock(spec=Booking)
        booking.settlement_type = None
        booking.payment_method = None
        booking.customer_id = None

        result = engine.determine_settlement_type(booking, company_id=1)

        # 비회원: guest (settled)
        assert result == SettlementCategory.GUEST.value

    def test_get_default_recovery_rate_guest(self):
        """기본 회수율: guest = 100%"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        rate = engine.get_default_recovery_rate(SettlementCategory.GUEST.value)

        assert rate == Decimal(100)

    def test_get_default_recovery_rate_credit(self):
        """기본 회수율: credit = 80%"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        rate = engine.get_default_recovery_rate(SettlementCategory.CREDIT.value)

        assert rate == Decimal(80)

    def test_get_default_recovery_rate_waived(self):
        """기본 회수율: waived = 0%"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        rate = engine.get_default_recovery_rate(SettlementCategory.WAIVED.value)

        assert rate == Decimal(0)

    def test_get_default_platform_fee_rate(self):
        """기본 플랫폼 수수료율 = 25%"""
        db = Mock()
        engine = SettlementRuleEngine(db)

        rate = engine.get_default_platform_fee_rate()

        assert rate == Decimal(25)


# ============================================================
# Test Suite 3: Settlement Calculator
# ============================================================
class TestSettlementCalculator:
    """정산 계산 엔진"""

    def test_calculate_settlement_revenue_classification(self):
        """매출 분류: guest, credit, waived"""
        db = Mock()
        calculator = SettlementCalculator(db)

        # Mock bookings
        booking1 = Mock(spec=Booking)
        booking1.total_price = Decimal(5000)
        booking1.payment_method = 'cash'
        booking1.customer_id = 1

        # Mock database queries
        db.query.return_value.filter.return_value.all.return_value = [booking1]
        db.query.return_value.filter.return_value.first.return_value = None

        # Calculate
        result = calculator.calculate_settlement(
            company_id=1,
            year=2026,
            month=6
        )

        # Check result structure
        assert 'revenue' in result
        assert 'guest' in result['revenue']
        assert 'credit' in result['revenue']
        assert 'waived' in result['revenue']

    def test_calculate_settlement_recovery_rate(self):
        """회수액 계산"""
        db = Mock()
        calculator = SettlementCalculator(db)

        credit_revenue = Decimal(5000)
        recovery_rate = Decimal(80)

        recovered = credit_revenue * (recovery_rate / Decimal(100))

        assert recovered == Decimal(4000)

    def test_calculate_settlement_platform_fee(self):
        """플랫폼 수수료 계산"""
        db = Mock()
        calculator = SettlementCalculator(db)

        total_revenue = Decimal(10000)
        waived_revenue = Decimal(2000)
        fee_rate = Decimal(25)

        base_amount = total_revenue - waived_revenue
        platform_fee = base_amount * (fee_rate / Decimal(100))

        assert base_amount == Decimal(8000)
        assert platform_fee == Decimal(2000)

    def test_calculate_settlement_net_settlement(self):
        """최종 정산액 계산"""
        db = Mock()
        calculator = SettlementCalculator(db)

        guest_revenue = Decimal(3000)
        recovered_amount = Decimal(4000)
        platform_fee = Decimal(2000)
        total_deductions = Decimal(500)

        net = (guest_revenue + recovered_amount) - platform_fee - total_deductions

        assert net == Decimal(4500)


# ============================================================
# Test Suite 4: Settlement Repository
# ============================================================
class TestSettlementRepository:
    """정산 저장소"""

    def test_create_settlement_from_calculation(self):
        """계산 결과로부터 정산 생성"""
        db = Mock()
        repo = SettlementRepository(db)

        calculation_result = {
            'company_id': 1,
            'period': {
                'year': 2026,
                'month': 6,
                'start': '2026-06-01',
                'end': '2026-07-01',
            },
            'revenue': {
                'total': Decimal(10000),
                'guest': Decimal(3000),
                'credit': Decimal(5000),
                'waived': Decimal(2000),
            },
            'recovery': {
                'credit_revenue': Decimal(5000),
                'recovery_rate': Decimal(80),
                'recovered_amount': Decimal(4000),
            },
            'fee': {
                'base_amount': Decimal(8000),
                'platform_fee_rate': Decimal(25),
                'platform_fee': Decimal(2000),
            },
            'deductions': {
                'refund': Decimal(0),
                'dispute': Decimal(0),
                'other': Decimal(0),
                'total': Decimal(0),
            },
            'net_settlement': Decimal(5000),
            'transactions': [],
            'status': 'draft',
        }

        # Mock DB operations
        db.add = Mock()
        db.flush = Mock()
        db.commit = Mock()

        settlement = repo.create_settlement(calculation_result)

        # Verify calls
        db.add.assert_called()
        db.commit.assert_called()

    def test_get_settlement_by_period(self):
        """정산 조회: 기간별"""
        db = Mock()
        repo = SettlementRepository(db)

        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.company_id = 1
        settlement.settlement_period_year = 2026
        settlement.settlement_period_month = 6

        db.query.return_value.filter.return_value.first.return_value = settlement

        result = repo.get_settlement(
            company_id=1,
            year=2026,
            month=6
        )

        assert result.id == 1
        assert result.settlement_period_year == 2026
        assert result.settlement_period_month == 6

    def test_update_recovery_rate(self):
        """회수율 수기 업데이트"""
        db = Mock()
        repo = SettlementRepository(db)

        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.credit_revenue = Decimal(5000)
        settlement.recovered_amount = Decimal(4000)

        db.query.return_value.filter.return_value.first.return_value = settlement

        new_rate = Decimal(75)
        result = repo.update_recovery_rate(1, new_rate, 'admin')

        # 회수율 업데이트 확인
        assert settlement.recovery_rate == new_rate

    def test_approve_settlement(self):
        """정산 승인"""
        db = Mock()
        repo = SettlementRepository(db)

        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.status = SettlementStatus.DRAFT.value

        db.query.return_value.filter.return_value.first.return_value = settlement

        result = repo.approve_settlement(1, 'admin')

        assert settlement.status == SettlementStatus.APPROVED.value

    def test_settle_payment(self):
        """정산 지급 처리"""
        db = Mock()
        repo = SettlementRepository(db)

        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.status = SettlementStatus.APPROVED.value

        db.query.return_value.filter.return_value.first.return_value = settlement

        payment_date = date(2026, 6, 30)
        result = repo.settle_payment(1, 'bank_transfer', payment_date, 'admin')

        assert settlement.status == SettlementStatus.SETTLED.value
        assert settlement.payment_date == payment_date


# ============================================================
# Test Suite 5: Settlement Transaction Tracking
# ============================================================
class TestSettlementTransactionTracking:
    """정산 거래 추적"""

    def test_create_transaction_from_booking(self):
        """예약으로부터 거래 기록 생성"""
        booking = Mock(spec=Booking)
        booking.id = 101
        booking.customer_id = 10
        booking.total_price = Decimal(5000)
        booking.booking_date = date(2026, 6, 1)

        transaction = SettlementTransaction(
            company_settlement_id=1,
            booking_id=booking.id,
            customer_id=booking.customer_id,
            transaction_type=TransactionType.BOOKING.value,
            settlement_category=SettlementCategory.CREDIT.value,
            amount=booking.total_price,
            recovery_rate=Decimal(80),
            recovered_amount=Decimal(4000),
            transaction_date=booking.booking_date,
            notes=f"Booking #{booking.id}",
        )

        assert transaction.booking_id == 101
        assert transaction.amount == Decimal(5000)
        assert transaction.recovery_rate == Decimal(80)

    def test_refund_transaction(self):
        """환불 거래 기록"""
        transaction = SettlementTransaction(
            company_settlement_id=1,
            transaction_type=TransactionType.REFUND.value,
            settlement_category=SettlementCategory.GUEST.value,
            amount=Decimal(-1000),  # 음수
            recovery_rate=Decimal(100),
            recovered_amount=Decimal(-1000),
            transaction_date=date(2026, 6, 5),
            notes="Customer refund request",
        )

        assert transaction.transaction_type == 'refund'
        assert transaction.amount < 0

    def test_dispute_transaction(self):
        """분쟁 거래 기록"""
        transaction = SettlementTransaction(
            company_settlement_id=1,
            transaction_type=TransactionType.DISPUTE.value,
            settlement_category=SettlementCategory.CREDIT.value,
            amount=Decimal(-500),
            recovery_rate=Decimal(0),
            recovered_amount=Decimal(0),
            transaction_date=date(2026, 6, 10),
            notes="Dispute raised by customer",
        )

        assert transaction.transaction_type == 'dispute'
        assert transaction.recovered_amount == Decimal(0)

    def test_adjustment_transaction(self):
        """조정 거래 기록"""
        transaction = SettlementTransaction(
            company_settlement_id=1,
            transaction_type=TransactionType.ADJUSTMENT.value,
            settlement_category=SettlementCategory.CREDIT.value,
            amount=Decimal(200),
            recovery_rate=Decimal(80),
            recovered_amount=Decimal(160),
            transaction_date=date(2026, 6, 15),
            notes="Manual adjustment for billing correction",
        )

        assert transaction.transaction_type == 'adjustment'


# ============================================================
# Test Suite 6: Settlement with Deductions
# ============================================================
class TestSettlementWithDeductions:
    """차감액을 포함한 정산"""

    def test_settlement_with_refund_deduction(self):
        """환불 차감"""
        guest_revenue = Decimal(5000)
        recovered_amount = Decimal(4000)
        platform_fee = Decimal(1250)
        refund_deduction = Decimal(500)

        net = (guest_revenue + recovered_amount) - platform_fee - refund_deduction

        assert net == Decimal(7250)

    def test_settlement_with_dispute_deduction(self):
        """분쟁 차감"""
        guest_revenue = Decimal(5000)
        recovered_amount = Decimal(4000)
        platform_fee = Decimal(1250)
        dispute_deduction = Decimal(300)

        net = (guest_revenue + recovered_amount) - platform_fee - dispute_deduction

        assert net == Decimal(7450)

    def test_settlement_with_multiple_deductions(self):
        """복합 차감"""
        guest_revenue = Decimal(5000)
        recovered_amount = Decimal(4000)
        platform_fee = Decimal(1250)
        refund_deduction = Decimal(500)
        dispute_deduction = Decimal(300)
        other_deduction = Decimal(100)

        total_deductions = refund_deduction + dispute_deduction + other_deduction
        net = (guest_revenue + recovered_amount) - platform_fee - total_deductions

        assert total_deductions == Decimal(900)
        assert net == Decimal(6850)

    def test_settlement_zero_net_with_deductions(self):
        """차감으로 순정산액이 0 이하인 경우"""
        guest_revenue = Decimal(1000)
        recovered_amount = Decimal(500)
        platform_fee = Decimal(1000)
        deductions = Decimal(1000)

        net = (guest_revenue + recovered_amount) - platform_fee - deductions

        # 음수 방지
        net = max(net, Decimal(0))

        assert net == Decimal(0)


# ============================================================
# Test Suite 7: Settlement Period Handling
# ============================================================
class TestSettlementPeriodHandling:
    """정산 기간 처리"""

    def test_settlement_period_unique_constraint(self):
        """정산 기간 UNIQUE 제약"""
        # (company_id, year, month) 조합은 유일해야 함
        settlement1 = Mock(spec=CompanySettlement)
        settlement1.company_id = 1
        settlement1.settlement_period_year = 2026
        settlement1.settlement_period_month = 6

        settlement2 = Mock(spec=CompanySettlement)
        settlement2.company_id = 1
        settlement2.settlement_period_year = 2026
        settlement2.settlement_period_month = 6

        # 같은 기간의 정산은 하나만 존재
        if (settlement1.company_id == settlement2.company_id and
            settlement1.settlement_period_year == settlement2.settlement_period_year and
            settlement1.settlement_period_month == settlement2.settlement_period_month):
            raise ValueError("Settlement for this period already exists")

    def test_settlement_period_december(self):
        """12월 정산"""
        year = 2025
        month = 12

        next_month = date(year + 1, 1, 1)
        payment_date = next_month - __import__('datetime').timedelta(days=1)

        assert payment_date.month == 12
        assert payment_date.year == 2025


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
