import os
from pathlib import Path

def create_project_structure():
    """
    Creates the standardized, enterprise-grade directory structure for Alpha-Orion v08.
    This is the first and only time this script should be run.
    """
    base_path = Path.cwd() / "alpha-08"
    base_path.mkdir(exist_ok=True)
    
    print("="*60)
    print(f"🚀 EXECUTING PHASE 0: FOUNDATION & ARCHITECTURE")
    print(f"   Project Root: {base_path}")
    print("="*60)

    directories = [
        # Application Core
        "core/execution_engine",
        "core/risk_engine",
        "core/mempool_scanner",
        
        # Strategies (each will be a Python module)
        "strategies/atomic_arbitrage",
        "strategies/statistical_arbitrage",
        "strategies/liquidation_arbitrage",
        "strategies/jit_liquidity",
        "strategies/cross_chain_arbitrage",
        "strategies/funding_rate_arbitrage",
        "strategies/solver_auctions",
        "strategies/long_tail_mev",

        # Smart Contracts
        "contracts/core",
        "contracts/interfaces",
        "contracts/test",

        # Infrastructure as Code
        "infrastructure/terraform/environments/prod",
        "infrastructure/terraform/modules/gke_hft_pool",
        "infrastructure/terraform/modules/secrets",
        "infrastructure/k8s",

        # Monitoring & Analytics
        "monitoring/grafana/dashboards",
        "monitoring/prometheus",

        # Documentation
        "docs/architecture",
        "docs/strategies",

        # Tests
        "tests/unit",
        "tests/integration",
        "tests/simulation"
    ]

    for dir_path in directories:
        (base_path / dir_path).mkdir(parents=True, exist_ok=True)

    # Create __init__.py files to make directories Python packages
    for root, dirs, _ in os.walk(base_path):
        if "strategies" in root or "core" in root:
            for d in dirs:
                (Path(root) / d / "__init__.py").touch()

    # Create essential root files
    files = {
        ".gitignore": "*.pyc\n__pycache__/\n.env\n*.tfstate*\n.terraform*\n",
        "requirements.txt": "fastapi\nuvicorn\nweb3\nnumpy\npandas\n",
        "Dockerfile": "FROM python:3.9-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"python\", \"core/execution_engine/main.py\"]",
        "cloudbuild.yaml": "# CI/CD Pipeline Stub for future phases\nsteps:\n- name: 'gcr.io/cloud-builders/docker'\n  args: ['build', '-t', 'gcr.io/$PROJECT_ID/alpha-orion-engine:$SHORT_SHA', '.']"
    }

    for file_name, content in files.items():
        (base_path / file_name).write_text(content)

    # Move the master plan into the new structure
    master_plan_path = base_path / "MASTER_PLAN.md"
    if os.path.exists("MASTER_PLAN.md"):
        os.rename("MASTER_PLAN.md", master_plan_path)

    print("\n✅ PHASE 0 COMPLETE: Clean project foundation has been built.")
    print("   Review the MASTER_PLAN.md for the next steps.")
    print("="*60)

if __name__ == "__main__":
    # Safety check to prevent running this twice
    if (Path.cwd() / "alpha-08" / "core").exists():
        print("❌ ERROR: Project structure already exists in alpha-08. Do not run this script again.")
    else:
        create_project_structure()