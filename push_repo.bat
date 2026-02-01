@echo off
echo 🚀 Alpha-Orion Git Push Automation
echo ========================================

IF NOT EXIST ".git" (
    echo 📦 Initializing Git...
    git init
    git branch -M main
)

echo 📁 Adding files...
git add .

echo 💾 Committing...
git commit -m "🤖 Gemini Pilot Protocol: Added Autonomous Monitoring & Continuous Fix Loop"
git commit -m "🐛 Fix: Resolved npm dependency errors & improved pilot stability"

for /f "tokens=*" %%i in ('git rev-parse HEAD') do set COMMIT_HASH=%%i

echo 🔗 Setting remote...
git remote remove origin 2>NUL
git remote add origin https://github.com/TemamAb/alpha-orion.git

echo 📤 Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Done!
echo 🔑 Commit Hash: %COMMIT_HASH%
pause