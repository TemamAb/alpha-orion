import asyncio
import logging
import os
import random
import sys
import threading
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException

# Set up paths to allow importing from the 'strategies' module
# Assuming this file is in core/execution_engine/main.py, we need to go up two levels to root
sys.path.append(str(Path(__file__).resolve().parents[2]))

from strategies.liquidation_arbitrage.engine import VultureEngine

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ExecutionEngine")

# --- FastAPI App ---
app = FastAPI(
    title="Alpha-Orion v08 - Core Execution Engine",
    description="Manages and runs high-frequency trading strategy engines.",
    version="1.0.0",
)

# --- Engine Initialization ---
vulture_engine = VultureEngine()

# --- Background Task Management ---
def run_engine_in_background(engine: VultureEngine):
    """Sets up and runs the asyncio event loop for the engine in a separate thread."""
    logger.info("Starting background thread for %s...", engine.__class__.__name__)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Mock loading positions for demonstration/testing
    mock_positions = [
        {'user': f'0xUser{i}', 'collateral_usd': random.uniform(10000, 100000), 'debt_usd': random.uniform(8000, 84900), 'liquidation_threshold': 0.85}
        for i in range(10000)
    ]
    # Add a definite liquidation target for testing
    mock_positions.append({'user': '0xLiquidatable', 'collateral_usd': 90000, 'debt_usd': 80000, 'liquidation_threshold': 0.85}) # HF = 0.956

    engine.load_positions(mock_positions)
    loop.run_until_complete(engine.run_main_loop())

@app.on_event("startup")
async def startup_event():
    """FastAPI startup event handler."""
    logger.info("Core Execution Engine starting up...")
    engine_thread = threading.Thread(target=run_engine_in_background, args=(vulture_engine,), daemon=True)
    engine_thread.start()
    logger.info("VultureEngine has been started in the background.")

# --- API Endpoints ---
@app.get("/", tags=["Status"])
def read_root():
    """Root endpoint providing basic system status."""
    return {"system": "Alpha-Orion v08 - Core Execution Engine", "status": "ACTIVE", "active_strategies": [vulture_engine.__class__.__name__]}

@app.get("/health", tags=["Status"])
def health_check():
    """Provides a simple health check endpoint."""
    # Simple check, can be expanded
    return {"status": "ok", "engine_running": True}

@app.get("/engine/status", tags=["Engine"])
def get_engine_status():
    """Returns the current status of the running engines."""
    return {"engine": vulture_engine.__class__.__name__, "positions_monitored": len(vulture_engine.monitored_users)}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server for development...")
    uvicorn.run(app, host="0.0.0.0", port=8000)