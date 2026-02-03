import React, { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { 
  Search, AlertCircle, Package, Calendar, 
  DollarSign, ShoppingCart, ArrowLeft 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Importy widoków
import StatusDashboard from "../components/investment/StatusDashboard";
import ClientWycenaView from "../components/investment/ClientWycenaView";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzaygYUtnj50uxOWsMCqIH0EvjlheXka59q96r6fvikZ4ESVZvOtyDwvzCjrg5x7QZbmw/exec";

export default function StatusInwestycji() {
  // --- STANY ---
  const [investmentCode, setInvestmentCode] = useState("");
  const [investment, setInvestment] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [activeView, setActiveView] = useState("status"); // "status" | "wycena" | "zakupy"

  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const resultsRef = useRef(null);

  const scrollToResults = () => {
    // Krótkie opóźnienie, aby klawiatura na telefonach zdążyła się schować
    setTimeout(() => {
      window.scrollTo({ top: 60, behavior: "smooth" });
    }, 100);
  };

  // --- LOGIKA POBIERANIA DANYCH ---
  const handleSearch = async () => {
    if (!investmentCode.trim()) {
      toast.error("Podaj kod inwestycji");
      return;
    }

    setIsSearching(true);
    setNotFound(false);

    try {
      const response = await fetch(`${GAS_URL}?code=${investmentCode.trim()}`);
      const data = await response.json();

      if (data && !data.error) {
        // 1. Parsowanie i filtrowanie pokoi (usuwamy wiersz nagłówkowy z Excela)
        const rawRooms = typeof data.rooms === 'string' ? JSON.parse(data.rooms) : (data.rooms || []);
        const filteredRooms = rawRooms.filter(room => 
          room.name && 
          room.name !== "Pomieszczenie" && // To usuwa Twój nagłówek z arkusza
          room.name.trim() !== ""
        );

        // 2. Formatowanie głównego obiektu inwestycji
        const formattedInvestment = {
          ...data,
          stages: typeof data.stages === 'string' ? JSON.parse(data.stages) : (data.stages || []),
          documents: typeof data.documents === 'string' ? JSON.parse(data.documents) : (data.documents || []),
          rooms: filteredRooms // Wstrzykujemy czystą listę pokoi
        };

        // 3. Obsługa wyceny (quotation)
        let formattedQuotation = null;
        if (data.quotation) {
          formattedQuotation = typeof data.quotation === 'string' ? JSON.parse(data.quotation) : data.quotation;
        }

        const isUpdate = !!investment;
        
        setInvestment(formattedInvestment);
        setQuotation(formattedQuotation);

        if (!isUpdate) {
          setActiveView("status");
        }

        toast.success("Dane załadowane pomyślnie");
        scrollToResults();
      } else {
        setNotFound(true);
        setInvestment(null);
        toast.error(data.error || "Nie znaleziono inwestycji");
      }
    } catch (error) {
      console.error("Error fetching:", error);
      toast.error("Błąd połączenia z bazą danych");
    } finally {
      setIsSearching(false);
    }
  };

  const renderActiveView = () => {
    const isDemo = investment?.investment_code === "DEMO" || investment?.investment_code === "MATERIAŁY";

    // Wspólna funkcja dla zmiany widoku ze scrollem
    const navigateTo = (view) => {
      setActiveView(view);
      scrollToResults();
    };

    switch (activeView) {
      case "wycena":
        if (isDemo) {
          return (
            <div className="p-8 text-center bg-white border-2 border-slate-200 rounded-xl my-6 mx-0">
              {/* Tutaj zmiana */}
              <Button onClick={() => navigateTo("status")} variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do statusu
              </Button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Wycena niedostępna</h2>
              <p className="text-slate-500 mt-2 text-sm tracking-wide">
                Wycena szczegółowa jest niedostępna dla projektu demonstracyjnego.
              </p>
            </div>
          );
        }
        return (
          <ClientWycenaView 
            investment={investment} 
            quotation={quotation} 
            onBack={() => navigateTo("status")} // Tutaj zmiana
            onRefresh={handleSearch}
          />
        );

      case "zakupy":
        return (
          <div className="p-8 text-center bg-white border-2 border-slate-200 rounded-xl my-6 mx-0">
            <Button onClick={() => navigateTo("status")} variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do statusu
            </Button>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lista zakupów</h2>
            <p className="text-slate-500 mt-2 text-sm tracking-wide">
              Ten widok jest w trakcie przygotowania.
            </p>
          </div>
        );

      default:
        return (
          <StatusDashboard 
            investment={investment} 
            onNavigate={(view) => navigateTo(view)} // Tutaj zmiana - teraz wycena też scrolluje
            onRefresh={handleSearch}
          />
        );
    }
  };

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="w-full max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
        
        {!investment && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-3xl mb-6 shadow-lg shadow-orange-200">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r py-1 from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Panel Klienta - Status Inwestycji
              </h1>
              <p className="text-slate-500 max-w-lg mx-auto">
                Sprawdź bieżący status realizacji swojego projektu Smart Home. Wpisz kod inwestycji otrzymany od nas, aby zobaczyć szczegóły.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto border-2 border-orange-100 shadow-xl">
              <CardContent className="p-8">
                <Label className="text-base mb-2 block font-medium text-slate-700">Kod inwestycji</Label>
                <div className="flex gap-3">
                  <Input
                    value={investmentCode}
                    onChange={(e) => setInvestmentCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="np. DEMO"
                    className="h-14 text-lg"
                  />
                  <Button onClick={handleSearch} disabled={isSearching} className="h-14 px-8 bg-orange-600 hover:bg-orange-700 text-white transition-colors">
                    {isSearching ? "Szukam..." : <><Search className="w-5 h-5 mr-2" /> Sprawdź</>}
                  </Button>
                </div>
                
                <p className="mt-6 text-sm text-slate-400 text-center">
                  Kod inwestycji znajdziesz w emailu potwierdzającym rozpoczęcie współpracy lub wypróbuj kod projektu demonstacyjnego: <span className="font-bold text-orange-400">DEMO</span>
                </p>

                {notFound && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Nie znaleźliśmy projektu o takim kodzie.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {investment && (
            <motion.div
            ref={resultsRef}  
            key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}