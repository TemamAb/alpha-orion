variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "Deployment Region"
  type        = string
  default     = "us-central1"
}
