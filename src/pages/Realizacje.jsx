import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../components/ui/card";
import { Home, MapPin, Calendar, Package, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function Realizacje() {
  const [selectedProject, setSelectedProject] = useState(null);

  const projects = [
    {
      id: 1,
      title: "Nowoczesna willa w Poznaniu",
      location: "Poznań, Wielkopolska",
      date: "2024-11-15",
      package: "Full house",
      area: "320 m²",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      description: "Kompleksowy system Smart Home w nowoczesnej willi. Integracja oświetlenia, ogrzewania, klimatyzacji, monitoringu i automatyki bram.",
      features: ["Oświetlenie LED", "Zacienianie", "Ogrzewanie", "Klimatyzacja", "Monitoring 360°", "Fotowoltaika", "Zarządzanie energią"]
    },
    {
      id: 2,
      title: "Dom jednorodzinny w Gdańsku",
      location: "Gdańsk, Pomorskie",
      date: "2024-10-22",
      package: "Smart design+",
      area: "180 m²",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      description: "Elegancki system automatyki w domu jednorodzinnym z naciskiem na efektywność energetyczną i komfort użytkowania.",
      features: ["Oświetlenie", "Ogrzewanie podłogowe", "Wentylacja", "System alarmowy", "Inteligentne gniazdka"]
    },
    {
      id: 3,
      title: "Apartament Premium - Warszawa",
      location: "Warszawa, Śródmieście",
      date: "2024-09-10",
      package: "Smart design",
      area: "95 m²",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      description: "Inteligentny apartament w centrum Warszawy z funkcjami automatyki dostosowanymi do stylu życia miejskiego.",
      features: ["Oświetlenie inteligentne", "Zacienianie automatyczne", "Audio multiroom", "Kontrola dostępu"]
    },
    {
      id: 4,
      title: "Rezydencja z basenem - Kraków",
      location: "Kraków, Małopolska",
      date: "2024-08-05",
      package: "Full house",
      area: "450 m²",
      image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop",
      description: "Luksusowa rezydencja z pełną automatyką, integracją systemu basenowego i zaawansowanym zarządzaniem energią.",
      features: ["Oświetlenie zewnętrzne", "Ogrzewanie", "Basen automatyczny", "Monitoring", "Fotowoltaika 15kW", "Pompa ciepła"]
    },
    {
      id: 5,
      title: "Dom pasywny - Wrocław",
      location: "Wrocław, Dolnośląskie",
      date: "2024-07-18",
      package: "Smart design+",
      area: "210 m²",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
      description: "Dom pasywny z inteligentnym zarządzaniem energią i rekuperacją. Nacisk na ekologię i minimalizację kosztów.",
      features: ["Rekuperacja", "Fotowoltaika", "Zarządzanie energią", "Ogrzewanie", "Wentylacja"]
    },
    {
      id: 6,
      title: "Nowoczesne bliźniaki - Katowice",
      location: "Katowice, Śląskie",
      date: "2024-06-30",
      package: "Smart design",
      area: "140 m²",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
      description: "Dwa identyczne domy bliźniacze z systemami Smart Home dostosowanymi do potrzeb młodych rodzin.",
      features: ["Oświetlenie", "Ogrzewanie", "Monitoring", "Sieć komputerowa"]
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-6">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Nasze Realizacje
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Zobacz projekty Smart Home, które stworzyliśmy dla naszych klientów. 
            Każda realizacja to indywidualne podejście i pełna automatyka dostosowana do potrzeb.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <Card className="border-2 border-slate-200 hover:border-orange-300 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer h-full"
                onClick={() => setSelectedProject(project)}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {project.package}
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{project.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                      {project.location}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                      {format(new Date(project.date), 'MMMM yyyy', { locale: pl })}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Home className="w-4 h-4 mr-2 text-orange-600" />
                      {project.area}
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg border border-orange-200"
                      >
                        {feature}
                      </span>
                    ))}
                    {project.features.length > 3 && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        +{project.features.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  className="w-full h-80 object-cover rounded-t-3xl"
                />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 bg-orange-600 text-white px-4 py-2 rounded-full font-semibold">
                  {selectedProject.package}
                </div>
              </div>

              <div className="p-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  {selectedProject.title}
                </h2>

                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center text-slate-600">
                    <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                    {selectedProject.location}
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                    {format(new Date(selectedProject.date), 'MMMM yyyy', { locale: pl })}
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Home className="w-5 h-5 mr-2 text-orange-600" />
                    {selectedProject.area}
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed mb-6">
                  {selectedProject.description}
                </p>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Zrealizowane funkcje:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProject.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg border border-orange-200"
                      >
                        <Package className="w-4 h-4" />
                        <span className="text-sm font-semibold">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}