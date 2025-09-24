# 🏠 MapEstate Deployment Guide for Hostinger VPS

Complete step-by-step guide to deploy your MapEstate property platform on Hostinger VPS.

## 📋 Prerequisites

- Hostinger VPS account (KVM 1 or higher recommended)
- Domain name pointed to your VPS IP
- SSH access to your VPS
- Basic terminal/command line knowledge

## 🚀 Quick Start (Automated)

1. **Upload your project files** to your VPS (using SFTP or Git)
2. **Run the automated deployment script**:
   ```bash
   sudo ./deploy.sh
   ```
3. **Configure your environment** variables and database
4. **Visit your website** at https://yourdomain.com

## 📖 Detailed Manual Deployment

### Step 1: Initial VPS Setup

1. **Connect to your VPS via SSH:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Node.js 20.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   ```

4. **Install required system packages:**
   ```bash
   apt-get install -y nginx mysql-server certbot python3-certbot-nginx git htop ufw fail2ban
   ```

5. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

### Step 2: Configure Firewall

```bash
# Reset and configure UFW firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow essential services
ufw allow ssh
ufw allow 'Nginx Full'
# Note: MySQL port 3306 is NOT exposed for security

# Enable firewall
ufw --force enable
```

### Step 3: Setup MySQL Database

1. **Secure MySQL installation:**
   ```bash
   mysql_secure_installation
   ```

2. **Create database and user:**
   ```bash
   mysql -u root -p
   ```
   
   Run these SQL commands:
   ```sql
   CREATE DATABASE mapestate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'mapestate_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
   GRANT ALL PRIVILEGES ON mapestate_db.* TO 'mapestate_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Database schema will be created automatically** by Drizzle during deployment

### Step 4: Setup Project Directory

1. **Create project directory:**
   ```bash
   mkdir -p /var/www/yourdomain.com
   mkdir -p /var/www/yourdomain.com/logs
   mkdir -p /var/www/yourdomain.com/uploads
   ```

2. **Set correct ownership:**
   ```bash
   chown -R www-data:www-data /var/www/yourdomain.com
   chmod -R 755 /var/www/yourdomain.com
   chmod -R 750 /var/www/yourdomain.com/uploads  # Secure permissions
   chown -R www-data:www-data /var/www/yourdomain.com/uploads
   ```

### Step 5: Deploy Your Application

1. **Navigate to project directory:**
   ```bash
   cd /var/www/yourdomain.com
   ```

2. **Upload your project files** (choose one method):

   **Option A: Using Git (recommended):**
   ```bash
   git clone https://github.com/yourusername/mapestate.git .
   ```

   **Option B: Using SFTP/FTP:**
   - Upload all your project files to `/var/www/yourdomain.com`
   - Use FileZilla, WinSCP, or similar tool

3. **Install dependencies and build:**
   ```bash
   npm ci  # Install all dependencies including dev deps for build
   npm run build
   npm prune --production  # Remove dev dependencies after build
   ```

### Step 6: Configure Environment Variables

1. **Copy environment template:**
   ```bash
   cp .env.production.template .env
   ```

2. **Edit environment variables:**
   ```bash
   nano .env
   ```

   Update these important values:
   ```bash
   # Database
   DATABASE_URL="mysql://mapestate_user:YOUR_SECURE_PASSWORD@localhost:3306/mapestate_db"
   
   # Domain
   DOMAIN=yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   
   # Security (generate strong random strings)
   SESSION_SECRET=your-super-secret-session-key-here
   JWT_SECRET=your-jwt-secret-here
   
   # Email (optional)
   SMTP_HOST=smtp.hostinger.com
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASS=your_email_password
   ```

### Step 7: Configure Nginx

1. **Copy Nginx configuration:**
   ```bash
   cp hostinger-nginx.conf /etc/nginx/sites-available/yourdomain.com
   ```

2. **Update domain name in config:**
   ```bash
   sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN/g' /etc/nginx/sites-available/yourdomain.com
   ```

3. **Enable the site:**
   ```bash
   ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
   rm -f /etc/nginx/sites-enabled/default
   ```

4. **Test and reload Nginx:**
   ```bash
   nginx -t
   systemctl reload nginx
   ```

### Step 8: Setup PM2 Process Manager

1. **Start the application:**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

2. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup
   ```

3. **Follow the instructions** displayed by PM2 startup command

### Step 9: Setup SSL Certificate

```bash
# Get Let's Encrypt certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

### Step 10: Run Database Migration

```bash
cd /var/www/yourdomain.com
npm run db:push --force
```

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/db` |
| `DOMAIN` | Your website domain | `mapestate.com` |
| `SESSION_SECRET` | Session encryption key | `random-string-here` |
| `JWT_SECRET` | JWT token encryption | `another-random-string` |
| `SMTP_*` | Email configuration | For contact forms |

### File Upload Configuration

Your platform supports property image uploads. Files are stored in:
- **Upload Directory**: `/var/www/yourdomain.com/uploads/`
- **Web Path**: `https://yourdomain.com/uploads/filename.jpg`
- **Max File Size**: 10MB (configurable in .env)

### Database Schema

Your platform includes these main features:
- **Multi-language support** (English, Arabic, Kurdish)
- **Property management** with detailed information
- **User system** with roles and permissions
- **Wave system** for property organization
- **Currency conversion** with real-time rates
- **Analytics and recommendations**
- **Real-time updates** via Server-Sent Events

## 🛠️ Management Commands

### Application Management
```bash
# Check application status
pm2 status

# View logs
pm2 logs mapestate-api

# Restart application
pm2 restart mapestate-api

# Stop application
pm2 stop mapestate-api
```

### Database Management
```bash
# Access database
mysql -u mapestate_user -p mapestate_db

# Backup database
mysqldump -u mapestate_user -p mapestate_db > backup.sql

# Restore database
mysql -u mapestate_user -p mapestate_db < backup.sql

# Update database schema
npm run db:push --force
```

### Nginx Management
```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Check status
systemctl status nginx

# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log
```

### SSL Certificate Management
```bash
# Check certificate status
certbot certificates

# Renew certificates manually
certbot renew

# Test renewal
certbot renew --dry-run
```

## 🔍 Troubleshooting

### Common Issues

**1. Application won't start:**
```bash
# Check PM2 logs
pm2 logs mapestate-api

# Check environment variables
cat /var/www/yourdomain.com/.env

# Test database connection
mysql -u mapestate_user -p mapestate_db
```

**2. Database connection issues:**
- Verify DATABASE_URL in .env file
- Check MySQL user permissions
- Ensure MySQL service is running: `systemctl status mysql`

**3. File upload issues:**
- Check upload directory permissions: `ls -la /var/www/yourdomain.com/uploads/`
- Verify Nginx file size limits
- Check disk space: `df -h`

**4. SSL certificate issues:**
```bash
# Check certificate status
certbot certificates

# Force renewal
certbot renew --force-renewal
```

**5. Performance issues:**
```bash
# Check server resources
htop

# Monitor PM2 processes
pm2 monit

# Check Nginx error logs
tail -f /var/log/nginx/error.log
```

### Log Locations

- **Application logs**: `pm2 logs` or `/var/www/yourdomain.com/logs/`
- **Nginx access logs**: `/var/log/nginx/access.log`
- **Nginx error logs**: `/var/log/nginx/error.log`
- **MySQL logs**: `/var/log/mysql/error.log`
- **System logs**: `/var/log/syslog`

## 🔒 Security Best Practices

1. **Change default passwords** in .env file
2. **Restrict MySQL access** to localhost only
3. **Use strong session secrets**
4. **Keep system packages updated**
5. **Monitor logs regularly**
6. **Setup fail2ban** for SSH protection
7. **Use HTTPS only** (force redirect in Nginx)

## 🚀 Performance Optimization

1. **Enable Gzip compression** (already in Nginx config)
2. **Use PM2 cluster mode** for multiple cores
3. **Configure MySQL buffer pool** size
4. **Setup Redis caching** (optional)
5. **Optimize images** before upload
6. **Use CDN** for static assets (optional)

## 📊 Monitoring

### Setup Basic Monitoring
```bash
# Install monitoring tools
apt install netdata

# Monitor with PM2
pm2 install pm2-server-monit
```

### Key Metrics to Monitor
- CPU usage
- Memory usage
- Disk space
- Database connections
- Response times
- Error rates

## 🔄 Updates and Maintenance

### Regular Updates
```bash
# Update system packages
apt update && apt upgrade -y

# Update Node.js dependencies
cd /var/www/yourdomain.com
npm update

# Restart application
pm2 restart mapestate-api
```

### Database Maintenance
```bash
# Optimize database tables
mysql -u mapestate_user -p -e "OPTIMIZE TABLE properties, users, inquiries;" mapestate_db

# Clean up old logs (automated via event scheduler)
mysql -u mapestate_user -p -e "CALL cleanup_expired_sessions();" mapestate_db
```

## 🎯 Production Checklist

- [ ] VPS server setup and secured
- [ ] Domain DNS configured
- [ ] SSL certificate installed and auto-renewal setup
- [ ] Database created and optimized
- [ ] Application deployed and running
- [ ] Environment variables configured
- [ ] File uploads working
- [ ] Email notifications working (if configured)
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Performance optimized

## 📞 Support

If you encounter issues during deployment:

1. **Check the logs** first (PM2, Nginx, MySQL)
2. **Verify configuration** files and environment variables
3. **Test individual components** (database, application, web server)
4. **Review this guide** for missed steps

Your MapEstate platform includes advanced features like multi-language support, real-time updates, and comprehensive property management. Take time to test all features after deployment.

---

🎉 **Congratulations!** Your MapEstate property platform is now live on Hostinger VPS!