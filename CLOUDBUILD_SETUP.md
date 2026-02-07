# 🚀 Cloud Build Auto-Deployment Setup Guide

This document explains how to configure GitHub → Cloud Build → GKE auto-deployment for Alpha-08.

## Prerequisites

1. **GCP Project**: `alpha-orion-485207`
2. **Repository**: `github.com/TemamAb/alpha-orion`
3. **Cloud Build API**: Enabled
4. **GKE Cluster**: `alpha-orion-gke` in `us-central1`

## Step 1: Connect GitHub Repository to Cloud Build

```bash
# Using gcloud CLI
gcloud builds triggers create github \
  --region=us-central1 \
  --repo-name=alpha-orion \
  --repo-owner=TemamAb \
  --name=alpha-orion-deploy \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

Or via Console:
1. Go to **Cloud Build** → **Triggers**
2. Click **Connect Repository**
3. Select GitHub and authenticate
4. Choose `TemamAb/alpha-orion`
5. Click **Create Trigger**

## Step 2: Configure Trigger Settings

| Setting | Value |
|---------|-------|
| **Name** | `alpha-orion-deploy` |
| **Event** | Push to branch |
| **Source** | `^main$` |
| **Configuration** | Cloud Build configuration file |
| **Location** | `cloudbuild.yaml` |
| **Substitutions** | (Leave default) |

## Step 3: Grant IAM Permissions

```bash
# Grant Cloud Build service account access to GKE
gcloud projects add-iam-policy-binding alpha-orion-485207 \
  --member="serviceAccount:$(gcloud builds describe alpha-orion-deploy --format='value(serviceAccountEmail)')" \
  --role="roles/container.admin"

# Grant Artifact Registry access
gcloud artifacts repositories add-iam-policy-binding alpha-orion-repo \
  --location=us-central1 \
  --member="serviceAccount:$(gcloud builds describe alpha-orion-deploy --format='value(serviceAccountEmail)')" \
  --role="roles/artifactregistry.reader"
```

## Step 4: Verify Trigger

1. Go to **Cloud Build** → **Triggers**
2. Find `alpha-orion-deploy`
3. Click **Run** to test manually

## Deployment Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ GitHub      │────▶│ Cloud Build │────▶│ Artifact    │────▶│ GKE         │
│ Push (main) │     │ Trigger     │     │ Registry    │     │ Deployment  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Simulation  │
                     │ Test (500M) │
                     └─────────────┘
```

## Cloud Build Steps (cloudbuild.yaml)

1. **Quality Gate**: Install dependencies & lint
2. **Safety Gate**: Run `tests/simulation/simulate_500m.py`
3. **Build**: Build Docker image
4. **Push**: Push to Artifact Registry
5. **Deploy**: Update GKE deployment

## Monitor Deployment

| Platform | URL |
|----------|-----|
| **Cloud Build** | https://console.cloud.google.com/cloud-build/builds |
| **GKE Console** | https://console.cloud.google.com/kubernetes |
| **Container Logs** | https://console.cloud.google.com/logs |

## Troubleshooting

### Trigger Not Firing
- Check GitHub webhook: Settings → Webhooks → Cloud Build
- Verify repository connection in Cloud Build

### Build Fails
- Check Cloud Build logs for error details
- Verify Artifact Registry exists
- Check GKE cluster is running

### GKE Deployment Fails
- Verify kubectl access: `gcloud container clusters get-credentials alpha-orion-gke`
- Check node pool capacity
- Verify container image exists in Artifact Registry

## Quick Commands

```bash
# List triggers
gcloud builds triggers list --region=us-central1

# Run trigger manually
gcloud builds trigger run alpha-orion-deploy --region=us-central1

# Check build status
gcloud builds describe <BUILD_ID> --region=us-central1

# Tail build logs
gcloud builds log <BUILD_ID> --region=us-central1
```

## Security Notes

- All secrets are stored in **Secret Manager**
- Workload Identity provides minimal IAM permissions
- Cloud Armor WAF protects external access
- Secret rotation runs daily at 3 AM
