resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region

  # We're using a VPC-native cluster
  networking_mode = "VPC_NATIVE"

  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }
}

resource "google_container_node_pool" "c2_nodes" {
  name       = "hft-c2-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  node_config {
    # C2 nodes are compute-optimized for low-latency HFT
    machine_type = "c2-standard-4"

    labels = {
      workload = "alpha-08-hft"
    }

    # High-performance networking
    network_performance_config {
      total_egress_bandwidth_tier = "TIER_1"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

variable "project_id" {}
variable "region" {}
variable "cluster_name" { default = "alpha-08-sovereign" }
variable "node_count" { default = 3 }
