"""
============================================================
📌 Security Headers Middleware
📋 목적: HTTP 보안 헤더 추가 (XSS, Clickjacking, Sniffing 방어)
🔧 헤더 종류: CSP, X-Frame-Options, X-Content-Type-Options, HSTS
📅 작성일: 2026-05-22
============================================================
"""

from fastapi import Request
from fastapi.responses import Response
import logging

logger = logging.getLogger(__name__)


async def add_security_headers_middleware(request: Request, call_next):
    """
    모든 응답에 보안 헤더 추가

    헤더 설명:
    1. X-Content-Type-Options: nosniff
       - 브라우저가 Content-Type을 무시하고 MIME 타입을 추측하지 않도록 함

    2. X-Frame-Options: DENY
       - 페이지가 iframe 내에서 렌더링되는 것을 거부 (Clickjacking 방어)

    3. X-XSS-Protection: 1; mode=block
       - 레거시 XSS 필터 (최신 브라우저는 CSP 사용)

    4. Strict-Transport-Security: max-age=31536000; includeSubDomains
       - HTTPS 강제 (1년간 유효)

    5. Content-Security-Policy: default-src 'self'
       - 기본적으로 같은 도메인의 콘텐츠만 로드

    6. Referrer-Policy: strict-origin-when-cross-origin
       - Referer 헤더 제한

    7. Permissions-Policy
       - 브라우저 API 권한 제한 (카메라, 마이크 등)
    """
    response = await call_next(request)

    # ✅ MIME 타입 스니핑 방어
    response.headers["X-Content-Type-Options"] = "nosniff"

    # ✅ Clickjacking 방어 (Framing 공격)
    response.headers["X-Frame-Options"] = "DENY"

    # ✅ 레거시 XSS 필터 (최신 브라우저용 CSP로 대체)
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # ✅ HTTPS 강제 (HSTS)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # ✅ Content Security Policy (CSP)
    # 다양한 수준의 CSP 정책 (환경에 따라 조정)
    csp_header = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "img-src 'self' data: https:; "
        "font-src 'self' data: https:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )
    response.headers["Content-Security-Policy"] = csp_header

    # ✅ Referrer 정책
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # ✅ Permissions Policy (기존 Feature-Policy)
    permissions_policy = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=(), "
        "usb=(), "
        "magnetometer=(), "
        "gyroscope=(), "
        "accelerometer=()"
    )
    response.headers["Permissions-Policy"] = permissions_policy

    # ✅ 캐시 제어 (민감한 정보)
    if request.url.path.startswith("/api/admin"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

    # ✅ 응답 헤더 로깅
    logger.debug(f"Security headers added for {request.method} {request.url.path}")

    return response


# ============================================================
# CSP (Content Security Policy) 정책 수준
# ============================================================

# 레벨 1: 엄격한 정책 (권장)
CSP_STRICT = (
    "default-src 'none'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "img-src 'self'; "
    "font-src 'self'; "
    "connect-src 'self'; "
    "frame-ancestors 'none'"
)

# 레벨 2: 보통 정책
CSP_MODERATE = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: https:; "
    "font-src 'self' data:; "
    "connect-src 'self' https:; "
    "frame-ancestors 'none'"
)

# 레벨 3: 느슨한 정책 (개발 환경)
CSP_PERMISSIVE = (
    "default-src *; "
    "script-src * 'unsafe-inline' 'unsafe-eval'; "
    "style-src * 'unsafe-inline'; "
)


def get_csp_for_environment(environment: str) -> str:
    """환경에 따른 CSP 정책 반환"""
    if environment == "production":
        return CSP_STRICT
    elif environment == "staging":
        return CSP_MODERATE
    else:  # development
        return CSP_PERMISSIVE
