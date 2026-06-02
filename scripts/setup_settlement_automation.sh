#!/bin/bash

# ============================================================
# 📌 월간 정산 자동화 - 설정 스크립트
# 📋 목적: 필요한 디렉토리와 의존성 설치
# 📅 작성일: 2026-06-02
# ============================================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   월간 정산 자동화 - 설정                              ║"
echo "║   Setup Settlement Automation                         ║"
echo "╚════════════════════════════════════════════════════════╝"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Step 1: 디렉토리 생성
# ============================================================

echo -e "\n${BLUE}Step 1: Creating directories...${NC}"

mkdir -p logs
echo -e "${GREEN}✓${NC} logs/ directory created"

mkdir -p reports/settlements
echo -e "${GREEN}✓${NC} reports/settlements/ directory created"

mkdir -p scripts
echo -e "${GREEN}✓${NC} scripts/ directory created"

# ============================================================
# Step 2: Python 의존성 확인 및 설치
# ============================================================

echo -e "\n${BLUE}Step 2: Installing Python dependencies...${NC}"

# Python 버전 확인
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "Python version: ${YELLOW}${python_version}${NC}"

# 필수 패키지 목록
packages=(
    "sqlalchemy"
    "python-dotenv"
    "apscheduler"
    "openpyxl"
    "reportlab"
)

# pip 업그레이드
echo -e "\nUpgrading pip..."
python3 -m pip install --upgrade pip --quiet

# 패키지 설치
for package in "${packages[@]}"; do
    echo -n "Installing $package... "
    if python3 -m pip install "$package" --quiet 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
done

echo -e "\n${GREEN}✓${NC} All dependencies installed"

# ============================================================
# Step 3: .env 파일 확인
# ============================================================

echo -e "\n${BLUE}Step 3: Checking .env file...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo -e "\nPlease create .env with DATABASE_URL:"
    echo -e "${YELLOW}echo 'DATABASE_URL=postgresql://user:password@localhost/elspa' > .env${NC}"
else
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} .env file exists with DATABASE_URL"
        # DATABASE_URL 값 확인 (보안을 위해 부분만 표시)
        db_url=$(grep "DATABASE_URL" .env | cut -d= -f2)
        db_type=$(echo "$db_url" | cut -d: -f1)
        echo -e "  Database type: ${YELLOW}${db_type}${NC}"
    else
        echo -e "${YELLOW}⚠ DATABASE_URL not found in .env${NC}"
        echo -e "Please add it manually or run:"
        echo -e "${YELLOW}echo 'DATABASE_URL=postgresql://user:password@localhost/elspa' >> .env${NC}"
    fi
fi

# ============================================================
# Step 4: 데이터베이스 연결 테스트
# ============================================================

echo -e "\n${BLUE}Step 4: Testing database connection...${NC}"

python3 << 'EOF'
import sys
import os
from pathlib import Path

# 프로젝트 경로 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from dotenv import load_dotenv
    load_dotenv()

    from app.database import SessionLocal_sync
    from app.models.company_settlement import CompanySettlement

    db = SessionLocal_sync()
    count = db.query(CompanySettlement).count()
    db.close()

    print(f"\033[0;32m✓\033[0m Database connection successful")
    print(f"  Total settlements in DB: {count}")

except Exception as e:
    print(f"\033[0;31m✗\033[0m Database connection failed")
    print(f"  Error: {str(e)}")
    sys.exit(1)
EOF

result=$?
if [ $result -ne 0 ]; then
    echo -e "${YELLOW}⚠ Database connection test failed${NC}"
    echo -e "  Make sure PostgreSQL is running and DATABASE_URL is correct"
fi

# ============================================================
# Step 5: 스크립트 파일 확인
# ============================================================

echo -e "\n${BLUE}Step 5: Verifying script files...${NC}"

scripts=(
    "scripts/monthly_settlement_automation.py"
    "scripts/settlement_automation_example.py"
    "scripts/SETTLEMENT_AUTOMATION_GUIDE.md"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${GREEN}✓${NC} $script"
    else
        echo -e "${RED}✗${NC} $script not found"
    fi
done

# ============================================================
# Step 6: 권한 설정
# ============================================================

echo -e "\n${BLUE}Step 6: Setting file permissions...${NC}"

chmod +x scripts/monthly_settlement_automation.py 2>/dev/null || true
chmod +x scripts/settlement_automation_example.py 2>/dev/null || true
echo -e "${GREEN}✓${NC} File permissions updated"

# ============================================================
# 설정 완료
# ============================================================

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   설정 완료! Setup Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\n📖 사용 방법 (Usage):"
echo -e "\n${YELLOW}1. 수동 실행 (Manual execution):${NC}"
echo -e "   python scripts/monthly_settlement_automation.py --manual"

echo -e "\n${YELLOW}2. 특정 월 실행 (Specific month):${NC}"
echo -e "   python scripts/monthly_settlement_automation.py --manual --year 2026 --month 5"

echo -e "\n${YELLOW}3. 테스트 모드 (Test mode - no reports):${NC}"
echo -e "   python scripts/monthly_settlement_automation.py --test"

echo -e "\n${YELLOW}4. 스케줄러 시작 (Start scheduler - auto-runs on 5th of each month at 9:00 AM):${NC}"
echo -e "   python scripts/monthly_settlement_automation.py --schedule"

echo -e "\n${YELLOW}5. 예제 실행 (Run examples):${NC}"
echo -e "   python scripts/settlement_automation_example.py"

echo -e "\n${YELLOW}6. 도움말 (Help):${NC}"
echo -e "   python scripts/monthly_settlement_automation.py --help"

echo -e "\n📚 자세한 가이드:"
echo -e "   ${YELLOW}scripts/SETTLEMENT_AUTOMATION_GUIDE.md${NC}"

echo -e "\n📝 로그 파일:"
echo -e "   ${YELLOW}logs/settlement_automation.log${NC}"
echo -e "   ${YELLOW}logs/settlement_automation_results.json${NC}"

echo -e "\n📊 보고서 위치:"
echo -e "   ${YELLOW}reports/settlements/${NC}"

echo -e "\n"
