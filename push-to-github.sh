#!/bin/bash

# Push latest code to GitHub repository
# Repository: https://github.com/roottgroup-gif/AIMRealty-1

set -e

echo "🚀 Pushing MapEstate code to GitHub"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Navigate to project directory
cd /var/www/mapestate.net

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "Initialize with:"
    echo "  git init"
    echo "  git remote add origin https://github.com/roottgroup-gif/AIMRealty-1.git"
    exit 1
fi

# Verify remote
echo -e "${YELLOW}📡 Checking remote repository...${NC}"
git remote -v

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}🌿 Current branch: ${CURRENT_BRANCH}${NC}"

# Show current status
echo -e "${YELLOW}📊 Current git status:${NC}"
git status

echo ""
echo -e "${YELLOW}📝 Adding all changes...${NC}"

# Add all changes (excluding node_modules, dist, etc. - should be in .gitignore)
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${GREEN}✅ No changes to commit - repository is up to date${NC}"
    exit 0
fi

# Show what will be committed
echo ""
echo -e "${YELLOW}📋 Files to be committed:${NC}"
git diff --staged --name-status

echo ""
echo -e "${YELLOW}💬 Creating commit...${NC}"

# Create commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_MSG="Update MapEstate - MySQL integration and deployment improvements - $TIMESTAMP"

git commit -m "$COMMIT_MSG"

echo -e "${GREEN}✅ Commit created successfully${NC}"

# Push to GitHub
echo ""
echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"

# Try to push
if git push origin "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo "🔗 Repository: https://github.com/roottgroup-gif/AIMRealty-1"
    echo "🌿 Branch: $CURRENT_BRANCH"
else
    echo -e "${RED}❌ Push failed${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Authentication required - you may need to enter GitHub username/password"
    echo "2. Or set up SSH key authentication"
    echo "3. Or use personal access token"
    echo ""
    echo "Try pushing manually with:"
    echo "  git push origin $CURRENT_BRANCH"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 GitHub repository updated successfully!${NC}"
echo ""
echo "Recent commits:"
git log --oneline -5
