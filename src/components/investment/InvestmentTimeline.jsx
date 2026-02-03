import React from "react";
import { 
  CheckCircle2, Circle, Clock, FileText, Users, Layout, 
  Package, Truck, Code, TestTube, GraduationCap, Headphones 
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// 1. Konfiguracja Ikon
const stageIcons = {
  1: FileText,
  2: Users,
  3: Layout,
  4: FileText,
  5: Package,
  6: Code,
  7: Truck,
  8: TestTube,
  9: GraduationCap,
  10: Headphones
};

// 2. Konfiguracja Opisów
const stageDescriptions = {
  1: "Twoje zgłoszenie zostało przyjęte i zarejestrowane w systemie",
  2: "Przeprowadzamy szczegółową analizę Twoich potrzeb i przygotowujemy koncepcję systemu",
  3: "Tworzymy kompleksowy projekt instalacji elektrycznej i automatyki budynkowej",
  4: "Przygotowujemy szczegółową listę wszystkich przewodów i urządzeń potrzebnych do instalacji",
  5: "Projektujemy i kompletujemy szafę sterowniczą z całym niezbędnym osprzętem",
  6: "Programujemy system Smart Home zgodnie z Twoimi wymaganiami",
  7: "Realizujemy dostawę urządzeń i montaż systemu na Twojej budowie",
  8: "Przeprowadzamy kompleksowe testy i uruchamiamy wszystkie funkcje systemu",
  9: "Przekazujemy gotowy system i szkolimy Cię z jego obsługi",
  10: "Jesteśmy do Twojej dyspozycji w zakresie wsparcia technicznego i rozwoju systemu"
};

// 3. Konfiguracja Kolorów i Statusów
const getStatusConfig = (status) => {
  const configs = {
    completed: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-300",
      lineColor: "bg-green-500"
    },
    in_progress: {
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
      lineColor: "bg-orange-500"
    },
    pending: {
      icon: Circle,
      color: "text-slate-400",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-300",
      lineColor: "bg-slate-300"
    }
  };
  return configs[status];
};

export default function InvestmentTimeline({ stages, currentStage }) {
  if (!stages || stages.length === 0) return null;

  const totalStages = stages.length;

  const getStageStatus = (index) => {
    const humanPosition = index + 1;
    if (humanPosition < currentStage) return "completed";
    if (humanPosition === currentStage) return "in_progress";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {stages.map((stage, index) => {
        // Dane pobierane z JSONa w Arkuszu
        const id = stage.stage_number; 
        const status = getStageStatus(index);
        const statusConfig = getStatusConfig(status);
        
        // Wybór ikony i opisu na podstawie stage_number
        const StageIcon = stageIcons[id] || Circle;
        const StatusIcon = statusConfig.icon;
        const description = stageDescriptions[id] || "Brak opisu dla tego etapu.";

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            
            <Card className={`relative z-10 border-2 ${statusConfig.borderColor} transition-all hover:shadow-lg ${status === 'in_progress' ? 'shadow-lg' : ''}`}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Sekcja Ikony */}
                  <div className="flex-shrink-0">
                    <div className={`relative w-16 h-16 rounded-2xl ${statusConfig.bgColor} flex items-center justify-center`}>
                      <StageIcon className={`w-8 h-8 ${statusConfig.color}`} />
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 ${statusConfig.borderColor} flex items-center justify-center`}>
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${status === 'in_progress' ? 'animate-pulse' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Sekcja Treści */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-slate-500">
                            Etap {index + 1}/{totalStages}
                          </span>
                          {status === 'in_progress' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                              W trakcie
                            </span>
                          )}
                          {status === 'completed' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                              Zakończony
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{stage.name}</h3>
                        <p className="text-slate-600 leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>

                    {/* Data zakończenia */}
                    {stage.completion_date && status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                          Zakończono: {format(new Date(stage.completion_date), 'dd MMMM yyyy', { locale: pl })}
                        </p>
                      </div>
                    )}

                    {/* Uwagi dodatkowe */}
                    {stage.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                          <span className="font-semibold">Uwaga:</span> {stage.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}