@echo off
REM ============================================================
REM 🚀 ElSpa 자동 서버 시작 배치 파일 (Windows)
REM ============================================================
REM 기존 서버 종료 후 프론트엔드 + 백엔드 동시 실행
REM 사용: start.bat 또는 더블클릭
REM ============================================================

setlocal enabledelayedexpansion
chcp 65001 > /dev/null

REM 색상 설정 (Windows 10 이상)
for /F %%A in ('copy /Z "%~f0" nul') do set "BS=%%A"

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

cd /d "%~dp0"
set PROJECT_ROOT=%cd%

echo.
echo ============================================================
echo 🔴 Step 1: 기존 서버 프로세스 종료
echo ============================================================

REM 포트 3000 종료 (프론트엔드)
echo %BLUE%ℹ️  포트 3000 프로세스 확인 중...%RESET%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do (
    echo %BLUE%ℹ️  포트 3000 프로세스 종료 중 (PID: %%a)...%RESET%
    taskkill /PID %%a /F >/dev/null 2>&1
)
timeout /t 1 /nobreak >/dev/null

REM 포트 8000 종료 (백엔드)
echo %BLUE%ℹ️  포트 8000 프로세스 확인 중...%RESET%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    echo %BLUE%ℹ️  포트 8000 프로세스 종료 중 (PID: %%a)...%RESET%
    taskkill /PID %%a /F >/dev/null 2>&1
)
timeout /t 1 /nobreak >/dev/null

echo %GREEN%✅ 기존 프로세스 정리 완료%RESET%

echo.
echo ============================================================
echo 🚀 Step 2: 환경 설정 확인
echo ============================================================

if not exist "%PROJECT_ROOT%\.env" (
    echo %RED%❌ .env 파일이 없습니다%RESET%
    echo %BLUE%ℹ️  먼저 setup.sh를 실행해주세요%RESET%
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\venv" (
    echo %RED%❌ Python 가상 환경이 없습니다%RESET%
    echo %BLUE%ℹ️  먼저 setup.sh를 실행해주세요%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ 환경 설정 확인 완료%RESET%

echo.
echo ============================================================
echo ⚙️  Step 3: 백엔드 (FastAPI) 시작
echo ============================================================

if not exist "%PROJECT_ROOT%\logs" mkdir "%PROJECT_ROOT%\logs"
set BACKEND_LOG=%PROJECT_ROOT%\logs\backend.log

echo %BLUE%ℹ️  백엔드 시작 중 (포트 8000)...%RESET%
echo %BLUE%ℹ️  로그 파일: %BACKEND_LOG%%RESET%

REM 가상 환경 활성화 후 백엔드 시작
call "%PROJECT_ROOT%\venv\Scripts\activate.bat"
start "ElSpa Backend" cmd /k "cd /d %PROJECT_ROOT% && python main.py > %BACKEND_LOG% 2>&1"

REM 백엔드 시작 대기
timeout /t 3 /nobreak >/dev/null
echo %GREEN%✅ 백엔드 시작 완료%RESET%

echo.
echo ============================================================
echo 🎨 Step 4: 프론트엔드 (Next.js) 시작
echo ============================================================

set FRONTEND_LOG=%PROJECT_ROOT%\logs\frontend.log
echo %BLUE%ℹ️  프론트엔드 시작 중 (포트 3000)...%RESET%
echo %BLUE%ℹ️  로그 파일: %FRONTEND_LOG%%RESET%

cd /d "%PROJECT_ROOT%\frontend"
start "ElSpa Frontend" cmd /k "npm run dev > %FRONTEND_LOG% 2>&1"

REM 프론트엔드 시작 대기
timeout /t 5 /nobreak >/dev/null
echo %GREEN%✅ 프론트엔드 시작 완료%RESET%

echo.
echo ============================================================
echo ✅ 모든 서버가 실행 중입니다!
echo ============================================================
echo.
echo 📱 접속:
echo    • Frontend: http://localhost:3000
echo    • Backend:  http://localhost:8000
echo    • API Docs: http://localhost:8000/docs
echo.
echo 📝 로그:
echo    • Backend:  %BACKEND_LOG%
echo    • Frontend: %FRONTEND_LOG%
echo.
echo 🛑 종료:
echo    • stop.bat 실행
echo    • 또는 각 창의 X 버튼 클릭
echo.
echo ============================================================

REM 이 창 유지
pause
