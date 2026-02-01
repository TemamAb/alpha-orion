@echo off
echo 🚀 LAUNCHING ALPHA-ORION MISSION CONTROL
echo ========================================

REM Check for Bash (Git Bash)
set BASH_PATH=""

where bash >nul 2>&1
if %errorlevel% equ 0 (
    set BASH_PATH=bash
) else (
    if exist "C:\Program Files\Git\bin\bash.exe" (
        set BASH_PATH="C:\Program Files\Git\bin\bash.exe"
    )
)

if %BASH_PATH%=="" (
    echo ❌ Bash not found. Please install Git for Windows to run the deployment scripts.
    echo Download: https://git-scm.com/download/win
    pause
    exit /b 1
)

%BASH_PATH% mission-control-production.sh