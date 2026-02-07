# Alpha-Orion: Secret Rotation Automation
# Implements automated secret rotation for Zero Trust security

# Cloud Function: Secret Rotator
resource "google_storage_bucket" "secret_rotator_bucket" {
  name          = "${var.project_id}-secret-rotator"
  location      = var.region
  force_destroy = false
  
  lifecycle_rule {
    condition {
      age = 30  # Delete function zip after 30 days
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_object" "secret_rotator_zip" {
  name   = "secret-rotator-${uuid()}.zip"
  bucket = google_storage_bucket.secret_rotator_bucket.name
  source = "${path.module}/secret-rotator.zip"  # Requires building the Cloud Function
}

resource "google_cloudfunctions2_function" "secret_rotator" {
  name        = "alpha-orion-secret-rotator"
  location    = var.region
  description = "Rotates secrets for Alpha-Orion"

  build_config {
    runtime     = "python311"
    entry_point = "rotate_secret"

    source {
      storage_source {
        bucket = google_storage_bucket.secret_rotator_bucket.name
        object = google_storage_bucket_object.secret_rotator_zip.name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    min_instance_count    = 0
    available_memory      = "256M"
    timeout_seconds       = 60
    service_account_email = google_service_account.secret_rotator.email

    secret_environment_vars {
      key       = "SECRET_NAME"
      value     = google_secret_manager_secret.rpc_url.secret_id
      project_id = var.project_id
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type    = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.secret_rotator_bucket.name
    }
  }

  labels = {
    env        = "prod"
    component = "security"
  }
}

# Schedule: Daily secret rotation
resource "google_cloud_scheduler_job" "secret_rotation_schedule" {
  name        = "alpha-orion-secret-rotation"
  description = "Triggers secret rotation daily"
  schedule    = "0 3 * * *"  # 3 AM daily
  time_zone   = "America/Los_Angeles"
  region      = var.region

  http_target {
    uri         = "https://${var.region}-${var.project_id}.cloudfunctions.net/alpha-orion-secret-rotator"
    http_method = "POST"
    oidc_token {
      service_account_email = google_service_account.secret_rotator.email
    }
  }
}

# Service Account for Secret Rotation
resource "google_service_account" "secret_rotator" {
  account_id   = "alpha-orion-secret-rotator"
  display_name = "Alpha-Orion Secret Rotator SA"
}

# IAM: Secret Manager Admin for rotation function
resource "google_project_iam_member" "secret_rotator_admin" {
  project = var.project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.secret_rotator.email}"
}

# IAM: Cloud Scheduler invoker
resource "google_project_iam_member" "cloud_scheduler_invoker" {
  project = var.project_id
  role    = "roles/cloudscheduler.jobInvoker"
  member  = "serviceAccount:${google_service_account.secret_rotator.email}"
}

# Output: Rotation function URL
output "secret_rotator_function_url" {
  description = "URL of the secret rotation Cloud Function"
  value       = "https://${var.region}-${var.project_id}.cloudfunctions.net/alpha-orion-secret-rotator"
}

variable "project_id" { type = string }
variable "region" { type = string }
