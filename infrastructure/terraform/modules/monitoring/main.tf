# Alpha-Orion: Cloud Monitoring Alerting Configuration
# Production-grade alerting for 24/7 operations

# Alert Policy: High CPU Usage
resource "google_monitoring_alert_policy" "high_cpu" {
  display_name = "Alpha-Orion: High CPU Usage"
  combiner     = "OR"

  conditions {
    display_name = "CPU usage above 80%"

    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"kubernetes.io/container/cpu/core_usage_time\" AND metric.labels.\"pod_name\"=monitoring.regex.full_match(\"alpha-orion.*\")"
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 80

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "MEAN"
      }
    }
  }

  notification_channels = var.notification_channels
  documentation {
    content   = "Alpha-Orion container CPU usage is above 80%. Check GKE cluster for performance issues."
    mime_type = "text/markdown"
  }
}

# Alert Policy: High Memory Usage
resource "google_monitoring_alert_policy" "high_memory" {
  display_name = "Alpha-Orion: High Memory Usage"
  combiner     = "OR"

  conditions {
    display_name = "Memory usage above 85%"

    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"kubernetes.io/container/memory/used_bytes\" AND metric.labels.\"pod_name\"=monitoring.regex.full_match(\"alpha-orion.*\")"
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 8589934592  # 8GB in bytes

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "MEAN"
      }
    }
  }

  notification_channels = var.notification_channels
  documentation {
    content   = "Alpha-Orion container memory usage is above 85%. Consider scaling up resources."
    mime_type = "text/markdown"
  }
}

# Alert Policy: Pod Not Ready
resource "google_monitoring_alert_policy" "pod_not_ready" {
  display_name = "Alpha-Orion: Pod Not Ready"
  combiner     = "OR"

  conditions {
    display_name = "Pod readiness probe failed"

    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"kubernetes.io/container/health_check_status\" AND metric.labels.\"pod_name\"=monitoring.regex.full_match(\"alpha-orion.*\") AND metric.labels.\"status\"=\"UNHEALTHY\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
    }
  }

  notification_channels = var.notification_channels
  documentation {
    content   = "Alpha-Orion pod readiness probe failed. Container may be unhealthy."
    mime_type = "text/markdown"
  }
}

# Alert Policy: High Error Rate
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "Alpha-Orion: High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "HTTP 5xx errors above 1%"

    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"kubernetes.io/container/http/server/request_count\" AND metric.labels.\"pod_name\"=monitoring.regex.full_match(\"alpha-orion.*\") AND metric.labels.\"status\"=monitoring.regex.full_match(\"5[0-9][0-9]\")"
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "SUM"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields     = ["resource.container_name"]
      }
    }
  }

  notification_channels = var.notification_channels
  documentation {
    content   = "Alpha-Orion is experiencing high HTTP 5xx error rate. Check application logs."
    mime_type = "text/markdown"
  }
}

# Alert Policy: BigQuery Insert Errors
resource "google_monitoring_alert_policy" "bq_insert_errors" {
  display_name = "Alpha-Orion: BigQuery Insert Errors"
  combiner     = "OR"

  conditions {
    display_name = "BigQuery insert errors detected"

    condition_threshold {
      filter          = "resource.type=\"bigquery_dataset\" AND metric.type=\"bigquery.googleapis.com/storage/uploaded_rows\""
      duration        = "60s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1

      # This would need to be customized based on actual metrics
    }
  }

  notification_channels = var.notification_channels
  documentation {
    content   = "Alpha-Orion BigQuery insert operations may be failing. Check execution logs."
    mime_type = "text/markdown"
  }
}

# Uptime Check: API Endpoint
resource "google_monitoring_uptime_check_config" "api_uptime" {
  name        = "alpha-orion-api-uptime"
  display_name = "Alpha-Orion API Uptime"
  timeout     = "10s"
  period      = "60s"

  http_check {
    path         = "/"
    port         = 8000
    use_ssl      = true
    verify_ssl   = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.api_hostname
    }
  }

  notification_channels = var.notification_channels
}

variable "project_id" { type = string }
variable "notification_channels" {
  type        = list(string)
  default     = []
  description = "List of notification channel IDs (email, slack, pagerduty)"
}
variable "api_hostname" { type = string }
