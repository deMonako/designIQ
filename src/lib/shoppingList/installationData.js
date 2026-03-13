/**
 * Dane instalacyjne projektu DOKTOR — PROTOTYP (dane testowe hardcoded).
 *
 * Struktura punktu instalacji rozszerzona o dwa nowe pola:
 *   resourceType  — jakiego zasobu wymaga punkt (z resourceTypes.js)
 *   outputCount   — ile wyjść tego zasobu potrzebuje (domyślnie 1)
 *
 * Pola X, Y, tag są opcjonalne (pochodzą z DWG); logika zakupów ich nie używa.
 *
 * W docelowej wersji ta funkcja pobierze attribs projektu z bazy danych
 * (tak jak robi to getDwgViewerContent w gasApi.js).
 *
 * @returns {InstallationPoint[]}
 */

import { RESOURCE } from "./resourceTypes.js";

/** @param {string} id @param {string} room @param {string} fn @param {string} resourceType @param {number} [outputCount=1] */
function pt(id, room, fn, resourceType, outputCount = 1) {
  return { id, room, function: fn, resourceType, outputCount };
}

const DOKTOR_POINTS = [

  // ══════════════════════════════════════════════════════════
  //  WEJŚCIE / PRZEDSIONEK
  // ══════════════════════════════════════════════════════════
  pt("WE-SW-01",  "Wejście",     "Oświetlenie podstawowe",          RESOURCE.RELAY),
  pt("WE-SW-02",  "Wejście",     "Oświetlenie dekoracyjne",         RESOURCE.DIMMER),
  pt("WE-BTN-01", "Wejście",     "Przycisk dotykowy (wej.)",        RESOURCE.DIGITAL_IN),
  pt("WE-BTN-02", "Wejście",     "Dzwonek",                         RESOURCE.DIGITAL_IN),
  pt("WE-BLD-01", "Wejście",     "Roleta wejście",                  RESOURCE.MOTOR),
  pt("WE-TMP-01", "Wejście",     "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  SALON
  // ══════════════════════════════════════════════════════════
  pt("SA-SW-01",  "Salon",       "Oświetlenie główne żyrandol",     RESOURCE.RELAY),
  pt("SA-DIM-01", "Salon",       "Oświetlenie akcentowe A",         RESOURCE.DIMMER),
  pt("SA-DIM-02", "Salon",       "Oświetlenie akcentowe B",         RESOURCE.DIMMER),
  pt("SA-RGB-01", "Salon",       "Listwa LED za TV",                RESOURCE.RGBW),
  pt("SA-RGB-02", "Salon",       "Listwa LED szafa AV",             RESOURCE.RGBW),
  pt("SA-BLD-01", "Salon",       "Roleta okno lewe",                RESOURCE.MOTOR),
  pt("SA-BLD-02", "Salon",       "Roleta okno środkowe",            RESOURCE.MOTOR),
  pt("SA-BLD-03", "Salon",       "Roleta okno prawe",               RESOURCE.MOTOR),
  pt("SA-BTN-01", "Salon",       "Panel dotykowy lewy",             RESOURCE.DIGITAL_IN),
  pt("SA-BTN-02", "Salon",       "Panel dotykowy środek",           RESOURCE.DIGITAL_IN),
  pt("SA-BTN-03", "Salon",       "Panel dotykowy prawy",            RESOURCE.DIGITAL_IN),
  pt("SA-SW-02",  "Salon",       "Gniazdka zarządzane",             RESOURCE.RELAY),
  pt("SA-TMP-01", "Salon",       "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  JADALNIA
  // ══════════════════════════════════════════════════════════
  pt("JA-DIM-01", "Jadalnia",    "Oświetlenie nad stołem",          RESOURCE.DIMMER),
  pt("JA-DIM-02", "Jadalnia",    "Oświetlenie ogólne",              RESOURCE.DIMMER),
  pt("JA-RGB-01", "Jadalnia",    "Listwa LED kredens",              RESOURCE.RGBW),
  pt("JA-BLD-01", "Jadalnia",    "Roleta okno A",                   RESOURCE.MOTOR),
  pt("JA-BLD-02", "Jadalnia",    "Roleta okno B",                   RESOURCE.MOTOR),
  pt("JA-BTN-01", "Jadalnia",    "Panel dotykowy",                  RESOURCE.DIGITAL_IN),
  pt("JA-TMP-01", "Jadalnia",    "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  KUCHNIA
  // ══════════════════════════════════════════════════════════
  pt("KU-SW-01",  "Kuchnia",     "Oświetlenie główne",              RESOURCE.RELAY),
  pt("KU-DIM-01", "Kuchnia",     "Oświetlenie blatu roboczego",     RESOURCE.DIMMER),
  pt("KU-RGB-01", "Kuchnia",     "Listwa LED pod szafkami",         RESOURCE.RGBW),
  pt("KU-BTN-01", "Kuchnia",     "Panel dotykowy",                  RESOURCE.DIGITAL_IN),
  pt("KU-SW-02",  "Kuchnia",     "Gniazdko zarządzane (AGD)",       RESOURCE.RELAY),
  pt("KU-BLD-01", "Kuchnia",     "Roleta kuchenna",                 RESOURCE.MOTOR),
  pt("KU-TMP-01", "Kuchnia",     "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  KORYTARZ / HALL
  // ══════════════════════════════════════════════════════════
  pt("KO-SW-01",  "Korytarz",    "Oświetlenie korytarz PG",         RESOURCE.RELAY),
  pt("KO-SW-02",  "Korytarz",    "Oświetlenie korytarz PP",         RESOURCE.RELAY),
  pt("KO-BTN-01", "Korytarz",    "Czujnik ruchu PG",                RESOURCE.DIGITAL_IN),
  pt("KO-BTN-02", "Korytarz",    "Czujnik ruchu PP",                RESOURCE.DIGITAL_IN),

  // ══════════════════════════════════════════════════════════
  //  ŁAZIENKA GŁÓWNA (parter)
  // ══════════════════════════════════════════════════════════
  pt("LG-SW-01",  "Łazienka gł.",  "Oświetlenie główne",            RESOURCE.RELAY),
  pt("LG-DIM-01", "Łazienka gł.",  "Podświetlenie lustra",          RESOURCE.DIMMER),
  pt("LG-RGB-01", "Łazienka gł.",  "Listwa LED wanna",              RESOURCE.RGBW),
  pt("LG-BTN-01", "Łazienka gł.",  "Panel dotykowy",                RESOURCE.DIGITAL_IN),
  pt("LG-SW-02",  "Łazienka gł.",  "Wentylacja zarządzana",         RESOURCE.RELAY),
  pt("LG-TMP-01", "Łazienka gł.",  "Czujnik temperatury/wilg.",     RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  WC (parter)
  // ══════════════════════════════════════════════════════════
  pt("WC-SW-01",  "WC",          "Oświetlenie WC",                  RESOURCE.RELAY),
  pt("WC-SW-02",  "WC",          "Wentylacja WC",                   RESOURCE.RELAY),
  pt("WC-BTN-01", "WC",          "Czujnik ruchu WC",                RESOURCE.DIGITAL_IN),

  // ══════════════════════════════════════════════════════════
  //  GABINET / BIURO
  // ══════════════════════════════════════════════════════════
  pt("GA-DIM-01", "Gabinet",     "Oświetlenie ogólne",              RESOURCE.DIMMER),
  pt("GA-DIM-02", "Gabinet",     "Oświetlenie biurko",              RESOURCE.DIMMER),
  pt("GA-BLD-01", "Gabinet",     "Roleta okno A",                   RESOURCE.MOTOR),
  pt("GA-BLD-02", "Gabinet",     "Roleta okno B",                   RESOURCE.MOTOR),
  pt("GA-BTN-01", "Gabinet",     "Panel dotykowy",                  RESOURCE.DIGITAL_IN),
  pt("GA-SW-01",  "Gabinet",     "Gniazdka zarządzane PC",          RESOURCE.RELAY),
  pt("GA-TMP-01", "Gabinet",     "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  SYPIALNIA GŁÓWNA
  // ══════════════════════════════════════════════════════════
  pt("SG-DIM-01", "Sypialnia gł.", "Oświetlenie ogólne",            RESOURCE.DIMMER),
  pt("SG-DIM-02", "Sypialnia gł.", "Kinkiet lewa",                  RESOURCE.DIMMER),
  pt("SG-DIM-03", "Sypialnia gł.", "Kinkiet prawa",                 RESOURCE.DIMMER),
  pt("SG-RGB-01", "Sypialnia gł.", "Listwa LED zagłówek",           RESOURCE.RGBW),
  pt("SG-BLD-01", "Sypialnia gł.", "Roleta okno A",                 RESOURCE.MOTOR),
  pt("SG-BLD-02", "Sypialnia gł.", "Roleta okno B",                 RESOURCE.MOTOR),
  pt("SG-BLD-03", "Sypialnia gł.", "Roleta balkon",                 RESOURCE.MOTOR),
  pt("SG-BTN-01", "Sypialnia gł.", "Panel lewa strona łóżka",       RESOURCE.DIGITAL_IN),
  pt("SG-BTN-02", "Sypialnia gł.", "Panel prawa strona łóżka",      RESOURCE.DIGITAL_IN),
  pt("SG-TMP-01", "Sypialnia gł.", "Czujnik temperatury",           RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  ŁAZIENKA PRZY SYPIALNI
  // ══════════════════════════════════════════════════════════
  pt("LS-SW-01",  "Łazienka syp.","Oświetlenie główne",             RESOURCE.RELAY),
  pt("LS-DIM-01", "Łazienka syp.","Podświetlenie lustra",           RESOURCE.DIMMER),
  pt("LS-SW-02",  "Łazienka syp.","Wentylacja",                     RESOURCE.RELAY),
  pt("LS-BTN-01", "Łazienka syp.","Czujnik ruchu",                  RESOURCE.DIGITAL_IN),
  pt("LS-TMP-01", "Łazienka syp.","Czujnik temperatury/wilg.",      RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  SYPIALNIA 2
  // ══════════════════════════════════════════════════════════
  pt("S2-DIM-01", "Sypialnia 2", "Oświetlenie ogólne",              RESOURCE.DIMMER),
  pt("S2-BLD-01", "Sypialnia 2", "Roleta okno",                     RESOURCE.MOTOR),
  pt("S2-BTN-01", "Sypialnia 2", "Panel dotykowy",                  RESOURCE.DIGITAL_IN),
  pt("S2-TMP-01", "Sypialnia 2", "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  SYPIALNIA 3
  // ══════════════════════════════════════════════════════════
  pt("S3-DIM-01", "Sypialnia 3", "Oświetlenie ogólne",              RESOURCE.DIMMER),
  pt("S3-BLD-01", "Sypialnia 3", "Roleta okno",                     RESOURCE.MOTOR),
  pt("S3-BTN-01", "Sypialnia 3", "Panel dotykowy",                  RESOURCE.DIGITAL_IN),
  pt("S3-TMP-01", "Sypialnia 3", "Czujnik temperatury",             RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  PRALNIA
  // ══════════════════════════════════════════════════════════
  pt("PR-SW-01",  "Pralnia",     "Oświetlenie",                     RESOURCE.RELAY),
  pt("PR-SW-02",  "Pralnia",     "Gniazdko pralki zarządzane",      RESOURCE.RELAY),
  pt("PR-BTN-01", "Pralnia",     "Czujnik zalania",                 RESOURCE.DIGITAL_IN),

  // ══════════════════════════════════════════════════════════
  //  GARAŻ
  // ══════════════════════════════════════════════════════════
  pt("GR-SW-01",  "Garaż",      "Oświetlenie A",                    RESOURCE.RELAY),
  pt("GR-SW-02",  "Garaż",      "Oświetlenie B",                    RESOURCE.RELAY),
  pt("GR-BTN-01", "Garaż",      "Czujnik ruchu",                    RESOURCE.DIGITAL_IN),
  pt("GR-BTN-02", "Garaż",      "Czujnik bramy garażowej",          RESOURCE.DIGITAL_IN),
  pt("GR-SW-03",  "Garaż",      "Brama garażowa – napęd relay",     RESOURCE.RELAY),
  pt("GR-TMP-01", "Garaż",      "Czujnik temperatury",              RESOURCE.ANALOG_IN),

  // ══════════════════════════════════════════════════════════
  //  KOTŁOWNIA / TECHNICZNA
  // ══════════════════════════════════════════════════════════
  pt("KT-SW-01",  "Kotłownia",  "Oświetlenie",                      RESOURCE.RELAY),
  pt("KT-SW-02",  "Kotłownia",  "Pompa obiegowa 1",                 RESOURCE.RELAY),
  pt("KT-SW-03",  "Kotłownia",  "Pompa obiegowa 2",                 RESOURCE.RELAY),
  pt("KT-SW-04",  "Kotłownia",  "Zawór strefowy 1",                 RESOURCE.RELAY),
  pt("KT-SW-05",  "Kotłownia",  "Zawór strefowy 2",                 RESOURCE.RELAY),
  pt("KT-BTN-01", "Kotłownia",  "Czujnik temperatury kotła",        RESOURCE.ANALOG_IN),
  pt("KT-BTN-02", "Kotłownia",  "Czujnik temperatury CWU",          RESOURCE.ANALOG_IN),
  pt("KT-BTN-03", "Kotłownia",  "Czujnik awarii (cyfrowy)",         RESOURCE.DIGITAL_IN),

  // ══════════════════════════════════════════════════════════
  //  TARAS / OGRÓD
  // ══════════════════════════════════════════════════════════
  pt("TA-SW-01",  "Taras",      "Oświetlenie taras",                RESOURCE.RELAY),
  pt("TA-DIM-01", "Taras",      "Oświetlenie dekoracyjne",          RESOURCE.DIMMER),
  pt("TA-RGB-01", "Taras",      "Listwa LED balustrada",            RESOURCE.RGBW),
  pt("TA-BTN-01", "Taras",      "Czujnik zmierzchu",                RESOURCE.DIGITAL_IN),
  pt("TA-BTN-02", "Taras",      "Czujnik deszczu",                  RESOURCE.DIGITAL_IN),
  pt("TA-TMP-01", "Taras",      "Czujnik temperatury zewn.",        RESOURCE.ANALOG_IN),
  pt("TA-SW-02",  "Taras",      "Gniazdko zewn. zarządzane",        RESOURCE.RELAY),
];

/**
 * Zwraca listę punktów instalacji dla podanego projektu.
 * Punkt rozszerzenia: zastąp tę funkcję zapytaniem do GAS/bazy danych.
 *
 * @param {string} projectCode
 * @returns {InstallationPoint[]}
 */
export function loadInstallationPoints(projectCode) {
  const datasets = { DOKTOR: DOKTOR_POINTS };
  const data = datasets[projectCode];
  if (!data) throw new Error(`Brak danych testowych dla projektu: ${projectCode}`);
  return data;
}
