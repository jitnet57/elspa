# ============================================================
# 📌 Gunicorn 설정파일
# 📋 목적: FastAPI + Gunicorn 프로덕션 서버 설정
# 📅 작성일: 2026-06-02
# ============================================================

# 포트 설정
bind = "0.0.0.0:8000"

# 워커 프로세스 수 (CPU 코어 수 * 2 + 1)
workers = 4

# 워커 타입 (async 처리용)
worker_class = "uvicorn.workers.UvicornWorker"

# 타임아웃 (30초)
timeout = 30

# 접속 로그
accesslog = "-"

# 에러 로그
errorlog = "-"

# 로그 레벨
loglevel = "info"

# 프로세스 이름
proc_name = "elspa-api"

# 서버 소켓 버퍼 크기
backlog = 2048
