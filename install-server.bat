@echo off
REM ============================================================
REM ElSpa 백엔드 서버 설치 프로그램 (Windows)
REM 목적: FastAPI 백엔드를 서버에 설치 및 자동 실행
REM 사용법: install-server.bat
REM ============================================================

setlocal enabledelayedexpansion
color 0A

echo ================================================
echo 🚀 ElSpa 백엔드 서버 설치 프로그램 (Windows)
echo ================================================
echo.

REM 1. Python 설치 확인
echo [1/6] Python 설치 확인...
python --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Python 3이 설치되어 있지 않습니다.
  echo 설치: https://www.python.org/downloads/
  echo PATH에 Python을 추가해야 합니다.
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION% 설치됨
echo.

REM 2. 가상 환경 생성
echo [2/6] 가상 환경 생성...
if not exist "venv" (
  python -m venv venv
  echo ✅ 가상 환경 생성 완료
) else (
  echo ✅ 가상 환경이 이미 존재합니다
)
echo.

REM 3. 가상 환경 활성화
echo [3/6] 가상 환경 활성화...
call venv\Scripts\activate.bat
echo ✅ 가상 환경 활성화 완료
echo.

REM 4. 의존성 설치
echo [4/6] 패키지 의존성 설치...
pip install --upgrade pip
pip install -r requirements.txt
echo ✅ 의존성 설치 완료
echo.

REM 5. 환경 변수 설정
echo [5/6] 환경 변수 설정...
if not exist ".env" (
  (
    echo # ============================================================
    echo # ElSpa 백엔드 환경 설정
    echo # ============================================================
    echo.
    echo # 데이터베이스
    echo DATABASE_URL=postgresql://user:password@localhost:5432/elspa
    echo.
    echo # Supabase
    echo SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
    echo SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    echo.
    echo # Google OAuth
    echo GOOGLE_CLIENT_ID=104694066545-vtgespl9ho6b4gmcolgdrpuloankttgq.apps.googleusercontent.com
    echo GOOGLE_CLIENT_SECRET=your_secret_here
    echo.
    echo # 서버 설정
    echo HOST=0.0.0.0
    echo PORT=8000
    echo ENVIRONMENT=production
  ) > .env
  echo ⚠️  .env 파일 생성됨. 메모장에서 설정을 수정하세요!
  echo    start notepad .env
) else (
  echo ✅ .env 파일이 이미 존재합니다
)
echo.

REM 6. Windows 서비스 설정 (선택사항)
echo [6/6] 자동 실행 설정...
echo.
echo 다음 옵션 중 하나를 선택하세요:
echo.
echo 1. 작업 스케줄러에서 시작 시 자동 실행
echo 2. Windows 서비스로 등록 (관리자 권한 필요)
echo 3. 건너뛰기
echo.
set /p CHOICE="선택 (1-3): "

if "%CHOICE%"=="1" (
  REM 작업 스케줄러 설정
  echo 작업 스케줄러 설정:
  echo 1. Windows + R 입력
  echo 2. taskschd.msc 실행
  echo 3. 기본 작업 만들기
  echo 4. 트리거: "시스템 시작 시"
  echo 5. 작업: "프로그램 시작"
  echo 6. 프로그램: %CD%\venv\Scripts\python.exe
  echo 7. 인수: main.py
  pause
)

if "%CHOICE%"=="2" (
  echo ⚠️  관리자 권한이 필요합니다.
  echo.
  echo NSSM (Non-Sucking Service Manager) 사용:
  echo 1. nssm.cc/download 에서 NSSM 다운로드
  echo 2. nssm install ElSpaBackend "%CD%\venv\Scripts\python.exe" "main.py"
  echo 3. net start ElSpaBackend
  echo.
  pause
)

echo.
echo ================================================
echo ✅ 설치 완료!
echo ================================================
echo.
echo 📋 다음 단계:
echo.
echo 1️⃣  .env 파일 수정:
echo    notepad .env
echo.
echo 2️⃣  백엔드 시작:
echo    venv\Scripts\activate.bat
echo    python main.py
echo.
echo 3️⃣  상태 확인:
echo    http://localhost:8000/health
echo.
echo 4️⃣  API 문서:
echo    http://localhost:8000/docs
echo.
pause
