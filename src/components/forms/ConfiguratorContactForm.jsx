import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { gtmEvent } from "../analytics";

import { Mail, Loader2, Send, Undo2, XCircle } from 'lucide-react';

/* global fbq */

// --- Główny Komponent Formularza Kontaktowego (Logika gotowa do produkcji) ---

function ConfiguratorContactForm({ formData, estimatedPrice, onCancel }) {
  
  // Twój poprawny Adres URL z wdrożenia Google Apps Script
  const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwl3IlqxAbzxkipu28oMHOnVxs4HUJT_PJm7i8SogMDOeBVNc7gvR0Jzph9kp1TXipZ/exec"; 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactData, setContactData] = useState({
    imie_nazwisko: "",
    email: "",
    telefon: "",
    miasto: "",
    wiadomosc: ""
  });
  
  // Stan na przechowywanie ewentualnego błędu po nieudanej próbie wysyłki
  const [errorMessage, setErrorMessage] = useState(null);

  // Funkcja obsługująca zmianę danych w polach formularza
  const handleChange = useCallback((field) => (e) => {
    setContactData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);


  // KRYTYCZNA ZMIANA 2: Dostosowanie payloadu do oczekiwań skryptu Google Apps Script
  const formatPayload = () => {
    
    // ZMIANA: Wysyłamy CAŁY obiekt formData jako string JSON
    const configurationJsonString = JSON.stringify(formData);
      
    // Zwracamy obiekt z kluczami, które są oczekiwane przez funkcję saveDataToSheet w GAS
    return {
      // Pola kontaktowe
      name: contactData.imie_nazwisko,
      email: contactData.email,
      phone: contactData.telefon,
      city: contactData.miasto || 'Nie podano',
      message: contactData.wiadomosc || 'Brak dodatkowych informacji',
      
      // Pola Konfiguracji
      price:
      `${Math.round(estimatedPrice * 0.8).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} – ` +
      `${Math.round(estimatedPrice * 1.3).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} PLN`,

      // Zmieniamy klucz na configurationJsonString
      configuration: configurationJsonString,
      
      // Dodatkowe pola wymagane przez GAS
      action: 'submitForm',
      timestamp: new Date().toLocaleString('pl-PL'),
    };
  };


  // KRYTYCZNA ZMIANA 3: Dostosowanie logiki wysyłki do Google Apps Script - FIX CORS
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrorMessage(null); 
    setIsSubmitting(true);

    const payload = formatPayload();
    
    // FIX CORS: Konwersja obiektu payload na format URLSearchParams
    // To wymusza "Simple Request", który obchodzi błąd CORS w Google Apps Script.
    const urlEncodedData = new URLSearchParams(payload).toString();
    
    // LOGIKA FETCH Z MECHANIZMEM PONAWIANIA PRÓB (Exponential Backoff)
    const maxRetries = 3;
    let success = false;
    
    // Weryfikacja (usunięta, ponieważ URL jest już wklejony)
    if (GAS_ENDPOINT.includes("YOUR_GAS_DEPLOYMENT_ID")) {
        setErrorMessage("Błąd konfiguracji: Musisz podać poprawny adres URL wdrożenia Google Apps Script (GAS_ENDPOINT).");
        setIsSubmitting(false);
        return;
    }

    const scrollToConfigurator = () => {
      setTimeout(() => {
        const top = 100;
        document.documentElement.scrollTo({ top, behavior: "smooth" });
        document.body.scrollTo({ top, behavior: "smooth" });
      }, 30);
    };

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(GAS_ENDPOINT, { // Używamy GAS_ENDPOINT
          method: "POST",
          headers: { 
            // Używamy Content-Type dla danych formularza
            "Content-Type": "application/x-www-form-urlencoded", 
          },
          body: urlEncodedData // Wysyłamy sformatowane dane formularza (FIX CORS)
        });
        
        // Oczekujemy odpowiedzi JSON od skryptu GAS
        // UWAGA: Musisz upewnić się, że w GAS funkcja zwraca JSON za pomocą ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)
        const result = await response.json();

        // Sprawdzamy status HTTP oraz status zwrócony w JSON przez skrypt GAS
        if (response.ok && result.status === "SUCCESS") {
          success = true;
          break;
        } else {
          const errorMessageFromGas = result.message || response.statusText;
          console.error(`Błąd wysyłki (Próba ${i + 1}): GAS Status: ${result.status} - ${errorMessageFromGas}`);
        }
      } catch (err) {
        // Logowanie błędu sieci/Failed to fetch
        console.error(`Błąd sieci (Próba ${i + 1}):`, err);
        // Jeśli nadal występuje błąd sieci/CORS, to oznacza, że jest to poważny błąd połączenia
      }

      // Jeśli to nie jest ostatnia próba, czekamy z wykładniczym opóźnieniem
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (success) {
      scrollToConfigurator();
      setSubmitted(true);
    } else {
      setErrorMessage("Niestety, wystąpił krytyczny błąd podczas wysyłania zapytania po kilku próbach. Sprawdź, czy ustawienia wdrożenia GAS (dostęp: 'Każdy') są poprawne.");
    }
    
    setIsSubmitting(false);
  }, [contactData, estimatedPrice, formData]); // Zaktualizowano zależności

  useEffect(() => {
    if (submitted) {
      gtmEvent("contact_form_success");
      fbq("track", "Contact");
    }
  }, [submitted]);

  // Widok po udanej wysyłce (ConfiguratorContactForm) - ZIELONY STYL Z IKONĄ SEND
  if (submitted) {
    return (
      // Kontener z zielonym tłem sukcesu
      <div className="p-8 bg-green-50 border border-green-400 rounded-xl shadow-lg text-center transition-all duration-500 max-w-lg mx-auto">
        {/* Używamy ikony Send, ale w kolorze akcentu (orange) */}
        <Send className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Zapytanie wysłane!</h2>
        <p className="text-gray-700 max-w-sm mx-auto">
          Potwierdzenie konfiguracji oraz szacunkowa wycena zostały wysłane na adres:
          {/* Adres e-mail pozostawiamy w kolorze pomarańczowym dla wyróżnienia */}
          <span className="font-semibold text-orange-600 block my-1">{contactData.email}</span>
          Wkrótce skontaktujemy się z Tobą w celu omówienia szczegółów wyceny.
          <br />
          {/* Komunikat o spamie w nowym stylu */}
          <span className="text-sm text-gray-500 mt-2 block pt-2 border-t border-green-200">
            Jeśli maila nie ma w twojej skrzynce, prosimy sprawdzić folder <i>Spam</i> lub <i>Oferty</i>.
          </span>
        </p>
        <Button 
          onClick={onCancel} 
          className="mt-6 h-12 mx-auto block" // Dodajemy 'mx-auto' i 'block'
          variant="outline"
        >
          <Undo2 className="w-5 h-5 mr-2" /> Wróć do konfiguratora
        </Button>
      </div>
    );
  }

  // Główny widok formularza
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 flex items-center">
        <Mail className="w-8 h-8 mr-3 text-orange-500" />
        Potwierdzenie i wycena
      </h2>
      <p className="text-gray-500 mb-6 border-b pb-4">
        Podaj swoje dane, aby otrzymać szczegółowe podsumowanie konfiguracji oraz szacunkową wycenę na e-mail.
      </p>
      
      {/* Usunięte ostrzeżenie Formspree, dodane ostrzeżenie GAS */}
      {GAS_ENDPOINT.includes("YOUR_GAS_DEPLOYMENT_ID") && (
         <div className="flex items-center p-3 mb-4 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg" role="alert">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">OSTRZEŻENIE: Musisz zastąpić "YOUR_GAS_DEPLOYMENT_ID" swoim kluczem z wdrożenia Google Apps Script, aby wysyłka działała!</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center p-3 mb-4 text-sm text-red-800 bg-red-100 border border-red-300 rounded-lg" role="alert">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="imie">Imię i nazwisko *</Label>
          <Input
            id="imie"
            value={contactData.imie_nazwisko}
            onChange={handleChange('imie_nazwisko')}
            required
            disabled={isSubmitting}
            className="h-12"
          />
        </div>
        
        <div className='grid sm:grid-cols-2 gap-4'>
            <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                id="email"
                type="email"
                value={contactData.email}
                onChange={handleChange('email')}
                required
                disabled={isSubmitting}
                className="h-12"
                />
            </div>

            <div>
                <Label htmlFor="telefon">Telefon *</Label>
                <Input
                id="telefon"
                type="tel"
                value={contactData.telefon}
                onChange={handleChange('telefon')}
                required
                disabled={isSubmitting}
                className="h-12"
                />
            </div>
        </div>

        <div>
          <Label htmlFor="miasto">Miasto</Label>
          <Input
            id="miasto"
            value={contactData.miasto}
            onChange={handleChange('miasto')}
            disabled={isSubmitting}
            className="h-12"
          />
        </div>

        <div>
          <Label htmlFor="wiadomosc">Dodatkowe informacje (opcjonalnie)</Label>
          <textarea
            id="wiadomosc"
            value={contactData.wiadomosc}
            onChange={handleChange('wiadomosc')}
            disabled={isSubmitting}
            rows={4}
            className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            placeholder="Opisz swoje wymagania lub preferowany termin kontaktu..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            {/* Przycisk wysyłki - używamy Button, który ma już style z Twojego kodu (w tym bg-gradient) */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14" // h-14 dla większego przycisku
              variant="primary"
              onClick={() => {
                if (!isSubmitting) {
                  gtmEvent("contact_form_submit_click");
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Wyślij zapytanie
                </>
              )}
            </Button>
          </div>

          <div className="w-full sm:w-auto">
            <Button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              variant="outline"
              className="w-full h-14" // h-14 dla spójności
            >
              <Undo2 className="w-5 h-5 mr-2" />
              Wróć
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ConfiguratorContactForm;