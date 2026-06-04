from sqlalchemy import Column, BigInteger, DateTime, Text, Integer, ForeignKey, func
from app.database import Base


class Review(Base):
    """리뷰 모델"""
    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    booking_id = Column(BigInteger, nullable=False)
    customer_id = Column(BigInteger, ForeignKey("customers.id"), nullable=False)
    therapist_id = Column(BigInteger, ForeignKey("therapists.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
