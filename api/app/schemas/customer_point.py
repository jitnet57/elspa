from pydantic import BaseModel
from datetime import datetime


class CustomerPointBase(BaseModel):
    customer_id: int
    total_points: int = 0
    used_points: int = 0
    available_points: int = 0


class CustomerPointCreate(CustomerPointBase):
    pass


class CustomerPointResponse(CustomerPointBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
