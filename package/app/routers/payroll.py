"""
급여 정산 API 라우터
경로: app/routers/payroll.py
작성일: 2026-05-21
엔드포인트: /api/payroll/*

BUG FIX #2: CA 정산 추적 (mark_cash_advances_as_settled)
BUG FIX #3: 상태 전환 검증 (approve_payroll_period)

Phase 8-3 Wave 3-1: PDF 정산서 생성 엔드포인트 추가
- GET /api/payroll/records/{id}/pdf - 단일 정산서 PDF 다운로드
- GET /api/payroll/periods/{id}/pdf-export - 정산 기간 전체 PDF 일괄 다운로드 (ZIP)
"""

import logging
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from io import BytesIO
import zipfile

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import joinedload, selectinload, defer

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.payroll import (
    Employee, PayrollPeriod, PayrollRecord, CashAdvance,
    AttendanceLog, PhilippineHoliday, EmployeeType
)
from app.services.payroll_calculator import PayrollCalculator
from app.services.pdf_generator import PDFGenerator
from app.schemas.payroll import (
    EmployeeCreate, EmployeeResponse,
    PayrollPeriodCreate, PayrollPeriodResponse,
    PayrollRecordResponse,
    CashAdvanceCreate, CashAdvanceResponse,
    AttendanceLogCreate, AttendanceLogResponse,
    PhilippineHolidayCreate, PhilippineHolidayResponse
)
from app.auth.dependencies import get_current_user, require_admin, TokenUser
from app.utils.payroll_audit_helpers import (
    log_employee_created, log_employee_updated, log_employee_deleted,
    log_cash_advance_created, log_cash_advance_approved, log_cash_advance_rejected,
    log_cash_advance_settled, log_attendance_created, log_attendance_updated,
    log_payroll_period_created, log_payroll_period_approved, log_payroll_period_paid,
    log_payroll_record_calculated, log_payroll_record_updated, log_payroll_record_approved,
    log_holiday_created, log_holiday_deleted
)

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


# ============================================================
# Employee (직원 마스터) CRUD
# ============================================================

@router.post("/employees", response_model=EmployeeResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    employee = Employee(**payload.dict())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)

    # 감사 로그 기록
    log_employee_created(
        db=db,
        employee=employee,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return employee


@router.get("/employees", response_model=List[EmployeeResponse], dependencies=[Depends(get_current_user)])
async def list_employees(
    skip: int = 0,
    limit: int = 100,
    employee_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    response: Response = None
):
    """
    직원 목록 조회 (페이지네이션)

    ✅ 최적화:
    - Cache-Control 헤더: 5분 캐싱
    - 페이지네이션으로 성능 개선
    """
    stmt = select(Employee)
    if employee_type:
        stmt = stmt.where(Employee.employee_type == employee_type)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)

    # ✅ HTTP 캐싱 헤더
    if response:
        response.headers["Cache-Control"] = "public, max-age=300"  # 5분

    return result.scalars().all()


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse, dependencies=[Depends(require_admin)])
async def update_employee(
    employee_id: int,
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    # 변경 전 데이터 저장
    old_employee_data = {
        "name": employee.name,
        "phone": employee.phone,
        "employee_type": str(employee.employee_type),
        "pay_group": str(employee.pay_group),
        "base_salary": float(employee.base_salary),
        "commission_rate": float(employee.commission_rate),
        "hire_date": employee.hire_date.isoformat(),
        "is_active": employee.is_active,
    }

    for key, value in payload.dict().items():
        setattr(employee, key, value)
    employee.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(employee)

    # 감사 로그 기록
    log_employee_updated(
        db=db,
        old_employee_data=old_employee_data,
        new_employee=employee,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return employee


@router.delete("/employees/{employee_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    employee.is_active = False
    employee.updated_at = datetime.utcnow()
    await db.commit()

    # 감사 로그 기록 (소프트 삭제)
    log_employee_deleted(
        db=db,
        employee=employee,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )


# ============================================================
# CashAdvance (CA) CRUD
# ============================================================

@router.post("/cash-advance", response_model=CashAdvanceResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create_cash_advance(
    payload: CashAdvanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ca = CashAdvance(**payload.dict())
    db.add(ca)
    await db.commit()
    await db.refresh(ca)

    # 감사 로그 기록
    log_cash_advance_created(
        db=db,
        ca=ca,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return ca


@router.get("/cash-advance", response_model=List[CashAdvanceResponse], dependencies=[Depends(get_current_user)])
async def list_cash_advances(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CashAdvance)
    if status:
        stmt = stmt.where(CashAdvance.status == status)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/cash-advance/{ca_id}", response_model=CashAdvanceResponse, dependencies=[Depends(require_admin)])
async def update_cash_advance_status(
    ca_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(CashAdvance).where(CashAdvance.id == ca_id))
    ca = result.scalar_one_or_none()
    if not ca:
        raise HTTPException(status_code=404, detail="CA를 찾을 수 없습니다")

    # BUG FIX #2: "settled" 상태 추가
    if status not in ["pending", "approved", "rejected", "settled"]:
        raise HTTPException(status_code=400, detail="유효하지 않은 상태입니다")

    ca.status = status
    ca.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ca)

    # 감사 로그 기록
    if status == "approved":
        log_cash_advance_approved(
            db=db,
            ca=ca,
            user_id=str(current_user.get("user_id", "unknown")),
            user_email=current_user.get("email")
        )
    elif status == "rejected":
        log_cash_advance_rejected(
            db=db,
            ca=ca,
            user_id=str(current_user.get("user_id", "unknown")),
            user_email=current_user.get("email")
        )
    elif status == "settled":
        log_cash_advance_settled(
            db=db,
            ca=ca,
            payroll_record_id=ca.settled_payroll_id or 0,
            user_id=str(current_user.get("user_id", "unknown")),
            user_email=current_user.get("email")
        )

    return ca


# ============================================================
# AttendanceLog (출퇴근) CRUD
# ============================================================

@router.post("/attendance", response_model=AttendanceLogResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create_attendance_log(
    payload: AttendanceLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    log = AttendanceLog(**payload.dict())
    db.add(log)
    await db.commit()
    await db.refresh(log)

    # 감사 로그 기록
    log_attendance_created(
        db=db,
        attendance=log,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return log


@router.get("/attendance", response_model=List[AttendanceLogResponse], dependencies=[Depends(get_current_user)])
async def list_attendance_logs(
    work_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AttendanceLog)
    if work_date:
        stmt = stmt.where(AttendanceLog.work_date == work_date)
    if employee_id:
        stmt = stmt.where(AttendanceLog.employee_id == employee_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/attendance/{log_id}", response_model=AttendanceLogResponse, dependencies=[Depends(require_admin)])
async def update_attendance_log(
    log_id: int,
    payload: AttendanceLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(AttendanceLog).where(AttendanceLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="출퇴근 기록을 찾을 수 없습니다")

    # 변경 전 데이터 저장
    old_attendance_data = {
        "work_date": log.work_date.isoformat(),
        "status": log.status,
        "hours_worked": float(log.hours_worked) if log.hours_worked else None,
        "overtime_hours": float(log.overtime_hours) if log.overtime_hours else None,
        "is_late": log.is_late,
        "notes": log.notes,
    }

    for key, value in payload.dict().items():
        setattr(log, key, value)
    log.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(log)

    # 감사 로그 기록
    log_attendance_updated(
        db=db,
        old_attendance_data=old_attendance_data,
        new_attendance=log,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return log


# ============================================================
# PhilippineHoliday (공휴일) CRUD
# ============================================================

@router.post("/holidays", response_model=PhilippineHolidayResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create_holiday(
    payload: PhilippineHolidayCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    holiday = PhilippineHoliday(**payload.dict())
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)

    # 감사 로그 기록
    log_holiday_created(
        db=db,
        holiday=holiday,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return holiday


@router.get("/holidays", response_model=List[PhilippineHolidayResponse], dependencies=[Depends(get_current_user)])
async def list_holidays(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    response: Response = None
):
    # ✅ HTTP 캐싱 헤더 (24시간 - 공휴일은 변경 빈도가 낮음)
    if response:
        response.headers["Cache-Control"] = "public, max-age=86400"

    result = await db.execute(select(PhilippineHoliday).offset(skip).limit(limit))
    return result.scalars().all()


@router.delete("/holidays/{holiday_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete_holiday(
    holiday_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(PhilippineHoliday).where(PhilippineHoliday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise HTTPException(status_code=404, detail="공휴일을 찾을 수 없습니다")

    # 감사 로그 기록 (삭제 전)
    log_holiday_deleted(
        db=db,
        holiday=holiday,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    await db.delete(holiday)
    await db.commit()


# ============================================================
# PayrollPeriod (정산 기간) CRUD
# ============================================================

@router.post("/periods", response_model=PayrollPeriodResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create_payroll_period(
    payload: PayrollPeriodCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if payload.period_start >= payload.period_end:
        raise HTTPException(status_code=400, detail="기간 설정이 잘못되었습니다")

    period = PayrollPeriod(**payload.dict())
    db.add(period)
    await db.commit()
    await db.refresh(period)

    # 감사 로그 기록
    log_payroll_period_created(
        db=db,
        period=period,
        user_id=str(current_user.get("user_id", "unknown")),
        user_email=current_user.get("email")
    )

    return period


@router.get("/periods", response_model=List[PayrollPeriodResponse], dependencies=[Depends(get_current_user)])
async def list_payroll_periods(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    response: Response = None
):
    # ✅ HTTP 캐싱 헤더 (5분)
    if response:
        response.headers["Cache-Control"] = "public, max-age=300"

    result = await db.execute(select(PayrollPeriod).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/periods/{period_id}", response_model=PayrollPeriodResponse, dependencies=[Depends(get_current_user)])
async def get_payroll_period(period_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PayrollPeriod).where(PayrollPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")
    return period


# ============================================================
# PayrollRecord (정산 결과) — 계산 & 조회
# ============================================================

@router.post("/periods/{period_id}/calculate", response_model=List[PayrollRecordResponse], dependencies=[Depends(require_admin)])
async def calculate_payroll(
    period_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    급여 계산 실행 — 정산 기간의 모든 직원 급여 자동 계산

    BUG FIX #2: CA를 settled로 표시
    - 계산된 각 PayrollRecord에 대해
    - 해당 직원의 approved 상태 CA를 모두 settled로 변경
    - settled_payroll_id에 현재 PayrollRecord ID 기록
    """
    result = await db.execute(select(PayrollPeriod).where(PayrollPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # 기존 PayrollRecord 삭제 (재계산)
    await db.execute(delete(PayrollRecord).where(PayrollRecord.payroll_period_id == period_id))

    # 급여 계산 (async)
    records = await PayrollCalculator.calculate_payroll_for_period(period, db)

    for record in records:
        db.add(record)

    await db.flush()  # PayrollRecord ID 생성

    # BUG FIX #2: 각 직원의 approved CA를 settled로 표시
    for record in records:
        ca_settled_count = await PayrollCalculator.mark_cash_advances_as_settled(
            employee_id=record.employee_id,
            payroll_record_id=record.id,
            db=db
        )
        if ca_settled_count > 0:
            logger.info(
                f"Employee {record.employee_id}: {ca_settled_count} CA(s) "
                f"marked as settled in PayrollRecord {record.id}"
            )

    await db.commit()

    # 감사 로그 기록 — 계산된 모든 정산 기록
    for record in records:
        log_payroll_record_calculated(
            db=db,
            record=record,
            user_id=str(current_user.get("user_id", "unknown")),
            user_email=current_user.get("email")
        )

    # ✅ 최적화: JOIN으로 연관 객체 한 번에 로드
    result = await db.execute(
        select(PayrollRecord)
        .where(PayrollRecord.payroll_period_id == period_id)
        .options(
            joinedload(PayrollRecord.payroll_period),
            joinedload(PayrollRecord.employee)
        )
    )
    return result.scalars().all()


@router.get("/records", response_model=List[PayrollRecordResponse], dependencies=[Depends(get_current_user)])
async def list_payroll_records(
    payroll_period_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    # ✅ 최적화: JOIN으로 연관 객체 한 번에 로드
    stmt = select(PayrollRecord).options(
        joinedload(PayrollRecord.payroll_period),
        joinedload(PayrollRecord.employee)
    )
    if payroll_period_id:
        stmt = stmt.where(PayrollRecord.payroll_period_id == payroll_period_id)
    if employee_id:
        stmt = stmt.where(PayrollRecord.employee_id == employee_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/records/{record_id}", response_model=PayrollRecordResponse, dependencies=[Depends(get_current_user)])
async def get_payroll_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PayrollRecord).where(PayrollRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="정산 결과를 찾을 수 없습니다")
    return record


@router.get("/therapists/health-check-schedule", dependencies=[Depends(require_admin)])
async def get_health_check_schedule(db: AsyncSession = Depends(get_db)):
    """
    테라피스트별 보건소 검사비 차감 일정 조회

    ✅ 최적화: joinedload를 사용하여 N+1 쿼리 문제 제거
    - PayrollRecord와 PayrollPeriod를 한 번에 JOIN하여 로드
    - 루프에서 PayrollRecord 조회 시 추가 쿼리 없음

    반환 값:
    - therapist_id: 테라피스트 ID
    - therapist_name: 테라피스트 이름
    - q1_status: Q1 (1-3월) 상태
    - q2_status: Q2 (4-6월) 상태
    - q3_status: Q3 (7-9월) 상태
    - q4_status: Q4 (10-12월) 상태

    상태값:
    - pending: 차감 예정
    - deducted: 차감 완료
    """
    # 활성화된 Therapist 조회 (조인으로 한 번에 가져오기)
    result = await db.execute(
        select(Employee)
        .where(
            Employee.employee_type == EmployeeType.THERAPIST,
            Employee.is_active == True
        )
        .options(selectinload(Employee.payroll_records).joinedload(PayrollRecord.payroll_period))
    )
    therapists = result.scalars().all()

    schedule = []

    for therapist in therapists:
        # ✅ 최적화: 이미 로드된 payroll_records 사용 (추가 쿼리 없음)
        records = therapist.payroll_records

        # 분기별 차감 여부 판정
        quarters = {"Q1": False, "Q2": False, "Q3": False, "Q4": False}

        for record in records:
            month = record.payroll_period.period_end.month
            if month in [1, 2, 3]:
                if record.health_check_deduction > Decimal(0):
                    quarters["Q1"] = True
            elif month in [4, 5, 6]:
                if record.health_check_deduction > Decimal(0):
                    quarters["Q2"] = True
            elif month in [7, 8, 9]:
                if record.health_check_deduction > Decimal(0):
                    quarters["Q3"] = True
            elif month in [10, 11, 12]:
                if record.health_check_deduction > Decimal(0):
                    quarters["Q4"] = True

        schedule.append({
            "therapist_id": therapist.id,
            "therapist_name": therapist.name,
            "q1_status": "deducted" if quarters["Q1"] else "pending",
            "q2_status": "deducted" if quarters["Q2"] else "pending",
            "q3_status": "deducted" if quarters["Q3"] else "pending",
            "q4_status": "deducted" if quarters["Q4"] else "pending",
        })

    return schedule


@router.post("/periods/{period_id}/approve", response_model=PayrollPeriodResponse, dependencies=[Depends(require_admin)])
async def approve_payroll_period(
    period_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    정산 기간 상태 전환 및 승인

    BUG FIX #3: 상태 검증 추가
    - draft → approved (O)
    - approved → paid (O)
    - 다른 전환은 불가 (409 Conflict)
    """
    result = await db.execute(select(PayrollPeriod).where(PayrollPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # BUG FIX #3: 상태 검증
    if period.status == "draft":
        # draft → approved 전환
        new_status = "approved"
    elif period.status == "approved":
        # approved → paid 전환
        new_status = "paid"
    elif period.status == "paid":
        raise HTTPException(
            status_code=409,
            detail="이미 지급 완료된 정산 기간입니다 (상태: paid)"
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 정산 상태: {period.status}"
        )

    period.status = new_status
    period.updated_at = datetime.utcnow()

    await db.execute(
        update(PayrollRecord)
        .where(PayrollRecord.payroll_period_id == period_id)
        .values(status=new_status)
    )

    await db.commit()
    await db.refresh(period)

    # 감사 로그 기록
    if new_status == "approved":
        log_payroll_period_approved(
            db=db,
            period=period,
            user_id=str(current_user.get("user_id", "unknown")),
            user_email=current_user.get("email")
        )
    elif new_status == "paid":
        log_payroll_period_paid(
            db=db,
            period=period,
            user_id=str(current_user.get("user_id", "unknown")),
            user_email=current_user.get("email")
        )

    return period


# ============================================================
# 13th Month Bonus (13개월 보너스) API
# ============================================================

@router.get("/thirteenth-month/{employee_id}", response_model=dict, dependencies=[Depends(get_current_user)])
async def get_thirteenth_month_bonus(employee_id: int, db: AsyncSession = Depends(get_db)):
    """
    개인별 13개월 보너스 정산 현황 조회

    응답:
    {
        "employee_id": 1,
        "employee_name": "Juan Dela Cruz",
        "hire_date": "2025-01-15",
        "total_accrual": "5000.00",  # 누적액 (선지급 제외)
        "total_paid": "5000.00",      # 실제 지급액
        "records": [
            {
                "payroll_period_id": 1,
                "period_start": "2025-01-01",
                "period_end": "2025-01-15",
                "thirteenth_month_deduction": "500.00",
                "status": "paid"
            }
        ]
    }
    """
    # 직원 조회
    emp_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    # 해당 직원의 모든 정산 기록 조회
    rec_result = await db.execute(
        select(PayrollRecord).where(
            PayrollRecord.employee_id == employee_id,
            PayrollRecord.is_obsolete == False
        ).order_by(PayrollRecord.created_at)
    )
    records = rec_result.scalars().all()

    # 정산 기간 정보 포함
    period_result = await db.execute(select(PayrollPeriod))
    periods_dict = {p.id: p for p in period_result.scalars().all()}

    total_accrual = sum(
        record.thirteenth_month_accrual
        for record in records
    )
    total_paid = sum(
        record.thirteenth_month_deduction
        for record in records
    )

    records_detail = []
    for record in records:
        period = periods_dict.get(record.payroll_period_id)
        records_detail.append({
            "payroll_record_id": record.id,
            "payroll_period_id": record.payroll_period_id,
            "period_start": period.period_start if period else None,
            "period_end": period.period_end if period else None,
            "thirteenth_month_deduction": str(record.thirteenth_month_deduction),
            "status": record.status
        })

    return {
        "employee_id": employee.id,
        "employee_name": employee.name,
        "hire_date": employee.hire_date,
        "total_accrual": str(total_accrual),
        "total_paid": str(total_paid),
        "records": records_detail
    }


@router.get("/thirteenth-month", response_model=List[dict])
async def list_thirteenth_month_summary(
    payroll_period_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    13개월 보너스 정산 현황 (전체)

    Query Parameters:
    - payroll_period_id: 특정 정산 기간만 조회
    - status: draft / approved / paid
    - skip, limit: 페이지네이션

    응답 (리스트):
    [
        {
            "payroll_record_id": 1,
            "employee_id": 1,
            "employee_name": "Juan Dela Cruz",
            "hire_date": "2025-01-15",
            "thirteenth_month_accrual": "1000.00",
            "thirteenth_month_deduction": "1000.00",
            "status": "paid"
        }
    ]
    """
    stmt = select(PayrollRecord).where(PayrollRecord.is_obsolete == False)

    if payroll_period_id:
        stmt = stmt.where(PayrollRecord.payroll_period_id == payroll_period_id)

    if status:
        stmt = stmt.where(PayrollRecord.status == status)

    stmt = stmt.order_by(PayrollRecord.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    records = result.scalars().all()

    # 직원 정보 포함
    emp_result = await db.execute(select(Employee))
    emp_dict = {e.id: e for e in emp_result.scalars().all()}

    summary = []
    for record in records:
        employee = emp_dict.get(record.employee_id)
        summary.append({
            "payroll_record_id": record.id,
            "employee_id": record.employee_id,
            "employee_name": employee.name if employee else "Unknown",
            "hire_date": employee.hire_date if employee else None,
            "thirteenth_month_accrual": str(record.thirteenth_month_accrual),
            "thirteenth_month_deduction": str(record.thirteenth_month_deduction),
            "status": record.status
        })

    return summary


# ============================================================
# PDF 정산서 생성 API (Phase 8-3 Wave 3-1)
# ============================================================

@router.get("/records/{record_id}/pdf", dependencies=[Depends(get_current_user)])
async def download_payroll_pdf(
    record_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    단일 정산서 PDF 다운로드

    엔드포인트:
      GET /api/payroll/records/{record_id}/pdf

    응답:
      - Content-Type: application/pdf
      - Content-Disposition: attachment; filename="정산서_{employee_id}_{period_start}_{period_end}.pdf"
      - 바이너리 PDF 데이터

    예시:
      GET /api/payroll/records/1/pdf
      → 파일: 정산서_1_2026-05-01_2026-05-07.pdf
    """
    # 정산 기록 조회
    record_result = await db.execute(
        select(PayrollRecord).where(PayrollRecord.id == record_id)
    )
    record = record_result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="정산 기록을 찾을 수 없습니다")

    # 직원 정보 조회
    emp_result = await db.execute(
        select(Employee).where(Employee.id == record.employee_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    # 정산 기간 조회
    period_result = await db.execute(
        select(PayrollPeriod).where(PayrollPeriod.id == record.payroll_period_id)
    )
    period = period_result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # PDF 생성
    pdf_bytes = PDFGenerator.generate_payroll_statement_pdf(record, employee, period)

    # 파일명 생성
    filename = f"정산서_{employee.id}_{period.period_start}_{period.period_end}.pdf"

    # PDF 응답
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\""
        }
    )


@router.get("/periods/{period_id}/pdf-export", dependencies=[Depends(require_admin)])
async def export_payroll_period_as_zip(
    period_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    정산 기간의 모든 정산서를 ZIP 파일로 일괄 다운로드

    엔드포인트:
      GET /api/payroll/periods/{period_id}/pdf-export

    응답:
      - Content-Type: application/zip
      - Content-Disposition: attachment; filename="정산서_2026-05-01_2026-05-07.zip"
      - ZIP 파일 (내부: 각 직원별 정산서 PDF)

    ZIP 구조:
      정산서_2026-05-01_2026-05-07.zip
      ├── 정산서_1_Juan Dela Cruz.pdf
      ├── 정산서_2_Maria Santos.pdf
      └── ...

    예시:
      GET /api/payroll/periods/1/pdf-export
      → 파일: 정산서_2026-05-01_2026-05-07.zip
    """
    # 정산 기간 조회
    period_result = await db.execute(
        select(PayrollPeriod).where(PayrollPeriod.id == period_id)
    )
    period = period_result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # 해당 정산 기간의 모든 정산 기록 조회
    records_result = await db.execute(
        select(PayrollRecord).where(PayrollRecord.payroll_period_id == period_id)
    )
    records = records_result.scalars().all()

    if not records:
        raise HTTPException(status_code=404, detail="해당 정산 기간의 정산 기록이 없습니다")

    # ZIP 파일 생성 (메모리)
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for record in records:
            # 직원 정보 조회
            emp_result = await db.execute(
                select(Employee).where(Employee.id == record.employee_id)
            )
            employee = emp_result.scalar_one_or_none()
            if not employee:
                logger.warning(f"Employee {record.employee_id} not found for PayrollRecord {record.id}")
                continue

            # PDF 생성
            pdf_bytes = PDFGenerator.generate_payroll_statement_pdf(record, employee, period)

            # ZIP에 추가
            # 파일명: 정산서_[직원ID]_[직원명].pdf
            filename = f"정산서_{employee.id}_{employee.name}.pdf"
            zip_file.writestr(filename, pdf_bytes)

            logger.info(f"Added PDF for Employee {employee.id} ({employee.name}) to ZIP")

    # ZIP 파일명 생성
    zip_filename = f"정산서_{period.period_start}_{period.period_end}.zip"

    # ZIP 응답
    zip_buffer.seek(0)
    return StreamingResponse(
        iter([zip_buffer.getvalue()]),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=\"{zip_filename}\""
        }
    )
