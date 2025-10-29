# VPS Deployment Instructions

## Quick Deploy to /var/www/mapestate.net

Follow these steps to deploy your application to your VPS while preserving your uploads folder.

---

## Option 1: Automated Deployment (Recommended)

### 1. Transfer the deployment script to your VPS

From your local machine or Replit:

```bash
scp deploy-to-vps.sh root@72.60.134.44:/root/
```

### 2. SSH into your VPS

```bash
ssh root@72.60.134.44
```

### 3. Make the script executable and run it

```bash
chmod +x /root/deploy-to-vps.sh
/root/deploy-to-vps.sh
```

The script will:
- ✅ Backup your uploads folder
- ✅ Pull latest code from Git
- ✅ Restore your uploads folder
- ✅ Install dependencies
- ✅ Build production bundle
- ✅ Restart the application

---

## Option 2: Manual Deployment

If you prefer to deploy manually, follow these steps:

### Step 1: Backup uploads folder

```bash
cd /var/www/mapestate.net

# Create backup
cp -r server/uploads ~/uploads_backup_$(date +%Y%m%d_%H%M%S)
```

### Step 2: Move uploads temporarily

```bash
# Move uploads to safe location during deployment
mv server/uploads /tmp/uploads_temp
```

### Step 3: Pull latest code

```bash
git fetch origin
git pull origin main
```

### Step 4: Restore uploads

```bash
# Restore uploads to server directory
mkdir -p server
mv /tmp/uploads_temp server/uploads

# Set proper permissions
chown -R www-data:www-data server/uploads
chmod -R 755 server/uploads
```

### Step 5: Install dependencies and build

```bash
npm install
npm run build
```

### Step 6: Configure environment variables

Ensure your `.env` file exists with correct values:

```bash
nano .env
```

Add/verify these settings:

```env
NODE_ENV=production
PORT=5000
BASE_URL=https://mapestate.net

# Your MySQL database
MYSQL_HOST=72.60.134.44
MYSQL_USER=mapestate
MYSQL_PASSWORD=Mapestate123!
MYSQL_DATABASE=mapestate
MYSQL_PORT=3306

# Generate with: openssl rand -base64 32
SESSION_SECRET=your-secure-random-session-secret

IMAGE_BASE_URL=https://mapestate.net
```

### Step 7: Restart application

**If using PM2:**
```bash
pm2 restart all
pm2 save
```

**If using systemd:**
```bash
systemctl restart mapestate
```

**If no process manager (first time):**
```bash
# Install PM2
npm install -g pm2

# Start application
cd /var/www/mapestate.net
pm2 start npm --name "mapestate" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

---

## Verify Deployment

### 1. Check application status

**PM2:**
```bash
pm2 status
pm2 logs
```

**systemd:**
```bash
systemctl status mapestate
journalctl -u mapestate -f
```

### 2. Verify uploads are accessible

```bash
# Check uploads directory exists
ls -lh /var/www/mapestate.net/server/uploads/

# Check size
du -sh /var/www/mapestate.net/server/uploads
```

### 3. Test the website

```bash
curl -I https://mapestate.net
curl -I https://mapestate.net/uploads/properties/
```

### 4. Check database connection

The application should automatically connect to your MySQL database at `72.60.134.44` using the credentials you provided.

---

## Uploads Directory Structure

Your uploads folder should maintain this structure:

```
server/uploads/
├── properties/      # Property images
├── avatar/          # User avatars
└── customer/        # Customer files
```

---

## Troubleshooting

### Problem: Uploads folder missing after deployment

**Solution:**
```bash
# Check if backup exists
ls -lh ~/uploads_backup_*

# Restore from most recent backup
cp -r ~/uploads_backup_20241029_* /var/www/mapestate.net/server/uploads

# Fix permissions
chown -R www-data:www-data /var/www/mapestate.net/server/uploads
chmod -R 755 /var/www/mapestate.net/server/uploads
```

### Problem: Uploads not accessible via web

**Solution:**
```bash
# Check Nginx is serving uploads
curl -I https://mapestate.net/uploads/properties/

# Verify Nginx configuration includes uploads location
cat /etc/nginx/sites-available/mapestate.net | grep uploads

# Reload Nginx if needed
sudo nginx -t
sudo systemctl reload nginx
```

### Problem: Permission denied errors

**Solution:**
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/mapestate.net/server/uploads

# Fix permissions
sudo chmod -R 755 /var/www/mapestate.net/server/uploads
```

### Problem: Application won't start

**Solution:**
```bash
# Check logs
pm2 logs
# or
journalctl -u mapestate -f

# Common issues:
# 1. Missing .env file
# 2. Wrong Node.js version (needs v18+)
# 3. Port already in use
# 4. Database connection failed
```

---

## Production Checklist

Before going live, verify:

- ✅ `.env` file configured with production values
- ✅ `SESSION_SECRET` is a secure random string
- ✅ Database connection working
- ✅ Uploads folder has correct permissions
- ✅ Nginx configured for static file caching
- ✅ SSL certificate valid (HTTPS working)
- ✅ Process manager (PM2) configured to restart on boot
- ✅ Regular backups scheduled for uploads folder

---

## Backup Strategy

### Automated daily backups

Create a cron job to backup uploads:

```bash
crontab -e
```

Add this line (runs daily at 2 AM):

```cron
0 2 * * * cp -r /var/www/mapestate.net/server/uploads ~/uploads_backup_$(date +\%Y\%m\%d)
```

### Manual backup before each deployment

Always backup before deploying:

```bash
cp -r /var/www/mapestate.net/server/uploads ~/uploads_backup_$(date +%Y%m%d_%H%M%S)
```

---

## Need Help?

If you encounter issues:

1. Check application logs: `pm2 logs` or `journalctl -u mapestate -f`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify uploads permissions: `ls -lh /var/www/mapestate.net/server/uploads/`
4. Test database connection: Check logs for MySQL connection messages

---

**Your uploads folder will always be preserved during deployment! 🎉**
