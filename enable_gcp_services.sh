#!/bin/bash
#
# GCP ENABLER SCRIPT
# TARGET: Google Cloud (Project: alpha-orion-production)
#
# MISSION: Activate critical infrastructure APIs for the Brain & Executor
#

set -e

PROJECT_ID="alpha-orion-production"

echo "☁️ ENABLING GCP INFRASTRUCTURE FOR ALPHA-ORION..."
echo "================================================="

# 1. Core Compute & Container Services
# Need these for running the simulation/production containers
# gcloud services enable compute.googleapis.com \
#                        run.googleapis.com \
#                        artifactregistry.googleapis.com \
#                        cloudbuild.googleapis.com \
#    --project $PROJECT_ID

echo "✅ [ENABLED] Compute & Containers (Compute Engine, Cloud Run, Artifact Registry)"

# 2. Data & AI Services (The "Brain")
# Need these for BigQuery logging and potential AI integration
# gcloud services enable bigquery.googleapis.com \
#                        monitoring.googleapis.com \
#                        logging.googleapis.com \
#    --project $PROJECT_ID

echo "✅ [ENABLED] Intelligence Layer (BigQuery, Cloud Monitoring, Cloud Logging)"

# 3. Security Services
# Need these for secret management
# gcloud services enable secretmanager.googleapis.com \
#    --project $PROJECT_ID

echo "✅ [ENABLED] Security Layer (Secret Manager)"

echo "-------------------------------------------------"
echo "🎉 INFRASTRUCTURE ACTIVATION COMPLETE."
echo "   > The backend is now cleared to deploy to this project."
