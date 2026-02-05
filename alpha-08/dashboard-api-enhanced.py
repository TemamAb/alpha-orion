import uvicorn
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import time
from datetime import datetime
from typing import List, Dict, Optional
import sys
from pathlib import Path

# Add core module to path
sys.path.append(str(Path(__file__).parent / "core"))
from profit_tracker import ProfitTracker

app = FastAPI(title="Alpha-08 Sovereign API")

# Initialize Profit Tracker with MANUAL withdrawal mode by default
profit_tracker = ProfitTracker(data_dir="./data/profits")
profit_tracker.set_withdrawal_mode("MANUAL")

# Enable CORS for dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class StrategyMetrics(BaseModel):
    name: str
    latency: str
    conflict: str
    gas: str
    throughput: str
    cap_velocity: str
    profit_trade: str
    trades_hr: int
    trades_day: int
    profit_hr: str
    profit_day: str
    profit_wk: str
    profit_mo: str
    profit_yr: str
    score: float
    weights: Dict[str, int]
    action: str

class CalibrationRequest(BaseModel):
    strategy_name: str
    weights: Dict[str, int]

class SystemVelocity(BaseModel):
    utilization: float
    daily_volume: float
    bridge_delay_ms: int
    ai_efficiency: float

# --- State (Mock Database for Phase 0) ---

strategy_names = [
    "Vulture Liquidation",
    "Triangular Arb V9", 
    "Cross-Chain Velocity",
    "Statistical Arb",
    "Flash Loan Arb",
    "Delta Neutral Yield",
    "DEX-CEX Arb",
    "Sentiment Momentum"
]

strategies_db = []

def init_strategies():
    strategies_db.clear()
    for name in strategy_names:
        # Generate realistic baseline data
        base_profit_hr = random.uniform(50, 500)
        
        strategies_db.append({
            "name": name,
            "latency": f"{random.randint(5, 120)}ms",
            "conflict": f"{random.uniform(0, 2.5):.1f}%",
            "gas": f"{random.uniform(5, 20):.1f}x",
            "throughput": f"{random.randint(500, 5000)} tps",
            "cap_velocity": f"{random.randint(80, 99)}%",
            "profit_trade": f"${random.uniform(5, 50):.2f}",
            "trades_hr": int(base_profit_hr / 10),
            "trades_day": int(base_profit_hr / 10 * 24),
            "profit_hr": f"${base_profit_hr:.2f}",
            "profit_day": f"${base_profit_hr * 24:.2f}",
            "profit_wk": f"${base_profit_hr * 24 * 7:,.2f}",
            "profit_mo": f"${base_profit_hr * 24 * 30:,.2f}",
            "profit_yr": f"${base_profit_hr * 24 * 365:,.2f}",
            "score": round(random.uniform(92.0, 99.9), 1),
            "weights": {"lat": 25, "prof": 25, "gas": 25, "risk": 25},
            "action": "Initializing..."
        })

init_strategies()

ai_actions = [
    "Optimizing gas limit",
    "Rerouting via Flashbots",
    "Adjusting slippage tolerance",
    "Scaling C2 node capacity",
    "Rebalancing liquidity pool",
    "Analyzing mempool depth",
    "Locking profit target",
    "Switching RPC endpoint"
]

# --- Core Endpoints ---

@app.get("/")
def root():
    return {"system": "Alpha-08 Sovereign Core", "status": "ONLINE", "withdrawal_mode": profit_tracker.withdrawal_mode}

@app.get("/api/strategies", response_model=List[StrategyMetrics])
def get_strategies():
    # Simulate live fluctuations
    for s in strategies_db:
        if random.random() > 0.7:
            # Update Score
            current_score = s["score"]
            s["score"] = round(current_score + random.uniform(-0.5, 0.5), 1)
            
            # Update Action
            if random.random() > 0.8:
                s["action"] = random.choice(ai_actions)
                
    return strategies_db

@app.post("/api/calibrate")
def calibrate_strategy(payload: CalibrationRequest):
    for s in strategies_db:
        if s["name"] == payload.strategy_name:
            s["weights"] = payload.weights
            # Recalculate score based on new weights (mock logic)
            s["score"] = round(random.uniform(90.0, 99.9), 1)
            s["action"] = "Recalibrated via Sovereign Hub"
            return {"status": "success", "new_score": s["score"]}
    return {"status": "error", "message": "Strategy not found"}

@app.get("/api/velocity", response_model=SystemVelocity)
def get_velocity():
    return {
        "utilization": round(random.uniform(80.0, 95.0), 1),
        "daily_volume": round(random.uniform(80_000_000, 100_000_000), 2),
        "bridge_delay_ms": random.randint(90, 150),
        "ai_efficiency": round(random.uniform(97.0, 99.9), 1)
    }

@app.get("/api/logs")
def get_logs():
    tasks = [
        "GKE: Hot-swapped node pool us-central1-a",
        "Predictor: Drift reduction sequence active.",
        f"Analyzing block {random.randint(18000000, 19000000)}... found {random.randint(0, 5)} gaps.",
        "WPS: Re-aligning strategy priorities...",
        "Sovereign Guard: MEV bot blocked.",
        "Bridge: Liquidity rebalanced on Arbitrum."
    ]
    return {
        "timestamp": datetime.now().isoformat(),
        "log": f">> [ALPHA-08] {random.choice(tasks)}"
    }

# --- PROFIT TRACKING ENDPOINTS ---

@app.get("/api/profit/current")
def get_current_profit():
    """Get current profit statistics including session and cumulative totals"""
    return profit_tracker.get_current_profit()

@app.get("/api/profit/breakdown")
def get_profit_breakdown(hours: int = 24):
    """Get detailed profit breakdown for the last N hours"""
    return profit_tracker.get_profit_breakdown(hours)

@app.post("/api/profit/record")
def record_profit(
    strategy: str = Body(...),
    profit_usd: float = Body(...),
    gas_cost_usd: float = Body(...),
    tx_hash: Optional[str] = Body(None),
    block_number: Optional[int] = Body(None)
):
    """Record a new profit event (called by execution engine)"""
    record = profit_tracker.record_profit(
        strategy=strategy,
        profit_usd=profit_usd,
        gas_cost_usd=gas_cost_usd,
        tx_hash=tx_hash,
        block_number=block_number
    )
    return {"status": "success", "record": record.__dict__}

@app.post("/api/withdrawal/request")
def request_withdrawal(
    amount_usd: float = Body(...),
    wallet_address: str = Body(...)
):
    """Request a manual withdrawal"""
    result = profit_tracker.request_withdrawal(amount_usd, wallet_address)
    return result

@app.post("/api/withdrawal/set-mode")
def set_withdrawal_mode(mode: str = Body(...)):
    """Set withdrawal mode (MANUAL or AUTO)"""
    try:
        profit_tracker.set_withdrawal_mode(mode)
        return {"status": "success", "mode": mode.upper()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/withdrawal/set-wallet")
def set_target_wallet(wallet_address: str = Body(...)):
    """Set target wallet for withdrawals"""
    profit_tracker.set_target_wallet(wallet_address)
    return {"status": "success", "wallet": wallet_address}

# --- SIMULATION: Auto-generate profits for demo ---
import threading

def simulate_profits():
    """Background thread to simulate profit generation"""
    while True:
        time.sleep(random.randint(30, 120))  # Random interval between 30-120 seconds
        
        # Pick a random strategy
        strategy = random.choice(strategy_names)
        profit = random.uniform(10, 250)
        gas = random.uniform(2, 15)
        
        # Record the profit
        profit_tracker.record_profit(
            strategy=strategy,
            profit_usd=profit,
            gas_cost_usd=gas,
            tx_hash=f"0x{random.randint(10**15, 10**16):x}",
            block_number=random.randint(18000000, 19000000)
        )

# Start profit simulation in background
profit_simulation_thread = threading.Thread(target=simulate_profits, daemon=True)
profit_simulation_thread.start()

if __name__ == "__main__":
    print("🚀 Alpha-08 Dashboard API with Profit Tracking starting on port 8000...")
    print(f"💰 Withdrawal Mode: {profit_tracker.withdrawal_mode}")
    print(f"📊 Cumulative Profit: ${profit_tracker.cumulative_profit:,.2f}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
