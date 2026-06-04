"""
============================================================
📌 JWT 토큰 관리
📋 목적: Access Token & Refresh Token 생성/검증
🔧 토큰 타입: HS256 (HMAC with SHA-256)
📅 작성일: 2026-05-22
============================================================
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.config import settings

# JWT 설정
JWT_SECRET_KEY = settings.jwt_secret_key
JWT_ALGORITHM = getattr(settings, 'jwt_algorithm', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, 'access_token_expire_minutes', 15)
REFRESH_TOKEN_EXPIRE_DAYS = getattr(settings, 'refresh_token_expire_days', 7)


class TokenPayload:
    """토큰 페이로드 데이터"""
    def __init__(self, user_id: int, email: str, employee_id: Optional[str] = None,
                 role: str = "user", name: str = ""):
        self.user_id = user_id
        self.email = email
        self.employee_id = employee_id
        self.role = role
        self.name = name


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Access Token 생성 (기본값: 15분 만료)

    Args:
        data: 토큰에 포함할 데이터 (user_id, email, role 등)
        expires_delta: 만료 시간 (기본값: 15분)

    Returns:
        JWT Access Token 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Refresh Token 생성 (기본값: 7일 만료)

    Args:
        data: 토큰에 포함할 데이터 (user_id, email 등)
        expires_delta: 만료 시간 (기본값: 7일)

    Returns:
        JWT Refresh Token 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    토큰 유효성 검증

    Args:
        token: JWT 토큰 문자열
        token_type: 토큰 타입 ("access" 또는 "refresh")

    Returns:
        토큰 페이로드 (dict) 또는 None (검증 실패 시)
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # 토큰 타입 검증
        if payload.get("type") != token_type:
            return None

        return payload
    except JWTError:
        return None


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    토큰 디코딩 (타입 검증 없음)

    Args:
        token: JWT 토큰 문자열

    Returns:
        토큰 페이로드 (dict) 또는 None (검증 실패 시)
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def extract_user_id(token: str) -> Optional[int]:
    """토큰에서 user_id 추출"""
    payload = decode_token(token)
    if payload:
        return payload.get("user_id")
    return None


def extract_user_email(token: str) -> Optional[str]:
    """토큰에서 email 추출"""
    payload = decode_token(token)
    if payload:
        return payload.get("email")
    return None


def extract_user_role(token: str) -> Optional[str]:
    """토큰에서 role 추출"""
    payload = decode_token(token)
    if payload:
        return payload.get("role", "user")
    return None
