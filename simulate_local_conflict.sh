#!/bin/bash

# Configuration
SERVER_URL="http://localhost:8888"

echo "==================================================="
echo "🐳 LOCAL DEPLOYMENT CONFLICT SIMULATION"
echo "==================================================="
echo ""

# 1. Trigger Local Deployment
echo "[1/2] Triggering Local Docker Deployment..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/deploy/local")

if [[ $RESPONSE != *"started"* ]]; then
    echo "❌ Failed to trigger deployment. Is the server running?"
    exit 1
fi

echo "✅ Deployment started. Monitoring logs for self-healing..."
echo ""

# 2. Poll for Logs
echo "[2/2] Streaming Logs..."
echo ""

for i in {1..8}; do
    curl -s "$SERVER_URL/api/deploy/logs" | python3 -c "
import sys, json
try:
    logs = json.load(sys.stdin)
    # Print last 6 logs
    for entry in logs[-6:]:
        print(f'[{entry.get(\"timestamp\", \"?\")}] {entry.get(\"level\", \"INFO\")}: {entry.get(\"message\", \"\")}')
except:
    pass"
    echo ""
    sleep 2
done

echo "==================================================="
echo "✅ Simulation Complete"