import os
import subprocess
import sys

def main():
    print("🚀 Initializing Alpha-Orion Enterprise Orchestrator...")
    
    # 1. Install Dependencies
    print("\n📦 Checking dependencies...")
    req_file = os.path.join("backend-services", "services", "brain-orchestrator", "requirements.txt")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
    
    # 2. Run Orchestrator
    print("\n⚡ Starting Orchestrator...")
    orchestrator_script = os.path.join("backend-services", "services", "brain-orchestrator", "src", "enterprise_orchestrator.py")
    
    # Execute
    subprocess.call([sys.executable, orchestrator_script])

if __name__ == "__main__":
    main()