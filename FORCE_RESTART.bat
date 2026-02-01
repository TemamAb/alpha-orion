@echo off
title ☢️ ALPHA-ORION NUCLEAR RESET
color 0C

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           ☢️  ALPHA-ORION NUCLEAR RESET  ☢️                    ║
echo ║                                                                ║
echo ║     Action: Wipe node_modules & Reinstall Dependencies         ║
echo ║     Target: backend-services/services/user-api-service         ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set API_DIR=%~dp0backend-services\services\user-api-service

echo 🛑 Killing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo 🗑️  Deleting node_modules (This may take a moment)...
if exist "%API_DIR%\node_modules" (
    rmdir /s /q "%API_DIR%\node_modules"
    echo    ✅ node_modules deleted.
) else (
    echo    ℹ️  node_modules not found.
)

echo 🗑️  Deleting package-lock.json...
if exist "%API_DIR%\package-lock.json" del "%API_DIR%\package-lock.json"

echo 📦 Reinstalling dependencies...
cd /d "%API_DIR%"
call npm install

echo.
echo ✅ RESET COMPLETE. You may now run 'continuous_pilot.bat'.
pause