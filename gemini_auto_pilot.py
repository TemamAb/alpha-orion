import os
import sys
import time
import subprocess
import shutil
import signal

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(PROJECT_ROOT, "backend-services", "services", "user-api-service")
LOG_SYSTEM = os.path.join(PROJECT_ROOT, "pilot_logs_system.txt")
LOG_API = os.path.join(PROJECT_ROOT, "pilot_logs_api.txt")
LOG_DASH = os.path.join(PROJECT_ROOT, "pilot_logs_dashboard.txt")

def log(msg):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] 🤖 {msg}")
    with open(LOG_SYSTEM, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")

def run_cmd(cmd, cwd=None, background=False, outfile=None):
    if background:
        with open(outfile, "w", encoding="utf-8") as out:
            return subprocess.Popen(cmd, cwd=cwd, shell=True, stdout=out, stderr=subprocess.STDOUT)
    else:
        return subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)

def kill_port(port):
    log(f"🔧 FIX: Clearing port {port}...")
    subprocess.run(f"for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :{port}') do taskkill /F /PID %a >nul 2>&1", shell=True)

def fix_dependencies():
    log("🔧 FIX: Corrupted dependencies detected. Reinstalling...")
    node_modules = os.path.join(API_DIR, "node_modules")
    lock_file = os.path.join(API_DIR, "package-lock.json")
    
    if os.path.exists(node_modules):
        try:
            shutil.rmtree(node_modules)
        except Exception as e:
            log(f"⚠️ Warning: Could not fully delete node_modules: {e}")
            
    if os.path.exists(lock_file):
        os.remove(lock_file)
        
    log("📦 Installing npm dependencies (this may take a minute)...")
    result = run_cmd("npm install", cwd=API_DIR)
    if result.returncode != 0:
        log(f"❌ npm install failed: {result.stderr}")
    else:
        log("✅ Dependencies restored.")

def check_logs_for_errors():
    # Check API Logs
    if os.path.exists(LOG_API):
        with open(LOG_API, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if "MODULE_NOT_FOUND" in content or "Cannot find module" in content:
                return "MISSING_MODULE"
            if "EADDRINUSE" in content:
                return "PORT_CONFLICT_8080"
    
    # Check Dashboard Logs
    if os.path.exists(LOG_DASH):
        with open(LOG_DASH, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if "WinError 10048" in content or "Address already in use" in content:
                return "PORT_CONFLICT_DASH"
                
    return None

def main():
    os.system("cls")
    print("===================================================")
    print("   GEMINI AUTONOMOUS PILOT - SELF-HEALING ENGINE   ")
    print("===================================================")
    
    # Initialize Logs
    with open(LOG_SYSTEM, "w") as f: f.write("--- PILOT START ---\n")
    with open(LOG_API, "w") as f: f.write("")
    with open(LOG_DASH, "w") as f: f.write("")

    # Initial Cleanup
    kill_port(8080)
    kill_port(8888)
    kill_port(9090)

    # Dependency Check
    if not os.path.exists(os.path.join(API_DIR, "node_modules")):
        log("📦 First run detected. Installing dependencies...")
        run_cmd("npm install", cwd=API_DIR)

    while True:
        log("🚀 Deploying Services...")
        
        # Start API
        api_proc = run_cmd("npm start", cwd=API_DIR, background=True, outfile=LOG_API)
        
        # Start Dashboard
        dash_proc = run_cmd("python serve-live-dashboard.py", cwd=PROJECT_ROOT, background=True, outfile=LOG_DASH)
        
        log("👁️  Monitoring telemetry for stability...")
        
        # Monitor Loop
        stable_cycles = 0
        while stable_cycles < 10:
            time.sleep(5)
            error = check_logs_for_errors()
            
            if error:
                log(f"🛑 ERROR DETECTED: {error}")
                
                # Kill processes
                subprocess.run("taskkill /F /IM node.exe >nul 2>&1", shell=True)
                subprocess.run("taskkill /F /IM python.exe >nul 2>&1", shell=True)
                
                # Apply Fixes
                if error == "MISSING_MODULE":
                    fix_dependencies()
                elif error == "PORT_CONFLICT_8080":
                    kill_port(8080)
                elif error == "PORT_CONFLICT_DASH":
                    kill_port(8888)
                    kill_port(9090)
                
                log("🔄 Redeploying solution...")
                break # Break inner loop to restart deployment
            
            stable_cycles += 1
            if stable_cycles % 2 == 0:
                log(f"✅ System Stable... (Cycle {stable_cycles}/10)")

if __name__ == "__main__":
    main()