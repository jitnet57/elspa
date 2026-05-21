from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func
from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g. ELSPA-ABC12345
    issued_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False)  # issued_at + 90 days
    status = Column(String(20), default="active")  # active, used
    used_at = Column(DateTime, nullable=True)
    used_booking_id = Column(BigInteger, ForeignKey("bookings.id"), nullable=True)
