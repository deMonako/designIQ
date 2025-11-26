import React from "react";
import { Shield, Cookie, Lock, Eye, Mail, Globe } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

export default function PolitykaPrywatnosci() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Polityka Prywatności
          </h1>
          <p className="text-slate-600">
            Ostatnia aktualizacja: 20 listopada 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Administrator */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-slate-900">Administrator Danych</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">
                Administratorem Twoich danych osobowych jest designiQ z siedzibą przy ul. Żeglarska 18/1, 85-519 Bydgoszcz.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-slate-700">
                  <strong>Kontakt:</strong> kontakt@designiq.pl<br />
                  <strong>Telefon:</strong> 782-109-286
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Zakres danych */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-slate-900">Zakres przetwarzanych danych</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">
                Podczas korzystania z naszej strony możemy przetwarzać następujące dane:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Dane kontaktowe:</strong> imię, nazwisko, adres e-mail, numer telefonu</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Dane konfiguracji:</strong> metraż domu, wybrane pakiety i opcje smart home</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Dane techniczne:</strong> adres IP, typ przeglądarki, system operacyjny</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Dane behawioralne:</strong> czas spędzony na stronie, odwiedzone podstrony (za zgodą)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Cele przetwarzania */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-slate-900">Cele i podstawy prawne</h2>
              </div>
              <div className="space-y-4 text-slate-700">
                <div>
                  <h3 className="font-semibold mb-2">1. Obsługa zapytań (art. 6 ust. 1 lit. b RODO)</h3>
                  <p className="leading-relaxed">
                    Przetwarzamy dane w celu realizacji zapytań ofertowych, kontaktu z klientem 
                    i wykonania potencjalnej umowy.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Marketing (art. 6 ust. 1 lit. a RODO)</h3>
                  <p className="leading-relaxed">
                    Dane mogą być wykorzystywane do celów marketingowych wyłącznie za Twoją zgodą.
                    Możesz wycofać zgodę w dowolnym momencie.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Analiza statystyczna (art. 6 ust. 1 lit. f RODO)</h3>
                  <p className="leading-relaxed">
                    Wykorzystujemy Google Analytics do analizy ruchu na stronie (za zgodą na cookies).
                    Pozwala nam to optymalizować funkcjonowanie serwisu.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">4. Reklama (art. 6 ust. 1 lit. a RODO)</h3>
                  <p className="leading-relaxed">
                    Korzystamy z Google Ads do wyświetlania spersonalizowanych reklam wyłącznie za Twoją zgodą.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-slate-900">Polityka Cookies</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">
                Nasza strona wykorzystuje pliki cookies zgodnie z przepisami Rozporządzenia ePrivacy.
              </p>
              
              <h3 className="font-semibold text-lg mb-3">Rodzaje cookies:</h3>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Cookies niezbędne (zawsze aktywne)</h4>
                  <p className="text-slate-700 text-sm">
                    Służą do prawidłowego działania strony, np. zapamiętywanie wyboru języka czy zapisanych konfiguracji.
                    Są wymagane do działania strony.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Cookies analityczne (wymagają zgody)</h4>
                  <p className="text-slate-700 text-sm mb-2">
                    Google Analytics - zbieramy anonimowe statystyki odwiedzin, aby ulepszać naszą stronę.
                  </p>
                  <p className="text-slate-700 text-sm">
                    <strong>Wykorzystujemy Google Consent Mode v2</strong> - dane są zbierane dopiero po udzieleniu zgody.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Cookies marketingowe (wymagają zgody)</h4>
                  <p className="text-slate-700 text-sm">
                    Google Ads - służą do personalizacji reklam i remarketingu. Wykorzystujemy je wyłącznie 
                    po udzieleniu zgody na cookies marketingowe.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-slate-700 text-sm">
                  <strong>Zarządzanie cookies:</strong> Możesz w każdej chwili zmienić swoje preferencje dotyczące cookies 
                  poprzez banner wyświetlany przy pierwszej wizycie lub w ustawieniach przeglądarki.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Przekazywanie danych */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-slate-900">Przekazywanie danych</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">
                Twoje dane mogą być przekazywane następującym odbiorcom:
              </p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Google LLC</strong> - Google Analytics, Google Ads (USA, standardowe klauzule umowne)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Dostawcy usług IT</strong> - hosting, poczta elektroniczna (UE)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Loxone</strong> - producent systemów smart home (Austria, UE)</span>
                </li>
              </ul>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-slate-700 text-sm">
                  <strong>Transfer do krajów trzecich:</strong> W przypadku przekazywania danych poza EOG (np. Google) 
                  stosujemy standardowe klauzule umowne zatwierdzone przez Komisję Europejską.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Twoje prawa */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-slate-900">Twoje prawa</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-4">
                Zgodnie z RODO przysługują Ci następujące prawa:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo dostępu</strong> do swoich danych osobowych</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do sprostowania</strong> nieprawidłowych danych</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do usunięcia</strong> danych ("prawo do bycia zapomnianym")</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do ograniczenia przetwarzania</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do przenoszenia danych</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do sprzeciwu</strong> wobec przetwarzania</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do cofnięcia zgody</strong> w dowolnym momencie</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Prawo do wniesienia skargi</strong> do Prezesa UODO</span>
                </li>
              </ul>
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-slate-700 text-sm">
                  W celu skorzystania z powyższych praw, skontaktuj się z nami: kontakt@designiq.pl
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Okres przechowywania */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Okres przechowywania danych</h2>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Dane kontaktowe: przez czas niezbędny do realizacji celu lub do cofnięcia zgody</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Dane konfiguracji: do momentu usunięcia przez użytkownika lub 2 lata od ostatniej aktywności</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Dane analityczne: 26 miesięcy (Google Analytics)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Cookies marketingowe: do 90 dni lub do cofnięcia zgody</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Bezpieczeństwo */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Bezpieczeństwo danych</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Szyfrowanie połączeń SSL/TLS</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Regularne kopie zapasowe</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Ograniczony dostęp do danych osobowych</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3 flex-shrink-0"></span>
                  <span>Monitoring i audyt bezpieczeństwa</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Zmiany */}
          <Card className="border-2 border-orange-100 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Zmiany w polityce prywatności</h2>
              <p className="text-slate-700 leading-relaxed">
                Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. 
                O wszelkich istotnych zmianach poinformujemy poprzez banner na stronie lub e-mail 
                (jeśli wyraziłeś na to zgodę). Data ostatniej aktualizacji jest zawsze widoczna na górze dokumentu.
              </p>
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card className="border-2 border-orange-100 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Pytania?</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                W razie jakichkolwiek pytań dotyczących przetwarzania danych osobowych, 
                skontaktuj się z nami:
              </p>
              <div className="space-y-2">
                <p className="text-slate-900 font-semibold">
                  <Mail className="w-4 h-4 inline mr-2" />
                  kontakt@designiq.pl
                </p>
                <p className="text-slate-900 font-semibold">
                  📞 782-109-286
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}