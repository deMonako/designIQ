// ── GAS Domain API ─────────────────────────────────────────────────────────────
// Funkcje domenowe mapujące operacje UI na wywołania GAS.
// Każda funkcja odpowiada jednej akcji w skrypcie Google Apps Script.
//
// Schemat odpowiedzi GAS (doGet/doPost):
//   { ok: true, data: <tablica lub obiekt> }
//   { ok: false, error: "Opis błędu" }
//
// Użycie w Admin.jsx:
//   import { getProjects, createTask } from "./api";
//   const projects = await getProjects();
//   await createTask({ title: "...", dueDate: "2026-03-10", ... });

import { gasGet, gasPost } from "./gasClient";

// ────────────────────────────────────────────────────────────────────────────────
// KLIENCI
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wszystkich klientów z Sheets */
export async function getClients() {
  return gasGet("getClients");
}

/** Tworzy nowego klienta */
export async function createClient(client) {
  return gasPost("createClient", { client });
}

/** Aktualizuje dane klienta (po id) */
export async function updateClient(client) {
  return gasPost("updateClient", { client });
}

/** Archiwizuje/przywraca klienta */
export async function setClientArchived(id, isArchived) {
  return gasPost("setClientArchived", { id, isArchived });
}

/** Usuwa klienta */
export async function deleteClient(id) {
  return gasPost("deleteClient", { id });
}

// ────────────────────────────────────────────────────────────────────────────────
// PROJEKTY
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wszystkie projekty */
export async function getProjects() {
  return gasGet("getProjects");
}

/** Tworzy nowy projekt */
export async function createProject(project) {
  return gasPost("createProject", { project });
}

/** Aktualizuje projekt (status, postęp, notatki, etap itd.) */
export async function updateProject(project) {
  return gasPost("updateProject", { project });
}

/** Usuwa projekt */
export async function deleteProject(id) {
  return gasPost("deleteProject", { id });
}

// ────────────────────────────────────────────────────────────────────────────────
// ZADANIA
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wszystkie zadania (opcjonalnie filtrowane po projektId) */
export async function getTasks(projectId) {
  return gasGet("getTasks", projectId ? { projectId } : {});
}

/** Tworzy nowe zadanie lub wydarzenie */
export async function createTask(task) {
  return gasPost("createTask", { task });
}

/** Aktualizuje zadanie (np. zmiana statusu, terminu) */
export async function updateTask(task) {
  return gasPost("updateTask", { task });
}

/** Usuwa zadanie */
export async function deleteTask(id) {
  return gasPost("deleteTask", { id });
}

// ────────────────────────────────────────────────────────────────────────────────
// CHECKLISTS
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wszystkie checklists */
export async function getChecklists() {
  return gasGet("getChecklists");
}

/** Dodaje nową checklistę */
export async function createChecklist(checklist) {
  return gasPost("createChecklist", { checklist });
}

/** Usuwa checklistę */
export async function deleteChecklist(id) {
  return gasPost("deleteChecklist", { id });
}

/** Toggleuje stan pojedynczego punktu checklisty */
export async function toggleChecklistItem(checklistId, itemId) {
  return gasPost("toggleChecklistItem", { checklistId, itemId });
}

/** Dodaje nowy punkt do checklisty */
export async function addChecklistItem(checklistId, text) {
  return gasPost("addChecklistItem", { checklistId, text });
}

// ────────────────────────────────────────────────────────────────────────────────
// MATERIAŁY
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wszystkie materiały */
export async function getMaterials() {
  return gasGet("getMaterials");
}

/** Dodaje nowy materiał */
export async function createMaterial(material) {
  return gasPost("createMaterial", { material });
}

/** Usuwa materiał */
export async function deleteMaterial(id) {
  return gasPost("deleteMaterial", { id });
}

// ────────────────────────────────────────────────────────────────────────────────
// DOKUMENTY PROJEKTÓW
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera dokumenty powiązane z projektem */
export async function getProjectDocs(projectId) {
  return gasGet("getProjectDocs", { projectId });
}

/** Dodaje dokument do projektu */
export async function createProjectDoc(doc) {
  return gasPost("createProjectDoc", { doc });
}

/** Usuwa dokument */
export async function deleteProjectDoc(id) {
  return gasPost("deleteProjectDoc", { id });
}

/** Przełącza widoczność dokumentu dla klienta */
export async function toggleDocClientVisible(id) {
  return gasPost("toggleDocClientVisible", { id });
}

// ────────────────────────────────────────────────────────────────────────────────
// PLIKI Z GOOGLE DRIVE
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Pobiera listę plików z podfolderu projektu na Google Drive.
 * @param {string} projectId - id projektu, np. "proj-1749123456789"
 */
export async function getProjectFiles(projectId, projectCode) {
  return gasGet("getProjectFiles", { projectId, projectCode });
}

/**
 * Przesyła plik na Google Drive.
 * - projectId podany → folder projektu (DesignIQ/<projectId>/)
 * - projectId null   → folder Materiały (DesignIQ/Materiały/)
 *
 * @param {File}    file       - obiekt File z input[type=file]
 * @param {string?} projectId  - opcjonalne id projektu
 * @returns {{ driveId, name, url, downloadUrl }}
 */
export async function uploadFile(file, projectId = null, projectCode = null) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return gasPost("uploadFile", {
    base64,
    name:        file.name,
    mimeType:    file.type || "application/octet-stream",
    projectId,
    projectCode, // używany jako nazwa folderu na Drive
  });
}

/**
 * Pobiera treść pliku projekt.svg i projekt.json z folderu projektu na Drive.
 * GAS szuka plików po nazwie w folderze DesignIQ/<projectCode>/
 * Zwraca: { svg: "<svg>...</svg>", attribs: { HANDLE: { tag, desc, ... } } }
 */
export async function getDwgViewerContent(projectCode) {
  return gasGet("getDwgViewerContent", { projectCode });
}

// ────────────────────────────────────────────────────────────────────────────────
// LEADY (konfigurator)
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wszystkie leady z konfiguratora */
export async function getLeads() {
  return gasGet("getLeads");
}

/** Tworzy nowy lead (z konfiguratora lub formularza kontaktowego) */
export async function createLead(lead) {
  return gasPost("createLead", { lead });
}

/** Aktualizuje lead (status, notatki) */
export async function updateLead(lead) {
  return gasPost("updateLead", { lead });
}

/** Usuwa lead */
export async function deleteLead(id) {
  return gasPost("deleteLead", { id });
}

// ────────────────────────────────────────────────────────────────────────────────
// WIADOMOŚCI (panel klienta ↔ admin)
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wiadomości dla projektu */
export async function getWiadomosci(projectId) {
  return gasGet("getWiadomosci", { projectId });
}

/** Dodaje wiadomość od admina do klienta */
export async function addAdminMessage(projectId, content, author = "Admin") {
  return gasPost("addAdminMessage", { projectId, content, author });
}

// ────────────────────────────────────────────────────────────────────────────────
// WYCENY
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera wycenę projektu po projectId */
export async function getWycena(projectId) {
  return gasGet("getWycena", { projectId });
}

/** Zapisuje / aktualizuje wycenę projektu */
export async function upsertWycena(wycena) {
  return gasPost("upsertWycena", { wycena });
}

// ────────────────────────────────────────────────────────────────────────────────
// ZAKUPY
// ────────────────────────────────────────────────────────────────────────────────

/** Pobiera listę zakupów projektu po projectId */
export async function getZakupy(projectId) {
  return gasGet("getZakupy", { projectId });
}

/** Zapisuje / aktualizuje listę zakupów projektu */
export async function upsertZakupy(zakupy) {
  return gasPost("upsertZakupy", { zakupy });
}
