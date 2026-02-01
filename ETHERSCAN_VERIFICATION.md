# 🔍 HOW TO VERIFY PROFITS ON BLOCKCHAIN

**Network**: Polygon zkEVM  
**Explorer**: [zkevm.polygonscan.com](https://zkevm.polygonscan.com)

---

## 1. Get Your Smart Wallet Address
Locate the **Deployment Registry** output in your terminal or dashboard logs.
Look for:
> **Smart Wallet**: `0x...`

## 2. Open Explorer
Navigate to:
`https://zkevm.polygonscan.com/address/YOUR_WALLET_ADDRESS`

## 3. Check Token Holdings
1.  Click on the **"Token Holdings"** dropdown menu (top left of the address section).
2.  Look for **USDC** (USD Coin).
3.  Verify the balance matches your dashboard's **Total Profit**.

## 4. Verify Transactions
1.  Scroll down to the **"Token Transfers (ERC-20)"** tab.
2.  You will see incoming transactions labeled **IN**.
3.  These represent the arbitrage profits being swept to your wallet from the execution contract.

---

**Note**: Because this system uses **Account Abstraction (ERC-4337)**, your main ETH balance may remain at 0 while your USDC balance grows. This is normal behavior as gas is sponsored by the Pimlico Paymaster.