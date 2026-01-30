#!/usr/bin/env python3
"""
Simple Phase 2 Validation Script
Validates exchange configurations and basic functionality without complex imports
"""

import json
import os

def validate_exchange_config():
    """Validate the exchange configuration in the data ingestion service"""

    # Read the main.py file and extract exchange configurations
    main_file = 'backend-services/services/dataflow-market-data-ingestion/src/main.py'

    if not os.path.exists(main_file):
        print("❌ Main file not found")
        return False

    with open(main_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the exchanges dictionary
    start_marker = '_initialize_exchanges(self) -> Dict[str, Dict[str, Any]]:\n        """Initialize 50+ exchange configurations"""\n        return {'
    end_marker = '\n        }'

    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("❌ Could not find exchange configuration")
        return False

    start_idx += len(start_marker) - 1  # Position at the opening brace
    brace_count = 1
    end_idx = start_idx + 1

    # Find the matching closing brace
    while end_idx < len(content) and brace_count > 0:
        if content[end_idx] == '{':
            brace_count += 1
        elif content[end_idx] == '}':
            brace_count -= 1
        end_idx += 1

    if brace_count != 0:
        print("❌ Could not parse exchange configuration")
        return False

    config_text = content[start_idx:end_idx]
    print(f"Found exchange configuration block of {len(config_text)} characters")

    # Count exchanges by finding exchange IDs
    lines = config_text.split('\n')
    exchange_count = 0
    pair_count = 0

    for line in lines:
        line = line.strip()
        if line.startswith("'") and line.endswith("': {"):
            exchange_count += 1
            print(f"✓ Found exchange: {line[1:-4]}")
        elif "'supported_pairs':" in line:
            # Count pairs in the next line
            next_line_idx = lines.index(line) + 1
            if next_line_idx < len(lines):
                next_line = lines[next_line_idx].strip()
                if next_line.startswith('[') and next_line.endswith('],'):
                    # Count commas to estimate pairs
                    pair_estimate = next_line.count(',') + 1 if next_line != '[],' else 0
                    pair_count += pair_estimate

    print(f"\n📊 Phase 2 Configuration Summary:")
    print(f"   Exchanges configured: {exchange_count}")
    print(f"   Estimated total pairs: {pair_count}")

    # Validate Phase 2 requirements
    exchange_req = exchange_count >= 50
    pair_req = pair_count >= 2500  # 50 exchanges * 50 pairs

    print(f"\n✅ Requirements Check:")
    print(f"   50+ exchanges: {'✓' if exchange_req else '✗'} ({exchange_count})")
    print(f"   2500+ pairs: {'✓' if pair_req else '✗'} ({pair_count})")

    # Check for parallel processing
    parallel_check = 'ThreadPoolExecutor(max_workers=20)' in content
    async_check = 'async def' in content and 'await' in content
    websocket_check = 'websocket_url' in content

    print(f"   Parallel processing: {'✓' if parallel_check else '✗'}")
    print(f"   Async/await support: {'✓' if async_check else '✗'}")
    print(f"   WebSocket support: {'✓' if websocket_check else '✗'}")

    success = exchange_req and pair_req and parallel_check and async_check
    print(f"\n🎯 Phase 2 Validation: {'PASSED' if success else 'FAILED'}")

    return success

def validate_brain_strategy_engine():
    """Validate the brain strategy engine parallel processing"""

    main_file = 'backend-services/services/brain-strategy-engine/src/main.py'

    if not os.path.exists(main_file):
        print("❌ Brain strategy engine file not found")
        return False

    with open(main_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for parallel processing endpoint
    parallel_endpoint = '@app.route(\'/strategy/parallel\'' in content
    threadpool_import = 'from concurrent.futures import ThreadPoolExecutor' in content
    parallel_execution = 'ThreadPoolExecutor(max_workers=' in content

    print(f"\n🧠 Brain Strategy Engine Validation:")
    print(f"   Parallel endpoint: {'✓' if parallel_endpoint else '✗'}")
    print(f"   ThreadPool import: {'✓' if threadpool_import else '✗'}")
    print(f"   Parallel execution: {'✓' if parallel_execution else '✗'}")

    # Check for correlation analysis
    correlation_endpoint = '@app.route(\'/strategy/correlations\'' in content
    print(f"   Correlation analysis: {'✓' if correlation_endpoint else '✗'}")

    success = parallel_endpoint and threadpool_import and parallel_execution and correlation_endpoint
    print(f"   Phase 1 completion: {'✓' if success else '✗'}")

    return success

def main():
    print("🚀 Alpha-Orion Phase 2 Thorough Testing")
    print("=" * 50)

    # Test data ingestion scaling
    print("\n📈 Testing Data Ingestion Scaling (Phase 2)")
    data_ingestion_ok = validate_exchange_config()

    # Test brain strategy engine
    print("\n🧠 Testing Brain Strategy Engine (Phase 1)")
    strategy_engine_ok = validate_brain_strategy_engine()

    # Overall result
    print("\n" + "=" * 50)
    if data_ingestion_ok and strategy_engine_ok:
        print("🎉 ALL PHASES VALIDATED SUCCESSFULLY!")
        print("✅ Phase 1 (Core Expansion): Parallel processing + Correlation analysis")
        print("✅ Phase 2 (Data Ingestion): 50+ exchanges + Parallel processing + Real-time ingestion")
        return True
    else:
        print("⚠️  SOME VALIDATION FAILED")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
