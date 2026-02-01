# 🧪 ALPHA-ORION SIMULATION GUIDE

## 🎯 VERIFYING THE DASHBOARD

To verify the event stream and chart updates without waiting for live market data, use the built-in **Simulation Mode**.

### 1. Open Settings
Click the **⚙️ Settings** button in the sidebar.

### 2. Trigger Profit Drop
Scroll down to the **Debug & Simulation** section and click:
**💸 SIMULATE PROFIT DROP**

### 3. Observe Effects
1.  **Event Stream**: A new "TRADE" event will appear in the bottom panel (Green).
2.  **Charts**: The Profit Performance Trend chart will update with a new data point.
3.  **Metrics**: Total Profit Balance and Profit/Hour will increase.
4.  **Auto-Withdrawal**: If profit exceeds the threshold (default $1000), an auto-withdrawal sequence will be simulated in the logs.

This confirms that the dashboard's reactive infrastructure is functioning correctly.