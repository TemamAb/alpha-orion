import os
import sys
import time
import subprocess
import shutil
import json

# 1. Force UTF-8 for Windows Consoles to prevent crashes
sys.stdout.reconfigure(encoding='utf-8')

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(PROJECT_ROOT, "backend-services", "services", "user-api-service")
LOG_SYSTEM = os.path.join(PROJECT_ROOT, "pilot_logs_system.txt")
LOG_API = os.path.join(PROJECT_ROOT, "pilot_logs_api.txt")
LOG_DASH = os.path.join(PROJECT_ROOT, "pilot_logs_dashboard.txt")

def log(msg):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] 🤖 {msg}")
    try:
        with open(LOG_SYSTEM, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {msg}\n")
    except:
        pass # Ignore log write errors if file is locked

def run_cmd(cmd, cwd=None, background=False, outfile=None):
    if background:
        # Open file in append mode to avoid locking issues
        out = open(outfile, "w", encoding="utf-8")
        return subprocess.Popen(cmd, cwd=cwd, shell=True, stdout=out, stderr=subprocess.STDOUT)
    else:
        return subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, encoding='utf-8')

def kill_port(port):
    # log(f"🔧 Maintenance: Clearing port {port}...")
    subprocess.run(f"for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :{port}') do taskkill /F /PID %a >nul 2>&1", shell=True)

def patch_package_json():
    """Autonomous Fix: Removes broken dependencies from package.json"""
    pkg_path = os.path.join(API_DIR, "package.json")
    if not os.path.exists(pkg_path): return

    try:
        with open(pkg_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changed = False
        # Remove bad dependency
        if "@google-cloud/opentelemetry-cloud-trace-exporter" in data.get("dependencies", {}):
            del data["dependencies"]["@google-cloud/opentelemetry-cloud-trace-exporter"]
            changed = True
            log("🔧 FIX: Removed broken '@google-cloud/opentelemetry-cloud-trace-exporter'")

        # Remove overrides
        if "overrides" in data:
            del data["overrides"]
            changed = True
            log("🔧 FIX: Removed conflicting 'overrides'")

        if changed:
            with open(pkg_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            log("✅ package.json patched successfully.")
            
            # Remove node_modules to force clean install
            shutil.rmtree(os.path.join(API_DIR, "node_modules"), ignore_errors=True)
            if os.path.exists(os.path.join(API_DIR, "package-lock.json")):
                os.remove(os.path.join(API_DIR, "package-lock.json"))

    except Exception as e:
        log(f"⚠️ Warning during patch: {e}")

def check_logs_for_errors():
    # Check API Logs
    if os.path.exists(LOG_API):
        try:
            with open(LOG_API, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if "MODULE_NOT_FOUND" in content or "Cannot find module" in content:
                    return "MISSING_MODULE"
                if "EADDRINUSE" in content:
                    return "PORT_CONFLICT_8080"
        except: pass
    
    # Check Dashboard Logs
    if os.path.exists(LOG_DASH):
        try:
            with open(LOG_DASH, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if "WinError 10048" in content or "Address already in use" in content:
                    return "PORT_CONFLICT_DASH"
        except: pass
                
    return None

def main():
    print("===================================================")
    print("   GEMINI AUTONOMOUS PILOT - SELF-HEALING ENGINE   ")
    print("===================================================")
    
    # 1. Initial Cleanup
    log("🧹 Performing pre-flight cleanup...")
    kill_port(8080)
    kill_port(8888)
    kill_port(9090)

    # 2. Auto-Patch Codebase
    patch_package_json()

    # 3. Dependency Check
    if not os.path.exists(os.path.join(API_DIR, "node_modules")):
        log("📦 Installing dependencies (this may take a minute)...")
        run_cmd("npm install", cwd=API_DIR)

    # 4. Continuous Loop
    while True:
        log("🚀 Deploying Services...")
        
        # Reset Logs
        open(LOG_API, 'w').close()
        open(LOG_DASH, 'w').close()

        # Start API
        api_proc = run_cmd("npm start", cwd=API_DIR, background=True, outfile=LOG_API)
        
        # Start Dashboard
        dash_proc = run_cmd("python serve-live-dashboard.py", cwd=PROJECT_ROOT, background=True, outfile=LOG_DASH)
        
        log("👁️  Monitoring telemetry for stability...")
        
        # Monitor Loop
        stable_cycles = 0
        while stable_cycles < 120: # Monitor for 10 minutes per cycle
            time.sleep(5)
            error = check_logs_for_errors()
            
            if error:
                log(f"🛑 ERROR DETECTED: {error}")
                
                # Kill processes
                subprocess.run("taskkill /F /IM node.exe >nul 2>&1", shell=True)
                subprocess.run("taskkill /F /IM python.exe >nul 2>&1", shell=True)
                
                # Apply Fixes
                if error == "MISSING_MODULE":
                    log("🔧 FIX: Re-running npm install...")
                    run_cmd("npm install", cwd=API_DIR)
                elif "PORT_CONFLICT" in error:
                    kill_port(8080)
                    kill_port(8888)
                
                log("🔄 Redeploying solution...")
                break # Break inner loop to restart deployment
            
            stable_cycles += 1
            if stable_cycles % 6 == 0:
                log(f"✅ System Stable... (Running for {stable_cycles * 5}s)")

if __name__ == "__main__":
    main()