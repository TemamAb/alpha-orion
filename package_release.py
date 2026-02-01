#!/usr/bin/env python3
import os
import shutil
import zipfile
import hashlib
import fnmatch
from datetime import datetime

RELEASE_VERSION = "2.0"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RELEASE_NAME = f"alpha-orion-enterprise-v{RELEASE_VERSION}"
OUTPUT_DIR = os.path.join(BASE_DIR, "dist")
RELEASE_PATH = os.path.join(OUTPUT_DIR, RELEASE_NAME)
ZIP_PATH = f"{RELEASE_PATH}.zip"

# Files and directories to include in the release
INCLUDES = [
    "backend-services",
    "contracts",
    "infrastructure",
    "tests",
    "docs",
    "LIVE_PROFIT_DASHBOARD.html",
    "serve-live-dashboard.py",
    "deployment_autopilot.py",
    "LAUNCH_DASHBOARD.sh",
    "LAUNCH_DASHBOARD.bat",
    "AUTO_DEPLOY.sh",
    "AUTO_DEPLOY.bat",
    "cloudbuild-enterprise.yaml",
    "docker-compose.yml",
    "ports.json",
    ".env.production.template",
    "README.md",
    "RELEASE_NOTES_v2.0.md",
    "LICENSE"
]

# Patterns to exclude inside directories
EXCLUDES = [
    "__pycache__",
    "node_modules",
    ".git",
    ".env",
    "*.log",
    ".DS_Store",
    "dist",
    "*.pyc",
    "*.zip"
]

def should_exclude(name):
    for pattern in EXCLUDES:
        if fnmatch.fnmatch(name, pattern):
            return True
    return False

def create_release():
    print(f"🚀 Packaging Alpha-Orion Enterprise v{RELEASE_VERSION}...")
    
    # Create dist directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    os.makedirs(RELEASE_PATH)

    # Copy files
    for item in INCLUDES:
        src = os.path.join(BASE_DIR, item)
        dst = os.path.join(RELEASE_PATH, item)
        
        if not os.path.exists(src):
            # print(f"⚠️  Warning: {item} not found, skipping.")
            continue

        if os.path.isdir(src):
            shutil.copytree(src, dst, ignore=lambda src, names: [n for n in names if should_exclude(n)])
        else:
            shutil.copy2(src, dst)
            
    print("✅ Files copied.")

    # Create Zip
    print("📦 Creating zip archive...")
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(RELEASE_PATH):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, OUTPUT_DIR)
                zipf.write(file_path, arcname)
    
    print(f"✅ Archive created: {ZIP_PATH}")

    # Generate Checksum
    sha256_hash = hashlib.sha256()
    with open(ZIP_PATH, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    checksum = sha256_hash.hexdigest()
    
    with open(os.path.join(OUTPUT_DIR, "CHECKSUM.txt"), "w") as f:
        f.write(f"{checksum}  {os.path.basename(ZIP_PATH)}")
        
    print(f"🔐 Checksum (SHA256): {checksum}")
    print("\n🎉 RELEASE PACKAGED SUCCESSFULLY!")
    print(f"📂 Location: {OUTPUT_DIR}")

if __name__ == "__main__":
    create_release()