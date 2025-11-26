import React, { useState, useEffect } from 'react';
import { X, Settings, Cookie, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const CONSENT_KEY = 'designiq_cookie_consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    } else {
      const saved = JSON.parse(consent);
      setPreferences(saved);
      applyConsent(saved);
    }
  }, []);

  const applyConsent = (prefs) => {
    // Google Analytics Consent Mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        ad_user_data: prefs.marketing ? 'granted' : 'denied',
        ad_personalization: prefs.marketing ? 'granted' : 'denied',
      });
    }

    // Load Google Analytics if consent given
    if (prefs.analytics && !document.querySelector('script[src*="googletagmanager"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    }
  };

  const saveConsent = (prefs) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    applyConsent(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const acceptNecessary = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-orange-500 shadow-2xl"
          >
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-lg">Używamy plików cookies</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Nasza strona wykorzystuje pliki cookies w celu zapewnienia najlepszej jakości usług, 
                    analizy ruchu oraz personalizacji reklam. Możesz zarządzać swoimi preferencjami dotyczącymi cookies.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Ustawienia
                  </Button>
                  <Button
                    onClick={acceptNecessary}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Tylko niezbędne
                  </Button>
                  <Button
                    onClick={acceptAll}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl w-full sm:w-auto"
                  >
                    Akceptuję wszystkie
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold">Ustawienia cookies</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Necessary Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Niezbędne cookies</h3>
                    <p className="text-sm text-slate-600">
                      Te pliki cookies są wymagane do prawidłowego działania strony i nie mogą być wyłączone.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-orange-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Cookies analityczne</h3>
                    <p className="text-sm text-slate-600">
                      Pozwalają nam zrozumieć, jak odwiedzający korzystają z naszej strony, dzięki czemu możemy ją ulepszać. 
                      Wykorzystujemy Google Analytics.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.analytics ? 'bg-orange-600 justify-end' : 'bg-slate-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Cookies marketingowe</h3>
                    <p className="text-sm text-slate-600">
                      Wykorzystywane przez partnerów reklamowych do tworzenia profilu Twoich zainteresowań i wyświetlania 
                      odpowiednich reklam. Wykorzystujemy Google Ads.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        preferences.marketing ? 'bg-orange-600 justify-end' : 'bg-slate-300 justify-start'
                      } px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={saveCustom}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl"
                >
                  Zapisz preferencje
                </Button>
                <Button
                  onClick={acceptAll}
                  variant="outline"
                  className="flex-1"
                >
                  Akceptuj wszystkie
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}