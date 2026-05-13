"""
============================================================
📌 모듈: Bed (침대 관리)
📋 목적: 마사지 침대의 상태, 예약, 서비스 정보를 관리
📅 작성일: 2026-05-13
============================================================
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Integer, func, Float
from app.database import Base


class Bed(Base):
    """
    침대(Bed) ORM 모델

    상태 전환:
      available → reserved → in_service → cleaning → available
    """
    __tablename__ = "beds"

    # 기본 정보
    id = Column(BigInteger, primary_key=True, index=True)
    bed_number = Column(Integer, nullable=False)  # 1-30 (각 룸별)
    room_zone = Column(String(50), nullable=False, index=True)  # '마사지룸1', '마사지룸2', 'VIP룸', '커플룸'

    # 현재 상태
    status = Column(
        String(20),
        nullable=False,
        default='available',
        index=True
    )  # available, reserved, in_service, cleaning

    # 고객 정보
    customer_id = Column(BigInteger, nullable=True)
    customer_name = Column(String(255), nullable=True)

    # 테라피스트 정보
    therapist_id = Column(BigInteger, nullable=True)
    therapist_name = Column(String(255), nullable=True)

    # 서비스 정보
    service_name = Column(String(255), nullable=True)  # '스웨디시 60분' 등
    service_minutes = Column(Integer, nullable=True)  # 60, 90, 45 등
    service_price = Column(Float, nullable=True)  # 서비스 가격

    # 시간 정보
    starts_at = Column(DateTime, nullable=True)  # ISO 8601 format
    ends_at = Column(DateTime, nullable=True)    # ISO 8601 format

    # 메타데이터
    booking_id = Column(BigInteger, nullable=True)  # 관련 예약 ID
    notes = Column(String(500), nullable=True)

    # 시스템 필드
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Bed(id={self.id}, bed_number={self.bed_number}, status={self.status})>"
