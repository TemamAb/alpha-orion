#!/usr/bin/env python3
"""
Alpha-Orion Unified Trading Dashboard Server
Auto-detects free port and serves the unified trading dashboard
"""

import http.server
import socketserver
import os
import sys
import socket
from datetime import datetime
import urllib.request
import urllib.error
import webbrowser
import json
import threading
import time

# Try to import deployment engine
try:
    import deployment_autopilot
except ImportError:
    deployment_autopilot = None

DASHBOARD_FILE = 'LIVE_PROFIT_DASHBOARD.html'

def find_free_port(start_port=8888, max_attempts=100):
    """
    Find a free port starting from start_port with instant detection
    Returns tuple: (port, is_default)
    """
    print()
    print('Scanning ports for availability...')
    print()
    
    for attempt, port in enumerate(range(start_port, start_port + max_attempts), 1):
        # Show progress indicator
        progress_bar = '#' * (attempt // 4)
        remaining = '-' * (25 - len(progress_bar))
        progress = f'[{progress_bar}{remaining}] {attempt}%'
        
        # Status for current port being checked
        status = f'\r  Testing: Port {port} ... {progress}'
        print(status, end='', flush=True)
        
        try:
            # Fast port check - bind and immediately close
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(('127.0.0.1', port))
            sock.close()
            
            # Port is free - found it!
            print()  # New line after progress
            print()
            
            if port == start_port:
                print(f'Port {port} is AVAILABLE (default)')
            else:
                print(f'Port {port} is FREE (port {start_port} was occupied)')
            
            print()
            return port, (port == start_port)
            
        except OSError:
            # Port is in use, try next one
            continue
    
    print()  # Clear progress line
    print()
    raise RuntimeError(f"No free port found between {start_port} and {start_port + max_attempts}")

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for deployment triggers"""
        if self.path == '/api/deploy/cloud':
            self.trigger_deployment('cloud')
        elif self.path == '/api/deploy/local':
            self.trigger_deployment('local')
        elif self.path == '/api/deploy/stop':
            if deployment_autopilot:
                deployment_autopilot.request_stop()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "stopping"}).encode('utf-8'))
            else:
                self.send_error(500, "Deployment module not found")
        elif self.path == '/api/deploy/restart':
            if deployment_autopilot:
                deployment_autopilot.request_stop()
                
                def restart_sequence():
                    time.sleep(2) # Wait for stop to propagate
                    autopilot = deployment_autopilot.DeploymentAutopilot()
                    autopilot.deploy_to_cloud_run()
                
                threading.Thread(target=restart_sequence).start()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "restarting"}).encode('utf-8'))
            else:
                self.send_error(500, "Deployment module not found")
        else:
            self.send_error(404)

    def trigger_deployment(self, mode):
        """Execute deployment in a separate thread"""
        if not deployment_autopilot:
            self.send_error(500, "Deployment module not found")
            return
        
        def run_deploy():
            try:
                autopilot = deployment_autopilot.DeploymentAutopilot()
                if mode == 'cloud':
                    autopilot.deploy_to_cloud_run()
                else:
                    autopilot.run_local_docker()
            except Exception as e:
                deployment_autopilot.log(f"Deployment failed: {str(e)}", "ERROR")
        
        # Run in thread to avoid blocking the server
        threading.Thread(target=run_deploy).start()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "started", "mode": mode}).encode('utf-8'))

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/' or self.path == '/dashboard':
            self.serve_dashboard_with_api_url()
            return
            
        # Deployment Logs Endpoint
        if self.path == '/api/deploy/logs':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            logs = deployment_autopilot.deployment_logs if deployment_autopilot else []
            self.wfile.write(json.dumps(logs).encode('utf-8'))
            return

        # API Endpoints - Proxy to Backend
        api_prefixes = ['/analytics', '/trades', '/opportunities', '/mode', '/pimlico', '/health']
        if any(self.path.startswith(p) for p in api_prefixes):
            self.handle_api_request()
            return

        return super().do_GET()

    def serve_dashboard_with_api_url(self):
        """Serve dashboard with injected API URL"""
        try:
            with open(DASHBOARD_FILE, 'r', encoding='utf-8') as f:
                content = f.read()

            # Get API base URL from environment
            api_base_url = os.environ.get('API_BASE_URL', os.environ.get('BACKEND_URL', 'http://localhost:8080'))

            # Inject API base URL into HTML
            injection_script = f'<script>window.API_BASE_URL = "{api_base_url}";</script>'
            # Insert before closing </head> tag
            content = content.replace('</head>', f'{injection_script}\n</head>')

            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Content-length', len(content.encode('utf-8')))
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))

        except FileNotFoundError:
            self.send_error(404, f"Dashboard file '{DASHBOARD_FILE}' not found")
        except Exception as e:
            self.send_error(500, f"Error serving dashboard: {e}")
    
    def handle_api_request(self):
        """Proxy to backend service"""
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8080')
        
        # Prevent self-recursion if running on same port without external backend
        # (Common in Docker standalone mode)
        if str(self.server.server_address[1]) in backend_url and 'localhost' in backend_url:
            self.send_error(500, "Configuration Error: Backend URL points to self")
            return

        try:
            # Try to proxy to backend
            target = f"{backend_url}{self.path}"
            req = urllib.request.Request(target)
            with urllib.request.urlopen(req, timeout=0.5) as response:
                self.send_response(response.status)
                for key, value in response.headers.items():
                    self.send_header(key, value)
                self.end_headers()
                self.wfile.write(response.read())
        except (urllib.error.URLError, socket.timeout, ConnectionRefusedError) as e:
            # Backend offline
            self.send_error(503, f"Backend Unavailable: {e}")

    def end_headers(self):
        """Add CORS and cache control headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        return super().end_headers()
    
    def log_message(self, format, *args):
        """Log with timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f'[{timestamp}] {format % args}')

def main():
    # Clear PORT environment variable to allow auto-detection
    os.environ.pop('PORT', None)

    print('\n')
    print('===========================================================')
    print('      ALPHA-ORION LIVE PROFIT DASHBOARD SERVER        ')
    print('          AUTO-DETECTING FREE PORT...                     ')
    print('===========================================================')
    print()

    # Stage 1: Setup
    print('STAGE 1: INITIALIZATION')
    print('  Changing to working directory...')
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print('  Working directory set')
    print()

    # Stage 2: Port Detection
    port_env = os.environ.get('PORT', '').strip()
    if port_env:
        PORT = int(port_env)
        print('STAGE 2: PORT CONFIGURATION (ENV DETECTED)')
        print(f'  Using environment variable PORT: {PORT}')
    else:
        print('STAGE 2: PORT DETECTION')
        try:
            PORT, is_default = find_free_port(start_port=8888, max_attempts=1)
        except RuntimeError as e:
            print(f'{e}')
            print()
            print('Port 8888 not available, will try fallback ports...')
            try:
                PORT, is_default = find_free_port(start_port=9200, max_attempts=100)
            except RuntimeError as e2:
                print(f'{e2}')
                sys.exit(1)
    print()
    
    # Stage 3: Configuration
    print('STAGE 3: CONFIGURATION')
    print(f'  Dashboard File: {DASHBOARD_FILE}')
    print(f'  Server Port: {PORT}')
    print()

    # Stage 4: Verification
    print('STAGE 4: VERIFICATION')
    print()
    print('===========================================================')
    print()
    
    # Dynamic port check
    backend_port = 8080
    if os.path.exists('ports.json'):
        try:
            with open('ports.json', 'r') as f:
                data = json.load(f)
                backend_port = data.get('api', 8080)
        except:
            pass

    print('ACCESS DASHBOARD:')
    print(f'   http://localhost:{PORT}/')
    print(f'   http://localhost:{PORT}/dashboard')
    print()
    print('PRODUCTION API:')
    print(f'   http://localhost:{backend_port}/analytics/total-pnl')
    print(f'   http://localhost:{backend_port}/trades/executed')
    print(f'   http://localhost:{backend_port}/opportunities')
    print()
    print('===========================================================')
    print()
    print('SETUP INSTRUCTIONS:')
    print()
    print('1. Terminal 1 - Start Production Service:')
    print('   cd backend-services/services/user-api-service')
    print('   npm start')
    print()
    print('2. Terminal 2 - Start Dashboard Server (this script):')
    print('   python serve-live-dashboard.py')
    print()
    print('3. Terminal 3 - Open Dashboard in Browser:')
    print(f'   http://localhost:{PORT}')
    print()
    print('===========================================================')
    print()
    # Stage 5: Server Startup
    print('STAGE 5: SERVER STARTUP')
    print(f'  Binding to port {PORT}...')

    try:
        with socketserver.TCPServer(('', PORT), DashboardHandler) as httpd:
            print(f'  Server bound successfully')
            print(f'  Started at {datetime.now().strftime("%H:%M:%S")}')
            print()


            # Stage 6: Saving Configuration
            print('STAGE 6: SAVING CONFIGURATION')
            with open('dashboard_port.txt', 'w') as f:
                f.write(str(PORT))
            print(f'  Port {PORT} saved to dashboard_port.txt')
            print()

            # Stage 7: Ready for Connections
            print('STAGE 7: READY FOR CONNECTIONS')
            print(f'  Dashboard accessible at: http://localhost:{PORT}/')
            print(f'  Listening on: http://0.0.0.0:{PORT}')
            print(f'  API base: http://localhost:{backend_port}')
            print()
            print('===========================================================')
            print()
            print(f'DEPLOYMENT COMPLETE - Server online at port {PORT}')
            print('Real-time metrics active')
            print('Profit tracking enabled')
            print('Press Ctrl+C to stop')
            print()

            # Auto-open browser
            print('Opening dashboard in browser...')
            webbrowser.open(f'http://localhost:{PORT}/')
            print('Browser opened')
            print()
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print()
                print('Shutdown signal received...')
                print('Dashboard server stopped')
                sys.exit(0)
    except OSError as e:
        print(f'Failed to bind to port {PORT}: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
