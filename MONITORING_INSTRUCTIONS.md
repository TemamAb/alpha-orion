# 📊 ALPHA-ORION LIVE MONITORING & PROFIT TRACKING

## 🎯 HOW TO MONITOR PROFIT GENERATION IN REAL-TIME

### Step 1: Start the Production Service

**Terminal 1 (Service):**
```bash
cd backend-services/services/user-api-service
npm start
```

Expected output:
```
╔═══════════════════════════════════════════════════════════════╗
║      🚀 ALPHA-ORION PRODUCTION DEPLOYMENT 🚀                 ║
║     PIMLICO GASLESS + POLYGON ZKEVM + REAL PROFIT             ║
╚═══════════════════════════════════════════════════════════════╝

🔐 [INIT] Fetching Pimlico API key from GCP Secret Manager...
✅ Pimlico API Key loaded: pim_***xxxxx
✅ Mode: PRODUCTION ONLY
✅ Network: Polygon zkEVM (Real)

⏰ [SESSION] Production profit generation session started
```

---

### Step 2: Start the Monitoring Dashboard

**Terminal 2 (Monitoring):**

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File LIVE_MONITORING.ps1
```

**macOS/Linux (Bash):**
```bash
bash LIVE_MONITORING.sh
```

This will show a LIVE dashboard that updates every 5 seconds.

---

## 📈 WHAT YOU'LL SEE

### Dashboard Display

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                    ALPHA-ORION LIVE PROFIT DASHBOARD                          ║
║                        14:32:45                                               ║
╚════════════════════════════════════════════════════════════════════════════════╝

📊 SYSTEM STATUS
──────────────────────────────────────────────────────────────────────────────────
  Mode:              GASLESS_VIA_PIMLICO
  Status:            PROFIT_GENERATION_ACTIVE
  Network:           Polygon zkEVM
  Bundler:           Pimlico (REAL)
  Session Duration:  120s

💰 PROFIT & LOSS TRACKING
──────────────────────────────────────────────────────────────────────────────────
  Total P&L:         $1,245       (↑ INCREASING)
  Realized Profit:   $850
  Unrealized Profit: $395
  Gas Saved:         $0.00

   ✅ PROFIT INCREASE DETECTED: +$45

⚡ TRADE EXECUTION
──────────────────────────────────────────────────────────────────────────────────
  Total Trades:      12
  Confirmed:         10
  Pending:           2

   ✅ LAST 5 EXECUTED TRADES:
      ✅ Trade #8 | WETH/USDC | Profit: $245
      ✅ Trade #9 | USDC/DAI | Profit: $65
      ⏳ Trade #10 | ETH/USDT | Profit: $180
      ⏳ Trade #11 | USDC/USDT | Profit: $45

🔍 OPPORTUNITY DETECTION
──────────────────────────────────────────────────────────────────────────────────
  Active Opportunities: 3
   Found opportunities:
      → WETH/USDC: $325
      → USDC/DAI: $85
      → ETH/USDT: $210

════════════════════════════════════════════════════════════════════════════════
  🎯 AUTO-WITHDRAWAL: Triggered at $1000 threshold (Every 10 seconds)
  📈 Updating every 5 seconds | Press Ctrl+C to stop
════════════════════════════════════════════════════════════════════════════════
```

---

## 🔄 WHAT HAPPENS AUTOMATICALLY

### Every 30 Seconds:
```
⏰ [SCANNER] 14:32:15 - REAL opportunity scan...
   ✅ Found 2 REAL opportunities
```

### When Profit > $100:
```
💹 [TRADE #1] REAL EXECUTION via Pimlico
   Pair: WETH/USDC
   Gross Profit: $325
   Pimlico Fee: $6 (2%)
   Net Profit: $319 ✅
   Gas Cost: $0.00 (Pimlico Paymaster)
   User Op: 0x...
   Status: SUBMITTED TO POLYGON ZKEVM
```

### Every 60 Seconds:
```
✅ [CONFIRMATION] 14:33:15 - Confirming REAL trades...
   Trade #1 (WETH/USDC): $319 CONFIRMED ON-CHAIN
   Block: #17250845
   Real P&L: $2,450
```

### Every 10 Seconds:
```
💰 [AUTO-WITHDRAW] 14:32:25 - WITHDRAWAL TRIGGERED!
   Threshold: $1000 REACHED
   Available: $1,245
   Status: Executing GASLESS withdrawal via Pimlico...
   User Op: 0x...
   Gas Cost: $0.00 (Pimlico)
   Network: Polygon zkEVM
   ✅ WITHDRAWAL CONFIRMED ON-CHAIN
```

### Every 20 Seconds:
```
📊 [LIVE REPORT] 14:32:35
   Session Duration: 120s
   Total P&L: $1,245
   Realized Profit: $850
   Unrealized Profit: $395
   Trades Executed: 12
   Trades Confirmed: 10
   Avg Profit/Trade: $125
   Gas Saved: $0.00 (100% gasless)
   Active Opportunities: 3
   Network: Polygon zkEVM
   Bundler: Pimlico (REAL)
```

---

## 💡 INTERPRETING THE METRICS

### Total P&L
- Shows cumulative profit
- Updates as trades are confirmed
- Indicates overall session performance

### Realized vs Unrealized
- **Realized**: Confirmed on-chain (final)
- **Unrealized**: Pending confirmation
- Sum = Total P&L

### Active Opportunities
- Real arbitrage opportunities detected
- Gets scanned every 30 seconds
- Shows pair and potential profit

### Auto-Withdrawal
- Triggered automatically at $1000
- Zero gas fees (Pimlico)
- Resets profit counter after withdrawal
- Happens in background

### Gas Saved
- Shows total ETH saved due to gasless mode
- Always $0.00 because Pimlico pays
- Example: 10 trades × $50 each = $500 saved

---

## 📊 ADDITIONAL MONITORING COMMANDS

### Check Current P&L (Manual)
```bash
curl http://localhost:8080/mode/current | jq .
```

Output:
```json
{
  "mode": "GASLESS_VIA_PIMLICO",
  "realPnL": 2450,
  "realTrades": 12,
  "realOpportunitiesFound": 3
}
```

### Check Opportunities
```bash
curl http://localhost:8080/opportunities | jq .
```

### Check Profit History
```bash
curl http://localhost:8080/analytics/total-pnl | jq .
```

### Check All Executed Trades
```bash
curl http://localhost:8080/trades/executed | jq .
```

### Check Pimlico Status
```bash
curl http://localhost:8080/pimlico/status | jq .
```

---

## 📁 PROFIT LOG FILE

The monitoring dashboard automatically creates a profit log:

**File**: `alpha-orion-profit-log.txt`

**Contents**:
```
2026-01-23 14:32:15 | Profit: +45 | Total: $1245
2026-01-23 14:32:30 | Profit: +125 | Total: $1370
2026-01-23 14:32:45 | Profit: +65 | Total: $1435
2026-01-23 14:33:00 | Profit: +45 | Total: $1480
2026-01-23 14:33:15 | Profit: +180 | Total: $1660
```

You can tail this file to see new profits as they're generated:

**Windows (PowerShell):**
```powershell
Get-Content alpha-orion-profit-log.txt -Tail 10 -Wait
```

**macOS/Linux:**
```bash
tail -f alpha-orion-profit-log.txt
```

---

## 🎯 MONITORING WORKFLOW

### To Monitor Profit Generation:

**Terminal 1:** Start the service
```bash
npm start
```

**Terminal 2:** Start the live dashboard
```powershell
powershell -ExecutionPolicy Bypass -File LIVE_MONITORING.ps1
```

**Terminal 3 (Optional):** Watch the profit log
```bash
tail -f alpha-orion-profit-log.txt
```

---

## ✅ EXPECTED BEHAVIOR

### System Startup (First 30 seconds)
- Service initializes
- Fetches Pimlico API key from GCP
- Connects to Polygon zkEVM
- Ready for opportunity scanning

### First Scan (30 seconds)
```
⏰ [SCANNER] Finding opportunities...
   ✅ Found X opportunities
```

### First Trade (If opportunity > $100)
```
💹 [TRADE #1] Executing via Pimlico...
   ✅ SUBMITTED
```

### First Confirmation (60 seconds)
```
✅ [CONFIRMATION] Trade confirmed on-chain
   Real P&L: $XXX
```

### Continuous Loop
- Scan every 30s
- Execute when profitable
- Confirm every 60s
- Auto-withdraw at $1000
- Report every 20s

---

## 🚨 ERROR HANDLING

### Service Won't Start
- Verify GCP authentication: `gcloud auth application-default login`
- Check Pimlico secret exists: `gcloud secrets versions access latest --secret="pimlico-api-key"`
- Ensure port 8080 is available

### Dashboard Shows "Waiting for service"
- Service not started yet
- Give it 5-10 seconds to initialize
- Check service terminal for errors

### No Opportunities Found
- Normal - arbitrage is market-dependent
- Scan runs every 30 seconds
- Will find opportunities when market conditions are right

### Auto-Withdrawal Fails
- Might be low balance
- Check gas costs
- Will retry on next check (10 seconds)

---

## 🎉 SUCCESS INDICATORS

✅ **System Ready**: Service logs show initialization complete  
✅ **Scanning Active**: Dashboard shows opportunities > 0  
✅ **Trades Executing**: Trade counter increasing  
✅ **Confirmed**: Confirmed count increasing  
✅ **Profit Growing**: Total P&L > 0  
✅ **Auto-Withdraw**: At $1000 threshold, withdrawal executes  

---

## 📞 SUMMARY

**To monitor profits in real-time:**

1. Run service: `npm start`
2. Run dashboard: `LIVE_MONITORING.ps1` (Windows) or `LIVE_MONITORING.sh` (Mac/Linux)
3. Watch profits accumulate in real-time
4. Dashboard updates every 5 seconds
5. Profits logged to `alpha-orion-profit-log.txt`

**That's it!** System handles everything automatically. 🚀
