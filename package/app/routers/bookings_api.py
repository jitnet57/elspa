"""
============================================================
📌 Booking API Router
📋 목적: 예약 생성, 조회, 수정, 취소
📅 작성일: 2026-05-18
============================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.booking import Booking
import app.services.stamp_service as stamp_svc
from app.schemas.booking import (
    BookingResponse,
    BookingCreate,
    BookingUpdate
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("/", response_model=List[BookingResponse])
async def get_bookings(
    customer_id: int = None,
    status: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """예약 목록 조회"""
    query = select(Booking)

    if customer_id:
        query = query.where(Booking.customer_id == customer_id)

    if status:
        query = query.where(Booking.status == status)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """새 예약 생성"""
    new_booking = Booking(**booking_data.dict())
    new_booking.status = "confirmed"
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    return new_booking


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_detail(
    booking_id: int,
    db: AsyncSession = Depends(get_db)
):
    """예약 상세 조회"""
    query = select(Booking).where(Booking.id == booking_id)
    result = await db.execute(query)
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다"
        )

    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_data: BookingUpdate,
    db: AsyncSession = Depends(get_db)
):
    """예약 정보 수정"""
    query = select(Booking).where(Booking.id == booking_id)
    result = await db.execute(query)
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다"
        )

    prev_status = booking.status
    update_data = booking_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(booking, key, value)

    await db.commit()
    await db.refresh(booking)

    # 완료 상태로 변경될 때 스탬프 자동 지급
    if prev_status != "completed" and booking.status == "completed":
        try:
            await stamp_svc.award_stamp(booking.customer_id, booking.id, db)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Stamp award failed for booking {booking.id}: {e}")

    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db)
):
    """예약 취소"""
    query = select(Booking).where(Booking.id == booking_id)
    result = await db.execute(query)
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다"
        )

    booking.status = "cancelled"
    await db.commit()
