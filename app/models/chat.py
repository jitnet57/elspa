from sqlalchemy import Column, BigInteger, String, DateTime, func, ForeignKey
from app.database import Base


class Chat(Base):
    __tablename__ = "chats"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    message = Column(String, nullable=False)
    sender = Column(String(20), nullable=False)  # customer, ai, staff
    channel = Column(String(20), nullable=False)  # kakao, messenger, etc
    ai_response = Column(String)
    status = Column(String(20), default="pending")  # pending, processed, closed
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
