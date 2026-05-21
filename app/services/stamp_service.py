"""
ElSpa 전자 스탬프 & 쿠폰 서비스
- 방문 1회당 스탬프 1개 지급
- 스탬프 10개 → 무료 마사지 쿠폰 1장 자동 발급
- 스탬프/쿠폰 유효기간: 3개월 (90일)
- 만료된 스탬프/쿠폰 자동 삭제
"""

import random
import string
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.models.stamp import Stamp
from app.models.coupon import Coupon

logger = logging.getLogger(__name__)

STAMPS_PER_COUPON = 10
STAMP_VALIDITY_DAYS = 90
COUPON_VALIDITY_DAYS = 90


def _now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _generate_coupon_code() -> str:
    """ELSPA-XXXXXXXX 형식의 고유 쿠폰 코드 생성"""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=8))
    return f"ELSPA-{suffix}"


async def award_stamp(customer_id: int, booking_id: int | None, db: AsyncSession) -> dict:
    """
    방문 완료 시 스탬프 1개 지급.
    누적 스탬프가 10개 이상이면 쿠폰 자동 발급 후 스탬프 10개 소진.
    """
    now = _now_utc()
    expires = now + timedelta(days=STAMP_VALIDITY_DAYS)

    stamp = Stamp(
        customer_id=customer_id,
        booking_id=booking_id,
        issued_at=now,
        expires_at=expires,
    )
    db.add(stamp)
    await db.flush()  # get ID without committing

    # 현재 유효 스탬프 개수 확인
    count = await count_active_stamps(customer_id, db)

    coupon = None
    if count >= STAMPS_PER_COUPON:
        coupon = await _redeem_stamps_for_coupon(customer_id, db)

    await db.commit()

    return {
        "stamp_id": stamp.id,
        "active_stamps": count if not coupon else 0,
        "coupon_issued": coupon is not None,
        "coupon_code": coupon.code if coupon else None,
    }


async def _redeem_stamps_for_coupon(customer_id: int, db: AsyncSession) -> Coupon:
    """가장 오래된 스탬프 10개를 소진하고 쿠폰 1장 발급"""
    # 가장 오래된 스탬프 10개 조회
    stmt = (
        select(Stamp)
        .where(Stamp.customer_id == customer_id)
        .order_by(Stamp.issued_at.asc())
        .limit(STAMPS_PER_COUPON)
    )
    result = await db.execute(stmt)
    oldest = result.scalars().all()

    # 해당 스탬프 삭제
    ids_to_delete = [s.id for s in oldest]
    await db.execute(delete(Stamp).where(Stamp.id.in_(ids_to_delete)))

    # 쿠폰 코드 중복 방지
    code = _generate_coupon_code()
    for _ in range(5):
        existing = await db.execute(select(Coupon).where(Coupon.code == code))
        if not existing.scalar_one_or_none():
            break
        code = _generate_coupon_code()

    now = _now_utc()
    coupon = Coupon(
        customer_id=customer_id,
        code=code,
        issued_at=now,
        expires_at=now + timedelta(days=COUPON_VALIDITY_DAYS),
        status="active",
    )
    db.add(coupon)
    await db.flush()

    logger.info(f"🎁 쿠폰 발급 | customer={customer_id} | code={code}")
    return coupon


async def count_active_stamps(customer_id: int, db: AsyncSession) -> int:
    """현재 유효한 스탬프 수 반환"""
    now = _now_utc()
    result = await db.execute(
        select(func.count(Stamp.id)).where(
            Stamp.customer_id == customer_id,
            Stamp.expires_at > now,
        )
    )
    return result.scalar_one() or 0


async def get_stamps_info(customer_id: int, db: AsyncSession) -> dict:
    """스탬프 현황 (개수, 다음 만료일, 쿠폰까지 남은 개수)"""
    now = _now_utc()
    stmt = (
        select(Stamp)
        .where(Stamp.customer_id == customer_id, Stamp.expires_at > now)
        .order_by(Stamp.expires_at.asc())
    )
    result = await db.execute(stmt)
    stamps = result.scalars().all()

    next_expiry = stamps[0].expires_at if stamps else None

    return {
        "active_count": len(stamps),
        "needed_for_coupon": STAMPS_PER_COUPON,
        "remaining_for_coupon": max(0, STAMPS_PER_COUPON - len(stamps)),
        "next_expiry": next_expiry.isoformat() if next_expiry else None,
        "stamps": [
            {"id": s.id, "issued_at": s.issued_at.isoformat(), "expires_at": s.expires_at.isoformat()}
            for s in stamps
        ],
    }


async def get_coupons(customer_id: int, db: AsyncSession) -> list:
    """고객의 쿠폰 목록 (active + used)"""
    now = _now_utc()
    result = await db.execute(
        select(Coupon)
        .where(Coupon.customer_id == customer_id)
        .order_by(Coupon.issued_at.desc())
    )
    coupons = result.scalars().all()

    return [
        {
            "id": c.id,
            "code": c.code,
            "status": c.status,
            "issued_at": c.issued_at.isoformat(),
            "expires_at": c.expires_at.isoformat(),
            "used_at": c.used_at.isoformat() if c.used_at else None,
            "is_valid": c.status == "active" and c.expires_at > now,
        }
        for c in coupons
    ]


async def use_coupon(coupon_code: str, booking_id: int, db: AsyncSession) -> dict:
    """쿠폰 사용 처리"""
    now = _now_utc()
    result = await db.execute(select(Coupon).where(Coupon.code == coupon_code))
    coupon = result.scalar_one_or_none()

    if not coupon:
        return {"success": False, "error": "쿠폰을 찾을 수 없습니다"}
    if coupon.status == "used":
        return {"success": False, "error": "이미 사용된 쿠폰입니다"}
    if coupon.expires_at < now:
        return {"success": False, "error": "만료된 쿠폰입니다"}

    coupon.status = "used"
    coupon.used_at = now
    coupon.used_booking_id = booking_id
    await db.commit()

    return {"success": True, "coupon_code": coupon_code}


async def cleanup_expired(db: AsyncSession) -> dict:
    """만료된 스탬프와 쿠폰 자동 삭제"""
    now = _now_utc()

    stamp_result = await db.execute(delete(Stamp).where(Stamp.expires_at <= now))
    coupon_result = await db.execute(
        delete(Coupon).where(Coupon.expires_at <= now, Coupon.status == "active")
    )
    await db.commit()

    deleted_stamps = stamp_result.rowcount
    deleted_coupons = coupon_result.rowcount

    logger.info(f"🗑️ 만료 삭제 | stamps={deleted_stamps} | coupons={deleted_coupons}")
    return {"deleted_stamps": deleted_stamps, "deleted_coupons": deleted_coupons}
