from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookingBase(BaseModel):
    customer_id: int
    service_id: int
    booking_date: str  # YYYY-MM-DD
    time_slot: str  # HH:MM
    status: str = "pending"
    staff_id: Optional[int] = None
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    staff_id: Optional[int] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
