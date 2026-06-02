"""
결제 시스템 마이그레이션 롤백 스크립트
- 결제 시스템 마이그레이션으로 추가된 테이블, 컬럼 제거
- 기존 데이터 복원
- 안전한 롤백 프로세스

사용법:
    python rollback_payment_system.py [--full] [--backup]

옵션:
    --full: 테이블 삭제 포함 (기본값: 컬럼만 제거)
    --backup: 롤백 전 데이터 백업 생성
"""

import logging
import os
import json
from datetime import datetime
from sqlalchemy import text, create_engine, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import argparse

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class PaymentSystemRollback:
    """결제 시스템 롤백 관리 클래스"""

    def __init__(self, backup=False):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다")

        # PostgreSQL URL 처리
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+psycopg2://")

        self.engine = create_engine(self.database_url, echo=False)
        self.Session = sessionmaker(bind=self.engine)
        self.backup_dir = "./migration_backups"
        self.backup_enabled = backup

        if self.backup_enabled:
            os.makedirs(self.backup_dir, exist_ok=True)

        logger.info(f"✅ 데이터베이스 연결: {self.database_url.split('@')[-1]}")

    def backup_tables(self):
        """
        롤백 전 테이블 데이터 백업
        새로 생성된 테이블의 데이터를 JSON으로 백업
        """
        if not self.backup_enabled:
            logger.info("ℹ️  백업이 비활성화되었습니다")
            return

        session = self.Session()
        try:
            logger.info("🔄 데이터 백업 시작...")

            backup_data = {}
            tables_to_backup = [
                'payment_records',
                'therapist_commission_ledger',
                'payment_method_settings'
            ]

            for table_name in tables_to_backup:
                try:
                    # 테이블 존재 확인
                    inspector = inspect(self.engine)
                    if table_name not in inspector.get_table_names():
                        logger.info(f"  ℹ️  테이블 '{table_name}' 없음 (스킵)")
                        continue

                    # 데이터 조회
                    query = text(f"SELECT * FROM {table_name}")
                    rows = session.execute(query).fetchall()

                    if rows:
                        # 딕셔너리로 변환
                        backup_data[table_name] = [dict(row) for row in rows]
                        logger.info(f"  ✅ {table_name}: {len(rows)}개 행 백업됨")
                    else:
                        logger.info(f"  ℹ️  {table_name}: 데이터 없음")

                except Exception as e:
                    logger.warning(f"  ⚠️  {table_name} 백업 실패: {str(e)}")

            # 백업 파일 저장
            if backup_data:
                backup_file = os.path.join(
                    self.backup_dir,
                    f"payment_system_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, indent=2, default=str)
                logger.info(f"✅ 백업 파일 저장: {backup_file}")
                return backup_file

        except Exception as e:
            logger.error(f"❌ 백업 실패: {str(e)}")
            raise
        finally:
            session.close()

    def rollback_bookings_columns(self):
        """
        bookings 테이블에서 payment 관련 컬럼 제거
        - payment_status
        - payment_details
        - paid_at
        - payment_gateway
        """
        session = self.Session()
        try:
            logger.info("🔄 Bookings 테이블 컬럼 제거 시작...")

            columns_to_drop = [
                'payment_gateway',
                'paid_at',
                'payment_details',
                'payment_status'
            ]

            # 컬럼 존재 여부 확인 및 제거
            inspector = inspect(self.engine)
            existing_columns = [col['name'] for col in inspector.get_columns('bookings')]

            for column_name in columns_to_drop:
                if column_name in existing_columns:
                    try:
                        drop_sql = text(f"ALTER TABLE bookings DROP COLUMN {column_name} CASCADE")
                        session.execute(drop_sql)
                        logger.info(f"  ✅ 컬럼 '{column_name}' 제거됨")
                    except Exception as e:
                        logger.warning(f"  ⚠️  컬럼 '{column_name}' 제거 실패: {str(e)}")
                else:
                    logger.info(f"  ℹ️  컬럼 '{column_name}' 없음 (스킵)")

            session.commit()
            logger.info("✅ Bookings 컬럼 제거 완료")

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Bookings 컬럼 제거 실패: {str(e)}")
            raise
        finally:
            session.close()

    def drop_payment_tables(self):
        """
        새로 생성된 payment 관련 테이블 삭제
        - payment_records
        - therapist_commission_ledger
        - payment_method_settings
        """
        session = self.Session()
        try:
            logger.info("🔄 Payment 관련 테이블 삭제 시작...")

            tables_to_drop = [
                'payment_method_settings',
                'therapist_commission_ledger',
                'payment_records'
            ]

            inspector = inspect(self.engine)
            existing_tables = inspector.get_table_names()

            for table_name in tables_to_drop:
                if table_name in existing_tables:
                    try:
                        # 외래 키 제약 제거 후 테이블 삭제
                        drop_sql = text(f"DROP TABLE IF EXISTS {table_name} CASCADE")
                        session.execute(drop_sql)
                        logger.info(f"  ✅ 테이블 '{table_name}' 삭제됨")
                    except Exception as e:
                        logger.warning(f"  ⚠️  테이블 '{table_name}' 삭제 실패: {str(e)}")
                else:
                    logger.info(f"  ℹ️  테이블 '{table_name}' 없음 (스킵)")

            session.commit()
            logger.info("✅ Payment 테이블 삭제 완료")

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Payment 테이블 삭제 실패: {str(e)}")
            raise
        finally:
            session.close()

    def drop_payment_indexes(self):
        """
        Payment 관련 인덱스 제거
        """
        session = self.Session()
        try:
            logger.info("🔄 Payment 인덱스 제거 시작...")

            indexes_to_drop = [
                'ix_therapist_commission_ledger_status',
                'ix_therapist_commission_ledger_period',
                'ix_payment_records_transaction',
                'ix_payment_records_booking_therapist'
            ]

            inspector = inspect(self.engine)
            existing_indexes = inspector.get_indexes('payment_records')
            existing_index_names = [idx['name'] for idx in existing_indexes] if existing_indexes else []

            for index_name in indexes_to_drop:
                try:
                    # 해당 인덱스가 어느 테이블에 있는지 확인 필요
                    drop_sql = text(f"DROP INDEX IF EXISTS {index_name} CASCADE")
                    session.execute(drop_sql)
                    logger.info(f"  ✅ 인덱스 '{index_name}' 제거됨")
                except Exception as e:
                    logger.warning(f"  ⚠️  인덱스 '{index_name}' 제거 실패: {str(e)}")

            session.commit()
            logger.info("✅ Payment 인덱스 제거 완료")

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Payment 인덱스 제거 실패: {str(e)}")
            raise
        finally:
            session.close()

    def verify_rollback(self):
        """
        롤백 검증: 모든 변경사항이 제거되었는지 확인
        """
        session = self.Session()
        try:
            logger.info("🔍 롤백 검증 시작...")

            inspector = inspect(self.engine)
            all_tables = inspector.get_table_names()
            bookings_columns = [col['name'] for col in inspector.get_columns('bookings')]

            # 테이블 검증
            tables_to_check = [
                'payment_records',
                'therapist_commission_ledger',
                'payment_method_settings'
            ]

            table_status = {}
            for table_name in tables_to_check:
                exists = table_name in all_tables
                table_status[table_name] = 'EXISTS (❌)' if exists else 'REMOVED (✅)'
                logger.info(f"  {table_name}: {table_status[table_name]}")

            # 컬럼 검증
            payment_columns = [
                'payment_status',
                'payment_details',
                'paid_at',
                'payment_gateway'
            ]

            column_status = {}
            for col_name in payment_columns:
                exists = col_name in bookings_columns
                column_status[col_name] = 'EXISTS (❌)' if exists else 'REMOVED (✅)'
                logger.info(f"  bookings.{col_name}: {column_status[col_name]}")

            # 검증 결과
            all_removed = all(
                table_name not in all_tables for table_name in tables_to_check
            ) and all(
                col_name not in bookings_columns for col_name in payment_columns
            )

            if all_removed:
                logger.info("✅ 롤백 검증 완료: 모든 변경사항이 제거되었습니다")
                return True
            else:
                logger.warning("⚠️  일부 변경사항이 남아있습니다")
                return False

        except Exception as e:
            logger.error(f"❌ 롤백 검증 실패: {str(e)}")
            return False
        finally:
            session.close()

    def run_rollback(self, full_rollback=False):
        """
        전체 롤백 실행

        Args:
            full_rollback (bool): True일 경우 테이블 삭제 포함, False일 경우 컬럼만 제거
        """
        try:
            logger.info("=" * 60)
            logger.info("🚨 결제 시스템 마이그레이션 롤백 시작")
            logger.info("=" * 60)

            # 1. 백업 생성
            backup_file = self.backup_tables()

            # 2. 컬럼 제거
            self.rollback_bookings_columns()

            # 3. 테이블 삭제 (full_rollback=True인 경우)
            if full_rollback:
                logger.info("⚠️  전체 롤백 모드: 테이블 삭제 포함")
                self.drop_payment_tables()
                self.drop_payment_indexes()
            else:
                logger.info("ℹ️  부분 롤백 모드: 테이블 유지 (데이터만 유지)")

            # 4. 검증
            is_valid = self.verify_rollback()

            logger.info("=" * 60)
            if is_valid:
                logger.info("✅ 롤백 완료!")
                if backup_file:
                    logger.info(f"📦 백업 파일: {backup_file}")
            else:
                logger.warning("⚠️  롤백 부분 완료 (수동 검토 필요)")
            logger.info("=" * 60)

            return {
                'status': 'success' if is_valid else 'warning',
                'full_rollback': full_rollback,
                'backup_file': backup_file,
                'verification': is_valid
            }

        except Exception as e:
            logger.error(f"❌ 롤백 실패: {str(e)}")
            logger.error("⚠️  데이터베이스에 부분적 변경이 있을 수 있습니다")
            raise


def main():
    parser = argparse.ArgumentParser(
        description='결제 시스템 마이그레이션 롤백 스크립트'
    )
    parser.add_argument(
        '--full',
        action='store_true',
        help='테이블 삭제 포함 (기본값: 컬럼만 제거)'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='롤백 전 데이터 백업 생성'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='확인 메시지 없이 실행'
    )

    args = parser.parse_args()

    # 확인 메시지
    if not args.force:
        print("\n" + "=" * 60)
        print("⚠️  결제 시스템 마이그레이션 롤백")
        print("=" * 60)
        print(f"전체 롤백 모드: {'YES' if args.full else 'NO'}")
        print(f"데이터 백업: {'YES' if args.backup else 'NO'}")
        print("\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?")
        response = input("입력 (yes/no): ").strip().lower()

        if response != 'yes':
            print("❌ 롤백이 취소되었습니다")
            return

    # 롤백 실행
    rollback = PaymentSystemRollback(backup=args.backup)
    result = rollback.run_rollback(full_rollback=args.full)

    print("\n📊 롤백 결과:")
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
