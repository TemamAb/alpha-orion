provider "google" {
  project = var.project_id
  region  = var.region
}

module "vpc_native_cluster" {
  source       = "./modules/vpc_native_cluster"
  project_id   = var.project_id
  region       = var.region
  cluster_name = "alpha-08-sovereign"
  node_count   = 1
}

module "security_armor" {
  source = "./modules/security_armor"
}

variable "project_id" {
  description = "GCP Project ID"
  default     = "alpha-orion-485207"
}

variable "region" {
  description = "GCP Region"
  default     = "us-central1"
}

output "cluster_endpoint" {
  value = module.vpc_native_cluster.cluster_endpoint
}

output "armor_policy_id" {
  value = module.security_armor.policy_id
}
