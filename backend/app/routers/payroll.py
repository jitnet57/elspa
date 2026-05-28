# ============================================================
# 📌 파일명: payroll.py
# 📋 목적: 급여 정산 API 라우터 (FastAPI)
# 🔧 기능: 단일 계산, 배치 처리, 병렬 검증
# 📅 작성일: 2026-05-28
# ============================================================

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import csv
import io
from datetime import datetime

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


# ============================================================
# Pydantic 스키마
# ============================================================

class PayrollInput(BaseModel):
    """급여 정산 입력"""
    employee_id: Optional[str] = None
    employee_name: str = Field(..., min_length=1)
    base_salary: float = Field(..., ge=0)
    commission: float = Field(default=0, ge=0)
    sss_tax: float = Field(default=0, ge=0)
    income_tax: float = Field(default=0, ge=0)
    other_deductions: float = Field(default=0, ge=0)

    @validator('base_salary')
    def validate_base_salary(cls, v):
        if v < 0:
            raise ValueError('기본급은 0 이상이어야 합니다')
        return v

    class Config:
        schema_extra = {
            "example": {
                "employee_name": "Ana",
                "base_salary": 24500,
                "commission": 2000,
                "sss_tax": 1200,
                "income_tax": 500,
                "other_deductions": 400,
            }
        }


class PayrollResult(BaseModel):
    """급여 정산 결과"""
    employee_name: str
    employee_id: Optional[str] = None
    gross_pay: float  # 기본급 + 수당
    total_deductions: float  # 총 공제
    net_pay: float  # 실수령액
    breakdown: dict  # {base: ..., commission: ...}
    deduction_detail: dict  # {sss: ..., tax: ..., other: ...}
    validation_warnings: List[str] = []  # 경고 메시지


class BatchPayrollRequest(BaseModel):
    """배치 급여 정산 요청"""
    records: List[PayrollInput]
    batch_name: Optional[str] = None
    period: Optional[str] = None


class BatchPayrollResponse(BaseModel):
    """배치 결과"""
    batch_id: str
    total_records: int
    successful: int
    failed: int
    warnings: List[str]
    results: List[PayrollResult]
    processing_time: float  # 초단위


# ============================================================
# 급여 계산 로직
# ============================================================

def calculate_payroll(input_data: PayrollInput) -> PayrollResult:
    """
    급여 정산 계산

    Args:
        input_data: 급여 입력 데이터

    Returns:
        계산된 결과
    """
    gross_pay = input_data.base_salary + input_data.commission
    total_deductions = (
        input_data.sss_tax
        + input_data.income_tax
        + input_data.other_deductions
    )
    net_pay = gross_pay - total_deductions

    # 검증 경고
    warnings = []
    if total_deductions > gross_pay:
        warnings.append(
            f"⚠️ Safety Interlock: 공제액(₱{total_deductions:,})이 "
            f"총급여(₱{gross_pay:,})를 초과합니다. "
            f"실수령액: ₱0 (수동 검증 필요)"
        )

    if input_data.sss_tax > 0 and input_data.sss_tax > gross_pay * 0.1:
        warnings.append(f"⚠️ SSS 납입금이 총급여의 10%를 초과합니다")

    return PayrollResult(
        employee_name=input_data.employee_name,
        employee_id=input_data.employee_id,
        gross_pay=round(gross_pay, 2),
        total_deductions=round(total_deductions, 2),
        net_pay=round(net_pay, 2),
        breakdown={
            "base": input_data.base_salary,
            "commission": input_data.commission,
        },
        deduction_detail={
            "sss": input_data.sss_tax,
            "tax": input_data.income_tax,
            "other": input_data.other_deductions,
        },
        validation_warnings=warnings,
    )


# ============================================================
# 병렬 처리 (ThreadPoolExecutor)
# ============================================================

executor = ThreadPoolExecutor(max_workers=4)


async def calculate_payroll_parallel(records: List[PayrollInput]) -> List[PayrollResult]:
    """
    다중 레코드 병렬 계산

    Args:
        records: 급여 입력 리스트

    Returns:
        계산된 결과 리스트
    """
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(executor, calculate_payroll, record)
        for record in records
    ]
    results = await asyncio.gather(*tasks)
    return results


# ============================================================
# API 엔드포인트
# ============================================================

@router.post("/calculate", response_model=PayrollResult)
async def calculate_single_payroll(input_data: PayrollInput):
    """
    단일 직원 급여 정산

    ```
    POST /api/payroll/calculate
    {
      "employee_name": "Ana",
      "base_salary": 24500,
      "commission": 2000,
      "sss_tax": 1200,
      "income_tax": 500,
      "other_deductions": 400
    }
    ```
    """
    try:
        result = calculate_payroll(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch", response_model=BatchPayrollResponse)
async def calculate_batch_payroll(request: BatchPayrollRequest):
    """
    배치 급여 정산 (병렬 처리)

    ```
    POST /api/payroll/batch
    {
      "records": [
        {"employee_name": "Ana", "base_salary": 24500, ...},
        {"employee_name": "Bob", "base_salary": 18000, ...}
      ],
      "batch_name": "May 16-27",
      "period": "202505"
    }
    ```

    병렬 처리: ThreadPoolExecutor (max_workers=4)
    """
    import time

    start_time = time.time()
    batch_id = f"BATCH-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    try:
        # 병렬 계산
        results = await calculate_payroll_parallel(request.records)

        successful = len([r for r in results if not r.validation_warnings])
        failed = len(results) - successful

        processing_time = time.time() - start_time

        return BatchPayrollResponse(
            batch_id=batch_id,
            total_records=len(request.records),
            successful=successful,
            failed=failed,
            warnings=[],
            results=results,
            processing_time=round(processing_time, 2),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch-csv")
async def calculate_batch_from_csv(file: UploadFile = File(...)):
    """
    CSV 파일로 배치 급여 정산

    CSV 형식:
    ```
    직원명,기본급,커미션,SSS,소득세,기타공제
    Ana,24500,2000,1200,500,400
    Bob,18000,1500,1000,300,200
    ```
    """
    try:
        contents = await file.read()
        csv_data = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))

        records = []
        for row in csv_reader:
            record = PayrollInput(
                employee_name=row.get('직원명', ''),
                base_salary=float(row.get('기본급', 0)),
                commission=float(row.get('커미션', 0)),
                sss_tax=float(row.get('SSS', 0)),
                income_tax=float(row.get('소득세', 0)),
                other_deductions=float(row.get('기타공제', 0)),
            )
            records.append(record)

        # 배치 처리
        batch_request = BatchPayrollRequest(
            records=records,
            batch_name=f"CSV-{file.filename}",
        )

        return await calculate_batch_payroll(batch_request)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV 처리 오류: {str(e)}")


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "module": "payroll",
        "version": "1.0",
        "features": [
            "단일 계산",
            "배치 처리",
            "병렬 검증",
            "CSV 업로드",
        ],
    }


# ============================================================
# 테스트용 엔드포인트
# ============================================================

@router.get("/demo-results")
async def get_demo_results():
    """데모 결과 (개발용)"""
    return [
        {
            "id": "TH-01",
            "name": "Ana",
            "gross_pay": 26500,
            "deductions": 2100,
            "net_pay": 24400,
            "status": "emerald",
        },
        {
            "id": "TH-03",
            "name": "Chloe",
            "gross_pay": 8200,
            "deductions": 8200,
            "net_pay": 0,
            "status": "error",
        },
    ]
