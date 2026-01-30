#!/bin/bash
#
# Alpha-Orion Production Secrets Setup Script
# Configures all required secrets for Google Cloud deployment
#

set -e

PROJECT_ID="alpha-orion"

echo "🔐 ALPHA-ORION PRODUCTION SECRETS CONFIGURATION"
echo "==============================================="
echo "Project: $PROJECT_ID"
echo ""

# Function to create secret
create_secret() {
    local secret_name=$1
    local description=$2

    echo "Creating secret: $secret_name"
    echo "$description"
    echo ""

    # Check if secret already exists
    if gcloud secrets describe $secret_name --project=$PROJECT_ID &>/dev/null; then
        echo "⚠️  Secret '$secret_name' already exists. Skipping..."
        return 0
    fi

    read -p "Enter value for $secret_name (or press Enter to skip): " -s secret_value
    echo ""

    if [ -z "$secret_value" ]; then
        echo "⏭️  Skipped $secret_name"
        return 0
    fi

    echo -n "$secret_value" | gcloud secrets create $secret_name \
        --data-file=- \
        --project=$PROJECT_ID

    echo "✅ Created secret: $secret_name"
    echo ""
}

# Blockchain RPC URLs
echo "🌐 BLOCKCHAIN RPC URLS"
echo "----------------------"
create_secret "ethereum-rpc-url" "Ethereum Mainnet RPC URL (e.g., from Infura, Alchemy)"
create_secret "polygon-rpc-url" "Polygon RPC URL (e.g., from Alchemy, Infura)"
create_secret "arbitrum-rpc-url" "Arbitrum RPC URL (e.g., from Alchemy, Infura)"
create_secret "optimism-rpc-url" "Optimism RPC URL (e.g., from Alchemy, Infura)"
create_secret "bsc-rpc-url" "BSC RPC URL (e.g., from QuickNode, GetBlock)"
create_secret "avalanche-rpc-url" "Avalanche RPC URL (e.g., from Infura, Ankr)"
create_secret "base-rpc-url" "Base RPC URL (e.g., from Alchemy)"
create_secret "zksync-rpc-url" "zkSync RPC URL (e.g., from Ankr)"

echo ""

# Private Keys
echo "🔑 PRIVATE KEYS (HIGHLY SENSITIVE)"
echo "-----------------------------------"
echo "⚠️  WARNING: Never commit private keys to Git"
echo "⚠️  WARNING: Use dedicated wallets, never reuse existing ones"
echo ""

create_secret "executor-private-key" "Executor wallet private key (for transaction signing)"
create_secret "withdrawal-wallet-keys" "Withdrawal wallet private key (separate from executor)"

echo ""

# API Keys
echo "🔑 API KEYS"
echo "-----------"
create_secret "pimlico-api-key" "Pimlico API key (ERC-4337 account abstraction)"
create_secret "1inch-api-key" "1inch API key (for advanced routing)"

echo ""

# Database
echo "🗄️  DATABASE CREDENTIALS"
echo "------------------------"
create_secret "db-credentials" "AlloyDB password (generate strong password)"

echo ""

# Verification
echo "✅ SECRETS VERIFICATION"
echo "-----------------------"

echo "Checking created secrets:"
gcloud secrets list --project=$PROJECT_ID --format="table(name)"

echo ""
echo "📋 Required secrets checklist:"
secrets=(
    "ethereum-rpc-url"
    "polygon-rpc-url"
    "arbitrum-rpc-url"
    "optimism-rpc-url"
    "bsc-rpc-url"
    "avalanche-rpc-url"
    "base-rpc-url"
    "zksync-rpc-url"
    "executor-private-key"
    "withdrawal-wallet-keys"
    "pimlico-api-key"
    "1inch-api-key"
    "db-credentials"
)

all_created=true
for secret in "${secrets[@]}"; do
    if gcloud secrets describe $secret --project=$PROJECT_ID &>/dev/null; then
        echo "✅ $secret"
    else
        echo "❌ $secret - MISSING"
        all_created=false
    fi
done

echo ""

if $all_created; then
    echo "🎉 ALL SECRETS CONFIGURED SUCCESSFULLY!"
    echo "You are now ready to proceed with deployment."
    echo ""
    echo "Next step: Run ./deploy-alpha-orion.sh"
else
    echo "⚠️  Some secrets are missing. Please create them before deployment."
    echo "You can re-run this script to add missing secrets."
    exit 1
fi

echo ""
echo "🔒 SECURITY REMINDERS:"
echo "- Never share private keys"
echo "- Rotate keys regularly"
echo "- Use Secret Manager for all sensitive data"
echo "- Enable audit logging"
echo ""

echo "📚 RESOURCES:"
echo "- RPC Providers: https://docs.flashbots.net/flashbots-auction/overview"
echo "- Secret Manager: https://cloud.google.com/secret-manager"
echo "- Security Best Practices: https://cloud.google.com/security/best-practices"
