import React from "react";
import { Card, CardContent } from "../ui/card";
import { Sparkles, TrendingUp, Zap, Shield, PenTool, Ticket } from "lucide-react";

export default function ValueExplanation({ quotation, project }) {
  const hasProgramming = quotation.items.some(item => item.category === "programming");
  const hasCommissioning = quotation.items.some(item => item.category === "commissioning");
  const hasControlCabinet = quotation.items.some(item => item.category === "control_cabinet");

  return (
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-600" /> Na co wpływa cena Twojego Smart Home?
          </h2>
      </div>

      <CardContent className="p-8">
        <div className="space-y-8">
          <p className="text-slate-700 leading-relaxed font-medium">
            Różnica w cenie to nie tylko koszty sprzętu. To inwestycja w kompleksowy system, który zmienia sposób, 
            w jaki funkcjonuje Twój dom. Oto, za co faktycznie płacisz:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hasProgramming && (
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="p-2 bg-orange-50 rounded-lg w-fit"><Zap className="w-6 h-6 text-orange-600" /></div>
                <h4 className="font-black text-xs uppercase text-slate-900">Indywidualne programowanie</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To "mózg" całego systemu. Setki godzin pracy programisty nad logiką, która sprawia, że dom faktycznie myśli za Ciebie i reaguje na Twoje potrzeby.
                </p>
              </div>
            )}

            {hasControlCabinet && (
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="p-2 bg-orange-50 rounded-lg w-fit"><PenTool className="w-6 h-6 text-orange-600" /></div>
                <h4 className="font-black text-xs uppercase text-slate-900">Profesjonalna prefabrykacja</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Serca systemu nie budujemy u Ciebie na ścianie. Rozdzielnica powstaje w naszym warsztacie, jest testowana i dostarczana jako gotowy, certyfikowany moduł.
                </p>
              </div>
            )}

            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl space-y-3">
              <div className="p-2 bg-slate-800 rounded-lg w-fit"><TrendingUp className="w-6 h-6 text-orange-400" /></div>
              <h4 className="font-black text-xs uppercase tracking-tight text-orange-400">System modułowy</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                W klasycznej instalacji zmiana funkcji to kucie ścian. W Smart Home to często tylko zmiana w konfiguracji - system rośnie wraz z Twoimi potrzebami.
              </p>
            </div>
          </div>

          <div className="p-6 bg-orange-100/50 rounded-2xl border-2 border-orange-200">
            <p className="text-sm text-orange-900 font-bold mb-2 uppercase tracking-tight italic">
              💡 Podsumowanie:
            </p>
            <p className="text-sm text-orange-800 leading-relaxed">
              Różnica w cenie to nie koszt sprzętu - to inwestycja w komfort, bezpieczeństwo, oszczędność energii 
              i system, który rozwija się wraz z Tobą, zamiast stawać się przestarzałym w dniu montażu.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}