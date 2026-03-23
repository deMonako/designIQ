import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { 
  Lightbulb, Sun, Thermometer, ShieldCheck, 
  Wind, Music, ChevronRight, Sparkles, BatteryCharging, 
  Lock, Camera, Network, Plug, Zap, Smartphone, ToolCase
} from "lucide-react";

export default function SmartHomeFeatures({ investment }) {
  const [activeKey, setActiveKey] = useState(null);

  const featureDatabase = {
    oswietlenie: {
      label: "Oświetlenie",
      icon: <Lightbulb />, // podmień ikonę po imporcie
      description:
        "System zarządza oświetleniem w oparciu o sceny, harmonogramy oraz czujniki obecności. Automatycznie dopasowuje natężenie i charakter światła do pory dnia, aktywności domowników i warunków w pomieszczeniu, zapewniając komfort oraz oszczędność energii."
    },

    zacienianie: {
      label: "Zacienianie",
      icon: <Sun />, 
      description:
        "Rolety, żaluzje i osłony okienne sterowane są automatycznie lub manualnie z aplikacji. System reaguje na nasłonecznienie i temperaturę – latem ogranicza przegrzewanie, a zimą wspiera izolację cieplną budynku."
    },

    klimat: {
      label: "Klimat",
      icon: <Thermometer />, 
      description:
        "Moduł odpowiada za komfort cieplny i jakość powietrza w domu. Steruje ogrzewaniem, chłodzeniem i wentylacją – w zależności od zastosowanych instalacji. System działa zarówno w prostych układach, jak i w rozbudowanych systemach z klimatyzacją, rekuperacją czy pompą ciepła."
    },

    energia: {
      label: "Energia",
      icon: <BatteryCharging />, 
      description:
        "System monitoruje zużycie energii elektrycznej i optymalizuje jej wykorzystanie. Integruje się z fotowoltaiką, magazynem energii czy ładowarką samochodu elektrycznego – jeżeli są dostępne – lub działa jako narzędzie kontroli i analizy zużycia w standardowej instalacji."
    },

    kontrola_dostepu: {
      label: "Kontrola dostępu",
      icon: <Lock />, 
      description:
        "Zarządzanie dostępem do domu i posesji z poziomu aplikacji. System obsługuje kody, harmonogramy, aplikację mobilną oraz historię wejść. Może współpracować z furtką, drzwiami i innymi punktami dostępu."
    },

    bezpieczenstwo: {
      label: "Bezpieczeństwo",
      icon: <ShieldCheck />, 
      description:
        "System bezpieczeństwa oparty o czujniki ruchu, otwarcia i zdarzeń. W razie zagrożenia uruchamia zaprogramowane reakcje domu, takie jak alarm, oświetlenie czy powiadomienia, zwiększając realne bezpieczeństwo mieszkańców."
    },

    monitoring: {
      label: "Monitoring",
      icon: <Camera />, 
      description:
        "Monitoring wideo zintegrowany z logiką domu. Umożliwia podgląd kamer, nagrywanie zdarzeń oraz automatyczne reakcje systemu na wykryty ruch lub inne sytuacje."
    },

    audio: {
      label: "Audio",
      icon: <Music />, 
      description:
        "System audio pozwala na odtwarzanie muzyki w wybranych strefach domu. Sterowanie odbywa się z aplikacji lub poprzez sceny, umożliwiając płynne dopasowanie dźwięku do codziennych aktywności."
    },

    siec: {
      label: "Sieć komputerowa",
      icon: <Network />, 
      description:
        "Stabilna i bezpieczna infrastruktura sieciowa dla całego domu. Obejmuje sieć LAN, Wi-Fi oraz przygotowanie pod systemy smart home, monitoring i zdalny dostęp, zapewniając niezawodne działanie wszystkich instalacji."
    },

    elementy_uzytkowe: {
      label: "Elementy użytkowe",
      icon: <Plug />, 
      description:
        "Integracja codziennych elementów domu, takich jak bramy, inteligentne gniazdka czy wybrane obwody. Pozwala na automatyzację prostych czynności i zwiększenie wygody użytkowania."
    },

    automatyzacje: {
      label: "Automatyzacje",
      icon: <Zap />, 
      description:
        "Logika i inteligencja systemu smart home. Automatyzacje łączą wszystkie moduły w spójne sceny i reakcje, takie jak tryb nocny, wyjście z domu czy symulacja obecności."
    },

    aplikacja: {
      label: "Aplikacja",
      icon: <Smartphone />, 
      description:
        "Centralne narzędzie do sterowania całym domem. Aplikacja umożliwia kontrolę systemu, podgląd stanu instalacji oraz zarządzanie użytkownikami z dowolnego miejsca."
    }
  };

  const activeFeatures = Object.entries(featureDatabase).map(([key, val]) => ({ key, ...val }));

  useEffect(() => {
    if (!activeKey) setActiveKey(activeFeatures[0].key);
  }, []);

  return (
    <Card className="border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-600" /> Zakres funkcjonalny Twojego systemu
        </h2>
      </div>

      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[500px]">
            
            {/* LEWA STRONA: SIATKA PRZYCISKÓW (3 W RZĘDZIE) */}
            <div className="lg:w-1/2 bg-white p-6">
                <div className="grid grid-cols-3 gap-3">
                    {activeFeatures.map((feature) => (
                    <button
                        key={feature.key}
                        onClick={() => setActiveKey(feature.key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border-2 min-h-[110px] ${
                        activeKey === feature.key 
                            ? 'bg-orange-50 border-orange-500 shadow-sm' 
                            : 'bg-slate-50 border-transparent hover:border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                    >
                        <div className={`p-2.5 rounded-xl mb-2 transition-colors duration-300 ${
                            activeKey === feature.key ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-100'
                        }`}>
                            {React.cloneElement(feature.icon, { size: 20 })}
                        </div>
                        <span className={`font-bold text-[10px] uppercase tracking-tight leading-tight text-center ${
                            activeKey === feature.key ? 'text-orange-900' : 'text-slate-500'
                        }`}>
                            {feature.label}
                        </span>
                    </button>
                    ))}
                </div>
            </div>

            {/* PRAWA STRONA: OPISY POD IKONAMI NA MOBILE */}
            <div className="lg:w-1/2 bg-slate-50/30 relative min-h-[400px] sm:min-h-[500px] overflow-hidden">
                <div className="relative h-full w-full">
                    {activeFeatures.map((f) => (
                    <div
                        key={f.key}
                        className={`
                        /* Zmiana: na mobile używamy 'relative' zamiast 'absolute inset-0', aby treść zajmowała miejsce */
                        /* Zmiana: 'hidden' dla nieaktywnych, 'flex' dla aktywnego na mobile */
                        ${activeKey === f.key 
                            ? "relative opacity-100 translate-y-0 scale-100 z-10 flex" 
                            : "absolute inset-0 opacity-0 translate-y-12 scale-95 z-0 pointer-events-none hidden lg:flex"}
                        p-8 lg:p-12 transition-all duration-700 ease-in-out flex-col justify-center
                        `}
                    >
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-md border border-orange-100 flex items-center justify-center text-orange-600 mb-8">
                            {React.cloneElement(f.icon, { size: 40, strokeWidth: 1.5 })}
                        </div>

                        <h3 className="text-3xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
                            {f.label}
                        </h3>
                        
                        <div className="max-w-md">
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {f.description}
                            </p>
                        </div>

                        <div className="mt-10 pt-6 border-t border-slate-200/60 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                Dostępne w systemie Loxone
                            </span>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}