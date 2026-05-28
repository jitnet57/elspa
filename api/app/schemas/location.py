from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LocationBase(BaseModel):
    entity_type: str  # 'driver', 'customer'
    entity_id: int
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    address: Optional[str] = None
    session_id: Optional[int] = None


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    address: Optional[str] = None


class LocationResponse(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
