@echo off
REM ============================================================
REM ElSpa 백엔드 서버 설치 프로그램 (Windows)
REM 목적: FastAPI + Google Sheets 자동 저장
REM 사용법: install-server.bat
REM ============================================================

setlocal enabledelayedexpansion
color 0A

echo ================================================
echo 🚀 ElSpa 백엔드 서버 설치 프로그램 (Windows)
echo ================================================
echo.

REM 1. Python 확인
echo [1/5] Python 설치 확인...
python --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Python 3이 설치되어 있지 않습니다.
  echo 설치: https://www.python.org/downloads/
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION% 설치됨
echo.

REM 2. 가상 환경 생성
echo [2/5] 가상 환경 생성...
if not exist "venv" (
  python -m venv venv
  echo ✅ 가상 환경 생성 완료
) else (
  echo ✅ 가상 환경이 이미 존재합니다
)
echo.

REM 3. 의존성 설치
echo [3/5] 패키지 의존성 설치...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
echo ✅ 의존성 설치 완료
echo.

REM 4. .env 파일 생성
echo [4/5] 환경 변수 설정...
if not exist ".env" (
  (
    echo # ElSpa 백엔드 환경 설정
    echo.
    echo DATABASE_URL=postgresql://user:password@localhost:5432/elspa
    echo.
    echo SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
    echo SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    echo.
    echo GOOGLE_CLIENT_ID=104694066545-vtgespl9ho6b4gmcolgdrpuloankttgq.apps.googleusercontent.com
    echo GOOGLE_CLIENT_SECRET=your_secret_here
    echo.
    echo HOST=0.0.0.0
    echo PORT=8000
    echo ENVIRONMENT=production
  ) > .env
  echo ⚠️  .env 파일 생성됨. 메모장에서 설정을 수정하세요!
  notepad .env
) else (
  echo ✅ .env 파일이 이미 존재합니다
)
echo.

REM 5. 안내
echo [5/5] 설치 안내...
echo.
echo ================================================
echo ✅ 설치 완료!
echo ================================================
echo.
echo 📋 다음 단계:
echo.
echo 1️⃣  백엔드 시작:
echo    venv\Scripts\activate.bat
echo    python main.py
echo.
echo 2️⃣  Google OAuth 설정 (필수):
echo    https://console.cloud.google.com/
echo    - 새 프로젝트: ElSpa
echo    - OAuth 2.0 클라이언트 ID 생성
echo    - 리다이렉트: http://localhost:8000/auth/google/callback
echo    - .env에 ID/SECRET 입력
echo.
echo 3️⃣  상태 확인:
echo    http://localhost:8000/health
echo.
echo 🚀 서버: http://localhost:8000
echo 📚 API: http://localhost:8000/docs
echo.
pause
