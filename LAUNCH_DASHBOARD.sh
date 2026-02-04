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

# Dynamic port detection
echo "Checking for free ports..."
BACKEND_PORT=8080
if python3 -c "import socket; s=socket.socket(); s.settimeout(1); print(s.connect_ex(('localhost', $BACKEND_PORT)) != 0)" | grep -q "False"; then
    echo "❌ Port $BACKEND_PORT is occupied. Finding free port..."
    BACKEND_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1])")
    echo "✅ Using free port: $BACKEND_PORT"
else
    echo "✅ Port $BACKEND_PORT is free."
fi

DASHBOARD_PORT=8888
if python3 -c "import socket; s=socket.socket(); s.settimeout(1); print(s.connect_ex(('localhost', $DASHBOARD_PORT)) != 0)" | grep -q "False"; then
    echo "❌ Port $DASHBOARD_PORT is occupied. Finding free port..."
    DASHBOARD_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1])")
    echo "✅ Using free port: $DASHBOARD_PORT"
else
    echo "✅ Port $DASHBOARD_PORT is free."
fi

echo "1. Starting Backend Service (Port $BACKEND_PORT)..."
cd backend-services/services/user-api-service
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi
PORT=$BACKEND_PORT npm start &
BACKEND_PID=$!
cd ../../..

echo ""
echo "2. Starting Dashboard Server (Port $DASHBOARD_PORT)..."
python3 serve-live-dashboard.py $DASHBOARD_PORT &
DASHBOARD_PID=$!

echo ""
echo "✅ System Launching..."
echo "   - Backend PID: $BACKEND_PID"
echo "   - Dashboard PID: $DASHBOARD_PID"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $DASHBOARD_PID; exit" INT
wait