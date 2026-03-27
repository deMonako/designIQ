import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://www.designiq.pl';
const OG_IMAGE_DEFAULT = 'https://www.designiq.pl/logo512.png';

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  "name": "designiQ",
  "url": BASE_URL,
  "logo": "https://www.designiq.pl/logo.png",
  "image": OG_IMAGE_DEFAULT,
  "description": "Profesjonalne systemy Smart Home i automatyka budynkowa w Bydgoszczy i regionie kujawsko-pomorskim. Certyfikowany partner Loxone.",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Żeglarska 18/1",
    "addressLocality": "Bydgoszcz",
    "postalCode": "85-519",
    "addressRegion": "Kujawsko-Pomorskie",
    "addressCountry": "PL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 53.1235,
    "longitude": 18.0084
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+48-782-109-286",
    "contactType": "customer service",
    "email": "kontakt@designiq.pl",
    "availableLanguage": "Polish"
  },
  "areaServed": [
    { "@type": "City", "name": "Bydgoszcz" },
    { "@type": "City", "name": "Toruń" },
    { "@type": "City", "name": "Włocławek" },
    { "@type": "City", "name": "Grudziądz" },
    { "@type": "City", "name": "Inowrocław" },
    { "@type": "AdministrativeArea", "name": "Kujawsko-Pomorskie" }
  ],
  "sameAs": [
    "https://www.facebook.com/profile.php?id=61579262927664",
    "https://www.instagram.com/designiq_pl/"
  ]
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Czym jest system Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Smart Home to zintegrowany system automatyki budynkowej, który łączy różne urządzenia i instalacje w domu (oświetlenie, ogrzewanie, rolety, monitoring, alarm) w jedną spójną całość. System pozwala na centralne sterowanie, automatyzację i monitorowanie wszystkich funkcji domu z poziomu aplikacji mobilnej lub paneli ściennych." }
    },
    {
      "@type": "Question",
      "name": "Czy Smart Home to rozwiązanie tylko dla nowych domów?",
      "acceptedAnswer": { "@type": "Answer", "text": "Nie, systemy Smart Home można zainstalować zarówno w nowych, jak i już istniejących budynkach. W przypadku modernizacji najlepiej sprawdzają się rozwiązania bezprzewodowe lub hybrydowe, które minimalizują konieczność ingerencji w istniejące instalacje." }
    },
    {
      "@type": "Question",
      "name": "Jakie korzyści daje Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Główne korzyści to: oszczędność energii (do 30%), zwiększone bezpieczeństwo, wygoda użytkowania, zdalna kontrola, automatyzacja codziennych czynności, monitoring zużycia mediów oraz zwiększenie wartości nieruchomości." }
    },
    {
      "@type": "Question",
      "name": "Czy system Smart Home jest skomplikowany w obsłudze?",
      "acceptedAnswer": { "@type": "Answer", "text": "Nowoczesne systemy, w tym Loxone, są zaprojektowane z myślą o prostocie obsługi. Intuicyjne aplikacje mobilne i panele dotykowe sprawiają, że korzystanie z systemu jest łatwe dla wszystkich domowników. Po instalacji zapewniamy pełne szkolenie z obsługi." }
    },
    {
      "@type": "Question",
      "name": "Jak działa konfigurator designiQ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Konfigurator przeprowadzi Cię przez 4 proste kroki: podanie metrażu i wybór pakietu, wybór opcji podstawowych i dodatkowych, zaprojektowanie układu pomieszczeń, oraz otrzymanie orientacyjnej wyceny. Cały proces zajmuje około 5-10 minut." }
    },
    {
      "@type": "Question",
      "name": "Czy wycena z konfiguratora jest ostateczna?",
      "acceptedAnswer": { "@type": "Answer", "text": "Wycena z konfiguratora jest orientacyjna i służy jako punkt wyjścia do dalszych rozmów. Dokładna wycena powstaje po konsultacji, analizie projektu domu i Twoich indywidualnych potrzeb. Finalna cena może się różnić w zależności od specyfiki inwestycji." }
    },
    {
      "@type": "Question",
      "name": "Co wpływa na cenę systemu Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Kluczowe czynniki to: powierzchnia domu, wybrany pakiet (Smart design/Smart design+/Full house), liczba pomieszczeń, zakres automatyki (oświetlenie, ogrzewanie, rolety, monitoring), dodatkowe opcje (fotowoltaika, rekuperacja, audio) oraz złożoność instalacji." }
    },
    {
      "@type": "Question",
      "name": "Czym różnią się pakiety Smart design, Smart design+ i Full house?",
      "acceptedAnswer": { "@type": "Answer", "text": "Smart design to projekt automatyki + projekt szafy sterowniczej. Smart design+ dodatkowo zawiera prefabrykację szafy. Full house to kompletne rozwiązanie - projekt, prefabrykacja, pełne uruchomienie systemu i integracja wszystkich urządzeń." }
    },
    {
      "@type": "Question",
      "name": "Który pakiet Smart Home jest dla mnie najlepszy?",
      "acceptedAnswer": { "@type": "Answer", "text": "To zależy od etapu budowy i Twoich możliwości. Smart design - jeśli masz własnego elektryka. Smart design+ - jeśli chcesz przyspieszyć instalację. Full house - jeśli chcesz kompleksową obsługę od A do Z bez martwienia się o szczegóły techniczne." }
    },
    {
      "@type": "Question",
      "name": "Co wchodzi w skład projektu automatyki?",
      "acceptedAnswer": { "@type": "Answer", "text": "Projekt zawiera: schemat rozmieszczenia wszystkich elementów systemu, listę urządzeń z kodami produktów, topologię połączeń, projekt szafy sterowniczej, specyfikację przewodów i dokumentację techniczną dla elektryka." }
    },
    {
      "@type": "Question",
      "name": "Jak długo trwa realizacja projektu Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Projekt automatyki: 2-4 tygodnie. Prefabrykacja szafy: 1-2 tygodnie. Montaż instalacji: zależy od wielkości domu, średnio 1-3 tygodnie. Programowanie i uruchomienie: 1-2 tygodnie. Łącznie od rozpoczęcia do uruchomienia 6-12 tygodni." }
    },
    {
      "@type": "Question",
      "name": "Na jakim etapie budowy powinienem rozpocząć projekt Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Najlepiej na etapie projektu budowlanego lub przed rozpoczęciem instalacji elektrycznej. Im wcześniej, tym lepiej - można optymalnie zaplanować rozmieszczenie wszystkich elementów i uniknąć późniejszych zmian." }
    },
    {
      "@type": "Question",
      "name": "Czy zapewniacie montaż systemu Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Pakiet Full house obejmuje pełną instalację i uruchomienie. Przy pakietach Smart design i Smart design+ montaż wykonuje wybrany przez Ciebie elektryk według naszego projektu (możemy polecić sprawdzonych wykonawców)." }
    },
    {
      "@type": "Question",
      "name": "Z jaką technologią pracujecie?",
      "acceptedAnswer": { "@type": "Answer", "text": "Specjalizujemy się w systemie Loxone - austriackiego lidera w automatyce budynkowej. To system sprawdzony, niezawodny i stale rozwijany. Jesteśmy certyfikowanym partnerem Loxone." }
    },
    {
      "@type": "Question",
      "name": "Czy mogę integrować urządzenia innych producentów z Loxone?",
      "acceptedAnswer": { "@type": "Answer", "text": "Tak, system Loxone obsługuje protokoły KNX, Modbus, DMX, 1-Wire i wiele innych standardów. Można integrować urządzenia różnych producentów - oświetlenie, klimatyzację, audio, itp." }
    },
    {
      "@type": "Question",
      "name": "Czy system Smart Home wymaga dostępu do Internetu?",
      "acceptedAnswer": { "@type": "Answer", "text": "System działa lokalnie bez Internetu. Dostęp do sieci jest potrzebny tylko do zdalnego sterowania spoza domu i aktualizacji oprogramowania. Podstawowe funkcje działają zawsze, nawet bez połączenia." }
    },
    {
      "@type": "Question",
      "name": "Jaką gwarancję oferujecie na system Smart Home?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oferujemy 2 lata gwarancji na wykonane prace. Urządzenia Loxone objęte są gwarancją producenta. Po okresie gwarancyjnym zapewniamy serwis i wsparcie techniczne." }
    },
    {
      "@type": "Question",
      "name": "Jak wygląda wsparcie techniczne?",
      "acceptedAnswer": { "@type": "Answer", "text": "Zapewniamy wsparcie przez email i telefon. W przypadku poważniejszych problemów możliwe są wizyty serwisowe. Proste zmiany w konfiguracji możemy wykonywać zdalnie." }
    }
  ]
};

const pageMetadata = {
  '/': {
    title: 'Inteligentny Dom Bydgoszcz - Smart Home Loxone | designiQ',
    description: 'Inteligentny Dom Bydgoszcz i kujawsko-pomorskie. Profesjonalne systemy Smart Home Loxone – automatyka budynkowa. Certyfikowany partner Loxone: projekty, instalacje, programowanie.',
    keywords: 'inteligentny dom bydgoszcz, smart home bydgoszcz, automatyka budynkowa, loxone partner bydgoszcz, smart home kujawsko-pomorskie, projektowanie smart home, designiq',
    ogImage: OG_IMAGE_DEFAULT,
    schema: ORGANIZATION_SCHEMA,
  },
  '/Konfigurator': {
    title: 'Wycena Smart Home Bydgoszcz - Konfigurator Inteligentnego Domu Online | designiQ',
    description: 'Odbierz darmową wycenę Smart Home w Bydgoszczy. Stwórz konfigurację inteligentnego domu i otrzymaj kosztorys. Interaktywny konfigurator Loxone w 4 krokach.',
    keywords: 'konfigurator smart home, wycena smart home online, kalkulator smart home, konfigurator loxone, cena inteligentnego domu, darmowa wycena bydgoszcz',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Konfigurator Smart Home designiQ",
      "description": "Interaktywny konfigurator do projektowania systemu Smart Home Loxone w Bydgoszczy i kujawsko-pomorskim",
      "applicationCategory": "DesignApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "PLN"
      }
    }
  },
  '/CoZyskasz': {
    title: 'Korzyści Inteligentnego Domu (Smart Home) - Oszczędność, Bezpieczeństwo | designiQ',
    description: 'Odkryj zalety inteligentnego domu Loxone: do 30% oszczędności energii, pełne bezpieczeństwo, komfort życia i wzrost wartości nieruchomości. ROI 2-4 lata.',
    keywords: 'korzyści smart home, oszczędność energii inteligentny dom, bezpieczeństwo domu, automatyzacja domu, zalety smart home, loxone korzyści, zarządzanie energią',
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Korzyści Smart Home – Oszczędność, Bezpieczeństwo, Komfort",
      "description": "Kompleksowy przewodnik po korzyściach inteligentnego domu Loxone",
      "author": { "@type": "Organization", "name": "designiQ" },
      "publisher": { "@type": "Organization", "name": "designiQ", "url": BASE_URL }
    }
  },
  '/Oferta': {
    title: 'Pakiety Smart Home Loxone - Projekty i Instalacje | designiQ Bydgoszcz',
    description: 'Wybierz pakiet Smart Home: Smart Design (projekt), Smart Design+ (prefabrykacja) lub Full House (pełne uruchomienie). Kompleksowe rozwiązania Loxone w Bydgoszczy i kujawsko-pomorskim.',
    keywords: 'oferta smart home, pakiety smart home, cena smart home, smart design, projektowanie smart home bydgoszcz, instalacja loxone, koszt inteligentnego domu',
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Automatyka Budynkowa – Smart Home Loxone",
      "provider": { "@type": "Organization", "name": "designiQ", "url": BASE_URL },
      "areaServed": [
        { "@type": "City", "name": "Bydgoszcz" },
        { "@type": "AdministrativeArea", "name": "Kujawsko-Pomorskie" }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Pakiety Smart Home designiQ",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Smart Design", "description": "Projekt automatyki i projekt szafy sterowniczej" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Smart Design+", "description": "Projekt automatyki, szafa sterownicza i prefabrykacja" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Full House", "description": "Kompleksowa realizacja: projekt, prefabrykacja, uruchomienie i integracja" } }
        ]
      }
    }
  },
  '/ONas': {
    title: 'O Nas - Certyfikowani Eksperci Smart Home Loxone Bydgoszcz | designiQ',
    description: 'designiQ – certyfikowany partner Loxone z Bydgoszczy. Eksperci Smart Home i automatyki budynkowej obsługujący kujawsko-pomorskie. Projekty, programowanie, integracja systemów.',
    keywords: 'partner loxone bydgoszcz, firma smart home kujawsko-pomorskie, inteligentny dom bydgoszcz, projektowanie automatyki, certyfikowany partner loxone',
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "about": {
        "@type": "Organization",
        "name": "designiQ",
        "url": BASE_URL,
        "description": "Certyfikowany partner Loxone specjalizujący się w Smart Home i automatyce budynkowej"
      }
    }
  },
  '/Kontakt': {
    title: 'Kontakt Smart Home Bydgoszcz - Bezpłatna Konsultacja | designiQ',
    description: 'Skontaktuj się z designiQ – ekspertami Smart Home Loxone w Bydgoszczy i kujawsko-pomorskim. Bezpłatna konsultacja i wycena. Tel: 782-109-286, Email: kontakt@designiq.pl.',
    keywords: 'kontakt smart home bydgoszcz, konsultacja smart home, wycena smart home kujawsko-pomorskie, loxone bydgoszcz kontakt',
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "mainEntity": {
        "@type": "Organization",
        "name": "designiQ",
        "telephone": "+48-782-109-286",
        "email": "kontakt@designiq.pl",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Żeglarska 18/1",
          "addressLocality": "Bydgoszcz",
          "postalCode": "85-519",
          "addressRegion": "Kujawsko-Pomorskie",
          "addressCountry": "PL"
        }
      }
    }
  },
  '/FAQ': {
    title: 'FAQ Smart Home – Najczęstsze Pytania i Odpowiedzi | designiQ Bydgoszcz',
    description: 'Odpowiedzi na 24 najczęstsze pytania o Smart Home: koszty, instalacja, technologia Loxone, pakiety usług i gwarancja. Dowiedz się wszystkiego przed zakupem systemu automatyki budynkowej.',
    keywords: 'faq smart home, pytania smart home, ile kosztuje smart home, jak działa smart home, instalacja smart home bydgoszcz, loxone pytania, automatyka budynkowa pytania',
    schema: FAQ_SCHEMA,
  },
  '/Realizacje': {
    title: 'Realizacje Smart Home – Projekty Inteligentnych Domów | designiQ',
    description: 'Zrealizowane projekty Smart Home Loxone w całej Polsce. Wille, domy jednorodzinne, apartamenty – kompleksowa automatyka budynkowa od 95 do 450 m². Sprawdź nasze portfolio.',
    keywords: 'realizacje smart home, projekty inteligentny dom, portfolio automatyki budynkowej, smart home polska, loxone realizacje, wdrożenia smart home',
    schema: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Realizacje Smart Home – designiQ",
      "description": "Portfolio zrealizowanych projektów inteligentnych domów i automatyki budynkowej",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Nowoczesna willa w Poznaniu", "description": "Kompleksowy system Smart Home Full House 320 m²" },
        { "@type": "ListItem", "position": 2, "name": "Dom jednorodzinny w Gdańsku", "description": "System automatyki Smart Design+ 180 m²" },
        { "@type": "ListItem", "position": 3, "name": "Apartament Premium – Warszawa", "description": "Inteligentny apartament Smart Design 95 m²" },
        { "@type": "ListItem", "position": 4, "name": "Rezydencja z basenem – Kraków", "description": "Luksusowa rezydencja Full House 450 m² z fotowoltaiką" },
        { "@type": "ListItem", "position": 5, "name": "Dom pasywny – Wrocław", "description": "Smart Design+ 210 m² z rekuperacją i zarządzaniem energią" },
        { "@type": "ListItem", "position": 6, "name": "Nowoczesne bliźniaki – Katowice", "description": "Smart Design 140 m² dla młodych rodzin" }
      ]
    }
  },
  '/Instalator': {
    title: 'Integracja Loxone Smart Home – Pokaz Możliwości | designiQ Bydgoszcz',
    description: 'Interaktywny pokaz możliwości systemu Loxone. Sterowanie fotowoltaiką, pompą ciepła, oświetleniem i klimatyzacją w czasie rzeczywistym. Automatyka budynkowa KNX, Modbus, DALI.',
    keywords: 'loxone integracja, smart home demo, loxone miniserver, automatyka budynkowa demo, knx modbus dali, fotowoltaika pompa ciepła automatyka, loxone bydgoszcz',
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Integracja Systemów Smart Home Loxone",
      "provider": { "@type": "Organization", "name": "designiQ", "url": BASE_URL },
      "description": "Integracja urządzeń firm trzecich (Fronius, Viessmann, Daikin, Vaillant) z systemem Loxone Miniserver. KNX, Modbus, DALI.",
      "areaServed": [
        { "@type": "City", "name": "Bydgoszcz" },
        { "@type": "AdministrativeArea", "name": "Kujawsko-Pomorskie" }
      ]
    }
  },
  '/StatusInwestycji': {
    title: 'Panel Klienta – Status Inwestycji Smart Home | designiQ',
    description: 'Panel klienta designiQ – sprawdź status realizacji swojego projektu Smart Home. Śledzenie etapów budowy, dokumentacja i wyceny w jednym miejscu.',
    keywords: 'panel klienta smart home, status inwestycji designiq, śledzenie projektu smart home',
    schema: null,
  },
  '/PolitykaPrywatnosci': {
    title: 'Polityka Prywatności i Cookies | designiQ Smart Home',
    description: 'Polityka prywatności designiQ: zasady przetwarzania danych osobowych zgodnie z RODO, polityka cookies oraz prawa użytkownika serwisu Smart Home.',
    keywords: 'polityka prywatności designiq, rodo smart home, cookies polityka',
    schema: null,
  },
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
    updateMetaTag('property', 'og:url', `${window.location.protocol}//www.designiq.pl${currentPath}`);
    updateMetaTag('property', 'og:site_name', 'designiQ');
    updateMetaTag('property', 'og:locale', 'pl_PL');
    updateMetaTag('property', 'og:image', metadata.ogImage || OG_IMAGE_DEFAULT);

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', metadata.title);
    updateMetaTag('name', 'twitter:description', metadata.description);
    updateMetaTag('name', 'twitter:image', metadata.ogImage || OG_IMAGE_DEFAULT);

    // Canonical URL
    const canonicalUrl = `${window.location.protocol}//www.designiq.pl${currentPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Schema.org structured data
    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (metadata.schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(metadata.schema);
    } else if (schemaScript) {
      schemaScript.remove();
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
