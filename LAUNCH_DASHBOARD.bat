@echo off
SETLOCAL
TITLE Alpha-Orion Mission Control Launcher

ECHO ===================================================
ECHO 🚀 ALPHA-ORION MISSION CONTROL LAUNCHER
ECHO ===================================================

REM Check for Node.js
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ Node.js not found. Please install Node.js.
    PAUSE
    EXIT /B 1
)

REM Check for Python
WHERE python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ Python not found. Please install Python.
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO 1. Starting Backend Service (Port 8080)...
CD backend-services\services\user-api-service
IF NOT EXIST node_modules (
    ECHO    Installing dependencies...
    call npm install
)
START "Alpha-Orion Backend" cmd /k "npm start"
CD ..\..\..

ECHO.
ECHO 2. Starting Dashboard Server...
START "Alpha-Orion Dashboard" cmd /k "python serve-live-dashboard.py"

ECHO.
ECHO ✅ System Launching...
ECHO    - Backend: http://localhost:8080
ECHO    - Dashboard: http://localhost:8888 (Browser will open automatically)
ECHO.
ECHO Press any key to close this launcher (Servers will keep running)...
PAUSE >nul