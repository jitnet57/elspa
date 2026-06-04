"""
업체 정산 API — FastAPI 라우터
경로: app/routers/company_settlement.py
작성일: 2026-06-02
엔드포인트: 정산 계산, 조회, 승인, 지급
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import date
from decimal import Decimal
from typing import List, Optional

from app.database import get_db
from app.services.settlement_engine import (
    SettlementCalculator,
    SettlementRepository,
)
from app.models.company_settlement import CompanySettlement, SettlementTransaction


# ============================================================
# Pydantic Schemas
# ============================================================

class SettlementRevenueSchema(BaseModel):
    """매출 분류"""
    total: Decimal = Field(..., description="총 매출")
    guest: Decimal = Field(..., description="비회원 매출")
    credit: Decimal = Field(..., description="외상 매출")
    waived: Decimal = Field(..., description="제외 매출")


class SettlementRecoverySchema(BaseModel):
    """외상 회수"""
    credit_revenue: Decimal = Field(..., description="외상 매출")
    recovery_rate: Decimal = Field(..., description="회수율 (%)")
    recovered_amount: Decimal = Field(..., description="회수액")


class SettlementFeeSchema(BaseModel):
    """수수료"""
    base_amount: Decimal = Field(..., description="수수료 기준액")
    platform_fee_rate: Decimal = Field(..., description="수수료율 (%)")
    platform_fee: Decimal = Field(..., description="수수료액")


class SettlementDeductionSchema(BaseModel):
    """차감액"""
    refund: Decimal = Field(default=0, description="환불액")
    dispute: Decimal = Field(default=0, description="분쟁 차감")
    other: Decimal = Field(default=0, description="기타 차감")
    total: Decimal = Field(..., description="총 차감")


class SettlementTransactionSchema(BaseModel):
    """거래 기록"""
    booking_id: Optional[int]
    customer_id: Optional[int]
    transaction_type: str
    settlement_category: str
    amount: Decimal
    recovery_rate: Decimal
    transaction_date: date
    notes: Optional[str] = None


class CompanySettlementCreateRequestSchema(BaseModel):
    """정산 계산 요청"""
    company_id: int = Field(..., description="업체 ID")
    year: int = Field(..., description="정산 연도")
    month: int = Field(..., ge=1, le=12, description="정산 월 (1-12)")


class CompanySettlementResponseSchema(BaseModel):
    """정산 조회 응답"""
    id: int
    company_id: int
    settlement_period_year: int
    settlement_period_month: int
    revenue: SettlementRevenueSchema
    recovery: SettlementRecoverySchema
    fee: SettlementFeeSchema
    deductions: SettlementDeductionSchema
    net_settlement: Decimal
    status: str
    settlement_date: Optional[date] = None
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    paid_by: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class SettlementApprovalSchema(BaseModel):
    """정산 승인 요청"""
    approved_by: str = Field(..., description="승인자")
    notes: Optional[str] = None


class SettlementPaymentSchema(BaseModel):
    """지급 요청"""
    payment_method: str = Field(..., description="지급 방법")
    payment_date: date = Field(..., description="지급일")
    paid_by: str = Field(..., description="지급자")
    notes: Optional[str] = None


class RecoveryRateUpdateSchema(BaseModel):
    """회수율 갱신 요청"""
    recovery_rate: Decimal = Field(..., ge=0, le=100, description="회수율 (%)")
    updated_by: str = Field(..., description="갱신자")
    notes: Optional[str] = None


# ============================================================
# API Router
# ============================================================

router = APIRouter(
    prefix="/api/settlements/company",
    tags=["company_settlements"],
)


@router.post(
    "/calculate",
    response_model=CompanySettlementResponseSchema,
    summary="정산 계산",
    description="월간 정산액 자동 계산 및 생성"
)
async def calculate_settlement(
    request: CompanySettlementCreateRequestSchema,
    db: Session = Depends(get_db)
) -> CompanySettlementResponseSchema:
    """
    월간 정산액을 자동 계산하여 저장합니다.

    Process:
      1. 대상 기간의 예약 수집
      2. settlement_type 자동 판정
      3. 매출 분류 (guest, credit, waived)
      4. 회수액 계산
      5. 수수료 계산
      6. 차감액 조회
      7. 최종 정산액 계산
      8. 거래 기록 저장
      9. 상태: DRAFT

    Args:
        request: 정산 요청
        db: 데이터베이스 세션

    Returns:
        CompanySettlementResponseSchema

    Raises:
        HTTPException: 정산 이미 존재 또는 계산 오류
    """
    try:
        # 중복 확인
        repo = SettlementRepository(db)
        existing = repo.get_settlement(
            request.company_id,
            request.year,
            request.month
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Settlement for {request.year}-{request.month:02d} already exists"
            )

        # 정산 계산
        calculator = SettlementCalculator(db)
        calculation_result = calculator.calculate_settlement(
            request.company_id,
            request.year,
            request.month
        )

        # 저장
        settlement = repo.create_settlement(calculation_result)

        # 응답 구성
        return _settlement_to_response(settlement, db)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Settlement calculation failed: {str(e)}"
        )


@router.get(
    "/{company_id}/{year}/{month}",
    response_model=CompanySettlementResponseSchema,
    summary="정산 조회",
    description="특정 월의 업체 정산 정보 조회"
)
async def get_settlement(
    company_id: int,
    year: int,
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
) -> CompanySettlementResponseSchema:
    """
    특정 월의 업체 정산 정보를 조회합니다.

    Args:
        company_id: 업체 ID
        year: 정산 연도
        month: 정산 월 (1-12)
        db: 데이터베이스 세션

    Returns:
        CompanySettlementResponseSchema

    Raises:
        HTTPException: 정산 기록 없음
    """
    repo = SettlementRepository(db)
    settlement = repo.get_settlement(company_id, year, month)

    if not settlement:
        raise HTTPException(
            status_code=404,
            detail=f"Settlement not found for {company_id}/{year}/{month}"
        )

    return _settlement_to_response(settlement, db)


@router.get(
    "/{company_id}",
    response_model=List[CompanySettlementResponseSchema],
    summary="정산 목록",
    description="업체의 모든 정산 기록 조회"
)
async def list_settlements(
    company_id: int,
    status: Optional[str] = Query(None, description="상태 필터"),
    year: Optional[int] = Query(None, description="연도 필터"),
    db: Session = Depends(get_db)
) -> List[CompanySettlementResponseSchema]:
    """
    업체의 모든 정산 기록을 조회합니다.

    Query Parameters:
      - status: draft, approved, settled, rejected, confirmed
      - year: 특정 연도 필터

    Returns:
        CompanySettlementResponseSchema 리스트
    """
    query = db.query(CompanySettlement).filter(
        CompanySettlement.company_id == company_id
    )

    if status:
        query = query.filter(CompanySettlement.status == status)

    if year:
        query = query.filter(CompanySettlement.settlement_period_year == year)

    settlements = query.order_by(
        CompanySettlement.settlement_period_year.desc(),
        CompanySettlement.settlement_period_month.desc()
    ).all()

    return [_settlement_to_response(s, db) for s in settlements]


@router.patch(
    "/{settlement_id}/approve",
    response_model=CompanySettlementResponseSchema,
    summary="정산 승인",
    description="정산을 승인합니다 (상태: draft → approved)"
)
async def approve_settlement(
    settlement_id: int,
    request: SettlementApprovalSchema,
    db: Session = Depends(get_db)
) -> CompanySettlementResponseSchema:
    """
    정산을 승인합니다.

    Workflow:
      draft → approved

    Args:
        settlement_id: 정산 ID
        request: 승인 요청
        db: 데이터베이스 세션

    Returns:
        CompanySettlementResponseSchema

    Raises:
        HTTPException: 정산 없음 또는 상태 오류
    """
    settlement = db.query(CompanySettlement).filter(
        CompanySettlement.id == settlement_id
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    if settlement.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve settlement in {settlement.status} status"
        )

    repo = SettlementRepository(db)
    settlement = repo.approve_settlement(settlement_id, request.approved_by)

    if request.notes:
        settlement.notes = request.notes
        db.commit()

    return _settlement_to_response(settlement, db)


@router.patch(
    "/{settlement_id}/settle",
    response_model=CompanySettlementResponseSchema,
    summary="정산 지급",
    description="정산을 지급합니다 (상태: approved → settled)"
)
async def settle_payment(
    settlement_id: int,
    request: SettlementPaymentSchema,
    db: Session = Depends(get_db)
) -> CompanySettlementResponseSchema:
    """
    정산을 지급합니다.

    Workflow:
      approved → settled

    Args:
        settlement_id: 정산 ID
        request: 지급 요청
        db: 데이터베이스 세션

    Returns:
        CompanySettlementResponseSchema

    Raises:
        HTTPException: 정산 없음 또는 상태 오류
    """
    settlement = db.query(CompanySettlement).filter(
        CompanySettlement.id == settlement_id
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    if settlement.status != "approved":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot settle payment for settlement in {settlement.status} status"
        )

    repo = SettlementRepository(db)
    settlement = repo.settle_payment(
        settlement_id,
        request.payment_method,
        request.payment_date,
        request.paid_by
    )

    if request.notes:
        settlement.notes = request.notes
        db.commit()

    return _settlement_to_response(settlement, db)


@router.patch(
    "/{settlement_id}/recovery-rate",
    response_model=CompanySettlementResponseSchema,
    summary="회수율 갱신",
    description="외상 회수율을 수기로 갱신합니다"
)
async def update_recovery_rate(
    settlement_id: int,
    request: RecoveryRateUpdateSchema,
    db: Session = Depends(get_db)
) -> CompanySettlementResponseSchema:
    """
    외상 회수율을 수기로 갱신합니다.

    Effect:
      - recovery_rate 변경
      - recovered_amount 자동 재계산
      - net_settlement 자동 재계산

    Args:
        settlement_id: 정산 ID
        request: 회수율 갱신 요청
        db: 데이터베이스 세션

    Returns:
        CompanySettlementResponseSchema

    Raises:
        HTTPException: 정산 없음
    """
    repo = SettlementRepository(db)

    try:
        settlement = repo.update_recovery_rate(
            settlement_id,
            request.recovery_rate,
            request.updated_by
        )

        if request.notes:
            settlement.dispute_notes = (settlement.dispute_notes or "") + f"\n{request.notes}"
            db.commit()

        return _settlement_to_response(settlement, db)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/{settlement_id}/transactions",
    response_model=List[dict],
    summary="거래 기록",
    description="정산의 구성 거래 기록 조회"
)
async def get_transactions(
    settlement_id: int,
    db: Session = Depends(get_db)
) -> List[dict]:
    """
    정산의 구성 거래 기록을 조회합니다.

    거래 유형:
      - booking: 예약 매출
      - refund: 환불
      - dispute: 분쟁
      - adjustment: 조정

    Args:
        settlement_id: 정산 ID
        db: 데이터베이스 세션

    Returns:
        거래 기록 리스트

    Raises:
        HTTPException: 정산 없음
    """
    settlement = db.query(CompanySettlement).filter(
        CompanySettlement.id == settlement_id
    ).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    transactions = db.query(SettlementTransaction).filter(
        SettlementTransaction.company_settlement_id == settlement_id
    ).order_by(SettlementTransaction.transaction_date).all()

    return [
        {
            "id": t.id,
            "booking_id": t.booking_id,
            "customer_id": t.customer_id,
            "transaction_type": t.transaction_type,
            "settlement_category": t.settlement_category,
            "amount": str(t.amount),
            "recovery_rate": str(t.recovery_rate),
            "recovered_amount": str(t.recovered_amount),
            "transaction_date": t.transaction_date.isoformat(),
            "notes": t.notes,
            "created_at": t.created_at.isoformat(),
        }
        for t in transactions
    ]


# ============================================================
# Helper Functions
# ============================================================

def _settlement_to_response(
    settlement: CompanySettlement,
    db: Session
) -> CompanySettlementResponseSchema:
    """CompanySettlement 모델을 응답 스키마로 변환"""
    return CompanySettlementResponseSchema(
        id=settlement.id,
        company_id=settlement.company_id,
        settlement_period_year=settlement.settlement_period_year,
        settlement_period_month=settlement.settlement_period_month,
        revenue=SettlementRevenueSchema(
            total=settlement.total_revenue,
            guest=settlement.guest_revenue,
            credit=settlement.credit_revenue,
            waived=settlement.waived_revenue,
        ),
        recovery=SettlementRecoverySchema(
            credit_revenue=settlement.credit_revenue,
            recovery_rate=settlement.recovery_rate,
            recovered_amount=settlement.recovered_amount,
        ),
        fee=SettlementFeeSchema(
            base_amount=settlement.total_revenue - settlement.waived_revenue,
            platform_fee_rate=settlement.platform_fee_rate,
            platform_fee=settlement.platform_fee,
        ),
        deductions=SettlementDeductionSchema(
            refund=settlement.refund_amount,
            dispute=settlement.dispute_deduction,
            other=settlement.other_deduction,
            total=settlement.total_deductions,
        ),
        net_settlement=settlement.net_settlement,
        status=settlement.status,
        settlement_date=settlement.settlement_date,
        payment_method=settlement.payment_method,
        payment_date=settlement.payment_date,
        created_by=settlement.created_by,
        approved_by=settlement.approved_by,
        paid_by=settlement.paid_by,
        created_at=settlement.created_at.isoformat(),
        updated_at=settlement.updated_at.isoformat(),
    )
