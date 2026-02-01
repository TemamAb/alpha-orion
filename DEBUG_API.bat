@echo off
title 🐞 ALPHA-ORION API DEBUGGER
color 0E
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           🐞 ALPHA-ORION API DEBUGGER 🐞                       ║
echo ║                                                                ║
echo ║     Action: Run API manually to see hidden errors              ║
echo ║     Target: backend-services/services/user-api-service         ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set API_DIR=%~dp0backend-services\services\user-api-service

echo 🛑 Killing existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 🚀 Starting API manually...
echo    Watch for errors below!
echo.

cd /d "%API_DIR%"
npm start

echo.
echo ⚠️  API Process exited.
pause