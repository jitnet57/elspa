from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class MassageBookingCreate(BaseModel):
    therapist: str
    service: str
    date: date
    time: time
    guest_name: str
    room_number: Optional[str] = None
    notes: Optional[str] = None


class MassageBookingResponse(BaseModel):
    id: int
    therapist: str
    service: str
    date: date
    time: time
    guest_name: str
    room_number: Optional[str]
    notes: Optional[str]
    status: str
    synced_to_sheet: bool
    created_at: str

    class Config:
        from_attributes = True
