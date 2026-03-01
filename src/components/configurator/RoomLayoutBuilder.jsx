import React, { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Edit2, Save, X, Lightbulb, Sun, Wind, Thermometer, Shield, Camera, Wifi, Home, Wand2, Car, Waves, Bed, DoorOpen, Warehouse, Bath, Sofa, WashingMachine, Flame, Boxes, Shirt, Utensils, Laugh, Briefcase, Book, Dumbbell } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const roomTypes = [
  { value: "Dzienne", icon: Home, color: "from-orange-500 to-orange-400", category: "dzienne", examples: "salon, kuchnia, jadalnia" },
  { value: "Sypialniane", icon: Bed, color: "from-purple-500 to-purple-400", category: "sypialniane", examples: "sypialnia, pokój gościnny" },
  { value: "Komunikacyjne", icon: DoorOpen, color: "from-blue-500 to-blue-400", category: "komunikacyjne", examples: "korytarz, przedsionek, hol" },
  { value: "Gospodarcze", icon: Warehouse, color: "from-slate-600 to-slate-500", category: "gospodarcze", examples: "garaż, pralnia, kotłownia" },
];

export default function RoomLayoutBuilder({ rooms, onChange, selectedOptions }) {
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [autoFillCount, setAutoFillCount] = useState("");
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "Dzienne",
    features: []
  });

  const getFeatureIcon = (feature) => {
    const icons = {
      "Oświetlenie": Lightbulb,
      "Oświetlenie zewnętrzne": Sun,
      "Zacienianie": Sun,
      "Ogrzewanie": Thermometer,
      "Wentylacja": Wind,
      "System alarmowy": Shield,
      "System alarmowy (centrala)": Shield,
      "System alarmowy (czujniki)": Shield,
      "Monitoring": Camera,
      "Sieć komputerowa": Wifi,
      "Kontrola dostępu": DoorOpen,
      "Brama garażowa": Car,
      "Brama wjazdowa": Car,
      "Ładowarka elektryczna": Car,
      "Nawadnianie": Waves,
      "Audio": Home,
      "Klimatyzacja": Wind,
      "Rekuperacja": Wind,
      "Inteligentne gniazdka": Lightbulb,
      "Pompa ciepła": Thermometer,
      "Fotowoltaika": Sun,
      "Zarządzanie energią": Lightbulb,
    };
    return icons[feature] || Lightbulb;
  };

  const getApplicableFeatures = (roomType) => {
    const allBasicFeatures = selectedOptions.podstawowe || [];
    const allAdditionalFeatures = selectedOptions.dodatkowe || [];
    let features = [];
    
    const category = roomTypes.find(rt => rt.value === roomType)?.category || "";
    
    // Oświetlenie - w każdym pomieszczeniu
    if (allBasicFeatures.includes("Oświetlenie")) {
      features.push("Oświetlenie");
    }
    
    // Oświetlenie zewnętrzne - tylko w dziennych (taras)
    if (allBasicFeatures.includes("Oświetlenie zewnętrzne") && category === "dzienne") {
      features.push("Oświetlenie zewnętrzne");
    }
    
    // Zacienianie (rolety) - tylko w pomieszczeniach dziennych i sypialnianych
    if (allBasicFeatures.includes("Zacienianie") && (category === "dzienne" || category === "sypialniane")) {
      features.push("Zacienianie");
    }
    
    // Kontrola dostępu - przy wejściach (komunikacyjne i gospodarcze)
    if (allBasicFeatures.includes("Kontrola dostępu") && (category === "komunikacyjne" || category === "gospodarcze")) {
      features.push("Kontrola dostępu");
    }
    
    // Monitoring (kamery) - newralgiczne punkty
    if (allBasicFeatures.includes("Monitoring") && (category === "gospodarcze" || category === "komunikacyjne")) {
      features.push("Monitoring");
    }
    
    // System alarmowy - centrala w pomieszczeniu technicznym
    if (allBasicFeatures.includes("System alarmowy") && category === "gospodarcze") {
      features.push("System alarmowy (centrala)");
    } else if (allBasicFeatures.includes("System alarmowy")) {
      features.push("System alarmowy (czujniki)");
    }
    
    // Ogrzewanie - we wszystkich pomieszczeniach poza gospodarczymi
    if (allBasicFeatures.includes("Ogrzewanie") && category !== "gospodarcze") {
      features.push("Ogrzewanie");
    }
    
    // Wentylacja - wszędzie gdzie potrzebna (komunikacyjne i gospodarcze)
    if (allBasicFeatures.includes("Wentylacja") && (category === "komunikacyjne" || category === "gospodarcze")) {
      features.push("Wentylacja");
    }
    
    // Sieć komputerowa - pomieszczenia dzienne i sypialniane
    if (allBasicFeatures.includes("Sieć komputerowa") && (category === "dzienne" || category === "sypialniane")) {
      features.push("Sieć komputerowa");
    }
    
    // Opcje dodatkowe
    if (allAdditionalFeatures.includes("Brama garażowa") && category === "gospodarcze") {
      features.push("Brama garażowa");
    }
    
    if (allAdditionalFeatures.includes("Brama wjazdowa") && category === "gospodarcze") {
      features.push("Brama wjazdowa");
    }
    
    if (allAdditionalFeatures.includes("Ładowarka elektryczna") && category === "gospodarcze") {
      features.push("Ładowarka elektryczna");
      if (allAdditionalFeatures.includes("Zarządzanie energią")) {
        features.push("Zarządzanie energią");
      }
    }
    
    if (allAdditionalFeatures.includes("Nawadnianie") && category === "dzienne") {
      features.push("Nawadnianie");
    }
    
    if (allAdditionalFeatures.includes("Audio") && (category === "dzienne" || category === "sypialniane")) {
      features.push("Audio");
    }
    
    if (allAdditionalFeatures.includes("Klimatyzacja") && (category === "dzienne" || category === "sypialniane")) {
      features.push("Klimatyzacja");
    }
    
    if (allAdditionalFeatures.includes("Rekuperacja") && (category === "dzienne" || category === "sypialniane")) {
      features.push("Rekuperacja");
    }
    
    if (allAdditionalFeatures.includes("Inteligentne gniazdka") && (category === "dzienne" || category === "sypialniane" || category === "gospodarcze")) {
      features.push("Inteligentne gniazdka");
    }
    
    if (allAdditionalFeatures.includes("Pompa ciepła") && category === "gospodarcze") {
      features.push("Pompa ciepła");
    }
    
    if (allAdditionalFeatures.includes("Fotowoltaika") && category === "gospodarcze") {
      features.push("Fotowoltaika");
    }
    
    if (allAdditionalFeatures.includes("Zarządzanie energią") && category === "gospodarcze") {
      features.push("Zarządzanie energią");
    }
    
    return [...new Set(features)];
  };

  const getSuggestedFeatures = (roomType, currentFeatures) => {
    const allBasicFeatures = selectedOptions.podstawowe || [];
    const allAdditionalFeatures = selectedOptions.dodatkowe || [];
    const suggestions = [];

    const featureMapping = {
      "Garaż": {
        suggestions: {
          "Monitoring": ["Kontrola dostępu"],
          "Ładowarka elektryczna": ["Zarządzanie energią", "Fotowoltaika"]
        }
      },
      "Łazienka": {
        suggestions: {
          "Wentylacja": ["Rekuperacja"],
          "Ogrzewanie": ["Pompa ciepła"]
        }
      },
      "Kuchnia": {
        suggestions: {
          "Wentylacja": ["Rekuperacja"],
          "Inteligentne gniazdka": ["Zarządzanie energią"]
        }
      },
      "Taras": {
        suggestions: {
          "Oświetlenie zewnętrzne": ["Audio"],
          "Nawadnianie": ["Analiza pogody"]
        }
      },
      "Salon": {
        suggestions: {
          "Audio": ["Inteligentne gniazdka"],
          "Zacienianie": ["Analiza pogody"],
          "Ogrzewanie": ["Pompa ciepła", "Zarządzanie energią"]
        }
      }
    };

    const mapping = featureMapping[roomType];
    if (!mapping) return [];

    // Sprawdź sugestie na podstawie obecnych funkcji
    currentFeatures.forEach(feature => {
      if (mapping.suggestions[feature]) {
        mapping.suggestions[feature].forEach(suggested => {
          if (!allBasicFeatures.includes(suggested) && 
              !allAdditionalFeatures.includes(suggested) &&
              !suggestions.includes(suggested)) {
            suggestions.push(suggested);
          }
        });
      }
    });

    return suggestions;
  };

  const handleAddRoom = () => {
    if (!newRoom.name.trim()) return;
    
    const roomFeatures = getApplicableFeatures(newRoom.type);
    const suggestedFeatures = getSuggestedFeatures(newRoom.type, roomFeatures);
    
    const roomToAdd = {
      ...newRoom,
      id: Date.now().toString(),
      features: roomFeatures,
      suggestedFeatures: suggestedFeatures
    };
    
    onChange([...rooms, roomToAdd]);
    setNewRoom({ name: "", type: "Salon", features: [] });
    setIsAddingRoom(false);
  };

  const handleUpdateRoom = (roomId, updates) => {
    const updated = rooms.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    );
    onChange(updated);
  };

  const handleDeleteRoom = (roomId) => {
    onChange(rooms.filter(room => room.id !== roomId));
  };

  const getRoomTypeConfig = (type) => {
    return roomTypes.find(rt => rt.value === type) || roomTypes[0];
  };

  const handleAutoFill = () => {
    const count = parseInt(autoFillCount);
    if (!count || count < 1 || count > 20) {
      return;
    }

    const defaultRooms = [
      { name: "Salon", type: "Dzienne", icon: Sofa },
      { name: "Kuchnia", type: "Dzienne", icon: Utensils },
      { name: "Sypialnia główna", type: "Sypialniane", icon: Bed },
      { name: "Łazienka", type: "Dzienne", icon: Bath },
      { name: "Korytarz", type: "Komunikacyjne", icon: DoorOpen },
      { name: "Sypialnia 2", type: "Sypialniane", icon: Bed },
      { name: "Łazienka gościnna", type: "Dzienne", icon: Bath },
      { name: "Pokój gościnny", type: "Sypialniane", icon: Bed },
      { name: "Pralnia", type: "Gospodarcze", icon: WashingMachine },
      { name: "Garaż", type: "Gospodarcze", icon: Warehouse },
      { name: "Taras", type: "Dzienne", icon: Sun },
      { name: "Sypialnia 3", type: "Sypialniane", icon: Bed },
      { name: "Kotłownia", type: "Gospodarcze", icon: Flame },
      { name: "Korytarz 2", type: "Komunikacyjne", icon: DoorOpen },
      { name: "Łazienka 3", type: "Dzienne", icon: Bath },
      { name: "Jadalnia", type: "Dzienne", icon: Utensils },
      { name: "Garderoba", type: "Sypialniane", icon: Shirt },
      { name: "Hol", type: "Komunikacyjne", icon: DoorOpen },
      { name: "Spiżarnia", type: "Gospodarcze", icon: Boxes },
      { name: "Biuro", type: "Dzienne", icon: Briefcase },
      { name: "Przedsionek", type: "Komunikacyjne", icon: DoorOpen },
      { name: "Bawialnia", type: "Dzienne", icon: Laugh },
      { name: "Pokój dziecięcy", type: "Sypialniane", icon: Bed },
      { name: "Siłownia", type: "Gospodarcze", icon: Dumbbell }, 
      { name: "Pokój hobby", type: "Dzienne", icon: Wand2 },
      { name: "Biblioteka", type: "Dzienne", icon: Book }, 
      { name: "Balkon", type: "Dzienne", icon: Sun },
    ];

    const roomsToAdd = defaultRooms.slice(0, count).map((room, idx) => ({
      ...room,
      id: `${Date.now()}-${idx}`,
      features: getApplicableFeatures(room.type)
    }));

    onChange([...rooms, ...roomsToAdd]);
    setShowAutoFill(false);
    setAutoFillCount("");
  };

  return (
    <div className="space-y-6">
      {/* Add Room Buttons */}
      {!isAddingRoom && !showAutoFill && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setIsAddingRoom(true)}
              variant="outline"
              className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Dodaj pomieszczenie
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setShowAutoFill(true)}
              variant="outline"
              className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Wypełnij automatycznie
            </Button>
          </motion.div>
        </div>
      )}

      {/* Auto Fill Form */}
      <AnimatePresence>
        {showAutoFill && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Automatyczne wypełnianie</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auto-count">Ile pomieszczeń chcesz dodać? (1-20)</Label>
                    <Input
                      id="auto-count"
                      type="number"
                      min="1"
                      max="20"
                      value={autoFillCount}
                      onChange={(e) => setAutoFillCount(e.target.value)}
                      placeholder="np. 5"
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-600 mt-2">
                      Dodamy przykładowe pomieszczenia z odpowiednimi funkcjami smart home
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAutoFill} className="flex-1 bg-orange-600 hover:bg-orange-700">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Dodaj automatycznie
                    </Button>
                    <Button onClick={() => setShowAutoFill(false)} variant="outline" className="sm:w-auto">
                      <X className="w-4 h-4 mr-2" />
                      Anuluj
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Room Form */}
      <AnimatePresence>
        {isAddingRoom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Nowe pomieszczenie</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="room-name">Nazwa pomieszczenia *</Label>
                <Input
                  id="room-name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="np. Salon"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="room-type">Kategoria pomieszczenia</Label>
                <Select
                  value={newRoom.type}
                  onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Typ pomieszczenia" className="text-left" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">{type.value}</span>
                          <span className="text-xs text-slate-500">{type.examples}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  Wybierz kategorię, a nazwa może być dowolna (np. "Sypialnia rodziców")
                </p>
              </div>



              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAddRoom} className="flex-1 bg-orange-600 hover:bg-orange-700">
                  <Save className="w-4 h-4 mr-2" />
                  Dodaj
                </Button>
                <Button onClick={() => setIsAddingRoom(false)} variant="outline" className="sm:w-auto">
                  <X className="w-4 h-4 mr-2" />
                  Anuluj
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Room Grid */}
      {rooms.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Twój układ pomieszczeń</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {rooms.map((room) => {
                const roomConfig = getRoomTypeConfig(room.type);
                const RoomIcon = room.icon || roomConfig.icon;
                const isEditing = editingRoom === room.id;

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all h-full">
                    <CardContent className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={room.name}
                            onChange={(e) => handleUpdateRoom(room.id, { name: e.target.value })}
                            className="text-sm"
                          />
                          <Select
                            value={room.type}
                            onValueChange={(value) => handleUpdateRoom(room.id, { type: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roomTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => setEditingRoom(null)}
                            className="w-full bg-orange-600"
                          >
                            Zapisz
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Room Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-1 sm:space-x-3 flex-1 min-w-0">
                              <div className={`w-12 h-12 flex-shrink-0 bg-gradient-to-br ${roomConfig.color} rounded-lg flex items-center justify-center`}>
                                <RoomIcon className="w-6 h-6 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-base truncate">{room.name}</div>
                                <div className="text-sm text-slate-500">{room.type}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              <button
                                onClick={() => setEditingRoom(room.id)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>

                          {/* Features */}
                          {room.features && room.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {room.features.map((feature, idx) => {
                                const FeatureIcon = getFeatureIcon(feature);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-1 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1"
                                    title={feature}
                                  >
                                    <FeatureIcon className="w-3 h-3 text-orange-600" />
                                    <span className="text-xs text-slate-700">{feature}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {(!room.features || room.features.length === 0) && (
                            <div className="text-xs text-slate-400 italic">
                              Standardowy pokój
                            </div>
                          )}

                          {/* Suggested Features */}
                          {room.suggestedFeatures && room.suggestedFeatures.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="text-xs font-semibold text-orange-600 uppercase mb-2 flex items-center">
                                <Lightbulb className="w-3 h-3 mr-1" />
                                Sugerowane opcje:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {room.suggestedFeatures.map((feature, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg border border-orange-300 border-dashed"
                                    title={`Rozważ dodanie: ${feature}`}
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {rooms.length === 0 && !isAddingRoom && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Home className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Dodaj pomieszczenia, aby stworzyć układ swojego domu</p>
        </div>
      )}
    </div>
  );
}
RoomLayoutBuilder.propTypes = {
  rooms: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    features: PropTypes.array,
  })).isRequired,
  onChange: PropTypes.func.isRequired,
  selectedOptions: PropTypes.object.isRequired,
};
