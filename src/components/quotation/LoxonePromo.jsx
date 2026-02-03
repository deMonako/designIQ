import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Zap, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const LoxonePromo = () => {
  return (
    <Card className="border-2 border-slate-200 shadow-md overflow-hidden bg-white">
      <div className="flex flex-col lg:flex-row items-stretch">
        
        {/* LEWA STRONA: NAGŁÓWEK + TREŚĆ */}
        <div className="flex-1 flex flex-col">
          {/* PASEK NAGŁÓWKA - kończy się tam, gdzie zaczyna się zielona plansza */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative z-10">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" /> Poznaj pełną potęgę systemu Loxone
            </h2>
          </div>

          <div className="p-8 lg:p-10 flex-1 flex flex-col justify-center">
            {/* <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-[0.2em] bg-green-50 px-3 py-1 rounded-full border border-green-100">
                Potęga integracji
              </span>
            </div>
             */}
            <p className="text-slate-600 leading-relaxed mb-8 text-sm lg:text-base">
              Smart Home to coś więcej niż sterowanie oświetleniem. To integracja kluczowych systemów,
              dzięki której urządzenia w domu współpracują ze sobą — od fotowoltaiki i pompy ciepła,
              po rekuperację oraz urządzenia AGD.
              Poniżej możesz <strong>zobaczyć, jak takie integracje działają w praktyce </strong> 
              na przykładzie połączenia twojej przeglądarki z biurem designIQ w Bydgoszczy.
            </p>

            {/* <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> 100% Prywatności (Local Cloud)
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Reakcja systemu w 30ms
              </div>
            </div> */}

            <Button 
              onClick={() => window.open('/instalator', '_blank')}
              className="group bg-slate-900 hover:bg-[#569424] text-white px-8 h-14 rounded-xl font-bold transition-all shadow-lg flex items-center gap-3 w-full sm:w-auto uppercase tracking-wider"
            >
              PRZETESTUJ INTERAKTYWNIE
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* PRAWA STRONA: ZIELONA PLANSZA WCHODZĄCA NA NAGŁÓWEK */}
        <div className="hidden lg:flex lg:w-1/3 bg-[#569424] relative items-center justify-center overflow-hidden lg:-mt-[36px] z-20">
          {/* -mt-[36px] przesuwa planszę do góry o połowę wysokości paska nagłówka (72px / 2) */}
          
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
          
          <div className="relative z-10 text-center p-6">
            <div className="text-5xl font-black text-white/20 mb-2 select-none tracking-tighter uppercase">
              LOXONE
            </div>
            <div className="text-[10px] font-bold text-white tracking-[0.4em] uppercase opacity-90">
              Smart Home Engine
            </div>
          </div>

          {/* ANIMACJE PULSOWANIA */}
          <motion.div
            animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-40 h-40 border-2 border-white/30 rounded-full"
          />
          
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-64 h-64 border border-white/10 rounded-full"
          />
        </div>
      </div>
    </Card>
  );
};

export default LoxonePromo;