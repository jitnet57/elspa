from sqlalchemy import Column, BigInteger, String, DateTime, func
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True)
    email = Column(String(255), unique=True)
    memo = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
