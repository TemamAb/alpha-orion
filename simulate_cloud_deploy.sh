#!/bin/bash

# Configuration
SERVER_URL="http://localhost:8888"

echo "==================================================="
echo "🚀 ALPHA-ORION DEPLOYMENT SIMULATION"
echo "==================================================="
echo ""

# 1. Trigger Deployment
echo "[1/2] Triggering Cloud Deployment via API..."
echo "CMD: curl -X POST $SERVER_URL/api/deploy/cloud"
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/deploy/cloud")
echo "RESPONSE: $RESPONSE"
echo ""

if [[ $RESPONSE != *"started"* ]]; then
    echo "❌ Failed to trigger deployment. Is the server running?"
    echo "   (Make sure 'python serve-live-dashboard.py' is running)"
    exit 1
fi

echo "✅ Deployment started in background thread."
echo ""

# 2. Poll for Logs
echo "[2/2] Streaming Deployment Logs (Self-Healing Sequence)..."
echo "      (Polling API every 2 seconds)"
echo ""

# Poll loop to show log accumulation
for i in {1..10}; do
    # Clear screen for dashboard effect (optional, removed for log history)
    # echo -e "\033[2J\033[H" 
    
    echo "--- Status at $(date +%H:%M:%S) ---"
    
    # Fetch logs and format them using Python for readability
    curl -s "$SERVER_URL/api/deploy/logs" | python3 -c "
import sys, json
try:
    logs = json.load(sys.stdin)
    # Print only the last 5 logs to simulate a tail
    for entry in logs[-5:]:
        print(f'[{entry.get(\"timestamp\", \"?\")}] {entry.get(\"level\", \"INFO\")}: {entry.get(\"message\", \"\")}')
except:
    pass"
    
    echo ""
    sleep 2
done

echo "==================================================="
echo "✅ Simulation Complete"