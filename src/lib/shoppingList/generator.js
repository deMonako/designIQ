/**
 * Główny orkiestrator generowania listy zakupów.
 *
 * Przepływ:
 *   loadInstallationPoints(projectCode)
 *     → aggregateResourceDemand(points)
 *       → calculateShoppingList(demand)
 *         → ShoppingListResult
 *
 * Wszystkie zależności są wstrzykiwane jako parametry (dependency injection),
 * co ułatwia testowanie i podmianę źródeł danych w przyszłości.
 */

import { loadInstallationPoints }  from "./installationData.js";
import { aggregateResourceDemand, demandSummary } from "./aggregator.js";
import { calculateShoppingList }    from "./calculator.js";
import { RESOURCE_LABEL }           from "./resourceTypes.js";

/**
 * Generuje listę zakupów dla projektu.
 *
 * @param {string}   projectCode          — kod projektu (np. "DOKTOR")
 * @param {object}   [options]
 * @param {Function} [options.loadPoints] — nadpisuje domyślne źródło danych
 * @returns {ShoppingListResult}
 */
export function generateShoppingList(projectCode, options = {}) {
  const loadPoints = options.loadPoints ?? loadInstallationPoints;

  // ── Krok 1: pobierz punkty instalacji ─────────────────────────────────────
  const points = loadPoints(projectCode);

  // ── Krok 2: agreguj zapotrzebowanie ───────────────────────────────────────
  const demand = aggregateResourceDemand(points);

  // ── Krok 3: oblicz ilości urządzeń ────────────────────────────────────────
  const items = calculateShoppingList(demand);

  // ── Krok 4: zbuduj wynik ──────────────────────────────────────────────────
  return {
    projectCode,
    generatedAt:  new Date().toISOString(),
    totalPoints:  points.length,
    demandSummary: demandSummary(demand),
    items,
  };
}

/**
 * Formatuje wynik do czytelnego tekstu (do logów / CLI).
 * @param {ShoppingListResult} result
 * @returns {string}
 */
export function formatShoppingList(result) {
  const lines = [];
  const sep = "─".repeat(70);

  lines.push(sep);
  lines.push(`LISTA ZAKUPÓW — projekt: ${result.projectCode}`);
  lines.push(`Wygenerowano: ${result.generatedAt}`);
  lines.push(`Punktów instalacji: ${result.totalPoints}`);
  lines.push(sep);

  lines.push("\nZAPOTRZEBOWANIE NA ZASOBY:");
  for (const [type, { totalOutputs, pointCount }] of Object.entries(result.demandSummary)) {
    const label = RESOURCE_LABEL[type] ?? type;
    lines.push(`  ${label.padEnd(32)} ${String(totalOutputs).padStart(4)} wyjść   (${pointCount} punktów)`);
  }

  lines.push(`\n${"─".repeat(70)}`);
  lines.push("LISTA ZAKUPÓW URZĄDZEŃ:");
  lines.push(
    `${"Produkt".padEnd(38)} ${"Szt.".padStart(5)}  ${"Opis wyjść".padStart(20)}`
  );
  lines.push("─".repeat(70));

  for (const item of result.items) {
    const desc = `${item.totalOutputs} wyj. / ${item.outputsPerUnit} na szt.`;
    lines.push(
      `${item.productName.padEnd(38)} ${String(item.quantity).padStart(5)}  ${desc.padStart(20)}`
    );
    lines.push(`  ↳ Nr kat.: ${item.partNumber}   [${item.resourceType}]`);
  }

  lines.push("─".repeat(70));
  lines.push(`ŁĄCZNIE pozycji: ${result.items.length}`);
  lines.push(sep);

  return lines.join("\n");
}
