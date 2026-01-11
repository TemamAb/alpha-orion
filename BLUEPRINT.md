# ArbiNexus Enterprise Master Blueprint

## 1. System Overview
ArbiNexus is an institutional-grade arbitrage execution layer designed for high-frequency flash loan operations. It leverages **ERC-4337 Account Abstraction** to provide gasless execution via **Pimlico Paymasters**.

## 2. Technical Stack
- **Frontend**: React 19, Tailwind CSS (High-density UI).
- **AI Core**: Google Gemini 3 (Pro/Flash) for Strategy Forging and Health Monitoring.
- **Blockchain Layer**: 
  - **Account Abstraction**: Pimlico (Bundler + Paymaster).
  - **Liquidity**: Aave v3, Uniswap v3, Balancer.
  - **Network**: Arbitrum / Base (L2 for low latency).

## 3. The Tri-Tier Bot Architecture
1. **Scanner Bot**: Continuous mempool monitoring for DEX price disparities.
2. **Orchestrator Bot**: Decision engine. Queries Gemini API to validate strategy ROI against current gas-sponsorship limits.
3. **Executor Bot**: The "Relay." Batches Flash Loan + Swap + Repayment into a single UserOperation for the Pimlico Bundler.

## 4. Discovery & Integration Layer (Alpha Sourcing)
- **Strategy Sourcing**: Real-time integration with **1Click Arbitrage** and **DexTools Premium** for instant gap identification.
- **Wallet Synthesis**: AI tracks whale movements via **Etherscan Pro** to generate "Champion Wallets" that mirror institutional execution patterns.
- **Connectivity**: Managed through a unified `DISCOVERY_REGISTRY` that provides the Gemini model with active API keys for BitQuery and Flashbots RPC.

## 5. Dynamic Forging Engine (AI Dynamism)
- **Real-time Alpha Forging**: Every 60 seconds, `forgeEnterpriseAlpha` synthesizes new routes using live telemetry from discovery engines.
- **Wallet Rotation**: AI generates and rotates "Champion Wallets" based on historical performance patterns detected in the global mempool.

## 6. Execution Workflow (The "Loop")
1. **Detection**: Scanner/1Click finds a disparity > 0.3%.
2. **Strategy Forge**: Orchestrator sends discovery context to Gemini.
3. **Validation**: AI confirms the ROI using BitQuery liquidity depth data.
4. **Sponsorship**: Pimlico Paymaster validates and sponsors the gas.
5. **Atomic Execution**: Executor triggers the flash loan contract.
6. **Settlement**: Profits swept to Primary AA Wallet.

## 7. Security & Risk Management
- **MEV Protection**: Uses Flashbots RPC relays.
- **Slippage Guard**: Hard-coded 0.05% threshold.
- **AI Fallback**: Automatic hot-swap between Gemini Pro and Flash.

## 8. UI/UX Principles
- **Command Center**: All-in-one monitoring board.
- **Execution Stream**: Real-time technical auditability.