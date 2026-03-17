import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Cpu, Package, Download, AlertTriangle,
  CheckCircle2, AlertCircle, Plus, X, Trash2, RefreshCw,
  FolderKanban, FolderOpen, Save, ChevronDown, ChevronRight,
  Search, Info,
} from "lucide-react";
import { toast } from "sonner";
import { genId } from "../utils/id";
import * as GAS from "../api/gasApi";
import { gasGet } from "../api/gasClient";
import { GAS_CONFIG } from "../api/gasConfig";
import { TODAY } from "../mockData";
import { buildCatalogFromCennikWithSpecs } from "../../lib/shoppingList/productCatalog";
import { buildEffectiveMappings, EMPTY_KALKULATOR_SETTINGS } from "../../lib/shoppingList/kalkulatorDefaults";

const GAS_ON = GAS_CONFIG.enabled && Boolean(GAS_CONFIG.scriptUrl);

// ─── Stałe elektryczne ────────────────────────────────────────────────────────

const BREAKER_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
const RHO_COPPER      = 0.0175;

function pickCableSize(I) {
  if (I <=  10) return 1.5;
  if (I <=  16) return 2.5;
  if (I <=  25) return 4;
  if (I <=  32) return 6;
  if (I <=  50) return 10;
  if (I <=  63) return 16;
  return 25;
}

function pickBreakerRating(I) {
  return BREAKER_RATINGS.find(r => r >= I) ?? 63;
}

const CIRCUIT_BREAKER_TYPES = {
  lighting: "B", socket: "B", motor: "C",
  heating: "B", hvac: "C", ev: "C", other: "B",
};

const CIRCUIT_TYPES = [
  { key: "lighting", label: "Oświetlenie",   pf: 0.95 },
  { key: "socket",   label: "Gniazdka",      pf: 0.95 },
  { key: "motor",    label: "Silnik/pompa",  pf: 0.80 },
  { key: "heating",  label: "Ogrzewanie",    pf: 1.00 },
  { key: "hvac",     label: "Klimatyzacja",  pf: 0.85 },
  { key: "ev",       label: "Ładowarka EV",  pf: 0.99 },
  { key: "other",    label: "Inne",          pf: 0.90 },
];

const TYPICAL_POWER = {
  lighting: 50, socket: 300, motor: 150,
  heating: 1000, hvac: 2500, ev: 11000, other: 100,
};

function detectCategory(rawTyp) {
  const t = (rawTyp ?? "").toLowerCase();
  if (/light|ośw|świat|lampa|led|spot/.test(t)) return "lighting";
  if (/socket|gniazd|outlet/.test(t)) return "socket";
  if (/rolet|motor|shutter|blind|żaluz/.test(t)) return "motor";
  if (/heat|ogrzew|floor|podłog/.test(t)) return "heating";
  if (/hvac|klim|ac |wentyl|rekup/.test(t)) return "hvac";
  if (/ev|elektr.*pojazd|charge|ładow/.test(t)) return "ev";
  return "other";
}

function calcCircuit(c) {
  const pf  = CIRCUIT_TYPES.find(t => t.key === c.type)?.pf ?? 0.9;
  const rawI = (parseFloat(c.power) || 0) / (c.phases === 3 ? (400 * Math.sqrt(3) * pf) : (230 * pf));
  const I           = Math.round(rawI * 100) / 100;
  const cableSize   = pickCableSize(I);
  const breakerA    = pickBreakerRating(I);
  const breakerType = CIRCUIT_BREAKER_TYPES[c.type] ?? "B";
  const L           = parseFloat(c.cableLength) || 0;
  const voltDrop    = L > 0
    ? (2 * RHO_COPPER * L * I) / (cableSize * 230) * 100
    : null;
  return { I, cableSize, breakerA, breakerType, voltDrop };
}

function autoGenerateCircuits(rows) {
  const groups = {};
  for (const r of rows) {
    const cat = detectCategory(r.rawTyp);
    const key = `${r.kondygnacja}__${cat}`;
    if (!groups[key]) groups[key] = { kondygnacja: r.kondygnacja, cat, count: 0 };
    groups[key].count++;
  }
  return Object.values(groups).map(g => ({
    id:          genId("cir"),
    name:        `${g.kondygnacja} – ${CIRCUIT_TYPES.find(t => t.key === g.cat)?.label ?? g.cat}`,
    type:        g.cat,
    power:       g.count * TYPICAL_POWER[g.cat],
    cableLength: 15,
    phases:      g.cat === "ev" ? 3 : 1,
  }));
}

// ─── Loxone — liczenie modułów ─────────────────────────────────────────────────

const LOXONE_MODULES = {
  miniserver: { name: "Loxone Miniserver Go",        di: 8,  ro: 6,  ao: 4, dim: 0, price: 1650 },
  tree_ext:   { name: "Loxone Tree Extension",        di: 12, ro: 8,  ao: 4, dim: 0, price: 490  },
  relay_ext:  { name: "Loxone Relay Extension",       di: 0,  ro: 14, ao: 0, dim: 0, price: 290  },
  dimmer_ext: { name: "Loxone Dimmer Extension",      di: 0,  ro: 4,  ao: 0, dim: 4, price: 590  },
  temp_ext:   { name: "Loxone 1-Wire Extension",      di: 0,  ro: 0,  ao: 0, dim: 0, price: 175  },
};

function calcLoxoneModules(io) {
  const { needRO, needDIM, needDI, needTemp, miniservers: ms } = io;
  const msCount = Math.max(1, ms || 1);
  let freeRO  = msCount * LOXONE_MODULES.miniserver.ro;
  let freeDI  = msCount * LOXONE_MODULES.miniserver.di;
  let freeDIM = 0;
  const modules = [{ ...LOXONE_MODULES.miniserver, qty: msCount, key: "miniserver" }];

  const roNeeded = Math.max(0, (needRO || 0) - freeRO);
  if (roNeeded > 0) {
    const n = Math.ceil(roNeeded / LOXONE_MODULES.tree_ext.ro);
    modules.push({ ...LOXONE_MODULES.tree_ext, qty: n, key: "tree_ext" });
    freeRO += n * LOXONE_MODULES.tree_ext.ro;
    freeDI += n * LOXONE_MODULES.tree_ext.di;
  }
  const dimNeeded = Math.max(0, (needDIM || 0) - freeDIM);
  if (dimNeeded > 0) {
    const n = Math.ceil(dimNeeded / LOXONE_MODULES.dimmer_ext.dim);
    modules.push({ ...LOXONE_MODULES.dimmer_ext, qty: n, key: "dimmer_ext" });
  }
  if ((needTemp || 0) > 0) {
    modules.push({ ...LOXONE_MODULES.temp_ext, qty: Math.ceil(needTemp / 6), key: "temp_ext" });
  }
  const diNeeded = Math.max(0, (needDI || 0) - freeDI);
  if (diNeeded > 0) {
    const n = Math.ceil(diNeeded / LOXONE_MODULES.tree_ext.di);
    modules.push({ ...LOXONE_MODULES.tree_ext, qty: n, key: "tree_ext_di" });
  }
  return modules;
}

function calcIOFromRows(rows, catalog) {
  let needRO = 0, needDIM = 0, needDI = 0;

  for (const r of rows) {
    if (!r.controlDevice || r.controlDevice === "uncontrolled") continue;

    const ioCount = r.ioCount ?? 1;
    const rawTyp  = (r.rawTyp ?? "").toLowerCase();
    const isDimmer = /dim|ściemni|dimm/.test(rawTyp);
    const cat      = detectCategory(r.rawTyp);

    // Wyjścia: DIM dla ściemniaczy, RO dla reszty
    if (isDimmer) {
      needDIM += ioCount;
    } else {
      needRO += ioCount;
    }

    // Wejścia cyfrowe: 1 DI na przycisk (rolety mają 2 przyciski)
    if (cat === "motor") {
      needDI += 2; // góra + dół
    } else if (cat !== "heating" && cat !== "hvac") {
      needDI += 1; // standardowy włącznik/przycisk
    }
  }

  return { miniservers: 1, needRO, needDIM, needDI, needAI: 2, needTemp: 2 };
}

function generateBOM(circuits, loxoneModules) {
  const items = [];

  // Wyłączniki z obwodów zdefiniowanych przez użytkownika
  const breakerGroups = {};
  circuits.forEach(c => {
    const { breakerA, breakerType } = calcCircuit(c);
    const key = `${breakerType}${breakerA}`;
    breakerGroups[key] = (breakerGroups[key] || 0) + 1;
  });
  Object.entries(breakerGroups).forEach(([key, qty]) => {
    const type = key[0];
    const A    = parseInt(key.slice(1));
    items.push({
      id: genId("bom"), name: `Wyłącznik nadprądowy ${type}${A}A 1P`, category: "cabinet",
      quantity: qty, unit: "szt.", priceEst: 0, link: "", status: "Oczekuje",
    });
  });

  // Moduły Loxone z kalkulatora I/O
  const grouped = {};
  loxoneModules.forEach(m => {
    const k = m.key;
    if (grouped[k]) grouped[k].qty += m.qty;
    else grouped[k] = { ...m };
  });
  Object.values(grouped).forEach(m => {
    items.push({
      id: genId("bom"), name: m.name, category: "smart_home",
      quantity: m.qty, unit: "szt.", priceEst: m.price ?? 0, link: "", status: "Oczekuje",
    });
  });

  return items;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    rows.push({
      _id:          `${floorName ?? ""}__${handle}`,
      tag:          a.tag          ?? handle,
      kondygnacja:  a.kondygnacja  ?? floorName ?? "",
      pomieszczenie:a.pomieszczenie?? "",
      typ:          rawTyp,
      rola,
      rawTyp,
      controlDevice,
      ioCount:      typConfig?.ioCount ?? 1,
    });
  }
  return rows;
}

function applyRowsConfig(baseRows, cfg) {
  if (!cfg?.rows) return baseRows;
  return baseRows.map(r => {
    const ov = cfg.rows[r._id];
    if (!ov) return r;
    return { ...r, controlDevice: ov.controlDevice ?? r.controlDevice, ioCount: ov.ioCount ?? r.ioCount };
  });
}

// ─── AddCabinetMaterialRow — szybkie dodawanie materiału szafy ───────────────

function AddCabinetMaterialRow({ matOptions, onAdd }) {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("szt.");
  const [showSugg, setShowSugg] = useState(false);
  const ref = useRef(null);

  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    return matOptions.filter(m => m.name && m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, matOptions]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const commit = (name = search) => {
    if (!name.trim()) return;
    onAdd({ id: genId("cm"), type: "other", name: name.trim(), qty, unit });
    setSearch(""); setQty(1); setUnit("szt."); setShowSugg(false);
  };

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <div className="relative flex-1">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSugg(true); }}
          onFocus={() => setShowSugg(true)}
          onKeyDown={e => e.key === "Enter" && commit()}
          placeholder="Szukaj materiału lub wpisz nazwę…"
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
        />
        {showSugg && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-0.5 w-64 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-36 overflow-y-auto">
            {suggestions.map(m => (
              <li
                key={m.name}
                onMouseDown={() => { setSearch(m.name); setShowSugg(false); }}
                className="px-3 py-1.5 text-xs hover:bg-orange-50 cursor-pointer flex justify-between"
              >
                <span className="truncate">{m.name}</span>
                {m.price_pln != null && <span className="text-orange-600 ml-2 shrink-0">{m.price_pln} zł</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        type="number" min="0.1" step="0.1" value={qty}
        onChange={e => setQty(Math.max(0.1, parseFloat(e.target.value) || 1))}
        className="w-14 text-center border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400"
      />
      <select
        value={unit}
        onChange={e => setUnit(e.target.value)}
        className="text-xs border border-slate-200 rounded px-1 py-1 outline-none bg-white focus:ring-1 focus:ring-orange-400 w-16"
      >
        <option value="szt.">szt.</option>
        <option value="m">m</option>
        <option value="kpl">kpl</option>
      </select>
      <button onMouseDown={() => commit()} className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 shrink-0">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Główny komponent ─────────────────────────────────────────────────────────

const TABS = [
  { id: "materialy", label: "Materiały",  icon: Package },
  { id: "layout",    label: "Layout",     icon: Cpu },
  { id: "obwody",    label: "Obwody",     icon: Zap },
];

export default function KalkulatorSzafy({
  projects = [],
  kalkulatorSettings = EMPTY_KALKULATOR_SETTINGS,
  onExportToZakupy,
}) {
  // Projekt
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [pendingConfig, setPendingConfig] = useState(null);

  // Dane projektu
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [matOptions, setMatOptions] = useState([]);
  const [existingRowsConfig, setExistingRowsConfig] = useState(null); // rows config z Kalkulator.jsx — zachowujemy przy zapisie

  // Szafa data (zapisywane w config.szafa)
  const [szafaPoints, setSzafaPoints] = useState({}); // { _id: { terminal, cabinetMaterials } }
  const [circuits, setCircuits]       = useState([]);
  const [loxoneIO, setLoxoneIO]       = useState(null); // null = nieobliczone

  // UI
  const [tab, setTab]                   = useState("materialy");
  const [expandedPointId, setExpandedPointId] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saveResult, setSaveResult]     = useState(null);
  const [exporting, setExporting]       = useState(false);

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
      gasGet("getMaterialyJson").catch(() => []),
    ]).then(([loxData, cennikData, matData]) => {
      const cennikArr = Array.isArray(cennikData) ? cennikData : [];
      const fromCennik = buildCatalogFromCennikWithSpecs(cennikArr, effectiveMappingsRef.current.skuSpecs);
      if (Array.isArray(loxData) && loxData.length > 0) {
        const loxIds = new Set(loxData.map(p => p.id));
        setCatalog([...loxData, ...fromCennik.filter(p => !loxIds.has(p.id))]);
      } else {
        setCatalog(fromCennik);
      }
      const matArr = Array.isArray(matData) ? matData : [];
      const all = [
        ...cennikArr.map(c => ({ name: c.name, price_pln: c.price_pln })),
        ...matArr.map(m => ({ name: m.name, price_pln: m.price_pln })),
      ];
      const seen = new Set();
      setMatOptions(all.filter(m => m.name && !seen.has(m.name) && seen.add(m.name)));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wczytaj punkty z Google Drive
  const handleLoadPoints = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    setRows([]);
    setPendingConfig(null);
    setSzafaPoints({});
    setCircuits([]);
    setLoxoneIO(null);
    setExpandedPointId(null);
    setSaveResult(null);
    setExistingRowsConfig(null);

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

        // Zachowaj rows config z Kalkulator.jsx
        if (cfg?.rows) setExistingRowsConfig(cfg.rows);

        // Wczytaj dane szafy
        if (cfg?.szafa) {
          setSzafaPoints(cfg.szafa.points ?? {});
          setCircuits(cfg.szafa.circuits ?? []);
          if (cfg.szafa.loxoneIO) setLoxoneIO(cfg.szafa.loxoneIO);
        }

        if (loaded.length > 0 && cfg?.rows && Object.keys(cfg.rows).length > 0) {
          // Zastosuj config rows (przypisania urządzeń)
          setPendingConfig({ cfg, baseRows: loaded });
          setRows(loaded);
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

  // Zapisz konfigurację szafy
  const handleSave = useCallback(async () => {
    if (!project || rows.length === 0) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const config = {
        version: 1,
        savedAt: TODAY,
        rows: existingRowsConfig ?? {},
        szafa: {
          savedAt: TODAY,
          points:  szafaPoints,
          circuits,
          loxoneIO: loxoneIO ?? undefined,
        },
      };
      if (GAS_ON) await GAS.saveKalkulatorConfig(project.code, config);
      setSaveResult("ok");
    } catch { setSaveResult("err"); }
    finally { setSaving(false); }
  }, [project, rows, existingRowsConfig, szafaPoints, circuits, loxoneIO]);

  // Pomocnik: wczytaj konfigurację rows (pendingConfig)
  const applyPending = () => {
    if (!pendingConfig) return;
    setRows(applyRowsConfig(pendingConfig.baseRows, pendingConfig.cfg));
    setPendingConfig(null);
  };

  // Efektywne rows (z zastosowaną konfiguracją urządzeń jeśli pending zaakceptowany)
  const effectiveRows = useMemo(() => {
    if (!pendingConfig) return rows;
    return rows; // bez zastosowanej konfiguracji, czeka na decyzję
  }, [rows, pendingConfig]);

  // Szybkie akcje na szafaPoints
  const getPoint = (id) => szafaPoints[id] ?? { terminal: "", cabinetMaterials: [] };
  const updatePoint = useCallback((id, updater) => {
    setSzafaPoints(prev => {
      const cur = prev[id] ?? { terminal: "", cabinetMaterials: [] };
      return { ...prev, [id]: typeof updater === "function" ? updater(cur) : { ...cur, ...updater } };
    });
  }, []);

  const addMaterial = useCallback((rowId, mat) => {
    updatePoint(rowId, p => ({ ...p, cabinetMaterials: [...(p.cabinetMaterials ?? []), mat] }));
  }, [updatePoint]);

  const removeMaterial = useCallback((rowId, matId) => {
    updatePoint(rowId, p => ({ ...p, cabinetMaterials: (p.cabinetMaterials ?? []).filter(m => m.id !== matId) }));
  }, [updatePoint]);

  const updateMaterialQty = useCallback((rowId, matId, qty) => {
    updatePoint(rowId, p => ({
      ...p,
      cabinetMaterials: (p.cabinetMaterials ?? []).map(m => m.id === matId ? { ...m, qty } : m),
    }));
  }, [updatePoint]);

  // Szybkie przyciski materiałów
  const addQuickMaterial = (rowId, type) => {
    const defaults = {
      cable:    { name: "LgY 0.75 CZ", qty: 1.5, unit: "m"   },
      terminal: { name: "Złączka ZDU 1.5", qty: 1, unit: "szt." },
      marker:   { name: "Koszulka ferulkowa", qty: 1, unit: "szt." },
    };
    const d = defaults[type];
    addMaterial(rowId, { id: genId("cm"), type, ...d });
  };

  // Circuits
  const addCircuit = () => setCircuits(p => [...p, {
    id: genId("cir"), name: "", type: "lighting", power: 500, cableLength: 15, phases: 1,
  }]);
  const removeCircuit = (id) => setCircuits(p => p.filter(c => c.id !== id));
  const updateCircuit = (id, k, v) => setCircuits(p => p.map(c => c.id === id ? { ...c, [k]: v } : c));

  const handleAutoGenerateCircuits = () => {
    const generated = autoGenerateCircuits(effectiveRows);
    setCircuits(generated);
    toast.success(`Wygenerowano ${generated.length} propozycji obwodów`);
  };

  // Loxone IO
  const handleAutoCalcIO = () => {
    const io = calcIOFromRows(effectiveRows, catalog);
    setLoxoneIO(io);
    toast.success("Obliczono zapotrzebowanie I/O z punktów projektu");
  };

  const setIO = (k, v) => setLoxoneIO(p => ({ ...(p ?? {}), [k]: Math.max(0, parseInt(v) || 0) }));

  // Obliczone wartości dla obwodów
  const calcResults = useMemo(() => circuits.map(c => ({ ...c, ...calcCircuit(c) })), [circuits]);
  const loxoneModules = useMemo(() => loxoneIO ? calcLoxoneModules(loxoneIO) : [], [loxoneIO]);
  const bom = useMemo(() => generateBOM(calcResults, loxoneModules), [calcResults, loxoneModules]);
  const warnings = calcResults.filter(c => c.voltDrop != null && c.voltDrop > 3);
  const totalBomPrice = bom.reduce((s, i) => s + (i.priceEst || 0) * i.quantity, 0);

  // Generuj zakupy z Layout (terminale)
  const handleGenerateZakupy = async () => {
    if (!project || !onExportToZakupy) return;
    const terminalCount = {};
    effectiveRows.forEach(r => {
      const pt = szafaPoints[r._id];
      const term = pt?.terminal?.trim();
      if (term) {
        const key = `Złączka ${term}`;
        terminalCount[key] = (terminalCount[key] || 0) + 1;
      }
    });
    const items = Object.entries(terminalCount).map(([name, qty]) => ({
      id: genId("zak"), name, category: "cabinet",
      quantity: qty, unit: "szt.", priceEst: 0, link: "", status: "Oczekuje",
    }));
    if (items.length === 0) {
      toast.info("Brak przypisanych złączek — uzupełnij kolumnę Złączka");
      return;
    }
    setExporting(true);
    try {
      await onExportToZakupy(project.id, items);
      toast.success(`Wyeksportowano ${items.length} pozycji do Zakupów`);
    } catch (e) {
      toast.error("Błąd eksportu: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  // Eksport BOM do Zakupów
  const handleExportBOM = async () => {
    if (!project || !onExportToZakupy) return;
    setExporting(true);
    try {
      await onExportToZakupy(project.id, bom);
      toast.success("Wyeksportowano BOM do Zakupów!");
    } catch (e) {
      toast.error("Błąd eksportu: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  // Resolve device name for display
  const deviceLabel = (controlDevice) => {
    if (!controlDevice || controlDevice === "uncontrolled") return "—";
    if (controlDevice.startsWith("mat:")) return controlDevice.slice(4);
    return catalog.find(p => p.id === controlDevice)?.name ?? controlDevice;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Szafa sterownicza</h2>
          <p className="text-xs text-slate-400">Materiały, layout złączek i obliczenia elektryczne szafy</p>
        </div>
      </div>

      {/* Selektor projektu */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Projekt</label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 bg-white">
            <FolderKanban className="w-4 h-4 text-slate-300 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={e => { setSelectedProjectId(e.target.value); setRows([]); setLoadError(null); setSaveResult(null); }}
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
          Wczytaj dane
        </button>
      </div>

      {/* Błąd */}
      {loadError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{loadError}
        </div>
      )}

      {/* Pending config banner */}
      {pendingConfig && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-blue-800">Znaleziono konfigurację urządzeń (z Pkt instalacyjne)</span>
            {pendingConfig.cfg.savedAt && (
              <span className="text-xs text-blue-500 ml-2">z {pendingConfig.cfg.savedAt}</span>
            )}
          </div>
          <button
            onClick={applyPending}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Zastosuj urządzenia
          </button>
          <button
            onClick={() => setPendingConfig(null)}
            className="px-3 py-1.5 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            Pomiń
          </button>
        </div>
      )}

      {/* Zawartość — tylko gdy załadowane */}
      {rows.length > 0 && (
        <>
          {/* Tab bar + Save */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {saveResult === "ok" && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zapisano
                  </motion.span>
                )}
                {saveResult === "err" && (
                  <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Błąd zapisu</span>
                )}
              </AnimatePresence>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 transition-colors"
              >
                {saving
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Zapisuję…</>
                  : <><Save className="w-3.5 h-3.5" /> Zapisz konfigurację szafy</>}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ══ TAB: Materiały ══ */}
            {tab === "materialy" && (
              <motion.div key="mat" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <p className="text-xs text-slate-400">Przypisuj materiały szafy (kable, złączki, koszulki) do punktów instalacyjnych.</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide border-b border-slate-200">
                        <th className="text-left px-3 py-1.5 w-8" />
                        <th className="text-left px-3 py-1.5">Tag</th>
                        <th className="text-left px-3 py-1.5">Kondygnacja</th>
                        <th className="text-left px-3 py-1.5">Pomieszczenie</th>
                        <th className="text-left px-3 py-1.5">El. sterujący</th>
                        <th className="text-center px-3 py-1.5 w-32">Materiały</th>
                      </tr>
                    </thead>
                    <tbody>
                      {effectiveRows.map(row => {
                        const pt = getPoint(row._id);
                        const mats = pt.cabinetMaterials ?? [];
                        const isExpanded = expandedPointId === row._id;
                        return (
                          <React.Fragment key={row._id}>
                            <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isExpanded ? "bg-orange-50/30" : ""}`}>
                              <td className="px-3 py-1.5 text-center">
                                <button
                                  onClick={() => setExpandedPointId(id => id === row._id ? null : row._id)}
                                  className="text-slate-400 hover:text-orange-500"
                                >
                                  {isExpanded
                                    ? <ChevronDown className="w-3.5 h-3.5" />
                                    : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                              <td className="px-3 py-1.5 font-mono text-xs text-slate-600">{row.tag}</td>
                              <td className="px-3 py-1.5 text-xs text-slate-600">{row.kondygnacja}</td>
                              <td className="px-3 py-1.5 text-xs text-slate-600">{row.pomieszczenie}</td>
                              <td className="px-3 py-1.5 text-xs text-slate-500">{deviceLabel(row.controlDevice)}</td>
                              <td className="px-3 py-1.5 text-center">
                                {mats.length > 0 ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-500 text-white rounded-full text-[9px] font-bold">
                                    {mats.length}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-orange-50/30 border-b border-orange-100">
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="max-w-xl space-y-3">
                                    {/* Szybkie przyciski */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500 font-medium">Szybko dodaj:</span>
                                      {[
                                        { type: "cable",    label: "+ Kabel" },
                                        { type: "terminal", label: "+ Złączka" },
                                        { type: "marker",   label: "+ Koszulka" },
                                      ].map(({ type, label }) => (
                                        <button
                                          key={type}
                                          onClick={() => addQuickMaterial(row._id, type)}
                                          className="px-2 py-1 text-xs border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Lista materiałów */}
                                    {mats.length > 0 && (
                                      <div className="space-y-1 border-l-2 border-orange-200 pl-3">
                                        {mats.map(m => (
                                          <div key={m.id} className="flex items-center gap-2 py-0.5">
                                            <span className="text-[9px] font-bold text-orange-400 uppercase w-12 shrink-0">{m.type}</span>
                                            <span className="flex-1 text-xs text-slate-700 truncate">{m.name}</span>
                                            <input
                                              type="number" min="0.1" step="0.1"
                                              value={m.qty}
                                              onChange={e => updateMaterialQty(row._id, m.id, Math.max(0.1, parseFloat(e.target.value) || 1))}
                                              className="w-14 text-center border border-slate-200 rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                                            />
                                            <span className="text-xs text-slate-400 w-8">{m.unit}</span>
                                            <button onClick={() => removeMaterial(row._id, m.id)} className="p-0.5 text-slate-300 hover:text-red-500">
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Autocomplete add */}
                                    <AddCabinetMaterialRow matOptions={matOptions} onAdd={mat => addMaterial(row._id, mat)} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Kliknij strzałkę przy punkcie, aby rozwinąć panel materiałów. Zapisz konfigurację przyciskiem powyżej.
                </p>
              </motion.div>
            )}

            {/* ══ TAB: Layout ══ */}
            {tab === "layout" && (
              <motion.div key="layout" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Przypisz numery złączek w szafie do punktów instalacyjnych.</p>
                  <button
                    onClick={handleGenerateZakupy}
                    disabled={exporting || !onExportToZakupy}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 transition-all"
                  >
                    {exporting
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    Generuj zakupy złączek
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide border-b border-slate-200">
                          <th className="text-left px-3 py-1.5">Tag</th>
                          <th className="text-left px-3 py-1.5">Kondygnacja</th>
                          <th className="text-left px-3 py-1.5">Pomieszczenie</th>
                          <th className="text-left px-3 py-1.5">El. sterujący</th>
                          <th className="text-left px-3 py-1.5 w-36">Złączka (nr/typ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectiveRows.map(row => {
                          const pt = getPoint(row._id);
                          return (
                            <tr key={row._id} className="border-b border-slate-100 hover:bg-slate-50/60">
                              <td className="px-3 py-1 font-mono text-xs text-slate-600">{row.tag}</td>
                              <td className="px-3 py-1 text-xs text-slate-600">{row.kondygnacja}</td>
                              <td className="px-3 py-1 text-xs text-slate-600">{row.pomieszczenie}</td>
                              <td className="px-3 py-1 text-xs text-slate-500">{deviceLabel(row.controlDevice)}</td>
                              <td className="px-3 py-1">
                                <input
                                  value={pt.terminal ?? ""}
                                  onChange={e => updatePoint(row._id, { terminal: e.target.value })}
                                  placeholder="np. 5"
                                  className="w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  &ldquo;Generuj zakupy złączek&rdquo; liczy ile złączek każdego typu jest potrzebnych i dodaje je do Zakupów.
                </p>
              </motion.div>
            )}

            {/* ══ TAB: Obwody ══ */}
            {tab === "obwody" && (
              <motion.div key="obwody" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoGenerateCircuits}
                      disabled={effectiveRows.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-40"
                    >
                      <Zap className="w-3.5 h-3.5" /> Auto-generuj z projektu
                    </button>
                    <button
                      onClick={addCircuit}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:border-slate-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Dodaj obwód
                    </button>
                  </div>
                  {warnings.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {warnings.length} obwód{warnings.length > 1 ? "y" : ""} ze spadkiem napięcia &gt;3%
                    </div>
                  )}
                </div>

                {/* Tabela obwodów */}
                {circuits.length === 0 ? (
                  <div className="text-center py-8 text-slate-300 text-sm border border-dashed border-slate-200 rounded-xl">
                    Brak obwodów — kliknij &ldquo;Auto-generuj z projektu&rdquo; lub &ldquo;Dodaj obwód&rdquo;
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Nazwa obwodu</th>
                            <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide w-36">Typ</th>
                            <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide w-28">Fazy</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide w-28">Moc (W)</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide w-24">Kabel (m)</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-orange-500 uppercase tracking-wide w-20">I (A)</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-orange-500 uppercase tracking-wide w-24">Przekrój</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-orange-500 uppercase tracking-wide w-24">Bezp.</th>
                            <th className="text-right px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wide w-20">ΔU%</th>
                            <th className="w-8 px-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {calcResults.map((c, idx) => {
                            const voltWarn = c.voltDrop != null && c.voltDrop > 3;
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/60">
                                <td className="px-3 py-1.5">
                                  <input
                                    value={c.name}
                                    onChange={e => updateCircuit(c.id, "name", e.target.value)}
                                    placeholder={`Obwód ${idx + 1}`}
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                  />
                                </td>
                                <td className="px-3 py-1.5">
                                  <select value={c.type} onChange={e => updateCircuit(c.id, "type", e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none bg-white focus:ring-2 focus:ring-orange-500/20">
                                    {CIRCUIT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                  </select>
                                </td>
                                <td className="px-3 py-1.5">
                                  <select value={c.phases} onChange={e => updateCircuit(c.id, "phases", parseInt(e.target.value))}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none bg-white focus:ring-2 focus:ring-orange-500/20">
                                    <option value={1}>1-fazowy</option>
                                    <option value={3}>3-fazowy</option>
                                  </select>
                                </td>
                                <td className="px-3 py-1.5">
                                  <input type="number" min="0" step="50" value={c.power}
                                    onChange={e => updateCircuit(c.id, "power", e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500/20"
                                  />
                                </td>
                                <td className="px-3 py-1.5">
                                  <input type="number" min="0" step="1" value={c.cableLength}
                                    onChange={e => updateCircuit(c.id, "cableLength", e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-orange-500/20"
                                  />
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  <span className="font-semibold text-orange-600 tabular-nums">{c.I.toFixed(1)}</span>
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  <span className="font-semibold text-slate-700 tabular-nums">{c.cableSize} mm²</span>
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    c.breakerType === "C" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {c.breakerType}{c.breakerA}A
                                  </span>
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  {c.voltDrop != null ? (
                                    <span className={`text-xs font-semibold tabular-nums ${voltWarn ? "text-red-500" : "text-slate-400"}`}>
                                      {voltWarn && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                                      {c.voltDrop.toFixed(1)}%
                                    </span>
                                  ) : <span className="text-slate-300 text-xs">—</span>}
                                </td>
                                <td className="px-2 py-1.5">
                                  <button onClick={() => removeCircuit(c.id)} disabled={circuits.length <= 1}
                                    className="p-1 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Loxone I/O */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-orange-500" /> Moduły Loxone — I/O
                    </h3>
                    <button
                      onClick={handleAutoCalcIO}
                      disabled={effectiveRows.length === 0}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-40"
                    >
                      <Cpu className="w-3 h-3" /> Oblicz z projektu
                    </button>
                  </div>
                  {loxoneIO === null ? (
                    <div className="px-5 py-8 text-center text-slate-300 text-sm">
                      Kliknij &ldquo;Oblicz z projektu&rdquo; lub wpisz wartości ręcznie
                      <button onClick={() => setLoxoneIO({ miniservers: 1, needRO: 0, needDIM: 0, needDI: 0, needAI: 0, needTemp: 0 })}
                        className="block mx-auto mt-2 text-xs text-orange-500 hover:underline">
                        Wpisz ręcznie
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                      {/* Edytowalne I/O */}
                      <div className="p-5 space-y-3">
                        {[
                          { key: "miniservers", label: "Liczba Miniservery", min: 1 },
                          { key: "needRO",  label: "Wyjścia przekaźnikowe (RO)" },
                          { key: "needDIM", label: "Wyjścia ściemniające" },
                          { key: "needDI",  label: "Wejścia cyfrowe (DI)" },
                          { key: "needAI",  label: "Wejścia analogowe (AI)" },
                          { key: "needTemp",label: "Czujniki temp. 1-Wire" },
                        ].map(({ key, label, min = 0 }) => (
                          <div key={key} className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">{label}</label>
                            <input
                              type="number" min={min} step="1" value={loxoneIO[key] ?? 0}
                              onChange={e => setIO(key, e.target.value)}
                              className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
                            />
                          </div>
                        ))}
                      </div>
                      {/* Dobrane moduły */}
                      <div className="p-5">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Dobrane moduły
                        </div>
                        {loxoneModules.length === 0 ? (
                          <p className="text-xs text-slate-300 text-center py-4">—</p>
                        ) : (
                          <div className="space-y-2">
                            {loxoneModules.map((m, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold flex items-center justify-center shrink-0">{m.qty}</span>
                                  <span className="text-xs text-slate-700">{m.name}</span>
                                </div>
                                <span className="text-xs font-semibold text-orange-600 tabular-nums">
                                  {((m.price ?? 0) * m.qty).toLocaleString("pl-PL")} zł
                                </span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold">
                              <span className="text-slate-500">Loxone razem</span>
                              <span className="text-orange-600">
                                {loxoneModules.reduce((s, m) => s + (m.price ?? 0) * m.qty, 0).toLocaleString("pl-PL")} zł
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOM + eksport */}
                {bom.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-500" /> BOM szafy ({bom.length} pozycji)
                      </h3>
                      <button
                        onClick={handleExportBOM}
                        disabled={exporting || !onExportToZakupy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:shadow transition-all"
                      >
                        {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Eksportuj do Zakupów
                      </button>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Nazwa</th>
                          <th className="text-right px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide w-16">Ilość</th>
                          <th className="text-right px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide w-28">Cena est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bom.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-1.5 text-sm text-slate-800">{item.name}</td>
                            <td className="px-3 py-1.5 text-right font-semibold text-slate-700 tabular-nums">{item.quantity}</td>
                            <td className="px-4 py-1.5 text-right text-xs text-slate-500 tabular-nums">
                              {item.priceEst > 0 ? (item.priceEst * item.quantity).toLocaleString("pl-PL") + " zł" : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={2} className="px-4 py-2.5 text-sm font-bold text-slate-600">Łącznie (szacunkowo)</td>
                          <td className="px-4 py-2.5 text-right text-base font-bold text-orange-600 tabular-nums">
                            {totalBomPrice.toLocaleString("pl-PL")} zł
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Legenda */}
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Dobór wg PN-IEC 60364. I = P / (230V × cosφ). Przekrój metoda B2. Wyłącznik B: światło/gniazdka, C: silniki/AC/EV. ΔU ≤3% zalecane.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Empty state */}
      {rows.length === 0 && !loadError && (
        <div className="text-center py-10 text-slate-300 text-sm">
          {selectedProjectId ? "Kliknij \u201eWczytaj dane\u201c aby za\u0142adowa\u0107 projekt" : "Wybierz projekt aby rozpocz\u0105\u0107"}
        </div>
      )}

    </div>
  );
}
