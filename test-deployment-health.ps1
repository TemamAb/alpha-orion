# Alpha Orion Deployment Health Check
# Tests both Render and Vercel deployments

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Alpha Orion Deployment Health Check  " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Test 1: Render Frontend
Write-Host "[1/4] Testing Render Frontend..." -ForegroundColor Cyan
try {
    $frontend = Invoke-WebRequest -Uri "https://alpha-orion.onrender.com" -UseBasicParsing -TimeoutSec 60
    Write-Host "      ✓ Status: $($frontend.StatusCode)" -ForegroundColor Green
    Write-Host "      ✓ Content-Type: $($frontend.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "      ✓ Content-Length: $($frontend.Content.Length) bytes" -ForegroundColor Green
}
catch {
    Write-Host "      ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*503*") {
        Write-Host "      ℹ Free tier instance may be spinning up (wait 50+ seconds)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 2: Backend API Health
Write-Host "[2/4] Testing Backend API..." -ForegroundColor Cyan
try {
    $backend = Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -UseBasicParsing -TimeoutSec 60
    Write-Host "      ✓ Status: $($backend.StatusCode)" -ForegroundColor Green
    Write-Host "      ✓ Response: $($backend.Content)" -ForegroundColor Green
}
catch {
    Write-Host "      ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: CORS Configuration
Write-Host "[3/4] Testing CORS Configuration..." -ForegroundColor Cyan
try {
    $headers = @{
        'Origin' = 'https://alpha-orion.onrender.com'
    }
    $corsTest = Invoke-WebRequest -Uri "https://arbinexus-backend.onrender.com/health" -Headers $headers -UseBasicParsing -TimeoutSec 30
    
    if ($corsTest.Headers['Access-Control-Allow-Origin']) {
        Write-Host "      ✓ CORS Origin: $($corsTest.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    }
    else {
        Write-Host "      ⚠ CORS headers not found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "      ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Response Time
Write-Host "[4/4] Testing Response Time..." -ForegroundColor Cyan
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "https://alpha-orion.onrender.com" -UseBasicParsing -TimeoutSec 30
    $stopwatch.Stop()
    
    $responseTime = $stopwatch.ElapsedMilliseconds
    if ($responseTime -lt 3000) {
        Write-Host "      ✓ Response Time: $responseTime ms (Good)" -ForegroundColor Green
    }
    elseif ($responseTime -lt 10000) {
        Write-Host "      ⚠ Response Time: $responseTime ms (Acceptable)" -ForegroundColor Yellow
    }
    else {
        Write-Host "      ⚠ Response Time: $responseTime ms (Slow)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "      ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "           Health Check Complete        " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open https://alpha-orion.onrender.com in browser" -ForegroundColor White
Write-Host "  2. Check browser console for errors (F12)" -ForegroundColor White
Write-Host "  3. Test wallet connection functionality" -ForegroundColor White
Write-Host "  4. Verify all features work correctly" -ForegroundColor White
Write-Host ""
