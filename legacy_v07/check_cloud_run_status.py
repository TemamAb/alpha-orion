#!/usr/bin/env python3
"""
Cloud Run Status Verification Script
Chief Architect's tool to verify the health of deployed microservices.
"""

import subprocess
import json
import os
import sys

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def get_project_id():
    """Get the active GCP project ID"""
    # 1. Try environment variable
    project_id = os.environ.get("GCP_PROJECT_ID")
    if project_id:
        return project_id
        
    # 2. Try .env file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    paths = [
        os.path.join(os.getcwd(), '.env'),
        os.path.join(script_dir, '.env')
    ]
    for env_path in paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r") as f:
                    for line in f:
                        if line.startswith("GCP_PROJECT_ID="):
                            return line.split("=")[1].strip().strip('"').strip("'")
            except:
                pass

    # 3. Default fallback
    return "alpha-orion-485207"

def check_services():
    project_id = get_project_id()
    print(f"{Colors.BOLD}{Colors.HEADER}ALPHA-ORION CLOUD RUN STATUS CHECK{Colors.ENDC}")
    print(f"Project: {Colors.BLUE}{project_id}{Colors.ENDC}")
    print("=" * 80)

    try:
        # Check if gcloud is installed
        subprocess.run(["gcloud", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"{Colors.FAIL}❌ Error: 'gcloud' CLI not found. Please install Google Cloud SDK.{Colors.ENDC}")
        return

    print(f"⏳ Fetching service status from Google Cloud...")
    
    try:
        # Fetch services list in JSON
        cmd = [
            "gcloud", "run", "services", "list",
            f"--project={project_id}",
            "--format=json"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        
        if result.returncode != 0:
            print(f"{Colors.FAIL}❌ Error fetching services: {result.stderr.strip()}{Colors.ENDC}")
            return

        services = json.loads(result.stdout)
        
        if not services:
            print(f"\n{Colors.WARNING}⚠️  No Cloud Run services found.{Colors.ENDC}")
            print("   Have you run the deployment script yet?")
            return

        print(f"\n{Colors.BOLD}{'SERVICE':<30} | {'REGION':<15} | {'STATUS':<10} | {'URL'}{Colors.ENDC}")
        print("-" * 80)

        ready_count = 0
        
        for service in services:
            name = service.get('metadata', {}).get('name', 'unknown')
            region = service.get('metadata', {}).get('labels', {}).get('cloud.googleapis.com/location', 'us-central1')
            status_obj = service.get('status', {})
            url = status_obj.get('url', 'Pending...')
            
            # Determine status
            conditions = status_obj.get('conditions', [])
            is_ready = False
            status_str = "UNKNOWN"
            color = Colors.WARNING
            
            # Check for Ready condition
            for cond in conditions:
                if cond.get('type') == 'Ready':
                    if cond.get('status') == 'True':
                        is_ready = True
                        status_str = "READY"
                        color = Colors.GREEN
                    else:
                        status_str = "FAILED"
                        color = Colors.FAIL
                        msg = cond.get('message', '')
                        if msg:
                            url = f"Error: {msg[:40]}..."
                    break
            
            if is_ready:
                ready_count += 1
                
            print(f"{name:<30} | {region:<15} | {color}{status_str:<10}{Colors.ENDC} | {url}")
            
            if not is_ready:
                print(f"   👉 To debug: python view_service_logs.py {name}")

        print("-" * 80)
        
        if ready_count == len(services):
            print(f"\n{Colors.GREEN}✅ SYSTEM HEALTHY: {ready_count}/{len(services)} services active.{Colors.ENDC}")
        else:
            print(f"\n{Colors.WARNING}⚠️  SYSTEM DEGRADED: {ready_count}/{len(services)} services active.{Colors.ENDC}")

    except Exception as e:
        print(f"{Colors.FAIL}❌ Execution error: {e}{Colors.ENDC}")

if __name__ == "__main__":
    check_services()