# Alpha-Orion: Production Deployment Guide

## Overview

This guide walks through deploying Alpha-Orion from live-simulation mode to 100% production mode with real blockchain arbitrage execution, flash loans, and profit withdrawals.

## ⚠️ Critical Prerequisites

### 1. Secure Wallet Setup
```bash
# Generate a new hot wallet for arbitrage execution
# NEVER use an existing wallet with significant funds
# Use a fresh address with controlled capital

# Example using ethers.js:
npx ts-node -e "
import { ethers } from 'ethers';
const wallet = ethers.Wallet.createRandom();
"
```

### 2. Fund the Hot Wallet
- Transfer working capital (recommend $5k-$50k initially)
- Ensure sufficient ETH for gas (≥5 ETH)
- Keep funds in USDC for arbitrage

### 3. Disable Mainnet Testing
```bash
# Ensure you're NOT testing on testnet
# Alpha-Orion is configured for Ethereum mainnet only
```

---

## Step 1: Environment Configuration

### 1.1 Create Production Config

```bash
cp .env.production .env.local
```

### 1.2 Configure Critical Variables

```env
# Copy from .env.production and fill in:

# Your RPC endpoint
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/{YOUR_INFURA_KEY}

# Your hot wallet (generated above)
PRIVATE_KEY=0x{your_private_key_hex}
EXECUTION_WALLET_ADDRESS=0x{your_wallet_address}

# 1inch API for price discovery
ONE_INCH_API_KEY={your_1inch_api_key}

# Profit destination wallet (can be different from execution wallet)
DEFAULT_PROFIT_WALLET=0x{destination_address}

# GCP project
GCP_PROJECT_ID=alpha-orion

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 1.3 Verify Configuration

```bash
npm run check-config
# Output should show all critical vars are set
```

---

## Step 2: Smart Contract Deployment

### 2.1 Compile FlashLoanExecutor

```bash
cd backend-services/services/flash-loan-executor

# Install OpenZeppelin contracts
npm install @openzeppelin/contracts

# Compile
npx hardhat compile
```

### 2.2 Deploy to Mainnet

```bash
# Create hardhat config
cat > hardhat.config.js << 'EOF'
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: '0.8.0',
  networks: {
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
EOF

# Deploy contract
npx hardhat run scripts/deploy.js --network mainnet

# Save the deployed contract address
export FLASH_LOAN_EXECUTOR_ADDRESS=0x...
```

### 2.3 Verify Contract on Etherscan

```bash
# Optional but recommended for transparency
npx hardhat verify --network mainnet $FLASH_LOAN_EXECUTOR_ADDRESS
```

---

## Step 3: Start Services

### 3.1 Backend Services

```bash
# Terminal 1: User API Service (port 3001)
cd backend-services/services/user-api-service
npm install
npm start

# Output should show:
# User API Service listening on port 8080
# Deploy Mode: production
# ⚠️  PRODUCTION MODE ACTIVE - REAL MONEY AT RISK
```

```bash
# Terminal 2: Withdrawal Service (port 3008)
cd backend-services/services/withdrawal-service
npm install
npm start

# Output should show:
# ⚠️  PRODUCTION MODE - REAL WITHDRAWALS ENABLED
```

```bash
# Terminal 3+: Other services
# In production with Docker Compose:
docker-compose up
```

### 3.2 Verify Services

```bash
# Check health
curl http://localhost:3001/health
curl http://localhost:3008/health

# Check mode
curl http://localhost:3001/mode/current

# Should return:
# {
#   "mode": "production",
#   "activeOpportunities": 0,
#   "executedTrades": 0,
#   "totalPnl": 125430.50,
#   "totalTrades": 8432
# }
```

---

## Step 4: Frontend Configuration

### 4.1 Update Environment

```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:3001" > .env.production
echo "REACT_APP_MODE=production" >> .env.production
```

### 4.2 Start Frontend

```bash
npm start

# Frontend should now show:
# - "PRODUCTION MODE" indicator
# - Real arbitrage opportunities
# - Real P&L tracking
# - Real withdrawal functionality
```

---

## Step 5: Monitor First Trades

### 5.1 Watch Scanner Output

```bash
# In a separate terminal, tail API logs
curl -s http://localhost:3001/mode/current | jq .

# Refresh every 10 seconds to see:
# - Active opportunities increasing
# - Executed trades starting
# - Real P&L accumulating
```

### 5.2 Check Blockchain Transactions

```bash
# Get wallet address
curl http://localhost:3008/wallet | jq .

# Check Etherscan for transactions:
# https://etherscan.io/address/{EXECUTION_WALLET_ADDRESS}
```

### 5.3 View Trade History

```bash
# Get executed trades
curl http://localhost:3001/trades/executed | jq .

# Get withdrawals
curl http://localhost:3008/withdrawals | jq .
```

---

## Step 6: Risk Management Setup

### 6.1 Configure Limits

Edit `.env.local`:

```env
# Start conservative
MIN_PROFIT_THRESHOLD_USD=500      # Only execute trades > $500 profit
MAX_POSITION_SIZE_USD=5000        # Never use more than $5k per trade
MAX_SLIPPAGE_PERCENT=0.5          # Strict slippage control
```

### 6.2 Test with Small Capital

**Recommendation**: Run with $1k-$5k for first week to test:
- Opportunity detection
- Trade execution
- Withdrawal functionality
- Monitoring accuracy

### 6.3 Enable Monitoring Alerts

```bash
# Setup Slack notifications for:
# - Large trades executed
# - Failed executions
# - Unusual P&L
# - Gas price spikes

# Update SLACK_WEBHOOK_URL in .env.local
```

---

## Step 7: Verify Production Readiness

### Checklist

- [ ] Hot wallet funded with capital
- [ ] RPC endpoint tested (curl command successful)
- [ ] Smart contract deployed on mainnet
- [ ] Private key securely stored (not in git)
- [ ] All services starting without errors
- [ ] Frontend showing "PRODUCTION" mode
- [ ] Scanner finding real opportunities
- [ ] First test trade confirmed on Etherscan
- [ ] Withdrawal tested with small amount
- [ ] Monitoring and alerting working
- [ ] Team notified of production launch

---

## Step 8: Scaling Up

### After successful testing (1-2 weeks):

1. **Increase capital** gradually
   ```env
   MAX_POSITION_SIZE_USD=50000
   ```

2. **Lower profit threshold**
   ```env
   MIN_PROFIT_THRESHOLD_USD=100
   ```

3. **Optimize parameters** based on data
   - Adjust scan interval
   - Fine-tune slippage tolerances
   - Optimize gas prices

4. **Enable automated execution**
   ```env
   FEATURE_AUTOMATED_EXECUTION=true
   ```

---

## Troubleshooting

### Service Won't Start

```bash
# Check dependencies
npm install

# Check environment
cat .env.local | grep ETHEREUM_RPC_URL

# Test RPC endpoint
curl -X POST $ETHEREUM_RPC_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### No Opportunities Found

```bash
# Check scanner status
curl http://localhost:3001/opportunities

# May take time to find profitable opportunities
# Confirm with manual check:
curl http://localhost:3001/mode/current

# If activeOpportunities = 0, scanner is running but no opportunities yet
# This is normal - arbitrage is not guaranteed
```

### Transaction Failures

```bash
# Check gas price
curl "http://localhost:3008/estimate-gas/1000/0x..."

# Check wallet balance
curl http://localhost:3008/wallet

# Ensure wallet has sufficient ETH and USDC
```

### High Slippage Errors

Reduce trade size or adjust:
```env
MAX_SLIPPAGE_PERCENT=1.0  # Increase tolerance temporarily
```

---

## Security Best Practices

1. **Private Key Management**
   - Use GCP Secret Manager in production
   - Rotate keys quarterly
   - Monitor key usage

2. **Transaction Monitoring**
   - Set alerts for all transactions
   - Verify Etherscan after each trade
   - Monitor gas prices

3. **Rate Limiting**
   - Keep MIN_PROFIT_THRESHOLD high initially
   - Gradually lower as confidence increases
   - Never remove safety limits

4. **Regular Backups**
   ```bash
   # Backup wallet recovery info
   # Backup environment configuration
   # Backup trade logs
   ```

---

## Support & Monitoring

### Real-time Dashboard

Open in browser:
```
http://localhost:3000
```

Features:
- Live P&L tracking
- Real opportunity detection
- Service status monitoring
- Manual withdrawal controls

### Logs

```bash
# API logs
docker logs user-api-service

# Withdrawal service logs
docker logs withdrawal-service

# Entire stack
docker-compose logs -f
```

### Metrics

```bash
# Current mode and stats
curl http://localhost:3001/mode/current

# Wallet balance
curl http://localhost:3008/wallet

# Trade history
curl http://localhost:3001/trades/executed
```

---

## Deployment on GCP (Optional)

For enterprise deployment:

1. Build Docker images
   ```bash
   docker-compose build
   ```

2. Push to Cloud Registry
   ```bash
   docker-compose push
   ```

3. Deploy to Cloud Run
   ```bash
   gcloud run deploy user-api-service --image gcr.io/alpha-orion/user-api-service:latest
   ```

4. Setup load balancer and monitoring

---

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test with small capital ($1k)
3. ✅ Monitor for 1-2 weeks
4. ✅ Scale up capital
5. ✅ Optimize parameters
6. ✅ Full production deployment

**Total time to production: 2-4 weeks**

---

## Emergency Procedures

### Stop All Trading

```bash
# Disable automated execution
curl -X POST http://localhost:3001/mode/switch -d '{"newMode":"live-simulation"}' -H "Content-Type: application/json"
```

### Emergency Withdrawal

```bash
# Withdraw all profits
curl -X POST http://localhost:3008/withdraw \
  -H "Content-Type: application/json" \
  -d '{"mode":"manual","amount":10000,"address":"0x..."}'
```

### Circuit Breaker

```bash
# System will auto-stop if:
# - Consecutive failures > 5
# - P&L drops > STOP_LOSS_PERCENT
# - Gas prices spike > 2x normal
```

---

**FINAL WARNING**: This system trades with real money on mainnet. Understand the risks, test thoroughly, and start small. Arbitrage profits are NOT guaranteed.
