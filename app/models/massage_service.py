"""
============================================================
📌 모듈: Massage Service (마사지 종류 관리)
📋 목적: 제공하는 마사지 서비스 종류를 데이터베이스에서 관리 (CRUD)
📅 작성일: 2026-06-03
============================================================
"""

from sqlalchemy import Column, BigInteger, String, Numeric, Integer, Boolean, DateTime, func
from app.database import Base


class MassageService(Base):
    """
    마사지 서비스(MassageService) ORM 모델

    용도:
      - 관리자가 제공하는 마사지 종류를 CRUD
      - 예약 시스템에서 서비스 목록 제공
      - 가격, 시간, 설명 등 동적으로 관리
    """
    __tablename__ = "massage_services"

    # 기본 정보
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)  # 'Swedish Massage', 'Thai Massage' 등
    base_price = Column(Numeric(10, 2), nullable=False)  # 기본 가격
    base_duration_minutes = Column(Integer, nullable=False)  # 기본 소요 시간

    # 상세 정보
    description = Column(String(500), nullable=True)  # '근육의 긴장을 풀어주는 스웨디시 마사지' 등
    is_active = Column(Boolean, nullable=False, default=True, index=True)  # 활성 여부
    icon = Column(String(50), nullable=True)  # 이모지 또는 아이콘 URL ('💆', '🙏' 등)

    # 시스템 필드
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<MassageService(id={self.id}, name={self.name}, price={self.base_price}, duration={self.base_duration_minutes}min)>"
