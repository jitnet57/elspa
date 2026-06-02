#!/usr/bin/env python3
"""
마이그레이션 검증 스크립트
경로: verify_migration.py
목적: Payment System 마이그레이션 완료 여부 확인
작성일: 2026-06-02
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine, inspect, text, MetaData, Table
)
from sqlalchemy.pool import NullPool

# 환경 설정
load_dotenv()

# 데이터베이스 URL 설정 (Supabase 사용)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL이 설정되지 않았습니다.")
    sys.exit(1)

# SQLite 체크 (마이그레이션 불가)
if DATABASE_URL.startswith("sqlite://"):
    print("⚠️ SQLite 데이터베이스를 사용 중입니다.")
    print("📝 Supabase PostgreSQL로 마이그레이션하려면 DATABASE_URL을 업데이트하세요.")
    print(f"현재 URL: {DATABASE_URL}")
    sys.exit(1)

print(f"✅ 데이터베이스: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")

# 엔진 생성
try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        poolclass=NullPool,
    )
    print("✅ 데이터베이스 연결 성공")
except Exception as e:
    print(f"❌ 데이터베이스 연결 실패: {e}")
    sys.exit(1)


def check_tables():
    """테이블 존재 여부 확인"""
    print("\n" + "=" * 60)
    print("📊 [1/4] 테이블 생성 확인")
    print("=" * 60)

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    required_tables = [
        "bookings",
        "company_settlements",
        "settlement_transactions",
    ]

    results = {}
    for table_name in required_tables:
        exists = table_name in tables
        status = "✅ 존재" if exists else "❌ 없음"
        results[table_name] = exists
        print(f"{status}: {table_name}")

    return results


def check_booking_columns():
    """Bookings 테이블 컬럼 확인"""
    print("\n" + "=" * 60)
    print("📊 [2/4] Bookings 테이블 필드 확인")
    print("=" * 60)

    with engine.connect() as connection:
        result = connection.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'bookings'
            ORDER BY ordinal_position
        """))

        columns = {row[0]: row for row in result.fetchall()}

        # 필요한 컬럼들
        required_columns = {
            'payment_methods': 'json',
            'sss_status': ('character varying', 'text'),
            'payment_from': ('character varying', 'text'),
            'settlement_status': ('character varying', 'text'),
            'total_amount': ('numeric', 'integer'),
            'sss_amount': ('numeric', 'integer'),
        }

        results = {}
        for col_name, expected_type in required_columns.items():
            if col_name in columns:
                col_info = columns[col_name]
                data_type = col_info[1]
                is_nullable = col_info[2]

                # 타입 매칭 (PostgreSQL 타입 변동성 고려)
                if isinstance(expected_type, tuple):
                    type_match = data_type in expected_type
                else:
                    type_match = data_type == expected_type or expected_type in data_type

                status = "✅" if type_match else "⚠️"
                results[col_name] = True
                print(f"{status} {col_name}: {data_type} (nullable: {is_nullable})")
            else:
                results[col_name] = False
                print(f"❌ {col_name}: 없음")

        return results


def check_indexes():
    """인덱스 생성 확인"""
    print("\n" + "=" * 60)
    print("📊 [3/4] 인덱스 생성 확인")
    print("=" * 60)

    with engine.connect() as connection:
        result = connection.execute(text("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'bookings'
            AND indexname LIKE 'idx_%'
            ORDER BY indexname
        """))

        indexes = [row[0] for row in result.fetchall()]

        expected_indexes = [
            'idx_booking_customer',
            'idx_booking_therapist',
            'idx_booking_sss_status',
            'idx_booking_settlement_status',
            'idx_booking_date',
        ]

        results = {}
        for idx_name in expected_indexes:
            exists = idx_name in indexes
            status = "✅" if exists else "❌"
            results[idx_name] = exists
            print(f"{status} {idx_name}")

        # 추가 생성된 인덱스 출력
        additional = [idx for idx in indexes if idx not in expected_indexes]
        if additional:
            print("\n추가 인덱스:")
            for idx in additional:
                print(f"  ℹ️ {idx}")

        return results


def check_enums():
    """ENUM 타입 확인 (PostgreSQL only)"""
    print("\n" + "=" * 60)
    print("📊 [4/4] ENUM 타입 확인 (PostgreSQL)")
    print("=" * 60)

    with engine.connect() as connection:
        try:
            result = connection.execute(text("""
                SELECT enumlabel
                FROM pg_enum
                WHERE enumtypid IN (
                    SELECT oid FROM pg_type
                    WHERE typname IN ('sss_status_enum', 'payment_from_enum', 'settlement_status_enum')
                )
                ORDER BY enumtypid, enumsortorder
            """))

            enums = [row[0] for row in result.fetchall()]

            if not enums:
                print("⚠️ ENUM 타입을 찾을 수 없습니다. (이미 VARCHAR로 변경되었을 수 있음)")
            else:
                print("✅ ENUM 타입 목록:")
                for enum_val in enums:
                    print(f"  • {enum_val}")

            return True
        except Exception as e:
            print(f"⚠️ ENUM 확인 중 오류: {e}")
            return False


def check_data_samples():
    """데이터 샘플 조회"""
    print("\n" + "=" * 60)
    print("📊 [추가] 데이터 샘플 조회")
    print("=" * 60)

    with engine.connect() as connection:
        # Bookings 샘플
        try:
            result = connection.execute(text("""
                SELECT
                    id,
                    total_amount,
                    sss_status,
                    payment_from,
                    settlement_status,
                    created_at
                FROM bookings
                LIMIT 5
            """))

            rows = result.fetchall()
            if rows:
                print("\n✅ Bookings 샘플 (최근 5개):")
                print(f"{'ID':<10} {'Amount':<12} {'SSS':<15} {'Payment':<15} {'Settlement':<15}")
                print("-" * 70)
                for row in rows:
                    print(f"{row[0]:<10} {row[1]:<12} {row[2]:<15} {row[3]:<15} {row[4]:<15}")
            else:
                print("ℹ️ Bookings 데이터가 없습니다.")
        except Exception as e:
            print(f"⚠️ Bookings 샘플 조회 중 오류: {e}")

        # CompanySettlements 샘플
        try:
            result = connection.execute(text("""
                SELECT
                    id,
                    company_id,
                    settlement_period_year,
                    settlement_period_month,
                    total_revenue,
                    status
                FROM company_settlements
                LIMIT 5
            """))

            rows = result.fetchall()
            if rows:
                print("\n✅ CompanySettlements 샘플 (최근 5개):")
                print(f"{'ID':<8} {'Company':<10} {'Period':<10} {'Revenue':<12} {'Status':<15}")
                print("-" * 60)
                for row in rows:
                    period = f"{row[2]}-{row[3]:02d}"
                    print(f"{row[0]:<8} {row[1]:<10} {period:<10} {row[4]:<12} {row[5]:<15}")
            else:
                print("ℹ️ CompanySettlements 데이터가 없습니다.")
        except Exception as e:
            print(f"⚠️ CompanySettlements 샘플 조회 중 오류: {e}")


def main():
    """메인 검증 실행"""
    print("\n" + "=" * 60)
    print("🚀 Payment System 마이그레이션 검증")
    print("=" * 60)
    print(f"📅 검증일: {os.popen('date').read().strip()}")

    # 1️⃣ 테이블 확인
    table_results = check_tables()

    # 2️⃣ Bookings 컬럼 확인
    column_results = check_booking_columns()

    # 3️⃣ 인덱스 확인
    index_results = check_indexes()

    # 4️⃣ ENUM 확인
    enum_result = check_enums()

    # 5️⃣ 데이터 샘플 조회
    check_data_samples()

    # ━━━ 최종 결과 ━━━
    print("\n" + "=" * 60)
    print("✅ 검증 완료")
    print("=" * 60)

    all_tables = all(table_results.values())
    all_columns = all(column_results.values())
    any_indexes = any(index_results.values())

    print(f"\n📋 검증 결과:")
    print(f"  {'✅' if all_tables else '❌'} 테이블: {'모두 존재' if all_tables else '일부 누락'}")
    print(f"  {'✅' if all_columns else '❌'} Bookings 필드: {'모두 존재' if all_columns else '일부 누락'}")
    print(f"  {'✅' if any_indexes else '⚠️'} 인덱스: {'생성됨' if any_indexes else '생성되지 않음'}")

    if all_tables and all_columns:
        print(f"\n🎉 마이그레이션이 완료되었습니다!")
        return 0
    else:
        print(f"\n⚠️ 마이그레이션이 완전하지 않습니다. 위의 빨간색 항목을 확인하세요.")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n⚠️ 검증이 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 검증 실패: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
