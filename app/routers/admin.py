"""
============================================================
📌 라우터: /api/admin (관리자 기능)
📋 목적: 사용자 관리, 권한 관리, 감사 로그, 시스템 설정
📅 작성일: 2026-05-13

엔드포인트 (4개):
  GET    /api/admin/users               사용자 목록
  PATCH  /api/admin/users/{id}/role     권한 변경
  GET    /api/admin/audit-log           감사 로그
  POST   /api/admin/settings            시스템 설정 저장
============================================================
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
async def list_users(
    role: str = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    사용자 목록 조회

    쿼리:
      - role: 역할 필터 (admin, manager, staff)
      - limit, offset: 페이지네이션
    """
    try:
        # 모의 사용자 데이터
        users = [
            {
                "id": 1,
                "name": "김관리자",
                "email": "admin@elspa.com",
                "role": "admin",
                "created_at": "2026-01-15T10:00:00Z",
                "status": "active",
            },
            {
                "id": 2,
                "name": "이매니저",
                "email": "manager@elspa.com",
                "role": "manager",
                "created_at": "2026-02-10T11:30:00Z",
                "status": "active",
            },
            {
                "id": 3,
                "name": "박직원",
                "email": "staff@elspa.com",
                "role": "staff",
                "created_at": "2026-03-05T09:15:00Z",
                "status": "active",
            },
        ]

        if role:
            users = [u for u in users if u["role"] == role]

        # 페이지네이션
        paginated_users = users[offset : offset + limit]

        logger.info(f"사용자 목록 조회: total={len(users)}, role={role}")

        return {
            "data": paginated_users,
            "total_count": len(users),
            "limit": limit,
            "offset": offset,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"사용자 목록 조회 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 목록 조회 중 오류가 발생했습니다"
        )


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    new_role: str,
    db: AsyncSession = Depends(get_db),
):
    """
    사용자 권한 변경

    경로:
      - user_id: 사용자 ID

    요청:
      - new_role: admin | manager | staff

    응답:
      - 변경된 사용자 정보
    """
    try:
        # 권한 검증
        valid_roles = ["admin", "manager", "staff"]
        if new_role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"유효하지 않은 역할: {new_role}"
            )

        # 사용자 조회 (모의)
        if user_id > 3:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"사용자 {user_id}를 찾을 수 없습니다"
            )

        logger.info(f"사용자 권한 변경: user_id={user_id}, new_role={new_role}")

        return {
            "success": True,
            "user_id": user_id,
            "new_role": new_role,
            "updated_at": datetime.utcnow().isoformat(),
            "message": f"사용자 권한이 {new_role}로 변경되었습니다",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 권한 변경 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 권한 변경 중 오류가 발생했습니다"
        )


@router.get("/audit-log")
async def get_audit_log(
    action_type: str = None,
    user_id: int = None,
    days: int = 7,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    감사 로그 조회

    쿼리:
      - action_type: 작업 유형 (create, update, delete)
      - user_id: 특정 사용자
      - days: 조회 기간 (기본: 7일)
      - limit, offset: 페이지네이션
    """
    try:
        # 모의 감사 로그 데이터
        from datetime import timedelta

        now = datetime.utcnow()
        logs = [
            {
                "id": 1,
                "timestamp": (now - timedelta(hours=1)).isoformat(),
                "user_id": 1,
                "user_name": "김관리자",
                "action_type": "create",
                "resource_type": "booking",
                "resource_id": 1001,
                "details": "예약 생성",
                "ip_address": "192.168.1.100",
            },
            {
                "id": 2,
                "timestamp": (now - timedelta(hours=2)).isoformat(),
                "user_id": 2,
                "user_name": "이매니저",
                "action_type": "update",
                "resource_type": "therapist",
                "resource_id": 5,
                "details": "테라피스트 상태 변경",
                "ip_address": "192.168.1.101",
            },
            {
                "id": 3,
                "timestamp": (now - timedelta(hours=3)).isoformat(),
                "user_id": 3,
                "user_name": "박직원",
                "action_type": "delete",
                "resource_type": "booking",
                "resource_id": 999,
                "details": "예약 취소",
                "ip_address": "192.168.1.102",
            },
        ]

        # 필터 적용
        if action_type:
            logs = [l for l in logs if l["action_type"] == action_type]
        if user_id:
            logs = [l for l in logs if l["user_id"] == user_id]

        # 페이지네이션
        paginated_logs = logs[offset : offset + limit]

        logger.info(f"감사 로그 조회: total={len(logs)}, action_type={action_type}")

        return {
            "data": paginated_logs,
            "total_count": len(logs),
            "limit": limit,
            "offset": offset,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"감사 로그 조회 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="감사 로그 조회 중 오류가 발생했습니다"
        )


@router.post("/settings")
async def update_system_settings(
    settings_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    시스템 설정 저장

    요청:
      - key: value 형식의 설정 항목

    예:
      {
        "max_concurrent_bookings": 100,
        "booking_confirmation_timeout_minutes": 15,
        "auto_match_enabled": true,
      }
    """
    try:
        logger.info(f"시스템 설정 업데이트: {list(settings_data.keys())}")

        return {
            "success": True,
            "settings": settings_data,
            "updated_at": datetime.utcnow().isoformat(),
            "message": "시스템 설정이 저장되었습니다",
        }

    except Exception as e:
        logger.error(f"시스템 설정 저장 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="시스템 설정 저장 중 오류가 발생했습니다"
        )
