"""
📌 드라이버 서비스
📋 목적: 드라이버 비즈니스 로직 (프로필, 예약, 수익, 위치)
📅 작성일: 2026-05-24
"""

from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timedelta
from app.models import Driver, DriverBooking, DriverEarnings, Location, DriverWithdrawal


class DriverService:
    """드라이버 비즈니스 로직"""

    @staticmethod
    def _get_timestamp() -> str:
        """현재 타임스탬프 반환 (ISO 8601)"""
        return datetime.utcnow().isoformat() + "Z"

    @staticmethod
    def get_driver_profile(db: Session, driver_id: int):
        """드라이버 프로필 조회"""
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None
        return {
            "id": driver.id,
            "name": driver.name,
            "phone": driver.phone,
            "email": driver.email,
            "vehicle_type": driver.vehicle_type,
            "vehicle_brand": driver.vehicle_brand,
            "license_plate": driver.license_plate,
            "status": driver.status,
            "rating": float(driver.rating),
            "total_trips": driver.total_trips,
            "completed_trips": driver.completed_trips,
            "total_earnings": float(driver.total_earnings or 0),
            "bank_name": driver.bank_name,
            "account_holder": driver.account_holder,
        }

    @staticmethod
    def get_today_bookings(db: Session, driver_id: int):
        """오늘의 배정 목록 조회"""
        today = datetime.now().date()
        bookings = db.query(DriverBooking).filter(
            DriverBooking.driver_id == driver_id,
            DriverBooking.scheduled_time >= datetime.combine(today, datetime.min.time()),
            DriverBooking.scheduled_time <= datetime.combine(today, datetime.max.time())
        ).all()

        return [
            {
                "id": b.id,
                "booking_id": b.booking_id,
                "customer_address": b.customer_address,
                "service_type": b.service_type,
                "scheduled_time": b.scheduled_time.isoformat(),
                "status": b.status,
                "earnings": float(b.driver_earnings or 0),
            }
            for b in bookings
        ]

    @staticmethod
    def get_earnings_summary(db: Session, driver_id: int):
        """수익 현황 조회"""
        today = datetime.now().date()
        week_start = datetime.now().date() - timedelta(days=datetime.now().weekday())
        month_start = datetime.now().replace(day=1).date()

        # 일일 수익
        today_earnings = db.query(DriverEarnings).filter(
            DriverEarnings.driver_id == driver_id,
            DriverEarnings.earned_date >= datetime.combine(today, datetime.min.time())
        ).all()
        today_total = sum(float(e.amount) for e in today_earnings)

        # 주간 수익
        week_earnings = db.query(DriverEarnings).filter(
            DriverEarnings.driver_id == driver_id,
            DriverEarnings.earned_date >= datetime.combine(week_start, datetime.min.time())
        ).all()
        week_total = sum(float(e.amount) for e in week_earnings)

        # 월간 수익
        month_earnings = db.query(DriverEarnings).filter(
            DriverEarnings.driver_id == driver_id,
            DriverEarnings.earned_date >= datetime.combine(month_start, datetime.min.time())
        ).all()
        month_total = sum(float(e.amount) for e in month_earnings)

        return {
            "today": today_total,
            "this_week": week_total,
            "this_month": month_total,
            "breakdown": [
                {
                    "id": e.id,
                    "amount": float(e.amount),
                    "source": e.source,
                    "earned_date": e.earned_date.isoformat(),
                }
                for e in today_earnings
            ],
        }

    @staticmethod
    def update_driver_location(db: Session, driver_id: int, latitude: float, longitude: float, accuracy: float = None):
        """드라이버 위치 업데이트"""
        location = Location(
            entity_type="driver",
            entity_id=driver_id,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
        )
        db.add(location)
        db.commit()
        return {
            "id": location.id,
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "timestamp": location.created_at.isoformat(),
        }

    @staticmethod
    def get_driver_location(db: Session, driver_id: int):
        """드라이버 최신 위치 조회"""
        location = db.query(Location).filter(
            Location.entity_type == "driver",
            Location.entity_id == driver_id
        ).order_by(Location.created_at.desc()).first()

        if not location:
            return None
        return {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "accuracy": location.accuracy,
            "timestamp": location.created_at.isoformat(),
        }

    @staticmethod
    def accept_booking(db: Session, driver_id: int, booking_id: int):
        """예약 수락"""
        booking = db.query(DriverBooking).filter(
            DriverBooking.driver_id == driver_id,
            DriverBooking.id == booking_id
        ).first()

        if not booking:
            return None

        booking.status = "accepted"
        booking.updated_at = datetime.now()
        db.commit()
        return {"id": booking.id, "status": "accepted", "updated_at": booking.updated_at.isoformat()}

    @staticmethod
    def reject_booking(db: Session, driver_id: int, booking_id: int):
        """예약 거절"""
        booking = db.query(DriverBooking).filter(
            DriverBooking.driver_id == driver_id,
            DriverBooking.id == booking_id
        ).first()

        if not booking:
            return None

        booking.status = "rejected"
        booking.updated_at = datetime.now()
        db.commit()
        return {"id": booking.id, "status": "rejected", "updated_at": booking.updated_at.isoformat()}

    @staticmethod
    def start_trip(db: Session, driver_id: int, booking_id: int):
        """여행 시작"""
        booking = db.query(DriverBooking).filter(
            DriverBooking.driver_id == driver_id,
            DriverBooking.id == booking_id
        ).first()

        if not booking:
            return None

        booking.status = "ongoing"
        booking.pickup_time = datetime.now()
        booking.updated_at = datetime.now()

        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if driver:
            driver.status = "on_trip"

        db.commit()
        return {"id": booking.id, "status": "ongoing", "pickup_time": booking.pickup_time.isoformat()}

    @staticmethod
    def complete_trip(db: Session, driver_id: int, booking_id: int):
        """여행 완료"""
        booking = db.query(DriverBooking).filter(
            DriverBooking.driver_id == driver_id,
            DriverBooking.id == booking_id
        ).first()

        if not booking:
            return None

        booking.status = "completed"
        booking.dropoff_time = datetime.now()
        booking.completed_at = datetime.now()
        booking.updated_at = datetime.now()

        # 수익 기록
        if booking.driver_earnings:
            earnings = DriverEarnings(
                driver_id=driver_id,
                booking_id=booking_id,
                amount=booking.driver_earnings,
                source="trip_earnings",
            )
            db.add(earnings)

        # 드라이버 통계 업데이트
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if driver:
            driver.completed_trips = (driver.completed_trips or 0) + 1
            driver.total_trips = (driver.total_trips or 0) + 1
            driver.total_earnings = (driver.total_earnings or 0) + (booking.driver_earnings or 0)
            driver.today_earnings = (driver.today_earnings or 0) + (booking.driver_earnings or 0)
            driver.status = "online"

        db.commit()
        return {
            "id": booking.id,
            "status": "completed",
            "dropoff_time": booking.dropoff_time.isoformat(),
            "earnings": float(booking.driver_earnings or 0),
        }

    @staticmethod
    def request_withdrawal(db: Session, driver_id: int, amount: float, bank_name: str, account_number: str, account_holder: str):
        """출금 요청"""
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None

        # 가용 잔액 확인 (출금 가능한 금액)
        available_balance = float(driver.total_earnings or 0) - float(driver.withdrawn_amount or 0)
        if amount > available_balance:
            return {"error": f"출금 가능 금액({available_balance:,.0f})을 초과했습니다"}

        # 출금 요청 생성
        withdrawal = DriverWithdrawal(
            driver_id=driver_id,
            amount=amount,
            bank_name=bank_name,
            account_number=account_number,
            account_holder=account_holder,
            status="pending",  # pending, approved, completed, rejected
            created_at=datetime.now(),
        )
        db.add(withdrawal)
        db.commit()

        return {
            "id": withdrawal.id,
            "driver_id": withdrawal.driver_id,
            "amount": float(withdrawal.amount),
            "status": withdrawal.status,
            "created_at": withdrawal.created_at.isoformat(),
        }

    @staticmethod
    def get_withdrawals(db: Session, driver_id: int):
        """드라이버의 출금 이력 조회"""
        withdrawals = db.query(DriverWithdrawal).filter(
            DriverWithdrawal.driver_id == driver_id
        ).order_by(DriverWithdrawal.created_at.desc()).all()

        return [
            {
                "id": w.id,
                "amount": float(w.amount),
                "status": w.status,
                "bank_name": w.bank_name,
                "account_number": w.account_number[-4:],  # 마지막 4자리만 표시
                "created_at": w.created_at.isoformat(),
                "completed_at": w.completed_at.isoformat() if w.completed_at else None,
            }
            for w in withdrawals
        ]

    @staticmethod
    def get_withdrawal_balance(db: Session, driver_id: int):
        """출금 가능 금액 조회"""
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None

        total_earnings = float(driver.total_earnings or 0)
        withdrawn_amount = float(driver.withdrawn_amount or 0)
        available_balance = total_earnings - withdrawn_amount

        return {
            "driver_id": driver_id,
            "total_earnings": total_earnings,
            "withdrawn_amount": withdrawn_amount,
            "available_balance": available_balance,
            "pending_withdrawals": float(
                sum(w.amount for w in driver.withdrawals if w.status == "pending") or 0
            ),
        }
