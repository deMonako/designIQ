/**
 * Taksonomia typów zasobów — punkty instalacji używają tych stałych.
 *
 * Punkty NIGDY nie odwołują się do konkretnych urządzeń.
 * Tylko ta warstwa definiuje, czym jest „zasób".
 * Baza produktów mapuje zasoby na fizyczne urządzenia.
 */

export const RESOURCE = {
  // Wyjścia przekaźnikowe (oświetlenie on/off, gniazdka zarządzane, inne)
  RELAY: "relay_output",

  // Wyjścia dimmerowe (oświetlenie ściemnialne, 0–10 V)
  DIMMER: "dimmer_output",

  // Kanały RGBW (paski LED, 1 kanał = 1 listwa RGBW)
  RGBW: "rgbw_output",

  // Napędy (rolety, żaluzje; 1 napęd = 1 kanał silnikowy)
  MOTOR: "motor_output",

  // Wejścia cyfrowe (przyciski dotykowe, czujniki binarni)
  DIGITAL_IN: "digital_input",

  // Wejścia analogowe (czujniki temperatury, wilgotności, CO2 …)
  ANALOG_IN: "analog_input",
};

/** Ludzkie nazwy do raportowania */
export const RESOURCE_LABEL = {
  [RESOURCE.RELAY]:      "Wyjście przekaźnikowe",
  [RESOURCE.DIMMER]:     "Kanał dimmerowy",
  [RESOURCE.RGBW]:       "Kanał RGBW",
  [RESOURCE.MOTOR]:      "Kanał silnikowy (napęd)",
  [RESOURCE.DIGITAL_IN]: "Wejście cyfrowe",
  [RESOURCE.ANALOG_IN]:  "Wejście analogowe",
};
