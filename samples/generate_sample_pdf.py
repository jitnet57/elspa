#!/usr/bin/env python3
"""
샘플 PDF 정산서 생성 스크립트
경로: samples/generate_sample_pdf.py
작성일: 2026-05-22

Phase 8-3 Wave 3-1: PDF 정산서 생성 테스트
- 샘플 데이터를 사용하여 PDF 생성
- 로컬 환경에서 PDF 생성 테스트 가능
- 생성된 PDF를 samples/ 디렉토리에 저장

사용 방법:
  python samples/generate_sample_pdf.py

생성 파일:
  samples/정산서_1_2026-05-01_2026-05-07.pdf
  samples/정산서_2_2026-05-08_2026-05-14.pdf
"""

import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services.pdf_generator import PDFGenerator
from app.models.payroll import Employee, PayrollRecord, PayrollPeriod, EmployeeType, PayGroup


def generate_sample_pdfs():
    """샘플 PDF 생성"""

    samples_dir = Path(__file__).parent
    samples_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("PDF 정산서 샘플 생성 시작")
    print("=" * 60)

    # 샘플 데이터 1: 치료사 (커미션 + 차감 포함)
    print("\n[1/2] 샘플 1: 치료사 (Juan Dela Cruz) PDF 생성 중...")

    period1 = PayrollPeriod(
        id=1,
        period_start=date(2026, 5, 1),
        period_end=date(2026, 5, 7),
        pay_group=PayGroup.WEEKLY,
        status="draft",
    )

    employee1 = Employee(
        id=1,
        name="Juan Dela Cruz",
        phone="09171234567",
        employee_type=EmployeeType.THERAPIST,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("10000.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2025, 1, 15),
        is_active=True,
    )

    record1 = PayrollRecord(
        id=1,
        payroll_period_id=1,
        employee_id=1,
        # 수입
        base_amount=Decimal("10000.00"),
        commission_amount=Decimal("500.00"),
        overtime_amount=Decimal("140.00"),
        holiday_bonus=Decimal("1333.33"),
        meal_allowance=Decimal("0.00"),
        # 차감
        late_deduction=Decimal("50.00"),
        absence_deduction=Decimal("0.00"),
        sss_deduction=Decimal("0.00"),
        ca_deduction=Decimal("500.00"),
        health_check_deduction=Decimal("500.00"),
        thirteenth_month_deduction=Decimal("3333.33"),
        thirteenth_month_accrual=Decimal("3333.33"),
        # 최종
        gross_pay=Decimal("11973.33"),
        total_deductions=Decimal("4383.33"),
        net_pay=Decimal("7590.00"),
        status="draft",
        notes="Regular weekly settlement for therapist Juan",
    )

    try:
        pdf_bytes = PDFGenerator.generate_payroll_statement_pdf(record1, employee1, period1)
        pdf_path1 = samples_dir / "정산서_1_2026-05-01_2026-05-07.pdf"
        pdf_path1.write_bytes(pdf_bytes)
        print(f"   ✓ 생성 완료: {pdf_path1.name} ({len(pdf_bytes):,} bytes)")
    except Exception as e:
        print(f"   ✗ 생성 실패: {e}")
        return False

    # 샘플 데이터 2: 드라이버 (최소 차감)
    print("[2/2] 샘플 2: 드라이버 (Maria Santos) PDF 생성 중...")

    period2 = PayrollPeriod(
        id=2,
        period_start=date(2026, 5, 8),
        period_end=date(2026, 5, 14),
        pay_group=PayGroup.BIWEEKLY,
        status="draft",
    )

    employee2 = Employee(
        id=2,
        name="Maria Santos",
        phone="09179876543",
        employee_type=EmployeeType.DRIVER,
        pay_group=PayGroup.BIWEEKLY,
        base_salary=Decimal("12000.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2024, 6, 1),
        is_active=True,
    )

    record2 = PayrollRecord(
        id=2,
        payroll_period_id=2,
        employee_id=2,
        # 수입
        base_amount=Decimal("12000.00"),
        commission_amount=Decimal("0.00"),
        overtime_amount=Decimal("70.00"),
        holiday_bonus=Decimal("0.00"),
        meal_allowance=Decimal("200.00"),
        # 차감
        late_deduction=Decimal("0.00"),
        absence_deduction=Decimal("0.00"),
        sss_deduction=Decimal("0.00"),
        ca_deduction=Decimal("0.00"),
        health_check_deduction=Decimal("0.00"),
        thirteenth_month_deduction=Decimal("0.00"),
        thirteenth_month_accrual=Decimal("0.00"),
        # 최종
        gross_pay=Decimal("12270.00"),
        total_deductions=Decimal("0.00"),
        net_pay=Decimal("12270.00"),
        status="approved",
        notes="Driver payroll - no deductions this period",
    )

    try:
        pdf_bytes = PDFGenerator.generate_payroll_statement_pdf(record2, employee2, period2)
        pdf_path2 = samples_dir / "정산서_2_2026-05-08_2026-05-14.pdf"
        pdf_path2.write_bytes(pdf_bytes)
        print(f"   ✓ 생성 완료: {pdf_path2.name} ({len(pdf_bytes):,} bytes)")
    except Exception as e:
        print(f"   ✗ 생성 실패: {e}")
        return False

    # 샘플 데이터 3: 치료사 (모든 차감 항목 포함)
    print("[추가] 샘플 3: 치료사 (Rosa Garcia) - 복합 차감 PDF 생성 중...")

    period3 = PayrollPeriod(
        id=3,
        period_start=date(2026, 4, 15),
        period_end=date(2026, 4, 21),
        pay_group=PayGroup.WEEKLY,
        status="draft",
    )

    employee3 = Employee(
        id=3,
        name="Rosa Garcia",
        phone="09215551234",
        employee_type=EmployeeType.THERAPIST,
        pay_group=PayGroup.WEEKLY,
        base_salary=Decimal("11000.00"),
        commission_rate=Decimal("0.00"),
        hire_date=date(2025, 2, 1),
        is_active=True,
    )

    record3 = PayrollRecord(
        id=3,
        payroll_period_id=3,
        employee_id=3,
        # 수입
        base_amount=Decimal("11000.00"),
        commission_amount=Decimal("800.00"),
        overtime_amount=Decimal("70.00"),
        holiday_bonus=Decimal("733.33"),
        meal_allowance=Decimal("0.00"),
        # 모든 차감 항목
        late_deduction=Decimal("100.00"),
        absence_deduction=Decimal("0.00"),
        sss_deduction=Decimal("250.00"),
        ca_deduction=Decimal("1000.00"),
        health_check_deduction=Decimal("500.00"),
        thirteenth_month_deduction=Decimal("3000.00"),
        thirteenth_month_accrual=Decimal("3000.00"),
        # 최종
        gross_pay=Decimal("12603.33"),
        total_deductions=Decimal("4850.00"),
        net_pay=Decimal("7753.33"),
        status="draft",
        notes="Complex deductions - late arrival, CA, health check, 13th month",
    )

    try:
        pdf_bytes = PDFGenerator.generate_payroll_statement_pdf(record3, employee3, period3)
        pdf_path3 = samples_dir / "정산서_3_2026-04-15_2026-04-21.pdf"
        pdf_path3.write_bytes(pdf_bytes)
        print(f"   ✓ 생성 완료: {pdf_path3.name} ({len(pdf_bytes):,} bytes)")
    except Exception as e:
        print(f"   ✗ 생성 실패: {e}")
        return False

    print("\n" + "=" * 60)
    print("✓ 모든 샘플 PDF 생성 완료!")
    print("=" * 60)
    print(f"\n생성 위치: {samples_dir.absolute()}/")
    print("\n생성된 파일:")
    print("  - 정산서_1_2026-05-01_2026-05-07.pdf (치료사, 커미션 + 차감)")
    print("  - 정산서_2_2026-05-08_2026-05-14.pdf (드라이버, 최소 차감)")
    print("  - 정산서_3_2026-04-15_2026-04-21.pdf (치료사, 복합 차감)")
    print("\n참고:")
    print("  - 모든 PDF는 A4 레이아웃으로 생성됩니다.")
    print("  - 실제 환경에서는 /api/payroll/records/{id}/pdf 엔드포인트를 사용하세요.")
    print("  - /api/payroll/periods/{id}/pdf-export 엔드포인트로 ZIP 일괄 내보내기 가능합니다.")

    return True


if __name__ == "__main__":
    success = generate_sample_pdfs()
    sys.exit(0 if success else 1)
