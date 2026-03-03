// ── GAS Configuration ──────────────────────────────────────────────────────────
// Konfiguracja połączenia z Google Apps Script.
// Gdy backend będzie gotowy:
//   1. Wdróż skrypt GAS jako Web App (Execute as: Me, Who has access: Anyone)
//   2. Skopiuj URL deployment do SCRIPT_URL poniżej
//   3. Ustaw enabled: true

export const GAS_CONFIG = {
  /** Przełącznik: false = mockData lokalnie, true = dane z GAS */
  enabled: false,

  /** URL deployment Google Apps Script (doGet/doPost) */
  scriptUrl: "",

  /** ID arkusza Google Sheets (z adresu URL) */
  sheetId: "",

  /**
   * ID folderu głównego na Google Drive.
   * Struktura folderów:
   *   DesignIQ/           ← driveFolderId wskazuje tutaj
   *     KOW-2026-001/     ← każdy projekt dostaje podfolder o nazwie = code
   *       projekt.pdf
   *       schemat_szafy_v2.dwg
   *       ...
   *     NOW-2026-001/
   *       ...
   * Pliki pobierane przez: getProjectFiles(projectCode)
   * GAS: Drive.getFoldersByName(projectCode, parentFolderId)
   */
  driveFolderId: "",

  /** Limit czasu żądania w ms */
  requestTimeout: 8000,

  /** Wersja API – do nagłówka X-Version */
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
