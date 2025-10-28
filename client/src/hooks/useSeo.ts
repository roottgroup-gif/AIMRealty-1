import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SeoOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export function useSeo(options: SeoOptions = {}) {
  const [location] = useLocation();

  useEffect(() => {
    const baseUrl = 'https://mapestate.net';
    const currentUrl = `${baseUrl}${location}`;

    if (options.title) {
      document.title = options.title;
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = options.canonical || currentUrl;

    if (options.description) {
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = options.description;
    }

    if (options.ogTitle) {
      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = options.ogTitle;
    }

    if (options.ogDescription) {
      let ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.content = options.ogDescription;
    }

    if (options.ogImage) {
      let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.content = options.ogImage;
    }

    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = options.canonical || currentUrl;

  }, [location, options.title, options.description, options.canonical, options.ogTitle, options.ogDescription, options.ogImage]);
}
