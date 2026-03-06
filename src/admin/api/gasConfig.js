// ── GAS Configuration ──────────────────────────────────────────────────────────

export const GAS_CONFIG = {
  /** Przełącznik: false = mockData lokalnie, true = dane z GAS */
  enabled: true,

  /** URL deployment Google Apps Script */
  scriptUrl: "https://script.google.com/macros/s/AKfycbx-NQXBVXxY27592YtU0nU3n7jORYm27ZT-1fxOnIE2M63NMbHiavFHBWI-CrRQMONnEw/exec",

  /** ID arkusza Google Sheets */
  sheetId: "1aq3kmpw5mOGcy7JHB29C0s6OiR3evdEWY1gS08EE2FU",

  /**
   * ID głównego folderu DesignIQ na Google Drive.
   * Każdy projekt dostaje podfolder o nazwie = project.id, tworzony automatycznie.
   * Struktura:
   *   DesignIQ/              ← driveFolderId wskazuje tutaj
   *     proj-1749123456789/  ← folder projektu (id)
   *       schemat.pdf
   *       projekt_v2.dwg
   *     proj-1749234567890/
   *       ...
   */
  driveFolderId: "1tSaZwW144N9qiPyLPffd_mgj0f9jZtT6",

  /** Limit czasu żądania w ms */
  requestTimeout: 10000,

  /** Wersja API */
  apiVersion: "1",
};

/** Nazwy zakładek w arkuszu Sheets – muszą odpowiadać GAS */
export const SHEET_NAMES = {
  clients:     "Klienci",
  projects:    "Projekty",
  tasks:       "Zadania",
  checklists:  "Checklists",
  materials:   "Materiały",
  projectDocs: "Dokumenty",
};
