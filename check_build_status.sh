#!/bin/bash

echo "🔍 Checking Google Cloud Build Status..."
echo "======================================="

# Check for gcloud
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
echo "📂 Project: $PROJECT_ID"
echo ""

# List recent builds
echo "📋 Recent Builds (Last 5):"
gcloud builds list --limit=5 --sort-by=~createTime --format="table(id,status,createTime,source.repoSource.branchName)"

echo ""
echo "📜 To view logs for the latest build, run:"
LATEST_ID=$(gcloud builds list --limit=1 --format="value(id)")
echo "   gcloud builds log $LATEST_ID"
echo ""
echo "   (Or view in console: https://console.cloud.google.com/cloud-build/builds)"