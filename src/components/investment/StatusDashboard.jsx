import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent } from "../ui/card";
import { Calendar, DollarSign, ShoppingCart, Map, FileText } from "lucide-react";
import { motion } from "framer-motion";
import InvestmentTimeline from "./InvestmentTimeline";
import FileUploadSection from "./FileUploadSection";

function safeDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).substring(0, 10);
  return s.length === 10 ? new Date(s + "T12:00:00") : null;
}
function formatDatePL(dateStr, opts = { day: "2-digit", month: "long", year: "numeric" }) {
  const d = safeDate(dateStr);
  return d ? d.toLocaleDateString("pl-PL", opts) : "---";
}

const NAV_CARDS = [
  {
    key: "wycena",
    icon: DollarSign,
    title: "Wycena",
    desc: "Szczegółowe koszty inwestycji",
  },
  {
    key: "zakupy",
    icon: ShoppingCart,
    title: "Zakupy",
    desc: "Lista materiałów do zamówienia",
  },
  {
    key: "projekt",
    icon: Map,
    title: "Projekt (Rzut)",
    desc: "Interaktywny plan Twojej instalacji",
  },
  {
    key: "dokumenty",
    icon: FileText,
    title: "Dokumenty",
    desc: "Pliki i dokumentacja projektu",
    scrollTo: "dokumenty-section",
  },
];

export default function StatusDashboard({ investment, onNavigate, onRefresh }) {
  const getProgressPercentage = () => {
    if (!investment) return 0;
    if (typeof investment.progress === "number" && investment.progress > 0) return investment.progress;
    if (!investment.stages || investment.stages.length === 0) return 0;
    return Math.round((investment.current_stage / investment.stages.length) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Nagłówek inwestycji */}
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

          <div className="mt-6 pt-6 border-t border-orange-100">
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

      {/* Karty nawigacyjne */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NAV_CARDS.map(({ key, icon: Icon, title, desc, scrollTo }) => (
          <Card
            key={key}
            className="border-2 border-slate-200 bg-white shadow-sm hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => {
              if (scrollTo) {
                const el = document.getElementById(scrollTo);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              } else {
                onNavigate(key);
              }
            }}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors shrink-0">
                <Icon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Oś czasu */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-orange-600" />
          Etapy realizacji
        </h2>
        <InvestmentTimeline
          stages={investment.stages}
          currentStage={investment.current_stage}
        />
      </div>

      {/* Pliki i Dokumenty */}
      <div id="dokumenty-section" />
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
    project_name:      PropTypes.string,
    package_type:      PropTypes.string,
    start_date:        PropTypes.string,
    current_stage:     PropTypes.number,
    stages:            PropTypes.array,
    investment_code:   PropTypes.string,
    documents:         PropTypes.array,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
  onRefresh:  PropTypes.func.isRequired,
};