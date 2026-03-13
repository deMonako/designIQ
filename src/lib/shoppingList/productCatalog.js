/**
 * Baza produktów — PROTOTYP (dane hardcoded).
 *
 * W docelowej wersji ta funkcja załaduje dane z pliku Excel
 * z głównego folderu bazy materiałów.
 *
 * Schemat pojedynczego produktu:
 * {
 *   id:              string   — unikalne ID produktu
 *   name:            string   — pełna nazwa handlowa
 *   partNumber:      string   — numer katalogowy producenta
 *   resourceType:    string   — jaki RESOURCE obsługuje (z resourceTypes.js)
 *   outputsPerUnit:  number   — ile wyjść danego zasobu obsługuje 1 sztuka
 *   unit:            string   — jednostka miary ("szt.", "kpl." …)
 *   notes:           string   — opcjonalne uwagi
 * }
 */

import { RESOURCE } from "./resourceTypes.js";

/** @type {ProductDefinition[]} */
const CATALOG = [
  // ── Relay ─────────────────────────────────────────────────────────────────
  {
    id: "lox-relay-ext",
    name: "Loxone Relay Extension",
    partNumber: "100039",
    resourceType: RESOURCE.RELAY,
    outputsPerUnit: 12,
    unit: "szt.",
    notes: "12 wyjść przekaźnikowych 230 V / 16 A",
  },

  // ── Dimmer ────────────────────────────────────────────────────────────────
  {
    id: "lox-dimmer-ext",
    name: "Loxone Dimmer Extension",
    partNumber: "100052",
    resourceType: RESOURCE.DIMMER,
    outputsPerUnit: 4,
    unit: "szt.",
    notes: "4 kanały PWM / 0–10 V; max 300 W na kanał",
  },

  // ── RGBW ──────────────────────────────────────────────────────────────────
  {
    id: "lox-rgbw-dimmer",
    name: "Loxone RGBW 24V Dimmer",
    partNumber: "200113",
    resourceType: RESOURCE.RGBW,
    outputsPerUnit: 1,
    unit: "szt.",
    notes: "1 kanał RGBW 24 V DC; steruje jedną listwą LED",
  },

  // ── Motor (napędy rolet / żaluzji) ────────────────────────────────────────
  {
    id: "lox-blind-ctrl",
    name: "Loxone Blind & AC Motor Controller",
    partNumber: "100096",
    resourceType: RESOURCE.MOTOR,
    outputsPerUnit: 2,
    unit: "szt.",
    notes: "2 niezależne kanały silnikowe; możliwość podania pozycji %",
  },

  // ── Digital Inputs ────────────────────────────────────────────────────────
  {
    id: "lox-extension",
    name: "Loxone Extension",
    partNumber: "100011",
    resourceType: RESOURCE.DIGITAL_IN,
    outputsPerUnit: 12,  // 12 wejść cyfrowych na Extension
    unit: "szt.",
    notes: "12 wejść cyfrowych + 12 wyjść cyfrowych; tu liczymy tylko wejścia",
  },

  // ── Analog Inputs ─────────────────────────────────────────────────────────
  {
    id: "lox-analog-ext",
    name: "Loxone Analog Extension",
    partNumber: "100059",
    resourceType: RESOURCE.ANALOG_IN,
    outputsPerUnit: 8,
    unit: "szt.",
    notes: "8 wejść analogowych 0–10 V / NTC / Pt1000",
  },
];

/**
 * Zwraca pełen katalog produktów.
 * Punkt rozszerzenia: zastąp tę funkcję ładowaniem z Excela / API.
 *
 * @returns {ProductDefinition[]}
 */
export function loadProductCatalog() {
  return CATALOG;
}

/**
 * Zwraca produkty obsługujące dany typ zasobu.
 * @param {string} resourceType
 * @returns {ProductDefinition[]}
 */
export function getProductsForResource(resourceType) {
  return CATALOG.filter(p => p.resourceType === resourceType);
}
