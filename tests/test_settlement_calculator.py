"""
정산 계산 로직 테스트
경로: tests/test_settlement_calculator.py
작성일: 2026-06-02
설명: calculate_commission, auto_create_settlement, bulk_settle_monthly 함수 테스트
"""

import pytest
from datetime import date
from decimal import Decimal
from unittest.mock import Mock, MagicMock

from app.services.settlement_calculator import (
    calculate_commission,
    auto_create_settlement,
    bulk_settle_monthly,
    get_monthly_settlement_stats,
)
from app.models.booking import Booking
from app.models.company_settlement import CompanySettlement


# ============================================================
# Test Suite 1: calculate_commission
# ============================================================
class TestCalculateCommission:
    """calculate_commission 함수 테스트"""

    def test_calculate_commission_basic(self):
        """기본 커미션 계산 (total_price × 25%)"""
        # Arrange
        booking = Mock(spec=Booking)
        booking.id = 1
        booking.total_price = Decimal(5000)
        booking.status = 'completed'

        # Act
        commission = calculate_commission(booking)

        # Assert
        assert commission == Decimal(1250)  # 5000 × 25%

    def test_calculate_commission_cancelled_booking(self):
        """취소된 예약 커미션 = 0"""
        # Arrange
        booking = Mock(spec=Booking)
        booking.id = 2
        booking.total_price = Decimal(5000)
        booking.status = 'cancelled'

        # Act
        commission = calculate_commission(booking)

        # Assert
        assert commission == Decimal(0)

    def test_calculate_commission_refunded_booking(self):
        """환불된 예약 커미션 = 0"""
        # Arrange
        booking = Mock(spec=Booking)
        booking.id = 3
        booking.total_price = Decimal(5000)
        booking.status = 'refunded'

        # Act
        commission = calculate_commission(booking)

        # Assert
        assert commission == Decimal(0)

    def test_calculate_commission_zero_price(self):
        """무료 예약 커미션 = 0"""
        # Arrange
        booking = Mock(spec=Booking)
        booking.id = 4
        booking.total_price = Decimal(0)
        booking.status = 'completed'

        # Act
        commission = calculate_commission(booking)

        # Assert
        assert commission == Decimal(0)

    def test_calculate_commission_none_booking(self):
        """None booking 입력 시 에러"""
        # Act & Assert
        with pytest.raises(ValueError, match="Booking object cannot be None"):
            calculate_commission(None)

    def test_calculate_commission_none_price(self):
        """None total_price 입력 시 에러"""
        # Arrange
        booking = Mock(spec=Booking)
        booking.id = 5
        booking.total_price = None
        booking.status = 'completed'

        # Act & Assert
        with pytest.raises(ValueError, match="has no total_price"):
            calculate_commission(booking)

    def test_calculate_commission_string_price(self):
        """문자열 total_price 변환"""
        # Arrange
        booking = Mock(spec=Booking)
        booking.id = 6
        booking.total_price = "2500"  # 문자열
        booking.status = 'completed'

        # Act
        commission = calculate_commission(booking)

        # Assert
        assert commission == Decimal(625)  # 2500 × 25%


# ============================================================
# Test Suite 2: auto_create_settlement
# ============================================================
class TestAutoCreateSettlement:
    """auto_create_settlement 함수 테스트"""

    def test_auto_create_settlement_payment_from_guest(self):
        """Rule 1: payment_from='guest' → pending, recovery=80%"""
        # Arrange
        db = Mock()
        booking = Mock(spec=Booking)
        booking.id = 101
        booking.therapist_id = 1
        booking.customer_id = 10
        booking.total_price = Decimal(5000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 1)
        booking.payment_from = 'guest'

        # Act
        settlement = auto_create_settlement(booking, db, created_by='test_user')

        # Assert
        assert settlement.settlement_category == 'credit'
        assert settlement.recovery_rate == Decimal(80)
        assert settlement.status == 'draft'
        assert settlement.recovered_amount == Decimal(4000)  # 5000 × 80%
        db.add.assert_called()
        db.flush.assert_called()
        db.commit.assert_called()

    def test_auto_create_settlement_payment_from_company(self):
        """Rule 2: payment_from='company' → waived, recovery=0%"""
        # Arrange
        db = Mock()
        booking = Mock(spec=Booking)
        booking.id = 102
        booking.therapist_id = 1
        booking.customer_id = 11
        booking.total_price = Decimal(3000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 2)
        booking.payment_from = 'company'

        # Act
        settlement = auto_create_settlement(booking, db)

        # Assert
        assert settlement.settlement_category == 'waived'
        assert settlement.recovery_rate == Decimal(0)
        assert settlement.status == 'waived'
        assert settlement.recovered_amount == Decimal(0)

    def test_auto_create_settlement_payment_from_credit(self):
        """Rule 3: payment_from='credit' → pending, recovery=100%"""
        # Arrange
        db = Mock()
        booking = Mock(spec=Booking)
        booking.id = 103
        booking.therapist_id = 2
        booking.customer_id = 12
        booking.total_price = Decimal(10000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 3)
        booking.payment_from = 'credit'

        # Act
        settlement = auto_create_settlement(booking, db)

        # Assert
        assert settlement.settlement_category == 'credit'
        assert settlement.recovery_rate == Decimal(100)
        assert settlement.status == 'draft'
        assert settlement.recovered_amount == Decimal(10000)

    def test_auto_create_settlement_none_booking(self):
        """None booking 입력 시 에러"""
        db = Mock()

        with pytest.raises(ValueError, match="Booking object cannot be None"):
            auto_create_settlement(None, db)

    def test_auto_create_settlement_invalid_status(self):
        """유효하지 않은 booking status"""
        db = Mock()
        booking = Mock(spec=Booking)
        booking.status = 'pending_refund'

        with pytest.raises(ValueError, match="Cannot create settlement"):
            auto_create_settlement(booking, db)

    def test_auto_create_settlement_default_payment_from(self):
        """payment_from 미설정 시 기본값 'guest'"""
        # Arrange
        db = Mock()
        booking = Mock(spec=Booking)
        booking.id = 104
        booking.therapist_id = 3
        booking.customer_id = 13
        booking.total_price = Decimal(7500)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 4)
        # payment_from 속성 없음

        # Act
        settlement = auto_create_settlement(booking, db)

        # Assert (기본값으로 guest 처리)
        assert settlement.recovery_rate == Decimal(80)
        assert settlement.status == 'draft'

    def test_auto_create_settlement_calculates_net_settlement(self):
        """정산액 = 회수액 - 수수료"""
        # Arrange
        db = Mock()
        booking = Mock(spec=Booking)
        booking.id = 105
        booking.therapist_id = 4
        booking.customer_id = 14
        booking.total_price = Decimal(8000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 5)
        booking.payment_from = 'credit'

        # Act
        settlement = auto_create_settlement(booking, db)

        # Assert
        # 회수액: 8000 × 100% = 8000
        # 수수료: 8000 × 25% = 2000
        # 순정산액: 8000 - 2000 = 6000
        assert settlement.recovered_amount == Decimal(8000)
        assert settlement.platform_fee == Decimal(2000)
        assert settlement.net_settlement == Decimal(6000)


# ============================================================
# Test Suite 3: bulk_settle_monthly
# ============================================================
class TestBulkSettleMonthly:
    """bulk_settle_monthly 함수 테스트"""

    def test_bulk_settle_monthly_valid(self):
        """월간 정산 일괄 처리"""
        # Arrange
        db = Mock()

        # 승인된 정산 2개 생성
        settlement1 = Mock(spec=CompanySettlement)
        settlement1.id = 1
        settlement1.status = 'approved'
        settlement1.settlement_period_year = 2026
        settlement1.settlement_period_month = 6
        settlement1.company_id = 1

        settlement2 = Mock(spec=CompanySettlement)
        settlement2.id = 2
        settlement2.status = 'approved'
        settlement2.settlement_period_year = 2026
        settlement2.settlement_period_month = 6
        settlement2.company_id = 2

        db.query.return_value.filter.return_value.all.return_value = [
            settlement1, settlement2
        ]

        # Act
        result = bulk_settle_monthly(2026, 6, db, settled_by='admin')

        # Assert
        assert len(result) == 2
        assert result[0].status == 'settled'
        assert result[1].status == 'settled'
        assert result[0].paid_by == 'admin'
        db.commit.assert_called()

    def test_bulk_settle_monthly_with_company_filter(self):
        """특정 업체만 정산"""
        # Arrange
        db = Mock()
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 3
        settlement.status = 'approved'
        settlement.company_id = 1

        db.query.return_value.filter.return_value.filter.return_value.all.return_value = [
            settlement
        ]

        # Act
        result = bulk_settle_monthly(2026, 6, db, company_id=1)

        # Assert
        assert len(result) == 1
        assert result[0].company_id == 1

    def test_bulk_settle_monthly_no_settlements(self):
        """정산 없을 때 빈 리스트"""
        # Arrange
        db = Mock()
        db.query.return_value.filter.return_value.all.return_value = []

        # Act
        result = bulk_settle_monthly(2026, 6, db)

        # Assert
        assert result == []

    def test_bulk_settle_monthly_invalid_month(self):
        """유효하지 않은 월"""
        db = Mock()

        with pytest.raises(ValueError, match="Invalid month"):
            bulk_settle_monthly(2026, 13, db)

        with pytest.raises(ValueError, match="Invalid month"):
            bulk_settle_monthly(2026, 0, db)

    def test_bulk_settle_monthly_invalid_year(self):
        """유효하지 않은 연도"""
        db = Mock()

        with pytest.raises(ValueError, match="Invalid year"):
            bulk_settle_monthly(1999, 6, db)

        with pytest.raises(ValueError, match="Invalid year"):
            bulk_settle_monthly(2100, 6, db)

    def test_bulk_settle_monthly_december_handling(self):
        """12월 정산 (다음 해 1월 처리)"""
        # Arrange
        db = Mock()
        settlement = Mock(spec=CompanySettlement)
        settlement.id = 4
        settlement.status = 'approved'
        settlement.settlement_period_year = 2025
        settlement.settlement_period_month = 12

        db.query.return_value.filter.return_value.all.return_value = [settlement]

        # Act
        result = bulk_settle_monthly(2025, 12, db)

        # Assert
        assert len(result) == 1
        # payment_date는 2025-12-31이어야 함
        assert result[0].payment_date.month == 12
        assert result[0].payment_date.year == 2025


# ============================================================
# Test Suite 4: get_monthly_settlement_stats
# ============================================================
class TestGetMonthlySettlementStats:
    """get_monthly_settlement_stats 헬퍼 함수 테스트"""

    def test_get_monthly_settlement_stats(self):
        """월간 정산 통계 조회"""
        # Arrange
        db = Mock()

        settlement1 = Mock(spec=CompanySettlement)
        settlement1.status = 'draft'
        settlement1.total_revenue = Decimal(10000)
        settlement1.platform_fee = Decimal(2500)
        settlement1.net_settlement = Decimal(7500)

        settlement2 = Mock(spec=CompanySettlement)
        settlement2.status = 'approved'
        settlement2.total_revenue = Decimal(5000)
        settlement2.platform_fee = Decimal(1250)
        settlement2.net_settlement = Decimal(3750)

        settlement3 = Mock(spec=CompanySettlement)
        settlement3.status = 'settled'
        settlement3.total_revenue = Decimal(3000)
        settlement3.platform_fee = Decimal(750)
        settlement3.net_settlement = Decimal(2250)

        db.query.return_value.filter.return_value.all.return_value = [
            settlement1, settlement2, settlement3
        ]

        # Act
        stats = get_monthly_settlement_stats(2026, 6, db)

        # Assert
        assert stats['period']['year'] == 2026
        assert stats['period']['month'] == 6
        assert stats['count']['total'] == 3
        assert stats['count']['draft'] == 1
        assert stats['count']['approved'] == 1
        assert stats['count']['settled'] == 1
        assert stats['amounts']['total_revenue'] == '18000'
        assert stats['amounts']['total_fee'] == '4500'
        assert stats['amounts']['total_settlement'] == '13500'


# ============================================================
# 통합 테스트 (Integration Tests)
# ============================================================
class TestSettlementIntegration:
    """정산 전체 워크플로우 통합 테스트"""

    def test_full_workflow(self):
        """
        전체 워크플로우:
        1. Booking 생성 (payment_from='guest')
        2. auto_create_settlement로 정산 생성
        3. bulk_settle_monthly로 월간 정산 처리
        """
        # Step 1: Booking 생성
        db = Mock()
        booking = Mock(spec=Booking)
        booking.id = 201
        booking.therapist_id = 10
        booking.customer_id = 100
        booking.total_price = Decimal(5000)
        booking.status = 'completed'
        booking.booking_date = date(2026, 6, 15)
        booking.payment_from = 'guest'

        # Step 2: auto_create_settlement
        settlement = auto_create_settlement(booking, db, created_by='therapist_app')

        assert settlement.status == 'draft'
        assert settlement.recovered_amount == Decimal(4000)
        assert settlement.net_settlement == Decimal(2750)  # 4000 - 1250

        # Step 3: 정산 승인 (상태 변경)
        settlement.status = 'approved'

        # Step 4: bulk_settle_monthly
        db.query.return_value.filter.return_value.all.return_value = [settlement]
        result = bulk_settle_monthly(2026, 6, db)

        assert len(result) == 1
        assert result[0].status == 'settled'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
