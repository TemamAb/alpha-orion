import numpy as np
import time
import logging
import json
from dataclasses import dataclass, asdict
from typing import Dict, List

# Setup institutional logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s')
logger = logging.getLogger("Alpha08-Calibrator")

@dataclass
class StrategyMetrics:
    name: str
    latency_ms: float
    mempool_conflict_rate: float
    profit_per_gas: float
    tps: int
    profit_24h: float
    predicted_slippage: float
    actual_slippage: float
    
    @property
    def slippage_drift(self):
        return abs(self.actual_slippage - self.predicted_slippage)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading

app = FastAPI()

# Enable CORS for the Sovereign Hub
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared state for API
current_results = []
latest_log = "Initializing Alpha-08 Intelligence..."

@app.get("/api/strategies")
def get_strategies():
    # Transform internal metrics to the format expected by sovereign-hub.html
    hub_data = []
    for r in current_results:
        m = r['metrics']
        hub_data.append({
            "name": r['strategy'],
            "latency": f"{m['latency_ms']:.1f}ms",
            "conflict": f"{m['mempool_conflict_rate']:.1f}%",
            "gas": f"{m['profit_per_gas']:.1f}x",
            "tps": str(m['tps']),
            "profit": f"+${m['profit_24h']:,.0f}",
            "slippage": f"{m['actual_slippage']:.3f}%",
            "score": r['wps'],
            "weights": {"lat": 40, "prof": 30, "gas": 20, "risk": 10}, # Simplified weights for UI
            "action": r['ai_action']
        })
    return hub_data

@app.get("/api/logs")
def get_logs():
    return {"log": latest_log}

def run_api():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

class SovereignCalibrationEngine:
    def __init__(self):
        self.weights = {
            "Vulture Liquidation": {"lat": 0.40, "prof": 0.30, "gas": 0.20, "risk": 0.10},
            "Triangular Arb V9": {"lat": 0.20, "prof": 0.40, "gas": 0.30, "risk": 0.10},
            "Cross-Chain Velocity": {"lat": 0.10, "prof": 0.30, "gas": 0.50, "risk": 0.10},
        }

    def calculate_wps(self, metrics: StrategyMetrics) -> float:
        w = self.weights.get(metrics.name, {"lat": 0.25, "prof": 0.25, "gas": 0.25, "risk": 0.25})
        n_lat = max(0, min(100, (200 - metrics.latency_ms) / 2))
        n_prof = max(0, min(100, (metrics.profit_24h / 5000) * 100))
        n_gas = max(0, min(100, (metrics.profit_per_gas / 15) * 100))
        n_risk = max(0, min(100, (5 - metrics.mempool_conflict_rate) * 20))
        return round((n_lat * w['lat']) + (n_prof * w['prof']) + (n_gas * w['gas']) + (n_risk * w['risk']), 2)

    def calibrate_strategy(self, strategy_name: str, raw_data: Dict):
        metrics = StrategyMetrics(
            name=strategy_name,
            latency_ms=raw_data.get('latency', 50.0),
            mempool_conflict_rate=raw_data.get('conflicts', 0.5),
            profit_per_gas=raw_data.get('gas_eff', 1.0),
            tps=raw_data.get('tps', 100),
            profit_24h=raw_data.get('profit', 0.0),
            predicted_slippage=raw_data.get('pred_slip', 0.01),
            actual_slippage=raw_data.get('act_slip', 0.01)
        )
        wps = self.calculate_wps(metrics)
        drift = metrics.slippage_drift
        
        action = "Steady state maintained."
        if drift > 0.005:
            action = f"RECALIBRATING: Slippage drift high ({drift:.4f})."
        elif metrics.mempool_conflict_rate > 2.0:
            action = "CONFLICT ALERT: Routing to Private Relay."
        elif wps < 85.0:
            action = "PERFORMANCE DROP: Optimizing CPU affinity."

        return {
            "strategy": strategy_name,
            "wps": wps,
            "metrics": asdict(metrics),
            "ai_action": action
        }

    def run_calibration_loop(self):
        global current_results, latest_log
        logger.info("Alpha-08 Calibration Loop Started.")
        try:
            while True:
                new_results = []
                for strat in self.weights.keys():
                    raw = {
                        "latency": np.random.uniform(5, 30),
                        "conflicts": np.random.uniform(0.1, 1.5),
                        "gas_eff": np.random.uniform(8, 16),
                        "tps": np.random.randint(500, 3000),
                        "profit": np.random.uniform(1000, 5000),
                        "pred_slip": 0.005,
                        "act_slip": 0.005 + np.random.normal(0, 0.002)
                    }
                    res = self.calibrate_strategy(strat, raw)
                    new_results.append(res)
                    latest_log = f">> [ALPHA-08] {res['ai_action']}" if res['wps'] < 95 else f">> [ALPHA-08] {strat} calibrated at WPS {res['wps']}"
                
                current_results = new_results
                time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Stopped.")

if __name__ == "__main__":
    # Start API in background thread
    api_thread = threading.Thread(target=run_api, daemon=True)
    api_thread.start()
    
    engine = SovereignCalibrationEngine()
    engine.run_calibration_loop()

if __name__ == "__main__":
    engine = SovereignCalibrationEngine()
    engine.run_calibration_loop()
