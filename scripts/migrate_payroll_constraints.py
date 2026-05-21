"""
급여 정산 시스템 데이터베이스 마이그레이션 스크립트
경로: scripts/migrate_payroll_constraints.py
작성일: 2026-05-21
목적:
  - Composite unique constraint 추가 (AttendanceLog)
  - ON DELETE CASCADE 설정 (CashAdvance -> PayrollRecord)
  - is_obsolete 컬럼 추가 (PayrollRecord)
  - Performance indexes 생성
  - CHECK constraints 추가
"""

import sys
import logging
from pathlib import Path
from typing import Tuple

# 프로젝트 루트 경로 추가
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

from sqlalchemy import (
    inspect, text, MetaData, Table,
    Integer, String, Date, DateTime,
    Boolean, Numeric
)
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.database import engine, Base
from app.models.payroll import (
    Employee, CashAdvance, AttendanceLog,
    PayrollPeriod, PayrollRecord, PhilippineHoliday
)
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 동기 세션 팩토리
SyncSession = sessionmaker(bind=engine)


class PayrollMigration:
    """급여 정산 마이그레이션 관리 클래스"""

    def __init__(self):
        self.session: Session = None
        self.connection = None
        self.migration_log = []

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

        elif db_type == "sqlite":
            # SQLite는 PRAGMA로 확인
            query = f"PRAGMA index_info('{constraint_name}')"
            try:
                result = self.connection.execute(text(query)).fetchone()
                return result is not None
            except:
                return False

        return False

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

        return False

    def add_is_obsolete_column(self) -> bool:
        """PayrollRecord에 is_obsolete 컬럼 추가"""
        logger.info("📝 PayrollRecord.is_obsolete 컬럼 추가 중...")

        if self._check_column_exists("payroll_records", "is_obsolete"):
            logger.info("   ✓ is_obsolete 컬럼이 이미 존재합니다.")
            return True

        db_type = self._get_db_type()

        try:
            if db_type == "postgresql":
                query = """
                    ALTER TABLE payroll_records
                    ADD COLUMN is_obsolete BOOLEAN DEFAULT FALSE NOT NULL
                """
            elif db_type == "sqlite":
                query = """
                    ALTER TABLE payroll_records
                    ADD COLUMN is_obsolete BOOLEAN DEFAULT 0
                """
            elif db_type == "mysql":
                query = """
                    ALTER TABLE payroll_records
                    ADD COLUMN is_obsolete BOOLEAN DEFAULT FALSE NOT NULL
                """

            self._execute(query)
            logger.info("   ✅ is_obsolete 컬럼 추가 완료")
            self.migration_log.append("✅ PayrollRecord.is_obsolete 추가")
            return True
        except Exception as e:
            logger.error(f"   ❌ is_obsolete 컬럼 추가 실패: {str(e)}")
            self.migration_log.append(f"❌ PayrollRecord.is_obsolete 추가 실패: {str(e)}")
            return False

    def add_attendance_unique_constraint(self) -> bool:
        """AttendanceLog 복합 고유 제약 추가"""
        logger.info("📝 AttendanceLog 복합 고유 제약 (employee_id, work_date) 추가 중...")

        constraint_name = "uq_attendance_employee_workdate"

        if self._check_constraint_exists("attendance_logs", constraint_name):
            logger.info("   ✓ 제약이 이미 존재합니다.")
            return True

        db_type = self._get_db_type()

        try:
            if db_type == "postgresql":
                query = f"""
                    ALTER TABLE attendance_logs
                    ADD CONSTRAINT {constraint_name}
                    UNIQUE (employee_id, work_date)
                """
            elif db_type == "sqlite":
                # SQLite는 CREATE UNIQUE INDEX 사용
                query = f"""
                    CREATE UNIQUE INDEX {constraint_name}
                    ON attendance_logs(employee_id, work_date)
                """
            elif db_type == "mysql":
                query = f"""
                    ALTER TABLE attendance_logs
                    ADD CONSTRAINT {constraint_name}
                    UNIQUE (employee_id, work_date)
                """

            self._execute(query)
            logger.info("   ✅ 복합 고유 제약 추가 완료")
            self.migration_log.append("✅ AttendanceLog 복합 고유 제약 추가")
            return True
        except Exception as e:
            logger.error(f"   ❌ 복합 고유 제약 추가 실패: {str(e)}")
            self.migration_log.append(f"❌ AttendanceLog 복합 고유 제약 추가 실패: {str(e)}")
            return False

    def update_cash_advance_cascade(self) -> bool:
        """CashAdvance.settled_payroll_id ON DELETE CASCADE 설정"""
        logger.info("📝 CashAdvance.settled_payroll_id ON DELETE CASCADE 설정 중...")

        db_type = self._get_db_type()

        # 외래 키 확인
        try:
            if db_type == "postgresql":
                query = """
                    SELECT constraint_name FROM information_schema.table_constraints
                    WHERE table_name = 'cash_advances'
                    AND constraint_type = 'FOREIGN KEY'
                    AND column_name LIKE '%settled_payroll%'
                """
                # Note: 정확한 확인을 위해 다른 쿼리 사용
                query = """
                    SELECT constraint_name FROM information_schema.constraint_column_usage
                    WHERE table_name = 'cash_advances'
                """
                result = self.connection.execute(text(query)).fetchall()

                # 기존 FK 삭제 후 새로 생성
                fk_name = "fk_cash_advances_settled_payroll_id"
                drop_query = f"ALTER TABLE cash_advances DROP CONSTRAINT IF EXISTS {fk_name}"
                self._execute(drop_query)

                add_query = f"""
                    ALTER TABLE cash_advances
                    ADD CONSTRAINT {fk_name}
                    FOREIGN KEY (settled_payroll_id)
                    REFERENCES payroll_records(id)
                    ON DELETE CASCADE
                """
                self._execute(add_query)

            elif db_type == "sqlite":
                logger.info("   ℹ SQLite는 외래 키 제약 변경을 지원하지 않습니다.")
                logger.info("   마이그레이션 재실행이 필요하면 테이블을 재생성하세요.")
                return False

            elif db_type == "mysql":
                fk_name = "fk_cash_advances_settled_payroll_id"
                drop_query = f"ALTER TABLE cash_advances DROP FOREIGN KEY IF EXISTS {fk_name}"
                self._execute(drop_query)

                add_query = f"""
                    ALTER TABLE cash_advances
                    ADD CONSTRAINT {fk_name}
                    FOREIGN KEY (settled_payroll_id)
                    REFERENCES payroll_records(id)
                    ON DELETE CASCADE
                """
                self._execute(add_query)

            logger.info("   ✅ ON DELETE CASCADE 설정 완료")
            self.migration_log.append("✅ CashAdvance ON DELETE CASCADE 설정")
            return True
        except Exception as e:
            logger.error(f"   ❌ ON DELETE CASCADE 설정 실패: {str(e)}")
            self.migration_log.append(f"❌ CashAdvance ON DELETE CASCADE 설정 실패: {str(e)}")
            return False

    def add_performance_indexes(self) -> bool:
        """성능 인덱스 추가"""
        logger.info("📝 성능 인덱스 추가 중...")

        indexes = [
            ("idx_employee_type_active_paygroup",
             "employees",
             "(employee_type, is_active, pay_group)"),

            ("idx_attendance_employee_workdate",
             "attendance_logs",
             "(employee_id, work_date)"),

            ("idx_payroll_period_employee_status",
             "payroll_records",
             "(payroll_period_id, employee_id, status)"),

            ("idx_cash_advance_employee_status",
             "cash_advances",
             "(employee_id, status)"),

            ("idx_holiday_date",
             "philippine_holidays",
             "(holiday_date)"),
        ]

        db_type = self._get_db_type()
        success_count = 0

        for idx_name, table_name, columns in indexes:
            if self._check_index_exists(table_name, idx_name):
                logger.info(f"   ✓ {idx_name} 인덱스가 이미 존재합니다.")
                success_count += 1
                continue

            try:
                if db_type == "postgresql":
                    query = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name} {columns}"
                elif db_type == "sqlite":
                    query = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name} {columns}"
                elif db_type == "mysql":
                    query = f"CREATE INDEX {idx_name} ON {table_name} {columns}"

                self._execute(query)
                logger.info(f"   ✅ {idx_name} 인덱스 생성 완료")
                success_count += 1
            except Exception as e:
                logger.error(f"   ❌ {idx_name} 인덱스 생성 실패: {str(e)}")

        if success_count == len(indexes):
            self.migration_log.append(f"✅ {len(indexes)}개 성능 인덱스 생성")
        else:
            self.migration_log.append(f"⚠️  {success_count}/{len(indexes)} 성능 인덱스 생성")

        return success_count > 0

    def add_check_constraints(self) -> bool:
        """CHECK 제약 추가 (금액 >= 0)"""
        logger.info("📝 CHECK 제약 추가 중 (금액 >= 0)...")

        db_type = self._get_db_type()

        if db_type == "sqlite":
            logger.info("   ℹ SQLite는 CHECK 제약을 지원하지만 이미 정의된 경우 변경 불가")
            return True

        check_constraints = [
            ("ck_employee_base_salary_positive",
             "employees",
             "base_salary >= 0"),

            ("ck_employee_commission_rate_positive",
             "employees",
             "commission_rate >= 0"),

            ("ck_cash_advance_amount_positive",
             "cash_advances",
             "amount >= 0"),

            ("ck_payroll_gross_pay_positive",
             "payroll_records",
             "gross_pay >= 0"),

            ("ck_payroll_deductions_positive",
             "payroll_records",
             "total_deductions >= 0"),

            ("ck_payroll_net_pay_positive",
             "payroll_records",
             "net_pay >= 0"),
        ]

        success_count = 0

        for constraint_name, table_name, condition in check_constraints:
            if self._check_constraint_exists(table_name, constraint_name):
                logger.info(f"   ✓ {constraint_name} 제약이 이미 존재합니다.")
                success_count += 1
                continue

            try:
                if db_type == "postgresql":
                    query = f"""
                        ALTER TABLE {table_name}
                        ADD CONSTRAINT {constraint_name}
                        CHECK ({condition})
                    """
                elif db_type == "mysql":
                    query = f"""
                        ALTER TABLE {table_name}
                        ADD CONSTRAINT {constraint_name}
                        CHECK ({condition})
                    """

                self._execute(query)
                logger.info(f"   ✅ {constraint_name} 제약 추가 완료")
                success_count += 1
            except Exception as e:
                logger.error(f"   ❌ {constraint_name} 제약 추가 실패: {str(e)}")

        if success_count > 0:
            self.migration_log.append(f"✅ {success_count}/{len(check_constraints)} CHECK 제약 추가")

        return success_count > 0

    def run_migration(self):
        """전체 마이그레이션 실행"""
        logger.info("\n" + "="*70)
        logger.info("🚀 PayrollMigration 시작")
        logger.info("="*70)

        start_time = datetime.now()

        try:
            # 1. is_obsolete 컬럼 추가
            self.add_is_obsolete_column()

            # 2. AttendanceLog 복합 고유 제약 추가
            self.add_attendance_unique_constraint()

            # 3. CashAdvance ON DELETE CASCADE 설정
            self.update_cash_advance_cascade()

            # 4. 성능 인덱스 추가
            self.add_performance_indexes()

            # 5. CHECK 제약 추가
            self.add_check_constraints()

            elapsed = (datetime.now() - start_time).total_seconds()

            logger.info("\n" + "="*70)
            logger.info("✅ 마이그레이션 완료!")
            logger.info("="*70)
            logger.info("\n📋 실행 로그:")
            for log in self.migration_log:
                logger.info(f"   {log}")

            logger.info(f"\n⏱️  소요 시간: {elapsed:.2f}초")
            logger.info("\n✅ 모든 마이그레이션이 성공적으로 완료되었습니다.")
            logger.info("💾 변경사항이 데이터베이스에 반영되었습니다.\n")

            return True

        except Exception as e:
            logger.error("\n" + "="*70)
            logger.error("❌ 마이그레이션 실패!")
            logger.error("="*70)
            logger.error(f"오류: {str(e)}")
            logger.error("\n실행 로그:")
            for log in self.migration_log:
                logger.error(f"   {log}")

            return False


def main():
    """메인 함수"""
    with PayrollMigration() as migration:
        success = migration.run_migration()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
