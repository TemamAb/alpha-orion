#!/bin/bash

# ============================================
# Alpha-Orion Production Startup Script
# ============================================

set -e

echo "🚀 Alpha-Orion Production Mode Startup"
echo "======================================="

# Check environment
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    echo "Please run: cp .env.production .env.local"
    echo "Then configure with your production values"
    exit 1
fi

# Load environment
export $(cat .env.local | grep -v '#' | xargs)

# Verify critical configuration
echo ""
echo "🔍 Verifying Configuration..."

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not configured"
    exit 1
fi

if [ -z "$ETHEREUM_RPC_URL" ]; then
    echo "❌ ETHEREUM_RPC_URL not configured"
    exit 1
fi

if [ "$DEPLOY_MODE" != "production" ]; then
    echo "❌ DEPLOY_MODE not set to 'production'"
    exit 1
fi

echo "✅ Private Key: Configured"
echo "✅ RPC Endpoint: Configured"
echo "✅ Deploy Mode: $DEPLOY_MODE"

# Test RPC connection
echo ""
echo "🌐 Testing Blockchain Connection..."
RPC_TEST=$(curl -s -X POST "$ETHEREUM_RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -q "result" && echo "✅" || echo "❌")

if [ "$RPC_TEST" != "✅" ]; then
    echo "❌ Failed to connect to RPC endpoint"
    exit 1
fi
echo "✅ RPC connection successful"

# Create necessary directories
mkdir -p logs data

# Start services in background
echo ""
echo "🔧 Starting Backend Services..."

# Terminal 1: User API Service
echo "[1/3] Starting User API Service (port 3001)..."
cd backend-services/services/user-api-service
npm install > /dev/null 2>&1 || true
DEPLOY_MODE=production npm start > ../../logs/user-api.log 2>&1 &
USER_API_PID=$!
cd ../../..
echo "✅ User API Service started (PID: $USER_API_PID)"

sleep 2

# Terminal 2: Withdrawal Service  
echo "[2/3] Starting Withdrawal Service (port 3008)..."
cd backend-services/services/withdrawal-service
npm install > /dev/null 2>&1 || true
DEPLOY_MODE=production npm start > ../../logs/withdrawal.log 2>&1 &
WITHDRAWAL_PID=$!
cd ../../..
echo "✅ Withdrawal Service started (PID: $WITHDRAWAL_PID)"

sleep 2

# Terminal 3: Frontend
echo "[3/3] Starting Frontend (port 3000)..."
cd frontend
npm install > /dev/null 2>&1 || true
REACT_APP_API_URL=http://localhost:3001 npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Health check
echo ""
echo "🏥 Checking Service Health..."

# Check User API
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo "✅ User API Service: HEALTHY"
else
    echo "❌ User API Service: FAILED"
    kill $USER_API_PID 2>/dev/null || true
    exit 1
fi

# Check Withdrawal Service
if curl -s http://localhost:3008/health | grep -q "ok"; then
    echo "✅ Withdrawal Service: HEALTHY"
else
    echo "❌ Withdrawal Service: FAILED"
    kill $WITHDRAWAL_PID 2>/dev/null || true
    exit 1
fi

# Get current mode
echo ""
echo "📊 Current Status:"
curl -s http://localhost:3001/mode/current | jq .

# Save PIDs for stopping
echo ""
echo "💾 Saving process information..."
cat > .pids << EOF
USER_API_PID=$USER_API_PID
WITHDRAWAL_PID=$WITHDRAWAL_PID
FRONTEND_PID=$FRONTEND_PID
EOF

echo ""
echo "🎉 Production Mode Started Successfully!"
echo "======================================="
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "💳 Withdrawals: http://localhost:3008"
echo ""
echo "🔐 PRODUCTION MODE - REAL MONEY AT RISK"
echo "⚠️  Monitor: tail -f logs/*.log"
echo ""
echo "To stop: ./stop-production.sh"
echo ""

# Keep script running and monitor logs
echo "📋 Monitoring services..."
tail -f logs/*.log &
wait
