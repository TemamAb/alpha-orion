#!/bin/bash
echo "==================================================="
echo "🚀 ALPHA-ORION MISSION CONTROL LAUNCHER"
echo "==================================================="

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found"
    exit 1
fi

echo ""
echo " Launching Integrated Dashboard System..."
echo "   (Deployment controls available in web interface)"
echo ""

echo "1. Starting Backend Service (Port 8080)..."
cd backend-services/services/user-api-service
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi
npm start &
BACKEND_PID=$!
cd ../../..

echo ""
echo "2. Starting Dashboard Server..."
python3 serve-live-dashboard.py &
DASHBOARD_PID=$!

echo ""
echo "✅ System Launching..."
echo "   - Backend PID: $BACKEND_PID"
echo "   - Dashboard PID: $DASHBOARD_PID"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $DASHBOARD_PID; exit" INT
wait