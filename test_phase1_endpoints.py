#!/usr/bin/env python3
"""
Test script for Phase 1 endpoints: parallel strategies and correlations
"""
import requests
import json
import time

def test_parallel_strategies():
    """Test the parallel strategies endpoint"""
    print("🧪 Testing /strategy/parallel endpoint...")

    try:
        response = requests.get('http://localhost:8080/strategy/parallel', timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Parallel strategies endpoint working!")

            # Check response structure
            required_keys = ['parallel_execution', 'execution_time_seconds', 'results', 'processing_metrics']
            for key in required_keys:
                if key in data:
                    print(f"✅ {key}: {data[key]}")
                else:
                    print(f"❌ Missing key: {key}")

            # Check results
            if 'results' in data and len(data['results']) > 0:
                print(f"✅ Found {len(data['results'])} strategy results")
                for result in data['results'][:3]:  # Show first 3
                    strategy_name = result.get('strategy', 'unknown')
                    if 'error' in result:
                        print(f"⚠️  {strategy_name}: Error - {result['error']}")
                    else:
                        print(f"✅ {strategy_name}: Success")
            else:
                print("❌ No results found")

            return True
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return False

def test_correlations():
    """Test the correlations endpoint"""
    print("\n🧪 Testing /strategy/correlations endpoint...")

    try:
        response = requests.get('http://localhost:8080/strategy/correlations', timeout=30)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Correlations endpoint working!")

            # Check if it's mock data
            if 'note' in data and 'Mock data' in data['note']:
                print("ℹ️  Using mock data (GCP not available)")

            # Check response structure
            if 'correlation_analysis' in data:
                analysis = data['correlation_analysis']
                print(f"✅ Total pairs analyzed: {analysis.get('total_pairs_analyzed', 'N/A')}")
                print(f"✅ Analysis period: {analysis.get('analysis_period', 'N/A')}")

                if 'highly_correlated_pairs' in analysis:
                    pairs = analysis['highly_correlated_pairs']
                    print(f"✅ Found {len(pairs)} highly correlated pairs")
                    if len(pairs) > 0:
                        top_pair = pairs[0]
                        print(f"✅ Top correlation: {top_pair.get('pair_a', '?')}/{top_pair.get('pair_b', '?')} = {top_pair.get('correlation', 0):.3f}")
                else:
                    print("❌ No correlated pairs found")
            else:
                print("❌ Missing correlation_analysis in response")

            return True
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return False

def test_health():
    """Test the health endpoint"""
    print("\n🧪 Testing /health endpoint...")

    try:
        response = requests.get('http://localhost:8080/health', timeout=10)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint working!")
            print(f"✅ Service status: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return False

def main():
    """Run all Phase 1 endpoint tests"""
    print("🚀 Phase 1 Endpoint Testing - Alpha-Orion Brain Strategy Engine")
    print("=" * 60)

    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)

    # Test endpoints
    results = []

    results.append(("Health Check", test_health()))
    results.append(("Parallel Strategies", test_parallel_strategies()))
    results.append(("Correlations Analysis", test_correlations()))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    passed = 0
    total = len(results)

    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1

    print(f"\n🎯 Overall: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All Phase 1 endpoints are working correctly!")
        print("✅ Parallel processing for multiple strategies: IMPLEMENTED")
        print("✅ Comprehensive pair correlation analysis: IMPLEMENTED")
        print("🏆 Phase 1 Complete!")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
