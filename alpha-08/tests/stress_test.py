import requests
import threading
import time
import statistics
from datetime import datetime

# Alpha-08 Sovereign LoadBalancer Endpoint
TARGET_URL = "http://34.70.227.10"
ENDPOINTS = ["/api/strategies", "/api/logs"]
CONCURRENT_THREADS = 15
TEST_DURATION_SECONDS = 20

results = []
stop_event = threading.Event()

def hammer_target(endpoint):
    url = f"{TARGET_URL}{endpoint}"
    while not stop_event.is_set():
        start_time = time.time()
        try:
            response = requests.get(url, timeout=5)
            latency = (time.time() - start_time) * 1000  # ms
            results.append({
                "endpoint": endpoint,
                "status": response.status_code,
                "latency": latency,
                "timestamp": datetime.now()
            })
        except Exception as e:
            results.append({
                "endpoint": endpoint,
                "status": "ERROR",
                "error": str(e),
                "latency": (time.time() - start_time) * 1000,
                "timestamp": datetime.now()
            })
        time.sleep(0.05)

def run_stress_test():
    print(f"[STRESS TEST] Initiating institutional-grade load on {TARGET_URL}")
    print(f"Config: {CONCURRENT_THREADS} concurrent threads | Duration: {TEST_DURATION_SECONDS}s")
    
    threads = []
    for i in range(CONCURRENT_THREADS):
        endpoint = ENDPOINTS[i % len(ENDPOINTS)]
        t = threading.Thread(target=hammer_target, args=(endpoint,))
        threads.append(t)
        t.start()

    time.sleep(TEST_DURATION_SECONDS)
    stop_event.set()

    for t in threads:
        t.join()

    print("\n[STRESS TEST COMPLETE] Analyzing Results...")
    analyze_results()

def analyze_results():
    total_reqs = len(results)
    if total_reqs == 0:
        print("No results captured.")
        return

    success_reqs = [r for r in results if r['status'] == 200]
    errors = [r for r in results if r['status'] != 200]
    
    latencies = [r['latency'] for r in success_reqs]
    
    print("-" * 50)
    print(f"Total Requests:      {total_reqs}")
    print(f"Success Rate:        {(len(success_reqs) / total_reqs) * 100:.2f}%")
    print(f"Error Rate:          {(len(errors) / total_reqs) * 100:.2f}%")
    
    if latencies:
        print(f"Avg Latency:         {statistics.mean(latencies):.2f} ms")
        print(f"Min Latency:         {min(latencies):.2f} ms")
        print(f"Max Latency:         {max(latencies):.2f} ms")
    
    if errors:
        print("\nTop 5 Errors:")
        for e in errors[:5]:
            print(f"- {e.get('status')}: {e.get('error', 'No detail')}")
    print("-" * 50)

if __name__ == "__main__":
    run_stress_test()
