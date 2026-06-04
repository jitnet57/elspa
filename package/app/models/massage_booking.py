from sqlalchemy import Column, BigInteger, String, DateTime, Date, Time, Integer, Boolean, func, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


class MassageBooking(Base):
    __tablename__ = "massage_bookings"

    id = Column(BigInteger, primary_key=True, index=True)

    # 테라피스트 (외래키로 변경)
    therapist_id = Column(Integer, ForeignKey("employees.id"), nullable=True)  # 기존 therapist 문자열 호환
    therapist = Column(String(100), nullable=False)  # 레거시: 이름 저장 (호환성)

    service = Column(String(100), nullable=False)  # 서비스명 (마사지 타입)
    service_duration_minutes = Column(Integer, default=60)  # 서비스 소요 시간 (분)
    service_price = Column(Numeric(10, 2), default=0)  # 서비스 가격 (Peso)

    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    guest_name = Column(String(100), nullable=False)
    room_number = Column(String(10))
    notes = Column(String)
    status = Column(String(20), default="pending")  # pending, confirmed, completed
    synced_to_sheet = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 관계
    employee = relationship("Employee", backref="massage_bookings")
