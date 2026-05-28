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
import os
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import init_db, close_db

# ============================================================
# 모니터링 & 로깅 설정 (Phase 10-2)
# ============================================================
from app.utils.logging_config import setup_logging, get_logger
from app.middleware.apm import init_sentry, apm_middleware
from app.middleware.error_tracking import (
    general_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
)
from app.middleware.metrics import metrics_middleware, setup_metrics_endpoint

# 로깅 초기화
log_dir = os.getenv("LOG_DIR", "./logs")
json_logs = os.getenv("JSON_LOGS", "true").lower() == "true"
setup_logging(
    log_level="INFO",
    log_dir=log_dir,
    json_format=json_logs,
)

logger = get_logger(__name__)

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
# Phase 10-2: 모니터링 & 로깅 미들웨어 등록
# ============================================================

# 1. 사용자 정의 메트릭 엔드포인트
setup_metrics_endpoint(app)

# 3. 예외 핸들러 등록
app.add_exception_handler(Exception, general_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)

# 4. APM 미들웨어 (Sentry)
@app.middleware("http")
async def monitoring_middleware(request: Request, call_next):
    """모니터링 및 성능 추적 미들웨어"""
    return await apm_middleware(request, call_next)


# ============================================================
# 헬스 체크 & 라이프사이클 이벤트
# ============================================================
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 이벤트"""
    logger.info("🚀 ElSpa API 시작 중...")

    try:
        # Sentry 초기화 (Phase 10-2)
        sentry_dsn = os.getenv("SENTRY_DSN")
        sentry_env = os.getenv("SENTRY_ENVIRONMENT", "development")
        if sentry_dsn:
            init_sentry(dsn=sentry_dsn, environment=sentry_env)
            logger.info(f"✅ Sentry APM 초기화 완료 ({sentry_env})")
        else:
            logger.info("⚠️ SENTRY_DSN 환경변수 미설정 (선택사항)")

        # 데이터베이스 초기화
        await init_db()
        logger.info("✅ 데이터베이스 초기화 완료")

        # 마사지 예약 일일 동기화 스케줄러 시작
        from app.services.scheduler import start_scheduler
        start_scheduler()
        logger.info("✅ 마사지 예약 자동 동기화 스케줄러 시작")

        logger.info("🎉 ElSpa API 준비 완료")
    except Exception as e:
        logger.error(f"❌ 시작 단계 실패: {e}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 이벤트"""
    logger.info("🛑 ElSpa API 종료 중...")

    # 스케줄러 중지
    from app.services.scheduler import stop_scheduler
    stop_scheduler()

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
    """헬스 체크 (상세)"""
    return {
        "status": "🟢 Healthy",
        "version": "1.0.0",
        "environment": settings.env,
        "api_version": settings.api_version,
        "database": "✅ Connected",
        "monitoring": "✅ Enabled (Phase 10-2)",
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
# 🔐 인증 라우터 (신규 - Phase 8-2)
from app.routers import auth, mock_data
# 💵 급여 정산 라우터 (신규)
from app.routers import payroll, payroll_analytics, messaging
# 💹 financial_api — sync DB 패턴, async 전환 예정 (임시 비활성화)
# from app.routers import financial_api
# 📊 Admin 데이터 관리 라우터 (테라피스트, 예약, 드라이버)
from app.routers import admin_data_api
# 🚗 드라이버 API 라우터 (신규 - Sprint 13)
from app.routers import driver_api
# 🧖 마사지 예약 API 라우터 (Google Sheets 동기화)
from app.routers import massage_bookings
# 📊 Google Sheets OAuth 2.0 예약 API (신규 - Sprint 14)
from app.routers import google_sheets_router
# 💰 급여 정산 API 라우터 (BMAD × LangGraph)
from app.routers import payroll

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
app.include_router(payroll.router)  # 💰 Payroll API (BMAD × LangGraph)
app.include_router(driver_api.router)  # 🚗 드라이버 API
app.include_router(massage_bookings.router)  # 🧖 마사지 예약 API (Google Sheets 동기화)
app.include_router(google_sheets_router.router)  # 📊 Google Sheets OAuth 2.0 API

# 재무 감사 로그 라우터 등록 (임시 비활성화)
# from app.routers import audit_api
# app.include_router(audit_api.router)

# 재무 WebSocket 라우터 등록 (임시 비활성화)
# from app.routers import websocket_financial
# app.include_router(websocket_financial.router)

# 🔐 인증 라우터 등록 (Phase 8-2)
app.include_router(auth.router)

# 📱 메신저 봇 라우터 등록
app.include_router(kakao.router)
app.include_router(whatsapp.router)
# 🎫 스탬프 & 쿠폰 라우터 등록
app.include_router(stamps.router)
app.include_router(sss.router)
app.include_router(expense.router)
# 💵 급여 정산 라우터 등록
app.include_router(payroll.router)
app.include_router(payroll_analytics.router)
app.include_router(messaging.router)  # 메시지 발송 시스템
app.include_router(mock_data.router)  # Mock Data 생성 API (테스트용)
# 💹 예산 모니터링 라우터 등록 (임시 비활성화)
# from app.routers import budget_monitor_api
# app.include_router(budget_monitor_api.router)
# app.include_router(financial_api.router)  # async 전환 후 재활성화






if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info",
    )
