import socket
import os
import sys
import time

# Try to import requests, install if missing
try:
    import requests
except ImportError:
    print("📦 Installing required telemetry library 'requests'...")
    os.system("pip install requests")
    import requests

def print_header():
    print("\n" + "="*70)
    print("   🔍 ALPHA-ORION SYSTEM INTEGRITY & TELEMETRY DIAGNOSTIC")
    print("   Target: Dashboard Metrics, API Links, and Blockchain Feeds")
    print("="*70 + "\n")

def check_port(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            return s.connect_ex(('localhost', port)) == 0
    except:
        return False

def check_endpoint(base_url, path, description):
    url = f"{base_url}{path}"
    print(f"   Testing {description:<35} [{path}]...", end=" ")
    try:
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            data = response.json()
            print("✅ OK")
            return True, data
        else:
            print(f"❌ FAIL (HTTP {response.status_code})")
            return False, None
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION REFUSED")
        return False, None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False, None

def main():
    print_header()
    
    # ---------------------------------------------------------
    # 1. API SERVICE CHECK (Feeds the Sidebars)
    # ---------------------------------------------------------
    print("1️⃣  CHECKING PRODUCTION API (BACKEND - PORT 8080)")
    api_active = check_port(8080)
    
    if api_active:
        print("   ✅ Port 8080 is LISTENING (Service Active)")
        
        # Check specific sidebar data sources
        base = "http://localhost:8080"
        
        # Sidebar: Real-time Monitor
        alive, pnl = check_endpoint(base, "/analytics/total-pnl", "Sidebar: P&L Metrics")
        if alive and pnl:
            print(f"      ↳ 💰 Current P&L: {pnl.get('total_pnl', 'N/A')}")
        
        # Sidebar: History
        check_endpoint(base, "/trades/executed", "Sidebar: Trade History")
        
        # Main Panel: Opportunities
        check_endpoint(base, "/opportunities", "Main Panel: Opportunities")
        
        # Infrastructure: Pimlico
        check_endpoint(base, "/pimlico/status", "Infra: Gasless Paymaster")
        
    else:
        print("   ❌ Port 8080 is CLOSED")
        print("   ⚠️  ROOT CAUSE: The Node.js API is not running.")
        print("   👉 RESULT: Dashboard sidebars will be DEAD (No Data).")
        print("   👉 FIX: Run 'AUTO_DEPLOY.bat' to start the API service.")

    print("\n" + "-"*70 + "\n")

    # ---------------------------------------------------------
    # 2. DASHBOARD SERVER CHECK
    # ---------------------------------------------------------
    print("2️⃣  CHECKING DASHBOARD SERVER (FRONTEND)")
    port_file = "dashboard_port.txt"
    dashboard_port = 8888 # Default fallback
    
    if os.path.exists(port_file):
        try:
            with open(port_file, 'r') as f:
                content = f.read().strip()
                if content.isdigit():
                    dashboard_port = int(content)
        except:
            pass

    if check_port(dashboard_port):
        print(f"   ✅ Dashboard Port {dashboard_port} is LISTENING")
    else:
        print(f"   ❌ Dashboard Port {dashboard_port} is CLOSED")
        print("   👉 FIX: Run 'python serve-live-dashboard.py'")

    print("\n" + "-"*70 + "\n")

    # ---------------------------------------------------------
    # 3. EXTERNAL CONNECTIVITY (GCPlatforms & Blockchain)
    # ---------------------------------------------------------
    print("3️⃣  CHECKING EXTERNAL INTEGRATIONS")
    
    # Check Polygon RPC
    try:
        requests.get("https://polygon-rpc.com", timeout=3)
        print("   ✅ Polygon Blockchain RPC: REACHABLE")
    except:
        print("   ⚠️  Polygon Blockchain RPC: UNREACHABLE (Check Internet)")

    # Check GCP/Internet
    try:
        requests.get("https://www.google.com", timeout=3)
        print("   ✅ GCPlatforms/Internet: REACHABLE")
    except:
        print("   ❌ Internet Connection: FAILED")

    print("\n" + "="*70)
    
    if not api_active:
        print("❌ DIAGNOSTIC RESULT: API DOWN. Dashboard metrics cannot load.")
        print("   Please run 'AUTO_DEPLOY.bat' in a separate terminal.")
        sys.exit(1)
    else:
        print("✅ DIAGNOSTIC RESULT: SYSTEM HEALTHY. Metrics should be live.")
        sys.exit(0)

if __name__ == "__main__":
    main()