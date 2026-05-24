"""
📌 Audit Log API Endpoints
📋 목적: 감사 로그 조회 및 분석 엔드포인트
🔧 포함: 로그 조회, 필터링, 통계
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db_sync
from app.models.audit_log import AuditLog, AuditActionEnum
from app.services.audit_service import AuditService
from app.utils.permissions import require_audit_access
from app.utils.errors import InsufficientPermissionError
from datetime import datetime
from typing import Optional, List


router = APIRouter(prefix="/api/admin/audit", tags=["audit"])


class AuditLogResponse:
    """감사 로그 응답 스키마"""

    def __init__(self, log: AuditLog):
        self.id = log.id
        self.action = log.action.value
        self.user_id = log.user_id
        self.user_email = log.user_email
        self.entity_type = log.entity_type
        self.entity_id = log.entity_id
        self.changes = log.changes
        self.old_value = log.old_value
        self.new_value = log.new_value
        self.ip_address = log.ip_address
        self.user_agent = log.user_agent
        self.created_at = log.created_at.isoformat()

    def dict(self):
        return self.__dict__


@router.get("/logs")
async def get_audit_logs(
    action: Optional[str] = Query(None, description="필터: 작업 유형"),
    user_id: Optional[str] = Query(None, description="필터: 사용자 ID"),
    entity_type: Optional[str] = Query(None, description="필터: 엔티티 유형"),
    entity_id: Optional[int] = Query(None, description="필터: 엔티티 ID"),
    limit: int = Query(100, ge=1, le=1000, description="반환 행 수"),
    skip: int = Query(0, ge=0, description="건너뛸 행 수"),
    db: Session = Depends(get_db_sync),
):
    """감사 로그 조회 (필터 지원)"""
    try:
        # 권한 확인 (임시: 모든 사용자 허용 - 실제는 권한 체크 필요)
        # raise InsufficientPermissionError("viewAuditLog", "viewer")

        action_enum = None
        if action:
            try:
                action_enum = AuditActionEnum[action.upper()]
            except KeyError:
                return {"error": f"Unknown action: {action}"}

        logs = AuditService.get_logs(
            db,
            action=action_enum,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            limit=limit,
            skip=skip,
        )

        return [AuditLogResponse(log).dict() for log in logs]
    except Exception as e:
        return {"error": str(e)}


@router.get("/logs/user/{user_id}")
async def get_user_actions(
    user_id: str = Query(..., description="사용자 ID"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db_sync),
):
    """특정 사용자의 모든 작업 조회"""
    try:
        logs = AuditService.get_user_actions(db, user_id, limit=limit)
        return [AuditLogResponse(log).dict() for log in logs]
    except Exception as e:
        return {"error": str(e)}


@router.get("/logs/entity/{entity_type}/{entity_id}")
async def get_entity_history(
    entity_type: str = Query(..., description="엔티티 유형 (expense, budget, category)"),
    entity_id: int = Query(..., description="엔티티 ID"),
    db: Session = Depends(get_db_sync),
):
    """특정 엔티티의 변경 이력"""
    try:
        logs = AuditService.get_entity_history(db, entity_type, entity_id)
        return [AuditLogResponse(log).dict() for log in logs]
    except Exception as e:
        return {"error": str(e)}


@router.get("/logs/recent")
async def get_recent_actions(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_sync),
):
    """최근 감사 로그"""
    try:
        logs = AuditService.get_recent_actions(db, limit=limit)
        return [AuditLogResponse(log).dict() for log in logs]
    except Exception as e:
        return {"error": str(e)}


@router.get("/stats")
async def get_audit_stats(
    db: Session = Depends(get_db_sync),
):
    """감사 로그 통계"""
    try:
        total = AuditService.count_actions(db)
        created = AuditService.count_actions(db, AuditActionEnum.EXPENSE_CREATED)
        updated = AuditService.count_actions(db, AuditActionEnum.EXPENSE_UPDATED)
        deleted = AuditService.count_actions(db, AuditActionEnum.EXPENSE_DELETED)
        budget_set = AuditService.count_actions(db, AuditActionEnum.BUDGET_SET)

        return {
            "total_actions": total,
            "expenses_created": created,
            "expenses_updated": updated,
            "expenses_deleted": deleted,
            "budgets_set": budget_set,
            "other_actions": total - created - updated - deleted - budget_set,
        }
    except Exception as e:
        return {"error": str(e)}
