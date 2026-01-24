@echo off
REM ================================================================
REM QUICK START - Production API Only (Port 8080)
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         🚀 ALPHA-ORION PRODUCTION API - QUICK START 🚀         ║
echo ║                                                                ║
echo ║            Starting Real Profit Generation System              ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 📁 Working Directory: %cd%
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js NOT found
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js: Ready
node --version
echo.

REM Change to API directory
echo 📂 Navigating to production API...
cd /d "%SCRIPT_DIR%backend-services\services\user-api-service"

if not exist "package.json" (
    echo ❌ ERROR: package.json not found in:
    echo %cd%
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies (first run)...
    call npm install
    echo.
)

echo ═══════════════════════════════════════════════════════════════════
echo ✅ STARTING PRODUCTION API
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 🔌 PORT: 8080
echo 🌐 API: http://localhost:8080
echo 📊 Endpoints:
echo    - GET  http://localhost:8080/health
echo    - GET  http://localhost:8080/analytics/total-pnl
echo    - GET  http://localhost:8080/mode/current
echo    - GET  http://localhost:8080/pimlico/status
echo.
echo ⏳ Starting service...
echo.

REM Start the service
npm start

pause
