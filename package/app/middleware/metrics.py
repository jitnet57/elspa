"""
============================================================
📌 Prometheus Metrics Collection
📋 목적: 애플리케이션 성능 메트릭 수집
🔧 기능: 요청 수, 응답 시간, 에러율 측정
📅 작성일: 2026-05-22
============================================================
"""

import time
from typing import Callable
from functools import wraps

from fastapi import Request, FastAPI
from fastapi.responses import Response

# Prometheus 선택적 설정
try:
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
    HAS_PROMETHEUS = True
except ImportError:
    HAS_PROMETHEUS = False


if HAS_PROMETHEUS:
    # ============================================================
    # Prometheus 메트릭 정의
    # ============================================================

    # 요청 수
    http_requests_total = Counter(
        "http_requests_total",
        "Total HTTP requests",
        ["method", "endpoint", "status_code"],
    )

    # 요청 응답 시간
    http_request_duration_seconds = Histogram(
        "http_request_duration_seconds",
        "HTTP request latency in seconds",
        ["method", "endpoint"],
        buckets=(0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0),
    )

    # 진행 중인 요청 수
    http_requests_in_progress = Gauge(
        "http_requests_in_progress",
        "Number of HTTP requests in progress",
        ["method", "endpoint"],
    )

    # 에러율
    http_errors_total = Counter(
        "http_errors_total",
        "Total HTTP errors",
        ["method", "endpoint", "error_code"],
    )

    # 데이터베이스 쿼리
    db_queries_total = Counter(
        "db_queries_total",
        "Total database queries",
        ["operation", "table"],
    )

    # 데이터베이스 쿼리 응답 시간
    db_query_duration_seconds = Histogram(
        "db_query_duration_seconds",
        "Database query latency in seconds",
        ["operation", "table"],
    )

    # 캐시 히트/미스
    cache_hits_total = Counter(
        "cache_hits_total",
        "Total cache hits",
        ["cache_name"],
    )

    cache_misses_total = Counter(
        "cache_misses_total",
        "Total cache misses",
        ["cache_name"],
    )

    # 외부 API 호출
    external_api_calls_total = Counter(
        "external_api_calls_total",
        "Total external API calls",
        ["service", "status_code"],
    )

    external_api_duration_seconds = Histogram(
        "external_api_duration_seconds",
        "External API call latency in seconds",
        ["service"],
    )


# ============================================================
# 메트릭 미들웨어
# ============================================================
async def metrics_middleware(request: Request, call_next) -> Response:
    """Prometheus 메트릭 수집 미들웨어"""

    if not HAS_PROMETHEUS:
        return await call_next(request)

    # 엔드포인트 정규화 (경로 매개변수 처리)
    endpoint = request.url.path
    # /users/123 -> /users/{id}
    if endpoint.count("/") > 1:
        parts = endpoint.split("/")
        # 숫자 부분은 {id}로 변환
        normalized_parts = []
        for part in parts:
            if part.isdigit():
                normalized_parts.append("{id}")
            else:
                normalized_parts.append(part)
        endpoint = "/".join(normalized_parts)

    method = request.method

    # 진행 중인 요청 증가
    http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()

    start_time = time.time()

    try:
        response = await call_next(request)

        # 응답 시간 기록
        duration = time.time() - start_time
        http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)

        # 요청 수 증가
        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status_code=response.status_code,
        ).inc()

        # 에러 수 기록
        if response.status_code >= 400:
            error_code = f"{response.status_code // 100}xx"
            http_errors_total.labels(
                method=method,
                endpoint=endpoint,
                error_code=error_code,
            ).inc()

        return response

    finally:
        # 진행 중인 요청 감소
        http_requests_in_progress.labels(method=method, endpoint=endpoint).dec()


# ============================================================
# 메트릭 수집 데코레이터
# ============================================================
def measure_db_query(operation: str, table: str):
    """데이터베이스 쿼리 메트릭 측정 데코레이터"""

    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            if not HAS_PROMETHEUS:
                return await func(*args, **kwargs)

            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                db_query_duration_seconds.labels(operation=operation, table=table).observe(duration)
                db_queries_total.labels(operation=operation, table=table).inc()
                return result
            except Exception as e:
                duration = time.time() - start_time
                db_query_duration_seconds.labels(operation=operation, table=table).observe(duration)
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            if not HAS_PROMETHEUS:
                return func(*args, **kwargs)

            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                db_query_duration_seconds.labels(operation=operation, table=table).observe(duration)
                db_queries_total.labels(operation=operation, table=table).inc()
                return result
            except Exception as e:
                duration = time.time() - start_time
                db_query_duration_seconds.labels(operation=operation, table=table).observe(duration)
                raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def record_cache_hit(cache_name: str):
    """캐시 히트 기록"""
    if HAS_PROMETHEUS:
        cache_hits_total.labels(cache_name=cache_name).inc()


def record_cache_miss(cache_name: str):
    """캐시 미스 기록"""
    if HAS_PROMETHEUS:
        cache_misses_total.labels(cache_name=cache_name).inc()


def record_external_api_call(service: str, status_code: int, duration: float):
    """외부 API 호출 기록"""
    if HAS_PROMETHEUS:
        external_api_calls_total.labels(service=service, status_code=status_code).inc()
        external_api_duration_seconds.labels(service=service).observe(duration)


# ============================================================
# 메트릭 엔드포인트 설정
# ============================================================
def setup_metrics_endpoint(app: FastAPI):
    """FastAPI 앱에 메트릭 엔드포인트 추가"""

    if not HAS_PROMETHEUS:
        return

    @app.get("/metrics", tags=["Monitoring"])
    async def metrics():
        """Prometheus 메트릭 엔드포인트"""
        from fastapi.responses import Response
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST,
        )
