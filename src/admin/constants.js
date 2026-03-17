// ─── Centralne stałe panelu admina ────────────────────────────────────────────
// Zamiast rozproszonych stringów w każdym widoku — jeden source of truth.

// ── Zadania ────────────────────────────────────────────────────────────────────
export const TASK_STATUS = {
  TODO: "Niezrobione",
  DONE: "Zrobione",
};

export const TASK_PRIORITIES = ["Niski", "Normalny", "Wysoki", "Krytyczny"];

export const TASK_PRIORITY = {
  LOW:      "Niski",
  NORMAL:   "Normalny",
  HIGH:     "Wysoki",
  CRITICAL: "Krytyczny",
};

export const TASK_TYPE = {
  TASK:  "task",
  EVENT: "event",
};

// ── Klienci ────────────────────────────────────────────────────────────────────
export const CLIENT_STAGES = ["Lead", "Wycena", "Umowa", "Realizacja"];

// ── Projekty ───────────────────────────────────────────────────────────────────
export const PROJECT_STATUSES = ["Wstępny", "W trakcie", "Wstrzymany", "Ukończony"];

export const PROJECT_PACKAGES = ["Smart design", "Smart design+", "Full house"];

export const DEFAULT_PROJECT_STAGES = [
  "Wycena",
  "Projekt automatyki",
  "Projekt szafy",
  "Prefabrykacja",
  "Montaż",
  "Uruchomienie",
  "Szkolenie",
  "Odbiór",
];

// ── Pseudo-projekt firmowy (nie w bazie danych) ────────────────────────────────
export const DESIGNIQ_PROJECT_ID = "__designiq__";

// ── Wyceny: kategorie pozycji ──────────────────────────────────────────────────
export const WYCENA_CATEGORIES = [
  { key: "materials",       label: "Sprzęt i komponenty Smart Home" },
  { key: "cabling",         label: "Instalacja elektryczna i okablowanie" },
  { key: "control_cabinet", label: "Szafa sterownicza i infrastruktura" },
  { key: "audio",           label: "Systemy Multiroom Audio" },
  { key: "security",        label: "Monitoring i bezpieczeństwo" },
  { key: "programming",     label: "Programowanie i logika systemu" },
  { key: "commissioning",   label: "Uruchomienie i szkolenie" },
  { key: "project",         label: "Projekt i dokumentacja" },
  { key: "service",         label: "Serwis, wsparcie i gwarancja" },
];

// Kategorie materiałowe (fizyczne) — używane w generatorze listy dla technika
export const MATERIAL_CATEGORIES = new Set([
  "materials",
  "cabling",
  "control_cabinet",
  "audio",
  "security",
]);
