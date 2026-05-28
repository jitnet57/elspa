"""
📌 드라이버 모델
📋 목적: 드라이버 프로필, 위치, 수익금 관리
📅 작성일: 2026-05-24
"""

from sqlalchemy import Column, BigInteger, String, Float, DateTime, Numeric, Integer, func, Boolean
from app.database import Base


class Driver(Base):
    """드라이버 프로필"""
    __tablename__ = "drivers"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, nullable=False, unique=True, index=True)  # 사용자 계정
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)

    # 차량 정보
    vehicle_type = Column(String(50))  # sedan, suv, van
    vehicle_brand = Column(String(100))
    vehicle_model = Column(String(100))
    license_plate = Column(String(50), unique=True)
    vehicle_color = Column(String(50))

    # 운전면허
    license_number = Column(String(50), unique=True)
    license_expiry = Column(DateTime)

    # 상태
    status = Column(String(20), default='offline')  # online, offline, on_trip
    is_active = Column(Boolean, default=True)

    # 평점
    rating = Column(Float, default=5.0)  # 1-5점
    total_trips = Column(Integer, default=0)
    completed_trips = Column(Integer, default=0)

    # 수익
    total_earnings = Column(Numeric(12, 2), default=0)  # 누적 수익
    today_earnings = Column(Numeric(12, 2), default=0)  # 오늘 수익
    this_week_earnings = Column(Numeric(12, 2), default=0)  # 이번주 수익

    # 계좌 정보
    bank_name = Column(String(50))
    account_holder = Column(String(255))
    account_number = Column(String(50))

    # 타임스탬프
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)


class DriverBooking(Base):
    """드라이버 - 예약 매핑"""
    __tablename__ = "driver_bookings"

    id = Column(BigInteger, primary_key=True, index=True)
    driver_id = Column(BigInteger, nullable=False, index=True)
    booking_id = Column(BigInteger, nullable=False, index=True)

    # 서비스 위치
    customer_address = Column(String(500), nullable=False)
    customer_lat = Column(Float)
    customer_lng = Column(Float)

    # 예약 상태
    status = Column(String(20), default='pending')  # pending, accepted, rejected, ongoing, completed

    # 서비스 정보
    service_type = Column(String(100))  # 마사지, 케어 등
    therapist_id = Column(BigInteger)  # 배정된 테라피스트
    scheduled_time = Column(DateTime, nullable=False)

    # 수익
    driver_earnings = Column(Numeric(12, 2), default=0)  # 드라이버 수익

    # 타임스탬프
    pickup_time = Column(DateTime)  # 고객 픽업 시간
    dropoff_time = Column(DateTime)  # 드롭 시간
    completed_at = Column(DateTime)  # 완료 시간
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class DriverEarnings(Base):
    """드라이버 수익 내역"""
    __tablename__ = "driver_earnings"

    id = Column(BigInteger, primary_key=True, index=True)
    driver_id = Column(BigInteger, nullable=False, index=True)
    booking_id = Column(BigInteger, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    source = Column(String(50))  # pickup_fee, trip_earnings, bonus

    # 날짜
    earned_date = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())


class DriverWithdrawal(Base):
    """드라이버 정산 신청"""
    __tablename__ = "driver_withdrawals"

    id = Column(BigInteger, primary_key=True, index=True)
    driver_id = Column(BigInteger, nullable=False, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default='pending')  # pending, approved, completed, rejected

    # 계좌 정보
    bank_name = Column(String(50))
    account_number = Column(String(50))
    account_holder = Column(String(255))

    # 타임스탬프
    requested_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
