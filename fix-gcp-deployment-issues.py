#!/usr/bin/env python3
"""
GCP Deployment Issues Fixer for Alpha-Orion
Automatically detects and resolves common GCP deployment problems
"""

import subprocess
import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class GCPDeploymentFixer:
    def __init__(self, project_id: str = "alpha-orion", region: str = "us-central1"):
        self.project_id = project_id
        self.region = region
        self.issues_found = []
        self.issues_fixed = []
        self.auth_id = "100036329256815676668"

        # Common GCP deployment issues and their fixes
        self.issue_fixes = {
            "authentication": self.fix_authentication_issues,
            "apis_disabled": self.fix_disabled_apis,
            "iam_permissions": self.fix_iam_permissions,
            "terraform_state": self.fix_terraform_state,
            "cloud_build": self.fix_cloud_build_config,
            "networking": self.fix_networking_issues,
            "service_accounts": self.fix_service_account_issues,
            "quotas": self.fix_quota_issues,
            "billing": self.fix_billing_issues,
            "regions": self.fix_region_availability
        }

    def run_command(self, command: str, description: str = "", timeout: int = 30) -> Tuple[bool, str, str]:
        """Execute shell command with error handling"""
        try:
            print(f"🔧 {description}")
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", f"Command timed out after {timeout}s"
        except Exception as e:
            return False, "", str(e)

    def check_gcloud_auth(self) -> bool:
        """Check if gcloud is properly authenticated"""
        success, stdout, stderr = self.run_command(
            "gcloud auth list --filter=status:ACTIVE --format='value(account)'",
            "Checking gcloud authentication"
        )

        if not success or not stdout.strip():
            self.issues_found.append({
                "type": "authentication",
                "severity": "CRITICAL",
                "description": "No active gcloud authentication found",
                "solution": "Run 'gcloud auth login' to authenticate"
            })
            return False

        print(f"✅ Authenticated as: {stdout.strip()}")
        return True

    def check_project_access(self) -> bool:
        """Check if project is accessible"""
        success, stdout, stderr = self.run_command(
            f"gcloud projects describe {self.project_id} --format='value(projectId)'",
            f"Checking access to project {self.project_id}"
        )

        if not success:
            self.issues_found.append({
                "type": "project_access",
                "severity": "CRITICAL",
                "description": f"Cannot access project {self.project_id}",
                "solution": f"Verify project exists and you have access, or set correct project ID"
            })
            return False

        print(f"✅ Project access confirmed: {stdout.strip()}")
        return True

    def check_required_apis(self) -> List[str]:
        """Check which required APIs are disabled"""
        required_apis = [
            "compute.googleapis.com",
            "dataflow.googleapis.com",
            "bigtable.googleapis.com",
            "aiplatform.googleapis.com",
            "bigquery.googleapis.com",
            "monitoring.googleapis.com",
            "logging.googleapis.com",
            "pubsub.googleapis.com",
            "secretmanager.googleapis.com",
            "cloudbuild.googleapis.com",
            "containerregistry.googleapis.com",
            "run.googleapis.com",
            "vpcaccess.googleapis.com",
            "servicenetworking.googleapis.com",
            "cloudresourcemanager.googleapis.com",
            "iam.googleapis.com",
            "cloudbilling.googleapis.com",
            "securitycenter.googleapis.com",
            "cloudarmor.googleapis.com",
            "networkconnectivity.googleapis.com",
            "certificatemanager.googleapis.com"
        ]

        disabled_apis = []

        for api in required_apis:
            success, stdout, stderr = self.run_command(
                f"gcloud services list --project={self.project_id} --filter='name:{api}' --format='value(name)'",
                f"Checking if {api} is enabled"
            )

            if not success or not stdout.strip():
                disabled_apis.append(api)
                print(f"❌ {api} is DISABLED")
            else:
                print(f"✅ {api} is ENABLED")

        if disabled_apis:
            self.issues_found.append({
                "type": "apis_disabled",
                "severity": "HIGH",
                "description": f"{len(disabled_apis)} required APIs are disabled",
                "details": disabled_apis,
                "solution": "Enable the disabled APIs using gcloud services enable"
            })

        return disabled_apis

    def check_iam_permissions(self) -> List[str]:
        """Check IAM permissions for the current user"""
        required_permissions = [
            "compute.instances.create",
            "bigtable.instances.create",
            "dataflow.jobs.create",
            "aiplatform.endpoints.create",
            "bigquery.datasets.create",
            "iam.serviceAccounts.create",
            "storage.buckets.create",
            "monitoring.dashboards.create"
        ]

        missing_permissions = []

        # Test permissions by attempting to list resources
        test_commands = {
            "compute.instances.list": "gcloud compute instances list --project={self.project_id} --limit=1",
            "bigtable.instances.list": "gcloud bigtable instances list --project={self.project_id}",
            "iam.serviceAccounts.list": "gcloud iam service-accounts list --project={self.project_id}",
            "storage.buckets.list": "gsutil ls -p {self.project_id}"
        }

        for permission, command in test_commands.items():
            success, stdout, stderr = self.run_command(
                command,
                f"Testing {permission} permission"
            )

            if not success:
                missing_permissions.append(permission)
                print(f"❌ Missing permission: {permission}")

        if missing_permissions:
            self.issues_found.append({
                "type": "iam_permissions",
                "severity": "HIGH",
                "description": f"Missing {len(missing_permissions)} IAM permissions",
                "details": missing_permissions,
                "solution": "Grant required IAM roles or request permissions from project owner"
            })

        return missing_permissions

    def check_terraform_state(self) -> bool:
        """Check Terraform state and configuration"""
        if not os.path.exists("infrastructure"):
            self.issues_found.append({
                "type": "terraform_missing",
                "severity": "CRITICAL",
                "description": "Infrastructure directory not found",
                "solution": "Ensure infrastructure/ directory exists with Terraform files"
            })
            return False

        os.chdir("infrastructure")

        # Check if terraform is initialized
        if not os.path.exists(".terraform"):
            self.issues_found.append({
                "type": "terraform_state",
                "severity": "MEDIUM",
                "description": "Terraform not initialized",
                "solution": "Run 'terraform init' in infrastructure/ directory"
            })
            os.chdir("..")
            return False

        # Check terraform version compatibility
        success, stdout, stderr = self.run_command(
            "terraform version",
            "Checking Terraform version"
        )

        if success:
            print(f"✅ Terraform version: {stdout.strip()}")
        else:
            self.issues_found.append({
                "type": "terraform_version",
                "severity": "MEDIUM",
                "description": "Terraform version check failed",
                "solution": "Install Terraform or check PATH"
            })

        os.chdir("..")
        return True

    def check_cloud_build_config(self) -> bool:
        """Check Cloud Build configuration"""
        if not os.path.exists("cloudbuild.yaml"):
            self.issues_found.append({
                "type": "cloud_build",
                "severity": "MEDIUM",
                "description": "cloudbuild.yaml not found",
                "solution": "Create cloudbuild.yaml for automated deployment"
            })
            return False

        # Check if Cloud Build API is enabled
        success, stdout, stderr = self.run_command(
            f"gcloud services list --project={self.project_id} --filter='name:cloudbuild.googleapis.com' --format='value(name)'",
            "Checking Cloud Build API status"
        )

        if not success or not stdout.strip():
            self.issues_found.append({
                "type": "cloud_build",
                "severity": "HIGH",
                "description": "Cloud Build API is disabled",
                "solution": "Enable Cloud Build API: gcloud services enable cloudbuild.googleapis.com"
            })
            return False

        print("✅ Cloud Build API is enabled")
        return True

    def check_billing_status(self) -> bool:
        """Check if billing is enabled for the project"""
        success, stdout, stderr = self.run_command(
            f"gcloud billing projects describe {self.project_id} --format='value(billingEnabled)'",
            "Checking billing status"
        )

        if not success or stdout.strip() != "True":
            self.issues_found.append({
                "type": "billing",
                "severity": "CRITICAL",
                "description": "Billing is not enabled for this project",
                "solution": "Enable billing in GCP Console or link a billing account"
            })
            return False

        print("✅ Billing is enabled")
        return True

    def check_quotas(self) -> List[str]:
        """Check for quota issues"""
        quota_issues = []

        # Check compute quotas
        success, stdout, stderr = self.run_command(
            f"gcloud compute project-info describe --project={self.project_id} --format='value(quotas[metric=CPUS].limit)'",
            "Checking CPU quota"
        )

        if success and stdout.strip():
            cpu_limit = int(stdout.strip())
            if cpu_limit < 32:
                quota_issues.append("Insufficient CPU quota")
                print(f"⚠️ Low CPU quota: {cpu_limit} CPUs")

        if quota_issues:
            self.issues_found.append({
                "type": "quotas",
                "severity": "MEDIUM",
                "description": f"Quota issues detected: {len(quota_issues)}",
                "details": quota_issues,
                "solution": "Request quota increases in GCP Console"
            })

        return quota_issues

    def fix_authentication_issues(self, issue: Dict) -> bool:
        """Fix authentication issues"""
        print("🔐 Fixing authentication issues...")

        # Try to authenticate
        print("Please run: gcloud auth login")
        success, stdout, stderr = self.run_command(
            "gcloud auth login --no-launch-browser",
            "Attempting gcloud authentication"
        )

        if success:
            print("✅ Authentication successful")
            self.issues_fixed.append("authentication")
            return True
        else:
            print("❌ Authentication failed - please run 'gcloud auth login' manually")
            return False

    def fix_disabled_apis(self, issue: Dict) -> bool:
        """Enable disabled APIs"""
        print("🔌 Enabling disabled APIs...")

        disabled_apis = issue.get("details", [])
        success_count = 0

        for api in disabled_apis:
            success, stdout, stderr = self.run_command(
                f"gcloud services enable {api} --project={self.project_id}",
                f"Enabling {api}"
            )

            if success:
                print(f"✅ Enabled {api}")
                success_count += 1
            else:
                print(f"❌ Failed to enable {api}: {stderr}")

        if success_count == len(disabled_apis):
            self.issues_fixed.append("apis_disabled")
            return True
        else:
            print(f"⚠️ Enabled {success_count}/{len(disabled_apis)} APIs")
            return False

    def fix_iam_permissions(self, issue: Dict) -> bool:
        """Fix IAM permission issues"""
        print("👥 Fixing IAM permission issues...")

        print("Current user needs the following roles:")
        print("- Editor or Owner role on the project")
        print("- Or specific permissions for required services")
        print("")
        print("Please contact your GCP project administrator to grant these permissions.")
        print("Alternatively, run this script as a user with sufficient permissions.")

        return False  # Cannot auto-fix IAM issues

    def fix_terraform_state(self, issue: Dict) -> bool:
        """Fix Terraform state issues"""
        print("🏗️ Fixing Terraform state issues...")

        if not os.path.exists("infrastructure"):
            print("❌ Infrastructure directory not found")
            return False

        os.chdir("infrastructure")

        # Initialize Terraform
        success, stdout, stderr = self.run_command(
            "terraform init -upgrade",
            "Initializing Terraform"
        )

        if success:
            print("✅ Terraform initialized successfully")
            os.chdir("..")
            self.issues_fixed.append("terraform_state")
            return True
        else:
            print(f"❌ Terraform init failed: {stderr}")
            os.chdir("..")
            return False

    def fix_cloud_build_config(self, issue: Dict) -> bool:
        """Fix Cloud Build configuration"""
        print("🏗️ Fixing Cloud Build configuration...")

        # Enable Cloud Build API
        success, stdout, stderr = self.run_command(
            f"gcloud services enable cloudbuild.googleapis.com --project={self.project_id}",
            "Enabling Cloud Build API"
        )

        if success:
            print("✅ Cloud Build API enabled")
            self.issues_fixed.append("cloud_build")
            return True
        else:
            print(f"❌ Failed to enable Cloud Build API: {stderr}")
            return False

    def fix_networking_issues(self, issue: Dict) -> bool:
        """Fix networking issues"""
        print("🌐 Checking networking configuration...")

        # This would require more specific network configuration
        # For now, just check if default network exists
        success, stdout, stderr = self.run_command(
            f"gcloud compute networks list --project={self.project_id} --format='value(name)'",
            "Checking networks"
        )

        if success and stdout.strip():
            print("✅ Networks found")
            return True
        else:
            print("⚠️ No networks found - this may cause deployment issues")
            return False

    def fix_service_account_issues(self, issue: Dict) -> bool:
        """Fix service account issues"""
        print("🔑 Checking service accounts...")

        success, stdout, stderr = self.run_command(
            f"gcloud iam service-accounts list --project={self.project_id} --format='value(email)'",
            "Listing service accounts"
        )

        if success and stdout.strip():
            print("✅ Service accounts found")
            return True
        else:
            print("⚠️ No service accounts found")
            return False

    def fix_quota_issues(self, issue: Dict) -> bool:
        """Fix quota issues"""
        print("📊 Checking quota status...")

        print("Quota issues require manual intervention:")
        print("1. Go to GCP Console > IAM & Admin > Quotas")
        print("2. Request quota increases for required resources")
        print("3. Wait for approval (may take hours to days)")

        return False  # Cannot auto-fix quotas

    def fix_billing_issues(self, issue: Dict) -> bool:
        """Fix billing issues"""
        print("💰 Checking billing configuration...")

        print("Billing issues require manual intervention:")
        print("1. Go to GCP Console > Billing")
        print("2. Link or create a billing account")
        print("3. Enable billing for the project")

        return False  # Cannot auto-fix billing

    def fix_region_availability(self, issue: Dict) -> bool:
        """Fix region availability issues"""
        print("🌍 Checking region availability...")

        success, stdout, stderr = self.run_command(
            f"gcloud compute regions list --filter='name:{self.region}' --format='value(name)'",
            f"Checking if region {self.region} is available"
        )

        if success and stdout.strip():
            print(f"✅ Region {self.region} is available")
            return True
        else:
            print(f"⚠️ Region {self.region} may not be available")
            print("Consider using: us-central1, us-east1, or europe-west1")
            return False

    def run_diagnostics(self) -> List[Dict]:
        """Run complete diagnostics to identify issues"""
        print("🔍 RUNNING GCP DEPLOYMENT DIAGNOSTICS")
        print("=" * 50)

        # Run all diagnostic checks
        checks = [
            ("Authentication", self.check_gcloud_auth),
            ("Project Access", self.check_project_access),
            ("Required APIs", lambda: len(self.check_required_apis()) == 0),
            ("IAM Permissions", lambda: len(self.check_iam_permissions()) == 0),
            ("Terraform State", self.check_terraform_state),
            ("Cloud Build", self.check_cloud_build_config),
            ("Billing Status", self.check_billing_status),
            ("Quotas", lambda: len(self.check_quotas()) == 0),
        ]

        for check_name, check_func in checks:
            print(f"\n🔍 {check_name} Check:")
            try:
                result = check_func()
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"   {status}")
            except Exception as e:
                print(f"   ❌ ERROR: {e}")

        return self.issues_found

    def fix_issues(self) -> List[str]:
        """Attempt to fix identified issues"""
        print("\n🔧 ATTEMPTING TO FIX ISSUES")
        print("=" * 50)

        fixable_issues = [issue for issue in self.issues_found
                         if issue["type"] in self.issue_fixes]

        for issue in fixable_issues:
            issue_type = issue["type"]
            severity = issue["severity"]
            description = issue["description"]

            print(f"\n🔧 Fixing {severity}: {description}")

            try:
                fix_func = self.issue_fixes[issue_type]
                success = fix_func(issue)

                if success:
                    print(f"✅ Successfully fixed: {description}")
                else:
                    print(f"⚠️ Could not auto-fix: {description}")
                    print(f"   Manual solution: {issue.get('solution', 'Check documentation')}")

            except Exception as e:
                print(f"❌ Error fixing {description}: {e}")

        return self.issues_fixed

    def generate_report(self) -> Dict:
        """Generate comprehensive deployment report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "project_id": self.project_id,
            "region": self.region,
            "issues_found": len(self.issues_found),
            "issues_fixed": len(self.issues_fixed),
            "issues_details": self.issues_found,
            "fixes_applied": self.issues_fixed,
            "deployment_readiness": "UNKNOWN"
        }

        # Determine deployment readiness
        critical_issues = [i for i in self.issues_found if i["severity"] == "CRITICAL"]
        high_issues = [i for i in self.issues_found if i["severity"] == "HIGH"]

        if not critical_issues and not high_issues:
            report["deployment_readiness"] = "READY"
        elif not critical_issues:
            report["deployment_readiness"] = "CAUTION"
        else:
            report["deployment_readiness"] = "BLOCKED"

        return report

    def run_complete_fix(self) -> bool:
        """Run complete diagnostics and fixing process"""
        print("🚀 GCP DEPLOYMENT ISSUES FIXER")
        print("=" * 50)
        print(f"Project: {self.project_id}")
        print(f"Region: {self.region}")
        print(f"Auth ID: {self.auth_id}")
        print()

        # Run diagnostics
        self.run_diagnostics()

        # Display issues found
        if self.issues_found:
            print(f"\n🚨 ISSUES FOUND: {len(self.issues_found)}")
            print("-" * 40)

            severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
            sorted_issues = sorted(self.issues_found,
                                 key=lambda x: severity_order.get(x["severity"], 99))

            for issue in sorted_issues:
                severity_icon = {
                    "CRITICAL": "🚨",
                    "HIGH": "⚠️",
                    "MEDIUM": "ℹ️",
                    "LOW": "📝"
                }.get(issue["severity"], "❓")

                print(f"{severity_icon} {issue['severity']}: {issue['description']}")
                if "details" in issue:
                    print(f"   └─ Details: {issue['details']}")
        else:
            print("\n✅ NO ISSUES FOUND")
            print("🎉 Your GCP deployment is ready!")

        # Attempt to fix issues
        if self.issues_found:
            self.fix_issues()

        # Generate and save report
        report = self.generate_report()

        with open("gcp-deployment-fix-report.json", 'w') as f:
            json.dump(report, f, indent=2)

        # Final status
        print(f"\n📊 DEPLOYMENT STATUS REPORT")
        print("=" * 50)
        print(f"Issues Found: {report['issues_found']}")
        print(f"Issues Fixed: {report['issues_fixed']}")
        print(f"Deployment Readiness: {report['deployment_readiness']}")
        print(f"Report Saved: gcp-deployment-fix-report.json")

        if report["deployment_readiness"] == "READY":
            print("\n🎉 GCP DEPLOYMENT IS READY!")
            print("🚀 You can now run: ./deploy-enterprise-infrastructure.sh deploy")
        elif report["deployment_readiness"] == "CAUTION":
            print("\n⚠️ GCP DEPLOYMENT HAS MINOR ISSUES")
            print("🔧 Address the remaining issues before deployment")
        else:
            print("\n🚫 GCP DEPLOYMENT IS BLOCKED")
            print("🛑 Critical issues must be resolved before deployment")

        return report["deployment_readiness"] == "READY"


def main():
    """Main deployment fixer function"""
    import argparse

    parser = argparse.ArgumentParser(description="GCP Deployment Issues Fixer for Alpha-Orion")
    parser.add_argument("--project", default="alpha-orion",
                       help="GCP Project ID")
    parser.add_argument("--region", default="us-central1",
                       help="GCP Region")
    parser.add_argument("--fix", action="store_true",
                       help="Automatically attempt to fix issues")
    parser.add_argument("--diagnose-only", action="store_true",
                       help="Only run diagnostics, don't attempt fixes")

    args = parser.parse_args()

    fixer = GCPDeploymentFixer(args.project, args.region)

    if args.diagnose_only:
        fixer.run_diagnostics()
        report = fixer.generate_report()
        print(f"\n📄 Diagnostics report saved to: gcp-deployment-fix-report.json")
    else:
        success = fixer.run_complete_fix()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()