"""
============================================================
📌 모듈: Massage Service Schema (마사지 종류 API 요청/응답)
📋 목적: Pydantic 모델을 사용한 입출력 검증
📅 작성일: 2026-06-03
============================================================
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class MassageServiceBase(BaseModel):
    """마사지 서비스 기본 정보 (공통 필드)"""
    name: str = Field(..., min_length=1, max_length=255, description="마사지 종류명 (고유)")
    base_price: Decimal = Field(..., ge=0, decimal_places=2, description="기본 가격")
    base_duration_minutes: int = Field(..., gt=0, description="기본 소요 시간 (분)")
    description: Optional[str] = Field(None, max_length=500, description="설명")
    is_active: bool = Field(True, description="활성 여부")
    icon: Optional[str] = Field(None, max_length=50, description="이모지 또는 아이콘 URL")


class MassageServiceCreate(MassageServiceBase):
    """마사지 서비스 생성 요청"""
    pass


class MassageServiceUpdate(BaseModel):
    """마사지 서비스 업데이트 요청"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    base_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    base_duration_minutes: Optional[int] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    icon: Optional[str] = Field(None, max_length=50)


class MassageServiceResponse(MassageServiceBase):
    """마사지 서비스 조회 응답"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MassageServiceListResponse(BaseModel):
    """마사지 서비스 목록 응답"""
    data: list[MassageServiceResponse]
    total_count: int
    active_count: int  # 활성 서비스 개수
