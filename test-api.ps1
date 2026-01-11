$body = Get-Content test-request.json -Raw
$response = Invoke-RestMethod -Uri 'http://localhost:3001/api/forge-alpha' -Method Post -ContentType 'application/json' -Body $body
$response | ConvertTo-Json -Depth 10
