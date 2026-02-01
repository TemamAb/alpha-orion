#!/usr/bin/env python3
import subprocess
import time
import sys
import os
import signal
import requests

# Configuration
SERVER_SCRIPT = "serve-live-dashboard.py"
PORT = "8888"

# Test Scenarios: (Test Name, Script File, Success Marker in Output)
TEST_SCRIPTS = [
    ("Local Port Conflict & Healing", "simulate_local_conflict.sh", "Local instance running"),
    ("Emergency Halt Functionality", "simulate_halt_deployment.sh", "Deployment process halted"),
    ("Stuck Deployment & Restart", "simulate_stuck_deployment.sh", "Recovery Sequence Initiated"),
    ("Cloud Deployment & Self-Healing", "simulate_successful_deploy.sh", "System reported '100% Functional'")
]

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def start_server():
    print(f"{Colors.BLUE}🚀 Starting Dashboard Server for Testing...{Colors.ENDC}")
    env = os.environ.copy()
    env['PORT'] = PORT
    
    # Run server in background, suppress output to keep test runner clean
    process = subprocess.Popen(
        [sys.executable, SERVER_SCRIPT],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
        preexec_fn=os.setsid if os.name != 'nt' else None
    )
    time.sleep(3) # Warmup time
    return process

def stop_server(process):
    print(f"{Colors.BLUE}🛑 Stopping Dashboard Server...{Colors.ENDC}")
    if os.name != 'nt':
        try:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except:
            pass
    else:
        process.terminate()
    process.wait()

def run_test(name, script, success_marker):
    print(f"\n{Colors.HEADER}🧪 TEST: {name}{Colors.ENDC}")
    print(f"   Running {script}...")
    
    try:
        # Run the bash script
        result = subprocess.run(
            ["bash", script],
            capture_output=True,
            text=True,
            timeout=90 # Safety timeout
        )
        
        output = result.stdout
        
        if success_marker in output:
            print(f"   {Colors.GREEN}✅ PASSED{Colors.ENDC}")
            return True
        else:
            print(f"   {Colors.FAIL}❌ FAILED{Colors.ENDC}")
            print(f"   Expected marker: '{success_marker}'")
            print(f"   Last 5 lines of output:")
            print('\n'.join(output.splitlines()[-5:]))
            return False
            
    except Exception as e:
        print(f"   {Colors.FAIL}❌ ERROR: {str(e)}{Colors.ENDC}")
        return False

def main():
    print(f"{Colors.BOLD}==================================================={Colors.ENDC}")
    print(f"{Colors.BOLD}   ALPHA-ORION DEPLOYMENT SYSTEM - TEST SUITE      {Colors.ENDC}")
    print(f"{Colors.BOLD}==================================================={Colors.ENDC}")
    
    server_process = start_server()
    
    try:
        results = []
        for name, script, marker in TEST_SCRIPTS:
            success = run_test(name, script, marker)
            results.append((name, success))
            time.sleep(2) # Cooldown between tests
            
        print(f"\n{Colors.BOLD}==================================================={Colors.ENDC}")
        print(f"{Colors.BOLD}   TEST RESULTS SUMMARY{Colors.ENDC}")
        print(f"{Colors.BOLD}==================================================={Colors.ENDC}")
        
        passed_count = 0
        for name, success in results:
            status = f"{Colors.GREEN}✅ PASS{Colors.ENDC}" if success else f"{Colors.FAIL}❌ FAIL{Colors.ENDC}"
            print(f" {status} | {name}")
            if success: passed_count += 1
            
        print(f"{Colors.BOLD}==================================================={Colors.ENDC}")
        print(f" Score: {passed_count}/{len(results)}")
        
        if passed_count == len(results):
            print(f"\n{Colors.GREEN}🏆 SYSTEM CERTIFIED FOR DEPLOYMENT{Colors.ENDC}")
        else:
            print(f"\n{Colors.FAIL}⚠️  SYSTEM NEEDS REVIEW{Colors.ENDC}")
            
    finally:
        stop_server(server_process)

if __name__ == "__main__":
    main()