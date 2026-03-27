import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Code2, Award, Cpu, GitBranch, ArrowRight, Zap } from "lucide-react";

export default function ONas() {
  const differentiators = [
    {
      icon: Code2,
      title: "Myślę w kodzie, nie w kablach",
      description: "Większość firm smart home to elektrycy, którzy nauczyli się Loxone. Ja podchodzę do tego odwrotnie — jako programista widzę w Miniserver sterownik, który można zaprogramować porządnie, nie \"jakoś działać\". To robi różnicę przy złożonych automatyzacjach."
    },
    {
      icon: GitBranch,
      title: "Logika, nie klikanie w szablony",
      description: "Gotowe scenariusze z tutoriali robią każdy. Potrafię zamodelować logikę sterowania od zera — z obsługą stanów, warunków brzegowych i przypadków których nikt nie przewidział. Dom działa tak jak ma, nie \"prawie tak\"."
    },
    {
      icon: Cpu,
      title: "Integracje bez kompromisów",
      description: "Loxone mówi Modbus, KNX, HTTP, MQTT. To nie są magiczne słowa — to protokoły, które znam. Jeśli producent udostępnia API, jestem w stanie z niego skorzystać. Twoja pompa ciepła, fotowoltaika, rekuperacja — wszystko pod jednym dachem."
    },
    {
      icon: Zap,
      title: "Jeden człowiek, pełna odpowiedzialność",
      description: "Nie ma \"nasz dział techniczny się tym zajmie\". Rozmawiasz bezpośrednio ze mną, projekt robi też ja. Wiesz z kim masz do czynienia i kto odpowiada za efekt. Dla mnie to wygoda, dla Ciebie — konkretna osoba do kontaktu."
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 pb-2.5 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            O designiQ
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Bydgoszcz. Jeden programista. Jedno narzędzie opanowane na wylot.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">

          {/* Główny blok — kim jestem */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              designiQ to ja
            </h2>
            <div className="text-slate-600 leading-relaxed space-y-4 text-[15px]">
              <p>
                Jestem programistą, który wpadł w Loxone i nie wyszedł. Nie dlatego że musiałem —
                dlatego że to jedna z niewielu platform w tej branży, gdzie naprawdę można
                <strong className="text-slate-900"> pisać logikę</strong>, a nie tylko klikać w gotowe bloczki.
              </p>
              <p>
                Firma jest jednoosobowa — celowo. Nie buduję korporacji, buduję projekty które
                działają. Każda instalacja, którą projektuję, przechodzi przez moje ręce i głowę
                od pierwszego szkicu do uruchomienia. Jeśli coś jest źle — wiem o tym natychmiast,
                bo nie mam przed kim tego ukryć.
              </p>
              <p>
                Działam z <strong className="text-slate-900">Bydgoszczy</strong> i obsługuję klientów
                z całego kujawsko-pomorskiego. Jestem
                <strong className="text-orange-600"> certyfikowanym partnerem Loxone</strong> — nie
                dlatego żeby mieć logo na stronie, ale dlatego że chciałem mieć dostęp do materiałów
                technicznych których nie ma publicznie.
              </p>
            </div>
          </div>

          {/* Cytat / wyróżnik */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 lg:p-10 border border-slate-700">
            <p className="text-xl lg:text-2xl font-medium text-white leading-relaxed">
              "Większość problemów ze smart home nie leży w sprzęcie.
              Leży w tym, że ktoś zaprogramował go byle jak."
            </p>
            <p className="text-slate-400 mt-4 text-sm">
              Dlatego zaczynałem od kodu, nie od kabli.
            </p>
          </div>

          {/* Czym się różnię */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              Co z tego masz?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {differentiators.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1.5">{item.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badge Loxone */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 px-6 py-3 rounded-full">
              <Award className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-900 text-sm">Certyfikowany Partner Loxone</span>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-slate-800 rounded-3xl p-8 lg:p-12 text-center text-white shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">Porozmawiajmy o Twoim projekcie</h2>
            <p className="text-orange-100 mb-8 max-w-xl mx-auto">
              Napisz lub zadzwoń. Bez formularzy zapytań ofertowych, bez "oddzwonimy" —
              możemy porozmawiać od razu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("Kontakt")}
                className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold hover:bg-orange-50 transition-all duration-300 shadow-xl hover:scale-105"
              >
                <span>Napisz do mnie</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={createPageUrl("Konfigurator")}
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300"
              >
                <span>Sprawdź konfigurator</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}