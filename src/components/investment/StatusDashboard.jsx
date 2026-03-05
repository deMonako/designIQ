import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent } from "../ui/card";
import { Calendar, DollarSign, ShoppingCart, Map, Cpu } from "lucide-react";
import { motion } from "framer-motion";
// Bezpieczna konwersja daty – obsługuje ISO strings z timezone (np. "2025-03-31T22:00:00.000Z")
function safeDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).substring(0, 10);
  return s.length === 10 ? new Date(s + "T12:00:00") : null;
}
function formatDatePL(dateStr, opts = { day: "2-digit", month: "long", year: "numeric" }) {
  const d = safeDate(dateStr);
  return d ? d.toLocaleDateString("pl-PL", opts) : "---";
}
import InvestmentTimeline from "./InvestmentTimeline";
import FileUploadSection from "./FileUploadSection";

export default function StatusDashboard({ investment, onNavigate, onRefresh }) {
  const getProgressPercentage = () => {
    if (!investment || !investment.stages) return 0;
    return Math.round((investment.current_stage / investment.stages.length) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Nagłówek Inwestycji */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-xl">
        <CardContent className="p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-500 mb-1">Projekt</div>
              <div className="text-xl font-bold text-slate-900">{investment.project_name}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Pakiet</div>
              <div className="text-xl font-bold text-orange-600">{investment.package_type}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Data rozpoczęcia</div>
              <div className="text-xl font-bold text-slate-900">
                {formatDatePL(investment.start_date)}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Postęp realizacji</span>
              <span className="text-lg font-bold text-orange-600">{getProgressPercentage()}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={getProgressPercentage()}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Postęp realizacji"
              className="h-4 bg-slate-200 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Karty Nawigacyjne - Układ 2x2 (Finanse -> Inżynieria) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. WYCENA */}
        <Card 
          className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => onNavigate("wycena")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Wycena</h3>
              <p className="text-sm text-slate-600">Szczegółowe koszty inwestycji</p>
            </div>
          </CardContent>
        </Card>

        {/* 2. ZAKUPY */}
        <Card 
          className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => onNavigate("zakupy")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-green-200">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Zakupy</h3>
              <p className="text-sm text-slate-600">Lista materiałów do zamówienia</p>
            </div>
          </CardContent>
        </Card>

        {/* 3. PROJEKT (Rzut DXF) */}
        <Card 
          className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => onNavigate("projekt")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-indigo-200">
              <Map className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Projekt (Rzut)</h3>
              <p className="text-sm text-slate-600">Interaktywny plan Twojej instalacji</p>
            </div>
          </CardContent>
        </Card>

        {/* 4. SZAFA STEROWNICZA */}
        <Card 
          className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => onNavigate("szafa")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-purple-200">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Szafa sterownicza</h3>
              <p className="text-sm text-slate-600">Widok rozdzielnicy i modułów</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Oś czasu */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-orange-600" />
          Etapy realizacji
        </h2>
        <InvestmentTimeline 
          stages={investment.stages} 
          currentStage={investment.current_stage}
        />
      </div>

      {/* Pliki i Dokumenty */}
      <FileUploadSection 
        investment={investment}
        onFileUploaded={onRefresh}
        isReadOnly={investment.investment_code === "DEMO" || investment.investment_code === "MATERIAŁY"}
      />
    </div>
  );
}

StatusDashboard.propTypes = {
  investment: PropTypes.shape({
    project_name: PropTypes.string,
    package_type: PropTypes.string,
    start_date: PropTypes.string,
    current_stage: PropTypes.number,
    stages: PropTypes.array,
    investment_code: PropTypes.string,
    documents: PropTypes.array,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};