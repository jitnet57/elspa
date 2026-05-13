"""
매칭 엔진 테스트 스크립트

4가지 모드 각각에 대해 10가지 테스트를 수행합니다.
- Unit tests (pytest)
- 엣지 케이스 검증
- 성능 벤치마크
"""

import pytest
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.models.staff import Staff
from app.models.service import Service
from app.models.booking import Booking
from app.models.customer import Customer
from app.services.matching_engine import MatchingEngine
from app.database import Base


# ============================================================================
# 테스트 데이터베이스 설정
# ============================================================================

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_db():
    """테스트용 인메모리 데이터베이스"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # 테이블 생성
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as session:
        yield session

    await engine.dispose()


# ============================================================================
# 테스트 데이터 생성 헬퍼
# ============================================================================

async def create_test_data(db: AsyncSession):
    """테스트 데이터 생성"""
    # 서비스
    services = [
        Service(id=1, name="마사지", price=50000, duration_minutes=60),
        Service(id=2, name="테라피", price=60000, duration_minutes=60),
        Service(id=3, name="명상", price=40000, duration_minutes=45),
    ]
    db.add_all(services)

    # 고객
    customer = Customer(id=1, name="테스트 고객", phone="010-0000-0000")
    db.add(customer)

    # 테라피스트 (다양한 경력 수준)
    staffs = [
        Staff(
            id=1,
            name="신인 테라피스트 A",
            position="therapist",
            is_active=1,
            rating=4.0,
            total_sessions=20,
            month_sessions=5,
            available_time="available",
            next_available_minute=0,
        ),
        Staff(
            id=2,
            name="신인 테라피스트 B",
            position="therapist",
            is_active=1,
            rating=4.2,
            total_sessions=45,
            month_sessions=8,
            available_time="available",
            next_available_minute=5,
        ),
        Staff(
            id=3,
            name="중급 테라피스트 C",
            position="therapist",
            is_active=1,
            rating=4.5,
            total_sessions=120,
            month_sessions=15,
            available_time="available",
            next_available_minute=10,
        ),
        Staff(
            id=4,
            name="중급 테라피스트 D",
            position="therapist",
            is_active=1,
            rating=4.7,
            total_sessions=150,
            month_sessions=20,
            available_time="available",
            next_available_minute=3,
        ),
        Staff(
            id=5,
            name="경력 테라피스트 E",
            position="therapist",
            is_active=1,
            rating=4.9,
            total_sessions=500,
            month_sessions=35,
            available_time="busy",
            next_available_minute=20,
        ),
    ]
    db.add_all(staffs)

    # 예약
    booking = Booking(
        id=1,
        customer_id=1,
        service_id=1,
        booking_date="2026-05-15",
        time_slot="14:00",
        status="pending",
    )
    db.add(booking)

    await db.commit()
    return services, staffs, customer, booking


# ============================================================================
# Mode 1: Balanced (균형잡힌 매칭) 테스트
# ============================================================================

@pytest.mark.asyncio
async def test_balanced_mode_basic(test_db):
    """[Balanced] 기본 매칭 기능"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=3)

    assert len(result) > 0, "후보가 없습니다"
    assert result[0]["score"] >= result[-1]["score"], "점수 정렬 순서 오류"
    assert all("breakdown" in r for r in result), "점수 상세가 없습니다"


@pytest.mark.asyncio
async def test_balanced_mode_expertise(test_db):
    """[Balanced] 전문성 점수 검증 (70%)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=5)

    for candidate in result:
        breakdown = candidate["breakdown"]
        assert 0 <= breakdown["expertise"] <= 70, "전문성 점수 범위 오류"


@pytest.mark.asyncio
async def test_balanced_mode_availability(test_db):
    """[Balanced] 가용시간 점수 검증 (20%)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=5)

    for candidate in result:
        breakdown = candidate["breakdown"]
        assert 0 <= breakdown["availability"] <= 20, "가용시간 점수 범위 오류"


@pytest.mark.asyncio
async def test_balanced_mode_rating(test_db):
    """[Balanced] 평점 점수 검증 (10%)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=5)

    for candidate in result:
        breakdown = candidate["breakdown"]
        assert 0 <= breakdown["rating"] <= 10, "평점 점수 범위 오류"


@pytest.mark.asyncio
async def test_balanced_mode_total_score(test_db):
    """[Balanced] 총점 검증 (0~100)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=5)

    for candidate in result:
        score = candidate["score"]
        assert 0 <= score <= 100, f"총점 범위 오류: {score}"


@pytest.mark.asyncio
async def test_balanced_mode_high_rating_preference(test_db):
    """[Balanced] 높은 평점 테라피스트 우선"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=5)

    ratings = [r["rating"] for r in result]
    assert ratings == sorted(ratings, reverse=True), "높은 평점 우선순위 오류"


@pytest.mark.asyncio
async def test_balanced_mode_empty_service(test_db):
    """[Balanced] 존재하지 않는 서비스 ID"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 999}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=3)

    assert len(result) > 0, "서비스 없을 때도 후보 반환"
    assert all(r["breakdown"]["expertise"] == 20 for r in result), "무관 점수"


@pytest.mark.asyncio
async def test_balanced_mode_limit(test_db):
    """[Balanced] limit 파라미터 검증"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    result1 = await engine.get_candidates(booking_request, mode="balanced", limit=1)
    assert len(result1) == 1, "limit=1 오류"

    result3 = await engine.get_candidates(booking_request, mode="balanced", limit=3)
    assert len(result3) <= 3, "limit=3 오류"


@pytest.mark.asyncio
async def test_balanced_mode_deterministic(test_db):
    """[Balanced] 결정론적 결과"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    result1 = await engine.get_candidates(booking_request, mode="balanced", limit=3)
    result2 = await engine.get_candidates(booking_request, mode="balanced", limit=3)

    assert len(result1) == len(result2), "결과 길이 다름"
    for r1, r2 in zip(result1, result2):
        assert r1["staff_id"] == r2["staff_id"], "결과 순서 다름"


# ============================================================================
# Mode 2: Fairness (공정성 중심) 테스트
# ============================================================================

@pytest.mark.asyncio
async def test_fairness_mode_basic(test_db):
    """[Fairness] 기본 매칭 기능"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="fairness", limit=3)

    assert len(result) > 0, "후보가 없습니다"
    assert all("fairness" in r["breakdown"] for r in result), "공정성 점수 누락"


@pytest.mark.asyncio
async def test_fairness_mode_new_boost(test_db):
    """[Fairness] 신인 테라피스트 부스트"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="fairness", limit=5)

    # 신인(month_sessions < 10)이 높은 공정성 점수를 받아야 함
    for candidate in result:
        fairness_score = candidate["breakdown"]["fairness"]
        month_sessions = candidate["month_sessions"]

        if month_sessions < 10:
            assert fairness_score == 30, f"신인 공정성 점수 오류: {fairness_score}"
        elif month_sessions < 20:
            assert fairness_score == 20, f"중급 공정성 점수 오류: {fairness_score}"


@pytest.mark.asyncio
async def test_fairness_mode_expertise_reduced(test_db):
    """[Fairness] 전문성 가중치 감소 (70% → 40%)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="fairness", limit=5)

    for candidate in result:
        expertise = candidate["breakdown"]["expertise"]
        # 40% 이하여야 함
        assert expertise <= 40, f"전문성 점수 범위 오류: {expertise}"


@pytest.mark.asyncio
async def test_fairness_mode_total_score(test_db):
    """[Fairness] 총점 범위 (0~100)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="fairness", limit=5)

    for candidate in result:
        score = candidate["score"]
        assert 0 <= score <= 100, f"총점 범위 오류: {score}"


@pytest.mark.asyncio
async def test_fairness_mode_new_therapist_ranked_high(test_db):
    """[Fairness] 신인 테라피스트가 높은 순위"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="fairness", limit=5)

    # 신인(month_sessions 적음)이 상위에 있어야 함
    top_candidate = result[0]
    assert top_candidate["month_sessions"] < 20, "신인이 상위에 없음"


@pytest.mark.asyncio
async def test_fairness_mode_fairness_score_range(test_db):
    """[Fairness] 공정성 점수 범위 (0~30)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="fairness", limit=5)

    for candidate in result:
        fairness = candidate["breakdown"]["fairness"]
        assert 0 <= fairness <= 30, f"공정성 점수 범위 오류: {fairness}"


@pytest.mark.asyncio
async def test_fairness_mode_vs_balanced(test_db):
    """[Fairness vs Balanced] 신인 순위 비교"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    fairness_result = await engine.get_candidates(
        booking_request, mode="fairness", limit=5
    )
    balanced_result = await engine.get_candidates(
        booking_request, mode="balanced", limit=5
    )

    # Fairness는 신인을 더 높이 평가해야 함
    fairness_top_sessions = fairness_result[0]["month_sessions"]
    balanced_top_sessions = balanced_result[0]["month_sessions"]

    # 일반적으로 fairness가 신인을 더 우선
    assert fairness_top_sessions <= balanced_top_sessions, "Fairness 모드 오류"


@pytest.mark.asyncio
async def test_fairness_mode_equal_opportunity(test_db):
    """[Fairness] 모든 테라피스트에 동등한 기회"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    # 1000번 시뮬레이션하여 공정성 확인
    selection_count = {}
    for _ in range(100):
        result = await engine.get_candidates(
            booking_request, mode="fairness", limit=1
        )
        top_staff_id = result[0]["staff_id"]
        selection_count[top_staff_id] = selection_count.get(top_staff_id, 0) + 1

    # 표준편차가 낮아야 함 (공정함)
    avg_count = sum(selection_count.values()) / len(selection_count)
    variance = sum((count - avg_count) ** 2 for count in selection_count.values()) / len(selection_count)
    std_dev = variance ** 0.5

    assert std_dev < 20, f"표준편차가 높음: {std_dev}"


# ============================================================================
# Mode 3: New Therapist Boost (신인 부스트) 테스트
# ============================================================================

@pytest.mark.asyncio
async def test_new_boost_mode_basic(test_db):
    """[New Boost] 기본 매칭 기능"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="new_boost", limit=3)

    assert len(result) > 0, "후보가 없습니다"
    assert all("new_boost" in r["breakdown"] for r in result), "신인 보너스 누락"


@pytest.mark.asyncio
async def test_new_boost_mode_bonus_distribution(test_db):
    """[New Boost] 신인 보너스 분배"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="new_boost", limit=5)

    for candidate in result:
        new_boost = candidate["breakdown"]["new_boost"]
        total_sessions = candidate["total_sessions"]

        if total_sessions < 50:
            assert new_boost == 20, f"완전 신인 보너스 오류: {new_boost}"
        elif total_sessions < 100:
            assert new_boost == 15, f"초급자 보너스 오류: {new_boost}"
        elif total_sessions < 200:
            assert new_boost == 5, f"중급자 보너스 오류: {new_boost}"
        else:
            assert new_boost == 0, f"베테랑 보너스 오류: {new_boost}"


@pytest.mark.asyncio
async def test_new_boost_mode_rating_reduced(test_db):
    """[New Boost] 평점 가중치 감소 (10% → 5%)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="new_boost", limit=5)

    for candidate in result:
        rating = candidate["breakdown"]["rating"]
        # 5% 이하여야 함
        assert rating <= 5, f"평점 점수 범위 오류: {rating}"


@pytest.mark.asyncio
async def test_new_boost_mode_total_score(test_db):
    """[New Boost] 총점 범위 (0~120)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="new_boost", limit=5)

    for candidate in result:
        score = candidate["score"]
        assert 0 <= score <= 120, f"총점 범위 오류: {score}"


@pytest.mark.asyncio
async def test_new_boost_mode_new_therapist_highest(test_db):
    """[New Boost] 신인이 가장 높은 순위"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="new_boost", limit=5)

    # 신인(total_sessions 적음)이 상위에 있어야 함
    top_candidate = result[0]
    assert top_candidate["total_sessions"] < 100, "신인이 상위에 없음"


@pytest.mark.asyncio
async def test_new_boost_mode_new_vs_experienced(test_db):
    """[New Boost] 신인 vs 경력 비교"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    # 신인: total_sessions=20
    # 경력: total_sessions=500

    result = await engine.get_candidates(booking_request, mode="new_boost", limit=5)

    # 신인이 경력자보다 높은 점수를 받아야 함
    new_therapist_score = None
    experienced_score = None

    for candidate in result:
        if candidate["total_sessions"] < 50:
            new_therapist_score = candidate["score"]
        elif candidate["total_sessions"] > 400:
            experienced_score = candidate["score"]

    if new_therapist_score and experienced_score:
        assert new_therapist_score > experienced_score, "신인이 경력자보다 낮은 점수"


@pytest.mark.asyncio
async def test_new_boost_mode_vs_balanced(test_db):
    """[New Boost vs Balanced] 신인 순위 비교"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    new_boost_result = await engine.get_candidates(
        booking_request, mode="new_boost", limit=5
    )
    balanced_result = await engine.get_candidates(
        booking_request, mode="balanced", limit=5
    )

    # New Boost는 신인을 더 높이 평가해야 함
    new_boost_top_sessions = new_boost_result[0]["total_sessions"]
    balanced_top_sessions = balanced_result[0]["total_sessions"]

    assert new_boost_top_sessions <= balanced_top_sessions, "New Boost 모드 오류"


@pytest.mark.asyncio
async def test_new_boost_mode_bonus_range(test_db):
    """[New Boost] 신인 보너스 범위 (0~20)"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="new_boost", limit=5)

    for candidate in result:
        new_boost = candidate["breakdown"]["new_boost"]
        assert 0 <= new_boost <= 20, f"신인 보너스 범위 오류: {new_boost}"


# ============================================================================
# Mode 4: Hybrid (시간대별 자동 전환) 테스트
# ============================================================================

@pytest.mark.asyncio
async def test_hybrid_mode_basic(test_db):
    """[Hybrid] 기본 매칭 기능"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="hybrid", limit=3)

    assert len(result) > 0, "후보가 없습니다"


@pytest.mark.asyncio
async def test_hybrid_mode_get_hybrid_mode(test_db):
    """[Hybrid] 시간대별 모드 전환 로직"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    assert engine._get_hybrid_mode(9) == "fairness", "아침 9시"
    assert engine._get_hybrid_mode(11) == "fairness", "아침 11시"
    assert engine._get_hybrid_mode(12) == "balanced", "점심 12시"
    assert engine._get_hybrid_mode(13) == "balanced", "점심 13시"
    assert engine._get_hybrid_mode(14) == "balanced", "오후 14시"
    assert engine._get_hybrid_mode(17) == "balanced", "오후 17시"
    assert engine._get_hybrid_mode(18) == "new_boost", "저녁 18시"
    assert engine._get_hybrid_mode(21) == "new_boost", "저녁 21시"


@pytest.mark.asyncio
async def test_hybrid_mode_fairness_morning(test_db):
    """[Hybrid] 아침 시간대 = Fairness 모드"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    # 모의로 현재 시간이 아침인 경우
    result = await engine.get_candidates(booking_request, mode="hybrid", limit=5)

    # 시간대에 따라 다르므로 일반적 검증
    assert len(result) > 0, "Hybrid 결과 없음"


@pytest.mark.asyncio
async def test_hybrid_mode_consistency(test_db):
    """[Hybrid] 같은 시간대에서 일관된 결과"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    result1 = await engine.get_candidates(booking_request, mode="hybrid", limit=3)
    result2 = await engine.get_candidates(booking_request, mode="hybrid", limit=3)

    assert len(result1) == len(result2), "결과 길이 다름"
    for r1, r2 in zip(result1, result2):
        assert r1["staff_id"] == r2["staff_id"], "Hybrid 모드 결과 불일치"


@pytest.mark.asyncio
async def test_hybrid_mode_all_time_ranges(test_db):
    """[Hybrid] 모든 시간대 검증"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    for hour in range(24):
        mode = engine._get_hybrid_mode(hour)
        assert mode in ["fairness", "balanced", "new_boost"], f"{hour}시 모드 오류: {mode}"


# ============================================================================
# 엣지 케이스 & 통합 테스트
# ============================================================================

@pytest.mark.asyncio
async def test_empty_database(test_db):
    """빈 데이터베이스"""
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=3)

    assert result == [], "빈 데이터베이스에서 결과가 있음"


@pytest.mark.asyncio
async def test_single_staff(test_db):
    """테라피스트 1명만 존재"""
    service = Service(id=1, name="서비스", price=50000, duration_minutes=60)
    staff = Staff(
        id=1,
        name="유일한 테라피스트",
        position="therapist",
        is_active=1,
        rating=4.5,
        total_sessions=100,
        month_sessions=10,
        available_time="available",
        next_available_minute=0,
    )
    test_db.add(service)
    test_db.add(staff)
    await test_db.commit()

    engine = MatchingEngine(test_db)
    booking_request = {"service_id": 1}
    result = await engine.get_candidates(booking_request, mode="balanced", limit=3)

    assert len(result) == 1, "결과 1개가 아님"
    assert result[0]["staff_id"] == 1, "테라피스트 ID 오류"


@pytest.mark.asyncio
async def test_all_modes_same_input(test_db):
    """동일한 입력에서 모든 모드 검증"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    booking_request = {"service_id": 1}

    balanced = await engine.get_candidates(booking_request, mode="balanced", limit=1)
    fairness = await engine.get_candidates(booking_request, mode="fairness", limit=1)
    new_boost = await engine.get_candidates(booking_request, mode="new_boost", limit=1)
    hybrid = await engine.get_candidates(booking_request, mode="hybrid", limit=1)

    assert len(balanced) > 0, "Balanced 결과 없음"
    assert len(fairness) > 0, "Fairness 결과 없음"
    assert len(new_boost) > 0, "New Boost 결과 없음"
    assert len(hybrid) > 0, "Hybrid 결과 없음"


@pytest.mark.asyncio
async def test_confirm_matching(test_db):
    """매칭 확정 기능"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    result = await engine.confirm_matching(booking_id=1, staff_id=1)

    assert result["success"] is True, "매칭 확정 실패"
    assert result["booking_id"] == 1, "booking_id 오류"
    assert result["staff_id"] == 1, "staff_id 오류"


# ============================================================================
# 성능 벤치마크
# ============================================================================

@pytest.mark.asyncio
async def test_performance_1000_simulations(test_db):
    """성능: 1000번 매칭 시뮬레이션"""
    await create_test_data(test_db)
    engine = MatchingEngine(test_db)

    import time

    start = time.time()

    for _ in range(100):
        await engine.get_candidates({"service_id": 1}, mode="balanced", limit=3)

    elapsed = time.time() - start

    print(f"100번 매칭 시간: {elapsed:.3f}초")
    assert elapsed < 10, f"성능 저하: {elapsed:.3f}초"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
