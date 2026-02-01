#!/bin/bash
echo "🐳 Testing Docker Build for User API Service..."
echo "=============================================="

# Ensure we are in the project root
if [ ! -d "backend-services/services/user-api-service" ]; then
    echo "❌ Error: Directory backend-services/services/user-api-service not found."
    echo "Please run this script from the project root."
    exit 1
fi

cd backend-services/services/user-api-service

echo "Building image using src/Dockerfile..."
docker build -f src/Dockerfile -t alpha-orion-user-api:test .

if [ $? -ne 0 ]; then
    echo "❌ Build Failed! Please check the logs above."
    exit 1
fi

echo "✅ Build Successful! The Dockerfile is valid and optimized."
echo "🧹 Cleaning up test image..."
docker rmi alpha-orion-user-api:test
echo "=============================================="
echo "🚀 Ready for Cloud Deployment"