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
echo 🤖 PILOT SESSION STARTED: %DATE% %TIME% > pilot_logs.txt
echo ========================================== >> pilot_logs.txt

REM 2. Check Environment
if not exist "backend-services\services\user-api-service\package.json" (
    echo [ERROR] Cannot find backend service directory! >> pilot_logs.txt
    echo ❌ ERROR: Wrong directory. Run from project root.
    pause
    exit /b
)

REM 2.1 Check Dependencies
echo [%TIME%] 📦 Verifying dependencies...
echo [%TIME%] 📦 Verifying dependencies... >> pilot_logs.txt
cmd /c "cd backend-services\services\user-api-service && npm install"

REM 3. Start Backend Service (Background)
echo [%TIME%] 🚀 Starting User API Service (Port 8080)...
echo [%TIME%] 🚀 Starting User API Service... >> pilot_logs.txt
start /B cmd /c "cd backend-services\services\user-api-service && npm start >> ..\..\..\pilot_logs.txt 2>&1"

REM 4. Start Dashboard (Background)
echo [%TIME%] 📊 Starting Dashboard Server...
echo [%TIME%] 📊 Starting Dashboard Server... >> pilot_logs.txt
start /B cmd /c "python serve-live-dashboard.py >> pilot_logs.txt 2>&1"

echo.
echo ✅ PILOT RUNNING. Monitoring 'pilot_logs.txt' for AI analysis.
echo.
echo 📍 Log File: %CD%\pilot_logs.txt
echo 📝 To view logs live:  Get-Content pilot_logs.txt -Wait  (PowerShell)
echo 🛑 To stop: Close this window (Ctrl+C will not kill background processes)
echo.
pause