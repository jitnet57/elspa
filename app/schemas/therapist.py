"""
============================================================
📌 모듈: Therapist Schema (테라피스트 API)
📋 목적: 테라피스트 관련 입출력 검증
📅 작성일: 2026-05-13
============================================================
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class TherapistResponse(BaseModel):
    """테라피스트 조회 응답"""
    id: int
    name: str
    status: str  # idle, in_service, resting, checked_out
    specialty: Optional[str] = None
    current_bed_id: Optional[int] = None
    current_bed_number: Optional[int] = None
    remaining_minutes: Optional[int] = None
    rating: Optional[float] = None
    total_sessions: Optional[int] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TherapistListResponse(BaseModel):
    """테라피스트 목록 응답"""
    data: list[TherapistResponse]
    total_count: int
    idle_count: int
    in_service_count: int
    resting_count: int
    checked_out_count: int


class TherapistCheckInRequest(BaseModel):
    """테라피스트 체크인 요청"""
    date: str = Field(..., description="YYYY-MM-DD")


class TherapistCheckInResponse(BaseModel):
    """테라피스트 체크인 응답"""
    id: int
    name: str
    status: str
    specialty: Optional[str] = None
    checked_in_at: datetime
    message: str

    class Config:
        from_attributes = True


class TherapistCheckOutResponse(BaseModel):
    """테라피스트 체크아웃 응답"""
    id: int
    name: str
    status: str
    checked_out_at: datetime
    summary: dict  # { sessions_today: int, total_hours: float }

    class Config:
        from_attributes = True


class TherapistStatusUpdate(BaseModel):
    """테라피스트 상태 변경"""
    status: str = Field(..., description="idle | in_service | resting | checked_out")


class TherapistScheduleResponse(BaseModel):
    """테라피스트 스케줄"""
    therapist_id: int
    name: str
    date: str
    bookings: list[dict]  # 예약 목록
    total_hours: float
