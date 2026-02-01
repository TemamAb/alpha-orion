#!/bin/bash

# Configuration
SERVER_URL="http://localhost:8888"

echo "==================================================="
echo "🧊 DEPLOYMENT FREEZE & RECOVERY SIMULATION"
echo "==================================================="
echo ""

# 1. Set the Trap (Create Flag)
echo "[1/4] Setting simulation flag for stuck state..."
touch stuck_simulation.flag
echo "✅ Flag created."
echo ""

# 2. Trigger Deployment
echo "[2/4] Triggering Cloud Deployment..."
curl -s -X POST "$SERVER_URL/api/deploy/cloud" > /dev/null
echo "✅ Deployment started."
echo "   (Waiting 6 seconds for system to hang at 45%)..."

for i in {1..6}; do
    echo -n "."
    sleep 1
done
echo ""
echo ""

# 3. Verify Stuck State
echo "--- Checking Logs for Freeze ---"
curl -s "$SERVER_URL/api/deploy/logs" | python3 -c "
import sys, json
try:
    logs = json.load(sys.stdin)
    # Print last 2 logs
    for entry in logs[-2:]:
        print(f'[{entry.get(\"timestamp\", \"?\")}] {entry.get(\"level\", \"INFO\")}: {entry.get(\"message\", \"\")}')
except:
    pass"
echo ""

# 4. Trigger Restart
echo "[3/4] 🔄 Sending RESTART command..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/deploy/restart")
echo "RESPONSE: $RESPONSE"
echo ""

echo "[4/4] Verifying Recovery Sequence..."
echo ""

sleep 3

# Verify that a new deployment sequence has started
LOGS=$(curl -s "$SERVER_URL/api/deploy/logs")

if echo "$LOGS" | grep -q "Initiating CLOUD RUN deployment sequence"; then
    # We check if this message appears AFTER the halt
    echo "✅ Recovery Sequence Initiated."
    echo "   - Found 'Initiating CLOUD RUN deployment sequence' in logs."
else
    echo "❌ Recovery Failed."
    echo "   - Did not find restart signature in logs."
    exit 1
fi

echo "==================================================="