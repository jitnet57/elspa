"""
매칭 엔진 API 라우터

엔드포인트:
- POST /api/matching/propose - 매칭 후보 조회
- POST /api/matching/confirm - 매칭 확정
- GET /api/matching/modes - 사용 가능한 모드 목록
- POST /api/matching/simulate - 매칭 시뮬레이션 (DB 미반영)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db
from app.services.matching_engine import MatchingEngine
from app.schemas.matching import (
    MatchingRequest,
    MatchingResponse,
    MatchingCandidate,
    MatchingConfirmRequest,
    MatchingConfirmResponse,
    MatchingModeResponse,
    SimulationRequest,
    SimulationResponse,
)

router = APIRouter(prefix="/api/matching", tags=["matching"])
logger = logging.getLogger(__name__)


@router.post("/propose", response_model=MatchingResponse)
async def propose_matching(
    request: MatchingRequest,
    db: AsyncSession = Depends(get_db),
) -> MatchingResponse:
    """
    매칭 후보 조회

    Args:
        request: MatchingRequest
            - service_id: 서비스 ID
            - requested_time: 요청 시간 (HH:MM)
            - mode: 매칭 모드 (balanced | fairness | new_boost | hybrid)
            - limit: 반환할 최대 후보 수 (default: 3)

    Returns:
        MatchingResponse: 매칭 후보 목록

    Example:
        ```json
        POST /api/matching/propose
        {
            "service_id": 1,
            "requested_time": "14:00",
            "mode": "balanced",
            "limit": 3
        }
        ```
    """
    try:
        engine = MatchingEngine(db)

        booking_request = {
            "service_id": request.service_id,
            "requested_time": request.requested_time,
            "preferred_staff_id": request.preferred_staff_id,
        }

        candidates = await engine.get_candidates(
            booking_request=booking_request,
            mode=request.mode,
            limit=request.limit,
        )

        # 응답 스키마 생성
        matching_candidates = [
            MatchingCandidate(
                staff_id=c["staff_id"],
                name=c["name"],
                rating=c["rating"],
                total_sessions=c["total_sessions"],
                month_sessions=c["month_sessions"],
                score=c["score"],
                breakdown=c["breakdown"],
                availability_status=c["availability_status"],
            )
            for c in candidates
        ]

        return MatchingResponse(
            mode=request.mode,
            total_candidates=len(matching_candidates),
            candidates=matching_candidates,
        )

    except Exception as e:
        logger.error(f"propose_matching 에러: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/confirm", response_model=MatchingConfirmResponse)
async def confirm_matching(
    request: MatchingConfirmRequest,
    db: AsyncSession = Depends(get_db),
) -> MatchingConfirmResponse:
    """
    매칭 확정

    테라피스트 선택을 확정하고 Booking의 staff_id를 업데이트합니다.
    또한 테라피스트의 total_sessions, month_sessions을 증가시킵니다.

    Args:
        request: MatchingConfirmRequest
            - booking_id: 예약 ID
            - staff_id: 테라피스트 ID

    Returns:
        MatchingConfirmResponse: 확정 결과

    Example:
        ```json
        POST /api/matching/confirm
        {
            "booking_id": 42,
            "staff_id": 7
        }
        ```
    """
    try:
        engine = MatchingEngine(db)
        result = await engine.confirm_matching(
            booking_id=request.booking_id,
            staff_id=request.staff_id,
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error"))

        return MatchingConfirmResponse(
            success=result["success"],
            booking_id=result["booking_id"],
            staff_id=result["staff_id"],
            confirmed_at=result["confirmed_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"confirm_matching 에러: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modes", response_model=MatchingModeResponse)
async def get_matching_modes(
    db: AsyncSession = Depends(get_db),
) -> MatchingModeResponse:
    """
    사용 가능한 매칭 모드 목록

    Returns:
        MatchingModeResponse: ['balanced', 'fairness', 'new_boost', 'hybrid']

    Example:
        ```
        GET /api/matching/modes
        ```

        Response:
        ```json
        {
            "modes": ["balanced", "fairness", "new_boost", "hybrid"]
        }
        ```
    """
    try:
        engine = MatchingEngine(db)
        modes = await engine.get_available_modes()

        return MatchingModeResponse(modes=modes)

    except Exception as e:
        logger.error(f"get_matching_modes 에러: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate", response_model=SimulationResponse)
async def simulate_matching(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
) -> SimulationResponse:
    """
    매칭 시뮬레이션 (DB에 반영되지 않음)

    공정성 분석을 위해 대규모 시뮬레이션을 수행합니다.
    각 모드에서 얼마나 공정하게 테라피스트를 선택하는지 분석할 수 있습니다.

    Args:
        request: SimulationRequest
            - service_id: 서비스 ID
            - mode: 매칭 모드 (balanced | fairness | new_boost | hybrid)
            - num_simulations: 시뮬레이션 횟수 (100~10000, default: 1000)

    Returns:
        SimulationResponse: 시뮬레이션 결과
            - mode: 모드명
            - total_simulations: 시뮬레이션 횟수
            - total_matches: 총 매칭 수
            - average_score: 평균 매칭 점수
            - fairness_score: 공정성 점수 (0~100, 높을수록 공정함)
            - staff_matching_count: 테라피스트별 매칭 횟수
            - staff_matching_percentage: 테라피스트별 매칭 비율 (%)
            - average_score_per_staff: 테라피스트별 평균 점수

    Example:
        ```json
        POST /api/matching/simulate
        {
            "service_id": 1,
            "mode": "fairness",
            "num_simulations": 1000
        }
        ```

        Response:
        ```json
        {
            "mode": "fairness",
            "total_simulations": 1000,
            "total_matches": 1000,
            "average_score": 98.5,
            "fairness_score": 85.3,
            "staff_matching_count": {
                "1": 180,
                "2": 195,
                "3": 165,
                "4": 190,
                "5": 170
            },
            "staff_matching_percentage": {
                "1": 18.0,
                "2": 19.5,
                "3": 16.5,
                "4": 19.0,
                "5": 17.0
            },
            "average_score_per_staff": {
                "1": 98.2,
                "2": 99.1,
                "3": 97.8,
                "4": 98.9,
                "5": 98.5
            }
        }
        ```
    """
    try:
        engine = MatchingEngine(db)
        result = await engine.simulate_matching(
            service_id=request.service_id,
            mode=request.mode,
            num_simulations=request.num_simulations,
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return SimulationResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"simulate_matching 에러: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
