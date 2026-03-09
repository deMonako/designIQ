/**
 * Demo / test — uruchom:
 *   node src/lib/shoppingList/demo.mjs
 *
 * Nie wymaga bundlera — ESM natywny Node.js 18+.
 */

import { RESOURCE } from "./resourceTypes.js";
import { loadInstallationPoints }              from "./installationData.js";
import { aggregateResourceDemand, demandSummary } from "./aggregator.js";
import { calculateShoppingList }               from "./calculator.js";
import { generateShoppingList, formatShoppingList } from "./generator.js";

const PROJECT = "DOKTOR";

// ── 1. Główne wywołanie ────────────────────────────────────────────────────────
const result = generateShoppingList(PROJECT);
console.log(formatShoppingList(result));

// ── 2. Raw JSON (dla integracji z UI) ─────────────────────────────────────────
console.log("\n[raw JSON dla UI]");
console.log(JSON.stringify(result, null, 2));

// ── 3. Przykład: nadpisanie źródła danych (dependency injection) ──────────────
console.log("\n[PRZYKŁAD — własne punkty instalacji (DI)]");
const customPoints = [
  { id: "TEST-01", room: "Sala testowa", function: "Lampka", resourceType: RESOURCE.RELAY,   outputCount: 1 },
  { id: "TEST-02", room: "Sala testowa", function: "Listwa", resourceType: RESOURCE.RGBW,    outputCount: 2 },
  { id: "TEST-03", room: "Sala testowa", function: "Roleta", resourceType: RESOURCE.MOTOR,   outputCount: 3 },
  { id: "TEST-04", room: "Sala testowa", function: "Sensor", resourceType: RESOURCE.ANALOG_IN, outputCount: 1 },
];
const customResult = generateShoppingList("TEST", {
  loadPoints: () => customPoints,
});
console.log(formatShoppingList(customResult));
