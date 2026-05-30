"""
============================================================
📌 Vercel Serverless FastAPI
📋 목적: Vercel에서 FastAPI 실행
🔧 엔드포인트: /api/*
📅 작성일: 2026-05-30
============================================================
"""

import sys
from pathlib import Path

# 프로젝트 루트 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 기존 main.py에서 앱 가져오기
from main import app as main_app

# CORS 설정
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://elspa.pages.dev",
        "https://elspa.com",
        "https://www.elspa.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 헬스체크 엔드포인트
@main_app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ElSpa API"}

# Vercel에서 호출할 ASGI 앱 내보내기
app = main_app
