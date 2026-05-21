"""
📌 Budget Monitor API Endpoints
📋 목적: 예산 모니터링 및 경고 조회
🔧 포함: 사용률, 경고, 카테고리 분석, 추이
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.config import get_db
from app.services.budget_monitor import BudgetMonitor
from typing import Optional

router = APIRouter(prefix="/api/admin/budget-monitor", tags=["budget-monitor"])


@router.get("/usage")
async def get_budget_usage(
    year: int = Query(2026, ge=2000, le=2100),
    month: int = Query(5, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """예산 사용률 조회"""
    try:
        usage = BudgetMonitor.calculate_usage(db, year, month)
        return usage
    except Exception as e:
        return {"error": str(e)}


@router.get("/alerts")
async def get_budget_alerts(
    year: int = Query(2026, ge=2000, le=2100),
    month: int = Query(5, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """예산 경고 조회"""
    try:
        alerts = BudgetMonitor.check_budget_alerts(db, year, month)
        return [alert.dict() for alert in alerts]
    except Exception as e:
        return {"error": str(e)}


@router.get("/category-breakdown")
async def get_category_breakdown(
    year: int = Query(2026, ge=2000, le=2100),
    month: int = Query(5, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """카테고리별 지출 분석"""
    try:
        breakdown = BudgetMonitor.get_category_breakdown(db, year, month)
        return breakdown
    except Exception as e:
        return {"error": str(e)}


@router.get("/trend")
async def get_budget_trend(
    months: int = Query(6, ge=1, le=24, description="조회할 개월 수"),
    db: Session = Depends(get_db),
):
    """월별 예산 추이"""
    try:
        trends = BudgetMonitor.get_monthly_trend(db, 2026, months)
        return {"trends": trends}
    except Exception as e:
        return {"error": str(e)}
