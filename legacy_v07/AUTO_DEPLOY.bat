@echo off
REM ================================================================
REM Alpha-Orion Auto-Deploy on Free Port
REM ================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     🚀 ALPHA-ORION AUTO-DEPLOY (Free Port Detection) 🚀        ║
echo ║                                                                ║
echo ║     System will auto-detect free port and deploy               ║
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
echo 🚀 AUTO-DEPLOYING ALPHA-ORION
echo ═══════════════════════════════════════════════════════════════════
echo.

REM Launch Terminal 1: Production API Service
echo 📡 Terminal 1: Starting Production API Service (Port 8080)...
echo.

REM Kill any existing process on port 8080 to prevent conflicts
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo ⚠️  Clearing port 8080 [PID: %%a]...
    taskkill /F /PID %%a >nul 2>nul
)
echo.

start "Alpha-Orion Production API" cmd /k "cd /d %SCRIPT_DIR%backend-services\services\user-api-service && npm start"

timeout /t 3 /nobreak
echo.

REM Launch Terminal 2: Dashboard Server (with auto-port detection)
echo 🎨 Terminal 2: Starting Dashboard Server (Auto-Detecting Free Port)...
echo.
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

timeout /t 5 /nobreak
echo.

REM Open Dashboard in Default Browser (try to detect port)
echo 🌐 Opening Dashboard in browser...
echo.

REM Check if port file was created
if exist "dashboard_port.txt" (
    set /p DETECTED_PORT=<dashboard_port.txt
    echo ✅ Dashboard detected on port: !DETECTED_PORT!
    timeout /t 2 /nobreak
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:!DETECTED_PORT!"
    ) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
        start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:!DETECTED_PORT!"
    ) else (
        start http://localhost:!DETECTED_PORT!
    )
) else (
    echo ⏳ Dashboard starting up, trying default port 9090...
    timeout /t 2 /nobreak
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:9090"
    ) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
        start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:9090"
    ) else (
        start http://localhost:9090
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo ✅ SYSTEM DEPLOYED - AUTO-DETECTED PORT
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 📊 Production Service:
echo    • Terminal 1: API Server (Port 8080)
echo    • Real Pimlico Integration
echo    • Live Profit Generation
echo.
echo 🎨 Dashboard Server:
echo    • Terminal 2: Web Dashboard
echo    • Auto-Detected Free Port
echo    • Browser: Opening now...
echo.
echo 📈 Features Active:
echo    • Profit Generation: LIVE
echo    • Real-Time Monitoring: ON
echo    • Auto-Withdrawal: $1,000 threshold
echo    • Manual Withdrawal: Available
echo    • BOOM Celebration: Ready
echo.
echo 📝 Files:
echo    • Dashboard: LIVE_PROFIT_DASHBOARD.html
echo    • Server: serve-live-dashboard.py
echo    • Port Info: dashboard_port.txt
echo.
echo 💡 Next Steps:
echo    1. Wait for Terminal 1 to show: "PRODUCTION API RUNNING"
echo    2. Wait for Terminal 2 to show: "READY"
echo    3. Dashboard should open automatically
echo    4. Set up auto-withdrawal with your wallet address
echo    5. Watch for 🚀 PROFIT DROPPED every 30 seconds
echo.
echo ⏸️  To stop: Close terminal windows or press Ctrl+C
echo.
echo 📚 For details, see:
echo    • START_AND_WATCH_PROFITS.md
echo    • REAL_TIME_PROFIT_DROPS.md
echo    • WITHDRAWAL_SYSTEM_GUIDE.md
echo.
echo ═══════════════════════════════════════════════════════════════════
echo.

REM Keep main window open
pause

endlocal
