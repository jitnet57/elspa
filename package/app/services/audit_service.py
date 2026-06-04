"""
📌 Audit Log Service
📋 목적: 모든 재무 작업을 감사 로그에 기록
🔧 포함: 로그 생성, 조회, 필터링, 변경 추적
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit_log import AuditLog, AuditActionEnum
import json


class AuditService:
    """감사 로그 서비스"""

    @staticmethod
    def log_action(
        db: Session,
        action: AuditActionEnum,
        user_id: str,
        user_email: Optional[str] = None,
        entity_type: str = "",
        entity_id: Optional[int] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        감사 로그 기록

        Args:
            db: 데이터베이스 세션
            action: 작업 유형 (EXPENSE_CREATED, EXPENSE_UPDATED 등)
            user_id: 사용자 ID
            user_email: 사용자 이메일
            entity_type: 엔티티 유형 ('expense', 'budget', 'category')
            entity_id: 엔티티 ID
            old_value: 변경 전 값 (업데이트 시)
            new_value: 변경 후 값
            ip_address: 요청 IP 주소
            user_agent: User-Agent 헤더
        """
        # 변경사항 계산
        changes = None
        if old_value and new_value:
            changes = {}
            for key in new_value:
                if old_value.get(key) != new_value.get(key):
                    changes[key] = {
                        "old": old_value.get(key),
                        "new": new_value.get(key),
                    }

        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            user_email=user_email,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=json.dumps(changes) if changes else None,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        return audit_log

    @staticmethod
    def get_logs(
        db: Session,
        action: Optional[AuditActionEnum] = None,
        user_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[AuditLog]:
        """
        감사 로그 조회

        Args:
            db: 데이터베이스 세션
            action: 필터링할 작업 유형
            user_id: 필터링할 사용자 ID
            entity_type: 필터링할 엔티티 유형
            entity_id: 필터링할 엔티티 ID
            limit: 반환할 최대 로그 수
            skip: 건너뛸 로그 수
        """
        query = db.query(AuditLog)

        if action:
            query = query.filter(AuditLog.action == action)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)

        return query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_actions(
        db: Session,
        user_id: str,
        limit: int = 50,
    ) -> list[AuditLog]:
        """사용자의 모든 작업 조회"""
        return (
            db.query(AuditLog)
            .filter(AuditLog.user_id == user_id)
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_entity_history(
        db: Session,
        entity_type: str,
        entity_id: int,
    ) -> list[AuditLog]:
        """특정 엔티티의 변경 이력"""
        return (
            db.query(AuditLog)
            .filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(desc(AuditLog.created_at))
            .all()
        )

    @staticmethod
    def get_recent_actions(
        db: Session,
        limit: int = 20,
    ) -> list[AuditLog]:
        """최근 작업 조회"""
        return (
            db.query(AuditLog)
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_actions(
        db: Session,
        action: Optional[AuditActionEnum] = None,
    ) -> int:
        """작업 수 계산"""
        query = db.query(AuditLog)
        if action:
            query = query.filter(AuditLog.action == action)
        return query.count()
