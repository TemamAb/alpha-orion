# Alpha-Orion: Memorystore for Redis
# High-speed state sharing for arbitrage engines

resource "google_redis_instance" "state_cache" {
  name           = "alpha-orion-redis"
  tier           = "STANDARD_HA" # High Availability for Production
  memory_size_gb = 1

  region                  = var.region
  authorized_network      = var.network_id
  connect_mode            = "PRIVATE_SERVICE_ACCESS"

  redis_version     = "REDIS_6_X"
  display_name      = "Alpha-Orion Strategy State"

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours = 2
        minutes = 0
        seconds = 0
        nanos = 0
      }
    }
  }

  labels = {
    env = "prod"
    component = "state-sharing"
  }
}

variable "project_id" { type = string }
variable "region" { type = string }
variable "network_id" { type = string }
