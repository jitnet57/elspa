"""
============================================================
📌 FastAPI 의존성 (Dependencies)
📋 목적: 인증 & 권한 검사 미들웨어
🔧 사용: @Depends(get_current_user), @Depends(require_admin)
📅 작성일: 2026-05-22
============================================================
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials

from app.auth.jwt import verify_token, decode_token

# HTTP Bearer 스킴
security = HTTPBearer()


class TokenUser:
    """토큰에서 추출한 사용자 정보"""
    def __init__(self, user_id: int, email: str, role: str = "user",
                 employee_id: Optional[str] = None, name: str = ""):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.employee_id = employee_id
        self.name = name

    def is_admin(self) -> bool:
        """관리자 권한 확인"""
        return self.role == "admin"

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "user_id": self.user_id,
            "email": self.email,
            "role": self.role,
            "employee_id": self.employee_id,
            "name": self.name
        }


async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> TokenUser:
    """
    Authorization 헤더에서 토큰을 추출하고 검증

    Args:
        credentials: HTTP Bearer Token

    Returns:
        TokenUser (사용자 정보)

    Raises:
        HTTPException (401): 토큰이 없거나 유효하지 않음
    """
    token = credentials.credentials

    # 토큰 검증 (access token만 허용)
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 필수 필드 추출
    user_id = payload.get("user_id")
    email = payload.get("email")
    role = payload.get("role", "user")
    employee_id = payload.get("employee_id")
    name = payload.get("name", "")

    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenUser(
        user_id=user_id,
        email=email,
        role=role,
        employee_id=employee_id,
        name=name
    )


async def require_admin(user: TokenUser = Depends(get_current_user)) -> TokenUser:
    """
    Admin 권한만 허용

    Args:
        user: 현재 사용자 (get_current_user에서 검증됨)

    Returns:
        TokenUser (admin 역할만 허용)

    Raises:
        HTTPException (403): Admin 권한이 없음
    """
    if not user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )

    return user


async def get_optional_user(credentials: Optional[HTTPAuthCredentials] = Depends(security)) -> Optional[TokenUser]:
    """
    선택적 인증 (토큰이 없으면 None 반환)

    Args:
        credentials: HTTP Bearer Token (선택사항)

    Returns:
        TokenUser 또는 None
    """
    if not credentials:
        return None

    token = credentials.credentials

    # 토큰 검증
    payload = verify_token(token, token_type="access")
    if not payload:
        return None

    user_id = payload.get("user_id")
    email = payload.get("email")
    role = payload.get("role", "user")
    employee_id = payload.get("employee_id")
    name = payload.get("name", "")

    if not user_id or not email:
        return None

    return TokenUser(
        user_id=user_id,
        email=email,
        role=role,
        employee_id=employee_id,
        name=name
    )
