# Performance Testing Script
Write-Host "=== PERFORMANCE TESTING ===" -ForegroundColor Cyan
Write-Host ""

# Test response times for different endpoints
$endpoints = @(
    @{Name="Health Check"; Url="http://localhost:3001/health"; Method="GET"},
    @{Name="Readiness Probe"; Url="http://localhost:3001/ready"; Method="GET"},
    @{Name="Liveness Probe"; Url="http://localhost:3001/live"; Method="GET"}
)

$body = Get-Content test-request.json -Raw

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $($endpoint.Name)" -ForegroundColor Yellow
    
    $times = @()
    for ($i = 1; $i -le 10; $i++) {
        $start = Get-Date
        try {
            if ($endpoint.Method -eq "GET") {
                $response = Invoke-RestMethod -Uri $endpoint.Url -Method Get
            } else {
                $response = Invoke-RestMethod -Uri $endpoint.Url -Method Post -ContentType 'application/json' -Body $body
            }
            $end = Get-Date
            $duration = ($end - $start).TotalMilliseconds
            $times += $duration
        } catch {
            Write-Host "  Request $i failed" -ForegroundColor Red
        }
    }
    
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    
    Write-Host "  Average: $([math]::Round($avg, 2))ms" -ForegroundColor White
    Write-Host "  Min: $([math]::Round($min, 2))ms" -ForegroundColor Green
    Write-Host "  Max: $([math]::Round($max, 2))ms" -ForegroundColor $(if ($max -lt 200) { "Green" } else { "Yellow" })
    Write-Host ""
}

# Test Gemini API endpoint
Write-Host "Testing: Gemini API Proxy" -ForegroundColor Yellow
$times = @()
for ($i = 1; $i -le 5; $i++) {
    $start = Get-Date
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Post -ContentType 'application/json' -Body $body
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        $times += $duration
    } catch {
        Write-Host "  Request $i failed" -ForegroundColor Red
    }
    Start-Sleep -Seconds 12  # Wait to avoid rate limit
}

$avg = ($times | Measure-Object -Average).Average
$min = ($times | Measure-Object -Minimum).Minimum
$max = ($times | Measure-Object -Maximum).Maximum

Write-Host "  Average: $([math]::Round($avg, 2))ms" -ForegroundColor White
Write-Host "  Min: $([math]::Round($min, 2))ms" -ForegroundColor Green
Write-Host "  Max: $([math]::Round($max, 2))ms" -ForegroundColor $(if ($max -lt 500) { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "=== PERFORMANCE TEST COMPLETE ===" -ForegroundColor Cyan
