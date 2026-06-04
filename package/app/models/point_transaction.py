from sqlalchemy import Column, BigInteger, String, Integer, DateTime, ForeignKey, func
from app.database import Base


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(BigInteger, ForeignKey("bookings.id", ondelete="SET NULL"))
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String(50), nullable=False)  # earn, use, bonus, refund
    description = Column(String(255))
    created_at = Column(DateTime, default=func.now())
