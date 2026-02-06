import os
from pathlib import Path

def write_file(base_path, rel_path, content):
    full_path = base_path / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    # Use utf-8 and newline conversion to ensure consistent file endings
    with open(full_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"✅ Created: {rel_path}")

def provision_infrastructure_files():
    # We enforce running this inside alpha-08 or targeting it
    base_dir = Path.cwd()
    
    # Ensure we are in alpha-08 or can find it
    if base_dir.name != "alpha-08":
        # Try to find alpha-08 in path
        if "alpha-08" in base_dir.parts:
            while base_dir.name != "alpha-08":
                base_dir = base_dir.parent
        elif (base_dir / "alpha-08").exists():
            base_dir = base_dir / "alpha-08"
        else:
            # Fallback to the absolute path defined in Master Plan
            base_dir = Path("C:/Users/op/Desktop/alpha-orion/alpha-08")
            
    if not base_dir.exists():
        base_dir.mkdir(parents=True, exist_ok=True)

    print(f"🛠️  Provisioning Terraform files in: {base_dir}")

    files = {
        "infrastructure/terraform/environments/prod/main.tf": r"""terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.51.0"
    }
  }
  # Note: Ensure the bucket 'alpha-orion-tf-state' exists in GCP before running init
  backend "gcs" {
    bucket = "alpha-orion-tf-state" 
    prefix = "prod/gke"
  }
}

provider "google" {
  project = "alpha-orion-485207"
  region  = "us-central1"
}

# 1. Define the GKE Cluster (Control Plane)
resource "google_container_cluster" "primary" {
  name                     = "alpha-orion-primary-cluster"
  location                 = "us-central1-a"
  remove_default_node_pool = true
  initial_node_count       = 1

  workload_identity_config {
    workload_pool = "alpha-orion-485207.svc.id.goog"
  }
}

# 2. Default Management Pool (Cost-effective)
resource "google_container_node_pool" "default_pool" {
  name       = "default-management-pool"
  cluster    = google_container_cluster.primary.name
  location   = google_container_cluster.primary.location
  node_count = 1

  node_config {
    machine_type = "e2-small"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}

# 3. HFT Node Pool (High Performance)
module "hft_node_pool" {
  source       = "../../modules/gke_hft_pool"
  cluster_name = google_container_cluster.primary.name
  location     = google_container_cluster.primary.location
}

# 4. Secrets Management
module "secrets" {
  source     = "../../modules/secrets"
  project_id = "alpha-orion-485207"
}
""",
        "infrastructure/terraform/modules/gke_hft_pool/main.tf": r"""#
# Alpha-Orion HFT Node Pool Module
# Defines a high-performance, compute-optimized node pool for GKE.
#

resource "google_container_node_pool" "hft_node_pool" {
  name       = "hft-compute-pool"
  location   = var.location
  cluster    = var.cluster_name
  node_count = 1

  autoscaling {
    min_node_count = 1
    max_node_count = 5
  }

  node_config {
    machine_type = "c2-standard-8" # Compute-optimized, 8 vCPUs
    preemptible  = true            # Use preemptible nodes for cost savings on stateless workloads

    # Label for targeting pods to these specific nodes
    labels = {
      "workload-type" = "hft-execution"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
""",
        "infrastructure/terraform/modules/gke_hft_pool/variables.tf": r"""variable "cluster_name" {
  description = "The name of the GKE cluster to attach the node pool to."
  type        = string
}

variable "location" {
  description = "The GCP location (region or zone) for the node pool."
  type        = string
  default     = "us-central1-a"
}
""",
        "infrastructure/terraform/modules/secrets/main.tf": r"""variable "project_id" {
  type = string
}

resource "google_secret_manager_secret" "rpc_url" {
  secret_id = "rpc-url-ethereum"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "rpc_url_version" {
  secret      = google_secret_manager_secret.rpc_url.id
  secret_data = "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY_HERE" # Placeholder, update manually in GCP
}
"""
    }

    for rel_path, content in files.items():
        write_file(base_dir, rel_path, content)

    print("\n✨ Infrastructure files provisioned successfully.")

if __name__ == "__main__":
    provision_infrastructure_files()