# Error Propagation Testing
Write-Host "=== ERROR PROPAGATION TESTING ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Invalid JSON
Write-Host "Test 1: Invalid JSON payload" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Post -ContentType 'application/json' -Body '{"invalid": json}' -ErrorAction Stop
    Write-Host "FAIL - Should have returned error" -ForegroundColor Red
} catch {
    Write-Host "PASS - Error caught: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
Write-Host ""

# Test 2: Missing required field
Write-Host "Test 2: Missing marketContext field" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Post -ContentType 'application/json' -Body '{"wrongField": "value"}' -ErrorAction Stop
    Write-Host "FAIL - Should have returned validation error" -ForegroundColor Red
} catch {
    Write-Host "PASS - Validation error caught: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
Write-Host ""

# Test 3: Empty body
Write-Host "Test 3: Empty request body" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Post -ContentType 'application/json' -Body '{}' -ErrorAction Stop
    Write-Host "FAIL - Should have returned validation error" -ForegroundColor Red
} catch {
    Write-Host "PASS - Validation error caught: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
Write-Host ""

# Test 4: Wrong HTTP method
Write-Host "Test 4: Wrong HTTP method (GET instead of POST)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Get -ErrorAction Stop
    Write-Host "FAIL - Should have returned method not allowed" -ForegroundColor Red
} catch {
    Write-Host "PASS - Method error caught: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
Write-Host ""

# Test 5: Non-existent endpoint
Write-Host "Test 5: Non-existent endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/nonexistent' -Method Get -ErrorAction Stop
    Write-Host "FAIL - Should have returned 404" -ForegroundColor Red
} catch {
    Write-Host "PASS - 404 error caught: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
Write-Host ""

Write-Host "=== ERROR PROPAGATION TEST COMPLETE ===" -ForegroundColor Cyan
