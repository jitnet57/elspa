"""
============================================================
📌 모듈: Settlement Schema (정산 API)
📋 목적: 정산 관련 입출력 검증
📅 작성일: 2026-05-13
============================================================
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class DailySettlementResponse(BaseModel):
    """일일 정산 응답"""
    date: str  # YYYY-MM-DD
    total_revenue: float
    total_commission: float
    net_profit: float
    session_count: int
    avg_session_value: float
    timestamp: datetime


class TherapistSettlementResponse(BaseModel):
    """테라피스트별 정산 응답"""
    therapist_id: int
    name: str
    specialty: Optional[str] = None
    session_count: int
    total_revenue: float
    total_commission: float
    commission_rate: float
    avg_rating: Optional[float] = None


class ServiceBreakdownResponse(BaseModel):
    """서비스별 분석"""
    service_type: str
    count: int
    revenue: float
    percentage: float
    avg_duration: int


class HourlySalesResponse(BaseModel):
    """시간별 매출"""
    hour: int  # 0-23
    count: int
    revenue: float
    avg_session_value: float


class SettlementReportResponse(BaseModel):
    """정산 리포트"""
    date: str
    daily_summary: DailySettlementResponse
    therapist_settlements: list[TherapistSettlementResponse]
    service_breakdown: list[ServiceBreakdownResponse]
    hourly_sales: list[HourlySalesResponse]
    top_therapists: list[dict]  # 상위 테라피스트
    peak_hours: list[int]  # 피크 시간대
