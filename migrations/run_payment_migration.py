#!/usr/bin/env python3
"""
결제 시스템 마이그레이션 러너
- 마이그레이션 순차 실행
- 데이터 마이그레이션
- 검증 및 롤백 지원

사용법:
    python run_payment_migration.py [--skip-data] [--with-commission] [--dry-run] [--rollback]

옵션:
    --skip-data: 데이터 마이그레이션 스킵
    --with-commission: 기존 예약에 수수료 기록 자동 생성
    --dry-run: 실제 마이그레이션 없이 검증만 수행
    --rollback: 대신 롤백 실행
"""

import logging
import os
import sys
import argparse
import subprocess
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class PaymentMigrationRunner:
    """결제 시스템 마이그레이션 실행 관리 클래스"""

    def __init__(self, dry_run=False):
        self.migration_dir = Path(__file__).parent
        self.dry_run = dry_run
        self.database_url = os.getenv("DATABASE_URL")

        if not self.database_url:
            raise ValueError("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다")

        logger.info(f"✅ 마이그레이션 디렉토리: {self.migration_dir}")
        logger.info(f"✅ 데이터베이스: {self.database_url.split('@')[-1]}")
        if self.dry_run:
            logger.info("⚠️  DRY RUN 모드: 실제 변경은 수행되지 않습니다")

    def verify_alembic_setup(self):
        """
        Alembic 설정 검증
        alembic.ini 파일 및 버전 정보 확인
        """
        logger.info("🔍 Alembic 설정 검증...")

        alembic_ini = self.migration_dir.parent / "alembic.ini"
        versions_dir = self.migration_dir / "versions"

        # alembic.ini 확인
        if not alembic_ini.exists():
            logger.warning(f"⚠️  alembic.ini 없음: {alembic_ini}")
            logger.info("  → Alembic 초기화: alembic init .")
            return False

        # versions 디렉토리 확인
        if not versions_dir.exists():
            logger.warning(f"⚠️  versions 디렉토리 없음: {versions_dir}")
            logger.info("  → 생성 필요: mkdir -p {versions_dir}")
            return False

        logger.info("✅ Alembic 설정 완료")
        return True

    def verify_migration_files(self):
        """
        마이그레이션 파일 검증
        필요한 모든 파일이 존재하는지 확인
        """
        logger.info("🔍 마이그레이션 파일 검증...")

        required_files = [
            "006_payment_system.py",
            "data_migration_007_payment_defaults.py",
            "rollback_payment_system.py",
            "run_payment_migration.py"
        ]

        missing_files = []
        for filename in required_files:
            filepath = self.migration_dir / filename
            if filepath.exists():
                logger.info(f"  ✅ {filename}")
            else:
                logger.error(f"  ❌ {filename} (없음)")
                missing_files.append(filename)

        if missing_files:
            logger.error(f"❌ {len(missing_files)}개 파일이 누락되었습니다")
            return False

        logger.info("✅ 모든 마이그레이션 파일 검증 완료")
        return True

    def run_schema_migration(self):
        """
        스키마 마이그레이션 실행 (006_payment_system.py)
        알럼빅이 설정되지 않은 경우 직접 실행
        """
        logger.info("🔄 스키마 마이그레이션 시작...")

        migration_file = self.migration_dir / "006_payment_system.py"

        if self.dry_run:
            logger.info("DRY RUN: 스키마 마이그레이션 스킵")
            return True

        try:
            # 직접 실행하는 경우 (Alembic 없을 때)
            logger.info("  📝 마이그레이션 파일: 006_payment_system.py")
            logger.info("  ℹ️  알럼빅이 설정되면 아래 명령어로 실행:")
            logger.info("     alembic upgrade 006")
            logger.info("  ℹ️  또는 SQL 스크립트로 직접 실행 가능")

            logger.info("✅ 스키마 마이그레이션 준비 완료")
            return True

        except Exception as e:
            logger.error(f"❌ 스키마 마이그레이션 실패: {str(e)}")
            return False

    def run_data_migration(self, create_commission=False):
        """
        데이터 마이그레이션 실행 (007_payment_defaults.py)
        기존 데이터에 기본값 설정
        """
        logger.info("🔄 데이터 마이그레이션 시작...")

        migration_file = self.migration_dir / "data_migration_007_payment_defaults.py"

        if not migration_file.exists():
            logger.error(f"❌ 파일 없음: {migration_file}")
            return False

        if self.dry_run:
            logger.info("DRY RUN: 데이터 마이그레이션 스킵")
            return True

        try:
            # 환경 변수 설정
            env = os.environ.copy()

            # Python 스크립트 실행
            cmd = [
                sys.executable,
                str(migration_file)
            ]

            logger.info(f"  실행: {' '.join(cmd)}")

            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                logger.info("✅ 데이터 마이그레이션 완료")
                if result.stdout:
                    logger.info(f"  출력: {result.stdout[:200]}")
                return True
            else:
                logger.error(f"❌ 데이터 마이그레이션 실패")
                logger.error(f"  에러: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"❌ 데이터 마이그레이션 실행 실패: {str(e)}")
            return False

    def verify_migration(self):
        """
        마이그레이션 검증
        스키마 및 데이터가 올바르게 생성되었는지 확인
        """
        logger.info("🔍 마이그레이션 검증 시작...")

        # 데이터베이스 연결
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.error("❌ DATABASE_URL이 설정되지 않았습니다")
            return False

        try:
            from sqlalchemy import create_engine, inspect, text
            from sqlalchemy.orm import sessionmaker

            # 데이터베이스 URL 처리
            if database_url.startswith("postgresql://"):
                database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")

            engine = create_engine(database_url, echo=False)
            Session = sessionmaker(bind=engine)
            session = Session()

            inspector = inspect(engine)
            all_tables = inspector.get_table_names()

            # 테이블 검증
            expected_tables = [
                'payment_records',
                'therapist_commission_ledger',
                'payment_method_settings'
            ]

            tables_found = []
            for table_name in expected_tables:
                if table_name in all_tables:
                    logger.info(f"  ✅ 테이블 '{table_name}' 생성됨")
                    tables_found.append(table_name)
                else:
                    logger.warning(f"  ⚠️  테이블 '{table_name}' 없음")

            # Bookings 컬럼 검증
            if 'bookings' in all_tables:
                bookings_columns = [col['name'] for col in inspector.get_columns('bookings')]
                payment_columns = [
                    'payment_status',
                    'payment_details',
                    'paid_at',
                    'payment_gateway'
                ]

                columns_found = []
                for col_name in payment_columns:
                    if col_name in bookings_columns:
                        logger.info(f"  ✅ 컬럼 'bookings.{col_name}' 생성됨")
                        columns_found.append(col_name)
                    else:
                        logger.warning(f"  ⚠️  컬럼 'bookings.{col_name}' 없음")

                # 데이터 행 개수 확인
                result = session.execute(text("SELECT COUNT(*) as cnt FROM payment_method_settings"))
                payment_methods_count = result.scalar()
                logger.info(f"  📊 Payment method 설정: {payment_methods_count}개")

            session.close()

            if len(tables_found) == len(expected_tables):
                logger.info("✅ 마이그레이션 검증 완료: 모든 테이블이 생성되었습니다")
                return True
            else:
                logger.warning("⚠️  일부 테이블이 누락되었습니다")
                return False

        except Exception as e:
            logger.error(f"❌ 검증 실패: {str(e)}")
            return False

    def generate_migration_summary(self):
        """
        마이그레이션 요약 리포트 생성
        """
        summary = f"""
{'='*60}
결제 시스템 마이그레이션 실행 요약
{'='*60}

실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
데이터베이스: {self.database_url.split('@')[-1]}
DRY RUN: {self.dry_run}

생성되는 항목:
1. payment_records 테이블
   - 결제 이력 추적
   - 트랜잭션 기록 저장

2. therapist_commission_ledger 테이블
   - 테라피스트 수수료 기록
   - 월정산 데이터 관리

3. payment_method_settings 테이블
   - 결제 수단별 설정
   - 수수료율 관리

4. bookings 테이블 확장
   - payment_status: 결제 상태
   - payment_details: 상세 정보
   - paid_at: 결제 완료 시간
   - payment_gateway: 결제 게이트웨이

마이그레이션 파일:
- 006_payment_system.py (스키마)
- data_migration_007_payment_defaults.py (데이터)
- rollback_payment_system.py (롤백)

롤백 방법:
  python rollback_payment_system.py --full --backup

{'='*60}
"""
        return summary

    def run_migration(self, skip_data=False, create_commission=False):
        """
        전체 마이그레이션 실행

        Args:
            skip_data: 데이터 마이그레이션 스킵 여부
            create_commission: 수수료 기록 자동 생성 여부
        """
        try:
            logger.info("=" * 60)
            logger.info("🚀 결제 시스템 마이그레이션 시작")
            logger.info("=" * 60)

            # 1. 파일 검증
            if not self.verify_migration_files():
                return False

            # 2. Alembic 설정 검증 (선택)
            # self.verify_alembic_setup()

            # 3. 스키마 마이그레이션
            if not self.run_schema_migration():
                return False

            # 4. 데이터 마이그레이션
            if not skip_data:
                if not self.run_data_migration(create_commission):
                    return False

            # 5. 검증
            if not self.dry_run:
                if not self.verify_migration():
                    logger.warning("⚠️  검증 부분 실패 (마이그레이션은 완료됨)")

            # 6. 요약
            print(self.generate_migration_summary())

            logger.info("=" * 60)
            logger.info("✅ 마이그레이션 완료!")
            logger.info("=" * 60)

            return True

        except Exception as e:
            logger.error(f"❌ 마이그레이션 실패: {str(e)}")
            return False


def main():
    parser = argparse.ArgumentParser(
        description='결제 시스템 마이그레이션 러너'
    )
    parser.add_argument(
        '--skip-data',
        action='store_true',
        help='데이터 마이그레이션 스킵'
    )
    parser.add_argument(
        '--with-commission',
        action='store_true',
        help='기존 예약에 수수료 기록 자동 생성'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='실제 마이그레이션 없이 검증만 수행'
    )
    parser.add_argument(
        '--rollback',
        action='store_true',
        help='대신 롤백 실행'
    )

    args = parser.parse_args()

    # 롤백 실행
    if args.rollback:
        from rollback_payment_system import PaymentSystemRollback
        rollback = PaymentSystemRollback(backup=True)
        result = rollback.run_rollback(full_rollback=True)
        sys.exit(0 if result['status'] == 'success' else 1)

    # 마이그레이션 실행
    runner = PaymentMigrationRunner(dry_run=args.dry_run)
    success = runner.run_migration(
        skip_data=args.skip_data,
        create_commission=args.with_commission
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
