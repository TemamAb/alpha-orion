#!/bin/bash

echo "🚀 Fixing terminal configuration..."

# 1. Fix the 'cd' error (Cleanup all profile files)
CONFIG_FILES=("$HOME/.bash_profile" "$HOME/.bashrc" "$HOME/.profile")

for FILE in "${CONFIG_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        # Check for broken paths
        if grep -q "flash-loan-arbitrage-bot" "$FILE" || grep -q "neon" "$FILE"; then
            echo "🧹 Found broken paths in $FILE. Cleaning..."
            # Filter out lines with specific keywords
            grep -v "flash-loan-arbitrage-bot" "$FILE" | grep -v "neon" > "${FILE}.tmp"
            mv "${FILE}.tmp" "$FILE"
            echo "✅ Cleaned $FILE"
        else
            echo "✅ $FILE is clean."
        fi
    fi
done

# 2. Find Google Cloud SDK
echo "🔍 Searching for Google Cloud SDK..."

PATHS_TO_CHECK=(
    "/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin"
    "/c/Program Files/Google/Cloud SDK/google-cloud-sdk/bin"
    "$HOME/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin"
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
    echo "❌ Could not auto-detect Google Cloud SDK location."
    echo "   Please manually add the 'bin' folder of your Google Cloud SDK to your PATH, or reinstall it."
    exit 1
fi

echo "✅ Found SDK at: $GCLOUD_BIN_PATH"

# 3. Add to PATH in .bash_profile (create if missing)
TARGET_FILE="$HOME/.bash_profile"
touch "$TARGET_FILE"

if grep -q "google-cloud-sdk/bin" "$TARGET_FILE"; then
    echo "✅ Your .bash_profile already includes the Google Cloud SDK path."
else
    echo "🔧 Adding Google Cloud SDK to your '$TARGET_FILE'..."
    echo "" >> "$TARGET_FILE"
    echo "# Add Google Cloud SDK to PATH" >> "$TARGET_FILE"
    echo "export PATH=\"\$PATH:$GCLOUD_BIN_PATH\"" >> "$TARGET_FILE"
    echo "✅ Successfully updated your .bash_profile."
fi

echo ""
echo "🎉 DONE! Run this command to apply changes:"
echo "source ~/.bash_profile"