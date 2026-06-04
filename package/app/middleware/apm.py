"""
============================================================
📌 Application Performance Monitoring (APM)
📋 목적: Sentry 통합 및 성능 모니터링
🔧 기능: 에러 추적, 성능 측정, 사용자 행동 추적
📅 작성일: 2026-05-22
============================================================
"""

import os
import time
from typing import Optional
from functools import wraps
from datetime import datetime

from fastapi import Request

# Sentry 선택적 설정
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    HAS_SENTRY = True
except ImportError:
    HAS_SENTRY = False


# ============================================================
# Sentry 초기화
# ============================================================
def init_sentry(dsn: Optional[str] = None, environment: str = "development"):
    """
    Sentry 초기화

    Args:
        dsn: Sentry DSN (환경변수 SENTRY_DSN에서 읽을 수도 있음)
        environment: 환경 (development, staging, production)
    """
    if not HAS_SENTRY:
        return

    # DSN 결정
    if not dsn:
        dsn = os.getenv("SENTRY_DSN")

    if not dsn:
        return

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            traces_sample_rate=0.1,  # 10% 샘플링
            profiles_sample_rate=0.1,  # 10% 프로파일링
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            # 로컬 에러는 제외
            ignore_errors=[
                KeyError,
                ValueError,
            ],
        )
    except Exception as e:
        print(f"❌ Sentry 초기화 실패: {e}")


# ============================================================
# 성능 모니터링 데코레이터
# ============================================================
def monitor_performance(threshold_ms: float = 1000):
    """
    성능 모니터링 데코레이터

    느린 함수 실행을 로깅합니다.

    Args:
        threshold_ms: 경고 임계값 (밀리초)
    """

    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            from app.utils.logging_config import get_context_logger

            logger = get_context_logger(func.__module__)

            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000

                if duration_ms > threshold_ms:
                    logger.warning(
                        f"⏱️ 느린 함수 실행: {func.__name__}",
                        duration_ms=duration_ms,
                        threshold_ms=threshold_ms,
                    )
                else:
                    logger.debug(
                        f"✅ 함수 실행 완료: {func.__name__}",
                        duration_ms=duration_ms,
                    )

                return result

            except Exception as e:
                logger.error(
                    f"❌ 함수 실행 실패: {func.__name__}",
                    error=str(e),
                    duration_ms=(time.time() - start_time) * 1000,
                    exc_info=True,
                )
                if HAS_SENTRY:
                    sentry_sdk.capture_exception(e)
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            from app.utils.logging_config import get_context_logger

            logger = get_context_logger(func.__module__)

            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000

                if duration_ms > threshold_ms:
                    logger.warning(
                        f"⏱️ 느린 함수 실행: {func.__name__}",
                        duration_ms=duration_ms,
                        threshold_ms=threshold_ms,
                    )

                return result

            except Exception as e:
                logger.error(
                    f"❌ 함수 실행 실패: {func.__name__}",
                    error=str(e),
                    exc_info=True,
                )
                if HAS_SENTRY:
                    sentry_sdk.capture_exception(e)
                raise

        # Async/Sync 판단
        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


# ============================================================
# 요청 모니터링
# ============================================================
async def apm_middleware(request: Request, call_next):
    """APM 미들웨어"""
    from app.utils.logging_config import get_context_logger

    logger = get_context_logger("apm")
    request_id = request.headers.get("X-Request-ID", f"req_{int(time.time()*1000)}")

    # 요청 시작
    start_time = time.time()

    # 요청 컨텍스트 설정
    request.state.request_id = request_id
    request.state.start_time = start_time

    logger.set_context(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else "unknown",
    )

    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000

        # 응답 헤더 추가
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        # 상태 코드 기반 로깅
        if 200 <= response.status_code < 300:
            logger.info(
                f"✅ 요청 성공",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
        elif 300 <= response.status_code < 400:
            logger.info(
                f"↩️ 리다이렉트",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
        elif 400 <= response.status_code < 500:
            logger.warning(
                f"⚠️ 클라이언트 오류",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
        else:
            logger.error(
                f"❌ 서버 오류",
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

        # 느린 요청 경고
        if duration_ms > 2000:
            logger.warning(
                f"⏱️ 느린 요청 감지",
                duration_ms=duration_ms,
                threshold_ms=2000,
            )

        return response

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.error(
            f"❌ 요청 처리 중 오류 발생",
            error=str(e),
            duration_ms=duration_ms,
            exc_info=True,
        )

        # Sentry로 전송
        if HAS_SENTRY:
            sentry_sdk.capture_exception(e)

        raise

    finally:
        logger.clear_context()


# ============================================================
# 사용자 행동 추적
# ============================================================
def track_user_action(
    action_type: str,
    user_id: Optional[int] = None,
    metadata: Optional[dict] = None,
):
    """
    사용자 행동 추적

    Args:
        action_type: 행동 유형 (login, logout, booking, settlement 등)
        user_id: 사용자 ID
        metadata: 추가 메타데이터
    """
    from app.utils.logging_config import get_context_logger

    logger = get_context_logger("user_action")

    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "action_type": action_type,
    }

    if user_id:
        log_data["user_id"] = user_id

    if metadata:
        log_data.update(metadata)

    logger.info(f"👤 사용자 행동 추적: {action_type}", **log_data)

    # Sentry에도 전송
    if HAS_SENTRY:
        sentry_sdk.capture_message(
            f"User action: {action_type}",
            level="info",
        )


# ============================================================
# 성능 메트릭
# ============================================================
class PerformanceMetrics:
    """성능 메트릭 수집"""

    def __init__(self):
        self.metrics = {}

    def record(self, name: str, value: float):
        """메트릭 기록"""
        if name not in self.metrics:
            self.metrics[name] = []
        self.metrics[name].append(value)

    def get_stats(self, name: str):
        """메트릭 통계 반환"""
        if name not in self.metrics:
            return None

        values = self.metrics[name]
        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "avg": sum(values) / len(values),
        }

    def clear(self):
        """메트릭 초기화"""
        self.metrics.clear()


# 글로벌 메트릭
metrics = PerformanceMetrics()
