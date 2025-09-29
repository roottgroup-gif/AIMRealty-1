#!/bin/bash

# FIXED MapEstate Deployment Script for Hostinger VPS
# This version includes proper uploads directory handling for images
# Usage: ./deploy-with-uploads-fix.sh

set -e  # Exit on any error

# Configuration
PROJECT_NAME="mapestate"
DOMAIN="dailynewscrypto.net"
PROJECT_DIR="/var/www/$DOMAIN"
SHARED_UPLOADS_DIR="/var/www/shared/uploads"  # NEW: Shared uploads directory
BACKUP_DIR="/var/backups/$PROJECT_NAME"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "🚀 Starting MapEstate deployment with uploads fix on Hostinger VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_privileges() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update system packages
    apt update && apt upgrade -y
    
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install additional tools
    apt-get install -y \
        nginx \
        mysql-server \
        certbot \
        python3-certbot-nginx \
        git \
        htop \
        ufw \
        fail2ban \
        unzip
    
    # Install PM2 globally
    npm install -g pm2
    
    print_success "System dependencies installed"
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential services
    ufw allow ssh
    ufw allow 'Nginx Full'
    # Note: MySQL port 3306 is NOT exposed - database access only via localhost
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured"
}

# Setup MySQL database
setup_database() {
    print_status "Setting up MySQL database..."
    
    # Secure MySQL installation (interactive)
    print_warning "Please run 'mysql_secure_installation' manually after deployment"
    
    # Create database and user
    mysql -e "CREATE DATABASE IF NOT EXISTS ${PROJECT_NAME}_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -e "CREATE USER IF NOT EXISTS '${PROJECT_NAME}_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';"
    mysql -e "GRANT ALL PRIVILEGES ON ${PROJECT_NAME}_db.* TO '${PROJECT_NAME}_user'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
    
    # Apply MySQL security configuration
    if [ -f "./mysql-security.cnf" ]; then
        cp ./mysql-security.cnf /etc/mysql/mysql.conf.d/security.cnf
        systemctl restart mysql
        print_success "MySQL security configuration applied"
    fi
    
    print_success "MySQL database setup completed"
    print_warning "Remember to change the default password in production!"
}

# Setup project directory with FIXED uploads handling
setup_project_directory() {
    print_status "Setting up project directory with fixed uploads handling..."
    
    # Create project directory
    mkdir -p $PROJECT_DIR
    mkdir -p $PROJECT_DIR/logs
    mkdir -p $BACKUP_DIR
    
    # CRITICAL FIX: Create shared uploads directory outside project
    print_status "Creating shared uploads directory at $SHARED_UPLOADS_DIR"
    mkdir -p $SHARED_UPLOADS_DIR
    mkdir -p $SHARED_UPLOADS_DIR/properties
    mkdir -p $SHARED_UPLOADS_DIR/avatar
    mkdir -p $SHARED_UPLOADS_DIR/customer
    
    # Set correct ownership and permissions for project directory
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    
    # Set secure permissions for shared uploads directory
    chown -R www-data:www-data $SHARED_UPLOADS_DIR
    chmod -R 750 $SHARED_UPLOADS_DIR  # Secure upload directory permissions
    
    print_success "Project directory created: $PROJECT_DIR"
    print_success "Shared uploads directory created: $SHARED_UPLOADS_DIR"
}

# Setup Nginx configuration with FIXED image serving
setup_nginx() {
    print_status "Setting up Nginx configuration with fixed uploads handling..."
    
    # Check if FIXED nginx config exists in project
    if [ -f "./hostinger-nginx-fixed.conf" ]; then
        print_status "Using FIXED nginx configuration for proper image serving..."
        
        # Add rate limiting zones to nginx.conf if not already present
        if ! grep -q "limit_req_zone.*zone=api" /etc/nginx/nginx.conf; then
            # Add rate limiting to nginx.conf http block
            sed -i '/http {/a\    # Rate limiting zones\n    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;' /etc/nginx/nginx.conf
            print_success "Added rate limiting zones to nginx.conf"
        fi
        
        # Start with HTTP-only config for SSL setup (if available)
        if [ -f "./hostinger-nginx-http-only.conf" ]; then
            cp ./hostinger-nginx-http-only.conf $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            print_success "HTTP-only nginx config applied for SSL setup"
        else
            # If no HTTP-only config, use the fixed config directly
            cp ./hostinger-nginx-fixed.conf $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/dailynewscrypto.net/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            print_success "FIXED nginx config applied directly"
        fi
        
        # Enable the site
        ln -sf $NGINX_AVAILABLE/$DOMAIN $NGINX_ENABLED/$DOMAIN
        
        # Remove default site if it exists
        rm -f $NGINX_ENABLED/default
        
        # Test nginx configuration
        nginx -t
        
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            print_success "FIXED nginx configuration updated and tested successfully"
        else
            print_error "Nginx configuration test failed - check the logs"
            exit 1
        fi
    elif [ -f "./hostinger-nginx.conf" ]; then
        print_warning "Using old nginx config - images may not work properly!"
        print_warning "Consider using hostinger-nginx-fixed.conf for proper image serving"
        
        # Fallback to original config
        cp ./hostinger-nginx.conf $NGINX_AVAILABLE/$DOMAIN
        sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
        ln -sf $NGINX_AVAILABLE/$DOMAIN $NGINX_ENABLED/$DOMAIN
        rm -f $NGINX_ENABLED/default
        nginx -t && systemctl reload nginx
    else
        print_error "No nginx config file found. Please ensure hostinger-nginx-fixed.conf exists."
        exit 1
    fi
}

# Deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Navigate to project directory
    cd $PROJECT_DIR
    
    # For manual upload, we assume files are already in place
    print_warning "Please ensure your project files are uploaded to $PROJECT_DIR"
    
    # Install dependencies and build
    if [ -f "package.json" ]; then
        print_status "Installing Node.js dependencies (including dev dependencies for build)..."
        npm ci
        
        # Build the application
        print_status "Building application..."
        npm run build
        
        # Remove dev dependencies after build to save space
        print_status "Removing dev dependencies..."
        npm prune --production
        
        print_success "Application built successfully and dev dependencies removed"
    else
        print_error "package.json not found in $PROJECT_DIR"
        exit 1
    fi
}

# Setup environment variables with UPLOADS_PATH
setup_environment() {
    print_status "Setting up environment variables with uploads path..."
    
    cd $PROJECT_DIR
    
    # Create .env file with proper uploads path
    if [ -f ".env.production.template" ]; then
        if [ ! -f ".env" ]; then
            cp .env.production.template .env
        fi
    else
        print_status "Creating .env file with uploads configuration..."
        touch .env
    fi
    
    # Add or update UPLOADS_PATH in .env
    if grep -q "UPLOADS_PATH=" .env; then
        sed -i "s|UPLOADS_PATH=.*|UPLOADS_PATH=$SHARED_UPLOADS_DIR|" .env
    else
        echo "UPLOADS_PATH=$SHARED_UPLOADS_DIR" >> .env
    fi
    
    # Add NODE_ENV if not present
    if ! grep -q "NODE_ENV=" .env; then
        echo "NODE_ENV=production" >> .env
    fi
    
    print_success "Environment variables configured with UPLOADS_PATH=$SHARED_UPLOADS_DIR"
    print_warning "Please edit .env file with your actual database and other values:"
    print_warning "nano $PROJECT_DIR/.env"
}

# Setup PM2 process management
setup_pm2() {
    print_status "Setting up PM2 process management..."
    
    cd $PROJECT_DIR
    
    # Stop existing processes (as root first, then www-data)
    pm2 stop all || true
    pm2 delete all || true
    sudo -u www-data pm2 stop all || true
    sudo -u www-data pm2 delete all || true
    
    # Start the application using ecosystem config as www-data user
    if [ -f "ecosystem.config.js" ]; then
        # Ensure www-data can access PM2
        mkdir -p $PROJECT_DIR/.pm2
        chown -R www-data:www-data $PROJECT_DIR/.pm2
        
        # Start application as www-data user
        sudo -u www-data pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        sudo -u www-data pm2 save
        
        # Setup PM2 to start on system boot
        pm2 startup systemd -u www-data --hp $PROJECT_DIR
        
        # Execute the generated startup command if it was created
        if [ -f /etc/systemd/system/pm2-www-data.service ]; then
            systemctl enable pm2-www-data
            print_success "PM2 systemd service enabled for auto-start"
        else
            print_warning "PM2 systemd service may need manual setup. Check: systemctl status pm2-www-data"
        fi
        
        print_success "PM2 configured and application started as www-data user"
    else
        print_error "PM2 ecosystem config not found"
        exit 1
    fi
}

# Setup SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Get Let's Encrypt certificate using webroot
    certbot certonly --webroot -w /var/www/$DOMAIN/dist/public -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully"
        
        # Now replace with the FIXED SSL configuration
        if [ -f "./hostinger-nginx-fixed.conf" ]; then
            cp ./hostinger-nginx-fixed.conf $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/dailynewscrypto.net/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            
            # Test and reload nginx with SSL config
            nginx -t
            if [ $? -eq 0 ]; then
                systemctl reload nginx
                print_success "FIXED SSL configuration applied and nginx reloaded"
            else
                print_error "SSL nginx configuration test failed"
                exit 1
            fi
        elif [ -f "./hostinger-nginx.conf" ]; then
            print_warning "Using fallback nginx config - images may not work properly"
            cp ./hostinger-nginx.conf $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            nginx -t && systemctl reload nginx
        fi
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
        print_success "SSL auto-renewal configured"
    else
        print_warning "SSL certificate installation failed. You may need to configure it manually."
    fi
}

# Database migration
run_database_migration() {
    print_status "Running database migration..."
    
    cd $PROJECT_DIR
    
    # Run database push (using Drizzle) - this is the safe way
    if [ -f "package.json" ]; then
        print_status "Running Drizzle database migration..."
        npm run db:push --force
        print_success "Database schema updated via Drizzle"
    else
        print_error "package.json not found - cannot run database migration"
        exit 1
    fi
}

# Final checks and status
final_checks() {
    print_status "Running final checks..."
    
    # Check if PM2 processes are running
    sudo -u www-data pm2 status
    
    # Check nginx status
    systemctl status nginx
    
    # Check if the application is responding
    sleep 5
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        print_success "Application is responding correctly"
    else
        print_warning "Application may not be responding. Check PM2 logs: sudo -u www-data pm2 logs"
    fi
    
    # Check uploads directory permissions
    print_status "Checking uploads directory permissions..."
    ls -la $SHARED_UPLOADS_DIR
    
    print_success "Deployment completed!"
    echo ""
    echo "🎉 MapEstate has been deployed successfully with FIXED image uploads!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit environment variables: nano $PROJECT_DIR/.env"
    echo "2. Update database credentials in .env file"
    echo "3. Configure MySQL user password: mysql_secure_installation"
    echo "4. Check application logs: sudo -u www-data pm2 logs"
    echo "5. Visit your website: https://$DOMAIN"
    echo ""
    echo "🔧 Useful commands:"
    echo "- View application logs: sudo -u www-data pm2 logs $PROJECT_NAME-api"
    echo "- Restart application: sudo -u www-data pm2 restart $PROJECT_NAME-api"
    echo "- Check nginx config: nginx -t"
    echo "- Reload nginx: systemctl reload nginx"
    echo "- View uploads directory: ls -la $SHARED_UPLOADS_DIR"
    echo "- Test image upload: curl -X POST -F 'file=@test.jpg' https://$DOMAIN/api/upload/properties"
    echo ""
    echo "🖼️ UPLOADS CONFIGURATION:"
    echo "- Uploads directory: $SHARED_UPLOADS_DIR"
    echo "- Express serves uploads via: /uploads/"
    echo "- Nginx proxies /uploads/ to Node.js (port 3000)"
    echo "- Environment variable: UPLOADS_PATH=$SHARED_UPLOADS_DIR"
}

# Main deployment process
main() {
    print_status "Starting deployment process with uploads fix..."
    
    check_privileges
    install_dependencies
    setup_firewall
    setup_database
    setup_project_directory  # Now includes shared uploads setup
    deploy_application
    setup_environment  # Now includes UPLOADS_PATH
    setup_pm2
    setup_nginx  # Now uses fixed nginx config
    run_database_migration
    setup_ssl
    final_checks
}

# Check command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "MapEstate Deployment Script with Uploads Fix"
    echo "Usage: sudo ./deploy-with-uploads-fix.sh"
    echo ""
    echo "This script will:"
    echo "- Install system dependencies (Node.js, Nginx, MySQL)"
    echo "- Configure firewall with UFW"
    echo "- Setup MySQL database"
    echo "- Configure Nginx reverse proxy with FIXED uploads handling"
    echo "- Deploy and build the application"
    echo "- Setup PM2 process management"
    echo "- Install SSL certificate with Let's Encrypt"
    echo "- Create shared uploads directory at $SHARED_UPLOADS_DIR"
    echo "- Configure environment variables for proper image serving"
    echo ""
    echo "CRITICAL FIXES:"
    echo "- Uses hostinger-nginx-fixed.conf for proper image serving"
    echo "- Creates shared uploads directory outside build process"
    echo "- Sets UPLOADS_PATH environment variable"
    echo "- Nginx proxies /uploads/ to Node.js instead of serving from disk"
    echo ""
    echo "Make sure to:"
    echo "1. Update DOMAIN variable in this script"
    echo "2. Upload your project files to the server"
    echo "3. Ensure hostinger-nginx-fixed.conf is in your project"
    echo "4. Edit .env file after deployment"
    exit 0
fi

# Run main function
main

print_success "🎉 Deployment script completed! Your MapEstate platform with FIXED image uploads is now live!"