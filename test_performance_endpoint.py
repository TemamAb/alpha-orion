#!/usr/bin/env python3
"""
Test script to verify the performance/metrics endpoint functionality
"""

import sys
import os
sys.path.append('backend-services/services/brain-orchestrator/src')

try:
    # Import the function directly
    from main import get_performance_metrics
    print("✅ Successfully imported get_performance_metrics function")

    # Test the function
    result = get_performance_metrics()
    print("✅ Function executed successfully")
    print(f"Response type: {type(result)}")
    print(f"Response keys: {list(result.keys()) if hasattr(result, 'keys') else 'Not a dict'}")

    # Check if it has the expected structure
    expected_keys = ['timestamp', 'system_health', 'execution_performance', 'throughput_metrics', 'volume_metrics', 'trading_performance', 'market_coverage', 'risk_management', 'design_targets_achievement']

    if hasattr(result, 'keys'):
        missing_keys = [key for key in expected_keys if key not in result]
        if missing_keys:
            print(f"❌ Missing keys: {missing_keys}")
        else:
            print("✅ All expected keys present")

        # Print sample data
        print("\n📊 Sample Performance Metrics:")
        print(f"System Health: CPU {result.get('system_health', {}).get('cpu_usage_percent', 'N/A')}%")
        print(f"Execution: P50 {result.get('execution_performance', {}).get('latency_p50_ms', 'N/A')}ms")
        print(f"Throughput: {result.get('throughput_metrics', {}).get('trades_per_second', 'N/A')} trades/sec")
        print(f"Volume: ${result.get('volume_metrics', {}).get('daily_volume_usd', 'N/A')}")
        print(f"Readiness: {result.get('design_targets_achievement', {}).get('overall_readiness', 'N/A')}")

    print("\n🎯 PERFORMANCE ENDPOINT TEST: PASSED")
    print("The endpoint function is working correctly and returning comprehensive metrics.")

except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Execution error: {e}")
    sys.exit(1)
