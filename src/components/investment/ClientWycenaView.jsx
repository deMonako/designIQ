import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { 
  ArrowLeft, FileText, ChevronDown, ChevronUp, Music,
  Smartphone, Zap, Shield, Camera, Lightbulb, Home, PenTool, LifeBuoy,
  Download, CheckCircle, Calendar, AlertTriangle, XCircle, Loader2, ClipboardList, LayoutList
} from "lucide-react";
import { toast } from "sonner";
import ProjectTimeline from "../quotation/ProjectTimeline";
import SmartHomeCostComparison from "../quotation/SmartHomeCostComparison";
import ValueExplanation from "../quotation/ValueExplanation";
import WarrantyAndSupport from "../quotation/WarrantyAndSupport";
import SmartHomeFeatures from "../quotation/SmartHomeFeatures";
import LoxonePromo from "../quotation/LoxonePromo";

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { font, LOGO_BASE64 } from "../ui/fonts";
import { GAS_CONFIG } from "../../admin/api/gasConfig";

// Dane testowe, które naprawią błąd 'is not defined'
const roomAnalysis = [
  { name: "Wiatrołap", area: 4.91, presence: 1, switch: 1, lightRelay: 2, shading: 1, heating: 1 },
  { name: "Spiżarnia", area: 2.95, presence: 1, switch: 1, lightRelay: 1, shading: 0, heating: 0 },
  { name: "Kuchnia", area: 25.63, presence: 1, switch: 2, lightRelay: 2, shading: 1, heating: 1 },
  { name: "Salon + Jadalnia", area: 53.03, presence: 2, switch: 2, lightRelay: 4, shading: 4, heating: 1 },
  { name: "Garaż", area: 34.20, presence: 1, switch: 1, lightRelay: 2, shading: 0, heating: 0 },
  { name: "Kotłownia", area: 6.50, presence: 1, switch: 1, lightRelay: 1, shading: 0, heating: 1 }
];

export default function ClientWycenaView({ investment, quotation, onBack, onRefresh }) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showModal, setShowModal] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState(null);

  const GAS_URL = GAS_CONFIG.scriptUrl;

  const generatePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pl-PL');

    // --- KONFIGURACJA CZCIONKI ---
    doc.addFileToVFS("CustomFont.ttf", font);
    doc.addFont("CustomFont.ttf", "CustomFont", "normal");
    doc.addFont("CustomFont.ttf", "CustomFont", "bold");
    doc.setFont("CustomFont");

    // --- NAGŁÓWEK ---
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 10, 40, 15);
    } catch (e) {
      doc.setFontSize(22);
      doc.setTextColor(251, 146, 60);
      doc.setFont("CustomFont", "bold");
      doc.text("designiQ", 14, 20);
    }
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("CustomFont", "normal");
    doc.text(`Data: ${date}`, 196, 15, { align: 'right' });
    doc.text("Wstępna oferta techniczno-handlowa", 196, 20, { align: 'right' });

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 30, 196, 30);

    // --- SEKCJA INWESTYCJA ---
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.setFont("CustomFont", "bold");
    doc.text("Inwestycja:", 14, 38);
    doc.setFont("CustomFont", "normal");
    doc.text(investment.project_name || "---", 40, 38);

    let currentY = 48;
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    // --- GENEROWANIE TABEL ---
    Object.keys(categoryConfig).forEach((key) => {
      const items = quotation.items.filter(i => i.category === key);
      
      if (items.length > 0) {
        const config = categoryConfig[key];
        
        if (currentY > 230) { 
          doc.addPage(); 
          currentY = 20; 
        }

        // Nagłówek kategorii
        doc.setFillColor(51, 65, 85); 
        doc.rect(14, currentY - 5, 182, 8, 'F');
        doc.setFontSize(9);
        doc.setFont("CustomFont", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(config.label.toUpperCase(), 18, currentY + 0.5);
        
        const tableRows = items.map(item => {
          // Logika obliczeń:
          const unitPriceNet = item.unit_price;
          const lineNet = item.quantity * unitPriceNet;
          const vatRate = (item.vat_rate ?? 23);
          const lineGross = lineNet * (1 + vatRate / 100);
          const lineVat = lineGross - lineNet;

          // Akumulacja sum całkowitych
          totalNet += lineNet;
          totalVat += lineVat;
          totalGross += lineGross;

          return [
            item.name,
            item.quantity,
            `${unitPriceNet.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`,
            `${vatRate}%`,
            `${lineGross.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`
          ];
        });

        doc.autoTable({
          startY: currentY + 3,
          head: [['Nazwa pozycji', 'Ilość', 'Cena jedn. Netto', 'VAT', 'Suma Brutto']],
          body: tableRows,
          theme: 'grid',
          styles: { 
            font: "CustomFont", 
            fontSize: 8, 
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [241, 245, 249], 
            textColor: [30, 41, 59],
            fontStyle: 'bold',
            lineWidth: 0.1
          },
          columnStyles: {
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 35 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 35 }
          },
          margin: { left: 14, right: 14 }
        });

        currentY = doc.lastAutoTable.finalY + 12;
      }
    });

    // --- PODSUMOWANIE FINANSOWE ---
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    
    const summaryX = 130;
    doc.setFontSize(9);
    doc.setTextColor(50);
    
    // Netto
    doc.setFont("CustomFont", "normal");
    doc.text("Suma Netto:", summaryX, currentY);
    doc.text(`${totalNet.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`, 196, currentY, { align: 'right' });
    
    // VAT
    currentY += 5;
    doc.text("Suma VAT:", summaryX, currentY);
    doc.text(`${totalVat.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`, 196, currentY, { align: 'right' });

    // Brutto (Wyróżnione)
    currentY += 3;
    doc.setFillColor(251, 146, 60); 
    doc.rect(summaryX - 2, currentY, 68, 10, 'F');
    doc.setFont("CustomFont", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("SUMA BRUTTO:", summaryX, currentY + 6.5);
    doc.text(`${totalGross.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`, 194, currentY + 6.5, { align: 'right' });

    // --- ADNOTACJA ---
    currentY += 25;
    doc.setFontSize(8);
    doc.setFont("CustomFont", "normal");
    doc.setTextColor(120);
    const disclaimer = "Wycena ma charakter wstępny – dokładne koszty poznamy po doprecyzowaniu szczegółów. Materiały są tak oszacowane, aby ostateczne koszty nie zmieniły się znacząco.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitDisclaimer, 14, currentY);

    // --- STOPKA ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(`Wycena designiQ | Strona ${i} z ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Wycena_${investment.project_name.replace(/\s+/g, '_')}.pdf`);
  };

  if (!quotation) {
    return (
      <div className="space-y-4 pb-12">
        <Button onClick={onBack} variant="outline" className="mb-4 hover:bg-slate-100 border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" /> Powrót do statusu
        </Button>
        <Card className="border-2 border-slate-200 bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Wycena w przygotowaniu</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              Nasz zespół pracuje nad przygotowaniem szczegółowej wyceny Twojego projektu Smart Home.
              Zostaniesz poinformowany, gdy wycena będzie gotowa do przejrzenia.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalNet = quotation.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalGross = quotation.items.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price * (1 + (item.vat_rate ?? 23) / 100)), 0
  );
  const totalVat = totalGross - totalNet;

  const currentStatus = investment.quotation_status || "Czeka na akceptację";
  const isAccepted = currentStatus === "Zaakceptowana";

  const categoryConfig = {
    materials: { label: "Sprzęt i komponenty Smart Home", description: "sterowniki, rozszerzenia, czujniki", icon: <Smartphone className="text-orange-600" /> },
    cabling: { label: "Instalacja elektryczna i okablowanie", description: "przewody, puszki, montaż", icon: <Zap className="text-orange-600" /> },
    control_cabinet: { label: "Szafa sterownicza i infrastruktura", description: "obudowa, zasilacze, zabezpieczenia", icon: <Shield className="text-orange-600" /> },
    audio: { label: "Systemy Multiroom Audio", description: "głośniki, wzmacniacze, konfiguracja", icon: <Music className="text-orange-600" /> },
    security: { label: "Monitoring i bezpieczeństwo", description: "kamery, rejestratory, konfiguracja", icon: <Camera className="text-orange-600" /> },
    programming: { label: "Programowanie i logika systemu", description: "automatyzacje, scenariusze, testy", icon: <Lightbulb className="text-orange-600" /> },
    commissioning: { label: "Uruchomienie i szkolenie", description: "testy końcowe, przekazanie systemu", icon: <Home className="text-orange-600" /> },
    project: { label: "Projekt i dokumentacja", description: "schematy, dokumentacja techniczna", icon: <PenTool className="text-orange-600" /> },
    service: { label: "Serwis, wsparcie i gwarancja", description: "opieka powdrożeniowa, serwis", icon: <LifeBuoy className="text-orange-600" /> }
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsSubmitting(true);
    setSubmittingType(newStatus);
    
    // Kluczowe: upewniamy się, że mamy kod "DEMO"
    const code = investment.investment_code || investment.id;
    
    console.log("Próba aktualizacji statusu dla:", code, "na:", newStatus);

    const payload = {
      action: "updateInvestmentStatus",
      code: String(code).trim(),
      status: newStatus,
    };

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Błąd serwera");
      }

      toast.success(`Decyzja (${newStatus}) została wysłana.`);

      if (onRefresh) {
        setTimeout(async () => {
          await onRefresh();
          setShowModal(null);
          setIsSubmitting(false);
          setSubmittingType(null);
        }, 1500);
      } else {
        setShowModal(null);
        setIsSubmitting(false);
        setSubmittingType(null);
      }

    } catch (error) {
      console.error("Błąd wysyłania:", error);
      toast.error("Wystąpił problem techniczny.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-none mx-auto pb-12 px-0 sm:px-4 relative">
      
{showModal && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    {/* Dynamiczna szerokość: 'inventory' jest szeroki, pozostałe wąskie */}
    <Card className={`${showModal === 'inventory' ? 'max-w-6xl w-[95vw] h-[85vh]' : 'max-w-md w-full'} border-none shadow-2xl animate-in fade-in zoom-in duration-200 bg-white rounded-2xl overflow-hidden`}>
      
      {showModal === 'inventory' ? (
        /* --- OKNO NR 1: INWENTARYZACJA (TABELA) --- */
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-orange-600 rounded-lg text-white">
                      <Home className="w-5 h-5" />
                    </div>
                    Analiza techniczna pomieszczeń
                  </h3>
                  <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto p-4 sm:p-8 bg-white">
                  <InventoryTableContent rooms={investment.rooms || roomAnalysis} />
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end shrink-0">
                  <Button onClick={() => setShowModal(null)} className="bg-slate-900 text-white px-8 h-12 rounded-xl font-bold">
                    ZAMKNIJ PRZEGLĄDANIE
                  </Button>
                </div>
              </CardContent>
            ) : (
              /* --- OKNO NR 2: AKCEPTACJA LUB INFO (TWOJE STARE KODY) --- */
              <CardContent className="p-10">
                {showModal === 'info' ? (
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Wycena zaakceptowana</h3>
                      <p className="text-sm text-slate-500 leading-relaxed px-4">
                        Ta wycena została zatwierdzona {investment.accepted_at && (
                          <span className="font-semibold text-slate-900">
                            dnia {String(investment.accepted_at).substring(0, 10).split("-").reverse().join(".")}
                          </span>
                        )}.
                      </p>
                    </div>
                    <Button onClick={() => setShowModal(null)} className="w-full bg-slate-900 text-white font-semibold h-12 rounded-xl">
                      ZAMKNIJ
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-orange-50 text-orange-300 rounded-full flex items-center justify-center border border-orange-100">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Potwierdź decyzję</h3>
                    </div>
                    <div className="bg-orange-50/30 p-5 rounded-xl border border-orange-100 text-left">
                      <p className="text-sm text-slate-500">Wycena ma charakter wstępny – dokładne koszty poznamy po doprecyzowaniu szczegółów. Materiały są tak oszacowane, aby ostateczne koszty nie zmieniły się znacząco.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        disabled={isSubmitting}
                        onClick={() => handleStatusUpdate("Odrzucona")}
                        variant="outline" 
                        className="border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-semibold h-12 rounded-xl transition-all"
                      >
                        {isSubmitting && submittingType === 'Odrzucona' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Odrzuć"}
                      </Button>
                      <Button 
                        disabled={isSubmitting}
                        onClick={() => handleStatusUpdate("Zaakceptowana")}
                        className="bg-slate-900 text-white hover:bg-slate-800 font-semibold h-12 rounded-xl transition-all"
                      >
                        {isSubmitting && submittingType === 'Zaakceptowana' ? <Loader2 className="w-5 h-5 animate-spin" /> : "ZAAKCEPTUJ"}
                      </Button>
                    </div>
                    <button onClick={() => setShowModal(null)} className="text-xs text-slate-400 font-medium uppercase hover:text-slate-600 pt-2 transition-colors">
                      Wróć do przeglądania
                    </button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      <Button onClick={onBack} variant="outline" className="mb-4 hover:bg-slate-100 border-slate-200">
        <ArrowLeft className="w-4 h-4 mr-2" /> Powrót do statusu
      </Button>

      <Card className="border-2 border-orange-100 bg-[#FFF9F2] shadow-sm mb-6 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#1A202C] tracking-tight mb-6">Wycena projektu Smart Home</h1>
              <div className="flex flex-col space-y-3 text-sm mb-6">
                <div className="flex gap-2">
                  <span className="text-slate-500 font-normal">Projekt:</span> 
                  <span className="font-semibold text-slate-800 tracking-tight">
                    {investment.project_name || "N/A"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 font-normal">Zakres:</span> 
                  <span className="font-semibold text-slate-800 tracking-tight">
                    {investment.package_type || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-5 py-1.5 rounded-full font-medium text-sm border ${isAccepted ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-white text-orange-600 border-orange-200"}`}>
                  {currentStatus}
                </div>
                {investment.accepted_at && (
                  <div className="text-xs text-slate-400 font-normal">
                    Zatwierdzono: {String(investment.accepted_at).substring(0, 10).split("-").reverse().join(".")}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center lg:text-right bg-[#1A202C] text-white rounded-2xl p-8 lg:min-w-[320px] shadow-xl border border-slate-800">
              <div className="text-[15px] font-bold text-orange-400 tracking-[0.1em] mb-2">
                Całkowity koszt inwestycji
              </div>
              <div className="text-4xl font-bold mb-2 tracking-tight">
                {totalGross.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
              </div>
              <div className="text-[13px] text-slate-300 font-medium leading-relaxed">
                Cena zawiera VAT, materiały, montaż i uruchomienie
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`border-2 shadow-lg overflow-hidden relative ${isAccepted ? 'border-emerald-200 bg-emerald-50' : 'border-orange-500 bg-orange-600 text-white'}`}>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className={`text-xl font-bold mb-1 tracking-tight ${isAccepted ? 'text-emerald-900' : 'text-white'}`}>
              {isAccepted ? "Konfiguracja zatwierdzona" : "Gotowy na inteligentny dom?"}
            </h3>
            <p className={`${isAccepted ? 'text-emerald-600' : 'text-orange-100'} text-sm`}>
              {isAccepted ? "Rozpoczęliśmy proces realizacji Twojej inwestycji." : "Zaakceptuj wycenę, aby zarezerwować termin i rozpocząć proces projektowy."}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              onClick={() => setShowModal(isAccepted ? 'info' : 'accept')} 
              className={`${isAccepted ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'} font-bold px-8 py-6 h-auto shadow-lg flex-1 md:flex-none uppercase`}
            >
              {isAccepted ? "SZCZEGÓŁY AKCEPTACJI" : "AKCEPTUJĘ WYCENĘ"}
            </Button>
            <Button onClick={generatePDF} variant="outline" className={`px-4 h-auto ${isAccepted ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-orange-400 text-white hover:bg-orange-700'}`}>
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden mb-8">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-white gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl shrink-0">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Analiza techniczna pomieszczeń</h3>
                <p className="text-[13px] text-slate-500 leading-tight hidden sm:block">
                  Szczegółowa inwentaryzacja punktów elektrycznych i sterujących.
                </p>
              </div>
            </div>

            <Button 
              onClick={() => setShowModal('inventory')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 h-11 rounded-xl shadow-md transition-all font-bold uppercase tracking-wider text-[10px]"
            >
              <LayoutList className="w-4 h-4 mr-2" /> Zobacz zestawienie
            </Button>
          </div>
          
          <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            <p className="text-[11px] text-slate-500 italic">
              Dane podstawowe do doboru urządzeń i wyceny okablowania (dla czytelności tylko najważniejsze).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-orange-600 w-5 h-5" /> Szczegółowe zestawienie kosztów
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            {Object.keys(categoryConfig).map((key) => {
              const items = quotation.items.filter(i => i.category === key);
              if (items.length === 0) return null;
              const config = categoryConfig[key];
              const isExpanded = expandedCategories[key];
              const catNet   = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
              const catTotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price * (1 + (i.vat_rate ?? 23) / 100)), 0);
              return (
                <div key={key} className="bg-white">
                  <button 
                  onClick={() => setExpandedCategories(p => ({...p, [key]: !p[key]}))} 
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-orange-50/30 transition-all text-left"
                >
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    {/* shrink-0 zapobiega zgniataniu ikony */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0 mt-1 sm:mt-0">
                      {config.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
                        <h4 className="font-bold text-slate-900 leading-tight tracking-tight break-words pr-2">
                          {config.label}
                        </h4>
                        <span className="text-slate-400 font-medium text-xs whitespace-nowrap hidden sm:inline">
                          {catNet.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł netto /
                        </span>
                        <span className="text-orange-600 font-bold text-sm whitespace-nowrap">
                          {catTotal.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł brutto
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 italic leading-tight">
                        ({config.description})
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                  {isExpanded && (
                    // ZMIEŃ CAŁĄ TABELĘ NA TĘ WERSJĘ:
                    <div className="px-0 sm:px-5 pb-5 overflow-x-hidden"> {/* Ukryto boczny scroll, by wymusić dopasowanie */}
                      <table className="w-full text-[11px] sm:text-xs table-fixed sm:table-auto">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[8px] sm:text-[9px] tracking-widest border-b border-slate-200">
                          <tr>
                            <th className="p-2 sm:p-3 text-left w-[40%] sm:w-auto">Pozycja</th>
                            <th className="p-2 sm:p-3 text-center w-[10%] sm:w-auto">Ilość</th>
                            <th className="p-2 sm:p-3 text-right hidden sm:table-cell">Cena netto</th>
                            <th className="p-2 sm:p-3 text-center hidden sm:table-cell w-12">VAT</th>
                            <th className="p-2 sm:p-3 text-right hidden sm:table-cell">Netto</th>
                            <th className="p-2 sm:p-3 text-right hidden sm:table-cell">VAT zł</th>
                            <th className="p-2 sm:p-3 text-right w-[25%] sm:w-auto">Brutto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item, i) => {
                            const lineNet   = item.quantity * item.unit_price;
                            const vatRate   = item.vat_rate ?? 23;
                            const lineVat   = lineNet * vatRate / 100;
                            const lineGross = lineNet + lineVat;
                            return (
                              <tr key={i} className="text-slate-700 hover:bg-slate-50/50">
                                <td className="p-2 sm:p-3 font-medium leading-tight break-words">
                                  {item.name}
                                </td>
                                <td className="p-2 sm:p-3 text-center text-slate-400">
                                  {item.quantity}
                                </td>
                                <td className="p-2 sm:p-3 text-right text-slate-500 hidden sm:table-cell">
                                  {item.unit_price.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                                </td>
                                <td className="p-2 sm:p-3 text-center text-slate-400 hidden sm:table-cell text-[10px]">
                                  {vatRate}%
                                </td>
                                <td className="p-2 sm:p-3 text-right text-slate-500 hidden sm:table-cell">
                                  {lineNet.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                                </td>
                                <td className="p-2 sm:p-3 text-right text-slate-400 hidden sm:table-cell">
                                  {lineVat.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                                </td>
                                <td className="p-2 sm:p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                  {lineGross.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-b-xl flex flex-col items-end gap-2">
            <div className="flex justify-between w-full max-w-xs text-sm text-slate-400">
              <span>Wartość Netto:</span>
              <span>{totalNet.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-sm text-slate-400 border-b border-slate-700 pb-2">
              <span>Podatek VAT:</span>
              <span>{totalVat.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-2xl font-bold pt-2 text-orange-400 uppercase tracking-tight">
              <span>Razem:</span>
              <span>{totalGross.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-12 mt-12">
        <SmartHomeFeatures investment={investment} />
        <LoxonePromo />
        <SmartHomeCostComparison quotation={quotation} project={investment} />
        <ProjectTimeline quotation={quotation} project={investment} />
        <ValueExplanation quotation={quotation} project={investment} />
        <WarrantyAndSupport />
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-8">
        Wycena ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu Art. 66 par. 1 Kodeksu Cywilnego.
      </p>
    </div>
  );
}

function InventoryTableContent({ rooms }) {
  const data = rooms && rooms.length > 0 ? rooms : roomAnalysis;

  return (
    <div className="relative h-full w-full overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner">
      {/* table-layout-fixed to klucz do sukcesu */}
      <table className="w-full border-separate border-spacing-0 min-w-[800px] table-fixed">
        <thead>
          <tr className="text-[10px] uppercase font-bold text-slate-500">
            {/* Tutaj na sztywno 100px - ani grama więcej */}
            <th className="sticky top-0 left-0 z-[40] bg-slate-100 p-2 border-b border-r border-slate-200 text-left w-[100px]">
              Pomieszczenie
            </th>
            {/* Pozostałe kolumny mogą mieć auto lub stałą szerokość */}
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center w-[50px]">m²</th>
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center text-orange-600 w-[60px]">Infrastruktura</th>
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center text-blue-600 w-[60px]">Oświetlenie</th>
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center text-blue-400 w-[60px]">Ściemniane</th>
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center text-emerald-600 w-[70px]">Zacienianie</th>
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center text-red-600 w-[60px]">Ogrzewanie</th>
            <th className="sticky top-0 z-[30] bg-slate-50 p-2 border-b border-slate-200 text-center text-purple-600 w-[60px]">Audio</th>
          </tr>
        </thead>
        <tbody className="text-[11px]">
          {data.map((room, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50">
              {/* Tutaj też w-[100px] + overflow-hidden dla bezpieczeństwa */}
              <td className="sticky left-0 z-[20] bg-white p-2 font-bold text-slate-900 border-r border-slate-100 shadow-[1px_0_3px_rgba(0,0,0,0.05)] w-[100px] whitespace-normal break-words leading-[1.1] uppercase overflow-hidden">
                {room.name}
              </td>
              <td className="p-2 text-center text-slate-400 border-b border-slate-50 truncate">{room.area}</td>
              <td className="p-2 text-center font-black text-orange-600 border-b border-slate-50">{(room.presence || 0) + (room.switch || 0)}</td>
              <td className="p-2 text-center font-bold text-slate-700 border-b border-slate-50">{room.lightRelay || 0}</td>
              <td className="p-2 text-center font-bold text-blue-400 border-b border-slate-50">{room.lightDim || 0}</td>
              <td className="p-2 text-center font-black text-emerald-600 border-b border-slate-50">{room.shading || 0}</td>
              <td className="p-2 text-center font-black text-red-600 border-b border-slate-50">{room.heating || 0}</td>
              <td className="p-2 text-center font-black text-purple-600 border-b border-slate-50">{room.audio || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}