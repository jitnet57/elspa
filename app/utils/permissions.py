"""
📌 Permission Decorators & Middleware
📋 목적: API 엔드포인트에 역할 기반 권한 체크
🔧 포함: 권한 검증 데코레이터, 권한 확인 함수
"""

from functools import wraps
from typing import Callable, List
from fastapi import HTTPException, status, Header
from app.lib.auth.financial_permissions import UserRole, canPerformAction
from app.utils.errors import InsufficientPermissionError


def require_permission(action: str, allowed_roles: List[UserRole] = None):
    """
    권한 검증 데코레이터

    사용:
        @require_permission("canDelete", ["admin"])
        async def delete_expense(...):
    """
    if allowed_roles is None:
        allowed_roles = ["admin", "manager"]

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # TODO: 실제 구현에서는 JWT 토큰에서 사용자 역할을 추출
            # 현재는 헤더에서 X-User-Role을 읽음 (테스트용)
            user_role = kwargs.get("user_role", "viewer")

            if user_role not in allowed_roles:
                raise InsufficientPermissionError(action, user_role)

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def check_permission(user_role: UserRole, action: str) -> bool:
    """
    권한 확인 함수

    Returns:
        True if user has permission, False otherwise
    """
    return canPerformAction(user_role, action)


def require_admin(func: Callable):
    """Admin 역할만 허용"""
    return require_permission("admin_only", ["admin"])(func)


def require_edit_permission(func: Callable):
    """편집 권한 필요 (admin, manager)"""
    return require_permission("canEdit", ["admin", "manager"])(func)


def require_delete_permission(func: Callable):
    """삭제 권한 필요 (admin만)"""
    return require_permission("canDelete", ["admin"])(func)


def require_budget_permission(func: Callable):
    """예산 설정 권한 필요 (admin, manager)"""
    return require_permission("canSetBudget", ["admin", "manager"])(func)


def require_audit_access(func: Callable):
    """감사 로그 접근 권한 필요"""
    return require_permission("canViewAuditLog", ["admin", "manager"])(func)


class PermissionChecker:
    """권한 검사 유틸리티 클래스"""

    @staticmethod
    def can_view(user_role: UserRole) -> bool:
        """조회 권한"""
        return check_permission(user_role, "canView")

    @staticmethod
    def can_add(user_role: UserRole) -> bool:
        """추가 권한"""
        return check_permission(user_role, "canAdd")

    @staticmethod
    def can_edit(user_role: UserRole) -> bool:
        """편집 권한"""
        return check_permission(user_role, "canEdit")

    @staticmethod
    def can_delete(user_role: UserRole) -> bool:
        """삭제 권한"""
        return check_permission(user_role, "canDelete")

    @staticmethod
    def can_export(user_role: UserRole) -> bool:
        """내보내기 권한"""
        return check_permission(user_role, "canExport")

    @staticmethod
    def can_set_budget(user_role: UserRole) -> bool:
        """예산 설정 권한"""
        return check_permission(user_role, "canSetBudget")

    @staticmethod
    def can_view_audit_log(user_role: UserRole) -> bool:
        """감사 로그 조회 권한"""
        return check_permission(user_role, "canViewAuditLog")

    @staticmethod
    def can_access_all_months(user_role: UserRole) -> bool:
        """모든 월 접근 권한"""
        return check_permission(user_role, "canAccessAllMonths")
