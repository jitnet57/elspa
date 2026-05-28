from sqlalchemy import Column, BigInteger, String, DateTime, Date, Time, Integer, Boolean, func
from app.database import Base


class MassageBooking(Base):
    __tablename__ = "massage_bookings"

    id = Column(BigInteger, primary_key=True, index=True)
    therapist = Column(String(100), nullable=False)
    service = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    guest_name = Column(String(100), nullable=False)
    room_number = Column(String(10))
    notes = Column(String)
    status = Column(String(20), default="pending")  # pending, confirmed, completed
    synced_to_sheet = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
