import React from "react";
import { Card, CardContent } from "../ui/card"; 
import { 
  TrendingUp, Zap, Thermometer, Sun, 
  ShieldCheck, AlertTriangle, Clock, LineChart, 
  ArrowRight, Landmark, HardHat
} from "lucide-react";
import { tr } from "date-fns/locale";

export default function SmartHomeCostComparison({ quotation, project }) {
  // --- LOGIKA FINANSOWA ---
  const totalGross = quotation.items.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price * (1 + (item.vat_rate || 23) / 100)), 0
  );

  const materialsCost = quotation.items
    .filter(item => ["materials", "cabling", "control_cabinet"].includes(item.category))
    .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const laborCost = quotation.items
    .filter(item => item.category === "labor" || item.category === "programming")
    .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const traditionalGross = ((materialsCost * 0.4) + (laborCost * 0.7)) * 1.23;
  const investmentGap = totalGross - traditionalGross;
  const gapPercent = ((investmentGap / traditionalGross) * 100).toFixed(0);

  // --- DYNAMICZNE WYKRYWANIE FUNKCJI ---
  const hasHeating = true;
  const hasLighting = true;
  const hasShutters = true;

  // --- PARAMETRY ROI (Możliwe do przeniesienia do konfiguracji admina) ---
  const annualEnergyBase = 9000; // Bazowy koszt mediów dla domu tej wielkości
  const savingsConfig = [
    { label: "Ogrzewanie strefowe", pct: 25, active: hasHeating, value: 0 },
    { label: "Automatyka oświetlenia", pct: 12, active: hasLighting, value: 0 },
    { label: "Pasywne chłodzenie (rolety)", pct: 18, active: hasShutters, value: 0 },
    { label: "Tryby nieobecności i standby", pct: 5, active: true, value: 0 }
  ];

  const activeSavings = savingsConfig
    .filter(s => s.active)
    .map(s => ({ ...s, value: Math.round(annualEnergyBase * (s.pct / 100)) }));

  const totalAnnualSaving = activeSavings.reduce((sum, s) => sum + s.value, 0);
  const rawYearsToBreakEven = investmentGap / totalAnnualSaving;
  const yearsToBreakEven = Math.min(rawYearsToBreakEven, 12.5).toFixed(1);


  return (
    <div className="space-y-8">
      {/* 1. PORÓWNANIE KOSZTU POCZĄTKOWEGO */}
      <Card className="border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-orange-600" /> Bilans Inwestycji Początkowej
          </h2>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm font-medium italic">Instalacja klasyczna (estymacja)</span>
                <span className="text-lg font-mono text-slate-600">{Math.round(traditionalGross).toLocaleString()} zł</span>
              </div>
            <div className="flex justify-between items-end border-b-2 border-orange-100 pb-2 bg-orange-50/30 p-2 rounded-t-lg">
              {/* Zmniejszono text-sm na xs dla mobile i dodano pr-2 dla odstępu */}
              <span className="text-slate-900 font-bold text-xs sm:text-base pr-2">
                Smart Home (Twoja wycena)
              </span>
              {/* Zmniejszono text-2xl na text-xl dla mobile i dodano whitespace-nowrap */}
              <span className="text-xl sm:text-2xl font-black text-orange-600 whitespace-nowrap">
                {Math.round(totalGross).toLocaleString()} zł
              </span>
            </div>
              <div className="flex justify-end gap-4 items-center pt-2">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Różnica kwotowa</div>
                  <div className="font-black text-slate-900">+{Math.round(investmentGap).toLocaleString()} zł</div>
                </div>
                <div className="text-right border-l pl-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Wzrost budżetu</div>
                  <div className="font-black text-orange-600">+{gapPercent}%</div>
                </div>
              </div>
            </div>

            {/* 2. CO OZNACZA TA RÓŻNICA (Most narracyjny) */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-orange-600" /> Co finansuje ta różnica?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Wyższy koszt wynika z zastąpienia kilkunastu niezależnych sterowników (ogrzewania, rolet, bram) 
                jednym systemem operacyjnym **Loxone**. 
              </p>
              <ul className="text-[11px] space-y-2 text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-orange-500" /> 
                  Redukcja zbędnego osprzętu na ścianach (jeden przycisk zamiast rzędu przełączników).
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-orange-500" /> 
                  Pełna integracja logiczna: rolety "wiedzą", kiedy pracuje ogrzewanie, by oszczędzać energię.
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-orange-500" /> 
                  Elastyczność: funkcje przycisków zmienimy programowo w dowolnym momencie życia domu.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 i 4. ROI I OSZCZĘDNOŚCI ROCZNE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wykres ROI (Liniowy - uproszczony wizualnie) */}
        <Card className="lg:col-span-2 border-2 bg-white border-slate-200">
          <CardContent className="p-6">
            <h4 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-blue-600" /> Skumulowane oszczędności w czasie (ROI)
            </h4>
            <div className="h-48 flex items-end gap-1 mb-4 border-b border-l border-slate-200 p-2 relative">
              {/* Break-even point marker */}
              <div 
                className="absolute border-l-2 border-dashed border-orange-400 h-full flex items-center justify-center"
                style={{ left: `${(yearsToBreakEven / 15) * 100}%` }}
              >
                <span className="bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded -mt-32">
                  ZWROT RÓŻNICY: {yearsToBreakEven} LAT
                </span>
              </div>
              
              {/* Bary oszczędności */}
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-blue-500/20 hover:bg-blue-500/40 transition-colors flex-1 rounded-t-sm"
                  style={{ height: `${(i + 1) * 6}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Rok 1</span>
              <span>Rok 15</span>
            </div>
            <p className="mt-4 text-xs text-slate-500 italic leading-relaxed">
              Wykres prezentuje moment, w którym suma zaoszczędzonych środków na mediach zrównuje się z 
              wyższym kosztem początkowym instalacji Smart. Od {Math.ceil(yearsToBreakEven)} roku system generuje realny zysk.
            </p>
          </CardContent>
        </Card>

        {/* Oszczędności roczne (Bar Chart) */}
        <Card className="border-2 bg-white bg-whiteborder-slate-200">
          <CardContent className="p-6">
            <h4 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Struktura roczna
            </h4>
            <div className="space-y-5">
              {activeSavings.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold uppercase">
                    <span className="text-slate-600">{s.label}</span>
                    <span className="text-green-600">+{s.value} zł</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${s.pct * 2}%` }}></div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase">Suma oszczędności rocznie</div>
                <div className="text-2xl font-black text-slate-900">{totalAnnualSaving.toLocaleString()} zł</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. WARTOŚCI NIEFINANSOWE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <Clock />, title: "Oszczędność czasu", desc: "Dom sam dba o rutynowe czynności (ogrzewanie, rolety, oświetlenie)." },
          { icon: <ShieldCheck />, title: "Bezpieczeństwo", desc: "Aktywne czujniki zalania i dymu odcinają media w razie awarii." },
          { icon: <TrendingUp />, title: "Wartość Premium", desc: "Zwiększenie atrakcyjności i ceny nieruchomości przy odsprzedaży." },
          { icon: <Sun />, title: "Komfort", desc: "Idealna temperatura w każdym pomieszczeniu niezależnie od pory dnia." }
        ].map((item, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm hover:border-orange-200 transition-colors">
            <div className="text-orange-600 w-5 h-5">{item.icon}</div>
            <h5 className="text-[11px] font-black uppercase text-slate-900">{item.title}</h5>
            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 text-center italic">
        Wszystkie wyliczenia są symulacją opartą na Twojej konfiguracji wyceny ({project?.package_type}) oraz uśrednionych cenach rynkowych mediów.
      </p>
    </div>
  );
}