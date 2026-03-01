import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Server, Globe, Sun, ThermometerSun, Activity,
  Radio, Blocks, ShieldCheck, Heart, Power
} from "lucide-react";

const GAS_URL = process.env.REACT_APP_GAS_LOXONE_URL;

export default function Instalator() {
  const [particles, setParticles] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const lastCallRef = useRef(0);

  // Natywny throttle bez lodash (1 wywołanie na sekundę, leading edge)
  const sendToLoxone = useCallback(() => {
    const now = Date.now();
    if (now - lastCallRef.current < 1000) return;
    lastCallRef.current = now;
    setIsConnecting(true);
    fetch(GAS_URL).finally(() => {
      setTimeout(() => setIsConnecting(false), 800);
    });
  }, []);

  const handleButtonClick = () => {
    const id = Date.now();
    const newParticle = {
      id,
      x: Math.random() * 200 - 100,
      y: Math.random() * -80 - 20,
      color: ["text-orange-600", "text-slate-900"][Math.floor(Math.random() * 2)]
    };
    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 1000);
    sendToLoxone();
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* SEKCOJA PROOF OF CONCEPT */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>Interaktywny Pokaz Możliwości</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1]">
              Loxone: Serce Twojej <span className="text-orange-600">Integracji.</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Prawdziwy Smart Home zaczyna się tam, gdzie urządzenia zaczynają ze sobą współpracować. 
              <strong> Naszą specjalnością jest łączenie technologii</strong> w jeden spójny system, który dba o Twój komfort i portfel.
            </p>
            
            <div className="space-y-4 pt-4 text-slate-700">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="text-orange-600 w-5 h-5" />
                <span>Bezpieczne połączenie szyfrowane</span>
              </div>
              <div className="flex items-center space-x-3">
                <Blocks className="text-orange-600 w-5 h-5" />
                <span>Płynna wymiana danych w czasie rzeczywistym</span>
              </div>
            </div>
          </motion.div>

          {/* INTERAKTYWNY PANEL */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-orange-100/50 rounded-[3rem] blur-2xl group-hover:bg-orange-200/50 transition-all"></div>
            <div className="relative bg-white border-2 border-slate-100 rounded-[2.5rem] p-12 shadow-2xl text-center">
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ opacity: 0, x: p.x, y: 0 }}
                    animate={{ opacity: 1, y: p.y - 100 }}
                    exit={{ opacity: 0 }}
                    className={`absolute left-1/2 font-black text-xl ${p.color} pointer-events-none whitespace-nowrap`}
                  >
                    IMPULS! ⚡
                  </motion.span>
                ))}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleButtonClick}
                aria-label="Wyślij impuls do systemu Loxone"
                className="relative w-40 h-40 bg-orange-600 rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center group mx-auto"
              >
                <Zap className={`w-12 h-12 text-white transition-all ${isConnecting ? 'scale-125' : ''}`} />
              </motion.button>
              
              <div className="mt-8">
                <h4 className="font-bold text-slate-900 uppercase tracking-tighter">Kliknij, aby ziryt... przetestować</h4>
                <p className="text-sm text-slate-400 mt-1 uppercase font-bold tracking-widest">Każdorazowe kliknięcie aktywuje buczek w biurze designIQ</p>
              </div>
            </div>
          </div>
        </div>

        {/* GRAFICZNE PRZEDSTAWIENIE PRZEPŁYWU */}
        <div className="bg-slate-50 rounded-[3rem] p-8 lg:p-16 mb-32">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-900 uppercase">Ścieżka komunikacji</h3>
            <p className="text-slate-500 mt-2">Zobacz, jak Twoje kliknięcie zmienia się w fizyczną akcję</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 lg:gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-dashed bg-slate-200 -translate-y-1/2 z-0" />

            {[
              { icon: Globe, label: "Interfejs WWW", desc: "Twoja przeglądarka", color: "bg-blue-500" },
              { icon: Server, label: "Chmura Obliczeniowa", desc: "Przetworzenie danych", color: "bg-orange-600" },
              { icon: Radio, label: "Loxone Miniserver", desc: "Odebranie instrukcji", color: "bg-green-600" },
              { icon: Zap, label: "Fizyczny Efekt", desc: "Akcja w budynku", color: "bg-slate-900" }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <h5 className="font-bold text-slate-900 text-sm uppercase">{step.label}</h5>
                <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SEKCJA: SCENARIUSZE ENERGETYCZNE */}
        <div className="mt-32 space-y-20">
          <div className="text-center">
            <h3 className="text-3xl lg:text-5xl font-black text-slate-900 mb-6 uppercase italic">
              Co to oznacza dla <span className="text-orange-600">Twojego domu?</span>
            </h3>
            <p className="text-slate-600 max-w-3xl mx-auto text-lg leading-relaxed">
              Powyższy interfejs to dopiero jeden z wielu przykładów zastosowania Loxone do nieszablonowych połączeń.
              Integracja urządzeń firm trzecich (takich jak Fronius, Viessmann, Daikin, Vaillant i wiele innych) 
              pozwala na stworzenie ekosystemu, który myśli za Ciebie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* KARTA 1: FOTOWOLTAIKA */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sun className="w-32 h-32 text-orange-600" />
              </div>
              <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-6 text-slate-900 flex items-center">
                  <Power className="mr-3 text-orange-600" /> Inteligencja Energetyczna
                </h4>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Loxone płynnie komunikuje się z Twoim falownikiem. Gdy system wykryje nadwyżkę produkcji, 
                  automatycznie kieruje ją tam, gdzie jest najbardziej potrzebna.
                </p>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-orange-500">
                    <p className="font-bold text-slate-900 text-sm italic">„Włącz klimatyzację i schłodź salon za darmo, zanim wrócę z pracy”</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-orange-500">
                    <p className="font-bold text-slate-900 text-sm italic">„Dogrzej wodę w basenie lub zasobniku CWU wykorzystując 100% słońca”</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KARTA 2: POMPA CIEPŁA */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <ThermometerSun className="w-32 h-32 text-blue-600" />
              </div>
              <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-6 text-slate-900 flex items-center">
                  <Heart className="mr-3 text-blue-600" /> Zarządzanie Klimatem
                </h4>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Twoja pompa ciepła zyskuje dostęp do prognozy pogody i informacji o obecności domowników, 
                  pracując zawsze w najbardziej ekonomicznym trybie.
                </p>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-blue-500">
                    <p className="font-bold text-slate-900 text-sm italic">„Obniż temperaturę w nieużywanych pokojach i oszczędzaj na ogrzewaniu”</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-blue-500">
                    <p className="font-bold text-slate-900 text-sm italic">„Wykorzystaj bezwładność podłogówki, by kumulować ciepło w tańszej taryfie”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEKCOJA "INTEGRACJA TO NASZA SIŁA" */}
        <div className="grid md:grid-cols-3 gap-12 mt-32 border-t border-slate-100 pt-20">
          <div className="space-y-4">
            <h4 className="font-bold text-xl text-orange-600 uppercase tracking-tighter italic">Wszechstronność</h4>
            <p className="text-slate-600 leading-relaxed">Łączymy światy KNX, Modbus, DALI i nowoczesne rozwiązania bezprzewodowe w jeden, intuicyjny system sterowania.</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-xl text-orange-600 uppercase tracking-tighter italic">Komfort</h4>
            <p className="text-slate-600 leading-relaxed">Dzięki precyzyjnej integracji, Twój dom sam reaguje na zmiany temperatury, wilgotności czy poziomu CO2.</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-xl text-orange-600 uppercase tracking-tighter italic">Przyszłość</h4>
            <p className="text-slate-600 leading-relaxed">System Loxone jest gotowy na nowe technologie. Rozbudowa o ładowarkę EV czy sterowanie nowymi urządzeniami to czysta przyjemność.</p>
          </div>
        </div>


      </div>
    </div>
  );
}