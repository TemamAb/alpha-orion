@echo off
echo 🐳 Testing Docker Build for User API Service...
echo ==============================================

cd backend-services\services\user-api-service

echo Building image using src\Dockerfile...
docker build -f src\Dockerfile -t alpha-orion-user-api:test .

if %errorlevel% neq 0 (
    echo ❌ Build Failed! Please check the logs above.
    cd ..\..\..
    exit /b %errorlevel%
)

echo ✅ Build Successful! The Dockerfile is valid and optimized.
echo 🧹 Cleaning up test image...
docker rmi alpha-orion-user-api:test
cd ..\..\..
echo ==============================================
echo 🚀 Ready for Cloud Deployment
pause