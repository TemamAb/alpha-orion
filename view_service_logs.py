#!/usr/bin/env python3
"""
Cloud Run Log Viewer
Chief Architect's tool to stream logs from deployed services.
"""

import subprocess
import sys
import os
import argparse
import json

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

def view_logs(service_name, limit=50, follow=False):
    project_id = get_project_id()
    print(f"{Colors.HEADER}🔍 FETCHING LOGS: {service_name} ({project_id}){Colors.ENDC}")
    
    if follow:
        print(f"{Colors.BLUE}ℹ️  Streaming logs (Ctrl+C to stop)...{Colors.ENDC}")
        cmd = ["gcloud", "run", "services", "logs", "tail", service_name, f"--project={project_id}", "--region=us-central1"]
        try:
            subprocess.run(cmd)
        except KeyboardInterrupt:
            print("\nStopped.")
        return

    # Snapshot mode
    log_filter = f'resource.type="cloud_run_revision" AND resource.labels.service_name="{service_name}"'
    cmd = ["gcloud", "logging", "read", log_filter, f"--project={project_id}", f"--limit={limit}", "--format=json"]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if result.returncode != 0:
            print(f"{Colors.FAIL}❌ Error fetching logs: {result.stderr.strip()}{Colors.ENDC}")
            return

        try:
            logs = json.loads(result.stdout)
        except json.JSONDecodeError:
            print(f"{Colors.WARNING}⚠️  No logs found or invalid format.{Colors.ENDC}")
            return
        
        if not logs:
            print(f"{Colors.WARNING}⚠️  No logs found for {service_name}.{Colors.ENDC}")
            return

        # Print logs (newest first by default from gcloud, let's reverse to show flow)
        for entry in reversed(logs):
            timestamp = entry.get('timestamp', 'UNKNOWN')
            severity = entry.get('severity', 'INFO')
            
            payload = entry.get('jsonPayload', {})
            if payload:
                message = payload.get('message', str(payload))
            else:
                message = entry.get('textPayload', '')
                
            color = Colors.ENDC
            if severity == 'ERROR': color = Colors.FAIL
            elif severity == 'WARNING': color = Colors.WARNING
            elif severity == 'NOTICE': color = Colors.BLUE
            
            print(f"{Colors.BOLD}[{timestamp}]{Colors.ENDC} {color}{severity:<8}{Colors.ENDC} {message}")

    except Exception as e:
        print(f"{Colors.FAIL}❌ Execution error: {e}{Colors.ENDC}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="View Cloud Run Logs")
    parser.add_argument("service", nargs="?", default="user-api-service", help="Service name")
    parser.add_argument("--limit", type=int, default=20, help="Number of lines")
    parser.add_argument("--tail", action="store_true", help="Tail logs")
    
    args = parser.parse_args()
    view_logs(args.service, args.limit, args.tail)