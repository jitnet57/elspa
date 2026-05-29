# ============================================================
# 📌 Dockerfile: FastAPI 프로덕션 (멀티스테이지 빌드)
# 📋 목적: 최적화된 프로덕션 이미지 생성
# 📅 작성일: 2026-05-29
# ============================================================

# Stage 1: 빌드 스테이지
FROM python:3.11-slim as builder

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: 런타임 스테이지
FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치 (런타임 필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 빌드 스테이지에서 Python 패키지 복사
COPY --from=builder /root/.local /root/.local

# 애플리케이션 코드 복사
COPY main.py .
COPY gunicorn_config.py .
COPY app/ ./app/
COPY migrations/ ./migrations/

# 환경 변수 설정
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production \
    LOG_LEVEL=info

# 헬스체크 엔드포인트
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# 비루트 사용자 생성 (보안)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 포트 노출
EXPOSE ${PORT}

# 시작 명령
CMD ["gunicorn", "-c", "gunicorn_config.py", "main:app"]
