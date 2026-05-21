from sqlalchemy import Column, BigInteger, String, DateTime, func, ForeignKey, JSON, Text
from app.database import Base


class Chat(Base):
    __tablename__ = "chats"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(String(255), nullable=False)  # Kakao ID or WhatsApp phone
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=True)
    message = Column(Text, nullable=False)
    sender = Column(String(20), nullable=False)  # customer, bot, staff
    channel = Column(String(20), nullable=False)  # kakao, whatsapp, etc
    ai_response = Column(Text)
    intent = Column(String(50))  # book, cancel, price, location, etc
    language = Column(String(10), default="en")  # ko, en, etc
    status = Column(String(20), default="pending")  # pending, processed, closed
    extra_data = Column(JSON)  # Additional data (session state, etc) — 'metadata' is reserved by SQLAlchemy
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
