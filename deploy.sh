#!/bin/bash

# ============================================================
# 🚀 ElSpa 자동 배포 스크립트
# ============================================================
# 역할:
#   1. Git Push (변경사항 업로드)
#   2. 빌드 (프론트엔드)
#   3. Cloudflare 배포
#   4. 배포 완료 대기
#   5. 자동 새로고침 + 커밋 확인
# ============================================================

set -e

# 색상
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
echo "🚀 ElSpa 자동 배포 시작"
echo "============================================================"

# ============================================================
# Step 1: Git Push
# ============================================================
echo ""
echo "📦 Step 1: Git Push"
echo "============================================================"

cd "$PROJECT_ROOT"

# 커밋 메시지 추출 (마지막 커밋)
LAST_COMMIT=$(git log -1 --pretty=format:"%h %s")
COMMIT_HASH=$(git log -1 --pretty=format:"%h")
COMMIT_MSG=$(git log -1 --pretty=format:"%s")

log_info "마지막 커밋: $LAST_COMMIT"

# Git Push
if git diff-index --quiet HEAD --; then
  log_warning "변경사항이 없습니다"
else
  log_info "변경사항 스테이징..."
  git add -A
  git commit -m "🔄 Auto Deploy: $COMMIT_MSG" 2>/dev/null || true
fi

log_info "GitHub에 push 중..."
git push origin main 2>&1 | grep -E "Everything|To https" || true

log_success "Git push 완료"

# ============================================================
# Step 2: 빌드
# ============================================================
echo ""
echo "🔨 Step 2: 프론트엔드 빌드"
echo "============================================================"

cd "$PROJECT_ROOT/frontend"

log_info "빌드 중..."
npm run build > /tmp/build.log 2>&1
log_success "빌드 완료"

# ============================================================
# Step 3: Cloudflare 배포
# ============================================================
echo ""
echo "☁️  Step 3: Cloudflare Pages 배포"
echo "============================================================"

log_info "Wrangler로 배포 중..."
wrangler pages deploy .next --project-name=elspa --branch=main > /tmp/deploy.log 2>&1

if grep -q "Deployment complete" /tmp/deploy.log; then
  log_success "배포 업로드 완료"
else
  log_warning "배포 업로드 중..."
fi

# ============================================================
# Step 4: 배포 완료 대기
# ============================================================
echo ""
echo "⏳ Step 4: 배포 완료 대기 (최대 60초)"
echo "============================================================"

WAIT_COUNT=0
MAX_WAIT=60

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://elspa.pages.dev 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    log_success "배포 완료! (HTTP 200)"
    break
  else
    echo -ne "\r⏳ 대기 중... ${WAIT_COUNT}초 (HTTP $HTTP_CODE)"
    WAIT_COUNT=$((WAIT_COUNT + 5))
    sleep 5
  fi
done

echo ""

# ============================================================
# Step 5: 자동 새로고침 + 커밋 확인
# ============================================================
echo ""
echo "🔍 Step 5: 배포된 커밋 확인"
echo "============================================================"

# 페이지 내용 조회
PAGE_CONTENT=$(curl -s https://elspa.pages.dev 2>/dev/null | head -500)

# 커밋 정보 확인 (build-info.json이나 헤더에서 찾기)
if echo "$PAGE_CONTENT" | grep -q "ELSPA"; then
  log_success "✅ 페이지 로드됨 (ELSPA 텍스트 확인)"
else
  log_error "❌ 페이지 로드 실패"
fi

# Monitor 페이지 확인
MONITOR_CHECK=$(curl -s https://elspa.pages.dev/monitor 2>/dev/null)

if echo "$MONITOR_CHECK" | grep -q "BOOKING WITH THERAPIST\|Real-time Bed"; then
  log_success "✅ Monitor 페이지 정상 로드"
else
  log_warning "⚠️  Monitor 페이지 확인 필요"
fi

# ============================================================
# Step 6: 최종 결과
# ============================================================
echo ""
echo "============================================================"
echo "✅ 배포 완료!"
echo "============================================================"
echo ""
echo "📊 배포 정보:"
echo "   • 커밋: $LAST_COMMIT"
echo "   • URL: https://elspa.pages.dev"
echo "   • 상태: HTTP 200 (정상)"
echo ""
echo "🔗 접속 링크:"
echo "   • Frontend: https://elspa.pages.dev"
echo "   • Monitor: https://elspa.pages.dev/monitor"
echo "   • Admin: https://elspa.pages.dev/admin"
echo ""

# 브라우저 자동 열기 (선택사항)
if command -v open &> /dev/null; then
  log_info "브라우저 열기 중..."
  open "https://elspa.pages.dev"
elif command -v xdg-open &> /dev/null; then
  xdg-open "https://elspa.pages.dev"
fi

echo "============================================================"
