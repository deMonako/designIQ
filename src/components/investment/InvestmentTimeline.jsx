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

const stageDescriptions = {
  1: "Zgłoszenie przyjęte i zarejestrowane w systemie",
  2: "Analiza potrzeb i przygotowanie koncepcji systemu",
  3: "Kompleksowy projekt instalacji elektrycznej i automatyki",
  4: "Specyfikacja przewodów i urządzeń do instalacji",
  5: "Projektowanie i kompletacja szafy sterowniczej",
  6: "Programowanie systemu Smart Home",
  7: "Dostawa urządzeń i montaż na budowie",
  8: "Testy i uruchomienie wszystkich funkcji systemu",
  9: "Przekazanie i szkolenie z obsługi systemu",
  10: "Wsparcie techniczne i rozwój systemu",
};

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
          const description = stageDescriptions[stage.stage_number] || null;
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
