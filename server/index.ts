import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite.local";
import { performanceLogger, requestSizeMonitor } from "./middleware/performance";
import { securityHeaders, staticAssetsCaching } from "./middleware/security";
import { StorageFactory } from "./storageFactory";
import fs from "fs";
import path from "path";

const app = express();

// Trust proxy for correct protocol detection behind reverse proxies
// Only trust first proxy for security (Replit's proxy)
app.set('trust proxy', 1);

// Security headers (CSP, HSTS, COOP, etc.)
app.use(securityHeaders);

// Static assets caching
app.use(staticAssetsCaching);

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

// Language-specific SEO translations
const seoTranslations = {
  en: {
    homeTitle: "MapEstate - AI-Powered Real Estate Finder | Find Your Perfect Property",
    homeDescription: "Find your perfect home with AI-powered recommendations. Discover properties for rent and sale worldwide with intelligent search, detailed maps, and expert agents. Search apartments, houses, villas, and land with advanced filters.",
    propertiesTitle: "Properties for Sale and Rent Worldwide | MapEstate",
    propertiesDescription: "Browse thousands of properties for sale and rent worldwide. Find apartments, houses, villas, and land with advanced search, AI recommendations, and detailed property information.",
    language: "English",
    locale: "en_US"
  },
  ar: {
    homeTitle: "MapEstate - محرك البحث العقاري المدعوم بالذكاء الاصطناعي | اعثر على عقارك المثالي",
    homeDescription: "اعثر على منزلك المثالي مع التوصيات المدعومة بالذكاء الاصطناعي. اكتشف العقارات للإيجار والبيع في جميع أنحاء العالم مع البحث الذكي والخرائط التفصيلية والوكلاء الخبراء.",
    propertiesTitle: "عقارات للبيع والإيجار في جميع أنحاء العالم | MapEstate",
    propertiesDescription: "تصفح آلاف العقارات للبيع والإيجار في جميع أنحاء العالم. ابحث عن شقق ومنازل وفيلات وأراضي مع البحث المتقدم والتوصيات الذكية والمعلومات التفصيلية عن العقارات.",
    language: "Arabic",
    locale: "ar_IQ"
  },
  kur: {
    homeTitle: "MapEstate - دۆزەرەوەی خانووبەرەی پاڵپشتیکراو بە AI | خانووبەرەی تەواوت بدۆزەرەوە",
    homeDescription: "ماڵی تەواوی خۆت بدۆزەرەوە لەگەڵ پێشنیارەکانی پاڵپشتیکراو بە AI. خانووبەرەکان بۆ کرێ و فرۆشتن لە سەرانسەری جیهان بدۆزەرەوە لەگەڵ گەڕانی زیرەک و نەخشەی ورد و بریکارە شارەزاکان.",
    propertiesTitle: "خانووبەرە بۆ فرۆشتن و کرێ لە سەرانسەری جیهان | MapEstate",
    propertiesDescription: "هەزاران خانووبەرە بۆ فرۆشتن و کرێ لە سەرانسەری جیهان بگەڕێ. شوقە، ماڵ، ڤیلا و زەوی بدۆزەرەوە لەگەڵ گەڕانی پێشکەوتوو، پێشنیاری AI و زانیاری ورد لەسەر خانووبەرەکان.",
    language: "Kurdish",
    locale: "ckb_IQ"
  }
};

// Language-specific meta tag injection for home and other pages
async function injectLanguageSpecificMetaTags(req: Request, res: Response, next: NextFunction) {
  // Only inject for crawler bots
  const userAgent = req.get('User-Agent') || '';
  const isCrawler = isCrawlerBot(userAgent);
  
  if (!isCrawler) {
    return next();
  }
  
  // Match language-prefixed URLs: /:lang or /:lang/ or /:lang/properties etc
  const languageMatch = req.path.match(/^\/(en|ar|kur)(?:\/([^\/]+)?)?(?:\/)?$/);
  
  if (!languageMatch) {
    return next();
  }
  
  const language = languageMatch[1] as 'en' | 'ar' | 'kur';
  const page = languageMatch[2] || 'home'; // Default to home if no page specified
  
  console.log(`🤖 Social media crawler detected on /${language}${page !== 'home' ? `/${page}` : ''} - Injecting ${language.toUpperCase()} meta tags`);
  
  try {
    // Load HTML template if not cached
    if (!htmlTemplate) {
      const htmlPath = path.join(process.cwd(), 'client', 'index.html');
      htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
    }
    
    let html = htmlTemplate;
    
    // Get translations for the current language
    const trans = seoTranslations[language];
    
    // Determine page-specific title and description
    let title = trans.homeTitle;
    let description = trans.homeDescription;
    
    if (page === 'properties') {
      title = trans.propertiesTitle;
      description = trans.propertiesDescription;
    }
    
    // Use HTTPS for production URLs
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
    const host = req.get('host');
    const pageUrl = `${protocol}://${host}/${language}${page !== 'home' ? `/${page}` : '/'}`;
    const imageUrl = `${protocol}://${host}/mapestate-social-preview.png`;
    const secureImageUrl = imageUrl.replace('http://', 'https://');
    
    // Generate hreflang links for all languages
    const allLanguages = ['en', 'ar', 'kur'];
    const hreflangMap: { [key: string]: string } = {
      'en': 'en',
      'ar': 'ar-IQ',
      'kur': 'ku-IQ'
    };
    
    const hreflangLinks = allLanguages
      .map(lang => {
        const url = `${protocol}://${host}/${lang}${page !== 'home' ? `/${page}` : '/'}`;
        return `<link rel="alternate" hreflang="${hreflangMap[lang]}" href="${url}" />`;
      })
      .join('\n    ') + '\n    ' + `<link rel="alternate" hreflang="x-default" href="${protocol}://${host}/en${page !== 'home' ? `/${page}` : '/'}" />`;
    
    // Get alternate OG locales
    const alternateLocales = allLanguages
      .filter(lang => lang !== language)
      .map(lang => seoTranslations[lang as 'en' | 'ar' | 'kur'].locale);
    
    // Build comprehensive meta tags for social media
    const socialMetaTags = `
    <!-- Language-specific meta tags for ${language.toUpperCase()} - Social Media Crawlers -->
    <html lang="${language}">
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="language" content="${trans.language}" />
    <link rel="canonical" href="${pageUrl}" />
    ${hreflangLinks}
    
    <!-- Open Graph / Facebook / LinkedIn -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${secureImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="MapEstate - Real Estate Platform" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="MapEstate" />
    <meta property="og:locale" content="${trans.locale}" />
    ${alternateLocales.map(locale => `<meta property="og:locale:alternate" content="${locale}" />`).join('\n    ')}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="MapEstate - Real Estate Platform" />
    <meta name="twitter:site" content="@MapEstate" />
    
    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="author" content="MapEstate" />
    `;
    
    // Remove default meta tags to avoid duplicates
    html = html.replace(/<html lang="en">/g, '');
    html = html.replace(/<meta property="og:type"[^>]*>/g, '');
    html = html.replace(/<meta property="og:url"[^>]*>/g, '');
    html = html.replace(/<meta property="og:title"[^>]*>/g, '');
    html = html.replace(/<meta property="og:description"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image:width"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image:height"[^>]*>/g, '');
    html = html.replace(/<meta property="og:image:secure_url"[^>]*>/g, '');
    html = html.replace(/<meta property="og:site_name"[^>]*>/g, '');
    html = html.replace(/<meta property="og:locale"[^>]*>/g, '');
    html = html.replace(/<meta property="og:locale:alternate"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:card"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:url"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:title"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:description"[^>]*>/g, '');
    html = html.replace(/<meta property="twitter:image"[^>]*>/g, '');
    html = html.replace(/<meta name="twitter:card"[^>]*>/g, '');
    html = html.replace(/<meta name="twitter:title"[^>]*>/g, '');
    html = html.replace(/<meta name="twitter:description"[^>]*>/g, '');
    html = html.replace(/<meta name="twitter:image"[^>]*>/g, '');
    html = html.replace(/<meta name="title"[^>]*>/g, '');
    html = html.replace(/<meta name="description"[^>]*>/g, '');
    html = html.replace(/<meta name="language"[^>]*>/g, '');
    html = html.replace(/<link rel="canonical"[^>]*>/g, '');
    html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>/g, '');
    html = html.replace(/<title>.*?<\/title>/g, '');
    
    // Inject language-specific tags before </head> tag
    html = html.replace('</head>', `${socialMetaTags}  </head>`);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(html);
    
  } catch (error) {
    console.error('Error injecting language-specific meta tags:', error);
    next();
  }
}

async function injectPropertyMetaTags(req: Request, res: Response, next: NextFunction) {
  // Skip if storage is not initialized yet
  if (!storage) {
    return next();
  }
  // Match both legacy and language-prefixed property URLs (remove trailing slashes)
  const propertyMatch = req.path.match(/^(?:\/(en|ar|kur))?\/property\/([^\/]+)\/?$/);
  
  if (!propertyMatch) {
    return next();
  }
  
  let propertyId = propertyMatch[2]; // Extract property ID from second capture group
  // Remove any trailing slashes from propertyId
  propertyId = propertyId.replace(/\/+$/, '');
  const userAgent = req.get('User-Agent') || '';
  const isCrawler = isCrawlerBot(userAgent);
  
  // Log all property page requests for debugging
  console.log(`🔍 Property page request: ${req.path}, User-Agent: ${userAgent.substring(0, 50)}..., Is Crawler: ${isCrawler}`);
  
  // Only inject for crawler bots (social media and search engines) to avoid affecting normal users
  if (!isCrawler) {
    return next();
  }
  
  console.log(`🤖 Social media crawler detected! Injecting dynamic meta tags for ${propertyId}`);
  
  try {
    // Try to get property by slug first, then by ID (similar to API route logic)
    console.log(`🔍 Social crawler looking up property: "${propertyId}"`);
    let property = await storage.getPropertyBySlug(propertyId);
    
    if (!property) {
      console.log(`🔄 Slug lookup failed for social crawler, trying ID lookup for: ${propertyId}`);
      property = await storage.getProperty(propertyId);
    }
    
    if (!property) {
      console.log(`❌ Property not found for social crawler with slug or ID: ${propertyId}`);
      return next();
    }
    
    console.log(`✅ Social crawler found property: ${property.title}`);
    
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
    
    // Handle property images - Facebook needs ALL images with width/height
    let propertyImages: string[] = [];
    
    console.log(`📸 Property images array:`, JSON.stringify(property.images, null, 2));
    
    if (property.images && property.images.length > 0) {
      // Convert all property images to absolute URLs (Facebook allows up to 6 images)
      propertyImages = property.images.slice(0, 6).map((img: any) => {
        const imageUrl = typeof img === 'object' && img.imageUrl ? img.imageUrl : img;
        if (imageUrl) {
          const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${protocol}://${req.get('host')}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
          const secureUrl = absoluteUrl.replace('http://', 'https://'); // Force HTTPS
          console.log(`   ✅ Processed image: ${imageUrl} → ${secureUrl}`);
          return secureUrl;
        }
        return null;
      }).filter(Boolean) as string[];
      
      console.log(`✅ Found ${propertyImages.length} property images for SEO:`, propertyImages);
    }
    
    // If no property images, use fallback
    if (propertyImages.length === 0) {
      propertyImages = [`${protocol}://${req.get('host')}/mapestate-social-preview.png`.replace('http://', 'https://')];
      console.log(`⚠️ No property images found for ${propertyId}, using fallback image: ${propertyImages[0]}`);
    }
    
    // Generate property URL with language prefix (always include language)
    const language = propertyMatch[1] || 'en';
    const languagePrefix = `/${language}`;
    const propertyUrl = `${protocol}://${req.get('host')}${languagePrefix}/property/${property.slug || property.id}`;
    
    console.log(`🌐 Generated property URL: ${propertyUrl}`);
    
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
        const prefix = `/${lang}`;
        const url = `${protocol}://${req.get('host')}${prefix}/property/${property.slug || property.id}`;
        return `<link rel="alternate" hreflang="${hreflangMap[lang]}" href="${url}" />`;
      })
      .join('\n    ') + '\n    ' + `<link rel="alternate" hreflang="x-default" href="${protocol}://${req.get('host')}/en/property/${property.slug || property.id}" />`;
    
    // Build Open Graph image tags - EACH image needs its own width/height for Facebook
    const ogImageTags = propertyImages.map(imageUrl => `
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="800" />
    <meta property="og:image:alt" content="${escapeHtml(property.title)}" />
    <meta property="og:image:type" content="image/jpeg" />`).join('');
    
    // Build comprehensive meta tags for social media
    const socialMetaTags = `
    <!-- Property-specific meta tags for social media crawlers -->
    <title>${propertyTitle}</title>
    <meta name="title" content="${propertyTitle}" />
    <meta name="description" content="${propertyDescription}" />
    <link rel="canonical" href="${propertyUrl}" />
    ${hreflangLinks}
    
    <!-- Open Graph / Facebook / LinkedIn - All images with width/height -->
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${propertyTitle}" />
    <meta property="og:description" content="${propertyDescription}" />${ogImageTags}
    <meta property="og:url" content="${propertyUrl}" />
    <meta property="og:site_name" content="MapEstate" />
    <meta property="og:locale" content="${ogLocale}" />
    ${alternateLocales.map(locale => `<meta property="og:locale:alternate" content="${locale}" />`).join('\n    ')}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${propertyTitle}" />
    <meta name="twitter:description" content="${propertyDescription}" />
    <meta name="twitter:image" content="${propertyImages[0]}" />
    <meta name="twitter:image:alt" content="${escapeHtml(property.title)}" />
    <meta name="twitter:site" content="@MapEstate" />
    <meta name="twitter:creator" content="@MapEstate" />
    
    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="MapEstate" />
    `;
    
    // Property-specific structured data with all images
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": property.title,
      "description": property.description || `${property.bedrooms} bedroom ${property.type} in ${property.city}`,
      "image": propertyImages, // Include all images for rich snippets
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
    
    console.log(`📋 Final meta tags injected for property ${propertyId}:`);
    console.log(`   Title: ${propertyTitle}`);
    console.log(`   Images: ${propertyImages.join(', ')}`);
    console.log(`   URL: ${propertyUrl}`);
    console.log(`🎉 Successfully injected dynamic SEO meta tags for social media crawler!`);
    
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
  // Language-specific meta tags for home/properties pages (must come before property-specific)
  app.use(injectLanguageSpecificMetaTags);
  // Property-specific meta tags for individual property pages
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
