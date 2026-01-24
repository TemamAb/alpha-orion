#!/usr/bin/env python3
"""
Alpha-Orion LIVE Profit Dashboard Server
Auto-detects free port and serves the real-time profit generation dashboard
"""

import http.server
import socketserver
import os
import sys
import socket
from datetime import datetime
import urllib.request
import urllib.error

DASHBOARD_FILE = 'LIVE_PROFIT_DASHBOARD.html'
HARDCODED_PORT = 8888  # Proposed working port

def find_free_port(start_port=8888, max_attempts=100):
    """
    Find a free port starting from start_port with instant detection
    Returns tuple: (port, is_default)
    """
    print()
    print('🔍 Scanning ports for availability...')
    print()
    
    for attempt, port in enumerate(range(start_port, start_port + max_attempts), 1):
        # Show progress indicator
        progress_bar = '█' * (attempt // 4)
        remaining = '░' * (25 - len(progress_bar))
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
                print(f'✅ Port {port} is AVAILABLE (default)')
            else:
                print(f'✅ Port {port} is FREE (port {start_port} was occupied)')
            
            print()
            return port, (port == start_port)
            
        except OSError:
            # Port is in use, try next one
            continue
    
    print()  # Clear progress line
    print()
    raise RuntimeError(f"❌ No free port found between {start_port} and {start_port + max_attempts}")

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/' or self.path == '/dashboard':
            self.path = '/' + DASHBOARD_FILE
            return super().do_GET()

        # API Endpoints - Proxy to Backend
        api_prefixes = ['/analytics', '/trades', '/opportunities', '/mode', '/pimlico', '/health']
        if any(self.path.startswith(p) for p in api_prefixes):
            self.handle_api_request()
            return

        return super().do_GET()
    
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
    print('\n')
    print('╔════════════════════════════════════════════════════════════╗')
    print('║      🚀 ALPHA-ORION LIVE PROFIT DASHBOARD SERVER 🚀        ║')
    print('║          PROPOSED PORT: 8888 (TESTING AVAILABILITY)        ║')
    print('╚════════════════════════════════════════════════════════════╝')
    print()
    
    # Stage 1: Setup
    print('📋 STAGE 1: INITIALIZATION')
    print('  ✓ Changing to working directory...')
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print('  ✓ Working directory set')
    print()
    
    # Stage 2: Port Detection
    if os.environ.get('PORT'):
        PORT = int(os.environ.get('PORT'))
        print('🔍 STAGE 2: PORT CONFIGURATION (ENV DETECTED)')
        print(f'  ✓ Using environment variable PORT: {PORT}')
    else:
        print('🔍 STAGE 2: PORT DETECTION (TESTING PORT 8888)')
        try:
            PORT, is_default = find_free_port(start_port=8888, max_attempts=1)
        except RuntimeError as e:
            print(f'{e}')
            print()
            print('⚠️  Port 8888 not available, will try fallback ports...')
            try:
                PORT, is_default = find_free_port(start_port=9200, max_attempts=100)
            except RuntimeError as e2:
                print(f'{e2}')
                sys.exit(1)
    print()
    
    # Stage 3: Configuration
    print('⚙️  STAGE 3: CONFIGURATION')
    print(f'  ✓ Dashboard File: {DASHBOARD_FILE}')
    print(f'  ✓ Server Port: {PORT}')
    print()
    
    # Stage 4: Verification
    print('✔️  STAGE 4: VERIFICATION')
    print()
    print('═════════════════════════════════════════════════════════════')
    print()
    print('🔗 ACCESS DASHBOARD:')
    print(f'   👉 http://localhost:{PORT}/')
    print(f'   👉 http://localhost:{PORT}/dashboard')
    print()
    print('📋 PRODUCTION API:')
    print('   👉 http://localhost:8080/analytics/total-pnl')
    print('   👉 http://localhost:8080/trades/executed')
    print('   👉 http://localhost:8080/opportunities')
    print()
    print('═════════════════════════════════════════════════════════════')
    print()
    print('💡 SETUP INSTRUCTIONS:')
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
    print('═════════════════════════════════════════════════════════════')
    print()
    
    # Stage 5: Server Startup
    print('🚀 STAGE 5: SERVER STARTUP')
    print(f'  ✓ Binding to port {PORT}...')
    
    try:
        with socketserver.TCPServer(('', PORT), DashboardHandler) as httpd:
            print(f'  ✓ Server bound successfully')
            print(f'  ✓ Started at {datetime.now().strftime("%H:%M:%S")}')
            print()
            
            # Stage 6: Saving Configuration
            print('💾 STAGE 6: SAVING CONFIGURATION')
            with open('dashboard_port.txt', 'w') as f:
                f.write(str(PORT))
            print(f'  ✓ Port {PORT} saved to dashboard_port.txt')
            print()
            
            # Stage 7: Ready for Connections
            print('✅ STAGE 7: READY FOR CONNECTIONS')
            print(f'  ✓ Dashboard accessible at: http://localhost:{PORT}/')
            print(f'  ✓ Listening on: http://0.0.0.0:{PORT}')
            print(f'  ✓ API base: http://localhost:8080')
            print()
            print('═════════════════════════════════════════════════════════════')
            print()
            print(f'🎉 DEPLOYMENT COMPLETE - Server online at port {PORT}')
            print('📊 Real-time metrics active')
            print('💰 Profit tracking enabled')
            print('⏸️  Press Ctrl+C to stop')
            print()
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print()
                print('🛑 Shutdown signal received...')
                print('📊 Dashboard server stopped')
                sys.exit(0)
    except OSError as e:
        print(f'❌ Failed to bind to port {PORT}: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
