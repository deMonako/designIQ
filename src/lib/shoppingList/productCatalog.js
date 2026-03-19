/**
 * Baza produktów — DYNAMICZNA (dane z cennik.json na Google Drive).
 *
 * Żadne produkty nie są hardcoded. Katalog budowany jest wyłącznie
 * na podstawie wpisów w cennik.json, których SKU pasuje do CENNIK_SKU_SPECS.
 *
 * Schemat pojedynczego produktu:
 * {
 *   id:              string   — unikalne ID produktu
 *   name:            string   — pełna nazwa handlowa (z cennika)
 *   partNumber:      string   — numer katalogowy producenta (SKU z cennika)
 *   resourceType:    string   — jaki RESOURCE obsługuje (z resourceTypes.js)
 *   outputsPerUnit:  number   — ile kanałów obsługuje 1 sztuka
 *   unit:            string   — jednostka miary ("szt.", "kpl." …)
 *   notes:           string   — opcjonalne uwagi
 * }
 */

import { RESOURCE } from "./resourceTypes.js";

/**
 * Specyfikacja urządzeń wyszukiwanych dynamicznie w cennik.json.
 * Jeśli dany SKU istnieje w cenniku, zostanie dodany do katalogu
 * z nazwą pobraną z cennika.
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
      price_pln: item.price_pln ?? 0,
      resourceType: spec.resourceType,
      outputsPerUnit: spec.outputsPerUnit,
      unit: spec.unit ?? "szt.",
      notes: spec.notes ?? "",
    });
  }
  return result;
}

/**
 * Zwraca pusty katalog (produkty budowane dynamicznie z cennik.json).
 * @returns {ProductDefinition[]}
 */
export function loadProductCatalog() {
  return [];
}

/**
 * Buduje katalog jak buildCatalogFromCennik, ale z możliwością nadpisania
 * specyfikacji SKU (np. outputsPerUnit) oraz dodania nowych SKU
 * spoza CENNIK_SKU_SPECS (zdefiniowanych przez użytkownika w Ustawieniach).
 *
 * @param {Array<{ sku: string|number, name: string, price_pln?: number }>} cennikItems
 * @param {Record<string, object>} extraSpecs – nadpisania/rozszerzenia SKU specs
 * @returns {ProductDefinition[]}
 */
export function buildCatalogFromCennikWithSpecs(cennikItems, extraSpecs = {}) {
  const mergedSpecs = {};
  for (const [sku, spec] of Object.entries(CENNIK_SKU_SPECS)) {
    mergedSpecs[sku] = { ...spec, ...(extraSpecs[sku] ?? {}) };
  }
  for (const [sku, spec] of Object.entries(extraSpecs)) {
    if (!mergedSpecs[sku]) mergedSpecs[sku] = spec;
  }

  const result = [];
  for (const item of cennikItems) {
    const sku  = String(item.sku ?? "");
    const spec = mergedSpecs[sku];
    if (!spec) continue;
    result.push({
      id:             spec.id,
      name:           item.name,
      partNumber:     sku,
      price_pln:      item.price_pln ?? 0,
      resourceType:   spec.resourceType,
      outputsPerUnit: spec.outputsPerUnit,
      unit:           spec.unit ?? "szt.",
      notes:          spec.notes ?? "",
    });
  }
  return result;
}

/**
 * Zwraca produkty obsługujące dany typ zasobu.
 * @param {string} resourceType
 * @param {ProductDefinition[]} catalog - aktualny katalog
 * @returns {ProductDefinition[]}
 */
export function getProductsForResource(resourceType, catalog = []) {
  return catalog.filter(p => p.resourceType === resourceType);
}
