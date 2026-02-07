import logging
from typing import Dict, Any
from datetime import datetime

# Enterprise Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SovereignCommander")

class SovereignCommander:
    """
    ROLE 1: SOVEREIGN COMMANDER (AI AGENT)
    Responsibility: Autonomous Capital Allocation & Risk Governance.
    Replaces: Human Project Leader.
    
    Directives:
    1. Assess System State (Profit, Nexus Health, Market Regime).
    2. Allocate Capital (Velocity vs. Safety).
    3. Authorize Deployments (Risk vs. Reward).
    """
    def __init__(self, profit_tracker, nexus_link):
        self.profit_tracker = profit_tracker
        self.nexus_link = nexus_link
        self.risk_tolerance = 0.05 # 5% max draw down allowed
        self.capital_velocity_target = 500_000_000.0 # $500M/day (Swarm Upgrade)
        self.operational_mode = "BALANCED"

    def assess_system_state(self) -> Dict[str, Any]:
        """
        Aggregates intelligence from all swarm agents to make a command decision.
        """
        profit_stats = self.profit_tracker.get_current_profit()
        nexus_status = len(self.nexus_link.active_links)
        cumulative_profit = profit_stats.get('cumulative_profit_usd', 0.0)
        
        # Autonomous Decision Logic
        decision = "MAINTAIN_COURSE"
        reasoning = "System operating within nominal parameters."
        
        if cumulative_profit > 5000 and self.risk_tolerance < 0.1:
            decision = "INCREASE_VELOCITY"
            self.risk_tolerance = 0.10
            self.operational_mode = "AGGRESSIVE"
            reasoning = f"Profit buffer sufficient. Accelerating capital rotation to match ${self.capital_velocity_target:,.0f} daily target."
            
        elif cumulative_profit < 0:
            decision = "DEFENSIVE_MODE"
            self.risk_tolerance = 0.01
            self.operational_mode = "SURVIVAL"
            reasoning = "Drawdown detected. Activating capital preservation protocols."

        return {
            "timestamp": datetime.now().isoformat(),
            "commander_decision": decision,
            "operational_mode": self.operational_mode,
            "current_risk_tolerance": self.risk_tolerance,
            "capital_allocation": "100%" if decision != "DEFENSIVE_MODE" else "20%",
            "nexus_uplinks": nexus_status,
            "reasoning": reasoning
        }

    def authorize_deployment(self, compliance_score: float) -> bool:
        """
        Decides whether to allow a code deployment based on risk.
        """
        if compliance_score >= 100.0:
            return True
        if compliance_score >= 98.0 and self.operational_mode == "AGGRESSIVE":
            return True # Allow slight deviation in high risk/reward mode
        return False