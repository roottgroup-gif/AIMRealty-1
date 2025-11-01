import { Router, type Request, type Response } from 'express';
import type { IStorage } from '../storage';

const router = Router();

// Storage will be injected via middleware
let storageInstance: IStorage;

// Supported languages for multilingual SEO
const SUPPORTED_LANGUAGES = ['en', 'ar', 'kur'] as const;
type Language = typeof SUPPORTED_LANGUAGES[number];

// Language mapping for hreflang
const LANGUAGE_MAPPING = {
  en: { hreflang: 'en-US', name: 'English' },
  ar: { hreflang: 'ar-IQ', name: 'Arabic' },
  kur: { hreflang: 'ku-IQ', name: 'Kurdish' }
} as const;

// Static routes configuration
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/properties', changefreq: 'hourly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/agents', changefreq: 'weekly', priority: 0.7 },
  { path: '/favorites', changefreq: 'daily', priority: 0.6 },
  { path: '/settings', changefreq: 'monthly', priority: 0.3 }
] as const;

// Helper function to normalize base URL
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

// Helper function to get localized path
function getLocalizedPath(path: string, language: Language): string {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  cleanPath = cleanPath.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  return `/${language}${cleanPath}`;
}

// Helper function to ensure absolute image URLs
function ensureAbsoluteImageUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) {
    return `${normalizeBaseUrl(baseUrl)}${imageUrl}`;
  }
  return `${normalizeBaseUrl(baseUrl)}/${imageUrl}`;
}

// Helper function to escape XML special characters
function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate hreflang alternates for a given path
function generateAlternates(path: string, baseUrl: string): string {
  const alternates: string[] = [];
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const localizedPath = getLocalizedPath(path, lang);
    const hreflang = LANGUAGE_MAPPING[lang].hreflang;
    const absoluteUrl = `${baseUrl}${localizedPath}`;
    alternates.push(`    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXML(absoluteUrl)}"/>`);
  });
  
  // Add x-default (defaulting to English)
  const xDefaultUrl = `${baseUrl}${getLocalizedPath(path, 'en')}`;
  alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXML(xDefaultUrl)}"/>`);
  
  return alternates.join('\n');
}

// Generate robots.txt content with sitemap reference (2025 SEO best practices)
function generateRobotsTxt(baseUrl: string): string {
  return `# MapEstate - Real Estate Platform Robots.txt
# Updated for optimal SEO and multilingual support

# Default crawlers
User-agent: *
Allow: /
Crawl-delay: 1

# Language-specific content (explicitly allow for better indexing)
Allow: /en/
Allow: /ar/
Allow: /kur/

# Allow property pages and images
Allow: /property/
Allow: /properties
Allow: /uploads/
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.png$
Allow: /*.webp$

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API areas
Disallow: /admin/
Disallow: /api/
Disallow: /settings
Disallow: /favorites

# Block temporary and system files
Disallow: /*.tmp$
Disallow: /*.temp$
Disallow: /*.log$

# Google-specific crawlers
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Googlebot-Image
Allow: /uploads/
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.png$
Allow: /*.webp$

# Bing crawler
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Mobile Googlebot
User-agent: Googlebot-Mobile
Allow: /
Crawl-delay: 0

# Block scrapers and bad bots
User-agent: AhrefsBot
Crawl-delay: 5

User-agent: SemrushBot
Crawl-delay: 5

User-agent: MJ12bot
Disallow: /

User-agent: dotbot
Disallow: /

# Social media crawlers (allow for rich previews)
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /`;
}

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    if (!storageInstance) {
      return res.status(503).send('Service temporarily unavailable');
    }
    
    const rawBaseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const baseUrl = normalizeBaseUrl(rawBaseUrl);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get all properties for sitemap
    const properties = await storageInstance.getProperties({ limit: 1000 });
    
    const urlEntries: string[] = [];
    
    // Generate entries for static routes in all languages
    STATIC_ROUTES.forEach(route => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        const localizedPath = getLocalizedPath(route.path, lang);
        const alternates = generateAlternates(route.path, baseUrl);
        const absoluteUrl = `${baseUrl}${localizedPath}`;
        
        urlEntries.push(`  <url>
    <loc>${escapeXML(absoluteUrl)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
  </url>`);
      });
    });
    
    // Generate entries for property pages in all languages
    properties.forEach(property => {
      const identifier = property.slug || property.id;
      const encodedIdentifier = encodeURIComponent(identifier);
      const propertyPath = `/property/${encodedIdentifier}`;
      const lastmod = property.updatedAt ? new Date(property.updatedAt).toISOString().split('T')[0] : currentDate;
      
      SUPPORTED_LANGUAGES.forEach(lang => {
        const localizedPath = getLocalizedPath(propertyPath, lang);
        const alternates = generateAlternates(propertyPath, baseUrl);
        const absoluteUrl = `${baseUrl}${localizedPath}`;
        
        // Add image sitemap data if property has images
        const imageData = property.images && property.images.length > 0 ? `
    <image:image>
      <image:loc>${escapeXML(ensureAbsoluteImageUrl(property.images[0].imageUrl, baseUrl))}</image:loc>
      <image:title>${escapeXML(property.title)}</image:title>
      <image:caption>${escapeXML(property.description || property.title)}</image:caption>
    </image:image>` : '';
        
        urlEntries.push(`  <url>
    <loc>${escapeXML(absoluteUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates}${imageData}
  </url>`);
      });
    });
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt endpoint
router.get('/robots.txt', async (req: Request, res: Response) => {
  try {
    const rawBaseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const baseUrl = normalizeBaseUrl(rawBaseUrl);
    const robotsContent = generateRobotsTxt(baseUrl);
    
    res.set('Content-Type', 'text/plain');
    res.send(robotsContent);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).send('Error generating robots.txt');
  }
});

// Note: Language-prefixed sitemap/robots routes removed to avoid redirect issues in Google Search Console
// Only canonical /sitemap.xml and /robots.txt routes are served

// Function to initialize the sitemap router with storage
export function setSitemapStorage(storage: IStorage) {
  storageInstance = storage;
}

export default router;