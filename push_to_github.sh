#!/bin/bash

# 🚀 ALPHA-08 GCP DEPLOYMENT GITHUB PUSH SCRIPT
# Protocol: Run simulation locally → Push to GitHub → Auto-deploy to GCP

set -e

# Configuration
REPO_URL="https://github.com/TemamAb/alpha-orion.git"
BRANCH="main"
COMMIT_MSG="Alpha-08: Production Deployment - $(date +%Y-%m-%d\ %H:%M:%S)"

echo "🚀 ALPHA-08 PRODUCTION DEPLOYMENT"
echo "=" 60
echo ""

# Step 1: Run simulation locally (NOT on GCP)
echo "📊 Step 1: Running $500M Capital Velocity Simulation..."
echo "⚠️  NOTE: Alpha-08 protocol - NO simulation runs on GCP"
echo ""
python tests/simulation/simulate_500m.py
SIM_RESULT=$?

if [ $SIM_RESULT -ne 0 ]; then
    echo ""
    echo "❌ SIMULATION FAILED! Please review and fix before deployment."
    echo "💡 Check logs above for details."
    exit 1
fi

echo ""
echo "✅ Simulation passed! Ready for production deployment."

# Step 2: Configure git
echo ""
echo "📝 Step 2: Configuring git..."
if [ -z "$(git config user.email)" ]; then
    git config --global user.email "alpha-08@alpha-orion.local"
    git config --global user.name "Alpha-08 Copilot"
fi

# Step 3: Stage files
echo ""
echo "📦 Step 3: Staging deployment artifacts..."

# Core Infrastructure
git add infrastructure/terraform/environments/prod/
git add infrastructure/terraform/modules/
git add infrastructure/k8s/deployment.yaml
git add infrastructure/k8s/manifests/

# CI/CD Pipeline
git add cloudbuild.yaml
git add Dockerfile

# Application Core
git add core/
git add strategies/
git add contracts/

# Monitoring
git add monitoring/

# Deployment Scripts
git add deploy-production.sh
git add provision_infra.sh

# Documentation
git add GCP_DEPLOYMENT_GAP_ANALYSIS.md
git add PROFIT_SIMULATION_REPORT.md
git add MASTER_PLAN.md
git add README.md
git add CLOUDBUILD_SETUP.md

# Configuration
git add requirements.txt
git add requirements-local.txt

# Simulation (kept for reference)
git add tests/

# Check git status
echo ""
echo "📋 Git Status:"
git status --short

# Step 4: Commit
echo ""
echo "🔒 Step 4: Creating commit..."
git commit -m "$COMMIT_MSG"

# Step 5: Push to GitHub
echo ""
echo "🚀 Step 5: Pushing to GitHub..."
git push origin $BRANCH

echo ""
echo "=" 60
echo "✅ SUCCESS! Alpha-08 production deployment pushed to GitHub."
echo ""
echo "📊 AUTO-DEPLOYMENT TRIGGERED:"
echo "   └─ GitHub Webhook → Cloud Build → GKE"
echo ""
echo "🔗 Monitor Deployment:"
echo "   └─ https://console.cloud.google.com/cloud-build"
echo ""
echo "📈 Live at:"
echo "   └─ alpha-orion-gke.{region}.gke.xxx"
echo ""
echo "⚠️  REMINDER: No simulation runs on GCP (per protocol)"
echo "💰 Target Daily Profit: $900K - $2.68M"
echo "=" 60
