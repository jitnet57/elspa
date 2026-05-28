"""
📌 Audit Context Middleware
📋 목적: 모든 요청에서 사용자, IP, User-Agent 정보 추출
🔧 사용: request.state.audit_* 에 저장하여 라우터에서 접근
📅 작성일: 2026-05-28
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import jwt
import json


class AuditContextMiddleware(BaseHTTPMiddleware):
    """
    모든 HTTP 요청에서 감사 컨텍스트를 추출하는 미들웨어
    JWT 토큰에서 user_id/email을 추출하고, 요청 메타데이터를 수집합니다.
    """

    async def dispatch(self, request: Request, call_next):
        # 기본값 설정
        user_id = "anonymous"
        user_email = "unknown@system.local"
        ip_address = request.client.host if request.client else "0.0.0.0"
        user_agent = request.headers.get("User-Agent", "Unknown")

        # JWT 토큰에서 사용자 정보 추출 (Authorization: Bearer <token>)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]  # "Bearer " 제거
            try:
                # 토큰 디코딩 (secret 없이 헤더 확인만)
                payload = jwt.decode(token, options={"verify_signature": False})
                user_id = payload.get("sub") or payload.get("user_id") or "unknown"
                user_email = payload.get("email") or f"{user_id}@auth.local"
            except Exception:
                # 토큰 디코딩 실패 시 기본값 유지
                pass

        # request.state에 감사 정보 저장
        request.state.audit_user_id = str(user_id)
        request.state.audit_user_email = str(user_email)
        request.state.audit_ip_address = ip_address
        request.state.audit_user_agent = user_agent[:255]  # 길이 제한

        # 다음 미들웨어/라우터로 진행
        response = await call_next(request)
        return response
