from sqlalchemy import Column, BigInteger, String, DateTime, Date, Time, Integer, Numeric, ForeignKey, func
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    therapist_id = Column(BigInteger, ForeignKey("therapists.id"), nullable=False)
    service_id = Column(BigInteger, ForeignKey("services.id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    location = Column(String(255))
    special_request = Column(String)
    status = Column(String(50), default="pending")  # pending, confirmed, completed, cancelled
    total_price = Column(Numeric(10, 2))
    payment_method = Column(String(50))  # card, cash, kakaopay
    notes = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
