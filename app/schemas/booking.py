from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional


class BookingBase(BaseModel):
    customer_id: int
    therapist_id: int
    service_id: int
    booking_date: date
    booking_time: time
    duration_minutes: int
    location: str
    special_request: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    special_request: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    id: int
    status: str
    total_price: Optional[float]
    payment_method: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    updated_at: datetime

    class Config:
        from_attributes = True
