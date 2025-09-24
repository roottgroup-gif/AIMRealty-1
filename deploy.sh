#!/bin/bash

# MapEstate Deployment Script for Hostinger VPS
# Usage: ./deploy.sh

set -e  # Exit on any error

# Configuration
PROJECT_NAME="mapestate"
DOMAIN="yourdomain.com"  # Change this to your actual domain
PROJECT_DIR="/var/www/$DOMAIN"
BACKUP_DIR="/var/backups/$PROJECT_NAME"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "🚀 Starting MapEstate deployment on Hostinger VPS..."

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

# Setup project directory
setup_project_directory() {
    print_status "Setting up project directory..."
    
    # Create project directory
    mkdir -p $PROJECT_DIR
    mkdir -p $PROJECT_DIR/logs
    mkdir -p $PROJECT_DIR/uploads
    mkdir -p $BACKUP_DIR
    
    # Set correct ownership and permissions
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    chmod -R 750 $PROJECT_DIR/uploads  # Secure upload directory permissions
    chown -R www-data:www-data $PROJECT_DIR/uploads
    
    print_success "Project directory created: $PROJECT_DIR"
}

# Setup Nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    # Check if nginx config exists in project
    if [ -f "./hostinger-nginx.conf" ]; then
        print_status "Setting up Nginx with rate limiting..."
        
        # Add rate limiting zones to nginx.conf if not already present
        if ! grep -q "limit_req_zone.*zone=api" /etc/nginx/nginx.conf; then
            # Add rate limiting to nginx.conf http block
            sed -i '/http {/a\    # Rate limiting zones\n    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;' /etc/nginx/nginx.conf
            print_success "Added rate limiting zones to nginx.conf"
        fi
        
        # Start with HTTP-only config for SSL setup
        if [ -f "./hostinger-nginx-http-only.conf" ]; then
            cp ./hostinger-nginx-http-only.conf $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            print_success "HTTP-only nginx config applied for SSL setup"
        else
            print_error "HTTP-only nginx config not found"
            exit 1
        fi
        
        # Enable the site
        ln -sf $NGINX_AVAILABLE/$DOMAIN $NGINX_ENABLED/$DOMAIN
        
        # Remove default site if it exists
        rm -f $NGINX_ENABLED/default
        
        # Test nginx configuration
        nginx -t
        
        if [ $? -eq 0 ]; then
            systemctl reload nginx
            print_success "Nginx configuration updated and tested successfully"
        else
            print_error "Nginx configuration test failed - check the logs"
            exit 1
        fi
    else
        print_warning "Nginx config file not found. Skipping nginx setup."
    fi
}

# Deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Navigate to project directory
    cd $PROJECT_DIR
    
    # If this is the first deployment, clone the repository
    # You'll need to replace this with your actual repository URL
    # git clone https://github.com/yourusername/mapestate.git .
    
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

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    cd $PROJECT_DIR
    
    if [ -f ".env.production.template" ]; then
        if [ ! -f ".env" ]; then
            cp .env.production.template .env
            print_warning "Created .env file from template. Please edit it with your actual values:"
            print_warning "nano $PROJECT_DIR/.env"
        fi
    else
        print_error "Environment template file not found"
    fi
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
        
        # Now replace with the full SSL configuration
        if [ -f "./hostinger-nginx.conf" ]; then
            cp ./hostinger-nginx.conf $NGINX_AVAILABLE/$DOMAIN
            sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_AVAILABLE/$DOMAIN
            
            # Test and reload nginx with SSL config
            nginx -t
            if [ $? -eq 0 ]; then
                systemctl reload nginx
                print_success "SSL configuration applied and nginx reloaded"
            else
                print_error "SSL nginx configuration test failed"
                exit 1
            fi
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
    pm2 status
    
    # Check nginx status
    systemctl status nginx
    
    # Check if the application is responding
    sleep 5
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        print_success "Application is responding correctly"
    else
        print_warning "Application may not be responding. Check PM2 logs: pm2 logs"
    fi
    
    print_success "Deployment completed!"
    echo ""
    echo "🎉 MapEstate has been deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit environment variables: nano $PROJECT_DIR/.env"
    echo "2. Update database credentials in .env file"
    echo "3. Configure MySQL user password: mysql_secure_installation"
    echo "4. Check application logs: pm2 logs"
    echo "5. Visit your website: https://$DOMAIN"
    echo ""
    echo "🔧 Useful commands:"
    echo "- View application logs: pm2 logs $PROJECT_NAME-api"
    echo "- Restart application: pm2 restart $PROJECT_NAME-api"
    echo "- Check nginx config: nginx -t"
    echo "- Reload nginx: systemctl reload nginx"
    echo "- View database: mysql -u ${PROJECT_NAME}_user -p ${PROJECT_NAME}_db"
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_privileges
    install_dependencies
    setup_firewall
    setup_database
    setup_project_directory
    deploy_application
    setup_environment
    setup_pm2
    setup_nginx
    run_database_migration
    setup_ssl
    final_checks
}

# Check command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "MapEstate Deployment Script"
    echo "Usage: sudo ./deploy.sh"
    echo ""
    echo "This script will:"
    echo "- Install system dependencies (Node.js, Nginx, MySQL)"
    echo "- Configure firewall with UFW"
    echo "- Setup MySQL database"
    echo "- Configure Nginx reverse proxy"
    echo "- Deploy and build the application"
    echo "- Setup PM2 process management"
    echo "- Install SSL certificate with Let's Encrypt"
    echo ""
    echo "Make sure to:"
    echo "1. Update DOMAIN variable in this script"
    echo "2. Upload your project files to the server"
    echo "3. Edit .env file after deployment"
    exit 0
fi

# Run main function
main

print_success "🎉 Deployment script completed! Your MapEstate platform is now live!"