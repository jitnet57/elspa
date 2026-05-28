from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, func
from app.database import Base


class Stamp(Base):
    __tablename__ = "stamps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    booking_id = Column(BigInteger, ForeignKey("bookings.id"), nullable=True)
    issued_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False)  # issued_at + 90 days
