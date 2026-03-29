import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { motion } from "framer-motion";

function formatDatePL(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).substring(0, 10);
  if (s.length < 10) return null;
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
}

// Dopasowanie po słowach kluczowych w nazwie etapu (niezależnie od kolejności)
const stageDescriptionsByKeyword = [
  { keywords: ["zgłoszenie", "przyjęcie", "rejestracja"],    desc: "Zgłoszenie przyjęte i zarejestrowane w systemie" },
  { keywords: ["analiza", "koncepcja"],                       desc: "Analiza potrzeb i opracowanie koncepcji systemu Smart Home" },
  { keywords: ["projekt", "instalacja", "automatyk"],        desc: "Projekt instalacji elektrycznej i automatyki budynkowej" },
  { keywords: ["zestawienie", "materiał", "specyfikacja", "bom"], desc: "Zestawienie materiałowe — lista przewodów, osprzętu i urządzeń" },
  { keywords: ["szafa", "prefabryk", "sterown"],              desc: "Prefabrykacja szafy sterowniczej Loxone wraz z okablowaniem" },
  { keywords: ["programow", "software", "logika"],            desc: "Programowanie logiki i interfejsów użytkownika Loxone" },
  { keywords: ["montaż", "budow", "okablow"],                 desc: "Montaż urządzeń i okablowania na obiekcie" },
  { keywords: ["uruchom", "test", "komis"],                   desc: "Uruchomienie i testy kompletnego systemu" },
  { keywords: ["przekaz", "szkolenie", "odbiór"],             desc: "Przekazanie instalacji i szkolenie z obsługi" },
  { keywords: ["serwis", "wsparcie", "gwarancja"],            desc: "Serwis gwarancyjny i wsparcie techniczne" },
];

function getStageDescription(name) {
  const lower = (name || "").toLowerCase();
  const match = stageDescriptionsByKeyword.find(({ keywords }) =>
    keywords.some(kw => lower.includes(kw))
  );
  return match ? match.desc : null;
}

export default function InvestmentTimeline({ stages, currentStage }) {
  if (!stages || stages.length === 0) return null;

  const getStatus = (index) => {
    const pos = index + 1;
    if (pos < currentStage) return "completed";
    if (pos === currentStage) return "in_progress";
    return "pending";
  };

  return (
    <div className="relative">
      {/* Pionowa linia */}
      <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-200" />

      <div className="space-y-1">
        {stages.map((stage, index) => {
          const status = getStatus(index);
          const description = getStageDescription(stage.name);
          const isLast = index === stages.length - 1;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
              className={`relative flex gap-4 ${isLast ? "pb-0" : "pb-4"}`}
            >
              {/* Wskaźnik statusu */}
              <div className="relative z-10 flex-shrink-0 flex items-start pt-0.5">
                {status === "completed" && (
                  <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {status === "in_progress" && (
                  <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center shadow-md shadow-orange-100">
                    <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
                  </div>
                )}
                {status === "pending" && (
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                    <Circle className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Treść */}
              <div className={`flex-1 min-w-0 pt-1.5 pb-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${
                    status === "completed" ? "text-green-700" :
                    status === "in_progress" ? "text-orange-700 font-bold" :
                    "text-slate-400"
                  }`}>
                    {stage.name}
                  </span>
                  {status === "in_progress" && (
                    <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      W trakcie
                    </span>
                  )}
                  {status === "completed" && stage.completion_date && formatDatePL(stage.completion_date) && (
                    <span className="text-xs text-slate-400">{formatDatePL(stage.completion_date)}</span>
                  )}
                </div>
                {status !== "pending" && description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                )}
                {stage.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 mt-1.5 border-l-2 border-orange-300">
                    {stage.notes}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
