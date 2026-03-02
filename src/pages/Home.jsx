import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { 
  Home as HomeIcon, 
  Plug, 
  Shield, 
  Radio, 
  Camera, 
  Wifi,
  Terminal,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Activity,
} from "lucide-react";


const PARTICLES = [...Array(20)].map((_, i) => ({
  id: i,
  x: Math.random() * 100 - 50,
  duration: 5 + Math.random() * 5,
  delay: Math.random() * 5,
  left: Math.random() * 100,
  top: Math.random() * 100,
}));

export default function Home() {
  const features = [
    {
      icon: Sparkles,
      title: "Niezawodność",
      description: "Systemy działające bezawaryjnie 24/7"
    },
    {
      icon: Lock,
      title: "Bezpieczeństwo",
      description: "Pełna kontrola i ochrona Twojego domu"
    },
    {
      icon: Zap,
      title: "Innowacyjność",
      description: "Najnowsze technologie Smart Home"
    }
  ];

  const services = [
    {
      icon: HomeIcon,
      title: "Projekt automatyki",
      description: "Otrzymasz od nas spersonalizowaną listę i projekt rozmieszczenia potrzebnych elementów w twoim domu."
    },
    {
      icon: Plug,
      title: "Projekt elektryki",
      description: "Projekt automatyki wzbogacić możemy o plan podstawowych komponentów wchodzących w skład instalacji."
    },
    {
      icon: Shield,
      title: "Szafa sterownicza",
      description: "Dokładny szkic rozmieszczenia i połączenia elementów sterujących domem oraz prefabrykacja szafy."
    },
    {
      icon: Radio,
      title: "Programowanie",
      description: "Nauczymy serce twojego domu, aby pomyślnie realizowało twoje wymagania co do stworzonego systemu."
    },
    {
      icon: Wifi,
      title: "Sieć",
      description: "Stworzymy topologię i dobierzemy produkty do stworzenia wydajnej sieci w domu."
    },
    {
      icon: Camera,
      title: "Monitoring",
      description: "Zadbamy o bezpieczeństwo twoje i twoich bliskich poprzez projekt systemu monitoringu."
    }
  ];

  const steps = [
    { number: "01", title: "Rozmowa", description: "Omawiamy Twoje potrzeby i oczekiwania" },
    { number: "02", title: "Analiza", description: "Analizujemy projekt i możliwości techniczne" },
    { number: "03", title: "Projekt", description: "Tworzymy szczegółowy projekt instalacji" },
    { number: "04", title: "Instalacja", description: "Realizujemy projekt zgodnie z planem" },
    { number: "05", title: "Szkolenie", description: "Szkolimy z obsługi systemu" }
  ];

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-700 to-slate-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoMnYyaC0ydi0yem0wIDRoMnYyaC0ydi0yem00LTRoMnYyaC0ydi0yem0wIDRoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          {/* Floating particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                y: [0, -100, 0],
                x: [0, p.x, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
              }}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight mt-6 md:mt-0"
        >
          Technologia w służbie<br />
          <span className="bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent">
            Twojego domu
          </span>
        </motion.h1>
          <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-orange-100 mb-4 md:mb-2 max-w-2xl mx-auto">
          Profesjonalne systemy Smart Home i automatyka budynkowa
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
          <Link
            to={createPageUrl("Kontakt")}
            className="mt-3 inline-flex items-center space-x-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-50 transition-all duration-300 shadow-2xl hover:shadow-orange-500/50 hover:scale-105"
          >
            <span>Skontaktuj się z nami</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          </motion.div>

          {/* Feature Pills */}
          <div className="mt-12 md:mt-6 mb-28 flex flex-wrap justify-center gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-6 py-4 text-white flex items-center space-x-3 hover:bg-white/20 transition-all duration-300"
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">{feature.title}</div>
                    <div className="text-sm text-orange-200">{feature.description}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="pt-20 lg:pt-32 pb-0">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="pb-[10px] text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              O designiQ
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Zajmujemy się projektowaniem nowoczesnych instalacji elektrycznych z naciskiem na rozwiązania smart home. 
              Specjalizujemy się w tworzeniu inteligentnych systemów, które łączą wygodę z bezpieczeństwem i efektywnością energetyczną.
            </p>
          </div>

          {/* Loxone Partner Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-3xl p-8 mb-20 overflow-hidden relative"
          >
            <div className="text-center relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <motion.div
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(34, 197, 94, 0.3)",
                      "0 0 30px rgba(34, 197, 94, 0.5)",
                      "0 0 20px rgba(34, 197, 94, 0.3)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="text-5xl sm:text-6xl font-black tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #22c55e 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  LOXONE
                </motion.div>
              </motion.div>
              <h3 className="text-2xl font-bold text-orange-900 mb-4">
                Certyfikowany Partner Loxone
              </h3>
              <p className="text-slate-700 leading-relaxed">
                Pracujemy bezpośrednio z technologiami Loxone i znamy je od podszewki. Na co dzień projektujemy, 
                konfigurujemy i uruchamiamy systemy Smart Home, które działają niezawodnie, są intuicyjne w obsłudze 
                i w pełni dopasowane do potrzeb inwestora.
              </p>
            </div>
            {/* Animated background elements */}
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-green-300/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-40 h-40 bg-green-400/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="pb-[10px] text-4xl lg:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Jak wygląda współpraca
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
              >
                <div className="text-6xl font-bold bg-gradient-to-br from-orange-600 to-orange-500 bg-clip-text text-transparent mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="pb-[10px] text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Co możemy Ci zaoferować?
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              W designiQ stawiamy na transparentność i przewidywalność. Skorzystaj z naszego konfiguratora, 
              aby oszacować koszt swojego systemu Smart Home.
            </p>
            <Link
              to={createPageUrl("Konfigurator")}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
            >
              <span>Przygotuj swoją konfigurację!</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6"
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

{/* SEKCJA LIVE DEMO - Naprawiona szerokość kontenera */}
      <section className="pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-12 overflow-hidden relative group border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
              <div className="text-left space-y-4 max-w-xl">
                <div className="inline-flex items-center space-x-2 bg-orange-600/20 text-orange-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Live Technology Demo</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-white">
                  Zobacz potęgę integracji <span className="text-orange-500 italic">na żywo</span>
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Przygotowaliśmy unikalny pokaz możliwości. Jednym kliknięciem możesz wysłać sygnał 
                  z tej strony bezpośrednio do naszego biura i sprawdzić, jak systemy firm trzecich 
                  współpracują z Loxone w czasie rzeczywistym.
                </p>
              </div>

              <Link
                to="/Instalator"
                className="group flex-shrink-0 relative inline-flex items-center justify-center px-10 py-5 font-black text-white transition-all bg-orange-600 rounded-2xl hover:bg-orange-500 shadow-xl hover:shadow-orange-600/40 active:scale-95"
              >
                <span className="relative flex items-center gap-3">
                  URUCHOM TEST <Terminal className="w-5 h-5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600 via-orange-700 to-slate-800">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Gotowy na inteligentny dom?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Skontaktuj się z nami już dziś i rozpocznij transformację swojego domu
          </p>
          <Link
            to={createPageUrl("Kontakt")}
            className="inline-flex items-center space-x-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-50 transition-all duration-300 shadow-2xl hover:scale-105"
          >
            <span>Skontaktuj się</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}