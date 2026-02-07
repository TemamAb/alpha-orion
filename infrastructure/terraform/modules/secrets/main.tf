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
    "serviceAccount:${var.project_id}.svc.id.goog[alpha-08/alpha-orion-sa]"
  ]
}

resource "google_secret_manager_secret_iam_binding" "private_key_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.private_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[alpha-08/alpha-orion-sa]"
  ]
}

resource "google_secret_manager_secret" "billing_info" {
  secret_id = "billing-account-details"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "billing_info_data" {
  secret = google_secret_manager_secret.billing_info.id
  secret_data = jsonencode({
    account_name = "Alpha-orion",
    billing_id   = "0152CF-0A5B08-CBBCD1",
    organisation = "iamtemam-org",
    status       = "Paid account",
    notes        = "Upgraded from free trial on 13 Jan 2026. Accrues balance."
  })
}

resource "google_secret_manager_secret_iam_binding" "billing_info_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.billing_info.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[alpha-08/alpha-orion-sa]"
  ]
}
