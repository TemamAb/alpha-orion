#!/bin/bash

# ================================================================
# Alpha-Orion LIVE Profit Dashboard Launcher (macOS/Linux)
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 ALPHA-ORION LIVE PROFIT DASHBOARD LAUNCHER 🚀            ║"
echo "║                                                                ║"
echo "║     Starting Production Service + Dashboard Server             ║"
echo "║     Mode: PRODUCTION - NO SIMULATION, NO MOCKS                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📁 Working Directory: $(pwd)"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo ""
    echo "Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check Python
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "✅ Python found: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "✅ Python found: $(python --version)"
else
    echo "❌ ERROR: Python is not installed"
    echo ""
    echo "Install from: https://www.python.org/"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Install npm dependencies if needed
if [ ! -d "backend-services/services/user-api-service/node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    echo ""
    cd backend-services/services/user-api-service
    npm install
    cd "$SCRIPT_DIR"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 LAUNCHING SYSTEM"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Launch Terminal 1: Production API Service
echo "📡 Starting Production API Service (Port 8080)..."
echo ""

cd "$SCRIPT_DIR/backend-services/services/user-api-service"

# Use different approach for macOS vs Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use open command
    open -a Terminal "$(pwd)/../../../../../../LAUNCH_DASHBOARD_TERMINAL1.sh"
else
    # Linux - use gnome-terminal or xterm
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$(pwd)' && npm start; bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$(pwd)' && npm start" &
    else
        # Fallback: run in background
        npm start &
    fi
fi

sleep 3
echo ""

# Launch Terminal 2: Dashboard Server
echo "🎨 Starting Dashboard Server (Port 9090)..."
echo ""

cd "$SCRIPT_DIR"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open -a Terminal "$(pwd)/LAUNCH_DASHBOARD_TERMINAL2.sh"
else
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$(pwd)' && $PYTHON_CMD serve-live-dashboard.py; bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$(pwd)' && $PYTHON_CMD serve-live-dashboard.py" &
    else
        # Fallback
        $PYTHON_CMD serve-live-dashboard.py &
    fi
fi

sleep 3
echo ""

# Open Dashboard in Default Browser
echo "🌐 Opening Dashboard in browser..."
echo ""

sleep 2

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:9090"
else
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:9090"
    elif command -v firefox &> /dev/null; then
        firefox "http://localhost:9090" &
    elif command -v chromium &> /dev/null; then
        chromium "http://localhost:9090" &
    elif command -v google-chrome &> /dev/null; then
        google-chrome "http://localhost:9090" &
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ SYSTEM LAUNCHED"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Dashboard Terminals:"
echo "   • Terminal 1: Production API (Port 8080)"
echo "   • Terminal 2: Dashboard Server (Port 9090)"
echo ""
echo "🌐 Browser:"
echo "   • Dashboard: http://localhost:9090"
echo ""
echo "📝 Files:"
echo "   • Dashboard: LIVE_PROFIT_DASHBOARD.html"
echo "   • Server: serve-live-dashboard.py"
echo "   • Startup: START_LIVE_PROFIT_DASHBOARD.md"
echo ""
echo "💡 Next Steps:"
echo "   1. Watch Terminal 1 for profit generation logs"
echo "   2. Monitor Terminal 2 for dashboard server logs"
echo "   3. Refresh browser if needed (Cmd+R or F5)"
echo "   4. Check profit metrics in real-time"
echo ""
echo "⏸️  To stop: Close terminal windows or press Ctrl+C"
echo ""
echo "📚 For help, see: START_LIVE_PROFIT_DASHBOARD.md"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Keep script running
wait
