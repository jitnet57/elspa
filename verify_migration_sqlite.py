#!/usr/bin/env python3
"""
SQLite 마이그레이션 검증 스크립트
경로: verify_migration_sqlite.py
목적: 현재 SQLite 환경에서 Payment System 필드 존재 여부 확인
작성일: 2026-06-02
"""

import os
import sys
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

# 환경 설정
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
db_path = DATABASE_URL.replace("sqlite:///", "")

# 절대 경로로 변환
if not db_path.startswith("/"):
    db_path = os.path.join(os.getcwd(), db_path)

print("\n" + "=" * 70)
print("🚀 SQLite Payment System 마이그레이션 검증")
print("=" * 70)
print(f"📅 검증일: {os.popen('date').read().strip()}")
print(f"📍 데이터베이스: {db_path}")

# 데이터베이스 파일 확인
if not os.path.exists(db_path):
    print(f"\n❌ 데이터베이스 파일을 찾을 수 없습니다: {db_path}")
    sys.exit(1)

print(f"✅ 데이터베이스 파일 존재 (크기: {os.path.getsize(db_path):,} bytes)\n")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ━━━ 1️⃣ 테이블 존재 여부 ━━━
    print("=" * 70)
    print("📊 [1/3] 필수 테이블 확인")
    print("=" * 70)

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = {row[0] for row in cursor.fetchall()}

    required_tables = [
        "bookings",
        "company_settlements",
        "settlement_transactions",
    ]

    table_results = {}
    for table_name in required_tables:
        exists = table_name in tables
        status = "✅" if exists else "❌"
        table_results[table_name] = exists
        print(f"{status} {table_name}")

    # ━━━ 2️⃣ Bookings 컬럼 확인 ━━━
    print("\n" + "=" * 70)
    print("📊 [2/3] Bookings 테이블 필드 확인")
    print("=" * 70)

    required_columns = {
        'payment_methods': 'JSON 형식',
        'sss_status': 'SSS 정산 상태',
        'payment_from': '결제 출처',
        'settlement_status': '정산 상태',
        'total_amount': '총 예약 금액',
        'sss_amount': 'SSS 정산액',
    }

    column_results = {}

    if "bookings" in tables:
        cursor.execute("PRAGMA table_info(bookings)")
        columns = {row[1]: row for row in cursor.fetchall()}

        print(f"\n{'컬럼명':<25} {'타입':<15} {'설명':<30}")
        print("-" * 70)

        for col_name, description in required_columns.items():
            if col_name in columns:
                col_info = columns[col_name]
                col_type = col_info[2]  # type
                nullable = "NULL" if col_info[3] == 0 else "NOT NULL"
                status = "✅"
                column_results[col_name] = True
            else:
                col_type = "MISSING"
                nullable = ""
                status = "❌"
                column_results[col_name] = False

            print(f"{status} {col_name:<20} {col_type:<15} {description:<30}")

        # 전체 컬럼 목록
        print(f"\n전체 Bookings 컬럼 ({len(columns)}개):")
        for col_name in sorted(columns.keys()):
            col_info = columns[col_name]
            print(f"  • {col_name:<30} {col_info[2]:<15}")

    else:
        print("❌ bookings 테이블이 없습니다.")
        column_results = {col: False for col in required_columns}

    # ━━━ 3️⃣ 데이터 샘플 ━━━
    print("\n" + "=" * 70)
    print("📊 [3/3] 데이터 샘플")
    print("=" * 70)

    if "bookings" in tables:
        try:
            cursor.execute("""
                SELECT COUNT(*) as row_count
                FROM bookings
            """)
            count = cursor.fetchone()[0]
            print(f"\n✅ Bookings 테이블 행 수: {count:,}")

            if count > 0:
                cursor.execute("""
                    SELECT
                        id,
                        total_amount,
                        sss_status,
                        payment_from,
                        settlement_status,
                        created_at
                    FROM bookings
                    LIMIT 5
                """)

                print(f"\n샘플 데이터 (최대 5개):")
                print(f"{'ID':<10} {'Amount':<12} {'SSS':<15} {'Payment':<15} {'Settlement':<15}")
                print("-" * 70)

                for row in cursor.fetchall():
                    print(f"{row[0]:<10} {row[1]:<12} {row[2] or 'NULL':<15} {row[3] or 'NULL':<15} {row[4] or 'NULL':<15}")
        except Exception as e:
            print(f"⚠️ 데이터 조회 중 오류: {e}")

    # ━━━ 최종 결과 ━━━
    print("\n" + "=" * 70)
    print("✅ 검증 완료")
    print("=" * 70)

    all_tables = all(table_results.values())
    all_columns = all(column_results.values())

    print(f"\n📋 검증 결과:")
    print(f"  {'✅' if all_tables else '❌'} 테이블: {'모두 존재' if all_tables else '일부 누락'}")
    print(f"  {'✅' if all_columns else '❌'} 필드: {'모두 존재' if all_columns else '일부 누락'}")

    if all_tables and all_columns:
        print(f"\n🎉 SQLite에서 모든 필드가 준비되었습니다!")
        print("\n다음 단계:")
        print("  1. Supabase PostgreSQL로 마이그레이션")
        print("  2. .env 파일에서 DATABASE_URL을 PostgreSQL로 업데이트")
        print("  3. python app/migrations/20260602_payment_system_migration.py 실행")
    else:
        print(f"\n⚠️ 일부 필드가 누락되었습니다. 위의 빨간색 항목을 확인하세요.")

    conn.close()
    sys.exit(0 if (all_tables and all_columns) else 1)

except sqlite3.DatabaseError as e:
    print(f"\n❌ 데이터베이스 오류: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ 검증 실패: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
