import http.server
import socketserver
import json
import random
import time
import threading
from datetime import datetime

# Configuration
PORT = 3000

# Simulation State
state = {
    "total_profit": 0.0,
    "trades": [],
    "opportunities": [],
    "history": [] # For chart visualization
}

def generate_simulation_data():
    """Generates fake trading data in the background"""
    print(f"🚀 Simulation Engine Started. Generating data on port {PORT}...")
    while True:
        # 1. Simulate Profit Increase (Randomly)
        if random.random() > 0.4:  # 60% chance of trade
            profit = round(random.uniform(10.0, 150.0), 2)
            state["total_profit"] += profit
            
            # Create Trade Record
            pairs = ["ETH/USDC", "WBTC/USDT", "MATIC/DAI", "LINK/ETH", "AAVE/USDC"]
            strategies = ["Triangular Arbitrage", "Flash Loan", "DEX Arbitrage", "Liquidation"]
            
            new_trade = {
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "pair": random.choice(pairs),
                "strategy": random.choice(strategies),
                "profit": profit,
                "status": "CONFIRMED",
                "txHash": f"0x{random.getrandbits(160):040x}"
            }
            
            # Add to history (keep last 20)
            state["trades"].insert(0, new_trade)
            state["trades"] = state["trades"][:20]
            
            # Add to chart history
            state["history"].append({
                "time": datetime.now().strftime("%H:%M:%S"),
                "profit": round(state["total_profit"], 2)
            })
            if len(state["history"]) > 50:
                state["history"].pop(0)
                
            print(f"💰 Trade Executed: {new_trade['pair']} | +${profit}")

        # 2. Simulate Active Opportunities
        opp_count = random.randint(1, 8)
        state["opportunities"] = []
        for _ in range(opp_count):
            state["opportunities"].append({
                "pair": random.choice(["ETH/DAI", "UNI/USDC", "CRV/ETH"]),
                "profit": round(random.uniform(2.0, 25.0), 2)
            })

        time.sleep(random.uniform(1.0, 3.0))  # Random interval 1-3s

class SimulationHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Set headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Route requests
        if self.path == '/analytics/total-pnl':
            response = {
                "total_profit": round(state["total_profit"], 2),
                "history": state["history"]
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/trades/executed':
            self.wfile.write(json.dumps(state["trades"]).encode())
        elif self.path == '/opportunities':
            self.wfile.write(json.dumps(state["opportunities"]).encode())
        else:
            self.wfile.write(json.dumps({}).encode())
    
    def log_message(self, format, *args):
        return # Suppress default logging

if __name__ == "__main__":
    # Start data generator thread
    t = threading.Thread(target=generate_simulation_data)
    t.daemon = True
    t.start()
    
    # Start Server
    with socketserver.TCPServer(("", PORT), SimulationHandler) as httpd:
        print(f"✅ Simulation API running on http://localhost:{PORT}")
        print("   Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass