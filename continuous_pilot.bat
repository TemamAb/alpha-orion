@echo off
title 🤖 ALPHA-ORION PILOT MODE
chcp 65001 >NUL
color 0A

echo.
echo 🚀 LAUNCHING GEMINI AUTONOMOUS PILOT ENGINE...
echo.

python gemini_auto_pilot.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Python script failed to run.
    echo Please ensure Python is installed and in your PATH.
    pause
)