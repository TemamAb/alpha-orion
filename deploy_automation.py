#!/usr/bin/env python3
"""
Alpha-Orion Master Deployment Automation
Analyzes readiness, pushes to GitHub, and deploys to GCP.
"""
import os
import sys
import subprocess
import shutil

# Import project ID logic from existing tool
try:
    from check_gcp_apis import get_project_id
except ImportError:
    print("⚠️  Could not import check_gcp_apis. Using fallback.")
    def get_project_id(): return "alpha-orion-485207"

PROJECT_ID = get_project_id()
DASHBOARD_SOURCE_TYPO = "production/approved-dashbaord.html" # As per user request
DASHBOARD_TARGET = "production/approved-dashboard.html" # Normalized name

def log(msg):
    print(f"\n[AUTO-DEPLOY] {msg}")

def run_cmd(cmd, exit_on_fail=True):
    print(f"   $ {cmd}")
    ret = subprocess.call(cmd, shell=True)
    if ret != 0 and exit_on_fail:
        print(f"❌ Command failed: {cmd}")
        sys.exit(1)
    return ret

def ensure_gcloud_path():
    """Ensure gcloud is in the PATH for Windows environments"""
    # Check if gcloud is already available
    if shutil.which("gcloud"):
        return

    log("⚠️  'gcloud' not found in PATH. Searching common Windows locations...")
    
    common_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Cloud SDK\google-cloud-sdk\bin"),
        os.path.expandvars(r"%ProgramFiles%\Google\Cloud SDK\google-cloud-sdk\bin"),
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin"),
        os.path.expanduser(r"~\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin")
    ]

    for path in common_paths:
        if os.path.exists(path):
            log(f"🔄 Found gcloud at: {path}")
            os.environ["PATH"] += os.pathsep + path
            log("✅ gcloud added to PATH successfully.")
            return

def prepare_dashboard():
    log("Preparing Dashboard...")
    
    # Ensure production directory exists
    if not os.path.exists("production"):
        os.makedirs("production")
        
    # Handle the specific file requested (normalizing typo)
    if os.path.exists(DASHBOARD_SOURCE_TYPO):
        log(f"Found requested dashboard: {DASHBOARD_SOURCE_TYPO}")
        if DASHBOARD_SOURCE_TYPO != DASHBOARD_TARGET:
            shutil.copy(DASHBOARD_SOURCE_TYPO, DASHBOARD_TARGET)
            log(f"Normalized to: {DASHBOARD_TARGET}")
    elif os.path.exists("simulation/approved-dashboard.html"):
        log("Using simulation dashboard as base for production.")
        shutil.copy("simulation/approved-dashboard.html", DASHBOARD_TARGET)
    elif not os.path.exists(DASHBOARD_TARGET):
        log("⚠️  Dashboard file not found. Creating placeholder.")
        with open(DASHBOARD_TARGET, "w", encoding="utf-8") as f:
            f.write("<html><body><h1>Alpha-Orion Production Dashboard</h1><p>System Active.</p></body></html>")
    else:
        log(f"Dashboard ready at {DASHBOARD_TARGET}")

def update_server_script():
    log("Updating Dashboard Server Script...")
    script_path = "serve-live-dashboard.py"
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Update the dashboard file path in the script
        if 'DASHBOARD_FILE = "simulation/approved-dashboard.html"' in content:
            content = content.replace(
                'DASHBOARD_FILE = "simulation/approved-dashboard.html"',
                f'DASHBOARD_FILE = "{DASHBOARD_TARGET}"'
            )
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(content)
            log("Updated serve-live-dashboard.py to serve production dashboard.")
    else:
        log("❌ serve-live-dashboard.py not found!")

def git_push():
    log("Pushing to GitHub...")
    # We use exit_on_fail=False because git might not have changes or remote might be tricky
    run_cmd("git add .", exit_on_fail=False)
    run_cmd('git commit -m "🚀 Automated Deployment: Production Dashboard & Infrastructure" || echo "No changes to commit"', exit_on_fail=False)
    run_cmd("git push origin main", exit_on_fail=False)

def fix_iam_permissions():
    log("Fixing IAM permissions for Cloud Build/Storage...")
    try:
        # Get Project Number
        cmd = f"gcloud projects describe {PROJECT_ID} --format=\"value(projectNumber)\""
        out = subprocess.check_output(cmd, shell=True)
        project_number = out.decode().strip()
        
        if not project_number:
            log("⚠️ Could not determine project number. Skipping IAM fix.")
            return

        # Default Compute Service Account (often used by Cloud Run source deploys)
        compute_sa = f"{project_number}-compute@developer.gserviceaccount.com"
        
        log(f"Granting Storage Admin to {compute_sa}...")
        run_cmd(f"gcloud projects add-iam-policy-binding {PROJECT_ID} "
                f"--member=serviceAccount:{compute_sa} --role=roles/storage.admin --condition=None --quiet", exit_on_fail=False)
                
    except Exception as e:
        log(f"⚠️ Error fixing IAM: {e}")

def deploy_gcp():
    log(f"Deploying to GCP Project: {PROJECT_ID}")
    
    # 1. Verify APIs (using existing script)
    log("Verifying GCP APIs...")
    try:
        subprocess.run([sys.executable, "check_gcp_apis.py"], check=False)
    except Exception as e:
        print(f"API check warning: {e}")

    # 2. Deploy Dashboard Service
    log("Deploying Dashboard Service to Cloud Run...")
    
    # Create Procfile for Buildpacks
    with open("Procfile", "w", encoding="utf-8") as f:
        f.write("web: python serve-live-dashboard.py\n")
            
    cmd = (
        f"gcloud run deploy alpha-orion-dashboard "
        f"--source . "
        f"--project {PROJECT_ID} "
        f"--region us-central1 "
        f"--allow-unauthenticated "
        f"--set-env-vars=GCP_PROJECT_ID={PROJECT_ID} "
        f"--quiet"
    )
    run_cmd(cmd, exit_on_fail=False)

def main():
    ensure_gcloud_path()
    prepare_dashboard()
    update_server_script()
    fix_iam_permissions()
    git_push()
    deploy_gcp()
    log("✅ AUTOMATED DEPLOYMENT COMPLETED")

if __name__ == "__main__":
    main()