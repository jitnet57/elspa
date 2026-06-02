"""
데이터 마이그레이션: 기존 예약에 기본 결제 값 설정
- 기존 bookings의 payment_status 초기화
- payment_method_settings 기본값 입력
- therapist_commission_ledger 초기 데이터 생성 (선택사항)

Revision ID: 007
Revises: 006_payment_system
Create Date: 2026-06-02 21:05:00.000000

"""

import logging
from datetime import datetime
from decimal import Decimal
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class PaymentDataMigration:
    """결제 시스템 데이터 마이그레이션 클래스"""

    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다")

        # PostgreSQL URL 처리
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+psycopg2://")

        self.engine = create_engine(self.database_url, echo=False)
        self.Session = sessionmaker(bind=self.engine)
        logger.info(f"✅ 데이터베이스 연결: {self.database_url.split('@')[-1]}")

    def migrate_payment_statuses(self):
        """
        기존 예약의 payment_status 설정
        - status='completed'인 예약: payment_status='paid'
        - status!='completed'인 예약: payment_status='pending'
        """
        session = self.Session()
        try:
            logger.info("🔄 Booking 테이블의 payment_status 마이그레이션 시작...")

            # 완료된 예약
            update_completed = text("""
                UPDATE bookings
                SET payment_status = 'paid',
                    paid_at = updated_at
                WHERE status = 'completed'
                    AND payment_status IS NULL
            """)
            result_completed = session.execute(update_completed)
            completed_count = result_completed.rowcount
            logger.info(f"  ✅ {completed_count}개 예약(완료됨) → payment_status='paid'")

            # 미완료/취소된 예약
            update_pending = text("""
                UPDATE bookings
                SET payment_status = 'pending'
                WHERE status != 'completed'
                    AND payment_status IS NULL
            """)
            result_pending = session.execute(update_pending)
            pending_count = result_pending.rowcount
            logger.info(f"  ✅ {pending_count}개 예약(미완료) → payment_status='pending'")

            session.commit()
            logger.info(f"✅ Payment_status 마이그레이션 완료 (총 {completed_count + pending_count}개)")
            return completed_count + pending_count

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Payment_status 마이그레이션 실패: {str(e)}")
            raise
        finally:
            session.close()

    def initialize_payment_method_settings(self):
        """
        payment_method_settings 기본값 초기화
        결제 수단별 기본 설정 (카드, 현금, 카카오페이 등)
        """
        session = self.Session()
        try:
            logger.info("🔄 Payment_method_settings 초기화 시작...")

            # 기존 데이터 확인
            count_query = text("SELECT COUNT(*) FROM payment_method_settings")
            existing_count = session.execute(count_query).scalar()

            if existing_count > 0:
                logger.info(f"  ℹ️  이미 {existing_count}개의 결제 수단이 설정되어 있습니다")
                return 0

            payment_methods = [
                {
                    'method_name': 'cash',
                    'display_name': '현금',
                    'is_enabled': True,
                    'is_online': False,
                    'fee_percentage': Decimal('0.00'),
                    'description': '현장 현금 결제'
                },
                {
                    'method_name': 'card',
                    'display_name': '신용/체크카드',
                    'gateway': 'stripe',
                    'is_enabled': True,
                    'is_online': True,
                    'fee_percentage': Decimal('2.90'),
                    'description': '신용카드/체크카드 결제 (Stripe)'
                },
                {
                    'method_name': 'kakaopay',
                    'display_name': '카카오페이',
                    'gateway': 'kakaopay',
                    'is_enabled': True,
                    'is_online': True,
                    'fee_percentage': Decimal('1.50'),
                    'description': '카카오페이 결제'
                },
                {
                    'method_name': 'bank_transfer',
                    'display_name': '계좌이체',
                    'is_enabled': True,
                    'is_online': True,
                    'fee_percentage': Decimal('0.50'),
                    'description': '은행 계좌이체'
                },
                {
                    'method_name': 'paymongo',
                    'display_name': 'PayMongo',
                    'gateway': 'paymongo',
                    'is_enabled': True,
                    'is_online': True,
                    'fee_percentage': Decimal('2.50'),
                    'description': 'PayMongo 결제 (필리핀)'
                },
            ]

            # 삽입 SQL 생성
            insert_sql = text("""
                INSERT INTO payment_method_settings
                (method_name, display_name, gateway, is_enabled, is_online, fee_percentage, description)
                VALUES
                (:method_name, :display_name, :gateway, :is_enabled, :is_online, :fee_percentage, :description)
            """)

            inserted_count = 0
            for method in payment_methods:
                try:
                    session.execute(insert_sql, method)
                    inserted_count += 1
                    logger.info(f"  ✅ {method['display_name']} 추가됨")
                except Exception as e:
                    logger.warning(f"  ⚠️  {method['display_name']} 추가 실패: {str(e)}")

            session.commit()
            logger.info(f"✅ Payment_method_settings 초기화 완료 ({inserted_count}개)")
            return inserted_count

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Payment_method_settings 초기화 실패: {str(e)}")
            raise
        finally:
            session.close()

    def create_initial_commission_ledger(self, auto_create=False):
        """
        선택사항: 기존 완료된 예약에 대해 테라피스트 수수료 기록 자동 생성

        Args:
            auto_create (bool): True일 경우 자동 생성, False일 경우 스킵
        """
        if not auto_create:
            logger.info("ℹ️  Therapist commission ledger 자동 생성은 스킵됩니다")
            return 0

        session = self.Session()
        try:
            logger.info("🔄 Therapist_commission_ledger 초기화 시작...")

            # 완료된 예약 중 commission 기록이 없는 것 조회
            query = text("""
                SELECT DISTINCT
                    b.id,
                    b.therapist_id,
                    b.total_price,
                    COALESCE(t.commission_rate, 25) as commission_rate,
                    TO_CHAR(b.booking_date, 'YYYY-MM') as period
                FROM bookings b
                JOIN therapists t ON b.therapist_id = t.id
                WHERE b.status = 'completed'
                    AND b.therapist_id IS NOT NULL
                    AND b.total_price > 0
                    AND NOT EXISTS (
                        SELECT 1 FROM therapist_commission_ledger tcl
                        WHERE tcl.booking_id = b.id
                    )
                ORDER BY b.booking_date DESC
            """)

            bookings_to_process = session.execute(query).fetchall()
            logger.info(f"  📊 처리할 예약: {len(bookings_to_process)}개")

            if not bookings_to_process:
                logger.info("  ℹ️  처리할 예약이 없습니다")
                return 0

            inserted_count = 0
            for booking in bookings_to_process:
                try:
                    booking_id, therapist_id, total_price, commission_rate, period = booking
                    commission_amount = (total_price * commission_rate) / 100

                    insert_sql = text("""
                        INSERT INTO therapist_commission_ledger
                        (therapist_id, booking_id, commission_amount, commission_rate, base_amount, transaction_type, status, period)
                        VALUES
                        (:therapist_id, :booking_id, :commission_amount, :commission_rate, :base_amount, :transaction_type, :status, :period)
                    """)

                    session.execute(insert_sql, {
                        'therapist_id': therapist_id,
                        'booking_id': booking_id,
                        'commission_amount': commission_amount,
                        'commission_rate': commission_rate,
                        'base_amount': total_price,
                        'transaction_type': 'booking_service',
                        'status': 'paid',
                        'period': period
                    })
                    inserted_count += 1

                except Exception as e:
                    logger.warning(f"  ⚠️  Booking #{booking_id} commission 기록 실패: {str(e)}")

            session.commit()
            logger.info(f"✅ Therapist_commission_ledger 초기화 완료 ({inserted_count}개)")
            return inserted_count

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Therapist_commission_ledger 초기화 실패: {str(e)}")
            raise
        finally:
            session.close()

    def run_migration(self, create_commission_ledger=False):
        """
        전체 마이그레이션 실행

        Args:
            create_commission_ledger (bool): 수수료 기록 자동 생성 여부
        """
        try:
            logger.info("=" * 60)
            logger.info("🚀 결제 시스템 데이터 마이그레이션 시작")
            logger.info("=" * 60)

            # 1. Payment status 마이그레이션
            payment_status_count = self.migrate_payment_statuses()

            # 2. Payment method settings 초기화
            payment_method_count = self.initialize_payment_method_settings()

            # 3. Commission ledger 초기화 (선택사항)
            commission_count = self.create_initial_commission_ledger(create_commission_ledger)

            logger.info("=" * 60)
            logger.info("✅ 마이그레이션 완료!")
            logger.info(f"  - Payment status 업데이트: {payment_status_count}개")
            logger.info(f"  - Payment method 추가: {payment_method_count}개")
            logger.info(f"  - Commission ledger 생성: {commission_count}개")
            logger.info("=" * 60)

            return {
                'status': 'success',
                'payment_status_updated': payment_status_count,
                'payment_methods_added': payment_method_count,
                'commissions_created': commission_count,
            }

        except Exception as e:
            logger.error(f"❌ 마이그레이션 실패: {str(e)}")
            raise


if __name__ == "__main__":
    migration = PaymentDataMigration()

    # create_commission_ledger=True로 설정하면 기존 예약에 대한 수수료 기록도 생성
    result = migration.run_migration(create_commission_ledger=False)

    print("\n📊 마이그레이션 결과:")
    print(result)
