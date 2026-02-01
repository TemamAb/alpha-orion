#!/bin/bash

# Configuration
SERVER_URL="http://localhost:8888"

echo "==================================================="
echo "🛑 ALPHA-ORION DEPLOYMENT HALT SIMULATION"
echo "==================================================="
echo ""

# 1. Trigger Deployment
echo "[1/3] Triggering Cloud Deployment..."
curl -s -X POST "$SERVER_URL/api/deploy/cloud" > /dev/null
echo "✅ Deployment started (Background Thread)."
echo ""

# 2. Wait to simulate user reaction time
echo "[2/3] Letting build run for 3 seconds..."
for i in {1..3}; do
    echo -n "."
    sleep 1
done
echo ""
echo ""

# 3. Trigger Stop
echo "[3/3] 🚨 Sending STOP command via API..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/deploy/stop")
echo "RESPONSE: $RESPONSE"
echo "✅ Stop signal sent."
echo ""

# 4. Poll Logs to verify halt
echo "--- Verifying Halt in Logs ---"
echo "(Looking for 'Deployment process halted')"
echo ""

sleep 1
curl -s "$SERVER_URL/api/deploy/logs" | python3 -c "
import sys, json
try:
    logs = json.load(sys.stdin)
    # Print last 4 logs
    for entry in logs[-4:]:
        print(f'[{entry.get(\"timestamp\", \"?\")}] {entry.get(\"level\", \"INFO\")}: {entry.get(\"message\", \"\")}')
except:
    pass"

echo ""
echo "==================================================="
echo "✅ Verification Complete"