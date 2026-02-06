import os
import shutil
from pathlib import Path

def cleanup_legacy_files():
    # Define the root of the workspace
    workspace_root = Path(r"C:\Users\op\Desktop\alpha-orion")
    
    # Define the target directory for legacy files
    deprecated_dir = workspace_root / "deprecated"
    
    # Define the Alpha-08 Sovereign Core directories/files to PRESERVE
    # These are the files essential for the new mission.
    preserve_list = {
        "alpha-08",          # The Core
        ".git",              # Version Control
        ".github",           # CI/CD Pipelines
        "cleanup_legacy.py", # Self
        "README.md",         # Documentation
        ".gitignore"         # Git config
    }

    print(f"🛡️  ALPHA-08 SOVEREIGN CLEANUP PROTOCOL")
    print(f"   Root: {workspace_root}")
    print(f"   Target: {deprecated_dir}")
    print("="*60)

    if not workspace_root.exists():
        print(f"❌ Error: Workspace root not found at {workspace_root}")
        return

    # Create deprecated folder if it doesn't exist
    if not deprecated_dir.exists():
        deprecated_dir.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created archive sector: {deprecated_dir.name}")

    # Scan and Move
    for item in workspace_root.iterdir():
        # Skip the deprecated folder itself and preserved items
        if item.name == "deprecated" or item.name in preserve_list:
            continue

        destination = deprecated_dir / item.name
        try:
            shutil.move(str(item), str(destination))
            print(f"   -> Archived: {item.name}")
        except Exception as e:
            print(f"   ⚠️  Failed to archive {item.name}: {e}")

    print("="*60)
    print(f"✨ Workspace optimized. Ready for Alpha-08 Sovereign deployment.")

if __name__ == "__main__":
    cleanup_legacy_files()