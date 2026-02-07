import os
import shutil

# Root directory of the project
ROOT_DIR = r"c:\Users\op\Desktop\alpha-orion"
LEGACY_DIR = os.path.join(ROOT_DIR, "legacy_v07")

# Files and folders to KEEP in root
CORE_FILES = [
    ".git", ".github", ".gitignore", "alpha-08", "MASTER_PLAN.md", 
    "README.md", "README_v08.md", "TOD_PERFORMANCE_DASHBOARD.md",
    "GEMINI_PILOT_INSTRUCTIONS.md", "deployment.pyyy"
]

def liquify_legacy():
    if not os.path.exists(LEGACY_DIR):
        os.makedirs(LEGACY_DIR)
        print(f"Created legacy directory: {LEGACY_DIR}")

    for item in os.listdir(ROOT_DIR):
        item_path = os.path.join(ROOT_DIR, item)
        
        # Skip if it's a core file or the legacy dir itself
        if item in CORE_FILES or item == "legacy_v07":
            continue
            
        try:
            target_path = os.path.join(LEGACY_DIR, item)
            # Handle potential name collisions
            if os.path.exists(target_path):
                if os.path.isdir(target_path):
                    shutil.rmtree(target_path)
                else:
                    os.remove(target_path)
            
            shutil.move(item_path, LEGACY_DIR)
            print(f"Moved to Legacy: {item}")
        except Exception as e:
            print(f"Error moving {item}: {e}")

if __name__ == "__main__":
    print("Starting Legacy Liquidation for Alpha-08 Sovereign Upgrade...")
    liquify_legacy()
    print("Root Directory Cleaned. Only High-Velocity Sovereign assets remain.")
