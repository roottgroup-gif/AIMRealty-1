# MapEstate VPS Deployment Guide

## PageSpeed Insights Optimization - Achieve 100% Scores

This guide will help you deploy the latest optimizations to your VPS to achieve 100% scores on PageSpeed Insights.

---

## Prerequisites

- SSH access to your VPS (72.60.134.44)
- Git installed
- Node.js and npm installed
- PM2 or systemd for process management

---

## Step 1: Environment Variables Setup

On your VPS, create a `.env` file in your project root with these variables:

```bash
# Navigate to your project
cd /var/www/mapestate.net

# Create .env file
nano .env
```

Add the following content:

```bash
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# REQUIRED: Base URL for proper sitemap generation
BASE_URL=https://mapestate.net

# MySQL Database (already configured via secrets)
MYSQL_HOST=72.60.134.44
MYSQL_USER=mapestate
MYSQL_PASSWORD=Mapestate123!
MYSQL_DATABASE=mapestate
MYSQL_PORT=3306

# Session Secret (CHANGE THIS!)
SESSION_SECRET=$(openssl rand -base64 32)

# Image serving
IMAGE_BASE_URL=https://mapestate.net
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## Step 2: Update Your Code from GitHub

```bash
# Backup uploads folder (safety measure)
cp -r server/uploads ~/uploads_backup_$(date +%Y%m%d)

# Pull latest code
git fetch origin
git pull origin main

# Install/update dependencies
npm install

# Build production bundle
npm run build
```

---

## Step 3: Nginx Configuration for Caching

Update your Nginx configuration to add caching headers:

```bash
sudo nano /etc/nginx/sites-available/mapestate.net
```

Add this inside the `server` block:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Cache uploads
location /uploads/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Sitemap and robots - cache for 1 day
location ~* (sitemap\.xml|robots\.txt)$ {
    expires 1d;
    add_header Cache-Control "public";
}

# Security headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# HSTS (only if using HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 4: Restart Your Application

```bash
# Using PM2
pm2 restart all
pm2 save

# Or using systemd
sudo systemctl restart mapestate

# Check status
pm2 status
# or
sudo systemctl status mapestate
```

---

## Step 5: Verify Everything Works

### Test the sitemap:
```bash
curl -I https://mapestate.net/sitemap.xml
```

You should see: `HTTP/2 200` and `content-type: application/xml`

### Test robots.txt:
```bash
curl https://mapestate.net/robots.txt
```

Should include: `Sitemap: https://mapestate.net/sitemap.xml`

### Test cache headers:
```bash
curl -I https://mapestate.net/uploads/properties/some-image.jpg
```

Should include: `Cache-Control: public, immutable`

---

## Step 6: Run PageSpeed Insights

Visit: https://pagespeed.web.dev/

Test both:
- ✅ Mobile: https://mapestate.net/
- ✅ Desktop: https://mapestate.net/

---

## What Was Fixed

### ✅ Performance (Target: 100)
- Added HTTP cache headers for static assets (1 year cache)
- Gzip compression enabled
- Static asset caching middleware
- Optimized image serving

### ✅ Accessibility (Target: 100)
- Semantic HTML landmarks added
- Accessible button labels
- ARIA attributes for interactive elements

### ✅ Best Practices (Target: 100)
- CSP (Content Security Policy) headers
- HSTS (HTTP Strict Transport Security)
- COOP (Cross-Origin-Opener-Policy)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy configured

### ✅ SEO (Target: 100)
- Fixed robots.txt sitemap URL (now absolute)
- Proper meta tags
- Structured data (JSON-LD)
- Multilingual hreflang tags
- Canonical URLs

---

## Troubleshooting

### Sitemap not working?
Make sure `BASE_URL` is set in your `.env` file:
```bash
BASE_URL=https://mapestate.net
```

### Images not loading?
Check uploads folder permissions:
```bash
sudo chown -R www-data:www-data /var/www/mapestate.net/server/uploads
sudo chmod -R 755 /var/www/mapestate.net/server/uploads
```

### Application won't start?
Check logs:
```bash
pm2 logs
# or
sudo journalctl -u mapestate -f
```

---

## Maintenance

### Update from GitHub
```bash
cd /var/www/mapestate.net
git pull origin main
npm install
npm run build
pm2 restart all
```

### Backup uploads before updates
```bash
cp -r server/uploads ~/uploads_backup_$(date +%Y%m%d)
```

---

## Support

For issues, check:
1. Application logs: `pm2 logs` or `journalctl -u mapestate -f`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Network connectivity: `curl -I https://mapestate.net`

---

**Expected PageSpeed Scores After Deployment:**
- 📱 Mobile: 90-100
- 💻 Desktop: 95-100
- ♿ Accessibility: 100
- ✅ Best Practices: 96-100
- 🔍 SEO: 100
