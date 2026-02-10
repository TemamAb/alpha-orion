@echo off
REM ================================================================
REM START DASHBOARD SERVER (Port 8888)
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         🚀 ALPHA-ORION DASHBOARD - START NOW 🚀                ║
echo ║                                                                ║
echo ║              Dashboard Server on Port 8888                     ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 📁 Working Directory: %cd%
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where python3 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ ERROR: Python NOT found
        echo Please install from: https://www.python.org/
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)

echo ✅ Python: Ready
%PYTHON_CMD% --version
echo.

REM Check dashboard file exists
if not exist "LIVE_PROFIT_DASHBOARD.html" (
    echo ❌ ERROR: LIVE_PROFIT_DASHBOARD.html not found
    pause
    exit /b 1
)

echo ✅ Dashboard file found: LIVE_PROFIT_DASHBOARD.html
echo.

echo ═══════════════════════════════════════════════════════════════════
echo ✅ STARTING DASHBOARD SERVER
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 🌐 DASHBOARD: http://localhost:8888
echo 🔌 PORT: 8888
echo 📊 Status: LIVE PROFIT MONITORING
echo.
echo ⏳ Starting server...
echo.

REM Start dashboard server
%PYTHON_CMD% serve-live-dashboard.py

pause
