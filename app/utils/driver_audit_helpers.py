"""
📌 Driver Audit Logging Helpers
📋 목적: 드라이버(Driver) 및 배차 관련 감시 로그
🔧 사용: 드라이버 상태변경, 출금 요청 등 시 호출
📅 작성일: 2026-05-28
"""

from sqlalchemy.orm import Session
from app.services.audit_service import AuditService
from app.models.driver import Driver
from app.models.driver_withdrawal import DriverWithdrawal


def log_driver_withdrawal_requested(
    db: Session,
    withdrawal: DriverWithdrawal,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 드라이버 출금 요청 로그
    📋 목적: 드라이버가 출금을 요청했을 때 기록
    """
    audit_service = AuditService(db)

    new_value = {
        "id": withdrawal.id,
        "driver_id": withdrawal.driver_id if hasattr(withdrawal, 'driver_id') else None,
        "amount": float(withdrawal.amount) if hasattr(withdrawal, 'amount') else None,
        "status": withdrawal.status if hasattr(withdrawal, 'status') else None,
        "requested_at": str(withdrawal.requested_at) if hasattr(withdrawal, 'requested_at') else None,
    }

    audit_service.log_action(
        action="DRIVER_WITHDRAWAL_REQUESTED",
        user_id=user_id,
        user_email=user_email,
        entity_type="driver_withdrawal",
        entity_id=withdrawal.id,
        old_value=None,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_driver_withdrawal_approved(
    db: Session,
    withdrawal: DriverWithdrawal,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 드라이버 출금 승인 로그
    📋 목적: 출금이 승인되었을 때 기록
    """
    audit_service = AuditService(db)

    old_value = {
        "status": "pending" if hasattr(withdrawal, 'status') else None,
    }

    new_value = {
        "id": withdrawal.id,
        "driver_id": withdrawal.driver_id if hasattr(withdrawal, 'driver_id') else None,
        "amount": float(withdrawal.amount) if hasattr(withdrawal, 'amount') else None,
        "status": "approved",
        "completed_at": str(withdrawal.completed_at) if hasattr(withdrawal, 'completed_at') else None,
    }

    audit_service.log_action(
        action="DRIVER_WITHDRAWAL_APPROVED",
        user_id=user_id,
        user_email=user_email,
        entity_type="driver_withdrawal",
        entity_id=withdrawal.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_driver_booking_status_changed(
    db: Session,
    booking_id: int,
    driver_id: int,
    old_status: str,
    new_status: str,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 드라이버 배차 상태 변경 로그
    📋 목적: 배차 상태가 변경되었을 때 기록 (pending → accepted 등)
    """
    audit_service = AuditService(db)

    old_value = {
        "status": old_status,
    }

    new_value = {
        "booking_id": booking_id,
        "driver_id": driver_id,
        "status": new_status,
    }

    audit_service.log_action(
        action="DRIVER_BOOKING_STATUS_CHANGED",
        user_id=user_id,
        user_email=user_email,
        entity_type="driver_booking",
        entity_id=booking_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )
