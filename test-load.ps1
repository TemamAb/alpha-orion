# Load Testing Script - 50 concurrent requests
$body = Get-Content test-request.json -Raw
$jobs = @()

Write-Host "Starting Load Test - 50 concurrent requests..." -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Launch 50 concurrent requests
for ($i = 1; $i -le 50; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url, $body, $id)
        try {
            $response = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 30
            return @{
                Id = $id
                Success = $true
                Strategies = $response.strategies.Count
            }
        } catch {
            return @{
                Id = $id
                Success = $false
                Error = $_.Exception.Message
            }
        }
    } -ArgumentList 'http://localhost:3001/api/forge-alpha', $body, $i
    
    if ($i % 10 -eq 0) {
        Write-Host "Launched $i requests..." -ForegroundColor Yellow
    }
}

Write-Host "Waiting for all requests to complete..." -ForegroundColor Yellow
$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "=== LOAD TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "Total Requests: 50" -ForegroundColor White
Write-Host "Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor White
Write-Host "Throughput: $([math]::Round(50/$duration, 2)) req/s" -ForegroundColor White
Write-Host ""

$successful = ($results | Where-Object { $_.Success -eq $true }).Count
$failed = ($results | Where-Object { $_.Success -eq $false }).Count

Write-Host "Successful: $successful" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($successful/50)*100, 2))%" -ForegroundColor $(if ($successful -ge 45) { "Green" } else { "Yellow" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Failed Requests:" -ForegroundColor Red
    $results | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "  Request $($_.Id): $($_.Error)" -ForegroundColor Red
    }
}
