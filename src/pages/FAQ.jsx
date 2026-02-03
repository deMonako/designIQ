import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { HelpCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export default function FAQ() {
  const faqCategories = [
    {
      category: "Ogólne pytania o Smart Home",
      questions: [
        {
          q: "Czym jest system Smart Home?",
          a: "Smart Home to zintegrowany system automatyki budynkowej, który łączy różne urządzenia i instalacje w domu (oświetlenie, ogrzewanie, rolety, monitoring, alarm) w jedną spójną całość. System pozwala na centralne sterowanie, automatyzację i monitorowanie wszystkich funkcji domu z poziomu aplikacji mobilnej lub paneli ściennych."
        },
        {
          q: "Czy Smart Home to rozwiązanie tylko dla nowych domów?",
          a: "Nie, systemy Smart Home można zainstalować zarówno w nowych, jak i już istniejących budynkach. W przypadku modernizacji najlepiej sprawdzają się rozwiązania bezprzewodowe lub hybrydowe, które minimalizują konieczność ingerencji w istniejące instalacje."
        },
        {
          q: "Jakie korzyści daje Smart Home?",
          a: "Główne korzyści to: oszczędność energii (do 30%), zwiększone bezpieczeństwo, wygoda użytkowania, zdalna kontrola, automatyzacja codziennych czynności, monitoring zużycia mediów oraz zwiększenie wartości nieruchomości."
        },
        {
          q: "Czy system Smart Home jest skomplikowany w obsłudze?",
          a: "Nowoczesne systemy, w tym Loxone, są zaprojektowane z myślą o prostocie obsługi. Intuicyjne aplikacje mobilne i panele dotykowe sprawiają, że korzystanie z systemu jest łatwe dla wszystkich domowników. Po instalacji zapewniamy pełne szkolenie z obsługi."
        }
      ]
    },
    {
      category: "Konfigurator i wycena",
      questions: [
        {
          q: "Jak działa konfigurator designiQ?",
          a: "Konfigurator przeprowadzi Cię przez 4 proste kroki: podanie metrażu i wybór pakietu, wybór opcji podstawowych i dodatkowych, zaprojektowanie układu pomieszczeń, oraz otrzymanie orientacyjnej wyceny. Cały proces zajmuje około 5-10 minut."
        },
        {
          q: "Czy wycena z konfiguratora jest ostateczna?",
          a: "Wycena z konfiguratora jest orientacyjna i służy jako punkt wyjścia do dalszych rozmów. Dokładna wycena powstaje po konsultacji, analizie projektu domu i Twoich indywidualnych potrzeb. Finalna cena może się różnić w zależności od specyfiki inwestycji."
        },
        {
          q: "Co wpływa na cenę systemu Smart Home?",
          a: "Kluczowe czynniki to: powierzchnia domu, wybrany pakiet (Smart design/Smart design+/Full house), liczba pomieszczeń, zakres automatyki (oświetlenie, ogrzewanie, rolety, monitoring), dodatkowe opcje (fotowoltaika, rekuperacja, audio) oraz złożoność instalacji."
        },
        {
          q: "Czy mogę zapisać swoją konfigurację?",
          a: "Po wypełnieniu konfiguratora otrzymasz szczegółowe podsumowanie na podany adres email wraz z orientacyjną wyceną. Będziesz mógł wrócić do niej w każdej chwili."
        }
      ]
    },
    {
      category: "Pakiety usług",
      questions: [
        {
          q: "Czym różnią się pakiety Smart design, Smart design+ i Full house?",
          a: "Smart design to projekt automatyki + projekt szafy sterowniczej. Smart design+ dodatkowo zawiera prefabrykację szafy. Full house to kompletne rozwiązanie - projekt, prefabrykacja, pełne uruchomienie systemu i integracja wszystkich urządzeń."
        },
        {
          q: "Który pakiet jest dla mnie najlepszy?",
          a: "To zależy od etapu budowy i Twoich możliwości. Smart design - jeśli masz własnego elektryka. Smart design+ - jeśli chcesz przyspieszyć instalację. Full house - jeśli chcesz kompleksową obsługę od A do Z bez martwienia się o szczegóły techniczne."
        },
        {
          q: "Czy mogę zmienić pakiet w trakcie realizacji?",
          a: "Tak, możliwa jest zmiana pakietu, choć najlepiej zdecydować na początku. Przy zmianie z niższego na wyższy pakiet doliczamy różnicę. Skontaktuj się z nami, aby omówić szczegóły."
        },
        {
          q: "Co wchodzi w skład projektu automatyki?",
          a: "Projekt zawiera: schemat rozmieszczenia wszystkich elementów systemu, listę urządzeń z kodami produktów, topologię połączeń, projekt szafy sterowniczej, specyfikację przewodów i dokumentację techniczną dla elektryka."
        }
      ]
    },
    {
      category: "Instalacja i realizacja",
      questions: [
        {
          q: "Jak długo trwa realizacja projektu?",
          a: "Projekt automatyki: 2-4 tygodnie. Prefabrykacja szafy: 1-2 tygodnie. Montaż instalacji: zależy od wielkości domu, średnio 1-3 tygodnie. Programowanie i uruchomienie: 1-2 tygodnie. Łącznie od rozpoczęcia do uruchomienia 6-12 tygodni."
        },
        {
          q: "Na jakim etapie budowy powinienem rozpocząć projekt Smart Home?",
          a: "Najlepiej na etapie projektu budowlanego lub przed rozpoczęciem instalacji elektrycznej. Im wcześniej, tym lepiej - można optymalnie zaplanować rozmieszczenie wszystkich elementów i uniknąć późniejszych zmian."
        },
        {
          q: "Czy muszę mieć już gotowy projekt domu?",
          a: "Nie jest to konieczne na etapie korzystania z konfiguratora, ale do stworzenia finalnego projektu automatyki będziemy potrzebować rzutów pomieszczeń. Możemy też współpracować z Twoim architektem."
        },
        {
          q: "Czy zapewniacie montaż?",
          a: "Pakiet Full house obejmuje pełną instalację i uruchomienie. Przy pakietach Smart design i Smart design+ montaż wykonuje wybrany przez Ciebie elektryk według naszego projektu (możemy polecić sprawdzonych wykonawców)."
        }
      ]
    },
    {
      category: "Technologia i kompatybilność",
      questions: [
        {
          q: "Z jaką technologią pracujecie?",
          a: "Specjalizujemy się w systemie Loxone - austriackiego lidera w automatyce budynkowej. To system sprawdzony, niezawodny i stale rozwijany. Jesteśmy certyfikowanym partnerem Loxone."
        },
        {
          q: "Czy mogę integrować urządzenia innych producentów?",
          a: "Tak, system Loxone obsługuje protokoły KNX, Modbus, DMX, 1-Wire i wiele innych standardów. Można integrować urządzenia różnych producentów - oświetlenie, klimatyzację, audio, itp."
        },
        {
          q: "Czy system wymaga dostępu do Internetu?",
          a: "System działa lokalnie bez Internetu. Dostęp do sieci jest potrzebny tylko do zdalnego sterowania spoza domu i aktualizacji oprogramowania. Podstawowe funkcje działają zawsze, nawet bez połączenia."
        },
        {
          q: "Co się stanie, jeśli zabraknie prądu?",
          a: "Po przywróceniu zasilania system automatycznie wraca do pracy. Ważne ustawienia są zapisane w pamięci nieulotnej. Można dodać zasilanie awaryjne (UPS) dla kluczowych elementów systemu."
        }
      ]
    },
    {
      category: "Wsparcie i gwarancja",
      questions: [
        {
          q: "Jaką gwarancję oferujecie?",
          a: "Oferujemy 2 lata gwarancji na wykonane prace. Urządzenia Loxone objęte są gwarancją producenta. Po okresie gwarancyjnym zapewniamy serwis i wsparcie techniczne."
        },
        {
          q: "Czy zapewniacie szkolenie z obsługi systemu?",
          a: "Tak, w pakiecie Full house wliczone jest pełne szkolenie dla domowników z obsługi systemu, aplikacji mobilnej i wszystkich funkcji. Przy pozostałych pakietach szkolenie można dokupić opcjonalnie."
        },
        {
          q: "Co jeśli będę potrzebować zmian w systemie?",
          a: "System jest elastyczny i można go rozbudowywać. Oferujemy serwis posprzedażowy - od drobnych zmian w programowaniu (nowe scenariusze) po rozbudowę o kolejne funkcje i pomieszczenia."
        },
        {
          q: "Jak wygląda wsparcie techniczne?",
          a: "Zapewniamy wsparcie przez email i telefon. W przypadku poważniejszych problemów możliwe są wizyty serwisowe. Proste zmiany w konfiguracji możemy wykonywać zdalnie."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r py-2 from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Najczęściej zadawane pytania
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Znajdź odpowiedzi na najważniejsze pytania dotyczące systemów Smart Home, 
            naszych usług i procesu realizacji projektu.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{category.category}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${categoryIndex}-${index}`}
                    className="bg-white rounded-xl border-2 border-slate-100 hover:border-orange-200 transition-colors overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-orange-50/50">
                      <span className="font-semibold text-slate-900 pr-4">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-slate-600 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 lg:p-12 border-2 border-orange-200 text-center"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Nie znalazłeś odpowiedzi na swoje pytanie?
          </h3>
          <p className="text-lg text-slate-600 mb-6">
            Skontaktuj się z nami - chętnie odpowiemy na wszystkie Twoje wątpliwości
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={createPageUrl("Kontakt")}
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
            >
              <span>Skontaktuj się z nami</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to={createPageUrl("Konfigurator")}
              className="inline-flex items-center justify-center space-x-2 bg-white text-orange-600 border-2 border-orange-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-orange-50 transition-all duration-300"
            >
              <span>Wypróbuj konfigurator</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}