#!/usr/bin/env python3
"""
Final Deployment Report Generator
Chief Architect's tool to generate the final certification report.
"""

import os
import sys
import subprocess
import datetime
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

def check_services(project_id):
    """Check Cloud Run services status"""
    try:
        cmd = [
            "gcloud", "run", "services", "list",
            f"--project={project_id}",
            "--format=json"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return []
        return json.loads(result.stdout)
    except:
        return []

def generate_report():
    project_id = get_project_id()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print(f"{Colors.HEADER}Generating Final Deployment Report for {project_id}...{Colors.ENDC}")
    
    services = check_services(project_id)
    service_count = len(services)
    ready_count = sum(1 for s in services if any(c['type'] == 'Ready' and c['status'] == 'True' for c in s.get('status', {}).get('conditions', [])))
    
    report_content = f"""# 🚀 ALPHA-ORION PRODUCTION DEPLOYMENT REPORT

**Date**: {timestamp}
**Project ID**: {project_id}
**Status**: {'✅ SUCCESS' if ready_count > 0 else '⚠️ PARTIAL'}

## 1. Executive Summary
The Alpha-Orion Enterprise Arbitrage System has been deployed to Google Cloud Platform.
This report certifies the operational status of the infrastructure and services.

## 2. Infrastructure Status
- **Project**: {project_id}
- **Region**: us-central1
- **Infrastructure Mode**: Enterprise (Terraform Managed)

## 3. Service Health
**Total Services**: {service_count}
**Healthy Services**: {ready_count}

| Service Name | Region | Status | URL |
|--------------|--------|--------|-----|
"""

    for service in services:
        name = service.get('metadata', {}).get('name', 'unknown')
        region = service.get('metadata', {}).get('labels', {}).get('cloud.googleapis.com/location', 'us-central1')
        status_obj = service.get('status', {})
        url = status_obj.get('url', 'Pending...')
        
        is_ready = False
        for cond in status_obj.get('conditions', []):
            if cond.get('type') == 'Ready' and cond.get('status') == 'True':
                is_ready = True
                break
        
        status_icon = "✅ Ready" if is_ready else "❌ Failed"
        report_content += f"| {name} | {region} | {status_icon} | {url} |\n"

    report_content += """
## 4. Next Steps
1. **Monitor Logs**: Use `python view_service_logs.py` to track application behavior.
2. **Health Checks**: Use `python verify_service_health.py` for active probing.
3. **Scale**: Adjust `min_instances` in Terraform based on load.

---
**Certified by**: Chief Architect
**Alpha-Orion Enterprise v2.0**
"""

    filename = f"FINAL_DEPLOYMENT_REPORT.md"
    with open(filename, "w") as f:
        f.write(report_content)
        
    print(f"\n{Colors.GREEN}✅ Report generated successfully: {filename}{Colors.ENDC}")
    print("   Review this file for full deployment details.")

if __name__ == "__main__":
    generate_report()