#!/bin/bash

# MapEstate VPS Deployment Script
# This script deploys the application to /var/www/mapestate.net while preserving uploads

set -e  # Exit on any error

echo "🚀 MapEstate VPS Deployment Script"
echo "=================================="

# Configuration
VPS_DIR="/var/www/mapestate.net"
BACKUP_DIR="$HOME/mapestate_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup uploads folder
echo -e "${YELLOW}📦 Step 1: Backing up uploads folder...${NC}"
mkdir -p "$BACKUP_DIR"

if [ -d "$VPS_DIR/server/uploads" ]; then
    echo "Creating backup of uploads to: $BACKUP_DIR/uploads_$TIMESTAMP"
    cp -r "$VPS_DIR/server/uploads" "$BACKUP_DIR/uploads_$TIMESTAMP"
    echo -e "${GREEN}✅ Uploads backed up successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No existing uploads folder found - this might be first deployment${NC}"
fi

# Step 2: Pull latest code from Git
echo -e "${YELLOW}📥 Step 2: Pulling latest code from Git...${NC}"
cd "$VPS_DIR"

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository. Please clone the repo first.${NC}"
    echo "Run: git clone <your-repo-url> $VPS_DIR"
    exit 1
fi

# Save current uploads location
TEMP_UPLOADS="/tmp/mapestate_uploads_$TIMESTAMP"
if [ -d "$VPS_DIR/server/uploads" ]; then
    echo "Moving uploads to temporary location..."
    mv "$VPS_DIR/server/uploads" "$TEMP_UPLOADS"
fi

# Pull latest code
echo "Fetching latest changes..."
git fetch origin
git pull origin main

echo -e "${GREEN}✅ Code updated successfully${NC}"

# Step 3: Restore uploads folder
echo -e "${YELLOW}📂 Step 3: Restoring uploads folder...${NC}"

# Ensure server directory exists
mkdir -p "$VPS_DIR/server"

# Restore uploads
if [ -d "$TEMP_UPLOADS" ]; then
    echo "Restoring uploads from temporary location..."
    mv "$TEMP_UPLOADS" "$VPS_DIR/server/uploads"
    echo -e "${GREEN}✅ Uploads restored successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Creating new uploads directory structure...${NC}"
    mkdir -p "$VPS_DIR/server/uploads/properties"
    mkdir -p "$VPS_DIR/server/uploads/avatar"
    mkdir -p "$VPS_DIR/server/uploads/customer"
fi

# Set proper permissions
echo "Setting proper permissions for uploads..."
chown -R www-data:www-data "$VPS_DIR/server/uploads"
chmod -R 755 "$VPS_DIR/server/uploads"

# Step 4: Install dependencies
echo -e "${YELLOW}📦 Step 4: Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 5: Build production bundle
echo -e "${YELLOW}🔨 Step 5: Building production bundle...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

# Step 6: Check if .env exists
echo -e "${YELLOW}🔧 Step 6: Checking environment configuration...${NC}"

if [ ! -f "$VPS_DIR/.env" ]; then
    echo -e "${RED}⚠️  WARNING: .env file not found!${NC}"
    echo "Creating .env template..."
    
    cat > "$VPS_DIR/.env" << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# REQUIRED: Base URL for proper sitemap generation
BASE_URL=https://mapestate.net

# MySQL Database - Already configured with your credentials
MYSQL_HOST=72.60.134.44
MYSQL_USER=mapestate
MYSQL_PASSWORD=Mapestate123!
MYSQL_DATABASE=mapestate
MYSQL_PORT=3306

# Session Secret - Generate with: openssl rand -base64 32
SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING

# Image serving
IMAGE_BASE_URL=https://mapestate.net
EOF
    
    echo -e "${YELLOW}⚠️  Please edit .env and update SESSION_SECRET:${NC}"
    echo "Run: nano $VPS_DIR/.env"
    echo "Generate secure secret with: openssl rand -base64 32"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Step 7: Restart application
echo -e "${YELLOW}🔄 Step 7: Restarting application...${NC}"

# Check if PM2 is being used
if command -v pm2 &> /dev/null; then
    echo "Restarting with PM2..."
    pm2 restart all || pm2 start npm --name "mapestate" -- start
    pm2 save
    echo -e "${GREEN}✅ Application restarted with PM2${NC}"
    echo ""
    echo "Check status with: pm2 status"
    echo "View logs with: pm2 logs"
    
# Check if systemd service exists
elif systemctl list-units --full -all | grep -q "mapestate.service"; then
    echo "Restarting with systemd..."
    systemctl restart mapestate
    echo -e "${GREEN}✅ Application restarted with systemd${NC}"
    echo ""
    echo "Check status with: systemctl status mapestate"
    echo "View logs with: journalctl -u mapestate -f"
else
    echo -e "${YELLOW}⚠️  No process manager detected (PM2 or systemd)${NC}"
    echo "You need to start the application manually or set up a process manager"
    echo ""
    echo "Option 1 - Install PM2:"
    echo "  npm install -g pm2"
    echo "  pm2 start npm --name mapestate -- start"
    echo "  pm2 save"
    echo "  pm2 startup"
    echo ""
    echo "Option 2 - Run directly (not recommended for production):"
    echo "  npm start"
fi

# Step 8: Verify uploads
echo -e "${YELLOW}📊 Step 8: Verifying deployment...${NC}"
echo ""
echo "Uploads directory structure:"
ls -lh "$VPS_DIR/server/uploads/" || echo "Could not list uploads"
echo ""
echo "Uploads size:"
du -sh "$VPS_DIR/server/uploads" 2>/dev/null || echo "Could not calculate size"

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=================================="
echo ""
echo "📂 Uploads location: $VPS_DIR/server/uploads"
echo "💾 Backup location: $BACKUP_DIR/uploads_$TIMESTAMP"
echo ""
echo "🔍 Next steps:"
echo "1. Test the website: https://mapestate.net"
echo "2. Check application logs for errors"
echo "3. Verify uploads are accessible: https://mapestate.net/uploads/properties/"
echo ""
echo "📝 Quick commands:"
echo "  - View logs: pm2 logs (or journalctl -u mapestate -f)"
echo "  - Check status: pm2 status (or systemctl status mapestate)"
echo "  - Check uploads: ls -lh $VPS_DIR/server/uploads/"
echo ""
