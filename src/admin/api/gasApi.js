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
 * Folder identyfikowany jest po project.id (tworzony automatycznie przy createProject).
 *
 * GAS zwraca tablicę:
 *   { id, name, mimeType, size, modifiedTime, webViewLink, webContentLink }
 *
 * @param {string} projectId - id projektu, np. "proj-1749123456789"
 */
export async function getProjectFiles(projectId) {
  return gasGet("getProjectFiles", { projectId });
}
