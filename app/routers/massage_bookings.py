from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sqlfunc
from datetime import date
from app.database import get_db
from app.models.massage_booking import MassageBooking
from app.services.massage_booking_service import MassageBookingService
from app.schemas.massage_booking import (
    MassageBookingCreate,
    MassageBookingResponse,
)

router = APIRouter(prefix="/api/massage-bookings", tags=["massage-bookings"])
service = MassageBookingService()


@router.get("/revenue/range")
def get_revenue_range(
    start: date = Query(..., description="YYYY-MM-DD"),
    end:   date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """기간별 매출 자동 집계 (경영지표 일간·주간 보고서용)

    massage_bookings.service_price 를 date 별로 합산. 취소건 제외.
    반환: 총매출 / 총예약건수 / 일자별 {date, revenue, count}
    """
    rows = db.execute(
        select(
            MassageBooking.date,
            sqlfunc.count(MassageBooking.id).label("count"),
            sqlfunc.coalesce(sqlfunc.sum(MassageBooking.service_price), 0).label("revenue"),
        )
        .where(
            MassageBooking.date >= start,
            MassageBooking.date <= end,
            MassageBooking.status != "cancelled",
        )
        .group_by(MassageBooking.date)
        .order_by(MassageBooking.date)
    ).all()
    by_date = [
        {"date": r.date.isoformat(), "count": r.count, "revenue": float(r.revenue or 0)}
        for r in rows
    ]
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "total_revenue": sum(d["revenue"] for d in by_date),
        "total_count": sum(d["count"] for d in by_date),
        "by_date": by_date,
    }


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
