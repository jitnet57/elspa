from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ServiceBase(BaseModel):
    name: str
    price: Decimal
    duration_minutes: int
    description: Optional[str] = None
    is_active: int = 1


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
