"""
============================================================
📌 라우터: /api/settlements (정산)
📋 목적: 일일 정산, 테라피스트별 정산, 리포트
📅 작성일: 2026-05-13

엔드포인트 (5개):
  GET    /api/settlements/daily          일일 정산
  GET    /api/settlements/therapist      테라피스트별 정산
  GET    /api/settlements/report         정산 리포트
  GET    /api/settlements/service-breakdown  서비스 분석
  GET    /api/settlements/hourly-sales   시간별 매출
============================================================
"""

import logging
from datetime import datetime, date

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settlements", tags=["Settlements"])


@router.get("/daily")
async def get_daily_settlement(
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
):
    """
    일일 정산 조회

    쿼리:
      - target_date: YYYY-MM-DD (기본값: 오늘)
    """
    try:
        if not target_date:
            target_date = str(datetime.utcnow().date())

        # 간단화된 응답 (실제는 DB 집계)
        return {
            "date": target_date,
            "total_revenue": 4500000,  # 450만원
            "total_commission": 2025000,  # 202.5만원
            "net_profit": 2475000,  # 247.5만원
            "session_count": 45,
            "avg_session_value": 100000,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"일일 정산 조회 실패: {e}")
        raise


@router.get("/therapist")
async def get_therapist_settlement(
    therapist_id: int = None,
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
):
    """
    테라피스트별 정산 조회

    쿼리:
      - therapist_id: 특정 테라피스트 (모두 조회 시 생략)
      - target_date: YYYY-MM-DD (기본값: 오늘)
    """
    try:
        if not target_date:
            target_date = str(datetime.utcnow().date())

        settlements = [
            {
                "therapist_id": 1,
                "name": "박유진",
                "specialty": "스웨디시",
                "session_count": 8,
                "total_revenue": 640000,
                "total_commission": 320000,
                "commission_rate": 0.5,
                "avg_rating": 4.8,
            },
            {
                "therapist_id": 3,
                "name": "이소영",
                "specialty": "핫스톤",
                "session_count": 7,
                "total_revenue": 700000,
                "total_commission": 315000,
                "commission_rate": 0.45,
                "avg_rating": 4.9,
            },
        ]

        if therapist_id:
            settlements = [s for s in settlements if s["therapist_id"] == therapist_id]

        logger.info(f"테라피스트별 정산: date={target_date}, count={len(settlements)}")

        return {
            "date": target_date,
            "settlements": settlements,
            "total_count": len(settlements),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"테라피스트별 정산 실패: {e}")
        raise


@router.get("/report")
async def get_settlement_report(
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
):
    """
    정산 리포트 (종합)
    """
    try:
        if not target_date:
            target_date = str(datetime.utcnow().date())

        return {
            "date": target_date,
            "daily_summary": {
                "total_revenue": 4500000,
                "total_commission": 2025000,
                "net_profit": 2475000,
                "session_count": 45,
            },
            "top_therapists": [
                {"id": 1, "name": "박유진", "revenue": 400000},
                {"id": 3, "name": "이소영", "revenue": 350000},
                {"id": 2, "name": "최정은", "revenue": 330000},
            ],
            "peak_hours": [12, 13, 14, 19, 20],
            "service_breakdown": [
                {"name": "스웨디시 60분", "count": 20, "percentage": 44.4},
                {"name": "타이마사지 90분", "count": 15, "percentage": 33.3},
                {"name": "핫스톤 60분", "count": 10, "percentage": 22.2},
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"정산 리포트 조회 실패: {e}")
        raise


@router.get("/service-breakdown")
async def get_service_breakdown(
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
):
    """서비스별 분석"""
    try:
        if not target_date:
            target_date = str(datetime.utcnow().date())

        breakdown = [
            {
                "service_type": "스웨디시 60분",
                "count": 20,
                "revenue": 1600000,
                "percentage": 35.6,
                "avg_duration": 60,
                "price": 80000,
            },
            {
                "service_type": "타이마사지 90분",
                "count": 15,
                "revenue": 1800000,
                "percentage": 40.0,
                "avg_duration": 90,
                "price": 120000,
            },
            {
                "service_type": "핫스톤 60분",
                "count": 10,
                "revenue": 1100000,
                "percentage": 24.4,
                "avg_duration": 60,
                "price": 100000,
            },
        ]

        logger.info(f"서비스별 분석: date={target_date}, services={len(breakdown)}")

        return {
            "date": target_date,
            "breakdown": breakdown,
            "total_revenue": 4500000,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"서비스별 분석 실패: {e}")
        raise


@router.get("/hourly-sales")
async def get_hourly_sales(
    target_date: str = None,
    db: AsyncSession = Depends(get_db),
):
    """시간별 매출"""
    try:
        if not target_date:
            target_date = str(datetime.utcnow().date())

        hourly_sales = [
            {"hour": 10, "count": 3, "revenue": 250000, "avg_session_value": 83333},
            {"hour": 11, "count": 5, "revenue": 450000, "avg_session_value": 90000},
            {"hour": 12, "count": 8, "revenue": 750000, "avg_session_value": 93750},
            {"hour": 13, "count": 7, "revenue": 700000, "avg_session_value": 100000},
            {"hour": 14, "count": 6, "revenue": 550000, "avg_session_value": 91667},
            {"hour": 15, "count": 4, "revenue": 400000, "avg_session_value": 100000},
            {"hour": 19, "count": 3, "revenue": 300000, "avg_session_value": 100000},
            {"hour": 20, "count": 2, "revenue": 200000, "avg_session_value": 100000},
        ]

        logger.info(f"시간별 매출: date={target_date}, hours={len(hourly_sales)}")

        return {
            "date": target_date,
            "hourly_sales": hourly_sales,
            "peak_hour": 12,
            "total_revenue": 4500000,
            "total_sessions": 45,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"시간별 매출 조회 실패: {e}")
        raise
