from sqlalchemy import Column, BigInteger, String, DateTime, Text, Integer, Boolean, Numeric, func
from app.database import Base


class Therapist(Base):
    """테라피스트 모델"""
    __tablename__ = "therapists"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255), nullable=False)
    bio = Column(Text)
    experience_years = Column(Integer, default=0)
    rating = Column(Numeric(2, 1), default=0)
    review_count = Column(Integer, default=0)
    phone = Column(String(20))
    email = Column(String(255))
    location = Column(String(255))
    available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
