"""
============================================================
📌 모듈: Attendance (테라피스트 출퇴근 관리)
📋 목적: 테라피스트의 일일 출근/퇴근 기록 관리
📅 작성일: 2026-05-13
============================================================
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Integer, Float, func
from app.database import Base


class Attendance(Base):
    """
    테라피스트 출퇴근 기록 ORM 모델
    """
    __tablename__ = "attendances"

    # 기본 정보
    id = Column(BigInteger, primary_key=True, index=True)
    therapist_id = Column(BigInteger, nullable=False, index=True)
    therapist_name = Column(String(255), nullable=False)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD

    # 출퇴근 시간
    checked_in_at = Column(DateTime, nullable=False)      # ISO 8601
    checked_out_at = Column(DateTime, nullable=True)      # ISO 8601

    # 상태
    status = Column(
        String(20),
        nullable=False,
        default='checked_in'
    )  # checked_in, checked_out

    # 통계 (매일 계산)
    total_sessions = Column(Integer, default=0)  # 이날 처리한 세션 수
    total_hours = Column(Float, default=0.0)    # 근무 시간 (시간 단위)
    total_revenue = Column(Float, default=0.0)  # 이날 총 매출
    total_commission = Column(Float, default=0.0)  # 이날 총 수수료

    # 시스템 필드
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Attendance(id={self.id}, therapist_id={self.therapist_id}, date={self.date})>"
