import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { gtmEvent } from "../analytics";
import { Mail, Loader2, Send, Undo2, XCircle } from 'lucide-react';
import { useGasSubmit } from "../../hooks/useGasSubmit";
import { GAS_CONFIG } from "../../admin/api/gasConfig";
import { createLead } from "../../admin/api/gasApi";
// useGasSubmit używa GAS_CONFIG.scriptUrl jako domyślnego endpointu

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

function saveLead(contactData, estimatedPrice) {
  try {
    const newLead = {
      id: `lead-${Date.now()}`,
      name:       contactData.imie_nazwisko,
      email:      contactData.email,
      phone:      contactData.telefon,
      quoteValue: estimatedPrice,
      notes:      [contactData.miasto, contactData.wiadomosc].filter(Boolean).join(" · "),
      pipelineStatus: "Lead",
      status:     "Nowy",
      date:       new Date().toISOString().slice(0, 10),
    };
    const existing = JSON.parse(localStorage.getItem("diq_leads") || "[]");
    localStorage.setItem("diq_leads", JSON.stringify([newLead, ...existing]));
  } catch {}
}

function ConfiguratorContactForm({ formData, estimatedPrice, onCancel }) {
  const [submitted, setSubmitted] = useState(false);
  const [contactData, setContactData] = useState({
    imie_nazwisko: "",
    email: "",
    telefon: "",
    miasto: "",
    wiadomosc: ""
  });

  const { isSubmitting, errorMessage, submit } = useGasSubmit();

  const handleChange = useCallback((field) => (e) => {
    setContactData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const newLead = {
      id:             `lead-${Date.now()}`,
      name:           contactData.imie_nazwisko,
      email:          contactData.email,
      phone:          contactData.telefon,
      quoteValue:     estimatedPrice,
      notes:          [contactData.miasto, contactData.wiadomosc].filter(Boolean).join(" · "),
      pipelineStatus: "Lead",
      status:         "Nowy",
      source:         "Konfigurator",
      date:           new Date().toISOString().slice(0, 10),
      configData:     { ...formData, miasto: contactData.miasto || '', uwagi: contactData.wiadomosc || '' },
    };

    const handleSuccess = () => {
      saveLead(contactData, estimatedPrice);
      if (GAS_ON) createLead(newLead).catch(() => {});
      setSubmitted(true);
    };

    if (!GAS_ON) {
      handleSuccess();
      return;
    }

    const payload = {
      action:     'submitForm',
      name:       contactData.imie_nazwisko,
      email:      contactData.email,
      phone:      contactData.telefon,
      quoteValue: estimatedPrice,
      configData: newLead.configData,
    };

    await submit(payload, {
      onSuccess: handleSuccess,
    });
  }, [contactData, estimatedPrice, formData, submit]);

  // Tracking po udanej wysyłce
  useEffect(() => {
    if (submitted) {
      gtmEvent("contact_form_success");
      // Bezpieczne wywołanie fbq - tylko jeśli Facebook Pixel jest załadowany
      if (typeof window.fbq === 'function') {
        window.fbq("track", "Contact");
      }
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className="p-8 bg-green-50 border border-green-400 rounded-xl shadow-lg text-center transition-all duration-500 max-w-lg mx-auto">
        <Send className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Zapytanie wysłane!</h2>
        <p className="text-gray-700 max-w-sm mx-auto">
          Potwierdzenie konfiguracji oraz szacunkowa wycena zostały wysłane na adres:
          <span className="font-semibold text-orange-600 block my-1">{contactData.email}</span>
          Wkrótce skontaktujemy się z Tobą w celu omówienia szczegółów wyceny.
          <span className="text-sm text-gray-500 mt-2 block pt-2 border-t border-green-200">
            Jeśli maila nie ma w twojej skrzynce, prosimy sprawdzić folder <i>Spam</i> lub <i>Oferty</i>.
          </span>
        </p>
        <Button
          onClick={onCancel}
          className="mt-6 h-12 mx-auto block"
          variant="outline"
        >
          <Undo2 className="w-5 h-5 mr-2" /> Wróć do konfiguratora
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 flex items-center">
        <Mail className="w-8 h-8 mr-3 text-orange-500" />
        Potwierdzenie i wycena
      </h2>
      <p className="text-gray-500 mb-6 border-b pb-4">
        Podaj swoje dane, aby otrzymać szczegółowe podsumowanie konfiguracji oraz szacunkową wycenę na e-mail.
      </p>

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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14"
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
              className="w-full h-14"
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
