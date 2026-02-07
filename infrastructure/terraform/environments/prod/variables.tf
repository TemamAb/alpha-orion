variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "Deployment Region"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "Cloud SQL database password"
  type        = string
  sensitive   = true
}

variable "notification_channels" {
  description = "List of notification channel IDs for alerting"
  type        = list(string)
  default     = []
}
