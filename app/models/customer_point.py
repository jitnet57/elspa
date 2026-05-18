from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, func
from app.database import Base


class CustomerPoint(Base):
    __tablename__ = "customer_points"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(BigInteger, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_points = Column(BigInteger, default=0)
    used_points = Column(BigInteger, default=0)
    available_points = Column(BigInteger, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
