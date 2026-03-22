import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Plus, Trash2, Edit2, Save, X, Lightbulb, Sun, Wind, Thermometer, Shield, Camera,
  Wifi, Home, Wand2, Car, Waves, Bed, DoorOpen, Warehouse, Bath, Sofa, WashingMachine,
  Flame, Boxes, Shirt, Utensils, Briefcase, Book, Dumbbell, Leaf, RefreshCw
} from "lucide-react";
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
  { value: "Dzienne",        icon: Home,      color: "from-orange-500 to-orange-400", category: "dzienne",      examples: "salon, kuchnia, jadalnia, biuro" },
  { value: "Sypialniane",    icon: Bed,       color: "from-purple-500 to-purple-400", category: "sypialniane",  examples: "sypialnia, pokój gościnny, garderoba" },
  { value: "Sanitarne",      icon: Bath,      color: "from-cyan-500 to-cyan-400",     category: "sanitarne",    examples: "łazienka, WC, toaleta, sauna" },
  { value: "Komunikacyjne",  icon: DoorOpen,  color: "from-blue-500 to-blue-400",     category: "komunikacyjne",examples: "korytarz, przedsionek, hol" },
  { value: "Gospodarcze",    icon: Warehouse, color: "from-slate-600 to-slate-500",   category: "gospodarcze",  examples: "garaż, pralnia, kotłownia, spiżarnia" },
  { value: "Zewnętrzne",     icon: Leaf,      color: "from-green-600 to-green-500",   category: "zewnetrzne",   examples: "taras, balkon, ogród, patio" },
];

// Automatyczna detekcja typu pomieszczenia na podstawie nazwy
function detectRoomType(name) {
  const n = name.toLowerCase().trim();
  if (/łazienka|wc|toaleta|prysznic|sauna|jacuzzi/.test(n))               return "Sanitarne";
  if (/taras|balkon|ogr[oó]d|patio|ganek|weranda|altana/.test(n))         return "Zewnętrzne";
  if (/sypialnia|pokój\s*(dziec|goś|hobby)|bawialnia/.test(n))            return "Sypialniane";
  if (/garderoba/.test(n))                                                  return "Sypialniane";
  if (/garaż|kotłownia|pralnia|spiżarnia|schowek|piwnica|techniczn|kotło/.test(n)) return "Gospodarcze";
  if (/korytarz|hol|przedsionek|wiatrołap|hall|klatka/.test(n))           return "Komunikacyjne";
  return null;
}

function getCategory(type) {
  return roomTypes.find(rt => rt.value === type)?.category || "dzienne";
}

export default function RoomLayoutBuilder({ rooms, onChange, selectedOptions }) {
  const [editingRoom, setEditingRoom] = useState(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [autoFillCount, setAutoFillCount] = useState("");
  const [newRoom, setNewRoom] = useState({ name: "", type: "Dzienne", features: [] });
  const [detectedType, setDetectedType] = useState(null); // for hint

  const getFeatureIcon = (feature) => {
    const icons = {
      "Oświetlenie":               Lightbulb,
      "Oświetlenie zewnętrzne":    Sun,
      "Zacienianie":               Sun,
      "Ogrzewanie":                Thermometer,
      "Wentylacja":                Wind,
      "System alarmowy":           Shield,
      "System alarmowy (centrala)":Shield,
      "System alarmowy (czujniki)":Shield,
      "Monitoring":                Camera,
      "Sieć komputerowa":          Wifi,
      "Kontrola dostępu":          DoorOpen,
      "Brama garażowa":            Car,
      "Brama wjazdowa":            Car,
      "Ładowarka elektryczna":     Car,
      "Nawadnianie":               Waves,
      "Audio":                     Home,
      "Klimatyzacja":              Wind,
      "Rekuperacja":               Wind,
      "Inteligentne gniazdka":     Lightbulb,
      "Pompa ciepła":              Thermometer,
      "Fotowoltaika":              Sun,
      "Zarządzanie energią":       Lightbulb,
      "Analiza pogody":            Sun,
    };
    return icons[feature] || Lightbulb;
  };

  /**
   * Przypisuje funkcje Smart Home do pomieszczenia na podstawie jego kategorii
   * i wybranych opcji w kroku 2.
   *
   * isFirstGospodarcze – flaga: pierwsze pomieszczenie gospodarcze dostaje
   * "System alarmowy (centrala)", reszta tylko czujniki.
   */
  const getApplicableFeatures = (roomType, isFirstGospodarcze = false) => {
    const basic = selectedOptions.podstawowe || [];
    const extra = selectedOptions.dodatkowe || [];
    const f = [];
    const cat = getCategory(roomType);

    switch (cat) {
      case "dzienne":
        // Pokoje dzienne: salon, kuchnia, jadalnia, biuro itp.
        if (basic.includes("Oświetlenie"))           f.push("Oświetlenie");
        if (basic.includes("Zacienianie"))            f.push("Zacienianie");
        if (basic.includes("Ogrzewanie"))             f.push("Ogrzewanie");
        if (basic.includes("Sieć komputerowa"))       f.push("Sieć komputerowa");
        if (basic.includes("System alarmowy"))        f.push("System alarmowy (czujniki)");
        if (extra.includes("Audio"))                  f.push("Audio");
        if (extra.includes("Klimatyzacja"))           f.push("Klimatyzacja");
        if (extra.includes("Rekuperacja"))            f.push("Rekuperacja");
        if (extra.includes("Inteligentne gniazdka"))  f.push("Inteligentne gniazdka");
        break;

      case "sypialniane":
        // Sypialnie i pokoje gościnne
        if (basic.includes("Oświetlenie"))            f.push("Oświetlenie");
        if (basic.includes("Zacienianie"))             f.push("Zacienianie");
        if (basic.includes("Ogrzewanie"))              f.push("Ogrzewanie");
        if (basic.includes("Sieć komputerowa"))        f.push("Sieć komputerowa");
        if (basic.includes("System alarmowy"))         f.push("System alarmowy (czujniki)");
        if (extra.includes("Audio"))                   f.push("Audio");
        if (extra.includes("Klimatyzacja"))            f.push("Klimatyzacja");
        if (extra.includes("Rekuperacja"))             f.push("Rekuperacja");
        if (extra.includes("Inteligentne gniazdka"))   f.push("Inteligentne gniazdka");
        break;

      case "sanitarne":
        // Łazienki, WC, toalety – wentylacja obowiązkowa, bez rolet i zewnętrznych
        if (basic.includes("Oświetlenie"))             f.push("Oświetlenie");
        if (basic.includes("Ogrzewanie"))              f.push("Ogrzewanie");
        if (basic.includes("Wentylacja"))              f.push("Wentylacja");
        if (basic.includes("System alarmowy"))         f.push("System alarmowy (czujniki)");
        if (extra.includes("Rekuperacja"))             f.push("Rekuperacja");
        break;

      case "komunikacyjne":
        // Korytarze, hol, przedsionek – kontrola dostępu i monitoring przy wejściach
        if (basic.includes("Oświetlenie"))             f.push("Oświetlenie");
        if (basic.includes("Kontrola dostępu"))        f.push("Kontrola dostępu");
        if (basic.includes("Monitoring"))              f.push("Monitoring");
        if (basic.includes("System alarmowy"))         f.push("System alarmowy (czujniki)");
        if (basic.includes("Wentylacja"))              f.push("Wentylacja");
        break;

      case "gospodarcze":
        // Garaż, kotłownia, pralnia – centrala alarmowa tylko w pierwszym
        if (basic.includes("Oświetlenie"))             f.push("Oświetlenie");
        if (basic.includes("System alarmowy"))
          f.push(isFirstGospodarcze ? "System alarmowy (centrala)" : "System alarmowy (czujniki)");
        if (basic.includes("Monitoring"))              f.push("Monitoring");
        if (basic.includes("Kontrola dostępu"))        f.push("Kontrola dostępu");
        if (basic.includes("Wentylacja"))              f.push("Wentylacja");
        if (extra.includes("Brama garażowa"))          f.push("Brama garażowa");
        if (extra.includes("Brama wjazdowa"))          f.push("Brama wjazdowa");
        if (extra.includes("Ładowarka elektryczna"))   f.push("Ładowarka elektryczna");
        if (extra.includes("Pompa ciepła"))            f.push("Pompa ciepła");
        if (extra.includes("Fotowoltaika"))            f.push("Fotowoltaika");
        if (extra.includes("Zarządzanie energią"))     f.push("Zarządzanie energią");
        if (extra.includes("Inteligentne gniazdka"))   f.push("Inteligentne gniazdka");
        break;

      case "zewnetrzne":
        // Taras, balkon, ogród – oświetlenie zewnętrzne, nawadnianie, kamery
        if (basic.includes("Oświetlenie zewnętrzne"))  f.push("Oświetlenie zewnętrzne");
        if (basic.includes("System alarmowy"))         f.push("System alarmowy (czujniki)");
        if (basic.includes("Monitoring"))              f.push("Monitoring");
        if (basic.includes("Kontrola dostępu"))        f.push("Kontrola dostępu");
        if (extra.includes("Nawadnianie"))             f.push("Nawadnianie");
        if (extra.includes("Audio"))                   f.push("Audio");
        if (extra.includes("Analiza pogody"))          f.push("Analiza pogody");
        break;

      default:
        if (basic.includes("Oświetlenie"))             f.push("Oświetlenie");
    }

    return [...new Set(f)];
  };

  // Sprawdza czy wśród istniejących pomieszczeń jest już jakieś gospodarcze
  const hasExistingGospodarcze = (excludeId = null) =>
    rooms.some(r => r.id !== excludeId && getCategory(r.type) === "gospodarcze");

  const handleAddRoom = () => {
    if (!newRoom.name.trim()) return;
    const isFirstGosp = !hasExistingGospodarcze() && getCategory(newRoom.type) === "gospodarcze";
    onChange([...rooms, {
      ...newRoom,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      features: getApplicableFeatures(newRoom.type, isFirstGosp),
    }]);
    setNewRoom({ name: "", type: "Dzienne", features: [] });
    setDetectedType(null);
    setIsAddingRoom(false);
  };

  const handleUpdateRoom = (roomId, updates) => {
    onChange(rooms.map(r => r.id === roomId ? { ...r, ...updates } : r));
  };

  // Zmiana typu w trybie edycji → automatyczne przeliczenie funkcji
  const handleTypeChange = (roomId, newType) => {
    const isFirstGosp = !hasExistingGospodarcze(roomId) && getCategory(newType) === "gospodarcze";
    handleUpdateRoom(roomId, {
      type: newType,
      features: getApplicableFeatures(newType, isFirstGosp),
    });
  };

  const handleDeleteRoom = (roomId) => {
    onChange(rooms.filter(r => r.id !== roomId));
  };

  const getRoomTypeConfig = (type) => roomTypes.find(rt => rt.value === type) || roomTypes[0];

  // Auto-fill z domyślną listą pomieszczeń – poprawione typy
  const defaultRooms = [
    { name: "Salon",              type: "Dzienne",       icon: Sofa },
    { name: "Kuchnia",            type: "Dzienne",       icon: Utensils },
    { name: "Sypialnia główna",   type: "Sypialniane",   icon: Bed },
    { name: "Łazienka",           type: "Sanitarne",     icon: Bath },
    { name: "Korytarz",           type: "Komunikacyjne", icon: DoorOpen },
    { name: "Sypialnia 2",        type: "Sypialniane",   icon: Bed },
    { name: "Łazienka gościnna",  type: "Sanitarne",     icon: Bath },
    { name: "Pokój gościnny",     type: "Sypialniane",   icon: Bed },
    { name: "Pralnia",            type: "Gospodarcze",   icon: WashingMachine },
    { name: "Garaż",              type: "Gospodarcze",   icon: Warehouse },
    { name: "Taras",              type: "Zewnętrzne",    icon: Leaf },
    { name: "Sypialnia 3",        type: "Sypialniane",   icon: Bed },
    { name: "Kotłownia",          type: "Gospodarcze",   icon: Flame },
    { name: "Hol",                type: "Komunikacyjne", icon: DoorOpen },
    { name: "Łazienka 3",         type: "Sanitarne",     icon: Bath },
    { name: "Jadalnia",           type: "Dzienne",       icon: Utensils },
    { name: "Garderoba",          type: "Sypialniane",   icon: Shirt },
    { name: "Przedsionek",        type: "Komunikacyjne", icon: DoorOpen },
    { name: "Spiżarnia",          type: "Gospodarcze",   icon: Boxes },
    { name: "Biuro",              type: "Dzienne",       icon: Briefcase },
  ];

  const handleAutoFill = () => {
    const count = parseInt(autoFillCount);
    if (!count || count < 1 || count > 20) return;

    let firstGospRemaining = !hasExistingGospodarcze();
    const roomsToAdd = defaultRooms.slice(0, count).map((room, idx) => {
      const isFirstGosp = firstGospRemaining && getCategory(room.type) === "gospodarcze";
      if (isFirstGosp) firstGospRemaining = false;
      return {
        ...room,
        id: `${Date.now()}-${idx}`,
        features: getApplicableFeatures(room.type, isFirstGosp),
      };
    });

    onChange([...rooms, ...roomsToAdd]);
    setShowAutoFill(false);
    setAutoFillCount("");
  };

  const handleNewRoomNameChange = (value) => {
    const detected = detectRoomType(value);
    setDetectedType(detected);
    setNewRoom(prev => ({
      ...prev,
      name: value,
      ...(detected ? { type: detected } : {}),
    }));
  };

  const autoFillPreview = autoFillCount && parseInt(autoFillCount) > 0
    ? defaultRooms.slice(0, Math.min(parseInt(autoFillCount), 20)).map(r => r.name).join(", ")
    : null;

  return (
    <div className="space-y-6">
      {/* Add / AutoFill buttons */}
      {!isAddingRoom && !showAutoFill && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => setIsAddingRoom(true)} variant="outline"
              className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600">
              <Plus className="w-5 h-5 mr-2" />
              Dodaj pomieszczenie
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => setShowAutoFill(true)} variant="outline"
              className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600">
              <Wand2 className="w-5 h-5 mr-2" />
              Wypełnij automatycznie
            </Button>
          </motion.div>
        </div>
      )}

      {/* Auto Fill Form */}
      <AnimatePresence>
        {showAutoFill && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Automatyczne wypełnianie</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auto-count">Ile pomieszczeń chcesz dodać? (1–20)</Label>
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
                    {autoFillPreview && (
                      <p className="text-xs text-slate-500 mt-2">
                        Zostaną dodane: <span className="text-slate-700 font-medium">{autoFillPreview}</span>
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">
                      Każde pomieszczenie otrzyma funkcje Smart Home dopasowane do swojego typu.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAutoFill} className="flex-1 bg-orange-600 hover:bg-orange-700">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Dodaj automatycznie
                    </Button>
                    <Button onClick={() => { setShowAutoFill(false); setAutoFillCount(""); }} variant="outline" className="sm:w-auto">
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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Nowe pomieszczenie</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="room-name">Nazwa pomieszczenia *</Label>
                    <Input
                      id="room-name"
                      value={newRoom.name}
                      onChange={(e) => handleNewRoomNameChange(e.target.value)}
                      placeholder="np. Salon, Łazienka, Taras..."
                      className="mt-2"
                      autoFocus
                    />
                    {detectedType && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Typ wykryty automatycznie: <strong>{detectedType}</strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="room-type">Kategoria pomieszczenia</Label>
                    <Select
                      value={newRoom.type}
                      onValueChange={(value) => {
                        setDetectedType(null);
                        setNewRoom({ ...newRoom, type: value });
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Typ pomieszczenia" />
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
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAddRoom} disabled={!newRoom.name.trim()} className="flex-1 bg-orange-600 hover:bg-orange-700">
                      <Save className="w-4 h-4 mr-2" />
                      Dodaj
                    </Button>
                    <Button onClick={() => { setIsAddingRoom(false); setNewRoom({ name: "", type: "Dzienne", features: [] }); setDetectedType(null); }} variant="outline" className="sm:w-auto">
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
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Twój układ pomieszczeń
            <span className="ml-2 text-sm font-normal text-slate-500">({rooms.length} {rooms.length === 1 ? "pomieszczenie" : rooms.length < 5 ? "pomieszczenia" : "pomieszczeń"})</span>
          </h3>
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
                    whileHover={{ y: -4 }}
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
                              autoFocus
                            />
                            <Select
                              value={room.type}
                              onValueChange={(value) => handleTypeChange(room.id, value)}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
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
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Zmiana kategorii automatycznie aktualizuje funkcje.
                            </p>
                            <Button size="sm" onClick={() => setEditingRoom(null)} className="w-full bg-orange-600">
                              <Save className="w-3 h-3 mr-1" />
                              Gotowe
                            </Button>
                          </div>
                        ) : (
                          <>
                            {/* Room Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className={`w-11 h-11 flex-shrink-0 bg-gradient-to-br ${roomConfig.color} rounded-lg flex items-center justify-center`}>
                                  <RoomIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 text-sm truncate">{room.name}</div>
                                  <div className="text-xs text-slate-400">{room.type}</div>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 ml-1">
                                <button onClick={() => setEditingRoom(room.id)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button onClick={() => handleDeleteRoom(room.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            </div>

                            {/* Features */}
                            {room.features && room.features.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {room.features.map((feature, idx) => {
                                  const FeatureIcon = getFeatureIcon(feature);
                                  return (
                                    <div key={idx} className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-md px-2 py-0.5" title={feature}>
                                      <FeatureIcon className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                      <span className="text-xs text-slate-700">{feature}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic mt-1">
                                Brak funkcji Smart Home
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

      {rooms.length === 0 && !isAddingRoom && !showAutoFill && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Brak pomieszczeń</p>
          <p className="text-slate-400 text-sm mt-1">Dodaj pomieszczenia ręcznie lub skorzystaj z wypełnienia automatycznego</p>
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
