#!/bin/bash
#
# Alpha-Orion Development Environment Fixer
# Diagnoses and helps resolve issues with gcloud, terraform, and shellcheck.
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
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


# Function to check for gcloud
check_gcloud() {
    log "Checking for Google Cloud SDK (gcloud)..."
    if command -v gcloud &> /dev/null; then
        success "gcloud is already in your PATH."
        return
    fi

    warning "gcloud not found in PATH. Searching for standard installations..."
    
    # Define potential paths
    PATHS_TO_CHECK=(
        "/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin"
        "/c/Program Files/Google/Cloud SDK/google-cloud-sdk/bin"
        "/c/Users/$USER/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin"
        "/c/google-cloud-sdk/bin"
    )

    GCLOUD_BIN_PATH=""
    for PATH_CHECK in "${PATHS_TO_CHECK[@]}"; do
        if [ -d "$PATH_CHECK" ]; then
            GCLOUD_BIN_PATH="$PATH_CHECK"
            break
        fi
    done

    if [ -z "$GCLOUD_BIN_PATH" ]; then
        error "Could not auto-detect Google Cloud SDK location."
        echo "👉 Please install it from: https://cloud.google.com/sdk/docs/install"
    else
        success "Found SDK at: $GCLOUD_BIN_PATH"
        TARGET_FILE="$HOME/.bash_profile"
        touch "$TARGET_FILE"
        if grep -q "google-cloud-sdk/bin" "$TARGET_FILE"; then
            success "Your .bash_profile already includes the Google Cloud SDK path."
        else
            warning "Adding Google Cloud SDK to your '$TARGET_FILE'..."
            echo "" >> "$TARGET_FILE"
            echo "# Add Google Cloud SDK to PATH" >> "$TARGET_FILE"
            echo "export PATH=\"\$PATH:$GCLOUD_BIN_PATH\"" >> "$TARGET_FILE"
            success "Successfully updated your .bash_profile."
            echo "👉 Run 'source ~/.bash_profile' or restart your terminal to apply."
        fi
    fi
}

# Function to check for terraform
check_terraform() {
    log "Checking for Terraform..."
    if command -v terraform &> /dev/null; then
        success "Terraform is installed."
    else
        error "Terraform is not installed."
        warning "This is required for infrastructure deployment."
        echo "👉 Please install it from: https://developer.hashicorp.com/terraform/downloads"
    fi
}

# Function to check for shellcheck
check_shellcheck() {
    log "Checking for ShellCheck (for VS Code extension)..."
    if command -v shellcheck &> /dev/null; then
        success "ShellCheck is installed."
    else
        error "ShellCheck is not installed."
        warning "This is required for the ShellCheck VS Code extension to provide script analysis."
        echo "👉 To fix this, you can use a package manager (recommended):"

        # Check for package managers
        if command -v choco &> /dev/null; then
            success "Chocolatey is installed. Run this command to install:"
            echo -e "   ${GREEN}choco install shellcheck${NC}"
        elif command -v scoop &> /dev/null; then
            success "Scoop is installed. Run this command to install:"
            echo -e "   ${GREEN}scoop install shellcheck${NC}"
        else
            warning "Package manager (Chocolatey/Scoop) not found. Manual installation needed."
            echo "   1. Install Chocolatey: https://chocolatey.org/install"
            echo "   2. Then run: choco install shellcheck"
        fi
    fi
}

main() {
    echo "🚀 Alpha-Orion Development Environment Diagnostics"
    echo "================================================="
    check_gcloud
    echo "-------------------------------------------------"
    check_terraform
    echo "-------------------------------------------------"
    check_shellcheck
    echo "================================================="
    success "Diagnostics complete."
}

main