$body = Get-Content test-request.json -Raw

Write-Host "Testing Rate Limiting - Making 6 requests rapidly..."
Write-Host ""

for ($i = 1; $i -le 6; $i++) {
    Write-Host "Request $i..."
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Post -ContentType 'application/json' -Body $body
        Write-Host "Success - Got $($response.strategies.Count) strategies" -ForegroundColor Green
    } catch {
        Write-Host "Failed - Rate limited or error" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}
