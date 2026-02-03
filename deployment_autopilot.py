#!/usr/bin/env python3
"""
Alpha-Orion Deployment Autopilot
Zero-error Google Cloud deployment system
"""

import subprocess
import sys
import os
import time
import json

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class DeploymentAutopilot:
    def __init__(self):
        self.project_id = self._get_project_id()
        print(f"{Colors.BLUE}🚀 Deployment Autopilot Initialized{Colors.ENDC}")
        print(f"   Target Project: {Colors.BOLD}{self.project_id}{Colors.ENDC}")

    def _get_project_id(self):
        """Get GCP project ID from environment"""
        project_id = os.environ.get("GCP_PROJECT_ID", "alpha-orion-485207")
        return project_id

    def _run_command(self, cmd, description):
        """Run a shell command with error handling"""
        print(f"   {description}...", end=" ")
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
            if result.returncode == 0:
                print(f"{Colors.GREEN}✅ SUCCESS{Colors.ENDC}")
                return True, result.stdout
            else:
                print(f"{Colors.FAIL}❌ FAILED{Colors.ENDC}")
                print(f"      Error: {result.stderr}")
                return False, result.stderr
        except Exception as e:
            print(f"{Colors.FAIL}❌ ERROR: {str(e)}{Colors.ENDC}")
            return False, str(e)

    def check_gcp_access(self):
        """Verify GCP access and APIs"""
        print(f"\n{Colors.HEADER}🔐 PHASE 1A: GCP ACCESS VERIFICATION{Colors.ENDC}")

        # Check gcloud auth
        success, _ = self._run_command("gcloud auth list --filter=status:ACTIVE --format=value(account)",
                                     "Checking GCP authentication")

        if not success:
            print(f"{Colors.FAIL}❌ GCP authentication failed. Please run: gcloud auth login{Colors.ENDC}")
            return False

        # Check project access
        success, _ = self._run_command(f"gcloud config set project {self.project_id}",
                                     f"Setting project to {self.project_id}")

        if not success:
            print(f"{Colors.FAIL}❌ Project access failed. Please verify project permissions.{Colors.ENDC}")
            return False

        # Check required APIs
        apis = [
            "run.googleapis.com",
            "cloudbuild.googleapis.com",
            "secretmanager.googleapis.com",
            "monitoring.googleapis.com",
            "logging.googleapis.com"
        ]

        for api in apis:
            success, _ = self._run_command(f"gcloud services enable {api} --project={self.project_id}",
                                         f"Enabling {api}")
            if not success:
                print(f"{Colors.WARNING}⚠️  API {api} may not be enabled. Deployment may fail.{Colors.ENDC}")

        return True

    def deploy_infrastructure(self):
        """Deploy Terraform infrastructure"""
        print(f"\n{Colors.HEADER}🏗️  PHASE 1B: INFRASTRUCTURE DEPLOYMENT{Colors.ENDC}")

        if not os.path.exists("main.tf"):
            print(f"{Colors.FAIL}❌ main.tf not found in current directory{Colors.ENDC}")
            return False

        # Initialize Terraform
        success, _ = self._run_command("terraform init", "Initializing Terraform")
        if not success:
            return False

        # Validate configuration
        success, _ = self._run_command("terraform validate", "Validating Terraform configuration")
        if not success:
            return False

        # Plan deployment
        success, _ = self._run_command("terraform plan -out=tfplan", "Planning infrastructure deployment")
        if not success:
            return False

        # Apply deployment
        success, output = self._run_command("terraform apply -auto-approve tfplan",
                                          "Deploying infrastructure to GCP")
        if success:
            print(f"{Colors.GREEN}✅ Infrastructure deployed successfully{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.FAIL}❌ Infrastructure deployment failed{Colors.ENDC}")
            return False

    def build_and_deploy_services(self):
        """Build and deploy services using Cloud Build"""
        print(f"\n{Colors.HEADER}🐳 PHASE 1C: SERVICE DEPLOYMENT{Colors.ENDC}")

        if not os.path.exists("cloudbuild-enterprise.yaml"):
            print(f"{Colors.FAIL}❌ cloudbuild-enterprise.yaml not found{Colors.ENDC}")
            return False

        # Submit Cloud Build
        success, output = self._run_command(
            f"gcloud builds submit --config=cloudbuild-enterprise.yaml --project={self.project_id} --timeout=1800",
            "Building and deploying services with Cloud Build"
        )

        if success:
            print(f"{Colors.GREEN}✅ Services deployed successfully{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.FAIL}❌ Service deployment failed{Colors.ENDC}")
            return False

    def verify_deployment(self):
        """Verify deployment success"""
        print(f"\n{Colors.HEADER}✅ PHASE 1D: DEPLOYMENT VERIFICATION{Colors.ENDC}")

        # Check Cloud Run services
        services = ["alpha-orion-core", "alpha-orion-brain", "alpha-orion-executor"]
        all_healthy = True

        for service in services:
            success, output = self._run_command(
                f"gcloud run services describe {service} --platform=managed --region=us-central1 --project={self.project_id} --format='value(status.conditions[0].type)'",
                f"Checking {service} status"
            )
            if not success or "Ready" not in output:
                print(f"{Colors.WARNING}⚠️  {service} may not be healthy{Colors.ENDC}")
                all_healthy = False

        if all_healthy:
            print(f"{Colors.GREEN}✅ All services verified healthy{Colors.ENDC}")
        else:
            print(f"{Colors.WARNING}⚠️  Some services may need attention{Colors.ENDC}")

        return all_healthy

    def deploy_to_cloud_run(self):
        """Main deployment orchestration"""
        print(f"{Colors.BOLD}{Colors.HEADER}🚀 ALPHA-ORION ENTERPRISE DEPLOYMENT AUTOPILOT{Colors.ENDC}")
        print(f"{Colors.BLUE}Zero-Error Google Cloud Deployment System{Colors.ENDC}")
        print("=" * 60)

        # Phase 1A: GCP Access Check
        if not self.check_gcp_access():
            print(f"{Colors.FAIL}❌ GCP access verification failed. Aborting deployment.{Colors.ENDC}")
            sys.exit(1)

        # Phase 1B: Infrastructure
        if not self.deploy_infrastructure():
            print(f"{Colors.FAIL}❌ Infrastructure deployment failed. Aborting.{Colors.ENDC}")
            sys.exit(1)

        # Phase 1C: Services
        if not self.build_and_deploy_services():
            print(f"{Colors.FAIL}❌ Service deployment failed. Aborting.{Colors.ENDC}")
            sys.exit(1)

        # Phase 1D: Verification
        if not self.verify_deployment():
            print(f"{Colors.WARNING}⚠️  Deployment completed with warnings. Manual verification recommended.{Colors.ENDC}")
        else:
            print(f"{Colors.GREEN}✅ Deployment completed successfully!{Colors.ENDC}")

        print(f"\n{Colors.BOLD}🎉 ALPHA-ORION ENTERPRISE PLATFORM DEPLOYED{Colors.ENDC}")
        print(f"   Access your dashboard at: https://alpha-orion-core-[hash]-uc.a.run.app")
        print(f"   Monitor at: https://console.cloud.google.com/run?project={self.project_id}")

if __name__ == "__main__":
    autopilot = DeploymentAutopilot()
    autopilot.deploy_to_cloud_run()
