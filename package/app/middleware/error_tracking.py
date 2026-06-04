"""
============================================================
📌 Error Tracking & Exception Handling
📋 목적: 전역 에러 추적 및 구조화된 오류 응답
🔧 기능: 에러 로깅, Sentry 전송, 요청 추적
📅 작성일: 2026-05-22
============================================================
"""

import traceback
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.utils.logging_config import get_context_logger

# Sentry 선택적 설정
try:
    import sentry_sdk

    HAS_SENTRY = True
except ImportError:
    HAS_SENTRY = False

logger = get_context_logger("error_tracking")


# ============================================================
# 에러 응답 모델
# ============================================================
class ErrorResponse:
    """에러 응답 생성"""

    @staticmethod
    def create(
        status_code: int,
        error_code: str,
        message: str,
        message_ko: str = "",
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        에러 응답 생성

        Args:
            status_code: HTTP 상태 코드
            error_code: 에러 코드 (예: DB_ERROR, VALIDATION_ERROR)
            message: 영문 메시지
            message_ko: 한글 메시지
            details: 추가 상세 정보
            request_id: 요청 ID
        """
        error_obj = {
            "status_code": status_code,
            "error_code": error_code,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if message_ko:
            error_obj["message_ko"] = message_ko

        if request_id:
            error_obj["request_id"] = request_id

        if details:
            error_obj["details"] = details

        return error_obj


# ============================================================
# 예외 핸들러
# ============================================================
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    일반 예외 처리

    모든 처리되지 않은 예외를 처리합니다.
    """
    request_id = getattr(request.state, "request_id", f"req_{uuid4().hex[:12]}")

    logger.error(
        f"❌ 처리되지 않은 예외 발생",
        error_type=type(exc).__name__,
        error_message=str(exc),
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        exc_info=True,
    )

    # Sentry 전송
    if HAS_SENTRY:
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("request_id", request_id)
            scope.set_context("request", {
                "method": request.method,
                "path": request.url.path,
                "url": str(request.url),
            })
            sentry_sdk.capture_exception(exc)

    error_response = ErrorResponse.create(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        message_ko="예기치 않은 오류가 발생했습니다",
        request_id=request_id,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """요청 검증 오류 처리"""
    request_id = getattr(request.state, "request_id", f"req_{uuid4().hex[:12]}")

    # 검증 오류 상세 정보
    validation_errors = []
    for error in exc.errors():
        validation_errors.append({
            "field": ".".join(str(x) for x in error["loc"][1:]),
            "message": error["msg"],
            "type": error["type"],
        })

    logger.warning(
        f"⚠️ 요청 검증 실패",
        request_id=request_id,
        path=request.url.path,
        validation_errors=validation_errors,
    )

    error_response = ErrorResponse.create(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        message_ko="요청 검증 실패",
        details={"validation_errors": validation_errors},
        request_id=request_id,
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response,
    )


async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """데이터베이스 예외 처리"""
    request_id = getattr(request.state, "request_id", f"req_{uuid4().hex[:12]}")

    # IntegrityError는 제약 조건 위반
    if isinstance(exc, IntegrityError):
        logger.warning(
            f"⚠️ 데이터베이스 제약 조건 위반",
            request_id=request_id,
            error=str(exc),
        )

        error_response = ErrorResponse.create(
            status_code=status.HTTP_409_CONFLICT,
            error_code="INTEGRITY_ERROR",
            message="Data integrity constraint violated",
            message_ko="데이터 제약 조건 위반",
            request_id=request_id,
        )

        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=error_response,
        )

    # 기타 데이터베이스 오류
    logger.error(
        f"❌ 데이터베이스 오류",
        request_id=request_id,
        error_type=type(exc).__name__,
        error_message=str(exc),
        exc_info=True,
    )

    if HAS_SENTRY:
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("request_id", request_id)
            sentry_sdk.capture_exception(exc)

    error_response = ErrorResponse.create(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="DATABASE_ERROR",
        message="Database operation failed",
        message_ko="데이터베이스 작업 실패",
        request_id=request_id,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response,
    )


# ============================================================
# 에러 컨텍스트
# ============================================================
class ErrorContext:
    """에러 컨텍스트 관리"""

    def __init__(self, request: Request):
        self.request = request
        self.request_id = getattr(request.state, "request_id", f"req_{uuid4().hex[:12]}")
        self.user_id: Optional[int] = getattr(request.state, "user_id", None)

    def log_error(
        self,
        message: str,
        error: Exception,
        severity: str = "error",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        에러 로깅

        Args:
            message: 에러 메시지
            error: 예외 객체
            severity: 심각도 (debug, info, warning, error, critical)
            metadata: 추가 메타데이터
        """
        log_data = {
            "request_id": self.request_id,
            "path": self.request.url.path,
            "method": self.request.method,
            "error_type": type(error).__name__,
            "error_message": str(error),
        }

        if self.user_id:
            log_data["user_id"] = self.user_id

        if metadata:
            log_data.update(metadata)

        # 로그 레벨 선택
        if severity == "debug":
            logger.debug(message, **log_data)
        elif severity == "warning":
            logger.warning(message, **log_data)
        elif severity == "critical":
            logger.critical(message, **log_data, exc_info=True)
        else:
            logger.error(message, **log_data, exc_info=True)

        # Sentry 전송
        if severity in ("error", "critical") and HAS_SENTRY:
            with sentry_sdk.push_scope() as scope:
                scope.set_tag("request_id", self.request_id)
                scope.set_context("error_context", log_data)
                sentry_sdk.capture_exception(error)

    def create_error_response(
        self,
        status_code: int,
        error_code: str,
        message: str,
        message_ko: str = "",
        details: Optional[Dict[str, Any]] = None,
    ) -> JSONResponse:
        """
        에러 응답 생성

        Args:
            status_code: HTTP 상태 코드
            error_code: 에러 코드
            message: 영문 메시지
            message_ko: 한글 메시지
            details: 추가 상세 정보
        """
        error_response = ErrorResponse.create(
            status_code=status_code,
            error_code=error_code,
            message=message,
            message_ko=message_ko,
            details=details,
            request_id=self.request_id,
        )

        return JSONResponse(
            status_code=status_code,
            content=error_response,
        )
