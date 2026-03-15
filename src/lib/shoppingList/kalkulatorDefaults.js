/**
 * Domyślne ustawienia kalkulatora.
 *
 * Używane jako fallback gdy użytkownik nie skonfigurował własnych ustawień.
 * Można nadpisać przez UstawieniaKalkulator w panelu Ustawień.
 */

import { RESOURCE } from "./resourceTypes.js";

/**
 * Domyślne mapowania typów instalacji.
 * Każdy wpis definiuje:
 *   defaultDevice     – domyślne urządzenie sterujące (ID z katalogu lub "uncontrolled")
 *   ioCount           – ile kanałów zajmuje 1 punkt tego typu
 *   uncontrolled      – czy zawsze niesterowane (bez urządzenia sterującego)
 *   slaveGetsDevice   – czy slave też dostaje urządzenie (wyjątek od ogólnej reguły)
 */
export const DEFAULT_TYP_MAPPINGS = {
  "Włączniki LOXONE":          { defaultDevice: "lox-switch",          ioCount: 1, uncontrolled: false, slaveGetsDevice: true  },
  "Czujniki obecności LOXONE": { defaultDevice: "lox-presence-sensor", ioCount: 1, uncontrolled: false, slaveGetsDevice: true  },
  "Kontaktrony":               { defaultDevice: "lox-kontaktron",      ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Monitoring":                { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Sterowanie":                { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Sieć internetowa":          { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: true,  slaveGetsDevice: false },
  "Oświetlenie 24V":           { defaultDevice: "lox-dimmer-24v",       ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Oświetlenie zewn. 24V":     { defaultDevice: "lox-dimmer-24v",       ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Rolety":                    { defaultDevice: "lox-tree-relay-14",    ioCount: 2, uncontrolled: false, slaveGetsDevice: false },
  "Audio":                     { defaultDevice: "lox-audio-master",     ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Oświetlenie 230V":          { defaultDevice: "lox-tree-relay-14",    ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Oświetlenie zewn. 230V":    { defaultDevice: "lox-tree-relay-14",    ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Gniazda sterowane":         { defaultDevice: "lox-tree-relay-14",    ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Gniazda niesterowane":      { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: true,  slaveGetsDevice: false },
  "Gniazda 3F":                { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Zasilanie":                 { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Inne":                      { defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: true,  slaveGetsDevice: false },
};

/**
 * Domyślne specyfikacje urządzeń Loxone (po SKU z cennika).
 * Odwzorowuje SKU na parametry urządzenia.
 */
export const DEFAULT_SKU_SPECS = {
  "610149": { id: "lox-audio-master",    resourceType: RESOURCE.RELAY,      outputsPerUnit: 1,  notes: "Audio master – 1 kanał = 1 urządzenie" },
  "610151": { id: "lox-audio-slave",     resourceType: RESOURCE.RELAY,      outputsPerUnit: 1,  notes: "Audio slave" },
  "100466": { id: "lox-presence-sensor", resourceType: RESOURCE.DIGITAL_IN, outputsPerUnit: 1,  notes: "Czujnik obecności – 1 kanał = 1 urządzenie" },
  "100038": { id: "lox-tree-relay-14",   resourceType: RESOURCE.RELAY,      outputsPerUnit: 14, notes: "14 kanałów relay" },
  "100283": { id: "lox-kontaktron",      resourceType: RESOURCE.DIGITAL_IN, outputsPerUnit: 20, notes: "Kontaktron – 1 urządzenie = 20 kanałów" },
  "100239": { id: "lox-dimmer-24v",      resourceType: RESOURCE.DIMMER,     outputsPerUnit: 4,  notes: "Oświetlenie 24V – 4 kanały na urządzenie" },
  "100221": { id: "lox-switch",          resourceType: RESOURCE.DIGITAL_IN, outputsPerUnit: 1,  notes: "Włącznik Loxone Touch – 1 kanał = 1 urządzenie" },
};

/**
 * Scala domyślne ustawienia z nadpisaniami od użytkownika.
 * Zwraca { typMappings, skuSpecs } gotowe do użycia przez kalkulator.
 *
 * @param {object} settings – { typMappings?: {}, skuSpecs?: {} }
 * @returns {{ typMappings: object, skuSpecs: object }}
 */
export function buildEffectiveMappings(settings = {}) {
  const typMappings = {};

  // Zacznij od defaults
  for (const [typ, def] of Object.entries(DEFAULT_TYP_MAPPINGS)) {
    typMappings[typ] = { ...def, ...(settings.typMappings?.[typ] ?? {}) };
  }

  // Dodaj niestandardowe typy z ustawień użytkownika
  for (const [typ, override] of Object.entries(settings.typMappings ?? {})) {
    if (!typMappings[typ]) {
      typMappings[typ] = {
        defaultDevice:   "uncontrolled",
        ioCount:         1,
        uncontrolled:    false,
        slaveGetsDevice: false,
        ...override,
      };
    }
  }

  const skuSpecs = {};

  // Zacznij od defaults
  for (const [sku, def] of Object.entries(DEFAULT_SKU_SPECS)) {
    skuSpecs[sku] = { ...def, ...(settings.skuSpecs?.[sku] ?? {}) };
  }

  // Dodaj niestandardowe SKU z ustawień użytkownika
  for (const [sku, override] of Object.entries(settings.skuSpecs ?? {})) {
    if (!skuSpecs[sku]) {
      skuSpecs[sku] = override;
    }
  }

  return { typMappings, skuSpecs };
}

/** Pusta struktura ustawień kalkulatora (tylko nadpisania) */
export const EMPTY_KALKULATOR_SETTINGS = { typMappings: {}, skuSpecs: {} };
