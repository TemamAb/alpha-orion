#!/usr/bin/env pwsh

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Host "║                                                                               ║"
Write-Host "║                  🚀 ALPHA-ORION PROFIT GENERATION ACTIVATION                  ║"
Write-Host "║                                                                               ║"
Write-Host "║              PIMLICO GASLESS MODE + POLYGON ZKEVM + AUTO-WITHDRAW             ║"
Write-Host "║                                                                               ║"
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝"
Write-Host ""

# Step 1: Fetch Pimlico API Key
Write-Host "📦 Step 1: Fetching Pimlico API Key from GCP Secret Manager..." -ForegroundColor Cyan
try {
  $pimlicoKey = & gcloud secrets versions access latest --secret="pimlico-api-key" 2>$null
  if (-not $pimlicoKey) {
    Write-Host "❌ FATAL: Pimlico API key not found in GCP Secret Manager." -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "❌ FATAL: Could not access GCP Secret Manager." -ForegroundColor Red
  exit 1
}

Write-Host "✅ Pimlico API Key ready: pim_***$($pimlicoKey.Substring($pimlicoKey.Length - 10))" -ForegroundColor Green
Write-Host ""

# Step 2: Configuration
Write-Host "⚙️  Step 2: Setting Configuration..." -ForegroundColor Cyan
$env:PIMLICO_API_KEY = $pimlicoKey
$env:DEPLOY_MODE = "production"
$env:NETWORK = "polygon-zkevm"
$env:AUTO_WITHDRAWAL_THRESHOLD_USD = "1000"
$env:MIN_PROFIT_USD = "100"
$env:NODE_ENV = "production"

Write-Host "✅ Configuration:" -ForegroundColor Green
Write-Host "   Mode: Production (Gasless)"
Write-Host "   Network: Polygon zkEVM"
Write-Host "   Auto-Withdraw: `$1000 threshold"
Write-Host "   Min Profit: `$100"
Write-Host "   Gas Cost: `$0.00 (Pimlico Paymaster)"
Write-Host ""

# Step 3: Install Dependencies
Write-Host "📥 Step 3: Installing Dependencies..." -ForegroundColor Cyan
Push-Location "backend-services/services/user-api-service"
npm install | Out-Null
Pop-Location
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Start Services
Write-Host "🚀 Step 4: Starting Services..." -ForegroundColor Cyan
Write-Host ""

Write-Host "  [1/2] User API Service (Port 8080)..." -ForegroundColor Yellow
Push-Location "backend-services/services/user-api-service"
$apiProcess = Start-Process node -ArgumentList "src/index.js" -PassThru -WindowStyle Hidden
Write-Host "  ✅ Started (PID: $($apiProcess.Id))" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host "  [2/2] Withdrawal Service (Port 8081)..." -ForegroundColor Yellow
Push-Location "../withdrawal-service"
npm install | Out-Null
$withdrawalProcess = Start-Process node -ArgumentList "src/index.js" -PassThru -WindowStyle Hidden
Pop-Location
Pop-Location
Write-Host "  ✅ Started (PID: $($withdrawalProcess.Id))" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗"
Write-Host "║                                                                               ║"
Write-Host "║                   ✅ PROFIT GENERATION MODE ACTIVE                            ║"
Write-Host "║                                                                               ║"
Write-Host "║              Pimlico Gasless + Polygon zkEVM + Zero Gas Fees                  ║"
Write-Host "║                                                                               ║"
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝"
Write-Host ""

Write-Host "📊 LIVE MONITORING COMMANDS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check Current P&L & Mode:"
Write-Host "  curl http://localhost:8080/mode/current | jq ."
Write-Host ""
Write-Host "Check Active Opportunities:"
Write-Host "  curl http://localhost:8080/opportunities | jq '.count'"
Write-Host ""
Write-Host "Check Real-Time Profit:"
Write-Host "  curl http://localhost:8080/analytics/total-pnl | jq ."
Write-Host ""
Write-Host "Check Pimlico Status:"
Write-Host "  curl http://localhost:8080/pimlico/status | jq ."
Write-Host ""
Write-Host "Check Withdrawal History:"
Write-Host "  curl http://localhost:8081/withdrawals | jq ."
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "⏱️  SYSTEM STATUS:" -ForegroundColor Cyan
Write-Host "   User API Service: http://localhost:8080 (PID: $($apiProcess.Id))"
Write-Host "   Withdrawal Service: http://localhost:8081 (PID: $($withdrawalProcess.Id))"
Write-Host "   Mode: GASLESS (Pimlico ERC-4337)"
Write-Host "   Network: Polygon zkEVM"
Write-Host "   Gas Cost: `$0.00 per transaction"
Write-Host ""

Write-Host "💰 AUTO-WITHDRAWAL CONFIGURED:" -ForegroundColor Green
Write-Host "   Threshold: `$1000"
Write-Host "   Method: Gasless (Pimlico Paymaster)"
Write-Host "   Check Frequency: Every 10 seconds"
Write-Host ""

Write-Host "📈 PROFIT GENERATION LOOP:" -ForegroundColor Green
Write-Host "   Opportunity Scan: Every 30 seconds"
Write-Host "   Trade Execution: When profit > `$100"
Write-Host "   Trade Confirmation: Every 60 seconds"
Write-Host "   Auto-Withdrawal: When profit ≥ `$1000"
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 TO MONITOR IN REAL-TIME:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Use curl (recommended)"
Write-Host "  while (`$true) { Clear-Host; curl -s http://localhost:8080/mode/current | jq .; Start-Sleep 10 }"
Write-Host ""
Write-Host "Option 2: Watch logs"
Write-Host "  Get-Process -Name node | ForEach-Object { Get-Process -Id `$_.Id }"
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "⏸️  TO STOP PROFIT GENERATION:" -ForegroundColor Yellow
Write-Host "   Stop-Process -Id $($apiProcess.Id)"
Write-Host "   Stop-Process -Id $($withdrawalProcess.Id)"
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ SYSTEM READY FOR PROFIT GENERATION" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Monitor opportunities: curl http://localhost:8080/opportunities | jq .count"
Write-Host "   2. Watch profits accumulate: curl http://localhost:8080/analytics/total-pnl | jq ."
Write-Host "   3. Withdrawals at \$1000: curl http://localhost:8081/withdrawals | jq ."
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Keep script window open and show live monitoring
Write-Host "📊 LIVE PROFIT MONITOR (Updates every 10 seconds):" -ForegroundColor Cyan
Write-Host ""

while ($true) {
  try {
    $modeData = curl -s http://localhost:8080/mode/current | ConvertFrom-Json
    $pnlData = curl -s http://localhost:8080/analytics/total-pnl | ConvertFrom-Json
    
    Write-Host "⏰ $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
    Write-Host "   P&L: `$$($pnlData.realPnL) | Trades: $($pnlData.realTrades) | Opportunities: $($modeData.realOpportunitiesFound)"
    Write-Host ""
  } catch {
    Write-Host "   Waiting for services to start..." -ForegroundColor Gray
  }
  
  Start-Sleep -Seconds 10
}
