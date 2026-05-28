from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TherapistBase(BaseModel):
    name: str
    specialty: str
    bio: Optional[str] = None
    experience_years: int = 0
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None


class TherapistCreate(TherapistBase):
    pass


class TherapistUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    available: Optional[bool] = None


class TherapistResponse(TherapistBase):
    id: int
    rating: float
    review_count: int
    available: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TherapistDetailResponse(TherapistResponse):
    updated_at: datetime

    class Config:
        from_attributes = True
