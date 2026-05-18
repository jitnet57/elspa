from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TherapistServiceBase(BaseModel):
    therapist_id: int
    service_id: int
    price_override: Optional[float] = None


class TherapistServiceCreate(TherapistServiceBase):
    pass


class TherapistServiceResponse(TherapistServiceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
