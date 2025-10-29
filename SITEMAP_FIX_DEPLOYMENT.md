# Sitemap.xml Fix - Deployment Guide

## Problem
- `https://mapestate.net/sitemap.xml` was returning 404
- `https://mapestate.net/robots.txt` was working fine

## Root Cause
The issue was that:
1. **robots.txt** is a static file served directly by nginx/Express
2. **sitemap.xml** was a dynamic route, but nginx was returning 404 for missing static files without proxying to Express

## Solution
We've created a **static sitemap.xml** file that will be served just like robots.txt. This file:
- Contains all main pages in all languages (en, ar, kur)
- Has proper hreflang tags for multilingual SEO
- Will be served as a static asset by nginx

## Files Changed
1. **client/src/App.tsx** - Fixed language redirect to skip backend routes
2. **client/public/sitemap.xml** - NEW: Static sitemap file
3. **scripts/generate-sitemap.js** - NEW: Script to regenerate sitemap

## Deployment Steps

### On Your VPS (as root):

```bash
# 1. Navigate to project directory
cd /var/www/mapestate.net

# 2. Backup uploads folder (safety first!)
cp -r server/uploads ~/uploads_backup_$(date +%Y%m%d)

# 3. Pull latest changes from GitHub
git pull origin main

# 4. Install dependencies (if needed)
npm install

# 5. Build the project
npm run build

# 6. Restart PM2
pm2 restart all

# 7. Save PM2 configuration
pm2 save

# 8. Test the sitemap
curl -I https://mapestate.net/sitemap.xml
```

### Expected Result
After deployment, you should see:
```
HTTP/1.1 200 OK
Content-Type: application/xml
```

## Testing

### Test sitemap.xml:
```bash
curl https://mapestate.net/sitemap.xml | head -30
```

You should see:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://mapestate.net/en/</loc>
    <lastmod>2025-10-29</lastmod>
    ...
```

### Test robots.txt:
```bash
curl https://mapestate.net/robots.txt | grep Sitemap
```

Should show:
```
Sitemap: /sitemap.xml
```

## Future Updates

### When to regenerate sitemap.xml:

The current static sitemap includes all main pages but NOT individual property listings. To add properties to the sitemap:

1. **Run the generation script:**
   ```bash
   node scripts/generate-sitemap.js
   ```

2. **Or use the dynamic route** (once nginx is configured to proxy /sitemap.xml):
   - The dynamic route at `/sitemap.xml` automatically includes all properties
   - You can switch to the dynamic route by removing the static `client/public/sitemap.xml` file

### To switch to dynamic sitemap (optional):

If you want property listings in the sitemap:

1. Remove the static sitemap:
   ```bash
   rm client/public/sitemap.xml
   rm dist/public/sitemap.xml
   ```

2. Configure nginx to proxy `/sitemap.xml` to Express:
   ```nginx
   location = /sitemap.xml {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

3. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Verification

Test both on production:
- ✅ https://mapestate.net/sitemap.xml
- ✅ https://mapestate.net/robots.txt
- ✅ https://mapestate.net/en/
- ✅ https://mapestate.net/ar/
- ✅ https://mapestate.net/kur/

## SEO Benefits

This fix enables:
- ✅ Google Search Console sitemap submission
- ✅ Faster indexing of your multilingual pages
- ✅ Proper hreflang tags for international SEO
- ✅ Better search engine discovery

## Support

If you encounter any issues:
1. Check PM2 logs: `pm2 logs mapestate`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify file exists: `ls -lh /var/www/mapestate.net/dist/public/sitemap.xml`
