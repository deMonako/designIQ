// ── GAS HTTP Client ────────────────────────────────────────────────────────────
// Niskopoziomowy wrapper do komunikacji z Google Apps Script.
// GAS Web App obsługuje GET (odczyt) i POST (zapis).
// Odpowiedź zawsze ma format: { ok: true, data: [...] } lub { ok: false, error: "..." }

import { GAS_CONFIG } from "./gasConfig";

/**
 * GET – pobieranie danych z GAS
 * @param {string} action  - nazwa akcji zdefiniowanej w doGet() GAS
 * @param {object} params  - dodatkowe query params (np. { projectId: "proj-1" })
 * @returns {Promise<any>}
 */
export async function gasGet(action, params = {}) {
  if (!GAS_CONFIG.scriptUrl) throw new Error("GAS: scriptUrl nie jest skonfigurowany");

  const url = new URL(GAS_CONFIG.scriptUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("v", GAS_CONFIG.apiVersion);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(GAS_CONFIG.requestTimeout),
  });

  if (!res.ok) throw new Error(`GAS HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (!json.ok) throw new Error(`GAS error: ${json.error ?? "Nieznany błąd"}`);
  return json.data;
}

/**
 * POST – zapis/mutacja danych w GAS
 * @param {string} action  - nazwa akcji zdefiniowanej w doPost() GAS
 * @param {object} payload - dane do zapisu
 * @returns {Promise<any>}
 */
export async function gasPost(action, payload = {}) {
  if (!GAS_CONFIG.scriptUrl) throw new Error("GAS: scriptUrl nie jest skonfigurowany");

  const res = await fetch(GAS_CONFIG.scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Version": GAS_CONFIG.apiVersion,
    },
    body: JSON.stringify({ action, ...payload }),
    signal: AbortSignal.timeout(GAS_CONFIG.requestTimeout),
  });

  if (!res.ok) throw new Error(`GAS HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (!json.ok) throw new Error(`GAS error: ${json.error ?? "Nieznany błąd"}`);
  return json.data;
}
