# PRE-DEPLOYMENT CHECKLIST

## ⚠️ REAL MONEY TRADING - VERIFY EVERYTHING

---

## ✅ API KEYS (30 minutes)

### Infura RPC
- [ ] Account created at https://infura.io
- [ ] Ethereum Mainnet project created
- [ ] Project URL copied: `https://mainnet.infura.io/v3/{KEY}`
- [ ] URL tested (responds to JSON-RPC calls)

### 1inch API
- [ ] Account created at https://api.1inch.io
- [ ] API key generated
- [ ] API key tested (successful quote response)

### Etherscan API
- [ ] Account created at https://etherscan.io
- [ ] API key generated
- [ ] API key tested (successful tx lookup)

---

## ✅ HOT WALLET (15 minutes)

### Create New Wallet
- [ ] New wallet generated (NOT existing wallet)
- [ ] Wallet address noted: `0x...`

### Wallet Funding
- [ ] No initial funding required (Gasless Mode Active)

---

## ✅ CONFIGURATION (.env file)

### Create .env File
- [ ] File created in project root
- [ ] Not added to .env (checked .gitignore)

### Required Variables
- [ ] ETHEREUM_RPC_URL = correct URL with your Infura key
- [ ] ONE_INCH_API_KEY = your actual API key (not placeholder)
- [ ] ETHERSCAN_API_KEY = your actual API key (not placeholder)
- [ ] EXECUTION_WALLET_ADDRESS = 0x{your_address} (hex format)

### Optional Variables
- [ ] AUTO_WITHDRAWAL_THRESHOLD_USD = 1000 (or your amount)
- [ ] MIN_PROFIT_USD = 100 (or your minimum)
- [ ] PORT = 8080 (or your port)

### Validation
- [ ] All variables filled in (no placeholders)
- [ ] Addresses in correct format (0x followed by 40 hex chars)

---

## ✅ INSTALLATION

### Dependencies
- [ ] `npm install` completed successfully
- [ ] No error messages during installation
- [ ] node_modules directory created

### Code Review
- [ ] Reviewed user-api-service/src/index.js
- [ ] Reviewed withdrawal-service/src/index.js
- [ ] No mock data functions found
- [ ] Real API calls present
- [ ] Error handling in place

---

## ✅ STARTUP TEST

### First Start
- [ ] Service starts without errors
- [ ] Shows: "✅ REAL PRODUCTION API RUNNING"
- [ ] Shows: "🎯 MODE: PRODUCTION ONLY (NO MOCKS)"
- [ ] Shows: "⚠️ TRADING REAL MONEY ON MAINNET"
- [ ] Port 8080 accessible (no bind errors)

### No Startup Errors
- [ ] No "MODULE_NOT_FOUND" errors
- [ ] No "FATAL" errors during initialization
- [ ] All environment variables accepted
- [ ] No crashes on startup

---

## ✅ API HEALTH CHECK (5 minutes)

### Health Endpoint
```bash
curl http://localhost:8080/health | jq .
```
- [ ] Returns status: "ok"
- [ ] Shows mode: "REAL_PRODUCTION_ONLY"
- [ ] Shows RPC configured: true

### Opportunities Endpoint
```bash
curl http://localhost:8080/opportunities | jq .
```
- [ ] Returns JSON response
- [ ] Has "count" field
- [ ] Has "opportunities" array
- [ ] May be 0 (market dependent)

### Mode Endpoint
```bash
curl http://localhost:8080/mode/current | jq .
```
- [ ] Shows mode: "REAL_PRODUCTION_ONLY"
- [ ] Shows last scan timestamp
- [ ] Shows trader counts (executed, confirmed)

### Wallet Balance (Port 8081)
```bash
curl http://localhost:8081/wallet | jq .
```
- [ ] Shows balance > 0 (your real USDC balance)
- [ ] Shows wallet address matches your address
- [ ] Shows symbol: "USDC"

---

## ✅ SAFETY CHECKS

### Private Key Security
- [ ] .env file is in .gitignore

### API Keys Security
- [ ] API keys never logged to console
- [ ] API keys only sent to authorized endpoints
- [ ] Never visible in responses

### No Fallbacks
- [ ] If API fails, system shows error
- [ ] No fake/mock data returned on error
- [ ] No "fallback" function calls
- [ ] Errors are explicit and visible

---

## ✅ MARKET CONDITIONS

### Check Current Markets
- [ ] Open Uniswap: https://app.uniswap.org
- [ ] Check WETH/USDC spread
- [ ] Check USDC/DAI spread
- [ ] Check DAI/USDT spread
- [ ] Note: If spreads < 0.5%, may have 0 opportunities

### Check Network
- [ ] Open Etherscan: https://etherscan.io
- [ ] Check current gas prices
- [ ] Note: High gas prices reduce profit margins

---

## ✅ MONITORING SETUP (Optional)

### Terminal Window 1: Service Logs
```bash
cd /path/to/alpha-orion
npm start
```
- [ ] Watch for "[SCANNER]" messages every 30 seconds
- [ ] Watch for "[EXECUTOR]" messages when trades execute
- [ ] Watch for "[AUTO-WITHDRAW]" when threshold reached

### Terminal Window 2: Live Monitor
```bash
#!/bin/bash
while true; do
  echo "=== $(date) ==="
  curl -s http://localhost:8080/mode/current | jq .
  sleep 10
done
```
- [ ] Monitor runs without errors
- [ ] Updates every 10 seconds
- [ ] Shows current P&L, trades, opportunities

### Terminal Window 3: Alerts (Optional)
- [ ] Set up Slack webhook alerts
- [ ] Set up email alerts on withdrawal
- [ ] Set up error alerts

---

## ✅ TEST WITHDRAWAL (CRITICAL)

### Test with Small Amount
- [ ] First withdrawal: $10-$50 USDC
- [ ] Execute withdrawal
- [ ] Get transaction hash
- [ ] Verify on Etherscan: https://etherscan.io/tx/{TXHASH}
- [ ] Confirm transaction status: "Success"
- [ ] Confirm tokens received in destination wallet

### Verify Auto-Withdrawal Settings
```bash
curl http://localhost:8081/auto-withdrawal | jq .
```
- [ ] Settings show your configured threshold
- [ ] Threshold is $1000 (or your amount)
- [ ] Address is correct destination wallet

---

## ✅ DOCUMENTATION READ

- [ ] Read: SUMMARY_ALL_MOCKS_REMOVED.md (overview)
- [ ] Read: FATAL_ISSUES_FIXED.md (what was wrong)
- [ ] Read: START_REAL_PRODUCTION.md (detailed steps)
- [ ] Read: PRODUCTION_REAL_ONLY.md (complete guide)
- [ ] Understand all warning sections

---

## ✅ TEAM COMMUNICATION

- [ ] Brief team on system behavior
- [ ] Explain arbitrage is not guaranteed
- [ ] Show emergency stop procedure
- [ ] Establish monitoring schedule
- [ ] Setup escalation procedures
- [ ] Document withdrawal address

---

## ✅ EMERGENCY PROCEDURES TESTED

### Kill Service
- [ ] `killall node` stops service
- [ ] Service restarts cleanly
- [ ] No data corruption

### Emergency Withdrawal
```bash
curl -X POST http://localhost:8081/withdraw \
  -H "Content-Type: application/json" \
  -d '{"mode":"manual","amount":999999,"address":"0x..."}'
```
- [ ] Command executes
- [ ] Transaction broadcast
- [ ] Funds received

### Verify on Blockchain
- [ ] All test transactions visible on Etherscan
- [ ] All confirmations received
- [ ] All balances correct

---

## ✅ FINAL SIGN-OFF

### Before Going Live with Real Capital

- [ ] ALL boxes above are checked ✅
- [ ] No environment variables missing
- [ ] Wallet created and verified
- [ ] API keys tested working
- [ ] Service runs without errors
- [ ] Health checks pass
- [ ] Test withdrawal successful
- [ ] Emergency procedures working
- [ ] Documentation read and understood
- [ ] Team briefed on risks

### Deployment Authorization

- [ ] Project Lead: _________________ Date: _______
- [ ] Security Review: ______________ Date: _______
- [ ] Operations: ___________________ Date: _______

---

## 🚀 READY TO DEPLOY

When ALL checkboxes above are checked:

```bash
npm start
```

System will:
1. Scan for real opportunities (every 30 seconds)
2. Execute real trades (on real blockchain)
3. Track real P&L (confirmed on blockchain)
4. Auto-withdraw at $1000 (real USDC transfer)
5. Log all activity (visible on Etherscan)

---

## ⚠️ FINAL REMINDERS

- **Real money** at stake on **mainnet**
- **No simulation** - everything is real
- **No mocks** - all data from blockchain
- **No fallbacks** - errors are visible
- **Monitor continuously** - for first week
- **Have exit plan** - know when to stop
- **Expect variability** - profits not guaranteed

---

**All items checked? You're ready for production.**

**Good luck! 🚀**
