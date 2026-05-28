from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.services.massage_booking_service import MassageBookingService
from app.schemas.massage_booking import (
    MassageBookingCreate,
    MassageBookingResponse,
)

router = APIRouter(prefix="/api/massage-bookings", tags=["massage-bookings"])
service = MassageBookingService()


@router.post("/", response_model=MassageBookingResponse)
def create_massage_booking(
    booking: MassageBookingCreate, db: Session = Depends(get_db)
):
    """마사지 예약 생성 (Google Sheet에 자동 동기화)"""
    try:
        new_booking = service.create_booking(db, booking)
        return new_booking
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/date/{target_date}")
def get_bookings_by_date(target_date: date, db: Session = Depends(get_db)):
    """특정 날짜의 모든 예약 조회"""
    bookings = service.get_bookings_by_date(db, target_date)
    return {
        "date": target_date,
        "count": len(bookings),
        "bookings": bookings,
    }


@router.get("/")
def get_all_bookings(db: Session = Depends(get_db)):
    """모든 마사지 예약 조회"""
    bookings = service.get_all_bookings(db)
    return {
        "total": len(bookings),
        "bookings": bookings,
    }


@router.post("/sync-cloud")
def sync_with_cloud(db: Session = Depends(get_db)):
    """클라우드(Google Sheets) + 로컬 동기화 (수동 트리거)"""
    result = service.sync_with_cloud(db)
    return result
