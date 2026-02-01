"""
Environment Verification Script
Checks for .env existence and validates required keys for the Enterprise Orchestrator
"""

import os
import sys

# Define required keys based on enterprise_orchestrator.py
REQUIRED_KEYS = [
    'ETHEREUM_RPC_URL',
    'POLYGON_RPC_URL',
    'ARBITRUM_RPC_URL',
    'OPTIMISM_RPC_URL',
    'BSC_RPC_URL',
    'AVALANCHE_RPC_URL',
    'BASE_RPC_URL',
    'ZKSYNC_RPC_URL',
    'PRIVATE_KEY',
    'EXECUTOR_CONTRACT_ADDRESS',
    'AAVE_V3_POOL_ADDRESS',
    'ONE_INCH_API_KEY',
    'ONE_INCH_API_URL'
]

def check_env_file(file_path):
    if not os.path.exists(file_path):
        return False, {}
    
    env_vars = {}
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip("'").strip('"')
        return True, env_vars
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False, {}

def main():
    print("🔍 Verifying Environment Configuration...")
    print("=" * 40)
    
    # Check .env locations
    paths_to_check = [
        '.env',
        '.env.production',
        'backend-services/services/brain-orchestrator/.env'
    ]
    
    active_vars = {}
    found_file = None
    
    for path in paths_to_check:
        exists, vars = check_env_file(path)
        if exists:
            print(f"✅ Found configuration file: {path}")
            active_vars.update(vars) # Merge variables
            found_file = path
    
    if not found_file:
        print("❌ No .env or .env.production file found!")
        print("   Please create a .env file with your credentials.")
        sys.exit(1)
        
    # Check keys
    missing_keys = []
    placeholder_keys = []
    
    for key in REQUIRED_KEYS:
        if key not in active_vars:
            # Check if it's set in system environment variables
            if os.environ.get(key):
                print(f"   ℹ️  {key} found in system environment variables")
            else:
                missing_keys.append(key)
        else:
            val = active_vars[key]
            # Check for common placeholder patterns
            if "YOUR_" in val or val.startswith("0x0000") or val == "":
                placeholder_keys.append(key)
                
    if missing_keys:
        print("\n❌ Missing Required Keys:")
        for key in missing_keys:
            print(f"   - {key}")
            
    if placeholder_keys:
        print("\n⚠️  Keys with Placeholder Values (Update these!):")
        for key in placeholder_keys:
            print(f"   - {key}")
            
    if not missing_keys and not placeholder_keys:
        print("\n✅ Configuration looks valid!")
        print("   All required keys are present and appear to be set.")
    else:
        print("\n⚠️  Configuration incomplete. Please update your .env file.")
        sys.exit(1)

if __name__ == "__main__":
    main()