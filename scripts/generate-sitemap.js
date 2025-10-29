#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This is a build-time static sitemap generator
// It creates a basic sitemap.xml that will be deployed with the static assets

const BASE_URL = 'https://mapestate.net';
const SUPPORTED_LANGUAGES = ['en', 'ar', 'kur'];

const LANGUAGE_MAPPING = {
  en: { hreflang: 'en-US' },
  ar: { hreflang: 'ar-IQ' },
  kur: { hreflang: 'ku-IQ' }
};

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/properties', changefreq: 'hourly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/favorites', changefreq: 'daily', priority: 0.6 },
  { path: '/settings', changefreq: 'monthly', priority: 0.3 }
];

function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getLocalizedPath(path, language) {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  cleanPath = cleanPath.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  return `/${language}${cleanPath}`;
}

function generateAlternates(path) {
  const alternates = [];
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const localizedPath = getLocalizedPath(path, lang);
    const hreflang = LANGUAGE_MAPPING[lang].hreflang;
    const absoluteUrl = `${BASE_URL}${localizedPath}`;
    alternates.push(`    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXML(absoluteUrl)}"/>`);
  });
  
  // Add x-default (defaulting to English)
  const defaultPath = getLocalizedPath(path, 'en');
  alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXML(BASE_URL + defaultPath)}"/>`);
  
  return alternates.join('\n');
}

function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  const urlEntries = [];
  
  // Generate entries for static routes in all languages
  STATIC_ROUTES.forEach(route => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      const localizedPath = getLocalizedPath(route.path, lang);
      const alternates = generateAlternates(route.path);
      const absoluteUrl = `${BASE_URL}${localizedPath}`;
      
      urlEntries.push(`  <url>
    <loc>${escapeXML(absoluteUrl)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
  </url>`);
    });
  });
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>`;
  
  return sitemap;
}

// Generate sitemap and write to dist/public
try {
  const sitemap = generateSitemap();
  const distPublicPath = path.join(__dirname, '..', 'dist', 'public');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(distPublicPath)) {
    fs.mkdirSync(distPublicPath, { recursive: true });
  }
  
  const sitemapPath = path.join(distPublicPath, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
  
  console.log('✅ Static sitemap.xml generated successfully at:', sitemapPath);
  console.log(`📊 Generated sitemap with ${STATIC_ROUTES.length * SUPPORTED_LANGUAGES.length} entries`);
} catch (error) {
  console.error('❌ Error generating static sitemap:', error);
  process.exit(1);
}
