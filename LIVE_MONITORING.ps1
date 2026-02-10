#!/usr/bin/env pwsh

# Alpha-Orion Live Profit Monitoring Dashboard
# Real-time profit generation tracking

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════════╗"
Write-Host "║                                                                                ║"
Write-Host "║              🚀 ALPHA-ORION LIVE PROFIT MONITORING DASHBOARD 🚀                ║"
Write-Host "║                                                                                ║"
Write-Host "║                   PIMLICO GASLESS + POLYGON ZKEVM + REAL PROFIT                ║"
Write-Host "║                                                                                ║"
Write-Host "╚════════════════════════════════════════════════════════════════════════════════╝"
Write-Host ""

$apiUrl = "http://localhost:8080"
$refreshInterval = 5  # seconds

$lastPnl = 0
$profitHistory = @()

function Get-ProfitMetrics {
  try {
    $response = Invoke-WebRequest -Uri "$apiUrl/mode/current" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    return $response.Content | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-OpportunitiesMetrics {
  try {
    $response = Invoke-WebRequest -Uri "$apiUrl/opportunities" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    return $response.Content | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-PnlMetrics {
  try {
    $response = Invoke-WebRequest -Uri "$apiUrl/analytics/total-pnl" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    return $response.Content | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-TradesMetrics {
  try {
    $response = Invoke-WebRequest -Uri "$apiUrl/trades/executed" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    return $response.Content | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Show-LiveDashboard {
  param(
    $mode,
    $opportunities,
    $pnl,
    $trades
  )
  
  Clear-Host
  
  Write-Host "╔════════════════════════════════════════════════════════════════════════════════╗"
  Write-Host "║                    ALPHA-ORION LIVE PROFIT DASHBOARD                          ║"
  Write-Host "║                        $(Get-Date -Format 'HH:mm:ss')                                         ║"
  Write-Host "╚════════════════════════════════════════════════════════════════════════════════╝"
  Write-Host ""
  
  if ($mode) {
    Write-Host "📊 SYSTEM STATUS" -ForegroundColor Cyan
    Write-Host "──────────────────────────────────────────────────────────────────────────────────"
    Write-Host "  Mode:              $($mode.mode)" -ForegroundColor Green
    Write-Host "  Status:            $($mode.status)" -ForegroundColor Green
    Write-Host "  Network:           $($mode.network)" -ForegroundColor Green
    Write-Host "  Bundler:           $($mode.bundler)" -ForegroundColor Green
    Write-Host "  Session Duration:  $($mode.sessionDuration)s" -ForegroundColor Green
    Write-Host ""
  }
  
  if ($pnl) {
    Write-Host "💰 PROFIT & LOSS TRACKING" -ForegroundColor Green
    Write-Host "──────────────────────────────────────────────────────────────────────────────────"
    
    $pnlColor = if ($pnl.totalPnL -gt 0) { "Green" } else { "Yellow" }
    Write-Host "  Total P&L:         $$($pnl.totalPnL)        ($(if ($pnl.totalPnL -gt $lastPnl) { '↑ INCREASING' } else { '→ stable' }))" -ForegroundColor $pnlColor
    Write-Host "  Realized Profit:   $$($pnl.realizedProfit)" -ForegroundColor Green
    Write-Host "  Unrealized Profit: $$($pnl.unrealizedProfit)" -ForegroundColor Yellow
    Write-Host "  Gas Saved:         $($pnl.gasSavings)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($pnl.totalPnL -gt $lastPnl) {
      Write-Host "   ✅ PROFIT INCREASE DETECTED: +$($pnl.totalPnL - $lastPnl)" -ForegroundColor Green
    }
  }
  
  if ($trades) {
    Write-Host "⚡ TRADE EXECUTION" -ForegroundColor Cyan
    Write-Host "──────────────────────────────────────────────────────────────────────────────────"
    Write-Host "  Total Trades:      $($trades.count)" -ForegroundColor Green
    Write-Host "  Confirmed:         $($trades.confirmed)" -ForegroundColor Green
    Write-Host "  Pending:           $($trades.pending)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($trades.confirmed -gt 0) {
      Write-Host "   ✅ LAST 5 EXECUTED TRADES:" -ForegroundColor Green
      foreach ($trade in $trades.trades | Select-Object -Last 5) {
        $status = if ($trade.confirmed) { "✅" } else { "⏳" }
        Write-Host "      $status Trade #$($trade.number | Select-Object -ExpandProperty ToString) | $($trade.pair) | Profit: \$$($trade.profit)" -ForegroundColor Gray
      }
    }
    Write-Host ""
  }
  
  if ($opportunities) {
    Write-Host "🔍 OPPORTUNITY DETECTION" -ForegroundColor Yellow
    Write-Host "──────────────────────────────────────────────────────────────────────────────────"
    Write-Host "  Active Opportunities: $($opportunities.count)" -ForegroundColor Yellow
    
    if ($opportunities.count -gt 0) {
      Write-Host "   Found opportunities:" -ForegroundColor Yellow
      foreach ($opp in $opportunities.opportunities | Select-Object -First 3) {
        Write-Host "      → $($opp.pair): \$$($opp.grossProfit)" -ForegroundColor Gray
      }
    }
    Write-Host ""
  }
  
  Write-Host "════════════════════════════════════════════════════════════════════════════════"
  Write-Host "  🎯 AUTO-WITHDRAWAL: Triggered at \$1000 threshold (Every 10 seconds)" -ForegroundColor Cyan
  Write-Host "  📈 Updating every $refreshInterval seconds | Press Ctrl+C to stop"
  Write-Host "════════════════════════════════════════════════════════════════════════════════"
}

# Main monitoring loop
Write-Host "⏳ Connecting to Alpha-Orion service at $apiUrl..." -ForegroundColor Yellow
Write-Host "   (Make sure to run: npm start in the service directory)" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2

while ($true) {
  $mode = Get-ProfitMetrics
  $opps = Get-OpportunitiesMetrics
  $pnl = Get-PnlMetrics
  $trades = Get-TradesMetrics
  
  if ($mode -and $pnl) {
    Show-LiveDashboard -mode $mode -opportunities $opps -pnl $pnl -trades $trades
    
    # Track profit changes
    if ($pnl.totalPnL -gt $lastPnl) {
      Write-Host ""
      Write-Host "🎉 PROFIT GENERATED!" -ForegroundColor Green
      Write-Host "   Previous: \$$lastPnl" -ForegroundColor Gray
      Write-Host "   Current:  \$$($pnl.totalPnL)" -ForegroundColor Green
      Write-Host "   Increase: +$($pnl.totalPnL - $lastPnl)" -ForegroundColor Green
      Write-Host ""
      
      # Log to file
      $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
      Add-Content -Path "alpha-orion-profit-log.txt" -Value "$timestamp | Profit: +$($pnl.totalPnL - $lastPnl) | Total: `$$($pnl.totalPnL)"
    }
    
    $lastPnl = $pnl.totalPnL
  } else {
    Write-Host "⏳ Waiting for service to start..." -ForegroundColor Yellow
    Write-Host "   Command: npm start (in backend-services/services/user-api-service)" -ForegroundColor Gray
  }
  
  Start-Sleep -Seconds $refreshInterval
}
