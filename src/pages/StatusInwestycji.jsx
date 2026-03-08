import React, { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Search, AlertCircle, Package,
  ArrowLeft, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { logger } from "../logger";
import { GAS_CONFIG } from "../admin/api/gasConfig";

// Importy widoków
import StatusDashboard from "../components/investment/StatusDashboard";
import ClientWycenaView from "../components/investment/ClientWycenaView";
import ClientZakupyView from "../components/investment/ClientZakupyView";
import DwgViewer from "../components/investment/DwgViewer";

const GAS_URL = GAS_CONFIG.scriptUrl;

// Mapuje odpowiedź nowego GAS na format oczekiwany przez komponenty inwestycji
function mapInvestmentResponse(data) {
  const { project, docs = [], files = [], messages = [], wycena, zakupy } = data;

  // Etapy: nowy GAS przechowuje jako tablicę stringów, InvestmentTimeline oczekuje obiektów
  const stages = (project.stages || []).map((name, i) => ({
    stage_number: i + 1,
    name: typeof name === "string" ? name : (name.name || String(name)),
    completion_date: null,
    notes: null,
  }));

  // Dokumenty: połącz rekordy z arkusza + pliki z Drive
  const documents = [
    ...docs.map(d => ({
      name:          d.name,
      url:           d.url,
      uploaded_by:   "designIQ",
      uploaded_date: d.date,
    })),
    ...files
      .filter(f => f.name !== "projekt.svg" && f.name !== "projekt.json")
      .map(f => ({
        name:          f.name,
        url:           f.webViewLink || f.webContentLink,
        uploaded_by:   "Klient",
        uploaded_date: f.modifiedTime ? f.modifiedTime.substring(0, 10) : null,
      })),
  ];

  return {
    // Pola używane przez StatusDashboard / ClientWycenaView
    project_name:      project.name,
    package_type:      project.package,
    start_date:        project.startDate,
    current_stage:     (Number(project.stageIndex) || 0) + 1,
    stages,
    investment_code:   project.code,
    code:              project.code,   // nowe pole
    id:                project.id,
    documents,
    rooms:             [],
    quotation_status:  wycena?.status || project.status || "Czeka na akceptację",
    accepted_at:       wycena?.acceptedAt || null,
    quotation:         wycena && Array.isArray(wycena.items) && wycena.items.length > 0 ? wycena : null,
    zakupy:            zakupy && Array.isArray(zakupy.items) && zakupy.items.length > 0 ? zakupy : null,
    messages,
    // Status projektu
    status:            project.status,
    progress:          project.progress,
    deadline:          project.deadline,
  };
}

// Bezpieczny JSON.parse - zwraca fallback przy błędnych danych
function safeJsonParse(value, fallback) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default function StatusInwestycji() {
  // --- STANY ---
  const [investmentCode, setInvestmentCode] = useState("");
  const [investment, setInvestment] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [zakupy, setZakupy] = useState(null);
  const [activeView, setActiveView] = useState("status"); // "status" | "wycena" | "zakupy"

  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const resultsRef = useRef(null);

  const scrollToResults = () => {
    // Krótkie opóźnienie, aby klawiatura na telefonach zdążyła się schować
    setTimeout(() => {
      if (resultsRef.current) {
        const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 80, behavior: "smooth" });
      }
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
      const response = await fetch(
        `${GAS_URL}?action=getInvestment&code=${encodeURIComponent(investmentCode.trim())}`
      );
      const result = await response.json();

      if (result.ok && result.data) {
        const mapped = mapInvestmentResponse(result.data);
        const isUpdate = !!investment;

        setInvestment(mapped);
        setQuotation(mapped.quotation);
        setZakupy(mapped.zakupy);

        if (!isUpdate) {
          setActiveView("status");
        }

        toast.success("Dane załadowane pomyślnie");
        scrollToResults();
      } else {
        setNotFound(true);
        setInvestment(null);
        toast.error(result.error || "Nie znaleziono inwestycji");
      }
    } catch (error) {
      logger.error("Błąd pobierania danych inwestycji:", error);
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
          <ClientZakupyView
            investment={investment}
            zakupy={zakupy}
            onBack={() => navigateTo("status")}
          />
        );

      case "projekt":
        return (
          <div className="my-6">
            <Button onClick={() => navigateTo("status")} variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Powrót do statusu
            </Button>
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <span className="text-2xl">📐</span> Projekt automatyki
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Interaktywny rzut instalacji — kliknij element aby zobaczyć szczegóły
              </p>
              <DwgViewer
                projectCode={investment.investment_code}
                clientMode
                height={560}
              />
            </div>
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
                    {isSearching
                      ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Szukam...</>
                      : <><Search className="w-5 h-5 mr-2" /> Sprawdź</>
                    }
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