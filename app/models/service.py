from sqlalchemy import Column, BigInteger, String, Numeric, Integer, DateTime, func
from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    description = Column(String)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
