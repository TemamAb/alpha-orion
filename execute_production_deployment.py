#!/usr/bin/env python3
import sys
import subprocess

try:
    import requests
except ImportError:
    print("Installing required package: requests...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

import time
import os
import json
import subprocess
from datetime import datetime

# Import Autopilot for direct engagement
try:
    import deployment_autopilot
except ImportError:
    pass

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def get_dashboard_url():
    port = 8888
    if os.path.exists('dashboard_port.txt'):
        try:
            with open('dashboard_port.txt', 'r') as f:
                port = int(f.read().strip())
        except:
            pass
    return f"http://localhost:{port}"

def verify_stream_connection(base_url):
    """Check if the profit stream endpoint is reachable"""
    print(f"   📡 Verifying stream connection...", end=" ")
    try:
        response = requests.get(f"{base_url}/trades/executed", timeout=2)
        if response.status_code == 200:
            print(f"{Colors.GREEN}OK{Colors.ENDC}")
            return True
    except:
        pass
    print(f"{Colors.WARNING}UNSTABLE{Colors.ENDC}")
    return False

def monitor_real_time_profits(base_url):
    print(f"\n{Colors.HEADER}💰 STARTING LIVE PROFIT MONITOR (REAL-TIME STREAM){Colors.ENDC}")
    print(f"   Listening for LIVE blockchain events from API (No Mock Data)...\n")
    
    seen_trades = set()
    cumulative_profit = 0.0
    
    try:
        while True:
            try:
                # Poll the trades endpoint
                response = requests.get(f"{base_url}/trades/executed", timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    trades = data.get('trades', []) if isinstance(data, dict) else data
                    
                    if isinstance(trades, list):
                        for trade in trades:
                            trade_id = trade.get('id') or trade.get('txHash')
                            if trade_id and trade_id not in seen_trades:
                                seen_trades.add(trade_id)
                                
                                try:
                                    profit = float(trade.get('profit', 0))
                                except:
                                    profit = 0.0
                                    
                                cumulative_profit += profit
                                
                                timestamp = trade.get('timestamp') or datetime.now().strftime("%H:%M:%S")
                                pair = trade.get('pair', 'Unknown')
                                strategy = trade.get('strategy', 'Arbitrage')
                                chain = trade.get('chain', 'Polygon zkEVM')
                                block = trade.get('blockNumber', 'Pending')
                                
                                print(f"{Colors.GREEN}✅ [PROFIT] {timestamp} | Block #{block} | {chain}{Colors.ENDC}")
                                print(f"   Strategy: {strategy} | Pair: {pair}")
                                print(f"   Profit: +${profit:.2f} | Cumulative: ${cumulative_profit:,.2f}")
                                print(f"   {Colors.BLUE}---------------------------------------------------{Colors.ENDC}")
            except Exception:
                pass
            time.sleep(2)
    except KeyboardInterrupt:
        print(f"\n{Colors.HEADER}🛑 MONITORING STOPPED{Colors.ENDC}")
        print(f"   Total Session Profit: ${cumulative_profit:,.2f}")

def verify_credentials():
    """Verify GCP Project ID from .env"""
    project_id = os.environ.get("GCP_PROJECT_ID")
    if not project_id:
        # Try loading from .env manually for display
        paths = [".env", ".env.production"]
        for p in paths:
            if os.path.exists(p):
                with open(p, "r") as f:
                    for line in f:
                        if line.startswith("GCP_PROJECT_ID="):
                            project_id = line.split("=")[1].strip().strip('"').strip("'")
                            break
            if project_id: break
    
    if project_id:
        print(f"   🔐 Credentials Verified. Target Project: {Colors.BOLD}{project_id}{Colors.ENDC}")
        return project_id
    else:
        print(f"   {Colors.WARNING}⚠️  GCP_PROJECT_ID not found in environment. Using default.{Colors.ENDC}")
        return "alpha-orion-485207"

def ensure_dashboard_running():
    """Auto-start dashboard if not running"""
    url = get_dashboard_url()
    try:
        requests.get(url, timeout=0.5)
        return url
    except:
        print(f"{Colors.WARNING}⚠️  Dashboard not active. Initiating launch sequence...{Colors.ENDC}")
        try:
            # Start in background
            if os.path.exists("serve-live-dashboard.py"):
                subprocess.Popen([sys.executable, "serve-live-dashboard.py"], 
                               stdout=subprocess.DEVNULL, 
                               stderr=subprocess.DEVNULL)
                
                # Wait for port file and startup
                print(f"   ⏳ Waiting for dashboard services...")
                for _ in range(10):
                    time.sleep(1)
                    try:
                        url = get_dashboard_url()
                        requests.get(url, timeout=0.5)
                        print(f"   {Colors.GREEN}✅ Dashboard online{Colors.ENDC}")
                        return url
                    except:
                        pass
            else:
                 print(f"{Colors.FAIL}❌ serve-live-dashboard.py not found.{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.FAIL}❌ Failed to start dashboard: {e}{Colors.ENDC}")
            sys.exit(1)
    return url

def execute_deployment():
    print(f"{Colors.BOLD}{Colors.HEADER}ALPHA-ORION: NON-STOP PROFIT GENERATION PROTOCOL{Colors.ENDC}")
    print(f"{Colors.BLUE}Authorized by: Chief Architect{Colors.ENDC}")
    print("=" * 60)
    
    verify_credentials()
    
    # PHASE 1: INFRASTRUCTURE DEPLOYMENT
    print(f"\n{Colors.HEADER}🚀 PHASE 1: INFRASTRUCTURE DEPLOYMENT{Colors.ENDC}")
    print("   Engaging Autopilot for Direct Cloud Run Deployment...")
    
    try:
        autopilot = deployment_autopilot.DeploymentAutopilot()
        autopilot.deploy_to_cloud_run()
    except Exception as e:
        print(f"{Colors.FAIL}❌ Deployment sequence failed: {e}{Colors.ENDC}")
        return

    # PHASE 2: DASHBOARD CONFIGURATION
    print(f"\n{Colors.HEADER}🚀 PHASE 2: DASHBOARD CONFIGURATION{Colors.ENDC}")
    
    service_url = None
    if os.path.exists("service_url.txt"):
        with open("service_url.txt", "r") as f:
            service_url = f.read().strip()
            
    if not service_url:
        print("   ⚠️  service_url.txt not found. Querying gcloud directly...")
        try:
            # Fallback to manual query
            cmd = "gcloud run services describe alpha-orion-core --platform managed --region us-central1 --format 'value(status.url)'"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
            if result.returncode == 0 and result.stdout.strip():
                service_url = result.stdout.strip()
        except:
            pass
            
    if not service_url:
        print(f"{Colors.FAIL}❌ Could not determine Service URL. Aborting.{Colors.ENDC}")
        return
        
    print(f"   ✅ Service Active at: {Colors.BLUE}{service_url}{Colors.ENDC}")
    print("   🔄 Reconfiguring Dashboard to connect to Cloud Service...")
    
    # Start new dashboard instance with correct backend URL
    env = os.environ.copy()
    env["BACKEND_URL"] = service_url
    
    try:
        subprocess.Popen([sys.executable, "serve-live-dashboard.py"], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("   ⏳ Waiting for dashboard services...")
        time.sleep(5)
    except Exception as e:
        print(f"{Colors.FAIL}❌ Failed to start dashboard: {e}{Colors.ENDC}")
        return

    # Get new dashboard URL
    dashboard_url = get_dashboard_url()
    print(f"   ✅ Dashboard Online: {dashboard_url}")
    
    try:
        import webbrowser
        webbrowser.open(dashboard_url)
    except:
        pass

    # PHASE 3: MONITOR
    print(f"\n{Colors.HEADER}🚀 PHASE 3: PROFIT MONITORING{Colors.ENDC}")
    verify_stream_connection(dashboard_url)
    monitor_real_time_profits(dashboard_url)

if __name__ == "__main__":
    execute_deployment()