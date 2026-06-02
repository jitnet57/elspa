"""
정산 계산 핵심 로직 — 커미션, 자동 정산 생성, 월간 일괄 정산
경로: app/services/settlement_calculator.py
작성일: 2026-06-02
설명: 예약별 커미션 계산, 정산 자동 생성, 월간 일괄 정산 처리
"""

from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.booking import Booking
from app.models.customer import Customer
from app.models.company_settlement import (
    CompanySettlement,
    SettlementTransaction,
    SettlementCategory,
    TransactionType,
)


# ============================================================
# Function 1: calculate_commission(booking) → commission_amount
# ============================================================
def calculate_commission(booking: Booking) -> Decimal:
    """
    📌 함수명: calculate_commission
    📋 목적: 예약(booking)의 커미션액을 계산합니다
    🔧 매개변수: booking (Booking 객체)
    📤 반환값: Decimal (커미션액)
    📅 작성일: 2026-06-02

    커미션 계산 규칙:
    ─────────────────────────────────────────────────────
    1. 기본 값: total_price × platform_fee_rate / 100
    2. 플랫폼 수수료율:
       - 기본: 25%
       - status='cancelled' → 0% (취소된 예약)
       - status='refunded' → 0% (환불된 예약)
    3. 최소 커미션: 0 (음수 방지)

    예시:
    ─────────────────────────────────────────────────────
    booking.total_price = 5000, platform_fee_rate = 25%
    commission = 5000 × 0.25 = 1250 PHP

    Args:
        booking: Booking 객체

    Returns:
        Decimal: 커미션액 (항상 >= 0)

    Raises:
        ValueError: booking이 None이거나 total_price가 없음
    """
    if not booking:
        raise ValueError("Booking object cannot be None")

    if booking.total_price is None:
        raise ValueError(f"Booking #{booking.id} has no total_price")

    # 단계 1: 기본값으로 total_price 변환
    total_price = Decimal(str(booking.total_price))

    # 단계 2: 취소/환불된 예약은 커미션 0
    if booking.status in ['cancelled', 'refunded']:
        return Decimal(0)

    # 단계 3: 플랫폼 수수료율 결정 (기본 25%)
    # TODO: 규칙 엔진에서 동적으로 조회 가능하도록 확장
    platform_fee_rate = Decimal(25)

    # 단계 4: 커미션 계산
    commission = total_price * (platform_fee_rate / Decimal(100))

    # 단계 5: 음수 방지
    return max(commission, Decimal(0))


# ============================================================
# Function 2: auto_create_settlement(booking) → CompanySettlement
# ============================================================
def auto_create_settlement(
    booking: Booking,
    db: Session,
    created_by: Optional[str] = None
) -> CompanySettlement:
    """
    📌 함수명: auto_create_settlement
    📋 목적: 예약의 payment_from 필드에 따라 자동으로 정산을 생성합니다
    🔧 매개변수: booking (Booking 객체), db (DB 세션), created_by (생성자)
    📤 반환값: CompanySettlement 객체
    📅 작성일: 2026-06-02

    정산 상태 규칙:
    ─────────────────────────────────────────────────────
    Rule 1: payment_from = 'guest'
            → settlement_status = 'pending' (손님 외상)
            → recovery_rate = 80% (회수율 불확실)

    Rule 2: payment_from = 'company'
            → settlement_status = 'waived' (제외, 회수 안함)
            → recovery_rate = 0% (정산 안함)

    Rule 3: payment_from = 'credit'
            → settlement_status = 'pending' (외상 선지급)
            → recovery_rate = 100% (나중에 회수 예정)
            → (신용카드 매출이나 회사 선지급)

    워크플로우:
    ─────────────────────────────────────────────────────
    1. Booking에서 payment_from 확인
    2. 규칙에 따라 settlement_category 결정
    3. 커미션 계산 (calculate_commission 호출)
    4. CompanySettlement 기록 생성 (draft 상태)
    5. SettlementTransaction 거래 기록 추가
    6. DB 저장 및 반환

    예시:
    ─────────────────────────────────────────────────────
    Booking #123:
      - total_price: 5000 PHP
      - payment_from: 'guest'
      - booking_date: 2026-06-01

    Result:
      - CompanySettlement (draft)
      - settlement_category: 'credit' (guest 외상)
      - recovered_amount: 5000 × 0.80 = 4000 PHP
      - platform_fee: 5000 × 0.25 = 1250 PHP
      - net_settlement: (5000 + 4000) - 1250 = 7750 PHP

    Args:
        booking: Booking 객체
        db: SQLAlchemy Session
        created_by: 생성자 (선택사항)

    Returns:
        CompanySettlement: 생성된 정산 기록

    Raises:
        ValueError: booking이 없거나 유효하지 않음
        ValueError: company_id를 확인할 수 없음
    """
    if not booking:
        raise ValueError("Booking object cannot be None")

    if booking.status not in ['completed', 'pending', 'confirmed']:
        raise ValueError(
            f"Cannot create settlement for booking in '{booking.status}' status"
        )

    # 단계 1: payment_from 확인
    payment_from = getattr(booking, 'payment_from', 'guest')

    # 단계 2: 규칙에 따라 settlement_category 결정
    if payment_from == 'guest':
        # Rule 1: 손님 외상
        settlement_category = SettlementCategory.CREDIT.value
        recovery_rate = Decimal(80)  # 회수율 80%
        status = 'pending'
    elif payment_from == 'company':
        # Rule 2: 회사에서 정산 제외
        settlement_category = SettlementCategory.WAIVED.value
        recovery_rate = Decimal(0)  # 정산 안함
        status = 'waived'
    elif payment_from == 'credit':
        # Rule 3: 신용카드 또는 선지급
        settlement_category = SettlementCategory.CREDIT.value
        recovery_rate = Decimal(100)  # 나중에 회수 예정
        status = 'pending'
    else:
        # 기본값: guest 외상
        settlement_category = SettlementCategory.CREDIT.value
        recovery_rate = Decimal(80)
        status = 'pending'

    # 단계 3: 커미션 계산
    commission_amount = calculate_commission(booking)

    # 단계 4: 총 매출 (total_price)
    total_price = Decimal(str(booking.total_price or 0))

    # 단계 5: 회수액 계산
    recovered_amount = total_price * (recovery_rate / Decimal(100))

    # 단계 6: 플랫폼 수수료 (커미션과 동일)
    platform_fee = commission_amount

    # 단계 7: 순정산액 계산
    # net_settlement = (total_price × recovery_rate / 100) - platform_fee
    net_settlement = max(recovered_amount - platform_fee, Decimal(0))

    # 단계 8: CompanySettlement 생성
    settlement_period = booking.booking_date
    settlement = CompanySettlement(
        company_id=booking.therapist_id,  # TODO: therapist_id → company_id 매핑 필요
        settlement_period_year=settlement_period.year,
        settlement_period_month=settlement_period.month,
        total_revenue=total_price,
        guest_revenue=Decimal(0),
        credit_revenue=total_price,
        waived_revenue=Decimal(0) if status != 'waived' else total_price,
        recovery_rate=recovery_rate,
        recovered_amount=recovered_amount,
        platform_fee_rate=Decimal(25),
        platform_fee=platform_fee,
        refund_amount=Decimal(0),
        dispute_deduction=Decimal(0),
        other_deduction=Decimal(0),
        total_deductions=Decimal(0),
        net_settlement=net_settlement,
        status='draft',
        created_by=created_by or 'system',
    )

    db.add(settlement)
    db.flush()  # ID 할당

    # 단계 9: SettlementTransaction 거래 기록 추가
    transaction = SettlementTransaction(
        company_settlement_id=settlement.id,
        booking_id=booking.id,
        customer_id=booking.customer_id,
        transaction_type=TransactionType.BOOKING.value,
        settlement_category=settlement_category,
        amount=total_price,
        recovery_rate=recovery_rate,
        recovered_amount=recovered_amount,
        transaction_date=booking.booking_date,
        notes=f"Auto-created settlement from Booking #{booking.id} (payment_from={payment_from})"
    )

    db.add(transaction)

    # 단계 10: DB 저장
    db.commit()

    return settlement


# ============================================================
# Function 3: bulk_settle_monthly(month) → List[CompanySettlement]
# ============================================================
def bulk_settle_monthly(
    year: int,
    month: int,
    db: Session,
    company_id: Optional[int] = None,
    settled_by: Optional[str] = None
) -> List[CompanySettlement]:
    """
    📌 함수명: bulk_settle_monthly
    📋 목적: 특정 월의 모든 정산을 일괄 처리합니다
    🔧 매개변수: year (연도), month (월), db (DB 세션), company_id (선택), settled_by (선택)
    📤 반환값: List[CompanySettlement] (처리된 정산 목록)
    📅 작성일: 2026-06-02

    월간 정산 처리 워크플로우:
    ─────────────────────────────────────────────────────
    1. 대상 정산 조회 (DRAFT 상태)
    2. 각 정산의 상태 검증
    3. draft → settled 상태 전환
    4. 지급 정보 입력 (settled_by, payment_date)
    5. 변경사항 저장
    6. 처리된 정산 목록 반환

    필터:
    ─────────────────────────────────────────────────────
    - settlement_period_year = year
    - settlement_period_month = month
    - status = 'approved' (승인된 것만 정산)
    - company_id = company_id (선택적 필터)

    예시:
    ─────────────────────────────────────────────────────
    bulk_settle_monthly(2026, 6, db, company_id=1)

    Result:
      - 2026년 6월 company_id=1 정산 10개 처리
      - status: approved → settled
      - payment_date: 2026-06-30
      - Result: [CompanySettlement(...), ...]

    Args:
        year: 정산 연도
        month: 정산 월 (1-12)
        db: SQLAlchemy Session
        company_id: 특정 업체만 정산 (선택사항, None이면 전체)
        settled_by: 정산 담당자 (선택사항)

    Returns:
        List[CompanySettlement]: 처리된 정산 기록 목록

    Raises:
        ValueError: month가 유효하지 않음 (1-12)
    """
    if not (1 <= month <= 12):
        raise ValueError(f"Invalid month: {month} (must be 1-12)")

    if year < 2020 or year > 2099:
        raise ValueError(f"Invalid year: {year}")

    # 단계 1: 대상 정산 조회 (approved 상태만)
    query = db.query(CompanySettlement).filter(
        and_(
            CompanySettlement.settlement_period_year == year,
            CompanySettlement.settlement_period_month == month,
            CompanySettlement.status == 'approved'
        )
    )

    if company_id is not None:
        query = query.filter(CompanySettlement.company_id == company_id)

    settlements = query.all()

    if not settlements:
        return []

    # 단계 2: 지급 날짜 (월 마지막 날)
    if month == 12:
        next_month_first = date(year + 1, 1, 1)
    else:
        next_month_first = date(year, month + 1, 1)

    # 전월 마지막 날
    payment_date = next_month_first - __import__('datetime').timedelta(days=1)

    # 단계 3-5: 각 정산 처리
    processed = []
    for settlement in settlements:
        try:
            # 단계 3: 상태 전환
            settlement.status = 'settled'
            settlement.settlement_date = payment_date
            settlement.payment_date = payment_date
            settlement.paid_by = settled_by or 'batch_system'
            settlement.updated_at = datetime.utcnow()

            db.add(settlement)
            processed.append(settlement)

        except Exception as e:
            # 개별 정산 오류 시에도 계속 진행
            print(f"Error settling CompanySettlement #{settlement.id}: {str(e)}")
            continue

    # 단계 6: 모든 변경사항 저장
    db.commit()

    return processed


# ============================================================
# 헬퍼 함수: 월간 정산 통계 조회
# ============================================================
def get_monthly_settlement_stats(
    year: int,
    month: int,
    db: Session,
    company_id: Optional[int] = None
) -> Dict:
    """
    월간 정산 통계 조회

    Args:
        year: 정산 연도
        month: 정산 월
        db: SQLAlchemy Session
        company_id: 특정 업체 (선택사항)

    Returns:
        정산 통계 딕셔너리
    """
    query = db.query(CompanySettlement).filter(
        and_(
            CompanySettlement.settlement_period_year == year,
            CompanySettlement.settlement_period_month == month
        )
    )

    if company_id is not None:
        query = query.filter(CompanySettlement.company_id == company_id)

    settlements = query.all()

    total_count = len(settlements)
    draft_count = len([s for s in settlements if s.status == 'draft'])
    approved_count = len([s for s in settlements if s.status == 'approved'])
    settled_count = len([s for s in settlements if s.status == 'settled'])

    total_revenue = sum(s.total_revenue for s in settlements) or Decimal(0)
    total_fee = sum(s.platform_fee for s in settlements) or Decimal(0)
    total_settlement = sum(s.net_settlement for s in settlements) or Decimal(0)

    return {
        'period': {'year': year, 'month': month},
        'count': {
            'total': total_count,
            'draft': draft_count,
            'approved': approved_count,
            'settled': settled_count,
        },
        'amounts': {
            'total_revenue': str(total_revenue),
            'total_fee': str(total_fee),
            'total_settlement': str(total_settlement),
        },
        'settlements': settlements,
    }
