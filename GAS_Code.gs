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
var ADMIN_EMAIL = "obsługa.designiq@gmail.com";

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
    "id", "date", "action", "note", "loxoneStatus"
  ],
  // ── Wyceny projektów ─────────────────────────────────────────────────────────
  "Wyceny": [
    "id", "projectId", "items", "status", "acceptedAt", "updatedDate"
  ],
  // ── Listy zakupów projektów ───────────────────────────────────────────────────
  "Zakupy": [
    "id", "projectId", "items", "updatedDate"
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

        var singleSvg  = null;
        var singleJson = null;
        var floorMap   = {}; // { "Parter": { svg: null, json: null }, ... }

        var dwgFiles = dwgFolder.getFiles();
        while (dwgFiles.hasNext()) {
          var df      = dwgFiles.next();
          var origName = df.getName();
          var nameLow  = origName.toLowerCase();

          if (nameLow === "projekt.svg") {
            singleSvg  = df.getBlob().getDataAsString("UTF-8");
          } else if (nameLow === "projekt.json") {
            singleJson = df.getBlob().getDataAsString("UTF-8");
          } else {
            // projekt_NazwaPiętra.svg / projekt_NazwaPiętra.json
            var floorSvg  = nameLow.match(/^projekt_(.+)\.svg$/);
            var floorJson = nameLow.match(/^projekt_(.+)\.json$/);
            if (floorSvg || floorJson) {
              // Pobierz nazwę z oryginalnego pliku (zachowaj wielkość liter)
              var dotIdx   = origName.lastIndexOf(".");
              var floorKey = origName.slice(8, dotIdx); // "projekt_".length === 8
              if (!floorMap[floorKey]) floorMap[floorKey] = { svg: null, json: null };
              if (floorSvg)  floorMap[floorKey].svg  = df.getBlob().getDataAsString("UTF-8");
              if (floorJson) floorMap[floorKey].json = df.getBlob().getDataAsString("UTF-8");
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
            return { name: key, svg: floorMap[key].svg, attribs: att };
          });
          return ok({ floors: floors });
        }

        // Tryb jednostronicowy (wsteczna kompatybilność)
        if (!singleSvg) return ok({ floors: [] });
        var singleAtt = null;
        if (singleJson) { try { singleAtt = JSON.parse(singleJson); } catch(ex) {} }
        return ok({ floors: [{ name: "Rzut", svg: singleSvg, attribs: singleAtt }] });
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
        var visibleDocs = projectDocs.filter(function(d) { return d.clientVisible; });
        // Pliki z Drive – foldery nazwane kodem projektu (czytelna nazwa)
        // Wykluczamy pliki, które mają wpis w Dokumenty z clientVisible=false
        var hiddenUrls    = {};
        var hiddenDriveIds = {};
        projectDocs.forEach(function(d) {
          if (!d.clientVisible) {
            if (d.url)     hiddenUrls[d.url]         = true;
            if (d.driveId) hiddenDriveIds[d.driveId] = true;
          }
        });
        var allDriveFiles = getDriveFiles(project.code || project.id);
        var driveFiles = allDriveFiles.filter(function(f) {
          return !hiddenUrls[f.webViewLink] && !hiddenDriveIds[f.id];
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
        getOrCreateProjectFolder(body.project.code || body.project.id);
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
        // Preferuj code projektu (czytelna nazwa folderu), fallback na projectId
        var uploadFolderName = body.projectCode || body.projectId;
        var uploadFolder = uploadFolderName
          ? getOrCreateProjectFolder(uploadFolderName)
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
            GmailApp.sendEmail(
              ADMIN_EMAIL,
              "📩 Nowy lead (" + newLeadObj.source + ") – " + (newLeadObj.name || ""),
              "Nowy lead z formularza: " + newLeadObj.source + "\n\n" +
              "Imię: "    + (newLeadObj.name  || "") + "\n" +
              "Email: "   + (newLeadObj.email || "") + "\n" +
              "Telefon: " + (newLeadObj.phone || "") + "\n" +
              (newLeadObj.notes ? "\nNotatki:\n" + newLeadObj.notes + "\n" : "") +
              "\nData: " + newLeadObj.date
            );
          } catch(ex) {}
        }

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
          date:          nowIso().substring(0, 10),
          clientVisible: true
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

        // Wyślij potwierdzenie do klienta z wycena i konfiguracja
        if (body.email) {
          try {
            var clientQuote = lead.quoteValue
              ? "Szacunkowa wycena: " + Number(lead.quoteValue).toLocaleString("pl-PL") + " zł netto\n"
              : "";
            var clientConfig = "";
            if (lead.configData && typeof lead.configData === "object") {
              var clientConfigLines = [];
              var clientConfigKeys = Object.keys(lead.configData);
              for (var cc = 0; cc < clientConfigKeys.length; cc++) {
                var ck = clientConfigKeys[cc];
                var cv = lead.configData[ck];
                if (cv !== null && cv !== undefined && cv !== "") {
                  clientConfigLines.push("  • " + ck + ": " + cv);
                }
              }
              if (clientConfigLines.length > 0) {
                clientConfig = "\nTwoja konfiguracja:\n" + clientConfigLines.join("\n") + "\n";
              }
            }
            GmailApp.sendEmail(
              body.email,
              "Potwierdzenie zapytania i szacunkowa wycena – designIQ",
              "Dzień dobry " + (body.name || "") + ",\n\n" +
              "Dziękujemy za skorzystanie z konfiguratora designIQ.\n" +
              "Poniżej znajdziesz podsumowanie Twojego zapytania.\n\n" +
              clientQuote +
              clientConfig +
              "\nNasz zespół skontaktuje się z Tobą wkrótce w celu omówienia szczegółów.\n\n" +
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

        // Powiadomienie do admina
        if (ADMIN_EMAIL) {
          try {
            GmailApp.sendEmail(
              ADMIN_EMAIL,
              "📩 Formularz kontaktowy – " + contact.name,
              "Nowa wiadomość z formularza kontaktowego designIQ:\n\n" +
              "Imię i nazwisko: " + contact.name + "\n" +
              "Email: " + contact.email + "\n" +
              "Telefon: " + contact.phone + "\n\n" +
              "Wiadomość:\n" + contact.message + "\n\n" +
              "Data: " + contact.date
            );
          } catch(ex) {}
        }

        // Potwierdzenie do klienta
        if (contact.email) {
          try {
            GmailApp.sendEmail(
              contact.email,
              "Potwierdzenie wiadomości – designIQ",
              "Dzień dobry " + (contact.name || "") + ",\n\n" +
              "Dziękujemy za kontakt z designIQ.\n" +
              "Otrzymaliśmy Twoją wiadomość i skontaktujemy się z Tobą wkrótce.\n\n" +
              "Treść Twojej wiadomości:\n" +
              "\"" + contact.message + "\"\n\n" +
              "Pozdrawiamy,\nZespół designIQ\n" +
              "obsługa.designiq@gmail.com"
            );
          } catch(ex) {}
        }

        return ok({ id: contact.id });
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
