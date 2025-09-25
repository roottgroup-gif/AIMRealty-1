import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage, getLocalizedPath, detectLanguageFromUrl, detectLanguageFromUrlEnhanced, getLanguageInfo, LANGUAGE_MAPPING, type Language } from '@/lib/i18n';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
  breadcrumbs?: Array<{ name: string; url: string }>;
  propertyData?: {
    address?: string;
    city?: string;
    country?: string;
    price?: string;
    currency?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
}

function generateCanonicalUrl(location: string, language: Language): string {
  const baseUrl = window.location.origin;
  
  // Check if current URL has query parameters for language
  const fullUrl = window.location.href;
  const { language: detectedLang, source } = detectLanguageFromUrlEnhanced(fullUrl);
  
  // Always use path-based URLs for canonical (better for SEO)
  // Parse URL to get clean pathname without query/hash
  const pathname = location.split('?')[0].split('#')[0];
  // Remove existing language prefix if present
  let cleanPath = pathname.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  
  // If language was detected from query params, we need to preserve the clean path
  // but use the detected language for canonical URL
  const canonicalLanguage = detectedLang || language;
  
  // Normalize trailing slashes: no trailing slash except for home
  if (cleanPath !== '/' && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  const localizedPath = getLocalizedPath(cleanPath, canonicalLanguage);
  return `${baseUrl}${localizedPath}`;
}

function getOGLocale(language: Language): string {
  return getLanguageInfo(language).locale;
}

function getAlternateOGLocales(currentLanguage: Language): string[] {
  const allLocales = Object.values(LANGUAGE_MAPPING).map(info => info.locale);
  const currentLocale = getOGLocale(currentLanguage);
  return allLocales.filter(locale => locale !== currentLocale);
}

function addPreconnectHints() {
  // Common external domains used for images to improve loading performance
  const domains = [
    'https://images.unsplash.com',
    'https://cdn.pixabay.com',
    'https://via.placeholder.com'
  ];
  
  domains.forEach(domain => {
    // Check if preconnect link already exists
    if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
}

function updateMetaTag(attr: string, name: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function ensureMultiMeta(attr: string, name: string, values: string[]) {
  // Remove existing meta tags with this property
  const existing = document.querySelectorAll(`meta[${attr}="${name}"]`);
  existing.forEach(element => element.remove());
  
  // Add one meta tag for each value
  values.forEach(value => {
    const element = document.createElement('meta');
    element.setAttribute(attr, name);
    element.setAttribute('content', value);
    document.head.appendChild(element);
  });
}

function generateCombinedStructuredData(
  customStructuredData?: object,
  breadcrumbs?: Array<{ name: string; url: string }>,
  propertyData?: SEOProps['propertyData'],
  language?: Language,
  canonicalUrl?: string
) {
  const baseUrl = window.location.origin;
  const schemas: any[] = [];

  // Website/Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MapEstate",
    "url": baseUrl,
    "logo": `${baseUrl}/logo_1757848527935.png`,
    "description": "AI-Powered Real Estate Platform for Kurdistan and Iraq",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "Iraq",
      "addressRegion": "Kurdistan"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English", "Arabic", "Kurdish"]
    },
    "sameAs": [
      "https://facebook.com/mapestate",
      "https://twitter.com/mapestate"
    ]
  };

  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MapEstate",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "inLanguage": [
      { "@type": "Language", "name": "English", "alternateName": "en" },
      { "@type": "Language", "name": "Arabic", "alternateName": "ar" },
      { "@type": "Language", "name": "Kurdish", "alternateName": "ku" }
    ]
  };

  schemas.push(organizationSchema, websiteSchema);

  // Breadcrumb schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": `${baseUrl}${crumb.url}`
      }))
    };
    schemas.push(breadcrumbSchema);
  }

  // Enhanced property/listing schema if property data exists
  if (propertyData) {
    const propertyType = propertyData.propertyType?.toLowerCase();
    const schemaPropertyType = propertyType === 'apartment' ? 'Apartment' : 
                               propertyType === 'house' ? 'House' : 'Residence';
    
    const propertySchema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "@id": canonicalUrl,
      "url": canonicalUrl,
      "name": `${propertyData.propertyType || 'Property'} in ${propertyData.city || ''}`,
      "description": `${propertyData.bedrooms ? `${propertyData.bedrooms} bedroom ` : ''}${propertyData.propertyType || 'property'} ${propertyData.address ? `located at ${propertyData.address}` : ''} in ${propertyData.city || ''}, ${propertyData.country || ''}`,
      "itemOffered": {
        "@type": schemaPropertyType,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": propertyData.address || "",
          "addressLocality": propertyData.city || "",
          "addressCountry": propertyData.country || "Iraq"
        },
        "numberOfRooms": propertyData.bedrooms,
        "numberOfBathroomsTotal": propertyData.bathrooms,
        "floorSize": propertyData.area ? {
          "@type": "QuantitativeValue",
          "value": propertyData.area,
          "unitText": "square meters"
        } : undefined
      },
      "offers": {
        "@type": "Offer",
        "price": propertyData.price,
        "priceCurrency": propertyData.currency || "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": new Date().toISOString()
      }
    };
    schemas.push(propertySchema);
  }

  // Add custom structured data if provided
  if (customStructuredData) {
    schemas.push(customStructuredData);
  }

  return schemas.length === 1 ? schemas[0] : schemas;
}

export function SEOHead({ 
  title = "MapEstate - AI-Powered Real Estate Finder",
  description = "Find your perfect home with AI-powered recommendations. Discover properties for rent and sale in Kurdistan, Iraq with intelligent search and expert agents on MapEstate.",
  keywords = "real estate, Kurdistan, Iraq, properties for sale, properties for rent, apartments, houses, villas, land",
  ogImage = `${window.location.protocol}//${window.location.host}/mapestate-og-image.jpg`,
  canonicalUrl,
  structuredData,
  breadcrumbs,
  propertyData
}: SEOProps) {
  const [location] = useLocation();
  const { language } = useLanguage();
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    
    // Comprehensive Open Graph tags for Facebook, LinkedIn, and general sharing
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:secure_url', ogImage.replace('http://', 'https://'));
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', title);
    updateMetaTag('property', 'og:image:type', 'image/jpeg');
    // Enhanced language detection for proper canonical URL generation
    const fullUrl = window.location.href;
    const { language: detectedLang } = detectLanguageFromUrlEnhanced(fullUrl);
    const currentLanguage = detectedLang || language;
    const properCanonicalUrl = canonicalUrl || generateCanonicalUrl(location, currentLanguage);
    
    updateMetaTag('property', 'og:url', properCanonicalUrl);
    updateMetaTag('property', 'og:type', propertyData ? 'product' : 'website');
    updateMetaTag('property', 'og:site_name', 'MapEstate');
    
    // Set og:locale based on current language
    const ogLocale = getOGLocale(currentLanguage);
    updateMetaTag('property', 'og:locale', ogLocale);
    
    // Handle multiple og:locale:alternate tags for other languages
    const alternateLocales = getAlternateOGLocales(currentLanguage);
    if (alternateLocales.length > 0) {
      ensureMultiMeta('property', 'og:locale:alternate', alternateLocales);
    }
    updateMetaTag('property', 'og:country-name', 'Iraq');
    updateMetaTag('property', 'og:region', 'Kurdistan');
    updateMetaTag('property', 'og:updated_time', new Date().toISOString());
    
    // Enhanced Twitter Card tags for Twitter sharing
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:image:alt', title);
    updateMetaTag('name', 'twitter:site', '@MapEstate');
    updateMetaTag('name', 'twitter:creator', '@MapEstate');
    updateMetaTag('name', 'twitter:domain', window.location.hostname);
    // Twitter URL is handled by og:url
    updateMetaTag('name', 'twitter:app:name:iphone', 'MapEstate');
    updateMetaTag('name', 'twitter:app:name:ipad', 'MapEstate');
    updateMetaTag('name', 'twitter:app:name:googleplay', 'MapEstate');
    
    // Language-specific social sharing optimizations
    const languageInfo = getLanguageInfo(currentLanguage);
    updateMetaTag('property', 'og:language', languageInfo.iso);
    updateMetaTag('name', 'twitter:language', languageInfo.iso);
    
    // Enhanced social sharing for Arabic and Kurdish content
    if (currentLanguage === 'ar' || currentLanguage === 'kur') {
      // RTL-specific meta tags for social platforms
      updateMetaTag('name', 'text-direction', languageInfo.dir);
      updateMetaTag('property', 'og:text_direction', languageInfo.dir);
      
      // Arabic/Kurdish specific social media optimization
      updateMetaTag('property', 'og:title:ar', currentLanguage === 'ar' ? title : '');
      updateMetaTag('property', 'og:description:ar', currentLanguage === 'ar' ? description : '');
      updateMetaTag('property', 'og:title:ku', currentLanguage === 'kur' ? title : '');
      updateMetaTag('property', 'og:description:ku', currentLanguage === 'kur' ? description : '');
      
      // Additional platform-specific tags for Middle East region
      updateMetaTag('property', 'og:region', 'Middle East');
      updateMetaTag('property', 'og:country_name', 'Iraq');
      updateMetaTag('property', 'og:region_name', 'Kurdistan');
      
      // WhatsApp and Telegram optimization (popular in Middle East)
      updateMetaTag('property', 'whatsapp:title', title);
      updateMetaTag('property', 'whatsapp:description', description);
      updateMetaTag('property', 'whatsapp:image', ogImage);
      updateMetaTag('property', 'telegram:title', title);
      updateMetaTag('property', 'telegram:description', description);
      updateMetaTag('property', 'telegram:image', ogImage);
    }
    
    // WhatsApp uses Open Graph tags, ensure mobile compatibility
    updateMetaTag('name', 'format-detection', 'telephone=no');
    
    // Enhanced WhatsApp and social media sharing optimization
    updateMetaTag('property', 'og:rich_attachment', 'true');
    updateMetaTag('property', 'og:see_also', properCanonicalUrl);
    
    // LinkedIn-specific optimizations
    updateMetaTag('name', 'linkedin:owner', 'MapEstate');
    updateMetaTag('name', 'linkedin:site', properCanonicalUrl);
    
    // Additional social platform compatibility
    updateMetaTag('name', 'skype_toolbar', 'skype_toolbar_parser_compatible');
    updateMetaTag('name', 'pinterest', 'nopin'); // Prevent pinning if not desired
    updateMetaTag('name', 'pinterest-rich-pin', 'true');
    
    // Additional meta tags for better SEO and social sharing
    updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('name', 'author', 'MapEstate');
    updateMetaTag('name', 'generator', 'MapEstate Real Estate Platform');
    updateMetaTag('property', 'article:publisher', `${window.location.protocol}//${window.location.host}`);
    
    // Additional SEO meta tags
    updateMetaTag('name', 'theme-color', '#ff7f00'); // Brand color
    updateMetaTag('name', 'msapplication-TileColor', '#ff7f00');
    updateMetaTag('name', 'apple-mobile-web-app-capable', 'yes');
    updateMetaTag('name', 'apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('name', 'mobile-web-app-capable', 'yes');
    
    // Enhanced geo-location tags for better local SEO
    updateMetaTag('name', 'geo.region', 'IQ-KR'); // Kurdistan, Iraq
    updateMetaTag('name', 'geo.placename', 'Kurdistan Region, Iraq');
    updateMetaTag('name', 'geo.position', '36.1911;44.0091'); // Erbil coordinates
    updateMetaTag('name', 'ICBM', '36.1911, 44.0091');
    
    // Additional geo tags for Arabic/Kurdish regions
    if (currentLanguage === 'ar' || currentLanguage === 'kur') {
      updateMetaTag('name', 'geo.region_name', 'Kurdistan Region');
      updateMetaTag('name', 'geo.country_code', 'IQ');
      updateMetaTag('name', 'geo.subregion', 'Middle East');
      updateMetaTag('property', 'place:location:latitude', '36.1911');
      updateMetaTag('property', 'place:location:longitude', '44.0091');
    }
    
    // Business/Organization info
    updateMetaTag('name', 'rating', 'general');
    updateMetaTag('name', 'distribution', 'global');
    updateMetaTag('name', 'coverage', 'worldwide');
    updateMetaTag('name', 'target', 'all');
    updateMetaTag('name', 'HandheldFriendly', 'true');
    updateMetaTag('name', 'MobileOptimized', '320');
    
    // Update canonical URL using proper language-prefixed URL
    updateCanonicalUrl(properCanonicalUrl);
    
    // Add hreflang tags for multilingual SEO using language-prefixed URLs
    updateHreflangTags(location, currentLanguage);
    
    // Add performance optimization hints
    addPreconnectHints();
    
    // Update structured data with comprehensive website schema
    const combinedStructuredData = generateCombinedStructuredData(
      structuredData, 
      breadcrumbs, 
      propertyData,
      currentLanguage,
      properCanonicalUrl
    );
    updateStructuredData(combinedStructuredData);
  }, [title, description, keywords, ogImage, canonicalUrl, structuredData, location, language]);

  return null;
}

function updateCanonicalUrl(url: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

function updateHreflangTags(currentLocation: string, currentLanguage: Language) {
  // Remove existing hreflang tags
  const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existing.forEach(element => element.remove());
  
  // Enhanced logic to handle query parameter-based URLs
  const fullUrl = window.location.href;
  const { source } = detectLanguageFromUrlEnhanced(fullUrl);
  
  // Parse URL to get clean pathname without query/hash, then strip language prefix
  const pathname = currentLocation.split('?')[0].split('#')[0];
  let cleanPath = pathname.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  
  // If language was detected from query parameters, preserve query params for hreflang
  const urlObj = new URL(fullUrl);
  let queryParams = urlObj.search;
  
  // Remove lang parameter from query string for hreflang URLs
  if (source === 'query') {
    const params = new URLSearchParams(queryParams);
    params.delete('lang');
    queryParams = params.toString() ? `?${params.toString()}` : '';
  }
  
  // Normalize trailing slashes: no trailing slash except for home
  if (cleanPath !== '/' && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  const baseUrl = window.location.origin;
  
  // Use improved language mapping
  const languages = Object.entries(LANGUAGE_MAPPING).map(([internal, info]) => ({
    internal: internal as Language,
    hreflang: info.hreflang
  }));
  
  // Add hreflang tags for each supported language (always use path-based URLs for SEO)
  languages.forEach(lang => {
    const localizedPath = getLocalizedPath(cleanPath, lang.internal);
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang.hreflang;
    link.href = `${baseUrl}${localizedPath}${queryParams}`;
    document.head.appendChild(link);
  });
  
  // Add x-default hreflang (defaulting to English)
  const defaultPath = getLocalizedPath(cleanPath, 'en');
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${baseUrl}${defaultPath}${queryParams}`;
  document.head.appendChild(defaultLink);
}

function updateStructuredData(data: object) {
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"][data-dynamic]');
  if (existing) {
    existing.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-dynamic', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

