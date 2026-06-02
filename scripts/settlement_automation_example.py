"""
============================================================
📌 월간 정산 자동화 - 사용 예제
📋 목적: monthly_settlement_automation.py 사용법 시연
📅 작성일: 2026-06-02
설명:
  - 기본 사용법
  - 커스텀 설정
  - 보고서 분석
============================================================
"""

import sys
from pathlib import Path
from datetime import datetime, date

# 프로젝트 모듈 임포트
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.monthly_settlement_automation import SettlementAutomation


def example_1_basic_usage():
    """
    예제 1: 기본 사용법

    현재 월의 정산을 처리하고 보고서 생성
    """
    print("\n" + "="*60)
    print("예제 1: 기본 사용법")
    print("="*60)

    automation = SettlementAutomation()

    # 현재 월 정산 실행
    result = automation.run_monthly_settlement()

    print(f"✓ 정산 완료")
    print(f"  기간: {result['period']}")
    print(f"  비회원 정산 처리: {result['guest_settlements']['processed']}건")
    print(f"  외상 정산 처리: {result['credit_settlements']['processed']}건")
    print(f"  Excel 보고서: {result['reports']['excel']}")
    print(f"  PDF 보고서: {result['reports']['pdf']}")

    return result


def example_2_specific_month():
    """
    예제 2: 특정 월 정산 처리

    2026년 5월 정산만 처리
    """
    print("\n" + "="*60)
    print("예제 2: 특정 월 정산 처리")
    print("="*60)

    automation = SettlementAutomation()

    # 2026년 5월 정산 실행
    result = automation.run_monthly_settlement(
        year=2026,
        month=5
    )

    print(f"✓ 2026-05 정산 완료")
    print(f"  처리된 정산: {result['guest_settlements']['processed'] + result['credit_settlements']['processed']}건")

    return result


def example_3_analysis():
    """
    예제 3: 정산 요약 분석

    생성된 보고서 데이터를 분석
    """
    print("\n" + "="*60)
    print("예제 3: 정산 요약 분석")
    print("="*60)

    automation = SettlementAutomation()
    result = automation.run_monthly_settlement()

    if result['summary']:
        summary = result['summary']

        print(f"\n정산 기간: {summary['period']}")
        print(f"생성일: {summary['generated_at']}")
        print(f"\n━━━━━ 요약 ━━━━━")
        print(f"총 업체 수: {summary['total_companies']}개")
        print(f"총 매출액: ₱{summary['total_revenue']:,.2f}")
        print(f"  ├─ 비회원: ₱{summary['total_guest_revenue']:,.2f}")
        print(f"  ├─ 외상: ₱{summary['total_credit_revenue']:,.2f}")
        print(f"  └─ 제외: ₱{summary['total_waived_revenue']:,.2f}")
        print(f"플랫폼 수수료: ₱{summary['total_platform_fee']:,.2f}")
        print(f"차감액: ₱{summary['total_deductions']:,.2f}")
        print(f"순정산액: ₱{summary['total_net_settlement']:,.2f}")

        print(f"\n━━━━━ 업체별 상위 5개 ━━━━━")
        # 정산액 기준 상위 5개 정렬
        top_companies = sorted(
            summary['companies'],
            key=lambda x: x['net_settlement'],
            reverse=True
        )[:5]

        for i, company in enumerate(top_companies, 1):
            print(f"\n{i}. 업체 ID {company['company_id']}")
            print(f"   정산액: ₱{company['net_settlement']:,.2f}")
            print(f"   매출액: ₱{company['total_revenue']:,.2f}")
            print(f"   상태: {company['status']}")

    return result


def example_4_custom_automation():
    """
    예제 4: 커스텀 자동화

    특정 회사만 처리하거나, 특정 조건으로 필터링
    """
    print("\n" + "="*60)
    print("예제 4: 커스텀 자동화")
    print("="*60)

    from app.database import SessionLocal_sync
    from app.models.company_settlement import CompanySettlement

    automation = SettlementAutomation()
    db = SessionLocal_sync()

    try:
        # 특정 조건으로 정산 조회
        today = date.today()
        year, month = today.year, today.month

        # 방법 1: 비회원 정산 중 특정 금액 이상만 처리
        print("\n[필터링 예제] 순정산액이 50,000 이상인 정산만 처리")

        settlements = db.query(CompanySettlement).filter(
            CompanySettlement.settlement_period_year == year,
            CompanySettlement.settlement_period_month == month,
            CompanySettlement.status.in_(["draft", "pending"]),
            CompanySettlement.net_settlement >= 50000  # ← 필터
        ).all()

        print(f"필터링된 정산: {len(settlements)}건")

        if settlements:
            # 선택적 처리
            count, results = automation.mark_settlements_as_settled(
                settlements,
                payment_method="bank_transfer",
                paid_by="custom_automation"
            )
            print(f"✓ {count}건 처리 완료")

        # 방법 2: 정산 요약만 생성 (처리 안 함)
        print("\n[분석 전용] 정산을 처리하지 않고 요약만 생성")

        all_settlements = db.query(CompanySettlement).filter(
            CompanySettlement.settlement_period_year == year,
            CompanySettlement.settlement_period_month == month
        ).all()

        if all_settlements:
            summary = automation.generate_settlement_summary(
                all_settlements,
                year,
                month
            )
            print(f"✓ {len(all_settlements)}건 요약 생성")
            print(f"  총정산액: ₱{summary['total_net_settlement']:,.2f}")

    finally:
        db.close()

    return None


def example_5_report_generation():
    """
    예제 5: 보고서만 생성

    이미 처리된 정산의 보고서를 다시 생성
    """
    print("\n" + "="*60)
    print("예제 5: 보고서만 생성")
    print("="*60)

    from app.database import SessionLocal_sync
    from app.models.company_settlement import CompanySettlement

    automation = SettlementAutomation()
    db = SessionLocal_sync()

    try:
        # 지난 달 settled 정산들
        today = date.today()
        year, month = today.year, today.month - 1

        if month == 0:
            month = 12
            year -= 1

        settlements = db.query(CompanySettlement).filter(
            CompanySettlement.settlement_period_year == year,
            CompanySettlement.settlement_period_month == month,
            CompanySettlement.status == "settled"
        ).all()

        print(f"\n처리된 정산: {len(settlements)}건 (from {year}-{month:02d})")

        if settlements:
            # 요약 생성
            summary = automation.generate_settlement_summary(
                settlements,
                year,
                month
            )

            # Excel 보고서
            excel_file = automation.generate_excel_report(summary)
            print(f"✓ Excel: {excel_file}")

            # PDF 보고서
            pdf_file = automation.generate_pdf_report(summary)
            print(f"✓ PDF: {pdf_file}")

    finally:
        db.close()

    return None


def example_6_error_handling():
    """
    예제 6: 에러 처리

    예외 상황 처리 및 로깅
    """
    print("\n" + "="*60)
    print("예제 6: 에러 처리")
    print("="*60)

    automation = SettlementAutomation()

    try:
        # 실행
        result = automation.run_monthly_settlement()

        # 결과 검증
        if not result['success']:
            print(f"⚠️ 정산 실패")
            print(f"  에러: {result.get('error', 'Unknown')}")
            return

        # 부분 실패 확인
        guest_failed = sum(
            1 for r in result['guest_settlements']['details']
            if r.get('status') in ['failed', 'error']
        )

        if guest_failed > 0:
            print(f"⚠️ 비회원 정산 일부 실패: {guest_failed}건")
            for detail in result['guest_settlements']['details']:
                if detail.get('status') in ['failed', 'error']:
                    print(f"  - Settlement {detail['settlement_id']}: {detail.get('reason')}")

        print(f"✓ 정산 완료 (에러 없음)")

    except Exception as e:
        print(f"✗ 예외 발생: {str(e)}")
        import traceback
        traceback.print_exc()


def example_7_batch_processing():
    """
    예제 7: 배치 처리

    여러 달을 한꺼번에 처리
    """
    print("\n" + "="*60)
    print("예제 7: 배치 처리")
    print("="*60)

    from datetime import datetime, timedelta

    automation = SettlementAutomation()

    # 지난 3개월 처리
    today = date.today()
    results = []

    for month_offset in [3, 2, 1]:
        target_date = today.replace(day=1) - timedelta(days=month_offset*30)
        year = target_date.year
        month = target_date.month

        print(f"\n처리 중: {year}-{month:02d}...")

        result = automation.run_monthly_settlement(
            year=year,
            month=month,
            generate_reports=False  # 보고서는 마지막에만 생성
        )

        results.append(result)

        print(f"  ✓ 비회원: {result['guest_settlements']['processed']}건")
        print(f"  ✓ 외상: {result['credit_settlements']['processed']}건")

    # 최종 요약
    total_guest = sum(r['guest_settlements']['processed'] for r in results)
    total_credit = sum(r['credit_settlements']['processed'] for r in results)

    print(f"\n━━━━━ 배치 처리 완료 ━━━━━")
    print(f"총 비회원 정산: {total_guest}건")
    print(f"총 외상 정산: {total_credit}건")
    print(f"총 처리: {total_guest + total_credit}건")


# ============================================================
# 메인 실행
# ============================================================

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════╗
║   월간 정산 자동화 - 사용 예제                         ║
║   monthly_settlement_automation.py                    ║
╚════════════════════════════════════════════════════════╝

사용 가능한 예제:
  1. 기본 사용법
  2. 특정 월 정산
  3. 정산 요약 분석
  4. 커스텀 자동화
  5. 보고서 생성
  6. 에러 처리
  7. 배치 처리

모든 예제 실행: python settlement_automation_example.py

각 예제만 실행:
  python settlement_automation_example.py 1
  python settlement_automation_example.py 2
  ...
    """)

    import sys

    # 선택 처리
    if len(sys.argv) > 1:
        choice = sys.argv[1]

        examples = {
            '1': example_1_basic_usage,
            '2': example_2_specific_month,
            '3': example_3_analysis,
            '4': example_4_custom_automation,
            '5': example_5_report_generation,
            '6': example_6_error_handling,
            '7': example_7_batch_processing,
        }

        if choice in examples:
            try:
                examples[choice]()
            except Exception as e:
                print(f"\n✗ 에러: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print(f"✗ 잘못된 선택: {choice}")
    else:
        # 모든 예제 실행
        try:
            example_1_basic_usage()
            example_2_specific_month()
            example_3_analysis()
            example_4_custom_automation()
            example_5_report_generation()
            example_6_error_handling()
            example_7_batch_processing()
        except Exception as e:
            print(f"\n✗ 에러: {str(e)}")
            import traceback
            traceback.print_exc()
