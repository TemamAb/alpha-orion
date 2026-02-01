@echo off
title 🤖 ALPHA-ORION PILOT MODE
chcp 65001 >NUL
color 0A

echo ===================================================
echo   GEMINI AI ASSIST - CONTINUOUS PILOT ENGAGED
echo ===================================================
echo.

REM 1. Prepare Logs
echo [%TIME%] 🧹 Clearing previous logs...
echo 🤖 PILOT SESSION STARTED: %DATE% %TIME% > pilot_logs_system.txt
echo ========================================== >> pilot_logs_system.txt
type NUL > pilot_logs_api.txt
type NUL > pilot_logs_dashboard.txt

REM 2. Check Environment
if not exist "backend-services\services\user-api-service\package.json" (
    echo [ERROR] Cannot find backend service directory! >> pilot_logs.txt
    echo [ERROR] Cannot find backend service directory! >> pilot_logs_system.txt
    echo ❌ ERROR: Wrong directory. Run from project root.
    pause
    exit /b
)

REM 2.1 Check Dependencies
echo [%TIME%] 📦 Verifying dependencies...
echo [%TIME%] 📦 Verifying dependencies... >> pilot_logs_system.txt
cmd /c "cd backend-services\services\user-api-service && npm install"
IF %ERRORLEVEL% NEQ 0 (
    echo [%TIME%] ❌ npm install failed! >> pilot_logs_system.txt
    echo ❌ ERROR: npm install failed. See pilot_logs.txt.
    echo ❌ ERROR: npm install failed. See pilot_logs_system.txt.
    pause
    exit /b
)

REM 3. Start Backend Service (Background)
echo [%TIME%] 🚀 Starting User API Service (Port 8080)...
echo [%TIME%] 🚀 Starting User API Service... >> pilot_logs_system.txt
start /B cmd /c "cd backend-services\services\user-api-service && npm start > ..\..\..\pilot_logs_api.txt 2>&1"

REM 4. Start Dashboard (Background)
echo [%TIME%] 📊 Starting Dashboard Server...
echo [%TIME%] 📊 Starting Dashboard Server... >> pilot_logs_system.txt
start /B cmd /c "python serve-live-dashboard.py > pilot_logs_dashboard.txt 2>&1"

echo.
echo ✅ PILOT RUNNING. Monitoring logs for AI analysis.
echo.
echo 📍 System Log: %CD%\pilot_logs_system.txt
echo 📍 API Log:    %CD%\pilot_logs_api.txt
echo 📍 Dash Log:   %CD%\pilot_logs_dashboard.txt
echo.
echo 📝 To view API logs:   Get-Content pilot_logs_api.txt -Wait
echo 🛑 To stop: Close this window (Ctrl+C will not kill background processes)
echo.
pause