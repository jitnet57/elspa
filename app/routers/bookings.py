"""
============================================================
📌 라우터: /api/bookings (예약 관리)
📋 목적: 고객 예약, 예약 상태 변경, 대기 예약 관리
📅 작성일: 2026-05-13
============================================================

엔드포인트 (8개):
  GET    /api/bookings                예약 목록 (필터)
  GET    /api/bookings/{id}           예약 상세
  GET    /api/bookings/waiting        대기 중인 예약
  GET    /api/bookings/today          오늘 예약
  POST   /api/bookings                신규 예약 생성
  PATCH  /api/bookings/{id}           예약 상태 변경
  POST   /api/bookings/{id}/confirm   예약 확정
  DELETE /api/bookings/{id}           예약 취소
"""

import logging
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Booking

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("", response_model=List[BookingResponse])
async def list_bookings(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """예약 목록 조회"""
    result = await db.execute(select(Booking).offset(skip).limit(limit))
    bookings = result.scalars().all()
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    """예약 상세 조회"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")
    return booking


@router.post("", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, db: AsyncSession = Depends(get_db)):
    """새 예약 생성"""
    db_booking = Booking(**booking.dict())
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    return db_booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: int, booking: BookingUpdate, db: AsyncSession = Depends(get_db)):
    """예약 수정"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    if not db_booking:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")

    update_data = booking.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_booking, key, value)

    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    return db_booking


@router.delete("/{booking_id}")
async def delete_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    """예약 삭제"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    if not db_booking:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다")

    await db.delete(db_booking)
    await db.commit()
    return {"message": "예약이 삭제되었습니다"}
