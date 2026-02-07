#!/bin/bash
set -e

echo "🚀 Alpha-08 Sovereign: Initializing Infrastructure Provisioning..."

cd alpha-08/infrastructure/terraform

# Initialize Terraform
terraform init

# Plan Infrastructure
terraform plan -out=tfplan -var="project_id=alpha-orion-485207"

# Apply Infrastructure
echo "⚠️ WARNING: This will provision paid resources on GCP (GKE C2 Nodes)."
read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    terraform apply tfplan
    echo "✅ Infrastructure Provisioning Complete!"
else
    echo "❌ Provisioning Aborted."
fi
