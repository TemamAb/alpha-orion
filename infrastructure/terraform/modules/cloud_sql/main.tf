# Alpha-Orion: Cloud SQL for PostgreSQL
# Persistent storage for transaction history and profit records

resource "google_sql_database_instance" "alpha_orion_db" {
  name             = "alpha-orion-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"  # Start small, scale as needed
    # Availability
    availability_type = "REGIONAL"
    backup_configuration {
      enabled            = true
      binary_log_enabled = true
      start_time         = "02:00"
    }
    # IP Configuration - Private IP only
    ip_configuration {
      private_network = var.network_id
    }
    # Database flags
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    # Maintenance
    maintenance_window {
      day  = 7  # Sunday
      hour = 3
    }
    # Labels
    user_labels = {
      env        = "prod"
      component = "data-storage"
    }
  }

  deletion_protection = true  # Prevent accidental deletion
}

resource "google_sql_database" "alpha_orion_data" {
  name      = "alpha_orion"
  instance  = google_sql_database_instance.alpha_orion_db.name
  charset   = "UTF8"
  collation = "en_US.UTF8"
}

resource "google_sql_user" "alpha_orion_user" {
  name     = "alpha_orion_admin"
  instance = google_sql_database_instance.alpha_orion_db.name
  password = var.db_password
}

# Outputs
output "instance_connection_name" {
  description = "Connection name for Cloud SQL proxy"
  value       = google_sql_database_instance.alpha_orion_db.connection_name
}

output "private_ip_address" {
  description = "Private IP address of the instance"
  value       = google_sql_database_instance.alpha_orion_db.private_address
}

variable "project_id" { type = string }
variable "region" { type = string }
variable "network_id" { type = string }
variable "db_password" { type = string }
