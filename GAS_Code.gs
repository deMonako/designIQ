// ═══════════════════════════════════════════════════════════════════════════════
//  designIQ – Google Apps Script Backend (Unified)
//
//  Obsługuje:
//   • Panel admina      (CRUD klienci, projekty, zadania, checklists, materiały, dokumenty)
//   • Panel klienta     (getInvestment, updateInvestmentStatus, addClientMessage, upload)
//   • Konfigurator      (submitForm, sendContactForm)
//   • SVG handler       (getSvgData – pliki SVG/JSON z Google Drive po code projektu)
//   • Irytacja / Loxone (zirytujMnie – trigger Loxone + log)
//
//  SETUP (jednorazowo):
//    1. Otwórz arkusz → Extensions → Apps Script → wklej ten plik
//    2. Uzupełnij stałe konfiguracyjne poniżej (DRIVE_FOLDER_ID, SVG_FOLDER_ID, etc.)
//    3. Uruchom funkcję setupSheets() – stworzy zakładki z nagłówkami
//    4. Wdróż: Deploy → New deployment → Web App
//       Execute as: Me | Who has access: Anyone
//    5. Skopiuj URL deployment do gasConfig.js (scriptUrl)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── KONFIGURACJA ───────────────────────────────────────────────────────────────

/** ID głównego folderu DesignIQ na Drive (dokumenty projektów, materiały) */
var DRIVE_FOLDER_ID = "1tSaZwW144N9qiPyLPffd_mgj0f9jZtT6";

/** ID folderu SVG/JSON projektów (subfoldery nazwane wg code projektu) */
var SVG_FOLDER_ID = "1a0l_Az9JTxyHWo1Go2EO--RIxHfR7THO";

/** Email administratora – powiadomienia z konfiguratora i kontaktu */
var ADMIN_EMAIL = "";

/** URL webhoooka Loxone (irytacja) – np. "http://192.168.1.77/dev/sps/io/Irytacja/pulse" */
var LOXONE_URL = "";

// ─── NAGŁÓWKI KOLUMN ────────────────────────────────────────────────────────────
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
    "id", "projectId", "name", "type", "description", "url", "driveId", "date", "clientVisible"
  ],
  // ── Konfigurator – zapytania z wyceny ────────────────────────────────────────
  "Leady": [
    "id", "date", "name", "email", "phone",
    "configData", "quoteValue", "status", "notes"
  ],
  // ── Wiadomości z panelu klienta ──────────────────────────────────────────────
  "Wiadomosci": [
    "id", "projectId", "date", "author", "content", "fromClient"
  ],
  // ── Formularz kontaktowy z configuatora ──────────────────────────────────────
  "Kontakty": [
    "id", "date", "name", "email", "phone", "message", "processed"
  ],
  // ── Log zdarzeń Loxone (irytacja) ────────────────────────────────────────────
  "Wkurwienia": [
    "id", "date", "note"
  ]
};

// Pola przechowywane jako JSON string w komórce
var JSON_FIELDS = ["stages", "stageSchedule", "invoices", "tags", "items", "configData"];

// ─── SETUP ──────────────────────────────────────────────────────────────────────
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
    sh.setColumnWidth(1, 140);
  });
  SpreadsheetApp.getUi().alert(
    "✅ Zakładki gotowe!\n\n" +
    "Zakładki: Klienci, Projekty, Zadania, Checklists, Materiały, Dokumenty,\n" +
    "          Leady, Wiadomosci, Kontakty, Wkurwienia\n\n" +
    "Uzupełnij ADMIN_EMAIL i LOXONE_URL w sekcji konfiguracji, a następnie wdróż Web App."
  );
}

// ─── HELPERS ────────────────────────────────────────────────────────────────────

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function parseCell(key, val) {
  if (typeof val === "boolean") return val;
  if (val === "" || val === null || val === undefined) return val;
  // Arkusz Google zwraca daty jako obiekty Date – konwertuj na "YYYY-MM-DD"
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  if (typeof val === "number") return val;
  if (JSON_FIELDS.indexOf(key) >= 0 && typeof val === "string" && val.trim().length > 0) {
    try { return JSON.parse(val); } catch(e) { return val; }
  }
  return val;
}

function toCell(key, val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val;
  if (JSON_FIELDS.indexOf(key) >= 0) {
    return Array.isArray(val) || (typeof val === "object") ? JSON.stringify(val) : String(val);
  }
  return val;
}

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

function objToRow(sheetName, obj) {
  var sh      = ss_().getSheetByName(sheetName);
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  return headers.map(function(h) { return toCell(h, obj[h]); });
}

function insertRow(sheetName, obj) {
  ss_().getSheetByName(sheetName).appendRow(objToRow(sheetName, obj));
  return obj;
}

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

function deleteRow(sheetName, id) {
  var rowIdx = findRowIdx(sheetName, id);
  if (rowIdx >= 0) ss_().getSheetByName(sheetName).deleteRow(rowIdx);
  return { id: id };
}

function findById(arr, id) {
  for (var i = 0; i < arr.length; i++) {
    if (String(arr[i].id) === String(id)) return arr[i];
  }
  return null;
}

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: String(msg) }))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso() {
  return new Date().toISOString();
}

// Zwraca aktualną datę jako "YYYY-MM-DD" w lokalnej strefie czasowej
function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

// ─── GOOGLE DRIVE ────────────────────────────────────────────────────────────────

function getProjectFolder(projectId) {
  if (!DRIVE_FOLDER_ID || !projectId) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName(String(projectId));
    return folders.hasNext() ? folders.next() : null;
  } catch(e) { return null; }
}

function getOrCreateProjectFolder(projectId) {
  if (!DRIVE_FOLDER_ID || !projectId) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName(String(projectId));
    if (folders.hasNext()) return folders.next();
    return root.createFolder(String(projectId));
  } catch(e) { return null; }
}

function getOrCreateMaterialsFolder() {
  if (!DRIVE_FOLDER_ID) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName("Materiały");
    if (folders.hasNext()) return folders.next();
    return root.createFolder("Materiały");
  } catch(e) { return null; }
}

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

// Pomocnicza – przesyła plik (base64) do wskazanego folderu Drive, ustawia publiczny podgląd
function uploadBlob(base64, name, mimeType, folder) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64),
    mimeType || "application/octet-stream",
    name
  );
  var newFile = folder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    driveId:     newFile.getId(),
    name:        newFile.getName(),
    url:         newFile.getUrl(),
    downloadUrl: "https://drive.google.com/uc?id=" + newFile.getId() + "&export=download"
  };
}

// ─── doGet – odczyt danych ───────────────────────────────────────────────────────
function doGet(e) {
  try {
    var action = e.parameter.action;
    var all, filtered;

    switch (action) {

      // ── Panel admina ──────────────────────────────────────────────────────────
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

      // ── Leady / Kontakty / Wiadomości (admin) ─────────────────────────────────
      case "getLeads":
        return ok(sheetToObjects("Leady"));

      case "getKontakty":
        return ok(sheetToObjects("Kontakty"));

      case "getWiadomosci":
        all = sheetToObjects("Wiadomosci");
        if (e.parameter.projectId) {
          filtered = all.filter(function(m) { return String(m.projectId) === e.parameter.projectId; });
          return ok(filtered);
        }
        return ok(all);

      // ── Panel klienta (investment) ────────────────────────────────────────────
      // GET ?action=getInvestment&code=PROJ-001
      // Zwraca projekt + widoczne dokumenty + pliki z Drive
      case "getInvestment": {
        var code = e.parameter.code;
        if (!code) return err("Brak parametru code");
        var projects = sheetToObjects("Projekty");
        var project  = null;
        for (var i = 0; i < projects.length; i++) {
          if (String(projects[i].code) === String(code)) { project = projects[i]; break; }
        }
        if (!project) return err("Projekt nie znaleziony: " + code);

        var allDocs   = sheetToObjects("Dokumenty");
        var visibleDocs = allDocs.filter(function(d) {
          return String(d.projectId) === String(project.id) && d.clientVisible;
        });
        var driveFiles  = getDriveFiles(project.id);
        var messages    = sheetToObjects("Wiadomosci").filter(function(m) {
          return String(m.projectId) === String(project.id);
        });

        return ok({
          project:   project,
          docs:      visibleDocs,
          files:     driveFiles,
          messages:  messages
        });
      }

      // ── SVG Handler ───────────────────────────────────────────────────────────
      // GET ?action=getSvgData&code=PROJ-001
      // Zwraca listę plików SVG i JSON z podfolderu SVG_FOLDER_ID/<code>/
      case "getSvgData": {
        var svgCode = e.parameter.code;
        if (!SVG_FOLDER_ID) return err("SVG_FOLDER_ID nie jest skonfigurowany");
        if (!svgCode) return err("Brak parametru code");
        try {
          var svgRoot    = DriveApp.getFolderById(SVG_FOLDER_ID);
          var svgFolders = svgRoot.getFoldersByName(String(svgCode));
          if (!svgFolders.hasNext()) return ok({ files: [] });
          var svgFolder  = svgFolders.next();
          var svgFiles   = svgFolder.getFiles();
          var svgResult  = [];
          while (svgFiles.hasNext()) {
            var sf = svgFiles.next();
            var mime = sf.getMimeType();
            var isSvg  = mime === "image/svg+xml" || sf.getName().toLowerCase().endsWith(".svg");
            var isJson = mime === "application/json" || sf.getName().toLowerCase().endsWith(".json");
            if (isSvg || isJson) {
              svgResult.push({
                id:       sf.getId(),
                name:     sf.getName(),
                mimeType: mime,
                url:      sf.getUrl(),
                content:  (isSvg || isJson) ? sf.getBlob().getDataAsString() : null
              });
            }
          }
          return ok({ files: svgResult });
        } catch(ex) {
          return err("Błąd SVG: " + ex.message);
        }
      }

      // ── Irytacja / Loxone ─────────────────────────────────────────────────────
      // GET ?action=zirytujMnie&key=zirytuj_mnie
      case "zirytujMnie": {
        if (e.parameter.key !== "zirytuj_mnie") return err("Nieprawidłowy klucz");
        var logEntry = {
          id:   "iryt-" + Date.now(),
          date: nowIso(),
          note: e.parameter.note || ""
        };
        insertRow("Wkurwienia", logEntry);
        if (LOXONE_URL) {
          try { UrlFetchApp.fetch(LOXONE_URL, { method: "get", muteHttpExceptions: true }); } catch(ex) {}
        }
        return ok({ logged: true, date: logEntry.date });
      }

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

      // ── Upload pliku na Drive ─────────────────────────────────────────────────
      case "uploadFile": {
        if (!body.base64 || !body.name) return err("Brak danych pliku");
        var uploadFolder = body.projectId
          ? getOrCreateProjectFolder(body.projectId)
          : getOrCreateMaterialsFolder();
        if (!uploadFolder) return err("Nie można uzyskać dostępu do folderu Drive (sprawdź DRIVE_FOLDER_ID)");
        return ok(uploadBlob(body.base64, body.name, body.mimeType, uploadFolder));
      }

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

      // ── Leady (admin) ─────────────────────────────────────────────────────────
      case "updateLead":
        return ok(upsertRow("Leady", body.lead));

      case "deleteLead":
        return ok(deleteRow("Leady", body.id));

      // ── Wiadomości (admin wysyła odpowiedź do klienta) ────────────────────────
      case "addAdminMessage": {
        var adminMsg = {
          id:         "msg-" + Date.now(),
          projectId:  body.projectId,
          date:       nowIso(),
          author:     body.author || "Admin",
          content:    body.content,
          fromClient: false
        };
        return ok(insertRow("Wiadomosci", adminMsg));
      }

      // ── Panel klienta ─────────────────────────────────────────────────────────

      // Klient zmienia status projektu (np. "Zaakceptowane", "Do poprawki")
      case "updateInvestmentStatus": {
        // body: { code, status, note? }
        if (!body.code) return err("Brak parametru code");
        all = sheetToObjects("Projekty");
        obj = null;
        for (var pi = 0; pi < all.length; pi++) {
          if (String(all[pi].code) === String(body.code)) { obj = all[pi]; break; }
        }
        if (!obj) return err("Projekt nie znaleziony: " + body.code);
        var updated = Object.assign({}, obj, { status: body.status });
        upsertRow("Projekty", updated);
        if (body.note) {
          insertRow("Wiadomosci", {
            id:         "msg-" + Date.now(),
            projectId:  obj.id,
            date:       nowIso(),
            author:     body.clientName || "Klient",
            content:    body.note,
            fromClient: true
          });
        }
        return ok(updated);
      }

      // Klient wysyła wiadomość
      case "addClientMessage": {
        if (!body.projectId && !body.code) return err("Brak projectId lub code");
        var msgProjectId = body.projectId;
        if (!msgProjectId && body.code) {
          var projs = sheetToObjects("Projekty");
          for (var pi2 = 0; pi2 < projs.length; pi2++) {
            if (String(projs[pi2].code) === String(body.code)) { msgProjectId = projs[pi2].id; break; }
          }
        }
        if (!msgProjectId) return err("Projekt nie znaleziony");
        var clientMsg = {
          id:         "msg-" + Date.now(),
          projectId:  msgProjectId,
          date:       nowIso(),
          author:     body.author || "Klient",
          content:    body.content,
          fromClient: true
        };
        return ok(insertRow("Wiadomosci", clientMsg));
      }

      // Klient uploaduje plik do swojego projektu
      case "uploadInvestmentFile": {
        // body: { code, base64, name, mimeType }
        if (!body.base64 || !body.name) return err("Brak danych pliku");
        var invProjects = sheetToObjects("Projekty");
        var invProject  = null;
        for (var pi3 = 0; pi3 < invProjects.length; pi3++) {
          if (String(invProjects[pi3].code) === String(body.code)) { invProject = invProjects[pi3]; break; }
        }
        if (!invProject) return err("Projekt nie znaleziony: " + body.code);
        var invFolder = getOrCreateProjectFolder(invProject.id);
        if (!invFolder) return err("Nie można uzyskać dostępu do folderu Drive");
        var uploaded = uploadBlob(body.base64, body.name, body.mimeType, invFolder);
        // Automatycznie dodaj wpis do Dokumentów jako widoczny dla klienta
        var docEntry = {
          id:            "doc-" + Date.now(),
          projectId:     invProject.id,
          name:          body.name,
          type:          "inne",
          description:   body.description || "Plik od klienta",
          url:           uploaded.url,
          date:          nowIso().substring(0, 10),
          clientVisible: true
        };
        insertRow("Dokumenty", docEntry);
        return ok(Object.assign({}, uploaded, { docId: docEntry.id }));
      }

      // ── Konfigurator ──────────────────────────────────────────────────────────

      // Zapytanie z konfiguratora – zapis do Leady + powiadomienie email
      case "submitForm": {
        // body: { name, email, phone, configData (object), quoteValue (number) }
        var lead = {
          id:         "lead-" + Date.now(),
          date:       nowIso(),
          name:       body.name       || "",
          email:      body.email      || "",
          phone:      body.phone      || "",
          configData: body.configData || {},
          quoteValue: body.quoteValue || 0,
          status:     "Nowy",
          notes:      ""
        };
        insertRow("Leady", lead);

        if (ADMIN_EMAIL) {
          try {
            var quoteFormatted = lead.quoteValue
              ? "Wycena: " + Number(lead.quoteValue).toLocaleString("pl-PL") + " zł\n"
              : "";
            var configStr = "";
            if (lead.configData && typeof lead.configData === "object") {
              var configLines = [];
              var configKeys = Object.keys(lead.configData);
              for (var ci = 0; ci < configKeys.length; ci++) {
                configLines.push("  " + configKeys[ci] + ": " + lead.configData[configKeys[ci]]);
              }
              if (configLines.length > 0) configStr = "\nKonfiguracja:\n" + configLines.join("\n");
            }
            GmailApp.sendEmail(
              ADMIN_EMAIL,
              "🏠 Nowe zapytanie z konfiguratora – " + lead.name,
              "Nowe zapytanie z konfiguratora designIQ\n\n" +
              "Imię: " + lead.name + "\n" +
              "Email: " + lead.email + "\n" +
              "Telefon: " + lead.phone + "\n" +
              quoteFormatted +
              configStr + "\n\n" +
              "Data: " + lead.date
            );
          } catch(ex) {}
        }

        // Wyślij potwierdzenie do klienta
        if (body.email) {
          try {
            GmailApp.sendEmail(
              body.email,
              "Dziękujemy za zapytanie – designIQ",
              "Dzień dobry " + (body.name || "") + ",\n\n" +
              "Dziękujemy za skorzystanie z konfiguratora designIQ.\n" +
              "Skontaktujemy się z Tobą wkrótce.\n\n" +
              "Pozdrawiamy,\nZespół designIQ"
            );
          } catch(ex) {}
        }

        return ok({ id: lead.id, status: "Nowy" });
      }

      // Formularz kontaktowy z konfiguratora
      case "sendContactForm": {
        // body: { name, email, phone, message }
        var contact = {
          id:        "cnt-" + Date.now(),
          date:      nowIso(),
          name:      body.name    || "",
          email:     body.email   || "",
          phone:     body.phone   || "",
          message:   body.message || "",
          processed: false
        };
        insertRow("Kontakty", contact);

        if (ADMIN_EMAIL) {
          try {
            GmailApp.sendEmail(
              ADMIN_EMAIL,
              "📩 Formularz kontaktowy – " + contact.name,
              "Nowa wiadomość z formularza kontaktowego:\n\n" +
              "Imię: " + contact.name + "\n" +
              "Email: " + contact.email + "\n" +
              "Telefon: " + contact.phone + "\n\n" +
              "Wiadomość:\n" + contact.message + "\n\n" +
              "Data: " + contact.date
            );
          } catch(ex) {}
        }

        return ok({ id: contact.id });
      }

      // Irytacja (alternatywnie przez POST)
      case "zirytujMnie": {
        var iEntry = {
          id:   "iryt-" + Date.now(),
          date: nowIso(),
          note: body.note || ""
        };
        insertRow("Wkurwienia", iEntry);
        if (LOXONE_URL) {
          try { UrlFetchApp.fetch(LOXONE_URL, { method: "get", muteHttpExceptions: true }); } catch(ex) {}
        }
        return ok({ logged: true, date: iEntry.date });
      }

      default:
        return err("Nieznana akcja POST: " + action);
    }
  } catch(ex) {
    return err(ex.message);
  }
}
