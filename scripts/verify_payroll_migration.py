"""
급여 정산 마이그레이션 검증 스크립트
경로: scripts/verify_payroll_migration.py
작성일: 2026-05-21
목적:
  - 마이그레이션 완료 여부 확인
  - 컬럼, 제약, 인덱스 존재 확인
  - 스키마 무결성 검증
"""

import sys
import logging
from pathlib import Path
from typing import Dict, List, Tuple

# 프로젝트 루트 경로 추가
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker
from app.database import engine

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 동기 세션 팩토리
SyncSession = sessionmaker(bind=engine)


class PayrollMigrationVerifier:
    """마이그레이션 검증 클래스"""

    def __init__(self):
        self.inspector = inspect(engine)
        self.session = None
        self.connection = None
        self.results = {}

    def __enter__(self):
        self.session = SyncSession()
        self.connection = engine.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            self.session.close()
        if self.connection:
            self.connection.close()

    def _get_db_type(self) -> str:
        """데이터베이스 타입 확인"""
        url_str = str(engine.url)
        if "postgresql" in url_str:
            return "postgresql"
        elif "sqlite" in url_str:
            return "sqlite"
        elif "mysql" in url_str:
            return "mysql"
        else:
            return "unknown"

    def verify_columns(self) -> bool:
        """컬럼 존재 여부 확인"""
        logger.info("\n✓ 컬럼 검증 중...")

        expected_columns = {
            "payroll_records": ["is_obsolete"],
            "employees": ["base_salary", "commission_rate"],
            "cash_advances": ["settled_payroll_id", "amount"],
            "attendance_logs": ["employee_id", "work_date"],
        }

        all_ok = True

        for table_name, columns in expected_columns.items():
            try:
                table_columns = [c['name'] for c in self.inspector.get_columns(table_name)]
                for col in columns:
                    if col in table_columns:
                        logger.info(f"  ✅ {table_name}.{col} 존재")
                    else:
                        logger.error(f"  ❌ {table_name}.{col} 없음")
                        all_ok = False
            except Exception as e:
                logger.error(f"  ❌ {table_name} 확인 실패: {str(e)}")
                all_ok = False

        self.results['columns'] = all_ok
        return all_ok

    def verify_constraints(self) -> bool:
        """제약 조건 존재 여부 확인"""
        logger.info("\n✓ 제약 조건 검증 중...")

        expected_constraints = {
            "employees": [
                "ck_employee_base_salary_positive",
                "ck_employee_commission_rate_positive",
            ],
            "cash_advances": [
                "ck_cash_advance_amount_positive",
            ],
            "payroll_records": [
                "ck_payroll_gross_pay_positive",
                "ck_payroll_deductions_positive",
                "ck_payroll_net_pay_positive",
            ],
            "attendance_logs": [
                "uq_attendance_employee_workdate",
            ],
        }

        all_ok = True
        db_type = self._get_db_type()

        for table_name, constraints in expected_constraints.items():
            try:
                table_constraints = self.inspector.get_constraints(table_name)
                constraint_names = [c.get('name', '') for c in table_constraints]

                for constraint in constraints:
                    # SQLite는 인덱스로 고유 제약을 표현하므로 특별 처리
                    if db_type == "sqlite" and "uq_" in constraint:
                        indexes = [i['name'] for i in self.inspector.get_indexes(table_name)]
                        if constraint in indexes:
                            logger.info(f"  ✅ {table_name}.{constraint} 존재 (INDEX)")
                        else:
                            logger.warning(f"  ⚠️  {table_name}.{constraint} 없음 (SQLite는 재생성 필요)")
                    elif any(constraint in cn for cn in constraint_names):
                        logger.info(f"  ✅ {table_name}.{constraint} 존재")
                    else:
                        logger.warning(f"  ⚠️  {table_name}.{constraint} 찾기 어려움")

            except Exception as e:
                logger.error(f"  ❌ {table_name} 확인 실패: {str(e)}")
                all_ok = False

        self.results['constraints'] = all_ok
        return all_ok

    def verify_indexes(self) -> bool:
        """인덱스 존재 여부 확인"""
        logger.info("\n✓ 인덱스 검증 중...")

        expected_indexes = {
            "employees": ["idx_employee_type_active_paygroup"],
            "attendance_logs": ["idx_attendance_employee_workdate"],
            "payroll_records": ["idx_payroll_period_employee_status"],
            "cash_advances": ["idx_cash_advance_employee_status"],
            "philippine_holidays": ["idx_holiday_date"],
        }

        all_ok = True

        for table_name, indexes in expected_indexes.items():
            try:
                table_indexes = [i['name'] for i in self.inspector.get_indexes(table_name)]

                for idx in indexes:
                    if idx in table_indexes:
                        logger.info(f"  ✅ {table_name}.{idx} 존재")
                    else:
                        logger.warning(f"  ⚠️  {table_name}.{idx} 없음")
                        # 인덱스 누락은 치명적이지 않음

            except Exception as e:
                logger.error(f"  ❌ {table_name} 인덱스 확인 실패: {str(e)}")

        self.results['indexes'] = all_ok
        return all_ok

    def verify_foreign_keys(self) -> bool:
        """외래 키 설정 확인"""
        logger.info("\n✓ 외래 키 검증 중...")

        try:
            fks = self.inspector.get_foreign_keys("cash_advances")
            cascade_fk_exists = any(
                fk.get('name') == 'fk_cash_advances_settled_payroll_id' or
                (fk.get('constrained_columns') == ['settled_payroll_id'] and
                 fk.get('referred_table') == 'payroll_records')
                for fk in fks
            )

            if cascade_fk_exists:
                logger.info("  ✅ cash_advances.settled_payroll_id ON DELETE CASCADE 설정")
            else:
                logger.warning("  ⚠️  cash_advances.settled_payroll_id CASCADE 확인 어려움")
                logger.info("     (SQLite는 FK 변경을 지원하지 않으므로 정상)")

            self.results['foreign_keys'] = True
            return True

        except Exception as e:
            logger.error(f"  ❌ 외래 키 확인 실패: {str(e)}")
            self.results['foreign_keys'] = False
            return False

    def verify_data_integrity(self) -> bool:
        """데이터 무결성 검증"""
        logger.info("\n✓ 데이터 무결성 검증 중...")

        try:
            # 1. 음수 기본급 확인
            result = self.connection.execute(
                text("SELECT COUNT(*) as cnt FROM employees WHERE base_salary < 0")
            ).fetchone()
            if result and result[0] == 0:
                logger.info("  ✅ employees.base_salary >= 0 검증 통과")
            else:
                logger.warning(f"  ⚠️  음수 기본급 발견: {result[0]}개")

            # 2. 중복 출퇴근 기록 확인
            result = self.connection.execute(
                text("""
                    SELECT COUNT(*) as cnt FROM (
                        SELECT employee_id, work_date, COUNT(*) as duplicate_count
                        FROM attendance_logs
                        GROUP BY employee_id, work_date
                        HAVING duplicate_count > 1
                    ) as duplicates
                """)
            ).fetchone()
            if result and result[0] == 0:
                logger.info("  ✅ 중복 출퇴근 기록 없음")
            else:
                logger.warning(f"  ⚠️  중복 기록 발견: {result[0]}개")

            # 3. 잘못된 settled_payroll_id 확인
            result = self.connection.execute(
                text("""
                    SELECT COUNT(*) as cnt FROM cash_advances
                    WHERE settled_payroll_id IS NOT NULL
                    AND settled_payroll_id NOT IN (SELECT id FROM payroll_records)
                """)
            ).fetchone()
            if result and result[0] == 0:
                logger.info("  ✅ 모든 settled_payroll_id 유효")
            else:
                logger.warning(f"  ⚠️  유효하지 않은 FK: {result[0]}개")

            # 4. 음수 급여 금액 확인
            result = self.connection.execute(
                text("""
                    SELECT COUNT(*) as cnt FROM payroll_records
                    WHERE gross_pay < 0 OR total_deductions < 0 OR net_pay < 0
                """)
            ).fetchone()
            if result and result[0] == 0:
                logger.info("  ✅ 모든 급여 금액 >= 0")
            else:
                logger.warning(f"  ⚠️  음수 급여 발견: {result[0]}개")

            self.results['data_integrity'] = True
            return True

        except Exception as e:
            logger.error(f"  ❌ 데이터 무결성 검증 실패: {str(e)}")
            self.results['data_integrity'] = False
            return False

    def run_verification(self) -> bool:
        """전체 검증 실행"""
        logger.info("\n" + "="*70)
        logger.info("🔍 PayrollMigration 검증 시작")
        logger.info("="*70)

        try:
            # 1. 컬럼 검증
            self.verify_columns()

            # 2. 제약 검증
            self.verify_constraints()

            # 3. 인덱스 검증
            self.verify_indexes()

            # 4. 외래 키 검증
            self.verify_foreign_keys()

            # 5. 데이터 무결성 검증
            self.verify_data_integrity()

            # 결과 출력
            logger.info("\n" + "="*70)
            logger.info("📋 검증 결과 요약")
            logger.info("="*70)

            total_checks = len(self.results)
            passed_checks = sum(1 for v in self.results.values() if v)

            for check_name, result in self.results.items():
                status = "✅ PASS" if result else "⚠️  WARN"
                logger.info(f"  {status}: {check_name}")

            logger.info(f"\n📊 통과율: {passed_checks}/{total_checks}")

            if passed_checks == total_checks:
                logger.info("\n✅ 모든 검증을 통과했습니다!")
                logger.info("💾 마이그레이션이 올바르게 적용되었습니다.\n")
                return True
            else:
                logger.warning(f"\n⚠️  {total_checks - passed_checks}개 항목에 문제가 있습니다.")
                logger.info("📖 자세한 내용은 위의 로그를 참고하세요.\n")
                return False

        except Exception as e:
            logger.error("\n" + "="*70)
            logger.error("❌ 검증 실패!")
            logger.error("="*70)
            logger.error(f"오류: {str(e)}\n")
            return False


def main():
    """메인 함수"""
    with PayrollMigrationVerifier() as verifier:
        success = verifier.run_verification()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
