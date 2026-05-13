from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    service_id = Column(BigInteger, ForeignKey("services.id"), nullable=False)
    booking_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    time_slot = Column(String(10), nullable=False)  # HH:MM
    status = Column(String(20), default="pending")  # pending, confirmed, completed, cancelled
    staff_id = Column(BigInteger, ForeignKey("staffs.id"))
    notes = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
