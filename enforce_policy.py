import os
from pathlib import Path
import sys

def enforce_project_root_policy():
    """
    Ensures that commands are run from within the designated alpha-08 project root.
    This script enforces PROTOCOL-01 from the MASTER_PLAN.md.
    """
    # Define the absolute, canonical path for the project root
    canonical_project_root = Path("C:/Users/op/Desktop/alpha-orion/alpha-08").resolve()
    current_working_dir = Path.cwd().resolve()

    print("="*60)
    print("🛡️  ALPHA-08 DIRECTORY POLICY ENFORCEMENT  🛡️")
    print(f"   Required Root: ...\\alpha-08")
    print(f"   Current Path:  ...\\{current_working_dir.relative_to(current_working_dir.parents[1])}")
    print("="*60)

    if not str(current_working_dir).startswith(str(canonical_project_root)):
        print("\n❌ POLICY VIOLATION: You are operating outside the project boundary.")
        print(f"\n👉 ACTION REQUIRED: Change directory into the project root.")
        print(f"   cd C:\\Users\\op\\Desktop\\alpha-orion\\alpha-08")
        sys.exit(1)

if __name__ == "__main__":
    enforce_project_root_policy()