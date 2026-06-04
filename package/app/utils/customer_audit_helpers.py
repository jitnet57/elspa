"""
📌 Customer Audit Logging Helpers
📋 목적: 고객(Customer) 생성/수정/삭제 감시 로그
🔧 사용: 모든 고객 관련 작업 시 호출
📅 작성일: 2026-05-28
"""

from sqlalchemy.orm import Session
from app.services.audit_service import AuditService
from app.models.customer import Customer


def log_customer_created(
    db: Session,
    customer: Customer,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 고객 생성 로그
    📋 목적: 새로운 고객이 등록되었을 때 기록
    """
    audit_service = AuditService(db)

    new_value = {
        "id": customer.id,
        "name": customer.name if hasattr(customer, 'name') else None,
        "phone": customer.phone if hasattr(customer, 'phone') else None,
        "email": customer.email if hasattr(customer, 'email') else None,
        "memo": customer.memo if hasattr(customer, 'memo') else None,
    }

    audit_service.log_action(
        action="CUSTOMER_CREATED",
        user_id=user_id,
        user_email=user_email,
        entity_type="customer",
        entity_id=customer.id,
        old_value=None,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_customer_updated(
    db: Session,
    old_customer: dict,
    new_customer: Customer,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 고객 정보 수정 로그
    📋 목적: 고객 정보가 변경되었을 때 기록
    """
    audit_service = AuditService(db)

    old_value = old_customer
    new_value = {
        "id": new_customer.id,
        "name": new_customer.name if hasattr(new_customer, 'name') else None,
        "phone": new_customer.phone if hasattr(new_customer, 'phone') else None,
        "email": new_customer.email if hasattr(new_customer, 'email') else None,
        "memo": new_customer.memo if hasattr(new_customer, 'memo') else None,
    }

    audit_service.log_action(
        action="CUSTOMER_UPDATED",
        user_id=user_id,
        user_email=user_email,
        entity_type="customer",
        entity_id=new_customer.id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_customer_deleted(
    db: Session,
    customer: Customer,
    user_id: str,
    user_email: str,
    ip_address: str,
    user_agent: str,
) -> None:
    """
    📌 고객 삭제 로그
    📋 목적: 고객이 삭제되었을 때 기록
    """
    audit_service = AuditService(db)

    old_value = {
        "id": customer.id,
        "name": customer.name if hasattr(customer, 'name') else None,
        "phone": customer.phone if hasattr(customer, 'phone') else None,
        "email": customer.email if hasattr(customer, 'email') else None,
        "memo": customer.memo if hasattr(customer, 'memo') else None,
    }

    audit_service.log_action(
        action="CUSTOMER_DELETED",
        user_id=user_id,
        user_email=user_email,
        entity_type="customer",
        entity_id=customer.id,
        old_value=old_value,
        new_value=None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
