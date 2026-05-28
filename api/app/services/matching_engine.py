"""
매칭 엔진: AI 기반 테라피스트 자동 매칭 시스템

4가지 모드 구현:
1. Balanced (균형잡힌 매칭) - 기본 모드
2. Fairness (공정성 중심) - 신인 부스트
3. New Therapist Boost (신인 육성) - 신입 부스트
4. Hybrid (시간대별 자동 전환)

각 모드는 다른 가중치 조합으로 총점을 계산합니다.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
import logging

from app.models.staff import Staff
from app.models.booking import Booking
from app.models.service import Service


logger = logging.getLogger(__name__)


class MatchingEngine:
    """AI 기반 테라피스트 자동 매칭 엔진"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_candidates(
        self,
        booking_request: Dict,
        mode: str = "balanced",
        limit: int = 3,
    ) -> List[Dict]:
        """
        예약 요청에 맞는 테라피스트 후보 추천

        Args:
            booking_request: {
                'service_id': int,
                'requested_time': str (HH:MM),
                'preferred_staff_id': Optional[int]
            }
            mode: 'balanced' | 'fairness' | 'new_boost' | 'hybrid'
            limit: 반환할 최대 후보 수

        Returns:
            [{
                'staff_id': int,
                'name': str,
                'rating': float,
                'score': float,
                'breakdown': {
                    'expertise': float,
                    'availability': float,
                    'rating': float,
                    'fairness': Optional[float],
                    'new_boost': Optional[float]
                },
                'availability_status': str
            }, ...]
        """
        try:
            # 1. 활성화된 모든 테라피스트 조회
            result = await self.db.execute(
                select(Staff).where(Staff.is_active == 1)
            )
            candidates = result.scalars().all()

            if not candidates:
                logger.warning("활성화된 테라피스트가 없습니다")
                return []

            # 2. 모드 확인 (Hybrid 모드인 경우 현재 시간에 따라 모드 결정)
            actual_mode = mode
            if mode == "hybrid":
                actual_mode = self._get_hybrid_mode(datetime.now().hour)
                logger.info(f"Hybrid 모드: 현재 시간({datetime.now().hour}시) → {actual_mode} 모드로 전환")

            # 3. 각 후보에 대해 점수 계산
            scored_candidates = []
            for staff in candidates:
                score_result = await self.calculate_score(
                    staff, booking_request, actual_mode
                )

                scored_candidates.append({
                    "staff_id": staff.id,
                    "name": staff.name,
                    "rating": float(staff.rating),
                    "total_sessions": staff.total_sessions,
                    "month_sessions": staff.month_sessions,
                    "score": score_result["total"],
                    "breakdown": score_result["breakdown"],
                    "availability_status": staff.available_time,
                })

            # 4. 점수 기준 정렬 (높을수록 앞)
            scored_candidates.sort(key=lambda x: x["score"], reverse=True)

            # 5. 상위 limit개 반환
            result = scored_candidates[:limit]
            logger.info(
                f"매칭 결과: {len(result)}명의 테라피스트 추천 (모드: {actual_mode})"
            )

            return result

        except Exception as e:
            logger.error(f"get_candidates 에러: {e}", exc_info=True)
            raise

    async def calculate_score(
        self, staff: Staff, booking_request: Dict, mode: str
    ) -> Dict:
        """
        모드별로 테라피스트 점수 계산

        Args:
            staff: Staff 모델 인스턴스
            booking_request: 예약 요청 정보
            mode: 계산 모드

        Returns:
            {
                'total': float,
                'breakdown': {
                    'expertise': float,
                    'availability': float,
                    'rating': float,
                    'fairness': Optional[float],
                    'new_boost': Optional[float]
                }
            }
        """
        if mode == "balanced":
            return await self._score_balanced(staff, booking_request)
        elif mode == "fairness":
            return await self._score_fairness(staff, booking_request)
        elif mode == "new_boost":
            return await self._score_new_boost(staff, booking_request)
        else:
            # 기본값: balanced
            return await self._score_balanced(staff, booking_request)

    async def _score_balanced(self, staff: Staff, booking_request: Dict) -> Dict:
        """
        Mode 1: Balanced (균형잡힌 매칭)
        총점 = (전문성 70%) + (가용시간 20%) + (평점 10%)

        Returns:
            {
                'total': float (0~100),
                'breakdown': {
                    'expertise': float (0~70),
                    'availability': float (0~20),
                    'rating': float (0~10)
                }
            }
        """
        expertise = await self._expertise_match(staff, booking_request)  # 0~70
        availability = await self._availability_score(staff, booking_request)  # 0~20
        rating = self._rating_score(staff)  # 0~10

        return {
            "total": expertise + availability + rating,
            "breakdown": {
                "expertise": expertise,
                "availability": availability,
                "rating": rating,
                "fairness": None,
                "new_boost": None,
            },
        }

    async def _score_fairness(self, staff: Staff, booking_request: Dict) -> Dict:
        """
        Mode 2: Fairness (공정성 중심)
        목표: 모든 테라피스트에게 동등한 기회 제공

        총점 = (전문성 40%) + (가용시간 20%) + (평점 10%) + (공정성 30%)

        공정성 점수 (0~30):
        - 이달 세션수 < 10: 30점 (신인 부스트)
        - 이달 세션수 10~20: 20점
        - 이달 세션수 20~30: 10점
        - 이달 세션수 > 30: 0점

        Returns:
            {
                'total': float (0~100),
                'breakdown': {
                    'expertise': float (0~40),
                    'availability': float (0~20),
                    'rating': float (0~10),
                    'fairness': float (0~30)
                }
            }
        """
        expertise = await self._expertise_match(staff, booking_request)
        expertise = expertise * 0.4 / 0.7  # 40%로 재조정

        availability = await self._availability_score(staff, booking_request)
        # availability는 이미 0~20

        rating = self._rating_score(staff)
        # rating은 이미 0~10

        fairness = self._fairness_score(staff)  # 0~30

        total = expertise + availability + rating + fairness

        return {
            "total": total,
            "breakdown": {
                "expertise": expertise,
                "availability": availability,
                "rating": rating,
                "fairness": fairness,
                "new_boost": None,
            },
        }

    async def _score_new_boost(self, staff: Staff, booking_request: Dict) -> Dict:
        """
        Mode 3: New Therapist Boost (신인 부스트)
        목표: 신입 테라피스트(< 100 세션)에게 더 많은 기회

        총점 = (전문성 70%) + (가용시간 20%) + (평점 5%) + (신인 보너스 20%)

        신인 보너스 (0~20):
        - 총 경력 < 50 세션: +20점
        - 50~100 세션: +15점
        - 100~200 세션: +5점
        - > 200 세션: +0점

        Returns:
            {
                'total': float (0~120),
                'breakdown': {
                    'expertise': float (0~70),
                    'availability': float (0~20),
                    'rating': float (0~5),
                    'new_boost': float (0~20)
                }
            }
        """
        expertise = await self._expertise_match(staff, booking_request)  # 0~70
        availability = await self._availability_score(staff, booking_request)  # 0~20

        rating = self._rating_score(staff)
        rating = rating * 0.5  # 5%로 축소

        new_boost = self._new_therapist_bonus(staff)  # 0~20

        total = expertise + availability + rating + new_boost

        return {
            "total": total,
            "breakdown": {
                "expertise": expertise,
                "availability": availability,
                "rating": rating,
                "fairness": None,
                "new_boost": new_boost,
            },
        }

    def _get_hybrid_mode(self, hour: int) -> str:
        """
        Mode 4: Hybrid (시간대별 자동 전환)

        아침 (09:00~12:00):   Fairness 모드 → 신인 부스트, 모두에게 기회 제공
        점심 (12:00~14:00):   Balanced 모드 → 수요 많으니 가장 좋은 매칭
        오후 (14:00~18:00):   Balanced 모드 → 가장 좋은 매칭 우선
        저녁 (18:00~22:00):   New Therapist Boost → 수요 적으니 신인 육성

        Args:
            hour: 시간 (0~23)

        Returns:
            'fairness' | 'balanced' | 'new_boost'
        """
        if 9 <= hour < 12:
            return "fairness"
        elif 12 <= hour < 14:
            return "balanced"
        elif 14 <= hour < 18:
            return "balanced"
        elif 18 <= hour < 22:
            return "new_boost"
        else:
            # 기타 시간: 야간(22~09)는 fairness
            return "fairness"

    async def _expertise_match(self, staff: Staff, booking_request: Dict) -> float:
        """
        전문성 점수 계산 (0~70)

        정확히 일치: 70점
        관련 분야: 40점
        무관: 20점

        Args:
            staff: Staff 모델
            booking_request: {'service_id': int}

        Returns:
            float: 0~70 점수
        """
        service_id = booking_request.get("service_id")
        if not service_id:
            return 20  # 서비스 정보 없으면 최소값

        # Staff의 specialties 중에 service_id가 있는지 확인
        has_exact_match = any(s.id == service_id for s in staff.specialties)

        if has_exact_match:
            logger.debug(f"Staff {staff.id}: 정확히 일치 (70점)")
            return 70.0
        elif staff.specialties:
            # 관련 분야로 간주
            logger.debug(f"Staff {staff.id}: 관련 분야 (40점)")
            return 40.0
        else:
            # 무관
            logger.debug(f"Staff {staff.id}: 무관 (20점)")
            return 20.0

    async def _availability_score(
        self, staff: Staff, booking_request: Dict
    ) -> float:
        """
        가용시간 점수 계산 (0~20)

        즉시 가용: 20점
        5분 이내: 18점
        15분 이내: 10점
        30분 이상: 5점

        Args:
            staff: Staff 모델
            booking_request: {'requested_time': str (HH:MM)}

        Returns:
            float: 0~20 점수
        """
        next_available_minute = staff.next_available_minute

        if next_available_minute == 0:
            logger.debug(f"Staff {staff.id}: 즉시 가용 (20점)")
            return 20.0
        elif next_available_minute <= 5:
            logger.debug(f"Staff {staff.id}: 5분 이내 (18점)")
            return 18.0
        elif next_available_minute <= 15:
            logger.debug(f"Staff {staff.id}: 15분 이내 (10점)")
            return 10.0
        else:
            logger.debug(f"Staff {staff.id}: 30분 이상 (5점)")
            return 5.0

    def _rating_score(self, staff: Staff) -> float:
        """
        평점 점수 계산 (0~10)

        4.8~5.0: 10점
        4.5~4.7: 8점
        4.2~4.4: 6점
        4.0~4.1: 4점

        Args:
            staff: Staff 모델 (rating: 0.0~5.0)

        Returns:
            float: 0~10 점수
        """
        rating = staff.rating

        if rating >= 4.8:
            logger.debug(f"Staff {staff.id}: 평점 {rating} (10점)")
            return 10.0
        elif rating >= 4.5:
            logger.debug(f"Staff {staff.id}: 평점 {rating} (8점)")
            return 8.0
        elif rating >= 4.2:
            logger.debug(f"Staff {staff.id}: 평점 {rating} (6점)")
            return 6.0
        elif rating >= 4.0:
            logger.debug(f"Staff {staff.id}: 평점 {rating} (4점)")
            return 4.0
        else:
            logger.debug(f"Staff {staff.id}: 평점 {rating} (0점)")
            return 0.0

    def _fairness_score(self, staff: Staff) -> float:
        """
        공정성 점수 계산 (0~30) - Fairness 모드 전용

        이달 세션수 < 10: 30점
        이달 세션수 10~20: 20점
        이달 세션수 20~30: 10점
        이달 세션수 > 30: 0점

        Args:
            staff: Staff 모델 (month_sessions)

        Returns:
            float: 0~30 점수
        """
        month_sessions = staff.month_sessions

        if month_sessions < 10:
            logger.debug(f"Staff {staff.id}: 신인 부스트 ({month_sessions} 세션) (30점)")
            return 30.0
        elif month_sessions < 20:
            logger.debug(
                f"Staff {staff.id}: 중급 ({month_sessions} 세션) (20점)"
            )
            return 20.0
        elif month_sessions < 30:
            logger.debug(
                f"Staff {staff.id}: 경력 ({month_sessions} 세션) (10점)"
            )
            return 10.0
        else:
            logger.debug(
                f"Staff {staff.id}: 베테랑 ({month_sessions} 세션) (0점)"
            )
            return 0.0

    def _new_therapist_bonus(self, staff: Staff) -> float:
        """
        신인 보너스 계산 (0~20) - New Therapist Boost 모드 전용

        총 경력 < 50 세션: +20점
        50~100 세션: +15점
        100~200 세션: +5점
        > 200 세션: +0점

        Args:
            staff: Staff 모델 (total_sessions)

        Returns:
            float: 0~20 점수
        """
        total_sessions = staff.total_sessions

        if total_sessions < 50:
            logger.debug(f"Staff {staff.id}: 완전 신인 ({total_sessions} 세션) (+20점)")
            return 20.0
        elif total_sessions < 100:
            logger.debug(
                f"Staff {staff.id}: 초급자 ({total_sessions} 세션) (+15점)"
            )
            return 15.0
        elif total_sessions < 200:
            logger.debug(
                f"Staff {staff.id}: 중급자 ({total_sessions} 세션) (+5점)"
            )
            return 5.0
        else:
            logger.debug(f"Staff {staff.id}: 베테랑 ({total_sessions} 세션) (+0점)")
            return 0.0

    async def confirm_matching(
        self, booking_id: int, staff_id: int
    ) -> Dict:
        """
        매칭 확정: booking에 staff_id 할당 및 통계 업데이트

        Args:
            booking_id: 예약 ID
            staff_id: 테라피스트 ID

        Returns:
            {
                'success': bool,
                'booking_id': int,
                'staff_id': int,
                'confirmed_at': str
            }
        """
        try:
            # 1. Booking 업데이트
            result = await self.db.execute(
                select(Booking).where(Booking.id == booking_id)
            )
            booking = result.scalar_one_or_none()
            if not booking:
                logger.error(f"Booking {booking_id}를 찾을 수 없습니다")
                return {"success": False, "error": "Booking not found"}

            booking.staff_id = staff_id
            booking.status = "confirmed"
            await self.db.commit()

            # 2. Staff 통계 업데이트
            result = await self.db.execute(
                select(Staff).where(Staff.id == staff_id)
            )
            staff = result.scalar_one_or_none()
            if staff:
                staff.total_sessions += 1
                staff.month_sessions += 1
                await self.db.commit()

            logger.info(
                f"매칭 확정: Booking {booking_id} → Staff {staff_id}"
            )

            return {
                "success": True,
                "booking_id": booking_id,
                "staff_id": staff_id,
                "confirmed_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"confirm_matching 에러: {e}", exc_info=True)
            await self.db.rollback()
            return {"success": False, "error": str(e)}

    async def get_available_modes(self) -> List[str]:
        """
        사용 가능한 모드 목록 반환

        Returns:
            ['balanced', 'fairness', 'new_boost', 'hybrid']
        """
        return ["balanced", "fairness", "new_boost", "hybrid"]

    async def simulate_matching(
        self,
        service_id: int,
        mode: str,
        num_simulations: int = 1000,
    ) -> Dict:
        """
        매칭 시뮬레이션 (실제 DB에 반영하지 않음)
        공정성 분석을 위해 대규모 시뮬레이션 수행

        Args:
            service_id: 서비스 ID
            mode: 'balanced' | 'fairness' | 'new_boost' | 'hybrid'
            num_simulations: 시뮬레이션 횟수

        Returns:
            {
                'mode': str,
                'total_simulations': int,
                'staff_matching_count': {staff_id: count, ...},
                'fairness_score': float,
                'average_score': float,
                'score_distribution': {
                    'new_therapist': int,
                    'intermediate': int,
                    'experienced': int
                }
            }
        """
        try:
            # 1. 모든 활성 테라피스트 조회
            result = await self.db.execute(
                select(Staff).where(Staff.is_active == 1)
            )
            staffs = result.scalars().all()

            if not staffs:
                return {"error": "No active staff"}

            # 2. 시뮬레이션 수행
            booking_request = {"service_id": service_id}
            matching_count = {staff.id: 0 for staff in staffs}
            scores_per_staff = {staff.id: [] for staff in staffs}

            for _ in range(num_simulations):
                candidates = await self.get_candidates(
                    booking_request, mode=mode, limit=1
                )
                if candidates:
                    top_match = candidates[0]
                    matching_count[top_match["staff_id"]] += 1
                    scores_per_staff[top_match["staff_id"]].append(
                        top_match["score"]
                    )

            # 3. 통계 계산
            total_matches = sum(matching_count.values())
            avg_score = sum(
                sum(scores) / len(scores) if scores else 0
                for scores in scores_per_staff.values()
            ) / len(staffs) if staffs else 0

            # 공정성 점수: 표준편차가 낮을수록 공정함
            match_percentages = [
                (count / total_matches * 100) if total_matches > 0 else 0
                for count in matching_count.values()
            ]
            fairness = 100.0 - (
                sum(abs(p - (100 / len(staffs))) for p in match_percentages)
                / len(staffs)
            )

            return {
                "mode": mode,
                "total_simulations": num_simulations,
                "total_matches": total_matches,
                "average_score": round(avg_score, 2),
                "fairness_score": round(max(0, fairness), 2),  # 0~100
                "staff_matching_count": matching_count,
                "staff_matching_percentage": {
                    staff_id: round((count / total_matches * 100), 2) if total_matches > 0 else 0
                    for staff_id, count in matching_count.items()
                },
                "average_score_per_staff": {
                    staff_id: round(
                        sum(scores) / len(scores), 2
                    ) if scores else 0
                    for staff_id, scores in scores_per_staff.items()
                },
            }

        except Exception as e:
            logger.error(f"simulate_matching 에러: {e}", exc_info=True)
            return {"error": str(e)}
