"""
============================================================
📌 모듈: Bed Schema (침대 API 요청/응답)
📋 목적: Pydantic 모델을 사용한 입출력 검증
📅 작성일: 2026-05-13
============================================================
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BedStatusUpdate(BaseModel):
    """침대 상태 업데이트 요청"""
    status: str = Field(..., description="available | reserved | in_service | cleaning")
    customer_name: Optional[str] = None
    customer_id: Optional[int] = None
    therapist_id: Optional[int] = None
    therapist_name: Optional[str] = None
    service_name: Optional[str] = None
    service_minutes: Optional[int] = None
    service_price: Optional[float] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    booking_id: Optional[int] = None
    notes: Optional[str] = None


class BedResponse(BaseModel):
    """침대 조회 응답"""
    id: int
    bed_number: int
    room_zone: str
    status: str
    customer_name: Optional[str] = None
    customer_id: Optional[int] = None
    therapist_id: Optional[int] = None
    therapist_name: Optional[str] = None
    service_name: Optional[str] = None
    service_minutes: Optional[int] = None
    service_price: Optional[float] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    remaining_minutes: Optional[int] = None  # 계산된 값
    booking_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BedListResponse(BaseModel):
    """침대 목록 응답"""
    data: list[BedResponse]
    total_count: int
    filtered_count: int


class BedStatsResponse(BaseModel):
    """침대 통계 응답"""
    total_beds: int
    available_count: int
    reserved_count: int
    in_service_count: int
    cleaning_count: int
    occupancy_rate: float  # 0.0 ~ 1.0


class BedBulkStatusUpdate(BaseModel):
    """대량 침대 상태 변경"""
    bed_ids: list[int]
    status: str
    notes: Optional[str] = None
