# 🦅 ALPHA-08: SOVEREIGN ARBITRAGE SYSTEM (v08)

Welcome to the **100/100 Maturity** version of Alpha-Orion. This directory contains the hardened, GCP-native architecture designed for **$100M Daily Capital Velocity**.

## 📊 V08 MISSION CONTROL
- **Master Plan**: [`MASTER_PLAN.md`](./MASTER_PLAN.md)
- **AI Mission**: [`COPILOT_MISSION.md`](./COPILOT_MISSION.md)
- **Live Dashboard**: [`monitoring/dashboard.html`](./monitoring/dashboard.html) (Open in browser)

## 🏗️ ARCHITECTURAL CORE
- **`infrastructure/`**: Terraform for VPC-native GKE clusters with C2 Compute nodes.
- **`core/scanner/`**: Vectorized NumPy engine for sub-10ms liquidation scanning.
- **`core/execution/`**: Variant Kernel V8 with MEV-Shield and AI Slippage Prediction.
- **`contracts/`**: FlashArbExecutor and CircuitBreaker logic.

## 🛡️ OPERATIONAL STATUS
- **Networking**: VPC Private Service Connect (Secure RPC).
- **Security**: Cloud Armor WAF enabled.
- **Intelligence**: 30s EIL Loop via Alpha-08-AI.

## 🚀 GETTING STARTED
1. Initialize Phase 0: `python setup_phase0.py`
2. Deploy Infrastructure: `cd infrastructure/terraform/environments/prod && terraform init && terraform apply`
3. Launch Scanner: `python core/scanner/engine.py`

---
*Authoritative root for all v08 operations: `C:\Users\op\Desktop\alpha-orion\alpha-08`*
