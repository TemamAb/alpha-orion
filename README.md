# 🌌 ALPHA-ORION: ENTERPRISE EDITION (v08)

**Status**: ✅ PRODUCTION LIVE
**Target**: $100M Daily Volume
**Architecture**: Microservices / HFT

## 📂 Directory Map
- `core/`: The Brain (Execution, Risk, Mempool)
- `strategies/`: The 8 Killer Strategies (Isolated)
- `infrastructure/`: Terraform for C2 Compute & GKE
- `contracts/`: Solidity Smart Contracts
- `tests/`: Unit, Integration, and Simulation tests
- `docs/`: System architecture and strategy documentation

## 🚀 Quick Start

1.  **Verify Logic**: Run the $100M simulation to confirm profit models.
    ```bash
    python tests/simulation/simulate_100m.py
    ```
2.  **Deploy Infrastructure**: Provision the HFT infrastructure on GCP.
    ```bash
    cd infrastructure/terraform/environments/prod && terraform apply
    ```
3.  **Deploy Application**: Deploy the v08 engine to Cloud Run.
    ```bash
    python deploy_v08_cloud.py
    ```