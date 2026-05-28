"""
📌 Audit Log 모델 - 모든 재무 작업 추적
📋 목적: 변경 이력, 사용자, 시간 기록
🔧 포함: 생성, 수정, 삭제 작업 추적
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Index
import enum
from app.database import Base


class AuditActionEnum(str, enum.Enum):
    """감사 로그 작업 타입"""
    # ================== Financial (지출, 예산) ==================
    EXPENSE_CREATED = "expense_created"
    EXPENSE_UPDATED = "expense_updated"
    EXPENSE_DELETED = "expense_deleted"
    CATEGORY_CREATED = "category_created"
    CATEGORY_UPDATED = "category_updated"
    BUDGET_SET = "budget_set"
    BUDGET_UPDATED = "budget_updated"
    REVENUE_RECORDED = "revenue_recorded"
    EXPORT_GENERATED = "export_generated"

    # ================== Payroll - Employee (직원) ==================
    EMPLOYEE_CREATED = "employee_created"
    EMPLOYEE_UPDATED = "employee_updated"
    EMPLOYEE_DELETED = "employee_deleted"

    # ================== Payroll - Cash Advance (선지급) ==================
    CASH_ADVANCE_CREATED = "cash_advance_created"
    CASH_ADVANCE_APPROVED = "cash_advance_approved"
    CASH_ADVANCE_REJECTED = "cash_advance_rejected"
    CASH_ADVANCE_SETTLED = "cash_advance_settled"

    # ================== Payroll - Attendance (출퇴근) ==================
    ATTENDANCE_CREATED = "attendance_created"
    ATTENDANCE_UPDATED = "attendance_updated"

    # ================== Payroll - PayrollPeriod (정산 기간) ==================
    PAYROLL_PERIOD_CREATED = "payroll_period_created"
    PAYROLL_PERIOD_APPROVED = "payroll_period_approved"
    PAYROLL_PERIOD_PAID = "payroll_period_paid"

    # ================== Payroll - PayrollRecord (개인별 정산) ==================
    PAYROLL_RECORD_CALCULATED = "payroll_record_calculated"
    PAYROLL_RECORD_UPDATED = "payroll_record_updated"
    PAYROLL_RECORD_APPROVED = "payroll_record_approved"

    # ================== Payroll - Holiday (공휴일) ==================
    HOLIDAY_CREATED = "holiday_created"
    HOLIDAY_DELETED = "holiday_deleted"

    # ================== Booking (예약) ==================
    BOOKING_CREATED = "booking_created"
    BOOKING_UPDATED = "booking_updated"
    BOOKING_DELETED = "booking_deleted"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"

    # ================== Bed (침대) ==================
    BED_STATUS_CHANGED = "bed_status_changed"
    BED_CUSTOMER_UPDATED = "bed_customer_updated"

    # ================== Therapist (테라피스트) ==================
    THERAPIST_CREATED = "therapist_created"
    THERAPIST_UPDATED = "therapist_updated"
    THERAPIST_DELETED = "therapist_deleted"
    THERAPIST_CHECKIN = "therapist_checkin"
    THERAPIST_CHECKOUT = "therapist_checkout"

    # ================== Customer (고객) ==================
    CUSTOMER_CREATED = "customer_created"
    CUSTOMER_UPDATED = "customer_updated"
    CUSTOMER_DELETED = "customer_deleted"

    # ================== Driver (드라이버) ==================
    DRIVER_WITHDRAWAL_REQUESTED = "driver_withdrawal_requested"
    DRIVER_WITHDRAWAL_APPROVED = "driver_withdrawal_approved"
    DRIVER_WITHDRAWAL_REJECTED = "driver_withdrawal_rejected"
    DRIVER_BOOKING_STATUS_CHANGED = "driver_booking_status_changed"

    # ================== Chat (채팅) ==================
    CHAT_CREATED = "chat_created"
    CHAT_UPDATED = "chat_updated"

    # ================== Review (리뷰) ==================
    REVIEW_CREATED = "review_created"

    # ================== Service (서비스) ==================
    SERVICE_CREATED = "service_created"
    SERVICE_UPDATED = "service_updated"

    # ================== SSS (사회보험) ==================
    SSS_RECORD_CREATED = "sss_record_created"
    SSS_RECORD_UPDATED = "sss_record_updated"
    SSS_RECORD_DELETED = "sss_record_deleted"

    # ================== Stamp & Coupon (스탬프/쿠폰) ==================
    STAMP_AWARDED = "stamp_awarded"
    COUPON_ISSUED = "coupon_issued"
    COUPON_USED = "coupon_used"

    # ================== Location (위치) ==================
    LOCATION_CREATED = "location_created"

    # ================== Admin Data Import (관리자 데이터 임포트) ==================
    ADMIN_DATA_IMPORTED = "admin_data_imported"


class AuditLog(Base):
    """감사 로그 테이블"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    action = Column(Enum(AuditActionEnum), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    user_email = Column(String(255), nullable=True)
    entity_type = Column(String(50), nullable=False)  # 'expense', 'budget', etc.
    entity_id = Column(Integer, nullable=True)
    changes = Column(Text, nullable=True)  # JSON 형식의 변경사항
    old_value = Column(Text, nullable=True)  # 이전 값 (JSON)
    new_value = Column(Text, nullable=True)  # 새 값 (JSON)
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(String(500), nullable=True)  # User-Agent 헤더
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_audit_user_date", "user_id", "created_at"),
        Index("ix_audit_action_date", "action", "created_at"),
        Index("ix_audit_entity", "entity_type", "entity_id"),
    )

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id} at {self.created_at}>"
