#!/bin/bash
# ALPHA-08 PRODUCTION DEPLOYMENT SCRIPT
# Automated GCP deployment with profit tracking

set -e

echo "🚀 ALPHA-08 PRODUCTION DEPLOYMENT INITIATED"
echo "=============================================="

# 🛠️ AUTO-FIX: Locate Google Cloud SDK on Windows/Git Bash
if ! command -v gcloud &> /dev/null; then
    echo "⚠️  'gcloud' command not found. Searching common installation paths..."
    # Common Windows paths adapted for Git Bash
    POSSIBLE_PATHS=(
        "/c/Users/$USER/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin"
        "/c/Users/op/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin"
        "/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin"
    )
    for SEARCH_PATH in "${POSSIBLE_PATHS[@]}"; do
        if [ -d "$SEARCH_PATH" ]; then
            echo "✅ Found SDK at: $SEARCH_PATH"
            export PATH=$PATH:"$SEARCH_PATH"
            break
        fi
    done
fi

# Ensure we are executing from the repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

echo "📂 Working Directory: $REPO_ROOT"
cd "$REPO_ROOT"

# 🛠️ AUTO-FIX: Dynamic Project Identity & Configuration
echo "📋 Step 0: Configuring Project Identity..."

# 1. Get Active Project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

# 2. Validation & Auto-Selection
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "alpha-orion-production" ]]; then
    echo "⚠️  Invalid or missing Project ID detected."
    echo "Attempting to find an active project..."
    # Get the first active project ID
    PROJECT_ID=$(gcloud projects list --format="value(projectId)" --limit=1 2>/dev/null)
    
    if [[ -z "$PROJECT_ID" ]]; then
        echo "❌ No GCP projects found. Please create one and run 'gcloud config set project <ID>'."
        exit 1
    fi
    echo "✅ Auto-selected Project ID: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
else
    echo "✅ Using Active Project ID: $PROJECT_ID"
fi

# Configuration
REGION="us-central1"
CLUSTER_NAME="alpha-orion-gke"
NAMESPACE="alpha-08"
TF_STATE_BUCKET="${PROJECT_ID}-tfstate"

# 🛠️ AUTO-FIX: Update Configuration Files with Real Project ID
echo "📋 Step 0.1: Synchronizing Configuration..."

# Update terraform.tfvars
cat > infrastructure/terraform/environments/prod/terraform.tfvars <<EOF
project_id = "${PROJECT_ID}"
region     = "${REGION}"
EOF

# Update backend.tf
cat > infrastructure/terraform/environments/prod/backend.tf <<EOF
terraform {
  backend "gcs" {
    bucket  = "${TF_STATE_BUCKET}"
    prefix  = "terraform/state/prod"
  }
}
EOF

# Update deployment.yaml (Replace placeholder with real ID)
if [ -f "infrastructure/k8s/deployment.yaml" ]; then
    sed "s/alpha-orion-production/${PROJECT_ID}/g" infrastructure/k8s/deployment.yaml > infrastructure/k8s/deployment.yaml.tmp && mv infrastructure/k8s/deployment.yaml.tmp infrastructure/k8s/deployment.yaml
fi

# Create Terraform State Bucket
if ! gcloud storage buckets describe gs://$TF_STATE_BUCKET &>/dev/null; then
    echo "Creating Terraform State Bucket: gs://$TF_STATE_BUCKET"
    gcloud storage buckets create gs://$TF_STATE_BUCKET --project=$PROJECT_ID --location=$REGION
else
    echo "✅ State Bucket exists: gs://$TF_STATE_BUCKET"
fi

# Step 1: Verify GCP Authentication
echo "📋 Step 1: Verifying GCP Authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ No active GCP account found. Please run: gcloud auth login"
    exit 1
fi
echo "✅ GCP Authentication verified"

# Step 1.1: Configure Terraform Authentication (Automated)
echo "📋 Step 1.1: Configuring Terraform Authentication..."
# Check if ADC is missing and GOOGLE_APPLICATION_CREDENTIALS is not set
if ! gcloud auth application-default print-access-token &>/dev/null && [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  ADC not found. Auto-injecting active gcloud session token..."
    # Use the active gcloud user's token to bypass manual login
    export GOOGLE_OAUTH_ACCESS_TOKEN=$(gcloud auth print-access-token)
    echo "✅ Authenticated via Session Token (Zero-Touch)"
else
    echo "✅ Authentication configured (ADC or Service Account)"
fi

# Step 2: Set Project
echo "📋 Step 2: Setting GCP Project..."
gcloud config set project $PROJECT_ID
echo "✅ Project set to: $PROJECT_ID"

# Step 2.5: Provision Infrastructure
echo "📋 Step 2.5: Provisioning Infrastructure (Terraform)..."
echo "⏳ This may take 10-15 minutes for a new GKE cluster."
cd infrastructure/terraform/environments/prod
# Initialize with reconfigure to pick up new backend
terraform init -reconfigure -input=false
# Apply changes
terraform apply -auto-approve -input=false
cd "$REPO_ROOT"

# Step 3: Prepare GKE Environment
echo "📋 Step 3: Preparing GKE Environment..."

# 🛠️ AUTO-FIX: Install GKE Auth Plugin (Required for GKE authentication)
if ! command -v gke-gcloud-auth-plugin &> /dev/null; then
    echo "⚠️  gke-gcloud-auth-plugin not found. Installing..."
    gcloud components install gke-gcloud-auth-plugin --quiet
fi

# Get cluster credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply Infrastructure (if manifests exist)
if [ -d "infrastructure/k8s" ]; then
    echo "Applying Kubernetes manifests..."
    kubectl apply -f infrastructure/k8s/ -n $NAMESPACE
else
    echo "⚠️  infrastructure/k8s/ directory not found. Skipping manifest application."
fi

# Step 4: Trigger Cloud Build
echo "📋 Step 4: Triggering Cloud Build..."
# This builds the image and updates the deployment via cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Cloud Build submitted successfully"

# Step 5: Verify Deployment
echo "📋 Step 5: Verifying Deployment..."
kubectl rollout status deployment/alpha-orion-core -n $NAMESPACE --timeout=5m

echo "✅ Deployment verified"

# Step 6: Get Service Endpoints
echo "📋 Step 6: Retrieving Service Endpoints..."
SERVICE_IP=$(kubectl get service alpha-orion-core -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")

# 🛠️ AUTO-FIX: Generate Dashboard Configuration
echo "📋 Step 7: Generating Dashboard Connectivity Config..."
cat > dashboard-config.js <<EOF
window.ALPHA_CONFIG = {
    API_BASE: "http://$SERVICE_IP:8000",
    ENV: "PRODUCTION",
    CLUSTER: "$CLUSTER_NAME",
    REGION: "$REGION"
};
EOF
echo "✅ dashboard-config.js generated with IP: $SERVICE_IP"

echo "=============================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "=============================================="
echo "🔌 API Endpoint: http://$SERVICE_IP:8000"
echo "💰 Withdrawal Mode: MANUAL (Default)"
echo "=============================================="
echo ""
echo "📈 To monitor profit in real-time:"
echo "   curl http://$SERVICE_IP:8000/api/profit/current"
echo ""
echo "🔧 To view logs:"
echo "   kubectl logs -f deployment/alpha-orion-core -n $NAMESPACE"
echo ""
