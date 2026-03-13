/**
 * Baza produktów — PROTOTYP (dane hardcoded jako fallback).
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
 *   outputsPerUnit:  number   — ile kanałów obsługuje 1 sztuka
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
    outputsPerUnit: 12,
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
 * Specyfikacja dodatkowych urządzeń wyszukiwanych dynamicznie w cennik.json.
 * Jeśli dany SKU istnieje w cenniku, zostanie dodany do katalogu z nazwą
 * pobraną z cennika.
 *
 * @type {Record<string, { id: string, resourceType: string, outputsPerUnit: number, unit?: string, notes?: string }>}
 */
export const CENNIK_SKU_SPECS = {
  "610149": { id: "lox-audio-master",    resourceType: RESOURCE.RELAY,      outputsPerUnit: 1,  notes: "Audio master – 1 kanał = 1 urządzenie" },
  "610151": { id: "lox-audio-slave",     resourceType: RESOURCE.RELAY,      outputsPerUnit: 1,  notes: "Audio slave" },
  "100466": { id: "lox-presence-sensor", resourceType: RESOURCE.DIGITAL_IN, outputsPerUnit: 1,  notes: "Czujnik obecności – 1 kanał = 1 urządzenie" },
  "100038": { id: "lox-tree-relay-14",   resourceType: RESOURCE.RELAY,      outputsPerUnit: 14, notes: "14 kanałów; gniazda sterowane, oświetlenie 230V, rolety" },
  "100283": { id: "lox-kontaktron",      resourceType: RESOURCE.DIGITAL_IN, outputsPerUnit: 20, notes: "Kontaktron – 1 urządzenie obsługuje 20 kanałów" },
  "100239": { id: "lox-dimmer-24v",      resourceType: RESOURCE.DIMMER,     outputsPerUnit: 4,  notes: "Oświetlenie 24V – 1 urządzenie = 4 kanały" },
  "100221": { id: "lox-switch",          resourceType: RESOURCE.DIGITAL_IN, outputsPerUnit: 1,  notes: "Włącznik Loxone Touch – 1 kanał = 1 urządzenie" },
};

/**
 * Buduje listę wpisów katalogowych na podstawie wpisów z cennika.
 * Dodaje tylko te urządzenia, których SKU znajdzie w tablicy cennikItems.
 *
 * @param {Array<{ sku: string|number, name: string, price_pln?: number }>} cennikItems
 * @returns {ProductDefinition[]}
 */
export function buildCatalogFromCennik(cennikItems) {
  const result = [];
  for (const item of cennikItems) {
    const sku = String(item.sku ?? "");
    const spec = CENNIK_SKU_SPECS[sku];
    if (!spec) continue;
    result.push({
      id: spec.id,
      name: item.name,
      partNumber: sku,
      resourceType: spec.resourceType,
      outputsPerUnit: spec.outputsPerUnit,
      unit: spec.unit ?? "szt.",
      notes: spec.notes ?? "",
    });
  }
  return result;
}

/**
 * Zwraca bazowy katalog (hardcoded fallback).
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
