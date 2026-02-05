# Alpha-Orion: Secret Manager Module
# Implements Protocol-02: Security-First (Zero Trust)

resource "google_secret_manager_secret" "rpc_url" {
  secret_id = "rpc-url-mainnet"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "private_key" {
  secret_id = "bot-private-key"
  replication {
    automatic = true
  }
}

# IAM Binding for GKE Workload Identity
# Allows the K8s service account to access these secrets
resource "google_secret_manager_secret_iam_binding" "rpc_url_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.rpc_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[default/alpha-orion-sa]"
  ]
}

resource "google_secret_manager_secret_iam_binding" "private_key_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.private_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[default/alpha-orion-sa]"
  ]
}

variable "project_id" {
  type = string
}
