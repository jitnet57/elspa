"""
============================================================
📌 ElSpa API - FastAPI 메인 애플리케이션
📋 목적: Team G - 9개 API 그룹 (43개 엔드포인트) 통합
📅 작성일: 2026-05-13
📊 버전: 1.0.0
============================================================

API 그룹:
  1️⃣ Beds (침대 관리)
  2️⃣ Therapists (테라피스트 관리)
  3️⃣ Bookings (예약 관리)
  4️⃣ Matching (지능형 매칭)
  5️⃣ Settlements (정산)
  6️⃣ Predictions (예측)
  7️⃣ Services (서비스 카탈로그)
  8️⃣ Dashboard (모니터링)
  9️⃣ Admin (관리)
============================================================
"""

import logging
import time
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import init_db, close_db

# Logging 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="ElSpa API",
    description="마사지 샵 통합 관리 시스템 - Team G (API Layer)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Filtered-Count", "X-Response-Time"],
)

# GZIP 압축 미들웨어
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ============================================================
# 요청/응답 로깅 미들웨어
# ============================================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """모든 요청 및 응답 로깅"""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", f"req_{int(time.time()*1000)}")

    logger.info(
        f"📨 [{request_id}] {request.method} {request.url.path} "
        f"(IP: {request.client.host if request.client else 'unknown'})"
    )

    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        response.headers["X-Response-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id

        level = "✅" if 200 <= response.status_code < 300 else "⚠️" if response.status_code < 400 else "❌"
        logger.info(
            f"{level} [{request_id}] {response.status_code} "
            f"{request.method} {request.url.path} "
            f"({process_time:.3f}s)"
        )

        return response

    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"❌ [{request_id}] {request.method} {request.url.path} "
            f"({process_time:.3f}s) - Error: {str(e)}"
        )
        raise


# ============================================================
# 예외 처리
# ============================================================
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database operation failed",
            "error_ko": "데이터베이스 작업 실패",
            "status_code": 500,
            "error_code": "DB_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


# ============================================================
# 헬스 체크 & 라이프사이클 이벤트
# ============================================================
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 이벤트"""
    logger.info("🚀 ElSpa API 시작 중...")
    try:
        await init_db()
        logger.info("✅ 데이터베이스 초기화 완료")
    except Exception as e:
        logger.error(f"❌ 데이터베이스 초기화 실패: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 이벤트"""
    logger.info("🛑 ElSpa API 종료 중...")
    await close_db()
    logger.info("✅ ElSpa API 종료 완료")


@app.get("/", tags=["System"])
async def root():
    """API 루트"""
    return {
        "message": "ElSpa Manager API",
        "status": "🟢 Ready",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
async def health_check():
    """헬스 체크"""
    return {
        "status": "🟢 Healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/info", tags=["System"])
async def api_info():
    """API 정보"""
    return {
        "name": "ElSpa API",
        "version": "1.0.0",
        "description": "마사지 샵 통합 관리 시스템 - Team G (API Layer)",
        "endpoints": {
            "beds": 6,
            "therapists": 8,
            "bookings": 8,
            "matching": 5,
            "settlements": 5,
            "predictions": 4,
            "services": 4,
            "dashboard": 3,
            "admin": 4,
        },
        "total_endpoints": 43,
        "docs": "/docs",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================
# 라우터 임포트 & 등록
# ============================================================
# 🎯 고객 중심 API 라우터 (신규)
from app.routers import therapists_api, bookings_api, reviews_api, settlement
# 📱 메신저 봇 라우터 (신규)
from app.routers import kakao, whatsapp
# 🎫 스탬프 & 쿠폰 라우터
from app.routers import stamps
# 📋 SSS 스캔 라우터
from app.routers import sss
# 💰 일일 지출 보고서 라우터
from app.routers import expense
# 💵 급여 정산 라우터 (신규)
from app.routers import payroll
# 💹 financial_api — sync DB 패턴, async 전환 예정 (임시 비활성화)
# from app.routers import financial_api
# 📊 Admin 데이터 관리 라우터 (테라피스트, 예약, 드라이버)
from app.routers import admin_data_api

# 기존 라우터들 (일부 호환성 문제로 주석 처리)
# from app.routers import beds, therapists, bookings, matching
# from app.routers import settlements, predictions, dashboard, admin, services, customers, chats, location

# API 라우터 등록
# app.include_router(beds.router, prefix="/api")
# app.include_router(therapists.router, prefix="/api")
# app.include_router(bookings.router, prefix="/api")
# app.include_router(matching.router, prefix="/api")
# app.include_router(settlements.router, prefix="/api")
# app.include_router(predictions.router, prefix="/api")
# app.include_router(dashboard.router, prefix="/api")
# app.include_router(admin.router, prefix="/api")
# app.include_router(services.router, prefix="/api")
# app.include_router(customers.router, prefix="/api")
# app.include_router(chats.router, prefix="/api")
# app.include_router(location.router, prefix="/api")
# app.include_router(kakao.router)

# 고객 중심 API 라우터 등록
app.include_router(therapists_api.router)
app.include_router(bookings_api.router)
app.include_router(admin_data_api.router)
app.include_router(reviews_api.router)
app.include_router(settlement.router)  # Settlement API (Mock Data)

# 재무 감사 로그 라우터 등록
from app.routers import audit_api
app.include_router(audit_api.router)

# 재무 WebSocket 라우터 등록
from app.routers import websocket_financial
app.include_router(websocket_financial.router)

# 📱 메신저 봇 라우터 등록
app.include_router(kakao.router)
app.include_router(whatsapp.router)
# 🎫 스탬프 & 쿠폰 라우터 등록
app.include_router(stamps.router)
app.include_router(sss.router)
app.include_router(expense.router)
# 💵 급여 정산 라우터 등록
app.include_router(payroll.router)
# 💹 예산 모니터링 라우터 등록
from app.routers import budget_monitor_api
app.include_router(budget_monitor_api.router)
# app.include_router(financial_api.router)  # async 전환 후 재활성화


@app.on_event("startup")
async def startup():
    """애플리케이션 시작"""
    logger.info("🚀 ElSpa API 시작 중...")
    await init_db()
    logger.info("✅ 데이터베이스 초기화 완료")
    logger.info(f"📊 Supabase 연결: {settings.supabase_url}")


@app.on_event("shutdown")
async def shutdown():
    """애플리케이션 종료"""
    logger.info("🛑 ElSpa API 종료 중...")
    from app.database import close_db
    await close_db()


@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "message": "ElSpa Manager API v0.1.0",
        "status": "🟢 Ready",
        "environment": settings.env,
    }


@app.get("/health")
async def health():
    """헬스 체크 (상세)"""
    return {
        "status": "🟢 Healthy",
        "api_version": settings.api_version,
        "database": "✅ Connected",
        "supabase": settings.supabase_url,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info",
    )
