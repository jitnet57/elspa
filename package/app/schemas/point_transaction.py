from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PointTransactionBase(BaseModel):
    customer_id: int
    booking_id: Optional[int] = None
    amount: int
    transaction_type: str  # earn, use, bonus, refund
    description: Optional[str] = None


class PointTransactionCreate(PointTransactionBase):
    pass


class PointTransactionResponse(PointTransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
