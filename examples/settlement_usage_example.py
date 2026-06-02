"""
정산 계산 로직 사용 예시
경로: examples/settlement_usage_example.py
작성일: 2026-06-02
설명: calculate_commission, auto_create_settlement, bulk_settle_monthly 실제 사용법
"""

from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session

from app.services.settlement_calculator import (
    calculate_commission,
    auto_create_settlement,
    bulk_settle_monthly,
    get_monthly_settlement_stats,
)
from app.models.booking import Booking
from app.database import SessionLocal


# ============================================================
# Example 1: 커미션 계산 (calculate_commission)
# ============================================================
def example_1_calculate_commission():
    """
    예제 1: 예약의 커미션 계산

    시나리오:
    - Therapist가 마사지 서비스 5000 PHP 제공
    - 플랫폼 수수료: 25%
    - 커미션 = 5000 × 25% = 1250 PHP
    """
    print("\n" + "=" * 60)
    print("예제 1: 커미션 계산 (calculate_commission)")
    print("=" * 60)

    db = SessionLocal()

    try:
        # 완료된 예약 조회
        booking = db.query(Booking).filter(
            Booking.status == 'completed'
        ).first()

        if not booking:
            print("❌ 완료된 예약이 없습니다.")
            return

        # 커미션 계산
        commission = calculate_commission(booking)

        print(f"✅ Booking #{booking.id}")
        print(f"   총액: {booking.total_price} PHP")
        print(f"   커미션(25%): {commission} PHP")

        # 취소된 예약은 커미션 0
        booking.status = 'cancelled'
        commission_cancelled = calculate_commission(booking)
        print(f"\n[취소된 예약 커미션]")
        print(f"   상태: {booking.status}")
        print(f"   커미션: {commission_cancelled} PHP (0%)")

    finally:
        db.close()


# ============================================================
# Example 2: 정산 자동 생성 - Rule 1 (hand_guest)
# ============================================================
def example_2_settlement_rule1_guest():
    """
    예제 2: 손님 외상 정산 (Rule 1)

    상황:
    - 손님이 나중에 결제하기로 약속
    - payment_from = 'guest'
    - 회수율 80% (회수 불확실)
    - 상태: 'pending' (대기)

    계산:
    - 매출: 5000 PHP
    - 회수액: 5000 × 80% = 4000 PHP
    - 수수료: 5000 × 25% = 1250 PHP
    - 순정산액: 4000 - 1250 = 2750 PHP
    """
    print("\n" + "=" * 60)
    print("예제 2: Rule 1 - 손님 외상 정산")
    print("=" * 60)

    db = SessionLocal()

    try:
        booking = db.query(Booking).filter(
            Booking.id == 101
        ).first()

        if not booking:
            print("❌ Booking #101이 없습니다.")
            return

        # payment_from 설정
        booking.payment_from = 'guest'

        # 정산 자동 생성
        settlement = auto_create_settlement(
            booking=booking,
            db=db,
            created_by='therapist_app'
        )

        print(f"✅ CompanySettlement #{settlement.id} 생성")
        print(f"   업체 ID: {settlement.company_id}")
        print(f"   기간: {settlement.settlement_period_year}-{settlement.settlement_period_month:02d}")
        print(f"\n[매출 분류]")
        print(f"   총 매출: {settlement.total_revenue} PHP")
        print(f"   신용(외상): {settlement.credit_revenue} PHP")
        print(f"\n[회수]")
        print(f"   회수율: {settlement.recovery_rate}%")
        print(f"   회수액: {settlement.recovered_amount} PHP")
        print(f"\n[수수료]")
        print(f"   수수료율: {settlement.platform_fee_rate}%")
        print(f"   수수료: {settlement.platform_fee} PHP")
        print(f"\n[최종 정산]")
        print(f"   순정산액: {settlement.net_settlement} PHP")
        print(f"   상태: {settlement.status}")

    finally:
        db.close()


# ============================================================
# Example 3: 정산 자동 생성 - Rule 2 (company)
# ============================================================
def example_3_settlement_rule2_company():
    """
    예제 3: 회사 정산 제외 (Rule 2)

    상황:
    - 회사에서 직접 지급하는 경우
    - payment_from = 'company'
    - 회수율 0% (정산 안함)
    - 상태: 'waived' (제외)

    계산:
    - 매출: 3000 PHP
    - 회수액: 0 PHP (정산 제외)
    - 순정산액: 0 PHP
    """
    print("\n" + "=" * 60)
    print("예제 3: Rule 2 - 회사 정산 제외")
    print("=" * 60)

    db = SessionLocal()

    try:
        booking = db.query(Booking).filter(
            Booking.id == 102
        ).first()

        if not booking:
            print("❌ Booking #102가 없습니다.")
            return

        booking.payment_from = 'company'

        settlement = auto_create_settlement(
            booking=booking,
            db=db,
            created_by='company_system'
        )

        print(f"✅ CompanySettlement #{settlement.id} 생성")
        print(f"\n[상태]")
        print(f"   정산 상태: {settlement.status} (제외)")
        print(f"   회수율: {settlement.recovery_rate}%")
        print(f"\n[정산 내역]")
        print(f"   총 매출: {settlement.total_revenue} PHP")
        print(f"   제외액: {settlement.waived_revenue} PHP")
        print(f"   회수액: {settlement.recovered_amount} PHP")
        print(f"   순정산액: {settlement.net_settlement} PHP (정산 안함)")

    finally:
        db.close()


# ============================================================
# Example 4: 정산 자동 생성 - Rule 3 (credit)
# ============================================================
def example_4_settlement_rule3_credit():
    """
    예제 4: 신용카드/선지급 정산 (Rule 3)

    상황:
    - 신용카드 선지급 또는 회사 신용
    - payment_from = 'credit'
    - 회수율 100% (나중에 회수)
    - 상태: 'pending' (대기)

    계산:
    - 매출: 10000 PHP
    - 회수액: 10000 × 100% = 10000 PHP
    - 수수료: 10000 × 25% = 2500 PHP
    - 순정산액: 10000 - 2500 = 7500 PHP
    """
    print("\n" + "=" * 60)
    print("예제 4: Rule 3 - 신용카드/선지급 정산")
    print("=" * 60)

    db = SessionLocal()

    try:
        booking = db.query(Booking).filter(
            Booking.id == 103
        ).first()

        if not booking:
            print("❌ Booking #103이 없습니다.")
            return

        booking.payment_from = 'credit'

        settlement = auto_create_settlement(
            booking=booking,
            db=db,
            created_by='credit_system'
        )

        print(f"✅ CompanySettlement #{settlement.id} 생성")
        print(f"\n[회수]")
        print(f"   회수율: {settlement.recovery_rate}%")
        print(f"   회수액: {settlement.recovered_amount} PHP")
        print(f"\n[수수료]")
        print(f"   수수료율: {settlement.platform_fee_rate}%")
        print(f"   수수료: {settlement.platform_fee} PHP")
        print(f"\n[최종 정산]")
        print(f"   순정산액: {settlement.net_settlement} PHP")
        print(f"   상태: {settlement.status}")
        print(f"   추가 설명: 나중에 회수 예정")

    finally:
        db.close()


# ============================================================
# Example 5: 월간 일괄 정산 (bulk_settle_monthly)
# ============================================================
def example_5_bulk_settle_monthly():
    """
    예제 5: 월간 정산 일괄 처리

    시나리오:
    - 2026년 6월 정산을 일괄 처리
    - approved 상태인 정산만 settled 전환
    - 지급일: 2026-06-30 (월 마지막 날)

    처리 순서:
    1. draft → approved (관리자 승인)
    2. approved → settled (자동 일괄 처리)
    3. payment_date, paid_by 자동 입력
    """
    print("\n" + "=" * 60)
    print("예제 5: 월간 일괄 정산 (bulk_settle_monthly)")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Step 1: 월간 정산 통계 조회
        print("\n[Step 1] 정산 현황 조회")
        stats = get_monthly_settlement_stats(2026, 6, db)

        print(f"✅ {stats['period']['year']}-{stats['period']['month']:02d} 정산 현황")
        print(f"   총 정산: {stats['count']['total']}개")
        print(f"   상태별:")
        print(f"     - Draft(대기): {stats['count']['draft']}개")
        print(f"     - Approved(승인됨): {stats['count']['approved']}개")
        print(f"     - Settled(완료): {stats['count']['settled']}개")
        print(f"\n   금액별:")
        print(f"     - 총 매출: {stats['amounts']['total_revenue']} PHP")
        print(f"     - 총 수수료: {stats['amounts']['total_fee']} PHP")
        print(f"     - 총 정산액: {stats['amounts']['total_settlement']} PHP")

        # Step 2: 일괄 정산 처리
        print("\n[Step 2] 일괄 정산 처리")
        result = bulk_settle_monthly(
            year=2026,
            month=6,
            db=db,
            settled_by='finance_admin'
        )

        print(f"✅ {len(result)}개 정산 처리 완료")
        for idx, settlement in enumerate(result, 1):
            print(f"   {idx}. Settlement #{settlement.id}")
            print(f"      - 상태: approved → {settlement.status}")
            print(f"      - 지급액: {settlement.net_settlement} PHP")
            print(f"      - 지급일: {settlement.payment_date}")
            print(f"      - 담당자: {settlement.paid_by}")

        # Step 3: 특정 업체만 정산
        print("\n[Step 3] 특정 업체만 정산 (company_id=1)")
        result_company = bulk_settle_monthly(
            year=2026,
            month=6,
            db=db,
            company_id=1,
            settled_by='company_finance'
        )

        print(f"✅ Company #1: {len(result_company)}개 정산 처리")

    finally:
        db.close()


# ============================================================
# Example 6: 전체 워크플로우 통합
# ============================================================
def example_6_full_workflow():
    """
    예제 6: 전체 워크플로우 통합

    시나리오:
    1. 예약 완료 → 정산 자동 생성
    2. 관리자 승인
    3. 월말 일괄 정산 처리
    4. 지급 완료
    """
    print("\n" + "=" * 60)
    print("예제 6: 전체 워크플로우")
    print("=" * 60)

    db = SessionLocal()

    try:
        print("\n[Phase 1] 예약 완료 → 정산 자동 생성")
        bookings = db.query(Booking).filter(
            Booking.status == 'completed',
            Booking.booking_date >= date(2026, 6, 1),
            Booking.booking_date < date(2026, 7, 1)
        ).limit(3).all()

        settlements = []
        for booking in bookings:
            booking.payment_from = 'guest'  # 기본값: 손님 외상
            settlement = auto_create_settlement(booking, db)
            settlements.append(settlement)
            print(f"  ✅ Booking #{booking.id} → Settlement #{settlement.id}")

        print(f"\n총 {len(settlements)}개 정산 생성")

        print("\n[Phase 2] 관리자 승인")
        for settlement in settlements:
            settlement.status = 'approved'
            settlement.approved_by = 'admin_user'
            db.add(settlement)
        db.commit()
        print(f"  ✅ {len(settlements)}개 정산 승인 완료")

        print("\n[Phase 3] 월말 일괄 정산")
        result = bulk_settle_monthly(
            year=2026,
            month=6,
            db=db,
            settled_by='finance_system'
        )
        print(f"  ✅ {len(result)}개 정산 처리")

        print("\n[Phase 4] 지급 완료")
        for settlement in result:
            print(f"  ✅ Settlement #{settlement.id}")
            print(f"     - 지급액: {settlement.net_settlement} PHP")
            print(f"     - 지급일: {settlement.payment_date}")

    finally:
        db.close()


# ============================================================
# 메인 실행
# ============================================================
if __name__ == '__main__':
    print("\n" + "🎯 정산 계산 로직 사용 예시" + "\n")

    # 예제 선택 실행
    examples = {
        '1': ('커미션 계산', example_1_calculate_commission),
        '2': ('Rule 1 - 손님 외상', example_2_settlement_rule1_guest),
        '3': ('Rule 2 - 회사 정산 제외', example_3_settlement_rule2_company),
        '4': ('Rule 3 - 신용카드 선지급', example_4_settlement_rule3_credit),
        '5': ('월간 일괄 정산', example_5_bulk_settle_monthly),
        '6': ('전체 워크플로우', example_6_full_workflow),
        'all': ('모두 실행', None),
    }

    for key, (name, _) in examples.items():
        print(f"{key}: {name}")

    # 모든 예제 실행
    print("\n모든 예제를 실행합니다...\n")

    example_1_calculate_commission()
    example_2_settlement_rule1_guest()
    example_3_settlement_rule2_company()
    example_4_settlement_rule3_credit()
    example_5_bulk_settle_monthly()
    example_6_full_workflow()

    print("\n" + "=" * 60)
    print("모든 예제 실행 완료!")
    print("=" * 60)
