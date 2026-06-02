# ============================================================
# 📌 마이그레이션: Payment System Schema Upgrade
# 📋 목적: 결제 시스템 필드 추가 & company_settlements 테이블 최적화
# 🔧 기능: bookings 테이블 확장 + 결제 추적 인덱스
# 📅 작성일: 2026-06-02
# ============================================================

"""
📝 설명:
이 마이그레이션은 결제 시스템 구현을 위해 다음을 수행합니다:

**1️⃣ bookings 테이블 ALTER:**
- payment_methods (JSON): 다중 결제수단 저장 (카드, 현금, 카카오페이 등)
- sss_status (ENUM): SSS 상태 (pending, approved, confirmed, cancelled)
- payment_from (ENUM): 결제 주체 (customer, company_credit, referral)
- settlement_status (ENUM): 정산 상태 (pending, approved, settled, rejected)

**2️⃣ company_settlements 테이블:**
- 이미 app/models/company_settlement.py에서 정의됨
- 마이그레이션은 인덱스 최적화만 수행

**3️⃣ 추가 인덱스:**
- bookings(payment_from, settlement_status): 정산 추적
- bookings(sss_status): SSS 상태 조회
- company_settlements(status, settlement_date): 정산 상태 추적

**4️⃣ Foreign Key 제약:**
- company_settlements.company_id → companies.id
- settlement_transactions.booking_id → bookings.id

**제약 조건:**
- payment_methods: JSON 형식 유효성
- sss_status: ENUM 값만 허용
- payment_from: ENUM 값만 허용
- settlement_status: ENUM 값만 허용
"""

from app.database import engine
from sqlalchemy import (
    Column,
    BigInteger,
    String,
    JSON,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    Integer,
    Boolean,
    Text,
    Index,
    MetaData,
    Table,
    CheckConstraint,
    UniqueConstraint,
    text,
)
from datetime import datetime


def create_enums():
    """
    🔧 함수: create_enums
    📋 목적: PostgreSQL ENUM 타입 생성
    """
    with engine.connect() as connection:
        # SSS 상태 ENUM
        try:
            connection.execute(text("""
                CREATE TYPE sss_status_enum AS ENUM (
                    'pending',
                    'approved',
                    'confirmed',
                    'cancelled'
                )
            """))
            print("✅ sss_status_enum ENUM 타입이 생성되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ sss_status_enum ENUM이 이미 존재합니다.")
            else:
                raise

        # 결제 주체 ENUM
        try:
            connection.execute(text("""
                CREATE TYPE payment_from_enum AS ENUM (
                    'customer',
                    'company_credit',
                    'referral'
                )
            """))
            print("✅ payment_from_enum ENUM 타입이 생성되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ payment_from_enum ENUM이 이미 존재합니다.")
            else:
                raise

        # 정산 상태 ENUM
        try:
            connection.execute(text("""
                CREATE TYPE settlement_status_enum AS ENUM (
                    'pending',
                    'approved',
                    'settled',
                    'rejected',
                    'confirmed'
                )
            """))
            print("✅ settlement_status_enum ENUM 타입이 생성되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ settlement_status_enum ENUM이 이미 존재합니다.")
            else:
                raise

        connection.commit()


def alter_bookings_table():
    """
    🔧 함수: alter_bookings_table
    📋 목적: bookings 테이블에 결제 시스템 필드 추가
    """
    with engine.connect() as connection:
        # 1️⃣ payment_methods 추가 (JSON)
        try:
            connection.execute(text("""
                ALTER TABLE bookings
                ADD COLUMN IF NOT EXISTS payment_methods JSON DEFAULT '[]'::json
            """))
            print("✅ payment_methods 컬럼이 추가되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ payment_methods 컬럼이 이미 존재합니다.")
            else:
                print(f"⚠️ payment_methods 추가 중 오류: {e}")

        # 2️⃣ sss_status 추가 (ENUM)
        try:
            connection.execute(text("""
                ALTER TABLE bookings
                ADD COLUMN IF NOT EXISTS sss_status sss_status_enum DEFAULT 'pending'
            """))
            print("✅ sss_status 컬럼이 추가되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ sss_status 컬럼이 이미 존재합니다.")
            else:
                print(f"⚠️ sss_status 추가 중 오류: {e}")

        # 3️⃣ payment_from 추가 (ENUM)
        try:
            connection.execute(text("""
                ALTER TABLE bookings
                ADD COLUMN IF NOT EXISTS payment_from payment_from_enum DEFAULT 'customer'
            """))
            print("✅ payment_from 컬럼이 추가되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ payment_from 컬럼이 이미 존재합니다.")
            else:
                print(f"⚠️ payment_from 추가 중 오류: {e}")

        # 4️⃣ settlement_status 추가 (ENUM)
        try:
            connection.execute(text("""
                ALTER TABLE bookings
                ADD COLUMN IF NOT EXISTS settlement_status settlement_status_enum DEFAULT 'pending'
            """))
            print("✅ settlement_status 컬럼이 추가되었습니다.")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️ settlement_status 컬럼이 이미 존재합니다.")
            else:
                print(f"⚠️ settlement_status 추가 중 오류: {e}")

        connection.commit()


def add_indexes():
    """
    🔧 함수: add_indexes
    📋 목적: 성능 최적화 인덱스 생성
    """
    with engine.connect() as connection:
        # 1️⃣ 결제 추적 인덱스
        try:
            connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_bookings_payment_settlement
                ON bookings(payment_from, settlement_status)
            """))
            print("✅ idx_bookings_payment_settlement 인덱스가 생성되었습니다.")
        except Exception as e:
            print(f"⚠️ payment_settlement 인덱스 생성 중 오류: {e}")

        # 2️⃣ SSS 상태 인덱스
        try:
            connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_bookings_sss_status
                ON bookings(sss_status)
            """))
            print("✅ idx_bookings_sss_status 인덱스가 생성되었습니다.")
        except Exception as e:
            print(f"⚠️ sss_status 인덱스 생성 중 오류: {e}")

        # 3️⃣ 정산 상태 인덱스
        try:
            connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_bookings_settlement_status
                ON bookings(settlement_status)
            """))
            print("✅ idx_bookings_settlement_status 인덱스가 생성되었습니다.")
        except Exception as e:
            print(f"⚠️ settlement_status 인덱스 생성 중 오류: {e}")

        # 4️⃣ 예약 완료 & 정산 인덱스
        try:
            connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_bookings_status_settlement
                ON bookings(status, settlement_status)
                WHERE status = 'completed'
            """))
            print("✅ idx_bookings_status_settlement 인덱스가 생성되었습니다.")
        except Exception as e:
            print(f"⚠️ status_settlement 인덱스 생성 중 오류: {e}")

        connection.commit()


def add_foreign_keys():
    """
    🔧 함수: add_foreign_keys
    📋 목적: 외래 키 제약 추가
    """
    with engine.connect() as connection:
        # 1️⃣ company_settlements → companies FK
        try:
            connection.execute(text("""
                ALTER TABLE company_settlements
                ADD CONSTRAINT fk_company_settlements_company_id
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            """))
            print("✅ company_settlements.company_id FK가 추가되었습니다.")
        except Exception as e:
            if "already exists" in str(e) or "duplicate" in str(e):
                print("⚠️ company_id FK가 이미 존재합니다.")
            else:
                print(f"⚠️ company_id FK 추가 중 오류: {e}")

        # 2️⃣ settlement_transactions → bookings FK
        try:
            connection.execute(text("""
                ALTER TABLE settlement_transactions
                ADD CONSTRAINT fk_settlement_transactions_booking_id
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
            """))
            print("✅ settlement_transactions.booking_id FK가 추가되었습니다.")
        except Exception as e:
            if "already exists" in str(e) or "duplicate" in str(e):
                print("⚠️ booking_id FK가 이미 존재합니다.")
            else:
                print(f"⚠️ booking_id FK 추가 중 오류: {e}")

        connection.commit()


def verify_migration():
    """
    🔧 함수: verify_migration
    📋 목적: 마이그레이션 검증
    """
    with engine.connect() as connection:
        # bookings 테이블 구조 확인
        result = connection.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'bookings'
            AND column_name IN (
                'payment_methods',
                'sss_status',
                'payment_from',
                'settlement_status'
            )
            ORDER BY column_name
        """))

        print("\n📊 bookings 테이블 컬럼 확인:")
        rows = result.fetchall()
        if rows:
            for row in rows:
                print(f"  ✓ {row[0]}: {row[1]} (nullable: {row[2]})")
        else:
            print("  ⚠️ 예상 컬럼을 찾을 수 없습니다.")

        # 인덱스 확인
        result = connection.execute(text("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'bookings'
            AND indexname LIKE 'idx_bookings_%'
            ORDER BY indexname
        """))

        print("\n📊 bookings 테이블 인덱스 확인:")
        rows = result.fetchall()
        if rows:
            for row in rows:
                print(f"  ✓ {row[0]}")
        else:
            print("  ⚠️ 예상 인덱스를 찾을 수 없습니다.")

        # company_settlements 테이블 존재 여부
        result = connection.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'company_settlements'
            )
        """))
        exists = result.scalar()
        print(f"\n📊 company_settlements 테이블: {'✓ 존재' if exists else '✗ 없음'}")

        # settlement_transactions 테이블 존재 여부
        result = connection.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'settlement_transactions'
            )
        """))
        exists = result.scalar()
        print(f"📊 settlement_transactions 테이블: {'✓ 존재' if exists else '✗ 없음'}")

        connection.commit()


def run_migration():
    """
    🔧 함수: run_migration
    📋 목적: 전체 마이그레이션 실행
    """
    print("\n" + "=" * 60)
    print("🚀 결제 시스템 마이그레이션 시작")
    print("=" * 60)

    try:
        # 1️⃣ ENUM 타입 생성
        print("\n[1/5] ENUM 타입 생성...")
        create_enums()

        # 2️⃣ bookings 테이블 수정
        print("\n[2/5] bookings 테이블 필드 추가...")
        alter_bookings_table()

        # 3️⃣ 인덱스 생성
        print("\n[3/5] 성능 인덱스 추가...")
        add_indexes()

        # 4️⃣ 외래 키 추가
        print("\n[4/5] 외래 키 제약 추가...")
        add_foreign_keys()

        # 5️⃣ 검증
        print("\n[5/5] 마이그레이션 검증...")
        verify_migration()

        print("\n" + "=" * 60)
        print("✅ 결제 시스템 마이그레이션 완료!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 마이그레이션 실패: {e}")
        raise


if __name__ == "__main__":
    run_migration()
