"""
PDF 정산서 생성 엔진
경로: app/services/pdf_generator.py
작성일: 2026-05-22

Phase 8-3 Wave 3-1: PDF 정산서 생성
- reportlab을 사용한 정산서 PDF 생성
- A4 레이아웃 (210mm x 297mm)
- 한글 폰트 지원 (기본 기본 폰트, 추후 NotoSansCJK 추가 가능)
- 직원 정보, 수입 항목, 차감 항목, 최종 금액 포함
"""

from io import BytesIO
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import HexColor, grey, black
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfgen import canvas
from typing import Optional

from app.models.payroll import PayrollRecord, Employee, PayrollPeriod


class PDFGenerator:
    """PDF 정산서 생성기"""

    # 레이아웃 설정 (A4)
    PAGE_WIDTH = 210 * mm
    PAGE_HEIGHT = 297 * mm
    MARGIN = 15 * mm
    AVAILABLE_WIDTH = PAGE_WIDTH - (2 * MARGIN)

    # 색상 정의
    COLOR_HEADER = HexColor("#2C3E50")  # 진한 회색-파랑
    COLOR_SUBHEADER = HexColor("#34495E")  # 진한 회색
    COLOR_BORDER = HexColor("#BDC3C7")  # 밝은 회색
    COLOR_ACCENT = HexColor("#3498DB")  # 파랑

    @staticmethod
    def generate_payroll_statement_pdf(
        payroll_record: PayrollRecord,
        employee: Employee,
        payroll_period: PayrollPeriod
    ) -> bytes:
        """
        단일 직원의 정산서 PDF 생성

        Args:
            payroll_record: 정산 결과 데이터
            employee: 직원 정보
            payroll_period: 정산 기간

        Returns:
            PDF 바이너리 데이터 (bytes)
        """
        # PDF 생성 (메모리 버퍼)
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=PDFGenerator.MARGIN,
            leftMargin=PDFGenerator.MARGIN,
            topMargin=PDFGenerator.MARGIN,
            bottomMargin=PDFGenerator.MARGIN,
            title="정산서",
            author="ElSpa Manager"
        )

        # 스타일 정의
        styles = getSampleStyleSheet()

        # 제목 스타일
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=PDFGenerator.COLOR_HEADER,
            spaceAfter=10,
            alignment=1,  # center
            fontName='Helvetica-Bold'
        )

        # 섹션 제목 스타일
        section_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=11,
            textColor=PDFGenerator.COLOR_SUBHEADER,
            spaceAfter=6,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        )

        # 일반 텍스트 스타일
        normal_style = ParagraphStyle(
            'Normal',
            parent=styles['Normal'],
            fontSize=9,
            spaceAfter=4,
            fontName='Helvetica'
        )

        # 문서 내용 구성
        elements = []

        # ============================================================
        # 1. 헤더 및 제목
        # ============================================================
        elements.append(Paragraph("급여 정산서", title_style))
        elements.append(Spacer(1, 8))

        # 발급 정보
        now = datetime.now()
        issue_date = f"{now.year}년 {now.month}월 {now.day}일 발급"
        elements.append(Paragraph(f"<font size=8>{issue_date}</font>", normal_style))
        elements.append(Spacer(1, 12))

        # ============================================================
        # 2. 직원 정보
        # ============================================================
        elements.append(Paragraph("직원 정보", section_style))

        employee_data = [
            ["항목", "내용"],
            ["이름", str(employee.name)],
            ["직종", str(employee.employee_type)],
            ["입사일", str(employee.hire_date)],
            ["정산 기간", f"{payroll_period.period_start} ~ {payroll_period.period_end}"],
        ]

        employee_table = Table(employee_data, colWidths=[PDFGenerator.AVAILABLE_WIDTH * 0.25, PDFGenerator.AVAILABLE_WIDTH * 0.75])
        employee_table.setStyle(TableStyle([
            # 헤더
            ('BACKGROUND', (0, 0), (-1, 0), PDFGenerator.COLOR_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            # 데이터 행
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), ['white', HexColor('#F8F9FA')]),
            ('GRID', (0, 0), (-1, -1), 0.5, PDFGenerator.COLOR_BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(employee_table)
        elements.append(Spacer(1, 10))

        # ============================================================
        # 3. 수입 항목 (Income)
        # ============================================================
        elements.append(Paragraph("수입 항목 (Income)", section_style))

        income_data = [
            ["항목", "금액 (PHP)"],
            ["기본급", PDFGenerator._format_amount(payroll_record.base_amount)],
            ["커미션", PDFGenerator._format_amount(payroll_record.commission_amount)],
            ["초과근무 수당", PDFGenerator._format_amount(payroll_record.overtime_amount)],
            ["공휴일 가산", PDFGenerator._format_amount(payroll_record.holiday_bonus)],
            ["식대 (식사비)", PDFGenerator._format_amount(payroll_record.meal_allowance)],
            ["<b>소계 (Gross Pay)</b>", f"<b>{PDFGenerator._format_amount(payroll_record.gross_pay)}</b>"],
        ]

        income_table = Table(income_data, colWidths=[PDFGenerator.AVAILABLE_WIDTH * 0.65, PDFGenerator.AVAILABLE_WIDTH * 0.35])
        income_table.setStyle(TableStyle([
            # 헤더
            ('BACKGROUND', (0, 0), (-1, 0), PDFGenerator.COLOR_ACCENT),
            ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            # 데이터 행
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), ['white', HexColor('#F8F9FA')]),
            # 소계 행
            ('BACKGROUND', (0, -1), (-1, -1), HexColor('#E8F4F8')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, PDFGenerator.COLOR_BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(income_table)
        elements.append(Spacer(1, 10))

        # ============================================================
        # 4. 차감 항목 (Deductions)
        # ============================================================
        elements.append(Paragraph("차감 항목 (Deductions)", section_style))

        # 차감 항목 동적 생성 (0이 아닌 항목만 표시)
        deduction_items = [
            ["항목", "금액 (PHP)"],
        ]

        if payroll_record.late_deduction > 0:
            deduction_items.append(["지각 차감", PDFGenerator._format_amount(payroll_record.late_deduction)])
        if payroll_record.absence_deduction > 0:
            deduction_items.append(["결근 차감", PDFGenerator._format_amount(payroll_record.absence_deduction)])
        if payroll_record.sss_deduction > 0:
            deduction_items.append(["SSS 선지급", PDFGenerator._format_amount(payroll_record.sss_deduction)])
        if payroll_record.ca_deduction > 0:
            deduction_items.append(["CA (선지급) 차감", PDFGenerator._format_amount(payroll_record.ca_deduction)])
        if payroll_record.health_check_deduction > 0:
            deduction_items.append(["보건소 검사비", PDFGenerator._format_amount(payroll_record.health_check_deduction)])
        if payroll_record.thirteenth_month_deduction > 0:
            deduction_items.append(["13개월 보너스 선지급", PDFGenerator._format_amount(payroll_record.thirteenth_month_deduction)])

        deduction_items.append(["<b>소계 (Total Deductions)</b>", f"<b>{PDFGenerator._format_amount(payroll_record.total_deductions)}</b>"])

        deduction_table = Table(deduction_items, colWidths=[PDFGenerator.AVAILABLE_WIDTH * 0.65, PDFGenerator.AVAILABLE_WIDTH * 0.35])
        deduction_table.setStyle(TableStyle([
            # 헤더
            ('BACKGROUND', (0, 0), (-1, 0), HexColor("#E74C3C")),  # 빨강
            ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            # 데이터 행
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), ['white', HexColor('#FFF5F5')]),
            # 소계 행
            ('BACKGROUND', (0, -1), (-1, -1), HexColor('#FADBD8')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, PDFGenerator.COLOR_BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(deduction_table)
        elements.append(Spacer(1, 12))

        # ============================================================
        # 5. 최종 금액 (Summary)
        # ============================================================
        elements.append(Paragraph("최종 정산 금액", section_style))

        summary_data = [
            ["항목", "금액 (PHP)"],
            ["총 수입 (Gross Pay)", f"<b>{PDFGenerator._format_amount(payroll_record.gross_pay)}</b>"],
            ["총 차감 (Total Deductions)", f"<b>{PDFGenerator._format_amount(payroll_record.total_deductions)}</b>"],
            ["<b>순지급액 (Net Pay)</b>", f"<font color='#27AE60'><b>{PDFGenerator._format_amount(payroll_record.net_pay)}</b></font>"],
        ]

        summary_table = Table(summary_data, colWidths=[PDFGenerator.AVAILABLE_WIDTH * 0.65, PDFGenerator.AVAILABLE_WIDTH * 0.35])
        summary_table.setStyle(TableStyle([
            # 헤더
            ('BACKGROUND', (0, 0), (-1, 0), PDFGenerator.COLOR_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            # 데이터 행
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 1), (-1, -2), 8),
            ('FONTSIZE', (0, -1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), ['white', HexColor('#F8F9FA')]),
            # 순지급 행 (강조)
            ('BACKGROUND', (0, -1), (-1, -1), HexColor("#E8F8F5")),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, PDFGenerator.COLOR_BORDER),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        elements.append(summary_table)
        elements.append(Spacer(1, 15))

        # ============================================================
        # 6. 정산 상태 및 서명 영역
        # ============================================================
        status_text = f"<b>정산 상태:</b> {payroll_record.status.upper()}"
        elements.append(Paragraph(status_text, normal_style))

        if payroll_record.notes:
            elements.append(Paragraph(f"<b>비고:</b> {payroll_record.notes}", normal_style))

        elements.append(Spacer(1, 10))

        # 생성 정보
        generation_info = f"<font size=7>생성일시: {now.strftime('%Y-%m-%d %H:%M:%S')} | " \
                         f"정산 기록 ID: {payroll_record.id} | 직원 ID: {employee.id}</font>"
        elements.append(Paragraph(generation_info, normal_style))

        # PDF 작성
        doc.build(elements)

        # 바이너리 데이터 반환
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def _format_amount(amount: Decimal) -> str:
        """금액을 포맷팅 (1,234.56 형식)"""
        if amount is None:
            return "0.00"

        # Decimal을 float로 변환 후 포맷
        try:
            value = float(amount)
            return f"{value:,.2f}"
        except (ValueError, TypeError):
            return "0.00"
