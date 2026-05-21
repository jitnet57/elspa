"""
초기 데이터 생성 스크립트
경로: scripts/init_payroll_data.py
작성일: 2026-05-21
목적: 필리핀 공휴일 2026년 데이터 초기화
"""

import sys
from datetime import date
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

from sqlalchemy.orm import sessionmaker, Session
from app.database import Base, engine
from app.models.payroll import PhilippineHoliday

# 동기 세션 팩토리
SyncSession = sessionmaker(bind=engine)


def init_philippine_holidays_2026(db: Session):
    """2026년 필리핀 공휴일 데이터 초기화"""

    holidays = [
        # 국가 공휴일 (200%)
        {
            "holiday_date": date(2026, 1, 1),
            "holiday_name": "새해 첫날",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 2, 10),
            "holiday_name": "EDSA 혁명 기념일",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 2, 25),
            "holiday_name": "EDSA 혁명 기념일 (대체공휴일)",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 3, 28),
            "holiday_name": "성토마스 주일",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 3, 29),
            "holiday_name": "부활절 일요일",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 4, 9),
            "holiday_name": "필리핀 혁명 기념일",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 6, 12),
            "holiday_name": "필리핀 독립 기념일",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 8, 21),
            "holiday_name": "니노이 아키노 기념일",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 11, 1),
            "holiday_name": "만성절",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 11, 30),
            "holiday_name": "보니파시오 날",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 12, 8),
            "holiday_name": "성모 마리아 무염시태",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 12, 25),
            "holiday_name": "성탄절",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },
        {
            "holiday_date": date(2026, 12, 30),
            "holiday_name": "리잘 기념일 (대체)",
            "holiday_type": "national",
            "rate_multiplier": 2.0
        },

        # 특정 공휴일 (130%)
        {
            "holiday_date": date(2026, 2, 9),
            "holiday_name": "마닐라 해방 기념일",
            "holiday_type": "special",
            "rate_multiplier": 1.3
        },
        {
            "holiday_date": date(2026, 4, 10),
            "holiday_name": "착한 금요일",
            "holiday_type": "special",
            "rate_multiplier": 1.3
        },
    ]

    # 기존 공휴일 삭제
    db.query(PhilippineHoliday).delete()
    db.commit()

    # 새 공휴일 추가
    for holiday_data in holidays:
        holiday = PhilippineHoliday(**holiday_data)
        db.add(holiday)

    db.commit()
    print(f"✅ {len(holidays)}개 공휴일 데이터 초기화 완료")


def init_database():
    """데이터베이스 초기화"""
    print("🔄 데이터베이스 테이블 생성 중...")
    Base.metadata.create_all(bind=engine)
    print("✅ 데이터베이스 테이블 생성 완료")

    db = SyncSession()
    try:
        print("\n🔄 공휴일 데이터 초기화 중...")
        init_philippine_holidays_2026(db)
        print("✅ 모든 초기 데이터 생성 완료\n")
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
