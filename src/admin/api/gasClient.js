// ── GAS HTTP Client ─────────────────────────────────────────────────────────────
// Niskopoziomowy wrapper do komunikacji z Google Apps Script.
//
// CORS: GAS Web App obsługuje CORS automatycznie dla "simple requests".
// Aby uniknąć CORS preflight (OPTIONS), POST wysyłamy BEZ Content-Type: application/json
// – przeglądarka domyślnie ustawia text/plain dla string body, co jest "simple request".
// W GAS doPost() body odczytujemy przez e.postData.contents (JSON string).

import { GAS_CONFIG } from "./gasConfig";

/**
 * GET – pobieranie danych z GAS
 * @param {string} action  - nazwa akcji w doGet() GAS
 * @param {object} params  - dodatkowe query params (np. { projectId: "proj-1" })
 */
export async function gasGet(action, params = {}) {
  if (!GAS_CONFIG.scriptUrl) throw new Error("GAS: scriptUrl nie jest skonfigurowany w gasConfig.js");

  const url = new URL(GAS_CONFIG.scriptUrl);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(GAS_CONFIG.requestTimeout),
  });

  if (!res.ok) throw new Error(`GAS HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (!json.ok) throw new Error(`GAS: ${json.error ?? "Nieznany błąd"}`);
  return json.data;
}

/**
 * POST – zapis / mutacja danych w GAS
 * @param {string} action  - nazwa akcji w doPost() GAS
 * @param {object} payload - dane do zapisu
 *
 * Celowo NIE ustawiamy Content-Type – przeglądarka użyje text/plain dla string body,
 * co omija CORS preflight i pozwala GAS na odczyt przez e.postData.contents.
 */
export async function gasPost(action, payload = {}) {
  if (!GAS_CONFIG.scriptUrl) throw new Error("GAS: scriptUrl nie jest skonfigurowany w gasConfig.js");

  const res = await fetch(GAS_CONFIG.scriptUrl, {
    method:  "POST",
    body:    JSON.stringify({ action, ...payload }),
    signal:  AbortSignal.timeout(GAS_CONFIG.requestTimeout),
    // Bez nagłówków – Content-Type defaultuje do text/plain → brak CORS preflight
  });

  if (!res.ok) throw new Error(`GAS HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (!json.ok) throw new Error(`GAS: ${json.error ?? "Nieznany błąd"}`);
  return json.data;
}
