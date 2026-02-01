#!/bin/bash
# 
# GitHub Repository Setup and Push Script
# Pushes Alpha-Orion codebase to both specified repositories

set -e

echo "🚀 Alpha-Orion GitHub Repository Setup"
echo "========================================"

# Configuration
REPO1="github.com/TemamAb/alpha-orion"
REPO2="github.com/TemamAb/wealthdech"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

# Configure git user (if not set)
if [ -z "$(git config user.name)" ]; then
    echo "⚙️  Configuring Git user..."
    git config user.name "Alpha-Orion Deploy"
    git config user.email "deploy@alpha-orion.com"
fi

# Add all files
echo "📁 Adding files to Git..."
git add .

# Create gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnp
.pnp.js

# Environment
.env
.env.local
.env.production.local
*.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Terraform
.terraform/
*.tfstate
*.tfstate.backup
.terraform.lock.hcl

# Secrets
*secret*
*key*.json
*credentials*

# Build
dist/
build/
*.egg-info/

# Logs
*.log
logs/

# Testing
.coverage
htmlcov/
.pytest_cache/
EOF
    echo "✅ Created .gitignore"
fi

# Commit changes
echo "💾 Committing changes..."
git add .gitignore
if git diff-index --quiet HEAD --; then
    echo "ℹ️  No changes to commit"
else
    git commit -m "🤖 Gemini Pilot Protocol: Added Autonomous Monitoring & Continuous Fix Loop"
    echo "✅ Changes committed"
fi

# Add remote repositories
echo "🔗 Adding remote repositories..."

# Remove existing remotes if they exist
git remote remove origin 2>/dev/null || true
git remote remove wealthdech 2>/dev/null || true

# Add new remotes
git remote add origin "https://$REPO1.git"
git remote add wealthdech "https://$REPO2.git"

echo "✅ Remotes added:"
echo "   - origin: $REPO1"
echo "   - wealthdech: $REPO2"

# Create and checkout main branch
echo "🌿 Setting up main branch..."
git branch -M main

# Display status
echo ""
echo "📊 Repository Status:"
git status --short | head -20
echo ""

# Get Commit Hash
COMMIT_HASH=$(git rev-parse HEAD)

# Push to repositories
echo "🚀 Pushing to GitHub repositories..."
git push -u origin main
git push wealthdech main || echo "⚠️  Secondary push to wealthdech failed (check permissions)"

echo ""
echo "✅ SUCCESS: Codebase pushed to GitHub"
echo "🔑 Commit Hash: $COMMIT_HASH"
