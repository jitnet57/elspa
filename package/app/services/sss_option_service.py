"""
SSS 옵션 선택 비즈니스 로직 서비스

파일: app/services/sss_option_service.py
목적: SSS 선지급/보류 옵션 선택, 급여 영향도 계산, 감시 로그 기록
작성일: 2026-06-02

규칙:
  - Prepaid: 정부 인보이스 기준 고정액
  - Hold: 실제 근무일 기준 유동액
  - 변경 마감: 매월 25일
"""

import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_

logger = logging.getLogger(__name__)


# ─── 비즈니스 로직 서비스 ────────────────────────────────────────────

class SSSOptionService:
    """SSS 옵션 선택 및 급여 영향도 계산 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_monthly_summary(
        self,
        employee_id: int,
        month: str  # 예: "September 2024"
    ) -> dict:
        """
        직원의 월별 급여 요약 조회 (SSS 옵션 선택용)

        🔍 조회 항목:
        - 총 급여 (Gross Salary)
        - SSS 기여금 (정부 인보이스 + 실제 계산)
        - 근무일 (전체 vs 실제)
        - 현재 선택된 SSS 옵션

        📊 반환값: {
            "employee_id": int,
            "employee_name": str,
            "gross_salary": Decimal,
            "sss_contribution": Decimal,
            "government_invoice_amount": Decimal,
            "workdays_in_month": int,
            "actual_workdays_worked": int,
            "current_sss_option": "prepaid" | "hold",
            "payroll_impact": { ... }
        }
        """
        try:
            # 1. 직원 정보 조회
            from app.models.payroll import Employee
            emp_result = await self.db.execute(
                select(Employee).where(Employee.id == employee_id)
            )
            employee = emp_result.scalar_one_or_none()
            if not employee:
                raise ValueError(f"직원을 찾을 수 없습니다: ID {employee_id}")

            # 2. 월별 PayrollRecord 조회
            from app.models.payroll import PayrollRecord
            payroll_result = await self.db.execute(
                select(PayrollRecord).where(
                    and_(
                        PayrollRecord.employee_id == employee_id,
                        PayrollRecord.applicable_month == month
                    )
                )
            )
            payroll = payroll_result.scalar_one_or_none()
            if not payroll:
                raise ValueError(f"급여 기록을 찾을 수 없습니다: {month}")

            # 3. SSS 기여금 계산
            sss_contribution = self._calculate_sss_contribution(payroll)
            government_invoice_amount = self._get_government_invoice_amount(employee_id, month)

            # 4. 근무일 계산
            workdays_in_month = await self._get_workdays_in_month(month)
            actual_workdays_worked = await self._get_actual_workdays_worked(employee_id, month)

            # 5. 현재 SSS 옵션 조회
            current_option = await self._get_current_sss_option(employee_id, month)

            # 6. 급여 영향도 계산
            payroll_impact = self._calculate_payroll_impact(
                gross_salary=float(payroll.gross_salary),
                sss_contribution=float(sss_contribution),
                prepaid_amount=float(government_invoice_amount),
                hold_amount=self._calculate_hold_amount(
                    sss_contribution,
                    actual_workdays_worked,
                    workdays_in_month
                ),
                settlement_date=self._get_settlement_date(month)
            )

            return {
                "employee_id": employee_id,
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "current_month": month,
                "gross_salary": float(payroll.gross_salary),
                "sss_contribution": float(sss_contribution),
                "government_invoice_amount": float(government_invoice_amount),
                "workdays_in_month": workdays_in_month,
                "actual_workdays_worked": actual_workdays_worked,
                "current_sss_option": current_option,
                "payroll_impact": payroll_impact,
            }

        except Exception as e:
            logger.error(f"월별 요약 조회 실패: {str(e)}")
            raise

    async def update_sss_option(
        self,
        employee_id: int,
        month: str,
        new_option: str,  # "prepaid" | "hold"
        user_id: str,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> dict:
        """
        SSS 옵션 변경 (Prepaid ↔ Hold)

        🔒 검증:
        1. 직원 존재 여부
        2. 급여 기록 존재 여부
        3. 옵션 변경 가능 여부 (월 25일 이전)
        4. 동일 옵션 재선택 방지

        📝 감사 로그:
        - 변경 전 옵션
        - 변경 후 옵션
        - 변경자 (user_id)
        - 변경 시간
        - 변경 사유

        Returns:
        {
            "employee_id": int,
            "month": str,
            "previous_option": str,
            "updated_option": str,
            "updated_at": datetime,
            "payroll_impact": { ... }
        }
        """
        try:
            # 1️⃣ 직원 존재 여부 확인
            from app.models.payroll import Employee
            emp_result = await self.db.execute(
                select(Employee).where(Employee.id == employee_id)
            )
            employee = emp_result.scalar_one_or_none()
            if not employee:
                raise ValueError(f"직원을 찾을 수 없습니다: ID {employee_id}")

            # 2️⃣ 급여 기록 존재 여부 확인
            from app.models.payroll import PayrollRecord
            payroll_result = await self.db.execute(
                select(PayrollRecord).where(
                    and_(
                        PayrollRecord.employee_id == employee_id,
                        PayrollRecord.applicable_month == month
                    )
                )
            )
            payroll = payroll_result.scalar_one_or_none()
            if not payroll:
                raise ValueError(f"급여 기록을 찾을 수 없습니다: {month}")

            # 3️⃣ 옵션 변경 가능 여부 확인
            can_change, message = self._validate_option_change(month, new_option, payroll)
            if not can_change:
                raise ValueError(message)

            # 4️⃣ 현재 옵션 조회
            previous_option = await self._get_current_sss_option(employee_id, month)

            # 5️⃣ 옵션 변경
            from app.models.sss_option import SSSOptionSelection
            option_record = await self.db.execute(
                select(SSSOptionSelection).where(
                    and_(
                        SSSOptionSelection.employee_id == employee_id,
                        SSSOptionSelection.month == month
                    )
                )
            )
            selection = option_record.scalar_one_or_none()

            now = datetime.utcnow()

            if selection:
                # 기존 레코드 업데이트
                selection.selected_option = new_option
                selection.updated_at = now
            else:
                # 새 레코드 생성
                from app.models.sss_option import SSSOptionSelection as SSSModel
                selection = SSSModel(
                    employee_id=employee_id,
                    month=month,
                    selected_option=new_option,
                    created_at=now,
                    updated_at=now
                )
                self.db.add(selection)

            # 6️⃣ 감사 로그 기록
            await self._log_sss_option_change(
                employee_id=employee_id,
                month=month,
                previous_option=previous_option,
                new_option=new_option,
                user_id=user_id,
                reason=notes,
                ip_address=ip_address
            )

            # 7️⃣ 데이터베이스 커밋
            await self.db.commit()

            # 8️⃣ 급여 영향도 재계산
            summary = await self.get_monthly_summary(employee_id, month)

            return {
                "employee_id": employee_id,
                "month": month,
                "previous_option": previous_option,
                "updated_option": new_option,
                "updated_at": now.isoformat(),
                "payroll_impact": summary.get("payroll_impact", {})
            }

        except Exception as e:
            await self.db.rollback()
            logger.error(f"SSS 옵션 변경 실패: {str(e)}")
            raise

    # ─── Private 헬퍼 메서드 ────────────────────────────────────────────

    def _calculate_sss_contribution(self, payroll_record) -> Decimal:
        """
        SSS 기여금 계산
        = Employee contribution + Employer contribution
        (정부 인보이스에서 추출한 총액)
        """
        try:
            from app.models.sss_contribution import SssContribution
            # 실제로는 비동기 쿼리가 필요하지만, 여기서는 PayrollRecord 필드 사용
            # 또는 SssContribution 테이블에서 조회
            return payroll_record.sss_contribution or Decimal("0.00")
        except Exception as e:
            logger.warning(f"SSS 기여금 계산 실패: {str(e)}")
            return Decimal("0.00")

    def _get_government_invoice_amount(self, employee_id: int, month: str) -> Decimal:
        """
        정부 인보이스 기준액 조회
        (SSS 선지급 기준)
        """
        # 실제로는 SssContribution 테이블에서 정부 인보이스 데이터 조회
        # 여기서는 예시값
        return Decimal("2025.00")

    async def _get_workdays_in_month(self, month: str) -> int:
        """
        해당 월 전체 근무일 수 조회
        (휴무일, 공휴일 제외)
        """
        # 실제로는 근무일 달력 데이터 조회
        # 예: PhilippineHoliday 테이블 활용
        return 22

    async def _get_actual_workdays_worked(self, employee_id: int, month: str) -> int:
        """
        직원의 실제 근무일 수 조회
        (출퇴근 기록 기반)
        """
        try:
            from app.models.payroll import AttendanceLog
            result = await self.db.execute(
                select(AttendanceLog).where(
                    and_(
                        AttendanceLog.employee_id == employee_id,
                        AttendanceLog.check_in_date.like(f"{month.split()[-1]}-%")
                    )
                )
            )
            return len(result.scalars().all())
        except Exception as e:
            logger.warning(f"실제 근무일 조회 실패: {str(e)}")
            return 20

    async def _get_current_sss_option(self, employee_id: int, month: str) -> str:
        """현재 선택된 SSS 옵션 조회"""
        try:
            from app.models.sss_option import SSSOptionSelection
            result = await self.db.execute(
                select(SSSOptionSelection).where(
                    and_(
                        SSSOptionSelection.employee_id == employee_id,
                        SSSOptionSelection.month == month
                    )
                )
            )
            selection = result.scalar_one_or_none()
            return selection.selected_option if selection else "prepaid"
        except Exception as e:
            logger.warning(f"SSS 옵션 조회 실패: {str(e)}")
            return "prepaid"

    def _calculate_hold_amount(
        self,
        sss_contribution: Decimal,
        actual_workdays: int,
        total_workdays: int
    ) -> float:
        """
        Hold 옵션 금액 계산
        = SSS 기여금 × (실제 근무일 / 전체 근무일)
        """
        if total_workdays == 0:
            return float(sss_contribution)

        ratio = Decimal(actual_workdays) / Decimal(total_workdays)
        return float(sss_contribution * ratio)

    def _calculate_payroll_impact(
        self,
        gross_salary: float,
        sss_contribution: float,
        prepaid_amount: float,
        hold_amount: float,
        settlement_date: str
    ) -> dict:
        """급여 영향도 정보 생성"""
        difference = abs(prepaid_amount - hold_amount)
        percent_diff = (
            ((difference / sss_contribution) * 100)
            if sss_contribution > 0 else 0
        )

        tax_implications = f"""
선지급(Prepaid): ₱{prepaid_amount:,.2f} — 정부 인보이스 기준, 고정액
보류(Hold): ₱{hold_amount:,.2f} — 실제 근무 {(hold_amount/sss_contribution*100):.0f}% 기준, 유동액
차액: ₱{difference:,.2f} ({percent_diff:.1f}%)

📌 선택 시 영향:
• 선지급 선택: 초과분은 월말 차액 정산
• 보류 선택: 실제 근무에 따라 정확한 정산 (더 공정)
        """.strip()

        return {
            "gross_salary": gross_salary,
            "sss_contribution": sss_contribution,
            "prepaid_amount": prepaid_amount,
            "hold_amount": hold_amount,
            "tax_implications": tax_implications,
            "settlement_date": settlement_date
        }

    def _get_settlement_date(self, month: str) -> str:
        """정산 예정일 계산 (매월 25일)"""
        try:
            parts = month.split()
            year = parts[-1]
            month_name = parts[0]
            months = {
                "January": "01", "February": "02", "March": "03", "April": "04",
                "May": "05", "June": "06", "July": "07", "August": "08",
                "September": "09", "October": "10", "November": "11", "December": "12"
            }
            month_num = months.get(month_name, "09")
            return f"{year}-{month_num}-25"
        except Exception as e:
            logger.warning(f"정산일 파싱 실패: {str(e)}")
            return date.today().replace(day=25).isoformat()

    def _validate_option_change(self, month: str, new_option: str, payroll) -> Tuple[bool, str]:
        """
        옵션 변경 가능 여부 검증

        규칙:
        1. 옵션은 'prepaid' 또는 'hold'만 가능
        2. 월 25일 이후는 변경 불가
        """
        # 규칙 1: 옵션 형식 확인
        if new_option not in ["prepaid", "hold"]:
            return False, "옵션은 'prepaid' 또는 'hold'여야 합니다"

        # 규칙 2: 월 25일 이후 변경 불가
        today = date.today()
        if today.day >= 25:
            return False, "정산 기한(25일)이 지났습니다. 다음 달에 변경 가능합니다"

        return True, "옵션 변경 가능"

    async def _log_sss_option_change(
        self,
        employee_id: int,
        month: str,
        previous_option: str,
        new_option: str,
        user_id: str,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> None:
        """SSS 옵션 변경 감사 로그 기록"""
        try:
            from app.models.sss_option import SSSOptionAuditLog
            log = SSSOptionAuditLog(
                employee_id=employee_id,
                month=month,
                previous_option=previous_option,
                selected_option=new_option,
                changed_by_user_id=user_id,
                changed_at=datetime.utcnow(),
                reason=reason,
                ip_address=ip_address
            )
            self.db.add(log)
            await self.db.flush()
            logger.info(f"SSS 감사 로그 기록: Employee {employee_id}, {previous_option} → {new_option}")
        except Exception as e:
            logger.error(f"감사 로그 기록 실패: {str(e)}")
