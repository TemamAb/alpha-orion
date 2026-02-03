#!/usr/bin/env python3
"""
Alpha-Orion Infrastructure Verification
Validates the health of deployed GCP resources.
"""

import subprocess
import sys
import json
import time

# Regions where resources are deployed, based on main.tf
REGIONS = ["us-central1", "europe-west1"]

def run_command(command):
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(e.stderr)
        return None

def check_cloud_run_services(project_id):
    """Verifies Cloud Run services in all specified regions."""
    print("🔍 Verifying Cloud Run services...")
    overall_healthy = True
    for region in REGIONS:
        print(f"  -> Checking region: {region}")
        cmd = f"gcloud run services list --project={project_id} --region={region} --format=json"
        output = run_command(cmd)
        
        if not output:
            print(f"    ⚠️  Could not retrieve Cloud Run services for region {region}.")
            overall_healthy = False
            continue
            
        services = json.loads(output)
        region_all_healthy = True
        
        if not services:
            print(f"    ⚠️  No Cloud Run services found in {region}.")
            # This might not be an error if some regions have no services.
            # Depending on expectations, you could set region_all_healthy to False.
            continue

        for service in services:
            name = service['metadata']['name']
            conditions = service['status'].get('conditions', [])
            ready = next((c for c in conditions if c['type'] == 'Ready'), None)
            
            if ready and ready['status'] == 'True':
                print(f"    ✅ Service {name}: HEALTHY")
            else:
                print(f"    ❌ Service {name}: UNHEALTHY or DEPLOYING")
                region_all_healthy = False
        
        if not region_all_healthy:
            overall_healthy = False
            
    return overall_healthy

def check_redis(project_id):
    """Verifies Redis instances in all specified regions."""
    print(f"🔍 Verifying Redis instances...")
    overall_healthy = True
    for region in REGIONS:
        print(f"  -> Checking region: {region}")
        cmd = f"gcloud redis instances list --region={region} --project={project_id} --format=json"
        output = run_command(cmd)
        
        if output is None:
            print(f"    ⚠️  Could not retrieve Redis instances for region {region}.")
            overall_healthy = False
            continue

        instances = json.loads(output)
        if not instances:
            print(f"    ⚠️  No Redis instances found in {region} (might be provisioning).")
            continue

        for instance in instances:
            name = instance['name'].split('/')[-1]
            state = instance.get('state', 'UNKNOWN')
            if state == 'READY':
                print(f"    ✅ Redis {name}: READY")
            else:
                print(f"    ❌ Redis {name}: {state}")
                overall_healthy = False
    return overall_healthy

def check_alloydb_clusters(project_id):
    """Verifies AlloyDB clusters in all specified regions."""
    print("🔍 Verifying AlloyDB clusters...")
    overall_healthy = True
    for region in REGIONS:
        print(f"  -> Checking region: {region}")
        cmd = f"gcloud alloydb clusters list --project={project_id} --region={region} --format=json"
        output = run_command(cmd)

        if output is None:
            print(f"    ⚠️  Could not retrieve AlloyDB clusters for region {region}.")
            overall_healthy = False
            continue
        
        clusters = json.loads(output)
        if not clusters:
            print(f"    ⚠️  No AlloyDB clusters found in {region}.")
            continue

        for cluster in clusters:
            name = cluster['name'].split('/')[-1]
            state = cluster.get('state', 'UNKNOWN')
            if state == 'READY':
                print(f"    ✅ AlloyDB Cluster {name}: READY")
            else:
                print(f"    ❌ AlloyDB Cluster {name}: {state}")
                overall_healthy = False
    return overall_healthy

def check_load_balancer(project_id, lb_name="flash-loan-app-frontend"):
    """Verifies the Global Load Balancer frontend."""
    print(f"🔍 Verifying Global Load Balancer frontend '{lb_name}'...")
    cmd = f"gcloud compute forwarding-rules list --project={project_id} --global --format=json --filter='name={lb_name}'"
    output = run_command(cmd)

    if output is None:
        print(f"    ❌ Could not retrieve forwarding rule for {lb_name}.")
        return False

    rules = json.loads(output)
    if not rules:
        print(f"    ❌ Forwarding rule for {lb_name} not found.")
        return False
    
    rule = rules[0]
    ip_address = rule.get('IPAddress')
    if ip_address:
        print(f"    ✅ Load Balancer {lb_name} is configured with IP: {ip_address}")
        return True
    else:
        print(f"    ❌ Load Balancer {lb_name} does not have an IP address assigned.")
        return False

def check_bigtable_instance(project_id, instance_id="flash-loan-bigtable"):
    """Verifies the Bigtable instance."""
    print(f"🔍 Verifying Bigtable instance '{instance_id}'...")
    cmd = f"gcloud bigtable instances describe {instance_id} --project={project_id} --format=json"
    output = run_command(cmd)

    if output is None:
        print(f"    ❌ Could not retrieve Bigtable instance details for {instance_id}.")
        return False

    instance = json.loads(output)
    state = instance.get('state')

    if state == 'READY':
        print(f"    ✅ Bigtable instance {instance_id}: READY")
        return True
    else:
        print(f"    ❌ Bigtable instance {instance_id}: {state}")
        return False

def check_pubsub_topics(project_id):
    """Verifies that critical Pub/Sub topics exist."""
    print("🔍 Verifying Pub/Sub topics...")
    cmd = f"gcloud pubsub topics list --project={project_id} --format=json"
    output = run_command(cmd)

    if output is None:
        print("    ❌ Could not retrieve Pub/Sub topics.")
        return False

    existing_topics = {t['name'].split('/')[-1] for t in json.loads(output)}
    
    required_topics = [
        "raw-opportunities",
        "flash-loan-execution-requests",
        "raw-opportunities-eu",
        "flash-loan-execution-requests-eu",
        "processed-opportunities-us",
        "processed-opportunities-eu"
    ]

    all_exist = True
    for topic in required_topics:
        if topic in existing_topics:
            print(f"    ✅ Topic '{topic}' exists.")
        else:
            print(f"    ❌ Topic '{topic}' NOT FOUND.")
            all_exist = False
            
    return all_exist

def main():
    # Get project ID from args or gcloud config
    project_id = None
    if len(sys.argv) > 1 and sys.argv[1].startswith("--project="):
        project_id = sys.argv[1].split("=")[1]
    
    if not project_id:
        project_id = run_command("gcloud config get-value project")
        
    if not project_id:
        print("❌ Could not determine project ID. Please set it with `gcloud config set project` or pass `--project=...`")
        sys.exit(1)

    print(f"🚀 Starting Infrastructure Verification for {project_id}")
    print("===================================================")
    
    results = []
    results.append(check_cloud_run_services(project_id))
    results.append(check_redis(project_id))
    results.append(check_alloydb_clusters(project_id))
    results.append(check_load_balancer(project_id))
    results.append(check_bigtable_instance(project_id))
    results.append(check_pubsub_topics(project_id))
    
    # The original script exited with 0 on warnings.
    # A better practice for CI/CD is to exit with a non-zero code on failure.
    if all(results):
        print("\n✅ ALL INFRASTRUCTURE VERIFICATION CHECKS PASSED")
        sys.exit(0)
    else:
        print("\n❌ VERIFICATION FAILED. Some resources are not healthy.")
        sys.exit(1)

if __name__ == "__main__":
    main()