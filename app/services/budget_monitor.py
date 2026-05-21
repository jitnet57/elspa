"""
📌 Budget Monitor Service
📋 목적: 예산 초과 감지 및 알림
🔧 포함: 실시간 예산 사용률 추적, 임계값 기반 알림
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.financial import Expense, Budget, MonthlyRevenue
from typing import Optional, Dict, Any


class BudgetAlert:
    """예산 경고 데이터"""

    def __init__(
        self,
        year: int,
        month: int,
        alert_type: str,  # 'warning' (80%), 'critical' (100%)
        actual_amount: float,
        budget_limit: float,
        percentage: float,
        message: str,
    ):
        self.year = year
        self.month = month
        self.alert_type = alert_type
        self.actual_amount = actual_amount
        self.budget_limit = budget_limit
        self.percentage = percentage
        self.message = message

    def dict(self) -> Dict[str, Any]:
        return {
            "year": self.year,
            "month": self.month,
            "alertType": self.alert_type,
            "actualAmount": self.actual_amount,
            "budgetLimit": self.budget_limit,
            "percentage": round(self.percentage, 2),
            "message": self.message,
        }


class BudgetMonitor:
    """예산 모니터 서비스"""

    @staticmethod
    def calculate_usage(
        db: Session,
        year: int,
        month: int,
    ) -> Dict[str, Any]:
        """
        월별 예산 사용률 계산

        Returns:
            {
                "budget_limit": float,
                "actual_expenses": float,
                "remaining": float,
                "percentage": float,
                "status": "on_track" | "warning" | "exceeded"
            }
        """
        budget = db.query(Budget).filter(
            Budget.year == year,
            Budget.month == month,
        ).first()

        if not budget:
            return {
                "budget_limit": 0,
                "actual_expenses": 0,
                "remaining": 0,
                "percentage": 0,
                "status": "no_budget",
            }

        # 해당 월의 총 지출 계산
        from datetime import date as date_class

        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        actual_expenses = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.expense_date >= start_date,
                Expense.expense_date < end_date,
            )
            .scalar() or 0
        )

        actual_expenses = float(actual_expenses)
        remaining = budget.expense_limit - actual_expenses
        percentage = (actual_expenses / budget.expense_limit * 100) if budget.expense_limit > 0 else 0

        # 상태 결정
        if percentage >= 100:
            status = "exceeded"
        elif percentage >= 80:
            status = "warning"
        else:
            status = "on_track"

        return {
            "budget_limit": budget.expense_limit,
            "actual_expenses": actual_expenses,
            "remaining": max(remaining, 0),
            "percentage": round(percentage, 2),
            "status": status,
        }

    @staticmethod
    def check_budget_alerts(db: Session, year: int, month: int) -> list[BudgetAlert]:
        """
        예산 경고 확인

        Returns:
            - warning (80% 이상)
            - critical (100% 이상)
        """
        alerts = []
        usage = BudgetMonitor.calculate_usage(db, year, month)

        if usage["status"] == "no_budget":
            return alerts

        percentage = usage["percentage"]
        actual = usage["actual_expenses"]
        limit = usage["budget_limit"]

        # Warning: 80% 이상
        if 80 <= percentage < 100:
            alerts.append(
                BudgetAlert(
                    year=year,
                    month=month,
                    alert_type="warning",
                    actual_amount=actual,
                    budget_limit=limit,
                    percentage=percentage,
                    message=f"⚠️ 예산 경고: {percentage:.1f}% 사용 (₱{actual:,.0f} / ₱{limit:,.0f})",
                )
            )

        # Critical: 100% 이상
        if percentage >= 100:
            over_amount = actual - limit
            alerts.append(
                BudgetAlert(
                    year=year,
                    month=month,
                    alert_type="critical",
                    actual_amount=actual,
                    budget_limit=limit,
                    percentage=percentage,
                    message=f"🚨 예산 초과: ₱{over_amount:,.0f} 초과 (₱{actual:,.0f} / ₱{limit:,.0f})",
                )
            )

        return alerts

    @staticmethod
    def get_category_breakdown(
        db: Session,
        year: int,
        month: int,
    ) -> Dict[str, Dict[str, Any]]:
        """
        카테고리별 지출 분석

        Returns:
            {
                "카테고리명": {
                    "amount": float,
                    "budget": float,
                    "percentage": float,
                    "status": "on_track" | "warning" | "exceeded"
                }
            }
        """
        from app.models.financial import ExpenseCategory

        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        budget = db.query(Budget).filter(
            Budget.year == year,
            Budget.month == month,
        ).first()

        if not budget:
            return {}

        # 카테고리별 지출 집계
        results = (
            db.query(
                ExpenseCategory.name,
                func.sum(Expense.amount).label("total"),
            )
            .join(Expense, ExpenseCategory.id == Expense.category_id)
            .filter(
                Expense.expense_date >= start_date,
                Expense.expense_date < end_date,
            )
            .group_by(ExpenseCategory.id, ExpenseCategory.name)
            .all()
        )

        breakdown = {}
        budgets = {
            "Salary": budget.salary_budget,
            "Rent": budget.indirect_costs_budget,
            "Utilities": budget.indirect_costs_budget,
            "Benefits": budget.benefits_budget,
            "Fuel": budget.other_budget,
            "Miscellaneous": budget.other_budget,
        }

        for category_name, amount in results:
            amount = float(amount or 0)
            category_budget = budgets.get(category_name, 0) or 0

            if category_budget > 0:
                percentage = (amount / category_budget) * 100
                if percentage >= 100:
                    status = "exceeded"
                elif percentage >= 80:
                    status = "warning"
                else:
                    status = "on_track"
            else:
                percentage = 0
                status = "on_track"

            breakdown[category_name] = {
                "amount": amount,
                "budget": category_budget,
                "percentage": round(percentage, 2),
                "status": status,
            }

        return breakdown

    @staticmethod
    def get_monthly_trend(db: Session, year: int, months: int = 6) -> list[Dict[str, Any]]:
        """
        월별 예산 추이 조회

        Returns:
            [{
                "month": "May 2026",
                "budget_limit": float,
                "actual_expenses": float,
                "percentage": float
            }]
        """
        trends = []

        for i in range(months):
            # 역순으로 최근부터
            offset_months = months - 1 - i

            if offset_months == 0:
                check_date = datetime.now()
            else:
                from dateutil.relativedelta import relativedelta

                check_date = datetime.now() - relativedelta(months=offset_months)

            check_year = check_date.year
            check_month = check_date.month

            usage = BudgetMonitor.calculate_usage(db, check_year, check_month)

            month_name = check_date.strftime("%B %Y")

            trends.append({
                "month": month_name,
                "budget_limit": usage["budget_limit"],
                "actual_expenses": usage["actual_expenses"],
                "percentage": usage["percentage"],
                "status": usage["status"],
            })

        return trends
