import requests
import json
import sys

def verify_routing():
    url = "http://localhost:8000/api/copilot/chat"
    
    # Test Case: Boss commands deployment of a strategy hotfix
    # This tests if "deploy" priority overrides "strategy" keyword
    payload = {
        "message": "Deploy the latest hotfix for the vulture strategy",
        "persona": "boss" # The Boss speaks
    }
    
    print(f"👑 BOSS COMMAND: {payload['message']}")
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        print("\n🤖 SYSTEM RESPONSE:")
        print(json.dumps(data, indent=2))
        
        # Verification Logic
        if data['persona'] == 'deploy':
            print("\n✅ ROUTING SUCCESS: Command correctly routed to DEPLOYING ENGINEER.")
        else:
            print(f"\n❌ ROUTING FAILED: Routed to {data['persona']} (Expected: deploy)")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    verify_routing()