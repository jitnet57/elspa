#!/bin/bash

# ============================================================
# 📌 scripts/run_migrations.sh
# 📋 목적: 배포 전 데이터베이스 마이그레이션 자동 실행
# 🔧 Trigger: CI/CD 파이프라인 (deploy.yml)
# 📅 작성일: 2026-05-22
# ============================================================

set -e  # 에러 발생 시 즉시 종료

# ==========================================
# 색상 정의
# ==========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 데이터베이스 마이그레이션 시작${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# ==========================================
# 환경 변수 확인
# ==========================================
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL이 설정되지 않았습니다.${NC}"
    echo "로컬 개발 모드로 진행합니다."
else
    echo -e "${GREEN}✅ DATABASE_URL 설정됨${NC}"
fi

# ==========================================
# 1️⃣ Python 의존성 확인
# ==========================================
echo ""
echo -e "${YELLOW}📦 Python 의존성 확인...${NC}"

if ! python -c "import alembic" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  alembic이 설치되지 않았습니다. 설치 중...${NC}"
    pip install alembic sqlalchemy psycopg2-binary
fi

# ==========================================
# 2️⃣ Alembic 마이그레이션 실행
# ==========================================
echo ""
echo -e "${YELLOW}🔄 Alembic 마이그레이션 실행 중...${NC}"

cd app 2>/dev/null || cd . 

if [ -d "alembic" ]; then
    echo "📁 alembic 디렉터리 발견"
    alembic upgrade head
    echo -e "${GREEN}✅ Alembic 마이그레이션 완료${NC}"
else
    echo -e "${YELLOW}⚠️  alembic 디렉터리가 없습니다.${NC}"
    echo "SQLAlchemy 자동 마이그레이션으로 진행합니다."
    
    # 대안: SQLAlchemy 자동 마이그레이션
    python << 'PYEOF'
from app.database import Base, engine
from app.models import *  # 모든 모델 임포트

print("📊 모든 테이블 생성 중...")
Base.metadata.create_all(bind=engine)
print("✅ 테이블 생성 완료")
PYEOF
fi

# ==========================================
# 3️⃣ 초기 데이터 로드
# ==========================================
echo ""
echo -e "${YELLOW}📝 초기 데이터 로드 중...${NC}"

if [ -f "scripts/init_payroll_data.py" ]; then
    cd ..
    python scripts/init_payroll_data.py
    echo -e "${GREEN}✅ 초기 데이터 로드 완료${NC}"
else
    echo -e "${YELLOW}⚠️  init_payroll_data.py가 없습니다.${NC}"
fi

# ==========================================
# 4️⃣ 마이그레이션 상태 확인
# ==========================================
echo ""
echo -e "${YELLOW}📊 마이그레이션 상태 확인 중...${NC}"

if [ -d "alembic" ]; then
    cd app
    alembic current
    cd ..
    echo -e "${GREEN}✅ 마이그레이션 상태 확인 완료${NC}"
fi

# ==========================================
# 5️⃣ 완료
# ==========================================
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 데이터베이스 마이그레이션 완료!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "🎯 다음 단계:"
echo "  1. 애플리케이션 시작: python main.py"
echo "  2. API 문서: http://localhost:8000/docs"
echo "  3. 프론트엔드: npm run dev"
