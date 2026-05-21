"""
급여 정산 API 라우터
경로: app/routers/payroll.py
작성일: 2026-05-21
엔드포인트: /api/payroll/*
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.payroll import (
    Employee, PayrollPeriod, PayrollRecord, CashAdvance,
    AttendanceLog, PhilippineHoliday, PayGroup, EmployeeType,
    PayrollStatus, CashAdvanceStatus, HolidayType
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

@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """직원 신규 등록"""
    employee = Employee(**payload.dict())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/employees", response_model=List[EmployeeResponse])
async def list_employees(
    skip: int = 0,
    limit: int = 100,
    employee_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """직원 목록 조회"""
    query = db.query(Employee)
    if employee_type:
        query = query.filter(Employee.employee_type == employee_type)
    return query.offset(skip).limit(limit).all()


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """직원 상세 조회"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    payload: EmployeeCreate,
    db: Session = Depends(get_db)
):
    """직원 정보 수정"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    for key, value in payload.dict().items():
        setattr(employee, key, value)

    employee.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}", status_code=204)
async def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """직원 삭제 (비활성화)"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다")

    employee.is_active = False
    employee.updated_at = datetime.utcnow()
    db.commit()


# ============================================================
# CashAdvance (CA) CRUD
# ============================================================

@router.post("/cash-advance", response_model=CashAdvanceResponse)
async def create_cash_advance(payload: CashAdvanceCreate, db: Session = Depends(get_db)):
    """CA 신청"""
    ca = CashAdvance(**payload.dict())
    db.add(ca)
    db.commit()
    db.refresh(ca)
    return ca


@router.get("/cash-advance", response_model=List[CashAdvanceResponse])
async def list_cash_advances(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """CA 목록"""
    query = db.query(CashAdvance)
    if status:
        query = query.filter(CashAdvance.status == status)
    return query.offset(skip).limit(limit).all()


@router.put("/cash-advance/{ca_id}", response_model=CashAdvanceResponse)
async def update_cash_advance_status(
    ca_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """CA 상태 변경 (승인/거절)"""
    ca = db.query(CashAdvance).filter(CashAdvance.id == ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="CA를 찾을 수 없습니다")

    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="유효하지 않은 상태입니다")

    ca.status = status
    ca.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ca)
    return ca


# ============================================================
# AttendanceLog (출퇴근) CRUD
# ============================================================

@router.post("/attendance", response_model=AttendanceLogResponse)
async def create_attendance_log(payload: AttendanceLogCreate, db: Session = Depends(get_db)):
    """출퇴근 기록 입력"""
    # late_minutes, overtime_minutes 자동 계산 (임시)
    log = AttendanceLog(**payload.dict())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/attendance", response_model=List[AttendanceLogResponse])
async def list_attendance_logs(
    work_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """출퇴근 기록 조회"""
    query = db.query(AttendanceLog)
    if work_date:
        query = query.filter(AttendanceLog.work_date == work_date)
    if employee_id:
        query = query.filter(AttendanceLog.employee_id == employee_id)
    return query.offset(skip).limit(limit).all()


@router.put("/attendance/{log_id}", response_model=AttendanceLogResponse)
async def update_attendance_log(
    log_id: int,
    payload: AttendanceLogCreate,
    db: Session = Depends(get_db)
):
    """출퇴근 기록 수정"""
    log = db.query(AttendanceLog).filter(AttendanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="출퇴근 기록을 찾을 수 없습니다")

    for key, value in payload.dict().items():
        setattr(log, key, value)

    log.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(log)
    return log


# ============================================================
# PhilippineHoliday (공휴일) CRUD
# ============================================================

@router.post("/holidays", response_model=PhilippineHolidayResponse)
async def create_holiday(payload: PhilippineHolidayCreate, db: Session = Depends(get_db)):
    """공휴일 등록"""
    holiday = PhilippineHoliday(**payload.dict())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday


@router.get("/holidays", response_model=List[PhilippineHolidayResponse])
async def list_holidays(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """공휴일 목록"""
    return db.query(PhilippineHoliday).offset(skip).limit(limit).all()


@router.delete("/holidays/{holiday_id}", status_code=204)
async def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    """공휴일 삭제"""
    holiday = db.query(PhilippineHoliday).filter(PhilippineHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="공휴일을 찾을 수 없습니다")

    db.delete(holiday)
    db.commit()


# ============================================================
# PayrollPeriod (정산 기간) CRUD
# ============================================================

@router.post("/periods", response_model=PayrollPeriodResponse)
async def create_payroll_period(payload: PayrollPeriodCreate, db: Session = Depends(get_db)):
    """정산 기간 생성"""
    if payload.period_start >= payload.period_end:
        raise HTTPException(status_code=400, detail="기간 설정이 잘못되었습니다")

    period = PayrollPeriod(**payload.dict())
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


@router.get("/periods", response_model=List[PayrollPeriodResponse])
async def list_payroll_periods(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """정산 기간 목록"""
    return db.query(PayrollPeriod).offset(skip).limit(limit).all()


@router.get("/periods/{period_id}", response_model=PayrollPeriodResponse)
async def get_payroll_period(period_id: int, db: Session = Depends(get_db)):
    """정산 기간 상세"""
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")
    return period


# ============================================================
# PayrollRecord (정산 결과) — 계산 & 조회
# ============================================================

@router.post("/periods/{period_id}/calculate", response_model=List[PayrollRecordResponse])
async def calculate_payroll(period_id: int, db: Session = Depends(get_db)):
    """
    급여 계산 실행
    정산 기간의 모든 직원 급여 자동 계산
    """
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # 기존 PayrollRecord 삭제 (재계산 용도)
    db.query(PayrollRecord).filter(
        PayrollRecord.payroll_period_id == period_id
    ).delete()

    # 급여 계산
    records = PayrollCalculator.calculate_payroll_for_period(period, db)

    # 데이터베이스 저장
    for record in records:
        db.add(record)

    db.commit()

    # 저장된 records 다시 조회 (id 등 자동 생성값 포함)
    saved_records = db.query(PayrollRecord).filter(
        PayrollRecord.payroll_period_id == period_id
    ).all()

    return saved_records


@router.get("/records", response_model=List[PayrollRecordResponse])
async def list_payroll_records(
    payroll_period_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """정산 결과 목록"""
    query = db.query(PayrollRecord)
    if payroll_period_id:
        query = query.filter(PayrollRecord.payroll_period_id == payroll_period_id)
    if employee_id:
        query = query.filter(PayrollRecord.employee_id == employee_id)
    return query.offset(skip).limit(limit).all()


@router.get("/records/{record_id}", response_model=PayrollRecordResponse)
async def get_payroll_record(record_id: int, db: Session = Depends(get_db)):
    """정산 결과 상세 조회"""
    record = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="정산 결과를 찾을 수 없습니다")
    return record


@router.post("/periods/{period_id}/approve", response_model=PayrollPeriodResponse)
async def approve_payroll_period(period_id: int, db: Session = Depends(get_db)):
    """정산 승인"""
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="정산 기간을 찾을 수 없습니다")

    # 정산 기간 상태 변경
    period.status = "approved"
    period.updated_at = datetime.utcnow()

    # 관련 PayrollRecord도 approved로 변경
    db.query(PayrollRecord).filter(
        PayrollRecord.payroll_period_id == period_id
    ).update({"status": "approved"})

    db.commit()
    db.refresh(period)
    return period
