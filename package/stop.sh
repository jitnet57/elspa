#!/bin/bash

# ============================================================
# 🛑 ElSpa 서버 정지 스크립트 (Mac/Linux)
# ============================================================
# 프론트엔드 + 백엔드 모두 종료
# 사용: bash stop.sh
# ============================================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }

echo "============================================================"
echo "🛑 ElSpa 서버 종료"
echo "============================================================"

KILLED=0

# 포트 3000 (프론트엔드) 종료
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  log_info "포트 3000 프로세스 종료 중..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
  log_success "프론트엔드 (포트 3000) 종료 완료"
  KILLED=$((KILLED + 1))
fi

# 포트 8000 (백엔드) 종료
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  log_info "포트 8000 프로세스 종료 중..."
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  sleep 1
  log_success "백엔드 (포트 8000) 종료 완료"
  KILLED=$((KILLED + 1))
fi

if [ $KILLED -eq 0 ]; then
  log_info "실행 중인 서버가 없습니다"
else
  echo ""
  log_success "모든 서버가 종료되었습니다"
fi

echo ""
echo "다시 시작하려면: bash start.sh"
echo "============================================================"
