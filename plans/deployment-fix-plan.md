# Alpha-Orion GCP Deployment Fix Plan

## Current Status
- Dashboard simulation server (serve-live-dashboard.py) is running on port 8888
- GCP Project: alpha-orion-485207
- 85% production ready (85/100)
- Critical fixes needed before production deployment

## Identified Issues

### 1. serve-live-dashboard.py Limitations
- Static HTML dashboard with hardcoded values
- API endpoints return random data (not real metrics)
- Dashboard doesn't fetch from its own API endpoints
- Only suitable for visual testing, not functional testing

### 2. GCP Deployment Blockers
- 58/68 APIs enabled (10 APIs pending)
- Terraform infrastructure not yet deployed
- Cloud Run services not created
- Secrets configuration incomplete

## Required Fixes

### Phase 1: Fix Dashboard Simulation
1. Update serve-live-dashboard.py to serve the production dashboard
2. Make dashboard actually fetch from API endpoints
3. Add real-time data polling (5-second intervals)
4. Enable CORS for production use

### Phase 2: Complete GCP Pre-Deployment
1. Enable remaining GCP APIs
2. Configure secrets in Secret Manager
3. Verify Terraform configuration
4. Build Docker images

### Phase 3: Execute GCP Deployment
1. Deploy Terraform infrastructure
2. Trigger Cloud Build pipeline
3. Deploy to Cloud Run services
4. Configure Load Balancer and DNS

## Implementation Steps

### Step 1: Fix serve-live-dashboard.py
- Change DASHBOARD_FILE to serve production dashboard
- Add JavaScript to dashboard to fetch from API endpoints
- Enable real-time polling
- Add CORS headers for cross-origin requests

### Step 2: Run GCP Pre-Flight Checks
```powershell
# Check API status
gcloud services list --project=alpha-orion-485207

# Enable remaining APIs
gcloud services enable <missing-apis> --project=alpha-orion-485207
```

### Step 3: Execute Full Deployment
```powershell
.\deploy-alpha-orion-automated.ps1
```

## Success Criteria
- [ ] Dashboard server running and serving dynamic data
- [ ] All 68 GCP APIs enabled
- [ ] Terraform infrastructure deployed
- [ ] Cloud Run services operational
- [ ] Health checks passing
