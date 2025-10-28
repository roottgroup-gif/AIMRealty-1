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

// Generate robots.txt content with sitemap reference
function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

# Language-specific content
Allow: /en/
Allow: /ar/
Allow: /kur/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Block admin areas
Disallow: /admin/
Disallow: /api/

# Block temporary files
Disallow: /*.tmp$
Disallow: /*.temp$

# Allow search engines to index language-specific pages
Crawl-delay: 1`;
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

    res.set('Content-Type', 'application/xml');
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

// Language-prefixed sitemap routes (redirect to main sitemap)
router.get('/:lang/sitemap.xml', async (req: Request, res: Response) => {
  const lang = req.params.lang;
  
  // Validate language parameter
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) {
    return res.status(404).send('Not found');
  }
  
  // Redirect to canonical sitemap without language prefix
  res.redirect(301, '/sitemap.xml');
});

// Language-prefixed robots.txt routes (redirect to main robots.txt)
router.get('/:lang/robots.txt', async (req: Request, res: Response) => {
  const lang = req.params.lang;
  
  // Validate language parameter
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) {
    return res.status(404).send('Not found');
  }
  
  // Redirect to canonical robots.txt without language prefix
  res.redirect(301, '/robots.txt');
});

// Function to initialize the sitemap router with storage
export function setSitemapStorage(storage: IStorage) {
  storageInstance = storage;
}

export default router;