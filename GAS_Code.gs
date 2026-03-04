// ═══════════════════════════════════════════════════════════════════════════════
//  designIQ – Google Apps Script Backend
//
//  SETUP (jednorazowo):
//    1. Otwórz arkusz → Extensions → Apps Script → wklej ten plik
//    2. Uzupełnij DRIVE_FOLDER_ID (opcjonalnie, dla plików z Drive)
//    3. Uruchom funkcję setupSheets() – stworzy zakładki z nagłówkami
//    4. Wdróż: Deploy → New deployment → Web App
//       Execute as: Me | Who has access: Anyone
//    5. Skopiuj URL deployment do gasConfig.js (scriptUrl)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── KONFIGURACJA ───────────────────────────────────────────────────────────────
// ID głównego folderu DesignIQ na Google Drive (pliki projektów).
// Wejdź na Drive, otwórz folder DesignIQ, skopiuj ID z adresu URL.
// Pozostaw "" jeśli nie używasz integracji z Drive.
var DRIVE_FOLDER_ID = "";

// ─── NAGŁÓWKI KOLUMN ────────────────────────────────────────────────────────────
// Kolejność kolumn w każdej zakładce – musi być zgodna z aplikacją React.
var HEADERS = {
  "Klienci": [
    "id", "name", "company", "email", "phone",
    "source", "pipelineStatus", "createdDate", "notes", "isArchived"
  ],
  "Projekty": [
    "id", "clientId", "code", "name", "package", "status",
    "stageIndex", "stages", "stageSchedule", "progress",
    "startDate", "deadline", "budget", "address", "scope",
    "profitProjekt", "profitPrefabrykacja", "profitUruchomienie",
    "paidProjekt", "paidPrefabrykacja", "paidUruchomienie",
    "invoices", "notes", "tags"
  ],
  "Zadania": [
    "id", "type", "projectId", "title", "assignee",
    "status", "priority", "dueDate", "description"
  ],
  "Checklists": [
    "id", "projectId", "title", "type", "stage", "items"
  ],
  "Materiały": [
    "id", "title", "category", "device", "description", "url", "date"
  ],
  "Dokumenty": [
    "id", "projectId", "name", "type", "description", "url", "date", "clientVisible"
  ]
};

// Pola przechowywane jako JSON string w komórce
var JSON_FIELDS = ["stages", "stageSchedule", "invoices", "tags", "items"];

// ─── SETUP ──────────────────────────────────────────────────────────────────────
// Uruchom JEDNORAZOWO z edytora GAS (Run → setupSheets) zanim wdrożysz skrypt.
// Tworzy zakładki z nagłówkami i formatuje wiersz nagłówkowy.
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    var headers = HEADERS[name];
    var hRange  = sh.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setFontWeight("bold").setBackground("#fff3e0").setFontColor("#7c3f00");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 140); // kolumna ID
  });
  SpreadsheetApp.getUi().alert(
    "✅ Zakładki gotowe!\n\n" +
    "Zakładki: Klienci, Projekty, Zadania, Checklists, Materiały, Dokumenty\n\n" +
    "Teraz możesz:\n" +
    "1. Wkleić istniejących klientów do zakładki Klienci\n" +
    "2. Wdrożyć skrypt jako Web App\n" +
    "3. Skopiować URL do gasConfig.js"
  );
}

// ─── HELPERS ────────────────────────────────────────────────────────────────────

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Konwertuje wartość komórki na wartość JS (parsuje JSON tam gdzie trzeba)
function parseCell(key, val) {
  if (typeof val === "boolean") return val;
  if (val === "" || val === null || val === undefined) return val;
  if (typeof val === "number") return val;
  if (JSON_FIELDS.indexOf(key) >= 0 && typeof val === "string" && val.trim().length > 0) {
    try { return JSON.parse(val); } catch(e) { return val; }
  }
  return val;
}

// Konwertuje wartość JS na wartość komórki
function toCell(key, val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val;
  if (JSON_FIELDS.indexOf(key) >= 0) {
    return Array.isArray(val) || (typeof val === "object") ? JSON.stringify(val) : String(val);
  }
  return val;
}

// Pobiera wszystkie wiersze zakładki jako tablicę obiektów JS
function sheetToObjects(sheetName) {
  var sh = ss_().getSheetByName(sheetName);
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow <= 1) return [];
  var lastCol  = sh.getLastColumn();
  var headers  = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var data     = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return data
    .filter(function(row) { return row[0] !== "" && row[0] !== null; })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = parseCell(h, row[i]); });
      return obj;
    });
}

// Zwraca 1-based indeks wiersza o danym id (lub -1)
function findRowIdx(sheetName, id) {
  var sh      = ss_().getSheetByName(sheetName);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

// Buduje tablicę wartości z obiektu (kolejność wg nagłówków zakładki)
function objToRow(sheetName, obj) {
  var sh      = ss_().getSheetByName(sheetName);
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  return headers.map(function(h) { return toCell(h, obj[h]); });
}

// Dodaje nowy wiersz na końcu
function insertRow(sheetName, obj) {
  ss_().getSheetByName(sheetName).appendRow(objToRow(sheetName, obj));
  return obj;
}

// Aktualizuje wiersz o tym samym id (lub dodaje jeśli nie istnieje)
function upsertRow(sheetName, obj) {
  var sh      = ss_().getSheetByName(sheetName);
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var row     = headers.map(function(h) { return toCell(h, obj[h]); });
  var rowIdx  = findRowIdx(sheetName, obj.id);
  if (rowIdx >= 0) {
    sh.getRange(rowIdx, 1, 1, headers.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  return obj;
}

// Usuwa wiersz o danym id
function deleteRow(sheetName, id) {
  var rowIdx = findRowIdx(sheetName, id);
  if (rowIdx >= 0) ss_().getSheetByName(sheetName).deleteRow(rowIdx);
  return { id: id };
}

// Szuka obiektu po id w tablicy
function findById(arr, id) {
  for (var i = 0; i < arr.length; i++) {
    if (String(arr[i].id) === String(id)) return arr[i];
  }
  return null;
}

// Odpowiedź sukces
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Odpowiedź błąd
function err(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: String(msg) }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GOOGLE DRIVE ────────────────────────────────────────────────────────────────

// Zwraca folder projektu (lub null jeśli nie istnieje)
function getProjectFolder(projectId) {
  if (!DRIVE_FOLDER_ID || !projectId) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName(String(projectId));
    return folders.hasNext() ? folders.next() : null;
  } catch(e) { return null; }
}

// Tworzy folder projektu (jeśli nie istnieje) i zwraca go
function getOrCreateProjectFolder(projectId) {
  if (!DRIVE_FOLDER_ID || !projectId) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName(String(projectId));
    if (folders.hasNext()) return folders.next();
    return root.createFolder(String(projectId));
  } catch(e) { return null; }
}

// Listuje pliki z podfolderu projektu (nazwa folderu = project.id)
function getDriveFiles(projectId) {
  var folder = getProjectFolder(projectId);
  if (!folder) return [];
  try {
    var files  = folder.getFiles();
    var result = [];
    while (files.hasNext()) {
      var f = files.next();
      result.push({
        id:             f.getId(),
        name:           f.getName(),
        mimeType:       f.getMimeType(),
        size:           f.getSize(),
        modifiedTime:   f.getLastUpdated().toISOString(),
        webViewLink:    f.getUrl(),
        webContentLink: "https://drive.google.com/uc?id=" + f.getId() + "&export=download"
      });
    }
    return result;
  } catch(e) { return []; }
}

// ─── doGet – odczyt danych ───────────────────────────────────────────────────────
function doGet(e) {
  try {
    var action = e.parameter.action;
    var all, filtered;

    switch (action) {

      case "getClients":
        return ok(sheetToObjects("Klienci"));

      case "getProjects":
        return ok(sheetToObjects("Projekty"));

      case "getTasks":
        all = sheetToObjects("Zadania");
        if (e.parameter.projectId) {
          filtered = all.filter(function(t) { return String(t.projectId) === e.parameter.projectId; });
          return ok(filtered);
        }
        return ok(all);

      case "getChecklists":
        return ok(sheetToObjects("Checklists"));

      case "getMaterials":
        return ok(sheetToObjects("Materiały"));

      case "getProjectDocs":
        all = sheetToObjects("Dokumenty");
        if (e.parameter.projectId) {
          filtered = all.filter(function(d) { return String(d.projectId) === e.parameter.projectId; });
          return ok(filtered);
        }
        return ok(all);

      case "getProjectFiles":
        return ok(getDriveFiles(e.parameter.projectId));

      default:
        return err("Nieznana akcja GET: " + action);
    }
  } catch(ex) {
    return err(ex.message);
  }
}

// ─── doPost – zapis / mutacje ────────────────────────────────────────────────────
// WAŻNE: React wysyła POST z body jako text/plain (bez Content-Type: application/json)
// aby ominąć CORS preflight. GAS czyta dane przez e.postData.contents.
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    var all, obj, items;

    switch (action) {

      // ── Klienci ──────────────────────────────────────────────────────────────
      case "createClient":
        return ok(insertRow("Klienci", body.client));

      case "updateClient":
        return ok(upsertRow("Klienci", body.client));

      case "deleteClient":
        return ok(deleteRow("Klienci", body.id));

      case "setClientArchived":
        all = sheetToObjects("Klienci");
        obj = findById(all, body.id);
        if (!obj) return err("Klient nie znaleziony: " + body.id);
        return ok(upsertRow("Klienci", Object.assign({}, obj, { isArchived: body.isArchived })));

      // ── Projekty ──────────────────────────────────────────────────────────────
      case "createProject":
        // Automatycznie tworzy podfolder projektu na Drive (nazwa = project.id)
        getOrCreateProjectFolder(body.project.id);
        return ok(insertRow("Projekty", body.project));

      case "updateProject":
        return ok(upsertRow("Projekty", body.project));

      case "deleteProject":
        return ok(deleteRow("Projekty", body.id));

      // ── Zadania ───────────────────────────────────────────────────────────────
      case "createTask":
        return ok(insertRow("Zadania", body.task));

      case "updateTask":
        return ok(upsertRow("Zadania", body.task));

      case "deleteTask":
        return ok(deleteRow("Zadania", body.id));

      // ── Checklists ────────────────────────────────────────────────────────────
      case "createChecklist":
        return ok(insertRow("Checklists", body.checklist));

      case "deleteChecklist":
        return ok(deleteRow("Checklists", body.id));

      case "toggleChecklistItem":
        all = sheetToObjects("Checklists");
        obj = findById(all, body.checklistId);
        if (!obj) return err("Checklist nie znaleziona: " + body.checklistId);
        items = (obj.items || []).map(function(it) {
          return it.id === body.itemId ? Object.assign({}, it, { done: !it.done }) : it;
        });
        return ok(upsertRow("Checklists", Object.assign({}, obj, { items: items })));

      case "addChecklistItem":
        all = sheetToObjects("Checklists");
        obj = findById(all, body.checklistId);
        if (!obj) return err("Checklist nie znaleziona: " + body.checklistId);
        var newItem = { id: "chi-" + Date.now(), text: body.text, done: false };
        return ok(upsertRow("Checklists", Object.assign({}, obj, {
          items: (obj.items || []).concat([newItem])
        })));

      // ── Materiały ─────────────────────────────────────────────────────────────
      case "createMaterial":
        return ok(insertRow("Materiały", body.material));

      case "deleteMaterial":
        return ok(deleteRow("Materiały", body.id));

      // ── Dokumenty projektów ───────────────────────────────────────────────────
      case "createProjectDoc":
        return ok(insertRow("Dokumenty", body.doc));

      case "deleteProjectDoc":
        return ok(deleteRow("Dokumenty", body.id));

      case "toggleDocClientVisible":
        all = sheetToObjects("Dokumenty");
        obj = findById(all, body.id);
        if (!obj) return err("Dokument nie znaleziony: " + body.id);
        return ok(upsertRow("Dokumenty", Object.assign({}, obj, { clientVisible: !obj.clientVisible })));

      default:
        return err("Nieznana akcja POST: " + action);
    }
  } catch(ex) {
    return err(ex.message);
  }
}
