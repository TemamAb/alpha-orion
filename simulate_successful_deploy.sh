#!/bin/bash

# Configuration
SERVER_URL="http://localhost:8888"

echo "==================================================="
echo "🚀 ALPHA-ORION SUCCESSFUL DEPLOYMENT SIMULATION"
echo "==================================================="
echo ""

# 1. Trigger Deployment
echo "[1/2] Triggering Cloud Deployment via API..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/deploy/cloud")

if [[ $RESPONSE != *"started"* ]]; then
    echo "❌ Failed to trigger deployment. Is the server running?"
    echo "   (Make sure 'python serve-live-dashboard.py' is running)"
    exit 1
fi

echo "✅ Deployment started. Monitoring logs for success..."
echo ""

# 2. Poll for Logs until Success
SUCCESS_DETECTED=false
MAX_RETRIES=40
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    # Fetch logs
    LOGS=$(curl -s "$SERVER_URL/api/deploy/logs")
    
    # Check for success message
    if echo "$LOGS" | grep -q "System is 100% Functional"; then
        SUCCESS_DETECTED=true
        break
    fi
    
    # Display status (last log)
    LAST_LOG=$(echo "$LOGS" | python3 -c "import sys, json; logs=json.load(sys.stdin); print(logs[-1]['message']) if logs else 'Waiting...'")
    echo -ne "\r⏳ Status: $LAST_LOG\033[K"
    
    sleep 1
    ((COUNT++))
done

echo ""
echo ""

if [ "$SUCCESS_DETECTED" = true ]; then
    echo "✅ SUCCESS: System reported '100% Functional'"
    echo "   - Health Widget should now be VISIBLE in Dashboard"
    echo "   - Status should show 'ONLINE'"
else
    echo "❌ TIMEOUT: Did not detect success message within 40 seconds."
fi

echo "==================================================="