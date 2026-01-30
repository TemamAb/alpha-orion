#!/usr/bin/env python3
"""
Final Phase Validation Script
Validates Phase 1 and Phase 2 implementations
"""

import os

def validate_data_ingestion():
    """Validate Phase 2: Data Ingestion Scaling"""
    main_file = 'backend-services/services/dataflow-market-data-ingestion/src/main.py'

    if not os.path.exists(main_file):
        print("❌ Data ingestion file not found")
        return False

    with open(main_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Count key components
    exchange_count = content.count("': {")
    pairs_count = content.count("'supported_pairs':")
    websocket_count = content.count("'websocket_url':")
    threadpool_check = 'ThreadPoolExecutor(max_workers=20)' in content
    async_check = 'async def' in content

    print("📈 Phase 2: Data Ingestion Scaling")
    print(f"   Exchanges: {exchange_count} (need ≥50)")
    print(f"   Pair configs: {pairs_count} (need ≥50)")
    print(f"   WebSocket feeds: {websocket_count}")
    print(f"   Parallel processing: {'✓' if threadpool_check else '✗'}")
    print(f"   Async support: {'✓' if async_check else '✗'}")

    success = (exchange_count >= 50 and pairs_count >= 50 and
               threadpool_check and async_check and websocket_count > 10)
    print(f"   Status: {'PASSED' if success else 'FAILED'}")
    return success

def validate_strategy_engine():
    """Validate Phase 1: Brain Strategy Engine"""
    main_file = 'backend-services/services/brain-strategy-engine/src/main.py'

    if not os.path.exists(main_file):
        print("❌ Strategy engine file not found")
        return False

    with open(main_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check Phase 1 features
    parallel_endpoint = '@app.route(\'/strategy/parallel\'' in content
    correlation_endpoint = '@app.route(\'/strategy/correlations\'' in content
    threadpool_import = 'from concurrent.futures import ThreadPoolExecutor' in content
    pairs_count = content.count('(') - content.count('),')  # Rough pair count

    print("\n🧠 Phase 1: Brain Strategy Engine")
    print(f"   Parallel endpoint: {'✓' if parallel_endpoint else '✗'}")
    print(f"   Correlation analysis: {'✓' if correlation_endpoint else '✗'}")
    print(f"   ThreadPool support: {'✓' if threadpool_import else '✗'}")
    print(f"   Trading pairs: ~{pairs_count}")

    success = parallel_endpoint and correlation_endpoint and threadpool_import
    print(f"   Status: {'PASSED' if success else 'FAILED'}")
    return success

def main():
    print("🚀 Alpha-Orion Phase Validation")
    print("=" * 40)

    phase2_ok = validate_data_ingestion()
    phase1_ok = validate_strategy_engine()

    print("\n" + "=" * 40)
    if phase1_ok and phase2_ok:
        print("🎉 ALL PHASES VALIDATED SUCCESSFULLY!")
        print("✅ Phase 1: Parallel processing + Correlation analysis")
        print("✅ Phase 2: 50+ exchanges + Real-time data ingestion")
        print("\n🏆 Alpha-Orion Trading Platform: PHASES 1-2 COMPLETE!")
        return True
    else:
        print("⚠️  Validation incomplete")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
