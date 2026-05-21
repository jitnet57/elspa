"""
급여 정산 마이그레이션 롤백 스크립트
경로: scripts/rollback_payroll_constraints.py
작성일: 2026-05-21
목적:
  - migrate_payroll_constraints.py의 변경사항 롤백
  - 인덱스 제거, 제약 조건 제거, 컬럼 제거 (선택적)
  - 거래 처리 및 안전성 보장
"""

import sys
import logging
from pathlib import Path
from typing import List, Tuple
from datetime import datetime

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


class PayrollRollback:
    """급여 정산 마이그레이션 롤백 관리 클래스"""

    def __init__(self):
        self.session = None
        self.connection = None
        self.rollback_log = []

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

    def _execute(self, query: str, params: dict = None) -> any:
        """SQL 실행"""
        try:
            if params:
                result = self.connection.execute(text(query), params)
            else:
                result = self.connection.execute(text(query))
            self.connection.commit()
            return result
        except Exception as e:
            self.connection.rollback()
            logger.error(f"❌ SQL 실행 오류: {str(e)}")
            logger.error(f"   Query: {query}")
            raise

    def _check_index_exists(self, table_name: str, index_name: str) -> bool:
        """인덱스 존재 여부 확인"""
        db_type = self._get_db_type()

        if db_type == "postgresql":
            query = """
                SELECT indexname FROM pg_indexes
                WHERE tablename = :table_name AND indexname = :index_name
            """
            result = self.connection.execute(
                text(query),
                {"table_name": table_name, "index_name": index_name}
            ).fetchone()
            return result is not None

        elif db_type == "sqlite":
            query = f"PRAGMA index_info('{index_name}')"
            try:
                result = self.connection.execute(text(query)).fetchone()
                return result is not None
            except:
                return False

        elif db_type == "mysql":
            query = """
                SELECT index_name FROM information_schema.statistics
                WHERE table_name = :table_name AND index_name = :index_name
            """
            result = self.connection.execute(
                text(query),
                {"table_name": table_name, "index_name": index_name}
            ).fetchone()
            return result is not None

        return False

    def _check_column_exists(self, table_name: str, column_name: str) -> bool:
        """컬럼 존재 여부 확인"""
        db_type = self._get_db_type()

        if db_type == "postgresql":
            query = """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = :table_name AND column_name = :column_name
            """
            result = self.connection.execute(
                text(query),
                {"table_name": table_name, "column_name": column_name}
            ).fetchone()
            return result is not None

        elif db_type == "sqlite":
            query = f"PRAGMA table_info({table_name})"
            results = self.connection.execute(text(query)).fetchall()
            return any(row[1] == column_name for row in results)

        elif db_type == "mysql":
            query = """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = :table_name AND column_name = :column_name
            """
            result = self.connection.execute(
                text(query),
                {"table_name": table_name, "column_name": column_name}
            ).fetchone()
            return result is not None

        return False

    def _check_constraint_exists(self, table_name: str, constraint_name: str) -> bool:
        """제약 조건 존재 여부 확인"""
        db_type = self._get_db_type()

        if db_type == "postgresql":
            query = """
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = :table_name AND constraint_name = :constraint_name
            """
            result = self.connection.execute(
                text(query),
                {"table_name": table_name, "constraint_name": constraint_name}
            ).fetchone()
            return result is not None

        elif db_type == "mysql":
            query = """
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = :table_name AND constraint_name = :constraint_name
            """
            result = self.connection.execute(
                text(query),
                {"table_name": table_name, "constraint_name": constraint_name}
            ).fetchone()
            return result is not None

        return False

    def remove_performance_indexes(self) -> bool:
        """성능 인덱스 제거"""
        logger.info("📝 성능 인덱스 제거 중...")

        indexes = [
            ("idx_employee_type_active_paygroup", "employees"),
            ("idx_attendance_employee_workdate", "attendance_logs"),
            ("idx_payroll_period_employee_status", "payroll_records"),
            ("idx_cash_advance_employee_status", "cash_advances"),
            ("idx_holiday_date", "philippine_holidays"),
        ]

        db_type = self._get_db_type()
        success_count = 0

        for idx_name, table_name in indexes:
            if not self._check_index_exists(table_name, idx_name):
                logger.info(f"   ℹ {idx_name} 인덱스가 존재하지 않습니다.")
                success_count += 1
                continue

            try:
                if db_type == "postgresql":
                    query = f"DROP INDEX IF EXISTS {idx_name}"
                elif db_type == "sqlite":
                    query = f"DROP INDEX IF EXISTS {idx_name}"
                elif db_type == "mysql":
                    query = f"DROP INDEX {idx_name} ON {table_name}"

                self._execute(query)
                logger.info(f"   ✅ {idx_name} 인덱스 제거 완료")
                success_count += 1
            except Exception as e:
                logger.error(f"   ❌ {idx_name} 인덱스 제거 실패: {str(e)}")

        if success_count == len(indexes):
            self.rollback_log.append(f"✅ {len(indexes)}개 성능 인덱스 제거")
        else:
            self.rollback_log.append(f"⚠️  {success_count}/{len(indexes)} 성능 인덱스 제거")

        return success_count > 0

    def remove_check_constraints(self) -> bool:
        """CHECK 제약 제거"""
        logger.info("📝 CHECK 제약 제거 중...")

        db_type = self._get_db_type()

        if db_type == "sqlite":
            logger.info("   ℹ SQLite는 제약 변경을 지원하지 않습니다.")
            logger.info("   테이블 재생성이 필요합니다.")
            return False

        check_constraints = [
            ("ck_employee_base_salary_positive", "employees"),
            ("ck_employee_commission_rate_positive", "employees"),
            ("ck_cash_advance_amount_positive", "cash_advances"),
            ("ck_payroll_gross_pay_positive", "payroll_records"),
            ("ck_payroll_deductions_positive", "payroll_records"),
            ("ck_payroll_net_pay_positive", "payroll_records"),
        ]

        success_count = 0

        for constraint_name, table_name in check_constraints:
            if not self._check_constraint_exists(table_name, constraint_name):
                logger.info(f"   ℹ {constraint_name} 제약이 존재하지 않습니다.")
                success_count += 1
                continue

            try:
                if db_type == "postgresql":
                    query = f"""
                        ALTER TABLE {table_name}
                        DROP CONSTRAINT IF EXISTS {constraint_name}
                    """
                elif db_type == "mysql":
                    query = f"""
                        ALTER TABLE {table_name}
                        DROP CONSTRAINT {constraint_name}
                    """

                self._execute(query)
                logger.info(f"   ✅ {constraint_name} 제약 제거 완료")
                success_count += 1
            except Exception as e:
                logger.error(f"   ❌ {constraint_name} 제약 제거 실패: {str(e)}")

        if success_count > 0:
            self.rollback_log.append(f"✅ {success_count}/{len(check_constraints)} CHECK 제약 제거")

        return success_count > 0

    def remove_attendance_unique_constraint(self) -> bool:
        """AttendanceLog 복합 고유 제약 제거"""
        logger.info("📝 AttendanceLog 복합 고유 제약 제거 중...")

        constraint_name = "uq_attendance_employee_workdate"
        db_type = self._get_db_type()

        if not self._check_constraint_exists("attendance_logs", constraint_name):
            logger.info("   ℹ 제약이 존재하지 않습니다.")
            return True

        try:
            if db_type == "postgresql":
                query = f"""
                    ALTER TABLE attendance_logs
                    DROP CONSTRAINT IF EXISTS {constraint_name}
                """
            elif db_type == "sqlite":
                # SQLite는 인덱스 삭제
                query = f"DROP INDEX IF EXISTS {constraint_name}"
            elif db_type == "mysql":
                query = f"""
                    ALTER TABLE attendance_logs
                    DROP INDEX {constraint_name}
                """

            self._execute(query)
            logger.info("   ✅ 복합 고유 제약 제거 완료")
            self.rollback_log.append("✅ AttendanceLog 복합 고유 제약 제거")
            return True
        except Exception as e:
            logger.error(f"   ❌ 복합 고유 제약 제거 실패: {str(e)}")
            self.rollback_log.append(f"❌ AttendanceLog 복합 고유 제약 제거 실패: {str(e)}")
            return False

    def remove_is_obsolete_column(self, remove_data: bool = False) -> bool:
        """
        PayrollRecord의 is_obsolete 컬럼 제거

        Args:
            remove_data: True인 경우 컬럼 제거, False인 경우 유지
        """
        if not remove_data:
            logger.info("⏭️  is_obsolete 컬럼 제거 스킵 (백업 목적으로 유지)")
            logger.info("   컬럼을 제거하려면 --remove-obsolete 옵션 사용")
            return True

        logger.info("📝 PayrollRecord.is_obsolete 컬럼 제거 중...")

        if not self._check_column_exists("payroll_records", "is_obsolete"):
            logger.info("   ℹ is_obsolete 컬럼이 존재하지 않습니다.")
            return True

        db_type = self._get_db_type()

        try:
            if db_type == "postgresql":
                query = "ALTER TABLE payroll_records DROP COLUMN IF EXISTS is_obsolete"
            elif db_type == "sqlite":
                logger.warning("   ⚠️  SQLite는 컬럼 삭제를 지원하지 않습니다.")
                logger.warning("   테이블 재생성이 필요합니다.")
                return False
            elif db_type == "mysql":
                query = "ALTER TABLE payroll_records DROP COLUMN is_obsolete"

            self._execute(query)
            logger.info("   ✅ is_obsolete 컬럼 제거 완료")
            self.rollback_log.append("✅ PayrollRecord.is_obsolete 제거")
            return True
        except Exception as e:
            logger.error(f"   ❌ is_obsolete 컬럼 제거 실패: {str(e)}")
            self.rollback_log.append(f"❌ PayrollRecord.is_obsolete 제거 실패: {str(e)}")
            return False

    def run_rollback(self, remove_data: bool = False):
        """전체 롤백 실행"""
        logger.info("\n" + "="*70)
        logger.info("🔄 PayrollRollback 시작")
        logger.info("="*70)

        start_time = datetime.now()

        try:
            # 1. 성능 인덱스 제거
            self.remove_performance_indexes()

            # 2. CHECK 제약 제거
            self.remove_check_constraints()

            # 3. AttendanceLog 복합 고유 제약 제거
            self.remove_attendance_unique_constraint()

            # 4. is_obsolete 컬럼 제거 (선택적)
            self.remove_is_obsolete_column(remove_data)

            elapsed = (datetime.now() - start_time).total_seconds()

            logger.info("\n" + "="*70)
            logger.info("✅ 롤백 완료!")
            logger.info("="*70)
            logger.info("\n📋 실행 로그:")
            for log in self.rollback_log:
                logger.info(f"   {log}")

            logger.info(f"\n⏱️  소요 시간: {elapsed:.2f}초")
            logger.info("\n✅ 롤백이 성공적으로 완료되었습니다.")
            logger.info("💾 변경사항이 데이터베이스에서 제거되었습니다.\n")

            return True

        except Exception as e:
            logger.error("\n" + "="*70)
            logger.error("❌ 롤백 실패!")
            logger.error("="*70)
            logger.error(f"오류: {str(e)}")
            logger.error("\n실행 로그:")
            for log in self.rollback_log:
                logger.error(f"   {log}")

            return False


def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description="PayrollMigration 롤백 스크립트"
    )
    parser.add_argument(
        "--remove-obsolete",
        action="store_true",
        help="is_obsolete 컬럼도 제거 (기본값: 유지)"
    )

    args = parser.parse_args()

    with PayrollRollback() as rollback:
        success = rollback.run_rollback(remove_data=args.remove_obsolete)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
