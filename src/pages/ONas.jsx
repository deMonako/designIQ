import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Users, Target, Code2, Award, HeartHandshake, ArrowRight } from "lucide-react";

export default function ONas() {
  const values = [
    {
      icon: Code2,
      title: "Programowanie i konfiguracja",
      description: "Stawiamy na programistyczne aspekty Smart Home. Tworzymy zaawansowane scenariusze automatyzacji, piszemy własne algorytmy i integrujemy systemy na poziomie kodu, nie tylko konfiguracji."
    },
    {
      icon: Award,
      title: "Zaawansowana automatyka",
      description: "Nie ograniczamy się do podstawowej instalacji. Programujemy złożone logiki sterowania, integrujemy API różnych systemów i tworzymy inteligentne rozwiązania wykorzystujące AI."
    },
    {
      icon: HeartHandshake,
      title: "Indywidualne podejście",
      description: "Każdy projekt to unikalne wyzwanie programistyczne. Tworzymy dedykowane rozwiązania softwarowe dopasowane do specyficznych wymagań, nie kopiujemy szablonów."
    },
    {
      icon: Users,
      title: "Kompleksowa realizacja",
      description: "Od projektu elektryki, przez programowanie sterowników, integrację systemów, aż po aplikacje webowe i mobilne. Pełny zakres usług technicznych i programistycznych."
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 pb-2.5 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            O designiQ
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Poznaj naszą historię, wartości i dowiedz się, dlaczego warto nam zaufać
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Who We Are */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              Kim jesteśmy?
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4">
              <p>
                <strong className="text-slate-900">designiQ</strong> to zespół specjalistów od automatyki budynkowej 
                i systemów smart home. Naszą misją jest wprowadzenie najnowszych technologii do domów, 
                tworząc przestrzenie, które są nie tylko inteligentne, ale przede wszystkim funkcjonalne i intuicyjne.
              </p>
              <p>
                Jesteśmy <strong className="text-orange-600">certyfikowanym partnerem Loxone</strong> – 
                wiodącego producenta systemów automatyki budynkowej. Dzięki temu oferujemy rozwiązania najwyższej jakości, 
                które działają niezawodnie przez lata.
              </p>
              <p>
                <strong className="text-slate-900">Programowanie i zaawansowana konfiguracja</strong> to nasza specjalność. 
                Nie ograniczamy się tylko do fizycznej instalacji – tworzymy zaawansowane scenariusze automatyzacji, 
                integrujemy różne systemy i optymalizujemy działanie całej instalacji. Dzięki głębokiej znajomości 
                platformy Loxone Config i programowania potrafimy stworzyć inteligentne algorytmy dostosowane do indywidualnych potrzeb.
              </p>
              <p>
                Zajmujemy się kompleksowym projektowaniem instalacji smart home – od koncepcji i programowania logiki, 
                przez szczegółowy projekt techniczny, aż po uruchomienie i szkolenie z obsługi. Każdy projekt traktujemy 
                indywidualnie, tworząc unikalne rozwiązania programistyczne dopasowane do stylu życia inwestora.
              </p>
            </div>
          </div>

          {/* Our Mission */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 lg:p-12 border-2 border-orange-200">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              Nasza misja
            </h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              Naszą misją jest dostarczanie klientom najwyższej jakości systemów automatyki budowlanej, 
              które są intuicyjne, efektywne i dostosowane do ich indywidualnych potrzeb. Pragniemy, 
              aby każdy dom stał się miejscem komfortowym, oszczędnym i bezpiecznym, w którym technologia 
              wspiera codzienne życie.
            </p>
          </div>

          {/* Why Choose Us */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">
              Dlaczego warto wybrać nas?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-slate-800 rounded-3xl p-8 lg:p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Gotowy współpracować z nami?</h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Chcesz dowiedzieć się więcej o naszych usługach? Skontaktuj się z nami już dziś!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("Kontakt")}
                className="inline-flex items-center justify-center space-x-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold hover:bg-orange-50 transition-all duration-300 shadow-xl hover:scale-105"
              >
                <span>Skontaktuj się z nami</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={createPageUrl("Konfigurator")}
                className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300"
              >
                <span>Wypróbuj konfigurator</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Team Section (optional visual enhancement) */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-orange-200 px-6 py-3 rounded-full">
            <Award className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Certyfikowany Partner Loxone</span>
          </div>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            Nasza certyfikacja potwierdza najwyższy poziom kompetencji w projektowaniu 
            i wdrażaniu systemów Smart Home opartych na technologii Loxone
          </p>
        </div>
      </div>
    </div>
  );
}