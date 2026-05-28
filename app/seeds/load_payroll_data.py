"""
정산 시스템 테스트 목데이터 로더
경로: app/seeds/load_payroll_data.py
목적: payroll_test_data.py의 데이터를 데이터베이스에 로드
실행: python -m app.seeds.load_payroll_data
"""

import sys
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.payroll import (
    Employee, CashAdvance, AttendanceLog,
    PayrollPeriod, PhilippineHoliday
)
from app.models.massage_booking import MassageBooking
from app.seeds.payroll_test_data import (
    THERAPISTS_DATA, STAFF_DATA, BOOKINGS_DATA,
    ATTENDANCE_DATA, CASH_ADVANCES_DATA, HOLIDAYS_DATA,
    PAYROLL_PERIODS_DATA
)


def load_employees(db: Session):
    """직원 데이터 로드"""
    print("\n📌 직원 데이터 로딩...")

    # 기존 데이터 삭제 (테스트용)
    db.query(Employee).delete()

    all_employees = THERAPISTS_DATA + STAFF_DATA
    for emp_data in all_employees:
        employee = Employee(**emp_data)
        db.add(employee)

    db.commit()
    print(f"✅ {len(all_employees)}명의 직원 로드 완료")


def load_bookings(db: Session):
    """마사지 예약 데이터 로드"""
    print("\n📌 마사지 예약 데이터 로딩...")

    # 기존 데이터 삭제
    db.query(MassageBooking).delete()

    for booking_data in BOOKINGS_DATA:
        # MassageBooking 모델에 맞게 변환
        booking = MassageBooking(
            therapist_id=booking_data["therapist_id"],
            service_type=booking_data["service_type"],
            duration_minutes=booking_data["duration_minutes"],
            service_date=booking_data["service_date"],
            service_start_time=booking_data["service_start_time"],
            service_end_time=booking_data["service_end_time"],
            customer_name=booking_data["customer_name"],
            room_number=booking_data["room_number"],
            company_id=booking_data.get("company_id"),
            guide_id=booking_data.get("guide_id"),
            service_fee=booking_data["service_fee"],
            status=booking_data["status"],
        )
        db.add(booking)

    db.commit()
    print(f"✅ {len(BOOKINGS_DATA)}건의 마사지 예약 로드 완료")


def load_attendance(db: Session):
    """출퇴근 데이터 로드"""
    print("\n📌 출퇴근 데이터 로딩...")

    # 기존 데이터 삭제
    db.query(AttendanceLog).delete()

    for att_data in ATTENDANCE_DATA:
        attendance = AttendanceLog(**att_data)
        db.add(attendance)

    db.commit()
    print(f"✅ {len(ATTENDANCE_DATA)}건의 출퇴근 기록 로드 완료")


def load_cash_advances(db: Session):
    """CA 선금 데이터 로드"""
    print("\n📌 CA 선금 데이터 로딩...")

    # 기존 데이터 삭제
    db.query(CashAdvance).delete()

    for ca_data in CASH_ADVANCES_DATA:
        cash_advance = CashAdvance(**ca_data)
        db.add(cash_advance)

    db.commit()
    print(f"✅ {len(CASH_ADVANCES_DATA)}건의 CA 선금 로드 완료")


def load_holidays(db: Session):
    """공휴일 데이터 로드"""
    print("\n📌 공휴일 데이터 로딩...")

    # 기존 데이터 삭제
    db.query(PhilippineHoliday).delete()

    for holiday_data in HOLIDAYS_DATA:
        holiday = PhilippineHoliday(**holiday_data)
        db.add(holiday)

    db.commit()
    print(f"✅ {len(HOLIDAYS_DATA)}건의 공휴일 로드 완료")


def load_payroll_periods(db: Session):
    """정산 기간 데이터 로드"""
    print("\n📌 정산 기간 데이터 로딩...")

    # 기존 데이터 삭제
    db.query(PayrollPeriod).delete()

    for period_data in PAYROLL_PERIODS_DATA:
        period = PayrollPeriod(**period_data)
        db.add(period)

    db.commit()
    print(f"✅ {len(PAYROLL_PERIODS_DATA)}개의 정산 기간 로드 완료")


def main():
    """전체 데이터 로드"""
    print("\n" + "="*60)
    print("⚡ 정산 시스템 테스트 목데이터 로더 시작")
    print("="*60)

    # 데이터베이스 초기화
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        load_employees(db)
        load_bookings(db)
        load_attendance(db)
        load_cash_advances(db)
        load_holidays(db)
        load_payroll_periods(db)

        print("\n" + "="*60)
        print("✅ 모든 목데이터 로드 완료!")
        print("="*60)
        print("\n📊 로드된 데이터 요약:")
        print(f"  • 직원: {db.query(Employee).count()}명")
        print(f"  • 마사지 예약: {db.query(MassageBooking).count()}건")
        print(f"  • 출퇴근 기록: {db.query(AttendanceLog).count()}건")
        print(f"  • CA 선금: {db.query(CashAdvance).count()}건")
        print(f"  • 공휴일: {db.query(PhilippineHoliday).count()}개")
        print(f"  • 정산 기간: {db.query(PayrollPeriod).count()}개")

        print("\n📱 사용 가능한 엔드포인트:")
        print("  • GET /api/payroll/periods - 정산 기간 조회")
        print("  • POST /api/payroll/periods/{id}/calculate - 급여 계산")
        print("  • POST /api/payroll/periods/{id}/approve - 정산 승인")

    except Exception as e:
        print(f"\n❌ 에러 발생: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
