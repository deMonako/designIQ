import React, { useState, useEffect } from "react";
import { Calculator, Home, CheckCircle, ArrowRight, Layout as LayoutIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radioGroup";
import { Card, CardContent } from "../components/ui/card";
import { gtmEvent } from "../components/analytics";
import { motion, AnimatePresence } from "framer-motion";
import RoomLayoutBuilder from "../components/configurator/RoomLayoutBuilder";
import ConfiguratorContactForm from "../components/forms/ConfiguratorContactForm";

export default function Konfigurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    metraz: "",
    pakiet: "Smart design",
    podstawowe: [],
    dodatkowe: [],
    roomLayout: []
  });

  useEffect(() => {
    gtmEvent("configurator_start");
  }, []);

  const [showResult, setShowResult] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const configuratorRef = React.useRef(null);
  const [showValidationError, setShowValidationError] = useState({
    step1: false,
    step2: false,
    step3: false
  });

  const scrollToConfigurator = () => {
    if (configuratorRef.current) {
      const top = configuratorRef.current.getBoundingClientRect().top + window.scrollY - 35;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const scrollToForm = () => {
    setTimeout(() => {
      if (configuratorRef.current) {
        const top = configuratorRef.current.getBoundingClientRect().top + window.scrollY - 35;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 30);
  };

  const pakiety = [
    { 
      value: "Smart design", 
      label: "Smart design",
      description: "Projekt automatyki + projekt szafy"
    },
    { 
      value: "Smart design+", 
      label: "Smart design+",
      description: "Smart design + prefabrykacja"
    },
    { 
      value: "Full house", 
      label: "Full house",
      description: "Pełne uruchomienie + integracja"
    }
  ];

  const opcjePodstawowe = [
    "Oświetlenie", "Zacienianie", "Ogrzewanie", "Wentylacja",
    "System alarmowy", "Monitoring", "Sieć komputerowa",
    "Oświetlenie zewnętrzne", "Kontrola dostępu"
  ];

  const opcjeDodatkowe = [
    "Brama garażowa", "Brama wjazdowa", "Nawadnianie", "Audio",
    "Fotowoltaika", "Rekuperacja", "Klimatyzacja", 
    "Zarządzanie energią", "Analiza pogody", "Inteligentne gniazdka",
    "Ładowarka elektryczna", "Pompa ciepła"
  ];

  const priceCalculator = () => {
    const projectBaseMul = {
      "Oświetlenie": 0.1,
      "Zacienianie": 0.1,
      "Ogrzewanie": 0.05,
      "Wentylacja": 0.05,
      "System alarmowy": 0.1,
      "Monitoring": 0.1,
      "Sieć komputerowa": 0.05,
      "Oświetlenie zewnętrzne": 0.1,
      "Kontrola dostępu": 0.1
    };

    const projectAddMul = {
      "Brama garażowa": 0.05,
      "Brama wjazdowa": 0.05,
      "Nawadnianie": 0.05,
      "Audio": 0.2,
      "Fotowoltaika": 0.2,
      "Rekuperacja": 0.05,
      "Klimatyzacja": 0.05,
      "Zarządzanie energią": 0.1,
      "Analiza pogody": 0.05,
      "Inteligentne gniazdka": 0.05,
      "Ładowarka elektryczna": 0.05,
      "Pompa ciepła": 0.1
    };

    const basePrice = 3300;
    const metraz = Number(formData.metraz);

    const roomsMultiplier = 1 + formData.roomLayout.length * 0.05;
    let sizeMultiplier = 1 + metraz / 1000;

    if (metraz > 200) {
      sizeMultiplier *= 1.2;
    } else if (metraz < 100) {
      sizeMultiplier *= 0.9;
    }

    const baseOptionsSum =
      formData.podstawowe.reduce((sum, opt) => sum + (projectBaseMul[opt] || 0), 0);

    const addOptionsSum =
      formData.dodatkowe.reduce((sum, opt) => sum + (projectAddMul[opt] || 0), 0);

    const baseLimited = Math.min(baseOptionsSum, 0.6);
    const addLimited = Math.min(addOptionsSum, 0.4);

    const optionsMultiplier = 1 + baseLimited + addLimited;

    const projectPrice = basePrice * roomsMultiplier * sizeMultiplier * optionsMultiplier;

    if (formData.pakiet === "Smart design") {
      return {
        cenaRobocizny: projectPrice, // projekt = robocizna (brak prefabrykacji)
        materialy: 0
      };
    }

    if (formData.pakiet === "Smart design+") {
      const cenaRobocizny = projectPrice * 1.5; // projekt + 40% za prefabrykację
      const materialy = 8000 + projectPrice * 2.5; // 250% kosztów materiałów

      return {
        cenaRobocizny,
        materialy
      };
    }

    if (formData.pakiet === "Full house") {
      const cenaRobocizny = projectPrice * 2; // projekt + 40% szafa + 20% integracja
      const materialy = 10000 + projectPrice * 3.5; // 250% szafa + 50% uruchomienie/integracja

      return {
        cenaRobocizny,
        materialy
      };
    }

    return {
      cenaRobocizny: projectPrice,
      materialy: 0
    };
  };

  const calculatePrice = () => {
    const { cenaRobocizny, materialy } = priceCalculator();
    const total = cenaRobocizny + materialy;
    setEstimatedPrice(Math.round(total));
    setShowResult(true);
  }

  const handleReset = () => {
    if (!window.confirm("Czy na pewno chcesz rozpocząć od nowa? Twoja aktualna konfiguracja zostanie utracona.")) {
      return;
    }
    setFormData({
      metraz: "",
      pakiet: "Smart design",
      podstawowe: [],
      dodatkowe: [],
      roomLayout: []
    });
    setCurrentStep(1);
    setShowResult(false);
    setShowContactForm(false);
  };

  const toggleOption = (type, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const steps = [
    { number: 1, title: "Podstawowe dane", description: "Metraż i pakiet" },
    { number: 2, title: "Opcje", description: "Funkcje Smart Home" },
    { number: 3, title: "Układ pomieszczeń", description: "Wizualizacja domu" },
    { number: 4, title: "Podsumowanie", description: "Wycena i kontakt" }
  ];

  const stepVariants = {
    hidden: { opacity: 0, x: 100, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      x: -100, 
      scale: 0.95,
      transition: { duration: 0.4, ease: "easeIn" } 
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      } 
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen py-12 sm:py-20 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-7xl overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="text-center mb-8 sm:mb-12 px-2"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl mb-4 sm:mb-6">
            <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 pb-2.5 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Stwórz swój Smart Home!
          </h1>
          <p ref={configuratorRef} className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
            Stwórz spersonalizowany układ swojego inteligentnego domu w czterech prostych krokach
          </p>
        </motion.div>

        {/* Progress Steps */}
        {!showResult && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="mb-8 sm:mb-12"
          >
            <div className="relative flex justify-between items-start max-w-5xl mx-auto px-1 sm:px-4 overflow-visible">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center z-10 relative flex-1">
                    <motion.div
                      animate={{
                        scale: currentStep === step.number ? [1, 1.2, 1.1] : 1,
                      }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold transition-all text-xs sm:text-sm md:text-base ${
                        currentStep >= step.number
                          ? "bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {step.number}
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mt-1 sm:mt-2 px-0.5 sm:px-1"
                    >
                      <div className="font-semibold text-[0.6rem] sm:text-xs md:text-sm whitespace-nowrap">{step.title}</div>
                      <div className="text-[0.55rem] sm:text-xs text-slate-500 hidden lg:block whitespace-nowrap">{step.description}</div>
                    </motion.div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex items-center flex-1" style={{ marginTop: '16px' }}>
                      <motion.div
                        animate={{
                          scaleX: currentStep > step.number ? 1 : 0.3,
                          opacity: currentStep > step.number ? 1 : 0.3,
                        }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className={`hidden sm:block h-0.5 w-full origin-left rounded-full ${
                        currentStep > step.number
                          ? "bg-gradient-to-r from-orange-500 to-orange-400"
                          : "bg-slate-300"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {!showResult && currentStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="border-2 border-orange-100 shadow-xl max-w-4xl mx-auto">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
                    <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                    Dane podstawowe
                  </h3>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <Label htmlFor="metraz" className="text-base">Metraż domu (m²) *</Label>
                      <Input
                        id="metraz"
                        type="number"
                        min="20"
                        max="2000"
                        placeholder="np. 150"
                        value={formData.metraz}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value > 2000) {
                            setFormData({ ...formData, metraz: "2000" });
                          } else if (value < 0) {
                            setFormData({ ...formData, metraz: "" });
                          } else {
                            setFormData({ ...formData, metraz: e.target.value });
                          }
                        }}
                        className="mt-2 h-12 text-lg"
                      />
                      <p className="text-sm text-slate-500 mt-2">
                        Minimum 20 m², maksimum 2000 m². Pomieszczenia dodasz w kolejnych krokach.
                      </p>
                    </div>

                    <div>
                      <Label className="text-base">Pakiet *</Label>
                      <RadioGroup value={formData.pakiet} onValueChange={(value) => setFormData({ ...formData, pakiet: value })}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {pakiety.map((pakiet) => (
                            <motion.label
                              key={pakiet.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                formData.pakiet === pakiet.value
                                  ? "border-orange-600 bg-orange-50"
                                  : "border-slate-200 hover:border-orange-300"
                              }`}
                            >
                              <RadioGroupItem value={pakiet.value} className="mt-1" />
                              <div>
                                <div className="font-semibold text-slate-900">{pakiet.label}</div>
                                <div className="text-sm text-slate-600 mt-1">{pakiet.description}</div>
                              </div>
                            </motion.label>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      {showValidationError.step1 && (!formData.metraz || parseInt(formData.metraz) < 20 || parseInt(formData.metraz) > 2000) && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                          {!formData.metraz ? "Podaj metraż domu, aby kontynuować." : "Metraż musi być między 20 a 2000 m²."}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            const isValid = formData.metraz && parseInt(formData.metraz) >= 20 && parseInt(formData.metraz) <= 2000;
                            if (isValid) {
                              gtmEvent("configurator_step", { step: 1 });
                              setCurrentStep(2);
                              setShowValidationError({ ...showValidationError, step1: false });
                              scrollToConfigurator();
                            } else {
                              setShowValidationError({ ...showValidationError, step1: true });
                              }
                              }}
                              disabled={!formData.metraz || parseInt(formData.metraz) < 20 || parseInt(formData.metraz) > 2000}
                              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Dalej
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Options */}
          {!showResult && currentStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6 max-w-6xl mx-auto"
            >
              <Card className="border-2 border-orange-100 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Opcje podstawowe</h3>
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.03
                        }
                      }
                    }}
                  >
                    {opcjePodstawowe.map((opcja) => (
                      <motion.label
                        key={opcja}
                        variants={cardItemVariants}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center space-x-3 p-4 rounded-lg hover:bg-orange-50 cursor-pointer transition-all border border-slate-200 hover:border-orange-300 hover:shadow-md"
                      >
                        <Checkbox
                          checked={formData.podstawowe.includes(opcja)}
                          onCheckedChange={() => toggleOption("podstawowe", opcja)}
                        />
                        <span className="text-slate-700">{opcja}</span>
                      </motion.label>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-100 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Opcje dodatkowe</h3>
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.03
                        }
                      }
                    }}
                  >
                    {opcjeDodatkowe.map((opcja) => (
                      <motion.label
                        key={opcja}
                        variants={cardItemVariants}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center space-x-3 p-4 rounded-lg hover:bg-orange-50 cursor-pointer transition-all border border-slate-200 hover:border-orange-300 hover:shadow-md"
                      >
                        <Checkbox
                          checked={formData.dodatkowe.includes(opcja)}
                          onCheckedChange={() => toggleOption("dodatkowe", opcja)}
                        />
                        <span className="text-slate-700">{opcja}</span>
                      </motion.label>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {showValidationError.step2 && formData.podstawowe.length === 0 && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    Wybierz przynajmniej jedną opcję podstawową, aby kontynuować.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                  <Button onClick={() => { setCurrentStep(1); scrollToConfigurator(); }} variant="outline" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                    Wstecz
                  </Button>
                  <Button
                    onClick={() => {
                      if (formData.podstawowe.length > 0) {
                        gtmEvent("configurator_step", { step: 2 });
                        setCurrentStep(3);
                        setShowValidationError({ ...showValidationError, step2: false });
                        scrollToConfigurator();
                      } else {
                        setShowValidationError({ ...showValidationError, step2: true });
                        }
                        }}
                        disabled={formData.podstawowe.length === 0}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dalej
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Room Layout */}
          {!showResult && currentStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 sm:space-y-6 max-w-6xl mx-auto"
            >
              <Card className="border-2 border-orange-100 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                      <LayoutIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                      Zaprojektuj układ pomieszczeń
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 mt-2">
                      Dodaj pomieszczenia i zobacz, jakie funkcje Smart Home zostaną w nich zainstalowane
                    </p>
                  </div>

                  <RoomLayoutBuilder
                    rooms={formData.roomLayout}
                    onChange={(rooms) => setFormData({ ...formData, roomLayout: rooms })}
                    selectedOptions={formData}
                  />
                </CardContent>
              </Card>

              <div className="space-y-3">
                {showValidationError.step3 && formData.roomLayout.length === 0 && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    Musisz wybrać co najmniej jedno pomieszczenie, aby kontynuować.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                  <Button onClick={() => { setCurrentStep(2); scrollToConfigurator(); }} variant="outline" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                    Wstecz
                  </Button>
                  <Button
                    onClick={() => {
                      if (formData.roomLayout.length > 0) {
                        calculatePrice();
                        gtmEvent("configurator_step", { step: 3 });
                        setCurrentStep(4);
                        setShowValidationError({ ...showValidationError, step3: false });
                        scrollToConfigurator();
                      } else {
                        setShowValidationError({ ...showValidationError, step3: true });
                        }
                        }}
                        disabled={formData.roomLayout.length === 0}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Zobacz wycenę
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        {showResult && !showContactForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8 max-w-6xl mx-auto"
          >
            <Card className="border-2 border-orange-100 shadow-2xl">
              <CardContent className="p-4 sm:p-6 lg:p-12">
                <div className="text-center mb-6 sm:mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4 sm:mb-6" />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Podsumowanie konfiguracji</h2>
                  
                  {/* Blurred Price */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 sm:p-12 lg:p-16 mb-6 sm:mb-8 relative overflow-hidden min-h-[280px] sm:min-h-[320px] flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-200/50 to-orange-300/50 blur-3xl"></div>
                    <div className="relative w-full flex items-center justify-center" style={{ minHeight: '280px' }}>
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="absolute inset-0 flex items-center justify-center text-5xl sm:text-7xl font-bold text-slate-300 blur-lg select-none"
                      >
                        {estimatedPrice.toLocaleString('pl-PL')} PLN
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                        className="relative z-10 w-full flex items-center justify-center px-3 sm:px-4"
                      >
                        <div className="bg-white rounded-2xl shadow-2xl px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10 border-2 border-orange-400 text-center max-w-2xl w-full">
                          <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4"
                          >
                            🎉
                          </motion.div>
                          <p className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 mb-2 sm:mb-3">Twoja konfiguracja jest gotowa!</p>
                          <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                            Wypełnij formularz poniżej, a otrzymasz wycenę na e-mail
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

{/* Package Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6 sm:mb-8"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Wybrany pakiet</h3>
                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-xl font-bold text-orange-700 mb-2">{formData.pakiet}</div>
                      <p className="text-slate-600">
                        {formData.pakiet === "Smart design" && "Projekt automatyki + projekt szafy"}
                        {formData.pakiet === "Smart design+" && "Smart design + prefabrykacja"}
                        {formData.pakiet === "Full house" && "Pełne uruchomienie + integracja"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

{/* Selected Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
                >
                  {/* Basic Options */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Opcje podstawowe</h3>
                    <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {formData.podstawowe.length > 0 ? (
                          <ul className="space-y-2">
                            {formData.podstawowe.map((option, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + idx * 0.05 }}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-slate-700">{option}</span>
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic">Brak wybranych opcji</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Options */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Opcje dodatkowe</h3>
                    <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {formData.dodatkowe.length > 0 ? (
                          <ul className="space-y-2">
                            {formData.dodatkowe.map((option, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + idx * 0.05 }}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <span className="text-slate-700">{option}</span>
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic">Brak wybranych opcji</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>

{/* Room Layout Details */}
                {formData.roomLayout && formData.roomLayout.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-6 sm:mb-8"
                  >
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
                      <LayoutIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                      Układ pomieszczeń ({formData.roomLayout.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {formData.roomLayout.map((room, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 + idx * 0.05 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                        >
                          <Card className="border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-bold text-slate-900">{room.name}</h4>
                                  <p className="text-sm text-slate-600">{room.type}</p>
                                </div>
                              </div>
                              {room.features && room.features.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
                                    Funkcje Smart Home:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {room.features.map((feature, fIdx) => (
                                      <span
                                        key={fIdx}
                                        className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg border border-orange-200"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

{/* House Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
                >
                  {[
                    { value: `${formData.metraz} m²`, label: "Metraż" },
                    { value: formData.roomLayout.length, label: "Pomieszczeń" },
                    { value: formData.podstawowe.length, label: "Opcji podstawowych" },
                    { value: formData.dodatkowe.length, label: "Opcji dodatkowych" }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.85 + idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Card className="border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{stat.value}</div>
                          <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>



{/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        gtmEvent("configurator_step", { step: 4 });
                        scrollToForm();
                        setShowContactForm(true);
                      }}
                      size="lg"
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-2xl hover:shadow-orange-500/50 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl w-full"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Poznaj cenę
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        handleReset();
                        scrollToForm();
                      }}
                      variant="outline"
                      size="lg"
                      className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl w-full"
                    >
                      Rozpocznij od nowa
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contact Form */}
        {showContactForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-orange-100 shadow-2xl max-w-4xl mx-auto">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 text-center">
                  Formularz kontaktowy - wycena
                </h3>
                <ConfiguratorContactForm 
                  formData={formData}
                  estimatedPrice={estimatedPrice}
                  onCancel={() => setShowContactForm(false)}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}