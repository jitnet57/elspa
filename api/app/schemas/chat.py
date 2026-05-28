from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChatBase(BaseModel):
    customer_id: int
    message: str
    sender: str  # customer, ai, staff
    channel: str  # kakao, messenger, etc
    status: str = "pending"


class ChatCreate(ChatBase):
    pass


class ChatUpdate(BaseModel):
    ai_response: Optional[str] = None
    status: Optional[str] = None


class ChatResponse(ChatBase):
    id: int
    ai_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
