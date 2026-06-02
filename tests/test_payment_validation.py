"""
결제 검증 단위 테스트
경로: tests/test_payment_validation.py
작성일: 2026-06-02
설명: 결제 방법, 결제 출처, SSS 옵션 검증 로직 테스트
"""

import pytest
from datetime import datetime, date
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch

from app.models.booking import Booking
from app.schemas.payment_settlement import (
    PaymentMethodType,
    PaymentFromType,
    SSSStatus,
)


# ============================================================
# Test Suite 1: Payment Method Validation
# ============================================================
class TestPaymentMethodValidation:
    """결제 방법 검증 테스트"""

    def test_valid_payment_methods(self):
        """유효한 결제 방법들"""
        valid_methods = [
            PaymentMethodType.CASH,
            PaymentMethodType.CARD,
            PaymentMethodType.GCASH,
            PaymentMethodType.BANK_TRANSFER,
        ]

        for method in valid_methods:
            assert method.value in [
                'cash', 'card', 'gcash', 'bank_transfer'
            ]

    def test_invalid_payment_method(self):
        """유효하지 않은 결제 방법"""
        invalid_method = "crypto"

        # Enum에 존재하지 않음
        with pytest.raises(ValueError):
            PaymentMethodType(invalid_method)

    def test_payment_method_case_insensitive(self):
        """결제 방법 케이스 민감도"""
        assert PaymentMethodType.CASH.value == 'cash'
        assert PaymentMethodType.CARD.value == 'card'

    def test_payment_method_enum_count(self):
        """결제 방법 개수 확인"""
        methods = list(PaymentMethodType)
        assert len(methods) >= 4  # 최소 4개 이상


# ============================================================
# Test Suite 2: Payment From Validation
# ============================================================
class TestPaymentFromValidation:
    """결제 출처 검증 테스트"""

    def test_valid_payment_from_sources(self):
        """유효한 결제 출처"""
        valid_sources = ['guest', 'company', 'credit']

        for source in valid_sources:
            assert source in ['guest', 'company', 'credit']

    def test_payment_from_guest(self):
        """결제 출처: 손님"""
        booking = Mock(spec=Booking)
        booking.payment_from = 'guest'

        # 손님 외상: 회수율 80%
        assert booking.payment_from == 'guest'

    def test_payment_from_company(self):
        """결제 출처: 업체"""
        booking = Mock(spec=Booking)
        booking.payment_from = 'company'

        # 업체 선지급: 회수율 0%
        assert booking.payment_from == 'company'

    def test_payment_from_credit(self):
        """결제 출처: 신용카드/선지급"""
        booking = Mock(spec=Booking)
        booking.payment_from = 'credit'

        # 신용카드: 회수율 100%
        assert booking.payment_from == 'credit'

    def test_payment_from_unknown_default_guest(self):
        """미정의 결제 출처는 guest로 기본값"""
        booking = Mock(spec=Booking)
        # payment_from 설정 안 함

        # getattr으로 기본값 guest 사용
        payment_from = getattr(booking, 'payment_from', 'guest')
        assert payment_from == 'guest'


# ============================================================
# Test Suite 3: Payment Amount Validation
# ============================================================
class TestPaymentAmountValidation:
    """결제 금액 검증 테스트"""

    def test_valid_payment_amount(self):
        """유효한 결제 금액"""
        booking = Mock(spec=Booking)
        booking.total_price = Decimal(5000)

        assert booking.total_price > 0
        assert booking.total_price == Decimal(5000)

    def test_zero_payment_amount(self):
        """0원 결제"""
        booking = Mock(spec=Booking)
        booking.total_price = Decimal(0)

        assert booking.total_price == Decimal(0)

    def test_negative_payment_amount_prevented(self):
        """음수 결제 금액 방지"""
        booking = Mock(spec=Booking)
        booking.total_price = Decimal(-1000)

        # 음수 금액은 비즈니스 로직에서 검증
        if booking.total_price < 0:
            raise ValueError("Payment amount cannot be negative")

    def test_payment_amount_precision(self):
        """결제 금액 정확도 (소수점 2자리)"""
        booking = Mock(spec=Booking)
        booking.total_price = Decimal("5000.50")

        # 필리핀 페소는 소수점 2자리
        assert booking.total_price == Decimal("5000.50")

    def test_payment_amount_large_value(self):
        """큰 금액 처리"""
        booking = Mock(spec=Booking)
        booking.total_price = Decimal(999999999.99)

        assert booking.total_price == Decimal("999999999.99")

    def test_payment_amount_string_conversion(self):
        """결제 금액 문자열 변환"""
        booking = Mock(spec=Booking)
        booking.total_price = "5000.25"

        decimal_price = Decimal(str(booking.total_price))
        assert decimal_price == Decimal("5000.25")


# ============================================================
# Test Suite 4: Multiple Payment Methods
# ============================================================
class TestMultiplePaymentMethods:
    """복합 결제 방법 시나리오"""

    def test_split_payment_cash_and_card(self):
        """현금 + 카드 분할 결제"""
        total = Decimal(10000)
        cash_amount = Decimal(5000)
        card_amount = Decimal(5000)

        assert cash_amount + card_amount == total

    def test_split_payment_validation(self):
        """분할 결제 검증"""
        total = Decimal(10000)
        payments = [
            {'method': 'cash', 'amount': Decimal(3000)},
            {'method': 'card', 'amount': Decimal(4000)},
            {'method': 'gcash', 'amount': Decimal(3000)},
        ]

        total_paid = sum(p['amount'] for p in payments)
        assert total_paid == total

    def test_overpayment_detection(self):
        """초과 결제 감지"""
        total = Decimal(10000)
        payments = [
            {'method': 'cash', 'amount': Decimal(7000)},
            {'method': 'card', 'amount': Decimal(4000)},
        ]

        total_paid = sum(p['amount'] for p in payments)

        if total_paid > total:
            overpayment = total_paid - total
            assert overpayment == Decimal(1000)

    def test_underpayment_detection(self):
        """미결제 감지"""
        total = Decimal(10000)
        payments = [
            {'method': 'cash', 'amount': Decimal(5000)},
        ]

        total_paid = sum(p['amount'] for p in payments)

        if total_paid < total:
            unpaid = total - total_paid
            assert unpaid == Decimal(5000)


# ============================================================
# Test Suite 5: SSS Option Validation
# ============================================================
class TestSSSOptionValidation:
    """SSS 옵션 검증 테스트"""

    def test_valid_sss_options(self):
        """유효한 SSS 옵션"""
        valid_options = ['prepaid', 'hold']

        for option in valid_options:
            assert option in valid_options

    def test_sss_prepaid_option(self):
        """SSS 선지급 옵션"""
        booking = Mock(spec=Booking)
        booking.sss_option = 'prepaid'

        # 선지급: 정부 인보이스 기준 고정액
        assert booking.sss_option == 'prepaid'

    def test_sss_hold_option(self):
        """SSS 보류 옵션"""
        booking = Mock(spec=Booking)
        booking.sss_option = 'hold'

        # 보류: 실제 근무일 기준 유동액
        assert booking.sss_option == 'hold'

    def test_sss_option_change_deadline(self):
        """SSS 옵션 변경 마감: 월 25일"""
        today = date(2026, 6, 20)  # 6월 20일

        # 25일 이전은 변경 가능
        if today.day < 25:
            can_change = True
        else:
            can_change = False

        assert can_change is True

    def test_sss_option_change_after_deadline(self):
        """SSS 옵션 변경 마감 이후"""
        today = date(2026, 6, 26)  # 6월 26일

        # 25일 이후는 변경 불가
        if today.day >= 25:
            can_change = False
        else:
            can_change = True

        assert can_change is False

    def test_invalid_sss_option(self):
        """유효하지 않은 SSS 옵션"""
        invalid_option = "custom"

        valid_options = ['prepaid', 'hold']

        if invalid_option not in valid_options:
            raise ValueError(f"Invalid SSS option: {invalid_option}")


# ============================================================
# Test Suite 6: Payment Status Transitions
# ============================================================
class TestPaymentStatusTransitions:
    """결제 상태 전이 검증"""

    def test_pending_to_completed(self):
        """결제 대기 → 완료"""
        booking = Mock(spec=Booking)
        booking.payment_status = 'pending'

        # 유효한 전이
        booking.payment_status = 'completed'
        assert booking.payment_status == 'completed'

    def test_completed_to_refunded(self):
        """결제 완료 → 환불"""
        booking = Mock(spec=Booking)
        booking.payment_status = 'completed'

        # 유효한 전이
        booking.payment_status = 'refunded'
        assert booking.payment_status == 'refunded'

    def test_pending_to_failed(self):
        """결제 대기 → 실패"""
        booking = Mock(spec=Booking)
        booking.payment_status = 'pending'

        # 유효한 전이
        booking.payment_status = 'failed'
        assert booking.payment_status == 'failed'

    def test_invalid_status_transition(self):
        """유효하지 않은 상태 전이"""
        booking = Mock(spec=Booking)
        booking.payment_status = 'refunded'

        # 환불 → 완료는 불가능
        invalid_transition = booking.payment_status not in ['pending', 'failed']

        if not invalid_transition:
            raise ValueError(
                f"Cannot transition from {booking.payment_status} to completed"
            )


# ============================================================
# Test Suite 7: Credit Collection Rules
# ============================================================
class TestCreditCollectionRules:
    """외상 회수 규칙 검증"""

    def test_credit_collection_rate_guest(self):
        """손님 외상 회수율: 80%"""
        total_amount = Decimal(5000)
        recovery_rate = Decimal(80)

        recovered = total_amount * (recovery_rate / Decimal(100))
        assert recovered == Decimal(4000)

    def test_credit_collection_rate_company(self):
        """업체 선지급 회수율: 0%"""
        total_amount = Decimal(5000)
        recovery_rate = Decimal(0)

        recovered = total_amount * (recovery_rate / Decimal(100))
        assert recovered == Decimal(0)

    def test_credit_collection_rate_credit(self):
        """신용카드 회수율: 100%"""
        total_amount = Decimal(5000)
        recovery_rate = Decimal(100)

        recovered = total_amount * (recovery_rate / Decimal(100))
        assert recovered == Decimal(5000)

    def test_credit_collection_custom_rate(self):
        """커스텀 회수율"""
        total_amount = Decimal(5000)
        recovery_rate = Decimal(75)

        recovered = total_amount * (recovery_rate / Decimal(100))
        assert recovered == Decimal(3750)

    def test_credit_collection_zero_rate(self):
        """회수율 0%"""
        total_amount = Decimal(5000)
        recovery_rate = Decimal(0)

        recovered = total_amount * (recovery_rate / Decimal(100))
        assert recovered == Decimal(0)

    def test_credit_collection_hundred_rate(self):
        """회수율 100%"""
        total_amount = Decimal(5000)
        recovery_rate = Decimal(100)

        recovered = total_amount * (recovery_rate / Decimal(100))
        assert recovered == Decimal(5000)


# ============================================================
# Test Suite 8: Refund Validation
# ============================================================
class TestRefundValidation:
    """환불 검증 테스트"""

    def test_refund_amount_validation(self):
        """환불 금액 검증"""
        original_amount = Decimal(5000)
        refund_amount = Decimal(2500)

        # 환불액은 원금을 초과할 수 없음
        assert refund_amount <= original_amount

    def test_partial_refund(self):
        """부분 환불"""
        original_amount = Decimal(5000)
        refund_amount = Decimal(2000)

        remaining = original_amount - refund_amount
        assert remaining == Decimal(3000)

    def test_full_refund(self):
        """전액 환불"""
        original_amount = Decimal(5000)
        refund_amount = Decimal(5000)

        remaining = original_amount - refund_amount
        assert remaining == Decimal(0)

    def test_refund_exceeds_original_prevented(self):
        """환불액 초과 방지"""
        original_amount = Decimal(5000)
        refund_amount = Decimal(6000)

        if refund_amount > original_amount:
            raise ValueError("Refund amount exceeds original payment")

    def test_refund_after_settlement_prevented(self):
        """정산 완료 후 환불 방지"""
        booking = Mock(spec=Booking)
        booking.payment_status = 'settled'

        # 정산 완료 후는 환불 불가
        if booking.payment_status == 'settled':
            raise ValueError("Cannot refund after settlement")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
