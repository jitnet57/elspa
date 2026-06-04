"""
매칭 API 요청/응답 스키마
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class MatchingRequest(BaseModel):
    """매칭 후보 조회 요청"""

    service_id: int = Field(..., description="서비스 ID")
    requested_time: Optional[str] = Field(
        default=None, description="요청 시간 (HH:MM)"
    )
    preferred_staff_id: Optional[int] = Field(
        default=None, description="선호하는 테라피스트 ID"
    )
    mode: str = Field(
        default="balanced",
        description="매칭 모드: balanced | fairness | new_boost | hybrid",
    )
    limit: int = Field(default=3, ge=1, le=10, description="반환할 최대 후보 수")


class MatchingBreakdown(BaseModel):
    """점수 상세 정보"""

    expertise: float = Field(description="전문성 점수")
    availability: float = Field(description="가용시간 점수")
    rating: float = Field(description="평점 점수")
    fairness: Optional[float] = Field(default=None, description="공정성 점수 (Fairness 모드)")
    new_boost: Optional[float] = Field(
        default=None, description="신인 보너스 (New Boost 모드)"
    )


class MatchingCandidate(BaseModel):
    """매칭 후보"""

    staff_id: int
    name: str
    rating: float = Field(..., description="테라피스트 평점 (0~5)")
    total_sessions: int = Field(..., description="누적 세션 수")
    month_sessions: int = Field(..., description="이달 세션 수")
    score: float = Field(..., description="총 매칭 점수")
    breakdown: MatchingBreakdown
    availability_status: str = Field(..., description="가용 상태")


class MatchingResponse(BaseModel):
    """매칭 후보 조회 응답"""

    mode: str = Field(..., description="사용된 매칭 모드")
    total_candidates: int = Field(..., description="총 후보 수")
    candidates: List[MatchingCandidate]


class MatchingConfirmRequest(BaseModel):
    """매칭 확정 요청"""

    booking_id: int = Field(..., description="예약 ID")
    staff_id: int = Field(..., description="테라피스트 ID")


class MatchingConfirmResponse(BaseModel):
    """매칭 확정 응답"""

    success: bool
    booking_id: int
    staff_id: int
    confirmed_at: str
    error: Optional[str] = None


class MatchingModeResponse(BaseModel):
    """사용 가능한 모드 목록"""

    modes: List[str] = Field(..., description="['balanced', 'fairness', 'new_boost', 'hybrid']")


class SimulationRequest(BaseModel):
    """매칭 시뮬레이션 요청"""

    service_id: int = Field(..., description="서비스 ID")
    mode: str = Field(..., description="매칭 모드")
    num_simulations: int = Field(
        default=1000, ge=100, le=10000, description="시뮬레이션 횟수"
    )


class StaffMatchingStats(BaseModel):
    """테라피스트별 매칭 통계"""

    staff_id: int
    matching_count: int
    matching_percentage: float
    average_score: float


class SimulationResponse(BaseModel):
    """매칭 시뮬레이션 응답"""

    mode: str
    total_simulations: int
    total_matches: int
    average_score: float
    fairness_score: float
    staff_matching_count: Dict[int, int]
    staff_matching_percentage: Dict[int, float]
    average_score_per_staff: Dict[int, float]
    error: Optional[str] = None
