# Alpha-Orion Production Mode: Quick Reference

## 🎯 Core Commands

### Start Production
```bash
# Setup
cp .env.production .env.local
nano .env.local  # Configure with your values

# Deploy smart contract
cd backend-services/services/flash-loan-executor
npx hardhat run scripts/deploy.js --network mainnet

# Start services
cd ../../..
./start-production.sh
```

### Check Status
```bash
# Current mode
curl http://localhost:3001/mode/current | jq .

# Executed trades
curl http://localhost:3001/trades/executed | jq .

# Wallet balance
curl http://localhost:3008/wallet | jq .

# Service health
curl http://localhost:3001/health
curl http://localhost:3008/health
```

### Frontend
```
http://localhost:3000
```

---

## 🔑 Essential Configuration

### .env.local must have:
```env
DEPLOY_MODE=production
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...                    # Hot wallet private key
ONE_INCH_API_KEY=...                 # For price discovery
ETHERSCAN_API_KEY=...                # For TX verification
```

---

## 💰 Withdrawal Commands

### Manual Withdrawal
```bash
curl -X POST http://localhost:3008/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "mode":"manual",
    "amount":1000,
    "address":"0x{destination_address}"
  }' | jq .
```

### Auto-Withdrawal Setup
```bash
curl -X POST http://localhost:3008/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "mode":"auto",
    "threshold":5000,
    "address":"0x{destination_address}"
  }' | jq .
```

### Check Wallet Balance
```bash
curl http://localhost:3008/wallet | jq .
```

### Check Withdrawal History
```bash
curl http://localhost:3008/withdrawals | jq .
```

### Estimate Gas
```bash
curl http://localhost:3008/estimate-gas/1000/0x{address} | jq .
```

---

## 📊 Production Metrics

### Get Current PnL
```bash
curl http://localhost:3001/analytics/total-pnl | jq .
# Response:
# {
#   "totalPnl": 172295.09,
#   "totalTrades": 8875,
#   "realizedProfit": 125000,
#   "unrealizedProfit": 47295.09,
#   "executedTrades": 234,
#   "mode": "PRODUCTION"
# }
```

### Get Executed Trades
```bash
curl http://localhost:3001/trades/executed | jq .
# Shows last 20 executed trades with:
# - txHash
# - profit
# - timestamp
# - status (confirmed/pending)
```

### Get Active Opportunities
```bash
curl http://localhost:3001/opportunities | jq .
# Real arbitrage opportunities found by scanner
```

---

## 🚨 Emergency Procedures

### Stop Trading Immediately
```bash
curl -X POST http://localhost:3001/mode/switch \
  -H "Content-Type: application/json" \
  -d '{"newMode":"live-simulation"}'
```

### Emergency Withdrawal
```bash
curl -X POST http://localhost:3008/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "mode":"manual",
    "amount":999999,
    "address":"0x{your_safe_address}"
  }'
```

### Kill All Services
```bash
./stop-production.sh
```

---

## 🔍 Monitoring

### Live Logs
```bash
tail -f logs/user-api.log
tail -f logs/withdrawal.log
tail -f logs/frontend.log
```

### Blockchain Verification
```bash
# Get your wallet address
curl http://localhost:3008/wallet | jq .address

# View on Etherscan
https://etherscan.io/address/{YOUR_ADDRESS}
```

### Check Specific Transaction
```bash
curl http://localhost:3008/withdrawal/{txHash} | jq .
# Returns: status, blockNumber, blockTimestamp, gasUsed
```

---

## 📈 Real-Time Indicators

### Mode Status (in Frontend)
- 🔴 Red box = **PRODUCTION MODE** (Real money)
- 🔵 Blue box = **LIVE-SIMULATION** (Safe testing)

### Service Health
- ✅ Green = Online
- ⚠️ Yellow = Degraded
- ❌ Red = Offline

### Trade Execution
- Opportunities scanned: Every 30 seconds
- Trades confirmed: Every 60 seconds
- Min profit to execute: $500 (configurable)

---

## ⚙️ Configuration Tuning

### Conservative Mode (Start Here)
```env
MIN_PROFIT_THRESHOLD_USD=1000
MAX_POSITION_SIZE_USD=5000
MAX_SLIPPAGE_PERCENT=0.3
```

### Moderate Mode (After 1 week)
```env
MIN_PROFIT_THRESHOLD_USD=500
MAX_POSITION_SIZE_USD=25000
MAX_SLIPPAGE_PERCENT=0.5
```

### Aggressive Mode (After 1+ months)
```env
MIN_PROFIT_THRESHOLD_USD=100
MAX_POSITION_SIZE_USD=50000
MAX_SLIPPAGE_PERCENT=1.0
```

---

## 🐛 Troubleshooting

### No Opportunities Found
```bash
# Check if scanner is running
curl http://localhost:3001/opportunities | jq length

# Check logs for errors
tail logs/user-api.log | grep -i error

# May take time - arbitrage is not guaranteed
# Check again in 5 minutes
```

### Transaction Failed
```bash
# Check wallet balance
curl http://localhost:3008/wallet | jq .balance

# Check gas availability
curl http://localhost:3008/estimate-gas/1000/0x... | jq .gasCostEth

# Ensure wallet has enough ETH for gas
```

### Service Not Responding
```bash
# Check if service is running
ps aux | grep node

# Restart service
kill PID
npm start

# Or use startup script
./start-production.sh
```

### High Slippage Rejection
```bash
# Current slippage tolerance
echo $MAX_SLIPPAGE_PERCENT

# Increase if necessary (risky!)
export MAX_SLIPPAGE_PERCENT=1.0
```

---

## 📊 Performance Benchmarks

| Metric | Simulation | Production |
|--------|-----------|-----------|
| Profit/5sec | $10-200 | $0-5000 |
| Success rate | 100% | 60-80% |
| Execution time | ~1s | 12-30s |
| Gas cost | $0 | $20-100 |
| Reliability | 100% | 85-95% |

---

## 🔐 Security Reminders

- ❌ Never share PRIVATE_KEY
- ❌ Never commit .env.local to git
- ❌ Never use production wallet for other activities
- ❌ Keep backups of wallet recovery info
- ✅ Use GCP Secret Manager for private key
- ✅ Monitor all transactions on Etherscan
- ✅ Set up Slack alerts
- ✅ Test withdrawals with small amounts first

---

## 📞 Quick Links

| Resource | Link |
|----------|------|
| **Frontend** | http://localhost:3000 |
| **API Health** | http://localhost:3001/health |
| **Withdrawal** | http://localhost:3008/health |
| **Etherscan** | https://etherscan.io |
| **1inch API** | https://api.1inch.io |
| **Uniswap** | https://app.uniswap.org |
| **Docs** | PRODUCTION_SETUP.md |

---

## 🎯 Daily Checklist

Every morning before trading:

- [ ] Check wallet balance (`curl http://localhost:3008/wallet`)
- [ ] Verify services are running (`./start-production.sh`)
- [ ] Check mode is production (`curl http://localhost:3001/mode/current`)
- [ ] Review P&L from previous day (`curl http://localhost:3001/analytics/total-pnl`)
- [ ] Check for errors in logs (`tail logs/*.log`)
- [ ] Monitor network conditions (gas prices low?)

---

## 🚀 Scaling Timeline

| Week | Capital | Min Profit | Position Size | Strategy |
|------|---------|-----------|---|----------|
| 1-2 | $1k | $1000 | $5k | Test all functionality |
| 3-4 | $5k | $500 | $10k | Monitor performance |
| 5-8 | $25k | $300 | $25k | Optimize parameters |
| 9+ | $50k+ | $100 | $50k | Full scale |

---

**Version**: 1.0  
**Last Updated**: January 23, 2026  
**Status**: Production Ready ✅
