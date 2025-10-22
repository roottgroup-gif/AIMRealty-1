import type { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware for production
 * Adds CSP, HSTS, COOP, and other security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy - Allow necessary resources
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://tile.openstreetmap.org https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // HTTP Strict Transport Security (HSTS) - 1 year
  // Only set in production with HTTPS
  if (req.protocol === 'https' || req.get('X-Forwarded-Proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Cross-Origin-Opener-Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Cross-Origin-Embedder-Policy
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Cross-Origin-Resource-Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (formerly Feature-Policy)
  const permissions = [
    'geolocation=(self)',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  res.setHeader('Permissions-Policy', permissions);
  
  next();
}

/**
 * Static assets caching middleware
 * Sets long cache times for immutable assets
 */
export function staticAssetsCaching(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  
  // Uploads - cache for 1 year (immutable)
  if (path.startsWith('/uploads/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return next();
  }
  
  // JavaScript and CSS - cache for 1 year if versioned
  if (path.match(/\.(js|css)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return next();
  }
  
  // Images - cache for 1 year
  if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return next();
  }
  
  // Fonts - cache for 1 year
  if (path.match(/\.(woff|woff2|ttf|eot|otf)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return next();
  }
  
  // sitemap.xml and robots.txt - cache for 1 day
  if (path === '/sitemap.xml' || path === '/robots.txt') {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return next();
  }
  
  // HTML files - no cache (always fresh)
  if (path.match(/\.html$/) || path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return next();
  }
  
  next();
}
