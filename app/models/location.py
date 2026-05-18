from sqlalchemy import Column, BigInteger, String, Float, DateTime, func, Integer
from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(BigInteger, primary_key=True)
    entity_type = Column(String(20), nullable=False)  # 'driver', 'customer'
    entity_id = Column(BigInteger, nullable=False)  # staff_id or customer_id
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float)  # 위치 정확도 (미터)
    address = Column(String(500))  # 주소
    session_id = Column(BigInteger)  # 픽업/드롭 세션 ID (optional)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
