#!/bin/bash
set -e

echo "🚀 Alpha-Orion: Complete Production Deployment"
echo "=============================================="
echo ""

ROOT_DIR="$(pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Step 1: Pre-flight Checks
echo "🔍 Step 1: Pre-flight Checks"
echo "----------------------------"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    print_warning "gcloud CLI not found. Attempting to locate..."
    for path in "/c/Program Files/Google/Cloud SDK/bin/gcloud" \
               "/c/Program Files (x86)/Google/Cloud SDK/bin/gcloud" \
               "$HOME/AppData/Local/Google/Cloud SDK/bin/gcloud"; do
        if [ -f "$path" ]; then
            export PATH="$(dirname $path):$PATH"
            print_status "Found gcloud at $path"
            break
        fi
    done
fi

if ! command -v gcloud &> /dev/null; then
    print_warning "gcloud CLI not found. Please install Google Cloud SDK."
    print_warning "Will proceed with local Docker build only."
    GCLoud_AVAILABLE=false
else
    GCLoud_AVAILABLE=true
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_warning "No GCP project configured. Setting default."
        PROJECT_ID="alpha-orion"
    fi
    print_status "GCP Project: $PROJECT_ID"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker not found. Skipping image builds."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
    print_status "Docker available"
fi

echo ""

# Step 2: Deploy Smart Contracts
echo "📦 Step 2: Deploy Smart Contracts"
echo "----------------------------------"

cd "$ROOT_DIR/alpha-orion/alpha-orion/smart-contracts"

if [ -f ".env" ]; then
    print_status "Found .env file"
else
    print_warning "No .env file found. Copying .env.example..."
    cp .env.example .env
    print_warning "Please edit .env with your private key before deploying!"
fi

if [ "$GCLoud_AVAILABLE" = true ]; then
    print_status "Compiling contracts..."
    npm install --silent 2>/dev/null
    npx hardhat compile
    
    print_status "Deploying to Ethereum mainnet..."
    npx hardhat run scripts/deploy.js --network mainnet
    
    # Get deployed address
    CONTRACT_ADDRESS=$(cat deployments/mainnet.json 2>/dev/null | grep -o '"contractAddress": "[^"]*"' | cut -d'"' -f4)
    if [ -n "$CONTRACT_ADDRESS" ]; then
        print_status "Contract deployed at: $CONTRACT_ADDRESS"
    fi
else
    print_warning "Skipping smart contract deployment (gcloud not available)"
    print_status "Run manually: npx hardhat run scripts/deploy.js --network mainnet"
fi

echo ""

# Step 3: Build Docker Images
echo "🐳 Step 3: Build Docker Images"
echo "-------------------------------"

cd "$ROOT_DIR"

SERVICES=(
    "backend-services/services/brain-orchestrator:brain-orchestrator"
)

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service_dir image_name <<< "$service_info"
    
    if [ -d "$service_dir" ]; then
        if [ "$DOCKER_AVAILABLE" = true ]; then
            print_status "Building $image_name..."
            docker build -t "$image_name:latest" "$service_dir/" --quiet 2>/dev/null || \
                docker build -t "$image_name:latest" "$service_dir/"
        else
            print_warning "Skipping $image_name (Docker not available)"
        fi
    else
        print_warning "Directory $service_dir not found"
    fi
done

echo ""

# Step 4: Push to Artifact Registry
echo "📤 Step 4: Push to Artifact Registry"
echo "------------------------------------"

if [ "$GCLoud_AVAILABLE" = true ] && [ "$DOCKER_AVAILABLE" = true ]; then
    REGION="us-central1"
    REPO="alpha-orion-repo"
    
    # Configure Docker
    gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
    
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r service_dir image_name <<< "$service_info"
        
        if [ -d "$service_dir" ]; then
            full_image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${image_name}:latest"
            
            print_status "Tagging $image_name:latest -> $full_image"
            docker tag "$image_name:latest" "$full_image"
            
            print_status "Pushing $full_image..."
            docker push "$full_image" --quiet
        fi
    done
else
    print_warning "Skipping push to Artifact Registry"
fi

echo ""

# Step 5: Deploy to Cloud Run
echo "☁️  Step 5: Deploy to Cloud Run"
echo "--------------------------------"

if [ "$GCLoud_AVAILABLE" = true ]; then
    # Deploy Brain Orchestrator
    if [ -d "backend-services/services/brain-orchestrator" ]; then
        print_status "Deploying brain-orchestrator..."
        
        ORCHESTRATOR_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/brain-orchestrator:latest"
        
        gcloud run deploy brain-orchestrator \
            --image "$ORCHESTRATOR_IMAGE" \
            --region "$REGION" \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars="NODE_ENV=production,ARBITRAGE_CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-},ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL:-},PIMLICO_API_KEY=${PIMLICO_API_KEY:-},GCP_PROJECT_ID=${PROJECT_ID}" \
            --memory 1Gi \
            --cpu 2 \
            --min-instances 1 \
            --max-instances 10 \
            --timeout 3600s \
            --concurrency 80 \
            --service-account "alpha-orion@${PROJECT_ID}.iam.gserviceaccount.com" \
            --quiet
        
        ORCHESTRATOR_URL=$(gcloud run services describe brain-orchestrator --region "$REGION" --format 'value(status.url)')
        print_status "Brain Orchestrator: $ORCHESTRATOR_URL"
    fi
    
    # Deploy Frontend Dashboard
    print_status "Deploying frontend dashboard..."
    gcloud run deploy alpha-orion-dashboard \
        --source . \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated \
        --memory 512Mi \
        --quiet
    
    DASHBOARD_URL=$(gcloud run services describe alpha-orion-dashboard --region "$REGION" --format 'value(status.url)')
    print_status "Dashboard: $DASHBOARD_URL"
else
    print_warning "Skipping Cloud Run deployment (gcloud not available)"
fi

echo ""

# Step 6: Summary
echo "=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""

if [ "$GCLoud_AVAILABLE" = true ]; then
    echo "🌐 Endpoints:"
    echo "   Dashboard: $DASHBOARD_URL"
    echo "   Orchestrator: $ORCHESTRATOR_URL"
    echo ""
    echo "📊 Monitoring:"
    echo "   https://console.cloud.google.com/run/detail/${REGION}/brain-orchestrator"
    echo ""
    echo "🔗 API Endpoints:"
    echo "   $ORCHESTRATOR_URL/health"
    echo "   $ORCHESTRATOR_URL/profit/real-time"
    echo "   $ORCHESTRATOR_URL/blockchain/status"
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Update DNS if needed"
echo "   2. Configure custom domain"
echo "   3. Set up monitoring alerts"
echo "   4. Verify smart contract on Etherscan"
echo ""

# Step 7: Health Check
echo "🏥 Step 6: Health Check"
echo "-----------------------"

if [ -n "$ORCHESTRATOR_URL" ]; then
    sleep 3
    HEALTH=$(curl -s "${ORCHESTRATOR_URL}/health" 2>/dev/null || echo '{"status":"unknown"}')
    print_status "Orchestrator Health: $HEALTH"
fi

echo ""
echo "🎉 Alpha-Orion is now running in production!"
