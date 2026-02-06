#!/bin/bash

# ==========================================
# ALPHA-08 DEPLOYMENT VERIFICATION PROTOCOL
# ==========================================
# Usage: ./deployment-verify.sh [API_URL]
# Default: http://localhost:8000

API_BASE="${1:-http://localhost:8000}"

# ANSI Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
if [[ "$API_BASE" != *"localhost"* && "$API_BASE" != *"127.0.0.1"* ]]; then
    echo -e "${RED}   🚀 LIVE PRODUCTION VERIFICATION${NC}"
else
    echo -e "${YELLOW}   ALPHA-08 SYSTEM READINESS CHECK${NC}"
fi
echo -e "${BLUE}==============================================${NC}"
echo "Target API: $API_BASE"
echo "Timestamp:  $(date)"
echo "----------------------------------------------"

verify_endpoint() {
    local name=$1
    local endpoint=$2
    
    # Print with fixed width for alignment
    printf "Checking %-25s ... " "$name"
    
    # Curl: Silent, max 5s timeout, write HTTP code
    response=$(curl -s -w "%{http_code} %{time_total}" -o /dev/null --max-time 5 "$API_BASE$endpoint")
    status=$(echo "$response" | awk '{print $1}')
    time=$(echo "$response" | awk '{print $2}')
    
    if [ "$status" -eq 200 ]; then
        latency=$(echo "$time" | awk '{printf "%.0f", $1*1000}')
        echo -e "${GREEN}[ ONLINE ]${NC} ${BLUE}(${latency}ms)${NC}"
    else
        echo -e "${RED}[ FAILED ] (Status: $status)${NC}"
        if [ "$status" == "000" ]; then
             echo -e "    ${YELLOW}>>> DIAGNOSTIC: Connection Refused. Check if server is bound to 0.0.0.0 or Firewall port 8000.${NC}"
        fi
        return 1
    fi
}

# 1. Core Profit Stream (Critical for Sovereign Hub)
verify_endpoint "Profit Telemetry" "/api/profit/current"

# 2. Strategy Data (Critical for Enterprise Dash)
verify_endpoint "Strategy Matrix" "/api/strategies"
verify_endpoint "Analytics Breakdown" "/api/profit/breakdown?hours=24"

# 3. System Logs (Critical for Audit/Copilot)
verify_endpoint "Audit Log Stream" "/api/logs"

echo "----------------------------------------------"
echo -e "${BLUE}VERIFICATION SEQUENCE COMPLETE${NC}"