#!/bin/bash

# ============================================================
# 🚀 ElSpa 로컬 개발 환경 설정 스크립트
# 📌 프론트엔드 + 백엔드 + 데이터베이스 자동 설정
# 📅 작성일: 2026-06-03
# ============================================================

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수: 로그 출력
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# ============================================================
# Step 0: 필수 도구 확인
# ============================================================
echo ""
echo "============================================================"
echo "📋 Step 0: 필수 도구 확인"
echo "============================================================"

check_command() {
  if ! command -v $1 &> /dev/null; then
    log_error "$1이 설치되지 않았습니다"
    log_info "설치 방법:"
    case $1 in
      "node")
        echo "  → https://nodejs.org (v18 이상)"
        ;;
      "python3")
        echo "  → https://www.python.org (v3.10 이상)"
        ;;
      "git")
        echo "  → https://git-scm.com"
        ;;
    esac
    exit 1
  fi
}

check_command "git"
check_command "node"
check_command "npm"
check_command "python3"

log_success "필수 도구 설치 확인"
echo "  • Git: $(git --version | cut -d' ' -f3)"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • Python: $(python3 --version | cut -d' ' -f2)"

# ============================================================
# Step 1: 프로젝트 정보 출력
# ============================================================
echo ""
echo "============================================================"
echo "📁 Step 1: 프로젝트 구조 확인"
echo "============================================================"

PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT"

log_info "프로젝트 경로: $PROJECT_ROOT"

if [ ! -d "$FRONTEND_DIR" ]; then
  log_error "frontend 디렉토리를 찾을 수 없습니다"
  exit 1
fi

log_success "프로젝트 구조 확인 완료"

# ============================================================
# Step 2: 프론트엔드 설정
# ============================================================
echo ""
echo "============================================================"
echo "🎨 Step 2: 프론트엔드 (Next.js) 설정"
echo "============================================================"

cd "$FRONTEND_DIR"

# 2-1) node_modules 확인
if [ ! -d "node_modules" ]; then
  log_info "npm 패키지 설치 중..."
  npm install
  log_success "npm 패키지 설치 완료"
else
  log_success "npm 패키지 이미 설치됨"
fi

# 2-2) 환경 변수 생성
if [ ! -f ".env.local" ]; then
  log_info ".env.local 파일 생성 중..."
  cat > .env.local << 'EOF'
# Frontend 환경 변수
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
  log_success ".env.local 파일 생성"
  log_warning "필요시 수정: $FRONTEND_DIR/.env.local"
else
  log_success ".env.local 파일 이미 존재"
fi

log_success "프론트엔드 설정 완료"

# ============================================================
# Step 3: 백엔드 설정
# ============================================================
echo ""
echo "============================================================"
echo "⚙️  Step 3: 백엔드 (FastAPI) 설정"
echo "============================================================"

cd "$PROJECT_ROOT"

# 3-1) Python 가상 환경 생성
if [ ! -d "venv" ]; then
  log_info "Python 가상 환경 생성 중..."
  python3 -m venv venv
  log_success "Python 가상 환경 생성 완료"
else
  log_success "Python 가상 환경 이미 존재"
fi

# 3-2) 가상 환경 활성화
log_info "가상 환경 활성화 중..."
source venv/bin/activate

# 3-3) pip 업그레이드
log_info "pip 업그레이드 중..."
pip install --upgrade pip setuptools wheel -q

# 3-4) 패키지 설치
if [ ! -f "requirements.txt" ]; then
  log_error "requirements.txt 파일을 찾을 수 없습니다"
  exit 1
fi

log_info "Python 패키지 설치 중..."
pip install -r requirements.txt -q
log_success "Python 패키지 설치 완료"

# 3-5) 환경 변수 생성
if [ ! -f ".env" ]; then
  log_info ".env 파일 생성 중..."
  cat > .env << 'EOF'
# Backend 환경 변수
DATABASE_URL=postgresql://localhost/elspa
PORT=8000
ENVIRONMENT=development
PYTHONUNBUFFERED=1
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
  log_success ".env 파일 생성"
  log_warning "🔴 중요: DATABASE_URL을 Supabase 연결 정보로 수정해야 합니다"
  log_info "  → .env 파일 수정: DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres"
else
  log_success ".env 파일 이미 존재"
fi

log_success "백엔드 설정 완료"

# ============================================================
# Step 4: Git 설정
# ============================================================
echo ""
echo "============================================================"
echo "📦 Step 4: Git 설정"
echo "============================================================"

# Git user 설정 확인
if [ -z "$(git config user.name)" ]; then
  log_warning "Git 사용자 정보가 설정되지 않았습니다"
  log_info "설정 방법:"
  echo "  git config --global user.name '이름'"
  echo "  git config --global user.email '이메일'"
else
  log_success "Git 사용자: $(git config user.name)"
fi

# Git hooks 설정 (선택)
if [ -d ".git/hooks" ] && [ ! -f ".git/hooks/pre-commit" ]; then
  log_info "Git pre-commit hook 설정 중... (선택사항)"
  cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# 커밋 전 타입 체크 (프론트엔드만)
cd frontend
npm run type-check 2>/dev/null || true
EOF
  chmod +x .git/hooks/pre-commit
  log_success "Git pre-commit hook 설정 완료"
fi

# ============================================================
# Step 5: 개발 서버 실행 가이드
# ============================================================
echo ""
echo "============================================================"
echo "🎉 Setup 완료!"
echo "============================================================"

log_success "모든 설정이 완료되었습니다"

echo ""
echo "📝 다음 단계:"
echo ""
echo "1️⃣  환경 변수 확인:"
echo "   • Frontend: $FRONTEND_DIR/.env.local"
echo "   • Backend:  $PROJECT_ROOT/.env"
echo ""
echo "2️⃣  데이터베이스 연결:"
echo "   • Supabase CONNECTION STRING을 .env의 DATABASE_URL에 입력"
echo "   • https://app.supabase.com → Settings → Database → Connection string"
echo ""
echo "3️⃣  개발 서버 시작 (터미널 2개 필요):"
echo ""
echo "   📱 Terminal 1 - 프론트엔드 (포트 3000):"
echo "   $ cd frontend"
echo "   $ npm run dev"
echo ""
echo "   ⚙️  Terminal 2 - 백엔드 (포트 8000):"
echo "   $ source venv/bin/activate"
echo "   $ python main.py"
echo ""
echo "4️⃣  접속:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:8000/docs"
echo ""
echo "5️⃣  프로덕션 빌드:"
echo "   $ cd frontend && npm run build"
echo ""
echo "📖 더 많은 정보:"
echo "   • 환경.md - 전체 개발/배포 환경 설정"
echo "   • CLAUDE.md - 프로젝트 개발 가이드"
echo "   • history-workflow-book.md - 개발 히스토리"
echo ""
echo "============================================================"
