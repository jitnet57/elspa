#!/bin/bash

# ============================================================
# ElSpa 백엔드 서버 설치 프로그램
# 목적: FastAPI 백엔드를 서버에 설치 및 자동 실행
# 사용법: bash install-server.sh
# ============================================================

set -e  # 에러 발생 시 즉시 종료

echo "================================================"
echo "🚀 ElSpa 백엔드 서버 설치 프로그램"
echo "================================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Python 설치 확인
echo -e "${YELLOW}[1/6] Python 설치 확인...${NC}"
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}❌ Python 3이 설치되어 있지 않습니다.${NC}"
  echo "설치: brew install python3 (Mac) 또는 apt-get install python3 (Linux)"
  exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ $PYTHON_VERSION 설치됨${NC}"
echo ""

# 2. 가상 환경 생성
echo -e "${YELLOW}[2/6] 가상 환경 생성...${NC}"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo -e "${GREEN}✅ 가상 환경 생성 완료${NC}"
else
  echo -e "${GREEN}✅ 가상 환경이 이미 존재합니다${NC}"
fi
echo ""

# 3. 가상 환경 활성화
echo -e "${YELLOW}[3/6] 가상 환경 활성화...${NC}"
source venv/bin/activate
echo -e "${GREEN}✅ 가상 환경 활성화 완료${NC}"
echo ""

# 4. 의존성 설치
echo -e "${YELLOW}[4/6] 패키지 의존성 설치...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✅ 의존성 설치 완료${NC}"
echo ""

# 5. 환경 변수 설정
echo -e "${YELLOW}[5/6] 환경 변수 설정...${NC}"
if [ ! -f ".env" ]; then
  cat > .env << 'EOF'
# ============================================================
# ElSpa 백엔드 환경 설정
# ============================================================

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/elspa

# Supabase
SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=104694066545-vtgespl9ho6b4gmcolgdrpuloankttgq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_here

# 서버 설정
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
EOF
  echo -e "${YELLOW}⚠️  .env 파일 생성됨. 설정을 수정하세요!${NC}"
  echo "   nano .env"
else
  echo -e "${GREEN}✅ .env 파일이 이미 존재합니다${NC}"
fi
echo ""

# 6. 서비스 설정 (systemd - Linux만)
echo -e "${YELLOW}[6/6] 자동 실행 설정...${NC}"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  SERVICE_FILE="/etc/systemd/system/elspa-backend.service"

  if [ ! -f "$SERVICE_FILE" ]; then
    echo -e "${YELLOW}systemd 서비스 파일을 생성하시겠습니까? (관리자 권한 필요)${NC}"
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=ElSpa Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
      sudo systemctl daemon-reload
      sudo systemctl enable elspa-backend
      echo -e "${GREEN}✅ systemd 서비스 등록 완료${NC}"
      echo "   시작: sudo systemctl start elspa-backend"
      echo "   중지: sudo systemctl stop elspa-backend"
      echo "   상태: sudo systemctl status elspa-backend"
    fi
  fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
  PLIST_FILE="$HOME/Library/LaunchAgents/com.elspa.backend.plist"

  if [ ! -f "$PLIST_FILE" ]; then
    cat > $PLIST_FILE << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.elspa.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(pwd)/venv/bin/python</string>
        <string>$(pwd)/main.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/elspa-backend.err.log</string>
    <key>StandardOutPath</key>
    <string>/tmp/elspa-backend.out.log</string>
</dict>
</plist>
EOF
    launchctl load $PLIST_FILE
    echo -e "${GREEN}✅ launchd 서비스 등록 완료${NC}"
    echo "   시작: launchctl load $PLIST_FILE"
    echo "   중지: launchctl unload $PLIST_FILE"
  fi
fi
echo ""

echo "================================================"
echo -e "${GREEN}✅ 설치 완료!${NC}"
echo "================================================"
echo ""
echo "📋 다음 단계:"
echo ""
echo "1️⃣  .env 파일 수정:"
echo "   nano .env"
echo ""
echo "2️⃣  백엔드 시작:"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "   sudo systemctl start elspa-backend"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "   launchctl load ~/Library/LaunchAgents/com.elspa.backend.plist"
else
  echo "   source venv/bin/activate && python main.py"
fi
echo ""
echo "3️⃣  상태 확인:"
echo "   curl http://localhost:8000/health"
echo ""
echo "4️⃣  로그 확인:"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "   sudo journalctl -u elspa-backend -f"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "   tail -f /tmp/elspa-backend.out.log"
fi
echo ""
echo "🚀 서버 시작: http://localhost:8000"
echo "📚 API 문서: http://localhost:8000/docs"
echo ""
