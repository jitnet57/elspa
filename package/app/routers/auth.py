"""
============================================================
📌 인증 API 라우터
📋 목적: Login, Logout, Refresh Token, Token Verify 엔드포인트
🔧 경로: /api/auth/*
📅 작성일: 2026-05-22
============================================================
"""

import logging
from typing import Optional, Set
from datetime import datetime
from pydantic import BaseModel, EmailStr

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth.jwt import create_access_token, create_refresh_token, verify_token, decode_token
from app.auth.dependencies import get_current_user, TokenUser
from app.models.payroll import Employee

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Token blacklist (in-memory, simple implementation)
token_blacklist: Set[str] = set()


# ============================================================
# Schemas
# ============================================================

class LoginRequest(BaseModel):
    """로그인 요청"""
    email: str
    password: str


class LoginResponse(BaseModel):
    """로그인 응답"""
    access_token: str
    refresh_token: str
    user: dict

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user": {
                    "user_id": 1,
                    "email": "admin@elspa.com",
                    "name": "Admin",
                    "role": "admin"
                }
            }
        }


class RefreshTokenRequest(BaseModel):
    """토큰 갱신 요청"""
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """토큰 갱신 응답"""
    access_token: str


class VerifyTokenRequest(BaseModel):
    """토큰 검증 요청"""
    token: str


class VerifyTokenResponse(BaseModel):
    """토큰 검증 응답"""
    valid: bool
    user: Optional[dict] = None


class LogoutRequest(BaseModel):
    """로그아웃 요청"""
    token: Optional[str] = None


class LogoutResponse(BaseModel):
    """로그아웃 응답"""
    message: str


# ============================================================
# Mock Users (Development Only)
# ============================================================

MOCK_USERS = {
    "admin@elspa.com": {
        "password": "admin123",
        "user_id": 1,
        "name": "Admin User",
        "role": "admin",
        "employee_id": "EMP001"
    },
    "user@elspa.com": {
        "password": "user123",
        "user_id": 2,
        "name": "Regular User",
        "role": "user",
        "employee_id": "EMP002"
    }
}


async def authenticate_user(email: str, password: str, db: AsyncSession) -> Optional[dict]:
    """
    사용자 인증 (현재는 mock 사용, 나중에 DB 연동 가능)

    Args:
        email: 사용자 이메일
        password: 비밀번호
        db: 데이터베이스 세션

    Returns:
        사용자 정보 dict 또는 None
    """
    # Development: Mock 사용자 검증
    if email in MOCK_USERS:
        user = MOCK_USERS[email]
        if user["password"] == password:
            return {
                "user_id": user["user_id"],
                "email": email,
                "name": user["name"],
                "role": user["role"],
                "employee_id": user["employee_id"]
            }

    # 향후: DB 사용자 검증
    # result = await db.execute(select(Employee).where(Employee.email == email))
    # employee = result.scalar_one_or_none()
    # if employee and verify_password(password, employee.password_hash):
    #     return {
    #         "user_id": employee.id,
    #         "email": email,
    #         "name": employee.name,
    #         "role": "user",
    #         "employee_id": employee.employee_id
    #     }

    return None


# ============================================================
# Endpoints
# ============================================================

@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    로그인 엔드포인트

    - 이메일/비밀번호로 사용자 인증
    - Access Token (15분) 및 Refresh Token (7일) 발급
    - 사용자 정보 반환

    **테스트 계정:**
    - admin@elspa.com / admin123 (admin)
    - user@elspa.com / user123 (user)
    """
    # 사용자 인증
    user = await authenticate_user(payload.email, payload.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 토큰 생성
    token_data = {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "employee_id": user.get("employee_id")
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    logger.info(f"✅ User logged in: {user['email']} (role: {user['role']})")

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(payload: RefreshTokenRequest):
    """
    Refresh Token으로 새 Access Token 발급

    - Refresh Token 검증
    - 새 Access Token 생성 (기존 정보 유지)
    """
    # Refresh Token 검증
    token_payload = verify_token(payload.refresh_token, token_type="refresh")
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 새 Access Token 생성
    token_data = {
        "user_id": token_payload.get("user_id"),
        "email": token_payload.get("email"),
        "name": token_payload.get("name"),
        "role": token_payload.get("role"),
        "employee_id": token_payload.get("employee_id")
    }

    access_token = create_access_token(token_data)

    logger.info(f"✅ Token refreshed for: {token_payload.get('email')}")

    return RefreshTokenResponse(access_token=access_token)


@router.post("/verify", response_model=VerifyTokenResponse)
async def verify(payload: VerifyTokenRequest):
    """
    토큰 유효성 검증

    - Access Token 또는 Refresh Token 검증
    - 검증 성공 시 사용자 정보 반환
    """
    token_payload = decode_token(payload.token)

    if not token_payload:
        return VerifyTokenResponse(valid=False)

    # 만료 시간 확인
    if "exp" in token_payload:
        from datetime import datetime
        exp_time = datetime.fromtimestamp(token_payload["exp"])
        if exp_time < datetime.utcnow():
            return VerifyTokenResponse(valid=False)

    return VerifyTokenResponse(
        valid=True,
        user={
            "user_id": token_payload.get("user_id"),
            "email": token_payload.get("email"),
            "name": token_payload.get("name"),
            "role": token_payload.get("role")
        }
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(payload: LogoutRequest):
    """
    로그아웃 엔드포인트

    - 토큰을 블랙리스트에 추가
    - 추후 이 토큰으로는 요청 불가
    """
    if payload.token:
        # 간단한 in-memory 블랙리스트 (Redis로 확장 가능)
        token_blacklist.add(payload.token)
        logger.info("✅ User logged out")

    return LogoutResponse(message="Successfully logged out")


@router.post("/me")
async def get_current_user_info(user: TokenUser = Depends(get_current_user)):
    """
    현재 사용자 정보 조회

    - 인증된 사용자의 정보 반환
    """
    return user.to_dict()
