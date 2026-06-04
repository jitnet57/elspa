from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, func, ForeignKey
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True)
    booking_id = Column(BigInteger, ForeignKey("bookings.id"))
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(20))  # cash, card, etc
    status = Column(String(20), default="pending")  # pending, completed, failed, refunded
    transaction_date = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
