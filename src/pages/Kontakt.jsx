import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Mail, Phone, MapPin, Calculator, Facebook, Instagram } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import ContactForm from "../components/forms/ContactForm";
import { COMPANY } from "../config/company";

export default function Kontakt() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 pb-2.5 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Skontaktuj się z nami
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Twój inteligentny dom zaczyna się od wyceny! Obsługujemy klientów z <strong className="text-slate-800">Bydgoszczy</strong> i całego regionu <strong className="text-slate-800">kujawsko-pomorskiego</strong>. Jesteśmy gotowi odpowiedzieć na wszystkie Twoje pytania.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16 items-start">
          {/* Contact Info */}
          <div className="space-y-8 h-full flex flex-col">
            <Card className="border-2 border-orange-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Dane kontaktowe</h2>
                <div className="space-y-6">
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Email</div>
                      <div className="text-orange-600">{COMPANY.email}</div>
                    </div>
                  </a>

                  <a
                    href={`tel:${COMPANY.phone}`}
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Telefon</div>
                      <div className="text-orange-600">{COMPANY.phoneDisplay}</div>
                    </div>
                  </a>

                  <div className="flex items-start space-x-4 p-4 rounded-xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Adres</div>
                      <div className="text-slate-600">
                        {COMPANY.address}<br />
                        {COMPANY.city}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Obserwuj nas</h3>
                  <div className="flex space-x-4">
                    <a
                      href={COMPANY.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-12 h-12 bg-orange-600 hover:bg-orange-700 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Facebook className="w-6 h-6 text-white" />
                    </a>
                    <a
                      href={COMPANY.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Instagram className="w-6 h-6 text-white" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Calculator CTA */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl flex-grow">
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div className="flex items-start space-x-4 mb-4 flex-grow">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Natychmiastowa wycena</h3>
                    <p className="text-slate-600">
                      Skorzystaj z naszego konfiguratora, aby szybko oszacować koszty i dostosować 
                      system Smart Home do swoich potrzeb.
                    </p>
                  </div>
                </div>
                <Link
                  to={createPageUrl("Konfigurator")}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 mt-auto"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Otwórz konfigurator</span>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="border-2 border-orange-100 shadow-xl h-full">
            <CardContent className="p-8 flex flex-col h-full">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Wyślij wiadomość</h2>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto text-center bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Szybka odpowiedź gwarantowana</h3>
          <p className="text-slate-600 leading-relaxed">
            Odpowiadamy na wszystkie zapytania w ciągu 24 godzin w dni robocze. 
            W przypadku pilnych spraw prosimy o kontakt telefoniczny.
          </p>
        </div>
      </div>
    </div>
  );
}