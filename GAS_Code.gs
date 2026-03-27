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
var ADMIN_EMAIL = "obsluga.designiq@gmail.com";

/** Dane firmy używane w mailach */
var COMPANY_NAME  = "DesignIQ Smart Home";
var COMPANY_EMAIL = "kontakt@designiq.pl";

/** Dane połączenia z Loxone Miniserver (irytacja instalatora) */
var LOXONE_HOST        = "dns.loxonecloud.com/504F94D10B9B";
var LOXONE_USER        = "web";
var LOXONE_PASS        = "web1212";
var LOXONE_CONTROL     = "WebButton";

/** URL webhooka Loxone – generowany automatycznie z powyższych stałych */
var LOXONE_URL = "http://" + LOXONE_HOST + "/dev/sps/io/" + LOXONE_CONTROL + "/pulse";

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
    "id", "title", "category", "device", "description", "url", "date", "shopCategory"
  ],
  "Dokumenty": [
    "id", "projectId", "name", "type", "description", "url", "driveId", "date", "clientVisible", "uploadedBy"
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
    "id", "date", "action", "note", "loxoneStatus"
  ],
  // ── Wyceny projektów ─────────────────────────────────────────────────────────
  "Wyceny": [
    "id", "projectId", "items", "rooms", "status", "acceptedAt", "updatedDate"
  ],
  // ── Listy zakupów projektów ───────────────────────────────────────────────────
  "Zakupy": [
    "id", "projectId", "items", "updatedDate"
  ],
  // ── Log aktywności admina ────────────────────────────────────────────────────
  "Aktywnosci": [
    "id", "timestamp", "type", "description", "projectId", "clientId"
  ]
};

// Pola przechowywane jako JSON string w komórce
var JSON_FIELDS = ["stages", "stageSchedule", "invoices", "tags", "items", "rooms", "configData"];

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
    "          Leady, Wiadomosci, Kontakty, Wkurwienia, Wyceny, Zakupy\n\n" +
    "Konfiguracja ustawiona:\n" +
    "  ADMIN_EMAIL = obsługa.designiq@gmail.com\n" +
    "  LOXONE_HOST = dns.loxonecloud.com/504F94D10B9B\n" +
    "  LOXONE_CONTROL = WebButton\n\n" +
    "Wdróż: Deploy → New deployment → Web App (Execute as: Me, Access: Anyone)."
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
  // Obsługa tekstowych wartości logicznych ("TRUE"/"FALSE") – mogą pojawić się
  // przy ręcznej edycji arkusza lub imporcie CSV
  if (val === "TRUE" || val === "true") return true;
  if (val === "FALSE" || val === "false") return false;
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
  if (!obj.id) obj.id = sheetName.slice(0, 3).toLowerCase() + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
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

// ── Logowanie aktywności ─────────────────────────────────────────────────────
// Zapisuje zdarzenie do arkusza "Aktywnosci". Nie rzuca wyjątku – logi nie mogą
// zatrzymać głównej akcji.
function logActivity(type, description, projectId, clientId) {
  try {
    var sh = ss_().getSheetByName("Aktywnosci");
    if (!sh) {
      sh = ss_().insertSheet("Aktywnosci");
      sh.appendRow(["id", "timestamp", "type", "description", "projectId", "clientId"]);
    }
    sh.appendRow([
      "act-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      new Date().toISOString(),
      type || "",
      description || "",
      projectId  || "",
      clientId   || ""
    ]);
  } catch (e) {
    // Cisza – logowanie nie może blokować głównej akcji
  }
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

// folderName: czytelna nazwa projektu (preferuj code projektu, np. "DEMO")
function getProjectFolder(folderName) {
  if (!DRIVE_FOLDER_ID || !folderName) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName(String(folderName));
    return folders.hasNext() ? folders.next() : null;
  } catch(e) { return null; }
}

function getOrCreateProjectFolder(folderName) {
  if (!DRIVE_FOLDER_ID || !folderName) return null;
  try {
    var root    = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var folders = root.getFoldersByName(String(folderName));
    if (folders.hasNext()) return folders.next();
    return root.createFolder(String(folderName));
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

function getDriveFiles(folderName) {
  var folder = getProjectFolder(folderName);
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

// ─── Helpery mailowe ─────────────────────────────────────────────────────────────

/**
 * Formatuje obiekt configData do HTML dla maili.
 * Obsługuje tablice (podstawowe, dodatkowe) i roomLayout jako listę.
 */
function cleanConfigurationHtml(configData) {
  if (!configData || typeof configData !== "object") return "<em>Brak danych konfiguracji.</em>";
  var result = [];
  var cd = configData;

  if (cd.metraz)   result.push("<strong>Metraż:</strong> " + cd.metraz + " m²");
  if (cd.pakiet)   result.push("<strong>Pakiet:</strong> " + cd.pakiet);

  var podst = cd.podstawowe;
  result.push("<strong>Funkcje podstawowe:</strong> " +
    (podst && podst.length > 0 ? (Array.isArray(podst) ? podst.join(", ") : podst) : "Brak"));

  var dod = cd.dodatkowe;
  result.push("<strong>Funkcje dodatkowe:</strong> " +
    (dod && dod.length > 0 ? (Array.isArray(dod) ? dod.join(", ") : dod) : "Brak"));

  if (cd.roomLayout && cd.roomLayout.length > 0) {
    var rooms = cd.roomLayout.map(function(r) {
      var feats = (r.features || []).join(", ");
      return "<li><strong>" + r.name + "</strong> (" + r.type + ")" +
             (feats ? " – Funkcje: " + feats : "") + "</li>";
    }).join("");
    result.push("<strong>Szczegóły Pomieszczeń:</strong><ul style=\"margin-top:5px;padding-left:20px;\">" + rooms + "</ul>");
  }

  if (cd.miasto) result.push("<strong>Miasto:</strong> " + cd.miasto);
  if (cd.uwagi)  result.push("<strong>Uwagi:</strong> " + cd.uwagi);

  return result.join("<br/>");
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
        all = sheetToObjects("Dokumenty").map(function(d) {
          // Normalizuj clientVisible do boolean — zabezpieczenie przed string "TRUE"/"FALSE"
          var cv = d.clientVisible;
          return Object.assign({}, d, {
            clientVisible: (cv === true || cv === "TRUE" || cv === "true" || cv === 1 || cv === "1")
          });
        });
        if (e.parameter.projectId) {
          filtered = all.filter(function(d) { return String(d.projectId) === e.parameter.projectId; });
          return ok(filtered);
        }
        return ok(all);

      case "getProjectFiles":
        return ok(getDriveFiles(e.parameter.projectCode || e.parameter.projectId));

      // ── DWG Viewer — projekt.svg + projekt.json z folderu projektu ────────────
      // Obsługuje pliki pojedyncze (projekt.svg / projekt.json) oraz wielopiętrowe:
      //   projekt_Parter.svg + projekt_Parter.json
      //   projekt_Piętro.svg + projekt_Piętro.json  → zwraca tablicę floors
      // GET ?action=getDwgViewerContent&projectCode=KOW-2026-001
      case "getDwgViewerContent": {
        var dwgCode = e.parameter.projectCode;
        if (!dwgCode) return err("Brak parametru projectCode");
        var dwgFolder = getProjectFolder(dwgCode);
        if (!dwgFolder) return ok({ floors: [] });

        var singleSvg      = null;
        var singleJson     = null;
        var singleJsonDate = null;
        var floorMap       = {}; // { "Parter": { svg: null, json: null, jsonDate: null }, ... }

        var dwgFiles = dwgFolder.getFiles();
        while (dwgFiles.hasNext()) {
          var df      = dwgFiles.next();
          var origName = df.getName();
          var nameLow  = origName.toLowerCase();

          if (nameLow === "projekt.svg") {
            singleSvg  = df.getBlob().getDataAsString("UTF-8");
          } else if (nameLow === "projekt.json") {
            singleJson     = df.getBlob().getDataAsString("UTF-8");
            singleJsonDate = df.getLastUpdated().toISOString();
          } else {
            // projekt_NazwaPiętra.svg / projekt_NazwaPiętra.json
            var floorSvg  = nameLow.match(/^projekt_(.+)\.svg$/);
            var floorJson = nameLow.match(/^projekt_(.+)\.json$/);
            if (floorSvg || floorJson) {
              // Pobierz nazwę z oryginalnego pliku (zachowaj wielkość liter)
              var dotIdx   = origName.lastIndexOf(".");
              var floorKey = origName.slice(8, dotIdx); // "projekt_".length === 8
              if (!floorMap[floorKey]) floorMap[floorKey] = { svg: null, json: null, jsonDate: null };
              if (floorSvg)  floorMap[floorKey].svg  = df.getBlob().getDataAsString("UTF-8");
              if (floorJson) {
                floorMap[floorKey].json     = df.getBlob().getDataAsString("UTF-8");
                floorMap[floorKey].jsonDate = df.getLastUpdated().toISOString();
              }
            }
          }
        }

        var floorKeys = Object.keys(floorMap);

        if (floorKeys.length > 0) {
          // Tryb wielopiętrowy – zwróć wszystkie piętra
          var floors = floorKeys.map(function(key) {
            var att = null;
            if (floorMap[key].json) {
              try { att = JSON.parse(floorMap[key].json); } catch(ex) {}
            }
            return { name: key, svg: floorMap[key].svg, attribs: att, date: floorMap[key].jsonDate ?? null };
          });
          return ok({ floors: floors });
        }

        // Tryb jednostronicowy (wsteczna kompatybilność)
        if (!singleSvg) return ok({ floors: [] });
        var singleAtt = null;
        if (singleJson) { try { singleAtt = JSON.parse(singleJson); } catch(ex) {} }
        return ok({ floors: [{ name: "Rzut", svg: singleSvg, attribs: singleAtt, date: singleJsonDate ?? null }] });
      }

      // ── Leady / Kontakty / Wiadomości (admin) ─────────────────────────────────
      // Zwraca zawartość materialy.json z folderu Materiały na Drive
      // GET ?action=getMaterialyJson
      case "getMaterialyJson": {
        var matJsonFolder = getOrCreateMaterialsFolder();
        if (!matJsonFolder) return err("Brak folderu Materiały na Drive (sprawdź DRIVE_FOLDER_ID)");
        var matJsonFiles = matJsonFolder.getFiles();
        while (matJsonFiles.hasNext()) {
          var mjf = matJsonFiles.next();
          if (mjf.getName().toLowerCase() === "materialy.json") {
            try {
              return ok(JSON.parse(mjf.getBlob().getDataAsString("UTF-8")));
            } catch (ex) {
              return err("Błąd parsowania materialy.json: " + ex.message);
            }
          }
        }
        return ok([]); // plik nie istnieje jeszcze – zwróć pustą tablicę
      }

      // Zwraca zawartość loxone.json z folderu Materiały na Drive
      // GET ?action=getLoxoneJson
      case "getLoxoneJson": {
        var loxFolder = getOrCreateMaterialsFolder();
        if (!loxFolder) return err("Brak folderu Materiały na Drive (sprawdź DRIVE_FOLDER_ID)");
        var loxFiles = loxFolder.getFiles();
        while (loxFiles.hasNext()) {
          var lf = loxFiles.next();
          if (lf.getName().toLowerCase() === "loxone.json") {
            try {
              return ok(JSON.parse(lf.getBlob().getDataAsString("UTF-8")));
            } catch (ex) {
              return err("Błąd parsowania loxone.json: " + ex.message);
            }
          }
        }
        return ok([]); // plik nie istnieje jeszcze – zwróć pustą tablicę
      }

      // Zwraca zawartość cennik.json z folderu Materiały na Drive
      // GET ?action=getCennik
      case "getCennik": {
        var cennikFolder = getOrCreateMaterialsFolder();
        if (!cennikFolder) return err("Brak folderu Materiały na Drive (sprawdź DRIVE_FOLDER_ID)");
        var cennikFiles = cennikFolder.getFiles();
        while (cennikFiles.hasNext()) {
          var cf = cennikFiles.next();
          if (cf.getName().toLowerCase() === "cennik.json") {
            try {
              return ok(JSON.parse(cf.getBlob().getDataAsString("UTF-8")));
            } catch (ex) {
              return err("Błąd parsowania cennik.json: " + ex.message);
            }
          }
        }
        return err("Plik cennik.json nie znaleziony w folderze Materiały");
      }

      // Odczytuje config.json z folderu projektu (konfiguracja kalkulatora)
      // GET ?action=getKalkulatorConfig&projectCode=KOW-2026-001
      case "getKalkulatorConfig": {
        var cfgCode = e.parameter.projectCode;
        if (!cfgCode) return ok(null);
        var cfgFolder = getProjectFolder(cfgCode);
        if (!cfgFolder) return ok(null);
        var cfgFiles = cfgFolder.getFiles();
        while (cfgFiles.hasNext()) {
          var cfgFile = cfgFiles.next();
          if (cfgFile.getName().toLowerCase() === "config.json") {
            try { return ok(JSON.parse(cfgFile.getBlob().getDataAsString("UTF-8"))); }
            catch(ex) { return ok(null); }
          }
        }
        return ok(null);
      }

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
        var projectDocs = allDocs.filter(function(d) { return String(d.projectId) === String(project.id); });
        // Sprawdzamy zarówno boolean true jak i stringi "TRUE"/"true" (legacy data z arkusza)
        var visibleDocs = projectDocs.filter(function(d) {
          var cv = d.clientVisible;
          return cv === true || cv === "TRUE" || cv === "true" || cv === 1 || cv === "1";
        });
        // Pliki z Drive — wykluczamy WSZYSTKIE pliki które mają wpis w Dokumenty (widoczne i ukryte).
        // Deduplication: driveId (najbardziej niezawodne), url bez query params jako fallback.
        var registeredDriveIds = {};
        var registeredUrls     = {};
        projectDocs.forEach(function(d) {
          if (d.driveId) registeredDriveIds[String(d.driveId).trim()] = true;
          if (d.url)     registeredUrls[String(d.url).split('?')[0]]  = true;
          // też dodaj nazwę jako fallback
        });
        var registeredNames = {};
        projectDocs.forEach(function(d) {
          if (d.name) registeredNames[d.name.toLowerCase()] = true;
        });
        var SYS_PAT = /^(config\.json|projekt(_[^.]+)?\.(?:svg|json))$/i;
        var allDriveFiles = getDriveFiles(project.code || project.id);
        var driveFiles = allDriveFiles.filter(function(f) {
          if (SYS_PAT.test(f.name)) return false;
          if (registeredDriveIds[String(f.id).trim()]) return false;
          if (registeredUrls[String(f.webViewLink || '').split('?')[0]]) return false;
          if (registeredNames[f.name.toLowerCase()]) return false;
          return true;
        });
        var messages    = sheetToObjects("Wiadomosci").filter(function(m) {
          return String(m.projectId) === String(project.id);
        });
        // Wycena projektu
        var allWyceny = sheetToObjects("Wyceny");
        var wycena = null;
        for (var wi = 0; wi < allWyceny.length; wi++) {
          if (String(allWyceny[wi].projectId) === String(project.id)) { wycena = allWyceny[wi]; break; }
        }

        // Zakupy projektu
        var allZakupy = sheetToObjects("Zakupy");
        var zakupy = null;
        for (var zk = 0; zk < allZakupy.length; zk++) {
          if (String(allZakupy[zk].projectId) === String(project.id)) { zakupy = allZakupy[zk]; break; }
        }

        return ok({
          project:   project,
          docs:      visibleDocs,
          files:     driveFiles,
          messages:  messages,
          wycena:    wycena,
          zakupy:    zakupy
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

      // ── Zakupy ────────────────────────────────────────────────────────────────
      // GET ?action=getZakupy&projectId=proj-123
      case "getZakupy": {
        var allZak = sheetToObjects("Zakupy");
        if (!e.parameter.projectId) return err("Brak parametru projectId");
        var zakFound = null;
        for (var zi = 0; zi < allZak.length; zi++) {
          if (String(allZak[zi].projectId) === String(e.parameter.projectId)) {
            zakFound = allZak[zi]; break;
          }
        }
        return ok(zakFound);
      }

      // ── Wyceny (panel klienta i admin) ────────────────────────────────────────
      // GET ?action=getWycena&projectId=proj-123  LUB  &code=DEMO
      case "getWycena": {
        var allWy = sheetToObjects("Wyceny");
        if (e.parameter.code) {
          var wyProjs = sheetToObjects("Projekty");
          var wyProj  = null;
          for (var wj = 0; wj < wyProjs.length; wj++) {
            if (String(wyProjs[wj].code) === String(e.parameter.code)) { wyProj = wyProjs[wj]; break; }
          }
          if (!wyProj) return err("Projekt nie znaleziony: " + e.parameter.code);
          var wyFound = null;
          for (var wk = 0; wk < allWy.length; wk++) {
            if (String(allWy[wk].projectId) === String(wyProj.id)) { wyFound = allWy[wk]; break; }
          }
          return ok(wyFound);
        }
        if (e.parameter.projectId) {
          var wyFound2 = null;
          for (var wl = 0; wl < allWy.length; wl++) {
            if (String(allWy[wl].projectId) === String(e.parameter.projectId)) { wyFound2 = allWy[wl]; break; }
          }
          return ok(wyFound2);
        }
        return err("Brak parametru projectId lub code");
      }

      // ── Irytacja / Loxone ─────────────────────────────────────────────────────
      // GET ?action=zirytujMnie&key=zirytuj_mnie
      case "zirytujMnie": {
        if (e.parameter.key !== "zirytuj_mnie") return err("Nieprawidłowy klucz");
        var loxoneStatus = "Brak konfiguracji LOXONE_URL";
        if (LOXONE_URL) {
          try {
            var loxResp = UrlFetchApp.fetch(LOXONE_URL, {
              method: "get",
              headers: { "Authorization": "Basic " + Utilities.base64Encode(LOXONE_USER + ":" + LOXONE_PASS) },
              muteHttpExceptions: true
            });
            loxoneStatus = loxResp.getResponseCode() === 200 ? "Sukces (200 OK)" : "Loxone Error: " + loxResp.getResponseCode();
          } catch(ex) { loxoneStatus = "Błąd krytyczny: " + ex.toString(); }
        }
        var logEntry = {
          id:           "iryt-" + Date.now(),
          date:         nowIso(),
          action:       "Irytacja instalatora",
          note:         e.parameter.note || "",
          loxoneStatus: loxoneStatus
        };
        insertRow("Wkurwienia", logEntry);
        return ok({ logged: true, date: logEntry.date, loxoneStatus: loxoneStatus });
      }

      // ── Logi aktywności ────────────────────────────────────────────────────────
      // GET ?action=getActivity&limit=50
      case "getActivity": {
        var actLimit = parseInt(e.parameter.limit) || 50;
        var actSh = ss_().getSheetByName("Aktywnosci");
        if (!actSh || actSh.getLastRow() <= 1) return ok([]);
        var actAll = sheetToObjects("Aktywnosci");
        // Sortuj malejąco (najnowsze pierwsze), ogranicz do limit
        actAll.sort(function(a, b) {
          return String(b.timestamp) > String(a.timestamp) ? 1 : -1;
        });
        return ok(actAll.slice(0, actLimit));
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
      case "createClient": {
        var newCl = insertRow("Klienci", body.client);
        logActivity("client_added", "Dodano klienta: " + (body.client.name || ""), "", newCl.id);
        return ok(newCl);
      }

      case "updateClient": {
        var updCl = upsertRow("Klienci", body.client);
        logActivity("client_updated", "Zaktualizowano klienta: " + (body.client.name || ""), "", body.client.id);
        return ok(updCl);
      }

      case "deleteClient":
        return ok(deleteRow("Klienci", body.id));

      case "setClientArchived":
        all = sheetToObjects("Klienci");
        obj = findById(all, body.id);
        if (!obj) return err("Klient nie znaleziony: " + body.id);
        return ok(upsertRow("Klienci", Object.assign({}, obj, { isArchived: body.isArchived })));

      // ── Projekty ──────────────────────────────────────────────────────────────
      case "createProject": {
        getOrCreateProjectFolder(body.project.code || body.project.id);
        var newProj = insertRow("Projekty", body.project);
        logActivity("project_created", "Utworzono projekt: " + (body.project.name || body.project.code || ""), newProj.id, body.project.clientId || "");
        return ok(newProj);
      }

      case "updateProject": {
        var updProj = upsertRow("Projekty", body.project);
        var stageDesc = (Array.isArray(body.project.stages) && body.project.stageIndex != null)
          ? " → etap: " + (body.project.stages[body.project.stageIndex] || "") : "";
        logActivity("project_updated", "Zaktualizowano projekt: " + (body.project.name || "") + stageDesc, body.project.id, body.project.clientId || "");
        return ok(updProj);
      }

      case "deleteProject":
        return ok(deleteRow("Projekty", body.id));

      // ── Zadania ───────────────────────────────────────────────────────────────
      case "createTask": {
        var newTask = insertRow("Zadania", body.task);
        logActivity("task_created", "Dodano zadanie: " + (body.task.title || ""), body.task.projectId || "", "");
        return ok(newTask);
      }

      case "updateTask": {
        var updTask = upsertRow("Zadania", body.task);
        if (body.task.status === "Zrobione") {
          logActivity("task_done", "Ukończono zadanie: " + (body.task.title || ""), body.task.projectId || "", "");
        } else {
          logActivity("task_updated", "Zaktualizowano zadanie: " + (body.task.title || ""), body.task.projectId || "", "");
        }
        return ok(updTask);
      }

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
        // Preferuj code projektu (czytelna nazwa folderu), fallback na projectId
        var uploadFolderName = body.projectCode || body.projectId;
        var uploadFolder = uploadFolderName
          ? getOrCreateProjectFolder(uploadFolderName)
          : getOrCreateMaterialsFolder();
        if (!uploadFolder) return err("Nie można uzyskać dostępu do folderu Drive (sprawdź DRIVE_FOLDER_ID)");
        var uploadResult = uploadBlob(body.base64, body.name, body.mimeType, uploadFolder);
        logActivity("file_uploaded", "Wgrano plik: " + body.name, body.projectId || "", "");
        return ok(uploadResult);
      }

      // ── Materiały ─────────────────────────────────────────────────────────────
      case "createMaterial":
        return ok(insertRow("Materiały", body.material));

      case "deleteMaterial":
        return ok(deleteRow("Materiały", body.id));

      // ── Dokumenty projektów ───────────────────────────────────────────────────
      case "createProjectDoc": {
        var newDoc = body.doc;
        if (!newDoc) return err("Brak danych dokumentu");
        // Zabezpieczenie przed duplikatami: jeśli dokument z tym driveId już istnieje
        // w tym projekcie, zaktualizuj go zamiast tworzyć nowy wpis.
        if (newDoc.driveId && newDoc.projectId) {
          var existingDocs = sheetToObjects("Dokumenty");
          var existingDoc  = null;
          for (var ei = 0; ei < existingDocs.length; ei++) {
            if (existingDocs[ei].driveId === newDoc.driveId &&
                String(existingDocs[ei].projectId) === String(newDoc.projectId)) {
              existingDoc = existingDocs[ei];
              break;
            }
          }
          if (existingDoc) {
            // Zachowaj oryginalne id, ale użyj nowego clientVisible (jawnie podanego przez wywołującego)
            return ok(upsertRow("Dokumenty", Object.assign({}, newDoc, {
              id: existingDoc.id,
            })));
          }
        }
        return ok(insertRow("Dokumenty", newDoc));
      }

      case "deleteProjectDoc":
        if (!body.id) return err("Brak id dokumentu");
        return ok(deleteRow("Dokumenty", body.id));

      case "toggleDocClientVisible": {
        // Szukamy wiersza BEZPOŚREDNIO w arkuszu po indeksie — nie przez upsertRow/findById
        // żeby poprawnie trafiać w wiersze bez id (stare wpisy) i z pewnością edytować właściwą komórkę
        var tvSh = ss_().getSheetByName("Dokumenty");
        var tvHeaders = tvSh.getRange(1, 1, 1, tvSh.getLastColumn()).getValues()[0];
        var tvLastRow = tvSh.getLastRow();
        if (tvLastRow < 2) return err("Brak dokumentów w arkuszu");
        var tvData = tvSh.getRange(2, 1, tvLastRow - 1, tvHeaders.length).getValues();

        var tvIdIdx      = tvHeaders.indexOf("id");
        var tvDriveIdIdx = tvHeaders.indexOf("driveId");
        var tvUrlIdx     = tvHeaders.indexOf("url");
        var tvCvIdx      = tvHeaders.indexOf("clientVisible");
        if (tvCvIdx < 0) return err("Brak kolumny clientVisible w arkuszu Dokumenty");

        // Szukaj wiersza: najpierw po id, potem po driveId, na końcu po url (bez query params)
        var tvTargetRow = -1;
        for (var tvi = 0; tvi < tvData.length; tvi++) {
          var tvRowId      = tvIdIdx >= 0      ? String(tvData[tvi][tvIdIdx]).trim()                      : "";
          var tvRowDriveId = tvDriveIdIdx >= 0 ? String(tvData[tvi][tvDriveIdIdx]).trim()                 : "";
          var tvRowUrl     = tvUrlIdx >= 0     ? String(tvData[tvi][tvUrlIdx]).split("?")[0].trim()       : "";
          if (body.id      && tvRowId      && tvRowId      !== "null" && tvRowId      === String(body.id).trim())                        { tvTargetRow = tvi + 2; break; }
          if (body.driveId && tvRowDriveId && tvRowDriveId !== "null" && tvRowDriveId === String(body.driveId).trim())                   { tvTargetRow = tvi + 2; break; }
          if (body.url     && tvRowUrl     && tvRowUrl                && tvRowUrl     === String(body.url).split("?")[0].trim())         { tvTargetRow = tvi + 2; break; }
        }
        if (tvTargetRow < 0) return err("Dokument nie znaleziony: id=" + body.id + " driveId=" + body.driveId);

        // Oblicz nową wartość
        var tvCurrentCV   = tvData[tvTargetRow - 2][tvCvIdx];
        var tvCurrentBool = (tvCurrentCV === true || tvCurrentCV === "TRUE" || tvCurrentCV === "true" || tvCurrentCV === 1 || tvCurrentCV === "1");
        var tvNewVisible  = typeof body.clientVisible === "boolean" ? body.clientVisible : !tvCurrentBool;

        // Aktualizuj TYLKO komórkę clientVisible w znalezionym wierszu
        tvSh.getRange(tvTargetRow, tvCvIdx + 1).setValue(tvNewVisible);

        // Zwróć zaktualizowany obiekt
        var tvResult = {};
        tvHeaders.forEach(function(h, ci) { tvResult[h] = parseCell(h, tvData[tvTargetRow - 2][ci]); });
        tvResult.clientVisible = tvNewVisible;
        return ok(tvResult);
      }

      case "resetProjectDocs": {
        // Usuń wszystkie wpisy dokumentów projektu z arkusza,
        // przeskanuj folder Drive i zarejestruj wszystko (visible=true),
        // poza plikami systemowymi (config.json, projekt*.json, projekt*.svg)
        var rpdProjectId = body.projectId;
        var rpdCode      = body.projectCode;
        if (!rpdProjectId || !rpdCode) return err("Brak projectId lub projectCode");

        // 1. Usuń wszystkie istniejące wpisy dla tego projektu
        // Skanujemy arkusz bezpośrednio (nie przez id) żeby usunąć też stare wiersze bez id
        var docSh = ss_().getSheetByName("Dokumenty");
        var docHeaders = docSh.getRange(1, 1, 1, docSh.getLastColumn()).getValues()[0];
        var projIdColIdx = docHeaders.indexOf("projectId");
        var lastRow = docSh.getLastRow();
        // Usuwamy od końca żeby nie przesuwać indeksów
        for (var ri = lastRow; ri >= 2; ri--) {
          var cellVal = docSh.getRange(ri, projIdColIdx + 1).getValue();
          if (String(cellVal) === String(rpdProjectId)) {
            docSh.deleteRow(ri);
          }
        }

        // 2. Pobierz pliki z Drive
        var driveFiles = getDriveFiles(rpdCode);
        var registered = [];

        // Wzorzec plików systemowych (ukryte)
        var sysPattern = /^(config\.json|projekt(_[^.]+)?\.json|projekt(_[^.]+)?\.svg)$/i;

        for (var fi = 0; fi < driveFiles.length; fi++) {
          var f = driveFiles[fi];
          var isSystem = sysPattern.test(f.name);
          var ext = f.name.split(".").pop().toLowerCase();
          var docType = ext === "pdf" ? "pdf"
            : (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "webp") ? "zdjęcie"
            : (ext === "dwg" || ext === "dxf") ? "dwg"
            : "inne";
          var newEntry = insertRow("Dokumenty", {
            projectId:     rpdProjectId,
            name:          f.name,
            type:          docType,
            description:   "",
            url:           f.webViewLink,
            driveId:       f.id,
            date:          Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
            clientVisible: !isSystem,
            uploadedBy:    "designIQ",
          });
          registered.push(newEntry);
        }

        return ok({ registered: registered.length, docs: registered });
      }

      case "deleteProjectFile":
        // Usuwa fizyczny plik z Google Drive po driveId
        if (!body.driveId) return err("Brak driveId");
        try {
          var delFile = DriveApp.getFileById(body.driveId);
          delFile.setTrashed(true);
          return ok({ deleted: true, driveId: body.driveId });
        } catch(delErr) {
          return err("Nie można usunąć pliku z Drive: " + delErr.message);
        }

      // ── Materiały JSON (edytor materialy.json na Drive) ───────────────────────
      // Zapisuje (nadpisuje) plik materialy.json w folderze Materiały na Drive
      // body: { items: [{ name, price_pln, link }, ...] }
      case "saveMaterialyJson": {
        if (!Array.isArray(body.items)) return err("Brak tablicy items");
        var saveMatFolder = getOrCreateMaterialsFolder();
        if (!saveMatFolder) return err("Brak folderu Materiały na Drive (sprawdź DRIVE_FOLDER_ID)");
        // Usuń stary plik (jeśli istnieje)
        var oldMatFiles = saveMatFolder.getFiles();
        while (oldMatFiles.hasNext()) {
          var omf = oldMatFiles.next();
          if (omf.getName().toLowerCase() === "materialy.json") {
            omf.setTrashed(true);
            break;
          }
        }
        // Zapisz nowy
        saveMatFolder.createFile("materialy.json", JSON.stringify(body.items, null, 2), "application/json");
        return ok({ saved: true, count: body.items.length });
      }

      // Zapisuje config.json do folderu projektu (konfiguracja kalkulatora)
      case "saveKalkulatorConfig": {
        if (!body.projectCode || !body.config) return err("Brak danych");
        var kcFolder = getOrCreateProjectFolder(body.projectCode);
        if (!kcFolder) return err("Nie można uzyskać dostępu do folderu projektu");
        var kcOld = kcFolder.getFiles();
        while (kcOld.hasNext()) {
          var kcF = kcOld.next();
          if (kcF.getName().toLowerCase() === "config.json") { kcF.setTrashed(true); break; }
        }
        kcFolder.createFile("config.json", JSON.stringify(body.config, null, 2), "application/json");
        return ok({ saved: true });
      }

      // ── Leady (admin) ─────────────────────────────────────────────────────────────────────────────rzenie leada z formularza kontaktowego lub konfiguratora
      // body: { lead: { id, name, email, phone, notes, pipelineStatus, status, source, date, ... } }
      case "createLead": {
        var newLeadObj = body.lead || {};
        if (!newLeadObj.id) newLeadObj.id = "lead-" + Date.now();
        if (!newLeadObj.date) newLeadObj.date = todayStr();
        if (!newLeadObj.status) newLeadObj.status = "Nowy";
        insertRow("Leady", newLeadObj);

        if (ADMIN_EMAIL && newLeadObj.source) {
          try {
            GmailApp.sendEmail(ADMIN_EMAIL, "Nowy lead (" + newLeadObj.source + ") – " + (newLeadObj.name || ""), "", {
              name: COMPANY_NAME,
              htmlBody:
                "<html><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333;\">" +
                "<div style=\"max-width:600px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:8px;\">" +
                "<h2 style=\"color:#FF7F50;\">Nowy lead – " + newLeadObj.source + "</h2>" +
                "<table style=\"width:100%;border-collapse:collapse;\">" +
                "<tr><td style=\"padding:6px 0;font-weight:bold;width:30%;\">Imię:</td><td>" + (newLeadObj.name  || "") + "</td></tr>" +
                "<tr><td style=\"padding:6px 0;font-weight:bold;\">Email:</td><td>" + (newLeadObj.email || "") + "</td></tr>" +
                "<tr><td style=\"padding:6px 0;font-weight:bold;\">Telefon:</td><td>" + (newLeadObj.phone || "") + "</td></tr>" +
                (newLeadObj.notes ? "<tr><td style=\"padding:6px 0;font-weight:bold;\">Notatki:</td><td>" + newLeadObj.notes + "</td></tr>" : "") +
                "<tr><td style=\"padding:6px 0;font-weight:bold;\">Data:</td><td>" + newLeadObj.date + "</td></tr>" +
                "</table></div></body></html>"
            });
          } catch(ex) {}
        }

        logActivity("lead_created", "Nowy lead: " + (newLeadObj.name || newLeadObj.email || "") + " [" + (newLeadObj.source || "") + "]", "", "");
        return ok({ id: newLeadObj.id, status: newLeadObj.status });
      }

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
        // Aktualizuj status wyceny
        var allWy2 = sheetToObjects("Wyceny");
        for (var wi2 = 0; wi2 < allWy2.length; wi2++) {
          if (String(allWy2[wi2].projectId) === String(obj.id)) {
            var wyUpd = Object.assign({}, allWy2[wi2], {
              status:    body.status,
              acceptedAt: body.status === "Zaakceptowana" ? todayStr() : allWy2[wi2].acceptedAt,
              updatedDate: todayStr()
            });
            upsertRow("Wyceny", wyUpd);
            break;
          }
        }
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
        var invFolder = getOrCreateProjectFolder(invProject.code || invProject.id);
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
          driveId:       uploaded.driveId,
          date:          nowIso().substring(0, 10),
          clientVisible: true,
          uploadedBy:    "Klient"
        };
        insertRow("Dokumenty", docEntry);
        return ok(Object.assign({}, uploaded, { docId: docEntry.id }));
      }

      // ── Zakupy ────────────────────────────────────────────────────────────────
      case "upsertZakupy": {
        var zakObj = body.zakupy;
        if (!zakObj || !zakObj.projectId) return err("Brak zakupy lub projectId");
        if (!zakObj.id) zakObj.id = "zak-" + Date.now();
        zakObj.updatedDate = todayStr();
        return ok(upsertRow("Zakupy", zakObj));
      }

      // ── Wyceny ────────────────────────────────────────────────────────────────
      case "upsertWycena": {
        var wyObj = body.wycena;
        if (!wyObj || !wyObj.projectId) return err("Brak wyceny lub projectId");
        if (!wyObj.id) wyObj.id = "wyc-" + Date.now();
        wyObj.updatedDate = todayStr();
        return ok(upsertRow("Wyceny", wyObj));
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

        var sfMailErrors = [];
        var formattedConfig = cleanConfigurationHtml(lead.configData);
        var quoteStr = lead.quoteValue
          ? Number(lead.quoteValue).toLocaleString("pl-PL") + " zł netto"
          : "—";

        // Mail do admina
        if (ADMIN_EMAIL) {
          try {
            GmailApp.sendEmail(ADMIN_EMAIL, "Nowe zapytanie z konfiguratora – " + lead.name, "", {
              name: COMPANY_NAME + " – Formularz",
              htmlBody:
                "<html><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333;\">" +
                "<div style=\"max-width:600px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:8px;\">" +
                "<h2 style=\"color:#FF7F50;border-bottom:2px solid #FF7F50;padding-bottom:10px;\">NOWE ZAPYTANIE Z KONFIGURATORA SMART HOME</h2>" +
                "<p>Otrzymano nowe zapytanie od potencjalnego klienta. Szczegóły:</p>" +
                "<table style=\"width:100%;margin-top:15px;border-collapse:collapse;\">" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;width:30%;\">Data/Czas:</td><td style=\"padding:8px 0;\">" + lead.date + "</td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;\">Imię i Nazwisko:</td><td style=\"padding:8px 0;\">" + lead.name + "</td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;\">Email:</td><td style=\"padding:8px 0;\"><a href=\"mailto:" + lead.email + "\">" + lead.email + "</a></td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;\">Telefon:</td><td style=\"padding:8px 0;\">" + lead.phone + "</td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;color:#FF7F50;\">Szacunkowa Wycena:</td><td style=\"padding:8px 0;font-weight:bold;color:#FF7F50;\">" + quoteStr + "</td></tr>" +
                "</table>" +
                "<h3 style=\"color:#444;margin-top:20px;\">Pełna Konfiguracja:</h3>" +
                "<div style=\"background-color:#eee;padding:10px;border-radius:4px;font-size:0.9em;\">" + formattedConfig + "</div>" +
                "</div></body></html>"
            });
          } catch(ex) { sfMailErrors.push("admin: " + ex.message); }
        }

        // Potwierdzenie do klienta
        if (body.email) {
          try {
            // Budujemy listę elementów konfiguracji (bez roomLayout)
            var cd = lead.configData || {};
            var simpleItems = [];
            if (cd.metraz)     simpleItems.push("<strong>Metraż:</strong> " + cd.metraz + " m²");
            if (cd.pakiet)     simpleItems.push("<strong>Pakiet:</strong> " + cd.pakiet);
            var podst = cd.podstawowe;
            simpleItems.push("<strong>Funkcje podstawowe:</strong> " +
              (podst && podst.length > 0 ? (Array.isArray(podst) ? podst.join(", ") : podst) : "Brak"));
            var dod = cd.dodatkowe;
            simpleItems.push("<strong>Funkcje dodatkowe:</strong> " +
              (dod && dod.length > 0 ? (Array.isArray(dod) ? dod.join(", ") : dod) : "Brak"));

            var simpleItemsHtml = simpleItems.map(function(item) {
              return "<li style=\"margin-bottom:8px;padding-left:20px;position:relative;\">" +
                     "<span style=\"position:absolute;left:0;color:#FF7F50;font-size:1.2em;\">&#x25cf;</span> " + item + "</li>";
            }).join("");

            var roomLayoutHtml = "";
            if (cd.roomLayout && cd.roomLayout.length > 0) {
              var rooms = cd.roomLayout.map(function(r) {
                var feats = (r.features || []).join(", ");
                return "<li><strong>" + r.name + "</strong> (" + r.type + ")" +
                       (feats ? " – Funkcje: " + feats : "") + "</li>";
              }).join("");
              roomLayoutHtml = "<h3 style=\"color:#444;margin-top:20px;\">Szczegóły Pomieszczeń:</h3>" +
                               "<ul style=\"padding-left:20px;\">" + rooms + "</ul>";
            }

            GmailApp.sendEmail(body.email, "Potwierdzenie zapytania do " + COMPANY_NAME, "", {
              name: COMPANY_NAME,
              replyTo: ADMIN_EMAIL,
              htmlBody:
                "<html><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333;\">" +
                "<div style=\"max-width:600px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:8px;\">" +
                "<h2 style=\"color:#FF7F50;border-bottom:2px solid #FF7F50;padding-bottom:10px;\">Dziękujemy za zapytanie!</h2>" +
                "<p>Potwierdzamy otrzymanie Twojego zapytania z konfiguratora Smart Home. Poniżej szacunkowy koszt twojej inwestycji uwzględniający już koszt materiałów i naszej pracy:</p>" +
                "<h3 style=\"color:#444;margin-top:20px;\">Podsumowanie Wyceny</h3>" +
                "<div style=\"background-color:#fffaf0;border:1px solid #ffeedd;padding:15px;border-radius:8px;text-align:center;\">" +
                "<p style=\"font-size:1.1em;margin:0;color:#555;\">Szacunkowa Wycena Systemu:</p>" +
                "<p style=\"font-size:2.2em;font-weight:bold;color:#FF7F50;margin:5px 0 0;\">" + quoteStr + "</p>" +
                "</div>" +
                "<h3 style=\"color:#444;margin-top:20px;\">Wybrana Konfiguracja:</h3>" +
                "<ul style=\"list-style:none;padding:0;\">" + simpleItemsHtml + "</ul>" +
                roomLayoutHtml +
                "<p style=\"margin-top:25px;\">Pamiętaj, że podana kwota ma charakter orientacyjny. Wkrótce skontaktujemy się z Tobą, aby omówić szczegóły i przedstawić bardziej precyzyjną ofertę.</p>" +
                "<p style=\"margin-top:25px;font-size:0.9em;color:#777;\">Pozdrawiamy,<br/>" +
                "Zespół " + COMPANY_NAME + "<br/>" +
                "<a href=\"mailto:" + COMPANY_EMAIL + "\">" + COMPANY_EMAIL + "</a></p>" +
                "</div></body></html>"
            });
          } catch(ex) { sfMailErrors.push("client: " + ex.message); }
        }

        return ok({ id: lead.id, status: "Nowy", mailErrors: sfMailErrors.length ? sfMailErrors : undefined });
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

        var scfMailErrors = [];

        // Powiadomienie do admina
        if (ADMIN_EMAIL) {
          try {
            GmailApp.sendEmail(ADMIN_EMAIL, "Formularz kontaktowy – " + contact.name, "", {
              name: COMPANY_NAME + " – Kontakt",
              htmlBody:
                "<html><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333;\">" +
                "<div style=\"max-width:600px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:8px;\">" +
                "<h2 style=\"color:#FF7F50;border-bottom:2px solid #FF7F50;padding-bottom:10px;\">NOWA WIADOMOŚĆ KONTAKTOWA</h2>" +
                "<p>Otrzymano nową wiadomość kontaktową. Szczegóły:</p>" +
                "<table style=\"width:100%;margin-top:15px;border-collapse:collapse;\">" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;width:30%;\">Data/Czas:</td><td style=\"padding:8px 0;\">" + contact.date + "</td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;\">Imię i Nazwisko:</td><td style=\"padding:8px 0;\">" + contact.name + "</td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;\">Email:</td><td style=\"padding:8px 0;\"><a href=\"mailto:" + contact.email + "\">" + contact.email + "</a></td></tr>" +
                "<tr><td style=\"padding:8px 0;font-weight:bold;\">Telefon:</td><td style=\"padding:8px 0;\">" + contact.phone + "</td></tr>" +
                "</table>" +
                "<h3 style=\"color:#444;margin-top:20px;\">Treść Wiadomości:</h3>" +
                "<p style=\"padding:10px;border-left:3px solid #FF7F50;background-color:#f9f9f9;white-space:pre-wrap;\">" + contact.message + "</p>" +
                "</div></body></html>"
            });
          } catch(ex) { scfMailErrors.push("admin: " + ex.message); }
        }

        // Potwierdzenie do klienta
        if (contact.email) {
          try {
            GmailApp.sendEmail(contact.email, "Potwierdzenie wiadomości do " + COMPANY_NAME, "", {
              name: COMPANY_NAME,
              replyTo: ADMIN_EMAIL,
              htmlBody:
                "<html><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#333;\">" +
                "<div style=\"max-width:600px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:8px;\">" +
                "<h2 style=\"color:#FF7F50;border-bottom:2px solid #FF7F50;padding-bottom:10px;\">Dziękujemy za kontakt!</h2>" +
                "<p>Potwierdzamy otrzymanie Twojej wiadomości. Zespół " + COMPANY_NAME + " skontaktuje się z Tobą wkrótce.</p>" +
                "<h3 style=\"color:#444;margin-top:20px;\">Twoja wiadomość:</h3>" +
                "<p style=\"padding:10px;border-left:3px solid #eee;background-color:#f7f7f7;white-space:pre-wrap;\">" + contact.message + "</p>" +
                "<p style=\"margin-top:25px;font-size:0.9em;color:#777;\">Pozdrawiamy,<br/>" +
                "Zespół " + COMPANY_NAME + "<br/>" +
                "<a href=\"mailto:" + COMPANY_EMAIL + "\">" + COMPANY_EMAIL + "</a></p>" +
                "</div></body></html>"
            });
          } catch(ex) { scfMailErrors.push("client: " + ex.message); }
        }

        return ok({ id: contact.id, mailErrors: scfMailErrors.length ? scfMailErrors : undefined });
      }

      // Irytacja (alternatywnie przez POST)
      case "zirytujMnie": {
        var iLoxoneStatus = "Brak konfiguracji LOXONE_URL";
        if (LOXONE_URL) {
          try {
            var iLoxResp = UrlFetchApp.fetch(LOXONE_URL, {
              method: "get",
              headers: { "Authorization": "Basic " + Utilities.base64Encode(LOXONE_USER + ":" + LOXONE_PASS) },
              muteHttpExceptions: true
            });
            iLoxoneStatus = iLoxResp.getResponseCode() === 200 ? "Sukces (200 OK)" : "Loxone Error: " + iLoxResp.getResponseCode();
          } catch(ex) { iLoxoneStatus = "Błąd krytyczny: " + ex.toString(); }
        }
        var iEntry = {
          id:           "iryt-" + Date.now(),
          date:         nowIso(),
          action:       "Irytacja instalatora",
          note:         body.note || "",
          loxoneStatus: iLoxoneStatus
        };
        insertRow("Wkurwienia", iEntry);
        return ok({ logged: true, date: iEntry.date, loxoneStatus: iLoxoneStatus });
      }

      default:
        return err("Nieznana akcja POST: " + action);
    }
  } catch(ex) {
    return err(ex.message);
  }
}
