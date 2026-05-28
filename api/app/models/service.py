from sqlalchemy import Column, BigInteger, String, Numeric, Integer, DateTime, Text, func
from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    base_price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    icon = Column(String(50))
    category = Column(String(100))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
