@echo off
REM ================================================================
REM Alpha-Orion LIVE Profit Dashboard Launcher
REM ================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     🚀 ALPHA-ORION LIVE PROFIT DASHBOARD LAUNCHER 🚀            ║
echo ║                                                                ║
echo ║     Starting Production Service + Dashboard Server             ║
echo ║     Mode: PRODUCTION - NO SIMULATION, NO MOCKS                 ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 📁 Working Directory: %cd%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Check if Python is installed
where python >nul 2>nul
set PYTHON_FOUND=0
if %ERRORLEVEL% EQU 0 (
    set PYTHON_FOUND=1
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
)

if %PYTHON_FOUND% EQU 0 (
    where python3 >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        set PYTHON_FOUND=1
        for /f "tokens=*" %%i in ('python3 --version 2^>^&1') do set PYTHON_VERSION=%%i
    )
)

echo ✅ Python found: %PYTHON_VERSION%
echo.

echo ═══════════════════════════════════════════════════════════════════
echo.

REM Check if npm dependencies are installed
if not exist "backend-services\services\user-api-service\node_modules" (
    echo 📦 Installing npm dependencies...
    echo.
    cd backend-services\services\user-api-service
    call npm install
    cd %SCRIPT_DIR%
    echo.
)

echo ═══════════════════════════════════════════════════════════════════
echo 🚀 LAUNCHING SYSTEM
echo ═══════════════════════════════════════════════════════════════════
echo.

REM Launch Terminal 1: Production API Service
echo 📡 Terminal 1: Starting Production API Service (Port 8080)...
echo.

start "Alpha-Orion Production API" cmd /k "cd /d %SCRIPT_DIR%backend-services\services\user-api-service && npm start"

timeout /t 3 /nobreak
echo.

REM Launch Terminal 2: Dashboard Server
echo 🎨 Terminal 2: Starting Dashboard Server (Port 9090)...
echo.

if %PYTHON_FOUND% EQU 1 (
    start "Alpha-Orion Dashboard Server" cmd /k "cd /d %SCRIPT_DIR% && python serve-live-dashboard.py"
) else (
    echo ❌ ERROR: Python not found - cannot start dashboard server
    echo.
    echo Please install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
)

timeout /t 3 /nobreak
echo.

REM Open Dashboard in Default Browser
echo 🌐 Opening Dashboard in browser...
echo.

timeout /t 2 /nobreak

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:9090"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:9090"
) else (
    start http://localhost:9090
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo ✅ SYSTEM LAUNCHED
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 📊 Dashboard Terminals:
echo    • Terminal 1: Production API (Port 8080)
echo    • Terminal 2: Dashboard Server (Port 9090)
echo.
echo 🌐 Browser:
echo    • Dashboard: http://localhost:9090
echo.
echo 📝 Files:
echo    • Dashboard: LIVE_PROFIT_DASHBOARD.html
echo    • Server: serve-live-dashboard.py
echo    • Startup: START_LIVE_PROFIT_DASHBOARD.md
echo.
echo 💡 Next Steps:
echo    1. Watch Terminal 1 for profit generation logs
echo    2. Monitor Terminal 2 for dashboard server logs
echo    3. Refresh browser if needed (F5)
echo    4. Check profit metrics in real-time
echo.
echo ⏸️  To stop: Close terminal windows or press Ctrl+C
echo.
echo 📚 For help, see: START_LIVE_PROFIT_DASHBOARD.md
echo.
echo ═══════════════════════════════════════════════════════════════════
echo.

REM Keep main window open
pause

endlocal
