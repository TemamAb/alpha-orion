# Deployment Testing Guide

## Deployment Status
**Date**: January 11, 2025  
**Commit**: 454f7d8  
**Status**: Deployment in progress on Render and Vercel

---

## Testing Checklist

### Phase 1: Deployment Verification ⏳

#### Render Deployment
- [ ] Check Render dashboard: https://dashboard.render.com
- [ ] Verify build logs show Node 20.x being used
- [ ] Confirm "vite: not found" error is resolved
- [ ] Check build command executed: `npm install && npm run build`
- [ ] Verify build completes successfully
- [ ] Confirm deployment status is "Live"

**Expected Build Log Output:**
```
==> Using Node.js version 20.x.x via /opt/render/project/src/.nvmrc
==> Running build command 'npm install && npm run build'...
npm install
added XXX packages
npm run build
> vite build
✓ XXX modules transformed.
dist/index.html                   X.XX kB
dist/assets/index-XXXXX.js       XXX.XX kB
✓ built in XXXms
==> Build successful ✅
```

#### Vercel Deployment
- [ ] Check Vercel dashboard: https://vercel.com/dashboard
- [ ] Verify Node 20.x is being used
- [ ] Confirm build completes without errors
- [ ] Check deployment URL is assigned
- [ ] Verify deployment status is "Ready"

---

### Phase 2: Frontend Application Testing

#### A. Basic Connectivity
```powershell
# Test Render deployment
Invoke-WebRequest -Uri "https://alpha-orion.onrender.com" -UseBasicParsing

# Test Vercel deployment (replace with actual URL)
Invoke-WebRequest -Uri "https://alpha-orion.vercel.app" -UseBasicParsing
```

**Expected Response:**
- Status Code: 200 OK
- Content-Type: text/html
- Response contains React app HTML

#### B. Application Load Test
- [ ] Open https://alpha-orion.onrender.com in browser
- [ ] Verify page loads without errors
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify no 404 errors for assets
- [ ] Confirm React app initializes

#### C. UI Component Testing
- [ ] Dashboard component renders
- [ ] Navigation elements are visible
- [ ] All buttons are clickable
- [ ] Forms are interactive
- [ ] No visual glitches or layout issues

---

### Phase 3: Backend API Testing

#### A. Health Check Endpoint
```powershell
# Test backend health
Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -UseBasicParsing
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-11T...",
  "uptime": 123.45
}
```

#### B. CORS Configuration
```powershell
# Test CORS headers
$response = Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -Method Options -UseBasicParsing
$response.Headers
```

**Expected Headers:**
- Access-Control-Allow-Origin: https://alpha-orion.onrender.com
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization

---

### Phase 4: Integration Testing

#### A. Frontend-Backend Communication
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Interact with application features
- [ ] Verify API calls to backend succeed
- [ ] Check response status codes (should be 200/201)
- [ ] Confirm no CORS errors

#### B. Wallet Connection Testing
- [ ] Click "Connect Wallet" button
- [ ] Verify MetaMask/wallet prompt appears
- [ ] Test wallet connection flow
- [ ] Confirm wallet address displays correctly
- [ ] Test disconnect functionality

#### C. Strategy Features
- [ ] Test strategy discovery functionality
- [ ] Verify profit calculations display
- [ ] Check MEV protection indicators
- [ ] Test strategy optimization features
- [ ] Verify all data loads correctly

---

### Phase 5: Performance Testing

#### A. Load Time Analysis
```powershell
# Measure response time
Measure-Command { Invoke-WebRequest -Uri "https://alpha-orion.onrender.com" -UseBasicParsing }
```

**Expected:**
- Initial load: < 3 seconds
- Subsequent loads: < 1 second (cached)

#### B. Asset Loading
- [ ] Check Network tab in DevTools
- [ ] Verify all assets load successfully
- [ ] Check for any failed requests (red in Network tab)
- [ ] Confirm bundle sizes are reasonable
- [ ] Verify lazy loading works for components

---

### Phase 6: Error Handling Testing

#### A. Network Error Simulation
- [ ] Disconnect from internet
- [ ] Verify error messages display correctly
- [ ] Reconnect and verify recovery
- [ ] Check error boundary catches errors

#### B. Invalid Input Testing
- [ ] Test forms with invalid data
- [ ] Verify validation messages appear
- [ ] Check error states are handled gracefully
- [ ] Confirm no console errors for expected failures

---

## Testing Scripts

### Quick Health Check Script
```powershell
# test-deployment-health.ps1
Write-Host "Testing Render Frontend..." -ForegroundColor Cyan
try {
    $frontend = Invoke-WebRequest -Uri "https://alpha-orion.onrender.com" -UseBasicParsing -TimeoutSec 30
    Write-Host "✓ Frontend Status: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Backend API..." -ForegroundColor Cyan
try {
    $backend = Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -UseBasicParsing -TimeoutSec 30
    Write-Host "✓ Backend Status: $($backend.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($backend.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Full Integration Test Script
```powershell
# test-full-integration.ps1
$ErrorActionPreference = "Continue"

Write-Host "=== Alpha Orion Deployment Test ===" -ForegroundColor Yellow
Write-Host ""

# Test 1: Frontend Render
Write-Host "1. Testing Render Frontend..." -ForegroundColor Cyan
$renderFrontend = Invoke-WebRequest -Uri "https://alpha-orion.onrender.com" -UseBasicParsing
if ($renderFrontend.StatusCode -eq 200) {
    Write-Host "   ✓ Render frontend is live" -ForegroundColor Green
} else {
    Write-Host "   ✗ Render frontend failed" -ForegroundColor Red
}

# Test 2: Backend API
Write-Host "2. Testing Backend API..." -ForegroundColor Cyan
$backend = Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -UseBasicParsing
if ($backend.StatusCode -eq 200) {
    Write-Host "   ✓ Backend API is responding" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend API failed" -ForegroundColor Red
}

# Test 3: CORS Headers
Write-Host "3. Testing CORS Configuration..." -ForegroundColor Cyan
$corsTest = Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -Method Options -UseBasicParsing
if ($corsTest.Headers["Access-Control-Allow-Origin"]) {
    Write-Host "   ✓ CORS headers present" -ForegroundColor Green
} else {
    Write-Host "   ⚠ CORS headers missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Yellow
```

---

## Common Issues and Solutions

### Issue 1: "vite: not found" Error
**Status**: ✅ FIXED
**Solution**: Moved vite to devDependencies and updated build command

### Issue 2: Node 18 EOL Warning
**Status**: ✅ FIXED
**Solution**: Upgraded to Node 20.x

### Issue 3: Deployment Still Building
**Solution**: Wait 5-10 minutes for initial build. Render free tier can be slow.

### Issue 4: 503 Service Unavailable
**Cause**: Free tier instance spinning down
**Solution**: Wait 50+ seconds for instance to wake up

### Issue 5: CORS Errors
**Check**: 
- Backend ALLOWED_ORIGINS includes frontend URL
- Frontend VITE_API_URL points to correct backend

---

## Success Criteria

### Deployment Success ✅
- [x] Code pushed to GitHub
- [ ] Render build completes without errors
- [ ] Vercel build completes without errors
- [ ] Both deployments show "Live" status

### Application Success ✅
- [ ] Frontend loads in browser
- [ ] No console errors
- [ ] All assets load correctly
- [ ] React app initializes

### Integration Success ✅
- [ ] Frontend can reach backend API
- [ ] CORS configured correctly
- [ ] Wallet connection works
- [ ] All features functional

---

## Next Steps After Testing

1. **If All Tests Pass:**
   - Document deployment URLs
   - Update README with live links
   - Create release notes
   - Monitor for 24 hours

2. **If Tests Fail:**
   - Review deployment logs
   - Check environment variables
   - Verify configuration files
   - Re-deploy if necessary

3. **Ongoing Monitoring:**
   - Set up uptime monitoring
   - Configure error tracking
   - Monitor performance metrics
   - Review logs regularly

---

## Deployment URLs

### Production URLs
- **Render Frontend**: https://alpha-orion.onrender.com
- **Render Backend**: https://arbinexus-backend.onrender.com
- **Vercel Frontend**: (To be assigned after deployment)

### Dashboard Links
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/TemamAb/alpha-orion

---

## Contact & Support

For deployment issues:
1. Check Render/Vercel status pages
2. Review deployment logs in dashboards
3. Check GitHub Actions (if configured)
4. Verify environment variables are set

**Note**: Free tier deployments may take 5-10 minutes for initial build and 50+ seconds to wake from sleep.
