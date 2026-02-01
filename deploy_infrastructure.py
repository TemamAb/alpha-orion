#!/usr/bin/env python3
"""
Alpha-Orion Infrastructure Deployment Script
Automates Terraform deployment for the enterprise architecture.
"""

import os
import subprocess
import sys
import time

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def load_env_vars():
    """Load environment variables from .env file"""
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
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            key, value = line.split('=', 1)
                            os.environ[key.strip()] = value.strip().strip("'").strip('"')
            except Exception:
                pass

def get_project_id():
    """Get the active GCP project ID"""
    return os.environ.get("GCP_PROJECT_ID", "alpha-orion-485207")

def run_command(command, cwd=None, description=None):
    """Run a shell command with formatted output"""
    if description:
        print(f"{Colors.BLUE}ℹ️  {description}...{Colors.ENDC}")
    
    try:
        process = subprocess.Popen(
            command,
            cwd=cwd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Stream output
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(f"   {output.strip()}")
                
        return_code = process.poll()
        
        if return_code != 0:
            stderr = process.stderr.read()
            print(f"{Colors.FAIL}❌ Command failed with code {return_code}{Colors.ENDC}")
            if stderr:
                print(f"{Colors.FAIL}   {stderr.strip()}{Colors.ENDC}")
            return False
            
        if description:
            print(f"{Colors.GREEN}✅ {description} Complete{Colors.ENDC}")
        return True
    except Exception as e:
        print(f"{Colors.FAIL}❌ Execution error: {e}{Colors.ENDC}")
        return False

def main():
    print(f"{Colors.BOLD}{Colors.HEADER}ALPHA-ORION INFRASTRUCTURE DEPLOYMENT (TERRAFORM){Colors.ENDC}")
    print("=" * 60)
    
    # 1. Setup
    load_env_vars()
    project_id = get_project_id()
    print(f"Target Project: {Colors.BOLD}{project_id}{Colors.ENDC}")
    
    # Check Terraform
    if not run_command("terraform version", description="Checking Terraform installation"):
        print(f"{Colors.WARNING}⚠️  Terraform not found. Please install Terraform to proceed.{Colors.ENDC}")
        return 1

    # Locate Infrastructure Directory
    infra_dir = os.path.join(os.getcwd(), "infrastructure")
    if not os.path.exists(infra_dir):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        infra_dir = os.path.join(script_dir, "infrastructure")
    
    if not os.path.exists(infra_dir):
        print(f"{Colors.FAIL}❌ 'infrastructure' directory not found.{Colors.ENDC}")
        return 1
        
    print(f"Infrastructure Directory: {infra_dir}")
    print("-" * 60)

    # 2. Initialize
    if not run_command("terraform init", cwd=infra_dir, description="Initializing Terraform"):
        return 1
        
    # 3. Plan
    print(f"\n{Colors.BLUE}ℹ️  Generating Execution Plan...{Colors.ENDC}")
    plan_cmd = f"terraform plan -var='project_id={project_id}' -out=tfplan"
    if not run_command(plan_cmd, cwd=infra_dir):
        return 1
        
    # 4. Apply
    print(f"\n{Colors.HEADER}🚀 READY TO DEPLOY{Colors.ENDC}")
    print("Applying infrastructure changes to Google Cloud...")
    time.sleep(2)
    
    apply_cmd = "terraform apply -auto-approve tfplan"
    if run_command(apply_cmd, cwd=infra_dir, description="Applying Infrastructure"):
        print(f"\n{Colors.GREEN}🎉 DEPLOYMENT SUCCESSFUL!{Colors.ENDC}")
        print("The Alpha-Orion infrastructure is now active.")
        return 0
    else:
        print(f"\n{Colors.FAIL}❌ DEPLOYMENT FAILED{Colors.ENDC}")
        return 1

if __name__ == "__main__":
    sys.exit(main())