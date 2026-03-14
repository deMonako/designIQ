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
 *   resourceType      – typ zasobu (RESOURCE.*)
 *   defaultDevice     – domyślne urządzenie sterujące (ID z katalogu lub "uncontrolled")
 *   ioCount           – ile kanałów zajmuje 1 punkt tego typu
 *   uncontrolled      – czy zawsze niesterowane (bez urządzenia sterującego)
 *   slaveGetsDevice   – czy slave też dostaje urządzenie (wyjątek od ogólnej reguły)
 */
export const DEFAULT_TYP_MAPPINGS = {
  "Włączniki LOXONE":          { resourceType: RESOURCE.DIGITAL_IN, defaultDevice: "lox-switch",          ioCount: 1, uncontrolled: false, slaveGetsDevice: true  },
  "Czujniki obecności LOXONE": { resourceType: RESOURCE.DIGITAL_IN, defaultDevice: "lox-presence-sensor", ioCount: 1, uncontrolled: false, slaveGetsDevice: true  },
  "Kontaktrony":               { resourceType: RESOURCE.DIGITAL_IN, defaultDevice: "lox-kontaktron",      ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Monitoring":                { resourceType: RESOURCE.DIGITAL_IN, defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Sterowanie":                { resourceType: RESOURCE.DIGITAL_IN, defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Sieć internetowa":          { resourceType: RESOURCE.DIGITAL_IN, defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: true,  slaveGetsDevice: false },
  "Oświetlenie 24V":           { resourceType: RESOURCE.DIMMER,     defaultDevice: "lox-dimmer-24v",       ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Oświetlenie zewn. 24V":     { resourceType: RESOURCE.DIMMER,     defaultDevice: "lox-dimmer-24v",       ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Rolety":                    { resourceType: RESOURCE.MOTOR,      defaultDevice: "lox-tree-relay-14",    ioCount: 2, uncontrolled: false, slaveGetsDevice: false },
  "Audio":                     { resourceType: RESOURCE.RELAY,      defaultDevice: "lox-audio-master",     ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Oświetlenie 230V":          { resourceType: RESOURCE.RELAY,      defaultDevice: "lox-tree-relay-14",    ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Oświetlenie zewn. 230V":    { resourceType: RESOURCE.RELAY,      defaultDevice: "lox-tree-relay-14",    ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Gniazda sterowane":         { resourceType: RESOURCE.RELAY,      defaultDevice: "lox-tree-relay-14",    ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Gniazda niesterowane":      { resourceType: RESOURCE.RELAY,      defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: true,  slaveGetsDevice: false },
  "Gniazda 3F":                { resourceType: RESOURCE.RELAY,      defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Zasilanie":                 { resourceType: RESOURCE.RELAY,      defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: false, slaveGetsDevice: false },
  "Inne":                      { resourceType: RESOURCE.RELAY,      defaultDevice: "uncontrolled",         ioCount: 1, uncontrolled: true,  slaveGetsDevice: false },
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
        resourceType:    RESOURCE.RELAY,
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
