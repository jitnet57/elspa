"""
급여 정산 API 라우터
경로: app/routers/payroll.py
작성일: 2026-05-21
엔드포인트: /api/payroll/*

BUG FIX #2: CA 정산 추적 (mark_cash_advances_as_settled)
BUG FIX #3: 상태 전환 검증 (approve_payroll_period)
"""

import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.payroll import (
    Employee, PayrollPeriod, PayrollRecord, CashAdvance,
    AttendanceLog, PhilippineHoliday
)
from app.services.payroll_calculator import PayrollCalculator
from app.schemas.payroll import (
    EmployeeCreate, EmployeeResponse,
    PayrollPeriodCreate, PayrollPeriodResponse,
    PayrollRecordResponse,
    CashAdvanceCreate, CashAdvanceResponse,
    AttendanceLogCreate, AttendanceLogResponse,
    PhilippineHolidayCreate, PhilippineHolidayResponse
)

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


# ============================================================
# Employee (직원 마스터) CRUD
# ============================================================

@router.post("/employees", response_model=EmployeeResponse, status_code=201)
async def create_employee(payload: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    employee = Employee(**payload.dict())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee


@router.get("/employees", response_model=List[EmployeeResponse])
async def list_employees(
    skip: int = 0,
    limit: int = 100,
    employee_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Employee)
    if employee_type:
        stmt = stmt.where(Employee.employee_type == employee_type)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    for key, value in payload.dict().items():
        setattr(employee, key, value)
    employee.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}", status_code=204)
async def delete_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    employee.is_active = False
    employee.updated_at = datetime.utcnow()
    await db.commit()


# ============================================================
# CashAdvance (CA) CRUD
# ============================================================

@router.post("/cash-advance", response_model=CashAdvanceResponse, status_code=201)
async def create_cash_advance(payload: CashAdvanceCreate, db: AsyncSession = Depends(get_db)):
    ca = CashAdvance(**payload.dict())
    db.add(ca)
    await db.commit()
    await db.refresh(ca)
    return ca


@router.get("/cash-advance", response_model=List[CashAdvanceResponse])
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


@router.put("/cash-advance/{ca_id}", response_model=CashAdvanceResponse)
async def update_cash_advance_status(
    ca_id: int,
    status: str,
    db: AsyncSession = Depends(get_db)
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
    return ca


# ============================================================
# AttendanceLog (출퇴근) CRUD
# ============================================================

@router.post("/attendance", response_model=AttendanceLogResponse, status_code=201)
async def create_attendance_log(payload: AttendanceLogCreate, db: AsyncSession = Depends(get_db)):
    log = AttendanceLog(**payload.dict())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/attendance", response_model=List[AttendanceLogResponse])
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


@router.put("/attendance/{log_id}", response_model=AttendanceLogResponse)
async def update_attendance_log(
    log_id: int,
    payload: AttendanceLogCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AttendanceLog).where(AttendanceLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="출퇴근 기록을 찾을 수 없습니다")

    for key, value in payload.dict().items():
        setattr(log, key, value)
    log.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(log)
    return log


# ============================================================
# PhilippineHoliday (공휴일) CRUD
# ============================================================

@router.post("/holidays", response_model=PhilippineHolidayResponse, status_code=201)
async def create_holiday(payload: PhilippineHolidayCreate, db: AsyncSession = Depends(get_db)):
    holiday = PhilippineHoliday(**payload.dict())
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    return holiday


@router.get("/holidays", response_model=List[PhilippineHolidayResponse])
async def list_holidays(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PhilippineHoliday).offset(skip).limit(limit))
    return result.scalars().all()


@router.delete("/holidays/{holiday_id}", status_code=204)
async def delete_holiday(holiday_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PhilippineHoliday).where(PhilippineHoliday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise HTTPException(status_code=404, detail="공휴일을 찾을 수 없습니다")

    await db.delete(holiday)
    await db.commit()


# ============================================================
# PayrollPeriod (정산 기간) CRUD
# ============================================================

@router.post("/periods", response_model=PayrollPeriodResponse, status_code=201)
async def create_payroll_period(payload: PayrollPeriodCreate, db: AsyncSession = Depends(get_db)):
    if payload.period_start >= payload.period_end:
        raise HTTPException(status_code=400, detail="기간 설정이 잘못되었습니다")

    period = PayrollPeriod(**payload.dict())
    db.add(period)
    await db.commit()
    await db.refresh(period)
    return period


@router.get("/periods", response_model=List[PayrollPeriodResponse])
async def list_payroll_periods(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PayrollPeriod).offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/periods/{period_id}", response_model=PayrollPeriodResponse)
async def get_payroll_period(period_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PayrollPeriod).where(PayrollPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")
    return period


# ============================================================
# PayrollRecord (정산 결과) — 계산 & 조회
# ============================================================

@router.post("/periods/{period_id}/calculate", response_model=List[PayrollRecordResponse])
async def calculate_payroll(period_id: int, db: AsyncSession = Depends(get_db)):
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

    result = await db.execute(
        select(PayrollRecord).where(PayrollRecord.payroll_period_id == period_id)
    )
    return result.scalars().all()


@router.get("/records", response_model=List[PayrollRecordResponse])
async def list_payroll_records(
    payroll_period_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PayrollRecord)
    if payroll_period_id:
        stmt = stmt.where(PayrollRecord.payroll_period_id == payroll_period_id)
    if employee_id:
        stmt = stmt.where(PayrollRecord.employee_id == employee_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/records/{record_id}", response_model=PayrollRecordResponse)
async def get_payroll_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PayrollRecord).where(PayrollRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="정산 결과를 찾을 수 없습니다")
    return record


@router.post("/periods/{period_id}/approve", response_model=PayrollPeriodResponse)
async def approve_payroll_period(period_id: int, db: AsyncSession = Depends(get_db)):
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
    return period
