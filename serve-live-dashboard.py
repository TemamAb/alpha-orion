#!/usr/bin/env python3
"""
Alpha-Orion Production Dashboard Server (Simulation Mode)
Serves the Enterprise Dashboard with simulated data for testing/development.
"""

import http.server
import socketserver
import json
import os
import sys
from datetime import datetime, timedelta
import random

# Configuration - Dynamic port support
PORT = int(os.environ.get("PORT", 8888))
if len(sys.argv) > 1:
    PORT = int(sys.argv[1])
DASHBOARD_FILE = "production/approved-dashboard.html"

# Simulation mode flag
SIMULATION_MODE = True

class ProductionHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override to reduce logging noise"""
        pass
    
    def do_GET(self):
        if self.path == '/' or self.path == '/dashboard':
            self.serve_dashboard()
            return
            
        if self.path == '/health':
            self.check_health()
            return
        
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        
        if self.path == '/api/analytics':
            self.serve_analytics()
            return
            
        if self.path == '/api/trades':
            self.serve_trades()
            return
            
        if self.path == '/api/opportunities':
            self.serve_opportunities()
            return
            
        if self.path == '/api/strategy':
            self.serve_strategy()
            return
            
        if self.path == '/api/profit':
            self.serve_profit()
            return
            
        if self.path == '/api/risk':
            self.serve_risk()
            return
            
        return super().do_GET()

    def serve_dashboard(self):
        try:
            with open(os.path.join(os.path.dirname(__file__), DASHBOARD_FILE), 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Inject API URL and dynamic data fetching JavaScript
            injection = '''
<script>
window.SIMULATION_MODE = true;
window.API_BASE = '';

// API Fetch Functions
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Update Dashboard Functions
async function updateDashboard() {
    // Update analytics
    const analytics = await fetchAPI('/api/analytics');
    if (analytics) {
        updateElement('header-lifetime-profit', formatCurrency(analytics.lifetimeProfit));
        updateElement('val-avg-profit', formatCurrency(analytics.avgProfit));
        updateElement('val-trades-hour', analytics.tradesHour);
        updateElement('val-total-trades', analytics.totalTrades.toLocaleString());
        updateElement('val-balance', formatCurrency(analytics.balance));
    }
    
    // Update strategy
    const strategy = await fetchAPI('/api/strategy');
    if (strategy) {
        updateElement('val-success-rate', strategy.successRate + '%');
        updateElement('val-latency', strategy.latency + 'ms');
        updateElement('val-arb-opps', strategy.arbOpps + '/day');
    }
    
    // Update risk
    const risk = await fetchAPI('/api/risk');
    if (risk) {
        updateElement('val-var', risk.var + '%');
        updateElement('val-drawdown', risk.drawdown + '%');
        updateElement('val-circuit', risk.circuit);
    }
    
    // Update infrastructure (mocked in analytics for now or separate)
    // For this demo, we'll assume infra is stable or fetch if needed
    // But let's update the specific infra IDs if we had an endpoint
    // Using strategy endpoint to carry infra data for efficiency
    if (strategy) {
        updateElement('val-scaling', strategy.scaling);
        updateElement('val-uptime', strategy.uptime + '%');
        updateElement('val-chains', strategy.chains + ' chains');
    }
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 500);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function updateTradesTable(trades) {
    const tbody = document.querySelector('#trades-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = trades.map(trade => `
        <tr>
            <td>${trade.tokenIn}/${trade.tokenOut}</td>
            <td>${trade.amountIn.toFixed(4)}</td>
            <td>${trade.amountOut.toFixed(4)}</td>
            <td class="mono profit-${trade.profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(trade.profit)}</td>
            <td>${trade.status}</td>
            <td>${new Date(trade.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');
}

function updateOpportunitiesTable(opportunities) {
    const tbody = document.querySelector('#opportunities-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = opportunities.map(opp => `
        <tr>
            <td>${opp.type}</td>
            <td class="mono">${formatCurrency(opp.estimatedProfit)}</td>
            <td>${opp.confidence}%</td>
            <td>${opp.gasCost} gwei</td>
            <td><span class="risk-${opp.riskLevel}">${opp.riskLevel}</span></td>
        </tr>
    `).join('');
}

// Initialize polling
document.addEventListener('DOMContentLoaded', function() {
    console.log('Alpha-Orion Dashboard - Dynamic Mode');
    updateDashboard();
    setInterval(updateDashboard, 5000); // Update every 5 seconds
    console.log('Dashboard updates enabled - polling every 5 seconds');
});
</script>
<style>
.updated { animation: highlight 0.5s ease; }
@keyframes highlight { 
    0% { background: rgba(59, 130, 246, 0.3); }
    100% { background: transparent; }
}
.profit-positive { color: var(--accent-secondary); }
.profit-negative { color: var(--accent-danger); }
.risk-low { color: var(--accent-secondary); }
.risk-medium { color: var(--accent-warning); }
.risk-high { color: var(--accent-danger); }
</style>
'''
            content = content.replace('</head>', f'{injection}\n</head>')
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, "Dashboard file not found")

    def check_health(self):
        # Always return healthy in simulation mode
        status = "simulation"
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "mode": "simulation", "backend": status}).encode('utf-8'))

    def serve_analytics(self):
        """Serve simulated analytics data"""
        data = {
            "lifetimeProfit": round(random.uniform(127000, 128000), 2),
            "avgProfit": round(random.uniform(400, 600), 2),
            "tradesHour": random.randint(100, 150),
            "totalTrades": random.randint(2800, 2900),
            "balance": round(random.uniform(2800, 3500), 2),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(data)

    def serve_trades(self):
        """Serve simulated trades data"""
        trades = []
        for i in range(10):
            trades.append({
                "id": f"trade_{i+1}",
                "tokenIn": random.choice(["ETH", "USDC", "WBTC", "DAI"]),
                "tokenOut": random.choice(["ETH", "USDC", "WBTC", "DAI"]),
                "amountIn": round(random.uniform(1, 100), 4),
                "amountOut": round(random.uniform(1, 100), 4),
                "profit": round(random.uniform(-50, 500), 2),
                "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(1, 60))).isoformat(),
                "status": random.choice(["completed", "pending", "failed"])
            })
        self.send_json_response(trades)

    def serve_opportunities(self):
        """Serve simulated opportunities data"""
        opportunities = []
        for i in range(5):
            opportunities.append({
                "id": f"opp_{i+1}",
                "type": random.choice(["arbitrage", "sandwich", "liquidation"]),
                "estimatedProfit": round(random.uniform(100, 5000), 2),
                "confidence": round(random.uniform(70, 98), 2),
                "gasCost": random.randint(10, 100),
                "riskLevel": random.choice(["low", "medium", "high"]),
                "timestamp": datetime.utcnow().isoformat()
            })
        self.send_json_response(opportunities)

    def serve_strategy(self):
        """Serve simulated strategy data"""
        data = {
            "successRate": round(random.uniform(90, 95), 1),
            "latency": random.randint(35, 48),
            "arbOpps": random.randint(250, 320),
            "scaling": f"{random.randint(6,8)}/8 Passed",
            "uptime": round(random.uniform(99.95, 99.99), 2),
            "chains": random.randint(6, 8),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(data)

    def serve_profit(self):
        """Serve simulated profit data"""
        data = {
            "totalProfit": round(random.uniform(50000, 200000), 2),
            "dailyProfit": round(random.uniform(500, 5000), 2),
            "weeklyProfit": round(random.uniform(5000, 30000), 2),
            "monthlyProfit": round(random.uniform(20000, 100000), 2),
            "roi": round(random.uniform(15, 35), 2),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(data)

    def serve_risk(self):
        """Serve simulated risk data"""
        data = {
            "var": round(random.uniform(0.8, 1.5), 1),
            "drawdown": round(random.uniform(2.0, 5.0), 1),
            "circuit": "Active"
        }
        self.send_json_response(data)

    def send_json_response(self, data):
        """Helper to send JSON responses"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == "__main__":
    print(f"Starting Alpha-Orion Dashboard Server (Simulation Mode)")
    print(f"Serving on port {PORT}")
    
    # Allow address reuse to prevent "port in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), ProductionHandler) as httpd:
            print(f"Dashboard available at: http://localhost:{PORT}/dashboard")
            print(f"Health check: http://localhost:{PORT}/health")
            print(f"API Endpoints:")
            print(f"  - /api/analytics")
            print(f"  - /api/trades")
            print(f"  - /api/opportunities")
            print(f"  - /api/strategy")
            print(f"  - /api/profit")
            print(f"  - /api/risk")
            print("\nPress Ctrl+C to stop the server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except OSError as e:
        if e.errno == 10048:
            print(f"Error: Port {PORT} is already in use. Try: python serve-live-dashboard.py <port>")
        else:
            print(f"Error: {e}")