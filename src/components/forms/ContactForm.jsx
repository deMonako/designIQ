import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react"; // Dodajemy ikony
import { motion } from "framer-motion";

// ######################################################
// 1. Zmień ten URL na link wdrożenia Twojego skryptu GAS
// ######################################################
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwl3IlqxAbzxkipu28oMHOnVxs4HUJT_PJm7i8SogMDOeBVNc7gvR0Jzph9kp1TXipZ/exec";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // Nowy stan: czy wysłano
  const [errorMessage, setErrorMessage] = useState(null); // Nowy stan: błąd

  const [formData, setFormData] = useState({
    imie_nazwisko: "",
    email: "",
    telefon: "",
    temat: "",
    wiadomosc: ""
  });

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Funkcja konwertująca dane do formatu URLSearchParams (klucz do ominięcia CORS)
  const formatPayload = () => {
      return {
        name: formData.imie_nazwisko,
        email: formData.email,
        phone: formData.telefon,
        subject: formData.temat || 'Brak tematu',
        message: formData.wiadomosc,
        // !!! KLUCZOWA ZMIANA: AKCJA DLA OGÓLNEGO KONTAKTU !!!
        action: 'sendContactForm', 
        timestamp: new Date().toLocaleString('pl-PL'),
      };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const payload = formatPayload(); // Używamy nowej funkcji
    const urlEncodedData = new URLSearchParams(payload).toString();

    const maxRetries = 3;
    let success = false;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(GAS_ENDPOINT, {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded", 
          },
          body: urlEncodedData 
        });

        // Oczekujemy odpowiedzi JSON od skryptu GAS
        const result = await response.json();

        if (response.ok && result.status === "SUCCESS") {
          success = true;
          break;
        } else {
          const errorMessageFromGas = result.message || response.statusText;
          console.error(`Błąd wysyłki (Próba ${i + 1}): GAS Status: ${result.status} - ${errorMessageFromGas}`);
        }
      } catch (err) {
        console.error(`Błąd sieci (Próba ${i + 1}):`, err);
      }

      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (success) {
      setSubmitted(true);
    } else {
      setErrorMessage("Niestety, wystąpił błąd podczas wysyłania zapytania. Spróbuj ponownie lub skontaktuj się bezpośrednio.");
    }
    
    setIsSubmitting(false);
  };

  // ##################################################
  // Widok po udanej wysyłce (ContactForm) - ULEPSZONY
  // ##################################################
  if (submitted) {
    return (
      // Zmieniamy kontener na ramkę sukcesu
      <div className="p-8 bg-green-50 border border-green-400 rounded-xl shadow-lg text-center transition-all duration-500 max-w-lg mx-auto">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4 animate-bounce-once" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Wiadomość wysłana pomyślnie! 🎉</h2>
        <p className="text-gray-700 max-w-sm mx-auto">
          Dziękujemy za kontakt. Odpowiedź na Twoje zapytanie otrzymasz na adres 
          <span className="font-semibold text-orange-600 block my-1">{formData.email}</span> 
          tak szybko, jak to możliwe.
          <br />
          <span className="text-sm text-gray-500 mt-2 block pt-2 border-t border-green-200">
            Jeśli maila nie ma w twojej skrzynce, prosimy sprawdzić folder <i>Spam</i> lub <i>Oferty</i>.
          </span>
        </p>
      </div>
    );
  }

  // ##################################################
  // Główny widok formularza
  // ##################################################
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Komunikat o błędzie */}
      {errorMessage && (
        <div className="flex items-center p-3 text-sm text-red-800 bg-red-100 border border-red-300 rounded-lg" role="alert">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Pola formularza... (pozostały kod) */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">Imię i nazwisko *</Label>
        <Input
          id="name"
          value={formData.imie_nazwisko}
          onChange={handleChange('imie_nazwisko')}
          required
          disabled={isSubmitting}
          placeholder="Jan Kowalski"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          required
          disabled={isSubmitting}
          placeholder="jan@example.com"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base">Telefon</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.telefon}
          onChange={handleChange('telefon')}
          disabled={isSubmitting}
          placeholder="+48 123 456 789"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-base">Temat</Label>
        <Input
          id="subject"
          value={formData.temat}
          onChange={handleChange('temat')}
          disabled={isSubmitting}
          placeholder="W czym możemy pomóc?"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2 flex-grow flex flex-col">
        <Label htmlFor="message" className="text-base">Wiadomość *</Label>
        <textarea
          id="message"
          value={formData.wiadomosc}
          onChange={handleChange('wiadomosc')}
          required
          disabled={isSubmitting}
          placeholder="Opisz na czym Ci zależy..."
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base flex-grow resize-y" // Zmieniono resize-none na resize-y
          style={{ minHeight: '200px' }}
        />
      </div>

      {/* Przycisk wysyłki */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-2xl hover:shadow-orange-500/50 text-lg py-6 rounded-xl mt-auto disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Wysyłanie...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Wyślij wiadomość
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}