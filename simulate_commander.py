import sys
import os
from pathlib import Path
import json

# Add project root to path to locate modules
sys.path.append(str(Path(__file__).parents[2]))

# Import the Commander
try:
    from sovereign_commander import SovereignCommander
except ImportError:
    # Fallback for architectural path
    sys.path.append(str(Path(__file__).parents[2] / "core" / "swarm"))
    from sovereign_commander import SovereignCommander

# --- MOCKS ---
class MockProfitTracker:
    def get_current_profit(self):
        # Simulate a healthy profit buffer > $5,000
        return {
            'cumulative_profit_usd': 15420.50,
            'session_profit_usd': 2100.00
        }

class MockNexusLink:
    def __init__(self):
        self.active_links = ["binance_stream", "aave_pool", "uniswap_v3"]

# --- EXECUTION ---
print("🦅 SOVEREIGN COMMANDER: CAPITAL ALLOCATION SIMULATION")
print("====================================================")

tracker = MockProfitTracker()
nexus = MockNexusLink()
commander = SovereignCommander(tracker, nexus)

# Execute Assessment
state = commander.assess_system_state()

print(f"🎯 VELOCITY TARGET: ${commander.capital_velocity_target:,.2f}")
print(f"📊 INPUT STATE:     Profit Buffer=${tracker.get_current_profit()['cumulative_profit_usd']:,.2f}")
print(f"🧠 DECISION OUTPUT:\n{json.dumps(state, indent=2)}")