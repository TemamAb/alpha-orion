#!/bin/bash
#
# Alpha-Orion GCP Real-time Monitoring Dashboard
# Live deployment monitoring and performance metrics
#

PROJECT_ID="alpha-orion"
REGION="us-central1"

echo "📊 ALPHA-ORION GCP MONITORING DASHBOARD"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Mode: Real-time Monitoring"
echo ""

# Function to display service status
show_service_status() {
    echo "🚀 SERVICE STATUS"
    echo "-----------------"
    gcloud run services list --region=$REGION --format="table(name,status.conditions[0].type,status.conditions[0].status,traffic.status)" --project=$PROJECT_ID
    echo ""
}

# Function to show recent logs
show_recent_logs() {
    echo "📋 RECENT LOGS (Last 10 minutes)"
    echo "---------------------------------"
    gcloud logging read "resource.type=cloud_run_revision" \
        --filter="timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ --date='10 minutes ago')" \
        --limit=10 \
        --format="table(timestamp,severity,textPayload)" \
        --project=$PROJECT_ID || echo "No recent logs found"
    echo ""
}

# Function to show performance metrics
show_performance_metrics() {
    echo "⚡ PERFORMANCE METRICS"
    echo "----------------------"

    # CPU Utilization
    echo "CPU Utilization (last 5 minutes):"
    gcloud monitoring query \
        "fetch cloud_run_revision::run.googleapis.com/container/cpu/utilization \
         | align delta(1m) \
         | every 1m \
         | group_by [resource.service_name], [value_utilization_mean: mean(value.utilization)]" \
        --project=$PROJECT_ID \
        --format="table[no-heading](resource.service_name,value_utilization_mean)" || echo "Metrics not available yet"

    # Memory Utilization
    echo "Memory Utilization (last 5 minutes):"
    gcloud monitoring query \
        "fetch cloud_run_revision::run.googleapis.com/container/memory/utilization \
         | align delta(1m) \
         | every 1m \
         | group_by [resource.service_name], [value_utilization_mean: mean(value.utilization)]" \
        --project=$PROJECT_ID \
        --format="table[no-heading](resource.service_name,value_utilization_mean)" || echo "Metrics not available yet"

    # Request Count
    echo "Request Count (last 5 minutes):"
    gcloud monitoring query \
        "fetch cloud_run_revision::run.googleapis.com/request_count \
         | align delta(1m) \
         | every 1m \
         | group_by [resource.service_name], [value_request_count_sum: sum(value.request_count)]" \
         --project=$PROJECT_ID \
         --format="table[no-heading](resource.service_name,value_request_count_sum)" || echo "Metrics not available yet"

    echo ""
}

# Function to show infrastructure status
show_infrastructure_status() {
    echo "🏗️  INFRASTRUCTURE STATUS"
    echo "-------------------------"

    # Bigtable clusters
    echo "Bigtable Clusters:"
    gcloud bigtable clusters list --project=$PROJECT_ID --format="table(name,zone,state)" || echo "Bigtable not deployed yet"

    # Dataflow jobs
    echo "Dataflow Jobs:"
    gcloud dataflow jobs list --project=$PROJECT_ID --region=$REGION --format="table(name,state,createTime)" --limit=5 || echo "No Dataflow jobs running"

    # AlloyDB instances
    echo "AlloyDB Instances:"
    gcloud alloydb instances list --project=$PROJECT_ID --region=$REGION --format="table(name,state,ipAddress)" || echo "AlloyDB not deployed yet"

    # Redis instances
    echo "Redis Instances:"
    gcloud redis instances list --project=$PROJECT_ID --region=$REGION --format="table(name,host,port,status)" || echo "Redis not deployed yet"

    echo ""
}

# Function to show error monitoring
show_error_monitoring() {
    echo "🚨 ERROR MONITORING (Last 15 minutes)"
    echo "--------------------------------------"

    error_count=$(gcloud logging read "resource.type=cloud_run_revision" \
        --filter="severity>=ERROR AND timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ --date='15 minutes ago')" \
        --limit=20 \
        --project=$PROJECT_ID | wc -l)

    if [ "$error_count" -gt 0 ]; then
        echo "❌ Found $error_count errors in the last 15 minutes:"
        gcloud logging read "resource.type=cloud_run_revision" \
            --filter="severity>=ERROR AND timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ --date='15 minutes ago')" \
            --limit=5 \
            --format="table(timestamp,resource.service_name,severity,textPayload)" \
            --project=$PROJECT_ID
    else
        echo "✅ No errors detected in the last 15 minutes"
    fi

    echo ""
}

# Function to show deployment progress
show_deployment_progress() {
    echo "🚀 DEPLOYMENT PROGRESS"
    echo "----------------------"

    # Check Cloud Build status
    recent_builds=$(gcloud builds list --limit=3 --project=$PROJECT_ID --format="table(id,status,createTime,duration)")
    if [ -n "$recent_builds" ]; then
        echo "Recent Cloud Builds:"
        echo "$recent_builds"
    else
        echo "No recent builds found"
    fi

    echo ""
}

# Main monitoring loop
if [ "$1" = "--continuous" ]; then
    echo "🔄 Starting continuous monitoring (Ctrl+C to stop)"
    echo "Updates every 30 seconds..."
    echo ""

    while true; do
        clear
        echo "📊 ALPHA-ORION GCP MONITORING DASHBOARD - $(date)"
        echo "=================================================="
        show_service_status
        show_performance_metrics
        show_error_monitoring
        show_infrastructure_status
        echo "⏰ Next update in 30 seconds... (Ctrl+C to stop)"
        sleep 30
    done
else
    # Single run
    echo "📊 ALPHA-ORION GCP MONITORING DASHBOARD - $(date)"
    echo "=================================================="
    show_service_status
    show_deployment_progress
    show_performance_metrics
    show_error_monitoring
    show_infrastructure_status
    show_recent_logs

    echo "💡 Commands:"
    echo "  ./gcp-monitoring-dashboard.sh --continuous    # Continuous monitoring"
    echo "  gcloud monitoring dashboards create          # Create custom dashboard"
    echo "  gcloud logging read                           # View detailed logs"
    echo ""
    echo "🔗 Useful Links:"
    echo "  Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
    echo "  Logs: https://console.cloud.google.com/logs?project=$PROJECT_ID"
    echo "  Services: https://console.cloud.google.com/run?project=$PROJECT_ID"
    echo ""
fi
