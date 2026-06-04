"""
📌 Booking & Bed Audit Logging Helpers
📋 목적: 예약(Booking) 및 침대(Bed) 상태 변경 감시 로그
🔧 사용: 모든 예약 생성/수정/삭제 시 호출
📅 작성일: 2026-05-28
"""

from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.services.audit_service import AuditService
from app.models.booking import Booking
from app.models.bed import Bed


def log_booking_created(
    db: Session,
    booking: Booking,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 예약 생성 로그
    📋 목적: 새로운 예약이 생성되었을 때 기록
    """
    audit_service = AuditService(db)

    new_value = {
        "id": booking.id,
        "customer_id": booking.customer_id,
        "therapist_id": booking.therapist_id,
        "service_id": booking.service_id,
        "booking_date": str(booking.booking_date) if hasattr(booking, 'booking_date') else None,
        "status": booking.status if hasattr(booking, 'status') else None,
        "total_price": float(booking.total_price) if hasattr(booking, 'total_price') else None,
    }

    audit_service.log_action(
        action="BOOKING_CREATED",
        user_id=user_id,
        user_email=user_email,
        entity_type="booking",
        entity_id=booking.id,
        old_value=None,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_booking_updated(
    db: Session,
    old_booking: dict,
    new_booking: Booking,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 예약 수정 로그
    📋 목적: 예약 정보가 변경되었을 때 기록 (before/after)
    """
    audit_service = AuditService(db)

    old_value = old_booking
    new_value = {
        "id": new_booking.id,
        "customer_id": new_booking.customer_id,
        "therapist_id": new_booking.therapist_id,
        "service_id": new_booking.service_id,
        "booking_date": str(new_booking.booking_date) if hasattr(new_booking, 'booking_date') else None,
        "status": new_booking.status if hasattr(new_booking, 'status') else None,
        "total_price": float(new_booking.total_price) if hasattr(new_booking, 'total_price') else None,
    }

    audit_service.log_action(
        action="BOOKING_UPDATED",
        user_id=user_id,
        user_email=user_email,
        entity_type="booking",
        entity_id=new_booking.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_booking_deleted(
    db: Session,
    booking: Booking,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 예약 삭제 로그
    📋 목적: 예약이 삭제되었을 때 기록
    """
    audit_service = AuditService(db)

    old_value = {
        "id": booking.id,
        "customer_id": booking.customer_id,
        "therapist_id": booking.therapist_id,
        "service_id": booking.service_id,
        "booking_date": str(booking.booking_date) if hasattr(booking, 'booking_date') else None,
        "status": booking.status if hasattr(booking, 'status') else None,
        "total_price": float(booking.total_price) if hasattr(booking, 'total_price') else None,
    }

    audit_service.log_action(
        action="BOOKING_DELETED",
        user_id=user_id,
        user_email=user_email,
        entity_type="booking",
        entity_id=booking.id,
        old_value=old_value,
        new_value=None,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_bed_status_changed(
    db: Session,
    bed: Bed,
    old_status: str,
    new_status: str,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 침대 상태 변경 로그
    📋 목적: 침대 상태가 변경되었을 때 기록 (available → occupied 등)
    """
    audit_service = AuditService(db)

    old_value = {
        "id": bed.id,
        "status": old_status,
        "bed_number": bed.bed_number if hasattr(bed, 'bed_number') else None,
    }

    new_value = {
        "id": bed.id,
        "status": new_status,
        "bed_number": bed.bed_number if hasattr(bed, 'bed_number') else None,
        "customer_id": bed.customer_id if hasattr(bed, 'customer_id') else None,
        "therapist_id": bed.therapist_id if hasattr(bed, 'therapist_id') else None,
    }

    audit_service.log_action(
        action="BED_STATUS_CHANGED",
        user_id=user_id,
        user_email=user_email,
        entity_type="bed",
        entity_id=bed.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )
