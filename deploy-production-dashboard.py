#!/usr/bin/env python3
"""
Alpha-Orion Production Dashboard Deployment
Deploys production/performance-dashboard.html on local ports with port availability checks.
"""

import http.server
import socketserver
import socket
import os
import sys
import webbrowser
import time

def check_port_free(port):
    """Check if port is free."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('', port))
            return True
        except socket.error:
            return False

def find_free_port(start_port=8000):
    """Find a free port starting from start_port."""
    port = start_port
    while not check_port_free(port):
        port += 1
    return port

def verify_deployment(port):
    """Verify that the port is now occupied after deployment."""
    time.sleep(1)  # Wait for server to start
    return not check_port_free(port)

import json
import random
import time

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/dashboard':
            self.serve_dashboard()
            return
        elif self.path == '/api/metrics/live':
            self.serve_metrics()
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/optimize/trigger':
            self.trigger_optimize()
            return
        self.send_error(404)

    def serve_dashboard(self):
        try:
            dashboard_path = os.path.join(os.path.dirname(__file__), 'production/performance-dashboard.html')
            with open(dashboard_path, 'r', encoding='utf-8') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, "Production dashboard file not found")

    def serve_metrics(self):
        # Mock live metrics
        metrics = {
            "latency_ms": round(random.uniform(35, 50), 1),
            "success_rate": round(random.uniform(85, 95), 1),
            "pnl_per_trade": round(random.uniform(450, 550), 0),
            "total_profit": round(random.uniform(150000, 200000), 2),
            "wallet_balance": round(random.uniform(50000, 80000), 2),
            "trade_count": random.randint(1000, 1500),
            "uptime": 99.95 + random.uniform(0, 0.05),
            "start_time": int(time.time()) - random.randint(3600, 86400),
            "fleet": {
                "scanners": {"active": random.randint(5, 10), "load": random.randint(60, 90)},
                "orchestrators": {"active": random.randint(3, 6), "load": random.randint(70, 95)},
                "executors": {"active": random.randint(8, 15), "load": random.randint(50, 85)}
            }
        }
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(metrics).encode('utf-8'))

    def trigger_optimize(self):
        # Mock optimization trigger
        response = {
            "success": True,
            "message": "Autonomous optimization triggered successfully",
            "ai_analysis": {
                "details": {
                    "routing": "Arbitrum + Polygon",
                    "gas_strategy": "Dynamic priority fees",
                    "execution_mode": "Flash loan arbitrage"
                }
            },
            "new_metrics": {
                "latency_ms": round(random.uniform(30, 40), 1),
                "success_rate": round(random.uniform(90, 98), 1),
                "pnl_per_trade": round(random.uniform(500, 600), 0)
            }
        }
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

if __name__ == "__main__":
    # Pre-check port availability
    PORT = 8000
    if not check_port_free(PORT):
        print(f"Port {PORT} is occupied. Finding free port...")
        PORT = find_free_port(PORT)
        print(f"Using free port: {PORT}")

    print(f"Pre-deployment check: Port {PORT} is free ✅")

    # Deploy (start server)
    print(f"Deploying Production Dashboard on port {PORT}...")
    try:
        with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
            print(f"Dashboard deployed at http://localhost:{PORT}/dashboard")

            # Verify deployment
            if verify_deployment(PORT):
                print(f"Post-deployment check: Port {PORT} is now occupied by dashboard ✅")
                print("Deployment successful! Opening in browser...")
                webbrowser.open(f"http://localhost:{PORT}/dashboard")
                httpd.serve_forever()
            else:
                print("ERROR: Port not occupied after deployment ❌")
                sys.exit(1)
    except KeyboardInterrupt:
        print("\nDashboard deployment stopped.")
    except Exception as e:
        print(f"Deployment failed: {e}")
        sys.exit(1)
