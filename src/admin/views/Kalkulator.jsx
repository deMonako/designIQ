import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator, FolderKanban, RefreshCw, Download, Search,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  X, SlidersHorizontal, Save, FolderOpen, RotateCcw,
} from "lucide-react";
import * as GAS from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";
import { buildCatalogFromCennikWithSpecs } from "../../lib/shoppingList/productCatalog";
import { buildEffectiveMappings, EMPTY_KALKULATOR_SETTINGS } from "../../lib/shoppingList/kalkulatorDefaults";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);


// ── Definicje kolumn ─────────────────────────────────────────────────────────

const COLS = [
  { key: "tag",           label: "ID",            sortable: true,  defaultVisible: true,  narrow: true  },
  { key: "kondygnacja",   label: "Kondygnacja",   sortable: true,  defaultVisible: true  },
  { key: "pomieszczenie", label: "Pomieszczenie",  sortable: true,  defaultVisible: true  },
  { key: "typ",           label: "Typ",            sortable: true,  defaultVisible: true  },
  { key: "rola",          label: "Rola",           sortable: true,  defaultVisible: true  },
  { key: "uwagi",         label: "Uwagi",          sortable: false, defaultVisible: false },
  { key: "przewód",       label: "Przewód",        sortable: false, defaultVisible: false },
  { key: "wysokość",      label: "Wysokość",       sortable: false, defaultVisible: false },
  { key: "wariant",       label: "Wariant",        sortable: false, defaultVisible: false },
  { key: "kolor",         label: "Kolor",          sortable: false, defaultVisible: false },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveDefaultDevice(rawTyp, rola, typMappings) {
  const isSlave   = (rola ?? "").toLowerCase().includes("slave");
  const typConfig = typMappings?.[rawTyp];

  if (typConfig?.uncontrolled) return "uncontrolled";
  if (isSlave && !typConfig?.slaveGetsDevice) return "uncontrolled";

  return typConfig?.defaultDevice ?? "uncontrolled";
}

function attribsToRows(attribs, floorName, typMappings) {
  const rows = [];
  for (const [handle, a] of Object.entries(attribs)) {
    if (handle === "_meta" || !a || typeof a !== "object") continue;
    const rawTyp = a.typ ?? "";
    const rola   = a.rola ?? "";
    const typConfig     = typMappings?.[rawTyp];
    const controlDevice = resolveDefaultDevice(rawTyp, rola, typMappings);
    const ioCount = typConfig?.ioCount ?? 1;
    rows.push({
      _id:          `${floorName ?? ""}__${handle}`,
      tag:          a.tag          ?? handle,
      kondygnacja:  a.kondygnacja  ?? floorName ?? "",
      pomieszczenie:a.pomieszczenie?? "",
      typ:          rawTyp,
      rola,
      uwagi:        a.uwagi        ?? "",
      przewód:      a.przewód      ?? "",
      wysokość:     a.wysokość     ?? "",
      wariant:      a.wariant      ?? "",
      kolor:        a.kolor        ?? "",
      rawTyp,
      controlDevice,
      ioCount,
      requiresAttention: false,
    });
  }
  return rows;
}

// ── XLSX export ───────────────────────────────────────────────────────────────

function defaultSortRows(rows) {
  const keys = ["typ", "tag", "rola"];
  return [...rows].sort((a, b) => {
    for (const k of keys) {
      const cmp = (a[k] ?? "").toString().localeCompare((b[k] ?? "").toString(), "pl", { numeric: true, sensitivity: "base" });
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

function exportXLSX(rows, catalog, projectName = "projekt") {
  const headers = [
    "Typ", "Kondygnacja", "Pomieszczenie", "ID/Tag", "Rola",
    "Uwagi", "Przewód", "Wysokość", "Wariant", "Kolor", "Element sterujący", "I/O",
  ];

  const sorted = defaultSortRows(rows);
  const data = sorted.map(r => [
    r.typ, r.kondygnacja, r.pomieszczenie, r.tag, r.rola, r.uwagi,
    r.przewód, r.wysokość, r.wariant, r.kolor,
    r.controlDevice === "uncontrolled"
      ? "niesterowane"
      : r.controlDevice.startsWith("mat:")
        ? r.controlDevice.slice(4)
        : (catalog.find(p => p.id === r.controlDevice)?.name ?? r.controlDevice),
    r.controlDevice !== "uncontrolled" ? r.ioCount : "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Szerokości kolumn
  ws["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 },
    { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 10 },
    { wch: 28 }, { wch: 6 },
  ];

  // Styl nagłówka (bold + fill) — wymaga xlsx-style lub xlsx z opcją cellStyles
  headers.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[cellRef]) return;
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "EA580C" } },
      alignment: { horizontal: "center" },
    };
  });

  // Zamrożenie pierwszego wiersza
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Punkty instalacyjne");

  const safeName = projectName.replace(/[\\/:*?"<>|]/g, "_");
  XLSX.writeFile(wb, `punkty_instalacyjne_${safeName}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ControlDevicePicker — picker z wyszukiwaniem urządzeń i materiałów
// ─────────────────────────────────────────────────────────────────────────────

function ControlDevicePicker({ value, catalog, matOptions, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 288),
        });
      }
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
    }
  }, [open]);

  const label = value === "uncontrolled"
    ? "— niesterowane —"
    : value?.startsWith("mat:")
      ? value.slice(4)
      : catalog.find(p => p.id === value)?.name ?? value;

  const suggestions = useMemo(() => {
    if (query.length < 3) return [];
    const q = query.toLowerCase();
    const devs = catalog
      .filter(p => (p.name ?? "").toLowerCase().includes(q) || (p.partNumber ?? "").includes(q))
      .map(p => ({ value: p.id, label: p.name, sub: p.partNumber || null }));
    const devNames = new Set(devs.map(d => (d.label ?? "").toLowerCase()));
    const mats = matOptions
      .filter(m =>
        ((m.name ?? "").toLowerCase().includes(q) || (m.sku != null && String(m.sku).toLowerCase().includes(q)))
        && !devNames.has((m.name ?? "").toLowerCase())
      )
      .map(m => ({ value: `mat:${m.name}`, label: m.name, sub: m.sku || null }));
    return [...devs, ...mats].slice(0, 12);
  }, [query, catalog, matOptions]);

  const select = (val) => { onChange(val); setOpen(false); };

  const dropdown = open && ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="absolute z-[9999] mt-0.5 bg-white border border-slate-200 rounded-xl shadow-lg"
      style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
    >
      <div className="p-2 border-b border-slate-100">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Szukaj urządzenia lub materiału (min. 3 znaki)…"
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
      <div className="max-h-52 overflow-y-auto">
        <button
          type="button"
          onClick={() => select("uncontrolled")}
          className={`w-full text-left px-3 py-1.5 text-xs border-b border-slate-50 ${value === "uncontrolled" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-500 hover:bg-slate-50"}`}
        >
          — niesterowane —
        </button>

        {query.length < 3 ? (
          <>
            {catalog.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Urządzenia Loxone</div>
                {catalog.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => select(p.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-orange-50 ${value === p.id ? "bg-orange-50 text-orange-700" : "text-slate-700"}`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{p.partNumber}</span>
                  </button>
                ))}
              </>
            )}
            <div className="px-3 py-2 text-[11px] text-slate-400 italic border-t border-slate-50">
              Wpisz 3 znaki, aby wyszukać materiały…
            </div>
          </>
        ) : suggestions.length > 0 ? (
          suggestions.map(s => (
            <button
              type="button"
              key={s.value}
              onClick={() => select(s.value)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-orange-50 ${value === s.value ? "bg-orange-50 text-orange-700" : "text-slate-700"}`}
            >
              <span className="truncate">{s.label}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{s.sub}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-3 text-xs text-slate-400 text-center">Brak wyników dla &ldquo;{query}&rdquo;</div>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 w-full border rounded-lg px-2 py-1 text-xs bg-white transition-colors ${open ? "border-orange-400 ring-1 ring-orange-400/20" : "border-slate-200 hover:border-orange-300"}`}
      >
        <span className={`flex-1 text-left truncate ${value === "uncontrolled" ? "text-slate-400" : "text-slate-700"}`}>{label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>
      {dropdown}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableCell — komórka z edycją inline
// ─────────────────────────────────────────────────────────────────────────────

function EditableCell({ value, onChange, type = "text", placeholder = "—" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400 rounded px-1 -mx-1 py-0.5 min-w-0 placeholder:text-slate-300"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PointCalculator — główny komponent kalkulatora
// ─────────────────────────────────────────────────────────────────────────────

function PointCalculator({ projects, kalkulatorSettings = EMPTY_KALKULATOR_SETTINGS }) {
  // Dane
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [cennik, setCennik] = useState([]);
  const [szafaData, setSzafaData] = useState(null); // zachowujemy szafa config przy zapisie

  // Selekcja projektu
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Filtrowanie
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filterTyp, setFilterTyp] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterMasterOnly, setFilterMasterOnly] = useState(false);
  const [filterNeedsAttention, setFilterNeedsAttention] = useState(false);

  // Sortowanie (domyślnie: typ → kondygnacja → pomieszczenie → tag → rola)
  const [sortKey, setSortKey] = useState("default");
  const [sortDir, setSortDir] = useState("asc");

  // Widoczność kolumn
  const [visibleCols, setVisibleCols] = useState(
    () => new Set(COLS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [showColPicker, setShowColPicker] = useState(false);

  // Konfiguracja kalkulatora (config.json)
  const [pendingConfig, setPendingConfig] = useState(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaveResult, setConfigSaveResult] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const project = projects.find(p => p.id === selectedProjectId) ?? null;

  const effectiveMappings = useMemo(
    () => buildEffectiveMappings(kalkulatorSettings),
    [kalkulatorSettings]
  );
  const effectiveMappingsRef = useRef(effectiveMappings);
  useEffect(() => { effectiveMappingsRef.current = effectiveMappings; }, [effectiveMappings]);

  // Wczytaj katalog Loxone + cennik
  useEffect(() => {
    if (!GAS_ON) return;
    Promise.all([
      GAS.getLoxoneJson().catch(() => []),
      gasGet("getCennik").catch(() => []),
    ]).then(([loxData, cennikData]) => {
      const cennikArr = Array.isArray(cennikData) ? cennikData : [];
      const fromCennik = buildCatalogFromCennikWithSpecs(cennikArr, effectiveMappingsRef.current.skuSpecs);
      if (Array.isArray(loxData) && loxData.length > 0) {
        const loxIds = new Set(loxData.map(p => p.id));
        setCatalog([...loxData, ...fromCennik.filter(p => !loxIds.has(p.id))]);
      } else {
        setCatalog(fromCennik);
      }
      setCennik(cennikArr);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const matOptions = useMemo(() => {
    const seen = new Set();
    return cennik
      .filter(c => c.name && !seen.has(c.name) && seen.add(c.name))
      .map(c => ({ name: c.name, price_pln: c.price_pln, sku: c.sku ?? null }));
  }, [cennik]);

  // Zastosuj konfigurację do wierszy
  const applyConfig = useCallback((baseRows, cfg) => {
    if (!cfg?.rows) return baseRows;
    return baseRows.map(r => {
      const override = cfg.rows[r._id];
      if (!override) return r;
      return {
        ...r,
        controlDevice:     override.controlDevice     ?? r.controlDevice,
        ioCount:           override.ioCount           ?? r.ioCount,
        requiresAttention: override.requiresAttention ?? r.requiresAttention,
      };
    });
  }, []);

  // Wczytaj punkty z Google Drive
  const handleLoadPoints = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    setRows([]);
    setPendingConfig(null);
    setConfigSaveResult(null);
    setSzafaData(null);

    try {
      let loaded = [];

      if (GAS_ON) {
        const [result, cfg] = await Promise.all([
          GAS.getDwgViewerContent(project.code).catch(() => null),
          GAS.getKalkulatorConfig(project.code).catch(() => null),
        ]);

        if (result?.floors?.length > 0) {
          for (const floor of result.floors) {
            if (!floor.attribs || typeof floor.attribs !== "object") continue;
            loaded.push(...attribsToRows(floor.attribs, floor.name, effectiveMappingsRef.current.typMappings));
          }
        }

        // Zachowaj dane szafy z istniejącej konfiguracji
        if (cfg?.szafa) setSzafaData(cfg.szafa);

        if (loaded.length > 0 && cfg?.rows && Object.keys(cfg.rows).length > 0) {
          setRows(applyConfig(loaded, cfg)); // auto-apply saved config
        } else {
          setRows(loaded);
        }
      }

      if (loaded.length === 0) {
        setLoadError("Brak danych instalacyjnych. Wgraj projekt.json do folderu projektu na Google Drive.");
      }
    } catch (e) {
      setLoadError("Błąd ładowania: " + (e?.message ?? "nieznany"));
    } finally {
      setLoading(false);
    }
  }, [project]);

  // Zapisz konfigurację do config.json (zachowując szafa key)
  const handleSaveConfig = useCallback(async () => {
    if (!project || rows.length === 0) return;
    setConfigSaving(true);
    setConfigSaveResult(null);
    try {
      const rowOverrides = {};
      for (const r of rows) {
        const defaultIo = effectiveMappingsRef.current.typMappings[r.rawTyp]?.ioCount ?? 1;
        const hasOverride = r.controlDevice !== "uncontrolled" || r.ioCount !== defaultIo || r.requiresAttention;
        if (hasOverride) {
          rowOverrides[r._id] = {
            controlDevice:     r.controlDevice,
            ioCount:           r.ioCount,
            requiresAttention: r.requiresAttention,
          };
        }
      }
      const config = {
        version: 1,
        savedAt: TODAY,
        rows: rowOverrides,
        ...(szafaData ? { szafa: szafaData } : {}),
      };
      if (GAS_ON) await GAS.saveKalkulatorConfig(project.code, config);
      setConfigSaveResult("ok");
    } catch { setConfigSaveResult("err"); }
    finally { setConfigSaving(false); }
  }, [project, rows, szafaData]);

  // Auto-wczytaj po wyborze projektu
  useEffect(() => {
    if (!selectedProjectId) return;
    handleLoadPoints();
  }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset konfiguracji — wczytuje punkty bez zapisanego config.json
  const handleResetConfig = useCallback(async () => {
    if (!project) return;
    setResetConfirmOpen(false);
    setLoading(true);
    setLoadError(null);
    setRows([]);
    setPendingConfig(null);
    setConfigSaveResult(null);
    setSzafaData(null);
    try {
      const result = await GAS.getDwgViewerContent(project.code).catch(() => null);
      const loaded = [];
      if (result?.floors?.length > 0) {
        for (const floor of result.floors) {
          if (!floor.attribs || typeof floor.attribs !== "object") continue;
          loaded.push(...attribsToRows(floor.attribs, floor.name, effectiveMappingsRef.current.typMappings));
        }
      }
      setRows(loaded);
      if (loaded.length === 0) setLoadError("Brak danych instalacyjnych.");
    } catch (e) {
      setLoadError("Błąd ładowania: " + (e?.message ?? "nieznany"));
    } finally {
      setLoading(false);
    }
  }, [project]);

  // Filtrowanie i sortowanie
  const { uniqueTypy, uniqueFloors } = useMemo(() => ({
    uniqueTypy:  [...new Set(rows.map(r => r.typ).filter(Boolean))].sort(),
    uniqueFloors:[...new Set(rows.map(r => r.kondygnacja).filter(Boolean))].sort(),
  }), [rows]);

  const uniqueRooms = useMemo(() => {
    const base = filterFloor === "all" ? rows : rows.filter(r => r.kondygnacja === filterFloor);
    return [...new Set(base.map(r => r.pomieszczenie).filter(Boolean))].sort();
  }, [rows, filterFloor]);

  useEffect(() => { setFilterRoom("all"); }, [filterFloor]);

  const filteredRows = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return rows
      .filter(r => {
        if (filterTyp   !== "all" && r.typ          !== filterTyp)   return false;
        if (filterFloor !== "all" && r.kondygnacja  !== filterFloor) return false;
        if (filterRoom  !== "all" && r.pomieszczenie !== filterRoom)  return false;
        if (filterMasterOnly && !(r.rola ?? "").toLowerCase().includes("master")) return false;
        if (filterNeedsAttention && !r.requiresAttention) return false;
        if (q && !["tag","rola","pomieszczenie","uwagi","typ","wariant"].some(k => (r[k] ?? "").toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "default") {
          const keys = ["typ", "tag", "rola"];
          for (const k of keys) {
            const cmp = (a[k] ?? "").toString().localeCompare((b[k] ?? "").toString(), "pl", { numeric: true, sensitivity: "base" });
            if (cmp !== 0) return cmp;
          }
          return 0;
        }
        const av = (a[sortKey] ?? "").toString().toLowerCase();
        const bv = (b[sortKey] ?? "").toString().toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv, "pl") : bv.localeCompare(av, "pl");
      });
  }, [rows, deferredSearch, filterTyp, filterFloor, filterRoom, filterMasterOnly, filterNeedsAttention, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const updateRow = useCallback((id, updater) => {
    setRows(prev => prev.map(r => r._id === id ? (typeof updater === "function" ? updater(r) : { ...r, ...updater }) : r));
  }, []);

  const activeCols = COLS.filter(c => visibleCols.has(c.key));
  const totalColSpan = activeCols.length + 3; // +3: Uwaga, El.sterujący, I/O

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronDown className="w-3 h-3 text-slate-300 shrink-0" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-orange-500 shrink-0" />
      : <ChevronDown className="w-3 h-3 text-orange-500 shrink-0" />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Projekt + wczytaj ── */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Projekt</label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 bg-white">
            <FolderKanban className="w-4 h-4 text-slate-300 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={e => { setSelectedProjectId(e.target.value); setRows([]); setLoadError(null); }}
              className="flex-1 outline-none text-sm text-slate-800 bg-transparent"
            >
              <option value="">— wybierz projekt —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleLoadPoints}
          disabled={!selectedProjectId || loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:shadow-md hover:from-orange-700 hover:to-orange-600 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Wczytaj punkty
        </button>
      </div>

      {/* Błąd */}
      {loadError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{loadError}
        </div>
      )}

      {/* ── TABELA ── */}
      {rows.length > 0 && (
        <>
          {/* Pasek filtrów */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>}
            </div>

            <select value={filterTyp} onChange={e => setFilterTyp(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[160px]">
              <option value="all">Wszystkie typy</option>
              {uniqueTypy.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {uniqueFloors.length > 1 && (
              <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[140px]">
                <option value="all">Wszystkie piętra</option>
                {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            )}

            <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-1 focus:ring-orange-400 bg-white max-w-[160px]">
              <option value="all">Wszystkie pomieszczenia</option>
              {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none whitespace-nowrap border border-slate-200 rounded-lg px-2.5 py-2 hover:border-slate-300">
              <input
                type="checkbox"
                checked={filterMasterOnly}
                onChange={e => setFilterMasterOnly(e.target.checked)}
                className="rounded accent-orange-500"
              />
              Tylko master
            </label>

            <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none whitespace-nowrap border rounded-lg px-2.5 py-2 transition-colors ${filterNeedsAttention ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
              <input
                type="checkbox"
                checked={filterNeedsAttention}
                onChange={e => setFilterNeedsAttention(e.target.checked)}
                className="rounded accent-amber-500"
              />
              Wymaga uwagi
            </label>

            <span className="text-xs text-slate-400 whitespace-nowrap">
              {filteredRows.length} / {rows.length} pkt.
            </span>

            {/* Kolumny toggle */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowColPicker(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-2 border rounded-lg transition-colors ${showColPicker ? "border-orange-400 text-orange-600 bg-orange-50" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Kolumny
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-3 min-w-[180px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Widoczne kolumny</div>
                  {COLS.map(col => (
                    <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer hover:text-slate-800 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={e => {
                          const next = new Set(visibleCols);
                          if (e.target.checked) next.add(col.key); else next.delete(col.key);
                          setVisibleCols(next);
                        }}
                        className="rounded accent-orange-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Eksport Excel */}
            <button
              onClick={() => exportXLSX(rows, catalog, project?.code ?? "projekt")}
              className="flex items-center gap-1.5 text-xs px-2.5 py-2 border border-slate-200 rounded-lg text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Eksport XLSX
            </button>
          </div>

          {/* Tabela */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
              <table className="w-full text-sm" style={{ minWidth: "760px" }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide border-b border-slate-200">
                    {activeCols.map(col => (
                      <th
                        key={col.key}
                        className={`text-left px-3 py-1.5 ${col.sortable ? "cursor-pointer select-none hover:text-slate-700" : ""} ${col.narrow ? "w-20" : ""}`}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}<SortIcon col={col} />
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-3 py-1.5 w-16">Uwaga</th>
                    <th className="text-left px-3 py-1.5 w-48">Element sterujący</th>
                    <th className="text-center px-3 py-1.5 w-14">I/O</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr><td colSpan={totalColSpan} className="text-center py-8 text-slate-300 text-sm">Brak wyników dla aktywnych filtrów</td></tr>
                  ) : filteredRows.map(row => (
                    <tr key={row._id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      {activeCols.map(col => (
                        <td key={col.key} className="px-3 py-0.5">
                          {col.key === "kolor" ? (
                            <div className="flex items-center gap-1.5">
                              {row.kolor && <span className="w-4 h-4 rounded border border-slate-200 shrink-0" style={{ backgroundColor: row.kolor }} />}
                              <EditableCell value={row.kolor} onChange={v => updateRow(row._id, { kolor: v })} placeholder="#ffffff" />
                            </div>
                          ) : col.key === "typ" ? (
                            <EditableCell value={row.typ} onChange={v => updateRow(row._id, { typ: v, rawTyp: v })} />
                          ) : (
                            <EditableCell value={row[col.key]} onChange={v => updateRow(row._id, { [col.key]: v })} />
                          )}
                        </td>
                      ))}

                      {/* Wymaga uwagi */}
                      <td className="px-3 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.requiresAttention ?? false}
                          onChange={e => updateRow(row._id, { requiresAttention: e.target.checked })}
                          className="rounded accent-amber-500 cursor-pointer w-4 h-4"
                          title="Wymaga uwagi"
                        />
                      </td>

                      {/* Element sterujący */}
                      <td className="px-3 py-0.5 min-w-[200px]">
                        <ControlDevicePicker
                          value={row.controlDevice ?? "uncontrolled"}
                          catalog={catalog}
                          matOptions={matOptions}
                          onChange={v => updateRow(row._id, { controlDevice: v })}
                        />
                      </td>

                      {/* I/O */}
                      <td className="px-3 py-0.5 text-center">
                        {row.controlDevice !== "uncontrolled" ? (
                          <input
                            type="number" min="1" max="32" value={row.ioCount ?? 1}
                            onChange={e => updateRow(row._id, { ioCount: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-12 text-center border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400 tabular-nums"
                          />
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Akcje pod tabelą */}
          <div className="flex items-center justify-between pt-1 gap-3">
            <div className="text-xs text-slate-400">
              {rows.filter(r => r.controlDevice !== "uncontrolled").length} punktów ze sterowaniem
              {rows.filter(r => r.requiresAttention).length > 0 && (
                <span className="text-amber-500 ml-1">· {rows.filter(r => r.requiresAttention).length} wymaga uwagi</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {configSaveResult === "ok" && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Konfiguracja zapisana
                  </motion.span>
                )}
                {configSaveResult === "err" && (
                  <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Błąd zapisu</span>
                )}
              </AnimatePresence>
              <button
                onClick={() => setResetConfirmOpen(true)}
                disabled={!project || rows.length === 0}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:border-red-300 hover:text-red-500 disabled:opacity-40 transition-colors"
                title="Zresetuj konfigurację — usuwa przypisania urządzeń"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={configSaving || !project}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 transition-colors"
              >
                {configSaving
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Zapisuję…</>
                  : <><Save className="w-3.5 h-3.5" /> Zapisz konfigurację</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dialog potwierdzenia resetu */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Zresetować konfigurację?</div>
                <div className="text-xs text-slate-500 mt-0.5">Wszystkie przypisania urządzeń zostaną usunięte. Punkty instalacyjne zostaną wczytane bez zapisanej konfiguracji.</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleResetConfig}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Tak, resetuj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && !loadError && !loading && (
        <div className="text-center py-10 text-slate-300 text-sm">
          {selectedProjectId ? "Trwa wczytywanie danych…" : "Wybierz projekt aby rozpocząć"}
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Kalkulator({ projects = [], kalkulatorSettings = EMPTY_KALKULATOR_SETTINGS }) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pkt instalacyjne</h2>
          <p className="text-xs text-slate-400">Przypisuj urządzenia sterujące i eksportuj dane punktów</p>
        </div>
      </div>
      <PointCalculator projects={projects} kalkulatorSettings={kalkulatorSettings} />
    </div>
  );
}
