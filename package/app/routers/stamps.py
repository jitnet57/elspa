"""
스탬프 & 쿠폰 API 라우터
- GET  /api/customers/{id}/stamps  → 스탬프 현황
- GET  /api/customers/{id}/coupons → 쿠폰 목록
- POST /api/stamps/award/{booking_id} → 스탬프 수동 지급 (admin)
- POST /api/coupons/use/{coupon_code} → 쿠폰 사용
- POST /api/stamps/cleanup → 만료 항목 삭제 (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
import app.services.stamp_service as svc

router = APIRouter(tags=["stamps"])


@router.get("/api/customers/{customer_id}/stamps")
async def get_customer_stamps(customer_id: int, db: AsyncSession = Depends(get_db)):
    """고객 스탬프 현황 조회"""
    return await svc.get_stamps_info(customer_id, db)


@router.get("/api/customers/{customer_id}/coupons")
async def get_customer_coupons(customer_id: int, db: AsyncSession = Depends(get_db)):
    """고객 쿠폰 목록 조회"""
    return await svc.get_coupons(customer_id, db)


@router.post("/api/stamps/award/{booking_id}")
async def award_stamp_manual(
    booking_id: int,
    customer_id: int = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    """어드민: 스탬프 수동 지급"""
    return await svc.award_stamp(customer_id, booking_id, db)


@router.post("/api/coupons/use/{coupon_code}")
async def use_coupon(
    coupon_code: str,
    booking_id: int = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    """쿠폰 사용 처리"""
    result = await svc.use_coupon(coupon_code, booking_id, db)
    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@router.post("/api/stamps/cleanup")
async def run_cleanup(db: AsyncSession = Depends(get_db)):
    """어드민: 만료된 스탬프/쿠폰 삭제"""
    return await svc.cleanup_expired(db)
