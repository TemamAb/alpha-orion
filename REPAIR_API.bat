@echo off
title 🔧 ALPHA-ORION API REPAIR TOOL
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           🔧 ALPHA-ORION API REPAIR TOOL 🔧                    ║
echo ║                                                                ║
echo ║     Target: Port 8080 (Node.js Backend)                        ║
echo ║     Action: Kill Process & Restart Service                     ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 🔍 Checking Port 8080...

REM Kill any existing process on port 8080
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo ⚠️  Killing process on PID %%a...
    taskkill /F /PID %%a >nul 2>nul
    set FOUND=1
)

if %FOUND% EQU 0 (
    echo    Port 8080 was already free.
) else (
    echo    Port 8080 cleared.
)

echo.
echo 🚀 Restarting Node.js API Service...
echo.

if exist "backend-services\services\user-api-service" (
    start "Alpha-Orion Production API" cmd /k "cd /d %SCRIPT_DIR%backend-services\services\user-api-service && npm start"
    echo ✅ Service restart command issued.
    echo.
    echo    Please check the new terminal window for "PRODUCTION API RUNNING".
    echo    Your dashboard sidebars should recover shortly.
) else (
    echo ❌ ERROR: Could not find service directory.
    echo    Expected: backend-services\services\user-api-service
)

echo.
echo Press any key to exit...
pause >nul