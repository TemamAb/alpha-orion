#!/usr/bin/env python3
"""
Alpha-Orion Production Server
Serves the Enterprise Dashboard and proxies requests to the real backend.
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.request
import urllib.error
import webbrowser

# Load Configuration
config_path = os.path.join(os.path.dirname(__file__), "live-profit-dashboard.py")
config_data = {}
try:
    with open(config_path) as f:
        exec(f.read(), {}, config_data)
    CONFIG = config_data.get("CONFIG", {})
except Exception as e:
    print(f"Error loading config: {e}")
    CONFIG = {"PORT": 8080, "BACKEND_URL": "http://localhost:3000"}

PORT = CONFIG["PORT"]
BACKEND_URL = CONFIG["BACKEND_URL"]
DASHBOARD_FILE = "simulation/performance-dashboard.html"

class ProductionHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/dashboard':
            self.serve_dashboard()
            return
            
        if self.path == '/health':
            self.check_health()
            return
            
        # Proxy API requests to Backend
        if any(self.path.startswith(p) for p in ['/analytics', '/trades', '/opportunities', '/strategy', '/api']):
            self.proxy_request()
            return
            
        return super().do_GET()

    def serve_dashboard(self):
        try:
            with open(os.path.join(os.path.dirname(__file__), DASHBOARD_FILE), 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Inject API URL
            injection = f'<script>window.API_BASE_URL = "";</script>' # Empty means relative/same origin for proxy
            content = content.replace('</head>', f'{injection}\n</head>')
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, "Dashboard file not found")

    def check_health(self):
        status = "offline"
        try:
            # Check backend connectivity
            with urllib.request.urlopen(BACKEND_URL, timeout=1) as response:
                if response.status == 200:
                    status = "online"
        except Exception:
            pass
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "backend": status}).encode('utf-8'))

    def proxy_request(self):
        # Route strategy, analytics, opportunities, trades requests to orchestrator (8080), others to simulation backend (3000)
        if self.path.startswith(('/strategy', '/analytics', '/opportunities', '/trades')):
            target = f"http://localhost:8080{self.path}"
        else:
            target = f"{BACKEND_URL}{self.path}"
        try:
            req = urllib.request.Request(target)
            with urllib.request.urlopen(req, timeout=2) as response:
                self.send_response(response.status)
                for k, v in response.headers.items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_error(503, f"Backend Unavailable: {e}")

if __name__ == "__main__":
    print(f"Starting Production Dashboard on port {PORT}")
    print(f"Proxying to Backend: {BACKEND_URL}")
    
    try:
        with socketserver.TCPServer(("", PORT), ProductionHandler) as httpd:
            print(f"Serving at http://localhost:{PORT}/dashboard")
            webbrowser.open(f"http://localhost:{PORT}/dashboard")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")