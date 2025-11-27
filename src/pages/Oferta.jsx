import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Home, 
  Plug, 
  Cpu, 
  Headphones, 
  Pencil, 
  Factory, 
  Wrench,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Oferta() {
  const packages = [
    {
      name: "Smart design",
      tagline: "Podstawa inteligentnego budynku",
      gradient: "from-orange-500 to-orange-400",
      features: [
        { icon: Home, text: "Projekt smart home" },
        { icon: Pencil, text: "Projekt szafy sterowniczej"},
        { icon: Plug, text: "Lista okablowania" },
        { icon: Cpu, text: "Lista podzespołów" },
        { icon: Headphones, text: "Wsparcie techniczne" }
      ]
    },
    {
      name: "Full house",
      tagline: "Kompleksowe uruchomienie",
      gradient: "from-orange-700 to-slate-700",
      isPopular: true,
      features: [
        { icon: Home, text: "Projekt smart home" },
        { icon: Pencil, text: "Projekt szafy sterowniczej"},
        { icon: Plug, text: "Lista okablowania" },
        { icon: Cpu, text: "Lista podzespołów" },
        { icon: Headphones, text: "Wsparcie techniczne" },
        { icon: Factory, text: "Prefabrykacja szafy sterowniczej", highlight: true },
        { icon: Wrench, text: "Uruchomienie i integracja", highlight: true }
      ]
    },
    {
      name: "Smart design+",
      tagline: "Pełny projekt instalacji",
      gradient: "from-orange-600 to-orange-500",
      features: [
        { icon: Home, text: "Projekt smart home" },
        { icon: Pencil, text: "Projekt szafy sterowniczej"},
        { icon: Plug, text: "Lista okablowania" },
        { icon: Cpu, text: "Lista podzespołów" },
        { icon: Headphones, text: "Wsparcie techniczne" },
        { icon: Factory, text: "Prefabrykacja szafy sterowniczej", highlight: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 pb-2.5 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Nasza Oferta
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Wybierz pakiet, który najlepiej odpowiada Twoim potrzebom i budżetowi
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 ${
                pkg.isPopular ? "ring-4 ring-orange-500 scale-105 lg:scale-110" : ""
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute top-6 right-6 bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg z-10">
                  Najpopularniejszy
                </div>
              )}

              {/* Header */}
              <div className={`bg-gradient-to-br ${pkg.gradient} p-8 text-white`}>
                <h3 className="text-2xl lg:text-3xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-white/90">{pkg.tagline}</p>
              </div>

              {/* Features */}
              <div className="p-8">
                <ul className="space-y-4">
                  {pkg.features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <li
                        key={idx}
                        className={`flex items-start space-x-3 ${
                          feature.highlight ? "font-semibold" : ""
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          feature.highlight
                            ? "bg-gradient-to-br from-orange-600 to-orange-500"
                            : "bg-slate-100"
                        }`}>
                          <Icon className={`w-4 h-4 ${feature.highlight ? "text-white" : "text-slate-600"}`} />
                        </div>
                        <span className={feature.highlight ? "text-orange-700" : "text-slate-700"}>
                          {feature.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  to={createPageUrl("Kontakt")}
                  className={`mt-8 w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    pkg.isPopular
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-2xl hover:shadow-orange-500/50"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  <span>Dowiedz się więcej</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-12 border-2 border-orange-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Nie wiesz, który pakiet wybrać?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Napisz do nas, aby otrzymać więcej informacji przez nasz formularz kontaktowy. 
            Możesz również sam skonfigurować swój smart home i zobaczyć szacunkowy koszt twojej realizacji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={createPageUrl("Konfigurator")}
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
            >
              <span>Przygotuj swoją konfigurację!</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to={createPageUrl("Kontakt")}
              className="inline-flex items-center justify-center space-x-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold border-2 border-orange-600 hover:bg-orange-50 transition-all duration-300"
            >
              <span>Skontaktuj się z nami</span>
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Dlaczego warto wybrać nasze pakiety?</h3>
            <div className="space-y-4 text-slate-600">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p><strong className="text-slate-900">Transparentność:</strong> Jasno określone zakres usług w każdym pakiecie</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p><strong className="text-slate-900">Elastyczność:</strong> Możliwość dostosowania pakietu do Twoich potrzeb</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p><strong className="text-slate-900">Wsparcie:</strong> Pomoc techniczna na każdym etapie realizacji projektu</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p><strong className="text-slate-900">Doświadczenie:</strong> Certyfikowany Partner Loxone z wieloletnim doświadczeniem</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}