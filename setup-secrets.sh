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

# Helper to read from .env
get_env_value() {
    local key=$1
    if [ -f .env ]; then
        # 1. Try exact match
        local val=$(grep "^$key=" .env | cut -d= -f2- | tr -d '"' | tr -d "'")
        if [ -n "$val" ]; then echo "$val"; return; fi
        
        # 2. Try uppercase match (e.g. ethereum-rpc-url -> ETHEREUM_RPC_URL)
        local upper_key=$(echo "$key" | tr '[:lower:]-' '[:upper:]_')
        val=$(grep "^$upper_key=" .env | cut -d= -f2- | tr -d '"' | tr -d "'")
        if [ -n "$val" ]; then echo "$val"; return; fi

        # 3. Special case for 1inch
        if [ "$key" == "one-inch-api-key" ]; then
             val=$(grep "^ONE_INCH_API_KEY=" .env | cut -d= -f2- | tr -d '"' | tr -d "'")
             if [ -n "$val" ]; then echo "$val"; return; fi
        fi
    fi
}

# Alchemy Auto-Configuration
echo "🔮 ALCHEMY API CONFIGURATION (Optional)"
echo "---------------------------------------"
echo "Provide an Alchemy API Key to auto-generate RPC URLs for Eth, Polygon, Arb, Opt, and Base."

# Check .env for ALCHEMY_KEY
ENV_ALCHEMY=$(get_env_value "ALCHEMY_KEY")
if [ -z "$ENV_ALCHEMY" ]; then
    ENV_ALCHEMY=$(get_env_value "ALCHEMY_API_KEY")
fi

if [ -n "$ENV_ALCHEMY" ]; then
    ALCHEMY_KEY="$ENV_ALCHEMY"
    echo "📄 Found Alchemy Key in .env"
else
    read -p "Enter Alchemy API Key (or press Enter to skip): " -s ALCHEMY_KEY
    echo ""
fi
echo ""
echo ""

if [ -n "$ALCHEMY_KEY" ]; then
    echo "✅ Alchemy Key detected. RPC URLs will be auto-configured."
    echo ""
fi

# Function to create secret
create_secret() {
    local secret_name=$1
    local description=$2
    local auto_value=$3

    echo "Creating secret: $secret_name"
    echo "$description"
    echo ""

    # Check if secret already exists
    if gcloud secrets describe $secret_name --project=$PROJECT_ID &>/dev/null; then
        echo "⚠️  Secret '$secret_name' already exists. Skipping..."
        return 0
    fi

    # Use auto-value if provided
    if [ -n "$auto_value" ]; then
        echo -n "$auto_value" | gcloud secrets create $secret_name --data-file=- --project=$PROJECT_ID
        echo "✅ Created secret: $secret_name (Auto-configured)"
        echo ""
        return 0
    fi

    # Check .env first
    local env_val=$(get_env_value "$secret_name")
    if [ -n "$env_val" ]; then
        echo "📄 Found value for $secret_name in .env"
        echo -n "$env_val" | gcloud secrets create $secret_name --data-file=- --project=$PROJECT_ID
        echo "✅ Created secret: $secret_name (from .env)"
        echo ""
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

# Construct Alchemy URLs if key exists
ETH_URL=$([ -n "$ALCHEMY_KEY" ] && echo "https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY" || echo "")
POLY_URL=$([ -n "$ALCHEMY_KEY" ] && echo "https://polygon-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY" || echo "")
ARB_URL=$([ -n "$ALCHEMY_KEY" ] && echo "https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY" || echo "")
OPT_URL=$([ -n "$ALCHEMY_KEY" ] && echo "https://opt-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY" || echo "")
BASE_URL=$([ -n "$ALCHEMY_KEY" ] && echo "https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY" || echo "")

create_secret "ethereum-rpc-url" "Ethereum Mainnet RPC URL" "$ETH_URL"
create_secret "polygon-rpc-url" "Polygon RPC URL" "$POLY_URL"
create_secret "arbitrum-rpc-url" "Arbitrum RPC URL" "$ARB_URL"
create_secret "optimism-rpc-url" "Optimism RPC URL" "$OPT_URL"
create_secret "base-rpc-url" "Base RPC URL" "$BASE_URL"

echo ""

# Wallets
echo "👛 WALLET CONFIGURATION"
echo "-----------------------"
create_secret "profit-destination-wallet" "Public wallet address for profit withdrawals (0x...)"

echo ""

# API Keys
echo "🔑 API KEYS"
echo "-----------"
create_secret "pimlico-api-key" "Pimlico API key (ERC-4337 account abstraction)"
create_secret "one-inch-api-key" "1inch API key (for advanced routing)"

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
    "base-rpc-url"
    "profit-destination-wallet"
    "pimlico-api-key"
    "one-inch-api-key"
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
