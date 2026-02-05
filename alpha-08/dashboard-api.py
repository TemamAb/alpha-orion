import uvicorn
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import time
from datetime import datetime
from typing import List, Dict, Optional

app = FastAPI(title="Alpha-08 Sovereign API")

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

# --- Endpoints ---

@app.get("/")
def root():
    return {"system": "Alpha-08 Sovereign Core", "status": "ONLINE"}

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

if __name__ == "__main__":
    print("🚀 Alpha-Orion Dashboard API starting on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)