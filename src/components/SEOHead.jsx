import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageMetadata = {
  '/': {
    title: 'designiQ - Inteligentny Dom | Certyfikowany Partner Loxone',
    description: 'Profesjonalne systemy Smart Home i automatyka budynkowa z Loxone. Certyfikowany partner - projekty, instalacje i programowanie inteligentnych domów. Bydgoszcz i okolice.',
    keywords: 'smart home, inteligentny dom, automatyka budynkowa, loxone, designiq, system smart home, projektowanie smart home, loxone partner, smart home bydgoszcz',
    ogImage: 'https://designiq.pl/og-image.jpg',
    schema: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "designiQ",
      "url": "https://designiq.pl",
      "logo": "https://designiq.pl/logo.png",
      "description": "Profesjonalne systemy Smart Home i automatyka budynkowa",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Żeglarska 18/1",
        "addressLocality": "Bydgoszcz",
        "postalCode": "85-519",
        "addressCountry": "PL"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+48-782-109-286",
        "contactType": "customer service",
        "email": "kontakt@designiq.pl"
      },
      "sameAs": [
        "https://www.facebook.com/profile.php?id=61579262927664",
        "https://www.instagram.com/designiq_pl/"
      ]
    }
  },
  '/Konfigurator': {
    title: 'Konfigurator Smart Home - Bezpłatna Wycena Online | designiQ Loxone',
    description: 'Stwórz konfigurację inteligentnego domu i otrzymaj darmową wycenę. Interaktywny konfigurator Smart Home z Loxone - zaprojektuj swój dom w 4 krokach.',
    keywords: 'konfigurator smart home, wycena smart home online, kalkulator smart home, konfigurator loxone, cena inteligentnego domu, darmowa wycena',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Konfigurator Smart Home designiQ",
      "description": "Interaktywny konfigurator do projektowania systemu Smart Home",
      "applicationCategory": "DesignApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "PLN"
      }
    }
  },
  '/CoZyskasz': {
    title: 'Korzyści Smart Home - Oszczędność, Bezpieczeństwo, Komfort | designiQ',
    description: 'Odkryj zalety inteligentnego domu Loxone: do 30% oszczędności energii, pełne bezpieczeństwo, komfort życia i wzrost wartości nieruchomości. ROI 2-4 lata.',
    keywords: 'korzyści smart home, oszczędność energii, bezpieczeństwo domu, automatyzacja domu, zalety smart home, loxone korzyści, zarządzanie energią',
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Korzyści Smart Home",
      "description": "Kompleksowy przewodnik po korzyściach inteligentnego domu",
      "author": {
        "@type": "Organization",
        "name": "designiQ"
      }
    }
  },
  '/Oferta': {
    title: 'Oferta Smart Home - Pakiety od 5000 PLN | designiQ Partner Loxone',
    description: 'Wybierz pakiet Smart Home: Smart Design (projekt), Smart Design+ (prefabrykacja) lub Full House (pełne uruchomienie). Kompleksowe rozwiązania Loxone.',
    keywords: 'oferta smart home, pakiety smart home, cena smart home, smart design, projektowanie smart home, instalacja loxone, koszt inteligentnego domu',
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Smart Home Installation",
      "provider": {
        "@type": "Organization",
        "name": "designiQ"
      },
      "areaServed": "PL",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Pakiety Smart Home",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Smart Design"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Smart Design+"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Full House"
            }
          }
        ]
      }
    }
  },
  '/ONas': {
    title: 'O Nas - Eksperci Smart Home | Certyfikowany Partner Loxone designiQ',
    description: 'designiQ to zespół ekspertów Smart Home i automatyki budynkowej. Certyfikowany partner Loxone z wieloletnim doświadczeniem w projektowaniu i programowaniu systemów.',
    keywords: 'partner loxone, firma smart home, inteligentny dom bydgoszcz, projektowanie automatyki, certyfikowany partner loxone',
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "about": {
        "@type": "Organization",
        "name": "designiQ"
      }
    }
  },
  '/Kontakt': {
    title: 'Kontakt - Bezpłatna Konsultacja Smart Home | designiQ Bydgoszcz',
    description: 'Skontaktuj się z designiQ - ekspertami Smart Home Loxone. Bezpłatna konsultacja i wycena. Tel: 782-109-286, Email: kontakt@designiq.pl. Żeglarska 18/1, Bydgoszcz.',
    keywords: 'kontakt smart home, konsultacja smart home, wycena smart home, bydgoszcz smart home, loxone bydgoszcz',
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "mainEntity": {
        "@type": "Organization",
        "name": "designiQ",
        "telephone": "+48-782-109-286",
        "email": "kontakt@designiq.pl"
      }
    }
  }
};

export default function SEOHead() {
  const location = useLocation();
  const currentPath = location.pathname;
  const metadata = pageMetadata[currentPath] || pageMetadata['/'];

  useEffect(() => {
    // Update title
    document.title = metadata.title;

    // Update meta tags
    updateMetaTag('name', 'description', metadata.description);
    updateMetaTag('name', 'keywords', metadata.keywords);
    updateMetaTag('name', 'robots', 'index, follow');
    updateMetaTag('name', 'author', 'designiQ');
    updateMetaTag('name', 'viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph tags
    updateMetaTag('property', 'og:title', metadata.title);
    updateMetaTag('property', 'og:description', metadata.description);
    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('property', 'og:site_name', 'designiQ');
    updateMetaTag('property', 'og:locale', 'pl_PL');
    if (metadata.ogImage) {
      updateMetaTag('property', 'og:image', metadata.ogImage);
    }

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', metadata.title);
    updateMetaTag('name', 'twitter:description', metadata.description);
    if (metadata.ogImage) {
      updateMetaTag('name', 'twitter:image', metadata.ogImage);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    // Schema.org structured data
    if (metadata.schema) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(metadata.schema);
    }
  }, [currentPath, metadata]);

  return null;
}

function updateMetaTag(attrName, attrValue, content) {
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.content = content;
}