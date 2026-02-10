@echo off
REM ================================================================
REM Quick Dashboard Server Restart
REM ================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          🚀 RESTARTING DASHBOARD SERVER 🚀                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Kill any existing process on port 9090
echo 🔍 Checking for process on port 9090...
netstat -ano | findstr :9090 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Found process on port 9090, killing it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9090') do (
        taskkill /PID %%a /F >nul 2>nul
        echo ✅ Killed PID %%a
    )
    timeout /t 2 /nobreak
)

echo.
echo 📡 Starting Dashboard Server on port 9090...
echo.

REM Check for Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where python3 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ ERROR: Python not found
        echo.
        echo Install from: https://www.python.org/
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)

echo ✅ Using: %PYTHON_CMD%
echo.

REM Start dashboard server
%PYTHON_CMD% serve-live-dashboard.py

pause
