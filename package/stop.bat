@echo off
REM ============================================================
REM 🛑 ElSpa 서버 정지 배치 파일 (Windows)
REM ============================================================
REM 프론트엔드 + 백엔드 모두 종료
REM 사용: stop.bat 또는 더블클릭
REM ============================================================

chcp 65001 > /dev/null
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ============================================================
echo 🛑 ElSpa 서버 종료
echo ============================================================
echo.

set KILLED=0

REM 포트 3000 종료 (프론트엔드)
for /f "tokens=5" %%a in ('netstat -aon 2^>/dev/null ^| findstr ":3000 "') do (
    echo [94mℹ️  포트 3000 프로세스 종료 중 (PID: %%a)...[0m
    taskkill /PID %%a /F >/dev/null 2>&1
    echo [92m✅ 프론트엔드 (포트 3000) 종료 완료[0m
    set KILLED=1
)

timeout /t 1 /nobreak >/dev/null

REM 포트 8000 종료 (백엔드)
for /f "tokens=5" %%a in ('netstat -aon 2^>/dev/null ^| findstr ":8000 "') do (
    echo [94mℹ️  포트 8000 프로세스 종료 중 (PID: %%a)...[0m
    taskkill /PID %%a /F >/dev/null 2>&1
    echo [92m✅ 백엔드 (포트 8000) 종료 완료[0m
    set KILLED=1
)

if !KILLED! equ 0 (
    echo [94mℹ️  실행 중인 서버가 없습니다[0m
) else (
    echo.
    echo [92m✅ 모든 서버가 종료되었습니다[0m
)

echo.
echo 다시 시작하려면: start.bat
echo ============================================================
echo.
pause
