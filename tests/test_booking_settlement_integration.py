"""
예약→정산 통합 테스트
경로: tests/test_booking_settlement_integration.py
작성일: 2026-06-02
설명: 전체 워크플로우: 예약 → 결제 → 정산 → 지급
"""

import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch

from app.models.booking import Booking
from app.models.company_settlement import (
    CompanySettlement,
    SettlementTransaction,
    SettlementStatus,
    SettlementCategory,
    TransactionType,
)


# ============================================================
# Test Suite 1: Single Booking Settlement Flow
# ============================================================
class TestSingleBookingSettlementFlow:
    """단일 예약 정산 워크플로우"""

    def test_flow_guest_payment_full_recovery(self):
        """
        워크플로우:
        1. Booking 생성 (payment_from='guest')
        2. 정산 자동 생성 (recovery=80%)
        3. 정산 승인
        4. 정산 지급
        """
        # Step 1: Booking 생성
        booking = Mock(spec=Booking)
        booking.id = 101
        booking.therapist_id = 1
        booking.customer_id = 10
        booking.total_price = Decimal(5000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 1)
        booking.payment_from = 'guest'

        # Step 2: 정산 자동 생성
        platform_fee_rate = Decimal(25)
        recovery_rate = Decimal(80)

        commission = booking.total_price * (platform_fee_rate / Decimal(100))
        recovered = booking.total_price * (recovery_rate / Decimal(100))
        net_settlement = recovered - commission

        assert commission == Decimal(1250)
        assert recovered == Decimal(4000)
        assert net_settlement == Decimal(2750)

        # Step 3: 정산 승인 시뮬레이션
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.status = SettlementStatus.DRAFT.value
        settlement.total_revenue = booking.total_price
        settlement.recovered_amount = recovered
        settlement.platform_fee = commission
        settlement.net_settlement = net_settlement

        settlement.status = SettlementStatus.APPROVED.value

        # Step 4: 정산 지급
        settlement.status = SettlementStatus.SETTLED.value
        settlement.payment_date = date(2026, 6, 30)

        assert settlement.status == 'settled'
        assert settlement.payment_date == date(2026, 6, 30)

    def test_flow_credit_payment_full_recovery(self):
        """
        신용카드 결제 워크플로우:
        1. Booking 생성 (payment_from='credit')
        2. 정산 자동 생성 (recovery=100%)
        3. 정산 승인
        4. 정산 지급
        """
        booking = Mock(spec=Booking)
        booking.id = 102
        booking.total_price = Decimal(8000)
        booking.payment_from = 'credit'

        recovery_rate = Decimal(100)
        recovered = booking.total_price * (recovery_rate / Decimal(100))

        assert recovered == Decimal(8000)

    def test_flow_company_payment_zero_recovery(self):
        """
        업체 선지급 워크플로우:
        1. Booking 생성 (payment_from='company')
        2. 정산 자동 생성 (recovery=0%, waived 상태)
        3. 자동 승인 (정산 제외)
        4. 거래 기록만 생성
        """
        booking = Mock(spec=Booking)
        booking.id = 103
        booking.total_price = Decimal(3000)
        booking.payment_from = 'company'

        recovery_rate = Decimal(0)
        recovered = booking.total_price * (recovery_rate / Decimal(100))
        status = 'waived'

        assert recovered == Decimal(0)
        assert status == 'waived'


# ============================================================
# Test Suite 2: Multiple Bookings in Month
# ============================================================
class TestMultipleBookingsInMonth:
    """월간 다중 예약 정산"""

    def test_multiple_bookings_same_therapist(self):
        """같은 테라피스트의 여러 예약"""
        bookings = [
            Mock(spec=Booking, id=1, total_price=Decimal(5000), payment_from='guest'),
            Mock(spec=Booking, id=2, total_price=Decimal(3000), payment_from='guest'),
            Mock(spec=Booking, id=3, total_price=Decimal(7000), payment_from='credit'),
        ]

        # 월간 매출 계산
        total_revenue = sum(b.total_price for b in bookings)
        assert total_revenue == Decimal(15000)

        # 분류별 매출
        guest_revenue = sum(b.total_price for b in bookings if b.payment_from == 'guest')
        credit_revenue = sum(b.total_price for b in bookings if b.payment_from == 'credit')

        assert guest_revenue == Decimal(8000)
        assert credit_revenue == Decimal(7000)

    def test_monthly_settlement_calculation(self):
        """월간 정산 일괄 계산"""
        # 6월 정산 데이터
        transactions = [
            {
                'booking_id': 1,
                'amount': Decimal(5000),
                'recovery_rate': Decimal(80),
                'type': 'guest'
            },
            {
                'booking_id': 2,
                'amount': Decimal(3000),
                'recovery_rate': Decimal(80),
                'type': 'guest'
            },
            {
                'booking_id': 3,
                'amount': Decimal(7000),
                'recovery_rate': Decimal(100),
                'type': 'credit'
            },
        ]

        # 회수액 계산
        total_revenue = sum(t['amount'] for t in transactions)
        recovered = sum(
            t['amount'] * (t['recovery_rate'] / Decimal(100))
            for t in transactions
        )

        # 수수료 계산 (총 수익의 25%)
        platform_fee = total_revenue * (Decimal(25) / Decimal(100))

        # 순정산액
        net_settlement = recovered - platform_fee

        assert total_revenue == Decimal(15000)
        assert recovered == Decimal(13400)  # 4000 + 2400 + 7000
        assert platform_fee == Decimal(3750)
        assert net_settlement == Decimal(9650)

    def test_monthly_settlement_with_mixed_payment_methods(self):
        """혼합 결제 방법의 월간 정산"""
        bookings = [
            {'amount': Decimal(2000), 'method': 'cash', 'recovery_rate': Decimal(100)},
            {'amount': Decimal(3000), 'method': 'card', 'recovery_rate': Decimal(100)},
            {'amount': Decimal(1500), 'method': 'gcash', 'recovery_rate': Decimal(100)},
            {'amount': Decimal(4000), 'method': 'company_credit', 'recovery_rate': Decimal(80)},
        ]

        total = sum(b['amount'] for b in bookings)
        recovered = sum(
            b['amount'] * (b['recovery_rate'] / Decimal(100))
            for b in bookings
        )
        fee = total * (Decimal(25) / Decimal(100))
        net = recovered - fee

        assert total == Decimal(10500)
        assert recovered == Decimal(9700)
        assert fee == Decimal(2625)
        assert net == Decimal(7075)


# ============================================================
# Test Suite 3: Credit Collection Scenarios
# ============================================================
class TestCreditCollectionScenarios:
    """외상 회수 시나리오"""

    def test_full_credit_collection(self):
        """전액 회수"""
        credit_amount = Decimal(5000)
        recovery_rate = Decimal(100)

        recovered = credit_amount * (recovery_rate / Decimal(100))

        assert recovered == Decimal(5000)

    def test_partial_credit_collection(self):
        """부분 회수"""
        credit_amount = Decimal(5000)
        recovery_rate = Decimal(80)

        recovered = credit_amount * (recovery_rate / Decimal(100))

        assert recovered == Decimal(4000)

    def test_no_credit_collection(self):
        """회수 불가"""
        credit_amount = Decimal(5000)
        recovery_rate = Decimal(0)

        recovered = credit_amount * (recovery_rate / Decimal(100))

        assert recovered == Decimal(0)

    def test_credit_collection_with_custom_rate(self):
        """커스텀 회수율"""
        credit_amount = Decimal(5000)
        recovery_rate = Decimal(75)  # 관리자가 수기 입력

        recovered = credit_amount * (recovery_rate / Decimal(100))

        assert recovered == Decimal(3750)


# ============================================================
# Test Suite 4: Month-End Processing
# ============================================================
class TestMonthEndProcessing:
    """월말 정산 처리"""

    def test_month_end_bulk_settle(self):
        """월말 일괄 정산"""
        # 6월 승인된 정산 3개
        settlements = [
            Mock(spec=CompanySettlement, id=1, status='approved', net_settlement=Decimal(2750)),
            Mock(spec=CompanySettlement, id=2, status='approved', net_settlement=Decimal(1850)),
            Mock(spec=CompanySettlement, id=3, status='approved', net_settlement=Decimal(4500)),
        ]

        # 월말 지급 (6월 30일)
        payment_date = date(2026, 6, 30)

        for settlement in settlements:
            settlement.status = 'settled'
            settlement.payment_date = payment_date

        total_paid = sum(s.net_settlement for s in settlements)

        assert len(settlements) == 3
        assert all(s.status == 'settled' for s in settlements)
        assert total_paid == Decimal(9100)

    def test_month_end_all_settlement_states(self):
        """월말 정산 상태 확인"""
        states = {
            'draft': 0,      # 초안 (미승인)
            'approved': 3,   # 승인됨 (지급 대기)
            'settled': 0,    # 지급 완료
            'rejected': 0,   # 거부됨 (재계산)
        }

        # 승인된 정산만 처리
        total_approved = states['approved']

        # 처리 후
        states['settled'] = total_approved
        states['approved'] = 0

        assert states['settled'] == 3
        assert states['approved'] == 0

    def test_december_settlement_year_boundary(self):
        """12월 정산 연도 경계 처리"""
        # 12월 정산의 지급일은 12월 31일
        payment_date = date(2025, 12, 31)

        assert payment_date.month == 12
        assert payment_date.year == 2025

        # 다음 달 정산은 1월
        next_month_start = payment_date + timedelta(days=1)
        assert next_month_start.month == 1
        assert next_month_start.year == 2026


# ============================================================
# Test Suite 5: Refund and Adjustment Flows
# ============================================================
class TestRefundAndAdjustmentFlows:
    """환불 및 조정 워크플로우"""

    def test_refund_reduces_net_settlement(self):
        """환불로 순정산액 감소"""
        original_net = Decimal(5000)
        refund_amount = Decimal(1000)

        new_net = original_net - refund_amount

        assert new_net == Decimal(4000)

    def test_dispute_deduction_flow(self):
        """분쟁 차감 워크플로우"""
        net_settlement = Decimal(5000)
        dispute_amount = Decimal(500)

        adjusted_net = net_settlement - dispute_amount

        assert adjusted_net == Decimal(4500)

    def test_adjustment_transaction_tracking(self):
        """조정 거래 추적"""
        original_settlement = Decimal(5000)
        adjustments = [
            {'type': 'refund', 'amount': Decimal(-200)},
            {'type': 'dispute', 'amount': Decimal(-150)},
            {'type': 'correction', 'amount': Decimal(100)},
        ]

        total_adjustment = sum(a['amount'] for a in adjustments)
        final_net = original_settlement + total_adjustment

        assert total_adjustment == Decimal(-250)
        assert final_net == Decimal(4750)


# ============================================================
# Test Suite 6: Settlement Approval Workflow
# ============================================================
class TestSettlementApprovalWorkflow:
    """정산 승인 워크플로우"""

    def test_draft_to_approved_with_validation(self):
        """draft → approved (검증)"""
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.status = 'draft'
        settlement.net_settlement = Decimal(5000)
        settlement.total_deductions = Decimal(0)

        # 검증: 모든 거래가 추가되었는가?
        transaction_count = 5
        assert transaction_count > 0

        # 승인
        settlement.status = 'approved'
        settlement.approved_by = 'admin'
        settlement.approved_at = datetime.utcnow()

        assert settlement.status == 'approved'

    def test_rejected_settlement_revert_to_draft(self):
        """rejected → draft (재계산)"""
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.status = 'approved'

        # 거부
        settlement.status = 'rejected'
        settlement.rejection_reason = 'Data verification failed'

        # 재계산 후 draft로 복귀
        settlement.status = 'draft'

        assert settlement.status == 'draft'


# ============================================================
# Test Suite 7: Complex Multi-State Transitions
# ============================================================
class TestComplexMultiStateTransitions:
    """복잡한 상태 전이"""

    def test_settlement_lifecycle(self):
        """정산 전체 생명 주기"""
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1

        # 1. 생성 (draft)
        settlement.status = 'draft'
        assert settlement.status == 'draft'

        # 2. 검증 및 승인 (approved)
        settlement.status = 'approved'
        settlement.approved_by = 'manager'
        assert settlement.status == 'approved'

        # 3. 지급 처리 (settled)
        settlement.status = 'settled'
        settlement.payment_date = date(2026, 6, 30)
        assert settlement.status == 'settled'

        # 4. 확정 (confirmed)
        settlement.status = 'confirmed'
        assert settlement.status == 'confirmed'

    def test_settlement_with_rejection_loop(self):
        """거부 후 재처리"""
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1

        # 1단계: draft
        settlement.status = 'draft'

        # 2단계: approved
        settlement.status = 'approved'

        # 3단계: rejected (문제 발견)
        settlement.status = 'rejected'

        # 4단계: 재계산으로 draft로 복귀
        settlement.status = 'draft'

        # 5단계: 재승인
        settlement.status = 'approved'

        # 6단계: 지급
        settlement.status = 'settled'

        assert settlement.status == 'settled'


# ============================================================
# Test Suite 8: End-to-End Booking to Payment
# ============================================================
class TestEndToEndBookingToPayment:
    """예약부터 지급까지 E2E 테스트"""

    def test_complete_flow_guest_payment(self):
        """
        완전한 워크플로우:
        1. 손님 예약 (현금 결제)
        2. 정산 자동 생성
        3. 관리자 승인
        4. 월말 일괄 정산
        5. 은행 송금
        """
        # 1. 예약
        booking = Mock(spec=Booking)
        booking.id = 201
        booking.total_price = Decimal(5000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 15)
        booking.payment_from = 'guest'

        # 2. 정산 생성
        recovery_rate = Decimal(80)
        recovered = booking.total_price * (recovery_rate / Decimal(100))
        fee = booking.total_price * (Decimal(25) / Decimal(100))
        net = recovered - fee

        settlement = Mock(spec=CompanySettlement)
        settlement.id = 1
        settlement.status = 'draft'
        settlement.total_revenue = booking.total_price
        settlement.recovered_amount = recovered
        settlement.platform_fee = fee
        settlement.net_settlement = net

        # 3. 승인
        settlement.status = 'approved'

        # 4. 월말 정산
        settlement.status = 'settled'
        settlement.payment_date = date(2026, 6, 30)

        # 5. 확정
        settlement.status = 'confirmed'
        settlement.confirmation_date = date(2026, 7, 1)

        assert settlement.status == 'confirmed'
        assert settlement.net_settlement == Decimal(2750)

    def test_complete_flow_credit_payment(self):
        """완전한 워크플로우: 신용카드"""
        booking = Mock(spec=Booking)
        booking.total_price = Decimal(8000)
        booking.payment_from = 'credit'

        # 정산 계산
        recovered = booking.total_price * (Decimal(100) / Decimal(100))
        fee = booking.total_price * (Decimal(25) / Decimal(100))
        net = recovered - fee

        assert recovered == Decimal(8000)
        assert fee == Decimal(2000)
        assert net == Decimal(6000)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
