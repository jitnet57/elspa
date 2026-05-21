"""
📌 Financial Service - 비즈니스 로직 계층
📋 목적: 재무 데이터 집계, 분석, 통계 계산
🔧 포함: 수익 집계, 지출 분석, 예산 추적, 트렌드 분석
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.financial import Expense, ExpenseCategory, Budget, MonthlyRevenue


class FinancialService:
    """재무 데이터 서비스"""

    @staticmethod
    def aggregate_monthly_revenue(
        db: Session, year: int, month: int
    ) -> dict:
        """월별 매출 집계 (캐시됨)"""
        revenue = db.query(MonthlyRevenue).filter(
            MonthlyRevenue.year == year,
            MonthlyRevenue.month == month
        ).first()

        if not revenue:
            return {
                "year": year,
                "month": month,
                "total_revenue": 0,
                "therapist_commission": 0,
                "company_commission": 0,
                "walkup_revenue": 0
            }

        return {
            "year": revenue.year,
            "month": revenue.month,
            "total_revenue": revenue.total_revenue,
            "therapist_commission": revenue.therapist_commission,
            "company_commission": revenue.company_commission,
            "walkup_revenue": revenue.walkup_revenue
        }

    @staticmethod
    def calculate_monthly_expenses(
        db: Session, year: int, month: int
    ) -> float:
        """월별 총 지출 계산"""
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        total = db.query(func.sum(Expense.amount)).filter(
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar() or 0

        return float(total)

    @staticmethod
    def get_expense_breakdown_by_category(
        db: Session, year: int, month: int
    ) -> list:
        """카테고리별 지출 분석"""
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        results = db.query(
            ExpenseCategory.name,
            func.sum(Expense.amount).label("total")
        ).join(
            Expense, ExpenseCategory.id == Expense.category_id
        ).filter(
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).group_by(ExpenseCategory.id, ExpenseCategory.name).all()

        return [
            {"category": r[0], "amount": float(r[1] or 0)}
            for r in results
        ]

    @staticmethod
    def calculate_budget_utilization(
        db: Session, year: int, month: int
    ) -> dict:
        """예산 사용률 계산"""
        budget = db.query(Budget).filter(
            Budget.year == year,
            Budget.month == month
        ).first()

        actual_expenses = FinancialService.calculate_monthly_expenses(
            db, year, month
        )

        if not budget:
            return {
                "status": "no_budget",
                "actual_expenses": actual_expenses,
                "budget_limit": 0,
                "remaining": 0,
                "percentage": 0
            }

        remaining = budget.expense_limit - actual_expenses
        percentage = (actual_expenses / budget.expense_limit * 100) \
            if budget.expense_limit > 0 else 0

        return {
            "status": "on_track" if remaining >= 0 else "over_budget",
            "actual_expenses": actual_expenses,
            "budget_limit": budget.expense_limit,
            "remaining": max(remaining, 0),
            "percentage": min(percentage, 100),
            "over_amount": max(-remaining, 0) if remaining < 0 else 0
        }

    @staticmethod
    def get_annual_summary(db: Session, year: int) -> dict:
        """연간 집계"""
        revenues = db.query(MonthlyRevenue).filter(
            MonthlyRevenue.year == year
        ).all()

        total_revenue = sum(r.total_revenue for r in revenues)
        total_expenses = 0

        for month in range(1, 13):
            expenses = FinancialService.calculate_monthly_expenses(
                db, year, month
            )
            total_expenses += expenses

        profit = total_revenue - total_expenses
        profit_margin = (profit / total_revenue * 100) \
            if total_revenue > 0 else 0

        return {
            "year": year,
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "profit": profit,
            "profit_margin": round(profit_margin, 2),
            "month_count": len(revenues)
        }

    @staticmethod
    def get_expense_trends(
        db: Session, year: int, months: int = 6
    ) -> list:
        """지출 추이 조회 (최근 N개월)"""
        trends = []

        for i in range(months - 1, -1, -1):
            # 과거 months개월 계산
            target_date = datetime.now() - timedelta(days=30 * i)
            target_month = target_date.month
            target_year = target_date.year

            total_expenses = FinancialService.calculate_monthly_expenses(
                db, target_year, target_month
            )

            trends.append({
                "year": target_year,
                "month": target_month,
                "month_name": target_date.strftime("%B"),
                "total_expenses": total_expenses
            })

        return trends
