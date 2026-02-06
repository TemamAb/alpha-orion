# 1. COMPUTE: C2 Compute Optimized Instances (The Brain)
resource "google_container_node_pool" "hft_pool" {
  name       = "alpha-orion-hft-pool"
  location   = "us-east4-a"
  cluster    = "alpha-orion-cluster"
  
  node_count = 1

  autoscaling {
    min_node_count = 3
    max_node_count = 10
  }

  node_config {
    machine_type = "c2-standard-60" # 60 vCPUs, 240GB RAM
    
    # Local SSD for high-speed scratch space (Mempool buffer)
    local_ssd_count = 2 
    
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      workload = "hft-execution"
    }
  }
}

# 2. MESSAGING: Pub/Sub for Event Streaming (The Memory)
resource "google_pubsub_topic" "mempool_events" {
  name = "mempool-events-stream"
  
  message_storage_policy {
    allowed_persistence_regions = ["us-east4"]
  }
}

resource "google_pubsub_subscription" "executor_sub" {
  name  = "executor-subscription"
  topic = google_pubsub_topic.mempool_events.name

  enable_message_ordering    = true
  ack_deadline_seconds       = 10
}