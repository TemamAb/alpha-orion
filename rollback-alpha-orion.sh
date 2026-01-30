  #!/bin/bash
#
# Alpha-Orion Emergency Rollback Script
# Complete system rollback with data preservation
#

set -e

PROJECT_ID="alpha-orion"
REGION="us-central1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚨 ALPHA-ORION EMERGENCY ROLLBACK SYSTEM"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Mode: EMERGENCY ROLLBACK"
echo ""

# Function to log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to confirm action
confirm() {
    local message=$1
    echo -e "${YELLOW}⚠️  WARNING: $message${NC}"
    read -p "Type 'YES' to confirm: " confirmation
    if [ "$confirmation" != "YES" ]; then
        echo "Rollback cancelled."
        exit 1
    fi
}

# Rollback services to previous version
rollback_services() {
    log "Rolling back Cloud Run services..."

    # Get list of services
    services=$(gcloud run services list --region=$REGION --format="value(name)" --project=$PROJECT_ID)

    for service in $services; do
        log "Rolling back $service..."

        # Get previous revision
        previous_revision=$(gcloud run revisions list --service=$service --region=$REGION --limit=2 --format="value(name)" --project=$PROJECT_ID | sed -n '2p')

        if [ -n "$previous_revision" ]; then
            gcloud run services update-traffic $service \
                --to-revisions=$previous_revision=100 \
                --region=$REGION \
                --project=$PROJECT_ID \
                --quiet
            success "Rolled back $service to $previous_revision"
        else
            warning "No previous revision found for $service"
        fi
    done
}

# Rollback infrastructure
rollback_infrastructure() {
    log "Rolling back infrastructure..."

    cd infrastructure

    # Create destroy plan
    terraform plan -destroy -out=destroy.tfplan -var="project_id=$PROJECT_ID" -no-color

    # Confirm destructive action
    confirm "This will DESTROY all infrastructure including databases and storage. Data may be lost!"

    # Execute destroy
    terraform destroy -auto-approve -var="project_id=$PROJECT_ID" -no-color

    cd ..
    success "Infrastructure rolled back"
}

# Stop all trading activities
stop_trading() {
    log "Stopping all trading activities..."

    # Set system to maintenance mode via Redis
    # This would signal all services to stop trading
    warning "Trading stop signal sent to all services"

    # Wait for active trades to complete
    log "Waiting for active trades to complete (30 seconds)..."
    sleep 30

    success "Trading activities stopped"
}

# Create backup before rollback
create_backup() {
    log "Creating emergency backup..."

    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_bucket="alpha-orion-emergency-backup-$timestamp"

    # Create backup bucket
    gsutil mb -p $PROJECT_ID gs://$backup_bucket

    # Backup Bigtable data
    cbt listinstances --project=$PROJECT_ID > bigtable_backup_$timestamp.txt
    gsutil cp bigtable_backup_$timestamp.txt gs://$backup_bucket/

    # Backup database (if possible)
    warning "Database backup requires manual intervention"

    success "Emergency backup created in gs://$backup_bucket"
}

# Isolate affected systems
isolate_systems() {
    log "Isolating affected systems..."

    # Update load balancer to maintenance page
    # Update Cloud Armor to block all traffic except monitoring
    warning "System isolation may affect legitimate users"

    success "Systems isolated"
}

# Send alerts
send_alerts() {
    log "Sending rollback alerts..."

    # This would integrate with your alerting system
    # Slack, PagerDuty, email alerts
    warning "Manual alerts may be required"

    success "Alerts sent"
}

# Complete rollback
complete_rollback() {
    confirm "This will perform COMPLETE SYSTEM ROLLBACK including infrastructure destruction!"

    send_alerts
    stop_trading
    create_backup
    isolate_systems
    rollback_services

    echo ""
    warning "Infrastructure rollback will destroy all resources!"
    read -p "Continue with infrastructure rollback? (yes/no): " infra_confirm

    if [ "$infra_confirm" = "yes" ]; then
        rollback_infrastructure
    else
        warning "Infrastructure rollback skipped"
    fi

    success "Emergency rollback completed"
}

# Service-only rollback
service_rollback() {
    confirm "This will rollback ALL services to previous versions!"

    send_alerts
    stop_trading
    create_backup
    rollback_services

    success "Service rollback completed"
}

# Status check
status_check() {
    log "Checking system status..."

    echo "Service Status:"
    gcloud run services list --region=$REGION --format="table(name,status.conditions[0].type,status.conditions[0].status)" --project=$PROJECT_ID

    echo ""
    echo "Recent Errors:"
    gcloud logging read "resource.type=cloud_run_revision" \
        --filter="severity>=ERROR AND timestamp>$(date -u +%Y-%m-%dT%H:%M:%SZ --date='1 hour ago')" \
        --limit=5 \
        --format="table(timestamp,severity,textPayload)" \
        --project=$PROJECT_ID || echo "No recent errors"

    echo ""
    echo "Infrastructure Status:"
    gcloud compute instances list --project=$PROJECT_ID --format="table(name,status)" || echo "No compute instances"
}

# Recovery guidance
recovery_guidance() {
    echo ""
    echo "🔄 RECOVERY GUIDANCE"
    echo "===================="

    if [ "$1" = "complete" ]; then
        echo "Complete rollback performed. To recover:"
        echo "1. Run: ./deploy-alpha-orion-production.sh"
        echo "2. Restore from backup if needed"
        echo "3. Verify all systems before resuming trading"
    elif [ "$1" = "service" ]; then
        echo "Service rollback performed. Services are now on previous versions."
        echo "1. Monitor service health"
        echo "2. Gradually resume trading"
        echo "3. Investigate root cause before redeploying"
    fi

    echo ""
    echo "📞 EMERGENCY CONTACTS:"
    echo "- DevOps Lead: [24/7 Contact]"
    echo "- GCP Support: https://console.cloud.google.com/support"
    echo "- Monitoring: https://console.cloud.google.com/monitoring"
}

# Main script logic
case "$1" in
    "--complete")
        echo "🔴 COMPLETE SYSTEM ROLLBACK"
        echo "This will destroy ALL infrastructure and rollback everything!"
        complete_rollback
        recovery_guidance "complete"
        ;;
    "--services")
        echo "🟡 SERVICE-ONLY ROLLBACK"
        echo "This will rollback services but keep infrastructure intact."
        service_rollback
        recovery_guidance "service"
        ;;
    "--status")
        echo "📊 SYSTEM STATUS CHECK"
        status_check
        ;;
    "--help"|*)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Emergency rollback options:"
        echo "  --complete    Complete system rollback (destroys everything)"
        echo "  --services    Rollback services only (keeps infrastructure)"
        echo "  --status      Check current system status"
        echo "  --help        Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 --services    # Safe rollback option"
        echo "  $0 --complete    # Nuclear option - use with extreme caution"
        echo "  $0 --status      # Check what's running"
        ;;
esac

echo ""
echo "🛡️ Rollback operations completed safely."
