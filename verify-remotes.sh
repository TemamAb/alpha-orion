#!/bin/bash

echo "🔍 Verifying Git Remote Configuration..."
echo "========================================"

git remote -v

echo ""
if git remote | grep -q "wealthdeck"; then
    echo "❌ WARNING: 'wealthdeck' remote detected. Please remove it."
else
    echo "✅ SUCCESS: 'wealthdeck' remote is correctly removed."
fi