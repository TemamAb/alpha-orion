#!/bin/bash
# ALPHA-08 PRODUCTION DEPLOYMENT SCRIPT
# Automated GCP deployment with profit tracking

set -e

echo "🚀 ALPHA-08 PRODUCTION DEPLOYMENT INITIATED"
echo "=============================================="

# Configuration
PROJECT_ID="alpha-orion-production"
REGION="us-central1"
CLUSTER_NAME="alpha-08-cluster"
NAMESPACE="alpha-08"

# Step 1: Verify GCP Authentication
echo "📋 Step 1: Verifying GCP Authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ No active GCP account found. Please run: gcloud auth login"
    exit 1
fi
echo "✅ GCP Authentication verified"

# Step 2: Set Project
echo "📋 Step 2: Setting GCP Project..."
gcloud config set project $PROJECT_ID
echo "✅ Project set to: $PROJECT_ID"

# Step 3: Build Docker Images
echo "📋 Step 3: Building Docker Images..."
cd alpha-08

# Build Engine
echo "Building Calibration Engine..."
gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=$REGION .

echo "✅ Docker images built and pushed to Artifact Registry"

# Step 4: Deploy to GKE
echo "📋 Step 4: Deploying to GKE..."

# Get cluster credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Deploy the application
kubectl apply -f infrastructure/k8s/ -n $NAMESPACE

echo "✅ Application deployed to GKE"

# Step 5: Verify Deployment
echo "📋 Step 5: Verifying Deployment..."
kubectl rollout status deployment/alpha-08-engine -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/alpha-08-dashboard -n $NAMESPACE --timeout=5m

echo "✅ Deployment verified"

# Step 6: Get Service Endpoints
echo "📋 Step 6: Retrieving Service Endpoints..."
DASHBOARD_IP=$(kubectl get service alpha-08-dashboard -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
API_IP=$(kubectl get service alpha-08-api -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "=============================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "=============================================="
echo "📊 Dashboard URL: http://$DASHBOARD_IP"
echo "🔌 API Endpoint: http://$API_IP:8000"
echo "💰 Withdrawal Mode: MANUAL (Default)"
echo "=============================================="
echo ""
echo "📈 To monitor profit in real-time:"
echo "   curl http://$API_IP:8000/api/profit/current"
echo ""
echo "💸 To request withdrawal:"
echo "   curl -X POST http://$API_IP:8000/api/withdrawal/request \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"amount_usd\": 1000, \"wallet_address\": \"0x...\"}'"
echo ""
echo "🔧 To view logs:"
echo "   kubectl logs -f deployment/alpha-08-engine -n $NAMESPACE"
echo ""
