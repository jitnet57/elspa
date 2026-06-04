#!/bin/bash

# ============================================================
# 🚀 ElSpa 자동 서버 시작 스크립트 (Mac/Linux)
# ============================================================
# 기존 서버 종료 후 프론트엔드 + 백엔드 동시 실행
# 사용: bash start.sh
# ============================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo "🔴 Step 1: 기존 서버 프로세스 종료"
echo "============================================================"

# 기존 Node.js 프로세스 종료 (포트 3000)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  log_info "포트 3000 프로세스 종료 중..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
  log_success "포트 3000 정리 완료"
else
  log_info "포트 3000 프로세스 없음"
fi

# 기존 Python 프로세스 종료 (포트 8000)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  log_info "포트 8000 프로세스 종료 중..."
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  sleep 1
  log_success "포트 8000 정리 완료"
else
  log_info "포트 8000 프로세스 없음"
fi

echo ""
echo "============================================================"
echo "🚀 Step 2: 환경 설정 확인"
echo "============================================================"

# .env 파일 확인
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  log_error ".env 파일이 없습니다"
  log_info "먼저 bash setup.sh를 실행해주세요"
  exit 1
fi

# 가상 환경 활성화
if [ ! -d "$PROJECT_ROOT/venv" ]; then
  log_error "Python 가상 환경이 없습니다"
  log_info "먼저 bash setup.sh를 실행해주세요"
  exit 1
fi

log_success "환경 설정 확인 완료"

echo ""
echo "============================================================"
echo "⚙️  Step 3: 백엔드 (FastAPI) 시작"
echo "============================================================"

# 백엔드 시작 (백그라운드)
cd "$PROJECT_ROOT"
source venv/bin/activate

# Pythonpath 설정
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"

# 로그 파일
BACKEND_LOG="$PROJECT_ROOT/logs/backend.log"
mkdir -p "$PROJECT_ROOT/logs"

log_info "백엔드 시작 중 (포트 8000)..."
python main.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

log_info "백엔드 프로세스 ID: $BACKEND_PID"
log_info "로그 파일: $BACKEND_LOG"

# 백엔드 시작 대기
sleep 3
if ps -p $BACKEND_PID > /dev/null; then
  log_success "백엔드 시작 성공"
else
  log_error "백엔드 시작 실패"
  cat "$BACKEND_LOG"
  exit 1
fi

echo ""
echo "============================================================"
echo "🎨 Step 4: 프론트엔드 (Next.js) 시작"
echo "============================================================"

cd "$PROJECT_ROOT/frontend"

# 로그 파일
FRONTEND_LOG="$PROJECT_ROOT/logs/frontend.log"

log_info "프론트엔드 시작 중 (포트 3000)..."
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

log_info "프론트엔드 프로세스 ID: $FRONTEND_PID"
log_info "로그 파일: $FRONTEND_LOG"

# 프론트엔드 시작 대기
sleep 5
if ps -p $FRONTEND_PID > /dev/null; then
  log_success "프론트엔드 시작 성공"
else
  log_error "프론트엔드 시작 실패"
  cat "$FRONTEND_LOG"
  kill -9 $BACKEND_PID 2>/dev/null || true
  exit 1
fi

echo ""
echo "============================================================"
echo "✅ 모든 서버가 실행 중입니다!"
echo "============================================================"

echo ""
echo "📱 접속:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo ""
echo "📝 로그:"
echo "   • Backend:  tail -f $BACKEND_LOG"
echo "   • Frontend: tail -f $FRONTEND_LOG"
echo ""
echo "🛑 종료:"
echo "   • bash stop.sh"
echo "   • 또는 Ctrl+C 입력 후 bash stop.sh 실행"
echo ""
echo "============================================================"

# 프로세스 계속 실행
wait
