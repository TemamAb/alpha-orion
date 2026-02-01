#!/bin/bash
# ==============================================================================
# ALPHA-ORION MISSION CONTROL: PRODUCTION ORCHESTRATOR
# Automates Deployment, Monitoring, Self-Healing, and Profit Validation
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 INITIALIZING ALPHA-ORION MISSION CONTROL${NC}"
echo "============================================"

# 1. Load Configuration
if [ -f .env ]; then
    echo -e "${GREEN}📄 Loading configuration from .env${NC}"
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${YELLOW}⚠️  .env file not found. Using defaults.${NC}"
fi

PROJECT_ID="${GCP_PROJECT_ID:-alpha-orion}"
REGION="${GCP_REGION:-us-central1}"

echo "Target Project: $PROJECT_ID"
echo "Target Region:  $REGION"
echo ""

# 2. Pre-Flight Diagnostics & Auto-Fix
echo -e "${BLUE}🔧 PHASE 1: DIAGNOSTICS & SELF-HEALING${NC}"

# Detect Python
if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

if [ -f "fix-gcp-deployment-issues.py" ]; then
    $PYTHON_CMD fix-gcp-deployment-issues.py --fix --project="$PROJECT_ID" --region="$REGION"
else
    echo -e "${RED}❌ Fixer script not found!${NC}"
fi
echo ""

# 2.5 Build Verification
echo -e "${BLUE}🏗️  PHASE 1.5: BUILD VERIFICATION${NC}"

# Auto-create verification script if missing (Self-Healing)
if [ ! -f "verify-docker-build.sh" ]; then
    echo -e "${YELLOW}⚠️  Verification script not found. Creating it automatically...${NC}"
    cat > verify-docker-build.sh << 'EOF'
#!/bin/bash
echo "🐳 Testing Docker Build for User API Service..."
echo "=============================================="

# Ensure we are in the project root
if [ ! -d "backend-services/services/user-api-service" ]; then
    echo "❌ Error: Directory backend-services/services/user-api-service not found."
    echo "Please run this script from the project root."
    exit 1
fi

cd backend-services/services/user-api-service

echo "Building image using src/Dockerfile..."
docker build -f src/Dockerfile -t alpha-orion-user-api:test .

if [ $? -ne 0 ]; then
    echo "❌ Build Failed! Please check the logs above."
    exit 1
fi

echo "✅ Build Successful! The Dockerfile is valid and optimized."
echo "🧹 Cleaning up test image..."
docker rmi alpha-orion-user-api:test
echo "=============================================="
echo "🚀 Ready for Cloud Deployment"
EOF
fi

chmod +x verify-docker-build.sh
./verify-docker-build.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build verification failed! Aborting deployment.${NC}"
    exit 1
fi
echo ""

# 3. Production Deployment
echo -e "${BLUE}🚀 PHASE 2: PRODUCTION DEPLOYMENT${NC}"
export NON_INTERACTIVE=true
./deploy-alpha-orion-production.sh
echo ""

# 4. Service Discovery
echo -e "${BLUE}🔍 PHASE 3: SERVICE DISCOVERY${NC}"
SERVICE_URL=$(gcloud run services describe user-api-service --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')

if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}❌ Failed to retrieve Service URL. Deployment may have failed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service Active at: $SERVICE_URL${NC}"
echo ""

# 5. Dashboard Launch
echo -e "${BLUE}📊 PHASE 4: DASHBOARD LAUNCH${NC}"
DASHBOARD_URL="$SERVICE_URL/dashboard" # Assuming dashboard is served here or root
MONITORING_URL="https://console.cloud.google.com/run/detail/$REGION/user-api-service/metrics?project=$PROJECT_ID"

echo "Opening Production Dashboard..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$SERVICE_URL" || true
    open "$MONITORING_URL" || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$SERVICE_URL" || true
    xdg-open "$MONITORING_URL" || true
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    start "$SERVICE_URL" || true
    start "$MONITORING_URL" || true
else
    echo "Please open: $SERVICE_URL"
fi
echo ""

# 6. Continuous Monitoring Loop
echo -e "${BLUE}🔄 PHASE 5: REAL-TIME PROFIT MONITORING${NC}"
echo "Press Ctrl+C to stop monitoring (Service will remain active)"

while true; do
    TIMESTAMP=$(date +'%H:%M:%S')
    
    # Fetch Metrics
    PNL_DATA=$(curl -s "$SERVICE_URL/analytics/total-pnl")
    MISSION_DATA=$(curl -s "$SERVICE_URL/mission/status")
    
    # Display Status
    echo "---------------------------------------------------"
    echo -e "⏰ $TIMESTAMP | 🏥 Health: $(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health")"
    echo -e "💰 P&L Status: $PNL_DATA"
    echo -e "🎯 Mission:    $MISSION_DATA"
    
    sleep 10
done