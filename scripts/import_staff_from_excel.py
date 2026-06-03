#!/usr/bin/env python3
"""
============================================================
📌 스크립트: 엑셀 직원 데이터 → Supabase 임포트
📋 목적: 1 JANUARY 15, 2026.xlsx 에서 추출한 39명 직원을 DB에 저장
📅 작성일: 2026-06-03
============================================================

실행 방법:
  python3 scripts/import_staff_from_excel.py

데이터 소스:
  - OFFICE (7명): 정직원 (Secretary, Spa Manager 등)
  - DRIVERS (4명): 드라이버
  - YEGA (10명): 요가 레스토랑 직원
  - HOLLYS (6명): 홀리스 카페 직원
  - EL STAFF (12명): EL 스파 직원
"""

import asyncio
import json
from typing import List
from pydantic import BaseModel

# 데이터베이스 설정
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import Staff
from app.database import Base


# ============================================================
# 직원 데이터 정의
# ============================================================
STAFF_DATA = [
    # OFFICE (정직원 - 7명)
    {"name": "JANETTE DALIDA", "position": "SPA MANAGER", "employment_type": "정직원"},
    {"name": "JONATHAN HIMAYA", "position": "HOLLYS MANAGER", "employment_type": "정직원"},
    {"name": "KIMBERLEY ACE SHAPIT", "position": "SECRETARY", "employment_type": "정직원"},
    {"name": "MELONIE ABING", "position": "OFFICE HELPER", "employment_type": "정직원"},
    {"name": "NINFA ESPINOSA", "position": "SPA MANAGER", "employment_type": "정직원"},
    {"name": "PHILIP ESPINOSA", "position": "HEAD MAINTENANCE", "employment_type": "정직원"},
    {"name": "ROSEMARIE LOMOD", "position": "ACCOUNTANT", "employment_type": "정직원"},

    # DRIVERS (드라이버 - 4명)
    {"name": "BRIAN CONDE", "position": "DRIVER", "employment_type": "드라이버"},
    {"name": "EUGINE LUARDO", "position": "DRIVER", "employment_type": "드라이버"},
    {"name": "NENEN", "position": "DRIVER", "employment_type": "드라이버"},
    {"name": "RUEL DORANO", "position": "DRIVER", "employment_type": "드라이버"},

    # YEGA (레스토랑 - 10명)
    {"name": "BOLLYN QUILLO", "position": "LINE COOK", "employment_type": "계약직"},
    {"name": "ERNESTO DUYARA", "position": "PREP COOK", "employment_type": "계약직"},
    {"name": "GERRY MARTINEZ", "position": "LINE COOK", "employment_type": "계약직"},
    {"name": "JIMCEL BAGUIO", "position": "LINE COOK", "employment_type": "계약직"},
    {"name": "JOSELITO ESPIRITU", "position": "PREP COOK", "employment_type": "계약직"},
    {"name": "KLINT MANAYON", "position": "DISHWASHER", "employment_type": "계약직"},
    {"name": "LEONARDO SARCUDO", "position": "LINE COOK", "employment_type": "계약직"},
    {"name": "LOLAY", "position": "LINE COOK", "employment_type": "계약직"},
    {"name": "MARLON ALQUIZAR", "position": "LINE COOK", "employment_type": "계약직"},
    {"name": "RAMON ESPIRITU", "position": "STEWARD", "employment_type": "계약직"},

    # HOLLYS (카페 - 6명)
    {"name": "ALBEN AMIT", "position": "BARISTA", "employment_type": "계약직"},
    {"name": "DEMETRIO HIMAYA", "position": "CHEF", "employment_type": "계약직"},
    {"name": "ELVIE TUNACAO", "position": "BARISTA", "employment_type": "계약직"},
    {"name": "JERIC ALBURO", "position": "CHEF", "employment_type": "계약직"},
    {"name": "JHERICA DEJITO", "position": "BARISTA", "employment_type": "계약직"},
    {"name": "LINDON YGOT", "position": "BARISTA", "employment_type": "계약직"},

    # EL STAFF (스파 직원 - 12명)
    {"name": "CHERRIE LOIS PRECIADO", "position": "HOUSEKEEPER", "employment_type": "정직원"},
    {"name": "ISADRA BELTRAN", "position": "LAUNDRY", "employment_type": "정직원"},
    {"name": "IVY MAE DINAPO", "position": "SOUVENIR", "employment_type": "정직원"},
    {"name": "JANETTE", "position": "STOCK ROOM", "employment_type": "정직원"},
    {"name": "LEI BENJIE", "position": "CLEANER", "employment_type": "정직원"},
    {"name": "LOURDES PANUNCIAL", "position": "HOUSEKEEPER", "employment_type": "정직원"},
    {"name": "MARY CLAIRE EJUSA", "position": "HOUSEKEEPER", "employment_type": "정직원"},
    {"name": "MARY JEAN DEL ROSARIO", "position": "HOUSEKEEPER", "employment_type": "정직원"},
    {"name": "MARY MAE APA", "position": "HOUSEKEEPER", "employment_type": "정직원"},
    {"name": "RENALEN APONTING", "position": "CASHIER", "employment_type": "정직원"},
    {"name": "ROSAINNE SANCHEZ", "position": "OFFICE", "employment_type": "정직원"},
    {"name": "VON FRIDAY VILLARUBIN", "position": "OFFICE", "employment_type": "정직원"},
]


# ============================================================
# 데이터베이스 연결 및 임포트 함수
# ============================================================
async def import_staff():
    """직원 데이터를 Supabase에 임포트합니다."""

    # Supabase 연결 문자열 (환경 변수에서 로드)
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL 환경 변수가 설정되지 않았습니다")
        print("   .env 파일에 DATABASE_URL을 설정하세요")
        return

    # 비동기 엔진 생성
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with engine.begin() as conn:
            # 테이블 생성 (필요 시)
            await conn.run_sync(Base.metadata.create_all)

        async with async_session() as session:
            created_count = 0
            skipped_count = 0
            errors = []

            print("=" * 80)
            print("📊 직원 데이터 임포트 시작...")
            print("=" * 80)
            print()

            for staff_data in STAFF_DATA:
                try:
                    # 중복 확인 (이름 기준)
                    result = await session.execute(
                        select(Staff).where(
                            func.lower(Staff.name) == staff_data["name"].lower()
                        )
                    )
                    existing = result.scalar()

                    if existing:
                        print(f"⏭️  스킵: {staff_data['name']} (이미 등록됨)")
                        skipped_count += 1
                        continue

                    # 새 직원 생성
                    new_staff = Staff(
                        name=staff_data["name"],
                        position=staff_data["position"],
                        employment_type=staff_data["employment_type"],
                    )
                    session.add(new_staff)
                    created_count += 1

                    print(f"✅ 추가: {staff_data['name']:<30} | {staff_data['position']:<20} | {staff_data['employment_type']}")

                except Exception as e:
                    errors.append({
                        "name": staff_data["name"],
                        "error": str(e)
                    })
                    print(f"❌ 오류: {staff_data['name']} - {str(e)}")

            # 커밋
            await session.commit()

            # 결과 요약
            print()
            print("=" * 80)
            print("📈 임포트 결과")
            print("=" * 80)
            print(f"✅ 추가된 직원: {created_count}명")
            print(f"⏭️  스킵된 직원: {skipped_count}명")
            if errors:
                print(f"❌ 오류: {len(errors)}건")
                for error in errors:
                    print(f"   - {error['name']}: {error['error']}")
            print()

            # 분류별 통계
            print("=" * 80)
            print("📊 직원 분류별 통계")
            print("=" * 80)

            result = await session.execute(
                select(
                    Staff.employment_type,
                    func.count(Staff.id).label("count")
                ).group_by(Staff.employment_type)
            )

            stats = result.all()
            total = sum(count for _, count in stats)

            for employment_type, count in sorted(stats):
                percentage = (count / total * 100) if total > 0 else 0
                print(f"  • {employment_type:<15} {count:>3}명 ({percentage:>5.1f}%)")

            print(f"  {'─' * 40}")
            print(f"  전체 직원       {total:>3}명 (100.0%)")
            print()

    except Exception as e:
        print(f"❌ 임포트 실패: {str(e)}")
        raise
    finally:
        await engine.dispose()


# ============================================================
# 메인 실행
# ============================================================
if __name__ == "__main__":
    asyncio.run(import_staff())
