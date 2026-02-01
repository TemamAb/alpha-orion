#!/usr/bin/env python3
"""
Service Health Verification Script
Chief Architect's tool to actively probe deployed service endpoints.
"""

import subprocess
import sys
import os
import time
import urllib.request
import urllib.error

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
    project_id = os.environ.get("GCP_PROJECT_ID")
    if project_id:
        return project_id
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    paths = [os.path.join(os.getcwd(), '.env'), os.path.join(script_dir, '.env')]
    for env_path in paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r") as f:
                    for line in f:
                        if line.startswith("GCP_PROJECT_ID="):
                            return line.split("=")[1].strip().strip('"').strip("'")
            except:
                pass
    return "alpha-orion-485207"

def get_service_url(service_name, project_id):
    """Get the URL for a Cloud Run service"""
    print(f"🔍 Locating service: {service_name}...")
    try:
        cmd = [
            "gcloud", "run", "services", "describe", service_name,
            f"--project={project_id}",
            "--platform=managed",
            "--region=us-central1",
            "--format=value(status.url)"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        else:
            print(f"{Colors.WARNING}⚠️  Could not find URL for {service_name}{Colors.ENDC}")
            return None
    except Exception as e:
        print(f"{Colors.FAIL}❌ Error getting service URL: {e}{Colors.ENDC}")
        return None

def probe_endpoint(base_url, path):
    """Probe a specific endpoint"""
    url = f"{base_url}{path}"
    print(f"   👉 Probing {path}...", end=" ", flush=True)
    
    try:
        req = urllib.request.Request(url)
        start_time = time.time()
        with urllib.request.urlopen(req, timeout=10) as response:
            latency = (time.time() - start_time) * 1000
            status = response.status
            
            if status == 200:
                print(f"{Colors.GREEN}✅ OK ({status}) - {latency:.0f}ms{Colors.ENDC}")
                return True
            else:
                print(f"{Colors.WARNING}⚠️  Status {status}{Colors.ENDC}")
                return False
    except urllib.error.HTTPError as e:
        print(f"{Colors.FAIL}❌ HTTP {e.code}{Colors.ENDC}")
        return False
    except urllib.error.URLError as e:
        print(f"{Colors.FAIL}❌ Connection Failed: {e.reason}{Colors.ENDC}")
        return False
    except Exception as e:
        print(f"{Colors.FAIL}❌ Error: {e}{Colors.ENDC}")
        return False

def main():
    project_id = get_project_id()
    print(f"{Colors.BOLD}{Colors.HEADER}ALPHA-ORION SERVICE HEALTH VERIFICATION{Colors.ENDC}")
    print(f"Project: {Colors.BLUE}{project_id}{Colors.ENDC}")
    print("=" * 60)

    services_to_check = ["user-api-service"]
    
    for service in services_to_check:
        url = get_service_url(service, project_id)
        if url:
            print(f"   🌐 URL: {url}")
            print("-" * 40)
            
            endpoints = ["/health", "/ready", "/"]
            success_count = 0
            
            for endpoint in endpoints:
                if probe_endpoint(url, endpoint):
                    success_count += 1
            
            print("-" * 40)
            if success_count == len(endpoints):
                print(f"{Colors.GREEN}🎉 Service {service} is FULLY OPERATIONAL{Colors.ENDC}\n")
            elif success_count > 0:
                print(f"{Colors.WARNING}⚠️  Service {service} is PARTIALLY OPERATIONAL{Colors.ENDC}\n")
            else:
                print(f"{Colors.FAIL}❌ Service {service} is UNREACHABLE{Colors.ENDC}\n")

if __name__ == "__main__":
    main()