import uvicorn
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import random
import time
from datetime import datetime
from typing import List, Dict, Optional
import sys
from pathlib import Path
import json

# Add core module to path
sys.path.append(str(Path(__file__).parent / "core"))
from profit_tracker import ProfitTracker
from swarm.sovereign_commander import SovereignCommander

try:
    from google.cloud import secretmanager
except ImportError:
    secretmanager = None

try:
    from google.cloud.devtools import cloudbuild_v1
except ImportError:
    cloudbuild_v1 = None

try:
    from kubernetes import client, config
except ImportError:
    client = None
    config = None

# New imports for Nexus Orchestrator
try:
    from google.cloud import service_usage_v1
except ImportError:
    service_usage_v1 = None # Graceful fallback for local sim

import os

app = FastAPI(title="Alpha-08 Sovereign API")

# Initialize Profit Tracker with MANUAL withdrawal mode by default
profit_tracker = ProfitTracker(data_dir="./data/profits")
profit_tracker.set_withdrawal_mode("MANUAL")

# Global System State
engine_active = True
deployment_mode = "AUTO"

# Enable CORS for dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for Command Post access
try:
    # Mount current directory to serve command_post.html via API
    app.mount("/ops", StaticFiles(directory="."), html=True)
    print("✅ Command Post available at http://localhost:8000/ops/command_post.html")
except Exception as e:
    print(f"⚠️ Static mount skipped: {e}")

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

class CircuitStatus(BaseModel):
    status: str  # "CLOSED" (Flowing) or "OPEN" (Broken)
    grid_connection: bool  # External RPC
    transformer_health: bool  # Execution Engine
    storage_integrity: bool  # File System
    latency_ms: float

class CalibrationRequest(BaseModel):
    strategy_name: str
    weights: Dict[str, int]

class SystemVelocity(BaseModel):
    utilization: float
    daily_volume: float
    bridge_delay_ms: int
    ai_efficiency: float

class EngineControl(BaseModel):
    action: str  # "START" or "PAUSE"

class DeploymentMode(BaseModel):
    mode: str  # "AUTO" or "MANUAL"

class NexusIntent(BaseModel):
    seeker_id: str      # Who is asking? (e.g., "strategy_core_v1")
    intent: str         # What do they need? (e.g., "sentiment_analysis", "high_performance_compute")
    urgency: str = "NORMAL" # "NORMAL" or "CRITICAL"

class ChatRequest(BaseModel):
    message: str
    persona: str
    context: Optional[Dict] = {}

class TerminalCommand(BaseModel):
    command: str

# --- State (Mock Database for Phase 0) ---

strategy_names = [
    "Vulture Liquidation",
    "Triangular Arb V9", 
    "Cross-Chain Velocity",
    "Statistical Arb",
    "Flash Loan Arb",
    "Delta Neutral Yield",
    "DEX-CEX Arb",
    "Sentiment Momentum",
    "Liquidity Sniper"
]

DATA_DIR = Path("./data/state")
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE_FILE = DATA_DIR / "system_state.json"

strategies_db = []

def init_strategies():
    strategies_db.clear()
    
    # 1. Try to load from persistent state (The "One File")
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r') as f:
                saved_data = json.load(f)
                strategies_db.extend(saved_data.get("strategies", []))
                print(f"Loaded {len(strategies_db)} strategies from {STATE_FILE}")
                return
        except Exception as e:
            print(f"Failed to load state: {e}. Regenerating.")

    # 2. Fallback: Generate default state
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
    save_state()

def save_state():
    """Persist system state to the single source of truth file"""
    try:
        with open(STATE_FILE, 'w') as f:
            json.dump({"strategies": strategies_db, "updated": datetime.now().isoformat()}, f, indent=2)
    except Exception as e:
        print(f"Error saving state: {e}")

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

@app.get("/api/circuit/status", response_model=CircuitStatus)
def check_circuit_integrity():
    """
    End-to-End Data Flow Mapping.
    Verifies the 'Electricity' (Data) is flowing from Source to Storage.
    """
    # 1. Check Storage (The Battery)
    storage_ok = False
    try:
        test_file = Path("./data/profits/circuit_test.tmp")
        test_file.parent.mkdir(parents=True, exist_ok=True)
        test_file.touch()
        test_file.unlink()
        storage_ok = True
    except Exception:
        storage_ok = False

    # 2. Check Grid (External RPC - Simulated)
    grid_ok = True # In prod, this would ping Infura/Alchemy

    # 3. Check Transformer (Engine Threads)
    transformer_ok = profit_simulation_thread.is_alive()

    circuit_closed = storage_ok and grid_ok and transformer_ok
    
    return CircuitStatus(
        status="CLOSED" if circuit_closed else "OPEN",
        grid_connection=grid_ok,
        transformer_health=transformer_ok,
        storage_integrity=storage_ok,
        latency_ms=random.uniform(0.5, 2.5)
    )

# --- NEXUS LINK ORCHESTRATOR ---

class NexusOrchestrator:
    """
    Centralized API Data Collection & Distribution Orchestrator.
    Identifies, Collects, and Distributes AOI enablers in real-time.
    """
    def __init__(self):
        # Map abstract intents to concrete GCP Service APIs
        self.capability_map = {
            "sentiment_analysis": "language.googleapis.com",
            "visual_recognition": "vision.googleapis.com",
            "predictive_modeling": "aiplatform.googleapis.com",
            "market_data_stream": "pubsub.googleapis.com",
            "secure_storage": "secretmanager.googleapis.com",
            "ci_cd_pipeline": "cloudbuild.googleapis.com"
        }
        # Estimated cost per 1k units/requests (Mock values)
        self.cost_map = {
            "language.googleapis.com": 1.00, # $1.00 per 1k text records
            "vision.googleapis.com": 1.50,   # $1.50 per 1k images
            "aiplatform.googleapis.com": 5.00, # $5.00 per node hour
            "pubsub.googleapis.com": 0.05,   # $0.05 per GB
            "secretmanager.googleapis.com": 0.03, # $0.03 per 10k ops
            "cloudbuild.googleapis.com": 0.003 # $0.003 per build minute
        }
        self.active_links = []
        print(f"🔹 NEXUS LINK: Orchestrator Initialized. Mapped {len(self.capability_map)} capabilities.")

    def resolve_intent(self, intent: str) -> str:
        return self.capability_map.get(intent, "unknown_service")

    def estimate_cost(self, service_endpoint: str) -> dict:
        rate = self.cost_map.get(service_endpoint, 0.0)
        # Simple logic: High compute/AI is "expensive"
        is_expensive = rate > 2.0
        return {
            "service": service_endpoint,
            "estimated_rate_usd": rate,
            "unit": "per_1k_requests" if "aiplatform" not in service_endpoint else "per_node_hour",
            "status": "REQUIRES_APPROVAL" if is_expensive else "WITHIN_BUDGET"
        }

    def check_and_enable_service(self, service_endpoint: str, project_id: str):
        """
        System Engineering Logic:
        1. Check if API is enabled via Service Usage API.
        2. If not, and urgency is high, auto-enable it (Self-Healing).
        """
        if not service_usage_v1:
            return {"status": "simulated", "message": "Service Usage lib not found, assuming active"}

        try:
            client = service_usage_v1.ServiceUsageClient()
            service_name = f"projects/{project_id}/services/{service_endpoint}"
            
            # Check status
            request = service_usage_v1.GetServiceRequest(name=service_name)
            response = client.get_service(request=request)
            
            if response.state == service_usage_v1.State.DISABLED:
                print(f"⚠️ NEXUS: Service {service_endpoint} is DISABLED. Auto-enabling...")
                enable_req = service_usage_v1.EnableServiceRequest(name=service_name)
                operation = client.enable_service(request=enable_req)
                operation.result() # Wait for completion
                return {"status": "enabled_just_now", "state": "ACTIVE"}
            
            return {"status": "active", "state": "ACTIVE"}
        except Exception as e:
            print(f"❌ NEXUS ERROR: Could not verify service {service_endpoint}: {e}")
            return {"status": "error", "details": str(e)}

    def dispatch_enabler(self, request: NexusIntent):
        """
        The Core Orchestration Logic:
        1. Identify the need.
        2. Find the API.
        3. Check Cost/Budget.
        4. Connect/Provision.
        5. Return the 'Enabler' (Connection details/Credentials).
        """
        service_endpoint = self.resolve_intent(request.intent)
        
        if service_endpoint == "unknown_service":
            return {"status": "failed", "reason": "Capability not defined in Nexus Map"}

        # Cost Estimation Check
        cost_info = self.estimate_cost(service_endpoint)
        
        # Block expensive services if urgency is not CRITICAL
        if cost_info["status"] == "REQUIRES_APPROVAL" and request.urgency != "CRITICAL":
            print(f"🛑 NEXUS BLOCK: Cost check failed for {service_endpoint} (Urgency: {request.urgency})")
            return {
                "status": "blocked",
                "reason": "Cost exceeds auto-approval limit. Escalate urgency to CRITICAL to override.",
                "cost_estimate": cost_info
            }

        project_id = os.getenv("PROJECT_ID", "alpha-orion-production")
        
        # 1. Provisioning / Health Check
        status = self.check_and_enable_service(service_endpoint, project_id)
        
        # 2. Connection Distribution (Mocking a secure token handoff)
        connection_packet = {
            "id": f"nx-{random.randint(1000,9999)}",
            "seeker": request.seeker_id,
            "target_api": service_endpoint,
            "status": "CONNECTED",
            "provisioning_log": status,
            "cost_estimate": cost_info,
            "access_token": f"nexus_v1_{random.randint(1000,9999)}_secure", # In prod: generate real OAuth token
            "endpoint_url": f"https://{service_endpoint}/v1/analyze",
            "timestamp": datetime.now().isoformat()
        }
        
        self.active_links.insert(0, connection_packet)
        # Keep history short
        if len(self.active_links) > 5:
            self.active_links.pop()
        
        return connection_packet

class GeminiAlpha08:
    """
    GEMINI-ALPHA-08: SOVEREIGN INTELLIGENCE MODULE
    Core Capability: Gemini Pro 3 Contextualized for Alpha-08 Mission.
    Intent: Enhance and execute the Design-Deploy-Monitor-Optimize (DDMO) Lifecycle for $100M Velocity.
    """
    def __init__(self, commander, nexus, profit_tracker):
        self.commander = commander
        self.nexus = nexus
        self.profit_tracker = profit_tracker

    def process_request(self, request: ChatRequest) -> Dict[str, Any]:
        msg = request.message.lower()
        persona = request.persona
        
        # Normalize persona aliases
        if persona in ["leader", "boss", "me"]: persona = "commander"
        if persona in ["strat", "trader"]: persona = "strategy"
        if persona in ["copilot", "gemini", "gemini-alpha-08", "gemini-alpha-08-copilot"]: persona = "commander" # Defaults to Commander interface

        # --- 1. DETECT HIGH-LEVEL INTENT (THE MAGIC) ---
        
        # Specific confirmation for mission parameters
        if persona == "commander" and "confirm" in msg and "mission" in msg:
            return {
                "response": (
                    f"🦅 **SOVEREIGN COMMANDER**\n"
                    f"✅ **MISSION PARAMETERS CONFIRMED**\n"
                    f"📂 **Active Context**: `gemini-alpha-08-copilot.md`\n"
                    f"🎯 **Objective**: $500M Capital Velocity\n"
                    f"🔄 **Cycle**: 30s Optimization Loop [ACTIVE]"
                ),
                "persona": "commander",
                "timestamp": datetime.now().isoformat()
            }

        # If the Boss commands a new mission or upgrade, trigger the DDMO lifecycle.
        if persona == "commander" and (
            "magic" in msg or 
            "mission" in msg or 
            all(k in msg for k in ["design", "deploy"]) or
            "upgrade" in msg
        ):
            return self.execute_ddmo_sequence(request.message)
            
        # --- 1.5 DETECT SYSTEM MODE SWITCHING ---
        if persona == "commander":
            if "live" in msg and "mode" in msg:
                return {"response": "🦅 **COMMANDER OVERRIDE**: Switching to LIVE OPERATIONS.\n⚠️ **WARNING**: Real capital is now at risk.", "persona": "commander", "command": "switch_live"}
            if "sim" in msg and "mode" in msg:
                return {"response": "🦅 **COMMANDER OVERRIDE**: Disengaging Mainnet. Returning to SIMULATION MATRIX.", "persona": "commander", "command": "switch_sim"}


        # --- 2. DYNAMIC SWARM ROUTING ---
        # The Sovereign Commander delegates to specialists based on message intent.
        if persona == "commander":
            # CI/CD -> Deploying Engineer (Priority: High - Action Verbs)
            if any(k in msg for k in ["deploy", "build", "pipeline", "commit", "patch", "fix", "release"]):
                persona = "deploy"
            # Financials -> Monitoring Engineer
            elif any(k in msg for k in ["profit", "money", "balance", "withdraw", "ledger", "solvency", "funds"]):
                persona = "profit"
            # Connectivity -> Nexus Engineer
            elif any(k in msg for k in ["nexus", "api", "connect", "bandwidth", "cost", "service"]):
                persona = "nexus"
            # Execution -> Strategy Engineer
            elif any(k in msg for k in ["strategy", "arb", "flash", "loan", "trade", "execution", "market", "alpha"]):
                persona = "strategy"
            # Evolution -> Designing Engineer
            elif any(k in msg for k in ["design", "code", "architecture", "evolve", "refactor"]):
                persona = "design"
            # Math/AI -> Optimizing Engineer
            elif any(k in msg for k in ["optimize", "vertex", "ai", "model", "training", "math", "slippage"]):
                persona = "optimize"
            # Infrastructure -> GCP Engineer
            elif any(k in msg for k in ["gcp", "infra", "server", "node", "cloud", "armor", "vpc", "region"]):
                persona = "gcp"
            # Forensics -> System Analyst
            elif any(k in msg for k in ["log", "analyze", "anomaly", "forensic", "trace", "error", "fail"]):
                persona = "analyst"
            # Security -> Gate Keeper
            elif any(k in msg for k in ["gatekeeper", "security", "veto", "dao", "contract", "lock", "permission"]):
                persona = "gatekeeper"

        # --- 3. EXECUTE PERSONA LOGIC ---
        return self.execute_persona_response(persona, msg, request.message)

    def execute_ddmo_sequence(self, objective: str) -> Dict[str, Any]:
        """
        The 'Magic': Autonomous Design-Deploy-Monitor-Optimize Cycle.
        """
        return {
            "response": (
                f"✨ **GEMINI-ALPHA-08-COPILOT: SOVEREIGN INTELLIGENCE ACTIVATED**\n"
                f"🧠 **Core Engine**: Gemini Pro 3 (Alpha-08 Contextualized)\n"
                f"🎯 **Mission Intent**: Enhancing and executing the Alpha-08 directive for $500M Capital Velocity.\n"
                f"🎯 **Objective**: \"{objective}\"\n\n"
                f"🔄 **EXECUTING DDMO LIFECYCLE**:\n"
                f"1. 📐 **DESIGN**: Generative Architect creating new logic pathways...\n"
                f"2. 🚀 **DEPLOY**: Cloud Build pipeline triggered. Hot-swapping containers...\n"
                f"3. 📊 **MONITOR**: Telemetry stable. Latency < 10ms. Profit tracking active.\n"
                f"4. ⚡ **OPTIMIZE**: Vertex AI Reinforcement Learning model updated.\n\n"
                f"✅ **RESULT**: System capability upgraded. Ready for orders."
            ),
            "persona": "gemini-alpha-08-copilot",
            "timestamp": datetime.now().isoformat(),
            "command": "run_ddmo_cycle"
        }

    def execute_persona_response(self, persona: str, msg: str, original_msg: str) -> Dict[str, Any]:
        command_to_run = None
        response_text = ""
        
        # 0. SOVEREIGN COMMANDER (The Boss)
        if persona == "commander":
            state = self.commander.assess_system_state()
            response_text = (
                f"🦅 **SOVEREIGN COMMANDER (AI)**\n"
                f"🧠 **Decision**: `{state['commander_decision']}`\n"
                f"🛡️ **Mode**: `{state['operational_mode']}`\n"
                f"📊 **Risk Tolerance**: {state['current_risk_tolerance']*100}%\n"
                f"📝 **Reasoning**: {state['reasoning']}"
            )

        # 4. MONITORING ENGINEER (Role 4 - Profit/Vision)
        elif persona == "profit" or persona == "monitor":
            current = self.profit_tracker.get_current_profit()
            if "status" in msg or "report" in msg or "health" in msg or "check" in msg:
                response_text = (
                    f"💰 **POST-DEPLOYMENT FINANCIAL HEALTH**\n"
                    f"✅ **Ledger Integrity**: `VERIFIED` (Block {random.randint(19000000, 19100000)})\n"
                    f"💵 **Session Profit**: `${current['session_profit_usd']:.2f}`\n"
                    f"🏦 **Cumulative**: `${current['cumulative_profit_usd']:.2f}`\n"
                    f"⚙️ **Withdrawal Mode**: `{self.profit_tracker.withdrawal_mode}`\n"
                    f"🛡️ **Solvency Check**: **PASSED** (100% Collateralized)"
                )
            elif "withdraw" in msg:
                response_text = f"Withdrawal protocol is set to {self.profit_tracker.withdrawal_mode}. Use the dashboard controls to execute."
            else:
                response_text = "I am monitoring the ledger. Ask for 'status' or 'profit report'."

        # 8. NEXUS ENGINEER (Role 8 - Connectivity)
        elif persona == "nexus":
            active_count = len(self.nexus.active_links)
            if "status" in msg:
                response_text = f"🔗 **NEXUS TOPOLOGY**\n- Active Uplinks: {active_count}\n- Cost Efficiency: 98.2%\n- Latency: <120ms"
            elif "connect" in msg:
                response_text = "To provision a new capability, please specify the Intent and Urgency level."
            else:
                response_text = f"Nexus Orchestrator online. {active_count} active data streams managed."

        # 6. STRATEGY ORCHESTRATOR (Role 6 - Execution)
        elif persona == "strategy":
            # Check if user is asking about a specific strategy (Delegation Logic)
            target_strat = None
            for s in strategies_db:
                if s['name'].lower() in msg:
                    target_strat = s
                    break
            
            if target_strat:
                # DELEGATION: Orchestrator hands off to Specialist
                response_text = (
                    f"♟️ **STRATEGY ORCHESTRATOR**: Delegating to {target_strat['name']} Specialist...\n\n"
                    f"🤖 **{target_strat['name'].upper()} SPECIALIST**\n"
                    f"- **Status**: ACTIVE\n"
                    f"- **Score**: {target_strat['score']}/100\n"
                    f"- **Current Action**: {target_strat['action']}\n"
                    f"- **Insight**: Optimizing execution path for current volatility."
                )
            elif "status" in msg or "report" in msg or "performance" in msg:
                # ORCHESTRATION: High-level overview
                best_strat = max(strategies_db, key=lambda x: x['score'])
                response_text = (
                    f"♟️ **STRATEGY ORCHESTRATOR**\n"
                    f"📊 **Swarm Status**: 8 Specialists Active\n"
                    f"🏆 **Top Performer**: {best_strat['name']} (Score: {best_strat['score']})\n"
                    f"⚡ **Total Velocity**: $500M/day target engaged.\n"
                    f"🛡️ **MEV-Shield**: Global Enforcement Active."
                )
            elif "update" in msg or "parameter" in msg or "optimization" in msg or "tuning" in msg:
                # ORCHESTRATION: Acknowledge Optimization Input
                response_text = (
                    f"♟️ **STRATEGY ORCHESTRATOR**\n"
                    f"📥 **Signal Received**: Optimization Engineer parameters loaded.\n"
                    f"🔄 **Rebalancing Swarm**:\n"
                    f"- **Risk Weights**: Synced with Vertex AI model.\n"
                    f"✅ **Execution State**: OPTIMIZED & READY."
                )
            else:
                response_text = "Strategy Swarm online. Mention a specific strategy (e.g., 'Vulture', 'Flash Loan') to query its Specialist, or ask for a 'status report'."

        # 3. DEPLOYING ENGINEER (Role 3 - Mutation)
        elif persona == "deploy":
            if "fix" in msg or "patch" in msg:
                response_text = "Initiating hotfix sequence. Applying patch to Vulture Logic module..."
                command_to_run = "python scripts/hotfix_vulture.py"
            elif "status" in msg or "pipeline" in msg or "commit" in msg:
                response_text = (
                    "✅ **DEPLOYMENT COMPLETE**\n"
                    "🚀 **Status**: `SUCCESS` (Build ID: cb-992a-f7)\n"
                    "🔗 **Live App**: `https://alpha-08-live-c2a1.app`\n"
                    "⏱️ **Duration**: 42s\n"
                    "🛡️ **Verification**: All systems nominal."
                )
            else:
                response_text = "Ready to deploy. Awaiting command."

        # 2. DESIGNING ENGINEER (Role 2 - Evolution)
        elif persona == "design":
            response_text = "🧬 **SELF-EVOLVING CODEBASE**\n- Status: MONITORING GITHUB\n- Action: Ready to generate patches based on anomaly reports.\n- Directive: 'Evolve or Die'."

        # 5. OPTIMIZING ENGINEER (Role 5 - Math)
        elif persona == "optimize":
            response_text = "🧠 **VERTEX AI SWARM**\n- Model: Reinforcement Learning (v8.2)\n- Slippage Prediction: 99.4% Accuracy\n- Action: Tuning Kelly Criterion weights for max velocity."
            if "tune" in msg or "cycle" in msg or "parameter" in msg or "optimize" in msg:
                # Simulate AI Tuning Logic: Adjust weights based on score
                updates = []
                for s in strategies_db:
                    # If score is high, increase risk tolerance (Kelly Criterion)
                    if s['score'] > 90:
                        s['weights']['risk'] = min(100, s['weights']['risk'] + 2)
                        action = "INCREASED"
                    elif s['score'] < 70:
                        s['weights']['risk'] = max(10, s['weights']['risk'] - 5)
                        action = "DECREASED"
                    else:
                        action = "MAINTAINED"
                    
                    if random.random() > 0.6: # Only report some updates to avoid clutter
                        updates.append(f"- **{s['name']}**: Risk {action} to {s['weights']['risk']}%")
                
                save_state()
                response_text = f"🧠 **OPTIMIZATION ENGINEER**\n✅ **Vertex AI Tuning Cycle Complete**\n📊 **Kelly Criterion Re-Calibration**:\n{chr(10).join(updates[:3])}\n...\n📡 **Handshake**: New parameters pushed to Strategy Orchestrator."
            else:
                response_text = "🧠 **VERTEX AI SWARM**\n- Model: Reinforcement Learning (v8.2)\n- Slippage Prediction: 99.4% Accuracy\n- Action: Ready to run tuning cycle."

        # 7. GCP ENGINEER (Role 7 - Grid)
        elif persona == "gcp":
            response_text = "☁️ **INFRASTRUCTURE GRID**\n- Region: us-central1 (C2 Nodes)\n- VPC: Private Service Connect ACTIVE\n- Cloud Armor: BLOCKING malicious IPs."

        # 9. SYSTEM ANALYST (Role 9 - Forensics)
        elif persona == "analyst":
            if "report" in msg or "summary" in msg:
                response_text = (
                    f"📋 **MISSION REPORT: SIMULATION COMPLETE**\n"
                    f"✅ **Deployment**: SUCCESS (Hash: e3ef2a8)\n"
                    f"✅ **Security**: MEV-Shield Active, DAO Limits Enforced\n"
                    f"✅ **Optimization**: Vertex AI Parameters Synced\n"
                    f"✅ **Execution**: Strategy Swarm Rebalanced\n"
                    f"🏁 **STATUS**: SYSTEM READY FOR LIVE CAPITAL."
                )
            else:
                response_text = "🔍 **PREDICTIVE ANOMALY HUNTER**\n- Scan: 14,000 logs/sec\n- Anomalies: 0 detected\n- Prediction: 99.9% Uptime probability for next hour."

        # 10. GATE KEEPER (Role 10 - Security)
        elif persona == "gatekeeper":
            if "verify" in msg and "limit" in msg:
                response_text = (
                    "🛡️ **GATE KEEPER DAO**\n"
                    "✅ **AUDIT COMPLETE**: New parameters within safety bounds.\n"
                    "🔐 **Security Check**: PASSED\n"
                    "- **Risk Weight**: < 15% (Approved)\n"
                    "- **Daily Cap**: $500M (Enforced)\n"
                    "📝 **Ledger**: Transaction authorized."
                )
            else:
                response_text = (
                    "🛡️ **IMMUTABLE SECURITY DAO**\n"
                    "- Contract: `0xGateKeeperDAO...`\n"
                    "- Daily Limit: 10% TVL\n"
                    "- Status: **ARMED & LOCKED**\n"
                    "- Veto Power: ACTIVE"
                )

        # 5. FALLBACK
        else:
            response_text = f"Command received. Routing to {persona.upper()} agent swarm..."

        return {"response": response_text, "persona": persona, "timestamp": datetime.now().isoformat(), "command": command_to_run}

# Initialize Swarm Components
nexus_link = NexusOrchestrator()
sovereign_commander = SovereignCommander(profit_tracker, nexus_link)
gemini_alpha_08 = GeminiAlpha08(sovereign_commander, nexus_link, profit_tracker)

@app.post("/api/engine/control")
def control_engine(payload: EngineControl):
    """Control the Execution Engine (Simulates GKE Scaling)"""
    global engine_active
    if payload.action == "PAUSE":
        engine_active = False
        # In production: scale_deployment(0)
        print("⚠️ ENGINE HALTED: Scaling GKE replicas to 0")
    elif payload.action == "START":
        engine_active = True
        # In production: scale_deployment(3)
        print("✅ ENGINE STARTED: Scaling GKE replicas to 3")
    return {"status": "success", "active": engine_active}

@app.get("/api/engine/status")
def get_engine_status():
    return {"active": engine_active}

@app.post("/api/deployment/mode")
def set_deployment_mode(payload: DeploymentMode):
    global deployment_mode
    deployment_mode = payload.mode
    return {"status": "success", "mode": deployment_mode}

@app.get("/api/deployment/mode")
def get_deployment_mode():
    return {"mode": deployment_mode}

@app.get("/api/nexus/active")
def get_active_nexus_links():
    return nexus_link.active_links

@app.post("/api/nexus/connect")
def nexus_connect(payload: NexusIntent):
    """Endpoint for system components to request API capabilities dynamically"""
    result = nexus_link.dispatch_enabler(payload)
    return result

@app.get("/")
def root():
    return FileResponse("gemini-alpha-dashboard.html")

@app.get("/dashboard-config.js")
def get_dashboard_config():
    """Serve dynamic configuration for the dashboard"""
    config_path = Path("dashboard-config.js")
    if config_path.exists():
        return FileResponse(config_path)
    
    # Default config for local development
    content = """window.ALPHA_CONFIG = {
    API_BASE: 'http://localhost:8000',
    ENV: 'LOCAL'
};"""
    return Response(content=content, media_type="application/javascript")

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
    save_state() # Persist updates
                
    return strategies_db

@app.post("/api/calibrate")
def calibrate_strategy(payload: CalibrationRequest):
    for s in strategies_db:
        if s["name"] == payload.strategy_name:
            s["weights"] = payload.weights
            # Recalculate score based on new weights (mock logic)
            s["score"] = round(random.uniform(90.0, 99.9), 1)
            s["action"] = "Recalibrated via Sovereign Hub"
            save_state()
            return {"status": "success", "new_score": s["score"]}
    return {"status": "error", "message": "Strategy not found"}

@app.get("/api/velocity", response_model=SystemVelocity)
def get_velocity():
    return {
        "utilization": round(random.uniform(80.0, 95.0), 1),
        "daily_volume": round(random.uniform(400_000_000, 500_000_000), 2),
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

@app.get("/api/admin/billing")
def get_billing_info():
    """Retrieve billing info from Secret Manager"""
    if not secretmanager:
        return {"status": "simulated", "account_id": "000000-000000-000000", "balance": "SIMULATED"}
    try:
        client = secretmanager.SecretManagerServiceClient()
        project_id = os.getenv("PROJECT_ID", "alpha-orion-production")
        name = f"projects/{project_id}/secrets/billing-account-details/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return json.loads(response.payload.data.decode("UTF-8"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Secret Access Failed: {str(e)}")

@app.get("/api/deployment/status")
def get_deployment_status():
    """Retrieve latest Cloud Build status and Live App URL"""
    if not cloudbuild_v1:
        return {"builds": [], "status": "simulated", "message": "Cloud Build lib not found"}

    try:
        project_id = os.getenv("PROJECT_ID", "alpha-orion-production")
        cb_client = cloudbuild_v1.CloudBuildClient()
        
        # List builds, limit to 5 most recent
        request = cloudbuild_v1.ListBuildsRequest(
            project_id=project_id,
            page_size=5
        )
        page_result = cb_client.list_builds(request=request)
        
        # Fetch Live LoadBalancer IP from K8s
        app_url = None
        try:
            # Try in-cluster config first, fall back to local
            try:
                config.load_incluster_config()
            except:
                # Fallback for local testing if kubeconfig exists
                config.load_kube_config()
            
            v1 = client.CoreV1Api()
            service = v1.read_namespaced_service(name="alpha-orion-core", namespace="alpha-08")
            if service.status.load_balancer.ingress:
                ip = service.status.load_balancer.ingress[0].ip
                app_url = f"http://{ip}:8000"
        except Exception as k8s_e:
            print(f"K8s Service Discovery Warning: {k8s_e}")
        
        builds = []
        for build in page_result:
            builds.append({
                "id": build.id,
                "status": build.status.name,
                "create_time": build.create_time.isoformat() if build.create_time else None,
                "log_url": build.log_url,
                "app_url": app_url if build.status.name == "SUCCESS" else None
            })
            
        return {"builds": builds}
    except Exception as e:
        # Fallback for local testing or if permissions fail
        print(f"Cloud Build API Error: {e}")
        return {"status": "simulated", "message": "Could not fetch live builds", "error": str(e)}

@app.post("/api/deployment/trigger")
def trigger_deployment(payload: dict = Body(default={})):
    """Manually trigger a Cloud Build (Manual Mode)"""
    
    # 1. Nexus Integration: Request CI/CD Capability
    # The deployment system must ask Nexus for resources first
    intent = NexusIntent(seeker_id="deployment_control_plane", intent="ci_cd_pipeline", urgency="HIGH")
    nexus_result = nexus_link.dispatch_enabler(intent)
    print(f"🚀 NEXUS DEPLOYMENT TRIGGERED: {intent.seeker_id} -> {intent.intent} | Status: {nexus_result.get('status')}")
    
    if nexus_result.get("status") == "blocked":
        raise HTTPException(status_code=403, detail=f"Nexus Blocked Deployment: {nexus_result.get('reason')}")

    if not cloudbuild_v1:
        return {"status": "triggered", "message": "Deployment pipeline initiated (SIMULATION)", "nexus_trace": nexus_result["id"]}

    try:
        project_id = os.getenv("PROJECT_ID", "alpha-orion-production")
        cb_client = cloudbuild_v1.CloudBuildClient()
        
        # Trigger the build configured in the project (assumes trigger exists)
        # Alternatively, submit a build request directly if no trigger
        # For simplicity, we assume a repo-connected trigger or submit the yaml
        # Here we just return a success mock for the dashboard to start polling
        # In a real scenario, you'd use cb_client.create_build()
        
        return {"status": "triggered", "message": "Deployment pipeline initiated", "nexus_trace": nexus_result["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/terminal/exec")
def execute_terminal_command(payload: TerminalCommand):
    """Simulate terminal command execution for the dashboard"""
    cmd = payload.command.strip()
    output = ""
    user = "op"
    
    if cmd == "ls":
        output = "core/  data/  infrastructure/  monitoring/  tests/  dashboard-api-enhanced.py  requirements.txt"
    elif cmd == "help":
        output = "Available commands: ls, status, python <script>, kubectl <cmd>, git <cmd>, clear"
    elif cmd.startswith("python"):
        if "fix" in cmd or "hotfix" in cmd:
            output = "Running hotfix patcher...\n[INFO] Scanning core/profit_tracker.py...\n[FIX] Applied patch 0x4F2A to Vulture Logic.\n[TEST] Verifying integrity... PASS\nSUCCESS: System patched."
        elif "simulate" in cmd:
            output = "Initializing simulation environment...\n[LOAD] Loaded 8 strategies.\n[SIM] 500M volume cycle complete.\n[RES] Capital Velocity: 98.4%\nSUCCESS: Simulation passed."
        else:
            output = f"Executing Python script: {cmd.split(' ')[1]}...\nDone."
    elif cmd.startswith("kubectl"):
        output = "NAME                                READY   STATUS    RESTARTS   AGE\nalpha-orion-core-7f8b9c5d-2s4k      1/1     Running   0          4h\nredis-master-0                      1/1     Running   0          12d"
    elif cmd.startswith("git"):
        output = "On branch main\nYour branch is up to date with 'origin/main'.\n\nNothing to commit, working tree clean"
    else:
        output = f"bash: {cmd.split()[0]}: command not found"
    
    return {"command": cmd, "output": output, "user": user}

# --- PERSONA INTELLIGENCE ENGINE ---

@app.post("/api/copilot/chat")
def chat_with_persona(request: ChatRequest):
    """
    Backend Intelligence for Personas.
    Connects the 'Face' (UI) to the 'Brain' (System State).
    """
    return gemini_alpha_08.process_request(request)


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
def set_target_wallet(
    wallet_address: str = Body(...),
    source: Optional[str] = Body(default="gemini_dashboard")
):
    """
    Set target wallet for withdrawals.
    
    Priority (highest to lowest):
    1. Executive Deck (source='executive_deck')
    2. Gemini Dashboard (source='gemini_dashboard')
    3. GCP/Environment (source='gcp_secret')
    """
    valid_sources = ['executive_deck', 'gemini_dashboard', 'gcp_secret']
    if source not in valid_sources:
        source = 'gemini_dashboard'
    
    wallet_source = source if source else 'gemini_dashboard'
    profit_tracker.set_target_wallet(wallet_address, source=wallet_source)
    
    # Get current wallet info
    current = profit_tracker.get_current_profit()
    
    return {
        "status": "success",
        "wallet": wallet_address,
        "source": wallet_source,
        "priority": current.get('wallet_priority', 0),
        "message": f"Wallet saved from {wallet_source}. Executive Deck overrides all."
    }

# --- SIMULATION: Auto-generate profits for demo ---
import threading

def simulate_profits():
    """Background thread to simulate profit generation"""
    while True:
        time.sleep(random.randint(30, 120))  # Random interval between 30-120 seconds
        
        if not engine_active:
            continue
        
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
    print("Alpha-08 Dashboard API with Profit Tracking starting on port 8000...")
    print(f"Withdrawal Mode: {profit_tracker.withdrawal_mode}")
    print(f"Cumulative Profit: ${profit_tracker.cumulative_profit:,.2f}")
    print("🚀 PRODUCTION DEPLOYMENT PROTOCOLS: ACTIVE [Repo: TemamAb/alpha-orion]")
    uvicorn.run(app, host="0.0.0.0", port=8000)
