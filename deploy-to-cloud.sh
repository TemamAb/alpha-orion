#!/bin/bash
set -e

echo "🚀 Alpha-Orion: Cloud Production Deployment"
echo "==========================================="

# 1. Commit Changes
echo "📦 Committing latest configuration and fixes..."
git add .
git commit -m "deploy: production release $(date +%Y%m%d-%H%M)" || echo "⚠️  Nothing to commit, proceeding..."

# 2. Push to GitHub (Triggers Cloud Build if configured)
echo "⬆️  Pushing to GitHub main branch..."
git push origin main

# 3. Direct Cloud Run Deployment (Ensures immediate update)
echo "☁️  Deploying directly to Google Cloud Run..."

# Navigate to service directory
cd backend-services/services/user-api-service

# Deploy command
gcloud run deploy user-api-service \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=$(gcloud config get-value project),MIN_PROFIT_THRESHOLD_USD=500,AUTO_WITHDRAWAL_THRESHOLD_USD=1000"

echo ""
echo "✅ Deployment Complete!"
echo "   Service URL: $(gcloud run services describe user-api-service --region us-central1 --format 'value(status.url)')"
echo "   Monitor: https://console.cloud.google.com/run/detail/us-central1/user-api-service/metrics"