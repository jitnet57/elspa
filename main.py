"""
ElSpa API - 최소 버전 (테스트용)
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers.massage_types import router as massage_types_router


# FastAPI 앱 생성
app = FastAPI(
    title="ElSpa API",
    description="마사지 샵 통합 관리 시스템",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(massage_types_router)

# 헬스 체크
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "message": "ElSpa Backend is running!"
    }

# 루트
@app.get("/")
async def root():
    return {
        "message": "ElSpa API v1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
