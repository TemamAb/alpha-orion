# Alpha-Orion: Enterprise VPC & GKE Foundation

# 1. Networking: Shared VPC Architecture
resource "google_compute_network" "main_vpc" {
  name                    = "alpha-orion-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "gke_subnet" {
  name          = "gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.main_vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# 2. GKE Container Cluster: HFT Optimized
resource "google_container_cluster" "primary" {
  name     = "alpha-orion-gke"
  location = var.region

  # Use VPC-native secondary ranges
  networking_mode = "VPC_NATIVE"
  network         = google_compute_network.main_vpc.name
  subnetwork      = google_compute_subnetwork.gke_subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Transition to non-default node pools for C2 optimization
  remove_default_node_pool = true
  initial_node_count       = 1

  # Enable Workload Identity for Zero-Trust Secret Management
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }
}

# 3. C2 Node Pool: High Frequency Trading Optimized
resource "google_container_node_pool" "hft_nodes" {
  name       = "hft-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 3

  node_config {
    # C2 instances are Compute-Optimized for lowest latency
    machine_type = "c2-standard-4"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      workload = "arbitrage-engine"
    }

    # Use Shielded VMs for enhanced security
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}

# 4. Workload Identity: Service Account & IAM Binding
resource "google_service_account" "gke_sa" {
  account_id   = "alpha-08-execution"
  display_name = "Alpha Orion Execution SA"
}

resource "google_project_iam_member" "gke_sa_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/artifactregistry.reader",
    "roles/cloudbuild.builds.editor"
  ])
  role    = each.key
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
  project = var.project_id
}

resource "google_service_account_iam_binding" "workload_identity_binding" {
  service_account_id = google_service_account.gke_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[alpha-08/alpha-orion-sa]"
  ]
}

# 5. Secrets Management
module "secrets" {
  source     = "../../modules/secrets"
  project_id = var.project_id
}

# 6. Memorystore (Redis) - High-speed state sharing
module "memorystore" {
  source     = "../../modules/memorystore"
  project_id = var.project_id
  region     = var.region
  network_id = google_compute_network.main_vpc.id
}

# 7. Cloud SQL - Persistent storage
module "cloud_sql" {
  source     = "../../modules/cloud_sql"
  project_id = var.project_id
  region     = var.region
  network_id = google_compute_network.main_vpc.id
  db_password = var.db_password
}

# 8. Monitoring & Alerting
module "monitoring" {
  source              = "../../modules/monitoring"
  project_id          = var.project_id
  notification_channels = var.notification_channels
  api_hostname        = "alpha-orion-api.example.com"
}

# 9. Secret Rotation Automation
module "secrets_rotation" {
  source     = "../../modules/secrets_rotation"
  project_id = var.project_id
  region     = var.region
}
