"""
급여 정산 통계 & 분석 API
경로: app/routers/payroll_analytics.py
작성일: 2026-05-22
엔드포인트: /api/payroll/analytics/*

기능:
  - 월별 추이 (Line Chart)
  - 직원별 분포 (Bar Chart)
  - 차감 분석 (Pie Chart)
  - 대시보드 요약 (KPI Cards)
"""

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Optional, Any
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.payroll import (
    PayrollRecord, PayrollPeriod, Employee, CashAdvance
)
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/payroll/analytics", tags=["payroll_analytics"])


# ============================================================
# A. 월별 추이 (Line Chart)
# ============================================================
@router.get("/monthly-trend", dependencies=[Depends(require_admin)])
async def get_monthly_trend(
    year: int = Query(2026),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    월별 급여 추이 조회
    - 총 급여액 (gross_pay)
    - 평균 순지급 (net_pay)
    - 총 차감액 (total_deductions)

    응답 형식:
    {
      "months": ["1월", "2월", ...],
      "total_payroll": [100000, 120000, ...],
      "average_pay": [50000, 52000, ...],
      "deductions": [20000, 18000, ...]
    }
    """
    try:
        # 해당 연도의 모든 정산 기록 조회
        stmt = select(PayrollRecord).where(
            func.extract('year', PayrollPeriod.period_start) == year
        ).join(
            PayrollPeriod,
            PayrollRecord.payroll_period_id == PayrollPeriod.id
        ).where(
            PayrollRecord.is_obsolete == False
        )

        result = await db.execute(stmt)
        records = result.scalars().all()

        # 월별로 데이터 집계
        monthly_data: Dict[int, Dict[str, Any]] = {}

        for record in records:
            month = record.created_at.month
            if month not in monthly_data:
                monthly_data[month] = {
                    "total_payroll": Decimal(0),
                    "net_pay_sum": Decimal(0),
                    "deductions_sum": Decimal(0),
                    "count": 0
                }

            monthly_data[month]["total_payroll"] += record.gross_pay or Decimal(0)
            monthly_data[month]["net_pay_sum"] += record.net_pay or Decimal(0)
            monthly_data[month]["deductions_sum"] += record.total_deductions or Decimal(0)
            monthly_data[month]["count"] += 1

        # 12개월 데이터 생성 (없는 월은 0)
        months = ["1월", "2월", "3월", "4월", "5월", "6월",
                  "7월", "8월", "9월", "10월", "11월", "12월"]
        total_payroll = []
        average_pay = []
        deductions = []

        for month_num in range(1, 13):
            if month_num in monthly_data:
                data = monthly_data[month_num]
                total_payroll.append(float(data["total_payroll"]))
                avg_net = data["net_pay_sum"] / data["count"] if data["count"] > 0 else Decimal(0)
                average_pay.append(float(avg_net))
                deductions.append(float(data["deductions_sum"]))
            else:
                total_payroll.append(0)
                average_pay.append(0)
                deductions.append(0)

        return {
            "months": months,
            "total_payroll": total_payroll,
            "average_pay": average_pay,
            "deductions": deductions
        }

    except Exception as e:
        logger.error(f"Error in get_monthly_trend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# B. 직원별 분포 (Bar Chart)
# ============================================================
@router.get("/employee-distribution", dependencies=[Depends(require_admin)])
async def get_employee_distribution(
    period_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    특정 정산 기간의 직원별 급여 분포

    응답 형식:
    {
      "employees": ["김철수", "이영희", ...],
      "net_pay": [45000, 50000, ...],
      "gross_pay": [55000, 60000, ...]
    }
    """
    try:
        # 해당 정산 기간의 모든 기록 조회
        stmt = select(PayrollRecord, Employee).join(
            Employee,
            PayrollRecord.employee_id == Employee.id
        ).where(
            and_(
                PayrollRecord.payroll_period_id == period_id,
                PayrollRecord.is_obsolete == False
            )
        ).order_by(
            PayrollRecord.net_pay.desc()
        )

        result = await db.execute(stmt)
        rows = result.all()

        employees = []
        net_pay = []
        gross_pay = []

        for record, employee in rows:
            employees.append(employee.name)
            net_pay.append(float(record.net_pay or Decimal(0)))
            gross_pay.append(float(record.gross_pay or Decimal(0)))

        return {
            "employees": employees,
            "net_pay": net_pay,
            "gross_pay": gross_pay
        }

    except Exception as e:
        logger.error(f"Error in get_employee_distribution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# C. 차감 분석 (Pie Chart)
# ============================================================
@router.get("/deduction-breakdown", dependencies=[Depends(require_admin)])
async def get_deduction_breakdown(
    period_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    정산 기간의 차감 항목별 분석

    차감 항목:
      - CA (Cash Advance)
      - 지각 (Late Deduction)
      - 13개월 (13th Month Deduction)
      - 보건소 (Health Check)
      - SSS (Social Security)

    응답 형식:
    {
      "labels": ["CA", "지각", "13개월", "보건소", "SSS"],
      "values": [15000, 5000, 20000, 500, 0],
      "percentages": ["40%", "13%", "50%", "1.3%", "0%"]
    }
    """
    try:
        # 해당 정산 기간의 모든 기록 조회
        stmt = select(PayrollRecord).where(
            and_(
                PayrollRecord.payroll_period_id == period_id,
                PayrollRecord.is_obsolete == False
            )
        )

        result = await db.execute(stmt)
        records = result.scalars().all()

        # 차감 항목별 합계 계산
        ca_total = sum(r.ca_deduction or Decimal(0) for r in records)
        late_total = sum(r.late_deduction or Decimal(0) for r in records)
        thirteenth_total = sum(r.thirteenth_month_deduction or Decimal(0) for r in records)
        health_total = sum(r.health_check_deduction or Decimal(0) for r in records)
        sss_total = sum(r.sss_deduction or Decimal(0) for r in records)

        values = [
            float(ca_total),
            float(late_total),
            float(thirteenth_total),
            float(health_total),
            float(sss_total)
        ]

        # 백분율 계산
        total_deductions = sum(values)
        if total_deductions > 0:
            percentages = [
                f"{(v / total_deductions * 100):.1f}%" for v in values
            ]
        else:
            percentages = ["0%"] * 5

        return {
            "labels": ["CA", "지각", "13개월", "보건소", "SSS"],
            "values": values,
            "percentages": percentages
        }

    except Exception as e:
        logger.error(f"Error in get_deduction_breakdown: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# D. 대시보드 요약 (KPI Cards)
# ============================================================
@router.get("/summary", dependencies=[Depends(require_admin)])
async def get_payroll_summary(
    period_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    정산 기간의 요약 통계

    응답 형식:
    {
      "total_employees": 25,
      "total_payroll": 1250000,
      "average_gross": 50000,
      "average_net": 42000,
      "top_earner": {
        "name": "김철수",
        "gross_pay": 60000,
        "net_pay": 52000
      },
      "lowest_earner": {
        "name": "이영희",
        "gross_pay": 40000,
        "net_pay": 35000
      }
    }
    """
    try:
        # 해당 정산 기간의 모든 기록 조회
        stmt = select(PayrollRecord, Employee).join(
            Employee,
            PayrollRecord.employee_id == Employee.id
        ).where(
            and_(
                PayrollRecord.payroll_period_id == period_id,
                PayrollRecord.is_obsolete == False
            )
        )

        result = await db.execute(stmt)
        rows = result.all()

        if not rows:
            return {
                "total_employees": 0,
                "total_payroll": 0,
                "average_gross": 0,
                "average_net": 0,
                "top_earner": None,
                "lowest_earner": None
            }

        # 통계 계산
        total_employees = len(rows)
        total_gross = sum(r[0].gross_pay or Decimal(0) for r in rows)
        total_net = sum(r[0].net_pay or Decimal(0) for r in rows)
        average_gross = total_gross / total_employees if total_employees > 0 else Decimal(0)
        average_net = total_net / total_employees if total_employees > 0 else Decimal(0)

        # 최고 수입자 및 최저 수입자 찾기
        top_earner_row = max(rows, key=lambda r: r[0].gross_pay or Decimal(0))
        lowest_earner_row = min(rows, key=lambda r: r[0].gross_pay or Decimal(0))

        top_earner = {
            "name": top_earner_row[1].name,
            "gross_pay": float(top_earner_row[0].gross_pay or Decimal(0)),
            "net_pay": float(top_earner_row[0].net_pay or Decimal(0))
        }

        lowest_earner = {
            "name": lowest_earner_row[1].name,
            "gross_pay": float(lowest_earner_row[0].gross_pay or Decimal(0)),
            "net_pay": float(lowest_earner_row[0].net_pay or Decimal(0))
        }

        return {
            "total_employees": total_employees,
            "total_payroll": float(total_gross),
            "average_gross": float(average_gross),
            "average_net": float(average_net),
            "top_earner": top_earner,
            "lowest_earner": lowest_earner
        }

    except Exception as e:
        logger.error(f"Error in get_payroll_summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# E. 직원별 상세 정보 (Dashboard Table)
# ============================================================
@router.get("/employee-details", dependencies=[Depends(require_admin)])
async def get_employee_details(
    period_id: int = Query(...),
    skip: int = Query(0),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    정산 기간의 직원별 상세 급여 정보

    응답 형식:
    {
      "total": 25,
      "items": [
        {
          "employee_id": 1,
          "name": "김철수",
          "employee_type": "therapist",
          "gross_pay": 55000,
          "total_deductions": 5000,
          "net_pay": 50000,
          "top_deduction": {
            "type": "CA",
            "amount": 5000
          }
        },
        ...
      ]
    }
    """
    try:
        # 전체 개수 조회
        count_stmt = select(func.count(PayrollRecord.id)).where(
            and_(
                PayrollRecord.payroll_period_id == period_id,
                PayrollRecord.is_obsolete == False
            )
        )
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

        # 페이지네이션과 함께 데이터 조회
        stmt = select(PayrollRecord, Employee).join(
            Employee,
            PayrollRecord.employee_id == Employee.id
        ).where(
            and_(
                PayrollRecord.payroll_period_id == period_id,
                PayrollRecord.is_obsolete == False
            )
        ).order_by(
            PayrollRecord.net_pay.desc()
        ).offset(skip).limit(limit)

        result = await db.execute(stmt)
        rows = result.all()

        items = []
        for record, employee in rows:
            # 최대 차감 항목 찾기
            deductions = {
                "CA": record.ca_deduction or Decimal(0),
                "지각": record.late_deduction or Decimal(0),
                "13개월": record.thirteenth_month_deduction or Decimal(0),
                "보건소": record.health_check_deduction or Decimal(0),
                "SSS": record.sss_deduction or Decimal(0),
            }
            top_deduction_type = max(deductions, key=deductions.get)
            top_deduction_amount = deductions[top_deduction_type]

            item = {
                "employee_id": employee.id,
                "name": employee.name,
                "employee_type": employee.employee_type,
                "gross_pay": float(record.gross_pay or Decimal(0)),
                "total_deductions": float(record.total_deductions or Decimal(0)),
                "net_pay": float(record.net_pay or Decimal(0)),
                "top_deduction": {
                    "type": top_deduction_type,
                    "amount": float(top_deduction_amount)
                }
            }
            items.append(item)

        return {
            "total": total,
            "items": items
        }

    except Exception as e:
        logger.error(f"Error in get_employee_details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
