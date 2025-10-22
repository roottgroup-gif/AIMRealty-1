import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite.local";
import { performanceLogger, requestSizeMonitor } from "./middleware/performance";
import { StorageFactory } from "./storageFactory";
import fs from "fs";
import path from "path";

const app = express();

// Trust proxy for correct protocol detection behind reverse proxies
// Only trust first proxy for security (Replit's proxy)
app.set('trust proxy', 1);

// Enable gzip compression for all responses
app.use(compression({
  // Compress responses larger than 1kb
  threshold: 1024,
  // Set compression level (6 is good balance of speed/compression)
  level: 6,
  // Compress these MIME types
  filter: (req, res) => {
    // Don't compress responses if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add request size monitoring
app.use(requestSizeMonitor(10)); // 10MB limit with warnings

// Use enhanced performance logging
app.use(performanceLogger);

// Social media and search engine bot detection middleware for property pages
function isCrawlerBot(userAgent: string): boolean {
  const botPatterns = [
    // Social media bots
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'skypeuripreview',
    'discordbot',
    'slackbot',
    'telegrambot',
    // Search engine bots
    'googlebot',
    'bingbot',
    'yandexbot',
    'baiduspider',
    'duckduckbot'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUserAgent.includes(pattern));
}

// Cache HTML template in memory for performance
let htmlTemplate: string | null = null;
let storage: any = null; // Storage instance for middleware

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

async function injectPropertyMetaTags(req: Request, res: Response, next: NextFunction) {
  // Skip if storage is not initialized yet
  if (!storage) {
    return next();
  }
  // Match both legacy and language-prefixed property URLs
  const propertyMatch = req.path.match(/^(?:\/(en|ar|kur))?\/property\/(.+)$/);
  
  if (!propertyMatch) {
    return next();
  }
  
  const userAgent = req.get('User-Agent') || '';
  
  // Only inject for crawler bots (social media and search engines) to avoid affecting normal users
  if (!isCrawlerBot(userAgent)) {
    return next();
  }
  
  const propertyId = propertyMatch[2]; // Extract property ID from second capture group
  
  try {
    // Try to get property by slug first, then by ID (similar to API route logic)
    let property = await storage.getPropertyBySlug(propertyId);
    
    if (!property) {
      console.log(`🔄 Slug lookup failed for social crawler, trying ID lookup for: ${propertyId}`);
      property = await storage.getProperty(propertyId);
    }
    
    if (!property) {
      console.log(`❌ Property not found for social crawler with slug or ID: ${propertyId}`);
      return next();
    }
    
    // Load HTML template if not cached
    if (!htmlTemplate) {
      const htmlPath = path.join(process.cwd(), 'client', 'index.html');
      htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
    }
    
    let html = htmlTemplate;
    
    // Generate property-specific meta tags with HTML escaping
    const formatPrice = (price: string, currency: string, listingType: string) => {
      const amount = parseFloat(price);
      const formattedAmount = new Intl.NumberFormat().format(amount);
      const suffix = listingType === 'rent' ? '/mo' : '';
      return `${currency === 'USD' ? '$' : currency}${formattedAmount}${suffix}`;
    };
    
    // Use HTTPS for production URLs
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
    
    const propertyTitle = escapeHtml(`${property.title} - ${formatPrice(property.price, property.currency || 'USD', property.listingType)} | MapEstate`);
    const propertyDescription = escapeHtml(`${property.description || `${property.bedrooms} bedroom ${property.type} for ${property.listingType} in ${property.city}, ${property.country}.`} View details, photos, and contact information.`);
    
    // Handle property images - can be array of strings or array of objects with imageUrl
    const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;
    let propertyImage = `${protocol}://${req.get('host')}/logo_1757848527935.png`;
    
    if (firstImage) {
      // Check if it's an object with imageUrl property or just a string
      const imageUrl = typeof firstImage === 'object' && firstImage.imageUrl ? firstImage.imageUrl : firstImage;
      propertyImage = imageUrl.startsWith('http') ? imageUrl : `${protocol}://${req.get('host')}${imageUrl}`;
    }
    // Generate property URL with language prefix if present
    const language = propertyMatch[1] || 'en';
    const languagePrefix = language !== 'en' ? `/${language}` : '';
    const propertyUrl = `${protocol}://${req.get('host')}${languagePrefix}/property/${property.slug || property.id}`;
    const secureImageUrl = propertyImage.replace('http://', 'https://');
    
    // Map language to OG locale
    const localeMap: { [key: string]: string } = {
      'en': 'en_US',
      'ar': 'ar_IQ',
      'kur': 'ckb_IQ'  // Kurdish Sorani
    };
    const ogLocale = localeMap[language] || 'en_US';
    
    // Get alternate locales and generate hreflang links
    const allLanguages = ['en', 'ar', 'kur'];
    const hreflangMap: { [key: string]: string } = {
      'en': 'en',
      'ar': 'ar-IQ',
      'kur': 'ku-IQ'  // Kurdish Sorani - ISO 639-1 compliant
    };
    const alternateLocales = allLanguages
      .filter(lang => lang !== language)
      .map(lang => localeMap[lang]);
    
    const hreflangLinks = allLanguages
      .map(lang => {
        const prefix = lang !== 'en' ? `/${lang}` : '';
        const url = `${protocol}://${req.get('host')}${prefix}/property/${property.slug || property.id}`;
        return `<link rel="alternate" hreflang="${hreflangMap[lang]}" href="${url}" />`;
      })
      .join('\n    ') + '\n    ' + `<link rel="alternate" hreflang="x-default" href="${protocol}://${req.get('host')}/property/${property.slug || property.id}" />`;
    
    // Build comprehensive meta tags for social media
    const socialMetaTags = `
    <!-- Property-specific meta tags for social media crawlers -->
    <title>${propertyTitle}</title>
    <meta name="title" content="${propertyTitle}" />
    <meta name="description" content="${propertyDescription}" />
    <link rel="canonical" href="${propertyUrl}" />
    ${hreflangLinks}
    
    <!-- Open Graph / Facebook / LinkedIn -->
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${propertyTitle}" />
    <meta property="og:description" content="${propertyDescription}" />
    <meta property="og:image" content="${propertyImage}" />
    <meta property="og:image:secure_url" content="${secureImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(property.title)}" />
    <meta property="og:url" content="${propertyUrl}" />
    <meta property="og:site_name" content="MapEstate" />
    <meta property="og:locale" content="${ogLocale}" />
    ${alternateLocales.map(locale => `<meta property="og:locale:alternate" content="${locale}" />`).join('\n    ')}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${propertyTitle}" />
    <meta name="twitter:description" content="${propertyDescription}" />
    <meta name="twitter:image" content="${propertyImage}" />
    <meta name="twitter:image:alt" content="${escapeHtml(property.title)}" />
    <meta name="twitter:site" content="@MapEstate" />
    <meta name="twitter:creator" content="@MapEstate" />
    
    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="MapEstate" />
    `;
    
    // Property-specific structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": property.title,
      "description": property.description || `${property.bedrooms} bedroom ${property.type} in ${property.city}`,
      "image": propertyImage,
      "url": propertyUrl,
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": property.currency || "USD",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "MapEstate"
        }
      },
      "category": property.type,
      "location": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": property.address,
          "addressLocality": property.city,
          "addressCountry": property.country
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": property.latitude,
          "longitude": property.longitude
        }
      }
    };
    
    // Safely embed JSON-LD to prevent script tag termination
    const jsonLd = JSON.stringify(structuredData, null, 6).replace(/<\/script>/gi, '<\\/script>');
    const structuredDataScript = `\n    <script type="application/ld+json">\n${jsonLd}\n    </script>\n`;
    
    // Remove default Open Graph and Twitter meta tags from index.html to avoid duplicates
    // Social media crawlers use the FIRST occurrence of meta tags
    html = html.replace(/<meta property="og:type"[^>]*>/g, '');
    html = html.replace(/<meta property="og:url"[^>]*>/g, '');
    html = html.replace(/<meta property="og:title"[^>]*>/g, '');
    html = html.replace(/<meta property="og:description"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image:width"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image:height"[^>]*>/g, '');
    html = html.replace(/<meta property="og:site_name"[^>]*>/g, '');
    html = html.replace(/<meta property="og:locale"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:card"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:url"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:title"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:description"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:image"[^>]*>/g, '');
    html = html.replace(/<meta name="title"[^>]*>/g, '');
    html = html.replace(/<meta name="description"[^>]*>/g, '');
    html = html.replace(/<link rel="canonical"[^>]*>/g, '');
    html = html.replace(/<title>.*?<\/title>/g, '');
    
    // Remove default structured data script
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    
    // Inject property-specific tags before </head> tag
    html = html.replace('</head>', `${socialMetaTags}${structuredDataScript}  </head>`);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('Error injecting property meta tags:', error);
    next();
  }
}

(async () => {
  // Initialize storage (with automatic MySQL/MemStorage detection)
  storage = await StorageFactory.getStorage();
  
  // Add meta tag injection middleware AFTER storage is initialized
  app.use(injectPropertyMetaTags);

  // Fix existing users' language permissions on startup
  try {
    console.log('🔧 Running startup fix for user language permissions...');
    if (typeof storage.fixExistingUsersLanguagePermissions === 'function') {
      await storage.fixExistingUsersLanguagePermissions();
    }
  } catch (error) {
    console.warn('⚠️ Failed to run startup language permissions fix:', error);
  }

  const server = await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 5000 for Replit compatibility
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Use the specified port (5000 for Replit)
  const actualPort = port;
  
  // Use 0.0.0.0 on Replit, localhost on local Mac/Windows
  // macOS doesn't support 0.0.0.0 binding in some Node versions
  const host = process.env.REPL_ID ? "0.0.0.0" : "localhost";
  
  server.listen({
    port: actualPort,
    host: host,
    reusePort: true,
  }, () => {
    log(`serving on port ${actualPort}`);
  });
})();
