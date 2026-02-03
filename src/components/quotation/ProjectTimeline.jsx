import React from "react";
import { Card, CardContent } from "../ui/card";
import { Clock } from "lucide-react";

export default function ProjectTimeline({ quotation }) {
  // --- IDENTYCZNA LOGIKA JAK W SMARTHOMECOSTCOMPARISON ---
  const getSum = (categories) => {
    if (!quotation || !quotation.items) return 0;
    return quotation.items
      .filter(item => categories.includes(item.category))
      .reduce((sum, item) => {
        const net = item.quantity * item.unit_price;
        const vat = 1 + (item.vat_rate || 23) / 100;
        return sum + (net * vat);
      }, 0);
  };

  const totalGross = quotation?.items?.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price * (1 + (item.vat_rate || 23) / 100)), 0
  ) || 0;

  // Obliczenia na podstawie Twoich kategorii z kosztorysu
  const p1_project = getSum(['project']) * 0.7;
  const p2_materials = getSum(['materials', 'cabling', 'control_cabinet']) * 0.7; 
  const p4_commissioning = getSum(['commissioning', 'audio', 'security', 'programming']) * 0.8 + getSum(['materials', 'cabling', 'control_cabinet']) * 0.3;
  
  // Reszta do 100% (gwarantuje poprawność sumy końcowej)
  const p7_final = totalGross - p1_project - p2_materials - p4_commissioning;

  const format = (val) => {
    return val.toLocaleString('pl-PL', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + " zł";
  };

  const stages = [
    { title: "Projektowanie", context: "Przed instalacją", payment: p1_project > 0 ? `Zaliczka: ${format(p1_project)}` : null },
    { title: "Kompletacja", context: "W trakcie kablowania", payment: p2_materials > 0 ? `Materiały: ${format(p2_materials)}` : null },
    { title: "Prefabrykacja", context: "Równolegle z budową" },
    { title: "Montaż szafy", context: "Po kablowaniu", payment: p4_commissioning > 0 ? `Zaliczka: ${format(p4_commissioning)}` : null },
    { title: "Programowanie", context: "Po montażu" },
    { title: "Uruchomienie", context: "Końcowy etap" },
    { title: "Szkolenie", context: "Przekazanie", payment: p7_final > 0 ? `Końcowa: ${format(p7_final)}` : null },
    { title: "Wsparcie", context: "Opieka" }
  ];

  const firstColumn = stages.slice(0, 4);
  const secondColumn = stages.slice(4, 8);

  const renderStage = (stage, index, actualIndex) => (
    <div key={actualIndex} className="flex items-start gap-3 group py-2">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10 shrink-0 group-hover:border-orange-500 transition-colors shadow-sm">
          <span className="text-[9px] font-black text-slate-400 group-hover:text-orange-600">
            {actualIndex + 1}
          </span>
        </div>
        {index !== 3 && <div className="w-[1px] h-8 bg-slate-200" />}
      </div>
      <div className="flex-1 pt-0.5">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h3 className="font-black uppercase text-[13px] text-slate-900 tracking-normal leading-none">
              {stage.title}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 leading-none">{stage.context}</p>
          </div>
          {stage.payment && (
            <div className="text-right shrink-0">
              <span className="text-[11px] font-black text-orange-400 bg-white px-2 py-1 rounded border border-orange-200 tracking-normal shadow-sm">
                {stage.payment}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" /> Harmonogram i etapy płatności
          </h2>
        </div>

        {/* CZYSTY BIAŁY KONTENT - lepsza czytelność */}
        <div className="p-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <div className="space-y-4">
              {firstColumn.map((s, i) => renderStage(s, i, i))}
            </div>
            <div className="space-y-4">
              {secondColumn.map((s, i) => renderStage(s, i, i + 4))}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-center">
              Kwoty brutto wyliczone na podstawie Twojej indywidualnej wyceny
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}