import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Battery, 
  Shield, 
  Smartphone, 
  TrendingDown, 
  Clock, 
  Sparkles,
  Home,
  Zap,
  Leaf,
  Lock,
  Eye,
  Wind,
  Sun,
  Lightbulb,
  ThermometerSun,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function CoZyskasz() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const benefits = [
    {
      icon: Battery,
      title: "Zarządzanie energią",
      description: "Monitoruj i optymalizuj zużycie energii w czasie rzeczywistym. Inteligentne zarządzanie urządzeniami pozwala oszczędzić do 30% kosztów energii.",
      gradient: "from-green-500 to-emerald-600",
      details: ["Monitoring zużycia w czasie rzeczywistym", "Automatyczna optymalizacja", "Integracja z fotowoltaiką", "Zarządzanie ładowaniem EV"]
    },
    {
      icon: TrendingDown,
      title: "Oszczędność kosztów",
      description: "Inteligentny dom to realne oszczędności. Automatyczne zarządzanie oświetleniem, ogrzewaniem i urządzeniami znacząco obniża rachunki.",
      gradient: "from-blue-500 to-cyan-600",
      details: ["Niższe rachunki za energię", "Optymalne wykorzystanie zasobów", "Dłuższa żywotność urządzeń", "Szybki zwrot z inwestycji"]
    },
    {
      icon: Shield,
      title: "Bezpieczeństwo",
      description: "Pełna kontrola nad bezpieczeństwem domu. Monitoring, alarmy, kontrola dostępu i natychmiastowe powiadomienia o wszelkich zdarzeniach.",
      gradient: "from-red-500 to-orange-600",
      details: ["System alarmowy 24/7", "Monitoring wideo", "Kontrola dostępu", "Powiadomienia w czasie rzeczywistym"]
    },
    {
      icon: Smartphone,
      title: "Zdalna kontrola",
      description: "Steruj swoim domem z dowolnego miejsca na świecie. Aplikacja mobilna daje pełną kontrolę nad wszystkimi systemami.",
      gradient: "from-purple-500 to-pink-600",
      details: ["Sterowanie z telefonu", "Dostęp z każdego miejsca", "Intuicyjny interfejs", "Statusy urządzeń online"]
    },
    {
      icon: Clock,
      title: "Komfort i wygoda",
      description: "Automatyzacja codziennych czynności. Dom dostosowuje się do Twoich potrzeb i preferencji, oszczędzając Twój czas.",
      gradient: "from-indigo-500 to-blue-600",
      details: ["Automatyczne scenariusze", "Personalizacja ustawień", "Sterowanie głosowe", "Nauka nawyków"]
    },
    {
      icon: Leaf,
      title: "Ekologia",
      description: "Dbaj o środowisko naturalne. Smart home redukuje ślad węglowy przez optymalne wykorzystanie energii i integrację z OZE.",
      gradient: "from-teal-500 to-green-600",
      details: ["Mniejsze zużycie energii", "Integracja z OZE", "Monitoring emisji CO₂", "Świadome zarządzanie"]
    },
    {
      icon: Zap,
      title: "Automatyka",
      description: "Wszystko działa automatycznie. Oświetlenie, ogrzewanie, klimatyzacja - system sam dostosowuje parametry do potrzeb.",
      gradient: "from-yellow-500 to-orange-600",
      details: ["Automatyczne oświetlenie", "Regulacja temperatury", "Sterowanie roletami", "Scenariusze czasowe"]
    },
    {
      icon: ThermometerSun,
      title: "Klimat w domu",
      description: "Idealne warunki przez cały rok. Inteligentne zarządzanie ogrzewaniem, wentylacją i klimatyzacją dla maksymalnego komfortu.",
      gradient: "from-orange-500 to-red-600",
      details: ["Stała temperatura", "Kontrola wilgotności", "Czyste powietrze", "Oszczędność energii"]
    },
    {
      icon: Eye,
      title: "Monitoring",
      description: "Miej oko na swój dom. Kamery, czujniki ruchu i inteligentne powiadomienia zapewniają spokój ducha gdzie byś nie był.",
      gradient: "from-slate-500 to-slate-700",
      details: ["Kamery HD", "Nagrywanie zdarzeń", "Detekcja ruchu", "Archiwum wideo"]
    },
    {
      icon: Lightbulb,
      title: "Inteligentne oświetlenie",
      description: "Światło dopasowane do pory dnia i aktywności. Automatyczne scenariusze i oszczędność energii dzięki LED.",
      gradient: "from-amber-500 to-yellow-600",
      details: ["Dostosowanie do pory dnia", "Automatyczne włączanie", "Oszczędne LED", "Scenariusze świetlne"]
    },
    {
      icon: Lock,
      title: "Kontrola dostępu",
      description: "Zapomnij o kluczach. Kontroluj dostęp do domu przez telefon, kod PIN lub biometrię. Dziel dostępem z rodziną i gośćmi.",
      gradient: "from-red-600 to-pink-600",
      details: ["Dostęp bez kluczy", "Tymczasowe kody", "Historia wejść", "Zdalna kontrola"]
    },
    {
      icon: Wind,
      title: "Jakość powietrza",
      description: "Oddychaj czystym powietrzem. Inteligentna wentylacja i rekuperacja zapewniają stały dopływ świeżego, przefiltrowanego powietrza.",
      gradient: "from-cyan-500 to-blue-600",
      details: ["Rekuperacja z odzyskiem ciepła", "Filtry HEPA", "Monitoring CO₂", "Automatyczna wentylacja"]
    }
  ];

  return (
    <div className="min-h-screen py-20 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 pb-2.5 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Co zyskasz dzięki Smart Home?
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Inteligentny dom to inwestycja, która zwraca się na wiele sposobów. 
            Odkryj wszystkie korzyści, jakie niesie ze sobą automatyka budynkowa.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto mb-16 overflow-hidden">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px", amount: 0.3 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.03,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100"
              >
                <motion.div 
                  className={`bg-gradient-to-br ${benefit.gradient} p-6 relative overflow-hidden`}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 2, -2, 0],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    <Icon className="w-12 h-12 text-white mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">{benefit.title}</h3>
                </motion.div>
                <div className="p-6">
                  <p className="text-slate-600 mb-4 leading-relaxed">{benefit.description}</p>
                  <ul className="space-y-2">
                    {benefit.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 mr-2 flex-shrink-0"></div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Energy Management Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 lg:p-12 border-2 border-green-200 max-w-5xl mx-auto mb-16 overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center">
                <Battery className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Zarządzanie energią - klucz do oszczędności
              </h2>
              <p className="text-lg text-slate-700 mb-4 leading-relaxed">
                Inteligentne zarządzanie energią to najważniejsza korzyść smart home. System analizuje zużycie, 
                optymalizuje pracę urządzeń i integruje się z fotowoltaiką oraz magazynami energii.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { value: "30%", label: "Oszczędność energii", delay: 0 },
                  { value: "24/7", label: "Monitoring", delay: 0.1 },
                  { value: "100%", label: "Automatyzacja", delay: 0.2 },
                  { value: "ROI", label: "2-4 lata", delay: 0.3 }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: stat.delay, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-xl transition-shadow"
                  >
                    <motion.div 
                      className="text-3xl font-bold text-green-600"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: stat.delay + 0.2, type: "spring" }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center bg-gradient-to-br from-orange-600 via-orange-700 to-slate-800 rounded-3xl p-8 lg:p-12 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Gotowy na transformację?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Skonfiguruj swój inteligentny dom już teraz i zobacz, ile możesz zyskać
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={createPageUrl("Konfigurator")}
              className="inline-flex items-center justify-center space-x-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-50 transition-all duration-300 shadow-2xl hover:scale-105"
            >
              <span>Przejdź do konfiguratora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to={createPageUrl("Kontakt")}
              className="inline-flex items-center justify-center space-x-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
            >
              <span>Skontaktuj się z nami</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}