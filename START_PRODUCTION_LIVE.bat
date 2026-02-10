@echo off
REM Alpha-Orion Production Startup with Live Monitoring
REM This script starts the service and begins real-time profit monitoring

cls
echo.
echo ╔════════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                                ║
echo ║          🚀 ALPHA-ORION PRODUCTION PROFIT GENERATION - LIVE MODE 🚀            ║
echo ║                                                                                ║
echo ║              PIMLICO GASLESS + POLYGON ZKEVM + REAL PROFIT                    ║
echo ║                        Monitor and Report System                              ║
echo ║                                                                                ║
echo ╚════════════════════════════════════════════════════════════════════════════════╝
echo.

REM Set environment variables
set PIMLICO_API_KEY=pim_TDJjCjeAJdArjep3usKXTu
set PORT=8080
set DEPLOY_MODE=production
set NODE_ENV=production

echo 🔧 Configuration:
echo   PIMLICO_API_KEY: ***%PIMLICO_API_KEY:~-10%
echo   PORT: %PORT%
echo   MODE: %DEPLOY_MODE%
echo   NETWORK: Polygon zkEVM
echo.

cd /d "c:\Users\op\Desktop\oreon\backend-services\services\user-api-service"

echo ⏳ Starting Production Service...
echo.

REM Start the service
npm start
