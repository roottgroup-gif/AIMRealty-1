import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage, useTranslation, getLocalizedPath, detectLanguageFromUrl, detectLanguageFromUrlEnhanced, getLanguageInfo, LANGUAGE_MAPPING, type Language } from '@/lib/i18n';

// Import translations object for SEO language override
// Note: This assumes translations are exported from i18n.ts
const translations: { [key: string]: { en: string; ar: string; kur: string } } = {
  "seo.homeTitle": {
    en: "MapEstate - AI-Powered Real Estate Finder | Properties in Kurdistan, Iraq",
    ar: "MapEstate - محرك البحث العقاري المدعوم بالذكاء الاصطناعي | عقارات في كردستان، العراق",
    kur: "MapEstate - دۆزەرەوەی خانووبەرەی پاڵپشتیکراو بە AI | خانووبەرە لە کوردستان، عێراق",
  },
  "seo.homeDescription": {
    en: "Find your perfect home with AI-powered recommendations. Discover properties for rent and sale in Kurdistan, Iraq with intelligent search and expert agents.",
    ar: "اعثر على منزلك المثالي مع التوصيات المدعومة بالذكاء الاصطناعي. اكتشف العقارات للإيجار والبيع في كردستان، العراق مع البحث الذكي والوكلاء الخبراء.",
    kur: "ماڵی تەواوی خۆت بدۆزەرەوە لەگەڵ پێشنیارەکانی پاڵپشتیکراو بە AI. خانووبەرەکان بۆ کرێ و فرۆشتن لە کوردستان، عێراق بدۆزەرەوە لەگەڵ گەڕانی زیرەک و بریکارە شارەزاکان.",
  },
  "seo.propertiesTitle": {
    en: "Properties for Sale and Rent in Kurdistan, Iraq | MapEstate",
    ar: "عقارات للبيع والإيجار في كردستان، العراق | MapEstate",
    kur: "خانووبەرە بۆ فرۆشتن و کرێ لە کوردستان، عێراق | MapEstate",
  },
  "seo.propertiesDescription": {
    en: "Browse thousands of properties for sale and rent. Find apartments, houses, villas, and land in Kurdistan, Iraq with advanced search and AI recommendations.",
    ar: "تصفح آلاف العقارات للبيع والإيجار. ابحث عن شقق ومنازل وفيلات وأراضي في كردستان، العراق مع البحث المتقدم والتوصيات الذكية.",
    kur: "هەزاران خانووبەرە بۆ فرۆشتن و کرێ بگەڕێ. شوقە، ماڵ، ڤیلا و زەوی لە کوردستان، عێراق بدۆزەرەوە لەگەڵ گەڕانی پێشکەوتوو و پێشنیاری AI.",
  },
  "seo.propertyDetailTitle": {
    en: "{propertyType} for {listingType} - {price} | {city}, Iraq | MapEstate",
    ar: "{propertyType} لل{listingType} - {price} | {city}، العراق | MapEstate",
    kur: "{propertyType} بۆ {listingType} - {price} | {city}، عێراق | MapEstate",
  },
  "seo.propertyDetailDescription": {
    en: "{bedrooms} bedroom {propertyType} for {listingType} in {city}. {description} Contact our expert agents for viewing and details.",
    ar: "{propertyType} بـ {bedrooms} غرفة نوم لل{listingType} في {city}. {description} اتصل بوكلائنا الخبراء للمعاينة والتفاصيل.",
    kur: "{propertyType}ی {bedrooms} ژووری نوستن بۆ {listingType} لە {city}. {description} پەیوەندی بە بریکارە شارەزاکانمانەوە بکە بۆ بینین و وردەکاری.",
  },
  "seo.keywords": {
    en: "real estate, Kurdistan, Iraq, properties for sale, properties for rent, apartments, houses, villas, land, AI search, Erbil, Sulaymaniyah, Dohuk",
    ar: "عقارات، كردستان، العراق، عقارات للبيع، عقارات للإيجار، شقق، منازل، فيلات، أراضي، بحث ذكي، أربيل، السليمانية، دهوك",
    kur: "خانووبەرە، کوردستان، عێراق، خانووبەرە بۆ فرۆشتن، خانووبەرە بۆ کرێ، شوقە، ماڵ، ڤیلا، زەوی، گەڕانی AI، هەولێر، سلێمانی، دهۆک",
  },
  "seo.propertyType.apartment": {
    en: "Apartment",
    ar: "شقة",
    kur: "شوقە",
  },
  "seo.propertyType.house": {
    en: "House",
    ar: "منزل", 
    kur: "ماڵ",
  },
  "seo.propertyType.villa": {
    en: "Villa",
    ar: "فيلا",
    kur: "ڤیلا",
  },
  "seo.propertyType.land": {
    en: "Land",
    ar: "أرض",
    kur: "زەوی",
  },
  "seo.listingType.sale": {
    en: "Sale",
    ar: "البيع",
    kur: "فرۆشتن",
  },
  "seo.listingType.rent": {
    en: "Rent", 
    ar: "الإيجار",
    kur: "کرێ",
  }
};

// SEO language override helper - maps Kurdish to English for SEO meta content
function resolveSeoLanguage(language: Language): Language {
  // User requested that Kurdish URLs show English SEO content for social media sharing
  return language === 'kur' ? 'en' : language;
}

// Custom translation function for SEO that can handle language override
function seoTranslate(key: string, language: Language): string {
  return translations[key]?.[language] || key;
}

// Helper functions for dynamic SEO content generation
function generateDynamicTitle(
  pageType: string,
  propertyData: SEOProps['propertyData'],
  language: Language,
  customTitle?: string
): string {
  if (customTitle) return customTitle;
  
  switch (pageType) {
    case 'home':
      return seoTranslate('seo.homeTitle', language);
    case 'properties':
      return seoTranslate('seo.propertiesTitle', language);
    case 'property-detail':
      if (propertyData) {
        const propertyType = seoTranslate(`seo.propertyType.${propertyData.propertyType?.toLowerCase()}`, language) || propertyData.propertyType || 'Property';
        const listingType = seoTranslate(`seo.listingType.${propertyData.listingType?.toLowerCase()}`, language) || propertyData.listingType || 'Sale';
        const price = propertyData.price || '';
        const city = propertyData.city || '';
        
        return seoTranslate('seo.propertyDetailTitle', language)
          .replace('{propertyType}', propertyType)
          .replace('{listingType}', listingType)
          .replace('{price}', price)
          .replace('{city}', city);
      }
      return seoTranslate('seo.homeTitle', language);
    case 'favorites':
      return seoTranslate('seo.favoritesTitle', language);
    case 'about':
      return seoTranslate('seo.aboutTitle', language);
    case 'settings':
      return seoTranslate('seo.settingsTitle', language);
    default:
      return seoTranslate('seo.homeTitle', language);
  }
}

function generateDynamicDescription(
  pageType: string,
  propertyData: SEOProps['propertyData'],
  language: Language,
  customDescription?: string
): string {
  if (customDescription) return customDescription;
  
  switch (pageType) {
    case 'home':
      return seoTranslate('seo.homeDescription', language);
    case 'properties':
      return seoTranslate('seo.propertiesDescription', language);
    case 'property-detail':
      if (propertyData) {
        const propertyType = seoTranslate(`seo.propertyType.${propertyData.propertyType?.toLowerCase()}`, language) || propertyData.propertyType || 'property';
        const listingType = seoTranslate(`seo.listingType.${propertyData.listingType?.toLowerCase()}`, language) || propertyData.listingType || 'sale';
        const bedrooms = propertyData.bedrooms || 0;
        const city = propertyData.city || '';
        // Use property description if available, truncated for SEO best practices
        const description = (propertyData as any).description ? 
          ((propertyData as any).description.length > 120 ? 
            (propertyData as any).description.substring(0, 120) + '...' : 
            (propertyData as any).description) : '';
        
        return seoTranslate('seo.propertyDetailDescription', language)
          .replace('{propertyType}', propertyType)
          .replace('{listingType}', listingType)
          .replace('{bedrooms}', bedrooms.toString())
          .replace('{city}', city)
          .replace('{description}', description);
      }
      return seoTranslate('seo.homeDescription', language);
    case 'favorites':
      return 'Your favorite properties saved for later viewing and quick access.';
    case 'about':
      return 'Learn about MapEstate - your trusted real estate platform in Kurdistan, Iraq.';
    case 'settings':
      return 'Customize your MapEstate experience with language, currency, and notification preferences.';
    default:
      return seoTranslate('seo.homeDescription', language);
  }
}

function generateDynamicKeywords(
  language: Language,
  customKeywords?: string,
  pageType?: string,
  propertyData?: any
): string {
  if (customKeywords) return customKeywords;
  
  let baseKeywords = seoTranslate('seo.keywords', language);
  
  // Add property-specific keywords for property detail pages
  if (pageType === 'property-detail' && propertyData) {
    const propertySpecificKeywords = [
      propertyData.propertyType,
      propertyData.city,
      propertyData.country,
      propertyData.listingType,
      // Only include bedroom/bathroom counts if they are valid numbers
      Number.isFinite(propertyData.bedrooms) && propertyData.bedrooms > 0 ? 
        `${propertyData.bedrooms} bedroom${propertyData.bedrooms > 1 ? 's' : ''}` : null,
      Number.isFinite(propertyData.bathrooms) && propertyData.bathrooms > 0 ? 
        `${propertyData.bathrooms} bathroom${propertyData.bathrooms > 1 ? 's' : ''}` : null
    ].filter(Boolean).join(', ');
    
    baseKeywords += `, ${propertySpecificKeywords}`;
  }
  
  return baseKeywords;
}

// Generate appropriate robots directive based on page type and context
function generateRobotsDirective(
  pageType?: string,
  customRobots?: string,
  propertyData?: any
): string {
  if (customRobots) return customRobots;
  
  switch (pageType) {
    case 'settings':
    case 'favorites':
      // Private user pages should not be indexed
      return 'noindex,nofollow';
    
    case 'home':
    case 'properties':
    case 'property-detail':
    case 'about':
      // Public content pages should be indexed
      return 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
    
    default:
      // Default to indexable but conservative
      return 'index,follow';
  }
}

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
    listingType?: 'sale' | 'rent';
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  pageType?: 'home' | 'properties' | 'property-detail' | 'favorites' | 'about' | 'settings';
  robots?: 'index,follow' | 'noindex,follow' | 'index,nofollow' | 'noindex,nofollow' | string;
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
  canonicalUrl?: string,
  pageType?: string
) {
  const baseUrl = window.location.origin;
  const schemas: any[] = [];
  const currentDate = new Date().toISOString();

  // Enhanced Organization schema with correct structure
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "MapEstate",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo_1757848527935.png`,
      "width": 250,
      "height": 250
    },
    "image": `${baseUrl}/attached_assets/generated_images/MapEstate_real_estate_social_media_image_5fd65911.png`,
    "description": "AI-Powered Real Estate Platform for Kurdistan and Iraq",
    "slogan": "Find Your Perfect Home with AI",
    "foundingDate": "2024",
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "minValue": 10,
      "maxValue": 50
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "Iraq",
      "addressRegion": "Kurdistan",
      "addressLocality": "Erbil"
    },
    "location": {
      "@type": "Place",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 36.1911,
        "longitude": 44.0093
      }
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Arabic", "Kurdish"],
        "serviceArea": {
          "@type": "AdministrativeArea",
          "name": "Kurdistan Region"
        }
      },
      {
        "@type": "ContactPoint",
        "contactType": "sales",
        "availableLanguage": ["English", "Arabic", "Kurdish"]
      }
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Erbil",
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Kurdistan Region"
        }
      },
      {
        "@type": "City",
        "name": "Sulaymaniyah",
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Kurdistan Region"
        }
      },
      {
        "@type": "City",
        "name": "Dohuk",
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Kurdistan Region"
        }
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Real Estate Listings",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Property Search",
            "description": "AI-powered property search and recommendations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Real Estate Agent Services",
            "description": "Professional real estate agent support and consultation"
          }
        }
      ]
    },
    "sameAs": [
      "https://facebook.com/mapestate",
      "https://twitter.com/mapestate",
      "https://linkedin.com/company/mapestate",
      "https://instagram.com/mapestate"
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

  // Property schema using proper Residence/Apartment/House types
  if (propertyData) {
    const propertyType = propertyData.propertyType?.toLowerCase();
    const schemaPropertyType = propertyType === 'apartment' ? 'Apartment' : 
                               propertyType === 'house' ? 'House' :
                               propertyType === 'villa' ? 'House' :
                               propertyType === 'land' ? 'LandParcel' : 'Residence';
    
    const propertySchema = {
      "@context": "https://schema.org",
      "@type": schemaPropertyType,
      "@id": canonicalUrl,
      "url": canonicalUrl,
      "name": `${propertyData.propertyType || 'Property'} in ${propertyData.city || ''}`,
      "description": `${propertyData.bedrooms ? `${propertyData.bedrooms} bedroom ` : ''}${propertyData.propertyType || 'property'} ${propertyData.address ? `located at ${propertyData.address}` : ''} in ${propertyData.city || ''}, ${propertyData.country || ''}`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": propertyData.address || "",
        "addressLocality": propertyData.city || "",
        "addressRegion": "Kurdistan Region",
        "addressCountry": propertyData.country || "Iraq"
      },
      "geo": propertyData.city ? {
        "@type": "GeoCoordinates",
        "latitude": propertyData.city === 'Erbil' ? 36.1911 : propertyData.city === 'Sulaymaniyah' ? 35.5558 : 36.8619,
        "longitude": propertyData.city === 'Erbil' ? 44.0093 : propertyData.city === 'Sulaymaniyah' ? 45.4347 : 42.9922
      } : undefined,
      "numberOfRooms": propertyData.bedrooms,
      "numberOfBathroomsTotal": propertyData.bathrooms,
      "floorSize": propertyData.area ? {
        "@type": "QuantitativeValue",
        "value": propertyData.area,
        "unitText": "square meters",
        "unitCode": "MTK"
      } : undefined,
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Listing Type",
          "value": propertyData.listingType
        },
        {
          "@type": "PropertyValue",
          "name": "Property Status",
          "value": "Available"
        }
      ],
      "offers": {
        "@type": "Offer",
        "price": propertyData.price?.replace(/[^0-9.]/g, '') || '0',
        "priceCurrency": propertyData.currency || "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": currentDate,
        "validThrough": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        "seller": {
          "@type": "RealEstateAgent",
          "name": "MapEstate",
          "url": baseUrl
        }
      }
    };
    schemas.push(propertySchema);
  }

  // Only add FAQ schema for pages that actually have FAQ content
  if (pageType === 'about' || pageType === 'home') {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What areas does MapEstate cover?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MapEstate covers properties across Kurdistan Region of Iraq, including Erbil, Sulaymaniyah, and Dohuk."
          }
        },
        {
          "@type": "Question", 
          "name": "How does AI-powered search work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our AI analyzes your search criteria and preferences to recommend properties that best match your needs, considering factors like location, budget, and lifestyle requirements."
          }
        },
        {
          "@type": "Question",
          "name": "What languages does MapEstate support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MapEstate supports English, Arabic, and Kurdish languages to serve the diverse community in Kurdistan and Iraq."
          }
        }
      ]
    };
    schemas.push(faqSchema);
  }
  
  // Add custom structured data if provided
  if (customStructuredData) {
    schemas.push(customStructuredData);
  }

  return schemas.length === 1 ? schemas[0] : schemas;
}

export function SEOHead({ 
  title,
  description,
  keywords,
  ogImage = `${window.location.protocol}//${window.location.host}/attached_assets/generated_images/MapEstate_real_estate_social_media_image_5fd65911.png`,
  canonicalUrl,
  structuredData,
  breadcrumbs,
  propertyData,
  pageType = 'home',
  robots
}: SEOProps) {
  const [location] = useLocation();
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  useEffect(() => {
    // Enhanced language detection for proper canonical URL generation
    const fullUrl = window.location.href;
    const { language: detectedLang } = detectLanguageFromUrlEnhanced(fullUrl);
    const currentLanguage = detectedLang || language;
    
    // Resolve SEO language - Kurdish routes will use English SEO content
    const seoLanguage = resolveSeoLanguage(currentLanguage);
    
    // Generate dynamic SEO content based on page type and SEO language
    const dynamicTitle = generateDynamicTitle(pageType, propertyData, seoLanguage, title);
    const dynamicDescription = generateDynamicDescription(pageType, propertyData, seoLanguage, description);
    const dynamicKeywords = generateDynamicKeywords(seoLanguage, keywords, pageType, propertyData);
    const robotsDirective = generateRobotsDirective(pageType, robots, propertyData);
    
    // Update document title
    document.title = dynamicTitle;
    
    // Update meta description
    updateMetaTag('name', 'description', dynamicDescription);
    updateMetaTag('name', 'keywords', dynamicKeywords);
    
    // Comprehensive Open Graph tags for Facebook, LinkedIn, and general sharing
    updateMetaTag('property', 'og:title', dynamicTitle);
    updateMetaTag('property', 'og:description', dynamicDescription);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:secure_url', ogImage && typeof ogImage === 'string' ? ogImage.replace('http://', 'https://') : ogImage);
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', dynamicTitle);
    // Derive image type from file extension instead of hardcoding
    const imageType = (typeof ogImage === 'string' && ogImage.includes('.png')) ? 'image/png' : 
                      (typeof ogImage === 'string' && (ogImage.includes('.jpg') || ogImage.includes('.jpeg'))) ? 'image/jpeg' : 'image/png';
    updateMetaTag('property', 'og:image:type', imageType);
    
    const properCanonicalUrl = canonicalUrl || generateCanonicalUrl(location, currentLanguage);
    
    updateMetaTag('property', 'og:url', properCanonicalUrl);
    updateMetaTag('property', 'og:type', propertyData ? 'product' : 'website');
    updateMetaTag('property', 'og:site_name', 'MapEstate');
    
    // Set og:locale based on SEO language (Kurdish routes will use English locale)
    const ogLocale = getOGLocale(seoLanguage);
    updateMetaTag('property', 'og:locale', ogLocale);
    
    // Handle multiple og:locale:alternate tags for other languages
    const alternateLocales = getAlternateOGLocales(seoLanguage);
    if (alternateLocales.length > 0) {
      ensureMultiMeta('property', 'og:locale:alternate', alternateLocales);
    }
    updateMetaTag('property', 'og:country-name', 'Iraq');
    updateMetaTag('property', 'og:region', 'Kurdistan');
    updateMetaTag('property', 'og:updated_time', new Date().toISOString());
    
    // Enhanced Twitter Card tags for Twitter sharing
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', dynamicTitle);
    updateMetaTag('name', 'twitter:description', dynamicDescription);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:image:alt', dynamicTitle);
    updateMetaTag('name', 'twitter:site', '@MapEstate');
    updateMetaTag('name', 'twitter:creator', '@MapEstate');
    // Remove nonstandard twitter:domain tag
    updateMetaTag('name', 'twitter:app:name:iphone', 'MapEstate');
    updateMetaTag('name', 'twitter:app:name:ipad', 'MapEstate');
    updateMetaTag('name', 'twitter:app:name:googleplay', 'MapEstate');
    
    // Remove nonstandard og:language and twitter:language tags
    
    // Meta robots tags for better SEO control
    updateMetaTag('name', 'robots', robotsDirective);
    // Use same directive for specific bots unless they need special handling
    const botDirective = robotsDirective.includes('noindex') ? 'noindex,nofollow' : 'index,follow';
    updateMetaTag('name', 'googlebot', botDirective);
    updateMetaTag('name', 'bingbot', botDirective);
    
    // Author and publisher information
    updateMetaTag('name', 'author', 'MapEstate');
    updateMetaTag('name', 'publisher', 'MapEstate');
    
    // Conditional tags based on content type
    if (pageType === 'property-detail' && propertyData) {
      // Product-specific tags for property listings
      updateMetaTag('property', 'product:price:amount', propertyData.price?.replace(/[^0-9.]/g, '') || '0');
      updateMetaTag('property', 'product:price:currency', propertyData.currency || 'USD');
      updateMetaTag('property', 'product:availability', 'in stock');
      updateMetaTag('property', 'product:condition', 'new');
      updateMetaTag('property', 'product:category', 'Real Estate');
      updateMetaTag('property', 'product:brand', 'MapEstate');
    } else if (pageType === 'about' || pageType === 'home') {
      // Article tags only for article-like content
      updateMetaTag('property', 'article:author', 'MapEstate');
      updateMetaTag('property', 'article:publisher', 'https://www.facebook.com/mapestate');
      updateMetaTag('property', 'article:published_time', new Date().toISOString());
      updateMetaTag('property', 'article:modified_time', new Date().toISOString());
      updateMetaTag('property', 'article:section', 'Real Estate');
      updateMetaTag('property', 'article:tag', dynamicKeywords);
    }
    
    // Pinterest optimization
    updateMetaTag('name', 'pinterest-rich-pin', 'true');
    updateMetaTag('name', 'pinterest:title', dynamicTitle);
    updateMetaTag('name', 'pinterest:description', dynamicDescription);
    updateMetaTag('name', 'pinterest:image', ogImage);
    
    // Enhanced social sharing for Arabic and Kurdish content
    if (currentLanguage === 'ar' || currentLanguage === 'kur') {
      // RTL-specific meta tags for social platforms (use current language for UI direction)
      const currentLanguageInfo = getLanguageInfo(currentLanguage);
      updateMetaTag('name', 'text-direction', currentLanguageInfo.dir);
      updateMetaTag('property', 'og:text_direction', currentLanguageInfo.dir);
      
      // Arabic/Kurdish specific social media optimization
      updateMetaTag('property', 'og:title:ar', currentLanguage === 'ar' ? dynamicTitle : '');
      updateMetaTag('property', 'og:description:ar', currentLanguage === 'ar' ? dynamicDescription : '');
      updateMetaTag('property', 'og:title:ku', currentLanguage === 'kur' ? dynamicTitle : '');
      updateMetaTag('property', 'og:description:ku', currentLanguage === 'kur' ? dynamicDescription : '');
      
      // Remove nonstandard regional tags
      
      // WhatsApp and Telegram optimization (popular in Middle East)
      updateMetaTag('property', 'whatsapp:title', dynamicTitle);
      updateMetaTag('property', 'whatsapp:description', dynamicDescription);
      updateMetaTag('property', 'whatsapp:image', ogImage);
      updateMetaTag('property', 'telegram:title', dynamicTitle);
      updateMetaTag('property', 'telegram:description', dynamicDescription);
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
    
    // Real estate specific tags (these are custom for internal use)
    if (propertyData) {
      updateMetaTag('name', 'property:bedrooms', propertyData.bedrooms?.toString() || '');
      updateMetaTag('name', 'property:bathrooms', propertyData.bathrooms?.toString() || '');
      updateMetaTag('name', 'property:area', propertyData.area?.toString() || '');
      updateMetaTag('name', 'property:type', propertyData.propertyType || '');
      updateMetaTag('name', 'property:listing_type', propertyData.listingType || '');
      updateMetaTag('name', 'property:location', `${propertyData.city}, ${propertyData.country}`);
    }
    
    // SEO performance optimization tags
    updateMetaTag('name', 'referrer', 'strict-origin-when-cross-origin');
    updateMetaTag('http-equiv', 'x-dns-prefetch-control', 'on');
    
    // Additional social platform compatibility
    updateMetaTag('name', 'skype_toolbar', 'skype_toolbar_parser_compatible');
    updateMetaTag('name', 'pinterest', 'nopin'); // Prevent pinning if not desired
    updateMetaTag('name', 'pinterest-rich-pin', 'true');
    
    // Additional meta tags for better SEO and social sharing (robots tag already handled above)
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
      properCanonicalUrl,
      pageType
    );
    updateStructuredData(combinedStructuredData);
  }, [title, description, keywords, ogImage, canonicalUrl, structuredData, location, language, robots, pageType, propertyData]);

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

