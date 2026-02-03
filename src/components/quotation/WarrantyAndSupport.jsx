import React from "react";
import { Card, CardContent } from "../ui/card";
import { ShieldCheck, LifeBuoy, Clock, Wrench } from "lucide-react";

export default function WarrantyAndSupport() {
  const perks = [
    { 
      icon: <ShieldCheck className="w-5 h-5 text-orange-600" />, 
      title: "24 miesiące gwarancji", 
      desc: "Pełna opieka nad sprzętem i instalacją w ramach standardowej umowy." 
    },
    { 
      icon: <LifeBuoy className="w-5 h-5 text-orange-600" />, 
      title: "Zdalne wsparcie", 
      desc: "Szybka pomoc techniczna przez VPN bez konieczności wizyty na budowie." 
    },
    { 
      icon: <Clock className="w-5 h-5 text-orange-600" />, 
      title: "Aktualizacje systemu", 
      desc: "Twój system Loxone będzie zawsze posiadał najnowsze funkcje bezpieczeństwa." 
    },
    { 
      icon: <Wrench className="w-5 h-5 text-orange-600" />, 
      title: "Serwis pogwarancyjny", 
      desc: "Możliwość wykupienia pakietu stałej opieki nad Twoim Smart Home." 
    }
  ];

  return (
    <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-orange-600" /> Wsparcie i gwarancja
          </h2>
        </div>
        
        {/* DODANO PADDING p-8 ORAZ gap-y-8 DLA ODSTĘPU OD KRAWĘDZI I MIĘDZY WIERSZAMI */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {perks.map((perk, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 shrink-0">{perk.icon}</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-[15px] tracking-normal">
                    {perk.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5 tracking-wide">
                    {perk.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}