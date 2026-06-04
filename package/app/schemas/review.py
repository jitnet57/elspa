from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ReviewBase(BaseModel):
    booking_id: int
    customer_id: int
    therapist_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewResponse(ReviewBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewDetailResponse(ReviewResponse):
    updated_at: datetime

    class Config:
        from_attributes = True
