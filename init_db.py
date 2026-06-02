#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
경로: init_db.py
목적: SQLAlchemy 모델을 기반으로 데이터베이스 테이블 생성
작성일: 2026-06-02
"""

import sys
import os
from dotenv import load_dotenv

# 환경 로드
load_dotenv()

# PYTHONPATH 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import (
    booking,
    company_settlement,
)

def init_db():
    """데이터베이스 테이블 생성"""
    print("\n" + "=" * 60)
    print("🚀 데이터베이스 초기화 시작")
    print("=" * 60)

    try:
        # 모든 모델 로드
        print("\n[1/2] 모델 로드 중...")
        print(f"  • Booking 모델: {booking.Booking.__tablename__}")
        print(f"  • CompanySettlement 모델: {company_settlement.CompanySettlement.__tablename__}")
        print(f"  • SettlementTransaction 모델: {company_settlement.SettlementTransaction.__tablename__}")

        # 테이블 생성
        print("\n[2/2] 테이블 생성 중...")
        Base.metadata.create_all(bind=engine)

        print("\n" + "=" * 60)
        print("✅ 데이터베이스 초기화 완료!")
        print("=" * 60)

        return 0

    except Exception as e:
        print(f"\n❌ 초기화 실패: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(init_db())
